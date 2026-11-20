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
	BAOTING: 5,//报听 
};

//状态等待时间
proto.gameStatusTm = {
	NONE: 0, //等待操作
	DICES: 2, //骰子
	SEND_CARDS: 2, //发牌中 
	PLAYING: 15, //游戏中 
	RESULT: 5, //显示结果 
};

proto.huType = {
	DIAN: 1, //点炮
	ZIMO: 2, //自摸
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
	TIAOWU: 60, //跳舞
	BAOTING: 65,//报听	
	CHANGGE: 70, //唱歌
};

//用户卡牌类型
proto.cardType = {
	NONE: 0,//不能胡
	DADUIZI: 1, //大对子
	kAXINWU: 2, //卡心五
	QINGYISE: 3, //清一色
	YAOJIUPAI: 4, //幺九牌
	SHOUBAYI: 5, //手把一
	LONGQIDUI: 6, //龙七对
	QINGDADUI: 7, //清大对
	JIANGDADUI: 8, //将大对
	QINGQIDUI: 9, //清七对
	LONGFENGDUI: 10,//龙凤对
	QINGYAOJIU: 11, //清幺九
	QINGYISESHOUBAYI: 12, //清一色手把一
	QINGLONGQIDUI: 13, //清龙七对
	QINGLONGFENGDUI: 14, //清龙凤对
	QIDUI: 15, //七对
	PINGHU: 16, //平胡
}

proto.cardTypeStr = {
	[0]: "不能胡",
	[1]: "大对子",
	[2]: "卡心五",
	[3]: "清一色",
	[4]: "幺九牌",
	[5]: "手把一",
	[6]: "龙七对",
	[7]: "清大对",
	[8]: "将大对",
	[9]: "清七对",
	[10]: "龙凤对",
	[11]: "清幺九",
	[12]: "清一色手把一",
	[13]: "清龙七对",
	[14]: "清龙凤对",
	[15]: "七对",
	[16]: "平胡",
	[17]: "",
	[18]: "",
	[19]: "",
	[20]: "",
	[21]: "",
}

//加蕃类型
proto.plusType = {
	NONE: 0,
	GANGHUA: 1,  //杠上花
	GANGPAO: 2, //杠上炮
	QIANGHU: 3, //抢杠胡
	YITIAOLONG: 4, //一条龙
	MINGSIGUIYI: 5, //明四归一
	ANSIGUIYI: 6, //暗四归一
	BIANKADIAO: 7,//边卡吊
	CHANGGE: 8,//唱歌
	TIAOWU: 9,//跳舞
	BAOJIAO: 10,//报叫
	DUICHANG: 11,//对唱
	YICHANGYITIAO: 12,//一唱一跳
	DUITIAO: 13,//对跳
	TIANHU: 14,//天胡
	DIHU: 15,//地胡
}


proto.plusRateTypeStr = {
	[0]: "无",
	[1]: "杠上花",
	[2]: "杠上炮",
	[3]: "抢杠胡",
	[4]: "一条龙",
	[5]: "明四归一",
	[6]: "暗四归一",
	[7]: "边卡吊",
	[8]: "唱歌",
	[9]: "跳舞",
	[10]: "报叫",
	[11]: "对唱",
	[12]: "一唱一跳",
	[13]: "对跳",
	[14]: "天胡",
	[15]: "地胡",
	[16]: "",
	[17]: "",
	[18]: "",
	[19]: "",
	[20]: "",
	[21]: "",
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

//玩家刮风下雨
proto.GAME_GANG_SCORE_PUSH = 617;
proto.gameGangScorePush = function (uid, score) {
	return {
		type: this.GAME_GANG_SCORE_PUSH,
		data: {
			uid, score
		},
	};
};

//玩家可以报听推送
proto.GAME_BAO_TING_START_PUSH = 618;
proto.gameBaoTingStartPush = function (uid) {
	return {
		type: this.GAME_BAO_TING_START_PUSH,
		data: {
			uid
		},
	};
};

//玩家操作的报听
proto.GAME_BAO_TING_OPERATE_NOTIFY = 519;
proto.gameBaoTingOperateNotify = function (operate, cardList) {
	return {
		type: this.GAME_BAO_TING_OPERATE_NOTIFY,
		data: {
			operate: operate,
			cardList: cardList,
		},
	};
};
proto.GAME_BAO_TING_OPERATE_PUSH = 619;
proto.gameBaoTingOperatePush = function (uid, operate) {
	return {
		type: this.GAME_BAO_TING_OPERATE_PUSH,
		data: {
			uid, operate
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