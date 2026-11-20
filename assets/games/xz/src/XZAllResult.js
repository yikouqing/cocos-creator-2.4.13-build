const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ApiHall = require('../../../src/api/ApiHall');
const ConfigModel = require('../../../src/model/ConfigModel');
const MessageCallback = require('../../../src/utils/MessageCallback');
const XZModel = require('./XZModel');
const Utils = require('../../../src/utils/Utils');
const UserModel = require('../../../src/model/UserModel');

cc.Class({
	extends: cc.Component,
	properties: {
		content: cc.Node,
		btnContinue: cc.Node,
		btnResultShare: cc.Node,
	},

	onLoad() {
		MessageCallback.addListener('RoomMessagePush', this);
		let data = this.node.nodeParams;
		let myChairID = XZModel.getMyChairID()
		this.init(data.userArray, data.creator);
		if (!!this.node.nodeParams.isUnionCreate) {
			this.btnContinue.active = !!ConfigModel.getData('canCreateUnionRoomAgain');
		} else {
			this.btnContinue.active = !!ConfigModel.getData('canCreateHallRoomAgain');
		}
		this.btnResultShare.active = !!ConfigModel.getData('gameResultWechatShare');
		XZModel.resetAll()
	},

	init(userArray, creator) {
		let winMostArray = [0];
		let loseMostArray = [0];
		for (let i = 1; i < userArray.length; ++i) {
			if (userArray[i].winScore > userArray[winMostArray[0]].winScore) {
				winMostArray = [i];
			} else if (userArray[i].winScore == userArray[winMostArray[0]].winScore) {
				winMostArray.push(i);
			}
			if (userArray[i].winScore < userArray[loseMostArray[0]].winScore) {
				loseMostArray = [i];
			} else if (userArray[i].winScore == userArray[loseMostArray[0]].winScore) {
				loseMostArray.push(i);
			}
		}
		if (winMostArray.length == userArray.length) {
			winMostArray = [];
		}
		if (loseMostArray.length == userArray.length) {
			loseMostArray = [];
		}

		for (let i = 0; i < userArray.length; ++i) {
			let data = userArray[i];
			let item = cc.instantiate(cc.find('Item', this.node));
			item.x = 0
			item.parent = this.content
			item.active = true;
			cc.find('name', item).getComponent(cc.Label).string = CCUtil.stringClamp(data.nickname, 6, '..');
			// cc.find('uid', item).getComponent(cc.Label).string = "ID:" + (data.uid != UserModel.getData("uid") ? Utils.stringSecurity(data.uid) : data.uid);
			cc.find('uid', item).getComponent(cc.Label).string = "ID:" + data.uid;
			let head = cc.find('head', item);
			cc.find('winmost', item).active = false;
			cc.find('losemost', item).active = false;
			if (data.winScore >= 0) {
				cc.find('win', item).getComponent(cc.Label).string = '+' + Utils.formatNumberWithDecimal(data.winScore, 1);
				cc.find('lose', item).active = false;
				if (winMostArray.indexOf(i) != -1 && loseMostArray.indexOf(i) == -1) {
					cc.find('winmost', item).active = true;
				}
			} else {
				cc.find('lose', item).getComponent(cc.Label).string = Utils.formatNumberWithDecimal(data.winScore, 1);
				cc.find('win', item).active = false;
				if (loseMostArray.indexOf(i) != -1 && winMostArray.indexOf(i) == -1) {
					cc.find('losemost', item).active = true;
				}
			}
			AssetsManager.loadSpriteFrame({
				path: data.avatar,
				sprite: head.getComponent(cc.Sprite)
			});
			cc.find('hulabel', item).getComponent(cc.Label).string = data.huCount;
			cc.find('gongganglabel', item).getComponent(cc.Label).string = data.gongGangCount;
			cc.find('anganglabel', item).getComponent(cc.Label).string = data.anGangCount;
		}
	},

	onButtonClick(event, param) {

		if (param == 'back') {
			this.node.nodeParams.enterHall();
		} else if (param == 'share') {
			let imgPath = CCUtil.capScreen(this.node);
			NativeUtil.wxShareImg(0, imgPath);
		} else if (param == 'continue') {
			if (CCUtil.clickInterval(event.target, 1.5, true)) return;
			if (!!this.node.nodeParams.isUnionCreate) {
				// ApiHall.quickJoinRequest({
				// 	gameRuleID: XZModel.getGameRuleByKey('_id'),
				// 	unionID: XZModel.getRoomCreatorByKey('unionID'),
				// });
				ApiHall.createUnionRoomAgainRequest({
					unionID: XZModel.getRoomCreatorByKey('unionID'),
					roomID: XZModel.getRoomID(),
					gameRule: XZModel.getGameRule(),
					gameRuleID: XZModel.getGameRuleByKey('_id')
				});
			} else {
				ApiHall.createRoomRequest({
					gameRule: null,
					gameRuleID: XZModel.getGameRuleByKey('_id'),
					unionID: XZModel.getRoomCreatorByKey('unionID'),
					roomID: XZModel.getRoomID()
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