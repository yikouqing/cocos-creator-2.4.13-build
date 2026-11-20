let proto = module.exports;
//-----------------------------游戏状态----------------------------------------
proto.gameStatus = {
	NONE: 0,
	SEND_CARDS: 1, //发牌
	JIN_GANG: 2, //进贡
	USER_OPERATE: 3, //出牌
	GAME_END: 4, //游戏结束
};

//游戏操作
proto.operateType = {
	NONE: 0, //未操作
	PASS: 1, //过牌
	OUT: 2, //出牌
	SEND: 3, //发牌
	JIN_GANG: 4, //进贡
	FAN_GANG: 5, //反贡
}

proto.gameStatusTm = {
	NONE: 0,
	/* 等待操作 */
	QIANG_ZHUANG: 30,
	/* 进贡 */
	JIN_GANG: 30,
	/* 反贡 */
	FAN_GANG: 30,
	/* 交换 */
	JIAO_HUAN: 50,
	/* 发牌 */
	USER_OPERATE: 30,
	/* 用户操作 */
	GAME_END: 10, //游戏结束
};

proto.cardType = {
	ERROR: 0, // 错误
	SINGLE: 1, // 单牌
	DOUBLE: 2, // 对子
	SINGLE_LINE: 3, // 单连(只能五张)
	DOUBLE_LINE: 4, // 对连（只能三对）
	THREE_LINE: 5, // 三不带
	THREE_LINE_TAKE_TWO: 6, // 三带2
	STEEL_PLATE: 7, // 钢板
	BOMB_CARD: 8, // 炸弹
	TONG_HUA_SUN: 9, //同花顺
	TIAN_WANG_BOMB: 10, // 天王炸
};

//-----------------------------时间状态----------------------------------------
proto.OPREATION_TIME = 15; // 操作时间
proto.OUT_CARD_TIME = 15; // 显示结果的时间
proto.CAO_ZUO_TIME = 15; //操作时间(出牌，不出操作)

proto.USER_CAHRID_UPDATE_RESULT_PUSH = 616; // 玩家charid更新推送
proto.userCharUpdateResultPush = function (roomID, roomUserInfo) {
	return {
		type: proto.USER_CAHRID_UPDATE_RESULT_PUSH,
		data: {
			roomID,
			roomUserInfo
		}
	};
};



proto.GAME_STATUS_PUSH = 470;

//庄家推送
proto.GAME_BANKER_PUSH = 601;
proto.gameBankerPush = function (uid) {
	return {
		type: this.GAME_BANKER_PUSH,
		data: {
			uid
		},
	};
};
//进贡推送
proto.GAME_JIN_GANG_NOTIFY = 502;
proto.GAME_JIN_GANG_PUSH = 602;
/**进贡结果 */
proto.GAME_JIN_GANG_RESULT_PUSH = 622;
proto.gameJinGongPush = function (data) {
	return {
		type: this.GAME_JIN_GANG_PUSH,
		data: {
			data,
		},
	};
	// uid: key, //玩家uid
	// Cardstype: 3,//1为进贡 2为反贡 3为抗贡
	// cards: 0x4E,//对象 牌 抗贡反贡有值 进贡无值 
};

proto.GAME_EXCHANGE_PUSH = 615; /*交换结果 */
proto.gameExchangePush = function (onGameExchangelist) {
	return {
		type: this.GAME_EXCHANGE_PUSH,
		data: {
			onGameExchangelist
		},
	};
};

proto.getJinGongNotify = function (uid, operateType, cards) {
	return {
		type: this.GAME_JIN_GANG_NOTIFY,
		data: {
			uid: uid,
			cards: cards,
			operateType: operateType,
		},
	};

	// uid: key, //玩家uid
	// Cardstype: 3,//1为进贡 2为反贡 3为抗贡
	// cards: 0x4E,//对象 牌 抗贡反贡有值 进贡无值 
};





//发玩家手牌
proto.GAME_SEND_CARDS_PUSH = 603;
proto.gameSendCardPush = function (handCards) {
	return {
		type: this.GAME_SEND_CARDS_PUSH,
		data: {
			handCards
		},
	};
};

//开始操作推送
proto.GAME_USER_OPERATE_START_PUSH = 604;
proto.gameUserOperateStartPush = function (uid, cards, lastOperateUid, tick) {
	return {
		type: this.GAME_USER_OPERATE_START_PUSH,
		data: {
			uid,
			cards,
			tick,
			lastOperateUid
		},
	};
};

//游戏结果推送
proto.GAME_RESULT_PUSH = 606;
proto.gameResultPush = function (result, hasChuntian, leftCards, bankerUid) {
	return {
		type: this.GAME_RESULT_PUSH,
		data: {
			result: result,
			hasChuntian: hasChuntian,
			allLeftCards: leftCards,
			bankerUid: bankerUid,
		},
	};
};


//牌面回放
proto.GAME_REVIEW_NOTIFY = 507;
proto.GAME_REVIEW_PUSH = 607;
proto.gameReviewNotify = function () {
	return {
		type: this.GAME_REVIEW_NOTIFY,
		data: {},
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

//房间解散
proto.GAME_END_PUSH = 609;
proto.gameEndPush = function (result, winMost, loseMost, creater, plusInfo) {
	return {
		type: this.GAME_END_PUSH,
		data: {
			result: result,
			winMost: winMost,
			loseMost: loseMost,
			creater: creater,
			plusInfo: plusInfo,
		},
	};
};


//推送操作
proto.GAME_USER_OPERATE_NOTIFY = 510;
proto.GAME_USER_OPERATE_PUSH = 610;
proto.getOperateNotify = function (uid, operateType, cards) {
	return {
		type: this.GAME_USER_OPERATE_NOTIFY,
		data: {
			uid: uid,
			cards: cards,
			operateType: operateType,
		},
	};
};

//玩家分数变化推送
proto.GAME_USER_SCORE_CHANGE_PUSH = 612;
proto.gameUserScoreChangePush = function (userPourScore, userTotalScore, userScore, curScore, baseTotalScore, mangoScore) {
	return {
		type: this.GAME_USER_SCORE_CHANGE_PUSH,
		data: {
			userPourScore,
			userTotalScore,
			userScore,
			curScore,
			baseTotalScore,
			mangoScore
		},
	};
};

///玩家名次推送
proto.GAME_PLAYER_RANKING_PUSH = 613;

//发同边玩家手牌
proto.GAME_SIDE_SEND_CARDS_PUSH = 614;

//----------------------------调试功能------------------------------------

//换牌
proto.GAME_SET_TEST_CARDS_NOTIFY = 551;
proto.setTestCardsNotify = function (uid, cardData) {
	return {
		type: this.GAME_SET_TEST_CARDS_NOTIFY,
		data: {
			uid: uid,
			cardData: cardData
		}
	}
};
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
proto.getGetTestCardsNotify = function (uid) {
	return {
		type: this.GAME_GET_TEST_CARDS_NOTIFY,
		data: { uid }
	}
};
proto.GAME_GET_TEST_CARDS_PUSH = 652;
proto.gameGetTestCardsPush = function (uid, allCardsData, testCards) {
	return {
		type: this.GAME_GET_TEST_CARDS_PUSH,
		data: {
			uid,
			allCardsData,
			testCards
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
proto.gameTrushPush = function (uid, trust) {
	return {
		type: this.GAME_TRUST_PUSH,
		data: {
			uid: uid,
			trust: trust,
		},
	};
};