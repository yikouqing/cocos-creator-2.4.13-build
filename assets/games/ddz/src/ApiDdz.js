let proto = module.exports;
//-----------------------------游戏状态----------------------------------------
proto.gameStatus = {
	NONE: 0,
	SEND_CARDS: 1, //发牌
	QIANG_ZHUANG: 2, //抢庄状态
	JIA_BEI: 3, //加倍
	USER_OPERATE: 4, //出牌
	GAME_END: 5, //游戏结束
	RANG_PAI: 6, //让牌选择
};

//游戏操作
proto.operateType = {
	NONE: 0, //未操作
	PASS: 1, //过牌
	OUT: 2, //出牌
	SEND: 3, //发牌
	JIABEI: 4, //抢庄
	QIANGZHUANG: 5, //加倍
}

proto.gameStatusTm = {
	NONE: 0,
	/* 等待操作 */
	QIANG_ZHUANG: 30,
	/* 抢庄 */
	JIA_BEI: 30,
	/* 加倍 */
	SEND_CARDS: 2,
	/* 发牌 */
	USER_OPERATE: 30,
	/* 用户操作 */
};
//让牌
proto.gameRangPaiCount = {
	rangPaiCount_No: 0, //不让
	rangPaiCount_Two: 1, //让2张
	rangPaiCount_Three: 2, //让3张
	rangPaiCount_Four: 3, //让4张
};
//抢庄
proto.gameSnagScore = {
	snag_No: 0, //不抢
	snag_Noe: 1, //抢1
	snag_Two: 2, //抢2
	snag_Three: 3, //抢3
};
//加倍玩法
proto.gameRateType = {
	rateType_No: 0, //0-不能加倍
	rateType_Noe: 1, //1-自由加倍
	rateType_Two: 2, //2-农民优先
};
//加倍
proto.gameDouble = {
	double_No: 0, //不加倍
	double_Noe: 1, //普通加倍*1
	double_Two: 2, //超级加倍*2
};


proto.cardType = {
	ERROR: 0, // 错误
	SINGLE: 1, // 单牌
	DOUBLE: 2, // 对子
	SINGLE_LINE: 3, // 单连
	DOUBLE_LINE: 4, // 对连
	THREE_LINE: 5, // 三不带
	THREE_LINE_TAKE_ONE: 6, // 三带1
	THREE_LINE_TAKE_TWO: 7, // 三带2
	THREE_LINE_TAKE_DUI: 8, // 三带对
	FOUR_LINE_TAKE_X: 9, // 四带X
	FOUR_LINE_TAKE_DUI: 10, // 四带两对
	LAIZI_BOMB: 11, // 癞子炸
	BOMB_CARD: 12, // 炸弹
	WANG_BOMB: 13, // 王炸
	CHUN_LAIZI_BOMB: 14, // 纯癞子炸
};

//-----------------------------时间状态----------------------------------------
proto.OPREATION_TIME = 15; // 操作时间
proto.OUT_CARD_TIME = 15; // 显示结果的时间
proto.QIANG_ZHUANG_TIME = 15; //抢庄操作时间
proto.JIA_BEI_TIME = 15; //加倍操作时间
proto.CAO_ZUO_TIME = 15; //操作时间(出牌，不出操作)

proto.GAME_STATUS_PUSH = 470;
proto.GAME_ROB_BANK_NOTIFY = 514;
proto.GAME_ROB_BANK_RESULT_PUSH = 614;
proto.GAME_ROB_SET_RESULT_PUSH = 625; //确定地主推送
//抢庄结果 
proto.getRobNotify = function (gameSnagScore) {
	return {
		type: this.GAME_ROB_BANK_NOTIFY,
		data: {
			gameSnagScore: gameSnagScore
		},
	};
};

proto.GAME_RANG_PAI_NOTIFY = 519;
proto.GAME_RANG_PAI_RESULT_PUSH = 619; //让牌张数推送结果 
proto.GAME_BANK_RANG_PAI_COUNT_ROUND_PUSH = 620; //庄家让牌张数轮次推送 
proto.GAME_BANK_RANG_PAI_COUNT_PUSH = 627; //庄家让牌张数推送 
proto.getYieldNotify = function (rangPaiCount) {
	return {
		type: this.GAME_RANG_PAI_NOTIFY,
		data: {
			rangPaiCount: rangPaiCount
		},
	};
};

proto.GAME_ROB_BANK_TURN_PUSH = 615;
//抢庄推送 
proto.gameRobBankTurnPush = function (uid, tick) {
	return {
		type: this.GAME_ROB_BANK_TURN_PUSH,
		data: {
			uid,
			tick
		},
	};
};

proto.GAME_DOUBLE_NOTIFY = 515;
proto.getRateNotify = function (gameSnagScore) {
	return {
		type: this.GAME_DOUBLE_NOTIFY,
		data: {
			gameSnagScore: gameSnagScore
		},
	};
};
proto.GAME_DOUBLE_RESULT_PUSH = 616;
//加倍结果 
proto.gameDoubleResultPush = function (uid, gameSnagScore) {
	return {
		type: this.GAME_DOUBLE_RESULT_PUSH,
		data: {
			uid,
			gameSnagScore
		},
	};
};

proto.GAME_DOUBLE_TURN_PUSH = 617;
//加倍推送 
proto.gameDoubleTurnPush = function (uid, tick) {
	return {
		type: this.GAME_DOUBLE_TURN_PUSH,
		data: {
			uid,
			tick
		},
	};
};


//庄家推送
proto.GAME_BANKER_PUSH = 601;
proto.gameBankerPush = function (uid) {
	return {
		type: this.GAME_BANKER_PUSH,
		data: {
			uid
		},
	};
};

//发玩家手牌
proto.GAME_SEND_CARDS_PUSH = 603;
proto.gameSendCardPush = function (handCards) {
	return {
		type: this.GAME_SEND_CARDS_PUSH,
		data: {
			handCards
		},
	};
};

//开始操作推送
proto.GAME_USER_OPERATE_START_PUSH = 604;
proto.gameUserOperateStartPush = function (uid, cards, lastOperateUid, tick) {
	return {
		type: this.GAME_USER_OPERATE_START_PUSH,
		data: {
			uid,
			cards,
			tick,
			lastOperateUid
		},
	};
};

//游戏结果推送
proto.GAME_RESULT_PUSH = 606;
proto.gameResultPush = function (result, leftCards) {
	return {
		type: this.GAME_RESULT_PUSH,
		data: {
			result: result,
			allLeftCards: leftCards
		},
	};
};


//牌面回放
proto.GAME_REVIEW_NOTIFY = 507;
proto.gameReviewNotify = function (list) {
	return {
		type: this.GAME_REVIEW_NOTIFY,
		data: {},
	};
};
proto.GAME_REVIEW_PUSH = 607;
proto.gameReviewPush = function (list) {
	return {
		type: this.GAME_REVIEW_PUSH,
		data: {
			list: list,
		},
	};
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
proto.getOperateNotify = function (operateType, cards) {
	return {
		type: this.GAME_USER_OPERATE_NOTIFY,
		data: {
			operateType: operateType,
			cards: cards
		},
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


//----------------------------调试功能------------------------------------


//换牌
proto.GAME_SET_TEST_CARDS_NOTIFY = 551;
proto.gameSetTestCardsNotify = function (cardData, uid) {
	return {
		type: this.GAME_SET_TEST_CARDS_NOTIFY,
		data: {
			uid: uid,
			cardData: cardData,
		},
	};
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
proto.gameGetTestCardsNotify = function (uid) {
	return {
		type: this.GAME_GET_TEST_CARDS_NOTIFY,
		data: {
			uid: uid
		},
	};
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

proto.GAME_MULTIPLE_RESULT_PUSH = 626;