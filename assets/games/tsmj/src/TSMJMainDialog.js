const ApiTsmj = require('./ApiTsmj');
const ApiRoom = require('../../../src/api/ApiRoom');;
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const MessageCallback = require('../../../src/utils/MessageCallback');
const UserModel = require('../../../src/model/UserModel');
const Codes = require('../../../src/const/Codes');
const ConfigModel = require('../../../src/model/ConfigModel');
const NativeUtil = require('../../../src/utils/NativeUtil');
const TSMJModel = require('./TSMJModel');
const TSMJLogic = require('./TSMJLogic');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const SubManager = require('../../../src/utils/SubManager');
const Events = require('../../../src/const/Events');

cc.Class({
    extends: cc.Component,

    properties: {
        com_opt: require("TSMJOperate"),
        com_clock: require("TSMJClock"),
        com_ting: require("TSMJTingTips"),
        readyTick: require('TSMJReadyTick'),
        com_ma: require("TSMJMaPai"),
        txt_round: cc.Label,
        txt_roomId: cc.Label,
        txt_time: cc.Label,
        txt_last: cc.Label,
        txt_gameName: cc.Label,
        restCardLayout: cc.Layout,
        btn_location: cc.Node,
        btn_copy: cc.Node,
        btn_invite: cc.Node,
        btn_ready: cc.Node,
        btn_leave: cc.Node,
        btn_dismiss: cc.Node,
        btn_shezhi: cc.Node,
        btn_ting: cc.Node,
        btn_menu: cc.Node,
        menuLay: cc.Node,
        menuLayList: cc.Node,
        pointer: cc.Node,
        tuoguan: cc.Node,
        btn_deposit: cc.Node,
        operActPfb: cc.Prefab,
        effectNode: cc.Node,
        btnAniList: [cc.Node],
        btnBackHall: cc.Node,
        btnYuYin: cc.Node,
        canNotDismissBar: cc.Node,

        _aniX: 0,
        /**用户脚本列表 下标为本地座位号*/
        _userList: [],
        /**手牌脚本列表 */
        _handTileMgrList: [],
        /**操作牌脚本列表 */
        _optTileMgrList: [],
        //花牌脚本列表
        _huaTilesMgrList: [],
        /**打出牌脚本列表 */
        _disTileMgrList: [],
        /**动画节点 */
        _operActNodeList: [],
        /**游戏状态 */
        _gameStatus: 0,
        /**听牌列表 */
        _canWinList: [],
        /**打听列表 */
        _tingList: [],
        /**已经胡牌的列表 */
        _huPai: null,
    },

    onLoad() {
        AssetsManager.init(this.node);
        this._huPai = {};
        // this._aniX = this.btnAniList[0].x;
        // 菜单点击
        this.menuLay.active = false
        cc.game.on(cc.game.EVENT_SHOW, this.onEventShow, this);
        MessageCallback.addListener(Events.clientEvents.gvUploadFileSuccess, this);
        MessageCallback.addListener('RoomMessagePush', this);
        MessageCallback.addListener('GameMessagePush', this);
        MessageCallback.addListener('ReconnectSuccess', this);
        MessageCallback.addListener('SelfEntryRoomPush', this);
        MessageCallback.addListener('CreateRoomFail', this);
        MessageCallback.addListener('QuickJoinFail', this);
        MessageCallback.addListener('JoinGameAgainPush', this);
        MessageCallback.addListener('OnGameOnceAgain', this);
        cc.systemEvent.on("tileUp", this.onTileUp, this);

        this.updatePointer();
        /* 获取场景信息 */
        this.getRoomSceneInfo();
    },

    onDestroy() {
        cc.game.off(cc.game.EVENT_SHOW, this.onEventShow, this);
        MessageCallback.removeListener(Events.clientEvents.gvUploadFileSuccess, this);
        MessageCallback.removeListener('RoomMessagePush', this);
        MessageCallback.removeListener('GameMessagePush', this);
        MessageCallback.removeListener('ReconnectSuccess', this);
        MessageCallback.removeListener('SelfEntryRoomPush', this);
        MessageCallback.removeListener('CreateRoomFail', this);
        MessageCallback.removeListener('QuickJoinFail', this);
        MessageCallback.removeListener('JoinGameAgainPush', this);
        MessageCallback.removeListener('OnGameOnceAgain', this);
        cc.systemEvent.off("tileUp", this.onTileUp, this);
        ConfigModel.setData('lastScene', 'tsmj');
        AssetsManager.release();
    },

    update(dt) { },

    /**切换后台返回 */
    onEventShow() {
        this.getRoomSceneInfo();
    },

    _onUploadSuccess(fileId) {
        this._lastChatTick = this._lastChatTick || 0;
        if ((Date.now() - this._lastChatTick) < 2000) {
            AssetsManager.tipDialog("亲，请勿频繁发送消息哦~");
            return;
        }
        this._lastChatTick = Date.now();
        ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(Enums.chatType.VOICE, fileId, null))
    },

    /**获取房间信息 */
    getRoomSceneInfo() {
        if (UserModel.isInRoom()) {
            ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
        } else {
            this.enterHall();
        }
    },

    /**返回大厅 */
    enterHall() {
        let isUnionCreate = TSMJModel.isUnionCreate();
        let unionID = !!isUnionCreate ? TSMJModel.getRoomCreatorByKey('unionID') : null;
        SubManager.exitBundle(unionID);
    },

    /**初始化和断线重连 */
    gameInit(data) {
        MessageCallback.emitMessage('RemoveGameResult');
        this.unscheduleAllCallbacks();
        this.resetTable();
        TSMJModel.init(data);
        TSMJLogic.init(TSMJModel.getGameRule())
        let isTest = UserModel.getData("isTest");
        this._gameStatus = data.gameData.gameStatus;
        let lastOpt = TSMJModel.getLastOperate();
        let myUid = TSMJModel.getMyUID();
        let users = TSMJModel.getUsers();
        let operateUid = data.gameData.operateUid;
        this._huPai = data.gameData.caozuoCard || {};
        this.com_clock.gameInit(TSMJModel.getChairCount(), TSMJModel.getMyChairID())
        if (this._gameStatus == ApiTsmj.gameStatus.NONE && TSMJModel.getCurBureau() == 0) {
            this.com_clock.node.active = false;
        } else {
            this.com_clock.node.active = true;
        }
        if (data.gameData.userCanOperate && data.gameData.userCanOperate[myUid]) {
            let userOperate = data.gameData.userCanOperate[myUid];
            userOperate.operateCard = data.gameData.operateCard;
            this.com_opt.gameInit(userOperate);
        }
        this.seatsInit();
        /**初始化用户信息 */
        let roomUserInfoArr = data.roomUserInfoArr;
        for (let i = 0; i < roomUserInfoArr.length; i++) {
            const user = roomUserInfoArr[i];
            this.userEnterRoom(user);
        }
        this.initTotalScore(data.gameData.userWinTotalScore);
        /**按钮显示 */
        let unionID = TSMJModel.isUnionCreate() ? TSMJModel.getRoomCreatorByKey('unionID') : null;
        let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
        this.btn_invite.active = TSMJModel.getCurBureau() == 0 && !!isShowInvite;
        this.btn_copy.active = TSMJModel.getCurBureau() == 0 && !!isShowInvite;
        this.btn_location.active = !!TSMJModel.getGameRuleByKey('showGps');
        this.btn_ready.active = (this._gameStatus === ApiTsmj.gameStatus.NONE && data.gameData.userPlayStatus[myUid] == ApiRoom.userStatusEnum.NONE);
        this.btn_leave.active = data.gameData.curBureau == 0;
        this.btn_dismiss.active = data.gameData.curBureau != 0 && !TSMJModel.getGameRuleByKey("canNotDissmiss");
        let tm = TSMJModel.getGameRuleByKey("trustTm")
        this.btnBackHall.active = data.gameData.curBureau == 0 && TSMJModel.isUnionCreate();
        this.btn_deposit.active = tm && tm > 0;
        let yuyin = TSMJModel.getGameRuleByKey('yuyin');
        this.btnYuYin.active = !!yuyin && ConfigModel.getData('voiceSpeaker');
        if (this.btn_ready.active && TSMJModel.getCurBureau() == 0 && TSMJModel.getGameRuleByKey("unReadyKick") > 0) {
            let tick = TSMJModel.getGameRuleByKey("unReadyKick") || 10;
            this.readyTick.sync(tick);
        } else {
            this.readyTick.sync(0);
        }
        /**房间号和局数 */
        this.txt_roomId.string = `房号:${data.roomID}`;
        this.txt_round.string = `${data.gameData.curBureau}/${data.gameData.maxBureau}局`;
        let gameName = ConfigModel.getBundleConfig(data.gameRule.gameType)
        this.txt_gameName.string = `游戏:${gameName.name}`
        if (this.canNotDismissBar) this.canNotDismissBar.active = TSMJModel.getGameRuleByKey("canNotDissmiss");
        this.onLastTilesCountUpdate(data.gameData.restCardsCount);
        this.showTest();
        if (this._gameStatus > ApiTsmj.gameStatus.DICES) {
            //如果是自己的轮次 并且上一次打牌的人不是自己时删除最近一次摸的牌
            if (!!lastOpt &&
                lastOpt.operate == ApiTsmj.operateType.GET) {
                let idx = TSMJModel.getUserIndexByUID(lastOpt.uid);
                let card = lastOpt.card;
                if (!!this._handTileMgrList[idx]) {
                    if (idx == 0 || !isTest) {
                        this._handTileMgrList[idx].setDrawTile(card, false);
                    } else {
                        this._handTileMgrList[idx].setHuTile(card);
                    }
                }
            }
            this.onSendTiles(data.gameData, false);
            for (const user of users) {
                let idx = TSMJModel.getUserIndexByUID(user.uid);
                /**恢复吃碰杠的牌 */
                let pengGangArray = TSMJModel.getPengGangArrayByUID(user.uid);
                if (pengGangArray.length > 0 && !!this._optTileMgrList[idx]) {
                    this._optTileMgrList[idx].updateOptTiles(pengGangArray);
                }
                /**恢复打出的牌 */
                let out = TSMJModel.getOutTilesByUID(user.uid);
                if (out.length > 0 && !!this._disTileMgrList[idx]) {
                    let last = this._disTileMgrList[idx].showOutTiles(out);
                    if (data.gameData.lastOperateUid == user.uid &&
                        !!last &&
                        last.flower == data.gameData.operateCard) {
                        this.updatePointer(last.node)
                    }
                }
            }
            /**恢复推荐选牌 */
            if (this._gameStatus === ApiTsmj.gameStatus.HUANSANZHANG && data.gameData.suggestCard) {
                if (!TSMJModel.getIsHuanPai(myUid)) {
                    let sug = data.gameData.suggestCard[myUid];
                    this._handTileMgrList[0].setHuanPai(sug);
                }
            }

            if (this._gameStatus === ApiTsmj.gameStatus.PLAYING) {
                /**恢复方向指示 */
                let idx = TSMJModel.getUserIndexByUID(operateUid);
                this.com_clock.setDir(idx);
                this.com_clock.setTick(data.gameData.tick);
                /**设置该谁出牌 */
                if (myUid == operateUid && data.gameData.lastOperateUid != myUid) {
                    this._handTileMgrList[0].setIsMyTurn();
                    if (!data.gameData.operateCard) {
                        this._handTileMgrList[0].setPengChu();
                    }
                }
                /**设置胡牌顺序 */
                let userHuList = data.gameData.userHuList
                let winChairIDArray = data.gameData.winChairIDArray
                if (userHuList && Array.isArray(userHuList)) {
                    for (let i = 0; i < userHuList.length; i++) {
                        let h = userHuList[i];
                        let user = TSMJModel.getUserByChairID(i);
                        if (h) {
                            let huSequence = winChairIDArray.indexOf(i) + 1
                            this.showHuIdx({
                                plusInfo: {
                                    type: h.type,
                                    huSequence
                                },
                                card: h.card,
                                operate: h.operateType,
                                uid: user.uid,
                            })
                        }
                    }
                }
                /**恢复胡的那张牌 */
                let caozuoCard = data.gameData.caozuoCard
                if (caozuoCard && Array.isArray(caozuoCard)) {
                    for (let i = 0; i < caozuoCard.length; i++) {
                        let c = caozuoCard[i];
                        if (c && typeof (c) == "number") {
                            let idx = TSMJModel.getUserIndexByChairID(i)
                            let hcom = this._handTileMgrList[idx]
                            if (hcom) hcom.setHuTile(c)
                            // console.log("设置了胡的牌==", idx, c)
                        }
                    }
                }
                this.checkTingPai();
            } else {
                this.btn_ting.active = false;
            }
        }
        /**恢复托管标记 */
        let userTrustArray = data.gameData.autoUser
        if (userTrustArray) {
            this.tuoguan.active = userTrustArray[TSMJModel.myUid]
        }
    },

    /**判断人数，初始化头像位置 */
    seatsInit() {
        let chairCount = TSMJModel.getChairCount();
        let headPos = [0, 1, 2, 3];
        if (chairCount == 2) {
            headPos = [0, 2];
        } else if (chairCount == 3) {
            headPos = [0, 1, 3];
        }
        this._userList.length = 0;
        this._handTileMgrList.length = 0;
        this._optTileMgrList.length = 0;
        this._disTileMgrList.length = 0;
        this._operActNodeList.length = 0;
        this._huaTilesMgrList.length = 0;
        for (let i = 0; i < 4; i++) {
            let h = cc.find("head" + i, this.node);
            h.active = false;
        }
        for (let i = 0; i < headPos.length; i++) {
            let h = cc.find("head" + headPos[i], this.node);
            this._userList.push(h.getComponent("TSMJHead"));
            this._userList[i].initRes();
            let handTile = cc.find("tiles/handTiles" + headPos[i], this.node);
            let optTile = cc.find("tiles/optTiles" + headPos[i], this.node);
            if (!optTile) {
                optTile = cc.find("optTiles" + headPos[i], handTile);
            }
            let disTile = cc.find("tiles/outTiles" + headPos[i], this.node);
            let huaTile = cc.find("tiles/huaTiles" + headPos[i], this.node);
            this._handTileMgrList.push(handTile.getComponent("TSMJHandTileMgr"));
            this._handTileMgrList[i].init(headPos[i]);
            this._optTileMgrList.push(optTile.getComponent("TSMJOptTileMgr"));
            this._optTileMgrList[i].init(headPos[i]);
            this._disTileMgrList.push(disTile.getComponent("TSMJOutTileMgr"));
            this._disTileMgrList[i].init(headPos[i]);
            this._huaTilesMgrList.push(huaTile.getComponent("TSMJHuaTileMgr"));
            this._huaTilesMgrList[i].init(headPos[i]);
            let opNode = cc.find("operAct" + headPos[i], this.node);
            this._operActNodeList.push(opNode);
        }
    },

    /**用户进入房间 */
    userEnterRoom(data) {
        let idx = TSMJModel.getUserIndexByUID(data.uid);
        let headcom = this._userList[idx]
        if (headcom) {
            headcom.init(data)
            if (this._gameStatus === ApiTsmj.gameStatus.HUANSANZHANG) {
                if (!TSMJModel.getIsHuanPai(data.uid)) {
                    headcom.setState(1);
                }
            } else if (this._gameStatus === ApiTsmj.gameStatus.DINGQUE) {
                if (!TSMJModel.getDingQueType(data.uid)) {
                    headcom.setState(2);
                }
            }
            let dtype = TSMJModel.getDingQueType(data.chairID)
            headcom.setDingque(dtype);
        }
        if (data.chairID == TSMJModel.getMyChairID()) {
            this.verifyZuobi(data);
        }
    },

    /**恢复所有人的总输赢分数 */
    initTotalScore(userWinTotalScore) {
        if (userWinTotalScore && TSMJModel.scoreState()) {
            let len = Object.keys(userWinTotalScore);
            if (len.length > 0) {
                for (const uid in userWinTotalScore) {
                    if (Object.hasOwnProperty.call(userWinTotalScore, uid)) {
                        const s = userWinTotalScore[uid];
                        let idx = TSMJModel.getUserIndexByUID(uid);
                        let com = this._userList[idx];
                        if (com) com.setTotalScore(s);
                    }
                }
            } else {
                this._userList.forEach((user) => {
                    user.setTotalScore(0)
                })
            }
        } else {
            this._userList.forEach((user) => {
                user.setTotalScore('0')
            })
        }

    },

    /**用户离开房间 */
    userLeaveRoom(data) {
        let idx = TSMJModel.getUserIndexByChairID(data.chairID);
        let headcom = this._userList[idx];
        if (headcom) {
            headcom.leave();
        }
        if (data.uid == UserModel.getData('uid')) {
            if (!TSMJModel.getRoomID() ||
                TSMJModel.getRoomID() == data.roomID) {
                this.enterHall();
            }
        }
    },

    /**GPS定位检查 */
    verifyZuobi(roomUserInfo) {
        if (!TSMJModel.getGameRuleByKey("fangzuobi")) return;
        if (!roomUserInfo || roomUserInfo.chairID >= TSMJModel.getChairCount()) return;
        let add1 = null;
        try {
            add1 = JSON.parse(roomUserInfo.userInfo.address);
        } catch (e) { }
        if (!add1) {
            AssetsManager.popDialog({
                content: `玩家${roomUserInfo.userInfo.nickname}定位未知！`,
                ok: () => { }
            });
            return;
        }
        for (let i = 0; i < this._userList.length; ++i) {
            let user = this._userList[i].getUserData()
            if (!user || user.chairID == roomUserInfo.chairID) continue;
            // if (user.userInfo.lastLoginIP == roomUserInfo.userInfo.lastLoginIP) {
            //     AssetsManager.popDialog({
            //         content: `玩家${roomUserInfo.userInfo.nickname}与玩家${user.userInfo.nickname}IP地址相同！`,
            //         ok: () => {}
            //     });
            //     break;
            // }
            let add2 = null;
            try {
                add2 = JSON.parse(user.userInfo.address);
            } catch (e) { }
            if (!add2) {
                continue;
            }
            // let distance = Utils.getDistanceByLocation(add1, add2);
            // if (distance < 0.1) {
            //     AssetsManager.popDialog({
            //         content: `玩家${roomUserInfo.userInfo.nickname}与玩家${user.userInfo.nickname}距离过近！`,
            //         ok: () => {},
            //         no: () => {}
            //     });
            //     break;
            // }
        }
    },

    /**玩家准备 */
    onUserReady(data) {
        let idx = TSMJModel.getUserIndexByChairID(data.chairID);
        let com = this._userList[idx];
        if (com) com.setReady(true);
        if (data.chairID == TSMJModel.getMyChairID()) {
            this.btn_ready.active = false;
            this.readyTick.sync(0);
        }
    },

    /**隐藏所有准备图标 */
    hideReadyIcon() {
        this._userList.forEach(userCom => {
            userCom.setReady(false);
        });
    },

    /**更新局数 */
    onGameRoundUpdate(data) {
        MessageCallback.emitMessage('RemoveGameResult');
        TSMJModel.setCurBureau(data.curBureau);
        this.txt_round.string = `${data.curBureau}/${TSMJModel.getMaxBureau()}局`;
        this.btn_invite.active = false;
        this.btn_copy.active = false;
        this.btn_leave.active = false;
        this.btn_dismiss.active = data.curBureau != 0 && !TSMJModel.getGameRuleByKey("canNotDissmiss");
    },

    /**更新剩余牌数量 */
    onLastTilesCountUpdate(count) {
        if (count > 0) {
            this.txt_last.string = `x${count}`;
        } else {
            this.txt_last.string = '';
        }
        if (this.restCardLayout) this.restCardLayout.updateLayout();
    },

    /**更新庄家 */
    onBankerUpdate(data) {
        let idx = TSMJModel.getUserIndexByUID(data.uid);
        for (let index = 0; index < this._userList.length; index++) {
            let com = this._userList[index];
            if (!com) continue;
            com.setBanker(idx == index);
        }
    },

    /**游戏状态跳转 */
    onGameStatusUpdate(data) {
        this._gameStatus = data.gameStatus;
        if (this._gameStatus == ApiTsmj.gameStatus.NONE ||
            this._gameStatus == ApiTsmj.gameStatus.DICES) {
            this.onLastTilesCountUpdate(0);
        }
        this.com_clock.setTick(data.tick);
        this.com_clock.hideDice();
        this.hideReadyIcon();
        this.btn_ready.active = false
        this.btnBackHall.active = false
        this.readyTick.sync(0);
        switch (this._gameStatus) {
            case ApiTsmj.gameStatus.NONE:
                TSMJModel.reset();
                this.resetTable();
                break;
            case ApiTsmj.gameStatus.PLAYING:
                this._handTileMgrList[0].setAllTilesDown();
                break;
            default:
                break;
        }
    },

    /**发牌 */
    onSendTiles(data, isAni) {
        let isTest = UserModel.getData('isTest');
        TSMJModel.setGhostCard(data.laiZiCards);
        TSMJModel.setHandCards(data.handCards);
        TSMJModel.setHuaCards(data.huaCards);
        let lastOpt = TSMJModel.getLastOperate();
        if (!data.handCards) return;
        let huaCards = data.huaCards || {};
        let handCards = data.handCards;
        let sex = 'nv';
        let isHua = false;
        for (const uid in handCards) {
            let user = TSMJModel.getUserByUID(uid);
            if (!user) continue;
            handCards[uid] = handCards[uid] || [];
            let tiles = handCards[uid].slice();
            tiles = TSMJModel.sortTiles(uid, tiles);
            let idx = TSMJModel.getUserIndexByUID(uid);
            let hcom = this._handTileMgrList[idx];
            if (!hcom) continue;
            let drawTile = !!lastOpt && lastOpt.uid == uid && lastOpt.operate == ApiTsmj.operateType.GET ? lastOpt.card : null;
            let isDraw = !!lastOpt && lastOpt.uid == uid && lastOpt.operate == ApiTsmj.operateType.GET;
            if (!!isDraw) {
                if (idx == 0 || !!isTest) {
                    let drawTileIndex = tiles.indexOf(drawTile);
                    if (drawTileIndex >= 0) tiles.splice(drawTileIndex, 1);
                } else {
                    tiles.splice(0, 1);
                }
            }
            if (idx != 0 && !!isTest) {
                hcom.updateLieTiles(tiles, null);
            } else {
                hcom.updateStandTiles(tiles, null, isAni);
            }
        }
    },

    /**通知用户操作 */
    onGameTurn(data) {
        TSMJModel.onGameTurn(data);
        this.setTilesGary(-1);
        this.com_clock.setDir(TSMJModel.getUserIndexByUID(data.uid));
        this.com_clock.setTick(data.tick);
        let isTest = UserModel.getData('isTest');
        /**更新时间和位置 */
        let idx = TSMJModel.getUserIndexByUID(data.uid);
        if (data.operateArray && (data.operateArray.indexOf(ApiTsmj.operateType.QI) != -1 ||
            data.operateArray.indexOf(ApiTsmj.operateType.GET) != -1)) {
            //通知出牌
            let isMoPai = data.operateArray.indexOf(ApiTsmj.operateType.GET) != -1 || data.card != null;
            for (let i = 0; i < this._handTileMgrList.length; i++) {
                const comp = this._handTileMgrList[i];
                if (!comp) continue;
                if (idx == i) {
                    if (isMoPai && (idx == 0 || !isTest)) {
                        comp.setDrawTile(data.card, idx == 0);
                    } else if (isMoPai && !!isTest && idx != 0) {
                        comp.setHuTile(data.card);
                    }
                    AssetsManager.playEffect({
                        path: 'res/audio/main/give',
                        bundle: Enums.bundleType.TSMJ
                    });
                    if (idx == 0 && data.operateArray.indexOf(ApiTsmj.operateType.QI) != -1) {
                        comp.setIsMyTurn();
                        if (!data.card) {
                            comp.setPengChu()
                        }
                    }
                } else {
                    comp.setTouch(false);
                }
            }
        }
        let turn = JSON.parse(JSON.stringify(data));
        if (turn.operateArray && turn.operateArray.length > 1) {
            this.com_opt.onGameTurn(turn);
        } else {
            this.com_opt.onClearTurn();
        }
        this.checkTingPai();
    },

    /**检查 听牌 */
    checkTingPai() {
        let gameStatus = TSMJModel.getGameStatus();
        let operateUid = TSMJModel.getCurOptUID();
        let myUid = TSMJModel.getMyUID();
        let idx = TSMJModel.getUserIndexByUID(myUid);
        let hcom = this._handTileMgrList[idx];
        let handCards = TSMJModel.getHandCards(myUid);
        let winHandChecks = handCards.slice();
        let tingHandChecks = handCards.slice();
        if (operateUid != myUid) {
            /**不是自己操作 去掉打听标记 显示听牌按钮*/
            if (hcom) hcom.setTingIcons();
            let winTingFilter = TSMJModel.tingFilter(null, winHandChecks);
            let canWinList = TSMJLogic.getTingList(winTingFilter.cards, winTingFilter.ghostCardsCount);
            this.btn_ting.active = canWinList.length > 0;
            this._canWinList = canWinList;
            let ghostCard = TSMJModel.getGhostCard();
            if (canWinList.length > 0 && ghostCard > 0) {
                let ghostCheck = canWinList.find((card) => {
                    return card.cardID == ghostCard;
                });
                if (!ghostCheck) {
                    this._canWinList.push({
                        cardID: ghostCard,
                        rate: 1
                    })
                }
            }
        } else if (operateUid == myUid) {
            let tingCards = [];
            this._tingList = [];
            //判断是否需要删除手牌
            let repeatFilter = Array.from(new Set(tingHandChecks));
            for (const cardId of repeatFilter) {
                let copyTingHandCards = tingHandChecks.slice();
                let tingFilter = TSMJModel.tingFilter(cardId, copyTingHandCards);
                let canTingList = TSMJLogic.getTingList(tingFilter.cards, tingFilter.ghostCardsCount);
                if (!canTingList || canTingList.length == 0) continue;
                tingCards.push(cardId);
            }
            this._tingList = Array.from(new Set(tingCards));
            if (this._tingList.length > 0) {
                if (hcom) hcom.setTingIcons(this._tingList);
            }
        }
    },

    showTingLight() {
        let tiles = TSMJModel.getHandCards(TSMJModel.getMyUID())
        if (tiles.length >= 14) {
            return
        }
        let winTingFilter = TSMJModel.tingFilter(null, tiles.slice());
        let canWinList = TSMJLogic.getTingList(winTingFilter.cards, winTingFilter.ghostCardsCount);
        if (canWinList && canWinList.length > 0) { //如果听牌，播放听牌光效
            let node = this._handTileMgrList[0].node
            let pos = CCUtil.postionConvert(node, this._operActNodeList[0])
            let com = this.genAniNode(this._operActNodeList[0], null, pos)
            com.node.scale = node.scale
            com.showTingLight()
        }
    },

    /**展示胡牌序列 */
    showHuIdx(data, isAni = false) {
        return;
        let idx = TSMJModel.getUserIndexByUID(data.uid);
        if (typeof (idx) == "number") {
            let com = this.genAniNode(this._operActNodeList[idx])
            com && com.showHuIndex(data.operate, data.plusInfo.huSequence, data.chairID, isAni)
        }
    },

    /**用户操作广播 */
    onUserOpt(data) {
        let isTest = UserModel.getData("isTest");
        TSMJModel.onUserOpt(data);
        this.setTilesGary(-1);
        if (data.uid == TSMJModel.getMyUID()) {
            this.com_opt.onClearTurn();
            this.com_ting.node.active = false;
            this._handTileMgrList[0].setTingIcons();
        }
        let idx = TSMJModel.getUserIndexByUID(data.uid);
        let user = null,
            ucom = this._userList[idx];
        if (ucom) user = ucom.getUserData();
        let sex = 'nv';
        if (user) {
            sex = (user.userInfo.sex == 0) ? 'nan' : 'nv';
        }
        let typeNameList = ["chi", "peng", "gang", "hu", "zimo"];
        /**隐藏所有位置的摸的那张牌 */
        for (let i = 0; i < this._handTileMgrList.length; i++) {
            const comp = this._handTileMgrList[i];
            if (!comp) continue;
            if (i == 0 || !isTest) {
                comp.setDrawTile();
            } else {
                comp.setHuTile();
            }
        }
        let drawTile = null;
        if (data.operate == ApiTsmj.operateType.QI) {
            let moOpt = TSMJModel.getQiByMo(data);
            if (!!moOpt && moOpt.card != data.card) {
                drawTile = moOpt.card;
            }
        }
        /**更新手牌 */
        let hcom = this._handTileMgrList[idx];
        let handCards = TSMJModel.getHandCards(data.uid);
        if (!hcom) return;
        if (idx != 0 && !!isTest) {
            hcom.updateLieTiles(handCards);
        } else {
            drawTile = idx == 0 ? drawTile : null;
            hcom.updateStandTiles(handCards, drawTile);
        }
        let optPengGang = () => {
            let pengGangArray = TSMJModel.getPengGangArrayByUID(data.uid);
            let optCom = this._optTileMgrList[idx];
            if (optCom) optCom.updateOptTiles(pengGangArray);
            let lastOut = TSMJModel.getLastOutCardRecord();
            if (!!lastOut.isDel) {
                let localIndex = TSMJModel.getUserIndexByUID(lastOut.opt.uid);
                this._disTileMgrList[localIndex].afterOptUpdateTiles(lastOut.opt.card);
                this.updatePointer();
            }
        }

        let optHu = () => {
            /** 亮出胡的牌 */
            let hcom = this._handTileMgrList[idx];
            if (hcom) {
                let huNode = hcom.setHuTile(data.card)
                let optNode = this._operActNodeList[idx]
                this.scheduleOnce(() => {
                    let pos = CCUtil.postionConvert(huNode, optNode)
                    let aniCom = this.genAniNode(optNode, null, pos)
                    aniCom.node.scale = hcom.node.scale
                    aniCom.showHuLight()
                }, 0.2)
            }
            /**删除桌子上的牌 */
            let lastOut = TSMJModel.getLastOutCardRecord();
            if (!!lastOut.isDel) {
                let localIndex = TSMJModel.getUserIndexByUID(lastOut.opt.uid);
                this._disTileMgrList[localIndex].afterOptUpdateTiles(lastOut.opt.card);
                this.updatePointer();
            }
            this._huPai[data.uid] = data.card;
        }

        let showAni = (type) => {
            let audioType = type;
            if (audioType < typeNameList.length) {
                AssetsManager.playEffect({
                    path: `res/audio/${sex}/${typeNameList[audioType]}`,
                    bundle: Enums.bundleType.TSMJ
                });
            }
            /**展示动画 */
            let com = this.genAniNode(this._operActNodeList[idx])
            com.showOpt(type);
        }

        switch (data.operate) {
            case ApiTsmj.operateType.QI: //出牌
                AssetsManager.playEffect({
                    path: `res/audio/${sex}/` + data.card,
                    bundle: Enums.bundleType.TSMJ
                });
                AssetsManager.playEffect({
                    path: 'res/audio/main/push',
                    bundle: Enums.bundleType.TSMJ
                });
                if (idx == 0) {
                    this._handTileMgrList[0].setTouch(false)
                }
                /**更新桌子上的牌 */
                let out = TSMJModel.getOutTilesByUID(data.uid)
                let last = null,
                    disCom = this._disTileMgrList[idx]
                if (disCom) last = disCom.showOutTiles(out)
                if (last && last.flower == data.card) {
                    this.updatePointer(last.node)
                }
                if (idx == 0) {
                    this.showTingLight()
                }
                break;
            case ApiTsmj.operateType.CHI: //吃牌
                showAni(0)
                optPengGang()
                break;
            case ApiTsmj.operateType.PENG: //碰牌
                showAni(1)
                optPengGang()
                break;
            case ApiTsmj.operateType.GANG_BU: //补杠
                showAni(2)
                optPengGang()
                break;
            case ApiTsmj.operateType.GANG_CHI: //吃杠
                showAni(2)
                optPengGang()
                break;
            case ApiTsmj.operateType.GANG_ZHI: //暗杠
                showAni(2)
                optPengGang();
                break;
            case ApiTsmj.operateType.HU_CHI: //接炮
                showAni(3);
                optHu();
                break;
            case ApiTsmj.operateType.YOU_JIN: //游金
                showAni(ApiTsmj.operateType.YOU_JIN);
                optHu();
                break;
            case ApiTsmj.operateType.SAN_JIN: //三金倒
                showAni(ApiTsmj.operateType.SAN_JIN);
                optHu();
                break;
            case ApiTsmj.operateType.HU_ZHI: //自摸
                showAni(4)
                optHu();
                break;
            case ApiTsmj.operateType.HU_QIANG: //抢杠
                showAni(3)
                optHu();
                break;
            default:
                break;
        }
        /**展示分数 */
        let plusInfo = data.plusInfo;
        if (plusInfo && plusInfo.winScoreRecord && plusInfo.winScoreRecord.length > 0) {
            for (let i = 0; i < plusInfo.winScoreRecord.length; i++) {
                const score = plusInfo.winScoreRecord[i];
                let index = TSMJModel.getUserIndexByChairID(i)
                this.showOptScore(score, index)
            }
        }
    },

    onSmall(data) {
        this.deleteMoveNode();
        let result = JSON.parse(JSON.stringify(data.result));
        let isTest = UserModel.getData("isTest");
        let myUid = TSMJModel.getMyUID();
        if (!!result) {
            for (const user of result) {
                if (!user || user.uid == myUid) continue; //处理没有调试权限时其他人摊牌
                if (!user.userCards || !user.userCards[user.uid]) continue;
                let userCards = user.userCards[user.uid];
                let idx = TSMJModel.getUserIndexByUID(user.uid);
                if (!this._handTileMgrList[idx]) continue;
                if (user.winScores > 0) {
                    let huFilter = [ApiTsmj.operateType.HU_ZHI, ApiTsmj.operateType.YOU_JIN, ApiTsmj.operateType.SAN_JIN];
                    user.huCards = user.huCards || [];
                    if (huFilter.indexOf(user.huType) != -1) {
                        //赢家删除胡牌
                        let huCardIndex = userCards.indexOf(user.huCards);
                        if (huCardIndex >= 0) {
                            userCards.splice(huCardIndex, 1);
                        }
                    }
                    userCards = TSMJModel.sortTiles(user.uid, userCards);
                    this._handTileMgrList[idx].updateLieTiles(userCards);
                    this._handTileMgrList[idx].setHuTile(user.huCards);
                } else {
                    this._handTileMgrList[idx].updateLieTiles(userCards);
                }
            }
            AssetsManager.playEffect({
                path: 'res/audio/main/push',
                bundle: Enums.bundleType.TSMJ
            });
        }
        data.enterHall = this.enterHall.bind(this);
        data.mainComp = this;
        data.isBureauFull = (TSMJModel.getCurBureau() == TSMJModel.getMaxBureau());
        data.path = "res/prefab/TSMJResultDialog";
        data.isResult = true;
        data.bundle = Enums.bundleType.TSMJ;
        MessageCallback.emitMessage('RemoveGameResult');
        if (TSMJModel.getGameRuleByKey("zhaNiao")) {
            this.com_ma.showMaPai(data.maPaiInfo)
            this.scheduleOnce(() => {
                AssetsManager.createDialog(data);
            }, 3)
        } else
            AssetsManager.createDialog(data);
    },

    /**展示操作分数 */
    showOptScore(score, index) {
        if (!score || score == 0) return
        let operActNode = this._operActNodeList[index]
        let acom = this.genAniNode(operActNode, "aniOptScore")
        if (acom) acom.showOptScoreAni(score)
    },

    genAniNode(pNode, nodeName, pos) {
        if (cc.isValid(pNode)) {
            if (nodeName) {
                let aNode = pNode.getChildByName(nodeName)
                if (cc.isValid(aNode)) {
                    aNode.destroy()
                }
            }
            let aniNode = cc.instantiate(this.operActPfb)
            aniNode.name = nodeName || "aniNode"
            aniNode.parent = pNode
            if (pos) {
                aniNode.setPosition(pos)
            }
            let acom = aniNode.getComponent("TSMJOperAct")
            return acom
        }
        return null
    },

    /**更新指示器位置*/
    updatePointer(lastTile) {
        if (!lastTile || !cc.isValid(lastTile)) {
            this.pointer.active = false;
            return;
        }
        this.scheduleOnce(() => {
            const pos = CCUtil.postionConvert(lastTile, this.node)
            this.pointer.setPosition(pos)
            this.pointer.active = true;
        })
    },

    /**清除桌面上所有牌 */
    resetTable() {
        this._handTileMgrList.forEach(c => {
            c.reset()
        });
        this._disTileMgrList.forEach(c => {
            c.reset()
        });
        this._optTileMgrList.forEach(c => {
            c.reset()
        });
        this._userList.forEach(c => {
            c.setBanker(false)
            c.setLight(false)
            c.setDingque()
        });
        this._operActNodeList.forEach(n => {
            n.removeAllChildren()
        })
        this.deleteFlyNode();
        this._huPai = {};
        this.btn_ting.active = false;
        this.com_ting.node.active = false;
        this.com_clock.reset();
        this.updatePointer();
        this.setTilesGary(-1);

        this._huaTilesMgrList.forEach(c => {
            c.reset()
        });
        this.onLastTilesCountUpdate(0);
        this._canWinList = [];
    },

    /**手牌点击，牌被抬起来 */
    onTileUp(tileCom) {
        /**打听显示 */
        let myUid = TSMJModel.getMyUID();
        let handCards = TSMJModel.getHandCards(myUid)
        if (this._tingList.includes(tileCom.flower)) {
            let myTiles = handCards.slice();
            let tingFilter = TSMJModel.tingFilter(tileCom.flower, myTiles);
            let canWinList = TSMJLogic.getTingList(tingFilter.cards, tingFilter.ghostCardsCount);
            if (canWinList.length > 0) {
                this.com_ting.showWinCards(canWinList)
            } else {
                this.com_ting.node.active = false
            }
        } else {
            this.com_ting.node.active = false
        }

        /**桌面上的牌和吃碰杠的牌 相同的牌变灰 */
        this.setTilesGary(tileCom.flower)
    },

    /**设置牌变灰 */
    setTilesGary(tileId) {
        this._disTileMgrList.forEach(c => {
            c.setTileGary(tileId)
        });
        this._optTileMgrList.forEach(c => {
            c.setTileGary(tileId)
        });
    },

    onGift(fromChairID, toChairID, giftID) {
        let fidx = TSMJModel.getUserIndexByChairID(fromChairID)
        let tidx = TSMJModel.getUserIndexByChairID(toChairID)
        let sender = this._userList[fidx].node
        let reciever = [],
            rids = [];
        if (fidx == tidx) {
            for (let i = 0; i < this._userList.length; i++) {
                const c = this._userList[i];
                reciever.push(c.node)
                rids.push(i)
            }
        } else {
            reciever.push(this._userList[tidx].node);
            rids.push(tidx);
        }
        AssetsManager.addGift({
            sid: fidx,
            rids: rids,
            reciever: reciever,
            sender: sender,
            id: giftID,
            parent: this.node
        });
    },


    showTest() {
        let isTest = UserModel.getData("isTest");
        this.btn_shezhi.active = false;
    },

    /**删除有可能存在的拖动牌 */
    deleteMoveNode() {
        let p = AssetsManager.getRoot()
        let n = p.getChildByName("moveNode");
        if (cc.isValid(n)) {
            n.destroy();
        }
    },

    /**删除有可能存在的飞行牌 */
    deleteFlyNode() {
        let p = AssetsManager.getRoot()
        let f = p.getChildByName("flyNode");
        if (cc.isValid(f)) {
            f.destroy();
        }
    },

    _onMenuOpen() {
        this.menuLayList.stopAllActions()
        this.btn_menu.active = false
        this.menuLayList.active = true
        this.menuLayList.getComponent(cc.Widget) && this.menuLayList.getComponent(cc.Widget).updateAlignment();
        this._roomsLayPos = {
            show: cc.v2(),
            hide: cc.v2()
        };
        this._moveAction = true;
        this._roomsLayPos.hide = this.menuLayList.getPosition(cc.v2());
        this._roomsLayPos.show = cc.v2(this._roomsLayPos.hide.x + this.menuLayList.width + CCUtil.getFixWidget(), this._roomsLayPos.hide.y);
        this.menuLayList.opacity = 0;
        this.menuLayList.setPosition(this._roomsLayPos.hide);
        cc.tween(this.menuLayList)
            .to(0.5, {
                opacity: 255,
                position: cc.v3(this._roomsLayPos.show)
            }, {
                easing: 'smooth'
            })
            .call(() => {
                this._moveAction = false;
            })
            .start();


    },

    _onMenuCloseClick() {
        this.btn_menu.active = true

        this.menuLay.active = false;
    },

    /**按钮响应 */
    btnClickCallFunc(event, param) {
        switch (event.target.name) {
            case "btn_menu": //菜单


                this.menuLay.active = true;
                this._onMenuOpen();

                break;
            case "menu": //关闭菜单
                // this.menu.active = false
                this._onMenuCloseClick();
                break
            case "btn_leave": //离开房间
                this._onMenuCloseClick();
                if (!UserModel.isInRoom()) {
                    this.enterHall();
                    return;
                }
                if (TSMJModel.getCurBureau() == 0) {
                    ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
                } else {
                    AssetsManager.tipDialog('现在不能退出游戏');
                }
                break;
            case "btn_ready": //准备
                ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify(true));
                this.btn_ready.active = false;
                break;
            case "btn_dismiss": //解散
                this._onMenuCloseClick();
                AssetsManager.popDialog({
                    content: '是否确定发出解散申请？',
                    ok: () => {
                        ApiRoom.roomMessageNotify(ApiRoom.getAskForDismissNotifyData({
                            isAsker: true
                        }));
                    },
                    no: () => { }
                });
                break;
            case "btn_refresh": //刷新
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 10)) return;
                AssetsManager.tipDialog('刷新界面可以修复游戏显示问题');
                this.getRoomSceneInfo()
                break;
            case "btn_setting": //设置
                this._onMenuCloseClick();
                AssetsManager.setDialog({
                    type: "mahjong",
                    gameType: Enums.bundleType.TSMJ,
                    musicType: Enums.bundleType.MAHJONG,
                });
                break;
            case "btn_review": //回看
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiTsmj.gameReviewNotify());
                break;
            case "btn_msg": //聊天
                if (CCUtil.clickInterval(event.target, 1)) return;
                let params = {
                    gameRule: TSMJModel.getGameRule(),
                    chat: (chat) => {
                        ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
                    }
                }
                AssetsManager.chatDialog(params);
                break;
            case "btn_roomInfo": //规则
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 1)) return;
                let rule = TSMJModel.getGameRule();
                if (!rule) return;
                AssetsManager.tableDialog({
                    gameRule: rule,
                });
                break;
            case "btn_ting": //听牌
                if (this._canWinList.length > 0 && !this.com_ting.node.active) {
                    for (let i = 0; i < this._canWinList.length; i++) {
                        if (!this._canWinList[i]) continue;
                        this._canWinList[i].count = TSMJModel.getRestCardCount(this._canWinList[i].cardID);
                    }
                    this.com_ting.showWinCards(this._canWinList);
                } else {
                    this.com_ting.node.active = false;
                }
                break;
            case "btn_location": //定位
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 1)) return;
                AssetsManager.locationDialog({
                    users: TSMJModel.getUsers(),
                    chairCount: TSMJModel.getChairCount(),
                    fangzuobi: TSMJModel.getGameRuleByKey('fangzuobi')
                })
                break;
            case "btn_deposit": //开始托管
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiTsmj.gameTrushNotify(true));
                break;
            case "btn_quxiaotuoguan": //取消托管
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiTsmj.gameTrushNotify(false));
                break;
            case "btn_invite": //邀请
                let gameRule = TSMJModel.getGameRule();
                gameRule = gameRule || {};
                gameRule.roomId = TSMJModel.getRoomID();
                let share = ConfigModel.getRoomRuleShare(gameRule);
                NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
                break;
            case "btn_copy": //复制
                let str = ConfigModel.getRoomShare(Enums.bundleType.TSMJ, TSMJModel.getRoomID());
                NativeUtil.copyText(str);
                break;
            case "btn_back":
                this.enterHall()
                break;
            default:
                break;
        }
    },

    onChat(data) {
        let idx = TSMJModel.getUserIndexByUID(data.uid)
        let com = this._userList[idx];
        if (!com) return;
        com.gameChat(data)
    },
    // 好友邀请
    onShowInvite() {
        AssetsManager.friendDialog({
            gameRule: TSMJModel.getGameRule(),
        })
    },


    /**消息监听 */
    messageCallbackHandler(route, msg) {
        if (route === 'RoomMessagePush') {
            if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
                this.gameInit(msg.data);
            } else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
                TSMJModel.otherUserJoinRoom(msg.data.roomUserInfo);
                this.verifyZuobi(msg.data.roomUserInfo);
                this.userEnterRoom(msg.data.roomUserInfo);
            } else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
                this.userLeaveRoom(msg.data.roomUserInfo);
            } else if (msg.type === ApiRoom.USER_READY_PUSH) {
                // console.log("收到了玩家准备==", msg.data);
                this.onUserReady(msg.data);
            } else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
                // console.log('玩家操作-发起解散', msg);
                if (!msg.data.userList || msg.data.userList.length == 0) return;
                msg.data.myChairID = TSMJModel.getMyChairID();
                AssetsManager.disDialog(msg.data);
            } else if (msg.type === ApiRoom.GAME_END_PUSH) {
                // console.log("游戏结束《《《《《《《《《", msg);
            } else if (msg.type === ApiRoom.ROOM_DISMISS_PUSH) {
                // console.log("房间被解散《《《《《《《《《《《", msg);
            } else if (msg.type === ApiRoom.USER_CHAT_PUSH) {
                this.onChat(msg.data);
            } else if (msg.type === ApiRoom.USER_GIFT_SEND_PUSH) {
                this.onGift(msg.data.fromChairID, msg.data.toChairID, msg.data.giftID);
            } else if (msg.type === ApiRoom.USER_VOICE_PUSH) {
                this._voiceMsgQueue.push(msg.data);
            } else if (msg.type === ApiRoom.USER_OFF_LINE_PUSH) {
                let idx = TSMJModel.getUserIndexByChairID(msg.data.chairID);
                let com = this._userList[idx];
                if (com) com.setOffline(true);
            } else if (msg.type === ApiRoom.ROOM_USER_INFO_CHANGE_PUSH) { //用户信息刷新
                this._userList.forEach(com => {
                    !!com && com.userInfoChange(msg.data);
                });
            } else if (msg.type === ApiRoom.ROOM_USER_WIN_TOTAL_PUSH) {
                this.initTotalScore(msg.data.userWinTotalScore);
            }
        } else if (route === 'GameMessagePush') {
            if (msg.type === ApiTsmj.GAME_BUREAU_PUSH) {
                this.onGameRoundUpdate(msg.data);
            } else if (msg.type === ApiTsmj.GAME_STATUS_PUSH) { //游戏状态
                TSMJModel.setGameStatus(msg.data.gameStatus);
                this.onGameStatusUpdate(msg.data);
            } else if (msg.type === ApiTsmj.GAME_SEND_CARDS_PUSH) { //发牌
                MessageCallback.emitMessage('RemoveGameResult');
                this.deleteMoveNode();
                this.com_clock.hideDice();
                this.onSendTiles(msg.data, true);
            } else if (msg.type === ApiTsmj.GAME_DICES_PUSH) {
                this.com_clock.showDiceAni(msg.data.dice1, msg.data.dice2);
            } else if (msg.type === ApiTsmj.GAME_TURN_OPERATE_PUSH) {
                this.deleteMoveNode();
                this.onUserOpt(msg.data);
            } else if (msg.type === ApiTsmj.GAME_TURN_PUSH) {
                this.deleteMoveNode();
                this.onGameTurn(msg.data);
            } else if (msg.type === ApiTsmj.GAME_BANKER_PUSH) { //庄家位置更新
                this.onBankerUpdate(msg.data);
            } else if (msg.type === ApiTsmj.GAME_REST_CARDS_COUNT_PUSH) { //剩余牌数量更新
                this.onLastTilesCountUpdate(msg.data.restCardsCount);
            } else if (msg.type === ApiTsmj.GAME_END_PUSH) {
                // console.log("游戏结束《《《《《《《《《", msg);
                UserModel.setData('roomID', '');
                let date = Utils.getDateFormat();
                if (msg.data.result.length > 0) {
                    this.showMJAllResultFunc = () => {
                        this.showMJAllResultFunc = null;
                        msg.data.mainComp = this;
                        msg.data.isUnionCreate = TSMJModel.isUnionCreate();
                        msg.data.enterHall = this.enterHall.bind(this);
                        msg.data.roomDismissReason = msg.data.reason;
                        msg.data.path = 'res/prefab/TSMJAllResult';
                        msg.data.bundle = Enums.bundleType.TSMJ;
                        msg.data.roomID = TSMJModel.getRoomID();
                        msg.data.date = date.yyyymmddhhmmss;
                        AssetsManager.createDialog(msg.data);
                    };
                    this.unscheduleAllCallbacks();
                    this.scheduleOnce(() => {
                        MessageCallback.emitMessage('RemoveGameResult');
                        this.showMJAllResultFunc && this.showMJAllResultFunc();
                    }, 2);
                } else {
                    this.enterHall();
                }
            } else if (msg.type === ApiTsmj.GAME_REVIEW_PUSH) {
                let reviewRecord = msg.data.reviewRecord;
                if (reviewRecord && reviewRecord.length > 0) {
                    AssetsManager.createDialog({
                        bundle: Enums.bundleType.TSMJ,
                        path: "res/prefab/TSMJResultDialog",
                        reviewRecord: reviewRecord,
                    });
                } else {
                    AssetsManager.tipDialog('暂无回放没有数据');
                }
            } else if (msg.type === ApiTsmj.GAME_RESULT_PUSH) {
                this.onSmall(msg.data);
            } else if (msg.type === ApiTsmj.GAME_TRUST_PUSH) { //开始托管
                if (TSMJModel.myUid == msg.data.uid) {
                    this.tuoguan.active = msg.data.trust
                }
            } else if (msg.type === ApiTsmj.GAME_GANG_SCORE_PUSH) {
                // console.log("杠分", msg.data)
                let list = {
                    [msg.data.uid]: msg.data.detail.score
                }
                for (let i = 0; i < msg.data.detail.loseUid.length; i++) {
                    list[msg.data.detail.loseUid[i]] = msg.data.detail.score * -1
                }
                for (const uid in list) {
                    if (Object.hasOwnProperty.call(list, uid)) {
                        const score = list[uid];
                        let index = TSMJModel.getUserIndexByUID(uid)
                        this.showOptScore(score, index)
                    }
                }
            }
        } else if (route === 'ReconnectSuccess') {
            this.getRoomSceneInfo();
        } else if (route === 'SelfEntryRoomPush') {
            if (msg.gameType != TSMJModel.getBundleType()) {
                AssetsManager.popDialog({
                    content: `进入游戏失败,请返回大厅后再试！`,
                    ok: () => {
                        this.enterHall();
                    }
                });
                return;
            }
            UserModel.setData('gameType', msg.gameType);
            ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
        } else if (route === 'CreateRoomFail') {
            this.unscheduleAllCallbacks();
            AssetsManager.popDialog({
                content: Codes[msg.code],
                ok: () => {
                    this.enterHall();
                }
            });
        } else if (route === 'QuickJoinFail') {
            AssetsManager.popDialog({
                content: Codes[msg.code],
                ok: () => {
                    this.enterHall();
                }
            });
        } else if (route === 'JoinGameAgainPush') {
            this.unscheduleAllCallbacks();
            AssetsManager.popDialog({
                content: Codes[msg.code],
                ok: () => {
                    this.enterHall();
                }
            });
        } else if (route === 'OnGameOnceAgain') {
            this.unscheduleAllCallbacks();
            this.scheduleOnce(() => {
                AssetsManager.popDialog({
                    content: '再来一局初始化异常，请返回大厅后再试！',
                    ok: () => {
                        this.enterHall();
                    }
                });
            }, 10);
        } else if (route === Events.clientEvents.gvUploadFileSuccess) {
            this._onUploadSuccess(msg)
        }
    },
});