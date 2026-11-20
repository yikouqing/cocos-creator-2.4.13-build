const ApiSz = require('./ApiSz');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');
const UserModel = require('../../../src/model/UserModel');
const ConfigModel = require('../../../src/model/ConfigModel');

var model = module.exports;
model.init = function () {
	this.gameInited = false;
	this.gameStatus = 0;
	MessageCallback.addListener('RoomMessagePush', this);
	MessageCallback.addListener('GameMessagePush', this);
};

model.setEntryRoomData = function (msg) {
	// console.log('金花-初始化', msg);
	UserModel.setDatas(msg);
	/* 游戏数据,随时可恢复场景 */
	this.roomUserInfoArr = msg.roomUserInfoArr;
	this.gameRule = msg.gameRule;
	this.roomID = msg.roomID;
	this.roomCreatorInfo = msg.roomCreatorInfo;
	this.gameStatus = msg.gameData.gameStatus;
	this.gameStarted = msg.gameData.gameStarted;
	this.tick = msg.gameData.tick;
	this.bankerChairID = msg.gameData.bankerChairID;
	this.pourScores = msg.gameData.pourScores;
	this.followIsCanAnyCall = msg.gameData.followIsCanAnyCall;
	this.followArr = msg.gameData.followArr;
	this.handCards = msg.gameData.handCards;
	this.curBureau = msg.gameData.curBureau;
	this.maxBureau = msg.gameData.maxBureau;
	this.chairCount = msg.gameData.chairCount;
	this.lookCards = msg.gameData.lookCards;
	this.loser = msg.gameData.loser;
	this.round = msg.gameData.round;
	this.curChairID = msg.gameData.curChairID;
	this.curScore = msg.gameData.curScore;
	this.result = msg.gameData.result;
	this.curScores = msg.gameData.curScores;
	this.userStatusArray = msg.gameData.userStatusArray;
	this.userTrustArray = msg.gameData.userTrustArray;
	this.askForExitArr = null;
	this.myUid = UserModel.getData('uid');
	this.lastOperateArray = msg.gameData.lastOperateArray;
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
			handCards: this.handCards,
			curBureau: this.curBureau,
			maxBureau: this.maxBureau,
			chairCount: this.chairCount,
			lookCards: this.lookCards,
			loser: this.loser,
			round: this.round,
			curChairID: this.curChairID,
			curScore: this.curScore,
			result: this.result,
			curScores: this.curScores,
			userStatusArray: this.userStatusArray,
			userTrustArray: this.userTrustArray,
			askForExitArr: this.askForExitArr,
			myUid: UserModel.getData('uid'),
			followIsCanAnyCall: this.followIsCanAnyCall,
			followArr: this.followArr
		},
	};
	return msg;
};

model.isGameInited = function (route, msg) {
	if (!this.gameInited) {
		if (route === 'RoomMessagePush' && msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
			this.gameInited = true;
			return !!this.gameInited;
		} else {
			return false;
		}
	}
	return !!this.gameInited;
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

model.getGameStarted = function () {
	return this.getCurBureau() > 0;
};

model.getRoomID = function () {
	return this.roomID;
};

model.getCurBureau = function () {
	return this.curBureau || 0;
};

model.getMaxBureau = function () {
	return this.maxBureau === 9999 ? "自由局" : this.maxBureau;
};

model.getCurRound = function () {
	return this.round;
};

model.getMaxRound = function () {
	return this.gameRule.roundType
};

model.getCurScore = function () {
	return this.curScore;
};

model.getCurChairID = function () {
	return this.curChairID;
};

model.messageCallbackHandler = function (route, msg) {
	if (route === 'RoomMessagePush') {
		if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
			this.setEntryRoomData(msg.data);
		} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
			this.addUser(msg.data.roomUserInfo);
		} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
			this.delUser(msg.data.roomUserInfo.chairID);
			if (msg.data.roomUserInfo.chairID === this.getMyChairID()) {
			}
		} else if (msg.type === ApiRoom.USER_READY_PUSH) {
			this.userReady(msg.data.chairID);
		} else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
			this.askForExitArr = msg.data.chairIDArr;
			if (msg.data.chairIDArr.indexOf(false) != -1) {
				this.askForExitArr = null;
			}
		} else if (msg.type === ApiRoom.ROOM_DISMISS_PUSH) {
			this.askForExitArr = null;
			this.roomDismissReason = msg.data.reason;
			if (msg.data.reason != Enums.gameRoomDismissReason.BUREAU_FINISHED) {
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
		if (msg.type === ApiSz.GAME_BUREAU_PUSH) {
			this.curBureau = msg.data.curBureau;
		} else if (msg.type === ApiSz.GAME_ROUND_PUSH) {
			this.round = msg.data.round;
		} else if (msg.type === ApiSz.GAME_POUR_SCORE_PUSH) {
			this.pourScore(msg.data.chairID, msg.data.score);
		} else if (msg.type === ApiSz.GAME_LOOK_PUSH) {
			if (msg.data.cards) {
				this.handCards = this.handCards || [];
				this.handCards[msg.data.chairID] = msg.data.cards;
			}
			this.lookCards = this.lookCards || [];
			this.lookCards[msg.data.chairID] = 1;
			this.userStatusArray[msg.data.chairID] = ApiSz.userStatus.LOOK;
		} else if (msg.type === ApiSz.GAME_RESULT_PUSH) {
			this.result = msg.data.result;
			this.handCards = this.result.handCards;
			this.curScores = this.result.curScores;
			this.pourScores = [null, null, null, null, null, null, null, null, null, null];
			this.tick = 0;
		} else if (msg.type === ApiSz.GAME_STATUS_PUSH) {
			this.tick = msg.data.tick;
			this.gameStatus = msg.data.gameStatus;
			this.gameStarted = true;
			if (this.gameStatus == ApiSz.gameStatus.NONE) {
				this.lastOperateArray = [];
				this.bankerChairID = null;
				let userStatus = msg.data.userStatus;
				if (!!userStatus && !!this.roomUserInfoArr) {
					for (let index = 0; index < this.roomUserInfoArr.length; index++) {
						if (!this.roomUserInfoArr[index]) continue;
						this.roomUserInfoArr[index].userStatus = userStatus[this.roomUserInfoArr[index].chairID] || 0;
					}
				}
				this.result = null;
				this.handCards = [null, null, null, null, null, null, null, null, null, null];
				this.pourScores = [null, null, null, null, null, null, null, null, null, null];
				this.lookCards = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
				this.userStatusArray = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
				this.round = 0;
				this.followArr = [false, false, false, false, false, false, false, false, false, false];
			}
		} else if (msg.type === ApiSz.GAME_BANKER_PUSH) {
			this.bankerChairID = msg.data.bankerChairID;
		} else if (msg.type === ApiSz.GAME_SEND_CARDS_PUSH) {
			this.handCards = msg.data.handCards;
		} else if (msg.type === ApiSz.GAME_ABANDON_PUSH) {
			this.loser = this.loser || [];
			this.loser.push(msg.data.chairID);
			this.userStatusArray = this.userStatusArray || [];
			this.userStatusArray[msg.data.chairID] = msg.data.userStatus;
		} else if (msg.type === ApiSz.GAME_COMPARE_PUSH) {
			this.loser = this.loser || [];
			this.loser.push(msg.data.loseChairID);
			this.userStatusArray = this.userStatusArray || [];
			this.userStatusArray[msg.data.loseChairID] = ApiSz.userStatus.LOSE;
		} else if (msg.type === ApiSz.GAME_TURN_PUSH) {
			this.curChairID = msg.data.curChairID;
			this.curScore = msg.data.curScore;
		} else if (msg.type === ApiSz.GAME_TRUST_PUSH) {
			this.userTrustArray = this.userTrustArray || [];
			this.userTrustArray[msg.data.chairID] = msg.data.trust;
		} else if (msg.type === ApiSz.GAME_FOLLOW_THROUGH_STATUS_PUSH) {
			this.followIsCanAnyCall = msg.data.followIsCanAnyCall;
			this.followArr = msg.data.followArr;
		} else if (msg.type === ApiSz.USER_OPERATE_ARRAY_PUSH) {
			this.lastOperateArray = msg.data.lastOperateArray;
		}
	}
};

model.pourScore = function (chairID, score) {
	this.pourScores = this.pourScores || [];
	if (!this.pourScores[chairID]) {
		this.pourScores[chairID] = [];
	}
	this.pourScores[chairID].push(score);
};

model.userReady = function (chairID) {
	let user = this.getUserByChairID(chairID);
	if (!user) return;
	user.userStatus = ApiRoom.userStatusEnum.READY;
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
model.getGameRule = function () {
	return this.gameRule || {};
};

model.getGameRuleByKey = function (key) {
	if (!this.gameRule) return null;
	return this.gameRule[key];
};

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
	// console.log("SZModel onDestroy");
	MessageCallback.removeListener('RoomMessagePush', this);
	MessageCallback.removeListener('GameMessagePush', this);
};

model.getBankerChairID = function () {
	return this.bankerChairID;
};

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

model.getUserScores = function () {
	return this.curScores || [];
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
	this.pourScores = this.pourScores || [];
	let scores = 0;
	if (!this.pourScores[chairID]) {
		this.pourScores[chairID] = [];
	}
	for (let score of this.pourScores[chairID]) {
		scores += score;
	}
	return scores;
};

model.getPourScores = function () {
	return this.pourScores || [];
};

model.getHandCardsByChairID = function (chairID) {
	if (!this.handCards) return null;
	return this.handCards[chairID] || null;
};

model.getResult = function () {
	return this.result;
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

model.getPlayingUserCount = function () {
	if (!this.roomUserInfoArr) return 0;
	let count = 0;
	for (let user of this.roomUserInfoArr) {
		if (user &&
			(user.userStatus == ApiRoom.userStatusEnum.READY ||
				user.userStatus == ApiRoom.userStatusEnum.PLAYING)) {
			++count;
		}
	}
	return count;
};

model.getUserStatusByChairID = function (chairID) {
	if (!this.userStatusArray) return 0;
	return this.userStatusArray[chairID];
};

model.getCanCompareChairIDs = function () {
	if (!this.roomUserInfoArr || !this.userStatusArray) return [];
	let array = [];
	for (let user of this.roomUserInfoArr) {
		let userStatus = this.userStatusArray[user.chairID];
		if ((user.userStatus == ApiRoom.userStatusEnum.READY ||
			user.userStatus == ApiRoom.userStatusEnum.PLAYING)) {
			if (userStatus != ApiSz.userStatus.ABANDON &&
				userStatus != ApiSz.userStatus.LOSE &&
				userStatus != ApiSz.userStatus.TIMEOUTABANDON &&
				user.chairID != this.getMyChairID()) {
				array.push(user.chairID);
			}
		}
	}
	return array;
};

model.getTrustByChairID = function (chairID) {
	if (!this.userTrustArray) return false;
	return this.userTrustArray[chairID];
};

model.getAddScores = function () {
	if (!this.gameRule) return []
	return this.gameRule.addScores || [];
};

model.getCurScoreByChairID = function (chairID) {
	let user = this.getUserByChairID(chairID);
	if (!user) return 0;
	if (this.isUnionCreate() && this.getRoomCreatorByKey('unionType') != Enums.UnionType.NORMAL) {
		return Math.floor(user.userInfo.score - this.getPourScoreByChairID(chairID));
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
	return this.roomCreatorInfo && this.roomCreatorInfo.creatorType == Enums.roomCreatorType.UNION_CREATE;
};

model.getLookCardByChairID = function (chairID) {
	if (!this.lookCards) return false;
	return this.lookCards[chairID];
};

model.getMyUid = function () {
	return this.myUid;
};

model.getRoomDismissReason = function () {
	return this.roomDismissReason;
};

model.isDismissing = function () {
	return !!this.askForExitArr;
};

model.getAnyCallByChairID = function (chairID) {
	this.followArr = this.followArr || [];
	return this.followArr[chairID];
};

model.getIsAnyCall = function () {
	return this.followIsCanAnyCall;
}

model.updateIsAnyCallOp = function (chairID, isAnyCall) {
	this.followArr = this.followArr || [];
	this.followArr[chairID] = isAnyCall;
}

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

//判断玩家在不在座位上
model.checkUserTakeSeat = function (chairID) {
	return chairID < this.getChairCount();
}

model.getUserOperateTypeByChairID = function (chairID) {
	this.lastOperateArray = this.lastOperateArray || [];
	return this.lastOperateArray[chairID] || 0;
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
	return this.getGameRuleByKey('gameType') || Enums.bundleType.SZ;
}