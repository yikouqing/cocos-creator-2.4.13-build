/*
 * 牛牛协议
 */
let proto = module.exports;

proto.GAME_ROB_BANK_NOTIFY = 301; /* 抢庄通知 */
proto.GAME_ROB_BANK_PUSH = 401; /* 抢庄推送 */

proto.GAME_BANKER_PUSH = 402; /* 庄家推送 */

proto.GAME_POUR_SCORE_NOTIFY = 303; /* 下分通知 */
proto.GAME_POUR_SCORE_PUSH = 403; /* 下分推送 */


proto.GAME_SHOW_CARDS_NOTIFY = 304; /* 亮牌通知 */
proto.GAME_SHOW_CARDS_PUSH = 404; /* 亮牌推送 */


proto.GAME_STATUS_PUSH = 405; /* 游戏状态推送 */
proto.GAME_RESULT_PUSH = 406; /* 游戏结果推送 */
proto.GAME_SEND_CARDS_PUSH = 407; /* 发牌推送 */
proto.GAME_BUREAU_PUSH = 408; /* 局数推送 */
proto.GAME_END_PUSH = 409; /* 游戏结束推送 */

proto.GAME_CHAT_NOTIFY = 310; /* 游戏聊天 */
proto.GAME_CHAT_PUSH = 410;

proto.GAME_TRUST_NOTIFY = 311; /* 托管 */
proto.GAME_TRUST_PUSH = 411; /* 托管 */

proto.GAME_REVIEW_NOTIFY = 312; /* 牌面回顾 */
proto.GAME_REVIEW_PUSH = 412;

proto.gameStatus = {
	NONE: 0,
	/* 等待操作 */
	ROB_BANK: 1,
	/* 抢庄中 */
	POUR_SCORE: 2,
	/* 下分中 */
	SEND_CARDS: 3,
	/* 发牌中 */
	SHOW_CARDS: 4,
	/* 选择亮牌 */
	RESULT: 5,
	/* 显示结果 */
};

proto.gameStatusTm = {
	NONE: 0,
	/* 等待操作 */
	ROB_BANK: 15,
	/* 抢庄中 */
	POUR_SCORE: 15,
	/* 下分中 */
	SEND_CARDS: 1,
	/* 发牌中 */
	SHOW_CARDS: 15,
	/* 选择亮牌 */
	RESULT: 5,
	/* 显示结果 */
};

proto.gameType = {
	QIANGZHUANG: 1,
	/* 抢庄 */
	DACHIXIAOZHUANG: 2,
	/* 大吃小 */
	BAWANGZHUANG: 3,
	/* 霸王庄 */
	LUNZHUANG: 4,
	/* 轮庄 */
	SANGONGZHUANG: 5,
	/* 三公坐庄 */
	PAIDAZHUANG: 6,
	/* 牌大坐庄 */
};

proto.gameTypeMode = ['QIANGZHUANG', 'DACHIXIAOZHUANG', 'BAWANGZHUANG', 'LUNZHUANG', 'SANGONGZHUANG', 'PAIDAZHUANG'];

proto.cardsType = {
	ZHENGCHANG: 1,
	/* 没公 */
	SANGONG: 4,
	/* 三公 */
	BAOZI: 5,
	/* 豹子 */
};

proto.sendCardType = {
	QUANAN: 1,
	/* 全暗 */
	MING1AN2: 2,
	/* 明1暗2 */
	MING2AN1: 3,
	/* 明2暗1 */
};

proto.scaleType = {
	/* 翻倍规则 */
	BIG: 1,
	/* 8点2倍9点3倍三公4倍豹子5倍 */
	LITTLE: 2,
	/* 平赔 */
};


proto.gameRobBankNotify = function (robScale) {
	return {
		type: this.GAME_ROB_BANK_NOTIFY,
		data: {
			robScale: robScale,
		},
	};
};

proto.gameRobBankPush = function (chairID, robScale) {
	return {
		type: this.GAME_ROB_BANK_PUSH,
		data: {
			chairID: chairID,
			robScale: robScale,
		},
	};
};

proto.gameBankerPush = function (bankerChairID, robScale, robChairIDs) {
	return {
		type: this.GAME_BANKER_PUSH,
		data: {
			bankerChairID: bankerChairID,
			robScale: robScale,
			robChairIDs: robChairIDs,
		},
	};
};

proto.gamePourScoreNotify = function (score) {
	return {
		type: this.GAME_POUR_SCORE_NOTIFY,
		data: {
			score: score,
		},
	};
};

proto.gamePourScorePush = function (chairID, score) {
	return {
		type: this.GAME_POUR_SCORE_PUSH,
		data: {
			chairID: chairID,
			score: score,
		},
	};
};

proto.gameShowCardsNotify = function () {
	return {
		type: this.GAME_SHOW_CARDS_NOTIFY,
		data: {},
	};
};

proto.gameShowCardsPush = function (chairID, cards, cuopai) {
	return {
		type: this.GAME_SHOW_CARDS_PUSH,
		data: {
			chairID: chairID,
			cards: cards,
			cuopai: cuopai,
		},
	};
};

proto.gameStatusPush = function (gameStatus, tick) {
	return {
		type: this.GAME_STATUS_PUSH,
		data: {
			gameStatus: gameStatus,
			tick: tick,
		},
	};
};

proto.gameResultPush = function (result) {
	return {
		type: this.GAME_RESULT_PUSH,
		data: {
			result: result,
		},
	};
};

proto.gameSendCardPush = function (handCards) {
	return {
		type: this.GAME_SEND_CARDS_PUSH,
		data: {
			handCards: handCards,
		},
	};
};

proto.gameBureauPush = function (curBureau) {
	return {
		type: this.GAME_BUREAU_PUSH,
		data: {
			curBureau: curBureau,
		},
	};
};

proto.gameEndPush = function (result, winMost, loseMost, creater) {
	return {
		type: this.GAME_END_PUSH,
		data: {
			result: result,
			winMost: winMost,
			loseMost: loseMost,
			creater: creater,
		},
	};
};

proto.gameChatNotify = function (type, msg, recipientID) {
	return {
		type: this.GAME_CHAT_NOTIFY,
		data: {
			type: type,
			msg: msg,
			recipientID: recipientID,
		},
	};
};

proto.gameChatPush = function (chairID, type, msg, recipientID) {
	return {
		type: this.GAME_CHAT_PUSH,
		data: {
			chairID: chairID,
			type: type,
			msg: msg,
			recipientID: recipientID,
		},
	};
};

proto.gameTrushNotify = function (trust) {
	return {
		type: this.GAME_TRUST_NOTIFY,
		data: {
			trust: trust,
		},
	};
};

proto.gameTrushPush = function (chairID, trust) {
	return {
		type: this.GAME_TRUST_PUSH,
		data: {
			chairID: chairID,
			trust: trust,
		},
	};
};

proto.gameReviewNotify = function () {
	return {
		type: this.GAME_REVIEW_NOTIFY,
		data: {},
	};
};

proto.gameReviewPush = function (list) {
	return {
		type: this.GAME_REVIEW_PUSH,
		data: {
			list: list,
		},
	};
};

proto.GAME_LOOK_CARDS_NOTIFY = 316; /* 看牌 */
proto.GAME_LOOK_CARDS_PUSH = 416; /* 看牌结果 */

proto.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY = 317; /* 下局换牌 */
proto.GAME_SUBSTRATUM_TRADE_CARDS_PUSH = 417; /* 下局换牌结果 */

proto.gameSubstratumTradeCardsNotify = function (chairID, winrate) {
	return {
		type: this.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY,
		data: {
			chairID,
			winrate: {
				type: type,//设置类型0>玩家胜率 1>玩家手牌
				uid: this._uid,//被操作人
				winrate: winrate,//胜率
				Cards: this._selectedList,//牌数据
				opUid: SGModel.getMyUid(),//操作人
			},
		},
	};
};

proto.gameLookCardsNotify = function (chairID) {
	return {
		type: this.GAME_LOOK_CARDS_NOTIFY,
		data: {
			chairID: chairID
		},
	};
};

proto.gameLookCardsPush = function (userArray) {
	return {
		type: this.GAME_LOOK_CARDS_PUSH,
		data: {
			userArray: userArray,
		},
	};
};

proto.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY = 317; /* 下局换牌 */
proto.GAME_SUBSTRATUM_TRADE_CARDS_PUSH = 417; /* 下局换牌结果 */
proto.GAME_INQTIRE_ARRCARDS_PUSH = 418; /*查询牌库结果 */
proto.GAME_INQTIRE_ARRCARDS_NOTIFY = 318; /* 查询牌库 */
proto.getGetTestCardsNotify = function () {
	return {
		type: this.GAME_INQTIRE_ARRCARDS_NOTIFY,
		data: {
			Cards: "",
		}
	}
};


proto.gameSubstratumTradeCardsNotify = function (chairID, winrate) {
	return {
		type: this.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY,
		data: {
			chairID,
			trade: winrate,
		},
	};
};
