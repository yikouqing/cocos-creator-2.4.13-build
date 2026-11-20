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
	RESULT: 5,
	/* 显示结果 */
};

//麻将操作类型
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
	BU_PILAI: 13, //补痞癞操作
};
//用户卡牌类型
proto.cardType = {
	PIHU: 1, //屁胡
	XIAOXUE: 2, //小血
	DAXUE: 3, //大血
	QINGYISE: 4, //清一色
	JIANGYISE: 5, //将一色
	PENGPENGHU: 6, //碰碰胡
	QIDUI: 7, //七对
	QUANQIUR: 8, //全求人
	HAOHUANGQIDUI: 9, //豪华七对
	SHUANGHAOHUANGQIDUI: 10, //双豪华七对
	SANHAOHUANGQIDUI: 11, //三豪华七对
}

proto.cardTypePlus = {
	[1]: "屁胡",
	[2]: "小血",
	[3]: "大血",
	[4]: "清一色",
	[5]: "将一色",
	[6]: "碰碰胡",
	[7]: "七对",
	[8]: "全求人",
	[9]: "豪华七对",
	[10]: "双豪华七对",
	[11]: "三豪华七对",
}


//加蕃类型
proto.plusRateType = {
	PIZIGANG: 1, //痞子杠
	GANGSHANGHUA: 2, //杠上花
	GANGSHANGPAO: 3, //杠上炮
	DIANGANG: 4, //点杠
	BUGANG: 5, //补杠
	YINGHU: 6, //硬胡
	LAIZIGANG: 7, //癞子杠
	ANGANG: 8, //暗杠
}
//庄家规则
proto.gameType = {
	QIANGZHUANG: 2,
	/* 抢庄 */
	LUNZHUANG: 1,
	/* 轮庄 */
};

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
proto.gameSendCardPush = function (handCards, dice1, dice2) {

	return {
		type: this.GAME_SEND_CARDS_PUSH,
		data: {
			handCards,
			dice1,
			dice2
		},
	};
};


//玩家托管
proto.GAME_TRUST_NOTIFY = 565;
proto.GAME_TRUST_PUSH = 665;
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



//游戏结果推送
proto.GAME_RESULT_PUSH = 606;
proto.gameResultPush = function (result, bankerUid, gameRule, roomID, winUid) {
	return {
		type: this.GAME_RESULT_PUSH,
		data: {
			result: result,
			bankerUid: bankerUid,
			gameRule: gameRule,
			roomID: roomID,
			winUid: winUid,
		},
	};
};


//牌面回房
proto.GAME_REVIEW_PUSH = 607;
proto.gameReviewPush = function (list) {
	return {
		type: this.GAME_REVIEW_PUSH,
		data: {
			reviewRecord: list,
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
proto.gameEndPush = function (result, winMost, loseMost, creater, plusInfo, reason) {

	let curResult = {
		type: this.GAME_END_PUSH,
		data: {
			result: result,
			winMost: winMost,
			loseMost: loseMost,
			creater: creater,
			plusInfo: plusInfo,
			reason: reason,
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


//剩余牌数推送
proto.GAME_REST_CARDS_COUNT_PUSH = 623;
proto.gameRestCardsCountPush = function (restCardsCount) {
	return {
		type: this.GAME_REST_CARDS_COUNT_PUSH,
		data: {
			restCardsCount: restCardsCount,
		},
	};
};

//听牌
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
proto.gameOperateNotify = function (card, operate, cardList, operateType) {
	return {
		type: this.GAME_TURN_OPERATE_NOTIFY,
		data: {
			card: card,
			operate: operate,
			cardList: cardList,
			operateType: operateType || 0,
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
proto.GAME_GU_MAI_NOTIFY = 516;
proto.GAME_GU_MAI_PUSH = 616;
proto.gameHuanPaiPush = function (uid, GuMaiList) {
	return {
		type: this.GAME_GU_MAI_PUSH,
		data: {
			uid,
			cardList: GuMaiList,
		},
	};
};


//估卖推送
proto.GAME_USER_GU_MAI_SUGGEST_PUSH = 617;
proto.gameGuMaiSuggest = function (uid, gumaifen) {
	return {
		type: this.GAME_GU_MAI_NOTIFY,
		data: {
			uid,
			gumaifen,
		},
	};
};

proto.GAME_USER_HUAN_PAI_END_PUSH = 618;
proto.gameHuanPaiEndPush = function (uid, cardList, chairID) {
	return {
		type: this.GAME_USER_HUAN_PAI_END_PUSH,
		data: {
			uid,
			cardList,
			chairID
		},
	};
};


//玩家晒牌轮推送
proto.GAME_SHAI_PAI_TURN_PUSH = 620;
proto.gameShaiPaiTurnPush = function (uid, isGuo = false) {
	return {
		type: this.GAME_SHAI_PAI_TURN_PUSH,
		data: {
			uid,
			isGuo
		},
	};
};

//原报推送
proto.GAME_USER_YUAN_BAO_NOTIFY = 521;
proto.GAME_USER_YUAN_BAO_PUSH = 621;
proto.gameYuanBaoNotify = function (operateType) {
	return {
		type: this.GAME_USER_YUAN_BAO_NOTIFY,
		data: {
			// card: card,
			// operate: operate,
			// cardList: cardList,
			operateType: operateType || 0,
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

//鸡牌推送
proto.GAME_JI_PAI_PUSH = 629;
proto.gameJiPaiPush = function (uid, JiPaiType) {
	return {
		type: this.GAME_JI_PAI_PUSH,
		data: {
			uid,
			JiPaiType
		},
	};
};

//翻鸡牌推送
proto.GAME_FAN_JI_PAI_PUSH = 630;
proto.gameFanJiPaiPush = function (maPaiInfo) {
	return {
		type: this.GAME_JI_PAI_PUSH,
		data: {
			maPaiInfo
		},
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
proto.gameGetTestCardsPush = function (uid, allCardsData, testCards = null) {
	return {
		type: this.GAME_GET_TEST_CARDS_PUSH,
		data: {
			uid,
			allCardsData,
			testCards
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

proto.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY = 551; /* 下局换牌 */
proto.GAME_SUBSTRATUM_TRADE_CARDS_PUSH = 651; /* 下局换牌结果 */
proto.GAME_INQTIRE_ARRCARDS_NOTIFY = 552; /* 查询牌库 */
proto.GAME_INQTIRE_ARRCARDS_PUSH = 652; /*查询牌库结果 */


//nullType   是否清空选择的牌
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