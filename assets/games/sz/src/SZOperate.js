const SZModel = require('./SZModel');
const ApiSz = require('./ApiSz');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Utils = require('../../../src/utils/Utils');

cc.Class({
	extends: cc.Component,

	properties: {
		btnFold: cc.Button,
		btnCompare: cc.Button,
		btnFlash: cc.Button,
		btnCall: cc.Button,
		btnRaise: cc.Button,
		btnAnyCall: cc.Button,
		btnDisAnyCall: cc.Button,
		btnAddScore: cc.Node,
		addScorePrefab: cc.Prefab,
		addScoreList: cc.Node,
		genScore: cc.Label,
		biScore: cc.Label,

		_addScores: null,

		_opInited: false,
	},

	onLoad() {
		this.compareNodeArray = [];
		this._addScores = [];
		this.node.active = false;
		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
	},

	gameInit() {
		this.opCheck();
	},

	opCheck() {
		let gameRule = SZModel.getGameRule();
		let curScore = SZModel.getCurScore();
		let baseScore = gameRule.baseScore;
		let genScore = curScore;
		let maxLimitScore = gameRule.baseScore * gameRule.maxScore;
		let myChairID = SZModel.getMyChairID();
		let isLookCard = SZModel.getLookCardByChairID(myChairID);
		if (!!isLookCard) {
			this.btnAddScore.active = curScore < maxLimitScore && Math.floor(curScore) < Math.floor(maxLimitScore); //最低加注量
		} else {
			genScore = Math.max(baseScore, curScore / 2); //最低闷注量
			this.btnAddScore.active = curScore < maxLimitScore && Math.floor(genScore) < Math.floor(maxLimitScore / 2);
		}
		this.addScoreList.destroyAllChildren();
		let isPourScore = SZModel.getGameStatus() == ApiSz.gameStatus.POUR_SCORE;
		let userStatus = SZModel.getUserStatusByChairID(myChairID);
		if (isPourScore &&
			SZModel.getIsPlayingByChairID(myChairID) &&
			userStatus != ApiSz.userStatus.ABANDON &&
			userStatus != ApiSz.userStatus.TIMEOUTABANDON &&
			userStatus != ApiSz.userStatus.LOSE) {
			let pai = SZModel.getHandCardsByChairID(myChairID)
			this.node.active = !!pai && pai.length == 3;
			if (!pai || pai.length != 3) return;
			let isMyTurn = SZModel.getCurChairID() == myChairID;
			let isCanAnyCall = SZModel.getIsAnyCall();
			let isAnyCallOp = SZModel.getAnyCallByChairID(myChairID);
			let men = SZModel.getGameRuleByKey('gameFrameType');
			let bipai = SZModel.getGameRuleByKey("compareRound");
			let isCompareDouble = SZModel.getGameRuleByKey('isCompareDouble');
			this.genScore.string = `${Utils.formatNumberWithDecimal(genScore)}`;
			let biScore = !!isCompareDouble ? genScore * 2 : genScore;
			this.biScore.string = `${Utils.formatNumberWithDecimal(biScore)}`;
			// this.btnAnyCall.node.active = isPourScore && isCanAnyCall && !isAnyCallOp;
			this.btnAnyCall.node.active = false;
			this.btnAnyCall.interactable = isPourScore && isCanAnyCall && !isAnyCallOp;
			// this.btnDisAnyCall.node.active = isPourScore && isCanAnyCall && isAnyCallOp;
			this.btnDisAnyCall.node.active = false;
			this.btnDisAnyCall.interactable = isPourScore && isCanAnyCall && isAnyCallOp;
			this.btnCall.interactable = !isAnyCallOp && !!isMyTurn;
			this.btnFold.interactable = !!isMyTurn;
			this.btnCompare.interactable = !isAnyCallOp && ((bipai > 0 && bipai < SZModel.getCurRound()) || (!bipai && men < SZModel.getCurRound())) && !!isMyTurn;
			this.btnFlash.node.active = userStatus != ApiSz.userStatus.LOOK && SZModel.getGameRuleByKey('cuopai') && men < SZModel.getCurRound() && !!isMyTurn;
			this.btnFlash.interactable = !isAnyCallOp && !!isMyTurn;
			this.btnRaise.interactable = !isAnyCallOp && !!isMyTurn; //没有选择跟到底且1倍下注分小于下注分上限才能加注
			this.unscheduleAllCallbacks();
			let tick = SZModel.getTick();
			tick = tick > 1 ? 1 : tick;
			if (!!isCanAnyCall && !!isAnyCallOp && !!isMyTurn) {
				this.scheduleOnce(() => {
					this.onGenzhuClick();
				}, tick);
			}
		} else {
			this.node.active = false;
		}

	},

	messageCallbackHandler(route, msg) {
		if (!SZModel.isGameInited(route, msg)) return;
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.gameInit();
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiSz.GAME_LOOK_PUSH) {
				if (msg.data.chairID == SZModel.getMyChairID()) {
					this.gameInit();
				}
			} else if (msg.type === ApiSz.GAME_TURN_PUSH) {
				this.gameInit();
			} else if (msg.type === ApiSz.GAME_STATUS_PUSH) {
				this.gameInit();
			} else if (msg.type === ApiSz.GAME_COMPARE_PUSH) {
				let audio = 'res/audio/woman/cmp';
				let user = SZModel.getUserByChairID(msg.data.fromChairID);
				if (user && user.userInfo.sex == 0) {
					audio = audio.replace(/woman/, "man");
				}
				AssetsManager.playEffect({
					path: audio,
					bundle: Enums.bundleType.SZ
				});
			} else if (msg.type === ApiSz.GAME_POUR_SCORE_PUSH) {
				if (msg.data.chairID == SZModel.getMyChairID()) {
					this.unscheduleAllCallbacks();
				}
				let audio = "";
				if (msg.data.type == 1) {
					audio = 'res/audio/woman/call';
				} else if (msg.data.type == 2) {
					audio = 'res/audio/woman/raise';
				}
				let user = SZModel.getUserByChairID(msg.data.chairID);
				if (user && user.userInfo.sex == 0) {
					audio = audio.replace(/woman/, "man");
				}
				AssetsManager.playEffect({
					path: audio,
					bundle: Enums.bundleType.SZ
				});
			} else if (msg.type === ApiSz.GAME_ABANDON_PUSH) {
				let audio = 'res/audio/woman/fold';
				let user = SZModel.getUserByChairID(msg.data.chairID);
				if (user && user.userInfo.sex == 0) {
					audio = audio.replace(/woman/, "man");
				}
				AssetsManager.playEffect({
					path: audio,
					bundle: Enums.bundleType.SZ
				});
				if (msg.data.chairID == SZModel.getMyChairID()) {
					this.unscheduleAllCallbacks();
					while (this.compareNodeArray.length > 0) {
						let node = this.compareNodeArray.pop();
						node.destroy();
					}
					cc.find('bg', this.node).active = false;
				}
			} else if (msg.type === ApiSz.GAME_FOLLOW_THROUGH_PUSH) {
				//玩家跟到底状态显示
				if (msg.data.chairID != SZModel.getMyChairID()) return;
				// console.log("测试-跟到底", msg.data);
				this.opCheck();
			}
		}
	},

	onAbandonClick() {
		this.unscheduleAllCallbacks();
		ApiRoom.gameMessageNotify(ApiSz.gameAbandonNotify());
		this.addScoreList.destroyAllChildren();
		// this.node.active = false;
	},

	onAnyCallClick() {
		this.unscheduleAllCallbacks();
		ApiRoom.gameMessageNotify(ApiSz.gameFollowThroughtify(SZModel.getMyChairID(), true));
		//判断是不是自己轮次 是自己轮次直接下注
		let isPourScore = SZModel.getGameStatus() == ApiSz.gameStatus.POUR_SCORE;
		let userStatus = SZModel.getUserStatusByChairID(SZModel.getMyChairID());
		let isMyTurn = SZModel.getCurChairID() == SZModel.getMyChairID();
		if (isPourScore && SZModel.getIsPlayingByChairID(SZModel.getMyChairID()) &&
			userStatus != ApiSz.userStatus.ABANDON &&
			userStatus != ApiSz.userStatus.TIMEOUTABANDON &&
			userStatus != ApiSz.userStatus.LOSE &&
			!!isMyTurn) {
			let gameRule = SZModel.getGameRule();
			let score = SZModel.getCurScore(),
				minScore = 0;
			if (SZModel.getLookCardByChairID(SZModel.getMyChairID())) {
				minScore = Math.floor(score);
				ApiRoom.gameMessageNotify(ApiSz.gamePourScoreNotify(score, 1));
			} else {
				minScore = Math.floor(score / 2 <= gameRule.baseScore ? gameRule.baseScore : score / 2); //最低闷注量
				ApiRoom.gameMessageNotify(ApiSz.gamePourScoreNotify(minScore, 1));
			}
			this.addScoreList.destroyAllChildren();
		}
	},

	onDisAnyCallClick() {
		this.unscheduleAllCallbacks();
		ApiRoom.gameMessageNotify(ApiSz.gameFollowThroughtify(SZModel.getMyChairID(), false));
	},

	onCompareClick() {
		let szMainLogic = this.node.parent.getComponent('SZMainDialog');
		let canCompareArray = SZModel.getCanCompareChairIDs();
		if (canCompareArray.length == 0) return;
		if (canCompareArray.length == 1) {
			//只有一人
			this.compare(canCompareArray[0]);
		} else {
			//有多人可选
			let bgNode = cc.find('bg', this.node);
			bgNode.active = true;
			let compareNode = cc.find('Compare', this.node);
			let selfPos = this.node.getPosition();
			for (let chairID of canCompareArray) {
				if (chairID != SZModel.getMyChairID()) {
					let headNodePos = szMainLogic.getHeadNodeByChairID(chairID).getPosition();
					let node = cc.instantiate(compareNode);
					node.parent = this.node;
					node.active = true;
					node.setPosition(cc.v2(headNodePos.x - selfPos.x, headNodePos.y - selfPos.y));
					this.compareNodeArray.push(node);
					node.on(cc.Node.EventType.TOUCH_START, this.compare.bind(this, chairID));
				}
			}
		}
	},

	compare(chairID) {
		while (this.compareNodeArray.length > 0) {
			let node = this.compareNodeArray.pop();
			node.destroy();
		}
		cc.find('bg', this.node).active = false;
		if (SZModel.isUnionCreate()) {
			let myScore = SZModel.getCurScoreByChairID(SZModel.getMyChairID());
			let lookCard = SZModel.getLookCardByChairID(SZModel.getMyChairID());
			let curScore = SZModel.getCurScore() * (lookCard ? 2 : 1);
		}
		ApiRoom.gameMessageNotify(ApiSz.gameCompareNotify(chairID));
		this.addScoreList.destroyAllChildren();
		// this.node.active = false;
	},

	cancelCompare() {
		while (this.compareNodeArray.length > 0) {
			let node = this.compareNodeArray.pop();
			node.destroy();
		}
		cc.find('bg', this.node).active = false;
	},

	onCuopaiClick() {
		ApiRoom.gameMessageNotify(ApiSz.gameLookCardsNotify(true));
	},

	onGenzhuClick() {
		this.unscheduleAllCallbacks();
		let gameRule = SZModel.getGameRule();
		let score = SZModel.getCurScore(),
			minScore = 0;
		if (SZModel.getLookCardByChairID(SZModel.getMyChairID())) {
			minScore = Math.floor(score);
			ApiRoom.gameMessageNotify(ApiSz.gamePourScoreNotify(score, 1));
		} else {
			minScore = Math.floor(score / 2 <= gameRule.baseScore ? gameRule.baseScore : score / 2); //最低闷注量
			ApiRoom.gameMessageNotify(ApiSz.gamePourScoreNotify(minScore, 1));
		}
		this.addScoreList.destroyAllChildren();
		// this.node.active = false;
	},

	addScore(score) {
		this.unscheduleAllCallbacks();
		if (SZModel.isUnionCreate() && SZModel.getRoomCreatorByKey('unionType') != Enums.UnionType.NORMAL) {
			let myScore = SZModel.getCurScoreByChairID(SZModel.getMyChairID());
			if (myScore - score < 0) {
				AssetsManager.tipDialog('下注不能超过自己拥有的金币!');
				return;
			}
		}
		ApiRoom.gameMessageNotify(ApiSz.gamePourScoreNotify(score, 2));
		this.addScoreList.destroyAllChildren();
		// this.node.active = false;
	},

	onShowAddBtnsClick() {
		this.unscheduleAllCallbacks();
		this.addScoreList.destroyAllChildren();
		let gameRule = SZModel.getGameRule();
		let maxLimitScore = gameRule.baseScore * gameRule.maxScore;
		let score = SZModel.getCurScore(),
			baseScore = gameRule.baseScore,
			minScore = 0,
			maxScore = 0;
		//先算出最大值 和最小值区间
		if (SZModel.getLookCardByChairID(SZModel.getMyChairID())) {
			minScore = Math.floor(score);
			maxScore = Math.floor(maxLimitScore);
		} else {
			minScore = Math.floor(score / 2 <= gameRule.baseScore ? gameRule.baseScore : score / 2); //最低闷注量
			maxScore = Math.floor(maxLimitScore / 2); //最高闷注量
		}
		// 计算组合
		minScore = minScore + baseScore;
		baseScore = baseScore % 2 == 0 ? baseScore : baseScore + 1;
		let addScores = [];
		for (let index = 0; index < 4; index++) {
			let addScore = minScore + baseScore * index;
			addScore = addScore % 2 == 0 ? addScore : addScore + 1;
			if (addScore > maxScore) addScore = maxScore;
			if (index == 3 && addScore <= maxScore) addScore = maxScore;
			addScores.push(addScore);
			if (addScore >= maxScore) break;
		}
		addScores.sort((a, b) => {
			return b - a;
		})
		for (const item of addScores) {
			let addNode = cc.instantiate(this.addScorePrefab);
			this.addScoreList.addChild(addNode);
			addNode.getComponent('SZAddScore').bind(this, item);
		}
	},

	_arrFilter(data) {
		return data.filter(function (item, index, data) {
			// 从数组0位开始查，如果当前元素在原始数组中的第一个索引==当前索引值，说明它是第一次出现。
			return data.indexOf(item, 0) === index;
		});
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
	},
});