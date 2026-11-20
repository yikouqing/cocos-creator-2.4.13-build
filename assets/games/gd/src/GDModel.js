const Enums = require('../../../src/const/Enums');
const ApiGd = require('./ApiGd');
const UserModel = require('../../../src/model/UserModel');
const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const GDGameLogic = require('./GDGameLogic');
const NodePoolManager = require('../../../src/utils/NodePoolManager');
const ConfigModel = require('../../../src/model/ConfigModel');

var model = module.exports;

model.init = function (data) {
	this.gameStatus = 0;
	this.cardRow = true;
	this.cardItem = data.cardItem;
	this.gameEndData = null;
	this.gameRoundEndData = null;
};

model.roomInit = function (msg) {
	// console.log('数据初始化', msg);
	UserModel.setDatas(msg);
	this.gameEndData = null;
	this.gameRoundEndData = null;
	this.relativeChairID = 0;
	this.roomUserInfoArr = msg.roomUserInfoArr;
	this.gameRule = msg.gameRule;
	this.roomID = msg.roomID;
	this.roomCreatorInfo = msg.roomCreatorInfo;
	this.gameStatus = msg.gameData.gameStatus;
	this.gameStarted = msg.gameData.gameStarted;
	this.tick = msg.gameData.tick;
	this.totalTick = msg.gameData.totalTick;
	this.bankerUid = msg.gameData.bankerUid;
	this.pourScores = msg.gameData.pourScores;
	this.handCards = msg.gameData.handCards;
	this.datalist = msg.gameData.datalist || [];
	this.playerRanking = msg.gameData.playerRanking;
	this.CarsUpgrade = msg.gameData.CarsUpgrade || [];
	this.nextBitCards = msg.gameData.nextBitCards || [];
	this.jinGangASeat = msg.gameData.jinGangASeat || [];
	this.onGameExchangelist = msg.gameData.onGameExchangelist || []; //换牌后的数据
	if (this.gameStatus == ApiGd.gameStatus.JIN_GANG) {
		this.onGameExchangelist = this.datalist;
	}
	this.curBureau = msg.gameData.curBureau;
	this.turn = msg.gameData.turn;
	this.bankerTurn = msg.gameData.bankerTurn;
	this.bankerPourTurn = msg.gameData.bankerPourTurn;
	this.maxBureau = msg.gameData.maxBureau;
	this.chairCount = msg.gameData.chairCount;
	this.userTrustArray = msg.gameData.userTrustArray;
	this.nextBankerChairID = msg.gameData.nextBankerChairID;
	this.myUID = UserModel.getData('uid');
	this.askForExitArr = null;
	this.userOperateStatus = msg.gameData.userOperateStatus;
	this.curOperateUid = msg.gameData.curOperateUid;
	this.userEndCards = msg.gameData.userEndCards;
	this.userPourScore = msg.gameData.userPourScore;
	this.userScore = msg.gameData.userScore;
	this.curScore = msg.gameData.curScore;
	this.mangoScore = msg.gameData.mangoScore;
	this.baseTotalScore = msg.gameData.baseTotalScore;
	this.userPlayStatus = msg.gameData.userPlayStatus;
	this.curTurn = msg.gameData.curTurn;
	this.userWinTotalScore = msg.gameData.userWinTotalScore;
	this.lastOperateUid = msg.gameData.lastOperateUid;
	this.lastOperateCards = msg.gameData.lastOperateCards;
	this.nabASeat = msg.gameData.nabASeat;
	this.double = msg.gameData.double;
	this.baseCards = msg.gameData.baseCards;
	this.leftCards = msg.gameData.leftCards; //记牌器
	this.rangPaiCount = msg.gameData.rangPaiCount;
	this.multiples = msg.gameData.multiples;
};

model.messageCallbackHandler = function (route, msg) {
	if (route === 'RoomMessagePush') {
		if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
			this.roomInit(msg.data);
		} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
			this.addUser(msg.data.roomUserInfo);
		} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
			if (msg.data.roomUserInfo.chairID != this.getMyChairID()) {
				this.delUser(msg.data.roomUserInfo.chairID);
			}
		} else if (msg.type === ApiRoom.USER_READY_PUSH) {
			this.userPlayStatus[msg.data.uid] = ApiRoom.playStatus.READY;
			this.onUserReady(msg.data.chairID);
		} else if (msg.type === ApiRoom.ROOM_DISMISS_PUSH) {
			this.askForExitArr = null;
			this.roomDismissReason = msg.data.reason;
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
			if (!!user) {
				user.userStatus = ApiRoom.userStatusEnum.OFFLINE
			};
		} else if (msg.type === ApiRoom.USER_GAME_STATUS_PUSH) {
			// console.log('玩家状态-推送', msg)
			this.userPlayStatus = msg.data.userPlayStatus;
		} else if (msg.type === ApiRoom.ROOM_USER_WIN_TOTAL_PUSH) {
			/**玩家总输赢分数 */
			this.userWinTotalScore = msg.data.userWinTotalScore;
		}
	} else if (route === 'GameMessagePush') {
		if (msg.type === ApiGd.GAME_BUREAU_PUSH) { //局数推送
			// console.log('608-游戏局数-推送', msg.data);
			this.curBureau = msg.data.curBureau;
			this.datalist = [];
		} else if (msg.type === ApiGd.GAME_STATUS_PUSH) { //状态推送
			// console.log('470-游戏状态-推送', msg.data);
			this.tick = msg.data.tick;
			this.totalTick = msg.data.tick;
			this.gameStatus = msg.data.gameStatus;
			this.gameStarted = true;
			this.lastOperateCards = null;
			this.lastOperateUid = null;
			if (this.gameStatus == ApiGd.gameStatus.NONE) {
				this.gameRoundEndData = null;
				this.curOperateUid = null;
				this.nabASeat = {};
				this.double = {};
				this.curTurn = 0;
				this.bankerUid = null;
				this.userOperateStatus = {};
				this.multiples = {};
			}
		} else if (msg.type === ApiGd.GAME_BANKER_PUSH) {
			this.bankerUid = msg.data.uid;
			this.playerRanking = msg.data.playerRanking;
		} else if (msg.type === ApiGd.GAME_JIN_GANG_PUSH) {
			// console.log('602-进贡-推送', msg.data);
			this.jinGangASeat = msg.data.data || [];
		} else if (msg.type === ApiGd.GAME_JIN_GANG_RESULT_PUSH) { //622-进贡结果
			// console.log('622-进贡-结果', msg.data);
			if (!!msg.data.data) {
				this.onGameExchangelist.push(msg.data.data);
			}
		} else if (msg.type === ApiGd.GAME_EXCHANGE_PUSH) { //交换结果
			this.onGameExchangelist = msg.data.onGameExchangelist || [];
		} else if (msg.type === ApiGd.USER_CAHRID_UPDATE_RESULT_PUSH) { // 玩家charid更新推送
			// console.log('616-玩家charid更新-推送', msg.data);
			if (msg.data && msg.data.roomID == this.roomID) {
				if (!!msg.data.roomUserInfo) {
					this.roomUserInfoArr = msg.data.roomUserInfo;
				}
			}
		} else if (msg.type === ApiGd.GAME_SEND_CARDS_PUSH) {
			// console.log('603-发牌-推送', msg.data);
			this.onSendCards(msg.data);
		} else if (msg.type === ApiGd.GAME_USER_OPERATE_START_PUSH) {
			// console.log('604=操作提示-推送', msg.data);
			this.lastOperateUid = msg.data.lastOperateUid;
			this.tick = msg.data.tick;
			this.totalTick = msg.data.tick;
			this.curOperateUid = msg.data.uid;
			this.leftCards = msg.data.leftCards;
			this.lastOperateCards = msg.data.cards;
		} else if (msg.type === ApiGd.GAME_USER_OPERATE_PUSH) {
			// console.log('610-操作结果-推送', msg.data);
			if (!msg.data.operateInfo.isSuccess) return false;
			this.updateUserOperateStatus(msg.data.uid, msg.data.operateInfo.operateType);
			this.lastOperateCards = msg.data.operateInfo.cards;
			this.leftCards = msg.data.operateInfo.leftCards;
			let handCards = msg.data.operateInfo.handCards;
			this.lastOperateUid = msg.data.uid;
			for (const uid in handCards) {
				if (this.duiyouUID != uid) {
					this.setUIDHandCards(uid, handCards[uid])
				}
			}
		} else if (msg.type == ApiGd.GAME_PLAYER_RANKING_PUSH) {
			// console.log('613-玩家名次推送-推送', msg.data);
			this.nextBitCards = [];
			this.setDuiYouUID(msg.data.uid, false);
			this.playerRanking = msg.data.playerRanking || {};
			this.setUIDHandCards(this.duiyouUID, msg.data.handCards);
		} else if (msg.type == ApiGd.GAME_SIDE_SEND_CARDS_PUSH) { //发同边玩家手牌
			// console.log('613-队友手牌-推送', msg.data)
			this.setUIDHandCards(this.duiyouUID, msg.data.handCards);
		} else if (msg.type === ApiGd.GAME_RESULT_PUSH) { //小结算
			// console.log('606-小结算-推送', msg.data);
			this.duiyouUID = "";
			this.datalist = [];
			this.nextBitCards = [];
			this.jinGangASeat = [];
			this.onGameExchangelist = [];
			if (!msg.data.result) return;
			this.gameRoundEndData = msg.data.result;
			for (const user of msg.data.result) {
				if (!user.uid) continue;
				this.setUIDHandCards(user.uid, user.userCards)
			}
		} else if (msg.type === ApiGd.GAME_END_PUSH) { //大结算
			// console.log('609-大结算-推送', msg.data);
			this.gameEndData = msg.data;
		} else if (msg.type === ApiGd.GAME_USER_SCORE_CHANGE_PUSH) { //玩家分数变化推送
			if (!!msg.data.userPourScore) {
				this.userPourScore = msg.data.userPourScore;
			}
			if (!!msg.data.userScore) {
				// console.log('玩家分数变化', msg);
				this.userScore = msg.data.userScore;
			}
			if (!!msg.data.mangoScore) {
				this.mangoScore = msg.data.mangoScore;
			}
			if (!!msg.data.baseTotalScore) {
				this.baseTotalScore = msg.data.baseTotalScore;
			}
		}
	}
};



model.getMyUID = function () {
	return this.myUID;
};
model.getDuiYouUID = function () {
	return this.duiyouUID || "";
};
/**
 * 
 * @param {*} uid 队友uid》只有四人模式才有
 * @param {*} ishand 是否设置队友手牌》只断线并且有队友手牌时设置
 */
model.setDuiYouUID = function (uid, ishand) {
	this.duiyouUID = "";
	if (!!uid && this.getChairCount() == 4 && uid != this.myUID) {
		this.duiyouUID = uid || "";
		if (ishand && !!this.duiyouUID && this.nextBitCards.length) {
			for (const key in this.handCards) {
				if (this.duiyouUID == key) {
					this.handCards[this.duiyouUID] = this.nextBitCards;
				}
			}
		}
	}
};

model.getonGameExchangelist = function () {
	return this.onGameExchangelist || [];
}

model.getnextBitCards = function () {
	return this.nextBitCards || [];
}

model.isShowDuiYou = function () {
	// console.log("队友uid>", this.duiyouUID, "我排名》", this.playerRanking[this.myUID])
	if (!!this.duiyouUID) {
		if (this.playerRanking && !!this.playerRanking[this.myUID]) {
			return true
		};
	}
	return false;
}

model.getRoomCreatorChairID = function () {
	if (!this.roomUserInfoArr) return null;
	let creatorChairID = -1;
	for (let user of this.roomUserInfoArr) {
		if (user.userInfo.uid == this.roomCreatorInfo.uid) {
			creatorChairID = user.chairID;
			break;
		}
	}
	return creatorChairID;
};

model.getRobBankLimit = function () {
	if (!this.gameRule) return 0;
	return this.gameRule.robBankLimit || 0;
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
	return this.maxBureau;
};
model.getDatalist = function (uid) {
	for (let index = 0; index < this.onGameExchangelist.length; index++) {
		const curData = this.onGameExchangelist[index];
		if (uid == curData.uid) {
			return curData;
		}
	}
	return null;
}
model.getAllDatalist = function () {
	return this.datalist || [];
}


model.getjinGangASeat = function () {
	return this.jinGangASeat || [];
}

model.getSwapCard = function (uid) {
	for (let index = 0; index < this.jinGangASeat.length; index++) {
		let CurUser = this.jinGangASeat[index];
		if (uid == CurUser.uid) {
			return CurUser; // 	uid: [{ uid: "833498", Cardstype: 1, cards: 18 }]
		}
	}
	// uid: key, //玩家uid
	// Cardstype: 3,//1为进贡 2为反贡 3为抗贡
	// cards: 0x4E,//对象 牌 抗贡反贡有值 进贡无值 
	return null;
}

model.getMangoScore = function () {
	return this.mangoScore || 0;
}

model.getPiScore = function () {
	return this.baseTotalScore || 0;
}

model.onSendCards = function (data) {
	if (!data) return;
	this.curTurn = data.turn;
	if (!data.handCards) return;
	let handCards = data.handCards;
	this.CarsUpgrade = data.CarsUpgrade || [];
	for (const key in handCards) {
		let CardsList = handCards[key] || [];
		this.handCards[key] = CardsList.slice();
	}
}
model.getCarsUpgrade = function () {
	return this.CarsUpgrade || []
}

model.onUserReady = function (chairID) {
	let user = this.getUserByChairID(chairID);
	if (!user) return;
	user.userStatus = ApiRoom.userStatusEnum.READY;
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
	return {
		time: this.tick || 0,
		duration: this.totalTick || 0
	}
};

model.onDestroy = function () {
	this.gameEndData = null;
};

model.setBankerUID = function (uid) {
	this.bankerUid = uid;
}

model.getChairCount = function () {
	if (!this.gameRule) return 0;
	return this.gameRule.maxPlayerCount || 0;
};

model.getMyChairID = function () {
	if (!this.roomUserInfoArr) return 0;
	for (let user of this.roomUserInfoArr) {
		if (user.userInfo.uid == this.myUID) {
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
	let user = null;
	for (let item of this.roomUserInfoArr) {
		if (item.chairID == chairID) {
			user = item;
			break;
		}
	}
	return user;
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

model.getTrustByChairID = function (chairID) {
	this.userTrustArray = this.userTrustArray || [];
	return this.userTrustArray[chairID];
};

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

/**
 * 获取座位上的玩家
 * @returns 
 */
model.getUsersInSeat = function () {
	if (!this.roomUserInfoArr) return [];
	let users = [];
	for (const user of this.roomUserInfoArr) {
		if (user.chairID < this.getChairCount()) {
			users.push(user);
		}
	}
	return users;
}

model.getUserStatusByChairID = function (chairID) {
	let user = this.getUserByChairID(chairID);
	if (!user) return 0;
	return user.userStatus;
}

model.getUserPlayStatusByChairID = function (chairID) {
	let user = this.getUserByChairID(chairID);
	if (!user) return 0;
	return user.playStatus;
}

model.getUserPlayStatusByUID = function (uid) {
	this.userPlayStatus = this.userPlayStatus || {};
	return this.userPlayStatus[uid] || 0;
}

model.checkUserTakeSeat = function (uid) {
	if (!this.roomUserInfoArr) return false;
	let user = this.getUserByUID(uid);
	if (!user) return false;
	return user.chairID < this.getChairCount();
}

model.setRelativeChairID = function () {
	if (this.relativeChairID == this.getMyChairID()) return;
	this.relativeChairID = this.getMyChairID() >= this.getChairCount() ? 0 : this.getMyChairID();
}

model.getIndexByUID = function (uid) {
	let index = -1;
	let user = this.getUserByUID(uid);
	if (!user) return -1;
	index = this.getIndexByChairID(user.chairID);
	return index;
}

model.getIndexByChairID = function (chairID) {
	if (chairID >= this.getChairCount()) return -1;
	return (chairID - this.relativeChairID + this.getChairCount()) % this.getChairCount();
}

model.getUserOperateStatusByUID = function (uid) {
	this.userOperateStatus = this.userOperateStatus || {};
	return this.userOperateStatus[uid];
}
/**获取当前操作玩家iD */
model.getCurOperateUID = function () {
	return this.curOperateUid || null;
}

model.checkIsMyTurn = function () {
	let uid = UserModel.getData('uid');
	return this.curOperateUid == uid && this.checkInSeat();
}

model.getUserHandCardsByUID = function (uid) {
	this.handCards = this.handCards || {};
	return this.handCards[uid] || [];
}

model.setUIDHandCards = function (uid, list) {
	if (!!uid && list) {
		this.handCards[uid] = list;
	}
}

model.getUserTotalScoreByUID = function (uid) {
	if (!this.roomUserInfoArr) return 0;
	let score = 0;
	for (let i = 0; i < this.roomUserInfoArr.length; ++i) {
		if (this.roomUserInfoArr[i].userInfo.uid == uid) {
			score = this.roomUserInfoArr[i].userInfo.score;
			break;
		}
	}
	return score;
}

//获取玩家对象的数据
model.getUserKeyDataByUID = function (uid, key) {
	if (!this.roomUserInfoArr) return 0;
	let value = null;
	for (let i = 0; i < this.roomUserInfoArr.length; ++i) {
		if (this.roomUserInfoArr[i].userInfo.uid == uid) {
			value = this.roomUserInfoArr[i].userInfo[key];
			break;
		}
	}
	return value;
}

model.getUserPourScoreByUID = function (uid) {
	this.userPourScore = this.userPourScore || {};
	return this.userPourScore[uid] || 0;
}

model.getUserPourScores = function () {
	this.userPourScore = this.userPourScore || {};
	return this.userPourScore;
}

model.getNeedPourScoreByUID = function (uid) {
	this.curScore = this.curScore || {};
	return this.curScore[uid] || 0;
}

model.getUserScoreByUID = function (uid) {
	this.userScore = this.userScore || {};
	return this.userScore[uid] || 0;
}



//检测自己在不在座位上
model.checkInSeat = function () {
	let user = this.getUserByUID(UserModel.getData('uid'));
	if (!user) return false;
	return user.chairID < this.getChairCount();
}

//获取当前发牌轮次
model.getCurDealTurn = function () {
	this.curTurn = this.curTurn || 0;
	this.curTurn = this.curTurn > 3 ? 3 : this.curTurn;
	return this.curTurn;
}

model.updateUserOperateStatus = function (uid, status) {
	this.userOperateStatus = this.userOperateStatus || {};
	this.userOperateStatus[uid] = status || 0;
}
model.getplayerRanking = function () {
	return this.playerRanking || {};
}

model.getUpgrade = function () {
	let CarsUpgrade = this.getCarsUpgrade();
	if (!CarsUpgrade.length) return 0;
	let bankerUid = this.getBankerUID();
	if (!bankerUid) return 0;
	let CurUser = this.getUserByUID(bankerUid);
	if (!CurUser) return 0;
	return CarsUpgrade[CurUser.chairID % 2];

}
model.getBankerUID = function () {
	if (this.getCurBureau() == 1) {
		return this.bankerUid || null;
	} else {
		let bankerUid = null;
		for (let uid in this.playerRanking) {
			if (this.playerRanking[uid] == 1) {
				bankerUid = uid;
				break;
			}
		}
		return bankerUid;
	}
};

model.getCardSize = function () {
	if (!this.cardItem) cc.size(210, 290); //检查预制体
	return cc.size(this.cardItem.data.width, this.cardItem.data.height);
}

model.getTotalWinScoreByUID = function (uid) {
	// console.log('测试-玩家分数', this.userWinTotalScore);
	this.userWinTotalScore = this.userWinTotalScore || {};
	return this.userWinTotalScore[uid] || 0;
}

model.getLastOutUID = function () {
	return this.lastOperateUid;
}

model.getLastOutCards = function () {
	// if (this.curOperateUid == this.myUID) return [];
	return this.lastOperateCards || [];
}

model.getNabByUID = function (uid) {
	if (!this.nabASeat) return null;
	return this.nabASeat[uid];
}

model.getRateByUID = function (uid) {
	if (!this.double) return null;
	return this.double[uid];
}

model.getMultipleByUID = function (uid) {
	this.multiples = this.multiples || {};
	return this.multiples[uid] || 0;
}

model.getCanCallRates = function () {
	let op = {
		one: true,
		two: true,
		three: true
	};
	if (!this.nabASeat) return op;
	let nabs = [0];
	for (const uid in this.nabASeat) {
		if (isNaN(parseInt(this.nabASeat[uid]))) continue;
		nabs.push(parseInt(this.nabASeat[uid]));
	}
	let max = Math.max(...nabs);
	op.one = max < 1;
	op.two = max < 2;
	op.three = max < 3;
	return op;
}

model.getUserInfoByUID = function (uid) {
	let user = this.getUserByUID(uid) || {};
	return user.userInfo || {};
}

model.getCardRecords = function () {
	return this.leftCards || [];
}

model.getBaseCards = function () {
	return this.baseCards || [];
}

model.getGameEndData = function () {
	return this.gameEndData;
}

model.getGameRoundEndData = function () {
	return this.gameRoundEndData;
}

model.setGameRoundEndData = function (val = null) {
	this.gameRoundEndData = val;
}

model.getRangCardsCount = function () {
	return this.rangPaiCount || 0;
}

model.isShowCardCount = function (count) {
	let gameStatus = this.gameStatus;
	if (gameStatus != ApiGd.gameStatus.USER_OPERATE) return false;
	let showNum = this.gameRule.showCards || 27;
	return showNum == 27 ? true : count <= showNum;

	this.gameRule = this.gameRule || {};
	if (this.gameRule.maxPlayerCount == 2) {
		return true;
	} else if (this.gameRule.maxPlayerCount == 3) {
		return !!this.gameRule.isShowCardCount && count <= 3;
	} else {
		return false;
	}
}


/**
 * 添加牌节点
 * @param {*} addNode 添加节点
 * @param {*} cardList 卡牌列表
 * @param {*} posList 位置列表
 * @param {*} callback 回调每个添加
 * @param {*} userID 用于判断地主牌
 * @returns 
 */
model.addCardItem = function (addNode, cardList, posList, callback = null, userID = null) {
	if (!addNode || !cc.isValid(addNode) || !addNode.parent) return [];
	while (addNode.childrenCount != 0) {
		let cardNode = addNode.children[0];
		cardNode && NodePoolManager.put('gdCardPool', cardNode);
	}
	addNode.destroyAllChildren(); //以防未回收成功
	if (!cardList.length || !posList.length) return [];
	for (let index = 0; index < cardList.length; index++) {
		let isFinal = index == cardList.length - 1;
		let cardItem = NodePoolManager.get('gdCardPool');
		if (!!cardItem) {
			cardItem.zIndex = index;
			let CardCtrl = cardItem.getComponent("GDCard");
			CardCtrl.bind(cardList[index], isFinal, posList[index], userID);
			callback && callback(cardItem, index);
			cardItem.setPosition(posList[index]);
			addNode.addChild(cardItem);
		}
	}
	return addNode.children;
}


model.setCardRow = function (typeRow) {
	this.cardRow = typeRow;
}
/** 是否横排*/
model.getCardRow = function () {
	return this.cardRow;
}

model.getTwoCardList = function (cardList, isSort = true) {
	// initList = [79, 79, 78, 78, 78, 52, 36, 1, 13, 29, 29, 12, 60, 28, 44, 43, 58, 41, 40, 56, 23, 54, 37, 5, 53, 19, 35, 51, 19, 34];
	if (!cardList || !cardList.length) return [];
	let newList = [],
		twoList = [];
	cardList.forEach((cardID, index) => {
		let cardVal = GDGameLogic.getCardLogicValue(cardID);
		newList.push({
			index: index,
			val: cardVal,
			id: cardID,
		});
	})
	let groupAndSortByVal = (items) => {
		const valMap = new Map();
		for (const item of items) {
			const val = item.val;
			if (!valMap.has(val)) {
				valMap.set(val, []);
			}
			valMap.get(val).push(item);
		}
		const result = Array.from(valMap.values());
		return result;
	}
	newList = groupAndSortByVal(newList);
	for (let indeX = 0; indeX < newList.length; indeX++) {
		let sonList = newList[indeX];
		for (let indeY = 0; indeY < sonList.length; indeY++) {
			if (!twoList[indeX]) twoList[indeX] = [];
			twoList[indeX].push(sonList[indeY].id);
		}
	}
	if (isSort == false) {
		return twoList.slice();
	} else {
		return this.setTwoListSort(twoList.slice());
	}
}

model.getNewTwoCardList = function (cardList, lipaiList) {
	if (!lipaiList || !lipaiList.length) {
		return this.getTwoCardList(cardList);
	}
	let twoList = lipaiList.slice();
	let remainList = cardList.slice();
	let remainListLen = remainList.length;
	for (let index1 = 0; index1 < twoList.length; index1++) {
		const sonList = twoList[index1] || [];
		for (let index2 = 0; index2 < sonList.length; index2++) {
			const CurCardID = sonList[index2];
			for (let index3 = 0; index3 < remainListLen; index3++) {
				const remainCardID = remainList[index3];
				if (!remainCardID) {
					continue
				};
				if (CurCardID == remainCardID) {
					remainList.splice(index3, 1);
					continue;
				}
			}
		}
	}
	let newtwoList = this.getTwoCardList(remainList.slice(), false);
	newtwoList.forEach(sonList => {
		twoList.push(sonList);
	});
	return this.setTwoListSort(twoList.slice());
}

model.setTwoListSort = function (twoList) {
	let listSort = (curSonList) => {
		curSonList.sort((a, b) => {
			let aVal = GDGameLogic.getCardLogicValue(a);
			let bVal = GDGameLogic.getCardLogicValue(b);
			return aVal - bVal;
		})
		let newCurList = curSonList.slice();
		let laiziCard = this.getUpgrade();
		let LaiziCardID = laiziCard + 32; //红桃起始牌值32
		let isLaiZi = newCurList.indexOf(LaiziCardID) != -1;
		if (isLaiZi) {
			const rankLast = (curList, LaiziCardID) => {
				let gameRule = this.getGameRule();
				let type = GDGameLogic.getCardType(curList, gameRule, laiziCard);
				if (type == ApiGd.cardType.SINGLE_LINE || type == ApiGd.cardType.TONG_HUA_SUN || type == ApiGd.cardType.DOUBLE_LINE) {
					let laiziNum = 0;
					let valList = [];
					let newList = [];
					let listLen = curList.length;
					for (let index = 0; index < listLen; index++) {
						const curCardID = curList[index];
						if (curCardID) {
							if (curCardID == LaiziCardID) {
								curList.splice(index, 1);
								laiziNum += 1;
							}
						}
					}
					curList.forEach(curCardID => {
						let val = GDGameLogic.getCardLogicValue(curCardID);
						valList.push({
							val: val,
							id: curCardID
						});
					})
					for (let i = 1; i < listLen; i++) {
						let one_wei = (valList[i - 1].val + 1);
						if (!valList[i] && laiziNum > 0) {
							valList.push({
								val: one_wei,
								id: LaiziCardID
							});
							laiziNum--;
						} else if (!valList[i]) {
							break;
						}
						let tow_wei = valList[i].val;
						if (one_wei != tow_wei && laiziNum > 0) {
							if (one_wei == 15) {
								one_wei = (valList[0].val - 1);
							}
							valList.push({
								val: one_wei,
								id: LaiziCardID
							});
							laiziNum--;
						}
					}
					valList.sort((a, b) => {
						return a.val - b.val
					});
					valList.forEach(obj => {
						newList.push(obj.id)
					});
					// console.log("valList", valList)
					return newList.slice();
				} else {
					let newList = curList.slice();
					let arrLen = newList.length;
					for (let index = 0; index < arrLen; index++) {
						if (newList[index] == LaiziCardID) {
							newList.push(newList.splice(index, 1)[0]);
							index--;
							arrLen--;
						}
					}
					return newList.slice();
				}
			};
			return rankLast(newCurList.slice(), LaiziCardID);
		} else {
			return newCurList.slice();
		}
	}
	let newTwoList = [];
	let newHoldsList = [];
	for (let index0 = 0; index0 < twoList.length; index0++) {
		let sonTwoList = twoList[index0];
		let sonListSort = listSort(sonTwoList.slice());
		if (sonListSort) {
			for (let index1 = 0; index1 < sonListSort.length; index1++) {
				let CurCardID = sonListSort[index1];
				newHoldsList.push(CurCardID);
			}
			newTwoList.push(sonListSort);
		}
	}
	return {
		holdsList: newHoldsList.slice(),
		twoList: newTwoList.slice()
	};
}



model.isArrEqually = function (arr1, arr2) {
	return arr1.length == arr2.length && arr1.sort().toString() === arr2.sort().toString();
}


model.getNoLaiZiCardID = (cardList, laiziCard) => {
	let LaiziCardID = laiziCard + 32; //红桃起始牌值32
	let isLaiZi = cardList.indexOf(LaiziCardID) != -1;
	if (isLaiZi) {
		for (let index = 0; index < cardList.length; index++) {
			let curListID = cardList[index];
			if (LaiziCardID != curListID) {
				return curListID;
			}
		}
	} else {
		return cardList[0];
	}
}

model.isHuaSe = function (curCardID) {
	if (curCardID > 0 && curCardID < 14) { //方块
		return 1
	} else if (curCardID > 16 && curCardID < 30) { //梅花
		return 2
	} else if (curCardID > 32 && curCardID < 46) { //红桃
		return 3
	} else if (curCardID > 48 && curCardID < 62) { //黑桃
		return 4
	}
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

model.showAinm = function (ainmType, runFunc, pos = cc.v2(0, 0), endFunc) {
	if (ainmType == null) return;
	AssetsManager.loadAsset({
		path: "res/prefab/GDEffectAinm",
		bundle: Enums.bundleType.GD,
		aType: cc.Prefab
	}, (item) => {
		if (!item) return;
		const ainmNode = cc.instantiate(item);
		ainmNode.setPosition(pos);
		runFunc && runFunc(ainmNode);
		let ctrl = ainmNode.getComponent("GDEffectAinm");
		ctrl.showOptAni(ainmType, endFunc);
	});
}

model.getBundleType = function () {
	return this.getGameRuleByKey('gameType') || Enums.bundleType.GD;
}