const SGModel = require('./SGModel');
const ApiSg = require('./ApiSg');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const { Def_Sg } = require('../../../src/const/Defines');

cc.Class({
	extends: cc.Component,
	properties: {
		pourButtonLabel: cc.Label,
		sliderBar: cc.Slider,
		progressBar: cc.ProgressBar,
		pourScoreLbl: cc.Label,
		minScoreLbl: cc.Label,
		maxScoreLbl: cc.Label,
	},

	onLoad() {
		this.node.active = false;
		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
	},

	gameInit() {
		let canMinPourScore = SGModel.getCanMinPourScore();
		let canMaxPourScore = SGModel.getMaxCanPourScore();
		this.minScoreLbl.string = canMinPourScore;
		this.maxScoreLbl.string = canMaxPourScore;
		this.pourButtonLabel.string = canMinPourScore;
		// let canPourScores = SGModel.getCanPourScores();
		// for (let i = 0; i < canPourScores.length; ++i) {
		// 	let node = cc.find('Layout/button' + i, this.node);
		// 	if (node) {
		// 		cc.find('Label', node).getComponent(cc.Label).string = canPourScores[i] + '分';
		// 		node.active = true;
		// 	}
		// }
		// for (let i = canPourScores.length; i <= 4; ++i) {
		// 	let node = cc.find('Layout/button' + i, this.node);
		// 	if (node) {
		// 		node.active = false;
		// 	}
		// }
		this.sliderBar.progress = 0;
		this.progressBar.progress = 0;
		if (SGModel.getGameStatus() == ApiSg.gameStatus.POUR_SCORE &&
			SGModel.getMyChairID() != SGModel.getBankerChairID() &&
			SGModel.getMyChairID() < SGModel.getChairCount() &&
			SGModel.getPourScoreByChairID(SGModel.getMyChairID()) == 0 &&
			SGModel.getIsPlayingByChairID(SGModel.getMyChairID())) {
			this.node.active = true;
		} else {
			this.node.active = false;
		}
		/* TODO 资源替换 */
	},

	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.gameInit();
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiSg.GAME_STATUS_PUSH) {
				let myID = SGModel.getMyChairID();
				let bankerID = SGModel.getBankerChairID();
				if ((msg.data.gameStatus == ApiSg.gameStatus.POUR_SCORE) && (SGModel.getMyChairID() != SGModel.getBankerChairID())) {
					let delay = 0;
					if (SGModel.getGameType() == Def_Sg.gameType.MINGPAIQZ || SGModel.getGameType() == Def_Sg.gameType.ZHIYOUQZ) {
						delay = 2.5;
					}
					this.scheduleOnce(() => {
						if ((SGModel.getGameStatus() == ApiSg.gameStatus.POUR_SCORE) && (SGModel.getMyChairID() != SGModel.getBankerChairID())) {
							this.gameInit();
						}
					}, delay);
				} else {
					this.node.active = false;
				}
			} else if (msg.type === ApiSg.GAME_POUR_SCORE_PUSH) {
				if (msg.data.chairID == SGModel.getMyChairID()) {
					this.node.active = false;
				}
			}
		}
	},

	onButtonClick(event, param) {

		if (param == 'add') {
			if (this.progressBar.progress > 1) return;
			this.progressBar.progress += 0.03;
			this.pourButtonLabel.string = this.getProgressScore();
			this.pourScoreLbl.string = this.getProgressScore();
		} else if (param == 'reduce') {
			if (this.progressBar.progress < 0) return;
			this.progressBar.progress -= 0.03;
			this.pourButtonLabel.string = this.getProgressScore();
			this.pourScoreLbl.string = this.getProgressScore();
		}
	},

	onPourClick() {
		let sendData = ApiSg.gamePourScoreNotify(this.getProgressScore());
		ApiRoom.gameMessageNotify(sendData);
		this.node.active = false;
	},

	onSlider(event, param) {
		this.progressBar.progress = event.progress;
		this.pourButtonLabel.string = this.getProgressScore();
		this.pourScoreLbl.string = this.getProgressScore();

	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
	},

	getProgressScore() {
		let minCanPourScores = SGModel.getCanMinPourScore();
		let maxCanPourScore = SGModel.getMaxCanPourScore();
		let score = minCanPourScores + Math.floor((maxCanPourScore - minCanPourScores) * this.progressBar.progress);
		return score;
	},
});