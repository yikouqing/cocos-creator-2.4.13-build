const Enums = require('../../../src/const/Enums');
const ApiXz = require('./ApiXz');
const ApiRoom = require('../../../src/api/ApiRoom');
const UserModel = require('../../../src/model/UserModel');
const ConfigModel = require('../../../src/model/ConfigModel');
const XZLogic = require('./XZLogic');

var model = module.exports;
/**初始化数据 */
model.init = function (data) {
    // console.log('游戏初始化', data);
    this.reset()
    UserModel.setDatas(data);
    this.gameInited = true;
    this.roomUserInfoArr = data.roomUserInfoArr;
    this.gameRule = data.gameRule;
    this.roomID = data.roomID;
    this.roomCreatorInfo = data.roomCreatorInfo;
    this.gameStatus = data.gameData.gameStatus;
    this.gameStarted = data.gameData.gameStarted;
    this.tick = data.gameData.tick;
    this.bankerChairID = data.gameData.bankerChairID;
    this.handCards = data.gameData.handCards;
    this.operateRecord = data.gameData.operateRecord;
    this.curBureau = data.gameData.curBureau;
    this.maxBureau = data.gameData.maxBureau;
    this.chairCount = data.gameData.chairCount;
    this.userTrustArray = data.gameData.userTrustArray;
    this.operateArrays = data.gameData.operateArrays;
    this.result = data.gameData.result;
    this.curChairID = data.gameData.curChairID;
    this.curScores = data.gameData.curScores
    this.restCardsCount = data.gameData.restCardsCount;
    this.winChairIDArray = data.gameData.winChairIDArray;
    this.userScoreList = data.gameData.userScoreList
    this.myUid = UserModel.getData('uid');
    this.suggestCard = data.gameData.suggestCard || [];
    if (data.gameData.queType)
        this.dingQueType = data.gameData.queType;
    if (!!data.gameData.huanPaiList) {
        let huanPaiList = data.gameData.huanPaiList
        for (let i = 0; i < huanPaiList.length; i++) {
            if (!!huanPaiList[i] && huanPaiList[i].length != 0) {
                this.isHuanPai[i] = 1;
            } else {
                this.isHuanPai[i] = 0;
            }
        }
    }

    this.askForExitArr = null;
}

/**每局完成后重置数据 */
model.reset = function () {
    this.operateRecord = []
    this.isHuanPai = [0, 0, 0, 0]
    this.huanPiaArr = [
        [],
        [],
        [],
        [],
    ]
    this.dingQueType = [-1, -1, -1, -1]
    this.suggestCard = [null, null, null, null]
}

/**清理所有数据 */
model.resetAll = function () {
    this.reset()
    this.gameInited = false
}

model.getBundleType = function () {
    return this.getGameRuleByKey('gameType') || Enums.bundleType.XZMJ;
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
        ApiRoom.gameMessageNotify(ApiXz.gameLookCardsNotify(this.getMyChairID()));
    }
}

/**座位号转换 */
model.getUserChairIndex = function (chairID) {
    return (chairID - this.getMyChairID() + this.gameRule.maxPlayerCount) % this.gameRule.maxPlayerCount;
}

model.getUserByUID = function (uid) {
    this.roomUserInfoArr = this.roomUserInfoArr || [];
    let roomUser = this.roomUserInfoArr.find((user) => {
        return user.userInfo.uid == uid;
    });
    return roomUser;
};

/**座位号转换 */
model.getUserIndexByUID = function (uid) {
    let user = this.getUserByUID(uid);
    if (!user) return null;
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
    return this.gameRule ? this.gameRule.maxPlayerCount : 0;
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

/**获取位置换牌是否完成 */
model.getIsHuanPai = function (chairID) {
    return this.isHuanPai[chairID]
}

/**获取位置定缺类型 */
model.getDingQueType = function (chairID) {
    return this.dingQueType[chairID]
}
model.setDingQueType = function (chairID, type) {
    this.dingQueType[chairID] = type
}

model.getLastOperate = function () {
    this.operateRecord = this.operateRecord || [];
    let operateRecord = this.operateRecord.slice();
    let operateCount = operateRecord.length;
    if (operateCount == 0) return null;
    let opt = operateRecord[operateCount - 1];
    return opt;
}

//找到这次打牌前是不是摸的牌
model.getQiByMo = function (opt) {
    let tpOp = null;
    let opRecords = this.operateRecord.slice();
    let opLength = opRecords.length;
    if (opLength <= 0) return tpOp;
    let opIndex = -1;
    for (let index = opLength - 1; index >= 0; index--) {
        let op = opRecords[index];
        if (!op) continue;
        if (op.chairID == opt.chairID &&
            op.operate == opt.operate &&
            op.card == opt.card) {
            opIndex = index;
            break;
        }
    }
    if (opIndex <= 0) return tpOp;
    tpOp = opRecords[opIndex - 1];
    return tpOp.chairID == opt.chairID && tpOp.operate == ApiXz.operateType.GET ? tpOp : null
};

/**获取手牌中是否还有定缺的牌 */
model.getHasDingQueCard = function () {
    let chairID = this.getMyChairID()
    let dtype = this.getDingQueType(chairID)
    if (dtype !== -1) {
        let hand = this.handCards[chairID]
        for (let i = 0; i < hand.length; i++) {
            const card = hand[i];
            if (dtype === XZLogic.getCardColor(card)) {
                return true
            }
        }
    }
    return false
}

/**获取自己手牌中的定缺列表 */
model.getDingQueList = function () {
    let chairID = this.getMyChairID()
    let dtype = this.getDingQueType(chairID)
    let list = []
    if (dtype !== -1) {
        let hand = this.handCards[chairID]
        for (let i = 0; i < hand.length; i++) {
            const card = hand[i];
            if (dtype === XZLogic.getCardColor(card)) {
                list.push(card)
            }
        }
    }
    return list
}

/**操作时最后一个出牌的位置。用于删除桌面上打出来的牌 */
model.getLastOutCardRecord = function () {
    const opt = this.operateRecord[this.operateRecord.length - 1];
    const opt1 = this.operateRecord[this.operateRecord.length - 2]
    if (opt && opt1) {
        let tmp = [ApiXz.operateType.CHI, ApiXz.operateType.PENG, ApiXz.operateType.GANG_CHI]
        if (tmp.includes(opt.operate) && opt1.operate == ApiXz.operateType.QI) {
            return opt1
        }
        if (opt.operate == ApiXz.operateType.HU_CHI && opt1.operate == ApiXz.operateType.QI) {
            return opt1
        }
    }
    return null
}

/**获取所有操作信息 */
model.getOptRecord = function (chairID) {
    let array = [];
    for (let item of this.operateRecord) {
        if (item.chairID == chairID) {
            array.push(item);
        }
    }
    /**如果有补杠操作，就找到之前碰的操作给他删除掉 */
    for (let i = array.length - 1; i >= 0; --i) {
        if (array[i].operate == ApiXz.operateType.GANG_BU) {
            for (let j = array.length - 1; j >= 0; --j) {
                if (array[j].card == array[i].card && array[j].operate == ApiXz.operateType.PENG && array[j].chairID == array[i].chairID) {
                    array.splice(j, 1);
                    j = -1;
                }
            }
        }
    }
    return array;
}

/**获取所有吃碰杠的操作信息 */
model.getPengGangArrayByChairID = function (chairID) {
    let array = [];
    for (let item of this.operateRecord) {
        if (item.chairID == chairID && [ApiXz.operateType.PENG, ApiXz.operateType.GANG_CHI, ApiXz.operateType.GANG_BU, ApiXz.operateType.GANG_ZHI, ApiXz.operateType.CHI].indexOf(item.operate) != -1) {
            array.push(item);
        }
    }
    /**如果有补杠操作，就找到之前碰的操作给他删除掉 */
    for (let i = array.length - 1; i >= 0; --i) {
        if (array[i].operate == ApiXz.operateType.GANG_BU) {
            for (let j = array.length - 1; j >= 0; --j) {
                if (array[j].card == array[i].card && array[j].operate == ApiXz.operateType.PENG && array[j].chairID == array[i].chairID) {
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
    this.handCards = value
}
/**刷新的时候检查自摸并删除手牌 */
model.delZimoCard = function (chairID, huId) {
    let hand = this.handCards[chairID]
    if (!this.handCards || !Array.isArray(this.handCards) || !Array.isArray(this.handCards[chairID])) {
        // console.log("没有手牌数据！！！")
        return
    }
    let optlist = this.getOptRecord(chairID)
    if (optlist && optlist.length > 0) {
        /**检查是不是有自摸操作，有就删除一张手牌 */
        let zimo = optlist.find(opt => opt.operate == ApiXz.operateType.HU_ZHI)
        // console.log(`${chairID}号位置是否有自摸==`, zimo)
        if (zimo && zimo.card == huId) {
            let del = hand.indexOf(zimo.card)
            // console.log("删除前的手牌==", hand)
            hand.splice(del, 1)
            // console.log("删除后的手牌==", hand)
        }
    }
}

/**获取排序后的手牌 */
model.getHandCards = function (chairID) {
    if (!this.handCards || !Array.isArray(this.handCards) || !Array.isArray(this.handCards[chairID])) {
        return []
    }
    this.sortTiles(chairID)
    return this.handCards[chairID].slice()
}

/**手牌排序 */
model.sortTiles = function (chairID) {
    let tileIdList = this.handCards[chairID]
    if (tileIdList && tileIdList.length > 0) {
        tileIdList.sort((a, b) => a - b)
        /**找出癞子和定缺的牌*/
        let laizi = []
        let dingque = []
        let glist = XZLogic.getGhostList()
        let dtype = this.getDingQueType(chairID)
        for (let i = 0; i < tileIdList.length; i++) {
            const t = tileIdList[i];
            let isDel = false
            if (glist.includes(t)) {
                laizi.push(t)
                isDel = true
            } else if (dtype !== -1) {
                if (dtype == XZLogic.getCardColor(t)) {
                    dingque.push(t)
                    isDel = true
                }
            }
            if (isDel) {
                tileIdList.splice(i, 1)
                i--
            }
        }

        /**癞子放前面 */
        if (laizi.length > 0) {
            laizi.forEach(t => {
                tileIdList.unshift(t)
            });
        }
        /**定缺放后面 */
        if (dingque.length > 0) {
            dingque.forEach(t => {
                tileIdList.push(t)
            })
        }
    }
}

/**换牌选择完成 */
model.onHuanPaiChoose = function (data) {
    let array = this.handCards[data.chairID];
    for (let i = 0; i < data.cardList.length; i++) {
        const card = data.cardList[i];
        array.splice(array.indexOf(card), 1)
    }
    this.isHuanPai[data.chairID] = 1
}

/**换牌完成 */
model.onHuanPaiEnd = function (data) {
    let array = this.handCards[data.chairID];
    data.cardList.forEach(card => {
        array.push(card)
    });
    this.huanPiaArr[data.chairID] = data.cardList
    this.isHuanPai[data.chairID] = 1
}

/**获取自己的定缺推荐 */
model.getDingQueSuggest = function () {
    let myHand = this.handCards[this.getMyChairID()]
    let hua = [0, 0, 0]
    myHand.forEach(card => {
        let c = XZLogic.getCardColor(card)
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
    if (data.operateArray.indexOf(ApiXz.operateType.QI) != -1) {
        if (data.card != null) {
            data.operate = ApiXz.operateType.GET;
            this.handCards[data.chairID].push(data.card);
            this.operateRecord.push(data);
        }
    } else if (data.operateArray.indexOf(ApiXz.operateType.GET) != -1) {
        data.operate = ApiXz.operateType.GET;
        this.handCards[data.chairID].push(data.card);
        this.operateRecord.push(data);
    }
    this.curChairID = data.chairID;
}

/**用户操作广播 */
model.onUserOpt = function (data) {
    this.operateRecord.push(data);

    let count = 0;
    if (data.operate == ApiXz.operateType.QI) {
        count = 1;
    } else if (data.operate == ApiXz.operateType.PENG) {
        count = 2;
    } else if (data.operate == ApiXz.operateType.GANG_CHI || data.operate === ApiXz.operateType.CHI) {
        count = 3;
    } else if (data.operate == ApiXz.operateType.GANG_ZHI) {
        count = 4;
    } else if (data.operate == ApiXz.operateType.GANG_BU || data.operate === ApiXz.operateType.HU_ZHI) {
        count = 1;
    }
    let array = this.handCards[data.chairID];
    if (data.operate === ApiXz.operateType.HU_ZHI || data.operate == ApiXz.operateType.PENG || data.operate == ApiXz.operateType.QI || data.chairID !== this.getMyChairID()) {
        // console.log("碰牌和弃牌和不是自己删除之前的手牌==", array, "删除的数量==", count, "操作类型==", data.operate)
        while (count > 0) {
            array.splice(array.indexOf(data.card), 1);
            --count;
        }
        // console.log("碰牌和弃牌和不是自己删除之后的手牌==", array)
    } else if (data.operate === ApiXz.operateType.CHI || data.operate === ApiXz.operateType.GANG_CHI || data.operate === ApiXz.operateType.GANG_ZHI || data.operate === ApiXz.operateType.GANG_BU) { //杠的时候删除手牌
        // console.log("chi和杠牌的时候删除之前的手牌==", array)
        let list = data.plusInfo.cardList.slice() //需要删除的牌
        //如果是吃牌，把吃的那张牌从删除列表去掉，以免删除手牌中一样的牌
        if (data.operate === ApiXz.operateType.CHI || data.operate === ApiXz.operateType.GANG_CHI) {
            let idx = list.indexOf(data.card)
            if (idx !== -1) list.splice(idx, 1)
        }
        let c = 0
        for (let i = 0; i < list.length; i++) {
            const del = list[i];
            for (let j = 0; j < array.length; j++) {
                const card = array[j];
                if (card === del) {
                    array.splice(j, 1)
                    j--
                    c++
                    break
                }
            }
        }
        // console.log("吃喝杠牌的时候删除之后的手牌==", array, "删除的数量==", c, "操作类型==", data.operate)
    }
}

/**获取出的牌 */
model.getOutTiles = function (chairID) {
    let outarr = []
    let operateRecord = this.operateRecord
    for (let i = 0; i < operateRecord.length; ++i) {
        let item = operateRecord[i];
        let next = operateRecord[i + 1];
        if (next && ([ApiXz.operateType.PENG, ApiXz.operateType.GANG_CHI, ApiXz.operateType.HU_CHI, ApiXz.operateType.GANG_BU].indexOf(next.operate) != -1)) {
            continue;
        }
        if (item.chairID == chairID && item.operate == ApiXz.operateType.QI) {
            outarr.push(item.card)
        }
    }
    return outarr
}

/**获取剩余牌的数量 */
model.getRestCardCount = function (card) {
    let showCount = 0;
    let myChairID = this.getMyChairID();
    for (let i = 0; i < this.operateRecord.length; ++i) {
        let item = this.operateRecord[i];
        if (item.operate == ApiXz.operateType.GANG_ZHI || item.operate == ApiXz.operateType.GANG_CHI || item.operate == ApiXz.operateType.CHI) {
            let cardList = item.plusInfo.cardList
            for (let i = 0; i < cardList.length; i++) {
                const c = cardList[i];
                if (c === card) {
                    showCount++
                }
            }
        } else if (item.card == card) {
            if (item.operate == ApiXz.operateType.PENG) {
                showCount += 2;
            } else if (item.operate == ApiXz.operateType.GANG_BU) {
                ++showCount;
            } else if (item.operate == ApiXz.operateType.QI) {
                ++showCount;
            } else if (item.operate == ApiXz.operateType.HU_CHI || item.operate == ApiXz.operateType.HU_ZHI || item.operate == ApiXz.operateType.HU_QIANG) {
                ++showCount;
            }
        }
    }
    for (let item of this.handCards[myChairID]) {
        if (item == card) {
            ++showCount;
        }
    }
    let rest = 4 - showCount;
    return (rest < 0) ? 0 : rest;
};

model.qiangGangHuDel = function (data) {
    let array = this.handCards[data.chairID];
    array.splice(array.indexOf(data.card), 1);
}

model.setUserScoreList = function (value) {
    this.userScoreList = value
}

model.getUserScoreByChairId = function (chairID) {
    return this.userScoreList[chairID]
}

model.setLastCardCount = function (count) {
    this.restCardsCount = count
}

model.getLastCardCount = function () {
    return this.restCardsCount
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
    let canDiscard = gameStatus == ApiXz.gameStatus.PLAYING;
    return !!canDiscard && (!!limit || !!onceClick);
}