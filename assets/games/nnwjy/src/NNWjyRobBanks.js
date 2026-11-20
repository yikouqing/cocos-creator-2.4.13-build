const NNWjyModel = require('./NNWjyModel');
const ApiNnWjy = require('./ApiNnWjy');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const { Def_Nnwjy } = require('../../../src/const/Defines');

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
		/* if (NNModel.getGameType() == Def_Nnwjy.gameType.ZHIYOUQZ) {
			for (let i = 1; i <= 4; ++i) {
				cc.find('Button'+i, this.node).active = false;
			}
			cc.find('Button6', this.node).active = true;
		} */
		if (NNWjyModel.getGameStatus() == ApiNnWjy.gameStatus.ROB_BANK &&
			NNWjyModel.getRobScaleByChairID(NNWjyModel.getMyChairID()) == null &&
			NNWjyModel.isPlayingByChairID(NNWjyModel.getMyChairID())) {
			this.node.active = true;
		} else {
			this.node.active = false;
		}
	},

	messageCallbackHandler(route, msg) {
		if (!NNWjyModel.getGameInited()) {
			return;
		}
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.gameInit();
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiNnWjy.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus == ApiNnWjy.gameStatus.ROB_BANK &&
					NNWjyModel.isPlayingByChairID(NNWjyModel.getMyChairID())) {
					let robBankLimit = NNWjyModel.getRobBankLimit();
					if (robBankLimit > 0 && NNWjyModel.isUnionCreate()) {
						// for (let index = 1; index <= 4; index++) {
						// 	cc.find("Button" + index, this.node).active = false;
						// 	cc.find("Button" + index, this.node).getComponent(cc.Button).interactable = false;
						// }
						let user = NNWjyModel.getUserByChairID(NNWjyModel.getMyChairID());
						if (user.userInfo.score < robBankLimit) {
							// this.node.active = false;
							// AssetsManager.tipDialog(`金币不足${robBankLimit},不能抢庄`);
							for (let i = 1; i <= 4; ++i) {
								// cc.find("Button" + i, this.node).active = false;
								cc.find("Button" + i, this.node).getComponent(cc.Button).interactable = false;
							}
							this.node.active = true;
						} else {
							for (let i = 1; i <= 4; ++i) {
								// cc.find("Button" + i, this.node).active = true;
								cc.find("Button" + i, this.node).getComponent(cc.Button).interactable = true
							}
							this.node.active = true;
						}
					} else {
						this.node.active = true;
					}
				} else {
					this.node.active = false;
				}
			} else if (msg.type === ApiNnWjy.GAME_ROB_BANK_PUSH) {
				if (msg.data.chairID == NNWjyModel.getMyChairID()) {
					this.node.active = false;
				}
				let audio = 'res/audio/woman/rob' + msg.data.robScale;
				let user = NNWjyModel.getUserByChairID(msg.data.chairID);
				if (user && user.userInfo.sex == 0) {
					audio = audio.replace(/woman/, "man");
				}
				AssetsManager.playEffect({
					path: audio,
					bundle: Enums.bundleType.WJYNN
				});
			}
		}
	},

	onButtonClick(event, param) {

		let scale = parseInt(param);
		let sendData = ApiNnWjy.gameRobBankNotify(scale);
		ApiRoom.gameMessageNotify(sendData);
		this.node.active = false;
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
	},
});