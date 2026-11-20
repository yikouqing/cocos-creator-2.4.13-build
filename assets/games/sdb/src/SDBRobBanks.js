const SDBModel = require('./SDBModel');
const ApiSdb = require('./ApiSdb');
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
		if (SDBModel.getGameStatus() == ApiSdb.gameStatus.ROB_BANK && SDBModel.getRobScaleByChairID(SDBModel.getMyChairID()) == null && SDBModel.getIsPlayingByChairID(SDBModel.getMyChairID())) {
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
			if (msg.type === ApiSdb.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus == ApiSdb.gameStatus.ROB_BANK) {
					this.node.active = SDBModel.getIsPlayingByChairID(SDBModel.getMyChairID());
				} else {
					this.node.active = false;
				}
			} else if (msg.type === ApiSdb.GAME_ROB_BANK_PUSH) {
				if (msg.data.chairID == SDBModel.getMyChairID()) {
					this.node.active = false;
				}
				let audio = 'res/audio/nv/qiangzhuang_0';
				if (msg.data.robScale == 0) {
					audio = 'res/audio/nv/buqiang_0';
				}
				let user = SDBModel.getUserByChairID(msg.data.chairID);
				if (user && user.userInfo.sex == 0) {
					audio = audio.replace(/nv/, "nan");
				}
				AssetsManager.playEffect({
					path: audio,
					bundle: Enums.bundleType.SDB
				});
			}
		}
	},

	onButtonClick(event, param) {
		let scale = parseInt(param);
		let sendData = ApiSdb.gameRobBankNotify(scale);
		ApiRoom.gameMessageNotify(sendData);
		this.node.active = false;
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
	},
});