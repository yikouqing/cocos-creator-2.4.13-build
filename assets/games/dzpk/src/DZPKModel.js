const Enums = require('../../../src/const/Enums');
const ApiDzpk = require('./ApiDzpk');
const MessageCallback = require('../../../src/utils/MessageCallback');
const UserModel = require('../../../src/model/UserModel');
const ApiRoom = require('../../../src/api/ApiRoom');
const CacheManager = require('../../../src/utils/CacheManager');
const Utils = require('../../../src/utils/Utils');

var model = module.exports;

model.init = function () {
	this.gameInited = false;
	this.gameStatus = 0;
	// console.log("DZPKModel init");
	MessageCallback.addListener('RoomMessagePush', this);
	MessageCallback.addListener('GameMessagePush', this);
};

model.roomInit = function (msg) {
	// console.log('数据初始化', msg);
	UserModel.setDatas(msg);
	this.relativeChairID = 0;
	/* 游戏数据,随时可恢复场景 */
	this.gameInited = true;
	this.roomUserInfoArr = msg.roomUserInfoArr;
	this.gameRule = msg.gameRule;
	this.roomID = msg.roomID;
	this.roomCreatorInfo = msg.roomCreatorInfo;
	this.gameStatus = msg.gameData.gameStatus;
	this.gameStarted = msg.gameData.gameStarted;
	this.tick = msg.gameData.tick;
	this.totalTick = msg.gameData.totalTick;
	this.bankerUID = msg.gameData.bankerUid;
	this.pourScores = msg.gameData.pourScores;
	this.handCards = msg.gameData.handCards;
	this.handCardsType = msg.gameData.handCardsType;
	this.curBureau = msg.gameData.curBureau;
	this.turn = msg.gameData.turn;
	this.bankerTurn = msg.gameData.bankerTurn;
	this.bankerPourTurn = msg.gameData.bankerPourTurn;
	this.maxBureau = msg.gameData.maxBureau;
	this.chairCount = msg.gameData.chairCount;
	this.userTrustArray = msg.gameData.userTrustArray;
	this.nextBankerChairID = msg.gameData.nextBankerChairID;
	this.myUid = UserModel.getData('uid');
	this.askForExitArr = null;
	this.userOperateStatus = msg.gameData.userOperateStatus;
	this.curOperateUid = msg.gameData.curOperateUid;
	this.userEndCards = msg.gameData.userEndCards;
	this.userTotalScore = msg.gameData.userTotalScore;
	this.userPourScore = msg.gameData.userPourScore;
	this.userTurnPourScore = msg.gameData.userTurnPourScore;
	this.userScore = msg.gameData.userScore;
	this.curScore = msg.gameData.curScore;
	this.baseTotalScore = msg.gameData.baseTotalScore;
	this.userPlayStatus = msg.gameData.userPlayStatus;
	this.curTurn = msg.gameData.curTurn;
	this.publicCards = msg.gameData.publicCards;
	this.haveAShowdown = msg.gameData.haveAShowdown;
	this.littleBlindUid = msg.gameData.littleblindUid;
	this.bigBlindUid = msg.gameData.bigblindUid;
	this.basePools = msg.gameData.basePools;
	this.lightEnable = parseInt(CacheManager.getItem('dzpkLight')) == 1;
	this.userDelayTimes = msg.gameData.userDelayTimes;
};

model.getLight = function () {
	return this.lightEnable;
}

model.setLight = function (state) {
	this.lightEnable = state;
	let dzpkLight = state ? 1 : 0;
	CacheManager.setItem('dzpkLight', dzpkLight.toString())
}

model.getGameInited = function () {
	return this.gameInited || false;
};

model.setGameInited = function (value) {
	this.gameInited = value;
};

model.getMyUid = function () {
	return this.myUid || UserModel.getData('uid');
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

model.getRobBankLimit = function () {
	if (!this.gameRule) return 0;
	return this.gameRule.robBankLimit || 0;
};

model.getGameStarted = function () {
	return this.gameInited;
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
			if (msg.data.roomUserInfo.uid != this.getMyUid()) {
				this.delUser(msg.data.roomUserInfo);
			}
			if (msg.data.roomUserInfo.uid === this.getMyUid()) {
			}
		} else if (msg.type === ApiRoom.USER_READY_PUSH) {
			this.onUserReady(msg.data.chairID);
		} else if (msg.type === ApiRoom.ROOM_DISMISS_PUSH) {
			this.askForExitArr = null;
			this.roomDismissReason = msg.data.reason;
			if (msg.data.reason != Enums.gameRoomDismissReason.BUREAU_FINISHED) {
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
		} else if (msg.type === ApiRoom.USER_GAME_STATUS_PUSH) {
			this.userPlayStatus = msg.data.userPlayStatus;
		}
	} else if (route === 'GameMessagePush') {
		if (msg.type === ApiDzpk.GAME_BUREAU_PUSH) {
			this.curBureau = msg.data.curBureau;
		} else if (msg.type === ApiDzpk.GAME_STATUS_PUSH) {
			this.tick = msg.data.tick;
			this.totalTick = msg.data.tick;
			this.gameStatus = msg.data.gameStatus;
			this.gameStarted = true;
			this.curOperateUid = null;
			if (this.gameStatus == ApiDzpk.gameStatus.NONE) {
				this.userDelayTimes = {};
				this.basePools = [];
				this.bigBlindUid = null;
				this.littleBlindUid = null;
				this.curTurn = 0;
				this.bankerUID = null;
				this.userOperateStatus = {};
			}
		} else if (msg.type === ApiDzpk.GAME_BANKER_PUSH) {
			this.bankerUID = msg.data.bankerUid;
		} else if (msg.type === ApiDzpk.GAME_SHOW_CARDS_PUSH) {
			// console.log('德州-分牌结果', msg.data);
			this.onShowCards(msg.data);
		} else if (msg.type === ApiDzpk.GAME_RESULT_PUSH) {
			// console.log('德州-小结算', msg.data);
			if (!msg.data.result) return;
			this.handCards = msg.data.result.handCards;
			this.handCardsType = msg.data.result.handCardsType;
		} else if (msg.type === ApiDzpk.GAME_SEND_CARDS_PUSH) {
			// console.log('德州-发牌', msg.data);
			this.onSendCards(msg.data);
		} else if (msg.type === ApiDzpk.GAME_PUBLIC_SEND_CARDS_PUSH) {
			this.onSendPublicCards(msg.data);
		} else if (msg.type === ApiDzpk.GAME_USER_OPERATE_START_PUSH) {
			this.curOperateUid = msg.data.uid;
			this.curScore = msg.data.curScore;
			this.tick = msg.data.tick;
			this.totalTick = msg.data.tick;
			this.userDelayTimes = msg.data.userDelayTimes;
		} else if (msg.type === ApiDzpk.GAME_USER_OPERATE_PUSH) {
			this.curOperateUid = null;
			this.updateUserOperateStatus(msg.data.uid, msg.data.operateInfo.operateType);
			this.curScore = msg.data.operateInfo.curScore;
			this.userPourScore[msg.data.uid] = msg.data.operateInfo.userPourScore;
			this.userTurnPourScore[msg.data.uid] = msg.data.operateInfo.userTurnPourScore;
			this.userTotalScore[msg.data.uid] = msg.data.operateInfo.userTotalScore;
			this.baseTotalScore = msg.data.operateInfo.baseTotalScore;
			this.userDelayTimes = msg.data.operateInfo.userDelayTimes;
		} else if (msg.type === ApiDzpk.GAME_USER_SCORE_CHANGE_PUSH) {
			if (!!msg.data.userPourScore) {
				this.userPourScore = msg.data.userPourScore;
			}
			if (!!msg.data.userTotalScore) {
				this.userTotalScore = msg.data.userTotalScore;
			}
			if (!!msg.data.userScore) {
				this.userScore = msg.data.userScore;
			}
			if (!!msg.data.baseTotalScore) {
				this.baseTotalScore = msg.data.baseTotalScore;
			}
			if (!!msg.data.userTurnPourScore) {
				this.userTurnPourScore = msg.data.userTurnPourScore;
			}
			if (!!msg.data.userOperateStatus) {
				this.userOperateStatus = msg.data.userOperateStatus;
			}
			if (!!msg.data.basePools) {
				this.basePools = msg.data.basePools;
			}
		} else if (msg.type === ApiDzpk.GAME_BASE_SCORE_PUSH) {
			this.baseTotalScore = msg.data.baseScore;
			this.userDelayTimes = msg.data.userDelayTimes;
			this.onBaseScore(msg.data);
		} else if (msg.type === ApiDzpk.GAME_BLIND_SCORE_PUSH) {
			this.onBlindScore(msg.data);
		} else if (msg.type === ApiDzpk.GAME_LOOK_CARDS_PUSH) {
			this.handCards = msg.data.handCards;
			this.handCardsType = msg.data.handCardsType;
		}
	}
};

model.onBlindScore = function (data) {
	this.bigBlindUid = data.bigblindUid;
	this.littleBlindUid = data.littleblindUid;
	let bbTotalScore = this.getUserTotalScoreByUID(data.bigblindUid);
	if (!(bbTotalScore > 0)) {
		this.updateUserOperateStatus(data.bigblindUid, ApiDzpk.operateType.QIAO);
	}
	let sbTotalScore = this.getUserTotalScoreByUID(data.littleblindUid);
	if (!(sbTotalScore > 0)) {
		this.updateUserOperateStatus(data.littleblindUid, ApiDzpk.operateType.QIAO);
	}
};

model.onBaseScore = function (data) {
	let userScore = data.userScore;
	if (!userScore) return;
	for (const uid in userScore) {
		let userTotalScore = this.getUserTotalScoreByUID(uid);
		if (userTotalScore > 0) continue;
		this.updateUserOperateStatus(uid, ApiDzpk.operateType.QIAO);
	}
}

model.getTotalBaseScore = function () {
	return this.baseTotalScore || 0;
}

model.onSendCards = function (data) {
	if (!data) return;
	this.curTurn = data.turn;
	this.handCardsType = data.handCardsType;
	if (!data.handCards) return;
	let handCards = data.handCards;
	for (const key in handCards) {
		this.handCards[key] = handCards[key];
	}
}

model.onSendPublicCards = function (data) {
	if (!data) return;
	this.handCardsType = data.handCardsType;
	if (!data.publicCards) return;
	this.publicCards = data.publicCards;
}

model.onShowCards = function (data) {
	if (!data) return;
	this.updateUserOperateStatus(data.uid, ApiDzpk.operateType.FEN);
	this.userEndCards = this.userEndCards || [];
	for (let index = 0; index < this.userEndCards.length; index++) {
		if (!this.userEndCards[index]) continue;
		if (this.userEndCards[index].uid == data.uid) {
			this.userEndCards[index] = data;
			break;
		}
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
	MessageCallback.removeListener('RoomMessagePush', this);
	MessageCallback.removeListener('GameMessagePush', this);
};

model.getBankerUID = function () {
	return this.bankerUID;
};

model.getBBUID = function () {
	return this.bigBlindUid;
};

model.getSBUID = function () {
	return this.littleBlindUid;
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
		if (this.roomUserInfoArr[i].userInfo.uid === user.uid) {
			this.roomUserInfoArr.splice(i, 1);
		}
	}
	this.roomUserInfoArr.push(user);
};

model.delUser = function (user) {
	if (!this.roomUserInfoArr) return;
	for (let i = 0; i < this.roomUserInfoArr.length; ++i) {
		if (this.roomUserInfoArr[i].userInfo.uid == user.uid) {
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
	// console.log('创建者', this.roomCreatorInfo);
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

model.getCurOperateUID = function () {
	return this.curOperateUid || null;
}

model.checkIsMyTurn = function () {
	let uid = UserModel.getData('uid');
	return this.curOperateUid == uid && this.checkInSeat();
}

model.getUserEndCardsByUID = function (uid) {
	this.userEndCards = this.userEndCards || [];
	let endCards = null;
	for (const fen of this.userEndCards) {
		if (!fen) continue;
		if (fen.uid === uid) {
			endCards = fen;
			break;
		}
	}
	return endCards;
}

model.getUserHandCardsByUID = function (uid) {
	this.handCards = this.handCards || {};
	// console.log('获取牌组', this.handCards[uid]);
	return this.handCards[uid] || [];
}

model.getUserHandCardsTypeByUID = function (uid) {
	this.handCardsType = this.handCardsType || {};
	return this.handCardsType[uid] || {};
}

model.getUserHandCardsTypeNameByUID = function (uid) {
	this.handCardsType = this.handCardsType || {};
	let cardTypeInfo = this.handCardsType[uid] || {};
	return this.getCardTypeName(cardTypeInfo.cardType);
}

model.getCardTypeName = function (cardType) {
	let cardTypeName = '高牌';
	if (cardType == ApiDzpk.cardType.royalFlush) {
		cardTypeName = '皇家同花顺';
	} else if (cardType == ApiDzpk.cardType.sequence) {
		cardTypeName = '同花顺';
	} else if (cardType == ApiDzpk.cardType.fourOfAKind) {
		cardTypeName = '四条';
	} else if (cardType == ApiDzpk.cardType.gourd) {
		cardTypeName = '葫芦';
	} else if (cardType == ApiDzpk.cardType.flush) {
		cardTypeName = '同花';
	} else if (cardType == ApiDzpk.cardType.straight) {
		cardTypeName = '顺子';
	} else if (cardType == ApiDzpk.cardType.Sanjo) {
		cardTypeName = '三条';
	} else if (cardType == ApiDzpk.cardType.twoPairs) {
		cardTypeName = '两对';
	} else if (cardType == ApiDzpk.cardType.twain) {
		cardTypeName = '对子';
	}
	return cardTypeName;
}

model.getUserTotalScoreByUID = function (uid) {
	// console.log('玩家分数', uid, this.userTotalScore);
	this.userTotalScore = this.userTotalScore || {};
	return this.userTotalScore[uid] || 0;
}

model.getUserPourScoreByUID = function (uid) {
	this.userPourScore = this.userPourScore || {};
	return this.userPourScore[uid] || 0;
}

model.getUserTurnPourScoreByUID = function (uid) {
	this.userTurnPourScore = this.userTurnPourScore || {};
	return this.userTurnPourScore[uid] || 0;
}

model.getUserPourScores = function () {
	this.userPourScore = this.userPourScore || {};
	return this.userPourScore;
}

model.getNeedPourScoreByUID = function (uid) {
	// console.log('获取玩家最低下注分', uid, this.curScore);
	this.curScore = this.curScore || {};
	let needPourScore = this.curScore[uid] || 0;
	return parseInt(needPourScore);
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

model.getPubCards = function () {
	return this.publicCards || [];
}

model.getOperateTypeName = function (type) {
	let opName = '未知';
	if (type == ApiDzpk.operateType.CANCEL) {
		opName = '弃牌';
	} else if (type == ApiDzpk.operateType.DA) {
		opName = '加注';
	} else if (type == ApiDzpk.operateType.GEN) {
		opName = '跟注';
	} else if (type == ApiDzpk.operateType.QIAO) {
		opName = '全下';
	} else if (type == ApiDzpk.operateType.XIU) {
		opName = '过牌';
	}
	return opName;
}

model.isInSeat = function () {
	return this.getMyChairID() < this.getChairCount();
}

model.getPools = function () {
	return this.basePools || [];
}

model.getBaseRaise = function () {
	let scores = [1 / 4, 1 / 3, 1 / 2, 2 / 3, 1];
	let rates = ['1/4', '1/3', '1/3', '2/3', '全下'];
	let base = {
		rates: rates,
		scores: scores
	}
	return base;
}

model.getUserDelayTimes = function (uid) {
	this.userDelayTimes = this.userDelayTimes || {};
	return this.userDelayTimes[uid] || 0;
}

model.isMatchMode = function () {
	let isUnionCreate = this.isUnionCreate();
	let unionType = this.getRoomCreatorByKey('unionType');
	let isMatchMode = isUnionCreate && unionType != Enums.UnionType.NORMAL;
	return isMatchMode;
}

model.getPeiScore = function () {
	let peiScore = parseFloat(this.getGameRuleByKey('peiScore'));
	if (isNaN(peiScore)) peiScore = 1000;
	peiScore = Utils.formatNumberWithDecimal(peiScore, 1);
	return peiScore;
}

model.isInWatch = function (uid) {
	uid = uid || UserModel.getData('uid');
	let user = this.getUserByUID(uid);
	let chairCount = this.getChairCount();
	let playStatus = this.getUserPlayStatusByUID(uid);
	let isWatch = !user || user.chairID >= chairCount || playStatus == ApiRoom.playStatus.WATCH;
	return isWatch;
}

model.getBundleType = function () {
	return this.getGameRuleByKey('gameType') || Enums.bundleType.DZPK;
}