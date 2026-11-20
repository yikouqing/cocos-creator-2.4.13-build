const ApiRoom = require('../../api/ApiRoom');
let MessageCallback = require('../../utils/MessageCallback');
const AssetsManager = require('../../utils/AssetsManager');
const CCUtil = require('../../utils/CCUtil');
const Enums = require('../../const/Enums');
const UserModel = require('../../model/UserModel');

cc.Class({
	extends: cc.Component,
	properties: {
		playerItem: cc.Node,
		listNode: cc.Node,
		btnRefuse: cc.Node,
		btnAgree: cc.Node,
		timeLbl: cc.Label,
		askPlayerHead: cc.Sprite,
		askPlayerNick: cc.Label,
	},

	onLoad() {
		MessageCallback.addListener('RoomMessagePush', this);
		this.refrush(this.node.nodeParams);
	},

	refrush(data) {
		this.unscheduleAllCallbacks();
		// console.log('数据-解散', data);
		this.tick = data.tick;
		let users = data.userList || [];
		this.listNode.destroyAllChildren();
		for (const user of users) {
			if (!!user.isAsker) {
				this.askPlayerNick.string = user.nickname;
				AssetsManager.loadSpriteFrame({
					path: user.avatar,
					sprite: this.askPlayerHead
				});
				if (user.uid == UserModel.getData('uid')) {
					this.btnAgree.active = false;
					this.btnRefuse.active = false;
				}
			} else {
				let node = cc.instantiate(this.playerItem);
				node.parent = this.listNode;
				node.active = true;
				cc.find('name', node).getComponent(cc.Label).string = user.nickname || '';
				if (user.isExit == null) {
					cc.find('state', node).getComponent(cc.Label).string = '';
					cc.find('state', node).getComponent(cc.Label).string = '未选择';
					if (user.uid == UserModel.getData('uid')) {
						this.btnAgree.active = true;
						this.btnRefuse.active = true;
					}
				} else if (!!user.isExit) {
					cc.find('state', node).getComponent(cc.Label).string = '同意';
					if (user.uid == UserModel.getData('uid')) {
						this.btnAgree.active = false;
						this.btnRefuse.active = false;
					}
				} else {
					cc.find('state', node).getComponent(cc.Label).string = '拒绝';
					if (user.uid == UserModel.getData('uid')) {
						this.btnAgree.active = false;
						this.btnRefuse.active = false;
					}
				}
				cc.find('offline', node).active = user.userStatus == ApiRoom.userStatusEnum.OFFLINE;
				AssetsManager.loadSpriteFrame({
					path: user.avatar,
					sprite: cc.find('head', node).getComponent(cc.Sprite)
				});
			}
		}
		this.unscheduleAllCallbacks();
		this.scheduleOnce(() => {
			this.node.destroy();
		}, this.tick);
	},

	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
				// console.log('解散结果-1', msg)
				if (!msg.data.userList || msg.data.userList.length == 0) {
					this.node.destroy();
					return;
				}
				this.refrush(msg.data);
			}
		}
	},

	onButtonClick(event, param) {
		if (param == 'tongyi') {
			ApiRoom.roomMessageNotify(ApiRoom.getAskForDismissNotifyData({
				isExit: true
			}));
		} else if (param == 'jujue') {
			ApiRoom.roomMessageNotify(ApiRoom.getAskForDismissNotifyData({
				isExit: false
			}));
		}
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
	},

	update(dt) {
		this.tick -= dt;
		this.timeLbl.string = Math.floor(this.tick) + '秒';
		if (this.tick < 0) {
			this.node.destroy();
		}
	},
});