const Enums = require('../../../src/const/Enums');
const ApiYdr = require('./ApiYdr');
const UserModel = require('../../../src/model/UserModel');
const ConfigModel = require('../../../src/model/ConfigModel');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const YDRLogic = require("./YDRLogic")

var model = module.exports;
/**初始化数据 */
model.init = function (data) {
    // console.log('游戏初始化====================', data);
    this.reset();
    UserModel.setDatas(data);
    this.gameInited = true;
    this.roomUserInfoArr = data.roomUserInfoArr;
    this.gameRule = data.gameRule;
    this.roomID = data.roomID;
    this.bankerUid = data.gameData.bankerUid;
    this.roomCreatorInfo = data.roomCreatorInfo;
    this.gameStatus = data.gameData.gameStatus;
    this.gameStarted = data.gameData.gameStarted;
    this.tick = data.gameData.tick;
    this.bankerChairID = data.gameData.bankerChairID;
    this.handCards = data.gameData.handCards;
    this.curBureau = data.gameData.curBureau;
    this.maxBureau = data.gameData.maxBureau;
    this.chairCount = data.gameData.chairCount;
    this.userTrustArray = data.gameData.userTrustArray;
    this.result = data.gameData.result;
    this.curChairID = data.gameData.curChairID;
    this.operateUid = data.gameData.operateUid;
    this.lastOperateUid = data.gameData.lastOperateUid;
    this.operateCard = data.gameData.operateCard;
    this.curScores = data.gameData.curScores;
    this.restCardsCount = data.gameData.restCardsCount;
    this.userScoreList = data.gameData.userScoreList || {};
    this.myUid = UserModel.getData('uid');
    this.operateRecords = data.gameData.operateRecords || [];
}

/**每局完成后重置数据 */
model.reset = function () {
    this.lastOperateUid = null;
    this.operateRecords = [];
    this.curChairID = null;
}

/**清理所有数据 */
model.resetAll = function () {
    this.reset();
    this.gameInited = false;
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

/**其他玩家加入房间 */
model.otherUserJoinRoom = function (user) {
    this.roomUserInfoArr = this.roomUserInfoArr || [];
    let isTakeSeat = false;
    for (let index = 0; index < this.roomUserInfoArr.length; index++) {
        if (!this.roomUserInfoArr[index]) continue;
        if (this.roomUserInfoArr[index].userInfo.uid == user.uid) {
            this.roomUserInfoArr[index] = user;
            isTakeSeat = true;
            break;
        }
    }
    if (!!isTakeSeat) return;
    this.roomUserInfoArr.push(user);
}

/**获取自己的座位号 */
model.getMyChairID = function () {
    if (!this.roomUserInfoArr) return null;
    let myChairID = null;
    for (let i = 0; i < this.roomUserInfoArr.length; ++i) {
        if (this.roomUserInfoArr[i].userInfo.uid == this.myUid) {
            myChairID = this.roomUserInfoArr[i].chairID;
            break;
        }
    }
    return myChairID;
};

model.getMyUID = function () {
    return UserModel.getData('uid');
}

model.getUserByUID = function (uid) {
    this.roomUserInfoArr = this.roomUserInfoArr || [];
    let roomUser = this.roomUserInfoArr.find((user) => {
        return user.userInfo.uid == uid;
    });
    return roomUser;
};

model.getUserByChairID = function (chairID) {
    this.roomUserInfoArr = this.roomUserInfoArr || [];
    let user = {};
    for (const item of this.roomUserInfoArr) {
        if (!item) continue;
        if (item.chairID != chairID) continue;
        user = item;
        break;
    }
    return user;
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
model.getUserIndexByChairID = function (chairID) {
    return (chairID - this.getMyChairID() + this.gameRule.maxPlayerCount) % this.gameRule.maxPlayerCount;
}

model.getUsers = function () {
    return this.roomUserInfoArr || [];
}

/**座位号转换 */
model.getUserIndexByUID = function (uid) {
    let user = this.getUserByUID(uid);
    let chairID = user.chairID >= 0 ? user.chairID : 0;
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
    return this.gameRule.maxPlayerCount;
};

/**获取庄家座位号 */
model.getBankerChairID = function () {
    return this.bankerChairID;
};

model.getBankerUid = function () {
    return this.bankerUid;
}

model.setBankerChairID = function (value) {
    this.bankerChairID = value
}

model.setBankerUID = function (value) {
    this.bankerChairID = value
}

/**获取当前操作位置 */
model.getCurOptChairID = function () {
    return this.curChairID;
};

/**获取当前操作位置 */
model.getCurOptUID = function () {
    return this.operateUid;
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
    this.handCards = value;
}

model.setHandCardsByUID = function (uid, value) {
    this.handCards = this.handCards || {};
    this.handCards[uid] = value;
}

/**获取手牌 */
model.getHandCards = function (uid) {
    this.handCards[uid] = this.handCards[uid] || [];
    let copyHandCards = Utils.deepCopy(this.handCards[uid]);
    let baiPaiList = YDRLogic.getBaiPaiList(copyHandCards)
    return baiPaiList || []
}

/**获取陀数 */
model.getTuoShuByUid = function (uid) {
    let num = 0
    let opts = this.getOptCardByUid(uid)
    if (opts && opts.length > 0) {
        opts.forEach(list => {
            num += YDRLogic.getCardTuo(list)
        });
        // console.log("获取陀数==", opts, num, uid)
    }
    return num
}


/**通知用户操作 */
model.onGameTurn = function (data) {

}

/**用户操作广播 */
model.onUserOpt = function (data) {
    this.operateRecords.push(data)
    let optUid = data.uid
    let handCards = this.handCards[optUid]
    let optCheckList = [ApiYdr.operateType.CHI, ApiYdr.operateType.PENG, ApiYdr.operateType.SHA, ApiYdr.operateType.TUHUO]
    /**删除手牌 */
    if (data.operate == ApiYdr.operateType.QI) { //出牌
        let delIdx = handCards.indexOf(data.card)
        if (delIdx != -1) {
            handCards.splice(delIdx, 1)
        }
    } else if (optCheckList.includes(data.operate)) {
        let plusInfo = Utils.deepCopy(data.plusInfo)
        if (plusInfo && plusInfo.cardList && plusInfo.cardList.length > 0) {
            let list = plusInfo.cardList
            handCards.push(data.card) //把额外的牌先放进手牌
            while (list.length > 0) {
                let id = list.pop()
                let delIdx = handCards.indexOf(id)
                if (delIdx != -1) {
                    handCards.splice(delIdx, 1)
                }
            }
        }
    } else if (data.operate == ApiYdr.operateType.GET) {
        handCards && handCards.push(data.card)
    } else if (data.operate == ApiYdr.operateType.TOU) {
        let touCards = data.plusInfo.touCards
        if (touCards && touCards.length > 0) {
            touCards.forEach(cardId => {
                handCards.push(cardId)
            });
        }
    }
}

/**获取操作的牌 */
model.getOptCardByUid = function (uid) {
    let optCheckList = [ApiYdr.operateType.CHI, ApiYdr.operateType.PENG, ApiYdr.operateType.SHA, ApiYdr.operateType.TUHUO]
    let optList = this.operateRecords.filter(optInfo => optInfo.uid == uid && optCheckList.includes(optInfo.operate))
    let res = []
    for (let i = 0; i < optList.length; i++) {
        const plusInfo = optList[i].plusInfo;
        if (plusInfo && plusInfo.cardList && Array.isArray(plusInfo.cardList)) {
            res.push(plusInfo.cardList.slice())
        }
    }
    return res
}

/**获取丢在桌子上的牌 */
model.getTableCardByUid = function (uid) {
    let outList = this.operateRecords.filter(data => data.uid == uid && data.operate == ApiYdr.operateType.DIU)
    let res = []
    for (let i = 0; i < outList.length; i++) {
        const info = outList[i];
        res.push(info.card)
    }
    return res
}

model.setUserScores = function (value) {
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

model.setMoveCard = function (value) {
    this.moveCard = value;
}

model.getMoveCard = function () {
    return this.moveCard;
}

model.getBundleType = function () {
    return this.getGameRuleByKey('gameType') || Enums.bundleType.YDR;
}