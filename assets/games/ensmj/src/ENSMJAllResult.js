const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ApiHall = require('../../../src/api/ApiHall');
const ConfigModel = require('../../../src/model/ConfigModel');
const MessageCallback = require('../../../src/utils/MessageCallback');
const ENSMJModel = require('./ENSMJModel');
const Utils = require('../../../src/utils/Utils');
const UserModel = require('../../../src/model/UserModel');

cc.Class({
	extends: cc.Component,
	properties: {
		content: cc.Node,
		btnContinue: cc.Node,
		btnResultShare: cc.Node,
		userItem: cc.Node,
	},

	onLoad() {
		MessageCallback.addListener('RoomMessagePush', this);
		let data = this.node.nodeParams;
		let myChairID = ENSMJModel.getMyChairID()
		this.init(data);
		if (!!this.node.nodeParams.isUnionCreate) {
			this.btnContinue.active = !!ConfigModel.getData('canCreateUnionRoomAgain');
		} else {
			this.btnContinue.active = !!ConfigModel.getData('canCreateHallRoomAgain');
		}
		this.btnResultShare.active = !!ConfigModel.getData('gameResultWechatShare');
		ENSMJModel.resetAll();
	},

	init(data) {
		this.userItem.active = false;
		let userArray = data.result || [];
		let allScore = 0;
		var maxScore = 0;//最大总分
		var minScore = 0;//最小总分
		let winUID = -1;//大赢家ID
		let loseUID = -1;//大土豪ID
		userArray.forEach((user) => {
			allScore = user.score || 0;
			if (allScore > maxScore) {//大赢家
				maxScore = allScore;
				winUID = user.uid;
			}
			if (allScore < minScore) {//土豪
				minScore = allScore;
				loseUID = user.uid;
			}
		})
		userArray.forEach((user) => {
			let item = cc.instantiate(this.userItem);
			item.parent = this.content;
			item.setPosition(0, 0);
			item.active = true;
			let curScore = user.score || 0;
			let userHuPaiHistory = user.userHuPaiHistory || null;
			cc.find('uid', item).getComponent(cc.Label).string = "ID:" + user.uid;
			cc.find('name', item).getComponent(cc.Label).string = CCUtil.stringClamp(user.nickname, 6, '..');
			AssetsManager.loadSpriteFrame({ path: user.avatar, sprite: cc.find('head', item).getComponent(cc.Sprite) });
			cc.find('win', item).active = curScore > 0;
			cc.find('lose', item).active = curScore <= 0;
			cc.find('winmost', item).active = winUID == user.uid;
			cc.find('losemost', item).active = loseUID == user.uid;
			cc.find('lose', item).getComponent(cc.Label).string = parseInt(curScore);
			cc.find('win', item).getComponent(cc.Label).string = '+' + parseInt(curScore);
			cc.find('txt_zimo', item).getComponent(cc.Label).string = `自摸${userHuPaiHistory.hu_zhi || 0}次`;
			cc.find('txt_dianpao', item).getComponent(cc.Label).string = `点炮${userHuPaiHistory.hu_chi || 0}次`;
			cc.find('txt_hupai', item).getComponent(cc.Label).string = `胡牌${(userHuPaiHistory.hu_zhi || 0) + (userHuPaiHistory.hu_chi || 0)}次`;
		})
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
				// 	gameRuleID: XCMJModel.getGameRuleByKey('_id'),
				// 	unionID: XCMJModel.getRoomCreatorByKey('unionID'),
				// });
				ApiHall.createUnionRoomAgainRequest({
					unionID: ENSMJModel.getRoomCreatorByKey('unionID'),
					roomID: ENSMJModel.getRoomID(),
					gameRule: ENSMJModel.getGameRule(),
					gameRuleID: ENSMJModel.getGameRuleByKey('_id')
				});
			} else {
				ApiHall.createRoomRequest({
					gameRule: null,
					gameRuleID: ENSMJModel.getGameRuleByKey('_id'),
					unionID: ENSMJModel.getRoomCreatorByKey('unionID'),
					roomID: ENSMJModel.getRoomID()
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