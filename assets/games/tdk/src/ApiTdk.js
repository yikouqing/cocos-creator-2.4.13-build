let proto = module.exports;

proto.gameStatus = {
	NONE: 0,
	/* 等待操作 */
	BASE_SCORE: 1,
	/* 下底分 */
	SEND_CARDS: 2,
	/* 发牌 */
	POUR_SCORE: 3,
	/* 下注 */
	QI_TI: 4,
	/* 起脚-反踢 */
	TI_GEN: 5, //踢-跟流程
	ALL_IN: 6,
	/* 全压 */
	SHOW_CARDS: 7,
	/* 定牌 */
	RESULT: 8,
	/* 显示结果 */
};

proto.gameStatusTm = {
	NONE: 0,
	/* 等待操作 */
	BASE_SCORE: 3,
	/* 下底分 */
	SEND_CARDS: 2,
	/* 洗牌 */
	POUR_SCORE: 15,
	/* 切牌 */
	QI_TI: 15,
	/* 发牌 */
	ALL_IN: 15,
	/* 用户操作 */
	SHOW_CARDS: 15,
	/* 定牌 */
	RESULT: 3,
	/* 显示结果 */
};

//游戏操作
proto.startOperateType = {

	XIAZHU: 1, //扣牌 下注
	GEN: 2, //扣牌 跟
	QIJIAO: 3, //扣牌 起脚  不踢
	FANTI: 4, //扣牌 反踢 不踢
	ALLIN1: 5, //扣牌 全压 起脚 不踢
	ALLIN2: 6, //扣牌 全压 反踢 不踢
	ALLIN3: 7, //扣牌 全压
}

//玩家可操作列表
proto.operateList = {
	1: [1, 4],
	2: [1, 3],
	3: [1, 5, 6],
	4: [1, 7, 6],
	5: [1, 2, 5, 6],
	6: [1, 2, 7, 6],
	7: [1, 2]
}



//游戏操作
proto.operateType = {
	NONE: 0, //未操作
	CANCEL: 1, //扣牌
	ALLIN: 2, //全压
	GEN: 3, //跟
	XIAZHU: 4, //下分
	QIJIAO: 5, //起脚
	BUTI: 6, //不踢
	FANTI: 7, //反踢
	KAIPAI: 8, //开牌
}

//芒果类型
proto.mangoType = {
	quanMang: 1, //圈芒
	zouMang: 2, //揍芒
	xiuMang: 3, //休芒
}

//游戏玩法
proto.cardType = {
	/* 单牌 */
	DANZHANG: 0,
	/* 豹子王 */
	BAOZIWANG: 1,
	/* 豹子 */
	BAOZI: 2,
	/* 四条 */
	SITIAO: 3,
	/* 双豹子 */
	SHUANGBAOZI: 4,
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

//玩家底分和芒果分推送
proto.GAME_BASE_SCORE_PUSH = 602;
proto.gameBaseScorePush = function (mangoScore, baseScore, userScore, mangoType) {
	return {
		type: this.GAME_BASE_SCORE_PUSH,
		data: {
			mangoScore,
			baseScore,
			userScore,
			mangoType
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
proto.gameUserOperateStartPush = function (uid, score, turn, operateList, tick) {
	return {
		type: this.GAME_USER_OPERATE_START_PUSH,
		data: {
			uid,
			score,
			tick,
			operateList,
			turn
		},
	};
};


//玩家摆牌推送
proto.GAME_SHOW_CARDS_NOTIFY = 505;
proto.showCardsNotify = function () {
	return {
		type: this.GAME_SHOW_CARDS_NOTIFY,
		data: {},
	};
}
proto.GAME_SHOW_CARDS_PUSH = 605;
proto.gameShowCardsPush = function (uid, result) {
	return {
		type: this.GAME_SHOW_CARDS_PUSH,
		data: {
			uid,
			result
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
proto.gameUserOperateNotify = function (operateType, score = 0) {
	return {
		type: this.GAME_USER_OPERATE_NOTIFY,
		data: {
			score,
			operateType
		},
	};
}
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


//玩家买分
proto.GAME_USER_BUY_SCORE_NOTIFY = 511;
proto.GAME_USER_BUY_SCORE_PUSH = 611;
proto.gameUserBuyScorePush = function (uid, code) {
	return {
		type: this.GAME_USER_BUY_SCORE_PUSH,
		data: {
			uid,
			code
		},
	};
};

//玩家分数变化推送
proto.GAME_USER_SCORE_CHANGE_PUSH = 612;
proto.gameUserScoreChangePush = function (userPourScore) {
	return {
		type: this.GAME_USER_SCORE_CHANGE_PUSH,
		data: {
			userPourScore
		},
	};
};

//最先说话的玩家
proto.GAME_MAX_USER_PUSH = 613;
proto.gameMaxUserPush = function (uid) {
	return {
		type: this.GAME_MAX_USER_PUSH,
		data: {
			uid
		},
	};
};

//----------------------------调试功能------------------------------------


//换牌
proto.GAME_SET_TEST_CARDS_NOTIFY = 551;
proto.gameSetTestCardsNotify = function (uid,cardData) {
	return {
		type: this.GAME_SET_TEST_CARDS_NOTIFY,
		data: {
			cardData,
			uid,
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