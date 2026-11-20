const Enums = require('../../../src/const/Enums');
const ApiJgPtj = require('./ApiJgPtj');
const UserModel = require('../../../src/model/UserModel');
const ApiRoom = require('../../../src/api/ApiRoom');
const Utils = require('../../../src/utils/Utils');
const ConfigModel = require('../../../src/model/ConfigModel');
const AssetsManager = require('../../../src/utils/AssetsManager');
/**初始化数据 */
var model = module.exports;

model.init = function (data) {
    this.reset()
    this.gameInited = true;
    UserModel.setDatas(data);
    this.roomID = data.roomID;
    this.gameRule = data.gameRule;
    this.tick = data.gameData.tick;
    this.result = data.gameData.result;
    this.myUid = UserModel.getData('uid');
    this.gameStatus = data.gameData.gameStatus;
    this.roomUserInfoArr = data.roomUserInfoArr;
    this.roomCreatorInfo = data.roomCreatorInfo;
    this.gameStarted = data.gameData.gameStarted;
    this.bankerUid = data.gameData.bankerUid;
    this.handCards = data.gameData.handCards;
    this.curBureau = data.gameData.curBureau;
    this.maxBureau = data.gameData.maxBureau;
    this.chairCount = data.gameData.chairCount;
    this.userTrustArray = data.gameData.userTrustArray;
    this.userScoreList = data.gameData.userScoreList
    this.curOperateUid = data.gameData.curOperateUid;
    this.operateRecords = data.gameData.operateRecords;
    this.userBetScore = data.gameData.userBetScore || {};
    this.showCardsUser = data.gameData.showCardsUser || [];
    this.setlastCards(data.gameData.lastCards)
}
/**每局完成后重置数据 */
model.reset = function () {
    this.userBetScore = {};
    this.selectCard = null;
    this.myShowCard = false;
    this.showCardsUser = [];
    this.setCardTypeList([]);
    this.setPourScoreObj(null);
}

model.setShowCardsUser = function (val) {
    this.showCardsUser.push(val);
}


model.getShowCardsUser = function () {
    return this.showCardsUser || {}
}

model.setMyshowCard = function (isShow) {
    this.myShowCard = isShow;
}
model.getMyshowCard = function () {
    return !!this.myShowCard;
}

model.setlastCards = function (list) {
    this.lastCards = list || [];
}
model.getlastCards = function () {
    return this.lastCards || [];
}

model.isCuoPai = function () {
    // return false
    return !!this.getGameRuleByKey("cuopai");
}
model.setCardTypeList = function (list) {
    this.cardTypeList = list || []
    this.cardTypeIndex = -1;
}
model.initCardTypeIndex = function () {
    this.cardTypeIndex = -1;
}
model.getCurTips = function () {
    if (!this.cardTypeList || !this.cardTypeList.length) {
        return null;
    }
    if (this.cardTypeIndex >= this.cardTypeList.length - 1) {
        this.cardTypeIndex = -1;
    }
    this.cardTypeIndex++;
    return this.cardTypeList[this.cardTypeIndex];
}

model.getQueryTips = function (oneCards, twoCards) {
    if (oneCards.length != 2 || twoCards.length != 2) {
        return null;
    }
    for (let index = 0; index < this.cardTypeList.length; index++) {
        const CurObj = this.cardTypeList[index];
        if (CurObj &&
            this.arraysEqual(oneCards, CurObj.oneCards) &&
            this.arraysEqual(twoCards, CurObj.twoCards)) {
            this.cardTypeIndex = index;
            return CurObj;
        }
    }
    return null;
}
/**判断两个数组是否相同 */
model.arraysEqual = function (arr1, arr2) {
    let a1 = arr1.slice(),
        a2 = arr2.slice();
    return JSON.stringify(a1.sort()) === JSON.stringify(a2.sort());
}

model.setPourScoreObj = function (obj) {
    this.PourScoreObj = obj;
}

model.getPourScoreObj = function () {
    return this.PourScoreObj || {};
}

model.setUserBetScore = function (uid, list) {
    this.userBetScore[uid] = list;
}

model.getUserBetScore = function (uid) {
    let mum = 0;
    if (uid) {
        let list = this.userBetScore[uid] || [];
        list.forEach(val => { mum += val });
    };
    return mum
}

model.getUserBetScoreNum = function (uid) {
    let gameMode = this.getGameRuleByKey("gameMode");
    let list = this.userBetScore[uid] || [];
    let num = list.length ? list.length : 0;
    let val = gameMode == 1 ? 3 : 2;
    return {
        count: val - num,
        index: num + 1,
    };
}
/**是小牌九 */
model.isSmallCard = function () {
    let cardMode = this.getGameRuleByKey("cardMode");
    return cardMode && cardMode == 1;
}

model.getChairIdByUid = function (uid) {
    for (let i = 0; i < this.roomUserInfoArr.length; i++) {
        const udata = this.roomUserInfoArr[i];
        if (udata && udata.userInfo && udata.userInfo.uid == uid) {
            return udata.chairID
        }
    }
    return null
}

/**通过UID获取玩家位置 */
model.getUserIdxByUid = function (uid) {
    let chairId = this.getChairIdByUid(uid)
    let idx = this.getUserChairIndex(chairId)
    return idx
}

/**清理所有数据 */
model.resetAll = function () {
    this.reset()
    this.selectCard = {};
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
        // return false
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
/**检查是否有空座位 */
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
    let users = [];
    let array = this.roomUserInfoArr || [];
    let maxPlayerCount = this.getChairCount();
    for (let user of array) {
        if (user.chairID < maxPlayerCount) continue;
        users.push(user);
    }
    return users;
}
/**
 * 判断玩家是否是观战
 * @param {*} uid 默认自己
 * @returns 
 */
model.isLookOnUID = function (uid = this.myUid) {
    let isLookOn = false;
    let LookOnList = this.getLookOnUsers();
    for (let user of LookOnList) {
        if (user.uid == uid) {
            isLookOn = true;
            break;
        }
    }
    return isLookOn;
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

model.getMyUid = function () {
    return this.myUid;
}

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

model.isUnionMatch = function () {
    let isUnionType = (this.roomCreatorInfo && this.roomCreatorInfo.unionType == Enums.UnionType.MATCH);
    return isUnionType && this.isUnionCreate();
}

/**获取房间创建者的信息 */
model.getRoomCreatorByKey = function (key) {
    return !!this.roomCreatorInfo ? this.roomCreatorInfo[key] : null;
}

/**显示测试功能 */
model.showTestCard = function () {
    let tmp = UserModel.getData("isTest")
    if (tmp) {
        ApiRoom.gameMessageNotify(ApiJgPtj.gameLookCardsNotify(this.getMyChairID()));
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

/**获取创建的游戏规则 */
model.getGameRule = function () {
    return this.gameRule;
};

/**获取游戏规则 */
model.getGameRuleByKey = function (key) {
    if (!this.gameRule) return null;
    return this.gameRule[key];
}

/**获取房间最大人数 */
model.getChairCount = function () {
    return this.chairCount || 0;
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
    return this.maxBureau
};

/**设置手牌 */
model.setHandCards = function (value) {
    this.handCards = value
}

/**获取自己的手牌 */
model.getMyHandCard = function () {
    return this.handCards[this.getMyUid()]
}

model.setSelectCard = function (obj) {
    this.selectCard = obj;
}

model.getSelectCard = function () {
    return this.selectCard;
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

model.isInSeat = function () {
    return this.getMyChairID() < this.getChairCount();
}
/**
 * 显示牌型
 * @param {*} typeNode 牌型节点
 * @param {*} curType 当前类型
 * @param {*} curPoint 当前点数
 * @param {*} showType 显示类型 1>长、2>短
 * @returns 
 */
model.showTypeSpr = function (typeNode, curType, curPoint, showType) {
    let cardVal = ApiJgPtj.cardType.ERROR;
    if (curPoint != ApiJgPtj.cardType.ERROR) {
        cardVal = (showType == 1 ? "d" : "d") + curPoint;
    }
    if (curType != ApiJgPtj.cardType.ERROR) {
        cardVal = curType;
    }
    if (typeNode) {
        let nodeSpr = typeNode.getComponent(cc.Sprite);
        nodeSpr.spriteFrame = null;
        typeNode.active = false;
        AssetsManager.loadSpriteFrame({
            path: "res/sprite/cardType/" + cardVal,
            bundle: Enums.bundleType.JGPTJ,
            sprite: nodeSpr,
        }, () => {
            typeNode.active = true;
        })
        typeNode.stopAllActions();
        typeNode.opacity = 255;
        typeNode.scale = 1.2;
    }
    return cardVal;
}

model.showBetScore = function (showNode, betArr, size) {
    if (!showNode) return;
    showNode.removeAllChildren();
    betArr.forEach((val) => {
        // let node = new cc.Node('Sprite');
        // var spr = node.addComponent(cc.Sprite);
        // spr.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        // size && node.setContentSize(size);
        // node.parent = showNode;
        // spr && AssetsManager.loadSpriteFrame({
        //     path: `res/sprite/betScore/${val}`,
        //     bundle: Enums.bundleType.JGPTJ,
        //     sprite: spr,
        // },);
        let textNode = new cc.Node("bet");
        let textLab = textNode.addComponent(cc.Label);
        textLab.string = "x" + Utils.formatNumberWithDecimal(val, 2);
        textNode.color = cc.Color.ORANGE;
        textLab.fontSize = size || 30;
        textNode.parent = showNode;
    })
}

model.isConfigTexT = function () {
    return true;
}
model.getConfigTexT = function (type) {
    let textList = [
        { text: "久久不赢人!", audio: "res/audio/text/jiujiu" },
        { text: "神鬼怕凄凄!", audio: "res/audio/text/qiqi" },
        { text: "手气太差啦！", audio: "res/audio/text/shouqi" },
        { text: "哈哈我发财啦！", audio: "res/audio/text/facai" },
        { text: "打酱油啦！", audio: "res/audio/text/dajiangyou" },
        { text: "四六不赌！", audio: "res/audio/text/siliu" },
    ]
    if (!isNaN(Number(type))) {
        return textList[type];
    } else {
        return textList;
    }
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
    return this.getGameRuleByKey('gameType') || Enums.bundleType.JGPTJ;
}