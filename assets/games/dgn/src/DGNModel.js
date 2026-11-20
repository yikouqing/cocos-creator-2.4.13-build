const Enums = require('../../../src/const/Enums');
const ApiDgn = require('./ApiDgn');
const DGNLogic = require('./DGNLogic');
const MessageCallback = require('../../../src/utils/MessageCallback');
const UserModel = require('../../../src/model/UserModel');
const ApiRoom = require('../../../src/api/ApiRoom');
const ConfigModel = require('../../../src/model/ConfigModel');
const { Def_Dgn } = require('../../../src/const/Defines');

var model = module.exports;

model.init = function () {
	this.gameInited = false;
	this.gameStatus = 0;
	this.bankerChairID = null;
	// console.log("DGNModel init");
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
	this.handCards = msg.gameData.handCards;
	this.curBureau = msg.gameData.curBureau;
	this.turn = msg.gameData.turn;
	this.bankerTurn = msg.gameData.bankerTurn;
	this.bankerPourTurn = msg.gameData.bankerPourTurn;
	this.maxBureau = msg.gameData.maxBureau;
	this.chairCount = msg.gameData.chairCount;
	this.showCards = msg.gameData.showCards;
	this.userTrustArray = msg.gameData.userTrustArray;
	this.nextBankerChairID = msg.gameData.nextBankerChairID;
	this.myUid = UserModel.getData('uid');
	this.askForExitArr = null;
	this.curScores = msg.gameData.curScores;
	this.robBankScales = msg.gameData.robBankScales;
	DGNLogic.setCardsType(this.gameRule.cardsType, this.gameRule.scaleType); /* magic */
};

model.getRoomData = function () {
	var msg = {
		roomUserInfoArr: this.roomUserInfoArr,
		gameRule: this.gameRule,
		roomID: this.roomID,
		roomCreatorInfo: this.roomCreatorInfo,
		gameData: {
			robBankScales: this.robBankScales,
			gameStatus: this.gameStatus,
			gameStarted: this.gameStarted,
			tick: this.tick,
			bankerChairID: this.bankerChairID,
			pourScores: this.pourScores,
			handCards: this.handCards,
			curBureau: this.curBureau,
			maxBureau: this.maxBureau,
			chairCount: this.chairCount,
			showCards: this.showCards,
			userTrustArray: this.userTrustArray,
			curScores: this.curScores,
			myUid: UserModel.getData('uid'),
		}
	};
	return msg;
};
/**座位号转换 */
model.getUserChairIndex = function (chairID) {
	return (chairID - this.getMyChairID() + this.gameRule.maxPlayerCount) % this.gameRule.maxPlayerCount;
}

model.getGameInited = function () {
	return this.gameInited || false;
};

model.getDGNLogic = function () {
	return DGNLogic;
};

model.setGameInited = function (value) {
	this.gameInited = value;
};

model.getMyUid = function () {
	return this.myUid;
};

model.getRoomCreatorChairID = function () {
	if (!this.roomUserInfoArr) return null;
	for (let user of this.roomUserInfoArr) {
		if (user.userInfo.uid == this.roomCreatorInfo.uid) {
			return user.chairID;
		}
	}
	return null;
};

model.getRobBankLimit = function () {
	if (!this.gameRule) return 0;
	return this.gameRule.robBankLimit || 0;
};

model.getGameStarted = function () {
	return this.curBureau > 0;
};

model.getCardsType = function () {
	if (!this.gameRule) return 0;
	return this.gameRule.cardsType || 0;
};

model.getRoomID = function () {
	return this.roomID || 0;
};

model.getCurBureau = function () {
	return this.curBureau || 0;
};

model.getMaxBureau = function (type = false) {
	return this.maxBureau;
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
model.messageCallbackHandler = function (route, msg) {
	if (route === 'RoomMessagePush') {
		if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
			this.setEntryRoomData(msg.data);
		} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
			this.addUser(msg.data.roomUserInfo);
		} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
			if (msg.data.roomUserInfo.chairID != this.getMyChairID()) {
				this.delUser(msg.data.roomUserInfo.chairID);
			}
			if (msg.data.roomUserInfo.chairID === this.getMyChairID()) {
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
			if (msg.data.code != 0 || !this.roomUserInfoArr) return;
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
		if (msg.type === ApiDgn.GAME_BUREAU_PUSH) {
			this.curBureau = msg.data.curBureau;
			this.bankerTurn = msg.data.bankerTurn;
			this.bankerPourTurn = msg.data.bankerPourTurn;
			this.turn = msg.data.turn;
		} else if (msg.type === ApiDgn.GAME_ROB_BANK_PUSH) {
			this.robBank(msg.data.chairID, msg.data.robScale);
		} else if (msg.type === ApiDgn.POUR_SCORE_PUSH) {
			this.pourScore(msg.data.chairID, msg.data.score);
		} else if (msg.type === ApiDgn.SHOW_CARDS_PUSH) {
			this.showCards[msg.data.chairID] = true;
		} else if (msg.type === ApiDgn.RESOUT_CARD_PUSH) {
			this.answerResoutCardPush(msg.data.chairID, msg.data.cardArr);
		} else if (msg.type === ApiDgn.GAME_RESULT_PUSH) {
			this.curScores = msg.data.result.curScores;
			for (let i = 0; i < this.pourScores.length; ++i) {
				this.pourScores[i] = (i == this.bankerChairID) ? msg.data.result.poolScore : 0;
			}
		} else if (msg.type === ApiDgn.GAME_BANKER_PUSH) {
			this.bankerChairID = msg.data.bankerChairID;
			this.robBankScales[this.bankerChairID] = msg.data.robScale;
		} else if (msg.type === ApiDgn.GAME_STATUS_PUSH) {
			this.tick = msg.data.tick;
			this.gameStatus = msg.data.gameStatus;
			this.gameStarted = true;
			if (this.gameStatus == ApiDgn.gameStatus.NONE) {
				let userStatus = msg.data.userStatus;
				// console.log('可能--游戏状态重置', userStatus);
				if (!!userStatus && !!this.roomUserInfoArr) {
					for (let index = 0; index < this.roomUserInfoArr.length; index++) {
						if (!this.roomUserInfoArr[index]) continue;
						this.roomUserInfoArr[index].userStatus = userStatus[this.roomUserInfoArr[index].chairID] || 0;
					}
				}
				this.robBankScales = [null, null, null, null, null, null, null, null, null, null];
				this.handCards = [null, null, null, null, null, null, null, null, null, null];
				this.showCards = [false, false, false, false, false, false, false, false, false, false];
			}
		} else if (msg.type === ApiDgn.CHOOSE_BANK_PUSH) {
			this.nextBankerChairID = msg.data.chairID;
		} else if (msg.type === ApiDgn.BANKER_PUSH) {
			this.bankerChairID = msg.data.bankerChairID;
			if (!!this.pourScores) {
				for (let i = 0; i < this.pourScores.length; ++i) {
					this.pourScores[i] = 0;
				}
				if (this.bankerChairID >= 0) {
					this.pourScores[this.bankerChairID] = msg.data.poolScore;
				}
			}
			this.bankerTurn = msg.data.bankerTurn;
			this.bankerPourTurn = msg.data.bankerPourTurn;
			this.nextBankerChairID = null;
		} else if (msg.type === ApiDgn.CLEAR_POOL_PUSH) {
			if (!!this.pourScores) {
				this.pourScores[msg.data.bankerChairID] = 0;
			}
		} else if (msg.type === ApiDgn.CARDS_PUSH) {
			this.handCards = msg.data.handCards;
		} else if (msg.type === ApiDgn.GAME_TRUST_PUSH) {
			if (!!this.userTrustArray) {
				this.userTrustArray[msg.data.chairID] = msg.data.trust;
			}
		}
	}
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

model.robBank = function (chairID, scale) {
	this.robBankScales[chairID] = scale;
};

model.getGameRule = function () {
	return this.gameRule || {};
};

model.getGameRuleByKey = function (key) {
	return !!this.gameRule ? this.gameRule[key] : null;
};

model.getGameStatus = function () {
	return this.gameStatus || 0;
};

model.getTick = function () {
	return this.tick || 0;
};

model.subTick = function (dt) {
	this.tick -= dt;
};

model.setTick = function (tick) {
	this.tick = tick || 0;
};

model.onDestroy = function () {
	// console.log("DGNModel onDestroy");
	MessageCallback.removeListener('RoomMessagePush', this);
	MessageCallback.removeListener('GameMessagePush', this);
};

model.getBankerChairID = function () {
	return this.bankerChairID;
};

model.checkBanker = function (chairID) {
	return this.bankerChairID == chairID;
}

model.getChairCount = function () {
	if (!this.gameRule) return 0;
	return this.gameRule.maxPlayerCount || 0;
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
	for (let user of this.roomUserInfoArr) {
		if (user.chairID == chairID) {
			return user;
		}
	}
	return null;
};

model.getUserByUID = function (uid) {
	this.roomUserInfoArr = this.roomUserInfoArr || [];
	let roomUser = this.roomUserInfoArr.find((user) => {
		return user.userInfo.uid == uid;
	});
	return roomUser;
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

model.getPlayerTakeSeats = function () {
	if (!this.roomUserInfoArr) return [];
	let users = [],
		maxPlayerCount = this.getChairCount();
	for (let user of this.roomUserInfoArr) {
		if (user.chairID >= maxPlayerCount) continue;
		users.push(user);
	}
	return users;
}

model.addUser = function (user) {
	this.roomUserInfoArr = this.roomUserInfoArr || [];
	for (var i = 0; i < this.roomUserInfoArr.length; ++i) {
		if (this.roomUserInfoArr[i].chairID === user.chairID) {
			this.roomUserInfoArr.splice(i, 1);
		}
	}
	this.roomUserInfoArr.push(user);
};

model.delUser = function (chairID) {
	if (!this.roomUserInfoArr) return;
	for (let i = 0; i < this.roomUserInfoArr.length; ++i) {
		if (this.roomUserInfoArr[i].chairID == chairID) {
			this.roomUserInfoArr.splice(i, 1);
			break;
		}
	}
};

model.getPourScoreByChairID = function (chairID) {
	return !!this.pourScores ? this.pourScores[chairID] : 0;
};

model.getHandCardsByChairID = function (chairID) {
	if (!!this.handCards && this.handCards[chairID]) {
		return this.handCards[chairID].slice();
	} else {
		return null;
	}
};

model.getHandCards = function () {
	return this.handCards || [];
};

model.getIsPlayingByChairID = function (chairID) {
	let user = this.getUserByChairID(chairID);
	return user && chairID < this.getChairCount() &&
		(user.userStatus == ApiRoom.userStatusEnum.READY ||
			user.userStatus == ApiRoom.userStatusEnum.PLAYING);
};

model.getIsPlayingCount = function () {
	let num = 0;
	this.chairCount = this.chairCount || 0;
	for (let x = 0; x < this.chairCount; x++) {
		let user = this.getUserByChairID(x);
		if (user) {
			num++;
		}
	}
	return num;
};

model.getShowCards = function (chairID) {
	this.showCards = this.showCards || [];
	return this.showCards[chairID];
};

model.getIsBigScale = function () {
	return !!this.gameRule ? this.gameRule.scaleType == Def_Dgn.scaleType.BIG : false;
};

model.getTrustByChairID = function (chairID) {
	this.userTrustArray = this.userTrustArray || [];
	return this.userTrustArray[chairID];
};

model.getCurScore = function (chairID) {
	let user = this.getUserByChairID(chairID);
	if (!user) return 0;
	if (this.isUnionCreate() && this.getRoomCreatorByKey('unionType') != Enums.UnionType.NORMAL) {
		if (!this.pourScores) return 0;
		return user.userInfo.score - this.pourScores[chairID] >= 0 ? user.userInfo.score - this.pourScores[chairID] : 0;
	} else {
		return this.getCurScoresByChairID(chairID);
	}
};

model.getCurScoresByChairID = function (chairID) {
	if (!this.curScores) return 0;
	return this.curScores[chairID] || 0;
}

model.getRoomCreator = function () {
	return this.roomCreatorInfo || {};
};

model.getRoomCreatorByKey = function (key) {
	return !!this.roomCreatorInfo ? this.roomCreatorInfo[key] : null;
}

model.isUnionCreate = function () {
	return this.roomCreatorInfo && this.roomCreatorInfo.creatorType == Enums.roomCreatorType.UNION_CREATE;
};

model.getRoomDismissReason = function () {
	return this.roomDismissReason;
};

model.isDismissing = function () {
	return !!this.askForExitArr;
};

model.getPourScoreRange = function () {
	if (!this.gameRule || !this.pourScores) return 0;
	let min = Math.floor(this.gameRule.shouzhuang * this.gameRule.firstBureauRate);
	if (this.bankerPourTurn > 1) {
		min = Math.floor(this.gameRule.shouzhuang * this.gameRule.bureauRate);
	}
	let max = Math.floor(this.pourScores[this.bankerChairID] / 3);
	return [min, max];
};

model.getTurn = function () {
	return this.turn;
};

model.getBankerTurn = function () {
	return this.bankerTurn;
};

model.getBankerPourTurn = function () {
	return this.bankerPourTurn;
};

model.getNextBankerChairID = function () {
	return this.nextBankerChairID;
};

//获取玩家制定手牌中的牌
model.getHandChairCardByIndex = function (chairID, index) {
	if (!this.handCards) return null;
	const handCards = this.handCards[chairID];
	if (!handCards) return null;
	return handCards[index];
};

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

model.getRobScaleByChairID = function (chairID) {
	if (!this.robBankScales) this.robBankScales = [null, null, null, null, null, null, null, null, null, null];
	return this.robBankScales[chairID];
};

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