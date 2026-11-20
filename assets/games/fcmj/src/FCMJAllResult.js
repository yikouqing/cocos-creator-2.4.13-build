const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ApiHall = require('../../../src/api/ApiHall');
const ConfigModel = require('../../../src/model/ConfigModel');
const MessageCallback = require('../../../src/utils/MessageCallback');
const FCMJModel = require('./FCMJModel');
const Utils = require('../../../src/utils/Utils');
const UserModel = require('../../../src/model/UserModel');

cc.Class({
	extends: cc.Component,
	properties: {
		content: cc.Node,
		dateLbl: cc.Label,
		roomIdLbl: cc.Label,
		btnContinue: cc.Node,
		btnResultShare: cc.Node,
	},

	onLoad() {
		MessageCallback.addListener('RoomMessagePush', this);
		let data = this.node.nodeParams;
		let myChairID = FCMJModel.getMyChairID()
		this.init(data);
		if (!!this.node.nodeParams.isUnionCreate) {
			this.btnContinue.active = !!ConfigModel.getData('canCreateUnionRoomAgain');
		} else {
			this.btnContinue.active = !!ConfigModel.getData('canCreateHallRoomAgain');
		}
		this.btnResultShare.active = !!ConfigModel.getData('gameResultWechatShare');
		FCMJModel.resetAll()
	},

	init(data) {
		this._data = data;
		this.dateLbl.string = this.node.nodeParams.date;
		this.roomIdLbl.string = `房号:${this.node.nodeParams.roomID}`;
		let userArray = data.result || [];
		for (let i = 0; i < userArray.length; ++i) {
			let user = userArray[i];
			let item = cc.instantiate(cc.find('Item', this.node));
			item.x = 0
			item.parent = this.content
			item.active = true;
			cc.find('name', item).getComponent(cc.Label).string = CCUtil.stringClamp(user.nickname, 6, '..');
			// cc.find('uid', item).getComponent(cc.Label).string = "ID:" + (user.uid != UserModel.getData("uid") ? Utils.stringSecurity(user.uid) : user.uid);
			cc.find('uid', item).getComponent(cc.Label).string = "ID:" + user.uid;
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
			cc.find('lay/zimo/txt_zimo', item).getComponent(cc.Label).string = `${user.zhiMoCount || 0}次`;
			cc.find('lay/minggang/txt_minggang', item).getComponent(cc.Label).string = `${user.mingGangCount || 0}次`;
			cc.find('lay/angang/txt_angang', item).getComponent(cc.Label).string = `${user.anGangCount || 0}次`;
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
				// 	gameRuleID: FCMJModel.getGameRuleByKey('_id'),
				// 	unionID: FCMJModel.getRoomCreatorByKey('unionID'),
				// });
				ApiHall.createUnionRoomAgainRequest({
					unionID: FCMJModel.getRoomCreatorByKey('unionID'),
					roomID: FCMJModel.getRoomID(),
					gameRule: FCMJModel.getGameRule(),
					gameRuleID: FCMJModel.getGameRuleByKey('_id')
				});
			} else {
				ApiHall.createRoomRequest({
					gameRule: null,
					gameRuleID: FCMJModel.getGameRuleByKey('_id'),
					unionID: FCMJModel.getRoomCreatorByKey('unionID'),
					roomID: FCMJModel.getRoomID()
				});
			}
			MessageCallback.emitMessage('OnGameOnceAgain');
			this.btnContinue.active = false;
		} else if (param == "copyTxt") { //复制文字战绩
			if (!this._data) return;
			let str = this._data.date;
			let result = this._data.result || [];
			str += "\n" + ConfigModel.getRoomShare(Enums.bundleType.FCMJ, this._data.roomID);
			str += "\n" + "房间规则:";
			str += "\n" + FCMJModel.getTerseRule(FCMJModel.getGameRule(), ",");
			str += "\n" + "输赢统计:\n";
			for (let i = 0; i < result.length; i++) {
				const info = result[i];
				if (!info) continue;
				let winList = info.winList || [];
				let winScore = 0;
				winList.map((score) => {
					winScore += score;
				});
				let scoreStr = winScore > 0 ? "+" + winScore : winScore;
				str += `ID:${info.uid}、昵称:${Utils.getNickName(info.nickname)}、分数:${scoreStr}\n`;
			}
			NativeUtil.copyText(str);
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