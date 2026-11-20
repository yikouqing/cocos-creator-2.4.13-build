const Enums = require('../../../src/const/Enums');
const ApiNnWjy = require('./ApiNnWjy');
const NNWjyLogic = require('./NNWjyLogic');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const UserModel = require('../../../src/model/UserModel');
const ConfigModel = require('../../../src/model/ConfigModel');
const { Def_Nnwjy } = require('../../../src/const/Defines');

var model = module.exports;

model.init = function () {
	this.gameInited = false;
	this.gameStatus = 0;
	MessageCallback.addListener('RoomMessagePush', this);
	MessageCallback.addListener('GameMessagePush', this);
};

model.setEntryRoomData = function (msg) {
	// console.log('场景数据', msg)
	/* 游戏数据,随时可恢复场景 */
	this.gameInited = true;
	UserModel.setDatas(msg);
	this.roomUserInfoArr = msg.roomUserInfoArr;
	this.gameRule = msg.gameRule;
	this.roomID = msg.roomID;
	this.roomCreatorInfo = msg.roomCreatorInfo;
	this.gameStatus = msg.gameData.gameStatus;
	this.gameStarted = msg.gameData.gameStarted;
	this.tick = msg.gameData.tick;
	this.bankerChairID = msg.gameData.bankerChairID;
	this.pourScores = msg.gameData.pourScores;
	this.robBankScales = msg.gameData.robBankScales;
	this.handCards = msg.gameData.handCards;
	this.endCards = msg.gameData.endCards;
	this.OperateCard = msg.gameData.OperateCard;
	this.canOperateCards = msg.gameData.canOperateCards;
	// console.log("gameRule-test", this.gameRule);
	this.curBureau = msg.gameData.curBureau;
	this.maxBureau = msg.gameData.maxBureau;
	this.chairCount = msg.gameData.chairCount;
	this.showCards = msg.gameData.showCards;
	this.endTypeCards = msg.gameData.endTypeCards;
	this.userTrustArray = msg.gameData.userTrustArray;
	this.result = msg.gameData.result;
	this.curScores = msg.gameData.curScores;
	this.tuiArr = msg.gameData.tuiArr;
	this.myUid = UserModel.getData('uid');
	this.askForExitArr = null;
	NNWjyLogic.setCardsType(this.gameRule.cardsType, this.gameRule.scaleType); /* magic */
};


/**
 * 获取玩家调试
 * @param {*} uid 不传入默认自己
 * @returns 
 */
model.getUserTest = function (uid) {
	let userUid = !!uid ? uid : UserModel.getData('uid');
	let array = this.roomUserInfoArr || [];
	if (!userUid || !array.length) return false;
	for (let index = 0; index < array.length; index++) {
		let curData = array[index];
		if (!!curData && !!curData.userInfo) {
			let curuid = curData.userInfo.uid;
			if (!!curuid && curuid == userUid) {
				return !!curData.userInfo.isTest;
			}
		}
	}
	return false;
}

/**座位号转换 */
model.getUserChairIndex = function (chairID) {
	return (chairID - this.getMyChairID() + this.gameRule.maxPlayerCount) % this.gameRule.maxPlayerCount;
}
model.getRoomData = function () {
	var msg = {
		roomUserInfoArr: this.roomUserInfoArr,
		gameRule: this.gameRule,
		roomID: this.roomID,
		roomCreatorInfo: this.roomCreatorInfo,
		gameData: {
			gameStatus: this.gameStatus,
			gameStarted: this.gameStarted,
			tick: this.tick,
			bankerChairID: this.bankerChairID,
			pourScores: this.pourScores,
			robBankScales: this.robBankScales,
			handCards: this.handCards,
			endCards: this.endCards,
			curBureau: this.curBureau,
			maxBureau: this.maxBureau,
			chairCount: this.chairCount,
			showCards: this.showCards,
			userTrustArray: this.userTrustArray,
			result: this.result,
			curScores: this.curScores,
			tuiArr: this.tuiArr,
			myUid: UserModel.getData('uid'),
			endTypeCards: this.endTypeCards
		}
	};
	return msg;
};

model.getGameInited = function () {
	return this.gameInited;
};

model.getNNLogic = function () {
	return NNWjyLogic;
};

model.setGameInited = function (value) {
	this.gameInited = value;
};

model.getMyUid = function () {
	return this.myUid;
};

model.getRoomCreatorChairID = function () {
	for (let user of this.roomUserInfoArr) {
		if (user.userInfo.uid == this.roomCreatorInfo.uid) {
			return user.chairID;
		}
	}
	return null;
};

model.getGameType = function () {
	return this.gameRule.gameFrameType;
};

model.getRobBankLimit = function () {
	// console.log("游戏规则==", this.gameRule)
	return this.gameRule.robBankLimit;
};

model.getGameStarted = function () {
	return this.gameStarted;
};

model.getCardsType = function () {
	return this.gameRule.cardsType;
};

model.getRoomID = function () {
	return this.roomID;
};

model.getCurBureau = function () {
	return this.curBureau;
};

model.getMaxBureau = function () {
	return this.maxBureau;
};

model.getGameRuleByKey = function (key) {
	this.gameRule = this.gameRule || {};
	return this.gameRule[key];
}

model.messageCallbackHandler = function (route, msg) {
	if (route === 'RoomMessagePush') {
		if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
			// console.log("初始化房间=", msg)
			this.setEntryRoomData(msg.data);
		} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
			if (!this.gameInited) {
				return;
			}
			this.addUser(msg.data.roomUserInfo);
		} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
			if (!this.gameInited) {
				return;
			}
			if (msg.data.roomUserInfo.chairID != this.getMyChairID()) {
				this.delUser(msg.data.roomUserInfo.chairID);
			}
			if (msg.data.roomUserInfo.chairID === this.getMyChairID()) {
			}
		} else if (msg.type === ApiRoom.USER_READY_PUSH) {
			if (!this.gameInited) return;
			// console.log('可能-玩家-准备', msg.data)
			this.userReady(msg.data.chairID);
		} else if (msg.type === ApiRoom.ROOM_DISMISS_PUSH) {
			if (!this.gameInited) {
				return;
			}
			this.askForExitArr = null;
			this.roomDismissReason = msg.data.reason;
			if (msg.data.reason != Enums.gameRoomDismissReason.BUREAU_FINISHED) {
			}
		} else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
			if (!this.gameInited) {
				return;
			}
			this.askForExitArr = msg.data.chairIDArr;
			if (msg.data.chairIDArr.indexOf(false) != -1) {
				this.askForExitArr = null;
			}
		} else if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
			if (msg.data.code != 0) return;
			if (!this.gameInited) return;
			for (let user of this.roomUserInfoArr) {
				if (user.userInfo.uid == msg.data.uid) {
					// console.log('可能-玩家入座', msg.data.uid, msg.data.userStatus)
					user.chairID = msg.data.toChairID;
					user.userStatus = msg.data.userStatus;
				}
			}
		} else if (msg.type === ApiRoom.ROOM_USER_INFO_CHANGE_PUSH) {
			// console.log('牛牛-ROOM_USER_INFO_CHANGE_PUSH', msg.data);
			if (!this.gameInited) return;
			for (let i = 0; i < this.roomUserInfoArr.length; ++i) {
				if (this.roomUserInfoArr[i].userInfo.uid == msg.data.changeInfo.uid) {
					// console.log('可能-玩家信息刷新', msg.data.changeInfo);
					for (let key in msg.data.changeInfo) {
						this.roomUserInfoArr[i].userInfo[key] = msg.data.changeInfo[key];
					}
				}
			}
		} else if (msg.type === ApiRoom.USER_OFF_LINE_PUSH) {
			if (!this.gameInited) {
				return;
			}
			let user = this.getUserByChairID(msg.data.chairID);
			if (user) {
				user.userStatus = ApiRoom.userStatusEnum.OFFLINE;
			}
		}
	} else if (route === 'GameMessagePush') {
		if (!this.gameInited) return;
		if (msg.type === ApiNnWjy.GAME_BUREAU_PUSH) {
			this.curBureau = msg.data.curBureau;
			this.OperateCard = [];
		} else if (msg.type === ApiNnWjy.GAME_ROB_BANK_PUSH) {
			this.robBank(msg.data.chairID, msg.data.robScale);
		} else if (msg.type === ApiNnWjy.GAME_POUR_SCORE_PUSH) {
			this.pourScore(msg.data.chairID, msg.data.score);
		} else if (msg.type === ApiNnWjy.GAME_SHOW_CARDS_PUSH) {
			if (msg.data.chairID == this.getMyChairID()) {
				this.canOperateCards = msg.data.canOperateCards;
			}
			this.handCards[msg.data.chairID] = msg.data.cards;
			this.endCards[msg.data.chairID] = msg.data.ends;
			this.showCards[msg.data.chairID] = msg.data.cuopai ? 1 : 0;
		} else if (msg.type === ApiNnWjy.GAME_RUFFIAN_RECORD_PUSH) {
			this.handCards[msg.data.chairID] = msg.data.cards;
			this.endCards[msg.data.chairID] = msg.data.endCards;
			this.showCards[msg.data.chairID] = msg.data.cuopai ? 1 : 0;
			this.OperateCard = this.OperateCard || [];
			this.OperateCard[msg.data.chairID] = 1;
		} else if (msg.type === ApiNnWjy.GAME_LOOK_CARDS_PUSH) {
			// console.log("userArr==", msg.data.userArray)
			if (!msg.data.userArray || !Array.isArray(msg.data.userArray)) {
				// console.log("没有数据！")
				return
			}
			for (let index = 0; index < msg.data.userArray.length; index++) {
				if (!msg.data.userArray[index]) continue;
				this.handCards[index] = msg.data.userArray[index]
				this.showCards[index] = 1;
			}
		} else if (msg.type === ApiNnWjy.RESOUT_CARD_PUSH) {
			this.answerResoutCardPush(msg.data.chairID, msg.data.cardArr);
		} else if (msg.type === ApiNnWjy.GAME_RESULT_PUSH) {
			this.result = msg.data.result.winScores;
			this.curScores = msg.data.result.curScores;
			this.tuiArr = msg.data.result.tuiArr;
			this.tick = 0;
		} else if (msg.type === ApiNnWjy.GAME_TUI_ARR_PUSH) {
			this.tuiArr = msg.data.tuiArr;
			// console.log("推注变化推送", this.tuiArr);
		} else if (msg.type === ApiNnWjy.GAME_STATUS_PUSH) {
			this.tick = msg.data.tick;
			this.gameStatus = msg.data.gameStatus;
			this.gameStarted = true;
			if (this.gameStatus == ApiNnWjy.gameStatus.NONE) {
				this.canOperateCards = null;
				this.bankerChairID = null;
				let userStatus = msg.data.userStatus;
				// console.log('可能--游戏状态重置', userStatus);
				if (!!userStatus && !!this.roomUserInfoArr) {
					for (let index = 0; index < this.roomUserInfoArr.length; index++) {
						if (!this.roomUserInfoArr[index]) continue;
						this.roomUserInfoArr[index].userStatus = userStatus[this.roomUserInfoArr[index].chairID] || 0;
					}
				}
				this.result = null;
				this.handCards = [null, null, null, null, null, null, null, null, null, null];
				this.endCards = [];
				this.robBankScales = [null, null, null, null, null, null, null, null, null, null];
				this.pourScores = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
				this.showCards = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
				let gameType = this.getGameType();
				if (gameType != Def_Nnwjy.gameType.NIUNIU && gameType != Def_Nnwjy.gameType.FANGZHU && gameType != Def_Nnwjy.gameType.LUNZHUANG) {
					this.bankerChairID = null;
				}
			}
		} else if (msg.type === ApiNnWjy.GAME_BANKER_PUSH) {
			this.bankerChairID = msg.data.bankerChairID;
			this.robBankScales[this.bankerChairID] = msg.data.robScale;
		} else if (msg.type === ApiNnWjy.GAME_SEND_CARDS_PUSH) {
			this.handCards = msg.data.handCards;
			this.endCards = msg.data.endCards;
			// console.log('手牌-发牌', msg.data.endCards);
		} else if (msg.type === ApiNnWjy.GAME_TRUST_PUSH) {
			this.userTrustArray[msg.data.chairID] = msg.data.trust;
		} else if (msg.type === ApiNnWjy.GAME_END_TYPE_CARDS_PUSH) {
			// console.log("结算======牌型推送", msg.data.chairID, msg.data)
			this.endTypeCards[msg.data.chairID] = msg.data.endTypeCards;
			this.handCards[msg.data.chairID] = msg.data.endTypeCards.handCards;
		} else if (msg.type === ApiNnWjy.GAME_OPERATE_CARDS_PUSH) {
			this.OperateCard = this.OperateCard || [];
			this.OperateCard[msg.data.chairID] = 1;
		}
	}
};

model.robBank = function (chairID, scale) {
	this.robBankScales[chairID] = scale;
};

model.pourScore = function (chairID, score) {
	this.pourScores[chairID] = score;
};

model.userReady = function (chairID) {
	let user = this.getUserByChairID(chairID);
	// console.log('可能-玩家状态---0', user.userStatus);
	if (user) {
		user.userStatus = ApiRoom.userStatusEnum.READY;
		// console.log('可能-玩家状态---1', user.userStatus);
	}
};

model.getGameRule = function () {
	return this.gameRule;
};

model.getGameStatus = function () {
	return this.gameStatus;
};

model.getTick = function () {
	return this.tick;
};

model.subTick = function (dt) {
	this.tick -= dt;
};

model.setTick = function (tick) {
	this.tick = tick;
};

model.onDestroy = function () {
	// console.log("NNModel onDestroy");
	MessageCallback.removeListener('RoomMessagePush', this);
	MessageCallback.removeListener('GameMessagePush', this);
};

model.getBankerChairID = function () {
	return this.bankerChairID;
};

model.getChairCount = function () {
	return this.gameRule.maxPlayerCount;
};

//获取所有玩家
model.getUsers = function () {
	return this.roomUserInfoArr || [];
};

model.getMyChairID = function () {
	for (let user of this.roomUserInfoArr) {
		if (user.userInfo.uid == this.myUid) {
			this.myChairID = user.chairID;
			break;
		}
	}
	return this.myChairID;
};

model.getUserByChairID = function (chairID) {
	let roomUser = null;
	for (let user of this.roomUserInfoArr) {
		if (user.chairID == chairID) {
			roomUser = user;
			break;
		}
	}
	return roomUser;
};

model.getUserByUID = function (uid) {
	this.roomUserInfoArr = this.roomUserInfoArr || [];
	let roomUser = this.roomUserInfoArr.find((user) => {
		return user.userInfo.uid == uid;
	});
	return roomUser;
};

model.checkHaveEmptySeat = function () {
	let gamingPlayerCounts = 0,
		maxPlayerCount = this.getChairCount();
	for (let user of this.roomUserInfoArr) {
		if (user.chairID < maxPlayerCount) {
			gamingPlayerCounts++;
		}
	}
	return gamingPlayerCounts < maxPlayerCount;
};

//获取观战玩家
model.getLookOnUsers = function () {
	let users = [],
		maxPlayerCount = this.getChairCount();
	for (let user of this.roomUserInfoArr) {
		if (user.chairID < maxPlayerCount) continue;
		users.push(user);
	}
	return users;
}

model.getPlayerTakeSeats = function () {
	let users = [],
		maxPlayerCount = this.getChairCount();
	for (let user of this.roomUserInfoArr) {
		if (user.chairID >= maxPlayerCount) continue;
		users.push(user);
	}
	return users;
}

//-1表示无法入座
model.getCanSitDownChairID = function () {
	if (!this.roomUserInfoArr) return -1;
	let inSeatChairID = [],
		chairID = -1;
	for (const user of this.roomUserInfoArr) {
		if (user.chairID < this.getChairCount()) {
			inSeatChairID.push(parseInt(user.chairID));
		}
	}
	if (inSeatChairID.length >= this.getChairCount()) return -1;
	for (let index = 0; index < this.getChairCount(); index++) {
		if (inSeatChairID.indexOf(index) == -1) {
			chairID = index;
			break;
		}
	}
	return chairID;
};

/** 记录/刷新玩家的属性 */
model.setUserPropertyByChairID = function (chairID, key, val) {
	for (let index = 0; index < this.roomUserInfoArr.length; index++) {
		if (this.roomUserInfoArr[index].chairID == chairID) {
			this.roomUserInfoArr[index][key] = val;
			break;
		}
	}
}

model.setUserPropertyByUID = function (uid, key, val) {
	for (let index = 0; index < this.roomUserInfoArr.length; index++) {
		if (this.roomUserInfoArr[index].userInfo.uid == uid) {
			this.roomUserInfoArr[index][key] = val;
			break;
		}
	}
}

model.getIsPlayingCount = function () {
	let num = 0;
	for (let x = 0; x < this.chairCount; x++) {
		let user = this.getUserByChairID(x);
		if (user) {
			num++;
		}
	}
	return num;
};

model.addUser = function (user) {
	for (var i = 0; i < this.roomUserInfoArr.length; ++i) {
		if (this.roomUserInfoArr[i].chairID === user.chairID) {
			this.roomUserInfoArr.splice(i, 1);
		}
	}
	this.roomUserInfoArr.push(user);
};

model.delUser = function (chairID) {
	for (let i = 0; i < this.roomUserInfoArr.length; ++i) {
		if (this.roomUserInfoArr[i].chairID == chairID) {
			this.roomUserInfoArr.splice(i, 1);
			break;
		}
	}
};

model.getRobScaleByChairID = function (chairID) {
	// console.log("抢庄倍数选择", this.robBankScales);
	if (!this.robBankScales) return null;
	if (this.robBankScales[chairID] >= 0) return this.robBankScales[chairID];
	return null;
};

model.getPourScoreByChairID = function (chairID) {
	// console.log("下分==", this.pourScores, chairID)
	return this.pourScores[chairID];
};

model.getHandCardsByChairID = function (chairID) {
	return this.handCards[chairID] || null;
};

model.getEndCardsByChairID = function (chairID) {
	return this.endCards[chairID] || [];
};

model.getTuiStatusByChairID = function (chairID) {
	return this.tuiArr[chairID];
}

model.getCanPourScoresByChairID = function (chairID) {
	let canPourScores = this.gameRule.canPourScores.slice();
	if (this.tuiArr[chairID]) {
		canPourScores.push(this.gameRule.tuiScale[0] * canPourScores[canPourScores.length - 1]);
		canPourScores.sort((a, b) => {
			return a - b;
		});
	}
	for (let i = 0; i < canPourScores.length; ++i) {
		canPourScores[i] *= this.gameRule.baseScore;
	}
	if (this.isUnionCreate() && this.getRoomCreatorByKey('unionType') == Enums.UnionType.MATCH) {
		let user = this.getUserByChairID(chairID);
		let bankerScale = 1;
		if (this.bankerChairID != null && this.robBankScales[this.bankerChairID] != null) {
			bankerScale = this.robBankScales[this.bankerChairID];
		}
		let scale = 1;
		for (let key in this.gameRule.cardsType) {
			let cardScale = NNWjyLogic.getScaleByType(this.gameRule.cardsType[key]);
			if (cardScale > scale) {
				scale = cardScale;
			}
		}
		if (scale == 3 &&
			this.gameRule.cardsType.NIUNIU &&
			this.gameRule.scaleType == Def_Nnwjy.scaleType.BIG) {
			scale = 4;
		}

		// let maxScore = user.userInfo.score / scale / bankerScale;
		// console.log("maxScore", maxScore)
		// while (canPourScores.length > 0 && canPourScores[canPourScores.length - 1] > maxScore) {
		// 	canPourScores.pop();
		// }
		// if (canPourScores.length == 0) {
		// 	canPourScores.push(1);
		// }
	}
	// console.log('canPourScores2', canPourScores);
	return canPourScores;
};

model.getResult = function () {
	return this.result;
};

model.getHandCards = function () {
	return this.handCards;
};

model.isPlayingByChairID = function (chairID) {
	let user = this.getUserByChairID(chairID);
	return user && chairID < this.getChairCount() &&
		(user.userStatus == ApiRoom.userStatusEnum.READY ||
			user.userStatus == ApiRoom.userStatusEnum.PLAYING);
};

model.isInPlaying = function (chairID) {
	chairID = !isNaN(chairID) && chairID >= 0 ? chairID : this.getMyChairID();
	let inPlaying = this.isPlayingByChairID(chairID);
	let isInPlaying = !!inPlaying && this.isInSeat();
	return !!isInPlaying;
}

model.getShowCards = function (chairID) {
	return this.showCards[chairID] == 1;
};

model.getIsBigScale = function () {
	return this.gameRule.scaleType == Def_Nnwjy.scaleType.BIG;
};

model.getTrustByChairID = function (chairID) {
	return this.userTrustArray[chairID];
};

model.getCurScore = function (chairID) {
	// console.log('玩家分数', this.curScores);
	let user = this.getUserByChairID(chairID);
	if (!user) return 0;
	if (this.isUnionCreate() && this.getRoomCreatorByKey('unionType') == Enums.UnionType.MATCH) {
		// console.log('结算分', this.curScores);
		//特殊处理 玩家下注分涉及到小数传输扩大了10倍
		return user.userInfo.score - this.pourScores[chairID] / 10 || 0;
	} else {
		// return user.userInfo.score;
		return this.getCurScoresByChairID(chairID);
	}
};

model.getCurScoresByChairID = function (chairID) {
	// console.log('获取分数---', this.curScores);
	if (!this.curScores) return 0;
	return this.curScores[chairID] || 0;
}

model.getRoomCreator = function () {
	return this.roomCreatorInfo;
};

model.getRoomCreatorByKey = function (key) {
	return !!this.roomCreatorInfo ? this.roomCreatorInfo[key] : null;
};

model.isUnionCreate = function () {
	return (this.roomCreatorInfo && this.roomCreatorInfo.creatorType == Enums.roomCreatorType.UNION_CREATE);
};

model.getRoomDismissReason = function () {
	return this.roomDismissReason;
};

model.isDismissing = function () {
	return !!this.askForExitArr;
};

//获取玩家制定手牌中的牌
model.getHandChairCardByIndex = function (chairID, index) {
	const handCards = this.handCards[chairID];
	if (!handCards) return null;
	return handCards[index];
};

model.getEndCardTypeByChairID = function (chairID) {
	// console.log("获取-牌型", this.endTypeCards);
	return this.endTypeCards[chairID];
}

model.getUserStatusByChairID = function (chairID) {
	let user = this.getUserByChairID(chairID);
	if (!user) return 0;
	return user.userStatus;
}

model.checkUserTakeSeat = function (chairID) {
	return chairID < this.getChairCount();
}

model.isInSeat = function () {
	return this.getMyChairID() < this.getChairCount();
}

model.checkOperateCard = function (chairID) {
	this.OperateCard = this.OperateCard || [];
	return this.OperateCard[chairID];
}

/**
 * 分数状态
 * @returns 0》不操作、1》大厅和普通场、2》比赛场统计
 */
model.scoreState = function () {
	if (!!ConfigModel.getData('openGameScoreStatsForced')) return 1;
	if (!!this.roomCreatorInfo) {
		let creatorType = this.roomCreatorInfo.creatorType;
		if (creatorType == Enums.roomCreatorType.USER_CREATE) { //玩家创建
			return 1;
		} else if (creatorType == Enums.roomCreatorType.UNION_CREATE) { //联盟创建
			let unionType = this.getRoomCreatorByKey('unionType');
			if (unionType == Enums.UnionType.NORMAL) {
				return 1;
			} else if (this.getGameRuleByKey("tongji")) {
				return 2;
			}
		}
	}
	return 0;
}

/**
 * 通过弃牌来查找组合牌
 * @param {*} card 
 * @returns 
 */
model.getUserOperateCards = function (card) {
	this.canOperateCards = this.canOperateCards || {};
	return this.canOperateCards[card];
}

model.getMaxCardType = function () {
	this.canOperateCards = this.canOperateCards || {};
	let opCards = [];
	for (const card in this.canOperateCards) {
		opCards.push(this.canOperateCards[card]);
	}
	opCards.sort((a, b) => {
		return a.NiuNumber - b.NiuNumber;
	});
	opCards.sort((a, b) => {
		return a.CardsType - b.CardsType;
	});
	//取牌型最大的牌
	return opCards.pop();
}

model.isInWatch = function (uid) {
	uid = uid || UserModel.getData('uid');
	let user = this.getUserByUID(uid);
	let chairCount = this.getChairCount();
	let isWatch = !user || user.chairID >= chairCount || user.playStatus == ApiRoom.playStatus.WATCH;
	return isWatch;
}

model.getBundleType = function () {
	return this.getGameRuleByKey('gameType') || Enums.bundleType.WJYNN;
}