let proto = module.exports;

proto.gameStatus = {
	NONE: 0, //等待操作
	POUR_SCORE: 1, //玩家下分
	SEND_CARDS: 2, //发牌
	RESULT: 3, //结果
};


proto.gameStatusTm = {
	NONE: 0,
	POUR_SCORE: 10, //玩家下分
	SEND_CARDS: 2, //发牌
	SHOW_CARD: 2, //比牌
	RESULT: 5, //结果
};

//卡牌基本类型
proto.cardType = {
	MEINIU: 1, //没有牛
	YOUNIU: 2, //有牛
	NIUNIU: 3, //牛牛
	BIYINIU: 4, //比翼牛
	SHUNZINIU: 5, //顺子牛
	YINNIU: 6, //银牛
	TONGHUANIU: 7, //同花牛
	WUHUANIU: 8, //五花牛
	HULUNIU: 9, //葫芦牛
	WUXIAONIU: 10, //五小牛
	ZHADANNIU: 11, //炸弹牛
	YITIAOLONG: 12, //一条龙
	TONGHUASHUN: 13, //同花顺

};

proto.GAME_STATUS_PUSH = 470; //游戏状态推送
proto.USER_FOLLOW_POUR_NOTIFY = 510;//玩家续投
proto.GAME_BANKER_PUSH = 434; //庄家变化

proto.GAME_WIN_LOSE_NOTIFY = 309; // 输赢走势信息
proto.GAME_WIN_LOSE_PUSH = 409; // 输赢走势信息
proto.gameUserFollowPourNotify = function () {
	return {
		type: this.USER_FOLLOW_POUR_NOTIFY,
		data: {

		},
	};
}

proto.GAME_USER_RANK_NOTIFY = 519;
proto.GAME_USER_RANK_PUSH = 619;
proto.gameUesrRankNotify = function (uid, startIndex, count = 10) {
	return {
		type: this.GAME_USER_RANK_NOTIFY,
		data: {
			uid,
			count,
			startIndex,
		},
	};
}


//玩家下分操作推送
proto.GAME_USER_POUR_SCORE_NOTIFY = 501;
proto.GAME_USER_POUR_SCORE_PUSH = 601;
proto.gameUserPourScorePush = function (uid, isSuccess, pourList, message) {
	return {
		type: this.GAME_USER_POUR_SCORE_PUSH,
		data: {
			uid,
			isSuccess,
			pourList,
			message
		},
	};
};


proto.gameUserPourScoreNotify = function (uid, pourIndex, score,) {
	return {
		type: this.GAME_USER_POUR_SCORE_NOTIFY,
		data: {
			uid,
			score,
			pourIndex,
		},
	};
}





//发玩家手牌
proto.GAME_WIN_RESULT_PUSH = 602;
proto.gameSendCardPush = function (bankerCards, playerCards) {

	return {
		type: this.GAME_SEND_CARDS_PUSH,
		data: {
			bankerCards,
			playerCards
		},
	};
};



//玩家赢分推送
proto.GAME_WIN_RESULT_PUSH = 603;
proto.gameWinResultPush = function (uid, score) {
	return {
		type: this.GAME_WIN_RESULT_PUSH,
		data: {
			uid,
			score
		},
	};
};


//庄家赢分推送
proto.GAME_BANKER_WIN_RESULT_PUSH = 604;
proto.gameBankerWinResultPush = function (uidList) {

	return {
		type: this.GAME_BANKER_WIN_RESULT_PUSH,
		data: {
			uidList
		},
	};
};

//庄家申请上庄
proto.GAME_USER_APPLY_BANKER_NOTIFY = 505;
//上庄玩家更新
proto.BANKER_CHANGR_PUSH = 611;
proto.gameUserApplyBankerNotify = function (uid, type, score) {
	return {
		type: this.GAME_USER_APPLY_BANKER_NOTIFY,
		data: {
			uid,
			type,
			score,
		},
	};
}
proto.GAME_USER_APPLY_BANKER_PUSH = 605;
proto.gameUserApplyBankerPush = function (uid, isSuccess, message) {
	return {
		type: this.GAME_USER_POUR_SCORE_PUSH,
		data: {
			uid,
			isSuccess,
			message
		},
	};
};



//游戏结果推送
proto.GAME_RESULT_PUSH = 606;
proto.gameResultPush = function (result, bankerUid) {
	return {
		type: this.GAME_RESULT_PUSH,
		data: {
			result,
			bankerUid
		},
	};
};


//牌面回房
proto.GAME_REVIEW_NOTIFY = 507;
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
proto.gameEndPush = function (result, winMost, loseMost, creater, plusInfo, reason) {

	let curResult = {
		type: this.GAME_END_PUSH,
		data: {
			result: result,
			winMost: winMost,
			loseMost: loseMost,
			creater: creater,
			plusInfo: plusInfo,
			reason: reason,
		},
	};
	return curResult;
};



//亮牌推送
proto.SHOW_CARDS_NOTIFY = 512;
proto.SHOW_CARDS_PUSH = 612;
proto.showCardsPush = function (cardsList, uid, chairID = null) {
	return {
		type: this.SHOW_CARDS_PUSH,
		data: {
			chairID,
			uid,
			cardsList
		}
	};
};

proto.GAME_USER_SCORE_NOTIFY = 513; /* 下分通知 */
proto.GAME_USER_SCORE_PUSH = 613; /* 下分结果 */
proto.gameUserPourScore = function (uid, score) {
	return {
		type: this.GAME_USER_SCORE_PUSH,
		data: {
			uid,
			score
		},
	};
};


proto.GAME_MA_PAI_PUSH = 614; /* 马牌通知 */
proto.gameMaPaiPush = function (mapai) {
	return {
		type: this.GAME_MA_PAI_PUSH,
		data: {
			mapai
		},
	};
};

//用户切牌结果
proto.GAME_USER_WASH_CARD_NOTIFY = 515;
proto.GAME_USER_WASH_CARD_PUSH = 615;
proto.gameUserWashCardPush = function (userIDList, time) {
	return {
		type: this.GAME_USER_WASH_CARD_PUSH,
		data: {
			userIDList,
			time
		},
	};
};

//玩家选择切牌
proto.GAME_USER_CHOOSE_WASH_NOTIFY = 516;

//计算时间
proto.GAME_START_TIME_DELAY_NOTIFY = 517;


proto.USER_CANCEL_NOTIFY = 518;
proto.USER_CANCEL_PUSH = 618;
proto.userCancelPush = function (uid) {
	return {
		type: this.USER_CANCEL_PUSH,
		data: {
			uid
		}
	};
};



//----------------------------调试功能------------------------------------


//换牌
proto.GAME_SET_TEST_CARDS_NOTIFY = 551;
proto.gameSetTestCardsNotify = function (type) {
	return {
		type: this.GAME_SET_TEST_CARDS_NOTIFY,
		data: {
			type
		},
	};
}
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
proto.gameGetTestCardsNotify = function () {
	return {
		type: this.GAME_GET_TEST_CARDS_NOTIFY,
		data: {},
	};
}
proto.GAME_GET_TEST_CARDS_PUSH = 652;
proto.gameGetTestCardsPush = function (uid, allCardsData, testCards = []) {
	return {
		type: this.GAME_GET_TEST_CARDS_PUSH,
		data: {
			uid,
			allCardsData,
			testCards
		},
	};
};