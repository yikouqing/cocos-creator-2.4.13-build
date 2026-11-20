const Enums = require('../../../src/const/Enums');
const ApiPzhmj = require('./ApiPzhmj');
const UserModel = require('../../../src/model/UserModel');
const ConfigModel = require('../../../src/model/ConfigModel');
const PZHMJLogic = require('./PZHMJLogic');
const Utils = require('../../../src/utils/Utils');

var model = module.exports;

/**初始化数据 */
model.init = function (data) {
    // console.log('====================游戏初始化=====================', data);
    this.reset();
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
    this.huanPaiList = data.gameData.huanPaiList || {};
    this.operateRecords = data.gameData.operateRecords || [];
    this.askForExitArr = null;

    this.userHuDoneList = data.gameData.userHuDoneList || []
    this.shaiPaiUser = data.gameData.shaiPaiUser || {}
    this.allHuCards = data.gameData.allHuCards || []
    this.isBaoTinging = false
    this.isBaiPaiing = false
    this.userStatus = data.gameData.userStatus || {}
}

model.isGameInited = function () {
    return this.gameInited
}

model.setGameInit = function (value) {
    this.gameInited = value
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

    this.shaiPaiUser = {}
    this.allHuCards = []
    this.userHuDoneList = []
    this.isBaoTinging = false
    this.isBaiPaiing = false
    this.userStatus = {}
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

model.getUserSexByUID = function (uid) {
    let sex = "nv";
    let userObj = this.getUserByUID(uid);
    if (userObj && !!userObj.userInfo && userObj.userInfo.sex == 0) {
        sex = 'nan'
    }
    return sex;
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
    let uid = this.getMyUID()
    let dtype = this.getDingQueType(uid)
    let hasDingQueCard = false;
    if (dtype !== -1) {
        let hands = this.handCards[uid]
        for (let i = 0; i < hands.length; i++) {
            const card = hands[i];
            if (dtype === PZHMJLogic.getCardColor(card)) {
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
        ApiPzhmj.operateType.CHI,
        ApiPzhmj.operateType.PENG,
        ApiPzhmj.operateType.GANG_CHI,
        ApiPzhmj.operateType.HU_CHI
    ];
    for (let index = operateRecords.length - 1; index >= 0; index--) {
        let opt = operateRecords[index];
        if (!opt) continue;
        if (opt.operate == ApiPzhmj.operateType.QI) {
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
        if (array[i].operate == ApiPzhmj.operateType.GANG_BU) {
            for (let j = array.length - 1; j >= 0; --j) {
                if (array[j].card == array[i].card &&
                    array[j].operate == ApiPzhmj.operateType.PENG &&
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
    return tpOp.uid == opt.uid && tpOp.operate == ApiPzhmj.operateType.GET ? tpOp : null
};

/**获取所有吃碰杠的操作信息 */
model.getPengGangArrayByUID = function (uid) {
    let optFilter = [
        ApiPzhmj.operateType.PENG,
        ApiPzhmj.operateType.GANG_CHI,
        ApiPzhmj.operateType.GANG_BU,
        ApiPzhmj.operateType.GANG_ZHI,
        ApiPzhmj.operateType.CHI
    ];
    let array = [];
    for (let item of this.operateRecords) {
        if (item.uid == uid && optFilter.indexOf(item.operate) != -1) {
            array.push(item);
        }
    }
    /**如果有补杠操作，就找到之前碰的操作给他删除掉 */
    for (let i = array.length - 1; i >= 0; --i) {
        if (array[i].operate == ApiPzhmj.operateType.GANG_BU) {
            for (let j = array.length - 1; j >= 0; --j) {
                if (array[j].card == array[i].card &&
                    array[j].operate == ApiPzhmj.operateType.PENG &&
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

model.isTurn = function (uid) {
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
        let zimo = optlist.find(opt => opt.operate == ApiPzhmj.operateType.HU_ZHI)
        if (zimo && zimo.card == huId) {
            let del = hand.indexOf(zimo.card)
            hand.splice(del, 1);
        }
    }
}

/**获取排序后的手牌 */
model.getHandCards = function (uid, isAll = true) {
    this.handCards[uid] = this.handCards[uid] || [];
    let copyHandCards = this.handCards[uid].slice();
    let handCards = this.sortTiles(copyHandCards);
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
    return this.ghostCard || [];
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
    let ghosts = this.getGhostCard()
    for (const cardId of checkCards) {
        if (!ghosts.includes(cardId)) {
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
model.sortTiles = function (handCards) {
    handCards = handCards || [];
    if (handCards.length > 0) {
        handCards.sort((a, b) => {
            return a - b;
        });
        let laizi = [];
        let ghostCard = this.getGhostCard();
        for (let i = 0; i < handCards.length; i++) {
            const t = handCards[i];
            let isDel = false;
            if (ghostCard.includes(t)) {
                laizi.push(t);
                isDel = true;
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
    }
    return handCards;
}

/**通知用户操作 */
model.onGameTurn = function (data) {
    let dataCopy = Utils.deepCopy(data)
    if (dataCopy.operateArray.some(opt => opt.type == ApiPzhmj.operateType.QI)) {
        if (dataCopy.card != null) {
            dataCopy.operate = ApiPzhmj.operateType.GET;
            this.handCards[dataCopy.uid].push(dataCopy.card);
            this.operateRecords.push(dataCopy);
        }
        this.operateUid = dataCopy.uid;
    } else if (dataCopy.operateArray.some(opt => opt.type == ApiPzhmj.operateType.GET)) {
        dataCopy.operate = ApiPzhmj.operateType.GET;
        this.handCards[dataCopy.uid].push(dataCopy.card);
        this.operateRecords.push(dataCopy);
        this.operateUid = dataCopy.uid;
    }
    // console.log('通知用户操作', data);
}

/**用户操作广播 */
model.onUserOpt = function (data) {
    //设置胡牌信息
    let huFilter = [
        ApiPzhmj.operateType.HU_ZHI,
        ApiPzhmj.operateType.HU_CHI,
        ApiPzhmj.operateType.HU_QIANG,
    ];
    let isHu = huFilter.includes(data.operate);
    if (isHu) {
        this.pushUserHuDonList(data);
    }
    let isTest = UserModel.getData('isTest');
    let isMe = data.uid == this.getMyUID();
    this.operateRecords.push(data);
    let count = 0;
    if (data.operate == ApiPzhmj.operateType.QI) {
        count = 1;
        this.operateCard = data.card;
        this.lastOperateUid = data.uid;
        this.operateUid = null;
    } else if (data.operate == ApiPzhmj.operateType.PENG ||
        data.operate === ApiPzhmj.operateType.CHI) {
        count = 2;
        this.operateUid = data.uid;
    } else if (data.operate == ApiPzhmj.operateType.GANG_CHI) {
        count = 3;
        this.operateUid = data.uid;
    } else if (data.operate == ApiPzhmj.operateType.GANG_ZHI) {
        count = data.plusInfo.cardList.length; //中发白的杠只有3张
        this.operateUid = data.uid;
    } else if (data.operate === ApiPzhmj.operateType.GANG_BU ||
        data.operate === ApiPzhmj.operateType.HU_ZHI) {
        count = 1;
        this.operateUid = data.uid;
    }
    this.handCards[data.uid] = this.handCards[data.uid] || [];
    let handCards = this.handCards[data.uid].slice();
    if (data.operate === ApiPzhmj.operateType.HU_ZHI ||
        data.operate === ApiPzhmj.operateType.PENG ||
        data.operate === ApiPzhmj.operateType.QI) {
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
    } else if (data.operate === ApiPzhmj.operateType.CHI ||
        data.operate === ApiPzhmj.operateType.GANG_CHI ||
        data.operate === ApiPzhmj.operateType.GANG_ZHI ||
        data.operate === ApiPzhmj.operateType.GANG_BU) {
        if (isMe || !!isTest) {
            let list = data.plusInfo.cardList.slice(); //需要删除的牌
            //如果是吃牌，把吃的那张牌从删除列表去掉，以免删除手牌中一样的牌
            if (data.operate === ApiPzhmj.operateType.CHI ||
                data.operate === ApiPzhmj.operateType.GANG_CHI) {
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
    // console.log('用户操作广播', data, handCards);
}

/**获取出的牌 */
model.getOutTilesByUID = function (uid) {
    this.operateRecords = this.operateRecords || [];
    let outs = [];
    let operateRecords = this.operateRecords.slice();
    let optFilter = [
        ApiPzhmj.operateType.CHI,
        ApiPzhmj.operateType.PENG,
        ApiPzhmj.operateType.GANG_CHI,
        ApiPzhmj.operateType.HU_CHI
    ];
    for (let index = 0; index < operateRecords.length; index++) {
        let opt = operateRecords[index];
        if (!opt || opt.uid != uid) continue;
        if (opt.operate == ApiPzhmj.operateType.QI) {
            if (index == operateRecords.length - 1) {
                outs.push(opt);
            } else {
                let outCardIndex = index;
                let isDel = false;
                for (let oci = outCardIndex + 1; oci < operateRecords.length; oci++) {
                    let ocpt = operateRecords[oci];
                    if (!ocpt) continue;
                    if (ocpt.operate == ApiPzhmj.operateType.QI) {
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
    // console.log("获取到的出牌===", this.operateRecords, outs)
    return outs;
}

/**获取剩余牌的数量 */
model.getRestCardCount = function (card) {
    let showCount = 0;
    let myUid = this.getMyUID();
    let myHandCards = this.getHandCards(myUid);
    for (let i = 0; i < this.operateRecords.length; ++i) {
        let item = this.operateRecords[i];
        if (item.operate == ApiPzhmj.operateType.GANG_ZHI || item.operate == ApiPzhmj.operateType.GANG_CHI || item.operate == ApiPzhmj.operateType.CHI) {
            let cardList = item.plusInfo.cardList
            for (let i = 0; i < cardList.length; i++) {
                const c = cardList[i];
                if (c === card) {
                    showCount++
                }
            }
        } else if (item.card == card) {
            if (item.operate == ApiPzhmj.operateType.PENG) {
                showCount += 2;
            } else if (item.operate == ApiPzhmj.operateType.GANG_BU) {
                ++showCount;
            } else if (item.operate == ApiPzhmj.operateType.QI) {
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
};

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

model.getTerseRule = function (spacer) {
    let gameRule = this.getGameRule();
    if (!gameRule) return "";
    let rules = []
    rules.push("底分" + gameRule.baseScore)
    if (gameRule.fengDing == 0) {
        rules.push("不封顶")
    } else {
        rules.push("封顶" + gameRule.fengDing)
    }

    let fangNum = gameRule.fangShu
    rules.push(fangNum + "房")
    if (fangNum == 2) {
        let paiName = ["", "万", "筒", "条"]
        rules.push(`缺${paiName[gameRule.queYiMen]}`)
    } else if (fangNum == 3) {
        let queName = ["不缺", "必缺", "选缺"]
        rules.push(`${queName[gameRule.queType]}`)
    }

    if (!!gameRule.ziMoType && gameRule.ziMoType == 1) {
        rules.push(`自摸加底`)
    } else if (!!gameRule.ziMoType && gameRule.ziMoType == 2) {
        rules.push(`自摸加番`)
    }
    if (gameRule.yiTiaoLong) {
        rules.push("一条龙")
    }
    if (gameRule.kaXinWu) {
        rules.push("卡心五")
    }
    if (gameRule.bianKaDiao) {
        rules.push("边卡吊")
    }
    if (gameRule.gangBuSuanGen) {
        rules.push("杠不算根")
    }
    if (gameRule.huJiaoZhuanYi) {
        rules.push("呼叫转移")
    }
    if (gameRule.chaJiaoTuiShui) {
        rules.push("查叫退税")
    }
    if (gameRule.tingHouKeGang) {
        rules.push("听后可杠")
    }
    if (gameRule.xianShiLiuShui) {
        rules.push("显示流水")
    }
    if (gameRule.guoShuiGuoFanKeHu) {
        rules.push("过水过番可胡")
    }
    if (gameRule.guoPengGuoQuan) {
        rules.push("过碰过圈")
    }
    if (gameRule.guoHuGuoQuan) {
        rules.push("过胡过圈")
    }
    if (gameRule.buKeXianPengHouGang) {
        rules.push("不可先碰后杠")
    }

    return rules.join(spacer)
}

model.canDiscard = function (limit = false) {
    let onceClick = !!ConfigModel.singleOut();
    let gameStatus = this.getGameStatus();
    let canDiscard = gameStatus == ApiPzhmj.gameStatus.PLAYING;
    return !!canDiscard && (!!limit || !!onceClick);
}

/**设置摆牌信息 */
model.setBaiPaiInfo = function (data) {
    if (data.operate == ApiPzhmj.operateType.TIAOWU) {
        if (!this.shaiPaiUser[data.uid]) {
            this.shaiPaiUser[data.uid] = {
                cardList: data.plusInfo.cardList
            }
        } else {
            this.shaiPaiUser[data.uid].cardList = data.plusInfo.cardList
        }
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
    this.allHuCards = data
}

/**获取摆牌后不能出的牌 */
model.getSelfAllHuCards = function () {
    return this.allHuCards || []
}

/**获取某张牌是否能出 */
model.getSelfCanOutCard = function (card) {
    let allHuCards = this.getSelfAllHuCards()
    for (let i = 0; i < allHuCards.length; i++) {
        if (allHuCards[i] == card) {
            return false
        }
    }
    return true
}

model.setIsBaoTing = function (value) {
    this.isBaoTinging = value
}
model.getIsBaoTing = function () {
    return this.isBaoTinging
}
model.setIsBaiPai = function (value) {
    this.isBaiPaiing = value
}
model.getIsBaiPai = function () {
    return this.isBaiPaiing
}

/**设置已经胡牌的人 */
model.pushUserHuDonList = function (data) {
    if (!data.operateType && data.operate) {
        data.operateType = data.operate
    }
    this.userHuDoneList.push(data)
}

model.setUserHuDonList = function (value) {
    this.userHuDoneList = value || []
}
/**获取胡牌的信息 */
model.getUserHuDonList = function () {
    return this.userHuDoneList
}
/**获取自己是否还能出牌 */
model.getSelfCanOut = function () {
    let s = this.userStatus[this.myUid]
    if (typeof s == "number") {
        return s == 0
    }
    return true
}

model.setCanOutStatus = function (uid, type) {
    this.userStatus[uid] = type
}

model.qiangGangHuDel = function (data) {
    let handCards = this.handCards[data.uid];
    handCards.splice(handCards.indexOf(data.card), 1);
}

model.getBundleType = function () {
    return this.getGameRuleByKey('gameType') || Enums.bundleType.PZHMJ;
}