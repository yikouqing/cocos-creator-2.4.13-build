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
	DINGQUE: 5, //定缺
	HUANPAI: 6,//换牌
};

//状态等待时间
proto.gameStatusTm = {
	NONE: 0, //等待操作
	DICES: 2, //骰子
	SEND_CARDS: 2, //发牌中 
	PLAYING: 15, //游戏中 
	RESULT: 9, //显示结果 
	DINGQUE: 15,//定缺
	HUANPAI: 15, //换三张
};

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
	FEI: 60, //飞牌
	TI: 65, //提牌
	HU_TI: 70,//抢提胡
};

//定缺
proto.queType = {
	WAN: 0, //缺万
	TONG: 1, //缺筒
	TIAO: 2, //缺条
};

//换牌的方式
proto.huanPaiType = {
	SHUN: 0, //顺时针换
	NI: 1, //逆时针换
	DUI: 2, //对家换
	HUN: 3, //混合换
};

//用户卡牌类型
proto.cardType = {
	NONE: 0, //不能胡
	PINGHU: 1,//平胡
	DUIDUIHU: 2,//对对胡
	QINGYISE: 3,//清一色
	QIDUI: 4,//七对
	LONGQIDUI: 5,//龙七对
	QINGDUI: 6,//清对
	QINGQIDUI: 7,//清七对
	QINGLONGQIDUI: 8,//清龙七对
	GANGSHANGHUA: 10,//杠上花
	GANGSHANGPAO: 11,//杠上炮
	QIANGGONGHU: 12,//抢杠胡
	QIANGTIHU: 13,//抢提胡
	GEN: 14,//根
	GANG: 15,//杠
	HAIDILAO: 16,//海底捞
	HAIDIPAO: 17,//海底炮
	JINGOUGOU: 18,//金钩钩
	JINGOUPAO: 19,//金钩炮
	MENQING: 20,//门清
	ZHONGZHANG: 21,//中张
	TIANHU: 22,//天胡
	DIHU: 23,//地胡
	WUJI: 24,//无鸡
	SANYAOJI: 25,//三幺鸡
	SIYAOJI: 36,//四幺鸡
	YAOJIU: 37,//幺九
	JIANGDUI: 38,//将对
	TIGANGHUA: 39,//提杠花
	TIGANGPAO: 40,//提杠炮
	QIANGTIBAOPEI: 41,//抢提包赔
	CHAJIAO: 42,//查叫
	ZIMO: 43,//自摸
}

proto.plusRateTypeStr = {
	[0]: "",
	[1]: "平胡",
	[2]: "对对胡",
	[3]: "清一色",
	[4]: "七对",
	[5]: "龙七对",
	[6]: "清对",
	[7]: "清七对",
	[8]: "清龙七对",
	[9]: "",
	[10]: "杠上花",
	[11]: "杠上炮",
	[12]: "抢杠胡",
	[13]: "抢提胡",
	[14]: "根",
	[15]: "杠",
	[16]: "海底捞",
	[17]: "海底炮",
	[18]: "金钩钩",
	[19]: "金钩炮",
	[20]: "门清",
	[21]: "中张",
	[22]: "天胡",
	[23]: "地胡",
	[24]: "无鸡",
	[25]: "三幺鸡",
	[36]: "四幺鸡",
	[37]: "幺九",
	[38]: "将对",
	[39]: "提杠花",
	[40]: "提杠炮",
	[41]: "抢提包赔",
	[42]: "查叫",
	[43]: "自摸"
}

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

//玩家定牌
proto.GAME_USER_DING_QUE_NOTIFY = 504;
proto.gameDingQueNotify = function (type) {
	return {
		type: this.GAME_USER_DING_QUE_NOTIFY,
		data: {
			type
		}
	}
}
proto.GAME_USER_DING_QUE_PUSH = 604;
proto.gameDingQuePush = function (chairID, type) {
	return {
		type: this.GAME_USER_DING_QUE_PUSH,
		data: {
			chairID,
			type
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

//飘分推送 
proto.GAME_PIAOFEN_NOTIFY = 511;
proto.gamePiaoFenNotify = function (piaoFen) {
	return {
		type: this.GAME_PIAOFEN_NOTIFY,
		data: {
			piaoFen
		},
	};
}
proto.GAME_PIAOFEN_PUSH = 611;
proto.gamePiaoFenPush = function (uid, piao) {
	return {
		type: this.GAME_PIAOFEN_PUSH,
		data: {
			uid: uid,
			piaoFen: piao,
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
proto.gameOperateNotify = function (card, operate, cardList, ticardList, ID, Ticard) {
	return {
		type: this.GAME_TURN_OPERATE_NOTIFY,
		data: {
			ID: ID,
			Ticard: Ticard,
			card: card,
			operate: operate,
			cardList: cardList,
			ticardList,
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

//换牌推送
proto.GAME_HUAN_PAI_NOTIFY = 516;
proto.gameHuanPaiNotify = function (cardData) {
	return {
		type: this.GAME_HUAN_PAI_NOTIFY,
		data: {
			cardData
		}
	}
}

proto.GAME_HUAN_PAI_PUSH = 616;
proto.GAME_USER_HUAN_PAI_SUGGEST_PUSH = 617;
proto.GAME_USER_HUAN_PAI_END_PUSH = 620;
proto.GAME_USER_TING_PAI_CARDS_PUSH = 621;

//抢杠胡 抢提胡后删除手牌推送
proto.GAME_QIANG_GANG_QIANG_TI_DELETE_PUSH = 628;
proto.gameQiangGangDeletePush = function (uid, card) {
	return {
		type: this.GAME_QIANG_GANG_QIANG_TI_DELETE_PUSH,
		data: {
			uid,
			card
		},
	};
};

proto.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY = 551; /* 下局换牌 */
proto.GAME_SUBSTRATUM_TRADE_CARDS_PUSH = 651; /* 下局换牌结果 */
proto.GAME_INQTIRE_ARRCARDS_NOTIFY = 552; /* 查询牌库 */
proto.GAME_INQTIRE_ARRCARDS_PUSH = 652; /*查询牌库结果 */

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
