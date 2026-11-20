const ApiLyc = require('./ApiLyc');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');
const UserModel = require('../../../src/model/UserModel');
const Utils = require('../../../src/utils/Utils');
const ConfigModel = require('../../../src/model/ConfigModel');
const { Def_Lyc } = require('../../../src/const/Defines');

var model = module.exports;

model.init = function () {
	// console.log("LYCModel init");
	this.gameInited = false;
	this.gameStatus = 0;
	MessageCallback.addListener('RoomMessagePush', this);
	MessageCallback.addListener('GameMessagePush', this);
};

model.getMyUid = function () {
	return this.myUid;
};

model.setEntryRoomData = function (msg) {
	/* 游戏数据,随时可恢复场景 */
	this.gameInited = true;
	UserModel.setDatas(msg);
	this.roomUserInfoArr = msg.roomUserInfoArr || [];
	this.gameRule = msg.gameRule;
	this.roomID = msg.roomID;
	this.roomCreatorInfo = msg.roomCreatorInfo;
	this.curScores = msg.gameData.curScores;
	this.gameStatus = msg.gameData.gameStatus;
	this.gameStarted = msg.gameData.gameStarted;
	this.tick = msg.gameData.tick;
	this.bankerChairID = msg.gameData.bankerChairID;
	this.pourScores = msg.gameData.pourScores;
	this.robBankScales = msg.gameData.robBankScales;
	this.handCards = msg.gameData.handCards;
	this.curBureau = msg.gameData.curBureau;
	this.maxBureau = msg.gameData.maxBureau;
	this.chairCount = msg.gameData.chairCount;
	this.playingUserList = msg.gameData.playingUserList;
	this.showCards = msg.gameData.showCards;
	this.userTrustArray = msg.gameData.userTrustArray;
	this.result = msg.gameData.result;
	this.askForExitArr = null;
	this.myUid = UserModel.getData('uid');
	if (msg.gameData.gameStatus === ApiLyc.gameStatus.CHOOSE_OPERATE) {
		this.tick = msg.gameData.curOperateInfo.tick
		this.curOperateChairID = msg.gameData.curOperateInfo.chairID;
	}
	let tmp = UserModel.getData("isTest")
	if (!tmp && this.gameStatus > ApiLyc.gameStatus.POUR_SCORE) {
		for (let i = 0; i < this.handCards.length; i++) {
			if (this.handCards[i] && i !== this.getMyChairID()) {
				this.handCards[i][0] = 0
				this.handCards[i][1] = 0
			}
		}
	}
};

model.getRoomData = function () {
	var msg = {
		gameInited: true,
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
			curBureau: this.curBureau,
			maxBureau: this.maxBureau,
			chairCount: this.chairCount,
			showCards: this.showCards,
			userTrustArray: this.userTrustArray,
			result: this.result,
			curScores: this.curScores,
			askForExitArr: this.askForExitArr,
			myUid: UserModel.getData('uid'),
		},
	};
	return msg;
};

model.getGameInited = function () {
	return this.gameInited;
};

model.setGameInited = function (value) {
	this.gameInited = value;
};

model.getRoomCreatorChairID = function () {
	if (!this.roomUserInfoArr) return -1;
	let chairID = -1;
	for (let user of this.roomUserInfoArr) {
		if (user.userInfo.uid == this.roomCreatorInfo.uid) {
			chairID = user.chairID;
			break;
		}
	}
	return chairID;
};

model.getGameType = function () {
	if (!this.gameRule) return 1;
	return this.gameRule.gameFrameType || 1;
};

model.getGameStarted = function () {
	return this.gameStarted;
};

model.getRoomID = function () {
	return this.roomID || 0;
};

model.getCurBureau = function () {
	return this.curBureau || 0;
};

model.getMaxBureau = function () {
	return this.maxBureau || 0;
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
			this.delUser(msg.data.roomUserInfo.chairID);
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
			if (msg.data.code != 0) return;
			if (!this.roomUserInfoArr) return;
			for (let user of this.roomUserInfoArr) {
				if (user.userInfo.uid == msg.data.uid) {
					user.chairID = msg.data.toChairID;
					user.userStatus = msg.data.userStatus;
				}
			}
		} else if (msg.type === ApiRoom.ROOM_USER_INFO_CHANGE_PUSH) {
			// console.log('捞腌菜-ROOM_USER_INFO_CHANGE_PUSH', msg.data);
			this.roomUserInfoArr = this.roomUserInfoArr || [];
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
		if (msg.type === ApiLyc.GAME_BUREAU_PUSH) {
			this.playingUserList = msg.data.playingUserList || [];
			this.curBureau = msg.data.curBureau;
		} else if (msg.type === ApiLyc.GAME_ROB_BANK_PUSH) {
			this.robBank(msg.data.chairID, msg.data.robScale);
		} else if (msg.type === ApiLyc.GAME_POUR_SCORE_PUSH) {
			this.pourScore(msg.data.chairID, msg.data.score);
		} else if (msg.type === ApiLyc.GAME_SHOW_CARDS_PUSH) {
			this.handCards = this.handCards || [];
			this.handCards[msg.data.chairID] = msg.data.cards;
			this.showCards = this.showCards || [];
			this.showCards[msg.data.chairID] = 1;
		} else if (msg.type === ApiLyc.GAME_RESULT_PUSH) {
			// console.log("收到了游戏结算=", msg.data)
			this.result = msg.data.result.winScores;
			this.curScores = msg.data.result.curScores;
			this.handCards = msg.data.result.userCards
			this.tick = 0;
		} else if (msg.type === ApiLyc.GAME_STATUS_PUSH) {
			this.tick = msg.data.tick;
			this.gameStatus = msg.data.gameStatus;
			this.gameStarted = true;
			if (this.gameStatus == ApiLyc.gameStatus.NONE) {
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
				this.robBankScales = [null, null, null, null, null, null, null, null, null, null];
				this.pourScores = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
				this.showCards = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
				let gameType = this.getGameType();
				if (gameType !== Def_Lyc.gameFrameType.BAWANGZHUANG) {
					this.bankerChairID = null;
				}
			}
		} else if (msg.type === ApiLyc.GAME_USER_OPERATE_START_PUSH) {
			this.tick = msg.data.tick;
			this.curOperateChairID = msg.data.chairID;
		} else if (msg.type === ApiLyc.GAME_BANKER_PUSH) {
			this.bankerChairID = msg.data.bankerChairID;
			this.robBankScales = this.robBankScales || [];
			this.robBankScales[this.bankerChairID] = msg.data.robScale;
		} else if (msg.type === ApiLyc.GAME_SEND_CARDS_PUSH) {
			this.handCards = msg.data.handCards;
		} else if (msg.type === ApiLyc.GAME_USER_OPERATE_PUSH) {
			this.handCards = this.handCards || [];
			if (msg.data.operateInfo.operateType === ApiLyc.operateType.PULL) {
				if (!!msg.data.operateInfo.pullCard) {
					this.handCards[msg.data.chairID].push(msg.data.operateInfo.pullCard)
				}
			} else if (msg.data.operateInfo.operateType === ApiLyc.operateType.BOOM) {
				this.handCards[msg.data.chairID] = msg.data.operateInfo.boomCards
			}
		} else if (msg.type === ApiLyc.GAME_LOOK_CARDS_PUSH) {
			if (!msg.data.userArray || !Array.isArray(msg.data.userArray)) return;
			this.handCards = this.handCards || [];
			for (let index = 0; index < msg.data.userArray.length; index++) {
				if (!msg.data.userArray[index]) continue
				this.handCards[index] = msg.data.userArray[index]
			}
		} else if (msg.type === ApiLyc.GAME_COMPARE_PUSH) {

		}
	}
};

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
	this.gameRule = this.gameRule || {};
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
	// console.log("LYCModel onDestroy");
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

//获取所有玩家
model.getUsers = function () {
	return this.roomUserInfoArr || [];
};

model.getMyChairID = function () {
	this.roomUserInfoArr = this.roomUserInfoArr || [];
	for (let user of this.roomUserInfoArr) {
		if (user.userInfo.uid == this.myUid) {
			this.myChairID = user.chairID;
			break;
		}
	}
	return this.myChairID;
};

model.getUserByChairID = function (chairID) {
	this.roomUserInfoArr = this.roomUserInfoArr || [];
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

model.addUser = function (user) {
	if (!this.roomUserInfoArr) return;
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

model.getRobScaleByChairID = function (chairID) {
	if (!this.robBankScales) return null;
	if (this.robBankScales[chairID] >= 0) return this.robBankScales[chairID];
	return null;
};

model.getPourScoreByChairID = function (chairID) {
	if (!this.pourScores) return 0;
	return this.pourScores[chairID] || 0;
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
	this.playingUserList = this.playingUserList || []
	return this.playingUserList.includes(chairID)
	// let user = this.getUserByChairID(chairID);
	// return user && chairID < this.getChairCount() &&
	// 	(user.userStatus == ApiRoom.userStatusEnum.READY ||
	// 		user.userStatus == ApiRoom.userStatusEnum.PLAYING);
};

model.getPlayingUserList = function () {
	return this.playingUserList || [];
};


model.getShowCards = function (chairID) {
	if (!this.showCards) return false;
	return this.showCards[chairID] == 1;
};

model.getIsBigScale = function () {
	if (!this.gameRule) return false;
	return this.gameRule.scaleType == ApiLyc.scaleType.BIG;
};

model.getTrustByChairID = function (chairID) {
	if (!this.userTrustArray) return false;
	return this.userTrustArray[chairID];
};

model.getCurScore = function (chairID) {
	let user = this.getUserByChairID(chairID);
	if (!user) return 0;
	if (this.isUnionCreate() && this.getRoomCreatorByKey('unionType') != Enums.UnionType.NORMAL) {
		if (!this.pourScores) return user.userInfo.score;
		return Utils.formatNumberWithDecimal(user.userInfo.score - this.pourScores[chairID], 1) >= 0 ? Utils.formatNumberWithDecimal(user.userInfo.score - this.pourScores[chairID], 1) : 0;
	} else {
		return Utils.formatNumberWithDecimal(this.getCurScoresByChairID(chairID), 1);
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
};

model.isUnionCreate = function () {
	return this.roomCreatorInfo && this.roomCreatorInfo.creatorType == Enums.roomCreatorType.UNION_CREATE;
};

model.getRoomDismissReason = function () {
	return this.roomDismissReason || 0;
};

model.isDismissing = function () {
	return !!this.askForExitArr;
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

model.getCurOperateChairID = function () {
	return this.curOperateChairID || 0;
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
	return this.getGameRuleByKey('gameType') || Enums.bundleType.LYC;
}