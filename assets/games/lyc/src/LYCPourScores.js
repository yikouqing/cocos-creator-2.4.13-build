/*
 * 下分按钮
 * author: sfmy
 */
const LYCModel = require('./LYCModel');
const ApiLyc = require('./ApiLyc');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Utils = require('../../../src/utils/Utils');

cc.Class({
	extends: cc.Component,
	properties: {
		_betData: null
	},

	onLoad() {
		this.node.active = false;
		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
	},

	gameInit(msg) {
		/* TODO 资源替换 */
		if (msg.data.gameData.gameStatus === ApiLyc.gameStatus.POUR_SCORE) {
			this.showBtn(msg.data.gameData.pourScoreInfo)
		}
	},

	messageCallbackHandler(route, msg) {
		if (!LYCModel.getGameInited()) return;
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.gameInit(msg);
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiLyc.GAME_POUR_SCORE_PUSH) { //下注完成
				if (msg.data.chairID == LYCModel.getMyChairID()) {
					this.node.active = false;
					this._betData = null;
				}
			} else if (msg.type === ApiLyc.GAME_POUR_SCORE_START_PUSH) { //下注按钮的值
				// console.log("显示下注按钮")
				this.showBtn(msg.data);
			} else if (msg.type === ApiLyc.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus !== ApiLyc.gameStatus.POUR_SCORE) {
					this.node.active = false;
				}
			}
		}
	},

	showBtn(data) {
		let user = LYCModel.getUserByChairID(data.chairID);
		if (data &&
			user &&
			LYCModel.getMyChairID() === data.chairID &&
			LYCModel.getMyChairID() < LYCModel.getChairCount() &&
			(user.userStatus != ApiRoom.userStatusEnum.READY ||
				user.userStatus != ApiRoom.userStatusEnum.PLAYING)) {
			let betValueList = data.basePour;
			for (let i = 0; i < betValueList.length; i++) {
				const betValue = betValueList[i];
				let txt = cc.find(`Layout/btn_bet${i}/Label`, this.node)
				txt.getComponent(cc.Label).string = Utils.formatNumberWithDecimal(betValue, 1) + "分"
			}
			cc.find(`Layout/btn_zouShui`, this.node).active = data.zouShui > 0
			cc.find(`Layout/btn_maBao`, this.node).active = data.maBao > 0
			if (data.zouShui > 0) {
				let txt = cc.find(`Layout/btn_zouShui/Label`, this.node)
				txt.getComponent(cc.Label).string = Utils.formatNumberWithDecimal(data.zouShui, 1) + "分"
			}
			if (data.maBao > 0) {
				let txt = cc.find(`Layout/btn_maBao/Label`, this.node)
				txt.getComponent(cc.Label).string = Utils.formatNumberWithDecimal(data.maBao, 1) + "分"
			}
			this._betData = data
			this.node.active = true;
		} else {
			this.node.active = false;
		}
	},

	onButtonClick(event, param) {

		let score = -1;
		switch (event.target.name) {
			case "btn_bet0":
				score = this._betData.basePour[0]
				break
			case "btn_bet1":
				score = this._betData.basePour[1]
				break
			case "btn_bet2":
				score = this._betData.basePour[2]
				break
			case "btn_bet3":
				score = this._betData.basePour[3]
				break
			case "btn_zouShui":
				score = this._betData.zouShui
				break
			case "btn_maBao":
				score = this._betData.maBao
				break;
			default:
				break;
		}
		ApiRoom.gameMessageNotify(ApiLyc.gamePourScoreNotify(score));
		this.node.active = false;
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
	},
});