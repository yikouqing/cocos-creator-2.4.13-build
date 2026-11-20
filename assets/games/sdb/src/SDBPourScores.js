const SDBModel = require('./SDBModel');
const ApiSdb = require('./ApiSdb');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');

cc.Class({
	extends: cc.Component,
	properties: {
		_betData: null
	},

	onLoad() {
		this._betData = [1, 2, 3, 4, 5]
		this.node.active = false;
		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
	},

	gameInit(msg) {
		if (msg.data.gameData.gameStatus === ApiSdb.gameStatus.POUR_SCORE) {
			this.showBtn(msg.data.gameData.pourScoreInfo);
		}
	},

	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.gameInit(msg);
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiSdb.GAME_POUR_SCORE_PUSH) { //下注完成
				if (msg.data.chairID == SDBModel.getMyChairID()) {
					this.node.active = false;
				}
			} else if (msg.type === ApiSdb.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus === ApiSdb.gameStatus.POUR_SCORE &&
					SDBModel.getMyChairID() != SDBModel.getBankerChairID() &&
					SDBModel.getPourScoreByChairID(SDBModel.getMyChairID()) == 0 &&
					SDBModel.getIsPlayingByChairID(SDBModel.getMyChairID())) {
					this.node.active = true;
				}
			} else if (msg.type === ApiSdb.GAME_POUR_SCORE_START_PUSH) { //下注按钮的值
				// console.log("显示下注按钮")
				this.showBtn(msg.data)
			}
		}
	},

	showBtn(data) {
		if (data && SDBModel.getMyChairID() !== SDBModel.getBankerChairID() &&
			SDBModel.getGameStatus() === ApiSdb.gameStatus.POUR_SCORE &&
			SDBModel.getMyChairID() != SDBModel.getBankerChairID() &&
			SDBModel.getIsPlayingByChairID(SDBModel.getMyChairID())) {
			let betValueList = data.basePour;
			for (let i = 0; i < betValueList.length; i++) {
				const betValue = betValueList[i];
				let txt = cc.find(`Layout/btn_bet${i}/Label`, this.node)
				txt.getComponent(cc.Label).string = betValue + "分";
			}
			this._betData = betValueList;
			this.node.active = true;
		}
	},

	onButtonClick(event) {
		let score = -1;
		switch (event.target.name) {
			case "btn_bet0":
				score = this._betData[0]
				break
			case "btn_bet1":
				score = this._betData[1]
				break
			case "btn_bet2":
				score = this._betData[2]
				break
			case "btn_bet3":
				score = this._betData[3]
				break
			case "btn_bet4":
				score = this._betData[4]
				break;
			default:
				break;
		}
		ApiRoom.gameMessageNotify(ApiSdb.gamePourScoreNotify(score));
		this.node.active = false;
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
	},
});