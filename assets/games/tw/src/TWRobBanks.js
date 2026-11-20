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
		/* if (TWModel.getGameType() == ApiTw.gameType.ZHIYOUQZ) {
			for (let i = 1; i <= 4; ++i) {
				cc.find('Button'+i, this.node).active = false;
			}
			cc.find('Button6', this.node).active = true;
		} */
		if (TWModel.getGameStatus() == ApiTw.gameStatus.ROB_BANK && TWModel.getRobScaleByChairID(TWModel.getMyChairID()) == null && TWModel.getIsPlayingByChairID(TWModel.getMyChairID())) {
			this.node.active = true;
		} else {
			this.node.active = false;
		}
	},

	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.gameInit();
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiTw.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus == ApiTw.gameStatus.ROB_BANK && TWModel.getIsPlayingByChairID(TWModel.getMyChairID())) {
					let robBankLimit = TWModel.getRobBankLimit();
					if (robBankLimit > 0 && TWModel.isUnionCreate()) {
						let user = TWModel.getUserByChairID(TWModel.getMyChairID());
						if (user.userInfo.score < robBankLimit) {
							// this.node.active = false;
							for (let i = 1; i <= 4; ++i) {
								cc.find("Button" + i, this.node).active = false;
							}
							this.node.active = true;
						} else {
							for (let i = 1; i <= 4; ++i) {
								cc.find("Button" + i, this.node).active = true;
							}
							this.node.active = true;
						}

					} else {
						this.node.active = true;
					}
				} else {
					this.node.active = false;
				}
			} else if (msg.type === ApiTw.GAME_ROB_BANK_PUSH) {
				if (msg.data.chairID == TWModel.getMyChairID()) {
					this.node.active = false;
				}
				let audio = 'res/audio/woman/qiangzhuang_0';
				if (msg.data.robScale == 0) {
					audio = 'res/audio/woman/buqiang_0';
				}
				let user = TWModel.getUserByChairID(msg.data.chairID);
				if (user && user.userInfo.sex == 0) {
					audio = audio.replace(/woman/, "man");
				}
				AssetsManager.playEffect({
					path: audio,
					bundle: Enums.bundleType.SSS
				});
			}
		}
	},

	onButtonClick(event, param) {

		let scale = parseInt(param);
		let sendData = ApiTw.gameRobBankNotify(scale);
		ApiRoom.gameMessageNotify(sendData);
		this.node.active = false;
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
	},
});