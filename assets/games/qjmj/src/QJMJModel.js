const Enums = require('../../../src/const/Enums');
const ApiQjmj = require('./ApiQjmj');
const UserModel = require('../../../src/model/UserModel');
const ConfigModel = require('../../../src/model/ConfigModel');
const QJMJLogic = require('./QJMJLogic');
const CCUtil = require('../../../src/utils/CCUtil');
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
    this.ghostCard = data.gameData.laiZiCards;
    this.dingQueType = data.gameData.queType || {};
    this.huanPaiList = data.gameData.huanPaiList || [];
    this.operateRecords = data.gameData.operateRecords || [];
    this.askForExitArr = null;
    this.shaiPaiUser = data.gameData.shaiPaiUser || {}
    this.allHuCards = data.gameData.allHuCards || []
    this.userHuDoneList = data.gameData.userHuDoneList || []

    this._isFan = data.gameData.isFan;
    this.GuMaiList = data.gameData.GuMaiList || {};
    this.jipailist = data.gameData.jipailist || [];

    this.userMenHuDoneList = data.gameData.userMenHuDoneList || [];
    this.userMenHuDoneList.forEach((obj) => {
        if (this.myUid == obj.uid && obj.operateType) {
            let operate = obj.operateType.operate;
            if (operate == ApiQjmj.operateType.MENPAI) {
                this.setMenHu(true);
            }
        }
    })
    this.tianTing = data.gameData.tianTing || {};
    for (const uid in this.tianTing) {
        if (uid == this.myUid) {
            this.setTianTing(true);
        }
    }
}
/**每局完成后重置数据 */
model.reset = function () {
    this.lastOperateUid = null;
    this.operateRecords = [];
    this.huanPaiList = [];
    this.huanPaiCards = {};
    this.dingQueType = {};
    this.suggestCard = {};
    this.curChairID = null;
    this.operateUid = null;
    this.operateCard = null;
    this.shaiPaiUser = {}
    this.allHuCards = []
    this.userHuDoneList = []
    this._TianTing = false;
    this._MenHu = false;
    this._getTingList = [];
    this._AllResult = null;
    this._Result = null;
    this._YuanBao = false;
    this._isFan = false;
    this._isUesrHu = false;
    this._chuangguanUser = null;
    this.restCardsCount = 0;
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
model.setRestCardsCount = function (value) {
    this.restCardsCount = value;
}
model.getRestCardsCount = function () {
    return this.restCardsCount || 0;
}
model.getRoomID = function () {
    return this.roomID;
}
model.setYuanBao = function (isShow) {
    this._YuanBao = isShow;
}
model.getYuanBao = function () {
    return !!this._YuanBao;
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
    let chairID = user && user.chairID >= 0 ? user.chairID : 0;
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

model.isHuPaiTiShi = function () {
    return !!this.getGameRuleByKey("hupaitishi");
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

model.setChuangGuanUser = function (uid) {
    this._chuangguanUser = uid;
}
model.getChuangGuanUser = function () {
    return this._chuangguanUser || null;
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
    if (this.curBureau > this.maxBureau) {
        return this.curBureau;
    }
    return this.maxBureau
};

/**获取是否胡牌 */
model.getIsHuPai = function (uid) {
    let info = this.userHuDoneList.find(u => u.uid == uid)
    if (info) {
        return true
    }
    return false
}


/**设置是否胡牌 */
model.setIsHuPai = function (data) {
    for (let i = 0; i < this.userHuDoneList.length; i++) {
        const info = this.userHuDoneList[i];
        if (info.uid == data.uid) {
            this.userHuDoneList.splice(i, 1)
            break
        }
    }
    this.userHuDoneList.push({
        uid: data.uid,
        huIndex: data.plusInfo.index
    })

    // console.log("this.userHuDoneList", this.userHuDoneList)
}

/**获取位置换牌是否完成 */
model.getIsHuanPai = function (chairID) {
    return this.huanPaiList[chairID];
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
    let uid = this.getMyUID()
    let dtype = this.getDingQueType(uid)
    let hasDingQueCard = false;
    if (dtype !== -1) {
        let hands = this.handCards[uid]
        for (let i = 0; i < hands.length; i++) {
            const card = hands[i];
            if (dtype === QJMJLogic.getCardColor(card)) {
                hasDingQueCard = true;
                break;
            }
        }
    }
    return hasDingQueCard;
}


model.getJipailist = function () {
    return this.jipailist || {};
}



/**操作时最后一个出牌的位置。用于删除桌面上打出来的牌 */
model.getLastOutCardRecord = function () {
    this.operateRecords = this.operateRecords || [];
    let operateRecords = Utils.deepCopy(this.operateRecords);
    if (operateRecords.length == 0) return null;
    let lastOut = {
        opt: null,
        isDel: false
    };
    let optFilter = [
        ApiQjmj.operateType.CHI,
        ApiQjmj.operateType.PENG,
        ApiQjmj.operateType.GANG_CHI,
        ApiQjmj.operateType.HU_CHI
    ];
    for (let index = operateRecords.length - 1; index >= 0; index--) {
        let opt = operateRecords[index];
        if (!opt) continue;
        if (opt.operate == ApiQjmj.operateType.QI) {
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
    let operateRecords = Utils.deepCopy(this.operateRecords);
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

model.getLastOperate = function (uid) {
    this.operateRecords = this.operateRecords || [];
    let operateRecords = Utils.deepCopy(this.operateRecords);
    let operateCount = operateRecords.length;
    if (operateCount == 0) return null;
    let opt = operateRecords[operateCount - 1];
    if (uid) {
        for (let i = operateRecords.length - 1; i >= 0; i--) {
            let r = operateRecords[i];
            if (r.uid && r.uid === uid) {
                opt = r
                break
            }
        }
    }
    return opt;
}
model.setResult = function (result) {
    this._Result = result;
}
model.setisFan = function (isFan) {
    this._isFan = !!isFan;
}
model.getisFan = function () {
    return !!this._isFan;
}
model.isUserHu = function () {
    return !!this.userHuDoneList.length;
}
model.getResult = function () {
    return this._Result;
}

model.setAllResult = function (result) {
    this._AllResult = result;
}

model.getAllResult = function () {
    return this._AllResult;
}
/**获取所有操作信息 */
model.getOptRecords = function (uid) {
    let opRecords = Utils.deepCopy(this.operateRecords);
    let array = [];
    for (let item of opRecords) {
        if (item.uid == uid) {
            array.push(item);
        }
    }
    /**如果有补杠操作，就找到之前碰的操作给他删除掉 */
    for (let i = array.length - 1; i >= 0; --i) {
        if (array[i].operate == ApiQjmj.operateType.GANG_BU) {
            for (let j = array.length - 1; j >= 0; --j) {
                if (array[j].card == array[i].card &&
                    array[j].operate == ApiQjmj.operateType.PENG &&
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
    let opRecords = Utils.deepCopy(this.operateRecords);
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
    return tpOp.uid == opt.uid && tpOp.operate == ApiQjmj.operateType.GET ? tpOp : null
};

/**获取所有吃碰杠的操作信息 */
model.getPengGangArrayByUID = function (uid) {
    let optFilter = [
        ApiQjmj.operateType.PENG,
        ApiQjmj.operateType.GANG_CHI,
        ApiQjmj.operateType.GANG_BU,
        ApiQjmj.operateType.GANG_ZHI,
        ApiQjmj.operateType.CHI
    ];
    let array = [];
    for (let item of this.operateRecords) {
        if (item.uid == uid && optFilter.indexOf(item.operate) != -1) {
            array.push(item);
        }
    }
    /**如果有补杠操作，就找到之前碰的操作给他删除掉 */
    for (let i = array.length - 1; i >= 0; --i) {
        if (array[i].operate == ApiQjmj.operateType.GANG_BU) {
            for (let j = array.length - 1; j >= 0; --j) {
                if (array[j].card == array[i].card &&
                    array[j].operate == ApiQjmj.operateType.PENG &&
                    array[j].uid == array[i].uid) {
                    array.splice(j, 1);
                    j = -1;
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

/**获取是否能操作 */
model.isTurn = function (uid) {
    // console.log('是否能操作==>' + this.operateUid == uid, "操作ID>", this.operateUid, "我ID>", uid)
    return this.operateUid == uid;
};

/**刷新的时候检查自摸并删除手牌 */
model.delZimoCard = function (uid) {
    this.handCards = this.handCards || {};
    let hand = this.handCards[uid];
    if (!hand) return;
    let opt = this.getLastOperate(uid)
    if (opt && opt.operate == ApiQjmj.operateType.HU_ZHI) {
        /**检查是不是有自摸操作，有就删除一张手牌 */
        let del = hand.indexOf(opt.card)
        hand.splice(del, 1);
    }
}

/**获取排序后的手牌 */
model.getHandCards = function (uid, isAll = true) {
    this.handCards[uid] = this.handCards[uid] || [];
    let copyHandCards = this.handCards[uid].slice();
    let handCards = this.sortTiles(uid, copyHandCards);
    if (!isAll) {
        let baipai = this.getBaiPaiInfo(uid)
        if (baipai && Array.isArray(baipai) && baipai.length > 0) {
            let clist = baipai.slice()
            while (clist.length > 0) {
                let id = clist.pop()
                handCards.splice(handCards.indexOf(id), 1)
            }
        }
    }
    return handCards.slice();
}

/**设置摆牌信息 */
model.setBaiPaiInfo = function (data) {
    this.setSelfAllHuCards(data)
    if (!this.shaiPaiUser[data.uid]) {
        this.shaiPaiUser[data.uid] = {
            cardList: data.cardList
        }
    } else {
        this.shaiPaiUser[data.uid].cardList = data.cardList
    }
}

/**获取摆牌信息 */
model.getBaiPaiInfo = function (uid) {
    let info = this.shaiPaiUser[uid]
    if (info) {
        return info.cardList
    }
    return []
}

model.setSelfAllHuCards = function (data) {
    this.allHuCards = data.allHuCards
}

/**获取摆牌后不能出的牌 */
model.getSelfAllHuCards = function () {
    return [] //this.allHuCards || []
}

model.setuserMenHuDoneList = function (uid, cardID, huIndex) {
    this.userMenHuDoneList.push({
        uid: uid,
        card: cardID,
        huIndex: huIndex
    })
}
model.getuserMenHuDoneList = function () {
    return this.userMenHuDoneList || [];
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
model.setallHuCards = function (list) {
    this.allHuCards = list || [];
}
model.getallHuCards = function () {
    return this.allHuCards
}


model.getGhostCard = function () {
    return this.ghostCard || -1;
};

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

/**手牌排序 */
model.sortTiles = function (uid, handCards) {
    handCards = handCards || [];
    if (handCards.length > 0) {
        handCards.sort((a, b) => {
            return a - b;
        });
        let laizi = [];
        let dingque = [];
        let ghostCard = this.getGhostCard();
        let dtype = this.getDingQueType(uid);
        for (let i = 0; i < handCards.length; i++) {
            const t = handCards[i];
            let isDel = false;
            if (ghostCard == t) {
                laizi.push(t);
                isDel = true;
            } else if (dtype !== -1) {
                if (dtype == QJMJLogic.getCardColor(t)) {
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
    this.huanPaiList[data.chairID] = data.cardList;
}

/**换牌完成 */
model.onHuanPaiEnd = function (data) {
    let array = this.handCards[data.uid];
    data.cardList.forEach(card => {
        array.push(card);
    });
    this.huanPaiCards[data.uid] = data.cardList;
    this.huanPaiList[data.chairID] = data.cardList;
}

/**获取自己的定缺推荐 */
model.getDingQueSuggest = function () {
    let myHand = this.handCards[this.getMyUID()]
    let hua = [0, 0, 0]
    myHand.forEach(card => {
        let c = QJMJLogic.getCardColor(card)
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

/**通知用户操作 */
model.onGameTurn = function (data) {
    if (data.operateArray.indexOf(ApiQjmj.operateType.QI) != -1) {
        if (data.card != null) {
            data.operate = ApiQjmj.operateType.GET;
            this.handCards[data.uid].push(data.card);
            this.operateRecords.push(data);
        }
        this.operateUid = data.uid;
    } else if (data.operateArray.indexOf(ApiQjmj.operateType.GET) != -1) {
        data.operate = ApiQjmj.operateType.GET;
        this.handCards[data.uid].push(data.card);
        this.operateRecords.push(data);
        this.operateUid = data.uid;
    } else if (!!this.getGameRuleByKey("zuihousizhangbihu")) {
        if (this.getRestCardsCount() <= 4) {
            if (data.operateArray.indexOf(ApiQjmj.operateType.HU_ZHI) != -1) {
                this.handCards[data.uid].push(data.card);
            }
        }
    }
    if (!!data.plusInfo) {
        let plusInfo = data.plusInfo || {};
        // this.allHuCards = plusInfo.allHuCards || [];
        this._getTingList = plusInfo.getTingList || [];

    }

}
model.getAllOperateRecords = function () {
    return this.operateRecords || [];
}
model.getTingList = function () {
    return this._getTingList;
}
model.setTianTing = function (isTing) {
    this._TianTing = isTing;
}
model.getTianTing = function () {
    return !!this._TianTing;
}

model.setMenHu = function (isShow) {
    this._MenHu = isShow;
}
model.getMenHu = function () {
    return !!this._MenHu;
}

/**用户操作广播 */
model.onUserOpt = function (data) {
    this.handCards[data.uid] = this.handCards[data.uid] || [];
    let isTest = UserModel.getData('isTest');
    let handCards = this.handCards[data.uid].slice();
    let isMe = data.uid == this.getMyUID();
    this.operateRecords.push(data);
    let count = 0;
    if (data.operate == ApiQjmj.operateType.QI) {
        count = 1;
        this.operateCard = data.card;
        this.lastOperateUid = data.uid;
        this.operateUid = null;
    } else if (data.operate == ApiQjmj.operateType.PENG ||
        data.operate === ApiQjmj.operateType.CHI) {
        count = 2;
        this.operateUid = data.uid;
    } else if (data.operate == ApiQjmj.operateType.GANG_CHI) {
        count = 3;
        this.operateUid = data.uid;
    } else if (data.operate == ApiQjmj.operateType.GANG_ZHI) {
        count = 4;
        this.operateUid = data.uid;
    } else if (data.operate == ApiQjmj.operateType.GANG_BU ||
        data.operate === ApiQjmj.operateType.HU_ZHI) {
        this.operateUid = data.uid;
        if (isMe && this.operateRecords.length == 1) { //起手天胡
            count = 0;
        } else {
            count = 1;
        }
    } else if (data.operate == ApiQjmj.operateType.MENPAI) {
        let plusInfo = data.plusInfo || {};
        let operateType = plusInfo.operateType || -1;
        if (operateType == ApiQjmj.operateType.HU_ZHI) {
            count = 1;
        }
        this.operateUid = data.uid;
        isMe && this.setMenHu(true);
    } else if (data.operate == ApiQjmj.operateType.TIANTING) {
        isMe && this.setTianTing(true);
    }

    if (data.operate === ApiQjmj.operateType.HU_ZHI ||
        data.operate == ApiQjmj.operateType.MENPAI ||
        data.operate == ApiQjmj.operateType.PENG ||
        data.operate == ApiQjmj.operateType.QI) {
        while (count > 0) {
            if (isMe || !!isTest) {
                handCards.splice(handCards.indexOf(data.card), 1);
            } else {
                handCards.splice(0, 1);
            }
            --count;
        }
    } else if (data.operate === ApiQjmj.operateType.CHI ||
        data.operate === ApiQjmj.operateType.GANG_CHI ||
        data.operate === ApiQjmj.operateType.GANG_ZHI ||
        data.operate === ApiQjmj.operateType.GANG_BU) { //杠的时候删除手牌
        if (isMe || !!isTest) {
            let list = data.plusInfo.cardList.slice(); //需要删除的牌
            //有可能是字符串 需要强转一下
            if (data.operate === ApiQjmj.operateType.CHI ||
                data.operate === ApiQjmj.operateType.GANG_CHI) {
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
    if (data.operate === ApiQjmj.operateType.HU_ZHI || data.operate === ApiQjmj.operateType.HU_CHI ||
        data.operate === ApiQjmj.operateType.HU_QIANG) {
        this.setIsHuPai(data)
    }
    // console.log('玩家操作广播=data.operate', data.operate, handCards, data);
}


model.setHuCards = function (CardsID) {
    this._huCards = CardsID;
}
model.getHuCards = function () {
    return this._huCards;
}

model.getOperateRecords = function (uid) {
    let operateRecords = this.operateRecords.filter(item => {
        return item.uid == uid && item.operate != ApiQjmj.operateType.QI && item.operate != ApiQjmj.operateType.GET
    });
    return operateRecords || [];
}
/**获取出的牌 */
model.getOutTilesByUID = function (uid) {
    let outs = [];
    this.operateRecords = this.operateRecords || [];
    let operateRecords = Utils.deepCopy(this.operateRecords);
    let optFilter = [
        ApiQjmj.operateType.CHI,
        ApiQjmj.operateType.PENG,
        ApiQjmj.operateType.GANG_CHI,
        ApiQjmj.operateType.HU_CHI
    ];
    for (let index = 0; index < operateRecords.length; index++) {
        let opt = operateRecords[index];
        if (!opt || opt.uid != uid) continue;
        if (opt.operate == ApiQjmj.operateType.QI) {
            if (index == operateRecords.length - 1) {
                outs.push(opt);
            } else {
                let isDel = false;
                let outCardIndex = index;
                for (let oci = outCardIndex + 1; oci < operateRecords.length; oci++) {
                    let ocpt = operateRecords[oci];
                    if (!ocpt) continue;
                    if (ocpt.operate == ApiQjmj.operateType.QI) {
                        isDel = false;
                        break;
                    } else {
                        if (optFilter.indexOf(ocpt.operate) != -1) {
                            isDel = true;
                            break;
                        } else if (ocpt.operate == ApiQjmj.operateType.MENPAI) {
                            if (ocpt.plusInfo &&
                                ocpt.plusInfo.operateType == ApiQjmj.operateType.HU_CHI) {
                                isDel = true;
                                break;
                            }
                        }
                    }
                }
                if (!isDel) {
                    outs.push(opt);
                }
            }
        }
    }
    // console.log(uid, '获取到的出牌', outs,this.operateRecords);
    return outs.slice();
}

/**获取剩余牌的数量 */
model.getRestCardCount = function (card) {
    let showCount = 0;
    let myUid = this.getMyUID();
    let myHandCards = this.getHandCards(myUid);
    for (let i = 0; i < this.operateRecords.length; ++i) {
        let item = this.operateRecords[i];
        if (item.operate == ApiQjmj.operateType.GANG_ZHI || item.operate == ApiQjmj.operateType.GANG_CHI || item.operate == ApiQjmj.operateType.CHI) {
            let cardList = item.plusInfo.cardList
            for (let i = 0; i < cardList.length; i++) {
                const c = cardList[i];
                if (c === card) {
                    showCount++
                }
            }
        } else if (item.card == card) {
            if (item.operate == ApiQjmj.operateType.PENG) {
                showCount += 2;
            } else if (item.operate == ApiQjmj.operateType.GANG_BU) {
                ++showCount;
            } else if (item.operate == ApiQjmj.operateType.QI) {
                ++showCount;
            } else if (item.operate == ApiQjmj.operateType.MENPAI) {
                ++showCount;
            }
        }
    }
    for (let item of myHandCards) {
        if (item == card) {
            ++showCount;
        }
    }
    let totalCount = card == this.getGhostCard() ? 3 : 4;
    let rest = totalCount - showCount;
    return (rest < 0) ? 0 : rest;
};

model.qiangGangHuDel = function (data) {
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
    let canDiscard = gameStatus == ApiQjmj.gameStatus.PLAYING;
    return !!canDiscard && (!!limit || !!onceClick);
}

model.getBundleType = function () {
    return this.getGameRuleByKey('gameType') || Enums.bundleType.QJMJ;
}