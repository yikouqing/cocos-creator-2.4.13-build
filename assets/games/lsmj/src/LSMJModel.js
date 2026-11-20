const Enums = require('../../../src/const/Enums');
const ApiLsmj = require('./ApiLsmj');
const UserModel = require('../../../src/model/UserModel');
const LSMJLogic = require('./LSMJLogic');
const ConfigModel = require('../../../src/model/ConfigModel');
const Utils = require('../../../src/utils/Utils');

var model = module.exports;

/**初始化数据 */
model.init = function (data) {
    this.reset();
    this.gameInited = true;
    UserModel.setDatas(data);
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
    this.winChairIDArray = data.gameData.winChairIDArray;
    this.userScoreList = data.gameData.userScoreList || {};
    this.myUid = UserModel.getData('uid');
    this.suggestCard = data.gameData.suggestCard || {};
    this.laiZiCards = data.gameData.laiZiCards;
    this.dingQueType = data.gameData.queType || {};
    this.huanPaiList = data.gameData.huanPaiList || {};
    this.operateRecords = data.gameData.operateRecords || [];
    this.askForExitArr = null;
    this.userHuDonList = data.gameData.userHuDonList || []
    this.fanCard = data.gameData.fanCard;
    this.TingListCards = data.gameData.TingListCards;
}

/**每局完成后重置数据 */
model.reset = function () {
    this.lastOperateUid = null;
    this.operateRecords = [];
    this.huanPaiList = {};
    this.huanPaiCards = {};
    this.dingQueType = {};
    this.suggestCard = {};
    this.curChairID = null;
    this.operateUid = null;
    this.operateCard = null;
    this.userHuDonList = [];
    this.fanCard = null;
}

model.setFanCard = function (value) {
    this.fanCard = value
}

/**获取游戏是否开始 */
model.isGameStarted = function () {
    return this.gameStarted;
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
    //状态只要变化游戏必定开始
    this.gameStarted = true;
}

model.getRoomID = function () {
    return this.roomID;
}

model.setTick = function (value) {
    this.tick = value
}

model.getTick = function () {
    return this.tick || 0
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
    if (!this.roomUserInfoArr) return 0;
    let myChairID = 0;
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
    let chairID = !!user && user.chairID >= 0 ? user.chairID : 0;
    return this.getUserIndexByChairID(chairID);
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

/**设置已经胡牌的人 */
model.pushUserHuDonList = function (data) {
    if (!data.operateType && data.operate) {
        data.operateType = data.operate
    }
    this.userHuDonList.push(data)
}

model.setUserHuDonList = function (value) {
    this.userHuDonList = value || []
}
/**获取胡牌的信息 */
model.getUserHuDonList = function () {
    return this.userHuDonList
}

/**获取位置换牌是否完成 */
model.getIsHuanPai = function (uid) {
    if (!uid) return false;
    return this.huanPaiList[uid];
}

/**获取位置定缺类型 */
model.getDingQueType = function (uid) {
    let d = this.dingQueType[uid]
    if (d || d == 0) return d;
    return -1;
}

model.setDingQueType = function (uid, type) {
    this.dingQueType[uid] = type
}

model.setDingQueTypeAll = function (value) {
    this.dingQueType = value || {}
}

/**获取手牌中是否还有定缺的牌 */
model.getHasDingQueCard = function () {
    let uid = this.getMyUID()
    let dtype = this.getDingQueType(uid)
    let hasDingQueCard = false;
    if (dtype !== -1) {
        let hands = this.handCards[uid]
        for (let i = 0; i < hands.length; i++) {
            if (dtype === LSMJLogic.getCardColor(hands[i]) && !this.isLaiZiCard(hands[i])) {
                hasDingQueCard = true;
                break;
            }
        }
    }
    return hasDingQueCard;
}

/**获取自己手牌中的定缺列表 */
model.getDingQueList = function () {
    let uid = this.myUid
    let dtype = this.getDingQueType(uid)
    let list = []
    if (dtype !== -1) {
        let glist = this.getGhostCard()
        let hand = this.handCards[uid]
        for (let i = 0; i < hand.length; i++) {
            if (!glist.includes(hand[i]) && dtype === LSMJLogic.getCardColor(hand[i])) {
                list.push(hand[i])
            }
        }
    }
    return list
}

/**获取听牌列表，但是去掉定缺的牌 */
model.getTingListEx = function (cards, isAddGui = false) {
    if (cards.length == 0) return [];
    let uid = this.getMyUID()
    let dtype = this.getDingQueType(uid)
    let laiZiCards = this.getGhostCard()
    let tingCards = LSMJLogic.getTingList(cards, laiZiCards)
    for (let i = tingCards.length - 1; i >= 0; i--) {
        let info = tingCards[i];
        if (dtype === LSMJLogic.getCardColor(info.cardID)) {
            tingCards.splice(i, 1);
        }
    }
    /**加入鬼牌 */
    if (isAddGui) {
        if (tingCards.length > 0 && laiZiCards.length > 0) {
            for (let i = 0; i < laiZiCards.length; i++) {
                let ghostCheck = tingCards.some((item) => {
                    return item.cardID == laiZiCards[i];
                })
                if (!ghostCheck) {
                    tingCards.push({
                        cardID: laiZiCards[i],
                        rate: 1
                    })
                }
            }
        }
    }

    return tingCards;
}

/**操作时最后一个出牌的位置。用于删除桌面上打出来的牌 */
model.getLastOutCardRecord = function () {
    this.operateRecords = this.operateRecords || [];
    let operateRecords = this.operateRecords.slice();
    if (operateRecords.length == 0) return null;
    let lastOut = {
        opt: null,
        isDel: false
    };
    let optFilter = [
        ApiLsmj.operateType.CHI,
        ApiLsmj.operateType.PENG,
        ApiLsmj.operateType.GANG_CHI,
        ApiLsmj.operateType.HU_CHI
    ];
    for (let index = operateRecords.length - 1; index >= 0; index--) {
        let opt = operateRecords[index];
        if (!opt) continue;
        if (opt.operate == ApiLsmj.operateType.QI) {
            lastOut.opt = opt;
            break;
        } else {
            if (optFilter.indexOf(opt.operate) != -1) {
                lastOut.isDel = true;
                lastOut.opt = null;
            }
        }
    }
    return lastOut;
}

/**
 * 获取最近一次指定类型的牌
 * @param {uid,operate} params 
 */
model.getLastOperateByType = function (uid, operate) {
    this.operateRecords = this.operateRecords || [];
    let operateRecords = this.operateRecords.slice();
    let opt = null;
    for (let index = operateRecords.length - 1; index >= 0; index--) {
        let optTemp = operateRecords[index];
        if (!optTemp) continue;
        if (optTemp.operate == operate && uid == optTemp.uid) {
            opt = optTemp;
            break;
        }
    }
    return opt;
}

model.getLastOperate = function () {
    this.operateRecords = this.operateRecords || [];
    let operateRecords = this.operateRecords.slice();
    let operateCount = operateRecords.length;
    if (operateCount == 0) return null;
    let opt = operateRecords[operateCount - 1];
    return opt;
}

//找到这次打牌前是不是摸的牌
model.getQiByMo = function (opt) {
    let tpOp = null;
    this.operateRecords = this.operateRecords || [];
    let opRecords = this.operateRecords.slice();
    let opLength = opRecords.length;
    if (opLength <= 0) return tpOp;
    let opIndex = -1;
    for (let index = opLength - 1; index >= 0; index--) {
        let op = opRecords[index];
        if (!op) continue;
        if (op.uid == opt.uid &&
            op.operate == opt.operate &&
            op.card == opt.card) {
            opIndex = index;
            break;
        }
    }
    if (opIndex <= 0) return tpOp;
    tpOp = opRecords[opIndex - 1];
    return tpOp.uid == opt.uid && tpOp.operate == ApiLsmj.operateType.GET ? tpOp : null
};

/**获取所有吃碰杠的操作信息 */
model.getPengGangArrayByUID = function (uid, operateRecords = null, laiZiCards = null) {
    let optFilter = [
        ApiLsmj.operateType.PENG,
        ApiLsmj.operateType.GANG_CHI,
        ApiLsmj.operateType.GANG_BU,
        ApiLsmj.operateType.GANG_ZHI,
        ApiLsmj.operateType.CHI,
        ApiLsmj.operateType.TI
    ];
    laiZiCards = laiZiCards || this.laiZiCards;
    laiZiCards = laiZiCards || [];
    this.operateRecords = this.operateRecords || [];
    operateRecords = operateRecords || this.operateRecords.slice();
    operateRecords = operateRecords || [];
    let array = operateRecords.filter(item => item.uid == uid && optFilter.includes(item.operate));
    // 癞子碰和癞子杠都可以提 删除提之前对应的碰、杠操作   
    array = this.tiOperateFilter(array, laiZiCards);
    /**如果有补杠操作，就找到之前碰的操作给他删除掉 */
    for (let i = array.length - 1; i >= 0; --i) {
        if (array[i].operate == ApiLsmj.operateType.GANG_BU) {
            let laiZiGangBu = laiZiCards.includes(array[i].card);
            let gangBuCard = null;
            if (!!laiZiGangBu) gangBuCard = array[i].plusInfo.cardList.find(card => !this.laiZiCards.includes(card));
            for (let j = array.length - 2; j >= 0; --j) {
                if ((array[j].card == array[i].card
                    || (!!laiZiGangBu && array[j].card == gangBuCard)) &&
                    array[j].operate == ApiLsmj.operateType.PENG &&
                    array[j].uid == array[i].uid) {
                    array.splice(j, 1);
                    break;
                }
            }
        }
    }
    return array;
};

/**设置手牌 */
model.setHandCards = function (value) {
    this.handCards = value;
}

model.setHandCardsByUID = function (uid, value) {
    this.handCards = this.handCards || {};
    this.handCards[uid] = value;
}

model.isTurn = function (uid) {
    return this.operateUid == uid;
};

model.setReview = function (isReview = false) {
    this.isReview = isReview;
}

/**刷新的时候检查自摸并删除手牌 */
model.delZimoCard = function (uid, huId) {
    this.handCards = this.handCards || {};
    let hand = this.handCards[uid];
    if (!hand) return;
    let optlist = this.getOptRecords(uid)
    if (optlist && optlist.length > 0) {
        /**检查是不是有自摸操作，有就删除一张手牌 */
        let zimo = optlist.find(opt => opt.operate == ApiLsmj.operateType.HU_ZHI)
        if (zimo && zimo.card == huId) {
            let del = hand.indexOf(zimo.card)
            hand.splice(del, 1);
        }
    }
}

/**获取排序后的手牌 */
model.getHandCards = function (uid) {
    this.handCards[uid] = this.handCards[uid] || [];
    let copyHandCards = this.handCards[uid].slice();
    let handCards = this.sortTiles(uid, copyHandCards);
    return handCards.slice();
}

model.getHandGhostCardsCount = function (uid) {
    let ghostCardsCount = 0;
    let ghost = this.getGhostCard()
    let handCards = this.getHandCards(uid);
    for (const cardId of handCards) {
        if (!ghost.includes(cardId)) continue;
        ghostCardsCount++;
    }
    return ghostCardsCount;
}

model.getGhostCard = function () {
    return this.laiZiCards || [];
};

model.tingFilter = function (card, handCards, isNeedGhost = true) {
    let filter = {
        cards: [],
        ghostCardsCount: 0
    }
    let checkCards = handCards.slice();
    let filterIndex = checkCards.indexOf(card);
    if (filterIndex >= 0) {
        checkCards.splice(filterIndex, 1);
    }
    let ghosts = this.getGhostCard()
    for (const cardId of checkCards) {
        let isGhost = ghosts.includes(cardId)
        if (!isGhost || isNeedGhost) {
            filter.cards.push(cardId);
        }
        if (isGhost) {
            filter.ghostCardsCount++;
        }
    }
    return filter;
};

model.setLaiZiCards = function (laiZiCards) {
    this.laiZiCards = laiZiCards;
};

/**手牌排序 */
model.sortTiles = function (uid, handCards) {
    handCards = handCards || [];
    if (handCards.length > 0) {
        handCards.sort((a, b) => {
            return a - b;
        });
        let laizi = [];
        let laiZiCards = this.getGhostCard();
        let dingque = []
        let dtype = this.getDingQueType(uid)
        for (let i = 0; i < handCards.length; i++) {
            const t = handCards[i];
            let isDel = false;
            if (laiZiCards.includes(t)) {
                laizi.push(t);
                isDel = true;
            } else if (dtype !== -1) {
                if (dtype == LSMJLogic.getCardColor(t)) {
                    dingque.push(t)
                    isDel = true
                }
            }
            if (isDel) {
                handCards.splice(i, 1);
                i--;
            }
        }

        /**癞子放前面 */
        if (laizi.length > 0) {
            for (let i = laizi.length - 1; i >= 0; i--) {
                const t = laizi[i];
                handCards.unshift(t);
            }
        }
        /**定缺放后面 */
        if (dingque.length > 0) {
            dingque.forEach(t => {
                handCards.push(t)
            })
        }
    }
    return handCards;
}

/**获取红中是不是伪宝牌 */
model.getIsWeiBaoPai = function () {
    let laiZiCards = this.getGhostCard();
    let isWeiBaoPai = laiZiCards.length > 0 && laiZiCards[0] < 31
    return isWeiBaoPai
}

/**换牌选择完成 */
model.onHuanPaiChoose = function (data) {
    let array = this.handCards[data.uid];
    for (let i = 0; i < data.cardList.length; i++) {
        array.splice(array.indexOf(data.cardList[i]), 1)
    }
    this.huanPaiList[data.uid] = true;
}

/**换牌完成 */
model.onHuanPaiEnd = function (data) {
    let array = this.handCards[data.uid];
    data.cardList.forEach(card => {
        array.push(card);
    });
    this.huanPaiCards[data.uid] = data.cardList;
    this.huanPaiList[data.uid] = true;
}

/**获取自己的定缺推荐 */
model.getDingQueSuggest = function () {
    let myHand = this.handCards[this.getMyUID()]
    let hua = [0, 0, 0]
    let laiZiCards = this.getGhostCard()
    myHand.forEach(card => {
        let c = LSMJLogic.getCardColor(card)
        if (c < 3 && !laiZiCards.includes(card)) {
            hua[c]++
        }
    });
    let min = 13
    hua.forEach(cnum => {
        if (min >= cnum) {
            min = cnum
        }
    });
    return hua.indexOf(min)
}

/**通知用户操作 */
model.onGameTurn = function (data) {
    let opt = data.operateArray.find(opt => opt.type == ApiLsmj.operateType.GET);
    if (opt && opt.isBankerFirst) data.card = null;
    if (data.operateArray.some(opt => opt.type == ApiLsmj.operateType.QI) ||
        data.operateArray.some(opt => opt.type == ApiLsmj.operateType.GET)) {
        if (data.card != null) {
            data.operate = ApiLsmj.operateType.GET;
            this.handCards[data.uid].push(data.card);
            this.operateRecords.push(data);
        }
        this.operateUid = data.uid;
    }
}

model.onTingCardsSync = function (data) {
    if (data.uid == this.getMyUID()) this.TingListCards = data.TingListCards || {};
}

model.setOperateRecords = function (operateRecords) {
    this.operateRecords = operateRecords || [];
}

/**用户操作广播 */
model.onUserOpt = function (data) {
    //设置胡牌信息
    let huFilter = [
        ApiLsmj.operateType.HU_ZHI,
        ApiLsmj.operateType.HU_CHI,
        ApiLsmj.operateType.HU_QIANG,
        ApiLsmj.operateType.HU_TI
    ];
    let isHu = huFilter.includes(data.operate);
    if (isHu) this.pushUserHuDonList(data);
    let isTest = UserModel.getData('isTest');
    if (!!this.isReview) isTest = true;
    let isMe = data.uid == this.getMyUID();
    this.operateRecords.push(data);
    let count = 0;
    this.operateUid = data.uid;
    if (data.operate == ApiLsmj.operateType.QI) {
        count = 1;
        this.operateCard = data.card;
        this.lastOperateUid = data.uid;
        this.operateUid = null;
    } else if (data.operate == ApiLsmj.operateType.PENG ||
        data.operate === ApiLsmj.operateType.CHI) {
        count = 2;
    } else if (data.operate == ApiLsmj.operateType.GANG_CHI) {
        count = 3;
    } else if (data.operate == ApiLsmj.operateType.GANG_ZHI) {
        count = 4;
    } else if (data.operate == ApiLsmj.operateType.GANG_BU ||
        data.operate === ApiLsmj.operateType.HU_ZHI) {
        count = 1;
    }
    this.handCards[data.uid] = this.handCards[data.uid] || [];
    let handCards = this.handCards[data.uid].slice();
    if (data.operate === ApiLsmj.operateType.HU_ZHI ||
        data.operate == ApiLsmj.operateType.QI) {
        while (count > 0) {
            if (isMe || !!isTest) {
                //如果是自己或者开启了调试模式就删除对应卡牌
                let idx = handCards.indexOf(data.card);
                idx >= 0 && handCards.splice(idx, 1);
            } else {
                //如果是不是自己且未开启调试模式就删除对应数量即可
                handCards.splice(0, 1);
            }
            --count;
        }
    } else if (data.operate === ApiLsmj.operateType.CHI ||
        data.operate === ApiLsmj.operateType.GANG_CHI ||
        data.operate === ApiLsmj.operateType.GANG_ZHI ||
        data.operate === ApiLsmj.operateType.GANG_BU ||
        data.operate == ApiLsmj.operateType.PENG) {
        //杠的时候删除手牌
        if (isMe || !!isTest) {
            data.plusInfo.cardList = data.plusInfo.cardList || [];
            let list = data.plusInfo.cardList.slice(); //需要删除的牌
            if (data.operate === ApiLsmj.operateType.GANG_BU) list = [];
            if (data.operate === ApiLsmj.operateType.CHI ||
                data.operate === ApiLsmj.operateType.GANG_CHI ||
                data.operate === ApiLsmj.operateType.PENG) {
                let idx = list.indexOf(data.card);
                if (idx !== -1) list.splice(idx, 1);
            } else if (data.operate === ApiLsmj.operateType.GANG_BU) {
                //补杠特殊处理
                list.push(data.card);
            }
            for (let i = 0; i < list.length; i++) {
                for (let j = 0; j < handCards.length; j++) {
                    if (handCards[j] === list[i]) {
                        handCards.splice(j, 1);
                        j--;
                        break;
                    }
                }
            }
        } else {
            while (count > 0) {
                handCards.splice(0, 1);
                --count;
            }
        }
    } else if (data.operate == ApiLsmj.operateType.TI) { //提
        //刷新最近一次的癞子碰杠操作
        if (isMe || !!isTest) {
            data.plusInfo.cardList = data.plusInfo.cardList || [];
            data.plusInfo.ticardList = data.plusInfo.ticardList || [];
            let changed = this.findChangedElements(data.plusInfo.cardList.slice(), data.plusInfo.ticardList.slice());
            let laiZiCard = null;
            if (changed.reduced.length == 1) laiZiCard = changed.reduced.pop();
            if (laiZiCard) {
                let idx = handCards.indexOf(data.card)
                if (idx !== -1) handCards.splice(idx, 1, laiZiCard);
            }
        }
    }
    this.handCards[data.uid] = handCards;
}

model.handCardsSync = function () {
    this.operateRecords = this.operateRecords || [];
    let array = this.operateRecords.slice();
    // console.log('当前操作', array)
    for (let i = 0; i < array.length; i++) {
        let curOpt = array[i];
        if (curOpt.operate == ApiLsmj.operateType.GET) {
            this.handCards[curOpt.uid].push(curOpt.card);
        } else if (curOpt.operate == ApiLsmj.operateType.QI) {
            this.handCards[curOpt.uid].splice(this.handCards[curOpt.uid].indexOf(curOpt.card), 1);
        } else if (curOpt.operate == ApiLsmj.operateType.GANG_ZHI) {
            let gangList = curOpt.plusInfo.cardList;
            if (!!gangList) {
                for (let idx = 0; idx < gangList.length; idx++) {
                    const card = gangList[idx];
                    this.handCards[curOpt.uid].splice(this.handCards[curOpt.uid].indexOf(card), 1);
                }
            }
        } else if (curOpt.operate == ApiLsmj.operateType.GANG_BU) {
            this.handCards[curOpt.uid].splice(this.handCards[curOpt.uid].indexOf(curOpt.card), 1);
        } else if (curOpt.operate == ApiLsmj.operateType.GANG_CHI) {
            let gangList = curOpt.plusInfo.cardList.slice()
            gangList.splice(gangList.indexOf(curOpt.card), 1)
            for (let idx = 0; idx < gangList.length; idx++) {
                const card = gangList[idx];
                this.handCards[curOpt.uid].splice(this.handCards[curOpt.uid].indexOf(card), 1);
            }
        } else if (curOpt.operate == ApiLsmj.operateType.PENG) {
            let cardList = curOpt.plusInfo.cardList.slice()
            cardList.splice(cardList.indexOf(curOpt.card), 1)
            for (let i = 0; i < cardList.length; i++) {
                const card = cardList[i];
                let delIdx = this.handCards[curOpt.uid].indexOf(card)
                if (delIdx >= 0) {
                    this.handCards[curOpt.uid].splice(delIdx, 1);
                }
            }
        } else if (curOpt.operate == ApiLsmj.operateType.CHI) {
            let cardList = curOpt.plusInfo.cardList.slice()
            cardList.splice(cardList.indexOf(curOpt.card), 1)
            for (let i = 0; i < cardList.length; i++) {
                let idx = this.handCards[curOpt.uid].indexOf(cardList[i])
                this.handCards[curOpt.uid].splice(idx, 1);
            }
        } else if (curOpt.operate == ApiLsmj.operateType.TI) {
            //删除手牌中提的牌，然后把提牌中cardList中的赖子放到手牌中去
            curOpt.plusInfo.cardList = curOpt.plusInfo.cardList || [];
            curOpt.plusInfo.ticardList = curOpt.plusInfo.ticardList || [];
            let changed = this.findChangedElements(curOpt.plusInfo.cardList, curOpt.plusInfo.ticardList);
            let laiZiCard = null;
            if (changed.reduced.length == 1) laiZiCard = changed.reduced.pop();
            if (laiZiCard) {
                let idx = this.handCards[curOpt.uid].indexOf(curOpt.card)
                if (idx >= 0) this.handCards[curOpt.uid].splice(idx, 1, laiZiCard)
            }
        }
    }
}

/**获取出的牌 */
model.getOutTilesByUID = function (uid, operateRecords = null) {
    let outs = [];
    this.operateRecords = this.operateRecords || [];
    let array = operateRecords || this.operateRecords.slice();
    let optFilter = [
        ApiLsmj.operateType.CHI,
        ApiLsmj.operateType.PENG,
        ApiLsmj.operateType.GANG_CHI,
        ApiLsmj.operateType.HU_CHI
    ];
    for (let index = 0; index < array.length; index++) {
        let opt = array[index];
        if (!opt || opt.uid != uid) continue;
        if (opt.operate == ApiLsmj.operateType.QI) {
            if (index == array.length - 1) {
                outs.push(opt);
            } else {
                let outCardIndex = index;
                let isDel = false;
                for (let oci = outCardIndex + 1; oci < array.length; oci++) {
                    let ocpt = array[oci];
                    if (!ocpt) continue;
                    if (ocpt.operate == ApiLsmj.operateType.QI) {
                        isDel = false;
                        break;
                    } else {
                        if (optFilter.indexOf(ocpt.operate) != -1) {
                            isDel = true;
                            break;
                        }
                    }
                }
                if (!isDel) {
                    outs.push(opt);
                }
            }
        }
    }
    return outs;
}

model.qiOperateFilter = function (operateRecords) {
    let records = [];
    let array = operateRecords || [];
    let optFilter = [
        ApiLsmj.operateType.CHI,
        ApiLsmj.operateType.PENG,
        ApiLsmj.operateType.GANG_CHI,
        ApiLsmj.operateType.HU_CHI
    ];
    for (let index = 0; index < array.length; index++) {
        let opt = array[index];
        if (opt.operate == ApiLsmj.operateType.QI) {
            if (index < array.length - 1) {
                let outCardIndex = index;
                let isDel = false;
                for (let oci = outCardIndex + 1; oci < array.length; oci++) {
                    let ocpt = array[oci];
                    if (!ocpt) continue;
                    if (ocpt.operate == ApiLsmj.operateType.QI) {
                        isDel = false;
                        break;
                    } else {
                        if (optFilter.indexOf(ocpt.operate) != -1) {
                            isDel = true;
                            break;
                        }
                    }
                }
                if (!isDel) {
                    records.push(opt);
                }
            }
        } else {
            records.push(opt);
        }
    }
    return records;
}

model.tiOperateFilter = function (array, laiZiCards) {
    for (let i = array.length - 1; i >= 0; --i) {
        if (array[i].operate == ApiLsmj.operateType.TI) {
            let tiFilter = [ApiLsmj.operateType.PENG, ApiLsmj.operateType.GANG_BU, ApiLsmj.operateType.GANG_CHI, ApiLsmj.operateType.GANG_ZHI];
            array[i].plusInfo.cardList = array[i].plusInfo.cardList || [];
            array[i].plusInfo.cardList.sort((a, b) => a - b);
            array[i].plusInfo.ticardList = array[i].plusInfo.ticardList || [];
            array[i].plusInfo.ticardList.sort((a, b) => a - b);
            for (let j = array.length - 2; j >= 0; --j) {
                if (array[j].card == array[i].card && array[j].uid == array[i].uid) {
                    if (array[j].operate == ApiLsmj.operateType.TI) {
                        array[j].plusInfo.cardList = array[j].plusInfo.cardList || [];
                        array[j].plusInfo.cardList.sort((a, b) => a - b);
                        //处理多次提的数据
                        array[j].plusInfo.ticardList = array[j].plusInfo.ticardList || [];
                        array[j].plusInfo.ticardList.sort((a, b) => a - b);
                        if (array[j].plusInfo.ticardList.join('') == array[i].plusInfo.cardList.join('')) array[j].plusInfo.ticardList = array[i].plusInfo.ticardList;//迭代
                    } else if (tiFilter.includes(array[j].operate)) {
                        array[j].plusInfo.cardList = array[j].plusInfo.cardList || [];
                        array[j].plusInfo.cardList.sort((a, b) => a - b);
                        let jLaiZiCards = array[j].plusInfo.cardList.filter(item => laiZiCards.includes(item));
                        let iTiLaiZiCards = array[i].plusInfo.ticardList.filter(item => laiZiCards.includes(item));
                        if (array[i].plusInfo.cardList.join('') == array[j].plusInfo.cardList.join('')
                            && (jLaiZiCards.length > iTiLaiZiCards.length)) {
                            array[j].plusInfo.cardList = array[i].plusInfo.ticardList;
                            break;
                        }
                    }
                }
            }
            array.splice(i, 1);
        }
    }
    return array;
}

/**获取剩余牌的数量 */
model.getRestCardCount = function (card) {
    let showCount = 0;
    let myUid = this.getMyUID();
    let myHandCards = this.getHandCards(myUid);
    let huaPai = [41, 42, 43, 44]
    let isHua = huaPai.includes(card);
    this.operateRecords = this.operateRecords || [];
    this.laiZiCards = this.laiZiCards || [];
    let array = this.operateRecords.slice();
    array = this.tiOperateFilter(array, this.laiZiCards);
    array = this.qiOperateFilter(array);
    //提取TI操作
    for (let i = 0; i < array.length; ++i) {
        let cards = [];
        if (array[i].operate == ApiLsmj.operateType.CHI
            || array[i].operate == ApiLsmj.operateType.PENG
            || array[i].operate == ApiLsmj.operateType.GANG_BU
            || array[i].operate == ApiLsmj.operateType.GANG_ZHI
            || array[i].operate == ApiLsmj.operateType.GANG_CHI) {
            array[i].plusInfo.cardList = array[i].plusInfo.cardList || [];
            cards = array[i].plusInfo.cardList.filter(item => item == card);
            showCount += cards.length;
        } else if (array[i].card == card) {
            if (array[i].operate == ApiLsmj.operateType.QI) {
                showCount++;
            } else if (array[i].operate == ApiLsmj.operateType.HU_ZHI
                || array[i].operate == ApiLsmj.operateType.HU_CHI
                || array[i].operate == ApiLsmj.operateType.HU_QIANG
                || array[i].operate == ApiLsmj.operateType.HU_TI) {
                showCount++;
            }
        }
    }
    for (let item of myHandCards) {
        if (item == card) {
            ++showCount;
        }
    }
    let totalCount = 4
    if (isHua) totalCount = 1
    let rest = totalCount - showCount;
    return (rest < 0) ? 0 : rest;
};


model.qiangGangHuDel = function (data) {
    // let handCards = this.handCards[data.uid];
    // handCards.splice(handCards.indexOf(data.card), 1);
}

model.setUserScores = function (value) {
    this.userScoreList = value
}

model.getUserScoreByChairId = function (chairID) {
    return this.userScoreList[chairID]
}

model.getGameType = function () {
    this.gameRule = this.gameRule || {};
    return this.gameRule.gameType || Enums.bundleType.LSMJ;
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

model.canDiscard = function (limit = false) {
    let onceClick = !!ConfigModel.singleOut();
    let gameStatus = this.getGameStatus();
    let canDiscard = gameStatus == ApiLsmj.gameStatus.PLAYING;
    return !!canDiscard && (!!limit || !!onceClick);
}

/**获取最大换牌数量 */
model.getMaxHuanPaiCount = function () {
    let huanZhangCount = this.getGameRuleByKey('huanZhangCount') || 3;
    return huanZhangCount;
}

model.isLaiZiCard = function (card) {
    this.laiZiCards = this.laiZiCards || [];
    return this.laiZiCards.includes(card);
}


//计算元素数量
model.countElements = function (list) {
    const countMap = new Map();
    for (const element of list) {
        countMap.set(element, (countMap.get(element) || 0) + 1);
    }
    return countMap;
}

/**
 * 找出增加或减少的元素 仅适用于提的操作
 * @param {*} cardList 
 * @param {*} tiCardList 
 * @returns 
 */
model.findChangedElements = function (cardList, tiCardList) {
    const cardListCount = this.countElements(cardList);
    const tiCardListCount = this.countElements(tiCardList);
    let reduced = [];
    let added = [];
    for (const [element, count] of cardListCount.entries()) {
        if ((tiCardListCount.get(element) || 0) < count) {
            reduced.push(element);
        }
        if ((tiCardListCount.get(element) || 0) > count) {
            added.push(element);
        }
    }
    return { reduced, added };
};

model.qiangGangQiangTiDel = function (data) {
    this.handCards[data.uid] = this.handCards[data.uid] || [];
    let huCardIdx = this.handCards[data.uid].indexOf(data.card);
    if (huCardIdx != -1) this.handCards[data.uid].splice(huCardIdx, 1);
}

model.getTingCards = function () {
    this.TingListCards = this.TingListCards || {};
    let TingListCards = Utils.deepCopy(this.TingListCards);
    let tingCards = [];
    for (const cardID in TingListCards) {
        TingListCards[cardID].cardID = cardID;
        TingListCards[cardID].cardCount = TingListCards[cardID].CardCount;
        tingCards.push(TingListCards[cardID]);
    }
    return tingCards;
}

model.getBundleType = function () {
    return this.getGameRuleByKey('gameType') || Enums.bundleType.LSMJ;
}