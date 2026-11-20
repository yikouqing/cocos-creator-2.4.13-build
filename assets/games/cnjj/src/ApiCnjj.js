let proto = module.exports;

proto.gameStatus = {
	NONE: 0, //等待操作
	CHANGE_BANKER: 1, //庄家切换
	BANKER_POUR: 2, // 
	POUR_SCORE: 3, // 
	SEND_CARDS: 4, //
	SHOW_CARDS: 5, //亮牌
	RESULT: 6 // 显示结果
};

//卡牌基本类型
proto.cardType = {
	DANZHANG: 1, //单牌
	DUIZI: 2 //对子
}

//庄家操作类型
proto.bankerOperateType = {
	NONE: 0,
	XIAZHUANG: 1, //下庄
	SHANGZHUANG: 2, //重新上庄
	JIXU: 3, //继续
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

//庄家选择推送
proto.GAME_BANKER_OPERATE_CHOOSE_PUSH = 602;
proto.gameBankerOperateChoosePush = function (uid, operateList) {
	return {
		type: this.GAME_BANKER_OPERATE_CHOOSE_PUSH,
		data: {
			uid,
			operateList
		},
	};
};



//发玩家手牌
proto.GAME_SEND_CARDS_PUSH = 603;

//开始操作推送
proto.GAME_USER_OPERATE_START_PUSH = 604;
proto.gameUserOperateStartPush = function (isFixScore, minSocre, isWatch) {
	return {
		type: this.GAME_USER_OPERATE_START_PUSH,
		data: {
			isFixScore,
			minSocre,
			isWatch
		},
	};
};

//庄家下底推送
proto.GAME_BANKER_OPERATE_START_PUSH = 605;
proto.gameBankerOperateStartPush = function (bankerUid, minScore, maxScore, userList) {
	return {
		type: this.GAME_BANKER_OPERATE_START_PUSH,
		data: {
			bankerUid,
			minScore,
			maxScore,
			userList
		},
	};
};


//游戏结果推送
proto.GAME_RESULT_PUSH = 606;
proto.gameResultPush = function (result) {
	return {
		type: this.GAME_RESULT_PUSH,
		data: {
			result: result
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


//推送操作
proto.GAME_USER_OPERATE_NOTIFY = 510;
proto.gameUserOperateNotify = function (score, isWatch = false, watchUid = "") {
	return {
		type: this.GAME_USER_OPERATE_NOTIFY,
		data: {
			score,
			isWatch,
			watchUid
		},
	};
};
proto.GAME_USER_OPERATE_PUSH = 610;
proto.gameUserOperatePush = function (uid, score, userPourList, isWatch, watchUid) {
	return {
		type: this.GAME_USER_OPERATE_PUSH,
		data: {
			uid,
			score,
			userPourList,
			isWatch,
			watchUid
		},
	};
};

//庄家下底操作
proto.GAME_BANKER_OPERATE_NOTIFY = 511;
proto.gameBankerOperateNotify = function (score) {
	return {
		type: this.GAME_BANKER_OPERATE_NOTIFY,
		data: {
			score
		},
	};
}
proto.GAME_BANKER_OPERATE_PUSH = 611;
proto.gameBankerOperatePush = function (uid, score, guoBaseScore) {
	return {
		type: this.GAME_BANKER_OPERATE_PUSH,
		data: {
			uid,
			score,
			guoBaseScore
		},
	};
};

//庄家换庄选择
proto.GAME_BANKER_CHOOSE_NOTIFY = 512;
proto.gameBankerChooseNotify = function (operateType) {
	return {
		type: this.GAME_BANKER_CHOOSE_NOTIFY,
		data: {
			operateType
		},
	};
};
proto.GAME_BANKER_CHOOSE_PUSH = 612;
proto.gameBankerChoosePush = function (uid, operateType) {
	return {
		type: this.GAME_BANKER_CHOOSE_PUSH,
		data: {
			uid,
			operateType
		},
	};
};

//亮牌推送
proto.GAME_SHOW_CARDS_NOTIFY = 513;
proto.showCardsNotify = function () {
	return {
		type: this.GAME_SHOW_CARDS_NOTIFY,
		data: {}
	};
}
proto.GAME_SHOW_CARDS_PUSH = 613;
proto.showCardsPush = function (chairID, cardsList, uid = null) {
	return {
		type: this.GAME_SHOW_CARDS_PUSH,
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
proto.gameSetTestCardsNotify = function (cardData, uid) {
	return {
		type: this.GAME_SET_TEST_CARDS_NOTIFY,
		data: {
			cardData,
			uid,
		},
	};
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
proto.gameGetTestCardsNotify = function (uid) {
	return {
		type: this.GAME_GET_TEST_CARDS_NOTIFY,
		data: {
			uid
		},
	};
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