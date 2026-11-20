const TWModel = require('./TWModel');
const ApiTw = require('./ApiTw');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');

cc.Class({
	extends: cc.Component,
	properties: {},

	onLoad() {
		this.node.active = false;
		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
	},

	gameInit() {
		let canPourScores = TWModel.getCanPourScoresByChairID(TWModel.getMyChairID());
		let canTui = false
		let user = TWModel.getUserByChairID(TWModel.getMyChairID());
		let robScale = TWModel.getRobScaleByChairID(TWModel.getMyChairID());
		let pourCount = robScale == null || robScale < 3 ? 2 : canTui ? 5 : robScale;
		// console.log("分数选择", canPourScores, robScale);
		// console.log("分数选择-我自己", user);
		for (let node of this.node.children) {
			node.active = false;
			node.getComponent(cc.Button).interactable = true;
		}
		for (let i = 0; i < canPourScores.length; i++) {
			let node = cc.find('button' + i, this.node);
			if (!node) continue;
			//抢庄倍数和下注按钮显示数对应 不抢 1 2显示两个 以此类推
			if (TWModel.isUnionCreate() && this.getRoomCreatorByKey('unionType') != Enums.UnionType.NORMAL) {
				node.active = i < pourCount;
				node.getComponent(cc.Button).interactable = user.userInfo.score >= canPourScores[i];
			} else {
				node.active = true;
				node.getComponent(cc.Button).interactable = true;
			}
			cc.find('Label', node).getComponent(cc.Label).string = canPourScores[i] + '分';
		}
		// if (TWModel.getGameStatus() == ApiTw.gameStatus.POUR_SCORE &&
		// 	TWModel.getMyChairID() != TWModel.getBankerChairID() &&
		// 	TWModel.getPourScoreByChairID(TWModel.getMyChairID()) == 0 &&
		// 	TWModel.getIsPlayingByChairID(TWModel.getMyChairID())) {
		// 	this.node.active = true;
		// } else {
		// 	this.node.active = false;
		// }
	},

	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.gameInit();
			}
		} else if (route === 'GameMessagePush') {
			// if (msg.type === ApiTw.GAME_STATUS_PUSH) {
			// 	if ((msg.data.gameStatus == ApiTw.gameStatus.POUR_SCORE) &&
			// 		(TWModel.getMyChairID() != TWModel.getBankerChairID())) {
			// 		if ((TWModel.getGameStatus() == ApiTw.gameStatus.POUR_SCORE) &&
			// 			(TWModel.getMyChairID() != TWModel.getBankerChairID()) &&
			// 			TWModel.getIsPlayingByChairID(TWModel.getMyChairID())) {
			// 			this.gameInit();
			// 		}
			// 	} else {
			// 		this.node.active = false;
			// 	}
			// } else if (msg.type === ApiTw.GAME_POUR_SCORE_PUSH) {
			// 	if (msg.data.chairID == TWModel.getMyChairID()) {
			// 		this.node.active = false;
			// 	}
			// }
		}
	},

	onButtonClick(event, param) {

		let canPourScores = TWModel.getCanPourScoresByChairID(TWModel.getMyChairID());
		let index = parseInt(param);
		// console.log("我下的分", canPourScores, canPourScores[index]);
		let sendData = ApiTw.gamePourScoreNotify(canPourScores[index] * 10);
		ApiRoom.gameMessageNotify(sendData);
		this.node.active = false;
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
	},
});