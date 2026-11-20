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
	/* 显示结果 */
	RESULT: 4,
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
	BU_HUA: 13, //补花操作
	YOU_JIN: 14, //游金
	SI_BAI_BAN: 15, //4个白板胡牌
};

proto.cardType = {
	PINGHU: 1, //平胡
	DADUIZI: 2, //大队子
	QIDUI: 3, //七对
}

//当前游戏飘花状态
proto.piaoHuaStatus = {

	NONE: 0,
	BAOTOU: 1, //爆头
	PIAOHUA: 2, //飘花
	DUOPIAOHUA: 3, //多飘花
	SANPIAOHUA: 4, //三飘花
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
	WUHUADADIAO: 1,//无花大吊 自摸8分 放炮10分
	BAOTOU: 2,//爆头 每家两分
	GANGBAO: 3,//杠爆 每家4分
	PIAOHUA: 4,//飘花4分
	DUOPIAOHUA: 5,//多飘花8分
	GANGPIAO: 6,//杠飘 飘花分*2
	SANPIAOHUA: 7,//三飘花
	GANG: 8,//杠
	ZIMO: 9,//自摸
	QIANGGANGHU: 10,  //抢杠胡
	TIANHUA: 11,//天胡16分
	JIEPAO: 12, //接炮
	SHAIZI: 13,//色子翻倍
	LIUJU: 14,//流局翻倍
	TIANHU: 15, //天胡
	SIBNAIBAN: 16, //四白板
	GANGSHANGHUA: 17, //杠上花
	WUHUA: 18,//无花
	DANDIAO: 19, //单吊摸花
	GANGSHANGPAO: 20, //杠上炮
	HUADADIAO: 21,//花大吊
	HUADIAOHUA: 22, //花吊花
	DADIAOPIAOHUA: 23, //大吊飘花
	SHUANGGANGBAO: 24, //双杠杠爆
	SANGANGBAO: 25, //三杠杠爆
	SHUANGGANGPIAO: 26, //双杠杠飘
	DANGANGPIAO: 27, //三杠杠飘
	GANGKAIPINGHU: 28, //杠开平胡
	DANDIAOGANGHUA: 29, //单吊杠花
	DANDIAOGANGYUANZHANG: 30,// 单吊杠原张
	DIANDIAOFANGPAO: 31, //单吊放炮
	DANDIAOYUANZHANG: 32, //单吊摸原张
	DIHU: 33,  //地胡
}

proto.plusRateTypeStr = {
	[1]: "无花大吊",
	[2]: "爆头",
	[3]: "杠爆",
	[4]: "飘花",
	[5]: "多飘花",
	[6]: "杠飘",
	[7]: "三飘花",
	[8]: "杠",
	[9]: "自摸",
	[10]: "抢杠胡",
	[11]: "天胡",
	[12]: "接炮",
	[13]: "色子翻倍",
	[14]: "流局翻倍",
	[15]: "天胡",
	[16]: "四白板",
	[17]: "杠上花",
	[18]: "无花",
	[19]: "单吊摸花",
	[20]: "杠上炮",
	[21]: "花大吊",
	[22]: "花吊花",
	[23]: "大吊飘花",
	[24]: "双杠杠爆",
	[25]: "三杠杠爆",
	[26]: "双杠杠飘",
	[27]: "三杠杠飘",
	[28]: "杠开平胡",
	[29]: "单吊杠花",
	[30]: "单吊杠原张",
	[31]: "单吊放炮",
	[32]: "单吊摸原张",
	[33]: "地胡",
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

proto.GAME_REST_CARDS_COUNT_PUSH = 513;
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

//占位用
proto.GAME_HUAN_PAI_CHOOSE_PUSH = 999;
proto.GAME_HUAN_PAI_END_PUSH = 1000;
proto.GAME_USER_DING_QUE_PUSH = 10001;
proto.GAME_USER_HUAN_PAI_SUGGEST = 9221;
proto.GAME_XIAYU_PUSH = 10222;



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


//玩家托管
proto.GAME_TRUST_NOTIFY = 505;
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

proto.gameTrushNotify = function (trust) {
	return {
		type: this.GAME_TRUST_NOTIFY,
		data: {
			trust: trust,
		},
	};
};


//飘花限制推送
proto.PIAO_HUA_LIMIT_PUSH = 611;
proto.piaoHuaLimitPush = function (uid, isLimit = false) {
	return {
		type: this.PIAO_HUA_LIMIT_PUSH,
		data: { uid, isLimit }
	};
};


proto.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY = 551; /* 下局换牌 */
proto.GAME_SUBSTRATUM_TRADE_CARDS_PUSH = 651; /* 下局换牌结果 */
proto.GAME_INQTIRE_ARRCARDS_NOTIFY = 552; /* 查询牌库 */
proto.GAME_INQTIRE_ARRCARDS_PUSH = 652; /*查询牌库结果 */

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
