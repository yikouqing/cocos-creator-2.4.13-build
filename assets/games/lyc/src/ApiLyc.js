/*分
 * 捞腌菜协议
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

proto.GAME_POUR_SCORE_START_PUSH = 413; /* 开始选择倍数推送 */


proto.GAME_USER_OPERATE_NOTIFY = 314; /* 开始操作推送 */
proto.GAME_USER_OPERATE_PUSH = 414; /* 开始操作推送 */


proto.GAME_USER_OPERATE_START_PUSH = 415; /* 开始操作推送 */

proto.GAME_LOOK_CARDS_NOTIFY = 316; /* 看牌 */
proto.GAME_LOOK_CARDS_PUSH = 416; /* 看牌结果 */

proto.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY = 317; /* 下局换牌 */
proto.GAME_SUBSTRATUM_TRADE_CARDS_PUSH = 417; /* 下局换牌结果 */


proto.GAME_INQTIRE_ARRCARDS_NOTIFY = 319; /* 查询牌库 */
proto.GAME_INQTIRE_ARRCARDS_PUSH = 419; /*查询牌库结果 */

proto.GAME_COMPARE_NOTIFY = 320; /* 比牌请求 */
proto.GAME_COMPARE_PUSH = 420;




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
	/* 捞牌 炸等 */
	CHOOSE_OPERATE: 6,
	BANKER_BOOM: 7 //庄家炸牌阶段
};

proto.gameStatusTm = {
	/* 等待操作 */
	NONE: 0,
	/* 抢庄中 */
	ROB_BANK: 15,
	/* 捞牌 炸等时间 */
	CHOOSE_OPERATE: 15,
	/* 下分中 */
	POUR_SCORE: 15,
	/* 发牌中 */
	SEND_CARDS: 1,
	/* 选择亮牌 */
	SHOW_CARDS: 15,
	/* 显示结果 */
	RESULT: 5,
};

//游戏操作
proto.operateType = {
	PULL: 1, //捞牌
	CANCEL: 2, //取消
	BOOM: 3, //炸
	UNBOOM: 4, //不炸
}

//牌型
proto.cardType = {
	SHANGYAN: 11, //双腌
	SANYAN: 12, //三腌
	WUYAN: 13, //五腌
	SHIYAN: 14, //十腌
}

//双腌倍数
proto.SHUANGYANTIMES = 2;
//三腌倍数
proto.SANYANTIMES = 3;

//通知玩家开始下注 包括走水 码宝等新 413
proto.gamePourScoreStartPush = function (chairID, basePour, zouShui = -1, maBao = -1) {
	return {
		type: this.GAME_POUR_SCORE_START_PUSH,
		data: {
			chairID,
			basePour,
			zouShui,
			maBao
		},
	};
};

//玩家具体操作广播414 operateInfo = {operateType,chairID,pullCard,boomCards}
proto.gameUserOperatePush = function (chairID, operateInfo) {
	return {
		type: this.GAME_USER_OPERATE_PUSH,
		data: {
			chairID: chairID,
			operateInfo: operateInfo,
		},
	};
};

/**玩家操作推送 314*/
proto.gameUserOperateNotify = function (operateType) {
	return {
		type: this.GAME_USER_OPERATE_NOTIFY,
		data: {
			operateType: operateType,
		},
	};
}

//推送玩家可操作按钮415
proto.gameUserOperateStartPush = function (chairID, tick, pullCard, cancel = true, boom = false, unBoom = false) {
	return {
		type: this.GAME_USER_OPERATE_START_PUSH,
		data: {
			chairID: chairID,
			pullCard: pullCard, //捞牌
			cancel: cancel, //不捞
			boom: boom, //炸开
			unBoom: unBoom, //不炸
			tick: tick, //倒计时
		},
	};
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

//userCardType  0-9 为点数 11 双眼 12 三腌菜
proto.gameResultPush = function (result) {
	return {
		type: this.GAME_RESULT_PUSH,
		data: {
			winScores,
			userCards,
			userRate,
			userCardType,
			curScores,
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

proto.gameSubstratumTradeCardsNotify = function (chairID, cardData) {
	return {
		type: this.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY,
		data: {
			optChairID: chairID,
			cardData: cardData,
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

proto.gameInqtireArrcardsNotify = function (chairID) {
	return {
		type: this.GAME_INQTIRE_ARRCARDS_NOTIFY,
		data: {
			optChairID: chairID,
		},
	};
};

proto.gameireArrcardsPush = function (chairID, cardDataArr, cardData) {
	return {
		type: this.GAME_INQTIRE_ARRCARDS_PUSH,
		data: {
			chairID: chairID,
			cardDataArr: cardDataArr,
			cardData: cardData,
		},
	};
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

proto.gameComparePush = function (fromChairID, toChairID, winChairID, toHandCards) {
	return {
		type: this.GAME_COMPARE_PUSH,
		data: {
			fromChairID: fromChairID,
			toChairID: toChairID,
			winChairID: winChairID,
			toHandCards: toHandCards,
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