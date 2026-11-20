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
	DINGQUE: 5, //定缺
};

//状态等待时间
proto.gameStatusTm = {
	NONE: 0, //等待操作
	DICES: 2, //骰子
	SEND_CARDS: 2, //发牌中 
	PLAYING: 15, //游戏中 
	RESULT: 9, //显示结果 
	DINGQUE: 15, //定缺
};

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
};

//定缺
proto.queType = {
	WAN: 0, //缺万
	TONG: 1, //缺筒
	TIAO: 2, //缺条
};


//用户卡牌类型
proto.cardType = {
	NONE: 0, //不能胡
	SANZHANGZAISHOU: 1, //三张在手
	SANZHANGPENGCHU: 2, //三张碰出
	ANGANG: 3, //暗杠
	MINGGANG: 4, //明杠
	BUGANG: 5, //补杠
	XIAOHUZI: 6, //小胡子
	BAZHI: 7, //八支
	QINGYISE: 8, //清一色
	HUNYISE: 9, //混一色
	FENGYISE: 10, //风一色
	DUIDUIHU: 11, //对对胡
	DADIAOCHE: 12, //大吊车
	YITIAOLONG: 13, //一条龙
	QIXIAODUI: 15, //七小对
	LIULIAN: 16, //六连
	SHUANGLIULIAN: 17, //双六连
	WUTONG: 18, //五通
	SHUANGWUTONG: 19, //双五通
	SIHE: 20, //四核
	SHUANGSIHE: 21, //双四核
	SANSIHE: 22, //三四核
	KUZHIYA: 23, //枯支压
	BUDONGSHOU: 24, //不动手
	YADENG: 25, //压档
	SHUANGPU: 26, //双扑
	SHILAO: 27, //十老
	SHIXIAO: 28, //十小
	QUANLAO: 29, //全老
	QUANXIAO: 30, //全小
	JUEZHANG: 37, //绝张
	//体外循环分
	ZHIMO: 36, //自摸*2
	WAMO: 31, //挖摸
	PINGMO: 32, //平模
	QINGSHUIDANA: 33, //清水大拿
	HUNSHUIDANA: 34, //混水大拿
	//牌型
	PINGHU: 60, //平胡
	QIDUIZI: 61, //七对子
}

proto.plusRateTypeStr = {
	[0]: "",
	[1]: "三张在手",
	[2]: "三张碰出",
	[3]: "暗杠",
	[4]: "明杠",
	[5]: "补杠",
	[6]: "小胡子",
	[7]: "八支",
	[8]: "清一色",
	[9]: "混一色",
	[10]: "风一色",
	[11]: "对对胡",
	[12]: "大吊车",
	[13]: "一条龙",
	[15]: "七小对",
	[16]: "六连",
	[17]: "双六连",
	[18]: "五通",
	[19]: "双五通",
	[20]: "四核",
	[21]: "双四核",
	[22]: "三四核",
	[23]: "枯支压",
	[24]: "不动手",
	[25]: "压档",
	[26]: "双扑",
	[27]: "十老",
	[28]: "十小",
	[29]: "全老",
	[30]: "全小",
	//体外循环分
	[31]: "挖摸",
	[32]: "平模",
	[33]: "清水大拿",
	[34]: "混水大拿",
	[36]: "自摸",
	[37]: "绝张",
	//牌型
	[60]: "平胡",
	[61]: "七对子",
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

//玩家定牌
proto.GAME_USER_DING_QUE_NOTIFY = 504;
proto.gameDingQueNotify = function (type) {
	return {
		type: this.GAME_USER_DING_QUE_NOTIFY,
		data: {
			type
		}
	}
}
proto.GAME_USER_DING_QUE_PUSH = 604;
proto.gameDingQuePush = function (chairID, type) {
	return {
		type: this.GAME_USER_DING_QUE_PUSH,
		data: {
			chairID,
			type
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