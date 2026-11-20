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
	GUMAI: 5, //估卖
	BAOTING: 6,  //闲家报听
	RESULT: 10,
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
	HUANSANZHANG: 15,
	//换三张
	GUMAI: 15,
	//估卖
	RESULT: 30,
	/* 显示结果 */
};

proto.gameJIpai = {
	CHONGFONGJI: 0,
	/* 冲锋鸡 */
	WUGUJI: 1,
	/* 乌骨鸡 */
	ZHEREJI: 2,
	/* 责任鸡 */
	ZHEREWUGUJI: 3,
	/* 责任乌骨鸡 */
	FANPAIJI: 4,
	/* 翻牌鸡 */
	YAOBAIJI: 5,
	/* 摇摆鸡 */
	BENJI: 6,
	/* 本鸡 */
	XINGQIJI: 7,
	/* 星期鸡 */
	CHUIFENGJI: 8,
	/* 吹风鸡 */
	LAIZIJI: 9,
	/**癞子鸡 */
};

proto.gameJIpaiStr = {
	[0]: "冲锋鸡",
	[1]: "乌骨鸡",
	[2]: "责任鸡",
	[3]: "责任乌骨鸡",
	[4]: "翻牌鸡",
	[5]: "摇摆鸡",
	[6]: "本鸡",
	[7]: "星期鸡",
	[8]: "吹风鸡",
	[9]: "癞子鸡",
}

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
	HU_QIANG: 12,
	/*抢杠胡 */
	MOPAI: 13, //摸牌
	BAIPAI: 14, //玩家摆牌
	MENPAI: 15, //闷
	TIANTING: 16, //天听
	DAITIANTING: 17, //等待天听
};
//用户卡牌类型
proto.cardType = {
	PINGHU: 1, //平胡
	DADUIZI: 2, //大队子 2分
	QIDUI: 3, //七小对
	QIYISE: 4,
}

//加蕃类型
proto.plusRateType = {
	TIANHU: 1, //天胡
	DIHU: 2, //地胡
	GANGSHANGPAO: 3, //杠上炮
	GANGSHANGHUA: 4, //杠上花
	QIANGGANGHU: 5, //抢杠胡
	QINGYISE: 6, //清一色
	LONGQIDUI: 7, //龙七对
	DADUIZI: 8, //对对胡
	QIDUI: 9, //7对
	GANG: 10, //杠分
	PINGHU: 11, //平胡
	ZIMO: 12, //自摸
	QINGDIDUI: 13, //清七对
	QINGLONGQIDUI: 14, //清龙七对
	QINGSHUANGLONGQIDUI: 15, //清双龙七对
	YAOJIU: 16, //幺九
	YAOJIUDADUIZI: 17, //幺九大对
	JIANGDUI: 18, //将对
	JIANGQIDUI: 19, //将七对
	JIANGLONGQIDUI: 20, //将龙七对
	JIANGSHUANGLONGQIDUI: 21, //将双龙七对
	QINGDADUI: 22, //清对对胡
	KAWU: 23, //卡心五
	HAIDI: 24, //海底
	MENQING: 25, //门清中张
	QUEYIMEN: 26, //缺一门
	XIAOFEIYANG: 27, //小肥羊
	BAIPAI: 28, //摆牌
	DILONG: 29, //地龙
	QINGDILONG: 30, //清地龙
	JIPAI: 31, //中鸡
	BAOTING: 32, //报听
	SHABAO: 33, //杀报
	YUANBAO: 34, //原报
	SHAYUANBAO: 35, //杀原报
	YIKOUER: 36, //一扣二
	TONGSAN: 37, //通三
	CHONGFONGJI: 38, // 冲锋鸡
	WUGUJI: 39, // 乌骨鸡
	ZHEREJI: 40, //责任鸡
	ZHEREWUGUJI: 41, // 责任乌骨鸡
	FANPAIJI: 42, //翻牌鸡
	YAOBAIJI: 43, // 摇摆鸡
	XINGQIJI: 44, //星期鸡 
	GUMAI: 45, //估卖
	BAOJI: 46, //包鸡
	JINJI: 47, // 金鸡 
	YINJI: 48, // 银鸡
	DANDIAO: 49, //单吊
	QINGDANDIAO: 50, //清单吊
	MENPAI: 51, // 闷
}

proto.plusRateTypeStr = {
	[1]: "天胡",
	[2]: "地胡",
	[3]: "杠上炮",
	[4]: "杠上花",
	[5]: "抢杠胡",
	[6]: "清一色",
	[7]: "龙七对",
	[8]: "对对胡",
	[9]: "七对",
	[10]: "杠",
	[11]: "平胡",
	[12]: "自摸",
	[13]: "清七对",
	[14]: "清龙七对",
	[15]: "清双龙七对",
	[16]: "幺九",
	[17]: "幺九大对子",
	[18]: "将对",
	[19]: "将七对",
	[20]: "将龙七对",
	[21]: "将双龙七对",
	[22]: "清对对胡",
	[23]: "卡心五",
	[24]: "海底",
	[25]: "门清中张",
	[26]: "缺一门",
	[27]: "小肥羊",
	[28]: "摆牌",
	[29]: "地龙",
	[30]: "清地龙",
	[31]: "中鸡",
	[32]: "报听",
	[33]: "杀报",
	[34]: "原报",
	[35]: "杀原报",
	[36]: "一扣二",
	[37]: "通三",
	[38]: "冲锋鸡",
	[39]: "乌骨鸡",
	[40]: "责任鸡",
	[41]: "责任乌骨鸡",
	[42]: "翻牌鸡",
	[43]: "摇摆鸡",
	[44]: "星期鸡",
	[45]: "估卖",
	[46]: "包鸡",
	[47]: "金鸡",
	[48]: "银鸡",
	[49]: "单吊",
	[50]: "清单吊",
	[51]: "闷",
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


// //换牌推送
// proto.GAME_HUAN_PAI_NOTIFY = 516;
// proto.GAME_HUAN_PAI_PUSH = 616;
// proto.gameHuanPaiPush = function (uid, cards, chairID) {
// 	return {
// 		type: this.GAME_HUAN_PAI_PUSH,
// 		data: {
// 			uid,
// 			cardList: cards,
// 			chairID
// 		},
// 	};
// };
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

//换三张推送
// proto.GAME_USER_HUAN_PAI_SUGGEST_PUSH = 617;
// proto.gameHuanPaiSuggest = function (uid, cardList, huanPaiType) {
// 	return {
// 		type: this.GAME_USER_HUAN_PAI_SUGGEST_PUSH,
// 		data: {
// 			uid,
// 			cardList,
// 			huanPaiType
// 		},
// 	};
// };

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

// //玩家晒牌
// proto.GAME_USER_SHAI_PAI_NOTIFY = 519;
// proto.GAME_USER_SHAI_PAI_PUSH = 619;
// proto.gameShaiPaiPush = function (uid, cardList, allHuCards) {
// 	return {
// 		type: this.GAME_USER_SHAI_PAI_PUSH,
// 		data: {
// 			uid,
// 			cardList,
// 			allHuCards
// 		},
// 	};
// };

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



// proto.operateTm1 = 30; /* 弃牌操作时间 */
// proto.operateTm2 = 30; /* 碰杠操作时间 */
// proto.operateGangChooseTm = 15; /* 杠牌选择时间 */

// proto.GAME_STATUS_PUSH = 470; /* 状态推送 */
// proto.gameStatusPush = function (gameStatus, tick) {
// 	return {
// 		type: this.GAME_STATUS_PUSH,
// 		data: {
// 			gameStatus: gameStatus,
// 			tick: tick,
// 		},
// 	};
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

// proto.GAME_ROB_BANK_NOTIFY = 502; /* 抢庄通知 */
// proto.GAME_ROB_BANK_PUSH = 602; /* 抢庄结果 */
// proto.gameRobBankPush = function (uid, chairID, isRob) {
// 	return {
// 		type: this.GAME_ROB_BANK_PUSH,
// 		data: {
// 			uid,
// 			chairID,
// 			isRob
// 		},
// 	};
// };

// //发玩家手牌
// proto.GAME_SEND_CARDS_PUSH = 603;
// proto.gameSendCardPush = function (handCards, dice1, dice2, huaCards) {
// 	return {
// 		type: this.GAME_SEND_CARDS_PUSH,
// 		data: {
// 			handCards,
// 			dice1,
// 			dice2,
// 			huaCards
// 		},
// 	};
// };

// //玩家托管
// proto.GAME_TRUST_NOTIFY = 505;
// proto.gameTrushNotify = function (trust) {
// 	return {
// 		type: this.GAME_TRUST_NOTIFY,
// 		data: {
// 			trust: trust,
// 		},
// 	};
// }
// proto.GAME_TRUST_PUSH = 605;
// proto.gameTrushPush = function (uid, trust) {
// 	return {
// 		type: this.GAME_TRUST_PUSH,
// 		data: {
// 			uid: uid,
// 			trust: trust,
// 		},
// 	};
// };

// //游戏结果推送
// proto.GAME_RESULT_PUSH = 606;
// proto.gameResultPush = function (result, lastCards, bankerUid) {
// 	return {
// 		type: this.GAME_RESULT_PUSH,
// 		data: {
// 			result: result,
// 			lastCards: lastCards,
// 			bankerUid: bankerUid
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

// proto.GAME_REST_CARDS_COUNT_PUSH = 613;
// proto.gameRestCardsCountPush = function (restCardsCount) {
// 	return {
// 		type: this.GAME_REST_CARDS_COUNT_PUSH,
// 		data: {
// 			restCardsCount: restCardsCount,
// 		},
// 	};
// };

// proto.GAME_TURN_PUSH = 614;
// proto.gameOperateArrayPush = function (uid, card, tick, operateArray, plusInfo) {
// 	return {
// 		type: this.GAME_TURN_PUSH,
// 		data: {
// 			uid: uid,
// 			card: card,
// 			tick: tick,
// 			operateArray: operateArray,
// 			plusInfo: plusInfo,
// 		},
// 	};
// };

// proto.GAME_TURN_OPERATE_NOTIFY = 515;
// proto.gameOperateNotify = function (card, operate, cardList) {
// 	return {
// 		type: this.GAME_TURN_OPERATE_NOTIFY,
// 		data: {
// 			card: card,
// 			operate: operate,
// 			cardList: cardList,
// 		},
// 	};
// };
// proto.GAME_TURN_OPERATE_PUSH = 615;
// proto.gameOperatePush = function (uid, card, operate, success, plusInfo) {
// 	return {
// 		type: this.GAME_TURN_OPERATE_PUSH,
// 		data: {
// 			uid: uid,
// 			card: card,
// 			operate: operate,
// 			success: success,
// 			plusInfo: plusInfo,
// 		},
// 	};
// };

// //换牌推送
// proto.GAME_HUAN_PAI_NOTIFY = 516;
// proto.gameHuanPaiNotify = function (cardData) {
// 	return {
// 		type: this.GAME_HUAN_PAI_NOTIFY,
// 		data: {
// 			cardData
// 		}
// 	}
// }
// proto.GAME_HUAN_PAI_PUSH = 616;
// proto.gameHuanPaiPush = function (uid, cards) {
// 	return {
// 		type: this.GAME_HUAN_PAI_PUSH,
// 		data: {
// 			uid,
// 			cards
// 		},
// 	};
// };


// proto.GAME_USER_HUAN_PAI_SUGGEST_PUSH = 617;
// proto.gameHuanPaiSuggest = function (uid, cardList, huanPaiType) {
// 	return {
// 		type: this.GAME_USER_HUAN_PAI_SUGGEST_PUSH,
// 		data: {
// 			uid,
// 			cardList,
// 			huanPaiType
// 		},
// 	};
// };

// proto.GAME_USER_HUAN_PAI_END_PUSH = 618;
// proto.gameHuanPaiEndPush = function (uid, cardList) {
// 	return {
// 		type: this.GAME_USER_HUAN_PAI_END_PUSH,
// 		data: {
// 			uid,
// 			cardList
// 		},
// 	};
// };

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

// //玩家晒牌轮推送
// proto.GAME_SHAI_PAI_TURN_PUSH = 520;
// proto.gameShaiPaiTurnPush = function (uid, isGuo = false) {
// 	return {
// 		type: this.GAME_SHAI_PAI_TURN_PUSH,
// 		data: {
// 			uid,
// 			isGuo
// 		},
// 	};
// };

// proto.GAME_GANG_SCORE_PUSH = 626;
// proto.gameGangScorePush = function (uid, detail) {
// 	return {
// 		type: this.GAME_GANG_SCORE_PUSH,
// 		data: {
// 			uid,
// 			detail
// 		},
// 	};
// };

// proto.GAME_ALL_HU_CARDS_PUSH = 627;
// proto.gameAllHuCardsPush = function (allHuCards) {
// 	return {
// 		type: this.GAME_ALL_HU_CARDS_PUSH,
// 		data: {
// 			allHuCards
// 		},
// 	};
// };

// //删除手牌推送
// proto.GAME_QIANG_GANG_DELETE_PUSH = 628;
// proto.gameQiangGangDeletePush = function (uid, card) {
// 	return {
// 		type: this.GAME_QIANG_GANG_DELETE_PUSH,
// 		data: {
// 			uid,
// 			card
// 		},
// 	};
// };



proto.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY = 551; /* 下局换牌 */
proto.GAME_SUBSTRATUM_TRADE_CARDS_PUSH = 651; /* 下局换牌结果 */
proto.GAME_INQTIRE_ARRCARDS_NOTIFY = 552; /* 查询牌库 */
proto.GAME_INQTIRE_ARRCARDS_PUSH = 652; /*查询牌库结果 */

// proto.gameSubstratumTradeCardsNotify = function (cardData) {
// 	return {
// 		type: this.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY,
// 		data: {
// 			cardData: cardData,
// 		},
// 	};
// };


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

// proto.gameInqtireArrcardsNotify = function () {
// 	return {
// 		type: this.GAME_INQTIRE_ARRCARDS_NOTIFY,
// 		data: {},
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