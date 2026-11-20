/*
 * 抢庄
 * author: sfmy
 */
const LYCModel = require('./LYCModel');
const ApiLyc = require('./ApiLyc');
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
		if (LYCModel.getGameStatus() == ApiLyc.gameStatus.ROB_BANK &&
			LYCModel.getRobScaleByChairID(LYCModel.getMyChairID()) == null &&
			LYCModel.getIsPlayingByChairID(LYCModel.getMyChairID())) {
			this.node.active = true;
		} else {
			this.node.active = false;
		}
	},

	messageCallbackHandler(route, msg) {
		if (!LYCModel.getGameInited()) return;
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.gameInit();
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiLyc.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus == ApiLyc.gameStatus.ROB_BANK) {
					this.node.active = LYCModel.getIsPlayingByChairID(LYCModel.getMyChairID())
					let robBankLimit = LYCModel.getGameRuleByKey("robBankLimit")
					for (let i = 1; i <= 4; i++) {
						let btn = cc.find("Button" + i, this.node).getComponent(cc.Button)
						btn.interactable = true
						if (robBankLimit) {
							btn.interactable = ((LYCModel.isUnionCreate() &&
								LYCModel.getRoomCreatorByKey('unionType') != Enums.UnionType.NORMAL) &&
								robBankLimit <= LYCModel.getCurScore(LYCModel.getMyChairID())) ||
								!LYCModel.isUnionCreate() ||
								LYCModel.getRoomCreatorByKey('unionType') == Enums.UnionType.NORMAL;
						}
					}
				} else {
					this.node.active = false;
				}
			} else if (msg.type === ApiLyc.GAME_ROB_BANK_PUSH) {
				if (msg.data.chairID == LYCModel.getMyChairID()) {
					this.node.active = false;
				}
				let audio = 'res/audio/nv/rob' + msg.data.robScale;

				let user = LYCModel.getUserByChairID(msg.data.chairID);
				if (user && user.userInfo.sex == 0) {
					audio = audio.replace(/nv/, "nan");
				}
				AssetsManager.playEffect({
					path: audio,
					bundle: Enums.bundleType.LYC
				});
			}
		}
	},

	onButtonClick(event, param) {

		let scale = parseInt(param);
		let sendData = ApiLyc.gameRobBankNotify(scale);
		ApiRoom.gameMessageNotify(sendData);
		this.node.active = false;
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
	},
});