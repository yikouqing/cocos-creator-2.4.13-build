const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ApiHall = require('../../../src/api/ApiHall');
const ConfigModel = require('../../../src/model/ConfigModel');
const MessageCallback = require('../../../src/utils/MessageCallback');
const YDRModel = require('./YDRModel');
const Utils = require('../../../src/utils/Utils');
const UserModel = require('../../../src/model/UserModel');

cc.Class({
	extends: cc.Component,
	properties: {
		content: cc.Node,
		btn_again: cc.Node,
		btnResultShare: cc.Node,
		txt_roomInfo: cc.Label,
	},

	onLoad() {
		MessageCallback.addListener('RoomMessagePush', this);
		let data = this.node.nodeParams;
		let myChairID = YDRModel.getMyChairID()
		this.init(data);
		if (!!this.node.nodeParams.isUnionCreate) {
			this.btn_again.active = !!ConfigModel.getData('canCreateUnionRoomAgain');
		} else {
			this.btn_again.active = !!ConfigModel.getData('canCreateHallRoomAgain');
		}
		YDRModel.resetAll()
		this.btnResultShare.active = !!ConfigModel.getData('gameResultWechatShare');
	},

	init(data) {
		let userArray = data.result || [];
		for (let i = 0; i < userArray.length; ++i) {
			let user = userArray[i];
			let item = cc.instantiate(cc.find('Item', this.node));
			item.x = 0
			item.parent = this.content
			item.active = true;
			cc.find('name', item).getComponent(cc.Label).string = CCUtil.stringClamp(user.nickname, 15, '..');
			cc.find('uid', item).getComponent(cc.Label).string = "ID:" + (user.uid != UserModel.getData("uid") ? Utils.stringSecurity(user.uid) : user.uid);
			let head = cc.find('head', item);
			let winList = user.winList || [];
			let winScore = 0;
			winList.map((score) => {
				winScore += score;
			});
			cc.find('win', item).active = winScore > 0;
			cc.find('lose', item).active = winScore <= 0;
			if (winScore > 0) {
				cc.find('win', item).getComponent(cc.Label).string = '+' + parseInt(winScore);
			} else {
				cc.find('lose', item).getComponent(cc.Label).string = parseInt(winScore);
			}
			cc.find('winmost', item).active = data.winMost == user.uid;
			cc.find('losemost', item).active = data.loseMost == user.uid;
			AssetsManager.loadSpriteFrame({
				path: user.avatar,
				sprite: head.getComponent(cc.Sprite)
			});
			// cc.find('txt_zimo', item).getComponent(cc.Label).string = `自摸${user.zhiMoCount || 0}次`;
			// cc.find('txt_jiepao', item).getComponent(cc.Label).string = `接炮${user.jiePaoCount || 0}次`;
			// cc.find('txt_dianpao', item).getComponent(cc.Label).string = `点炮${user.dianPaoCount || 0}次`;
			// cc.find('txt_minggang', item).getComponent(cc.Label).string = `明杠${user.mingGangCount || 0}次`;
			// cc.find('txt_angang', item).getComponent(cc.Label).string = `暗杠${user.anGangCount || 0}次`;
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
				// 	gameRuleID: YDRModel.getGameRuleByKey('_id'),
				// 	unionID: YDRModel.getRoomCreatorByKey('unionID'),
				// });
				ApiHall.createUnionRoomAgainRequest({
					unionID: YDRModel.getRoomCreatorByKey('unionID'),
					roomID: YDRModel.getRoomID(),
					gameRule: YDRModel.getGameRule(),
					gameRuleID: YDRModel.getGameRuleByKey('_id')
				});
			} else {
				ApiHall.createRoomRequest({
					gameRule: null,
					gameRuleID: YDRModel.getGameRuleByKey('_id'),
					unionID: YDRModel.getRoomCreatorByKey('unionID'),
					roomID: YDRModel.getRoomID()
				});
			}
			MessageCallback.emitMessage('OnGameOnceAgain');
			this.btn_again.active = false;
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