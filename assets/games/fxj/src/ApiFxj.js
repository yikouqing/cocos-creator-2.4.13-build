/*
 * 麻将协议
 */
var proto = module.exports;

proto.GAME_STATUS_PUSH = 401; /* 状态推送 */
proto.GAME_BANKER_PUSH = 402; /* 庄家推送 */
proto.GAME_DICES_PUSH = 403; /* 骰子推送 */
proto.GAME_SEND_CARDS_PUSH = 404;
proto.GAME_REST_CARDS_COUNT_PUSH = 405; /* 剩余牌数推送 */

proto.GAME_TURN_PUSH = 406; /* 自己出牌 */
proto.GAME_TURN_OPERATE_NOTIFY = 307;
proto.GAME_TURN_OPERATE_PUSH = 407;

proto.GAME_RESULT_PUSH = 408; /* 游戏结果推送 */
proto.GAME_BUREAU_PUSH = 409; /* 局数推送 */
proto.GAME_END_PUSH = 410; /* 游戏结束推送 */

proto.GAME_CHAT_NOTIFY = 311; /* 游戏聊天 */
proto.GAME_CHAT_PUSH = 411;

proto.GAME_TRUST_NOTIFY = 312; /* 托管 */
proto.GAME_TRUST_PUSH = 412; /* 托管 */

proto.GAME_REVIEW_NOTIFY = 313; /* 牌面回顾 */
proto.GAME_REVIEW_PUSH = 413;

proto.GAME_DISMISS_PUSH = 414; /* 解散房间 */

proto.GAME_USER_PIG_SCORE_NOTIFY = 330; /* 养猪结果通知 */
proto.GAME_USER_PIG_SCORE_PUSH = 430; /* 养猪通知 */

proto.GAME_START_PIG_SCORE_PUSH = 431; /* 开始养猪通知 */

proto.GAME_BU_GANG_CARDS_CHOOSE_PUSH = 432; /*用户补杠选择推送 */

proto.GAME_RESET_CARDS_WARN_PUSH = 433; /*剩余牌数量更新 */

proto.GAME_RESET_BU_GANG_CARDS_PUSH = 434; /*补杠牌更新推送 */

//----------------------------调试功能------------------------------------
proto.GAME_LOOK_CARDS_NOTIFY = 316; /* 看牌 */
proto.GAME_LOOK_CARDS_PUSH = 416; /* 看牌结果 */

proto.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY = 317; /* 下局换牌 */
proto.GAME_SUBSTRATUM_TRADE_CARDS_PUSH = 417; /* 下局换牌结果 */

proto.GAME_INQTIRE_ARRCARDS_NOTIFY = 318; /* 查询牌库 */
proto.GAME_INQTIRE_ARRCARDS_PUSH = 418; /*查询牌库结果 */

proto.gameStatus = {
	/* 等待操作 */
	NONE: 0,
	/*骰子*/
	DICES: 1,
	/* 下分中 */
	SEND_CARDS: 2,
	/* 游戏中 */
	PLAYING: 3,
	/* 养猪 */
	PIGSCORE: 4,
	/* 显示结果 */
	RESULT: 5,
};

proto.gameStatusTm = {
	/* 等待操作 */
	NONE: 0,
	DICES: 3,
	/* 下分中 */
	SEND_CARDS: 3,
	/* 游戏中 */
	PLAYING: 0,
	/* 扎马 */
	ZHAMA: 5,
	/* 显示结果 */
	RESULT: 5,
};

//养猪分数
proto.pigScoreType = {
	/* 不养猪 */
	NONE: 0,
	/* 养一猪 */
	ONE: 1,
	/* 养二猪 */
	TWO: 2,
	/* 自由养猪 */
	FREE: 3,
};

//玩法类型
proto.playType = {
	/* 飞小鸡 */
	FEIXIAOJI: 1,
	/* 飞白板 */
	FEIBAIBAN: 2,
	/* 飞双鬼 */
	FEISHUANGGUI: 3,
	/* 硬麻将 */
	YINGMAJIANG: 4,
};

proto.gameType = {
	/* 4个红中 */
	HONGZHONG4: 1,
	/* 8个红中 */
	HONGZHONG8: 2,
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
	/*杠选择牌 */
	GANG_CHOOSE: 11,
};

proto.cardType = {
	DADUIZI: 1, //大队子
	HUNYISE: 2, //混一色
	QINGYISE: 3, //清一色
	QIDUI: 4, //七对
	QINGQIDUI: 5, //清七对
	QINGDADUI: 6, //清大队
	LONGBEIZHUA: 7, //龙背爪
	HUNSANYUAN: 8, //混三元
	SHIFEN: 9, //十风
	SHISANYAO: 10, //十三幺
	DASANYUAN: 11, //大三元
	DASIXI: 12, //大四喜
	SIXIAOJI: 13, //四小鸡
	LIUXIN: 14, //五六星烂牌
	QIXIN: 15, //七星
	QUANQIUREN: 16, //全求人
	MENQING: 17, //门清
	YITIAOLONG: 18, //一条龙
	PINGHU: 19, //平胡
	FENGYISE: 20, //风一色
	BAGUI: 21, //八鬼
	WULAI: 22, //无癞
	LIUXINZIMEI: 23, //五星姊妹烂牌
	SHOUTISHISANYAO: 24, //手提十三幺
	HUNDADUI: 25, //混大队
	QIXINLAIZLAN: 26, //七星癞子烂牌
	SIGUI: 27, //四鬼
	LIUXINLAIZI: 28, //五六星癞子烂牌
	HUNQIDUI: 29, //混七对
}

proto.cardTypeStr = {
	[0]: "",
	[1]: "大对子", //大队子
	[2]: "混一色", //混一色
	[3]: "清一色", //清一色
	[4]: "七对", //七对
	[5]: "清七对", //清七对
	[6]: "清大对", //清大队
	[7]: "龙背爪", //龙背爪
	[8]: "混三元", //混三元
	[9]: "十风", //十风
	[10]: "十三幺", //十三幺
	[11]: "大三元", //大三元
	[12]: "大四喜", //大四喜
	[13]: "四小鸡", //四小鸡
	[14]: "五六星烂牌", //五六星烂牌
	[15]: "七星烂牌", //七星
	[16]: "全求人", //全求人
	[17]: "门清", //门清
	[18]: "一条龙", //一条龙
	[19]: "平胡", //平胡
	[20]: "风一色",
	[21]: "八鬼",
	[22]: "无癞",
	[23]: "五星姊妹烂牌",
	[24]: "手提十三幺",
	[25]: "混大对",
	[26]: "七星癞子烂牌",
	[27]: "四鬼",
	[28]: "五六星癞子烂牌",
}

//加蕃类型
proto.plusRateType = {
	GANGSHANGHUA: 1, //杠上花
	GANGSHANGPAO: 2, //杠上炮
	WUMEIHUA: 3, //杠上五梅花
	SHUANGGANG: 4, //双杠
	SHUANGGANGHUA: 5, //双杠上花
	SANGANGHUA: 6, //三杠上花
	WUJI: 7, //无鸡
	QIANGGANG: 8, //抢杠
	SANGANG: 9, //三杠
	WULAI: 10, //无癞
	MENQING: 11, //门清
	YITIAOLONG: 12, //一条龙
	HUNYISE: 13, //混一色
}

proto.plusRateTypeStr = {
	[1]: "杠上花", //杠上花
	[2]: "杠上炮", //杠上炮
	[3]: "杠上五梅花", //杠上五梅花
	[4]: "双杠", //双杠
	[5]: "双杠上花", //双杠上花
	[6]: "三杠上花", //三杠上花
	[7]: "无鸡", //无鸡
	[8]: "抢杠", //抢杠
	[9]: "三杠", //三杠
	[10]: "无癞", //三杠
	[11]: "门清", //三杠
	[12]: "一条龙", //三杠
	[13]: "混一色", //三杠
}

proto.operateTm1 = 30; /* 弃牌操作时间 */
proto.operateTm2 = 30; /* 碰杠操作时间 */
proto.operateGangChooseTm = 15; /* 杠牌选择时间 */

//玩家开始养猪推送431
proto.gameStartPigScorePush = function (pigScore, tick) {
	return {
		type: this.GAME_START_PIG_SCORE_PUSH,
		data: {
			pigScore: pigScore,
			tick: tick,
		},
	};
};

//玩家养猪分数推送330
proto.gamePigScoreNotify = function (score) {
	return {
		type: this.GAME_USER_PIG_SCORE_NOTIFY,
		data: {
			score: score
		},
	};
}

//玩家养猪分数推送430
proto.gamePigScorePush = function (chairID, score) {
	return {
		type: this.GAME_USER_PIG_SCORE_PUSH,
		data: {
			chairID,
			score
		},
	};
};

//剩余牌张数推送433
proto.gameResetCardsWarnPush = function (count) {
	return {
		type: this.GAME_RESET_CARDS_WARN_PUSH,
		data: {
			count
		},
	};
};

//推送补杠的牌列表消息434
proto.gameRestBuGangCardsPush = function (cards) {
	return {
		type: this.GAME_RESET_BU_GANG_CARDS_PUSH,
		data: {
			cards
		},
	};
};

//玩家选择补杠牌的推送432
proto.gameBuGangCardsChoosePush = function (cards) {
	return {
		type: this.GAME_BU_GANG_CARDS_CHOOSE_PUSH,
		data: {
			cards
		},
	};
};

proto.gameStatusPush = function (gameStatus, tick) {
	return {
		type: this.GAME_STATUS_PUSH,
		data: {
			gameStatus: gameStatus,
			tick: tick,
		},
	};
};

proto.gameBankerPush = function (bankerChairID) {
	return {
		type: this.GAME_BANKER_PUSH,
		data: {
			bankerChairID: bankerChairID,
		},
	};
};

proto.gameDicesPush = function (dice1, dice2) {
	return {
		type: this.GAME_DICES_PUSH,
		data: {
			dice1: dice1,
			dice2: dice2,
		},
	};
};

proto.gameSendCardsPush = function (handCards, chairID) {
	return {
		type: this.GAME_SEND_CARDS_PUSH,
		data: {
			handCards: handCards,
			chairID: chairID,
		},
	};
};

proto.gameRestCardsCountPush = function (restCardsCount) {
	return {
		type: this.GAME_REST_CARDS_COUNT_PUSH,
		data: {
			restCardsCount: restCardsCount,
		},
	};
};

proto.gameOperateArrayPush = function (chairID, card, tick, operateArray) {
	return {
		type: this.GAME_TURN_PUSH,
		data: {
			chairID: chairID,
			card: card,
			tick: tick,
			operateArray: operateArray,
		},
	};
};

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

proto.gameOperatePush = function (chairID, card, operate, success) {
	return {
		type: this.GAME_TURN_OPERATE_PUSH,
		data: {
			chairID: chairID,
			card: card,
			operate: operate,
			success: success,
		},
	};
};

proto.gameResultPush = function (result) {
	return {
		type: this.GAME_RESULT_PUSH,
		data: {
			result: result,
		},
	};
};

proto.gameBureauPush = function (curBureau) {
	return {
		type: this.GAME_BUREAU_PUSH,
		data: {
			curBureau: curBureau,
		},
	};
};

proto.gameEndPush = function (result, winMost, loseMost, creater) {
	return {
		type: this.GAME_END_PUSH,
		data: {
			result: result,
			winMost: winMost,
			loseMost: loseMost,
			creater: creater,
		},
	};
};

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

proto.gameTrushNotify = function (trust) {
	return {
		type: this.GAME_TRUST_NOTIFY,
		data: {
			trust: trust,
		},
	};
};

proto.gameTrushPush = function (chairID, trust) {
	return {
		type: this.GAME_TRUST_PUSH,
		data: {
			chairID: chairID,
			trust: trust,
		},
	};
};

proto.gameReviewNotify = function () {
	return {
		type: this.GAME_REVIEW_NOTIFY,
		data: {},
	};
};

proto.gameReviewPush = function (reviewRecord) {
	return {
		type: this.GAME_REVIEW_PUSH,
		data: {
			reviewRecord: reviewRecord,
		},
	};
};

proto.gameDismissPush = function (userArray, creator, reason, hongBaoList) {
	return {
		type: this.GAME_DISMISS_PUSH,
		data: {
			userArray: userArray,
			creator: creator,
			reason: reason,
			hongBaoList: hongBaoList,
		},
	};
};

proto.gameGetAllCardPush = function (chairID, cards) {
	return {
		type: this.GAME_GET_ALLCARD_PUSH,
		data: {
			chairID: chairID,
			cards: cards,
		},
	};
};

proto.gameLookCardsNotify = function (chairID) {
	return {
		type: this.GAME_LOOK_CARDS_NOTIFY,
		data: {
			chairID: chairID
		},
	};
};

proto.gameLookCardsPush = function (userArray) {
	return {
		type: this.GAME_LOOK_CARDS_PUSH,
		data: {
			userArray: userArray,
		},
	};
};

// proto.gameSubstratumTradeCardsNotify = function (chairID, cardDataArr) {
// 	return {
// 		type: this.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY,
// 		data: {
// 			chairID: chairID,
// 			cardDataArr: cardDataArr, 
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
			trust: trust,
		},
	};
};

// proto.gameInqtireArrcardsNotify = function (chairID) {
// 	return {
// 		type: this.GAME_INQTIRE_ARRCARDS_NOTIFY,
// 		data: {
// 			chairID: chairID,
// 		},
// 	};
// };

// 新查询牌库  type  //0查询当前牌库 1查询下局牌库
proto.gameInqtireArrcardsNotify = function (type, nextUid) {
	return {
		type: this.GAME_INQTIRE_ARRCARDS_NOTIFY,
		data: {
			type: type,
			nextUid: nextUid,
		},
	};
};

proto.gameireArrcardsPush = function (chairID, cardDataArr, cardData) {
	return {
		type: this.GAME_INQTIRE_ARRCARDS_PUSH,
		data: {
			chairID: chairID,
			cardDataArr: cardDataArr,
			cardData: cardData,
		},
	};
};