const Enums = require('../../../src/const/Enums');
const ApiTdk = require('./ApiTdk');
const UserModel = require('../../../src/model/UserModel');
const ApiRoom = require('../../../src/api/ApiRoom');
const ConfigModel = require('../../../src/model/ConfigModel');

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
    this.userEndCards = data.gameData.userEndCards;
    this.userOperateStatus = data.gameData.userOperateStatus;
    this.isCurLanGuo = data.gameData.isCurLanGuo
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

/**获取自己是否在游戏中 */
model.getSelfIsPlaying = function () {
    if (!this.roomUserInfoArr || !this.myUid) {
        return false
    }
    for (let i = 0; i < this.roomUserInfoArr.length; ++i) {
        let info = this.roomUserInfoArr[i]
        if (info.userInfo.uid == this.myUid) {
            return info.playStatus == ApiRoom.playStatus.PLAYING
        }
    }
    return false
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
    // console.log('设置玩家属性', uid, key, val);
    for (let index = 0; index < this.roomUserInfoArr.length; index++) {
        if (this.roomUserInfoArr[index].userInfo.uid == uid) {
            this.roomUserInfoArr[index][key] = val;
            break;
        }
    }
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
        ApiRoom.gameMessageNotify(ApiTdk.gameLookCardsNotify(this.getMyChairID()));
    }
}

/**座位号转换 */
model.getUserChairIndex = function (chairID) {
    // console.log("=====", chairID, this.getMyChairID(), this.gameRule.maxPlayerCount)
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
    return this.curBureau;
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
    if (!this.handCards) {
        this.handCards = {}
    }
    return this.handCards[this.myUid]
}

/**通知用户操作 */
model.onGameTurn = function (data) { }

/**用户操作广播 */
model.onUserOpt = function (data) { }

/**获取出的牌 */
model.getOutTiles = function (chairID) {

}

model.setUserScoreList = function (value) {
    this.userScoreList = value
}
model.getUserScoreByChairId = function (chairID) {
    return this.userScoreList[chairID]
}

/**获取是否已经亮牌 */
model.getIsShowCard = function (uid) {
    return this.userEndCards && Array.isArray(this.userEndCards) && this.userEndCards.some(info => info.uid == uid)
}

/**获取是否已经弃牌 */
model.getIsKouPai = function (uid) {
    return this.userOperateStatus && this.userOperateStatus[uid] && this.userOperateStatus[uid] == ApiTdk.operateType.CANCEL
}

/**设置弃牌 */
model.setIsKouPai = function (uid = null) {
    if (!this.userOperateStatus) {
        this.userOperateStatus = {}
    }
    if (uid) {
        this.userOperateStatus[uid] = ApiTdk.operateType.CANCEL
    } else {
        this.userOperateStatus = {}
    }
}

/**获取是否烂锅 */
model.getIsLanGuo = function () {
    return this.isCurLanGuo
}

/**设置是否烂锅 */
model.setIsLanGuo = function (islanguo) {
    this.isCurLanGuo = islanguo
}

/**获取牌数值 */
model.getCardValue = function (cardData) {
    //数值掩码
    let MASK_VALUE = 0x0F; //数值掩码
    if (cardData == 78) {
        return 14
    }
    if (cardData == 79) {
        return 15
    }
    let value = cardData & MASK_VALUE;
    if (value == 1) {
        return 15
    }
    if (value == 2) {
        return 14
    }
    return value
}

/**获取点数之和 */
model.getPointSum = function (idarr) {
    if (!idarr || !Array.isArray(idarr) || idarr.length == 0) {
        return 0
    }
    let sum = 0
    let wangCount = 0
    let group = {}; //按点数分组
    for (let i = 0; i < idarr.length; i++) {
        const id = idarr[i];
        let point = this.getCardValue(id)
        if (id == 78 || id == 79) {
            wangCount++
        } else {
            var arr = group[point];
            if (arr && Array.isArray(arr)) {
                arr.push(id);
            } else {
                group[point] = [];
                group[point].push(id);
            }
        }
        sum += point
    }
    /**2张王多加30分 */
    if (wangCount >= 2) {
        sum += 30
    }
    /**相同的牌有3张 多加30分 相同的牌有4张 多加60分 */
    for (const id in group) {
        if (Object.hasOwnProperty.call(group, id)) {
            const list = group[id];
            if (list.length == 3) {
                sum += 30
            } else if (list.length == 4) {
                sum += 60
            }
        }
    }
    return sum
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

model.isInSeat = function () {
    return this.getMyChairID() < this.getChairCount();
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

model.getUserByUID = function (uid) {
    this.roomUserInfoArr = this.roomUserInfoArr || [];
    let roomUser = this.roomUserInfoArr.find((user) => {
        return user.userInfo.uid == uid;
    });
    return roomUser;
};

model.isInWatch = function (uid) {
    uid = uid || UserModel.getData('uid');
    let user = this.getUserByUID(uid);
    let chairCount = this.getChairCount();
    let isWatch = !user || user.chairID >= chairCount || user.playStatus == ApiRoom.playStatus.WATCH;
    return isWatch;
}

model.getBundleType = function () {
    return this.getGameRuleByKey('gameType') || Enums.bundleType.TDK;
}