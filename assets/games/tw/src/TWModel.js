const TWLogic = require('./TWLogic');
const Enums = require('../../../src/const/Enums');
const ApiTw = require('./ApiTw');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const UserModel = require('../../../src/model/UserModel');
const ConfigModel = require('../../../src/model/ConfigModel');
const { Def_Tw } = require('../../../src/const/Defines');

var model = module.exports;

model.init = function () {
	// console.log("TWModel init");
	this.gameInited = false;
	this.gameStatus = 0;
	this.allResult = null;
	MessageCallback.addListener('RoomMessagePush', this);
	MessageCallback.addListener('GameMessagePush', this);
};

model.setEntryRoomData = function (msg) {
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
	// console.log("恢复场景---", msg)
	this.cardsArr = msg.gameData.cardsArr;
	this.curBureau = msg.gameData.curBureau;
	this.maxBureau = msg.gameData.maxBureau;
	this.chairCount = msg.gameData.chairCount;
	this.sortCardChairArr = msg.gameData.sortCardChairArr;
	this.userTrustArray = msg.gameData.userTrustArray;
	this.result = msg.gameData.result;
	this.curScores = msg.gameData.curScores;
	this.myUid = UserModel.getData('uid');
	this.mianbaiArr = msg.gameData.mianbaiArr;
	this.askForExitArr = null;

	this.playingChairArr = msg.gameData.playingChairArr
	TWLogic.setCardsType(this.gameRule); /* magic */
	this.canShowResReady = false
};

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
			cardsArr: this.cardsArr,
			curBureau: this.curBureau,
			maxBureau: this.maxBureau,
			chairCount: this.chairCount,
			sortCardChairArr: this.sortCardChairArr,
			userTrustArray: this.userTrustArray,
			result: this.result,
			curScores: this.curScores,
			myUid: UserModel.getData('uid'),
		}
	};
	return msg;
};

model.getGameInited = function () {
	return this.gameInited;
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
	return this.gameRule.wanfa;
};

model.getRobBankLimit = function () {
	return this.gameRule.robBankLimit;
};

model.getGameStarted = function () {
	return this.gameStarted;
};

model.getMapai = function (card) {
	if (!TWLogic.mapai) {
		return false;
	}
	return card == TWLogic.mapai;
};

model.getRoomID = function () {
	return this.roomID;
};

model.getCurBureau = function () {
	return this.curBureau;
};

model.getMaxBureau = function () {
	return this.maxBureau === 9999 ? "自由局" : this.maxBureau;
};

model.messageCallbackHandler = function (route, msg) {
	if (route === 'RoomMessagePush') {
		if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
			this.setEntryRoomData(msg.data);
		} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
			this.addUser(msg.data.roomUserInfo);
		} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
			if (msg.data.roomUserInfo.userInfo.uid != this.myUid) {
				this.delUser(msg.data.roomUserInfo.userInfo.uid);
			} else {
			}
		} else if (msg.type === ApiRoom.USER_READY_PUSH) {
			this.userReady(msg.data.chairID);
		} else if (msg.type === ApiRoom.ROOM_DISMISS_PUSH) {
			this.askForExitArr = null;
			this.roomDismissReason = msg.data.reason;
			if (msg.data.reason != Enums.gameRoomDismissReason.BUREAU_FINISHED) {
			}
		} else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
			this.askForExitArr = msg.data.chairIDArr;
			if (msg.data.chairIDArr.indexOf(false) != -1) {
				this.askForExitArr = null;
			}
		} else if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
			if (msg.data.code != 0) return;
			if (!this.roomUserInfoArr) return;
			for (let user of this.roomUserInfoArr) {
				if (user.userInfo.uid == msg.data.uid) {
					user.chairID = msg.data.toChairID;
					user.userStatus = msg.data.userStatus;
				}
			}
		} else if (msg.type === ApiRoom.ROOM_USER_INFO_CHANGE_PUSH) {
			if (!this.roomUserInfoArr) return;
			for (let i = 0; i < this.roomUserInfoArr.length; ++i) {
				if (this.roomUserInfoArr[i].userInfo.uid == msg.data.changeInfo.uid) {
					for (let key in msg.data.changeInfo) {
						this.roomUserInfoArr[i].userInfo[key] = msg.data.changeInfo[key];
					}
				}
			}
		} else if (msg.type === ApiRoom.USER_OFF_LINE_PUSH) {
			let user = this.getUserByChairID(msg.data.chairID);
			if (!user) return;
			user.userStatus = ApiRoom.userStatusEnum.OFFLINE;
		}
	} else if (route === 'GameMessagePush') {
		if (msg.type === ApiTw.GAME_BUREAU_PUSH) {
			this.curBureau = msg.data.curBureau;
			this.canShowResReady = false
		} else if (msg.type === ApiTw.GAME_ROB_BANK_PUSH) {
			this.robBank(msg.data.chairID, msg.data.robScale);
		} else if (msg.type === ApiTw.GAME_POUR_SCORE_PUSH) {
			this.pourScore(msg.data.chairID, msg.data.score);
		} else if (msg.type === ApiTw.GAME_SHOW_CARDS_PUSH) {
			this.sortCardChairArr = this.sortCardChairArr || [];
			this.sortCardChairArr[msg.data.chairId] = 1;
			this.cardsArr = this.cardsArr || [];
			this.cardsArr[msg.data.chairId] = msg.data.cardArr;
		} else if (msg.type === ApiTw.RESOUT_CARD_PUSH) {
			this.answerResoutCardPush(msg.data.chairID, msg.data.cardArr);
		} else if (msg.type === ApiTw.GAME_RESULT_PUSH) {
			this.result = msg.data.result;
			// this.curScores = msg.data.result.curScores;
		} else if (msg.type === ApiTw.GAME_STATUS_PUSH) {
			this.tick = msg.data.tick;
			this.gameStatus = msg.data.gameStatus;
			this.gameStarted = true;
			if (this.gameStatus == ApiTw.gameStatus.NONE) {
				this.bankerChairID = null;
				let userStatus = msg.data.userStatus;
				if (!!userStatus && !!this.roomUserInfoArr) {
					for (let index = 0; index < this.roomUserInfoArr.length; index++) {
						if (!this.roomUserInfoArr[index]) continue;
						this.roomUserInfoArr[index].userStatus = userStatus[this.roomUserInfoArr[index].chairID] || 0;
					}
				}
				this.result = null;
				this.robBankScales = [null, null, null, null, null, null, null, null];
				this.pourScores = [0, 0, 0, 0, 0, 0, 0, 0];
				let gameType = this.getGameType();
				if (gameType != Def_Tw.wanfa.ZHUANG) {
					this.bankerChairID = null;
				}
			} else if (msg.type === ApiTw.gameStatus.SEND_CARDS) {
				this.cardsArr = [null, null, null, null, null, null, null, null];
				this.sortCardChairArr = [0, 0, 0, 0, 0, 0, 0, 0];
			}
		} else if (msg.type === ApiTw.GAME_SHOWRESULT_PUSH) {
			this.curScores = msg.data.result.curScores;
			this.canShowResReady = true
		} else if (msg.type === ApiTw.GAME_BANKER_PUSH) {
			this.bankerChairID = msg.data.bankerChairID;
			this.robBankScales = this.robBankScales || [];
			this.robBankScales[this.bankerChairID] = msg.data.robScale;
		} else if (msg.type === ApiTw.GAME_SEND_CARDS_PUSH) {
			this.bankerChairID = null;
			this.setCardsPushData(msg.data.cardsArr, msg.data.playingChairArr);
		} else if (msg.type === ApiTw.GAME_TRUST_PUSH) {
			this.userTrustArray = this.userTrustArray || [];
			this.userTrustArray[msg.data.chairID] = msg.data.trust;
		} else if (msg.type === ApiTw.GAME_CARDS_NOSORT_PUSH) {
			this.setMianbai(msg.data.chairId);
		} else if (msg.type === ApiTw.GAME_END_PUSH) {
			this.allResult = msg
		}
	}
};

model.getAllResultInfo = function () {
	return this.allResult
}

model.getIsCanShowResReady = function () {
	return this.canShowResReady
}

model.robBank = function (chairID, scale) {
	this.robBankScales = this.robBankScales || [];
	this.robBankScales[chairID] = scale;
};

model.pourScore = function (chairID, score) {
	this.pourScores = this.pourScores || [];
	this.pourScores[chairID] = score;
};

model.userReady = function (chairID) {
	let user = this.getUserByChairID(chairID);
	if (!user) return;
	user.userStatus = ApiRoom.userStatusEnum.READY;
};

model.getGameRule = function () {
	return this.gameRule || {};
};

model.getGameRuleByKey = function (key) {
	if (!this.gameRule) return null;
	return this.gameRule[key];
}

model.getGameStatus = function () {
	return this.gameStatus || 0;
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
	// console.log("TWModel onDestroy");
	MessageCallback.removeListener('RoomMessagePush', this);
	MessageCallback.removeListener('GameMessagePush', this);
};

model.getBankerChairID = function () {
	return this.bankerChairID;
};

model.getChairCount = function () {
	return this.chairCount || 0;
};

model.getMyChairID = function () {
	if (!this.roomUserInfoArr) return 0;
	for (let user of this.roomUserInfoArr) {
		if (user.userInfo.uid == this.myUid) {
			this.myChairID = user.chairID;
			break;
		}
	}
	return this.myChairID;
};

//获取所有玩家
model.getUsers = function () {
	return this.roomUserInfoArr || [];
};

model.getUserByChairID = function (chairID) {
	if (!this.roomUserInfoArr) return null;
	let player = null;
	for (let user of this.roomUserInfoArr) {
		if (user.chairID == chairID) {
			player = user;
			break;
		}
	}
	return player;
};

model.getUserByUID = function (uid) {
	this.roomUserInfoArr = this.roomUserInfoArr || [];
	let roomUser = this.roomUserInfoArr.find((user) => {
		return user.userInfo.uid == uid;
	});
	return roomUser;
};

model.addUser = function (user) {
	this.roomUserInfoArr = this.roomUserInfoArr || [];
	for (var i = 0; i < this.roomUserInfoArr.length; ++i) {
		if (this.roomUserInfoArr[i].userInfo.uid === user.userInfo.uid) {
			this.roomUserInfoArr.splice(i, 1);
		}
	}
	this.roomUserInfoArr.push(user);
	// console.log("添加了用户后==", this.roomUserInfoArr)
};

model.delUser = function (uid) {
	if (!this.roomUserInfoArr) return;
	for (let i = 0; i < this.roomUserInfoArr.length; ++i) {
		if (this.roomUserInfoArr[i].userInfo.uid == uid) {
			this.roomUserInfoArr.splice(i, 1);
			break;
		}
	}
	// console.log("删除了用户后==", this.roomUserInfoArr)
};

model.getRobScaleByChairID = function (chairID) {
	if (!this.robBankScales) return null;
	if (this.robBankScales[chairID] >= 0) return this.robBankScales[chairID];
	return null;
};

model.getPourScoreByChairID = function (chairID) {
	if (!this.pourScores) return 0;
	return this.pourScores[chairID];
};

model.getHandCardsByChairID = function (chairID) {
	if (!this.cardsArr) return null;
	return this.cardsArr[chairID] || null;
};

model.getCanPourScoresByChairID = function (chairID) {
	if (!this.gameRule) return [];
	let canPourScores = this.gameRule.canPourScores.slice();
	if (this.tuiArr[chairID]) {
		for (let scale of this.gameRule.tuiScale) {
			canPourScores.push(scale * canPourScores[0]);
		}
		canPourScores.sort((a, b) => {
			return a - b;
		});
	}
	// console.log('canPourScores', canPourScores);
	for (let i = 0; i < canPourScores.length; ++i) {
		canPourScores[i] *= this.gameRule.baseScore;
	}
	if (this.isUnionCreate() && this.getRoomCreatorByKey('unionType') != Enums.UnionType.NORMAL) {
		/* 联盟下分，要求 */
		let user = this.getUserByChairID(chairID);
		let bankerScale = 1;
		if (this.bankerChairID != null && this.robBankScales[this.bankerChairID] != null) {
			bankerScale = this.robBankScales[this.bankerChairID];
		}
		let scale = 1;
		for (let key in this.gameRule.cardsType) {
			let cardScale = TWLogic.getScaleByType(this.gameRule.cardsType[key]);
			if (cardScale > scale) {
				scale = cardScale;
			}
		}
		if (scale == 3 && this.gameRule.cardsType.NIUNIU && this.gameRule.scaleType == ApiTw.scaleType.BIG) {
			scale = 4;
		}
		let maxScore = Math.floor(user.userInfo.score / scale / bankerScale);
		while (canPourScores.length > 0 && canPourScores[canPourScores.length - 1] > maxScore) {
			canPourScores.pop();
		}
		if (canPourScores.length == 0) {
			canPourScores.push(1);
		}
	}
	// console.log('canPourScores', canPourScores);
	return canPourScores;
};

model.getResult = function () {
	return this.result;
};

model.getHandCards = function () {
	return this.cardsArr || [];
};

model.getIsPlayingByChairID = function (chairID) {
	let user = this.getUserByChairID(chairID);
	return user && chairID < this.getChairCount() &&
		(user.userStatus == ApiRoom.userStatusEnum.READY ||
			user.userStatus == ApiRoom.userStatusEnum.PLAYING);
};

model.getShowCards = function (chairID) {
	if (!this.sortCardChairArr) return false;
	return this.sortCardChairArr[chairID] == 1;
};

model.getIsBigScale = function () {
	if (!this.gameRule) return false;
	return this.gameRule.scaleType == ApiTw.scaleType.BIG;
};

model.getTrustByChairID = function (chairID) {
	if (!this.userTrustArray) return false;
	return this.userTrustArray[chairID];
};

model.getCurScore = function (chairID) {
	let user = this.getUserByChairID(chairID);
	if (!user) return 0;
	if (this.isUnionCreate() && this.getRoomCreatorByKey('unionType') != Enums.UnionType.NORMAL) {
		if (!this.pourScores) return Math.floor(user.userInfo.score);
		return Math.floor(user.userInfo.score - this.pourScores[chairID]) >= 0 ? Math.floor(user.userInfo.score - this.pourScores[chairID]) : 0;
	} else {
		return Math.floor(this.getCurScoresByChairID(chairID));
	}
};

model.getCurScoresByChairID = function (chairID) {
	if (!this.curScores) return 0;
	return this.curScores[chairID] || 0;
};

model.getRoomCreator = function () {
	return this.roomCreatorInfo || {};
};

model.getRoomCreatorByKey = function (key) {
	return !!this.roomCreatorInfo ? this.roomCreatorInfo[key] : null;
};

model.isUnionCreate = function () {
	return !!this.roomCreatorInfo && this.roomCreatorInfo.creatorType == Enums.roomCreatorType.UNION_CREATE;
};

model.getRoomDismissReason = function () {
	return this.roomDismissReason;
};

model.isDismissing = function () {
	return !!this.askForExitArr;
};

model.setMianbai = function (chairId) {
	this.mianbaiArr = this.mianbaiArr || [];
	this.mianbaiArr[chairId] = true;
};

model.getMianbai = function (chairId) {
	if (!this.mianbaiArr) return false;
	return this.mianbaiArr[chairId];
};

model.setCardsPushData = function (cardsArr, playingChairArr) {
	for (let i = 0; i < playingChairArr.length; ++i) {
		this.mianbaiArr[playingChairArr[i]] = false;
	}
	this.cardsArr = cardsArr;
	this.playingChairArr = playingChairArr;
	this.sortCardChairArr = [];
};
model.isCurChairPlaying = function (chairId) {
	if (!this.playingChairArr) return false;
	return this.playingChairArr.indexOf(chairId) !== -1;
};

//获取玩家制定手牌中的牌
model.getHandChairCardByIndex = function (chairID, index) {
	if (!this.cardsArr) return null;
	const cardsArr = this.cardsArr[chairID];
	if (!cardsArr) return null;
	return cardsArr[index];
};

model.checkHaveEmptySeat = function () {
	if (!this.roomUserInfoArr) return false;
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
	if (!this.roomUserInfoArr) return [];
	let users = [],
		maxPlayerCount = this.getChairCount();
	for (let user of this.roomUserInfoArr) {
		if (user.chairID < maxPlayerCount) continue;
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

model.isInWatch = function (uid) {
	uid = uid || UserModel.getData('uid');
	let user = this.getUserByUID(uid);
	let chairCount = this.getChairCount();
	let isWatch = !user || user.chairID >= chairCount || user.playStatus == ApiRoom.playStatus.WATCH;
	return isWatch;
}

model.getBundleType = function () {
	return this.getGameRuleByKey('gameType') || Enums.bundleType.SSS;
}