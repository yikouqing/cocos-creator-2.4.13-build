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
	NONE: 0,
	/* 等待操作 */
	ROB_BANK: 1,
	/* 抢庄 */
	SEND_CARDS: 2,
	/* 发牌中 */
	POUR_SCORE: 3,
	/* 下分中 */
	SHOW_CARD: 4,
	/* 用户亮牌操作 */
	RESULT: 5,
	/* 显示结果 */

};


proto.gameStatusTm = {
	NONE: 0,
	/* 等待操作 */
	ROB_BANK: 10,
	/* 抢庄 */
	SEND_CARDS: 7,
	/* 发牌中 */
	POUR_SCORE: 15,
	/* 下分中 */
	SHOW_CARD: 15,
	/* 用户亮牌操作 */
	RESULT: 5,
	/* 显示结果 */
};

proto.cardType = {
	ERROR: -1, // 错误
	ZAWU: 0, //杂五
	ZAQI: 1, //杂七
	ZABA: 2, //杂八
	ZAJIU: 3, //杂九

	DUIDUAN: 4, //对短
	DUICHUANG: 5, //对长
	DUIE: 6, //对娥
	DUIREN: 7, //对人
	DUIDI: 8, //对地
	DUITIAN: 9, //对天

	DIJIUNIANGNIANG: 10, //地九娘娘
	TIANJIUWANG: 11, //天九王
	HUANGSHANG: 12, //皇上
	GUIZI: 13, //鬼子
	ZHADAN: 14, //炸弹
};
proto.ruffianType = {
	DAPAIJIU: 0,
	/* 大牌九 */
	XIAOPAIJIU: 1,
	/* 小牌九 */
};
//庄家模式 
proto.bankerMode = {
	GUDINGZHUANGJIA: 0, //固定庄家
	ZIYOUQIANGZHUANG: 1, //自由抢庄
	LUNZHUANG: 2, //轮庄
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
proto.gameSendCardPush = function (handCards, leftCount, lastCards, dice1, dice2) {

	return {
		type: this.GAME_SEND_CARDS_PUSH,
		data: {
			handCards,
			leftCount,
			lastCards,
			dice1,
			dice2
		},
	};
};


//切锅推送
proto.GAME_QIE_GUO_NOTIFY = 604;
proto.GAME_QIE_GUO_OPERATE_PUSH = 604;
proto.gameQieGuoOperatePush = function (uid, tick) {
	return {
		type: this.GAME_QIE_GUO_OPERATE_PUSH,
		data: {
			uid,
			tick
		},
	};
};

//玩家下分操作推送
proto.GAME_USER_POUR_SCORE_PUSH = 605;
proto.gameUserPourScorePush = function (bankerUid, tick, PourScore) {
	return {
		type: this.GAME_USER_POUR_SCORE_PUSH,
		data: {
			bankerUid,
			tick,
			PourScore,
		},
	};
};

proto.GAME_USER_SCORE_NOTIFY = 513; /* 下分通知 */
proto.gameUserPourScoreNotify = function (index, score) {
	return {
		type: this.GAME_USER_SCORE_NOTIFY,
		data: {
			index,
			score,
		},
	};
}
proto.GAME_USER_SCORE_PUSH = 613; /* 下分结果 */
proto.gameUserPourScore = function (uid, score) {
	return {
		type: this.GAME_USER_SCORE_PUSH,
		data: {
			uid,
			score
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

//亮牌推送
proto.SHOW_CARDS_NOTIFY = 512;
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



//----------------------------调试功能------------------------------------


//换牌
proto.GAME_SET_TEST_CARDS_NOTIFY = 551;
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
proto.GAME_GET_TEST_CARDS_PUSH = 652;
proto.gameGetTestCardsPush = function (uid, allCardsData, testCards = []) {
	return {
		type: this.GAME_GET_TEST_CARDS_PUSH,
		data: {
			uid,
			allCardsData,
			testCards
		},
	};
};
// proto.userStatus = {
// 	/* 玩家状态 */
// 	NONE: 0,
// 	ABANDON: 1,
// 	/* 放弃 */
// 	TIMEOUTABANDON: 2,
// 	/* 超时放弃 */
// 	LOOK: 4,
// 	/* 看牌 */
// 	LOSE: 8,
// 	/* 比牌失败 */
// 	WIN: 16,
// 	/* 胜利 */
// 	HE: 32,
// 	/* 和 */
// };

// proto.gameStatus = {
// 	/* 等待操作 */
// 	NONE: 0,
// 	/* 抢庄 */
// 	ROB_BANK: 1,
// 	/* 发牌中 */
// 	SEND_CARDS: 2,
// 	/* 下分中 */
// 	POUR_SCORE: 3,
// 	/* 用户亮牌操作 */
// 	SHOW_CARD: 4,
// 	QIE_GUO: 5, //切锅
// 	/* 显示结果 */
// 	RESULT: 6,

// };

// proto.gameStatusTm = {
// 	NONE: 0,
// 	/* 等待操作 */
// 	ROB_BANK: 10,
// 	/* 抢庄 */
// 	SEND_CARDS: 3,
// 	/* 发牌中 */
// 	POUR_SCORE: 10,
// 	/* 下分中 */
// 	SHOW_CARD: 15,
// 	/* 用户亮牌操作 */
// 	QIE_GUO: 10, //切锅
// 	RESULT: 5,
// 	/* 显示结果 */
// };

// proto.cardType = {
// 	ERROR: -1, // 错误
// 	BISI: 0, //必10
// 	DIAN: 1, // 点
// 	ER_BA_GANG: 2, //二八杠
// 	DUI_ZI: 3, //对子
// 	SHUANG_TIAN_ZHI_ZUN: 4, //双天至尊
// };

// //庄家规则
// proto.gameType = {
// 	QIANGZHUANG: 1,
// 	/* 抢庄 */
// 	LUNZHUANG: 2,
// 	/* 轮庄 */
// };



// //庄家推送
// proto.GAME_BANKER_PUSH = 601;
// proto.gameBankerPush = function (uid, userList) {
// 	return {
// 		type: this.GAME_BANKER_PUSH,
// 		data: {
// 			uid,
// 			userList
// 		},
// 	};
// };

proto.GAME_ROB_BANK_NOTIFY = 502; /* 抢庄通知 */
proto.gameRobBankerNotify = function (isRob) {
	return {
		type: this.GAME_ROB_BANK_NOTIFY,
		data: {
			isRob
		},
	};
}
// proto.GAME_ROB_BANK_PUSH = 602; /* 抢庄结果 */
// proto.gameRobBankPush = function (uid, isRob) {
// 	return {
// 		type: this.GAME_ROB_BANK_PUSH,
// 		data: {
// 			uid,
// 			isRob
// 		},
// 	};
// };


// //发玩家手牌
// proto.GAME_SEND_CARDS_PUSH = 603;
// proto.gameSendCardPush = function (handCards, leftCount, lastCards) {

// 	return {
// 		type: this.GAME_SEND_CARDS_PUSH,
// 		data: {
// 			handCards,
// 			leftCount,
// 			lastCards
// 		},
// 	};
// };


// //切锅推送
// proto.GAME_QIE_GUO_NOTIFY = 604;
// proto.gameQieGuoOperateNotify = function (isQie) {
// 	return {
// 		type: this.GAME_QIE_GUO_NOTIFY,
// 		data: {
// 			isQie
// 		},
// 	};
// };
// proto.GAME_QIE_GUO_OPERATE_PUSH = 604;
// proto.gameQieGuoOperatePush = function (uid, tick) {
// 	return {
// 		type: this.GAME_QIE_GUO_OPERATE_PUSH,
// 		data: {
// 			uid,
// 			tick
// 		},
// 	};
// };

// //玩家下分操作推送
// proto.GAME_USER_POUR_SCORE_PUSH = 605;
// proto.gameUserPourScorePush = function (bankerUid, tick, minPourScore, maxPourScore) {
// 	return {
// 		type: this.GAME_USER_POUR_SCORE_PUSH,
// 		data: {
// 			bankerUid,
// 			tick,
// 			minPourScore,
// 			maxPourScore
// 		},
// 	};
// };

// proto.GAME_USER_SCORE_NOTIFY = 513; /* 下分通知 */
// proto.gameUserPourScoreNotify = function (score) {
// 	return {
// 		type: this.GAME_USER_SCORE_NOTIFY,
// 		data: {
// 			score
// 		},
// 	};
// }
// proto.GAME_USER_SCORE_PUSH = 613; /* 下分结果 */
// proto.gameUserPourScore = function (uid, score) {
// 	return {
// 		type: this.GAME_ROB_BANK_PUSH,
// 		data: {
// 			uid,
// 			score
// 		},
// 	};
// };


// //游戏结果推送
// proto.GAME_RESULT_PUSH = 606;
// proto.gameResultPush = function (result) {
// 	return {
// 		type: this.GAME_RESULT_PUSH,
// 		data: {
// 			result: result
// 		},
// 	};
// };


//牌面回房
proto.GAME_REVIEW_NOTIFY = 507;
proto.gameReviewNotify = function () {
	return {
		type: this.GAME_REVIEW_NOTIFY,
		data: {},
	};
};
// proto.GAME_REVIEW_PUSH = 607;
// proto.gameReviewPush = function (list) {
// 	return {
// 		type: this.GAME_REVIEW_PUSH,
// 		data: {
// 			list: list,
// 		},
// 	};
// };

// //局数推送
// proto.GAME_BUREAU_PUSH = 608;
// proto.gameBureauPush = function (curBureau) {
// 	return {
// 		type: this.GAME_BUREAU_PUSH,
// 		data: {
// 			curBureau: curBureau,
// 		},
// 	};
// };


// proto.GAME_END_PUSH = 609;
// proto.gameEndPush = function (result, winMost, loseMost, creater, plusInfo) {

// 	let curResult = {
// 		type: this.GAME_END_PUSH,
// 		data: {
// 			result: result,
// 			winMost: winMost,
// 			loseMost: loseMost,
// 			creater: creater,
// 			plusInfo: plusInfo,
// 		},
// 	};
// 	return curResult;
// };


// //骰子推送
// proto.GAME_DICES_PUSH = 610;
// proto.gameDicesPush = function (dice1, dice2) {
// 	return {
// 		type: this.GAME_DICES_PUSH,
// 		data: {
// 			dice1: dice1,
// 			dice2: dice2,
// 		},
// 	};
// };

//亮牌推送
proto.SHOW_CARDS_NOTIFY = 512;
proto.showCardsNotify = function (data) {
	return {
		type: this.SHOW_CARDS_NOTIFY,
		data: data,
	};
}
// proto.SHOW_CARDS_PUSH = 612;
// proto.showCardsPush = function (chairID, cardsList, uid = null) {
// 	return {
// 		type: this.SHOW_CARDS_PUSH,
// 		data: {
// 			chairID,
// 			uid,
// 			cardsList
// 		}
// 	};
// };

// //锅底推送
// proto.SHOW_GUO_SCORE_PUSH = 611;
// proto.showGuoScorePush = function (score) {
// 	return {
// 		type: this.SHOW_GUO_SCORE_PUSH,
// 		data: {
// 			score
// 		}
// 	};
// };

// proto.GAME_CHAT_NOTIFY = 311; /* 游戏聊天 */
// proto.gameChatNotify = function (type, msg, recipientID) {
// 	return {
// 		type: this.GAME_CHAT_NOTIFY,
// 		data: {
// 			type: type,
// 			msg: msg,
// 			recipientID: recipientID,
// 		},
// 	};
// };

// proto.GAME_CHAT_PUSH = 411;
// proto.gameChatPush = function (chairID, type, msg, recipientID) {
// 	return {
// 		type: this.GAME_CHAT_PUSH,
// 		data: {
// 			chairID: chairID,
// 			type: type,
// 			msg: msg,
// 			recipientID: recipientID,
// 		},
// 	};
// };

// //----------------------------调试功能------------------------------------



// proto.GAME_SET_TEST_CARDS_PUSH = 651;
// proto.gameSetTestCardsPush = function (isSuccess) {
// 	return {
// 		type: this.GAME_SET_TEST_CARDS_PUSH,
// 		data: {
// 			isSuccess
// 		},
// 	};
// };



// proto.GAME_GET_TEST_CARDS_PUSH = 652;
// proto.gameGetTestCardsPush = function (uid, allCardsData, testCards) {
// 	return {
// 		type: this.GAME_GET_TEST_CARDS_PUSH,
// 		data: {
// 			uid,
// 			allCardsData,
// 			testCards
// 		},
// 	};
// };


// proto.GAME_INQTIRE_ARRCARDS_NOTIFY = 318; /* 查询牌库 */
// proto.GAME_INQTIRE_ARRCARDS_PUSH = 418; /*查询牌库结果 */
// // 新查询牌库  type  //0查询当前牌库 1查询下局牌库
// proto.gameInqtireArrcardsNotify = function (type, nextUid) {
// 	return {
// 		type: this.GAME_INQTIRE_ARRCARDS_NOTIFY,
// 		data: {
// 			type: type,
// 			nextUid: nextUid,
// 		},
// 	};
// };

// proto.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY = 317; /* 下局换牌 */
// proto.GAME_SUBSTRATUM_TRADE_CARDS_PUSH = 417; /* 下局换牌结果 */

// proto.gameSubstratumTradeCardsNotify = function (uid, nextUid, type, cards, handCards) {
// 	return {
// 		type: this.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY,
// 		data: {
// 			uid: uid,
// 			nextUid: nextUid,
// 			type: type,
// 			Cards: cards,
// 			handCards: handCards,
// 		},
// 	};
// };




//查询牌库
proto.GAME_GET_TEST_CARDS_NOTIFY = 552;
proto.gameGetTestCardsNotify = function (nextUid) {
	return {
		type: this.GAME_GET_TEST_CARDS_NOTIFY,
		data: {
			uid: nextUid,
		},
	};
};

proto.GAME_SET_TEST_CARDS_NOTIFY = 551;
proto.gameSetTestCardsNotify = function (uid, cardData) {
	return {
		type: this.GAME_SET_TEST_CARDS_NOTIFY,
		data: {
			uid: uid,
			cardData,
		},
	};
};

//玩家托管
proto.GAME_TRUST_NOTIFY = 515;
proto.gameTrushNotify = function (trust) {
	return {
		type: this.GAME_TRUST_NOTIFY,
		data: {
			trust: trust,
		},
	};
}
proto.GAME_TRUST_PUSH = 615;
proto.gameTrushPush = function (uid, trust) {
	return {
		type: this.GAME_TRUST_PUSH,
		data: {
			uid: uid,
			trust: trust,
		},
	};
};