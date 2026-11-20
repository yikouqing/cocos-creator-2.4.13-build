const ApiRoom = require('../../../src/api/ApiRoom');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ApiHall = require('../../../src/api/ApiHall');
const ConfigModel = require('../../../src/model/ConfigModel');
const MessageCallback = require('../../../src/utils/MessageCallback');
const BPMJModel = require('./BPMJModel');
const Utils = require('../../../src/utils/Utils');
const UserModel = require('../../../src/model/UserModel');

cc.Class({
	extends: cc.Component,
	properties: {
		content: cc.Node,
		txt_roomID: cc.Label,
		txt_time: cc.Label,
		_data: null
	},

	onLoad() {
		MessageCallback.addListener('RoomMessagePush', this);
		let btn_again = cc.find('btn_again', this.node);
		let myChairID = BPMJModel.getMyChairID();
		let data = this.node.nodeParams;
		this._data = data
		btn_again.active = false;
		this.txt_roomID.string = "房间号：" + BPMJModel.getRoomID();
		let date = Utils.getDateFormat();
		this.txt_time.string = date.yyyymmddhhmmss
		BPMJModel.resetAll();
		this.init(data);
		if (!!this.node.nodeParams.isUnionCreate) {
			btn_again.active = !!ConfigModel.getData('canCreateUnionRoomAgain');
		} else {
			btn_again.active = !!ConfigModel.getData('canCreateHallRoomAgain');;
		}
	},

	init(data) {
		let userItem = cc.find('userItem', this.node);
		this.content.removeAllChildren();
		if (!data || !userItem) return;
		let userArray = data.result || [];
		userItem.active = false;
		for (let i = 0; i < userArray.length; ++i) {
			let userNode = cc.instantiate(userItem);
			userNode.parent = this.content;
			userNode.setPosition(0, 0);
			userNode.active = true;
			let winScore = 0;
			let user = userArray[i];
			let winList = user.winList || [];
			winList.map((score) => {
				winScore += score;
			});
			winScore = parseInt(winScore);
			cc.find('win', userNode).active = winScore > 0;
			cc.find('lose', userNode).active = winScore <= 0;
			cc.find('winmost', userNode).active = data.winMost == user.uid;
			cc.find('losemost', userNode).active = data.loseMost == user.uid;
			cc.find('lose', userNode).getComponent(cc.Label).string = winScore;
			cc.find('win', userNode).getComponent(cc.Label).string = '+' + winScore;
			cc.find('hulabel', userNode).getComponent(cc.Label).string = user.huCount || 0;
			cc.find('piaohualabel', userNode).getComponent(cc.Label).string = user.piaohua || 0;
			cc.find('youjinlabel', userNode).getComponent(cc.Label).string = user.youJinCount || 0;
			cc.find('name', userNode).getComponent(cc.Label).string = CCUtil.stringClamp(user.nickname, 6, '..');
			AssetsManager.loadSpriteFrame({
				path: user.avatar,
				sprite: cc.find('head', userNode).getComponent(cc.Sprite)
			});
			cc.find('uid', userNode).getComponent(cc.Label).string = "ID:" + (user.uid == UserModel.getData("uid") ? user.uid : Utils.stringSecurity(user.uid));
		}
	},

	onButtonClick(event, param) {
		if (param == 'back') {
			this.node.nodeParams.enterHall();
		} else if (param == 'share') {
			let imgPath = CCUtil.capScreen(this.node);
			NativeUtil.wxShareImg(0, imgPath);
		} else if (param == 'continue') {
			if (event.target.lastClick && Date.now() - event.target.lastClick < 1500) {
				AssetsManager.tipDialog('请勿频繁操作');
				return;
			}
			event.target.lastClick = Date.now();
			if (!!this.node.nodeParams.isUnionCreate) {
				// ApiHall.quickJoinRequest({
				// 	gameRuleID: BPMJModel.getGameRuleByKey('_id'),
				// 	unionID: BPMJModel.getRoomCreatorByKey('unionID'),
				// });
				ApiHall.createUnionRoomAgainRequest({
					roomID: BPMJModel.getRoomID(),
					gameRule: BPMJModel.getGameRule(),
					gameRuleID: BPMJModel.getGameRuleByKey('_id'),
					unionID: BPMJModel.getRoomCreatorByKey('unionID'),
				});
			} else {
				ApiHall.createRoomRequest({
					gameRule: null,
					roomID: BPMJModel.getRoomID(),
					gameRuleID: BPMJModel.getGameRuleByKey('_id'),
					unionID: BPMJModel.getRoomCreatorByKey('unionID'),
				});
			}
			MessageCallback.emitMessage('OnGameOnceAgain');
		} else if (param == 'copy') {
			if (!this._data) return;
			let result = this._data.result
			if (!result || result.length == 0) return;
			let str = `白皮麻将-房间号:${BPMJModel.getRoomID()}\n`;
			for (let i = 0; i < result.length; i++) {
				const info = result[i];
				if (!info) continue;
				str += `${info.uid}-${Utils.getNickName(info.nickname)}: ${info.score}\n`
			}
			str += `${this.txt_time.string}`;
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