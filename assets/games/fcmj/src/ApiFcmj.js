/*
 * 麻将协议
 */
var proto = module.exports;

//游戏状态
proto.gameStatus = {
	NONE: 0, //等待操作
	DICES: 1, //骰子
	SEND_CARDS: 2, //发牌中 
	PLAYING: 3, //游戏中 
	RESULT: 4, //显示结果 
};

//状态等待时间
proto.gameStatusTm = {
	NONE: 0, //等待操作
	DICES: 2, //骰子
	SEND_CARDS: 2, //发牌中 
	PLAYING: 15, //游戏中 
	RESULT: 5, //显示结果 
};

proto.yaoBaoType = {
	NONE: 0,
	YAO: 1, //可以摇
	YAOED: 2, //已经摇
	GEN: 3, //可以跟
	GENED: 4, //已经跟
}

proto.huType = {
	DIAN: 1, //点炮
	ZIMO: 2, //自摸
	QIANGHU: 3, //抢杠胡
	GANGPAO: 4, //杠上炮
	GANGHUA: 5, //杠上花
	MOBAO: 6, //摸宝
	ZHICHONG: 7, //直充
	SHUANGYANPI: 8, //双眼皮
	GANGSHANGBAO: 9, //杠上宝
}

//操作类型
proto.operateType = {
	NONE: 0,
	HU_ZHI: 5, //自摸
	HU_QIANG: 10, //抢杠胡
	HU_CHI: 15, //吃胡
	GANG_ZHI: 20, //暗杠
	GANG_CHI: 25, //吃杠
	GANG_BU: 30, //补杠
	PENG: 35, //碰
	CHI: 40, //吃
	GET: 45, //摸牌
	QI: 50, //弃牌
	GUO: 55, //过牌
	BUHUA: 60, //补花
	YAOBAO: 65, //摇宝
	GENBAO: 70, //跟宝
	MOBAOHU: 75, //摸宝胡
	ZHICHONG: 76, //直充
	SHUANGYANPI: 77, //双眼皮
};

//用户卡牌类型
proto.cardType = {
	NONE: 0, //不能胡
	JIAHU: 1, //夹胡
	BIANHU: 2, //边胡
	DUMENDIAO: 3, //独门吊
	QINGYISEJIAHU: 4, //清一色夹胡
	QINGYISEBIANHU: 5, //清一色边胡
	QINGYISEPIAOHU: 6, //清一色飘胡
	QINGYISESHOUBAYI: 7, //清一色手把一
	PIAOHU: 8, //飘胡
	QIDUI: 9, //七对
	PIAODANDIAO: 10, //七对
	SHOUBAYI: 11, //手把一
	SHOUBAYIDUMENDIAO: 12, //手把一独门吊
	PIAODUMENDIAO: 13, //飘独门吊
	QINGYISEPIAODANDIAO: 14, //清一色飘单吊
	PIAODANDIAOSHOUBAYI: 15, //飘单吊手把一
}

proto.cardTypeStr = {
	[0]: "不能胡",
	[1]: "夹胡",
	[2]: "边胡",
	[3]: "独门吊",
	[4]: "清一色夹胡",
	[5]: "清一色边胡",
	[6]: "清一色飘胡",
	[7]: "清一色手把一",
	[8]: "飘胡",
	[9]: "七对",
	[10]: "飘单吊",
	[11]: "手把一",
	[12]: "手把一独门吊",
	[13]: "飘独门吊",
	[14]: "清一色飘单吊",
	[15]: "飘单吊手把一",
	[16]: "",
	[17]: "",
	[18]: "",
	[19]: "",
	[20]: "",
	[21]: "",
}

//加蕃类型
proto.plusType = {
	NONE: 0,
	BIMEN: 1, //闭门
	SANJIABI: 2, //三家闭
	SIJIABIL: 3, //四家闭
	HAIDILAO: 4, //海底捞
	ZHICHONG: 5, //直充
	SHUANGYANPI: 6, //双眼皮
	ZHUANG: 7, //庄家
	DIANPAO: 8, //点炮
	GENZHUANG: 9, //跟庄
}


proto.plusRateTypeStr = {
	[0]: "",
	[1]: "闭门",
	[2]: "三家闭",
	[3]: "四家闭",
	[4]: "海底捞",
	[5]: "直充",
	[6]: "双眼皮",
	[7]: "庄家",
	[8]: "点炮",
	[9]: "跟庄",
	[10]: "",
	[11]: "",
	[12]: "",
	[13]: "",
	[14]: "",
	[15]: "",
	[16]: "",
	[17]: "",
	[18]: "",
	[19]: "",
	[20]: "",
	[21]: "",
}

proto.operateTm1 = 30; /* 弃牌操作时间 */
proto.operateTm2 = 30; /* 碰杠操作时间 */
proto.operateGangChooseTm = 15; /* 杠牌选择时间 */

proto.GAME_STATUS_PUSH = 470; /* 状态推送 */
proto.gameStatusPush = function (gameStatus, tick) {
	return {
		type: this.GAME_STATUS_PUSH,
		data: {
			gameStatus: gameStatus,
			tick: tick,
		},
	};
};

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
proto.GAME_ROB_BANK_PUSH = 602; /* 抢庄结果 */
proto.gameRobBankPush = function (uid, chairID, isRob) {
	return {
		type: this.GAME_ROB_BANK_PUSH,
		data: {
			uid,
			chairID,
			isRob
		},
	};
};

//发玩家手牌
proto.GAME_SEND_CARDS_PUSH = 603;
proto.gameSendCardPush = function (handCards, dice1, dice2, huaCards) {
	return {
		type: this.GAME_SEND_CARDS_PUSH,
		data: {
			handCards,
			dice1,
			dice2,
			huaCards
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
proto.gameResultPush = function (result, lastCards, bankerUid) {
	return {
		type: this.GAME_RESULT_PUSH,
		data: {
			result: result,
			lastCards: lastCards,
			bankerUid: bankerUid
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

proto.GAME_REST_CARDS_COUNT_PUSH = 613;
proto.gameRestCardsCountPush = function (restCardsCount) {
	return {
		type: this.GAME_REST_CARDS_COUNT_PUSH,
		data: {
			restCardsCount: restCardsCount,
		},
	};
};

proto.GAME_TURN_PUSH = 614;
proto.gameOperateArrayPush = function (uid, card, tick, operateArray, plusInfo) {
	return {
		type: this.GAME_TURN_PUSH,
		data: {
			uid: uid,
			card: card,
			tick: tick,
			operateArray: operateArray,
			plusInfo: plusInfo,
		},
	};
};

proto.GAME_TURN_OPERATE_NOTIFY = 515;
proto.gameOperateNotify = function (card, operate, cardList) {
	return {
		type: this.GAME_TURN_OPERATE_NOTIFY,
		data: {
			card: card,
			operate: operate,
			cardList: cardList,
		},
	};
};
proto.GAME_TURN_OPERATE_PUSH = 615;
proto.gameOperatePush = function (uid, card, operate, success, plusInfo) {
	return {
		type: this.GAME_TURN_OPERATE_PUSH,
		data: {
			uid: uid,
			card: card,
			operate: operate,
			success: success,
			plusInfo: plusInfo,
		},
	};
};

proto.GAME_BU_HUA_PUSH = 616;
proto.gameBuHuaPush = function (uid, huaCards) {
	return {
		type: this.GAME_BU_HUA_PUSH,
		data: {
			uid,
			huaCards
		},
	};
};

//飘花限制推送
proto.PIAO_HUA_LIMIT_PUSH = 618;
proto.piaoCaiLimitPush = function (uid, isLimit = false) {
	return {
		type: this.PIAO_HUA_LIMIT_PUSH,
		data: {
			uid,
			isLimit
		}
	};
};

//619摇宝推送
proto.USER_START_YAO_BAO_PUSH = 619;
proto.userStartYaoBaoPush = function (uid) {
	return {
		type: this.USER_START_YAO_BAO_PUSH,
		data: {
			uid
		}
	};
};

proto.USER_YAO_BAO_OPT_NOTIFY = 520;
proto.userYaoBaoOptNotify = function (operate = false) {
	return {
		type: this.USER_YAO_BAO_OPT_NOTIFY,
		data: {
			operate
		}
	};
}
proto.USER_YAO_BAO_OPT_PUSH = 620;
proto.userYaoBaoOptPush = function (uid, yaoBaoUser) {
	return {
		type: this.USER_YAO_BAO_OPT_PUSH,
		data: {
			uid,
			yaoBaoUser
		}
	};
};


//621跟宝推送
proto.USER_START_GEN_BAO_PUSH = 621;
proto.userStartGenBaoPush = function (uid) {
	return {
		type: this.USER_START_GEN_BAO_PUSH,
		data: {
			uid
		}
	};
};

proto.USER_GEN_BAO_OPT_NOTIFY = 522;
proto.userGenBaoOptNotify = function (operate) {
	return {
		type: this.USER_GEN_BAO_OPT_NOTIFY,
		data: {
			operate
		}
	};
}
proto.USER_GEN_BAO_OPT_PUSH = 622;
proto.userGenBaoOptPush = function (uid, yaoBaoUser) {
	return {
		type: this.USER_GEN_BAO_OPT_PUSH,
		data: {
			uid,
			yaoBaoUser
		}
	};
};


proto.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY = 551; /* 下局换牌 */
proto.GAME_SUBSTRATUM_TRADE_CARDS_PUSH = 651; /* 下局换牌结果 */
proto.GAME_INQTIRE_ARRCARDS_NOTIFY = 552; /* 查询牌库 */
proto.GAME_INQTIRE_ARRCARDS_PUSH = 652; /*查询牌库结果 */

// proto.gameSubstratumTradeCardsNotify = function (cardData) {
// 	return {
// 		type: this.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY,
// 		data: {
// 			cardData: cardData,
// 		},
// 	};
// };


// 新调试
// uid:0//设置调试玩家
// nextUid:0//设置玩家
// type：0 //0查询所有玩家已调试牌      1换牌
// cards:0//设置下一张摸牌
// handCards：[]//设置手牌
// nullType
proto.gameSubstratumTradeCardsNotify = function (uid, nextUid, type, cards, handCards) {
	return {
		type: this.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY,
		data: {
			uid: uid,
			nextUid: nextUid,
			type: type,
			cards: cards,
			handCards: handCards,
		},
	};
};




proto.gameSubstratumTradeCardsPush = function (trust) {
	return {
		type: this.GAME_SUBSTRATUM_TRADE_CARDS_PUSH,
		data: {
			isSuccess: isSuccess
		},
	};
};

// proto.gameInqtireArrcardsNotify = function () {
// 	return {
// 		type: this.GAME_INQTIRE_ARRCARDS_NOTIFY,
// 		data: {},
// 	};
// };

proto.gameInqtireArrcardsNotify = function (type, nextUid) {
	return {
		type: this.GAME_INQTIRE_ARRCARDS_NOTIFY,
		data: {
			type: type,
			nextUid: nextUid,
		},
	};
};

proto.gameireArrcardsPush = function (uid, allCardsData, testCards = []) {
	return {
		type: this.GAME_INQTIRE_ARRCARDS_PUSH,
		data: {
			uid: uid,
			allCardsData: allCardsData,
			testCards: testCards
		},
	};
};

proto.GAME_QIANG_GANG_DELETE_PUSH = 439;
proto.gameQiangGangDeletePush = function (chairID, card) {
	return {
		type: this.GAME_QIANG_GANG_DELETE_PUSH,
		data: {
			chairID,
			card
		},
	};
};