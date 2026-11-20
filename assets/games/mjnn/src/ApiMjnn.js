/*
 * 牛牛协议
 */
let proto = module.exports;

proto.userStatus = {
	NONE: 0, //空闲
	ABANDON: 1, //弃牌
	TIMEOUTABANDON: 2, //超时弃牌
	LOOK: 4, //看牌
	LOSE: 8, //输
	WIN: 16, //赢
	HE: 32, //和
};

proto.gameStatus = {
	NONE: 0, // 等待操作
	SEND_CARDS: 1, //发牌
	ROB_BANK: 2, //抢庄
	POUR_SCORE: 3, //投注
	SHOW_CARDS: 4, //选择亮牌
	RESULT: 5, //显示结果
};

proto.gameStatusTm = {
	NONE: 0, //等待操作
	ROB_BANK: 5, //抢庄
	POUR_SCORE: 10, //下注
	SEND_CARDS: 2, //发牌
	SHOW_CARDS: 15, //选择亮牌
	RESULT: 3, //显示结果
};

proto.payType = {
	/* 支付方式 */
	AAZHIFU: 1,
	YINGJIAZHIFU: 2,
	WOZHIFU: 3,
};

proto.gameMode = {
	JINGDIAN: 0, //经典模式
	WANGLAI: 1, //经典王赖
	FENGKUANG: 2, //疯狂王赖
}

proto.cardType = {
	MEINIU: 1, //没牛
	YOUNIU: 2, //有牛
	DUIZINIU: 3, //对子牛
	NIUNIU: 4, //牛牛
	BANNIU: 5, //板牛
	SHUNZINIU: 6, //顺子牛
	HULUNIU: 7, //葫芦牛
	ZHADANNIU: 8, //炸弹牛
	WUXIAONIU: 9, //五小牛
};

proto.pourScores = ['1/2/3/4', '2/4/6/8', '4/8/12/16', '5/10/15/20', '8/16/24/32', '10/20/30/40'];

proto.ruffianType = {
	/* 无 */
	WU: 1,
	/* 王癞 */
	WANGLAI: 2,
	/* 随机赖 */
	SHUIJILAI: 3,
};

proto.GAME_STATUS_PUSH = 470; //游戏状态推送

//庄家推送
proto.GAME_BANKER_PUSH = 601;
proto.gameBankerPush = function (uid, userList) {
	return {
		type: this.GAME_BANKER_PUSH,
		data: {
			uid,
			userList
		},
	};
};

proto.GAME_ROB_BANK_NOTIFY = 502; /* 抢庄通知 */
proto.gameRobBankerNotify = function (isRob) {
	return {
		type: this.GAME_ROB_BANK_NOTIFY,
		data: {
			isRob
		},
	};
}
proto.GAME_ROB_BANK_PUSH = 602; /* 抢庄结果 */
proto.gameRobBankPush = function (uid, isRob) {
	return {
		type: this.GAME_ROB_BANK_PUSH,
		data: {
			uid,
			isRob
		},
	};
};


//发玩家手牌
proto.GAME_SEND_CARDS_PUSH = 603;
proto.gameSendCardPush = function (handCards, leftCount, lastCards) {

	return {
		type: this.GAME_SEND_CARDS_PUSH,
		data: {
			handCards,
			leftCount,
			lastCards
		},
	};
};


//切锅推送
proto.GAME_QIE_GUO_NOTIFY = 604;
proto.gameQieGuoOperateNotify = function (isQie) {
	return {
		type: this.GAME_QIE_GUO_NOTIFY,
		data: {
			isQie
		},
	};
};
proto.GAME_QIE_GUO_OPERATE_PUSH = 604;
proto.gameQieGuoOperatePush = function (uid, tick) {
	return {
		type: this.GAME_QIE_GUO_OPERATE_PUSH,
		data: {
			uid,
			tick
		},
	};
};

//玩家下分操作推送
proto.GAME_USER_POUR_SCORE_PUSH = 605;
proto.gameUserPourScorePush = function (bankerUid, tick, canPourScores, tuizhu) {
	return {
		type: this.GAME_USER_POUR_SCORE_PUSH,
		data: {
			bankerUid,
			tick,
			canPourScores,
			tuizhu,
		},
	};
};

proto.GAME_USER_SCORE_NOTIFY = 513; /* 下分通知 */
proto.gameUserPourScoreNotify = function (score) {
	return {
		type: this.GAME_USER_SCORE_NOTIFY,
		data: {
			score
		},
	};
}
proto.GAME_USER_SCORE_PUSH = 613; /* 下分结果 */
proto.gameUserPourScore = function (uid, score) {
	return {
		type: this.GAME_ROB_BANK_PUSH,
		data: {
			uid,
			score
		},
	};
};


//游戏结果推送
proto.GAME_RESULT_PUSH = 606;
proto.gameResultPush = function (result) {
	return {
		type: this.GAME_RESULT_PUSH,
		data: {
			result: result
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

	let curResult = {
		type: this.GAME_END_PUSH,
		data: {
			result: result,
			winMost: winMost,
			loseMost: loseMost,
			creater: creater,
			plusInfo: plusInfo,
		},
	};
	return curResult;
};


//骰子推送 
proto.GAME_DICES_PUSH = 610;
proto.gameDicesPush = function (dice1, dice2) {
	return {
		type: this.GAME_DICES_PUSH,
		data: {
			dice1: dice1,
			dice2: dice2,
		},
	};
};

//亮牌推送
proto.SHOW_CARDS_NOTIFY = 512;
proto.showCardsNotify = function () {
	return {
		type: this.SHOW_CARDS_NOTIFY,
		data: {}
	};
}
proto.SHOW_CARDS_PUSH = 612;
proto.showCardsPush = function (chairID, cardsList, uid = null) {
	return {
		type: this.SHOW_CARDS_PUSH,
		data: {
			chairID,
			uid,
			cardsList
		}
	};
};

//锅底推送
proto.SHOW_GUO_SCORE_PUSH = 611;
proto.showGuoScorePush = function (score) {
	return {
		type: this.SHOW_GUO_SCORE_PUSH,
		data: {
			score
		}
	};
};

proto.GAME_CHAT_NOTIFY = 311; /* 游戏聊天 */
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

proto.GAME_CHAT_PUSH = 411;
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

//----------------------------调试功能------------------------------------


//换牌
proto.GAME_SET_TEST_CARDS_NOTIFY = 551;
proto.gameSetTestCardsNotify = function (uid, cardData) {
	return {
		type: this.GAME_SET_TEST_CARDS_NOTIFY,
		data: {
			uid: uid,
			cardData,
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
proto.gameGetTestCardsNotify = function () {
	return {
		type: this.GAME_GET_TEST_CARDS_NOTIFY,
		data: {},
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

//玩家托管
proto.GAME_TRUST_NOTIFY = 515;
proto.gameTrushNotify = function (trust) {
	return {
		type: this.GAME_TRUST_NOTIFY,
		data: {
			trust: trust,
		},
	};
}
proto.GAME_TRUST_PUSH = 615;
proto.gameTrushPush = function (uid, trust) {
	return {
		type: this.GAME_TRUST_PUSH,
		data: {
			uid: uid,
			trust: trust,
		},
	};
};