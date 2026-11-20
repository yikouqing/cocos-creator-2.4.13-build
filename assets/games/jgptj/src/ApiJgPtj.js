let proto = module.exports;

proto.userStatus = {
	NONE: 0, // 玩家状态
	ABANDON: 1, // 放弃
	TIMEOUTABANDON: 2, // 超时放弃
	LOOK: 4, // 看牌
	LOSE: 8, // 比牌失败
	WIN: 16, // 胜利
	HE: 32, // 和
};

proto.gameStatus = {
	NONE: 0, //等待操作
	ROB_BANK: 1, //抢庄
	SEND_CARDS: 2, //发牌中
	POUR_SCORE: 3, //下分中
	SHOW_CARD: 4, //用户亮牌操作
	RESULT: 5, // 显示结果
	QIE_GUO: 6, //切锅
};


proto.gameStatusTm = {
	NONE: 0, //等待操作 
	ROB_BANK: 10, // 抢庄
	SEND_CARDS: 5, //发牌中
	POUR_SCORE: 15, // 下分中
	SHOW_CARD: 15, //用户亮牌操作
	QIE_GUO: 10, //切锅
	RESULT: 5, // 显示结果
};

proto.cardType = {
	ERROR: -1, // 错误
	LINGDIAN: 0, //零点
	BISHI: 1, //必十
	//一点
	YIDIAN: 9, //一点
	ZAYI: 10, //杂一
	DUANYI: 11, //短一
	CHANGYI: 12, //长一
	EYI: 13, //鹅一
	RENYI: 14, //人一
	DIYI: 15, //地一
	//二点
	ERDIAN: 19, //二点
	ZAER: 20, //杂二
	DUANER: 21, //短二
	CHANGER: 22, //长二
	ERE: 23, //鹅二
	RENER: 24, //人二
	DIER: 25, //地二
	TIANER: 26, //天二
	//三点
	SANDIAN: 29, //三点
	ZASAN: 30, //杂三
	DUANSAN: 31, //短三
	CHANGSAN: 32, //长三
	ESAN: 33, //鹅三
	RENSAN: 34, //人三
	DISAN: 35, //地三
	TIANSAN: 36, //天三
	//四点
	SIDIAN: 39, //四点
	ZASI: 40, //杂四
	DUANSI: 41, //短四
	CHANGSI: 42, //长四
	ESI: 43, //鹅四
	RENSI: 44, //人四
	TIANSI: 45, //天四
	//五点
	WUDIAN: 49, //五点
	ZAWU: 50, //杂五
	DUANWU: 51, //短五
	CHANGWU: 52, //长五
	EWU: 53, //鹅五
	RENWU: 54, //人五
	DIWU: 55, //地五
	TIANWU: 56, //天五

	//六点
	LIUDIAN: 59, //六点
	ZALIU: 60, //杂六
	DUANLIU: 61, //短六
	CHANGLIU: 62, //长六
	RENLIU: 63, //人六
	DILIU: 64, //地六
	TIANLIU: 65, //天六

	//七点
	QIDIAN: 69, //七点
	ZAQI: 70, //杂七
	DUANQI: 71, //短七
	CHANGQI: 72, //长七
	EQI: 73, //鹅七
	RENQI: 74, //人七
	DIQI: 75, //地七
	TIANQI: 76, //天七
	//八点
	BADIAN: 79, //八点
	ZABA: 80, //杂八
	DUANBA: 81, //短八
	CHANGBA: 82, //长八
	EBA: 83, //鹅八
	RENBA: 84, //人八
	DIBA: 85, //地八
	TIANBA: 86, //天八
	//九点
	JIUDIAN: 89, //九点
	DUANJIU: 90, //短九
	CHANGJIU: 91, //长九
	EJIU: 92, //鹅九
	RENJIU: 93, //人九
	DIJIU: 94, //地九
	TIANJIU: 95, //天九
	//天地杠
	DIGANG: 100, //地杠
	TIANGANG: 200, //天杠

	DUIZAWU: 1000, //对杂五
	DUIZAQI: 1001, //对杂七
	DUIZABA: 1002, //对杂八
	DUIZAJIU: 1003, //对杂九
	DUIDUAN: 1004, //对短
	DUICHUANG: 1005, //对长
	DUIE: 1006, //对娥
	DUIREN: 1007, //对人
	DUIDI: 1008, //对地
	DUITIAN: 1009, //对天
	DIJIUNIANGNIANG: 10010, //地九娘娘
	TIANJIUWANG: 10011, //天九王
	HUANGSHANG: 10012, //皇上
	GUIZI: 10013, //鬼子
	ZHADAN: 10014, //炸弹
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


//切锅推送
proto.GAME_QIE_GUO_NOTIFY = 604;
proto.gameQieGuoOperateNotify = function (isQie) {
	return {
		type: this.GAME_QIE_GUO_NOTIFY,
		data: {
			isQie
		},
	};
};
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

//玩家亮牌操作推送
proto.SHOW_GAME_USER_PUSH = 622;
proto.showGameUserPush = function (uid = null) {
	return {
		type: this.SHOW_GAME_USER_PUSH,
		data: {
			uid
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
