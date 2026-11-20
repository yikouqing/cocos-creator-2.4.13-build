const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ApiHall = require('../../../src/api/ApiHall');
const UserModel = require('../../../src/model/UserModel');
const ConfigModel = require('../../../src/model/ConfigModel');
const MessageCallback = require('../../../src/utils/MessageCallback');

cc.Class({
	extends: cc.Component,
	properties: {
		itemNode: cc.Node,
		content: cc.Node,
		btnContinue: cc.Node,
		btnResultShare: cc.Node,

		_data: null
	},

	onLoad() {
		this.itemNode.active = false
		MessageCallback.addListener('RoomMessagePush', this);
		let data = this.node.nodeParams;
		// console.log("总结算数据包==", data);
		this._data = data
		this.unionID = !!data ? data.unionID || null : null;
		this.gameRule = !!data ? data.gameRule || {} : {};
		this.roomID = !!data ? data.roomID || null : null;
		this.init(data.result, data.creator);
		if (!!data.isUnionCreate) {
			this.btnContinue.active = !!ConfigModel.getData('canCreateUnionRoomAgain');
		} else {
			this.btnContinue.active = !!ConfigModel.getData('canCreateHallRoomAgain');
		}
		this.btnResultShare.active = !!ConfigModel.getData('gameResultWechatShare');
	},

	init(userArray, creator) {
		for (let i = 0; i < userArray.length; ++i) {
			let data = userArray[i];
			if (!data) continue;
			let item = cc.instantiate(this.itemNode);
			item.parent = this.content;
			item.y = 0;
			item.stopAllActions();
			item.opacity = 0;
			cc.find('name', item).getComponent(cc.Label).string = CCUtil.stringClamp(data.nickname, 7, '..');
			cc.find('fangzhu', item).active = !!creator && data.uid == creator.uid;
			let head = cc.find('head', item);
			cc.find('losemost', item).active = data.uid == this._data.loseMost;
			cc.find('winmost', item).active = data.uid == this._data.winMost;
			if (data.score >= 0) {
				cc.find('win', item).getComponent(cc.Label).string = '+' + data.score;
				cc.find('lose', item).active = false;
			} else {
				cc.find('lose', item).getComponent(cc.Label).string = data.score;
				cc.find('win', item).active = false;
			}
			AssetsManager.loadSpriteFrame({
				path: data.avatar,
				sprite: head.getComponent(cc.Sprite)
			});

			item.active = true;
			cc.tween(item)
				.delay(i * 0.3)
				.to(0.3, {
					opacity: 255
				})
				.start();
		}
	},

	onButtonClick(event, param) {

		if (param == 'back') {
			this._data.enterHall()
		} else if (param == 'share') {
			let imgPath = CCUtil.capScreen(this.node);
			NativeUtil.wxShareImg(0, imgPath);
		} else if (param == 'continue') {
			if (!!this._data.isUnionCreate) {
				ApiHall.createUnionRoomAgainRequest({
					unionID: this.unionID,
					roomID: this.roomID,
					gameRule: this.gameRule,
					gameRuleID: this.gameRule['_id']
				});
			} else {
				ApiHall.createRoomRequest({
					gameRule: null,
					gameRuleID: this.gameRule['_id'],
					unionID: this.unionID,
					roomID: this.roomID
				});
			}
		}
	},

	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.node.destroy();
			}
		}
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
	},
});