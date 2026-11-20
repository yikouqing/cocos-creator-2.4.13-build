const Enums = require('../../../src/const/Enums');
const ApiMjnn = require('./ApiMjnn');
const UserModel = require('../../../src/model/UserModel');
const ConfigModel = require('../../../src/model/ConfigModel');
const ApiRoom = require('../../../src/api/ApiRoom');
const Utils = require('../../../src/utils/Utils');

var model = module.exports;

/**初始化数据 */
model.init = function (data) {
    this.reset()
    this.gameInited = true;
    UserModel.setDatas(data);
    this.roomUserInfoArr = data.roomUserInfoArr;
    this.gameRule = data.gameRule;
    this.roomID = data.roomID;
    this.roomCreatorInfo = data.roomCreatorInfo;
    this.gameStatus = data.gameData.gameStatus;
    this.gameStarted = data.gameData.gameStarted;
    this.tick = data.gameData.tick;
    this.bankerUid = data.gameData.bankerUid;
    this.handCards = data.gameData.handCards;
    this.curBureau = data.gameData.curBureau;
    this.maxBureau = data.gameData.maxBureau;
    this.chairCount = data.gameData.chairCount;
    this.userTrustArray = data.gameData.userTrustArray;
    this.result = data.gameData.result;
    this.userScoreList = data.gameData.userScoreList
    this.myUid = UserModel.getData('uid');
    this.curOperateUid = data.gameData.curOperateUid;
    this.operateRecords = data.gameData.operateRecords;
    this.tuizhu = data.gameData.tuizhu;
    this.userBetScore = data.gameData.userBetScore;
    this.robBankList = data.gameData.robBankList;
    this.showCardsUser = data.gameData.showCardsUser;
    this.canPourScores = data.gameData.canPourScores;
}

/**每局完成后重置数据 */
model.reset = function () {

}

/**清理所有数据 */
model.resetAll = function () {
    this.reset()
    this.gameInited = false
}

/**游戏状态 */
model.getGameStatus = function () {
    return this.gameStatus
}
model.setGameStatus = function (value) {
    this.gameStatus = value
}

model.getRoomID = function () {
    return this.roomID;
}

model.getMyUID = function () {
    return this.myUid;
}

model.canUseTest = function () {
    let isInSeat = this.isInSeat();
    let isTest = UserModel.getData("isTest");
    return !!isInSeat && !!isTest;
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

/**获取自己的座位号 */
model.getMyChairID = function () {
    if (!this.roomUserInfoArr) return null;
    let myChairID = null;
    for (let i = 0; i < this.roomUserInfoArr.length && myChairID == null; ++i) {
        if (this.roomUserInfoArr[i].userInfo.uid == this.myUid) {
            myChairID = this.roomUserInfoArr[i].chairID;
        }
    }
    return myChairID;
};

/**获取自己是否在游戏中 不传uid则默认查自己 */
model.isPlaying = function (uid = null) {
    uid = uid || this.myUid;
    let isPlaying = false;
    let user = this.getUserByUID(uid);
    if (!user) return isPlaying;
    isPlaying = user.playStatus == ApiRoom.playStatus.PLAYING;
    return isPlaying;
}

//判断玩家在不在座位zhong
model.isInSeat = function (uid = null) {
    uid = uid || this.myUid;
    let isInSeat = false;
    let user = this.getUserByUID(uid);
    if (!user) return isInSeat;
    let maxPlayerCount = this.getChairCount()
    return user.chairID < maxPlayerCount;
}

/**更新自己的遊戲狀態 */
model.updateUserPlayStatus = function (userPlayStatus) {
    if (!this.roomUserInfoArr) return;
    this.roomUserInfoArr.forEach((user, index, users) => {
        this.roomUserInfoArr[index].playStatus = userPlayStatus[user.userInfo.uid];
    });
}

model.updateUserProperties = function (user) {
    if (!this.roomUserInfoArr || !user) return;
    let userIndex = this.roomUserInfoArr.findIndex((item) => {
        return item.userInfo.uid == user.uid;
    });
    if (userIndex == -1) return;
    for (const key in user) {
        if (Object.hasOwnProperty.call(this.roomUserInfoArr[userIndex].userInfo, key)) {
            this.roomUserInfoArr[userIndex].userInfo[key] = user[key];
        }
    }
}

//获取玩家分数
model.getUserScore = function (uid) {
    let user = this.getUserByUID(uid);
    if (!user || !user.userInfo) return 0;
    return user.userInfo.score;
}

model.onUserChangeSeat = function (user) {
    let userIndex = this.roomUserInfoArr.findIndex((item) => {
        return item.userInfo.uid == user.uid;
    });
    if (userIndex == -1) return;
    this.roomUserInfoArr[userIndex].chairID = user.toChairID;
    this.roomUserInfoArr[userIndex].userStatus = user.userStatus;
}

/**是否是联盟创建 */
model.isUnionCreate = function () {
    return (this.roomCreatorInfo && this.roomCreatorInfo.creatorType == Enums.roomCreatorType.UNION_CREATE);
}

/**获取房间创建者的信息 */
model.getRoomCreatorByKey = function (key) {
    return !!this.roomCreatorInfo ? this.roomCreatorInfo[key] : null;
}

/**显示测试功能 */
model.showTestCard = function () {
    let tmp = UserModel.getData("isTest")
    if (tmp) {
        ApiRoom.gameMessageNotify(ApiMjnn.gameLookCardsNotify(this.getMyChairID()));
    }
}

model.getUserByUID = function (uid) {
    this.roomUserInfoArr = this.roomUserInfoArr || [];
    let roomUser = this.roomUserInfoArr.find((user) => {
        return user.userInfo.uid == uid;
    });
    return roomUser;
};

model.getUserPlayStatus = function (uid = null) {
    uid = uid || this.myUid;
    let user = this.getUserByUID(uid);
    if (!user) return null;
    return user.playStatus;
}

/**座位号转换 */
model.getUserChairIdx = function (chairID) {
    let myChairID = this.getMyChairID()
    let chairCount = this.getChairCount()
    if (isNaN(myChairID) || myChairID >= chairCount || myChairID < 0) myChairID = 0;
    let chairIdx = (chairID - myChairID + chairCount) % chairCount;
    return chairIdx;
}

model.getUserChairIdxByUID = function (uid) {
    let user = this.getUserByUID(uid);
    let chairIdx = -1;
    if (!user) return chairIdx;
    chairIdx = this.getUserChairIdx(user.chairID);
    return chairIdx;
}

/**获取创建的游戏规则 */
model.getGameRule = function () {
    return this.gameRule;
};

/**获取游戏规则 */
model.getGameRuleByKey = function (key) {
    this.gameRule = this.gameRule || {};
    return this.gameRule[key];
}

/**获取房间最大人数 */
model.getChairCount = function () {
    return this.chairCount || this.getGameRuleByKey('maxPlayerCount');
};

/**获取庄家座位号 */
model.getBankerUID = function () {
    return this.bankerUid;
};

model.setBankerUID = function (value) {
    this.userBetScore = {};
    this.bankerUid = value;
}

model.isBanker = function (uid) {
    return this.bankerUid == uid;
}

/**获取当前操作位置 */
model.getCurOptChairID = function () {
    return this.curChairID;
};

/**获取当前局数 */
model.getCurBureau = function () {
    return this.curBureau;
};

/**设置当前局数 */
model.setCurBureau = function (value) {
    //更新局数时需清除上局数据
    this.userBetScore = null;
    this.robBankList = null;
    this.userBetScore = null;
    this.showCardsUser = null;
    this.bankerUid = null;
    this.curBureau = value;
}

model.onUserRobOpt = function (user) {
    this.robBankList = this.robBankList || [];
    let userIndex = this.robBankList.findIndex((item) => {
        return item.uid == user.uid;
    });
    if (userIndex != -1) {
        this.robBankList[userIndex] = user;
        return;
    }
    this.robBankList.push(user);
}

model.getUserRob = function (uid) {
    this.robBankList = this.robBankList || [];
    let user = this.robBankList.find((rob) => {
        return rob.uid == uid;
    });
    return user;
}

/**获取最大局数 */
model.getMaxBureau = function () {
    return this.maxBureau;
};

/**设置手牌 */
model.setHandCards = function (value) {
    // console.log("获取玩家手牌-发牌", value)
    this.handCards = value;
}

//获取玩家手牌
model.getUserCards = function (uid) {
    this.handCards = this.handCards || {};
    let handCards = null;
    if (!!this.handCards[uid]) {
        handCards = this.handCards[uid].slice();
    }
    return handCards;
}

//获取手牌数据
model.getHandCards = function (params) {
    this.handCards = this.handCards || {};
    return this.handCards;
}

/**通知用户操作 */
model.onGameTurn = function (user) { }

model.getShowCards = function (uid) {
    this.showCardsUser = this.showCardsUser || [];
    let show = this.showCardsUser.find((user, index, users) => {
        return user.uid == uid;
    });
    return show;
}

model.setShowCards = function (show) {
    this.showCardsUser = this.showCardsUser || [];
    let userIndex = this.showCardsUser.findIndex((user, index, users) => {
        return user.uid == show.uid;
    });
    this.handCards = this.handCards || {};
    this.handCards[show.uid] = show.cards; //可能会涉及到手牌排序  先存着
    if (userIndex != -1) {
        this.showCardsUser[userIndex] = show;
    } else {
        this.showCardsUser.push(show);
    }
}

/**用户操作广播 */
model.onUserOpt = function (user) {

}

//玩家下分操作推送
model.onUserPourOpt = function (user) {
    this.bankerUid = user.bankerUid;
    this.canPourScores = user.canPourScores;
    this.tuizhu = user.tuizhu;
}

model.onUserBetOpt = function (user) {
    if (!user) return;
    this.userBetScore = this.userBetScore || {};
    this.userBetScore[user.uid] = user.score;
}

model.getBetScore = function (uid) {
    this.userBetScore = this.userBetScore || {};
    return this.userBetScore[uid];
}

/**获取出的牌 */
model.getOutTiles = function (chairID) {

}

model.setUserScoreList = function (value) {
    this.userScoreList = value
}

model.isCanTui = function (uid) {
    this.tuizhu = this.tuizhu || {};
    return this.tuizhu[uid];
}

model.getCanPourScores = function () {
    this.canPourScores = this.canPourScores || [];
    let pourScores = this.canPourScores.slice();
    return pourScores;
}

model.getUserScoreByChairId = function (chairID) {
    return this.userScoreList[chairID]
}

model.getMahJongBackUrl = function (root) {
    let cardbg = ConfigModel.getCardBackId(Enums.cardStyleType.MAHJONG);
    let url = `res/sprite/mj/back/${root}${cardbg}`;
    return url;
}

model.getMahJongFlowerUrl = function (root, cardId) {
    let url = `res/sprite/mj/flower/${root}${cardId}`;
    return url;
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
    return this.getGameRuleByKey('gameType') || Enums.bundleType.MJNN;
}