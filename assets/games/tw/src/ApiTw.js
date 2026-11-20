var proto = module.exports;

proto.enumRule = {
	youSanChuan: 1,
	heiTaoA: 2,
	caoShi: 4,
	roomOwnerPay: 8,
	allPlayerPay: 16,
	bureau6: 32,
	bureau12: 64,
	bureau18: 128
};

proto.gameStatus = {
	/* 等待操作 */
	NONE: 0,
	/* 抢庄中 */
	ROB_BANK: 1,
	/* 洗牌中 */
	WASH_CARD: 2,
	/* 发牌中 */
	SEND_CARDS: 3,
	BAI_PAI: 4,
	/* 选择亮牌 */
	BAI_PAIOK: 5,
	/* 显示结果 */
	RESULT: 6,
};

proto.gameStatusTm = {
	NONE: 0,
	/* 等待操作 */
	ROB_BANK: 10,
	/* 抢庄中 */
	POUR_SCORE: 10,
	/* 下分中 */
	SEND_CARDS: 1,
	/* 发牌中 */
	BAI_PAI: 90,
	BAI_PAIOK: 1,
	/* 选择亮牌 */
	RESULT: 5,
	/* 显示结果 */
};

proto.code = {
	'1': '非法请求数据'
};

proto.GAME_ROB_BANK_NOTIFY = 301; /* 抢庄通知 */
proto.GAME_ROB_BANK_PUSH = 401; /* 抢庄推送 */

proto.GAME_BANKER_PUSH = 402; /* 庄家推送 */

proto.GAME_POUR_SCORE_NOTIFY = 303; /* 下分通知 */
proto.GAME_POUR_SCORE_PUSH = 403; /* 下分推送 */


proto.GAME_SHOW_CARDS_NOTIFY = 304; /* 亮牌通知 */
proto.GAME_SHOW_CARDS_PUSH = 404; /* 亮牌推送 */

proto.GAME_CARDS_NOSORT_NOTIFY = 300; /*免摆通知 */
proto.GAME_CARDS_NOSORT_PUSH = 400; /* 免摆推送 */


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

proto.GAME_SHOWRESULT_PUSH = 413;

proto.mapaiType = {
	NONE: 0,
	/* 无马牌 */
	MEN1: 1,
	/* 红桃1 */
	MEN2: 2,
	/* 红桃5 */
	MEN3: 3,
	/* 红桃10 */
};

proto.wangpaiType = {
	/* 无鬼牌 */
	NONE: 0,
	/* 1张龟牌 */
	MEN1: 1,
	/* 2张鬼牌 */
	MEN2: 2,
	/* 3张鬼牌 */
	MEN3: 3,
	/* 4张鬼牌 */
	MEN3: 4,
};

proto.wanfa = {
	NONE: 0,
	/*经典*/
	ZHUANG: 1,
	/*抢庄*/
	FENGKUANG: 2 /*疯狂*/
};
proto.jifen = {
	NONE: 0,
	/*打枪*2 */
	JIA1: 1 /*打枪+1 */
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

proto.gameStatusPush = function (gameStatus, tick) {
	return {
		type: this.GAME_STATUS_PUSH,
		data: {
			gameStatus: gameStatus,
			tick: tick,
		},
	};
};

/* 推送游戏牌数据 */
proto.getGameCardsPushData = function (cardsArr, playingChairArr) {
	return {
		type: this.GAME_SEND_CARDS_PUSH,
		data: {
			cardsArr: cardsArr,
			playingChairArr: playingChairArr
		}
	};
};

proto.getGameCardsSortRequestData = function (cardArr, tm) {
	return {
		type: this.GAME_SHOW_CARDS_NOTIFY,
		data: {
			cardArr: cardArr,
			tm: tm
		}
	};
};

proto.getGameCardsSortPushData = function (code, chairId, cardArr) {
	return {
		type: this.GAME_SHOW_CARDS_PUSH,
		code: code,
		data: {
			chairId: chairId,
			cardArr: cardArr
		}
	};
};

proto.getGameResoutPushData = function (resout, gameStatus) {
	return {
		type: this.GAME_RESULT_PUSH,
		data: {
			resout: resout,
			gameStatus: gameStatus
		}
	};
};

proto.getGameEndPushData = function (resout) {
	return {
		type: this.GAME_END_PUSH,
		data: {
			resout: resout
		}
	};
};

proto.getGameNosortRequestData = function (isNosort, tm) {
	return {
		type: this.GAME_CARDS_NOSORT_NOTIFY,
		data: {
			isNosort: isNosort,
			tm: tm
		}
	};
};

proto.getGameNosortPushData = function (chairId, isNosort) {
	return {
		type: this.GAME_CARDS_NOSORT_PUSH,
		data: {
			chairId: chairId,
			isNosort: isNosort
		}
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

proto.gameBureauPush = function (curBureau) {
	return {
		type: this.GAME_BUREAU_PUSH,
		data: {
			curBureau: curBureau,
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

proto.gamePourScoreNotify = function (score) {
	return {
		type: this.GAME_POUR_SCORE_NOTIFY,
		data: {
			score: score,
		},
	};
};

proto.GAME_LOOK_CARDS_NOTIFY = 316; /* 看牌 */
proto.GAME_LOOK_CARDS_PUSH = 416; /* 看牌结果 */

proto.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY = 317; /* 下局换牌 */
proto.GAME_SUBSTRATUM_TRADE_CARDS_PUSH = 417; /* 下局换牌结果 */

proto.GAME_INQTIRE_ARRCARDS_NOTIFY = 318; /* 查询牌库 */
proto.GAME_INQTIRE_ARRCARDS_PUSH = 418; /*查询牌库结果 */

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

proto.gameSubstratumTradeCardsNotify = function (chairID, cardDataArr) {
	return {
		type: this.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY,
		data: {
			chairID: chairID,
			cardDataArr: cardDataArr,
		},
	};
};

proto.gameSubstratumTradeCardsPush = function (trust) {
	return {
		type: this.GAME_SUBSTRATUM_TRADE_CARDS_PUSH,
		data: {
			trust: trust,
		},
	};
};

proto.gameInqtireArrcardsNotify = function (chairID) {
	return {
		type: this.GAME_INQTIRE_ARRCARDS_NOTIFY,
		data: {
			chairID: chairID,
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

proto.GAME_USER_CHOOSE_WASH_NOTIFY = 319; /* 用户切牌通知 */
proto.gameUserChooseWashNotify = function () {
	return {
		type: this.GAME_USER_CHOOSE_WASH_NOTIFY,
		data: {}
	}
}

proto.GAME_USER_WASH_CARD_NOTIFY = 320; /* 用户切牌结果 */
proto.gameUserWashCardNotify = function () {
	return {
		type: this.GAME_USER_WASH_CARD_NOTIFY,
		data: {}
	}
}
proto.GAME_USER_WASH_CARD_PUSH = 420; /* 用户切牌结果 */

proto.gameUserWashCardPush = function (chairIDList, time) {
	return {
		type: this.GAME_USER_WASH_CARD_PUSH,
		data: {
			chairIDList,
			time
		},
	};
};