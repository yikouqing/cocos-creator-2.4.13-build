const ApiCjsjy = require('./ApiCjsjy');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');
const UserModel = require('../../../src/model/UserModel');
const ConfigModel = require('../../../src/model/ConfigModel');

const {
	Def_Sgbjh
} = require('../../../src/const/Defines');
var model = module.exports;

model.init = function () {
	// console.log("CJSJYModel init");
	this.gameInited = false;
	this.gameStatus = 0;
	MessageCallback.addListener('RoomMessagePush', this);
	MessageCallback.addListener('GameMessagePush', this);
};

model.getMyUid = function () {
	return this.myUid;
};

/**座位号转换 */
model.getUserChairIndex = function (chairID) {
	// console.log("=====", chairID, this.getMyChairID(), this.gameRule.maxPlayerCount)
	let myChairID = this.getMyChairID()
	if (myChairID >= this.getChairCount()) {
		myChairID = 0
	}
	return (chairID - myChairID + this.gameRule.maxPlayerCount) % this.gameRule.maxPlayerCount;
}

model.setEntryRoomData = function (msg) {
	// console.log("初始化房间=============", msg)
	/* 游戏数据,随时可恢复场景 */
	this.gameInited = true;
	UserModel.setDatas(msg);
	this.roomUserInfoArr = msg.roomUserInfoArr;
	let readyList = msg.gameData.readyList
	readyList.forEach(uid => {
		let user = this.roomUserInfoArr.find(info => info.userInfo.uid == uid)
		if (user.userStatus != ApiRoom.userStatusEnum.OFFLINE && !msg.gameData.gameStarted) {
			user.userStatus = ApiRoom.userStatusEnum.READY
		}
	});

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
	this.curBureau = msg.gameData.curBureau;
	this.maxBureau = msg.gameData.maxBureau;
	this.chairCount = msg.gameData.chairCount;
	this.showCards = msg.gameData.showCards;
	this.userTrustArray = msg.gameData.userTrustArray;
	this.result = msg.gameData.result;
	this.curScores = msg.gameData.curScores;
	this.askForExitArr = null;
	this.myUid = UserModel.getData('uid');
	this.cardTypeList = msg.gameData.cardTypeList
	this.userWinTotalScore = msg.gameData.userWinTotalScore;
};
model.getUserWinTotalScore = function () {
	return this.userWinTotalScore || {}
}

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

model.getGameInited = function () {
	return this.gameInited;
};

model.setGameInited = function (value) {
	this.gameInited = value;
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
	return this.curBureau > 0;
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

/**设置牌型信息 */
model.setCardTypeList = function (list) {
	this.cardTypeList = list || []
}
/**获取牌型信息 */
model.getCardTypeList = function () {
	this.cardTypeList = this.cardTypeList || []
	return this.cardTypeList
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
		if (msg.type === ApiCjsjy.GAME_BUREAU_PUSH) {
			this.curBureau = msg.data.curBureau;
		} else if (msg.type === ApiCjsjy.GAME_ROB_BANK_PUSH) {
			this.robBank(msg.data.chairID, msg.data.robScale);
		} else if (msg.type === ApiCjsjy.GAME_POUR_SCORE_PUSH) {
			this.pourScore(msg.data.chairID, msg.data.score);
		} else if (msg.type === ApiCjsjy.GAME_SHOW_CARDS_PUSH) {
			this.handCards = this.handCards || [];
			this.handCards[msg.data.chairID] = msg.data.cards;
			this.showCards = this.showCards || [];
			if (!msg.data.cuopai) {
				this.showCards[msg.data.chairID] = 1;
			}
		} else if (msg.type === ApiCjsjy.RESOUT_CARD_PUSH) {
			this.answerResoutCardPush(msg.data.chairID, msg.data.cardArr);
		} else if (msg.type === ApiCjsjy.GAME_RESULT_PUSH) {
			// console.log("收到了游戏结算==", msg.data)
			this.result = msg.data.result.winScores;
			this.curScores = msg.data.result.curScores;
			this.tick = 0;
		} else if (msg.type === ApiCjsjy.GAME_STATUS_PUSH) {
			this.tick = msg.data.tick;
			this.gameStatus = msg.data.gameStatus;
			this.gameStarted = true;
			if (this.gameStatus == ApiCjsjy.gameStatus.NONE) {
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
				this.cardTypeList = []
				let gameType = this.getGameType();
				if (gameType == Def_Sgbjh.gameType.QIANGZHUANG ||
					gameType == Def_Sgbjh.gameType.DACHIXIAOZHUANG ||
					gameType == Def_Sgbjh.gameType.PAIDAZHUANG) {
					this.bankerChairID = null;
				}
			}
		} else if (msg.type === ApiCjsjy.GAME_BANKER_PUSH) {
			this.bankerChairID = msg.data.bankerChairID;
			this.robBankScales = this.robBankScales || [];
			this.robBankScales[this.bankerChairID] = msg.data.robScale;
		} else if (msg.type === ApiCjsjy.GAME_SEND_CARDS_PUSH) {
			this.handCards = msg.data.handCards;
			this.setCardTypeList(msg.data.cardTypeList)
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
	// console.log("CJSJYModel onDestroy");
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
};

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

//获取玩家制定手牌中的牌
model.getHandChairCardByIndex = function (chairID, index) {
	if (!this.handCards) return null;
	const handCards = this.handCards[chairID];
	if (!handCards) return null;
	return handCards[index];
};

model.getCanPourScores = function () {
	if (!this.gameRule) return [];
	let canPourScores = this.gameRule.canPourScores.slice();
	for (let i = 0; i < canPourScores.length; ++i) {
		canPourScores[i] *= this.gameRule.baseScore;
	}
	if (this.isUnionCreate() && this.getRoomCreatorByKey('unionType') == Enums.UnionType.MATCH) {
		let maxScore = this.getMaxCanPourScore();
		while (canPourScores.length > 0 &&
			canPourScores[canPourScores.length - 1] > maxScore) {
			canPourScores.pop();
		}
		if (canPourScores.length == 0) {
			canPourScores.push(1);
		}
	}
	return canPourScores;
};

model.getMaxCanPourScore = function () {
	if (!this.gameRule) return 1;
	let maxScore;
	if (this.isUnionCreate() && this.getRoomCreatorByKey('unionType') == Enums.UnionType.MATCH) {
		if (!this.robBankScales) return 1;
		let user = this.getUserByChairID(this.getMyChairID());
		let score = user.userInfo.score;
		let bankerScale = 1;
		let scale = (this.gameRule.scaleType == Def_Sgbjh.scaleType.LITTLE) ? 1 : ApiCjsjy.cardsType.BAOZI;
		if (this.bankerChairID != null && this.robBankScales[this.bankerChairID] != null) {
			bankerScale = this.robBankScales[this.bankerChairID];
		}
		maxScore = Math.floor(score / scale / bankerScale);
		if (this.gameRule.maxCanPourGold && maxScore > this.gameRule.maxCanPourGold * this.gameRule.baseScore) {
			maxScore = this.gameRule.maxCanPourGold * this.gameRule.baseScore;
		}
		maxScore = maxScore || 1
	} else {
		maxScore = this.gameRule.maxCanPourGold * this.gameRule.baseScore;
	}
	return maxScore || 1;
};

model.getResult = function () {
	return this.result;
};

model.getHandCards = function () {
	return this.handCards || [];
};

model.getIsPlayingByChairID = function (chairID) {
	let user = this.getUserByChairID(chairID);
	return !!user && chairID < this.getChairCount() &&
		(user.userStatus == ApiRoom.userStatusEnum.READY ||
			user.userStatus == ApiRoom.userStatusEnum.PLAYING);
};

model.getShowCards = function (chairID) {
	if (!this.showCards) return false;
	return this.showCards[chairID] == 1;
};

model.getIsBigScale = function () {
	if (!this.gameRule) return false;
	return this.gameRule.scaleType == Def_Sgbjh.scaleType.BIG;
};

model.getTrustByChairID = function (chairID) {
	if (!this.userTrustArray) return false;
	return this.userTrustArray[chairID];
};

model.getCurScore = function (chairID) {
	let user = this.getUserByChairID(chairID);
	if (!user) return 0;
	if (this.isUnionCreate() && this.getRoomCreatorByKey('unionType') == Enums.UnionType.MATCH) {
		if (!this.pourScores) return Math.floor(user.userInfo.score);
		return Math.floor(user.userInfo.score - this.pourScores[chairID]) >= 0 ? Math.floor(user.userInfo.score - this.pourScores[chairID]) : 0;
	} else {
		return Math.floor(this.getCurScoresByChairID(chairID));
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
	for (let x = 0; x < this.chairCount; x++) {
		let user = this.getUserByChairID(x);
		if (!user) continue;
		num++;
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

//获取卡牌点数
model.getCardPoint = function (flower) {
	return flower % 16;
}

//获取卡牌花色
model.getCardColor = function (flower) {
	return parseInt(flower / 16);
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

//判断玩家是否在旁观状态
model.isInWatch = function (uid) {
	uid = uid || UserModel.getData('uid');
	let user = this.getUserByUID(uid);
	let chairCount = this.getChairCount();
	let isWatch = !user || user.chairID >= chairCount || user.playStatus == ApiRoom.playStatus.WATCH;
	return isWatch;
}

model.getBundleType = function () {
	return this.getGameRuleByKey('gameType') || Enums.bundleType.CJSJY;
}