const Enums = require('../../../src/const/Enums');
const ApiZgz = require('./ApiZgz');
const ApiRoom = require('../../../src/api/ApiRoom');
const UserModel = require('../../../src/model/UserModel');
const ConfigModel = require('../../../src/model/ConfigModel');
const ZGZGameLogic = require('./ZGZGameLogic');

var model = module.exports;
model.initData = function (gameRule) {
    this.gameRule = gameRule;
    ZGZGameLogic.init(gameRule);
    this.threeRed = [3, 35];
    this.threeAll = [3, 19, 35, 51];
    this.threeColor = ["方", "梅", "红", "黑"];
}
/**初始化数据 */
model.init = function (data) {
    this.reset()
    this.gameInited = true;
    UserModel.setDatas(data);
    this.roomID = data.roomID;
    this.initData(data.gameRule);
    this.tick = data.gameData.tick;
    this.roomUserInfoArr = data.roomUserInfoArr;
    this.roomCreatorInfo = data.roomCreatorInfo;
    this.gameStatus = data.gameData.gameStatus;
    this.gameStarted = data.gameData.gameStarted;
    this.bankerChairID = data.gameData.bankerChairID;
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
    this.setTakingOperate(data.gameData.takingOperate);
    this.setUserWinStatus(data.gameData.userWinStatus);
}

/**每局完成后重置数据 */
model.reset = function () {
    this.setTakingOperate([]);
    this.setUserWinStatus([]);
    ZGZGameLogic.setLiangSan(false);
}

model.setUserWinStatus = function (obj) {
    this.userWinStatus = obj || []
}

model.getUserWinStatus = function (uid) {
    return this.userWinStatus.find(item => item.uid === uid)
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

model.setTick = function (value) {
    this.tick = value;
}

model.getTick = function () {
    return this.tick;
}

model.getRoomID = function () {
    return this.roomID;
}

/**其他玩家加入房间 */
model.otherUserJoinRoom = function (roomUserInfo) {
    this.roomUserInfoArr[roomUserInfo.chairID] = roomUserInfo
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

model.getMyUid = function () {
    return this.myUid;
}

/**是否是联盟创建 */
model.isUnionCreate = function () {
    return (this.roomCreatorInfo && this.roomCreatorInfo.creatorType == Enums.roomCreatorType.UNION_CREATE);
}

/**获取房间创建者的信息 */
model.getRoomCreatorByKey = function (key) {
    return !!this.roomCreatorInfo ? this.roomCreatorInfo[key] : null;
}

/**座位号转换 */
model.getUserChairIndex = function (chairID) {
    return (chairID - this.getMyChairID() + this.gameRule.maxPlayerCount) % this.gameRule.maxPlayerCount;
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
model.getBankerChairID = function () {
    return this.bankerChairID;
};
model.setBankerChairID = function (value) {
    this.bankerChairID = value
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
/**获取手牌 */
model.getHandCards = function (uid) {
    let handCards = this.handCards || {};
    let handlist = handCards[uid] || [];
    if (handlist.length && handlist.includes(3)) { //检测是否亮方块三
        this.checkLiangSan();
        handlist.sort((a, b) => { return ZGZGameLogic.getCardSingleValue(b) - ZGZGameLogic.getCardSingleValue(a) });
    }
    return handlist.slice();
}

/**通知用户操作 */
model.onGameTurn = function (data) {

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

model.isArraysEqual = (a, b) => {
    const sortedA = a.slice().sort();
    const sortedB = b.slice().sort();
    return JSON.stringify(sortedA) === JSON.stringify(sortedB);
}

model.getShowRule = function () {
    let gameRule = this.getGameRule();
    let wanfa = []
    if (gameRule.isShowThree) {
        wanfa.push("[片3必亮]")
    }
    if (gameRule.isShowCardCount) {
        wanfa.push("[显示剩牌]")
    }
    return wanfa.join('\n');
}

/**获取花色》方 梅 红 黑 */
model.getCardColor = function (cardId) {
    return parseInt(cardId / 16);
}

model.setTakingOperate = function (obj) {
    this.takingOperate = obj || [];
    this.checkLiangSan();
}

model.getTakingOperate = function () {
    return this.takingOperate || [];
}

model.checkLiangSan = function () {
    let opeList = this.getTakingOperate();
    for (let index = 0; index < opeList.length; index++) {
        let obj = opeList[index];
        let list = obj.endList || [];
        if (list.includes(3)) {
            ZGZGameLogic.setLiangSan(true);
            return true;
        }
    }
    return false;
}

model.getStatMultiple = function () {
    let rate = 0, opeList = this.getTakingOperate();
    opeList.forEach((obj) => rate += obj.rate || 0);
    return rate;
}

model.getTakingUID = function (uid) {
    let opeList = this.getTakingOperate();
    let str = "", shuObj = null, opeObj = null;
    opeList.forEach((obj) => {
        if (obj.uid == uid) opeObj = obj;
        if (obj.endOperate == ApiZgz.talkType.RENSHU) {
            shuObj = obj;
        }
    })
    if (shuObj) return shuObj.uid == uid ? "[认输]" : str;

    if (opeObj) {
        if (opeObj.endOperate == ApiZgz.talkType.PASS) {
            str += `[不说话]`;
        } else if (opeObj.endOperate == ApiZgz.talkType.ZHA) {
            str += `[扎股子]`;
        }
        let list = opeObj.endList || [];
        list.forEach((id) => {
            let index = this.getCardColor(id);
            str += `[亮${this.threeColor[index]}三]`;
        })
        str = `[${opeObj.rate}倍]`;//只显示倍数
    }
    return str;
}

model.getBrightInfo = function (uid, opeList, gameMode = false) {
    opeList = opeList || this.getTakingOperate();
    let myObj, mylist = [], seList = [], myNum = 0, qtNum = 0;
    let statCount = (cardList) => {
        let count = 0, list = [3, 35];
        cardList.forEach((id) => {
            if (list.includes(id)) {
                count += 1;
            }
        })
        return count;
    }
    opeList.forEach((obj) => {
        if (obj.endOperate) {
            let outList = obj.outList || [];
            let endList = obj.endList || [];
            let putList = endList.concat(outList);
            let newList = Array.from(new Set(putList));
            if (obj.uid === uid) {
                myObj = obj;
                mylist = newList.slice();
                let list = obj.plusInfo.list || [];//出三时检测手里红三数
                myNum = statCount(gameMode && outList.length && list.length ? list : newList);
                newList.forEach((id) => {
                    seList.push(this.getCardColor(id));
                })
            } else {
                qtNum += statCount(newList);
            }
        }
    })

    if (myObj) {
        if (myNum >= 1) {//红
            return { type: 2, mylist, seList, str: `<color=#FF0000>3</c>`, };
        } else if (qtNum > 1 || myObj.endOperate == ApiZgz.talkType.ZHA) {//股
            return { type: 1, mylist, seList, str: `<color=#FFFF00>股</c>`, };
        }
    }
    return { type: 0, mylist, seList, str: `<color=#FFFF00>?</c>`, };
}

model.getBundleType = function () {
    return this.getGameRuleByKey('gameType') || Enums.bundleType.ZGZ;
}