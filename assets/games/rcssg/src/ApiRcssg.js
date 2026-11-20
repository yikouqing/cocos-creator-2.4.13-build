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
	HUANSANZHANG: 4, //换三张
	BAOTING: 6, //报听
	RESULT: 10,
	/* 显示结果 */

};

proto.gameStatusTm = {
	NONE: 0, //等待操作 
	DICES: 2, //抢庄
	SEND_CARDS: 2, // 发牌中 
	PLAYING: 30, //游戏中 
	HUANSANZHANG: 15, //换三张
	GUMAI: 15,
	BAOTING: 15, //闲家报听
	RESULT: 30, // 显示结果
};

//换牌的方式
proto.huanPaiType = {
	SHUN: 0, //顺时针换
	NI: 1, //逆时针换
	DUI: 2, //对家换
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
	MOPAI: 13, //摸牌
	BAOTING: 14, //报听
	HU_QIANG: 15, //抢杠胡
};

//用户卡牌类型
proto.cardType = {
	PINGHU: 1, //平胡
	DADUIZI: 2, //大队子
	QIDUI: 3, //七对
}


//加蕃类型
proto.plusRateType = {
	PINGHU: 1, //平胡
	DADUIZI: 2, //对对胡
	QIDUI: 3, //七对
	LONGQIDUI: 4, //龙七对
	SHUANGLONGQIDUI: 5, //双龙七对
	SANLONGQIDUI: 6, //三龙七对
	QINGLONGQIDUI: 7, //青龙七对
	SHUANGQINGLONGQIDUI: 8, //青双龙七对
	SANQINGLONGQIDUI: 9, //青三龙七对
	GANG: 10, //杠分
	HAIDI: 11, //海底
	BAOTING: 12, //报听
	CHAJIAO: 13, //查叫
	FANCHAJIAO: 14, //反查叫
	SHOUSHANGGUI: 15, //手上归
	SHOUSHANGJIAOGUI: 16, //手上脚归
	DIHU: 17, //地胡
	TIANHU: 18, //天胡
	GANGSHANGHUA: 19, //杠上花
	GANGSHANGPAO: 20, //杠上炮
	QIANGGANGHU: 21, //抢杠胡
	JINGOUHU: 22, //金钩胡
	QINGYISE: 25, //清一色平胡
	QINGYISEDUIDUIHU: 26, //清一色对对胡
	QINGYISEQIDUI: 27, //清七对
}

proto.plusRateTypeStr = {
	[1]: "平胡",
	[2]: "对对胡",
	[3]: "七对",
	[4]: "龙七对",
	[5]: "双龙七对",
	[6]: "三龙七对",
	[7]: "清龙七对",
	[8]: "清双龙七对",
	[9]: "清三龙七对",
	[10]: "杠分",
	[11]: "海底",
	[12]: "报听",
	[13]: "查叫",
	[14]: "反查叫",
	[15]: "手上归",
	[16]: "手上脚归",
	[17]: "地胡",
	[18]: "天胡",
	[19]: "杠上花",
	[20]: "杠上炮",
	[21]: "抢杠胡",
	[22]: "金钩胡",
	[25]: "清一色平胡",
	[26]: "清一色对对胡",
	[27]: "清七对",
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
proto.GAME_REVIEW_NOTIFY = 507;
proto.gameReviewNotify = function () {
	return {
		type: this.GAME_REVIEW_NOTIFY,
		data: {},
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
proto.GAME_REST_CARDS_COUNT_PUSH = 613;
proto.gameRestCardsCountPush = function (restCardsCount) {
	return {
		type: this.GAME_REST_CARDS_COUNT_PUSH,
		data: {
			restCardsCount: restCardsCount,
		},
	};
};

//轮次
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



// 换三张推送
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



//报听操作推送
proto.GAME_USER_BAO_OPERATE_PUSH = 619;
proto.gameUserBaoOperatePush = function (uid, cardList, allHuCards) {
	return {
		type: this.GAME_USER_BAO_OPERATE_PUSH,
		data: {
			uid,
			cardList,
			allHuCards
		},
	};
};
//报听推送
proto.GAME_USER_BAO_NOTIFY = 521;
proto.gameBaoNotify = function (operateType) {
	return {
		type: this.GAME_USER_BAO_NOTIFY,
		data: {
			operateType
		},
	};
};
proto.GAME_USER_BAO_PUSH = 621;
proto.gameBaoPush = function (uid, operateArray, tick) {
	return {
		type: this.GAME_USER_BAO_PUSH,
		data: {
			uid,
			operateArray,
			tick
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

//----------------------------调试功能------------------------------------

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