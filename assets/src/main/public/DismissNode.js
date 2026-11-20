const ApiRoom = require('../../api/ApiRoom');
const MessageCallback = require('../../utils/MessageCallback');
const AssetsManager = require('../../utils/AssetsManager');
const CCUtil = require('../../utils/CCUtil');
const Enums = require('../../const/Enums');

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
		this.tm = data.tm;
		this.listNode.destroyAllChildren();
		this.askPlayerNick.string = data.nameArr[data.askChairId];
		AssetsManager.loadSpriteFrame({
			path: data.avatarArr[data.askChairId],
			sprite: this.askPlayerHead
		});
		let hasRefused = false;
		for (let i = 0; i < data.nameArr.length; ++i) {
			if (data.nameArr[i] == null) continue;
			let node = cc.instantiate(this.playerItem);
			node.parent = this.listNode;
			node.active = true;
			node.y = 0;
			cc.find('name', node).getComponent(cc.Label).string = data.nameArr[i] || '';
			if (data.chairIDArr[i] == null) {
				cc.find('state', node).getComponent(cc.Label).string = '';
			} else if (data.chairIDArr[i] == true) {
				cc.find('state', node).getComponent(cc.Label).string = '同意';
			} else {
				cc.find('state', node).getComponent(cc.Label).string = '拒绝';
				hasRefused = true;
			}
			cc.find('online', node).active = !data.onlineArr[i];
			AssetsManager.loadSpriteFrame({
				path: data.avatarArr[i],
				sprite: cc.find('head', node).getComponent(cc.Sprite)
			});
		}
		if (data.chairIDArr[this.node.nodeParams.myChairID] != null) {
			this.btnAgree.active = false;
			this.btnRefuse.active = false;
		}
		// if (!hasRefused) return;
		// this.scheduleOnce(() => {
		// 	this.node.destroy();
		// }, 1);
	},

	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
				this.refrush(msg.data);
			} else if (msg.type === ApiRoom.ROOM_DISMISS_PUSH) {
				this.node.destroy();
			} else if (msg.type === ApiRoom.CLOSE_DISMISS_PUSH) {
				// console.log('解散结果', msg)
				this.node.destroy();
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
		this.tm -= dt;
		this.timeLbl.string = Math.floor(this.tm) + '秒';
		if (this.tm < 0) {
			this.node.destroy();
		}
	},
});