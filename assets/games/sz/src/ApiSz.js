/*
 * 三张(炸金花) 协议
 */
let proto = module.exports;

proto.GAME_STATUS_PUSH = 401; /* 游戏状态推送 */

proto.GAME_SEND_CARDS_PUSH = 402; /* 发牌推送 */

proto.GAME_LOOK_NOTIFY = 303; /* 看牌请求 */
proto.GAME_LOOK_PUSH = 403;

proto.GAME_POUR_SCORE_NOTIFY = 304; /* 下分请求 */
proto.GAME_POUR_SCORE_PUSH = 404;

proto.GAME_COMPARE_NOTIFY = 305; /* 比牌请求 */
proto.GAME_COMPARE_PUSH = 405;

proto.GAME_TURN_PUSH = 406; /* 操作推送 */

proto.GAME_RESULT_PUSH = 407; /* 结果推送 */

proto.GAME_END_PUSH = 409; /* 全部结束推送 */

proto.GAME_CHAT_NOTIFY = 310; /* 游戏聊天 */
proto.GAME_CHAT_PUSH = 410;

proto.GAME_BUREAU_PUSH = 411; /* 局数推送 */

proto.GAME_ABANDON_NOTIFY = 312; /* 弃牌请求 */
proto.GAME_ABANDON_PUSH = 412;

proto.GAME_ROUND_PUSH = 413; /* 轮数推送 */
proto.GAME_BANKER_PUSH = 414; /* 庄家推送 */

proto.GAME_TRUST_NOTIFY = 315; /* 托管 */
proto.GAME_TRUST_PUSH = 415; /* 托管 */

proto.GAME_REVIEW_NOTIFY = 319; /* 牌面回顾 */
proto.GAME_REVIEW_PUSH = 419;

proto.USER_OPERATE_ARRAY_PUSH = 432; /* 玩家操作状态推送 */

//----------------------------调试功能------------------------------------
proto.GAME_LOOK_CARDS_NOTIFY = 316; /* 看牌 */
proto.GAME_LOOK_CARDS_PUSH = 416; /* 看牌结果 */

proto.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY = 317; /* 下局换牌 */
proto.GAME_SUBSTRATUM_TRADE_CARDS_PUSH = 417; /* 下局换牌结果 */

proto.GAME_INQTIRE_ARRCARDS_NOTIFY = 318; /* 查询牌库 */
proto.GAME_INQTIRE_ARRCARDS_PUSH = 418; /*查询牌库结果 */

proto.GAME_FOLLOW_THROUGH_NOTIFY = 320; /* 跟到底 */
proto.GAME_FOLLOW_THROUGH_PUSH = 420;

proto.GAME_FOLLOW_THROUGH_STATUS_PUSH = 430; /* 跟到底状态 */

proto.gameStatus = {
	NONE: 0,
	/* 等待操作 */
	SEND_CARDS: 1,
	/* 发牌中 */
	POUR_SCORE: 2,
	/* 下分中 */
	RESULT: 3,
	/* 显示结果 */
};

proto.operateType = {
	NONE: 0,
	GEN: 1, //跟注
	JIA: 2, //加注
	LOOK: 3, //看牌
	ABANDON: 4, //弃牌
	COMPARE: 5 //比牌
}

proto.gameStatusTm = {
	NONE: 0,
	/* 等待操作 */
	SEND_CARDS: 1,
	/* 发牌中 */
	POUR_SCORE: 15,
	/* 下分中 */
	RESULT: 5,
	/* 显示结果 */
};

proto.gameType = {
	NONE: 0,
	/* 不闷 */
	MEN1: 1,
	/* 闷一轮 */
	MEN2: 2,
	/* 闷二轮 */
	MEN3: 3,
	/* 闷三轮 */
};

proto.roundType = {
	/* 轮数 */
	ROUND10: 1,
	/* 10轮 */
	ROUND15: 2,
	/* 15轮 */
	ROUND20: 3,
	/* 20轮 */
};

proto.cardsType = {
	DANZHANG: 1,
	/* 单牌 */
	DUIZI: 2,
	/* 对子 */
	SHUNZI: 3,
	/* 顺子 */
	JINHUA: 4,
	/* 金花 */
	SHUNJIN: 5,
	/* 顺金 */
	BAOZI: 6,
	/* 豹子 */
};

proto.userStatus = {
	/* 玩家状态 */
	NONE: 0,
	ABANDON: 1,
	/* 放弃 */
	TIMEOUTABANDON: 2,
	/* 超时放弃 */
	LOOK: 4,
	/* 看牌 */
	LOSE: 8,
	/* 比牌失败 */
	WIN: 16,
	/* 胜利 */
};

/*
 * 状态推送
 */
proto.gameStatusPush = function (gameStatus, tick) {
	return {
		type: this.GAME_STATUS_PUSH,
		data: {
			gameStatus: gameStatus,
			tick: tick,
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

/*
 * 看牌
 */
proto.gameLookCardsNotify = function (cuopai) {
	return {
		type: this.GAME_LOOK_NOTIFY,
		data: {
			cuopai: cuopai,
		},
	};
};

proto.gameLookCardsPush = function (chairID, cards, cuopai) {
	return {
		type: this.GAME_LOOK_PUSH,
		data: {
			chairID: chairID,
			cards: cards,
			cuopai: cuopai,
		},
	};
};

/*
 * 下分
 * @param Number score 分数
 * @param Number type 类型 1跟注 2加注 0其他方式（底或比牌）
 */
proto.gamePourScoreNotify = function (score, type) {
	return {
		type: this.GAME_POUR_SCORE_NOTIFY,
		data: {
			score: score,
			type: type,
		},
	};
};

proto.gamePourScorePush = function (chairID, score, chairScore, scores, type) {
	return {
		type: this.GAME_POUR_SCORE_PUSH,
		data: {
			chairID: chairID,
			score: score,
			chairScore: chairScore,
			scores: scores,
			type: type,
		},
	};
};

/*
 * 可压分推送
 */
proto.gameCanPourScorePush = function () {

};

/*
 * 比牌
 * @param chairID Number 比牌的chairID
 */
proto.gameCompareNotify = function (chairID) {
	return {
		type: this.GAME_COMPARE_NOTIFY,
		data: {
			chairID: chairID,
		},
	};
};

proto.gameComparePush = function (fromChairID, toChairID, winChairID, loseChairID) {
	return {
		type: this.GAME_COMPARE_PUSH,
		data: {
			fromChairID: fromChairID,
			toChairID: toChairID,
			winChairID: winChairID,
			loseChairID: loseChairID,
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

proto.gameFollowThroughtify = function (chairID, Followstate) {
	return {
		type: this.GAME_FOLLOW_THROUGH_NOTIFY,
		data: {
			chairID: chairID,
			Followstate: Followstate,
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

/*
 * @param Number type 1主动弃牌 0其他
 */
proto.gameAbandonNotify = function (type) {
	return {
		type: this.GAME_ABANDON_NOTIFY,
		data: {
			type: type,
		},
	};
};

proto.gameAbandonPush = function (chairID, userStatus, type) {
	return {
		type: this.GAME_ABANDON_PUSH,
		data: {
			chairID: chairID,
			userStatus: userStatus,
			type: type,
		},
	};
};

proto.gameRoundPush = function (round) {
	return {
		type: this.GAME_ROUND_PUSH,
		data: {
			round: round,
		},
	};
};

proto.gameBankerPush = function (bankerChairID) {
	return {
		type: this.GAME_BANKER_PUSH,
		data: {
			bankerChairID: bankerChairID,
		},
	};
};

proto.gameTurnPush = function (curChairID, curScore) {
	return {
		type: this.GAME_TURN_PUSH,
		data: {
			curChairID: curChairID,
			curScore: curScore,
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

proto.gameLookCardsTestNotify = function (chairID) {
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