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
};

//状态等待时间
proto.gameStatusTm = {
	NONE: 0, //等待操作
	DICES: 2, //骰子
	SEND_CARDS: 2, //发牌中 
	PLAYING: 15, //游戏中 
	RESULT: 5, //显示结果 
};

proto.playType = {
	NONE: 0,
	TDH: 1, //推倒胡
	ZPTDH: 2, //做牌推倒胡
}

//鬼牌玩法
proto.laiZiType = {
	NONE: 0, //无
	BAI: 1, //白板做鬼
	ZHONG: 2, //红中做鬼
	FAN: 3, //翻鬼
	SHUANG: 4, //翻双鬼
}

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
	BAOTING: 60, //报听
	YIFENGLAN: 65, //一风烂
};

//用户卡牌类型
proto.cardType = {
	NONE: 0, //不能胡
	ANGANG: 1, //暗杠
	MINGGANG: 2, //明杠
	GANGSHANGHUA: 3, //杠上花
	WUBAO: 4, //无宝
	SIBAO: 5, //四宝
	WUBAODUZI: 6, //无宝独子
	QUEMEN: 7, //缺门
	DUANYAO: 8, //断幺
	YAOTOU: 9, //幺头
	SIHUO: 10, //四活
	KANZI: 11, //坎子
	QINSANDUI: 12, //亲三对
	MENQING: 13, //门清
	BAOGUIWEI: 15, //宝归位
	HUNYISE: 16, //混一色
	QINGYISE: 17, //清一色
	TONGTIAN: 18, //通天
	TIANHU: 19, //天胡
	DIHU: 20, //地胡
	PENGSANDUI: 21, //碰三对
	PENGSIDUI: 22, //碰四对
	QINGFENG: 23, //清风
	HONGZHONG: 24, //红中
	QIANGGANGHU: 25, //抢杠胡
	SIHONGZHONG: 26, //四红中
	QUANYAO: 27, //全幺
	QISHOUBAOTING: 28, //起手报听
	//宝牌
	DANDIAOBAO: 40, //单吊宝
	SHUANGDIAOBAO: 41, //双吊宝
	//特殊规则
	LIANZHUANG: 50, //连庄
	BAOPAI: 51, //包牌
	TAITOUBAO: 52, //抬头宝
	ZHUIZONGBAO: 53, //追踪宝
	YIFENGLAN: 54, //一风烂
	//牌型
	PINGHU: 60, //平胡
	QIDUIZI: 61, //七对子
	SHISANLAN: 62, //十三烂
	QIFENGQUAN: 63, //七风全
	SHISANLANMENQUE: 64, //十三烂门缺
	SHISANLANQI: 65, //十三烂七
	FENGQUANMENQUE: 66, //风全门缺
}

proto.plusRateTypeStr = {
	[0]: "",
	[1]: "暗杠",
	[2]: "明杠",
	[3]: "杠上花",
	[5]: "四宝",
	[4]: "无宝",
	[6]: "无宝独子",
	[7]: "缺门",
	[8]: "断幺",
	[9]: "幺头",
	[10]: "四活",
	[11]: "坎子",
	[12]: "亲三对",
	[13]: "门清",
	[15]: "宝归位",
	[16]: "混一色",
	[17]: "清一色",
	[18]: "通天",
	[19]: "天胡",
	[20]: "地胡",
	[21]: "碰三对",
	[22]: "碰四对",
	[23]: "清风",
	[24]: "红中",
	[25]: "抢杠胡",
	[26]: "四红中",
	[27]: "全幺",
	[28]: "起手报听",
	[40]: "单吊宝",
	[41]: "双吊宝",
	[50]: "连庄",
	[51]: "包牌",
	[52]: "抬头宝",
	[53]: "追踪宝",
	[54]: "一风烂",
	[60]: "平胡",
	[61]: "七对",
	[62]: "十三烂",
	[63]: "十三烂七风全",
	[64]: "十三烂门缺",
	[65]: "十三烂七风全门缺",
	[66]: "十三烂七风全门缺",
}

proto.operateTm1 = 30; /* 弃牌操作时间 */
proto.operateTm2 = 30; /* 碰杠操作时间 */
proto.operateGangChooseTm = 15; /* 杠牌选择时间 */

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

proto.GAME_BU_HUA_PUSH = 616;
proto.gameBuHuaPush = function (uid, huaCards) {
	return {
		type: this.GAME_BU_HUA_PUSH,
		data: {
			uid,
			huaCards
		},
	};
};

proto.GAME_QIE_PAI_NOTIFY = 518 //切牌申请
proto.GAME_QIE_PAI_PUSH = 618 //切牌申请返回
proto.gameQiePaiNotify = function () {
	return {
		type: this.GAME_QIE_PAI_NOTIFY,
		data: {},
	};
}
proto.gameQiePaiPush = function (isSuccess, msg) {
	return {
		type: this.GAME_QIE_PAI_PUSH,
		data: {
			isSuccess, //申请是否成功
			msg //申请失败的原因
		},
	};
}
proto.GAME_QIE_PAI_ANIMATION_PUSH = 619 //切牌动画


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