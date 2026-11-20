/*
 * 麻将协议
 */
var proto = module.exports;

proto.gameStatus = {
	/* 等待操作 */
	NONE: 0,
	/*骰子*/
	DICES: 1,
	/* 下分中 */
	SEND_CARDS: 2,
	/* 游戏中 */
	PLAYING: 3,
	/* 定缺 */
	DINGQUE: 4,
	/* 显示结果 */
	RESULT: 5,
	HUANSANZHANG: 6, //换三张
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
	/**抢杠胡 */
	HU_QIANG: 12,
};

proto.cardType = {
	PINGHU: 1, //平胡
	DADUIZI: 2, //大队子
	QINGYISE: 3, //清一色
	QIDUI: 4, //七对
	LONGBEIZHUA: 5, //龙七对
	QINGDADUI: 6, //清大队
	QINGQIDUI: 7, //清七对
	QINGLONGQIDUI: 8, //清龙七对
	QUANYAOJIU: 9, //全幺九
	JIANGDUI: 10, //将对
	JIANQIDUI: 11, //将七对
	KAERTIAO: 12, //卡二条
	YITIAOLONG: 13, //一条龙
	JUEZHUANG: 14, //绝张
}

proto.cardTypeStr = {
	[0]: "",
	[1]: "平胡",
	[2]: "大对子",
	[3]: "清一色",
	[4]: "七对",
	[5]: "龙七对",
	[6]: "清大对",
	[7]: "清七对",
	[8]: "清龙七对",
	[9]: "全幺九",
	[10]: "将对",
	[11]: "将对七对",
	[12]: "卡二条",
	[13]: "一条龙",
	[14]: "绝张",
	[104]: "四对",
	[105]: "龙四对",
	[107]: "清四对",
	[108]: "清龙四对",
	[111]: "将四对",
}

//加蕃类型
proto.plusRateType = {
	GANGSHANGHUA: 1, //杠上花
	GANGSHANGPAO: 2, //杠上炮
	QIANGGANGHU: 3, //抢杠胡
	GEN: 4, //根
	HAIDILAO: 5, //海底捞
	JINGOUGOU: 6, //金钩钩
	MENQING: 7, //门清
	ZHONGZHANG: 8, //中张
	JUEZHANG: 9, //绝张
	TIANHU: 10, //天胡
	DIHU: 11, //地胡
	KAERTIAO: 12, //卡二条
	YITIAOLONG: 13, //一条龙
	QUANYAOJIU: 14, //全幺九
	JIAXINGWU: 15, //夹心五
	laiZiDouble: 16, //无癞子加蕃
	duiDuiDouble: 17, //对对胡两蕃
	laiZiDouble: 16, //无癞子加蕃
	duiDuiDouble: 17, //对对胡两蕃
}

proto.plusRateTypeStr = {
	[1]: "杠上花",
	[2]: "杠上炮",
	[3]: "抢杠胡",
	[4]: "根",
	[5]: "海底捞",
	[6]: "金钩钩",
	[7]: "门清",
	[8]: "中张",
	[9]: "绝张",
	[10]: "天胡",
	[11]: "地胡",
	[12]: "卡二条",
	[13]: "一条龙",
	[14]: "全幺九",
	[15]: "夹心五",
	[16]: "无癞子加番",
	[17]: "对对胡两番",
}

proto.operateTm1 = 30; /* 弃牌操作时间 */
proto.operateTm2 = 30; /* 碰杠操作时间 */
proto.operateGangChooseTm = 15; /* 杠牌选择时间 */

proto.GAME_STATUS_PUSH = 401; /* 状态推送 */
proto.gameStatusPush = function (gameStatus, tick) {
	return {
		type: this.GAME_STATUS_PUSH,
		data: {
			gameStatus: gameStatus,
			tick: tick,
		},
	};
};

proto.GAME_BANKER_PUSH = 402; /* 庄家推送 */
proto.gameBankerPush = function (bankerChairID) {
	return {
		type: this.GAME_BANKER_PUSH,
		data: {
			bankerChairID: bankerChairID,
		},
	};
};

proto.GAME_DICES_PUSH = 403; /* 骰子推送 */
proto.gameDicesPush = function (dice1, dice2) {
	return {
		type: this.GAME_DICES_PUSH,
		data: {
			dice1: dice1,
			dice2: dice2,
		},
	};
};

/**发牌推送 */
proto.GAME_SEND_CARDS_PUSH = 404;
proto.gameSendCardsPush = function (handCards, chairID) {
	return {
		type: this.GAME_SEND_CARDS_PUSH,
		data: {
			handCards: handCards,
			chairID: chairID,
		},
	};
};

proto.GAME_REST_CARDS_COUNT_PUSH = 405; /* 剩余牌数推送 */
proto.gameRestCardsCountPush = function (restCardsCount) {
	return {
		type: this.GAME_REST_CARDS_COUNT_PUSH,
		data: {
			restCardsCount: restCardsCount,
		},
	};
};

proto.GAME_TURN_PUSH = 406; /* 自己出牌 */
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

/**自己操作 */
proto.GAME_TURN_OPERATE_NOTIFY = 307;
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

/**玩家操作推送 */
proto.GAME_TURN_OPERATE_PUSH = 407;
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

proto.GAME_RESULT_PUSH = 408; /* 游戏结果推送 */
proto.gameResultPush = function (result) {
	return {
		type: this.GAME_RESULT_PUSH,
		data: {
			result: result,
		},
	};
};

proto.GAME_BUREAU_PUSH = 409; /* 局数推送 */
proto.gameBureauPush = function (curBureau) {
	return {
		type: this.GAME_BUREAU_PUSH,
		data: {
			curBureau: curBureau,
		},
	};
};

proto.GAME_END_PUSH = 410; /* 游戏结束推送 */
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

proto.GAME_CHAT_NOTIFY = 311; /* 游戏聊天 */
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

proto.GAME_CHAT_PUSH = 411;
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

proto.GAME_TRUST_NOTIFY = 312; /* 托管 */
proto.gameTrushNotify = function (trust) {
	return {
		type: this.GAME_TRUST_NOTIFY,
		data: {
			trust: trust,
		},
	};
};

proto.GAME_TRUST_PUSH = 412; /* 托管 */
proto.gameTrushPush = function (chairID, trust) {
	return {
		type: this.GAME_TRUST_PUSH,
		data: {
			chairID: chairID,
			trust: trust,
		},
	};
};

proto.GAME_REVIEW_NOTIFY = 313; /* 牌面回顾 */
proto.gameReviewNotify = function () {
	return {
		type: this.GAME_REVIEW_NOTIFY,
		data: {},
	};
};
proto.GAME_REVIEW_PUSH = 413;
proto.gameReviewPush = function (reviewRecord) {
	return {
		type: this.GAME_REVIEW_PUSH,
		data: {
			reviewRecord: reviewRecord,
		},
	};
};

proto.GAME_DISMISS_PUSH = 414; /* 解散房间 */
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

//玩家换牌选择推送
proto.GAME_HUAN_PAI_CHOOSE_NOTIFY = 330;
//cardList
proto.gameHuanPaiNotify = function (cardList) {
	return {
		type: this.GAME_HUAN_PAI_CHOOSE_NOTIFY,
		data: {
			cardList: cardList
		}
	}
}
proto.GAME_HUAN_PAI_CHOOSE_PUSH = 430;
proto.gameHuanPaiPush = function (chairID, cardList) {
	return {
		type: this.GAME_HUAN_PAI_CHOOSE_PUSH,
		data: {
			chairID,
			cardList
		},
	};
};

//换牌结束得到的牌
proto.GAME_HUAN_PAI_END_PUSH = 431;
proto.gameHuanPaiEndPush = function (chairID, cardList) {
	return {
		type: this.GAME_HUAN_PAI_END_PUSH,
		data: {
			chairID,
			cardList
		},
	};
};

//剩余牌张数推送
proto.GAME_RESET_CARDS_WARN_PUSH = 432;
proto.gameResetCardsWarnPush = function (count) {
	return {
		type: this.GAME_RESET_CARDS_WARN_PUSH,
		data: {
			count
		},
	};
};

//退税推送
proto.GAME_REBACK_RATE_PUSH = 433;
proto.gameRebackRatePush = function (chairID, score) {
	return {
		type: this.GAME_REBACK_RATE_PUSH,
		data: {
			chairID,
			score
		},
	};
};

//下雨推送
proto.GAME_XIAYU_PUSH = 434;
proto.gameXiaYuPush = function (chairID, score, type) {
	return {
		type: this.GAME_XIAYU_PUSH,
		data: {
			chairID,
			score,
			type
		},
	};
};


//玩家定牌
proto.GAME_USER_DING_QUE_NOTIFY = 335;
//type 定缺queType
proto.gameDingQueNotify = function (type) {
	return {
		type: this.GAME_USER_DING_QUE_NOTIFY,
		data: {
			type
		}
	}
}
proto.GAME_USER_DING_QUE_PUSH = 435;
proto.gameDingQuePush = function (chairID, type) {
	return {
		type: this.GAME_USER_DING_QUE_PUSH,
		data: {
			chairID,
			type
		},
	};
};

/**换牌推荐 */
proto.GAME_USER_HUAN_PAI_SUGGEST = 436;
proto.gameHuanPaiSuggest = function (chairID, huanPaiType, cardList) {
	return {
		type: this.GAME_USER_HUAN_PAI_SUGGEST,
		data: {
			chairID,
			cardList,
			huanPaiType
		},
	};
};

//玩家分数推送
proto.GAME_USER_SCORE_PUSH = 438;
proto.gameUserScorePush = function (scoreList) {
	return {
		type: this.GAME_USER_SCORE_PUSH,
		data: {
			scoreList
		},
	};
};

//----------------------------调试功能------------------------------------
proto.GAME_LOOK_CARDS_NOTIFY = 316; /* 看牌 */
proto.GAME_LOOK_CARDS_PUSH = 416; /* 看牌结果 */





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

// 新调试
// uid:0//设置调试玩家
// nextUid:0//设置玩家
// type：0 //0查询所有玩家已调试牌      1换牌
// cards:0//设置下一张摸牌
// handCards：[]//设置手牌




// proto.gameSubstratumTradeCardsNotify = function (chairID, cardDataArr) {
// 	return {
// 		type: this.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY,
// 		data: {
// 			chairID: chairID,
// 			cardDataArr: cardDataArr,
// 		},
// 	};
// };

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

proto.GAME_INQTIRE_ARRCARDS_NOTIFY = 318; /* 查询牌库 */
proto.GAME_INQTIRE_ARRCARDS_PUSH = 418; /*查询牌库结果 */
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

proto.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY = 317; /* 下局换牌 */
proto.GAME_SUBSTRATUM_TRADE_CARDS_PUSH = 417; /* 下局换牌结果 */



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