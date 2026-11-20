var model = module.exports;
const Enums = require('../../../src/const/Enums');
const ApiEzgdt = require('./ApiEzgdt');
const UserModel = require('../../../src/model/UserModel');
const ApiRoom = require('../../../src/api/ApiRoom');
const ConfigModel = require('../../../src/model/ConfigModel');
const Utils = require('../../../src/utils/Utils');

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
    this.userTrustArray = data.gameData.userTrustArray;
    this.result = data.gameData.result;
    this.userScoreList = data.gameData.userScoreList
    this.myUid = UserModel.getData('uid');
    this.robBankList = data.gameData.robBankList || []
}

/**每局完成后重置数据 */
model.reset = function () {
    this.robBankList = []
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
/**
 * 获取玩家调试
 * @param {*} uid 不传入默认自己
 * @returns 
 */
model.getUserTest = function (userUid) {
    if (!userUid || userUid == UserModel.getData('uid')) {
        return !!UserModel.getData('isTest');
    }
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
        ApiRoom.gameMessageNotify(ApiEzgdt.gameLookCardsNotify(this.getMyChairID()));
    }
}

/**座位号转换 */
model.getUserChairIndex = function (chairID) {
    let myChairID = this.getMyChairID()
    if (myChairID >= this.getChairCount()) {
        myChairID = 0
    }
    return (chairID - myChairID + this.gameRule.maxPlayerCount) % this.gameRule.maxPlayerCount;
}

/**座位号转换 */
model.getUserIndexByUID = function (uid) {
    let user = this.getUserByUID(uid);
    let chairID = user.chairID >= 0 ? user.chairID : 0;
    return this.getUserChairIndex(chairID);
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
    return this.getGameRuleByKey("maxPlayerCount")
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
    return this.getGameRuleByKey("bureau")
};

/**设置手牌 */
model.setHandCards = function (value) {
    this.handCards = value
}

/**获取自己的手牌 */
model.getMyHandCard = function () {
    return this.handCards[this.myUid]
}

/**通知用户操作 */
model.onGameTurn = function (data) {
    // if (data.card != null && data.operateArray.indexOf(ApiJgttz.operateType.QI) != -1) {
    //     this.handCards[data.chairID].push(data.card);
    // }
    // this.curChairID = data.chairID;
}

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
 * 分数状态
 * @returns 0》不操作、1》大厅和普通场、2》比赛场统计
 */
model.scoreState = function () {
    if (!!ConfigModel.getData('openGameScoreStatsForced')) return 1;
    if (!!this.roomCreatorInfo) {
        let creatorType = this.roomCreatorInfo.creatorType;
        if (creatorType == Enums.roomCreatorType.USER_CREATE) {//玩家创建
            return 1;
        } else if (creatorType == Enums.roomCreatorType.UNION_CREATE) {//联盟创建
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
    return this.getGameRuleByKey('gameType') || Enums.bundleType.EZGDT;
}

/**获取赖子变的牌 */
model.getBianCard = function (qian, hou) {
    let isBian = this.getGameRuleByKey("wangType") == 1 && !Utils.deepEqual(qian, hou)
    let bianId = []
    if (isBian) {
        hou.forEach(id => {
            if (qian.every(id1 => id1 != id)) {
                bianId.push(id)
            }
        });
    }
    return bianId
}

/**转换牌型和点数 */
model.changeTypeAndPoint = function (t, p) {
    let type = t
    let point = p
    if (t <= ApiEzgdt.cardType.JIU_DIAN) {
        type = 0
    } else {
        if (t == ApiEzgdt.cardType.DUI_WANG) {
            point = 14
        }
        type = 1
    }
    return { type, point }
}

/**规则拼接 */
model.getRuleStr = function () {
    let gameRule = this.gameRule
    if (!gameRule) return ""
    let guize = [`底分${gameRule.baseScore}`]
    if (gameRule.bankerType == 1) guize.push("轮庄")
    if (gameRule.bankerType == 2) guize.push("抢庄")
    if (gameRule.bankerType == 3) guize.push("霸王庄")
    if (gameRule.isSamePing == 1) guize.push("同点数庄家赢")
    if (gameRule.isSamePing == 2) guize.push("同点数平局")
    if (gameRule.isSamePing == 3) guize.push("同点数庄家输")
    if (gameRule.wangType == 1) guize.push("王当任意")
    if (gameRule.wangType == 2) guize.push("大王2点,小王1点")

    return guize.join('，')
}

model.getUserSexByUid = function (uid) {
    let user = this.getUserByUID(uid);
    let sex = user && user.userInfo.sex == 0 ? 'nan' : 'nv';
    return sex;
}