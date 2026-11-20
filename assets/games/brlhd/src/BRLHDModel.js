const AssetsManager = require('../../../src/utils/AssetsManager');
const UserModel = require('../../../src/model/UserModel');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const ConfigModel = require('../../../src/model/ConfigModel');

var model = module.exports;
model.init = function (callback = null) {
};
model.roomInit = function (data) {
    this.reset();
    UserModel.setDatas(data);
    this.roomID = data.roomID;
    this.gameRule = data.gameRule;
    this.tick = data.gameData.tick;
    this.myUid = UserModel.getData('uid');
    this.curBureau = data.gameData.curBureau;
    this.gameStatus = data.gameData.gameStatus;
    this.gameStarted = data.gameData.gameStarted;
    this.bankerUid = data.gameData.bankerUid || [];
    this.bankerList = data.gameData.bankerList || [];
    this.roomCreatorInfo = data.roomCreatorInfo || {};
    this.roomUserInfoArr = data.roomUserInfoArr || [];
}
/**每局完成后重置数据 */
model.reset = function () {

}
model.setSelectChip = function (num) {
    this.selectChipNum = num;
}
model.getSelectChip = function () {
    return this.selectChipNum || 0;
}
/**清理所有数据 */
model.resetAll = function () {
    this.reset()
    this.selectCard = {};
    this.gameInited = false;
}

/**游戏状态 */
model.getGameStatus = function () {
    return this.gameStatus || 0;
}
model.setGameStatus = function (value) {
    this.gameStatus = value
}


model.addUser = function (user) {
    if (!user) return;
    this.delUser(user.uid);
    this.roomUserInfoArr.push(user);
};

model.delUser = function (uid) {
    if (!this.roomUserInfoArr || !this.roomUserInfoArr.length) return;
    for (let i = 0; i < this.roomUserInfoArr.length; ++i) {
        if (this.roomUserInfoArr[i].userInfo.uid == uid) {
            this.roomUserInfoArr.splice(i, 1);
            break;
        }
    }
};
model.getRoomID = function () {
    return this.roomID || 0;
}
model.getMyUid = function () {
    return this.myUid || 0;
}

/**获取自己的座位号 */
model.getMyChairID = function () {
    if (!this.roomUserInfoArr) {
        return null
    }
    for (let index = 0; index < this.roomUserInfoArr.length; index++) {
        const obj = this.roomUserInfoArr[index];
        if (obj.userInfo.uid == this.myUid) {
            return obj.chairID;
        }
    }
    return null;
};

model.getMyScore = function () {
    return this.myScore || 0;
}

model.setMyScore = function (score) {
    this.myScore = score;
}

model.setUserData = function (data) {
    if (!data || !data.uid) return;
    let array = this.roomUserInfoArr || [];
    for (let index = 0; index < array.length; index++) {
        let userData = array[index];
        if (!!userData && userData.userInfo.uid == data.uid) {
            this.roomUserInfoArr[index].userInfo = data;
            break;
        }
    }
}

model.getUserByUID = function (uid) {
    uid = uid || this.myUid;
    this.roomUserInfoArr = this.roomUserInfoArr || [];
    let roomUser = this.roomUserInfoArr.find((user) => {
        return user.userInfo.uid == uid;
    });
    return roomUser;
};

/**获取自己是否在游戏中 */
model.getSelfIsPlaying = function () {
    if (!this.roomUserInfoArr || !this.myUid) return false;
    for (let i = 0; i < this.roomUserInfoArr.length; ++i) {
        let info = this.roomUserInfoArr[i]
        if (info.userInfo.uid == this.myUid) {
            return info.playStatus == ApiRoom.playStatus.PLAYING
        }
    }
    return false
}

model.isUnionCreate = function () {
    return this.roomCreatorInfo && this.roomCreatorInfo.creatorType == Enums.roomCreatorType.UNION_CREATE;
};
model.getRoomCreatorByKey = function (key) {
    return !!this.roomCreatorInfo ? this.roomCreatorInfo[key] : null;
}

model.getBankerUid = function () {
    return this.bankerUid || [];
};

model.getCurBankerInfo = function () {
    return this.bankerUid && this.bankerUid.length ? this.bankerUid[0] : null;
};

model.setBankerUid = function (value) {
    this.bankerUid = value
}

model.getbankerList = function () {
    return this.bankerList || [];
};

model.getMyBankerUid = function () {
    let bankerList = this.getBankerUid()
    for (let index = 0; index < bankerList.length; index++) {
        const curData = bankerList[index];
        if (curData && curData.uid == this.myUid) {
            return curData;
        }
    }
    return null;
}

model.setbankerList = function (value) {
    this.bankerList = value
}
model.getMyBankerList = function () {
    let bankerList = this.getbankerList()
    for (let index = 0; index < bankerList.length; index++) {
        const curData = bankerList[index];
        if (curData && curData.uid == this.myUid) {
            return curData;
        }
    }
    return null;
}
model.getOtherUesrList = function () {
    let otherList = [];
    let bankerUesr = this.getCurBankerInfo();
    let uesrList = this.roomUserInfoArr || [];
    uesrList.forEach((user) => {
        if (user.uid != this.myUid) {
            if (bankerUesr) {
                if (user.uid != this.myUid) {
                    otherList.push(user);
                }
            } else {
                otherList.push(user);
            }
        }
    })
    return otherList;
}

model.getRateList = function () {
    return [
        { tou: 1, pei: 1, },
        { tou: 1, pei: this.getGameRuleByKey("heRate") || 1, },
        { tou: 1, pei: 1, },
    ]
}

/**获取当前局数 */
model.getCurBureau = function () {
    return this.curBureau;
};


model.setPoolHistory = function (data) {
    this.poolHistoryList = data ? data.poolHistoryList : [];
    this.poolHistoryTotal = data ? data.poolHistoryTotal : [];
}
model.getPoolHistoryList = function () {
    return this.poolHistoryList || [];
}

model.getPoolHistoryTotal = function () {
    return this.poolHistoryTotal || {}
}

/**获取游戏规则 */
model.getGameRuleByKey = function (key) {
    return this.gameRule ? this.gameRule[key] : null;
}

model.getNodeRandomAreaPos = function (targetNode, rootNode) {
    let getRandomPos = () => {
        let areaSize = targetNode.getContentSize();
        let xRandom = (Math.random() * (areaSize.width / 2)) * Math.pow(-1, Math.floor(Math.random() * 3));
        let yRandom = (Math.random() * (areaSize.height / 2)) * Math.pow(-1, Math.floor(Math.random() * 3));
        return cc.v2(xRandom, yRandom);
    }
    let pos = getRandomPos();
    let worldPoint = targetNode.convertToWorldSpaceAR(pos);
    return rootNode.convertToNodeSpaceAR(worldPoint, cc.v2());
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

/**块类型 */
model.AreaType = {
    Hu: 0,
    He: 1,
    Long: 2,
}

/**玩家类型 */
model.UserType = {
    /**自己 */
    My: 0,
    /**富豪 */
    Rich: 1,
    /**幸运 */
    Lucky: 2,
    /**其他 */
    Other: 3,
};

model.AinmType = {
    Wait: 0,
    Start: 1,
    KSXZ: 2,
    TZXZ: 3,
    Vs: 4,
}
