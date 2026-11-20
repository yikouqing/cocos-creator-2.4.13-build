const FXJModel = require('./FXJModel');
const ApiFxj = require('./ApiFxj');
const ApiRoom = require('../../../src/api/ApiRoom');
const GameMessageRouter = 'game.gameHandler.gameMessageNotify';
const MessageCallback = require('../../../src/utils/MessageCallback');

cc.Class({
	extends: cc.Component,
	properties: {
		_isInit: false
	},

	gameInit(data) {
		if (!this._isInit) {
			this._isInit = true
			this.node.active = false;
			let btn_buyang = cc.find("btn_buyang", this.node)
			let btn_yang1 = cc.find("btn_yang1", this.node)
			let btn_yang2 = cc.find("btn_yang2", this.node)
			btn_buyang.on("click", this.onButtonClick, this)
			btn_yang1.on("click", this.onButtonClick, this)
			btn_yang2.on("click", this.onButtonClick, this)
		}
		if (data.gameStatus !== ApiFxj.gameStatus.PIGSCORE) {
			this.node.active = false;
		} else {
			/**恢复房间如果处于养猪状态并且自己没有选择，显示按钮 */
			if (data.userPigScore) {
				let myScore = data.userPigScore[FXJModel.getMyChairID()]
				if (myScore === -1) {
					this.node.active = true
				}
			}
		}
	},

	messageCallbackHandler(route, msg) {
		if (!FXJModel.getGameInited()) {
			return;
		}
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.gameInit(msg.data);
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiFxj.GAME_START_PIG_SCORE_PUSH) {
				this.node.active = true
			} else if (msg.type === ApiFxj.GAME_USER_PIG_SCORE_PUSH) {
				if (msg.data.chairID === FXJModel.getMyChairID())
					this.node.active = false
			} else if (msg.type === ApiFxj.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus !== ApiFxj.gameStatus.PIGSCORE)
					this.node.active = false
			}
		}
	},

	/**显示养猪按钮 */
	showYangZhuBtn(isShow) {
		this.node.active = isShow
	},

	onButtonClick(event) {
		let num = 0
		switch (event.node.name) {
			case "btn_buyang":
				num = 0;
				break;
			case "btn_yang1":
				num = 1;
				break;
			case "btn_yang2":
				num = 2;
				break;
		}
		ApiRoom.gameMessageNotify(ApiFxj.gamePigScoreNotify(num));
		this.node.active = false
	},

	onDestroy() {

	},
});