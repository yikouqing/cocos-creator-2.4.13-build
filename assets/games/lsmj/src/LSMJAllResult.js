const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ApiHall = require('../../../src/api/ApiHall');
const ConfigModel = require('../../../src/model/ConfigModel');
const MessageCallback = require('../../../src/utils/MessageCallback');
const LSMJModel = require('./LSMJModel');
const Utils = require('../../../src/utils/Utils');
const UserModel = require('../../../src/model/UserModel');

cc.Class({
	extends: cc.Component,
	properties: {
		content: cc.Node,
		txt_date: cc.Label,
		txt_roomId: cc.Label,
		btn_again: cc.Node,
		btn_share: cc.Node,
		btn_copyTxt: cc.Node,
		item: cc.Node,
		_data: null,
	},

	onLoad() {
		this.item.active = false
		MessageCallback.addListener('RoomMessagePush', this);
		let data = this.node.nodeParams;
		this._data = data
		let myChairID = LSMJModel.getMyChairID()
		this.init(data);
		if (!!this.node.nodeParams.isUnionCreate) {
			this.btn_again.active = !!ConfigModel.getData('canCreateUnionRoomAgain');
		} else {
			this.btn_again.active = !!ConfigModel.getData('canCreateHallRoomAgain');
		}
		this.btn_share.active = !!ConfigModel.getData('gameResultWechatShare');
		LSMJModel.resetAll()
	},

	init(data) {
		this.txt_date.string = this.node.nodeParams.date;
		this.txt_roomId.string = `房号:${this.node.nodeParams.roomID}`;
		let userArray = data.result || [];
		for (let i = 0; i < userArray.length; ++i) {
			let user = userArray[i];
			let item = cc.instantiate(this.item);
			item.x = 0
			item.parent = this.content
			item.active = true;
			cc.find('name', item).getComponent(cc.Label).string = CCUtil.stringClamp(user.nickname, 5, '..');
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
			let gangNun = (user.anGangCount || 0) + (user.mingGangCount || 0);
			cc.find('lay/zimo/txt_zimo', item).getComponent(cc.Label).string = `${user.zhiMoCount || 0}次`;//自摸次数
			cc.find('lay/dianpao/txt_dianpao', item).getComponent(cc.Label).string = `${user.dianPaoCount || 0}次`;//点炮次数
			cc.find('lay/jiepao/txt_jiepao', item).getComponent(cc.Label).string = `${user.jiePaoCount || 0}次`;//接炮次数
			cc.find('lay/gang/txt_gang', item).getComponent(cc.Label).string = `${gangNun}次`;//杠次数
			cc.find('lay/sanji/txt_sanji', item).getComponent(cc.Label).string = `${user.sanJiCount || 0}次`;//三鸡次数
			cc.find('lay/siji/txt_siji', item).getComponent(cc.Label).string = `${user.siJiCount || 0}次`;//三鸡次数
			cc.find('lay/baoji/txt_baoji', item).getComponent(cc.Label).string = `${user.baoJiCount || 0}次`;//查大叫 
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
				// 	gameRuleID: LSMJModel.getGameRuleByKey('_id'),
				// 	unionID: LSMJModel.getRoomCreatorByKey('unionID'),
				// });
				ApiHall.createUnionRoomAgainRequest({
					unionID: LSMJModel.getRoomCreatorByKey('unionID'),
					roomID: LSMJModel.getRoomID(),
					gameRule: LSMJModel.getGameRule(),
					gameRuleID: LSMJModel.getGameRuleByKey('_id')
				});
			} else {
				ApiHall.createRoomRequest({
					gameRule: null,
					gameRuleID: LSMJModel.getGameRuleByKey('_id'),
					unionID: LSMJModel.getRoomCreatorByKey('unionID'),
					roomID: LSMJModel.getRoomID()
				});
			}
			MessageCallback.emitMessage('OnGameOnceAgain');
			this.btn_again.active = false;
		} else if (param == "copyTxt") { //复制文字战绩
			if (!this._data) return;
			let result = this._data.result
			if (!result || result.length == 0) return;
			let str = `${ConfigModel.getGameName(LSMJModel.getGameType())}-房间号:${this.txt_roomId.string}\n`;
			for (let i = 0; i < result.length; i++) {
				const info = result[i];
				if (!info) continue;
				let winList = info.winList || [];
				let winScore = 0;
				winList.map((score) => {
					winScore += score;
				});
				str += `${info.uid}-${Utils.getNickName(info.nickname)}: ${winScore}\n`
			}
			str += `${this.txt_date.string}`;
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