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

proto.GAME_GET_CARD_NOTIFY = 315; /* 测试拿牌 */
proto.GAME_GET_CARD_PUSH = 415; /* 测试拿牌 */

proto.gameStatus = {
	NONE: 0,
	/* 等待操作 */
	DICES: 1,
	SEND_CARDS: 2,
	/* 下分中 */
	PLAYING: 3,
	/* 游戏中 */
	ZHAMA: 4,
	/* 扎马 */
	RESULT: 5,
	/* 显示结果 */
};

proto.gameStatusTm = {
	NONE: 0,
	/* 等待操作 */
	DICES: 3,
	SEND_CARDS: 3,
	/* 下分中 */
	PLAYING: 0,
	/* 游戏中 */
	ZHAMA: 5,
	/* 扎马 */
	RESULT: 5,
	/* 显示结果 */
};

proto.operateType = {
	/* 可操作类型 */
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
	/* 自摸 */
	GUO: 7,
	/* 过 */
	QI: 8,
	/* 弃牌 */
	GET: 9,
	/* 拿牌 */
};

proto.operateTm1 = 30; /* 弃牌操作时间 */
proto.operateTm2 = 30; /* 碰杠操作时间 */

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

proto.gameOperateNotify = function (card, operate) {
	return {
		type: this.GAME_TURN_OPERATE_NOTIFY,
		data: {
			card: card,
			operate: operate,
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

proto.GAME_LOOK_CARDS_NOTIFY = 316; /* 看牌 */
proto.GAME_LOOK_CARDS_PUSH = 416; /* 看牌结果 */

proto.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY = 317; /* 下局换牌 */
proto.GAME_SUBSTRATUM_TRADE_CARDS_PUSH = 417; /* 下局换牌结果 */

proto.GAME_INQTIRE_ARRCARDS_NOTIFY = 318; /* 查询牌库 */
proto.GAME_INQTIRE_ARRCARDS_PUSH = 418; /*查询牌库结果 */

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


// 新调试
// uid:0//设置调试玩家
// nextUid:0//设置玩家
// type：0 //0查询所有玩家已调试牌      1换牌
// cards:0//设置下一张摸牌
// handCards：[]//设置手牌

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


// proto.gameSubstratumTradeCardsPush = function (trust) {
// 	return {
// 		type: this.GAME_SUBSTRATUM_TRADE_CARDS_PUSH,
// 		data: {
// 			trust: trust,
// 		},
// 	};
// };

// proto.gameireArrcardsPush = function (chairID, cardDataArr, cardData) {
// 	return {
// 		type: this.GAME_INQTIRE_ARRCARDS_PUSH,
// 		data: {
// 			chairID: chairID,
// 			cardDataArr: cardDataArr,
// 			cardData: cardData,
// 		},
// 	};
// };



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
