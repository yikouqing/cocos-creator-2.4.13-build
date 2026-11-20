const Enums = require('../../../src/const/Enums');
const ApiHz = require('./ApiHz');
const ApiRoom = require('../../../src/api/ApiRoom');
const UserModel = require('../../../src/model/UserModel');
const HZLogic = require('./HZLogic');
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
    this.restCardsCount = data.gameData.restCardsCount;
    this.myUid = UserModel.getData('uid');
    this.curScores = data.gameData.curScores
    this.askForExitArr = null;
}

/**每局完成后重置数据 */
model.reset = function () {
    this.operateRecord = []
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
        ApiRoom.gameMessageNotify(ApiHz.gameLookCardsNotify(this.getMyChairID()));
    }
}

/**座位号转换 */
model.getUserChairIndex = function (chairID) {
    return (chairID - this.getMyChairID() + this.gameRule.maxPlayerCount) % this.gameRule.maxPlayerCount;
}

model.getUserChairIndexByUID = function (uid) {
    let user = this.getUserByUID(uid);
    if (!user) return null;
    let idx = this.getUserChairIndex(user.chairID);
    return idx;
}

model.getUserByUID = function (uid) {
    this.roomUserInfoArr = this.roomUserInfoArr || [];
    let roomUser = this.roomUserInfoArr.find((user) => {
        return user.userInfo.uid == uid;
    });
    return roomUser;
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
    return tpOp.chairID == opt.chairID && tpOp.operate == ApiHz.operateType.GET ? tpOp : null
};

/**操作时最后一个出牌的位置。用于删除桌面上打出来的牌 */
model.getLastOutCardRecord = function () {
    const opt = this.operateRecord[this.operateRecord.length - 1];
    const opt1 = this.operateRecord[this.operateRecord.length - 2]
    if (opt && opt1) {
        let tmp = [ApiHz.operateType.PENG, ApiHz.operateType.GANG_CHI]
        if (tmp.includes(opt.operate) && opt1.operate == ApiHz.operateType.QI) {
            return opt1
        }
        if (opt.operate == ApiHz.operateType.HU_CHI && opt1.operate == ApiHz.operateType.QI) {
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
        if (array[i].operate == ApiHz.operateType.GANG_BU) {
            for (let j = array.length - 1; j >= 0; --j) {
                if (array[j].card == array[i].card && array[j].operate == ApiHz.operateType.PENG && array[j].chairID == array[i].chairID) {
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
        if (item.chairID == chairID && [ApiHz.operateType.PENG, ApiHz.operateType.GANG_CHI, ApiHz.operateType.GANG_BU, ApiHz.operateType.GANG_ZHI].indexOf(item.operate) != -1) {
            array.push(item);
        }
    }
    /**如果有补杠操作，就找到之前碰的操作给他删除掉 */
    for (let i = array.length - 1; i >= 0; --i) {
        if (array[i].operate == ApiHz.operateType.GANG_BU) {
            for (let j = array.length - 1; j >= 0; --j) {
                if (array[j].card == array[i].card && array[j].operate == ApiHz.operateType.PENG && array[j].chairID == array[i].chairID) {
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
        let zimo = optlist.find(opt => opt.operate == ApiHz.operateType.HU_ZHI)
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
        /**找出癞子牌*/
        let laizi = []
        let glist = HZLogic.getGhostList()
        for (let i = 0; i < tileIdList.length; i++) {
            const t = tileIdList[i];
            let isDel = false
            if (glist.includes(t)) {
                laizi.push(t)
                isDel = true
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
    }
}

/**通知用户操作 */
model.onGameTurn = function (data) {
    if (data.operateArray.indexOf(ApiHz.operateType.QI) != -1) {
        if (data.card != null) {
            data.operate = ApiHz.operateType.GET;
            this.handCards[data.chairID].push(data.card);
            this.operateRecord.push(data);
        }
    } else if (data.operateArray.indexOf(ApiHz.operateType.GET) != -1) {
        data.operate = ApiHz.operateType.GET;
        this.handCards[data.chairID].push(data.card);
        this.operateRecord.push(data);
    }
    this.curChairID = data.chairID;
}

/**用户操作广播 */
model.onUserOpt = function (data) {
    this.operateRecord.push(data);

    let count = 0;
    if (data.operate == ApiHz.operateType.QI) {
        count = 1;
    } else if (data.operate == ApiHz.operateType.PENG) {
        count = 2;
    } else if (data.operate == ApiHz.operateType.GANG_CHI) {
        count = 3;
    } else if (data.operate == ApiHz.operateType.GANG_ZHI) {
        count = 4;
    } else if (data.operate == ApiHz.operateType.GANG_BU) {
        count = 1;
    } else if (data.operate == ApiHz.operateType.HU_ZHI) {
        count = 1;
    }
    while (count > 0) {
        let array = this.handCards[data.chairID];
        array.splice(array.indexOf(data.card), 1);
        --count;
    }
}

/**获取出的牌 */
model.getOutTiles = function (chairID) {
    let outarr = []
    let operateRecord = this.operateRecord
    for (let i = 0; i < operateRecord.length; ++i) {
        let item = operateRecord[i];
        let next = operateRecord[i + 1];
        if (next && ([ApiHz.operateType.PENG, ApiHz.operateType.GANG_CHI, ApiHz.operateType.HU_CHI, ApiHz.operateType.GANG_BU].indexOf(next.operate) != -1)) {
            continue;
        }
        if (item.chairID == chairID && item.operate == ApiHz.operateType.QI) {
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
        if (item.card == card) {
            if (item.operate == ApiHz.operateType.PENG) {
                showCount += 2;
            } else if (item.operate == ApiHz.operateType.GANG_ZHI) {
                showCount += 4;
            } else if (item.operate == ApiHz.operateType.GANG_CHI) {
                showCount += 3;
            } else if (item.operate == ApiHz.operateType.GANG_BU) {
                ++showCount;
            } else if (item.operate == ApiHz.operateType.QI) {
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
    let canDiscard = gameStatus == ApiHz.gameStatus.PLAYING;
    return !!canDiscard && (!!limit || !!onceClick);
}

model.getBundleType = function () {
    return this.getGameRuleByKey('gameType') || Enums.bundleType.HZ;
}