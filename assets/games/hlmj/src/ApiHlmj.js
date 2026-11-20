/*
 * 麻将协议
 */
var proto = module.exports;

proto.gameStatus = {
	/* 等待操作 */
	NONE: 0,
	/* 骰子 */
	DICES: 1,
	/* 发牌中 */
	SEND_CARDS: 2,
	/* 游戏中 */
	PLAYING: 3,
	HUANSANZHANG: 4, //换三张
	/* 显示结果 */
	RESULT: 10,
};

proto.gameStatusTm = {
	NONE: 0,
	/* 等待操作 */
	DICES: 2,
	/* 抢庄 */
	SEND_CARDS: 2,
	/* 发牌中 */
	PLAYING: 15,
	/* 游戏中 */
	HUANSANZHANG: 15, //换三张
	RESULT: 30,
	/* 显示结果 */
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
};

//记录类型
proto.recordType = {
	ZIMO: 1, //自摸
	BEIZIMO: 2, //被自摸
	DIANPAO: 3, //点炮
	JIEPAO: 4, //接炮
	GUAFENG: 5, //刮风
	BEIGUAFENG: 6, //被刮风
	CAGUA: 7, //被刮风(擦挂)
	XIAYU: 8, //下雨
	BEIXIAYU: 9, //被下雨
	TUISHUI: 10, //退税
	CHAJIAO: 11, //查叫
	HUAZHU: 12, //花猪
	HUJIAOZHUANYI: 13, //呼叫转移
}

//记录类型
proto.recordTypeStr = {
	[1]: "自摸",
	[2]: "被自摸",
	[3]: "点炮",
	[4]: "接炮",
	[5]: "刮风",
	[6]: "被刮风",
	[7]: "擦挂",
	[8]: "下雨",
	[9]: "被下雨",
	[10]: "退税",
	[11]: "查叫",
	[12]: "花猪",
	[13]: "呼叫转移",
}

//房数
proto.roomType = {
	/*  一房*/
	ONE: 1,
	/* 二房 */
	TWO: 2,
	THREE: 3, //三房
};

//自摸翻倍设置
proto.ziMoRateType = {
	NONE: 0, //不加
	DI: 1, //加底
	DOUBLE: 2, //加倍
};

proto.gameStatusTm = {
	/* 等待操作 */
	NONE: 0,
	/*骰子*/
	DICES: 3,
	/* 下分中 */
	SEND_CARDS: 3,
	/* 游戏中 */
	PLAYING: 0,
	/* 定缺 */
	DINGQUE: 15,
	HUANSANZHANG: 15, //换三张
	/* 显示结果 */
	RESULT: 5,
};

proto.operateType = {
	NONE: 0,
	/* 吃胡 */
	HU_CHI: 1,
	/* 自摸 */
	HU_ZHI: 2,
	/* 碰 */
	PENG: 3,
	/* 吃杠 */
	GANG_CHI: 4,
	/* 补杠 */
	GANG_BU: 5,
	/* 自摸杠 */
	GANG_ZHI: 6,
	/* 过 */
	GUO: 7,
	/* 弃牌 */
	QI: 8,
	/* 拿牌 */
	GET: 9,
	/* 吃牌 */
	CHI: 10,
	/*抢杠胡 */
	HU_QIANG: 12,
	MOPAI: 13, //摸牌
	BAIPAI: 14, //玩家摆牌
};

proto.cardType = {
	PINGHU: 1, //平胡
	DADUIZI: 2, //大队子 2分
	QIDUI: 3, //七小对
	QIYISE: 4,
}

//加蕃类型
proto.plusRateType = {
	TIANHU: 1, //天胡
	DIHU: 2, //地胡
	GANGSHANGPAO: 3, //杠上炮
	GANGSHANGHUA: 4, //杠上花
	QIANGGANGHU: 5, //抢杠胡
	QINGYISE: 6, //清一色
	LONGQIDUI: 7, //龙七对
	DADUIZI: 8, //对对胡
	QIDUI: 9, //7对
	GANG: 10, //杠分
	PINGHU: 11, //平胡
	ZIMO: 12, //自摸
	QINGDIDUI: 13, //清七对
	QINGLONGQIDUI: 14, //清龙七对
	QINGSHUANGLONGQIDUI: 15, //清双龙七对
	YAOJIU: 16, //幺九
	YAOJIUDADUIZI: 17, //杠分
	JIANGDUI: 18, //将对
	JIANGQIDUI: 19, //将七对
	JIANGLONGQIDUI: 20, //将龙七对
	JIANGSHUANGLONGQIDUI: 21, //将双龙七对
	QINGDADUI: 22, //清对对胡
	KAWU: 23, //卡心五
	HAIDI: 24, //海底
	MENQING: 25, //门清中张
	QUEYIMEN: 26, //缺一门
	XIAOFEIYANG: 27, //小肥羊
	BAIPAI: 28, //摆牌
}

proto.plusRateTypeStr = {
	[1]: "天胡",
	[2]: "地胡",
	[3]: "杠上炮",
	[4]: "杠上花",
	[5]: "抢杠胡",
	[6]: "清一色",
	[7]: "龙七对",
	[8]: "对对胡",
	[9]: "七对",
	[10]: "杠",
	[11]: "平胡",
	[12]: "自摸",
	[13]: "清七对",
	[14]: "清龙七对",
	[15]: "清双龙七对",
	[16]: "幺九",
	[17]: "幺九大对子",
	[18]: "将对",
	[19]: "将七对",
	[20]: "将龙七对",
	[21]: "将双龙七对",
	[22]: "清对对胡",
	[23]: "卡心五",
	[24]: "海底",
	[25]: "门清中张",
	[26]: "缺一门",
	[27]: "小肥羊",
	[28]: "摆牌",
	[29]: "",
	[30]: "",
	[31]: "",
	[32]: "",
	[33]: "",
	[34]: "",
	[35]: "",
	[36]: "",
	[37]: "",
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
proto.gameHuanPaiPush = function (uid, cards) {
	return {
		type: this.GAME_HUAN_PAI_PUSH,
		data: {
			uid,
			cards
		},
	};
};


proto.GAME_USER_HUAN_PAI_SUGGEST_PUSH = 617;
proto.gameHuanPaiSuggest = function (uid, cardList, huanPaiType) {
	return {
		type: this.GAME_USER_HUAN_PAI_SUGGEST_PUSH,
		data: {
			uid,
			cardList,
			huanPaiType
		},
	};
};

proto.GAME_USER_HUAN_PAI_END_PUSH = 618;
proto.gameHuanPaiEndPush = function (uid, cardList) {
	return {
		type: this.GAME_USER_HUAN_PAI_END_PUSH,
		data: {
			uid,
			cardList
		},
	};
};

//玩家晒牌
proto.GAME_USER_SHAI_PAI_NOTIFY = 519;
proto.gameShaiPaiNotify = function (cardList) {
	return {
		type: this.GAME_USER_SHAI_PAI_NOTIFY,
		data: {
			cardList
		},
	};
};
proto.GAME_USER_SHAI_PAI_PUSH = 619;
proto.gameShaiPaiPush = function (uid, cardList) {
	return {
		type: this.GAME_USER_SHAI_PAI_PUSH,
		data: {
			uid,
			cardList
		},
	};
};

//玩家晒牌轮推送
proto.GAME_SHAI_PAI_TURN_PUSH = 520;
proto.gameShaiPaiTurnPush = function (uid, isGuo = false) {
	return {
		type: this.GAME_SHAI_PAI_TURN_PUSH,
		data: {
			uid,
			isGuo
		},
	};
};

proto.GAME_GANG_SCORE_PUSH = 626;
proto.gameGangScorePush = function (uid, detail) {
	return {
		type: this.GAME_GANG_SCORE_PUSH,
		data: {
			uid,
			detail
		},
	};
};

proto.GAME_ALL_HU_CARDS_PUSH = 627;
proto.gameAllHuCardsPush = function (allHuCards) {
	return {
		type: this.GAME_ALL_HU_CARDS_PUSH,
		data: {
			allHuCards
		},
	};
};

//删除手牌推送
proto.GAME_QIANG_GANG_DELETE_PUSH = 628;
proto.gameQiangGangDeletePush = function (uid, card) {
	return {
		type: this.GAME_QIANG_GANG_DELETE_PUSH,
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

// proto.gameSubstratumTradeCardsNotify = function (cardData) {
// 	return {
// 		type: this.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY,
// 		data: {
// 			cardData: cardData, 
// 		},
// 	};
// };

proto.gameSubstratumTradeCardsNotify = function (nullType, uid, nextUid, type, cards, handCards) {
	return {
		type: this.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY,
		data: {
			nullType: nullType,
			uid: uid,
			nextUid: nextUid,
			type: type,
			Cards: cards,
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
			nextUid: nextUid
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
