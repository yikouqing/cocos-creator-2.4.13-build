const NNWjyModel = require('./NNWjyModel');
const ApiNnWjy = require('./ApiNnWjy');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
let MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Utils = require('../../../src/utils/Utils');

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
		let canPourScores = NNWjyModel.getCanPourScoresByChairID(NNWjyModel.getMyChairID());
		let canTui = NNWjyModel.getTuiStatusByChairID(NNWjyModel.getMyChairID());
		let user = NNWjyModel.getUserByChairID(NNWjyModel.getMyChairID());
		let robScale = NNWjyModel.getRobScaleByChairID(NNWjyModel.getMyChairID());
		let pourCount = robScale == null || robScale < 3 ? 2 : canTui ? 5 : robScale;
		// console.log("分数选择", canPourScores, robScale, pourCount);
		// console.log("分数选择-我自己", user);
		for (let node of this.node.children) {
			node.active = false;
			node.getComponent(cc.Button).interactable = true;
		}
		for (let i = 0; i < canPourScores.length; i++) {
			let node = cc.find('button' + i, this.node);
			if (!node) continue;
			//抢庄倍数和下注按钮显示数对应 不抢 1 2显示两个 以此类推
			if (NNWjyModel.isUnionCreate() && NNWjyModel.getRoomCreatorByKey('unionType') == Enums.UnionType.MATCH) {
				if (i < pourCount) {
					node.active = true;
				}
				// node.active = i < pourCount;
				node.getComponent(cc.Button).interactable = user.userInfo.score >= canPourScores[i];
				// console.log(i < pourCount, node.active, 'node.active');
			} else {
				node.active = true;
				node.getComponent(cc.Button).interactable = true;
			}
			cc.find('Label', node).getComponent(cc.Label).string = Utils.formatNumberWithDecimal(canPourScores[i], 2) + '分';
		}
		if (NNWjyModel.getGameStatus() == ApiNnWjy.gameStatus.POUR_SCORE &&
			NNWjyModel.getMyChairID() != NNWjyModel.getBankerChairID() &&
			NNWjyModel.getPourScoreByChairID(NNWjyModel.getMyChairID()) == 0 &&
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

				if ((NNWjyModel.getGameStatus() == ApiNnWjy.gameStatus.POUR_SCORE) &&
					(NNWjyModel.getMyChairID() != NNWjyModel.getBankerChairID()) &&
					NNWjyModel.isPlayingByChairID(NNWjyModel.getMyChairID())) {
					// console.log(NNWjyModel.getGameStatus(), NNWjyModel.getMyChairID(), '下分----------------------');
					this.gameInit();
				}
				else {
					this.node.active = false;
				}
			} else if (msg.type === ApiNnWjy.GAME_POUR_SCORE_PUSH) {
				if (msg.data.chairID == NNWjyModel.getMyChairID()) {
					this.node.active = false;
				}
			}
		}
	},

	onButtonClick(event, param) {

		let canPourScores = NNWjyModel.getCanPourScoresByChairID(NNWjyModel.getMyChairID());
		let index = parseInt(param);
		// console.log("我下的分", canPourScores, canPourScores[index]);
		let sendData = ApiNnWjy.gamePourScoreNotify(canPourScores[index] * 10);
		ApiRoom.gameMessageNotify(sendData);
		this.node.active = false;
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
	},
});