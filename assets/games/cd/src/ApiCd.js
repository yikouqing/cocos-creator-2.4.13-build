let proto = module.exports;
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
	HE: 32,
	/* 和 */
};

proto.gameStatus = {
	NONE: 0, //等待操作
	ROB_BANK: 1, //玩家抢庄
	POUR_SCORE: 2, //闲家倍数
	SEND_CARDS: 3, //发牌
	SHOW_CARD: 4, //用户亮牌操作
	/* 显示结果 */
	RESULT: 5,
	/**游戏开始 */
	START_GAME: 6,
	WASH_CARD: 7, //玩家切牌
};

//庄家规则
proto.gameType = {
	/* 通比 */
	TONGBI: 2,
	/* 抢庄 */
	QIANGZHUANG: 1,
	KANPAI: 3, //看牌下注
};

//卡牌基本类型
proto.cardType = {
	WULONG: 1, // 乌龙
	DUI: 2, //对子
	SHUNZI: 3, //顺子
	QINGYISE: 4, //清一色
	SHUNQING: 5, //顺清
	SANTIAO: 6, //三条
}

proto.cardTypeStr = {
	[1]: "乌龙",
	[2]: "对子",
	[3]: "顺子",
	[4]: "同花",
	[5]: "同花顺",
	[6]: "三条",
}

//洗牌类型
proto.cardXiType = {
	ZHADAN: 100, //炸弹
	QUANHEI: 101, //全黑
	QUANHONG: 102, //全红
	LIANSHUN: 103, //连顺-一条龙
	SIZHANG: 104, //四张
	TONGGUAN: 105, //通关
	QUANSAN: 106, //全三条
	SANTONGHUA: 107, //三同花
	SHUANGSHUNQING: 108, //双顺清
	SANSHUNQING: 109, //三顺清
	TOUSHUNQING: 110, //头道顺清
	SHUANGSAN: 111, //双三条
	QINGLONG: 112, //清龙
	SHUANGSIZHANG: 113, //双四条
	SANGUI: 114, //三鬼
}

proto.cardXiTypeStr = {
	[100]: "炸弹",
	[101]: "全黑",
	[102]: "全红",
	[103]: "连顺",
	[104]: "四个头",
	[105]: "通关",
	[106]: "全三条",
	[107]: "三清",
	[108]: "双顺清",
	[109]: "三顺清",
	[110]: "头道清",
	[111]: "双三条",
	[112]: "清连顺",
	[113]: "双四头",
	[114]: "三鬼",
}

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
proto.gameRobBankerNotify = function (robScale) {
	return {
		type: this.GAME_ROB_BANK_NOTIFY,
		data: {
			robScale
		},
	};
}
proto.GAME_ROB_BANK_PUSH = 602; /* 抢庄结果 */
proto.gameRobBankPush = function (uid, robScale) {
	return {
		type: this.GAME_ROB_BANK_PUSH,
		data: {
			uid,
			robScale
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

//玩家下分操作推送
proto.GAME_USER_POUR_SCORE_PUSH = 605;
proto.gameUserPourScorePush = function (bankerUid, tick, minPourScore, maxPourScore) {
	return {
		type: this.GAME_USER_POUR_SCORE_PUSH,
		data: {
			bankerUid,
			tick,
			minPourScore,
			maxPourScore
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
proto.showCardsNotify = function (touCards, zhongCards, weiCards) {
	return {
		type: this.SHOW_CARDS_NOTIFY,
		data: {
			touCards,
			zhongCards,
			weiCards
		}
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
proto.gameUserWashCardNotify = function () {
	return {
		type: this.GAME_USER_WASH_CARD_NOTIFY,
		data: {}
	}
}
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
proto.gameUserChooseWashNotify = function () {
	return {
		type: this.GAME_USER_CHOOSE_WASH_NOTIFY,
		data: {}
	}
}

//计算时间
proto.GAME_START_TIME_DELAY_NOTIFY = 517;
proto.gameStartTimeDelayNotify = function (times) {
	return {
		type: this.GAME_START_TIME_DELAY_NOTIFY,
		data: {
			times
		}
	}
}

proto.USER_CANCEL_NOTIFY = 518;
proto.userCancelNotify = function () {
	return {
		type: this.USER_CANCEL_NOTIFY,
		data: {}
	}
}
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
proto.gameSetTestCardsNotify = function (cardData, uid) {
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
		data: {
			uid
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