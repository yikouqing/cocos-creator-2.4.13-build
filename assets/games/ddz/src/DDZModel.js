var model = module.exports;
const Enums = require('../../../src/const/Enums');
const ApiDdz = require('./ApiDdz');
const MessageCallback = require('../../../src/utils/MessageCallback');
const UserModel = require('../../../src/model/UserModel');
const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const DDZGameLogic = require('./DDZGameLogic');
const DDZUtils = require('./DDZUtil');
const ConfigModel = require('../../../src/model/ConfigModel');

model.init = function (data) {
	this.gameStatus = 0;
	this.gameEndData = null;
	this.gameRoundEndData = null;
	this.cardItem = data.cardItem;
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
	this.operateRecords = msg.gameData.operateRecords || [];
	this.lastOperateCardsType = 0;
	if (this.lastOperateCards && this.lastOperateCards.length && this.operateRecords.length) {
		for (let index = 0; index < this.operateRecords.length; index++) {
			const obj = this.operateRecords[index];
			let operateInfo = obj.operateInfo;
			let cards = operateInfo.cards || [];
			if (this.isArraysEqual(this.lastOperateCards, cards)) {
				this.lastOperateCardsType = operateInfo.cardType || 0;
			}
		}
	}
};

model.getMyUID = function () {
	this.myUID = UserModel.getData('uid')
	return this.myUID;
};

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
			if (!user) return;
			user.userStatus = ApiRoom.userStatusEnum.OFFLINE;
		} else if (msg.type === ApiRoom.USER_GAME_STATUS_PUSH) {
			// console.log('玩家状态推送', msg)
			this.userPlayStatus = msg.data.userPlayStatus;
		} else if (msg.type === ApiRoom.ROOM_USER_WIN_TOTAL_PUSH) {
			// console.log("433====玩家总输赢分数", msg.data)
			/**玩家总输赢分数 */
			this.userWinTotalScore = msg.data.userWinTotalScore;
		}
	} else if (route === 'GameMessagePush') {
		if (msg.type === ApiDdz.GAME_BUREAU_PUSH) {
			this.curBureau = msg.data.curBureau;
		} else if (msg.type === ApiDdz.GAME_STATUS_PUSH) {
			// console.log('状态推送', msg.data);
			this.tick = msg.data.tick;
			this.totalTick = msg.data.tick;
			this.gameStatus = msg.data.gameStatus;
			this.gameStarted = true;
			this.lastOperateCards = null;
			this.lastOperateUid = null;
			this.lastOperateCardsType = 0;
			if (this.gameStatus == ApiDdz.gameStatus.NONE) {
				this.gameRoundEndData = null;
				this.curOperateUid = null;
				this.nabASeat = {};
				this.double = {};
				this.curTurn = 0;
				this.bankerUid = null;
				this.userOperateStatus = {};
				this.multiples = {};
			}
		} else if (msg.type === ApiDdz.GAME_ROB_BANK_RESULT_PUSH) {
			this.nabASeat[msg.data.uid] = msg.data.gameSnagScore;
		} else if (msg.type === ApiDdz.GAME_DOUBLE_RESULT_PUSH) {
			this.double[msg.data.uid] = msg.data.gameSnagScore;
		} else if (msg.type === ApiDdz.GAME_ROB_SET_RESULT_PUSH) {
			this.bankerUid = msg.data.uid;
			this.baseCards = msg.data.baseCards;
			if (!!this.bankerUid && !!this.handCards[this.bankerUid] && !!msg.data.handCards) {
				this.handCards[this.bankerUid] = msg.data.handCards[this.bankerUid];
			}
		} else if (msg.type === ApiDdz.GAME_SEND_CARDS_PUSH) {
			// console.log('斗地主-发牌', msg.data);
			this.onSendCards(msg.data);
		} else if (msg.type === ApiDdz.GAME_USER_OPERATE_START_PUSH) {
			this.curOperateUid = msg.data.uid;
			this.tick = msg.data.tick;
			this.totalTick = msg.data.tick;
			this.lastOperateUid = msg.data.lastOperateUid;
			this.lastOperateCards = msg.data.cards;
			this.leftCards = msg.data.leftCards;
			this.lastOperateCardsType = msg.data.cardType || DDZGameLogic.getCardType(this.lastOperateCards);
			// console.log('斗地主-通知玩家', msg.data);
		} else if (msg.type === ApiDdz.GAME_DOUBLE_TURN_PUSH) {
			this.curOperateUid = msg.data.uid;
			this.tick = msg.data.tick;
			this.totalTick = msg.data.tick;
			// console.log('斗地主-通知玩家', msg.data);
		} else if (msg.type === ApiDdz.GAME_ROB_BANK_TURN_PUSH) {
			this.curOperateUid = msg.data.uid;
			this.tick = msg.data.tick;
			this.totalTick = msg.data.tick;
			// console.log('斗地主-通知玩家-抢地主', msg.data);
		} else if (msg.type === ApiDdz.GAME_BANK_RANG_PAI_COUNT_ROUND_PUSH) {
			this.curOperateUid = msg.data.uid;
			this.tick = msg.data.tick;
			this.totalTick = msg.data.tick;
			// console.log('斗地主-通知玩家-让牌选择', msg.data);
		} else if (msg.type === ApiDdz.GAME_BANK_RANG_PAI_COUNT_PUSH) {
			this.rangPaiCount = msg.data.rangPaiCount;
			// console.log('斗地主-通知玩家-让牌数推送', msg.data);
		} else if (msg.type === ApiDdz.GAME_USER_OPERATE_PUSH) {
			// console.log('斗地主-玩家操作结果', msg.data);
			this.updateUserOperateStatus(msg.data.uid, msg.data.operateInfo.operateType);
			this.handCards = msg.data.operateInfo.handCards;
			this.lastOperateCards = msg.data.operateInfo.cards;
			this.lastOperateUid = msg.data.uid;
			this.leftCards = msg.data.operateInfo.leftCards;
			this.lastOperateCardsType = msg.data.operateInfo.cardType;
		} else if (msg.type === ApiDdz.GAME_USER_SCORE_CHANGE_PUSH) {
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
		} else if (msg.type === ApiDdz.GAME_RESULT_PUSH) {
			if (!msg.data.result) return;
			this.gameRoundEndData = msg.data.result;
			for (const user of msg.data.result) {
				if (!user.uid) continue;
				this.handCards[user.uid] = user.userCards;
			}
		} else if (msg.type === ApiDdz.GAME_END_PUSH) {
			this.gameEndData = msg.data;
		} else if (msg.type === ApiDdz.GAME_MULTIPLE_RESULT_PUSH) {
			// console.log('倍数推送', msg);
			this.multiples = msg.data.multiples;
		}
	}
};

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
	for (const key in handCards) {
		this.handCards[key] = handCards[key];
	}
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

model.getBankerUID = function () {
	return this.bankerUid;
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
	// if (chairID >= this.getChairCount()) return -1;
	// return (chairID - this.relativeChairID + this.getChairCount()) % this.getChairCount();
	return (chairID - this.getMyChairID() + this.gameRule.maxPlayerCount) % this.gameRule.maxPlayerCount;
}

model.getUserOperateStatusByUID = function (uid) {
	this.userOperateStatus = this.userOperateStatus || {};
	return this.userOperateStatus[uid];
}

model.getCurOperateUID = function () {
	return this.curOperateUid || null;
}

model.checkIsMyTurn = function () {
	let uid = UserModel.getData('uid');
	return this.curOperateUid == uid && this.checkInSeat();
}

model.getUserHandCardsByUID = function (uid) {
	this.handCards = this.handCards || {};
	let list = this.handCards[uid] || [];
	let newList = list.slice();
	if (!this.getGameRuleByKey("isLai") || !list.length) {
		return newList;
	}
	let newCards = [];
	for (let i = newList.length; i > 0; i--) {
		let cardID = newList[i - 1];
		if (this.isLaiZiCard(cardID)) {
			newList.splice(i - 1, 1);
			newCards.push(cardID);
		}
	}
	newList.forEach((cardID) => {
		newCards.push(cardID);
	})
	return newCards.slice();
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

model.getCardSize = function () {
	if (!this.cardItem) cc.size(240, 320); //检查预制体
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
	return this.lastOperateCards || [];
}
model.getLastOutCardType = function () {
	return this.lastOperateCardsType || 0;
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

model.setGameRoundEndData = function () {
	this.gameRoundEndData = null;
}

model.getRangCardsCount = function () {
	return this.rangPaiCount || 0;
}

model.isShowCardCount = function (count) {
	let gameStatus = this.gameStatus;
	if (gameStatus == ApiDdz.gameStatus.NONE || gameStatus == ApiDdz.gameStatus.GAME_END) return false;
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

model.getLaiZi = function () {
	return this.getGameRuleByKey("laiZiList") || [];
}

model.isLaiZiCard = function (cardID) {
	if (this.getGameRuleByKey("isLai")) {
		let laiziList = this.getLaiZi();
		for (let i = 0; i < laiziList.length; i++) {
			if (laiziList[i] == DDZGameLogic.getCardValue(cardID)) {
				return true;
			}
		}
	}
	return false;
}

model.isOnlyLaiZi = function (cardList) {
	let laiziList = this.getLaiZi();
	for (let index = 0; index < cardList.length; index++) {
		const cardID = cardList[index];
		if (laiziList.indexOf(DDZGameLogic.getCardValue(cardID)) == -1) {
			return false;
		}
	}
	return true;
}

model.isArraysEqual = (a, b) => {
	const sortedA = a.slice().sort();
	const sortedB = b.slice().sort();
	return JSON.stringify(sortedA) === JSON.stringify(sortedB);
}
model.isLaiZiCardID = function (cardID, laiziList) {
	for (let i = 0; i < laiziList.length; i++) {
		if (laiziList[i] == DDZGameLogic.getCardValue(cardID)) {
			return true;
		}
	}
	return false;
}

model.isTwoking = function (cardArr) {
	let arrTwoking = [78, 79], cardList = cardArr.slice();
	return arrTwoking.every(value => cardList.includes(value));
}


model.showAinm = function (ainmType, runFunc, pos = cc.v2(0, 0), endFunc) {
	if (ainmType == null) return;
	AssetsManager.loadAsset({
		path: "res/prefab/DDZEffectAinm",
		bundle: Enums.bundleType.DDZ,
		aType: cc.Prefab
	}, (item) => {
		if (!item) return;
		const ainmNode = cc.instantiate(item);
		let ctrl = ainmNode.getComponent("DDZEffectAinm");
		ctrl.showOptAni(ainmType, endFunc);
		runFunc && runFunc(ainmNode);
		ainmNode.setPosition(pos);
	});
}

model.playOptSoundAinm = function (cards, cardType, runFunc, uid) {
	let ainmType = null, audio = null;
	if (cardType == ApiDdz.cardType.SINGLE) {
		audio = `res/audio/man/man_${DDZGameLogic.getCardValue(cards[0])}`;
	} else if (cardType == ApiDdz.cardType.SINGLE_LINE) {//顺子
		audio = `res/audio/man/man_shunzi`;
		ainmType = 0;
	} else if (cardType == ApiDdz.cardType.DOUBLE) {
		audio = `res/audio/man/man_dui${DDZGameLogic.getCardValue(cards[0])}`;
	} else if (cardType == ApiDdz.cardType.THREE_LINE) {
		if (cards.length == 3) {
			ainmType = 2
			audio = `res/audio/man/man_tuple${DDZGameLogic.getCardValue(cards[0])}`;
		} else {
			ainmType = 6;
			audio = `res/audio/man/man_feiji`;
		}
	} else if (cardType == ApiDdz.cardType.DOUBLE_LINE) {//连对
		audio = `res/audio/man/man_liandui`;
		ainmType = 1;
	} else if (cardType == ApiDdz.cardType.THREE_LINE_TAKE_ONE) {// 三带1
		if (cards.length == 4) {
			audio = `res/audio/man/man_sandaiyi`;
			ainmType = 3;
		} else {
			audio = `res/audio/man/man_feiji`;
			ainmType = 6;
		}
	} else if (cardType == ApiDdz.cardType.THREE_LINE_TAKE_TWO || cardType == ApiDdz.cardType.THREE_LINE_TAKE_DUI) {// 三带二
		if (cards.length == 5) {
			audio = `res/audio/man/man_sandaier`;
			ainmType = 4;
		} else {
			audio = `res/audio/man/man_feiji`;
			ainmType = 6;
		}
	} else if (cardType == ApiDdz.cardType.FOUR_LINE_TAKE_X) {
		if (cards.length == 5) {
			ainmType = 7;
			audio = `res/audio/man/man_sidaiyi`;
		} else if (cards.length == 6) {
			ainmType = 8;
			audio = `res/audio/man/man_sidaier`;
		} else if (cards.length == 7) {
			ainmType = 9;
			audio = `res/audio/man/man_sidaisan`;
		}
	} else if (cardType == ApiDdz.cardType.FOUR_LINE_TAKE_DUI) {
		ainmType = 13;
		audio = `res/audio/man/man_sidaierdui`;
	} else if (cardType == ApiDdz.cardType.BOMB_CARD || cardType == ApiDdz.cardType.LAIZI_BOMB || cardType == ApiDdz.cardType.CHUN_LAIZI_BOMB) {
		audio = `res/audio/man/man_zhadan`;
		ainmType = 10;
	} else if (cardType == ApiDdz.cardType.WANG_BOMB) {
		audio = `res/audio/man/man_wangzha`;
		ainmType = 12;
	}
	this.showAinm(ainmType, runFunc);
	this.playUserSound(audio, uid)
}

model.playUserSound = function (audio, uid) {
	if (!!audio) {
		let userObj = this.getUserByUID(uid);
		if (userObj && !!userObj.userInfo && !!userObj.userInfo.sex) {
			audio = audio.replace(/man/g, "woman");//检查性别
		}
		AssetsManager.playEffect({
			bundle: Enums.bundleType.DDZ,
			path: audio,
		});
	}
}

model.switchLaiziOutCard = function (outsList, outType, func) {
	let haveLaiZi = false;
	if (outType != ApiDdz.cardType.CHUN_LAIZI_BOMB && this.getGameRuleByKey("isLai")) {
		haveLaiZi = this.isOnlyLaiZi(outsList);
		for (let index = 0; index < outsList.length; index++) {
			const element = outsList[index];
			if (this.isLaiZiCard(element)) {
				haveLaiZi = true;
				break;
			}
		}
		if (haveLaiZi) {
			let cardType = outType || this.getLastOutCardType();
			let changeList = DDZUtils.getChangeCardList(outsList, cardType);
			return func && func(haveLaiZi, changeList);
		} else {
			return func && func(haveLaiZi, outsList);
		}
	} else {
		return func && func(haveLaiZi, outsList);
	}
}

model.getBundleType = function () {
	return this.getGameRuleByKey('gameType') || Enums.bundleType.DDZ;
}