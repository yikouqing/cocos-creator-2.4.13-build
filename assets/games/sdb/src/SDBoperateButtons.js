/*
 * 抢庄
 */
const SDBModel = require('./SDBModel');
const ApiSdb = require('./ApiSdb');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');

cc.Class({
	extends: cc.Component,
	properties: {},

	onLoad() {
		this.node.active = false;
		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
	},

	gameInit(data) {
		if (data.gameData.gameStatus === ApiSdb.gameStatus.CHOOSE_OPERATE) {
			this.showBtn(data.gameData.curOperateInfo)
		}
	},

	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.gameInit(msg.data);
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiSdb.GAME_USER_OPERATE_START_PUSH) {
				this.showBtn(msg.data)
			} else if (msg.type === ApiSdb.GAME_USER_OPERATE_PUSH) {
				if (msg.data.chairID !== SDBModel.getMyChairID()) this.node.active = false
			} else if (msg.type === ApiSdb.GAME_RESULT_PUSH) {
				this.node.active = false
			} else if (msg.type === ApiSdb.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus !== ApiSdb.gameStatus.CHOOSE_OPERATE) {
					this.node.active = false
				}
			}
		}
	},

	showBtn(data) {
		if (data.chairID == SDBModel.getMyChairID()) {
			/**根据消息展示按钮 */
			// pullCard: pullCard, //要牌
			// 	cancel: cancel, //不要
			cc.find("Layout/btn_yao", this.node).active = data.pullCard
			cc.find("Layout/btn_buyao", this.node).active = data.cancel
			this.node.active = true;
		} else this.node.active = false
	},

	onButtonClick(event) {
		let type = ApiSdb.operateType.CANCEL
		switch (event.target.name) {
			case "btn_yao":
				type = ApiSdb.operateType.PULL
				break;
			case "btn_buyao":
				type = ApiSdb.operateType.CANCEL
				break;
			default:
				break;
		}
		ApiRoom.gameMessageNotify(ApiSdb.gameUserOperateNotify(type));
		this.node.active = false
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
	},
});