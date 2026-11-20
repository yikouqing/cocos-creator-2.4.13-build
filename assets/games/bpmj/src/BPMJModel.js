const Enums = require('../../../src/const/Enums');
const ApiBpmj = require('./ApiBpmj');
const UserModel = require('../../../src/model/UserModel');
const ConfigModel = require('../../../src/model/ConfigModel');
const BPMJLogic = require('./BPMJLogic');

var model = module.exports;

/**初始化数据 */
model.init = function (data) {
    console.log('游戏初始化', data);
    this.reset();
    this.gameInited = true;
    UserModel.setDatas(data);
    this.setRoomID(data.roomID);
    this.setGameRule(data.gameRule);
    this.setDiceInif(data.gameData.diceInfo);
    this.setGhostCard(data.gameData.laiZiCards);
    this.roomUserInfoArr = data.roomUserInfoArr;
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
    this.dingQueType = data.gameData.queType || {};
    this.huanPaiList = data.gameData.huanPaiList || {};
    this.operateRecords = data.gameData.operateRecords || [];
    this.askForExitArr = null;
    this.huaCards = data.gameData.huaCards || {};
    this.piaoHuaStatus = data.gameData.piaoHuaStatus || 0;
    this.piaoHuaLimit = data.gameData.piaoHuaLimit || {};
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
    this.huaCards = {};
    this.piaoHuaStatus = 0;
    this.onlyBaiBan = false;
    this.piaoHuaLimit = {}
    this.setYingHu(false);
    this.setOnlyBaiBan(false);
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

model.setRoomID = function (roomID) {
    this.roomID = roomID;
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

model.getPlayStatus = function (uid) {
    let user = this.getUserByUID(uid);
    if (user) return user.playStatus;
    return 0;
}

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

model.setPiaoHuaLimit = function (uid, isLimit) {
    // isLimit: false
    // uid: "620057"
    // console.log("uid, isLimit", uid, this.myUid, isLimit)
    this.piaoHuaLimit[uid] = !!isLimit;
}
model.getPiaoHuaLimit = function (uid) {
    return !!this.piaoHuaLimit[uid];
}

model.isNormaGame = function () {
    return true;
    let unionType = this.getRoomCreatorByKey('unionType');
    return unionType != Enums.UnionType.NORMAL;
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
model.setGameRule = function (gameRule) {
    this.gameRule = gameRule;
};

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
model.setDiceInif = function (info) {
    this.diceInfo = info;
}
model.getDiceInif = function () {
    return this.diceInfo || null;
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

/**获取位置换牌是否完成 */
model.getIsHuanPai = function (uid) {
    if (!uid) return false;
    return this.huanPaiList[uid];
}

/**获取位置定缺类型 */
model.getDingQueType = function (uid) {
    // return this.dingQueType[uid] || -1;
    return -1;
}
model.setDingQueType = function (uid, type) {
    this.dingQueType[uid] = type
}
/**获取手牌中是否还有定缺的牌 */
model.getHasDingQueCard = function () {
    return false;
    let uid = this.getMyUID()
    let dtype = this.getDingQueType(uid)
    let hasDingQueCard = false;
    if (dtype !== -1) {
        let hands = this.handCards[uid]
        for (let i = 0; i < hands.length; i++) {
            const card = hands[i];
            if (dtype === BPMJLogic.getCardColor(card)) {
                hasDingQueCard = true;
                break;
            }
        }
    }
    return hasDingQueCard;
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
        ApiBpmj.operateType.CHI,
        ApiBpmj.operateType.PENG,
        ApiBpmj.operateType.GANG_CHI,
        ApiBpmj.operateType.HU_CHI
    ];
    for (let index = operateRecords.length - 1; index >= 0; index--) {
        let opt = operateRecords[index];
        if (!opt) continue;
        if (opt.operate == ApiBpmj.operateType.QI) {
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

/**获取所有操作信息 */
model.getOptRecords = function (uid) {
    let opRecords = this.operateRecords.slice();
    let array = [];
    for (let item of opRecords) {
        if (item.uid == uid) {
            array.push(item);
        }
    }
    /**如果有补杠操作，就找到之前碰的操作给他删除掉 */
    for (let i = array.length - 1; i >= 0; --i) {
        if (array[i].operate == ApiBpmj.operateType.GANG_BU) {
            for (let j = array.length - 1; j >= 0; --j) {
                if (array[j].card == array[i].card &&
                    array[j].operate == ApiBpmj.operateType.PENG &&
                    array[j].uid == array[i].uid) {
                    array.splice(j, 1);
                    j = -1;
                }
            }
        }
    }
    return array;
}

//找到这次打牌前是不是摸的牌
model.getQiByMo = function (opt) {
    let tpOp = null;
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
    // console.log('展示摸牌动画------', opt, tpOp);
    return tpOp.uid == opt.uid && tpOp.operate == ApiBpmj.operateType.GET ? tpOp : null
};

/**获取所有吃碰杠的操作信息 */
model.getPengGangArrayByUID = function (uid) {
    let optFilter = [
        ApiBpmj.operateType.PENG,
        ApiBpmj.operateType.GANG_CHI,
        ApiBpmj.operateType.GANG_BU,
        ApiBpmj.operateType.GANG_ZHI,
        ApiBpmj.operateType.CHI
    ];
    let array = [];
    for (let item of this.operateRecords) {
        if (item.uid == uid && optFilter.indexOf(item.operate) != -1) {
            array.push(item);
        }
    }
    /**如果有补杠操作，就找到之前碰的操作给他删除掉 */
    for (let i = array.length - 1; i >= 0; --i) {
        if (array[i].operate == ApiBpmj.operateType.GANG_BU) {
            for (let j = array.length - 1; j >= 0; --j) {
                if (array[j].card == array[i].card &&
                    array[j].operate == ApiBpmj.operateType.PENG &&
                    array[j].uid == array[i].uid) {
                    array.splice(j, 1);
                    j = -1;
                }
            }
        }
    }
    return array;
};

/**获取吃后不可出的牌 卡的中间吃的那张牌 边的左右两张牌 */
model.getEatNotPlayCards = function (uid) {
    let noOutList = [];
    let huaCards = this.getHandCards(uid) || [];
    if (!huaCards.length || huaCards.length < 4) return [];
    let lastOpt = this.getLastOperate();
    // card: 13
    // operate: 10
    // plusInfo: { cardList: Array(3) }
    // uid: "379323"
    if (lastOpt && lastOpt.operate == ApiBpmj.operateType.CHI && lastOpt.uid == uid) {
        if (lastOpt.plusInfo && lastOpt.plusInfo.cardList) {
            let cardID = lastOpt.card,
                checkList = [];
            let cardList = lastOpt.plusInfo.cardList;
            let index = cardList.indexOf(cardID);
            if (index == 1) { //中间 234>3>3
                checkList = [cardID];
            } else if (index == 0) { //左边 234>2>2/5
                checkList = [cardID, cardList[2] + 1];
            } else if (index == 2) { //右边 234>4>1/4
                checkList = [cardID, cardList[0] - 1];
            }

            let allCard = BPMJLogic.getAllCard();
            for (let i = 0; i < checkList.length; i++) {
                let isHave = false;
                let checkID = checkList[i];
                for (const key in allCard) {
                    if (checkID == allCard[key]) {
                        isHave = true;
                    }
                }
                if (isHave == false) {
                    checkList.splice(i, 1);
                }
            }

            // console.log("checkList", checkList)
            huaCards.forEach((huaCardID) => {
                if (checkList.indexOf(huaCardID) != -1) {
                    noOutList.push(huaCardID);
                }
            })
            // const newList = noOutList.filter((item, index) => {
            //   return noOutList.indexOf(item) === index;
            // });
            // noOutList = newList;
        }
    }
    // console.log("lastOpt", lastOpt, "noOutList", noOutList)
    return noOutList;
}

/**设置手牌 */
model.setHandCards = function (value) {
    this.handCards = value;
}

model.setHuaCards = function (value) {
    this.huaCards = value;
}

model.setHandCardsByUID = function (uid, value) {
    this.handCards = this.handCards || {};
    this.handCards[uid] = value;
}

model.isTurn = function (uid) {
    // console.log('玩家--胡牌', this.operateUid, uid)
    return this.operateUid == uid;
};

/**刷新的时候检查自摸并删除手牌 */
model.delZimoCard = function (uid, huId) {
    this.handCards = this.handCards || {};
    let hand = this.handCards[uid];
    if (!hand) return;
    let optlist = this.getOptRecords(uid)
    if (optlist && optlist.length > 0) {
        /**检查是不是有自摸操作，有就删除一张手牌 */
        let zimo = optlist.find(opt => opt.operate == ApiBpmj.operateType.HU_ZHI)
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
    let handCards = this.sortTiles(copyHandCards);
    this.handCards[uid] = handCards;
    return this.handCards[uid].slice();
}

model.getHandGhostCardsCount = function (uid) {
    let ghostCardsCount = 0;
    let handCards = this.getHandCards(uid);
    for (const cardId of handCards) {
        if (this.ghostCard != cardId) continue;
        ghostCardsCount++;
    }
    return ghostCardsCount;
}

model.tingFilter = function (card, handCards) {
    let filter = {
        cards: [],
        ghostCardsCount: 0
    }
    let checkCards = handCards.slice();
    let filterIndex = checkCards.indexOf(card);
    if (filterIndex >= 0) {
        checkCards.splice(filterIndex, 1);
    }
    for (const cardId of checkCards) {
        if (this.ghostCard != cardId) {
            filter.cards.push(cardId);
        } else {
            filter.ghostCardsCount++;
        }
    }
    return filter;
};

model.setGhostCard = function (ghostCard) {
    this.ghostCard = ghostCard;
};
model.getGhostCard = function () {
    return this.ghostCard || -1;
};

/**手牌排序 */
model.sortTiles = function (handCards, dtype = -1) {
    handCards = handCards || [];
    if (handCards.length > 0) {
        handCards.sort((a, b) => {
            return a - b;
        });
        let laizi = [];
        let dingque = [];
        let ghostCard = this.getGhostCard();
        for (let i = 0; i < handCards.length; i++) {
            const t = handCards[i];
            let isDel = false;
            if (ghostCard == t) {
                laizi.push(t);
                isDel = true;
            } else if (dtype !== -1) {
                if (dtype == BPMJLogic.getCardColor(t)) {
                    dingque.push(t);
                    isDel = true;
                }
            }
            if (isDel) {
                handCards.splice(i, 1);
                i--;
            }
        }

        /**癞子放前面 */
        if (laizi.length > 0) {
            laizi.forEach(t => {
                handCards.unshift(t);
            });
        }
        /**定缺放后面 */
        if (dingque.length > 0) {
            dingque.forEach(t => {
                handCards.push(t)
            });
        }
    }
    return handCards;
}

/**换牌选择完成 */
model.onHuanPaiChoose = function (data) {
    let array = this.handCards[data.uid];
    for (let i = 0; i < data.cardList.length; i++) {
        const card = data.cardList[i];
        array.splice(array.indexOf(card), 1)
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
    return -1
    let myHand = this.handCards[this.getMyUID()]
    let hua = [0, 0, 0]
    myHand.forEach(card => {
        let c = BPMJLogic.getCardColor(card)
        if (c < 3) {
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

model.huaCardsSync = function (uid, cards) {
    this.huaCards = this.huaCards || {};
    this.huaCards[uid] = cards;
};

/**通知用户操作 */
model.onGameTurn = function (data) {
    if (data.operateArray.indexOf(ApiBpmj.operateType.QI) != -1) {
        if (data.card != null) {
            data.operate = ApiBpmj.operateType.GET;
            this.handCards[data.uid].push(data.card);
            this.operateRecords.push(data);
        }
        this.operateUid = data.uid;
    } else if (data.operateArray.indexOf(ApiBpmj.operateType.GET) != -1) {
        data.operate = ApiBpmj.operateType.GET;
        this.handCards[data.uid].push(data.card);
        this.operateRecords.push(data);
        this.operateUid = data.uid;
    }
    // console.log('通知用户操作', data);
}

model.setYingHu = function (isOk) {
    this.isYingHu = isOk || false;
}
model.getYingHu = function () {
    return this.isYingHu || false;
}

model.setOnlyBaiBan = function (isShow) {
    this.onlyBaiBan = !!isShow
}

model.getOnlyBaiBan = function () {
    return !!this.onlyBaiBan
}

/**用户操作广播 */
model.onUserOpt = function (data) {
    let isTest = UserModel.getData('isTest');
    let isMe = data.uid == this.getMyUID();
    this.operateRecords.push(data);
    let count = 0;
    if (data.operate == ApiBpmj.operateType.QI) {
        count = 1;
        this.operateCard = data.card;
        this.lastOperateUid = data.uid;
        this.operateUid = null;
    } else if (data.operate == ApiBpmj.operateType.PENG ||
        data.operate === ApiBpmj.operateType.CHI) {
        count = 2;
        this.operateUid = data.uid;
    } else if (data.operate == ApiBpmj.operateType.GANG_CHI) {
        count = 3;
        this.operateUid = data.uid;
    } else if (data.operate == ApiBpmj.operateType.GANG_ZHI) {
        count = 4;
        this.operateUid = data.uid;
    } else if (data.operate == ApiBpmj.operateType.GANG_BU ||
        data.operate === ApiBpmj.operateType.HU_ZHI) {
        count = 1;
        this.operateUid = data.uid;
    }
    this.handCards[data.uid] = this.handCards[data.uid] || [];
    let handCards = this.handCards[data.uid].slice();
    if (data.operate === ApiBpmj.operateType.HU_ZHI ||
        data.operate == ApiBpmj.operateType.PENG ||
        data.operate == ApiBpmj.operateType.QI) {
        while (count > 0) {
            if (isMe || !!isTest) {
                //如果是自己或者开启了调试模式就删除对应卡牌
                handCards.splice(handCards.indexOf(data.card), 1);
            } else {
                //如果是不是自己且未开启调试模式就删除对应数量即可
                handCards.splice(0, 1);
            }
            --count;
        }
    } else if (data.operate === ApiBpmj.operateType.CHI ||
        data.operate === ApiBpmj.operateType.GANG_CHI ||
        data.operate === ApiBpmj.operateType.GANG_ZHI ||
        data.operate === ApiBpmj.operateType.GANG_BU) { //杠的时候删除手牌
        if (isMe || !!isTest) {
            let list = data.plusInfo.cardList.slice(); //需要删除的牌
            //有可能是字符串 需要强转一下
            if (data.operate === ApiBpmj.operateType.CHI ||
                data.operate === ApiBpmj.operateType.GANG_CHI) {
                let idx = list.indexOf(data.card);
                if (idx !== -1) list.splice(idx, 1);
            }
            for (let i = 0; i < list.length; i++) {
                const del = list[i];
                for (let j = 0; j < handCards.length; j++) {
                    const card = handCards[j];
                    if (card === del) {
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
    }
    this.handCards[data.uid] = handCards;
    // console.log('推送用户操作', data, handCards);
}

/**获取出的牌 */
model.getOutTilesByUID = function (uid) {
    this.operateRecords = this.operateRecords || [];
    let outs = [];
    let operateRecords = this.operateRecords.slice();
    let optFilter = [
        ApiBpmj.operateType.CHI,
        ApiBpmj.operateType.PENG,
        ApiBpmj.operateType.GANG_CHI,
        ApiBpmj.operateType.HU_CHI
    ];
    for (let index = 0; index < operateRecords.length; index++) {
        let opt = operateRecords[index];
        if (!opt || opt.uid != uid) continue;
        if (opt.operate == ApiBpmj.operateType.QI) {
            if (index == operateRecords.length - 1) {
                outs.push(opt);
            } else {
                let outCardIndex = index;
                let isDel = true;
                for (let oci = outCardIndex + 1; oci < operateRecords.length; oci++) {
                    let ocpt = operateRecords[oci];
                    if (!ocpt) continue;
                    if (ocpt.operate == ApiBpmj.operateType.QI) {
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
    // console.log('获取到的出牌', this.operateRecords, outs);
    return outs;
}

/**获取剩余牌的数量 */
model.getRestCardCount = function (card) {
    let showCount = 0;
    let myUid = this.getMyUID();
    let myHandCards = this.getHandCards(myUid);
    for (let i = 0; i < this.operateRecords.length; ++i) {
        let item = this.operateRecords[i];
        if (item.operate == ApiBpmj.operateType.GANG_ZHI || item.operate == ApiBpmj.operateType.GANG_CHI || item.operate == ApiBpmj.operateType.CHI) {
            let cardList = item.plusInfo.cardList
            for (let i = 0; i < cardList.length; i++) {
                const c = cardList[i];
                if (c === card) {
                    showCount++
                }
            }
        } else if (item.card == card) {
            if (item.operate == ApiBpmj.operateType.PENG) {
                showCount += 2;
            } else if (item.operate == ApiBpmj.operateType.GANG_BU) {
                ++showCount;
            } else if (item.operate == ApiBpmj.operateType.QI) {
                ++showCount;
            }
        }
    }
    for (let item of myHandCards) {
        if (item == card) {
            ++showCount;
        }
    }
    let totalCount = 4;
    let rest = totalCount - showCount;
    return (rest < 0) ? 0 : rest;
};

model.qiangGangHuDel = function (data) {
    return;
    let handCards = this.handCards[data.uid];
    handCards.splice(handCards.indexOf(data.card), 1);
}

model.setUserScores = function (value) {
    this.userScoreList = value
}
model.getUserScoreByChairId = function (chairID) {
    return this.userScoreList[chairID]
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

model.canDiscard = function (limit = false) {
    let onceClick = !!ConfigModel.singleOut();
    let gameStatus = this.getGameStatus();
    let canDiscard = gameStatus == ApiBpmj.gameStatus.PLAYING;
    return !!canDiscard && (!!limit || !!onceClick);
}

model.getBundleType = function () {
    return this.getGameRuleByKey('gameType') || Enums.bundleType.BPMJ;
}