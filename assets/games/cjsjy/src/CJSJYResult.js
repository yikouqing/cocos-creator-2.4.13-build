const ApiRoom = require('../../../src/api/ApiRoom');
const CJSJYModel = require('./CJSJYModel');
const Enums = require('../../../src/const/Enums');
const CCUtil = require('../../../src/utils/CCUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const NativeUtil = require('../../../src/utils/NativeUtil');
const UserModel = require('../../../src/model/UserModel');
const ApiHall = require('../../../src/api/ApiHall');
const ConfigModel = require('../../../src/model/ConfigModel');
const MessageCallback = require('../../../src/utils/MessageCallback');
const Utils = require('../../../src/utils/Utils');

cc.Class({
	extends: cc.Component,
	properties: {
		itemNode: cc.Node,
		content: cc.Node,
		btnContinue: cc.Node,
		btnResultShare: cc.Node,
	},

	onLoad() {
		MessageCallback.addListener('RoomMessagePush', this);
		this.winer = null;
		this.loser = null;
		let data = this.node.nodeParams;
		this.init(data.result, data.winMost, data.loseMost, data.creater);
		if (!!CJSJYModel.isUnionCreate()) {
			this.btnContinue.active = !!ConfigModel.getData('canCreateUnionRoomAgain');
		} else {
			//自由场
			this.btnContinue.active = !!ConfigModel.getData('canCreateHallRoomAgain');
		}
		this.btnResultShare.active = !!ConfigModel.getData('gameResultWechatShare');
		if (data.hongBaoList && data.hongBaoList[CJSJYModel.getMyChairID()] >= 0) {
			AssetsManager.createDialog({
				path: 'prefab/inter/GameHongBaoDialog',
				score: data.hongBaoList[CJSJYModel.getMyChairID()],
				hongBaoList: data.hongBaoList,
			});
		}
	},

	init(data, winMost, loseMost, creater) {
		for (let item of data) {
			let node = cc.instantiate(this.itemNode);
			let name = cc.find('name', node);
			let id = cc.find('id', node);
			let head = cc.find('head', node);
			name.getComponent(cc.Label).string = CCUtil.stringClamp(item.nickname, 5, "..");
			// id.getComponent(cc.Label).string = 'ID:' + (item.uid != UserModel.getData("uid") ? Utils.stringSecurity(item.uid) : item.uid);
			id.getComponent(cc.Label).string = 'ID:' + item.uid;
			if (item.score > 0) {
				let label = cc.find('win', node);
				label.getComponent(cc.Label).string = '+' + parseInt(item.score);
				cc.find('lose', node).active = false;
			} else {
				let label = cc.find('lose', node);
				label.getComponent(cc.Label).string = parseInt(item.score);
				cc.find('win', node).active = false;
			}
			AssetsManager.loadSpriteFrame({
				path: item.avatar,
				sprite: head.getComponent(cc.Sprite)
			});
			cc.find('fangzhu', node).active = !!creater && item.uid == creater.uid;
			if (winMost == loseMost) {
				cc.find('winmost', node).active = false;
				cc.find('losemost', node).active = false;
			} else {
				cc.find('winmost', node).active = (item.uid == winMost);
				cc.find('losemost', node).active = (item.uid == loseMost);
				if (item.uid == winMost) {
					this.winer = item.nickname;
				} else if (item.uid == loseMost) {
					this.loser = item.nickname;
				}
			}
			node.parent = this.content;
			node.active = true;
		}
	},

	onButtonClick(event, param) {
		if (param == 'back') {
			this.node.nodeParams.enterHall();
		} else if (param == 'share') {
			let imgPath = CCUtil.capScreen(this.node);
			let string = "大赢家:" + this.winer + " 土豪:" + this.loser;
			NativeUtil.wxShareImg(0, imgPath, string);
		} else if (param == 'continue') {
			if (CCUtil.clickInterval(event.target, 1.5, true)) return;
			if (CJSJYModel.isUnionCreate()) {
				// ApiHall.quickJoinRequest({
				// 	gameRuleID: CJSJYModel.getGameRuleByKey('_id'),
				// 	unionID: CJSJYModel.getRoomCreatorByKey('unionID'),
				// });
				ApiHall.createUnionRoomAgainRequest({
					unionID: CJSJYModel.getRoomCreatorByKey('unionID'),
					roomID: CJSJYModel.getRoomID(),
					gameRule: CJSJYModel.getGameRule(),
					gameRuleID: CJSJYModel.getGameRuleByKey('_id')
				});
			} else {
				ApiHall.createRoomRequest({
					gameRule: null,
					gameRuleID: CJSJYModel.getGameRuleByKey('_id'),
					unionID: CJSJYModel.getRoomCreatorByKey('unionID'),
					roomID: CJSJYModel.getRoomID()
				});
			}
			MessageCallback.emitMessage('OnGameOnceAgain');
			this.btnContinue.active = false;
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