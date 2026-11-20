/*
 * 麻将协议
 */
var proto = module.exports;

proto.gameStatus = {
	NONE: 0,
	/* 等待操作 */
	DICES: 1,
	/* 骰子 */
	SEND_CARDS: 2,
	/* 发牌中 */
	PLAYING: 3,
	/* 游戏中 */
	RESULT: 4,
	/* 显示结果 */
	HUANSANZHANG: 5,
	DINGQUE: 6
};

proto.gameStatusTm = {
	NONE: 0,
	/* 等待操作 */
	DICES: 2,
	/* 抢庄 */
	SEND_CARDS: 5,
	/* 发牌中 */
	PLAYING: 15,
	/* 游戏中 */
	RESULT: 3,
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
	HU_CHI: 1,
	/* 吃胡 */
	HU_ZHI: 2,
	/* 自摸 */
	PENG: 3,
	/* 碰 */
	GANG_CHI: 4,
	/* 吃杠 */
	GANG_BU: 5,
	/* 补杠 */
	GANG_ZHI: 6,
	/* 自摸杠 */
	GUO: 7,
	/* 过 */
	QI: 8,
	/* 弃牌 */
	GET: 9,
	/* 拿牌 */
	CHI: 10,
	/* 吃牌 */
	HU_QIANG: 12,
	/*抢杠胡 */
	BU_HUA: 13,
	/*补花 */
	YOU_JIN: 14,
	/*游金 */
	SAN_JIN: 15,
	/*三金倒 */
};

proto.cardType = {
	PINGHU: 1, //平胡
	DADUIZI: 2, //大队子
	QIDUI: 3, //七对
}

proto.userWinResult = {
	baseTotalScore: '累计',
	youJinRate: '游金',
	youJinAward: '游金奖励',
	baseScore: '底分',
	liangZhuangScore: '连庄',
	laiZiCount: '金',
	huaCount: '补花',
	anKeCount: '暗刻',
	pengCount: '碰',
	gangCount: '杠',
}

//加蕃类型
proto.plusRateType = {
	YADANG: 1, //压档1分
	DUIDUIHU: 2, //对对胡2分
	YADANGJUEZHANG: 3, //压档绝张4分
	YITIAOLONG: 4, //一条龙1分
	KAWU: 5, //卡五
	DUANYAOJIU: 6, //断幺九 1分
	SIHE: 7, //四核 1分
	QINGYISE: 8, //清一色 4分
	HUNYISE: 9, //混一色 4分
	SHUANGBAZHI: 10, //双8支 4分
	GANGSHANGHUA: 11, //杠上花 4分
	TIANHU: 12, //天胡
	DIHU: 13, //地胡
	SHILAO: 14, //十老
	SHIXIAO: 15, //十小
	QUANLAO: 16, //全老
	QUANXIAO: 17, //全小
	WUTONG: 18, //五同
	DUI: 19, //对子加分
	ZHUANG: 20, //庄家分
	LIANZHUANG: 21, //连庄
	BUPENG: 22, //不碰
	TIANTING: 23, //天听
	FACAIGANG: 24, //发财明杠一分 暗杠2分
	MINGGANG: 25, //明杠
	ANGANG: 26, //暗杠
	BAZHI: 27, //八支
	PINGHU: 28, //平胡
	SHIYIZHI: 29, //11支
	BATONG: 30, //八同
	YIQUE: 31, //一缺
	ERQUE: 32, //二缺
	SANQUE: 33, //三缺
	QITONG: 34, //七同
	SHITONG: 35, //十同
	SHUANGTONG: 36, //双同
	QUE: 37 //缺
}

proto.plusRateTypeStr = {
	[1]: "压档",
	[2]: "对对胡",
	[3]: "压档绝张",
	[4]: "一条龙",
	[5]: "卡五",
	[6]: "断幺九",
	[7]: "四核",
	[8]: "清一色",
	[9]: "混一色",
	[10]: "双八支",
	[11]: "杠上花",
	[12]: "天胡",
	[13]: "地胡",
	[14]: "十老",
	[15]: "十小",
	[16]: "全老",
	[17]: "全小",
	[18]: "五同",
	[19]: "对子",
	[20]: "庄家",
	[21]: "连庄",
	[22]: "不碰",
	[23]: "天听",
	[24]: "杠发财",
	[25]: "明杠",
	[26]: "暗杠",
	[27]: "八支",
	[28]: "平胡",
	[29]: "十一支",
	[30]: "八同",
	[31]: "一缺",
	[32]: "二缺",
	[33]: "三缺",
	[34]: "七同",
	[35]: "十同",
	[36]: "双同",
	[37]: "缺",
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