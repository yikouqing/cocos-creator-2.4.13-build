var model = module.exports;
const Enums = require('../../../src/const/Enums');
const ApiCnjj = require('./ApiCnjj');
const UserModel = require('../../../src/model/UserModel');
const ApiRoom = require('../../../src/api/ApiRoom');
const ConfigModel = require('../../../src/model/ConfigModel');

/**初始化数据 */
model.init = function (data) {
    this.reset()
    this.gameInited = false
    UserModel.setDatas(data);
    this.roomUserInfoArr = data.roomUserInfoArr;
    this.gameRule = data.gameRule;
    this.roomID = data.roomID;
    this.roomCreatorInfo = data.roomCreatorInfo;
    this.gameStatus = data.gameData.gameStatus;
    this.gameStarted = data.gameData.gameStarted;
    this.tick = data.gameData.tick;
    this.totalTick = data.gameData.totalTick;
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
    this.teShuType = data.gameData.teShuType
    this.mapai = data.gameData.mapai
    this.showCardsUser = data.gameData.showCardsUser || []
    this.gameInited = true;
    this.autoCards = data.gameData.autoCards
    this.showUserList = data.gameData.showUserList
    this.userPourList = data.gameData.userPourList
    this.seatUser = data.gameData.seatUser
    this.guoBaseScore = data.gameData.guoBaseScore
}

/**每局完成后重置数据 */
model.reset = function () {
    this.showUserList = []
    this.userPourList = []
    this.seatUser = []
    this.guoBaseScore = 0
}

/**清理所有数据 */
model.resetAll = function () {
    this.reset()
    this.gameInited = false
}

model.setPourList = function (value) {
    this.userPourList = value || []
}

/**获取下注金额 */
model.getPourScoreByUid = function (uid) {
    if (!this.userPourList || this.userPourList.length == 0) {
        return 0
    }
    for (let i = 0; i < this.userPourList.length; i++) {
        const pourInfo = this.userPourList[i];
        if (pourInfo.uid == uid) {
            return pourInfo.score
        }
    }
    return 0
}

/**获取自己是否买马 */
model.getSelfIsMaiMa = function () {
    if (!this.userPourList || this.userPourList.length == 0) {
        return false
    }
    for (let i = 0; i < this.userPourList.length; i++) {
        const pourInfo = this.userPourList[i];
        if (pourInfo.isWatch && pourInfo.uid == this.myUid) {
            return true
        }
    }
    return false
}

/**获取当前uid买马总额 */
model.getMaiMaScoreByUid = function (uid) {
    if (!this.userPourList || this.userPourList.length == 0) {
        return 0
    }
    let sum = 0
    for (let i = 0; i < this.userPourList.length; i++) {
        const pourInfo = this.userPourList[i];
        if (pourInfo.isWatch && pourInfo.watchUid == uid) {
            sum += pourInfo.score
        }
    }
    return sum
}

model.setSeatUser = function (value) {
    this.seatUser = value || []
}

model.getMen = function (uid) {
    return this.seatUser.indexOf(uid)
}

model.getGuoDi = function () {
    return this.guoBaseScore
}

model.setGuoDi = function (value) {
    this.guoBaseScore = value || 0
}

/**获取是否已经亮牌 */
model.isShowCard = function (uid) {
    if (!this.showUserList) {
        return false
    }
    return this.showUserList.some(info => info.uid == uid)
}

/**添加亮牌数据 */
model.addShowCardInfo = function (value) {
    this.showUserList = this.showUserList || []
    if (this.showUserList.every(info => info.uid != value.uid)) {
        this.showUserList.push(value)
    }
}

/**游戏状态 */
model.getGameStatus = function () {
    return this.gameStatus
}
model.setGameStatus = function (data) {
    this.gameStatus = data.gameStatus
    this.tick = data.tick
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

model.getUserByUID = function (uid) {
    this.roomUserInfoArr = this.roomUserInfoArr || [];
    let roomUser = this.roomUserInfoArr.find((user) => {
        return user.userInfo.uid == uid;
    });
    return roomUser;
};

model.getRoomID = function () {
    return this.roomID;
}

model.addUser = function (user) {
    this.roomUserInfoArr = this.roomUserInfoArr || [];
    for (var i = 0; i < this.roomUserInfoArr.length; ++i) {
        if (this.roomUserInfoArr[i].userInfo.uid === user.uid) {
            this.roomUserInfoArr.splice(i, 1);
        }
    }
    this.roomUserInfoArr.push(user);
    //  console.log("addUser", this.roomUserInfoArr)
};

model.delUser = function (uid) {
    if (!this.roomUserInfoArr) return;
    for (let i = 0; i < this.roomUserInfoArr.length; ++i) {
        if (this.roomUserInfoArr[i].userInfo.uid == uid) {
            this.roomUserInfoArr.splice(i, 1);
            break;
        }
    }
    // console.log("delUser", this.roomUserInfoArr)
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

/**设置特殊牌型 */
model.setTeShuType = function (v) {
    this.teShuType = v
}
/**获取特殊牌型 */
model.getTeShuType = function () {
    return this.teShuType || 0
}
/**设置马牌 */
model.setMaPai = function (v) {
    this.mapai = v
}
/**获取特殊牌型 */
model.getMaPai = function () {
    return this.mapai
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

/**获取自己的座位号 */
model.getMyChairID = function () {
    if (!this.roomUserInfoArr) {
        return null
    }
    let myChairID = null;
    for (let i = 0; i < this.roomUserInfoArr.length && myChairID == null; ++i) {
        if (this.roomUserInfoArr[i].userInfo.uid == this.myUid) {
            myChairID = this.roomUserInfoArr[i].chairID;
        }
    }
    return myChairID;
};

model.getMyScore = function () {
    if (!this.roomUserInfoArr) {
        return null
    }
    let unionType = this.getRoomCreatorByKey('unionType');
    if (unionType == Enums.UnionType.NORMAL) {
        return 0;
    }
    let myScore = 0
    for (let i = 0; i < this.roomUserInfoArr.length && myScore == 0; ++i) {
        if (this.roomUserInfoArr[i].userInfo.uid == this.myUid) {
            myScore = this.roomUserInfoArr[i].userInfo.score;
        }
    }
    return myScore
}

/**获取自己是否在游戏中 */
model.getSelfIsPlaying = function () {
    if (!this.roomUserInfoArr || !this.myUid) {
        return false
    }
    for (let i = 0; i < this.roomUserInfoArr.length; ++i) {
        let info = this.roomUserInfoArr[i]
        if (info.userInfo.uid == this.myUid) {
            return info.playStatus == ApiRoom.playStatus.PLAYING && info.chairID < this.getChairCount()
        }
    }
    return false
}

/**用户信息改变 */
model.userInfoChange = function (data) {
    let userInfo = this.getUserByUID(data.changeInfo.uid)
    if (!userInfo) {
        return
    }
    if (userInfo.userInfo.uid == data.changeInfo.uid) {
        for (let key in data.changeInfo) {
            userInfo.userInfo[key] = data.changeInfo[key];
        }
    }
}

/**更新自己的遊戲狀態 */
model.updateUserPlayStatus = function (userPlayStatus) {
    if (!this.roomUserInfoArr) {
        return
    }
    for (let i = 0; i < this.roomUserInfoArr.length; ++i) {
        let info = this.roomUserInfoArr[i]
        info.playStatus = userPlayStatus[info.userInfo.uid]
    }
}

model.setUserPropertyByUID = function (uid, key, val) {
    for (let index = 0; index < this.roomUserInfoArr.length; index++) {
        if (this.roomUserInfoArr[index].uid == uid) {
            this.roomUserInfoArr[index][key] = val;
        }
    }
}

model.getAllUsers = function () {
    return this.roomUserInfoArr || []
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
        ApiRoom.gameMessageNotify(ApiCnjj.gameLookCardsNotify(this.getMyChairID()));
    }
}

/**座位号转换 */
model.getUserIndexByUID = function (uid) {
    let user = this.getUserByUID(uid);
    if (!user) return 0
    let chairID = user.chairID >= 0 ? user.chairID : 0;
    return this.getUserIndexByChairID(chairID);
}

/**座位号转换 */
model.getUserIndexByChairID = function (chairID) {
    if (!this.gameInited || !this.gameRule || !this.gameRule.maxPlayerCount) {
        return -1
    }
    let myChairID = this.getMyChairID()
    if (myChairID >= this.getChairCount()) {
        myChairID = 0
    }
    return (chairID - myChairID + this.gameRule.maxPlayerCount) % this.gameRule.maxPlayerCount;
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
    return this.chairCount;
};

/**获取庄家座位号 */
model.getBankerUid = function () {
    return this.bankerUid;
};
model.setBankerUid = function (value) {
    this.bankerUid = value
}

/**获取当前操作位置 */
model.getCurOptChairID = function () {
    return this.curChairID;
};

/**获取当前局数 */
model.getCurBureau = function () {
    return this.gameStarted ? this.curBureau + 1 : this.curBureau;
};
/**设置当前局数 */
model.setCurBureau = function (value) {
    this.curBureau = value
}

/**获取最大局数 */
model.getMaxBureau = function () {
    return this.maxBureau
};

/**设置手牌 */
model.setHandCards = function (value) {
    this.handCards = value
}

/**获取自己的手牌 */
model.getMyHandCard = function () {
    return this.handCards[this.myUid]
}

model.getHandCardByUid = function (uid) {
    return this.handCards[uid]
}

/**获取用户性别 */
model.getUserSexByUid = function (uid) {
    let user = this.getUserByUID(uid)
    if (!user) {
        return 0
    }
    return user.userInfo.sex
}

/**通知用户操作 */
model.onGameTurn = function (data) {

}

model.getIsPlayingByChairID = function (chairID) {
    let user = this.getUserByChairID(chairID);
    return user && chairID < this.getChairCount() &&
        (user.playStatus == ApiRoom.playStatus.READY ||
            user.playStatus == ApiRoom.playStatus.PLAYING);
};

/**用户操作广播 */
model.onUserOpt = function (data) {

}

/**获取出的牌 */
model.getOutTiles = function (chairID) {

}

model.setUserScoreList = function (value) {
    this.userScoreList = value
}
model.getUserScoreByChairId = function (chairID) {
    return this.userScoreList[chairID]
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
    return this.getGameRuleByKey('gameType') || Enums.bundleType.CNJJ;
}