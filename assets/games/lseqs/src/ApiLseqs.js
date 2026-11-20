/*
 * 幺地人协议
 */
var proto = module.exports;

proto.gameStatus = {
	NONE: 0,
	SEND_CARDS: 1, //发牌
	QI_CARDS: 2, //庄家起牌
	TOU_CARDS: 3, //闲家偷牌
	PLAYING: 4, //游戏轮
	RESULT: 5,

};

proto.gameStatusTm = {
	NONE: 0,
	SEND_CARDS: 2, //发牌
	QI_CARDS: 15, //庄家起牌
	TOU_CARDS: 15, //闲家偷牌
	PLAYING: 15, //游戏轮
	RESULT: 10,
};

//游戏状态
proto.userGameStatus = {
	NONE: 0,
	PLAYING: 1, //游戏
	KOU: 2, //下课
	BAOZI: 3, //包子
};

//麻将操作类型
proto.operateType = {
	NONE: 0,
	HU: 1,  //胡
	KAI: 2, //开
	DUI: 3,  //对
	CHI: 4, //吃
	GET: 5, //摸牌
	QI: 6,   //弃牌
	DIU: 7,  //丢牌堆
	FAN: 8, //翻牌
	GUO: 9,//过牌
	BAYU: 10,//巴雨
};

//加蕃类型
proto.plusRateType = {
	TIANHU: 1, //天胡
	DIHU: 2, //地胡
	KUNHU: 3,//坤胡
	QUANHU: 4,//圈胡
	SHUANGQUAN: 5,//双圈
	QINGYISE: 6,//清一色
	PIAOHU: 7, // 漂胡
	BAYU: 8, //巴雨
	KAI: 9, //开
	DIANKAI: 10,//点开
	NEIGUN: 11, //内滚
	TAIPAO: 12, //抬炮
	ZIMO: 13, //自摸
	DAHU: 14,//大胡
}

proto.plusRateTypeStr = {
	[1]: "天胡",
	[2]: "地胡",
	[3]: "坤胡",
	[4]: "圈胡",
	[5]: "双圈",
	[6]: "清一色",
	[7]: "漂胡",
	[8]: "巴雨",
	[9]: "开",
	[10]: "点开",
	[11]: "内滚",
	[12]: "抬炮",
	[13]: "自摸",
	[14]: "大胡",
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

//更新玩家手牌信息
proto.UPDATE_USER_CARDS_PUSH = 602;
proto.updateUserCardsPush = function (uid, handCards, handBaiCards, operateCardList) {

	return {
		type: this.UPDATE_USER_CARDS_PUSH,
		data: {
			uid,
			handCards,
			handBaiCards,
			operateCardList
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
proto.gameOperateNotify = function (operate, card, cardList, baiList, customEx) {
	return {
		type: this.GAME_TURN_OPERATE_NOTIFY,
		data: {
			card,
			operate,
			cardList,
			baiList,
			customEx
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
proto.gameSubstratumTradeCardsNotify = function (uid, nextUid, type, cards) {
	return {
		type: this.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY,
		data: {
			uid: uid,
			nextUid: nextUid,
			type: type,
			cards: cards,
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