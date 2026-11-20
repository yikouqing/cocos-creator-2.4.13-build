const Enums = require('../../../src/const/Enums');
const ApiLseqs = require('./ApiLseqs');
const UserModel = require('../../../src/model/UserModel');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const LSEQSLogic = require("./LSEQSLogic")
const ConfigModel = require('../../../src/model/ConfigModel');

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
    this.curGameBureau = data.gameData.curGameBureau;
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
    this.limitCard = null
    this.jiaoList = []
    this.totalHuList = data.gameData.userHuCount || {}
    this.isMyTurn = false;
    this.cusHandList = null;
}

/**每局完成后重置数据 */
model.reset = function () {
    this.lastOperateUid = null;
    this.operateRecords = [];
    this.curChairID = null;
    this.limitCard = null;
    this.jiaoList = []
    this.totalHuList = {}
    this.isMyTurn = false;
    this.cusHandList = null;
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

model.isGameStarted = function () {
    return this.curGameBureau > 0;
}

model.getGameStarted = function () {
    return this.gameStarted;
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
    return this.myUid;
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
    this.bankerUid = value
}

/**获取当前操作位置 */
model.getCurOptChairID = function () {
    return this.curChairID;
};

/**获取当前操作位置 */
model.getCurOptUID = function () {
    return this.operateUid;
};

/**获取当前圈数 */
model.getCurBureau = function () {
    return this.curBureau;
};
/**设置当前圈数 */
model.setCurBureau = function (value) {
    this.curBureau = value
}

/**获取最大圈数 */
model.getMaxBureau = function () {
    return this.maxBureau
};
/**设置当前局数 */
model.setCurGameBureau = function (value) {
    this.curGameBureau = value
}
model.getCurGameBureau = function () {
    return this.curGameBureau
}

/**设置手牌 */
model.setHandCards = function (value) {
    this.handCards = value;
}

model.setHandCardsByUID = function (uid, value) {
    this.handCards = this.handCards || {};
    this.handCards[uid] = value;
}

/**获取手牌 */
model.getHandCards = function (uid, isGetBai = true) {
    this.handCards[uid] = this.handCards[uid] || [];
    let copyHandCards = Utils.deepCopy(this.handCards[uid]);
    if (!isGetBai) return copyHandCards
    let baiPaiList = LSEQSLogic.getBaiPaiList(copyHandCards)
    return baiPaiList || []
}


/**通知用户操作 */
model.onGameTurn = function (data) {
    if (data.operateArray.includes(ApiLseqs.operateType.QI) && data.uid == this.getMyUID()) {
        this.updateJiaoList()
    } else {
        this.jiaoList = []
    }
}

/**用户操作广播 */
model.onUserOpt = function (data) {
    this.operateRecords.push(data)
    this.optCusHandList(Utils.deepCopy(data))
    let optUid = data.uid
    let handCards = this.handCards[optUid]
    let optCheckList = [ApiLseqs.operateType.CHI, ApiLseqs.operateType.DUI, ApiLseqs.operateType.KAI]
    if (data.plusInfo && data.plusInfo.totalHu) { //记录每个人的胡数
        this.totalHuList[data.uid] = data.plusInfo.totalHu
    }
    /**删除手牌 */
    if (data.operate == ApiLseqs.operateType.QI) { //出牌
        let delIdx = handCards.indexOf(data.card)
        if (delIdx != -1) {
            handCards.splice(delIdx, 1)
        }
        this.jiaoList = []
    } else if (optCheckList.includes(data.operate)) {
        let plusInfo = Utils.deepCopy(data.plusInfo)
        if (plusInfo && plusInfo.cardList && plusInfo.cardList.length > 0) {
            let list = plusInfo.cardList
            handCards.push(data.card) //把额外的牌先放进手牌
            LSEQSLogic.delIds(list, handCards) //删除手牌中的牌
        }
        if (plusInfo && plusInfo.baiList && plusInfo.baiList.length > 0) {
            /**删除摆牌 */
            let list = plusInfo.baiList
            for (let i = 0; i < list.length; i++) {
                const bai = list[i].slice();
                LSEQSLogic.delIds(bai, handCards)
            }
        }
    }
    // console.log("onUserOpt", this.handCards[optUid])
}

/**获取操作的牌 */
model.getOptCardByUid = function (uid) {
    let optCheckList = [ApiLseqs.operateType.CHI, ApiLseqs.operateType.DUI, ApiLseqs.operateType.KAI]
    let optList = this.operateRecords.filter(optInfo => optInfo.uid == uid && optCheckList.includes(optInfo.operate))
    let bayuList = this.operateRecords.filter(optInfo => optInfo.uid == uid && optInfo.operate == ApiLseqs.operateType.BAYU)
    let res = []
    for (let i = 0; i < optList.length; i++) {
        let opt = optList[i]
        const plusInfo = opt.plusInfo;
        if (plusInfo && plusInfo.cardList) {
            let list = plusInfo.cardList.slice()
            if (this.gameRule.isBaYuJiaHu) {
                if (list.length == 3 && bayuList.some(info => info.card == opt.card)) {
                    list.push(opt.card)
                }
            }
            /**把吃的那张牌放到第一位 */
            if (opt.operate == ApiLseqs.operateType.CHI) {
                let idx = list.indexOf(opt.card)
                if (idx != -1) {
                    list.splice(idx, 1)
                    list.unshift(opt.card)
                }
            }
            res.push(list)
        }
        if (plusInfo && plusInfo.baiList && plusInfo.baiList.length > 0) {
            for (let i = 0; i < plusInfo.baiList.length; i++) {
                let list = plusInfo.baiList[i].slice();
                let idx = list.indexOf(opt.card) //吃的那张牌放到第一位
                if (idx != -1) {
                    list.splice(idx, 1)
                    list.unshift(opt.card)
                }
                res.push(list)
            }
        }
    }
    return res
}

/**获取所有巴雨的操作 */
model.getAllBaYuOpt = function () {
    let res = []
    for (let i = 0; i < this.operateRecords.length; i++) {
        const optInfo = this.operateRecords[i];
        if (optInfo.operate == ApiLseqs.operateType.BAYU) {
            res.push(optInfo)
        }
    }
    return res
}

/**获取丢在桌子上的牌 */
model.getTableCardByUid = function (uid) {
    let outList = this.operateRecords.filter(data => data.uid == uid && data.operate == ApiLseqs.operateType.DIU)
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

model.setLimitCard = function (value) {
    this.limitCard = value;
}

model.getLimitCard = function () {
    return this.limitCard;
}

model.getTingListEx = function (del = null) {
    let myCards = Utils.deepCopy(this.handCards[this.myUid]);
    if (del) {
        myCards.splice(myCards.indexOf(del), 1)
    }
    let list = LSEQSLogic.getTingList(myCards)
    let myHuCount = this.totalHuList[this.myUid]
    // 如果摆出来的牌胡数为0，则要计算手牌中的胡数，把list里面胡数为0的删掉
    if (!myHuCount && list.length > 0) {
        let delList = []
        list.forEach(info => {
            let tingId = info.cardID
            let hand = myCards.slice()
            hand.push(tingId)
            let canHuList = LSEQSLogic.getCanHuList(hand, tingId)
            if (canHuList && canHuList.length > 0) {
                let isPush = true
                for (let i = 0; i < canHuList.length; i++) {
                    const kanList = canHuList[i];
                    let huCount = LSEQSLogic.getHuCount(kanList, true)
                    if (huCount > 0) {
                        isPush = false
                        break
                    }
                }
                if (isPush) {
                    delList.push(tingId)
                }
            }
        });
        delList.forEach(id => {
            let idx = list.findIndex(info => info.cardID == id)
            if (idx != -1) {
                list.splice(idx, 1)
            }
        });
    }
    //console.log("tingList", list, myCards, del)
    return list
}

model.updateJiaoList = function () {
    /**如果是自己出牌，更新叫数据 */
    let myCards = Utils.deepCopy(this.handCards[this.myUid]);
    let jiaoList = []
    myCards.forEach(card => {
        if (!jiaoList.includes(card)) {
            let tingList = this.getTingListEx(card)
            if (tingList.length > 0) {
                jiaoList.push(card)
            }
        }
    });
    // console.log("jiaoList", jiaoList)
    this.jiaoList = jiaoList
}

model.getJiaoList = function () {
    return this.jiaoList || []
}

/**获取是不是圈牌 */
model.getIsQuanPai = function (id) {
    if (id == this.curBureau) return false;
    let num = LSEQSLogic.getCardNumber(id)
    return num == this.curBureau
}

model.getRestCardCount = function (card) {
    let showCount = 0;
    let myHandCards = Utils.deepCopy(this.handCards[this.myUid]);
    for (let i = 0; i < this.operateRecords.length; ++i) {
        let item = this.operateRecords[i];
        if (item.operate == ApiLseqs.operateType.CHI || item.operate == ApiLseqs.operateType.DUI || item.operate == ApiLseqs.operateType.KAI) {
            let cardList = item.plusInfo.cardList
            for (let i = 0; i < cardList.length; i++) {
                const c = cardList[i];
                if (c === card) {
                    showCount++
                }
            }
        } else if (item.card == card) {
            if (item.operate == ApiLseqs.operateType.DIU) {
                ++showCount;
            }
        }
    }
    for (let item of myHandCards) {
        if (item == card) {
            ++showCount;
        }
    }
    let totalCount = 4
    let rest = totalCount - showCount;
    return (rest < 0) ? 0 : rest;
}

model.getGameType = function () {
    this.gameRule = this.gameRule || {};
    return this.gameRule.gameType || Enums.bundleType.LSEQS;
}

/**获取摆在桌子上的胡数 */
model.getBaiHuCount = function (uid) {
    if (!this.totalHuList) return 0;
    return this.totalHuList[uid] || 0
}

/**重置操作数据，回放的时候用 */
model.resetOperateRecords = function () {
    this.operateRecords = []
}

/**设置胡数 */
model.setTotalHu = function (uid, totalHu) {
    this.totalHuList[uid] = totalHu
}

/**获取手牌数量 */
model.getHandCount = function (uid) {
    let handCards = this.handCards[uid] || [];
    return handCards.length;
}

model.setIsMyTurn = function (isMyTurn) {
    this.isMyTurn = isMyTurn;
}

model.getIsMyTurn = function () {
    return this.isMyTurn;
}

model.setCusHandList = function (value) {
    this.cusHandList = value
}

model.getCusHandList = function () {
    if (!this.cusHandList || this.cusHandList.length == 0) {
        this.cusHandList = this.getHandCards(this.myUid)
    }
    return this.cusHandList
}

model.optCusHandList = function (data) {
    if (data.uid != this.myUid) {
        return
    }
    if (!this.cusHandList || this.cusHandList.length == 0) {
        return
    }
    let optCheckList = [ApiLseqs.operateType.CHI, ApiLseqs.operateType.DUI, ApiLseqs.operateType.KAI]
    /**删除手牌 */
    if (data.operate == ApiLseqs.operateType.QI) { //出牌
        let customEx = data.plusInfo.customEx
        if (customEx) {
            let cardList = this.cusHandList[customEx.layIdx].cardList
            if (cardList) {
                cardList.splice(customEx.cardIdx, 1)
            }
        }
    } else if (optCheckList.includes(data.operate)) {
        let delList = []
        let plusInfo = Utils.deepCopy(data.plusInfo)
        if (plusInfo && plusInfo.cardList && plusInfo.cardList.length > 0) {
            let list = plusInfo.cardList
            let idx = list.indexOf(data.card)
            if (idx != -1) {
                list.splice(idx, 1)
            }
            delList = delList.concat(list)
        }
        if (plusInfo && plusInfo.baiList && plusInfo.baiList.length > 0) {
            /**删除摆牌 */
            for (let i = 0; i < plusInfo.baiList.length; i++) {
                const l = plusInfo.baiList[i];
                delList = delList.concat(l)
            }
        }
        this.cusHandList.forEach(info => {
            if (info.cardList && info.cardList.length > 0) {
                for (let i = 0; i < delList.length; i++) {
                    const delID = delList[i];
                    if (info.cardList.indexOf(delID) != -1) {
                        info.cardList.splice(info.cardList.indexOf(delID), 1)
                        delList.splice(i, 1)
                        i--
                    }
                }
            }
        });
    }
    /**删除完后检查有不有空的组，删除空的组 */
    for (let i = 0; i < this.cusHandList.length; i++) {
        const info = this.cusHandList[i];
        if (info.cardList.length == 0) {
            this.cusHandList.splice(i, 1)
            i--
        }
    }
}

model.getGroupHuCount = function (cardList) {
    if (!cardList || cardList.length == 0) {
        return 0
    }
    return LSEQSLogic.getHuCount(cardList, true)
}

model.getBundleType = function () {
    return this.getGameRuleByKey('gameType') || Enums.bundleType.LSEQS;
}

model.LAY_COUNT = {
    [3]: 0,
    [4]: -43.3,
    [5]: -65,
}

model.MSG_SHOW_TING_TIPS = "showTingTips"
model.MSG_HIDE_TING_TIPS = "hideTingTips"
model.MSG_BAI_ITEM_CLICK = "baiItemClick"
model.MSG_BAI_ITEM_CLICK1 = "baiItemClick1"