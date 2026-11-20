let proto = module.exports;

proto.gameStatus = {
	NONE: 0, //空闲状态
	BASE: 1, //下底分
	DEAL: 2, //发牌轮
	FLOP: 3, //翻牌轮
	TURN: 4, //转牌轮
	RIVER: 5, //河牌轮
	RESULT: 6, //结算
};

proto.gameStatusTm = {
	NONE: 0,
	/* 等待操作 */
	POUR_SCORE: 1,
	/* 下底分 */
	WASH_CARD: 2,
	/* 洗牌 */
	SEND_CARDS: 0.15,
	/* 发牌 */
	USER_OPERATE: 30,
	/* 用户操作 */
	SHOW_CARDS: 30,
	/* 摆牌 */
	RESULT: 10, //结算
};


//游戏操作
proto.operateType = {
	NONE: 0, //未操作
	CANCEL: 1, //弃
	QIAO: 2, //敲
	DA: 3, //大
	XIU: 4, //休
	GEN: 5, //跟
	LIANGPAI: 6, //亮牌
	DELAY: 7,//延时
	INSURE: 8,//保险
}

//游戏玩法
proto.cardType = {
	royalFlush: 1, //皇家同花顺
	sequence: 2, //同花顺
	fourOfAKind: 3, //四条
	gourd: 4, //葫芦
	flush: 5, //同花
	straight: 6, //顺子
	Sanjo: 7, //三条
	twoPairs: 8, //两对
	twain: 9, //一对
	highCard: 10, //高牌
}

proto.GAME_STATUS_PUSH = 470; //游戏状态推送

//庄家推送
proto.GAME_BANKER_PUSH = 601;
proto.gameBankerPush = function (bankerUid, lastBankerChairID, bankerChairID) {
	return {
		type: this.GAME_BANKER_PUSH,
		data: {
			bankerUid,
			lastBankerChairID,
			bankerChairID
		},
	};
};

//大小盲分数推送
proto.GAME_BLIND_SCORE_PUSH = 614;

//玩家底分推送
proto.GAME_BASE_SCORE_PUSH = 602;

//发玩家手牌
proto.GAME_SEND_CARDS_PUSH = 603;
proto.gameSendCardPush = function (handCards, turn) {
	return {
		type: this.GAME_SEND_CARDS_PUSH,
		data: {
			handCards,
			turn
		},
	};
};

//发公共牌
proto.GAME_PUBLIC_SEND_CARDS_PUSH = 613;
proto.gamePublicSendCardPush = function (handCards, turn) {
	return {
		type: this.GAME_PUBLIC_SEND_CARDS_PUSH,
		data: {
			handCards,
			turn
		},
	};
};

//开始操作推送
proto.GAME_USER_OPERATE_START_PUSH = 604;
proto.gameUserOperateStartPush = function (uid, curScore, turn, tick) {
	return {
		type: this.GAME_USER_OPERATE_START_PUSH,
		data: {
			uid,
			curScore,
			tick,
			turn
		},
	};
};


//玩家SHOW牌
proto.GAME_SHOW_CARDS_NOTIFY = 505;
proto.GAME_SHOW_CARDS_PUSH = 605;
proto.getShowCardsNotify = function (cards) {
	return {
		type: this.GAME_SHOW_CARDS_NOTIFY,
		data: {
			showCards: cards
		},
	}
};

//游戏结果推送
proto.GAME_RESULT_PUSH = 606;
proto.gameResultPush = function (result) {
	return {
		type: this.GAME_RESULT_PUSH,
		data: {
			result: result,
		},
	};
};


//牌面回房
proto.GAME_REVIEW_NOTIFY = 507;
proto.GAME_REVIEW_PUSH = 607;
proto.getReviewNotify = function () {
	return {
		type: this.GAME_REVIEW_NOTIFY,
		data: {},
	}
};

//局数推送
proto.GAME_BUREAU_PUSH = 608;
proto.gameBureauPush = function (curBureau) {
	return {
		type: this.GAME_BUREAU_PUSH,
		data: {
			curBureau: curBureau,
		},
	};
};


proto.GAME_END_PUSH = 609;
proto.gameEndPush = function (result, winMost, loseMost, creater, plusInfo) {
	return {
		type: this.GAME_END_PUSH,
		data: {
			result: result,
			winMost: winMost,
			loseMost: loseMost,
			creater: creater,
			plusInfo: plusInfo,
		},
	};
};


//推送操作
proto.GAME_USER_OPERATE_NOTIFY = 510;
proto.GAME_USER_OPERATE_PUSH = 610;
proto.getOperateNotify = function (operateType, score) {
	return {
		type: this.GAME_USER_OPERATE_NOTIFY,
		data: {
			operateType: operateType,
			score: score
		},
	}
};

//玩家买分
proto.GAME_USER_BUY_SCORE_NOTIFY = 511;
proto.GAME_USER_BUY_SCORE_PUSH = 611;
proto.getBuyScoreNotify = function (uid, score) {
	return {
		type: this.GAME_USER_BUY_SCORE_NOTIFY,
		data: {
			uid: uid,
			score: score
		}
	}
};

//玩家分数变化推送
proto.GAME_USER_SCORE_CHANGE_PUSH = 612;
proto.gameUserScoreChangePush = function (userPourScore, userTotalScore, userScore, curScore, baseTotalScore, mangoScore) {
	return {
		type: this.GAME_USER_SCORE_CHANGE_PUSH,
		data: {
			userPourScore,
			userTotalScore,
			userScore,
			curScore,
			baseTotalScore,
			mangoScore
		},
	};
};

proto.GAME_OUTS_MULTIPLYING_POWER_PUSH = 661; /* 购买保险 */

//----------------------------调试功能------------------------------------

//换牌
proto.GAME_SET_TEST_CARDS_NOTIFY = 551;
proto.setTestCardsNotify = function (cardData) {
	return {
		type: this.GAME_SET_TEST_CARDS_NOTIFY,
		data: {
			cardData: cardData
		}
	}
};
proto.GAME_SET_TEST_CARDS_PUSH = 651;
proto.gameSetTestCardsPush = function (isSuccess) {
	return {
		type: this.GAME_SET_TEST_CARDS_PUSH,
		data: {
			isSuccess
		},
	};
};


//查询牌库
proto.GAME_GET_TEST_CARDS_NOTIFY = 552;
proto.getGetTestCardsNotify = function () {
	return {
		type: this.GAME_GET_TEST_CARDS_NOTIFY,
		data: {}
	}
};
proto.GAME_GET_TEST_CARDS_PUSH = 652;
proto.gameGetTestCardsPush = function (uid, allCardsData, testCards) {
	return {
		type: this.GAME_GET_TEST_CARDS_PUSH,
		data: {
			uid,
			allCardsData,
			testCards
		},
	};
};

proto.GAME_LOOK_CARDS_NOTIFY = 553; /* 看牌 */

proto.GAME_LOOK_CARDS_PUSH = 653; /* 看牌结果 */
proto.gameLookCardsPush = function (handCards) {
	return {
		type: this.GAME_LOOK_CARDS_PUSH,
		data: {
			handCards
		},
	};
};