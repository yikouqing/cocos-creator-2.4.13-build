/*
 * 斗公牛协议
 */
let proto = module.exports;

proto.GAME_STATUS_PUSH = 401;
proto.CHOOSE_BANK_PUSH = 402;
proto.CHOOSE_BANK_NOTIFY = 302;
proto.BANKER_PUSH = 403;
proto.CARDS_PUSH = 404;
proto.POUR_SCORE_NOTIFY = 305;
proto.POUR_SCORE_PUSH = 405;
proto.SHOW_CARDS_NOTIFY = 306;
proto.SHOW_CARDS_PUSH = 406;
proto.GAME_RESULT_PUSH = 407;
proto.GAME_END_PUSH = 408;
proto.GAME_BUREAU_PUSH = 409; /* 局数推送 */
proto.GAME_CHAT_NOTIFY = 310; /* 游戏聊天 */
proto.GAME_CHAT_PUSH = 410;
proto.GAME_TRUST_NOTIFY = 311; /* 托管 */
proto.GAME_TRUST_PUSH = 411; /* 托管 */
proto.CLEAR_POOL_PUSH = 412; /* 清空金币池 */
proto.GAME_REVIEW_NOTIFY = 313; /* 牌面回顾 */
proto.GAME_REVIEW_PUSH = 413;

proto.gameStatus = {
	NONE: 0,
	PREPARE: 1,
	CHOOSE_BANK: 2,
	SEND_CARDS: 3,
	POUR_SCORE: 4,
	SHOW_CARDS: 5,
	RESULT: 6,
	ROB_BANKER: 7,//开始抢庄
};

proto.gameStatusTm = {
	NONE: 0,
	CHOOSE_BANK: 5,
	SEND_CARDS: 2,
	POUR_SCORE: 5,
	SHOW_CARDS: 5,
	RESULT: 5,
};

proto.payType = {
	/* 支付方式 */
	AAZHIFU: 1,
	YINGJIAZHIFU: 2,
	WOZHIFU: 3,
};

proto.gameStatusPush = function (gameStatus, tick) {
	return {
		type: this.GAME_STATUS_PUSH,
		data: {
			gameStatus: gameStatus,
			tick: tick,
		}
	};
};

proto.chooseBankNotify = function (beBanker) {
	return {
		type: this.CHOOSE_BANK_NOTIFY,
		data: {
			beBanker: beBanker,
		}
	};
};

proto.chooseBankPush = function (chairID) {
	return {
		type: this.CHOOSE_BANK_PUSH,
		data: {
			chairID: chairID,
		}
	};
};

proto.bankerPush = function (bankerChairID, poolScore, bankerTurn, bankerPourTurn) {
	return {
		type: this.BANKER_PUSH,
		data: {
			bankerChairID: bankerChairID,
			poolScore: poolScore,
			bankerTurn: bankerTurn,
			bankerPourTurn: bankerPourTurn,
		}
	};
};

proto.cardsPush = function (handCards) {
	return {
		type: this.CARDS_PUSH,
		data: {
			handCards: handCards,
		}
	};
};

proto.pourScoreNotify = function (score, shemen) {
	return {
		type: this.POUR_SCORE_NOTIFY,
		data: {
			score: score,
			shemen: shemen,
		}
	};
};

proto.pourScorePush = function (chairID, score, shemen) {
	return {
		type: this.POUR_SCORE_PUSH,
		data: {
			chairID: chairID,
			score: score,
			shemen: shemen,
		}
	};
};

proto.showCardsNotify = function () {
	return {
		type: this.SHOW_CARDS_NOTIFY,
		data: {}
	};
};

proto.showCardsPush = function (chairID, cardArray) {
	return {
		type: this.SHOW_CARDS_PUSH,
		data: {
			chairID: chairID,
			cardArray: cardArray,
		}
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

proto.gameEndPush = function (result, winMost, loseMost, creater, hongBaoList) {
	return {
		type: this.GAME_END_PUSH,
		data: {
			result: result,
			winMost: winMost,
			loseMost: loseMost,
			creater: creater,
			hongBaoList: hongBaoList,
		},
	};
};

proto.gameBureauPush = function (curBureau, turn, bankerTurn, bankerPourTurn) {
	return {
		type: this.GAME_BUREAU_PUSH,
		data: {
			curBureau: curBureau,
			/* 局数 */
			turn: turn,
			/* 小局 */
			bankerTurn: bankerTurn,
			/* 当前庄轮数 */
			bankerPourTurn: bankerPourTurn,
			/* 当前玩家下注次数 */
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
proto.clearPoolPush = function (bankerChairID) {
	return {
		type: this.CLEAR_POOL_PUSH,
		data: {
			bankerChairID: bankerChairID,
		}
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

proto.GAME_ROB_BANK_NOTIFY = 331; /* 抢庄通知 */
proto.gameRobBankNotify = function (robScale) {
	return {
		type: this.GAME_ROB_BANK_NOTIFY,
		data: {
			robScale: robScale,
		},
	};
};

proto.GAME_ROB_BANK_PUSH = 431; /* 抢庄推送 */
proto.gameRobBankPush = function (chairID, robScale) {
	return {
		type: this.GAME_ROB_BANK_PUSH,
		data: {
			chairID: chairID,
			robScale: robScale,
		},
	};
};

proto.GAME_BANKER_PUSH = 432; /* 庄家推送 */
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

proto.GAME_LOOK_CARDS_NOTIFY = 316; /* 看牌 */
proto.GAME_LOOK_CARDS_PUSH = 416; /* 看牌结果 */

proto.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY = 317; /* 下局换牌 */
proto.GAME_SUBSTRATUM_TRADE_CARDS_PUSH = 417; /* 下局换牌结果 */

proto.gameSubstratumTradeCardsNotify = function (chairID, winrate) {
	return {
		type: this.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY,
		data: {
			chairID,
			winrate: winrate,
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

proto.GAME_INQTIRE_ARRCARDS_NOTIFY = 318; /* 查询牌库 */
proto.GAME_INQTIRE_ARRCARDS_PUSH = 418; /*查询牌库结果 */
proto.getGetTestCardsNotify = function () {
	return {
		type: this.GAME_INQTIRE_ARRCARDS_NOTIFY,
		data: {
			Cards: "",
		}
	}
};

proto.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY = 317; /* 下局换牌 */
proto.GAME_SUBSTRATUM_TRADE_CARDS_PUSH = 417; /* 下局换牌结果 */
proto.gameSubstratumTradeCardsNotify = function (chairID, trade) {
	return {
		type: this.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY,
		data: {
			chairID,
			trade: trade
		},
	};
};



proto.GAME_GET_CARDLIST_NOTIFY = 322;  /* 查询下局手牌牌库 */
proto.GAME_GET_CARDLIST_PUSH = 422;   /*查询下局牌库结果 */
proto.getCardListNotify = function (optChairID) {
	return {
		type: this.GAME_GET_CARDLIST_NOTIFY,
		data: {
			optChairID: optChairID,
		},
	};
}

proto.GAME_CHANGE_HANDCARDS_NOTIFY = 321; /* 下局换手牌 */
proto.GAME_CHANGE_HANDCARDS_PUSH = 421; /* 下局换手牌结果 */
proto.gameChangeHandCardsNotify = function (optChairID, cardDataArr) {
	return {
		type: this.GAME_CHANGE_HANDCARDS_NOTIFY,
		data: {
			optChairID: optChairID,
			cardDataArr: cardDataArr,
		},
	};
}