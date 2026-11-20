/*
 * 跑得快协议
 */
var proto = module.exports;

proto.gameStatus = {
	NONE: 0, /* 等待操作 */
	WASH_CARD: 1, /* 洗牌 */
	SEND_CARDS: 2, /* 发牌 */
	CHANGE_CARD: 3, /* 切牌 */
	USER_OPERATE: 4, /* 用户操作 */
	RESULT: 5, /* 显示结果 */
	TAKING: 6, //玩家说话阶段

};

proto.gameStatusTm = {
	NONE: 0, /* 等待操作 */
	WASH_CARD: 1, /* 洗牌 */
	CHANGE_CARD: 1, /* 切牌 */
	SEND_CARDS: 2, /* 发牌 */
	USER_OPERATE: 15, /* 用户操作 */
	RESULT: 30, /* 显示结果 */
	TAKING: 20, //说话
};

//游戏操作
proto.operateType = {
	NONE: 0,//未操作
	PASS: 1, //过牌
	OUT: 2,  //出牌
	SEND: 3,  //发牌
}

//说话操作
proto.talkType = {
	NONE: 0,//没有操作
	PASS: 1, //不说话
	LIANG: 2,  //亮牌
	ZHA: 3,  //扎股子
	RENSHU: 4,//认输
}


proto.cardType = {
	ERROR: 0,                   // 错误
	SINGLE: 1,                  // 单牌
	DOUBLE: 2,                  // 对子
	BOMB_CARD3: 3,              //3炸弹
	BOMB_CARD4: 4,              //4炸弹
	TIAN_BOMB: 5,              //王炸
}

proto.GAME_STATUS_PUSH = 470; //游戏状态推送

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
proto.gameSendCardPush = function (handCards, turn) {

	return {
		type: this.GAME_SEND_CARDS_PUSH,
		data: {
			handCards,
			turn
		},
	};
};

//开始操作推送
proto.GAME_USER_OPERATE_START_PUSH = 604;
proto.gameUserOperateStartPush = function (uid, tick) {
	return {
		type: this.GAME_USER_OPERATE_START_PUSH,
		data: {
			uid,
			tick
		},
	};
};

//玩家托管
proto.GAME_TRUST_NOTIFY = 505;
proto.gameTrushNotify = function (trust) {
	return {
		type: this.GAME_TRUST_NOTIFY,
		data: {
			trust: trust,
		},
	};
}
proto.GAME_TRUST_PUSH = 605;
proto.gameTrushPush = function (uid, trust) {
	return {
		type: this.GAME_TRUST_PUSH,
		data: {
			uid: uid,
			trust: trust,
		},
	};
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
proto.gameReviewNotify = function () {
	return {
		type: this.GAME_REVIEW_NOTIFY,
		data: {},
	};
}
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
proto.gameUserOperateNotify = function (cards, operateType) {
	return {
		type: this.GAME_USER_OPERATE_NOTIFY,
		data: {
			cards,
			operateType
		},
	};
}

//玩家说话
proto.GAME_USER_START_TALKING_PUSH = 611;
proto.gameUserStartTalkingPush = function (uid, tick, operateList, plusInfo = {}) {
	return {
		type: this.GAME_USER_START_TALKING_PUSH,
		data: { uid, tick, operateList, plusInfo },
	};
};

//说话操作
proto.GAME_USER_TALK_NOTIFY = 512;
proto.GAME_USER_TALK_PUSH = 612;
proto.gameUserTalkNotify = function (data) {
	return {
		type: this.GAME_USER_TALK_NOTIFY,
		data: data,
	};
};

//玩家说话
proto.GAME_USER_END_YOU_PUSH = 613;
proto.gameUserEndYouPush = function (uid, status, userWinStatus) {
	return {
		type: this.GAME_USER_END_YOU_PUSH,
		data: { uid, status, userWinStatus },
	};
};

proto.GAME_USER_OPERATE_PUSH = 610;
proto.gameUserOperatePush = function (uid, operateInfo) {
	return {
		type: this.GAME_USER_OPERATE_PUSH,
		data: {
			uid,
			operateInfo
		},
	};
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
			cardData
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
		data: { uid: uid },
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


