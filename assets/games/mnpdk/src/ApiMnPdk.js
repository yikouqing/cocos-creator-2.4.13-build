let proto = module.exports;

// 冕宁跑得快协议
//-----------------------------玩家操作----------------------------------------
proto.GAME_USER_OUT_CARD_NOTIFY = 302; // 用户出牌通知
proto.GAME_USER_OUT_CARD_PUSH = 402; // 用户出牌推送

proto.GAME_USER_PASS_NOTIFY = 303; // 用户不出通知
proto.GAME_USER_PASS_PUSH = 403; // 用户不出通知

proto.GAME_USER_BOMB_WIN_PUSH = 407; // 用户炸弹赢的推送
proto.GAME_USER_OUT_CARD_TURN_PUSH = 408; // 通知用户第一次该谁出牌
//-----------------------------游戏状态----------------------------------------
proto.GAME_START_PUSH = 405; // 游戏开始推送
proto.GAME_RESULT_PUSH = 406; // 游戏结果推送
proto.GAME_CHAT_NOTIFY = 310; /* 游戏聊天 */
proto.GAME_CHAT_PUSH = 410;

proto.GAME_DISMISS_PUSH = 411; /* 解散房间 */

proto.GAME_TRUST_NOTIFY = 312; /* 托管 */
proto.GAME_TRUST_PUSH = 412; /* 托管 */


proto.GAME_PRETURN_CARDS_NOTIFY = 313; /* 上一轮牌 */
proto.GAME_PRETURN_CARDS_PUSH = 413;

proto.GAME_BANKER_PUSH = 321; //定庄
proto.GAME_STATUS_PUSH = 322; //游戏状态

//---------------------------游戏规则--------------------------------------
/* 通知申报 */
proto.GAME_INFORM_DRUM_VITALITY_PUSH = 318;

/* 通知拉回来 */
proto.GAME_INFORM_PULL_BACK_PUSH = 319;

proto.GAME_DRUM_VITALITY_NOTIFY = 314; /* 申报 */
proto.GAME_DRUM_VITALITY_PUSH = 414; /* 申报结果 */

proto.GAME_PULL_BACK_NOTIFY = 315; /* 拉回来 */
proto.GAME_PULL_BACK_PUSH = 415; /* 拉回来结果 */

//----------------------------调试功能------------------------------------
proto.GAME_LOOK_CARDS_NOTIFY = 316; /* 看牌 */
proto.GAME_LOOK_CARDS_PUSH = 416; /* 看牌结果 */

proto.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY = 317; /* 下局换牌 */
proto.GAME_SUBSTRATUM_TRADE_CARDS_PUSH = 417; /* 下局换牌结果 */

proto.GAME_INQTIRE_ARRCARDS_NOTIFY = 318; /* 查询牌库 */
proto.GAME_INQTIRE_ARRCARDS_PUSH = 418; /*查询牌库结果 */

//-----------------------------游戏状态----------------------------------------
proto.gameStatus = {
	NONE: 0,
	OUT_CARD: 1, //出牌
	GAME_END: 2, //游戏结束
	GU_CHUN: 3, //申报状态
};
//-----------------------------炸弹状态----------------------------------------
proto.boomScore = {
	FAN_BEI: 0, //翻倍
	TWO_SCORE: 1, //2分
	THREE_SCORE: 2, //3分
	FIVE_SCORE: 3, //5分
	TEN_SCORE: 4, //10分
};
//-----------------------------申报状态----------------------------------------
proto.guChunStatus = {
	NONE: 0, //没有申报
	GU_CHUN: 1, //玩家申报
	PULL_BACK: 2, //拉回来
};

//-----------------------------首局出牌----------------------------------------
proto.firstRoundOut = {
	RANDOM: 0, //随机出牌
	BANKER: 1, //首位出牌
	HEITAOWU: 2, //黑桃5出牌
};

//-----------------------------时间状态----------------------------------------
proto.OPREATION_TIME = 15; // 操作时间
proto.OUT_CARD_TIME = 15; // 显示结果的时间
proto.GU_CHUN_TIME = 15; //申报（拉回来）操作时间

proto.cardType = {
	ERROR: 0, // 错误
	SINGLE: 1, // 单牌
	DOUBLE: 2, // 对子
	SINGLE_LINE: 3, // 单连
	DOUBLE_LINE: 4, // 对连
	THREE_LINE: 5, // 三连
	THREE_LINE_TAKE_ONE: 6, // 三连带1
	THREE_LINE_TAKE_TWO: 7, // 三连带2
	FOUR_LINE_TAKE_TWO: 8, // 四带2
	FOUR_LINE_TAKE_THREE: 9, // 四带3
	BOMB_CARD: 10 // 炸弹
};

proto.gameType = {
	/* 游戏玩法 */
	JINGDIAN: 1,
	/* 经典玩法 */
	CARDS15: 2,
	/* 15张玩法 */
	PINGJIANG: 3,
};

proto.gameStartPush = function (curChairID, selfCardArr, curBureau) {
	return {
		type: this.GAME_START_PUSH,
		data: {
			curChairID: curChairID,
			selfCardArr: selfCardArr,
			curBureau: curBureau,
		}
	};
};

proto.gameUserOutCardNotify = function (outCardArr) {
	return {
		type: this.GAME_USER_OUT_CARD_NOTIFY,
		data: {
			outCardArr: outCardArr
		}
	}
};

proto.gameUserOutCardPush = function (chairID, curChairID, outCardArr, leftCardCount, enablePass, handCardArr) {
	return {
		type: this.GAME_USER_OUT_CARD_PUSH,
		data: {
			chairID: chairID,
			curChairID: curChairID,
			outCardArr: outCardArr,
			leftCardCount: leftCardCount,
			enablePass: enablePass,
			handCardArr: handCardArr,
		}
	}
};

proto.gameUserPassNotify = function () {
	return {
		type: this.GAME_USER_PASS_NOTIFY,
		data: {}
	}
};

proto.gameUserPassPush = function (chairID, curChairID, enablePass, isNewTurn, handCardArr) {
	return {
		type: this.GAME_USER_PASS_PUSH,
		data: {
			chairID: chairID,
			curChairID: curChairID,
			enablePass: enablePass,
			isNewTurn: isNewTurn,
			handCardArr: handCardArr,
		}
	}
};

// 游戏结果推送
proto.gameResultPush = function (allCardArr, winChairID, winArr, nicknameArr, allHandCards, headArr, idArr, bombArr, hasChuntian, allLeftCards) {
	return {
		type: this.GAME_RESULT_PUSH,
		data: {
			allCardArr: allCardArr,
			winChairID: winChairID,
			winArr: winArr,
			nicknameArr: nicknameArr,
			allHandCards: allHandCards,
			headArr: headArr,
			idArr: idArr,
			bombArr: bombArr,
			hasChuntian: hasChuntian,
			allLeftCards: allLeftCards,
		}
	};
};

// 炸弹赢推送
proto.gameUserBombWinPush = function (chairID) {
	return {
		type: this.GAME_USER_BOMB_WIN_PUSH,
		data: {
			chairID: chairID
		}
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

proto.gameDismissPush = function (userArray, creator, reason) {
	return {
		type: this.GAME_DISMISS_PUSH,
		data: {
			userArray: userArray,
			creator: creator,
			reason: reason,
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

proto.gamePreTurnCardsNotify = function () {
	return {
		type: this.GAME_PRETURN_CARDS_NOTIFY,
		data: {},
	};
};

proto.gamePreTurnCardsPush = function (list) {
	return {
		type: this.GAME_PRETURN_CARDS_PUSH,
		data: {
			list: list,
		},
	};
};


//通知玩家申报
proto.gameInformDrumVitalityPush = function (chairID, tick) {
	return {
		type: this.GAME_INFORM_DRUM_VITALITY_PUSH,
		data: {
			chairID: chairID,
			tick: tick,
		},
	};
};


/**选择是否申报 */
proto.gameDrumVitalityNotify = function (trust) {
	return {
		type: this.GAME_DRUM_VITALITY_NOTIFY,
		data: {
			trust: trust,
		},
	};
};

/**申报结果通知 */
proto.gameDrumVitalityPush = function (chairID, trust) {
	return {
		type: this.GAME_DRUM_VITALITY_PUSH,
		data: {
			chairID: chairID,
			trust: trust,
		},
	};
};

/**选择是否拉回来 */
proto.gamePullBackNotify = function (trust) {
	return {
		type: this.GAME_PULL_BACK_NOTIFY,
		data: {
			trust: trust,
		},
	};
};

//通知庄家拉回来的操作
proto.gamePullBackPush = function (bankerChairID, trust) {
	return {
		type: this.GAME_PULL_BACK_PUSH,
		data: {
			bankerChairID: bankerChairID,
			trust: trust
		},
	};
};

//通知显示拉回来按钮 
proto.gameInformPullBackPush = function (bankerChairID, tick) {
	return {
		type: this.GAME_INFORM_PULL_BACK_PUSH,
		data: {
			bankerChairID: bankerChairID,
			tick: tick
		},
	};
};

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

proto.gameSubstratumTradeCardsNotify = function (optChairID, cardDataArr) {
	return {
		type: this.GAME_SUBSTRATUM_TRADE_CARDS_NOTIFY,
		data: {
			optChairID: optChairID,
			cardDataArr: cardDataArr,
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

proto.gameInqtireArrcardsNotify = function (optChairID) {
	return {
		type: this.GAME_INQTIRE_ARRCARDS_NOTIFY,
		data: {
			optChairID: optChairID,
		},
	};
};

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



//cwx------------------新增-----------------------


//游戏开始定庄推送
proto.bankerPush = function (bankerChairID) {
	return {
		type: this.GAME_BANKER_PUSH,
		data: {
			bankerChairID: bankerChairID
		}
	};
};

//推送游戏状态
proto.gameStatusPush = function (gameStatus, tick) {
	return {
		type: this.GAME_STATUS_PUSH,
		data: {
			gameStatus: gameStatus,
			tick: tick,
		}
	};
};

//通知玩家出牌
proto.gameUserOutCardTurnPush = function (chairID, tick) {
	return {
		type: this.GAME_USER_OUT_CARD_TURN_PUSH,
		data: {
			chairID,
			tick
		}
	};
};