const Enums = require('../const/Enums');
const NetworkLogic = require('../utils/NetworkLogic');
const ConfigModel = require('../model/ConfigModel');
const ApiHall = require('../api/ApiHall');
const MessageCallback = require('../utils/MessageCallback');
const HotUpdateModule = require('../utils/HotUpdateModule');
const AudioUtil = require('../utils/AudioUtil');
const LoginManager = require('../utils/LoginManager');
const NetworkManager = require('../utils/NetworkManager');
const AssetsManager = require('../utils/AssetsManager');
const SubManager = require('../utils/SubManager');
const CacheManager = require('../utils/CacheManager');
const NativeUtil = require('../utils/NativeUtil');

var exp = module.exports;
exp.init = function (data) {
    //服务器发过来的数据初始化
    // console.log('用户数据记录', data);
    this.setDatas(data);
    if (!!this.updateModule) {
        this.updateModule.release();
        this.updateModule = null;
    }
    this.updateModule = new HotUpdateModule();
    ApiHall.getUserUnionListRequest((res) => {
        this.setData('userUnions', res.msg.recordArr);
        MessageCallback.emitMessage('UnionListSync', res.msg.recordArr);
    });
    this.locationSync();
    this.unionListSyncTimer && clearInterval(this.unionListSyncTimer);
    this.unionListSyncTimer = setInterval(() => {
        //联盟列表刷新
        this.locationSync();
        ApiHall.getUserUnionListRequest((res) => {
            this.setData('userUnions', res.msg.recordArr);
            MessageCallback.emitMessage('UnionListSync', res.msg.recordArr);
        });
        if (!cc.sys.isBrowser) {
            NetworkManager.httpRequest({
                url: ConfigModel.getUrl('license'),
                data: {},
                cb: (res) => {
                    ConfigModel.checkLicense(res);
                }
            });
        }
    }, 3000)
};

exp.setDatas = function (data) {
    for (let key in data) {
        if (data.hasOwnProperty(key)) {
            this[key] = data[key];
        }
    }
};

exp.isInRoom = function () {
    return !!this.roomID && this.roomID > 0;
};

exp.getRoomID = function () {
    return this.roomID;
}

exp.getRoom = function (roomID) {
    let union = this.getData('curUnionData');
    union = union || {};
    union.roomRuleList = union.roomRuleList || [];
    union.roomList = union.roomList || [];
    let roomRuleList = this.roomsFormat(union.roomRuleList);
    let roomList = this.roomsFormat(union.roomList);
    let rooms = roomRuleList.concat(roomList);
    let match = rooms.find((room) => {
        return room.roomID === roomID;
    });
    return match;
}

exp.roomsFormat = function (rooms) {
    if (!rooms) return [];
    let roomList = [];
    rooms.forEach(room => {
        if (!!room && !!room.gameRule) {
            room.gameRule = typeof (room.gameRule) == 'string' ? JSON.parse(room.gameRule) : room.gameRule;
            room.gameRule.ruleName = room.ruleName || room.gameRule.ruleName;
            roomList.push(room);
        }
    });
    return roomList.slice();
}

//是否有可领取邮件
exp.canGetEmailCount = function () {
    let mails = JSON.parse(this.emailArr || "[]");
    let count = 0;
    for (let i = mails.length - 1; i >= 0; i--) {
        let data = JSON.parse(mails[i]);
        if (!!data.gold) {
            if (parseInt(data.status) === Enums.emailStatus.NOT_RECEIVE) {
                count++;
            }
        }
    }
    return count;
};

exp.unreadEmailCount = function () {
    let mails = JSON.parse(this.emailArr || "[]");
    let unReadCount = 0;
    for (let i = mails.length - 1; i >= 0; i--) {
        let data = mails[i];
        if (!data.isRead) {
            unReadCount++;
        }
    }
    return unReadCount;
};

exp.setMailRead = function (mailId) {
    let mails = this.emailArr;
    if (!!mails && mails.length > 0) {
        mails = JSON.parse(mails);
    } else {
        mails = [];
    }
    for (let i = mails.length - 1; i >= 0; i--) {
        let data = mails[i];
        if (data.id + '' === mailId + '') {
            data.isRead = true;
            mails[i] = data;
        }
    }
};

exp.getUnionInfo = function (unionID) {
    this.unionInfo = this.unionInfo || [];
    return this.unionInfo.find((ele) => {
        return ele.unionID === unionID;
    })
};

exp.getUnionInfoData = function (unionID, key) {
    let union = this.getUnionInfo(unionID);
    union = union || {};
    return union[key] || null;
}

exp.getUserUnion = function (unionID) {
    this.userUnions = this.userUnions || [];
    let union = this.userUnions.find((ele) => {
        return ele.unionID === unionID;
    });
    return union;
};

exp.hasUnion = function () {
    this.userUnions = this.userUnions || [];
    return this.userUnions.length > 0;
}

exp.isInUnion = function (unionID) {
    this.userUnions = this.userUnions || [];
    let unionItem = this.userUnions.find((union) => {
        return union.unionID === unionID;
    });
    return unionItem;
}

/**获取玩家全局属性 */
exp.getData = function (key) {
    return this[key]
}

exp.setData = function (key, val) {
    this[key] = val;
}

exp.delData = function (key) {
    delete this[key];
}

exp.release = function (force = false) {
    this.unionListSyncTimer && clearInterval(this.unionListSyncTimer);
    AudioUtil.stopAll();
    ApiHall.logout();
    NetworkLogic.disconnect(false);
    if (!!force) LoginManager.clear();
    cc.game.restart();
}

/**检测是否有定位信息 */
exp.checkLocation = function (check = true) {
    let adopt = true;
    let locationEnable = ConfigModel.getData('locationEnable')
    if (!!locationEnable && !!check && !!cc.sys.isNative) {
        let map = NativeUtil.getLocation();
        let address = !!map && !!map.address ? map.address : JSON.stringify({});
        address = JSON.parse(address);
        address.x = address.x || 0;
        address.y = address.y || 0;
        adopt = address.x != 0 && address.y != 0;
    }
    //未获取定位数据 且已请求过定位权限
    if (!adopt) {
        AssetsManager.popDialog({
            content: `防作弊功能开启，未检测到您的位置信息:\n1.请确认手机设置中定位处于打开状态。\n2.请确认APP的位置权限已开启。\n3.步骤1和2均无误，请重启APP后再试。`,
            ok: '确定',
            cancel: '取消',
            ok: () => {
                this.locationSync();
            },
            no: () => { }
        });
    }
    return adopt;
}

exp.getUserRoomInfo = function (key) {
    this.roomSceneInfo = this.roomSceneInfo || {};
    return this.roomSceneInfo[key];
}

exp.getOpUnionId = function () {
    let lastEnterUnionId = CacheManager.getItem("OpUnionId");
    let unionId = parseInt(lastEnterUnionId);
    if (isNaN(unionId)) unionId = 0;
    return unionId;
}

exp.setOpUnionId = function (unionID) {
    this['opUnionID'] = unionID;
    CacheManager.setItem("OpUnionId", unionID);
}

exp.getDefaultUnion = function () {
    this.userUnions = this.userUnions || [];
    let userUnions = this.userUnions.slice();
    let lastEnterUnionId = this.getOpUnionId();
    let unionFind = userUnions.find((union) => {
        return union.unionID === lastEnterUnionId;
    });
    if (!unionFind) {
        return userUnions.shift();
    } else {
        return unionFind;
    }
}

//获取联盟皮肤ID
exp.getUnionSkin = function () {
    let unionID = this.getOpUnionId();
    let union = this.getUserUnion(unionID);
    if (!union) return Enums.bundleType.UNION_DF;
    let unionSkinId = parseInt(union.unionSkinId);
    unionSkinId = isNaN(unionSkinId) ? Enums.bundleType.UNION_DF : unionSkinId;
    return unionSkinId;
}

exp.getGameSelected = function () {
    let selectGameType = CacheManager.getItem("selectGameType");
    let gameType = parseInt(selectGameType);
    if (isNaN(gameType)) gameType = 0;
    return gameType;
}

exp.setGameSelected = function (gameType) {
    CacheManager.setItem("selectGameType", gameType.toString());
}

exp.getRoomCreator = function (key) {
    let roomCreatorInfo = this.getData('roomCreatorInfo');
    if (!roomCreatorInfo) return null;
    let userUnion = this.getUserUnion(roomCreatorInfo.unionID);
    if (roomCreatorInfo.creatorType == Enums.roomCreatorType.UNION_CREATE) {
        return !!userUnion ? userUnion[key] : null;
    }
    return null;
}

/**
 * 处理加入房间的逻辑
 * @param {} room 
 */
exp.joinUnionRoom = function (data) {
    let union = data.union;
    let room = data.room;
    let type = data.type;
    if (!union) return;
    if (!union.opening) {
        AssetsManager.tipDialog("联盟已打烊，无法进入游戏~");
        return;
    }
    let unionInfoItem = this.getUnionInfo(union.unionID);
    if (!!unionInfoItem && !!unionInfoItem.prohibitGame) {
        AssetsManager.tipDialog("被盟主限制加入游戏~");
        return;
    }
    if (!!this.isInRoom()) {
        //在房间中直接进入
        let curRoomID = this.getRoomID();
        let curRoom = this.getRoom(curRoomID);
        if (!!curRoom) {
            let curGameType = curRoom.gameType || curRoom.gameRule.gameType;
            let roomName = ConfigModel.getGameName(curGameType);
            AssetsManager.popDialog({
                content: `您正在 ${roomName} 房间中，是否返回？`,
                ok: () => {
                    let rules = {
                        gameType: curGameType,
                        gameRule: curRoom.gameRule,
                        roomID: curRoom.roomID
                    }
                    this.setDatas(rules);
                    SubManager.enterBundle(Enums.bundleType.GAME);
                },
                no: () => { }
            });
        }
        return;
    }
    if (!room) return;
    //GPS显示或防作弊开启必须校验定位权限
    let joinRoomWatchPriority = ConfigModel.getData('joinRoomWatchPriority');
    let showLocation = room.gameRule.fangzuobi || room.gameRule.showGps;
    if (!this.checkLocation(showLocation)) return;
    let curGameType = room.gameRule.gameType;
    if (!!ConfigModel.isLocked(curGameType)) {
        AssetsManager.tipDialog("游戏开发中，敬请期待~");
        return;
    }
    let players = this.userFilter(room.roomUserInfoArr, room.gameRule.maxPlayerCount);
    if (curGameType == Enums.bundleType.CX || curGameType == Enums.bundleType.DZPK) {
        //扯旋和德州强制转换为加入旁观
        room.gameRule.canWatch = true;
        type = Enums.gameEnterType.WATCH;
    } else if (curGameType == Enums.bundleType.CNJJ) {
        type = Enums.gameEnterType.NONE;//强制转换为无状态 走逻辑判断
    }
    type = type || Enums.gameEnterType.NONE;
    let gameStarted = room.curBureau > 0 && !!room.roomID;
    let bConf = ConfigModel.getBundleConfig(curGameType);
    let isFull = players.gaming.length >= room.gameRule.maxPlayerCount;
    if (bConf.classify != Enums.bundleClass.BAIREN) {
        if (type == Enums.gameEnterType.NONE) {
            if (!!isFull) {
                //人满或已开始 处理过滤麻将 跑得快 斗地主这类需要全部准备才能开始的游戏
                if (!room.gameRule.canWatch) {
                    AssetsManager.tipDialog("该房间不能观战~");
                    return;
                }
                type = Enums.gameEnterType.WATCH;
            } else {
                if (!!gameStarted) {
                    if (!!joinRoomWatchPriority) {
                        if (!!room.gameRule.canWatch) {
                            type = Enums.gameEnterType.WATCH;
                        } else {
                            if (!room.gameRule.canEnter) {
                                AssetsManager.tipDialog("该房间不能中途加入哦~");
                                return;
                            }
                            type = Enums.gameEnterType.JOIN;
                        }
                    } else {
                        if (!!room.gameRule.canEnter) {
                            type = Enums.gameEnterType.JOIN;
                        } else {
                            if (!room.gameRule.canWatch) {
                                AssetsManager.tipDialog("该房间不能观战哦~");
                                return;
                            }
                            type = Enums.gameEnterType.WATCH;
                        }
                    }
                } else {
                    if (!!joinRoomWatchPriority) {
                        if (!!room.gameRule.canWatch) {
                            type = Enums.gameEnterType.WATCH;
                        } else {
                            type = Enums.gameEnterType.JOIN;
                        }
                    } else {
                        type = Enums.gameEnterType.JOIN;
                    }
                }
            }
        } else if (type == Enums.gameEnterType.JOIN) {
            if (!!isFull) {
                AssetsManager.tipDialog("房间人数已满,不能加入~");
                return;
            } else {
                if (!!gameStarted && !room.gameRule.canEnter) {
                    AssetsManager.tipDialog("该房间不能中途加入哦~");
                    return;
                }
            }
        } else if (type == Enums.gameEnterType.WATCH) {
            if (!room.gameRule.canWatch) {
                AssetsManager.tipDialog("该房间不能观战~");
                return;
            }
        }
    } else {
        type = Enums.gameEnterType.JOIN;
    }
    if (!!room.roomID) {
        if (type == Enums.gameEnterType.WATCH) {
            ApiHall.joinUnionRoomWatchRequest({
                unionID: union.unionID,
                roomID: room.roomID,
                gameType: curGameType
            });
        } else {
            ApiHall.joinRoomRequest({
                roomID: room.roomID,
                gameType: curGameType
            });
        }
    } else {
        room._id = room.gameRule._id || room._id;
        ApiHall.createRoomRequest({
            gameType: curGameType,
            gameRule: null,
            gameRuleID: room._id,
            unionID: union.unionID,
            roomID: null,
            createAndWatch: type == Enums.gameEnterType.WATCH
        });
    }
}

exp.userFilter = function (users, maxPlayerCount) {
    let filter = {
        gaming: [],
        look: []
    }
    users = users || [];
    users.forEach((user) => {
        if (user.chairID < maxPlayerCount) {
            filter.gaming.push(user);
        } else {
            filter.look.push(user);
        }
    });
    return filter;
};

exp.locationSync = function () {
    let locationEnable = ConfigModel.getData('locationEnable');
    if (!locationEnable) return;
    let aMapLocation = NativeUtil.getLocation();
    if (!!aMapLocation) ApiHall.updateUserAddressRequest({
        address: aMapLocation.address,
        location: aMapLocation.location
    });
    NativeUtil.startLocation('定位');
}