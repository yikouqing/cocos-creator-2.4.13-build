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

proto.GAME_TUI_ARR_PUSH = 413; /* 推注 推送 */

proto.GAME_RUFFIAN_RECORD_PUSH = 414; //癞子消息推送 这个消息在亮牌消息过后推送,

proto.GAME_TRADERUFFIAN_PUSH = 415; //发牌癞子推送 这个消息在发牌过后推送

proto.GAME_LOOK_CARDS_NOTIFY = 316; /* 看牌 */
proto.GAME_LOOK_CARDS_PUSH = 416; /* 看牌结果 */

proto.GAME_INQTIRE_ARRCARDS_NOTIFY = 318; /* 查询牌库 */
proto.GAME_INQTIRE_ARRCARDS_PUSH = 418; /*查询牌库结果 */

proto.GAME_OPERATE_CARDS_NOTIFY = 330; //操作牌
proto.GAME_OPERATE_CARDS_PUSH = 430; //操作牌推送

proto.GAME_END_POUR_SCORE_PUSH = 419; /* 下分结束推送 */

proto.GAME_END_TYPE_CARDS_PUSH = 420; /* 结算牛牛牌型推送 */

proto.gameStatus = {
	/* 等待操作 */
	NONE: 0,
	/* 抢庄中 */
	ROB_BANK: 1,
	/* 下分中 */
	POUR_SCORE: 2,
	/* 发牌中 */
	SEND_CARDS: 3,
	/* 选择亮牌 */
	SHOW_CARDS: 4,
	/* 显示结果 */
	RESULT: 5,
	OPERATE_CARDS: 6,
};

proto.gameStatusTm = {
	/* 等待操作 */
	NONE: 0,
	/* 抢庄中 */
	ROB_BANK: 10,
	/* 下分中 */
	POUR_SCORE: 10,
	/* 发牌中 */
	SEND_CARDS: 1,
	/* 选择亮牌 */
	SHOW_CARDS: 10,
	/* 显示结果 */
	RESULT: 5,
	OPERATE_CARDS: 15,
};

proto.payType = {
	/* 支付方式 */
	AAZHIFU: 1,
	YINGJIAZHIFU: 2,
	WOZHIFU: 3,
};

proto.ruffianType = {
	/* 无 */
	WU: 1,
	/* 王癞 */
	WANGLAI: 2,
	/* 随机赖 */
	SHUIJILAI: 3,
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

proto.gameTuiArrPush = function (tuiArr) {
	return {
		type: this.GAME_TUI_ARR_PUSH,
		data: {
			tuiArr: tuiArr,
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

proto.gameShowCardsNotify = function (cuopai) {
	return {
		type: this.GAME_SHOW_CARDS_NOTIFY,
		data: {
			cuopai: cuopai,
		},
	};
};

proto.gameShowCardsPush = function (chairID, cards, ends, cuopai) {
	return {
		type: this.GAME_SHOW_CARDS_PUSH,
		data: {
			chairID: chairID,
			cards: cards,
			ends: ends,
			cuopai: cuopai,
		},
	};
};

proto.gameruffianRecordPush = function (chairID, cards, record, cuopai) {
	return {
		type: this.GAME_RUFFIAN_RECORD_PUSH,
		data: {
			chairID: chairID,
			cards: cards,
			record: record,
			endCards: endCards,
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

proto.gameSendCardPush = function (handCards, endCards, ruffianRecord) {
	return {
		type: this.GAME_SEND_CARDS_PUSH,
		data: {
			handCards: handCards,
			endCards: endCards,
			ruffianRecord: ruffianRecord,
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

proto.gameTuiArrPush = function (tuiArr) {
	return {
		type: this.GAME_TUI_ARR_PUSH,
		data: {
			tuiArr: tuiArr,
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

proto.gameTraderuffianPush = function (cards) {
	return {
		type: this.GAME_TRADERUFFIAN_PUSH,
		data: {
			//数据结构 与位置对应  [false, false, false, false, false, false, false, false, false, false];
			cards: cards,
		},
	};
};

//操作牌
proto.gameOperateCardsNotify = function (cardDataArr) {
	return {
		type: this.GAME_OPERATE_CARDS_NOTIFY,
		data: {
			cardDataArr: cardDataArr,
		},
	};
};
//操作牌推送
proto.gameOperateCardsPush = function (chairID, cards, ends) {
	return {
		type: this.GAME_OPERATE_CARDS_PUSH,
		data: {
			chairID: chairID,
			cards: cards,
			ends: ends,
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
