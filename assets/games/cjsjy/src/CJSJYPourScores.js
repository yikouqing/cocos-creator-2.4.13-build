const CJSJYModel = require('./CJSJYModel');
const ApiCjsjy = require('./ApiCjsjy');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');

cc.Class({
	extends: cc.Component,
	properties: {},

	onLoad() {
		this.node.active = false;
		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
		this._canPourScores = null
	},

	gameInit() {
		if (!CJSJYModel.getHandCardsByChairID(CJSJYModel.getMyChairID())) {
			this.node.active = false
			return
		}
		let canPourScores = this._canPourScores
		for (let i = 0; i < canPourScores.length; ++i) {
			let node = cc.find('Layout/button' + i, this.node);
			if (node) {
				cc.find('Label', node).getComponent(cc.Label).string = canPourScores[i] + '分';
				node.active = true;
			}
		}
		for (let i = canPourScores.length; i <= 4; ++i) {
			let node = cc.find('Layout/button' + i, this.node);
			if (node) {
				node.active = false;
			}
		}

		if (CJSJYModel.getGameStatus() == ApiCjsjy.gameStatus.POUR_SCORE &&
			CJSJYModel.getMyChairID() < CJSJYModel.getChairCount() &&
			CJSJYModel.getMyChairID() != CJSJYModel.getBankerChairID() &&
			CJSJYModel.getPourScoreByChairID(CJSJYModel.getMyChairID()) == 0 &&
			CJSJYModel.getIsPlayingByChairID(CJSJYModel.getMyChairID())) {
			this.node.active = true;
		} else {
			this.node.active = false;
		}
		/* TODO 资源替换 */
	},

	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this._canPourScores = msg.data.gameData.canPourScores
				this.gameInit();
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiCjsjy.GAME_STATUS_PUSH) {
				if ((msg.data.gameStatus == ApiCjsjy.gameStatus.POUR_SCORE) && (CJSJYModel.getMyChairID() != CJSJYModel.getBankerChairID())) {
					let delay = 0;
					this._canPourScores = msg.data.canPourScores
					this.scheduleOnce(() => {
						if ((CJSJYModel.getGameStatus() == ApiCjsjy.gameStatus.POUR_SCORE) && (CJSJYModel.getMyChairID() != CJSJYModel.getBankerChairID())) {
							this.gameInit();
						}
					}, delay);
				} else {
					this.node.active = false;
				}
			} else if (msg.type === ApiCjsjy.GAME_POUR_SCORE_PUSH) {
				if (msg.data.chairID == CJSJYModel.getMyChairID()) {
					this.node.active = false;
				}
			}
		}
	},

	onButtonClick(event, param) {

		let canPourScores = this._canPourScores
		if (!canPourScores) {
			return
		}
		let score = canPourScores[parseInt(param)];
		let sendData = ApiCjsjy.gamePourScoreNotify(score);
		ApiRoom.gameMessageNotify(sendData);
		this.node.active = false;
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
	},
});