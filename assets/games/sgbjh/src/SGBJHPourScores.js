const SGBJHModel = require('./SGBJHModel');
const ApiSgbjh = require('./ApiSgbjh');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');

cc.Class({
	extends: cc.Component,
	properties: {
		pourButtonLabel: cc.Label,
		sliderBar: cc.Slider,
		progressBar: cc.ProgressBar,
	},

	onLoad() {
		this.node.active = false;
		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
		this._canPourScores = null
	},

	gameInit() {
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
		this.pourButtonLabel.string = canPourScores[0] + '分';
		this.sliderBar.progress = 0;
		this.progressBar.progress = 0;
		if (SGBJHModel.getGameStatus() == ApiSgbjh.gameStatus.POUR_SCORE &&
			SGBJHModel.getMyChairID() < SGBJHModel.getChairCount() &&
			SGBJHModel.getMyChairID() != SGBJHModel.getBankerChairID() &&
			SGBJHModel.getPourScoreByChairID(SGBJHModel.getMyChairID()) == 0 &&
			SGBJHModel.getIsPlayingByChairID(SGBJHModel.getMyChairID())) {
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
			if (msg.type === ApiSgbjh.GAME_STATUS_PUSH) {
				if ((msg.data.gameStatus == ApiSgbjh.gameStatus.POUR_SCORE) && (SGBJHModel.getMyChairID() != SGBJHModel.getBankerChairID())) {
					let delay = 0;
					this._canPourScores = msg.data.canPourScores
					this.scheduleOnce(() => {
						if ((SGBJHModel.getGameStatus() == ApiSgbjh.gameStatus.POUR_SCORE) && (SGBJHModel.getMyChairID() != SGBJHModel.getBankerChairID())) {
							this.gameInit();
						}
					}, delay);
				} else {
					this.node.active = false;
				}
			} else if (msg.type === ApiSgbjh.GAME_POUR_SCORE_PUSH) {
				if (msg.data.chairID == SGBJHModel.getMyChairID()) {
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
		let sendData = ApiSgbjh.gamePourScoreNotify(score);
		ApiRoom.gameMessageNotify(sendData);
		this.node.active = false;
	},

	onPourClick() {

		let sendData = ApiSgbjh.gamePourScoreNotify(this.getProgressScore());
		ApiRoom.gameMessageNotify(sendData);
		this.node.active = false;
	},

	onSlider(event) {
		this.progressBar.progress = event.progress;
		this.pourButtonLabel.string = this.getProgressScore() + '分';
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
	},

	getProgressScore() {
		let canPourScores = this._canPourScores
		if (!canPourScores) {
			return
		}
		let maxCanPourScore = SGBJHModel.getMaxCanPourScore()
		let score = canPourScores[0] + Math.floor((maxCanPourScore - canPourScores[0]) * this.progressBar.progress);
		return score;
	},
});