const NNModel = require('./NNModel');
const ApiNn = require('./ApiNn');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const { Def_Nn } = require('../../../src/const/Defines');

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
		if (NNModel.getGameStatus() == ApiNn.gameStatus.ROB_BANK &&
			NNModel.getRobScaleByChairID(NNModel.getMyChairID()) == null &&
			NNModel.getIsPlayingByChairID(NNModel.getMyChairID())) {
			this.node.active = true;
		} else {
			this.node.active = false;
		}
	},

	messageCallbackHandler(route, msg) {
		if (!NNModel.getGameInited()) {
			return;
		}
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.gameInit();
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiNn.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus == ApiNn.gameStatus.ROB_BANK &&
					NNModel.getIsPlayingByChairID(NNModel.getMyChairID())) {
					let robBankLimit = NNModel.getRobBankLimit();
					robBankLimit = robBankLimit || 0;
					let unionType = NNModel.getRoomCreatorByKey('unionType');
					if (NNModel.isUnionCreate() && unionType == Enums.UnionType.MATCH) {
						let user = NNModel.getUserByChairID(NNModel.getMyChairID());
						for (let i = 1; i <= 4; ++i) {
							cc.find("Button" + i, this.node).getComponent(cc.Button).interactable = user.userInfo.score > robBankLimit;
						}
						this.node.active = true;
					} else {
						this.node.active = true;
					}
				} else {
					this.node.active = false;
				}
			} else if (msg.type === ApiNn.GAME_ROB_BANK_PUSH) {
				if (msg.data.chairID == NNModel.getMyChairID()) {
					this.node.active = false;
				}
				let audio = 'res/audio/woman/rob' + msg.data.robScale;
				let user = NNModel.getUserByChairID(msg.data.chairID);
				if (user && user.userInfo.sex == 0) {
					audio = audio.replace(/woman/, "man");
				}
				AssetsManager.playEffect({
					path: audio,
					bundle: Enums.bundleType.NN
				});
			}
		}
	},

	onButtonClick(event, param) {

		let scale = parseInt(param);
		let sendData = ApiNn.gameRobBankNotify(scale);
		ApiRoom.gameMessageNotify(sendData);
		this.node.active = false;
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
	},
});