const ApiXcmj = require('./ApiXcmj');
const ApiRoom = require('../../../src/api/ApiRoom');;
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const MessageCallback = require('../../../src/utils/MessageCallback');
const UserModel = require('../../../src/model/UserModel');
const Codes = require('../../../src/const/Codes');
const ConfigModel = require('../../../src/model/ConfigModel');
const NativeUtil = require('../../../src/utils/NativeUtil');
const XCMJModel = require('./XCMJModel');
const XCMJLogic = require('./XCMJLogic');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const SubManager = require('../../../src/utils/SubManager');
const Events = require('../../../src/const/Events');

cc.Class({
    extends: cc.Component,

    properties: {
        com_opt: require("XCMJOperate"),
        com_clock: require("XCMJClock"),
        com_ting: require("XCMJTingTips"),
        readyTick: require('XCMJReadyTick'),
        com_ma: require("XCMJMaPai"),
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
        huanpaiNode: cc.Node,
        btnBackHall: cc.Node,
        btnAniList: [cc.Node],
        btnYuYin: cc.Node,
        canNotDismissBar: cc.Node,

        _aniX: 0,
        /**用户脚本列表 下标为本地座位号*/
        _userList: [],
        /**手牌脚本列表 */
        _handTileMgrList: [],
        /**操作牌脚本列表 */
        _optTileMgrList: [],
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
        /**换牌脚本 */
        _comHuanpai: null,
    },

    onLoad() {
        this.menuLay.active = false;
        AssetsManager.init(this.node);
        this._comHuanpai = this.huanpaiNode.getComponent("XCMJHuanPai")
        this._aniX = this.btnAniList[0].x;
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
        cc.systemEvent.on("tipBaiPai", this.onShowBaiPai, this);
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
        cc.systemEvent.off("tipBaiPai", this.onShowBaiPai, this);
        ConfigModel.setData('lastScene', 'xcmj');
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
        let isUnionCreate = XCMJModel.isUnionCreate();
        let unionID = !!isUnionCreate ? XCMJModel.getRoomCreatorByKey('unionID') : null;
        SubManager.exitBundle(unionID);
    },

    /**初始化和断线重连 */
    gameInit(data) {
        MessageCallback.emitMessage('RemoveGameResult');
        this.unscheduleAllCallbacks();
        this.resetTable();
        XCMJModel.init(data);
        let gameRule = XCMJModel.getGameRule()
        XCMJLogic.init(gameRule)
        let bundle = ConfigModel.getBundleConfig(gameRule.gameType)
        this.txt_gameName.string = bundle.name
        this._comHuanpai.gameInit(data.gameData)
        let isTest = UserModel.getData("isTest");
        this._gameStatus = data.gameData.gameStatus;
        let myUid = XCMJModel.getMyUID();
        let users = XCMJModel.getUsers();
        let operateUid = data.gameData.operateUid;
        this.com_clock.gameInit(XCMJModel.getChairCount(), XCMJModel.getMyChairID())
        if (this._gameStatus == ApiXcmj.gameStatus.NONE && XCMJModel.getCurBureau() == 0) {
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
        if (this.canNotDismissBar) this.canNotDismissBar.active = XCMJModel.getGameRuleByKey("canNotDissmiss");
        /**按钮显示 */
        let unionID = XCMJModel.isUnionCreate() ? XCMJModel.getRoomCreatorByKey('unionID') : null;
        let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
        this.btn_invite.active = XCMJModel.getCurBureau() == 0 && !!isShowInvite;
        this.btn_copy.active = XCMJModel.getCurBureau() == 0 && !!isShowInvite;
        this.btn_location.active = !!XCMJModel.getGameRuleByKey('showGps');
        this.btn_ready.active = (this._gameStatus === ApiXcmj.gameStatus.NONE && data.gameData.userPlayStatus[myUid] == ApiRoom.userStatusEnum.NONE);
        this.btn_leave.active = data.gameData.curBureau == 0;
        this.btn_dismiss.active = data.gameData.curBureau != 0 && !XCMJModel.getGameRuleByKey("canNotDissmiss");
        this.btnBackHall.active = data.gameData.curBureau == 0 && XCMJModel.isUnionCreate();
        let yuyin = XCMJModel.getGameRuleByKey('yuyin');
        this.btnYuYin.active = !!yuyin && ConfigModel.getData('voiceSpeaker');
        let tm = XCMJModel.getGameRuleByKey("trustTm")
        this.btn_deposit.active = tm && tm > 0;
        if (this.btn_ready.active && XCMJModel.getCurBureau() == 0 && XCMJModel.getGameRuleByKey("unReadyKick") > 0) {
            let tick = XCMJModel.getGameRuleByKey("unReadyKick") || 10;
            this.readyTick.sync(tick);
        } else {
            this.readyTick.sync(0);
        }
        /**房间号和局数 */
        this.txt_roomId.string = `房号:${data.roomID}`;
        this.txt_round.string = `${data.gameData.curBureau}/${data.gameData.maxBureau}局`;
        let gameName = ConfigModel.getBundleConfig(data.gameRule.gameType)
        this.txt_gameName.string = `游戏:${gameName.name}`

        this.onLastTilesCountUpdate(data.gameData.restCardsCount);
        this.showTest();
        if (this._gameStatus > ApiXcmj.gameStatus.DICES) {
            /**恢复手牌 */
            this.onSendTiles(data.gameData, false);
            for (const user of users) {
                let idx = XCMJModel.getUserIndexByUID(user.uid);
                /**恢复吃碰杠的牌 */
                let pengGangArray = XCMJModel.getPengGangArrayByUID(user.uid);
                if (pengGangArray.length > 0 && !!this._optTileMgrList[idx]) {
                    this._optTileMgrList[idx].updateOptTiles(pengGangArray);
                }
                /**恢复打出的牌 */
                let out = XCMJModel.getOutTilesByUID(user.uid);
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
            if (this._gameStatus === ApiXcmj.gameStatus.HUANSANZHANG && data.gameData.suggestCard) {
                if (!XCMJModel.getIsHuanPai(XCMJModel.getMyChairID())) {
                    let sug = data.gameData.suggestCard[myUid];
                    this._handTileMgrList[0].setHuanPai(sug);
                }
            }

            if (this._gameStatus === ApiXcmj.gameStatus.PLAYING) {
                /**恢复方向指示 */
                let curOptIdx = XCMJModel.getUserIndexByUID(operateUid);
                this.com_clock.setDir(curOptIdx);
                this.com_clock.setTick(data.gameData.tick);
                /**设置该谁出牌 */
                if (myUid == operateUid && data.gameData.lastOperateUid != myUid) {
                    this._handTileMgrList[0].setIsMyTurn();
                    if (!data.gameData.operateCard) {
                        this._handTileMgrList[0].setPengChu();
                    }
                }
                /**恢复每个人的摆牌 */
                let selfIsBaiPai = false
                let shaiPaiUser = Utils.deepCopy(data.gameData.shaiPaiUser)
                for (const uid in shaiPaiUser) {
                    if (uid == myUid) {
                        selfIsBaiPai = true
                    }
                    if (Object.hasOwnProperty.call(shaiPaiUser, uid)) {
                        const info = shaiPaiUser[uid];
                        this.onBaiPaiEnd(info, true)
                    }
                }

                /**设置胡牌顺序 */
                let userHuList = data.gameData.userHuDoneList
                if (userHuList && Array.isArray(userHuList)) {
                    for (let i = 0; i < userHuList.length; i++) {
                        let huUser = userHuList[i];
                        if (huUser) {
                            this.showHuIdx({
                                plusInfo: {
                                    index: huUser.huIndex
                                },
                                card: huUser.card,
                                operate: huUser.operateType,
                                uid: huUser.uid,
                            })
                        }
                        /**恢复胡的那张牌 */
                        let huIdx = XCMJModel.getUserIndexByUID(huUser.uid)
                        let hcom = this._handTileMgrList[huIdx]
                        if (hcom) hcom.setHuTile(huUser.card)
                    }
                }

                this.checkTingPai();
                if (!selfIsBaiPai) {
                    this.com_opt.showBtnBai()
                } else {
                    /**刷新自己的手牌 */
                    // let handCards = XCMJModel.getHandCards(XCMJModel.getMyUID(), false)
                    // this._handTileMgrList[0].updateStandTiles(handCards)
                }
            } else {
                this.btn_ting.active = false;
            }
        }
        /**恢复托管标记 */
        let userTrustArray = data.gameData.autoUser
        if (userTrustArray) {
            this.tuoguan.active = userTrustArray[XCMJModel.myUid]
        }
    },

    /**判断人数，初始化头像位置 */
    seatsInit() {
        let chairCount = XCMJModel.getChairCount();
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

        for (let i = 0; i < 4; i++) {
            let h = cc.find("head" + i, this.node);
            h.active = false;
        }
        for (let i = 0; i < headPos.length; i++) {
            let h = cc.find("head" + headPos[i], this.node);
            this._userList.push(h.getComponent("XCMJHead"));
            this._userList[i].initRes();
            let handTile = cc.find("tiles/handTiles" + headPos[i], this.node);
            let optTile = cc.find("tiles/optTiles" + headPos[i], this.node);
            if (!optTile) {
                optTile = cc.find("optTiles" + headPos[i], handTile);
            }
            let disTile = cc.find("tiles/outTiles" + headPos[i], this.node);
            this._handTileMgrList.push(handTile.getComponent("XCMJHandTileMgr"));
            this._handTileMgrList[i].init(headPos[i]);
            this._optTileMgrList.push(optTile.getComponent("XCMJOptTileMgr"));
            this._optTileMgrList[i].init(headPos[i]);
            this._disTileMgrList.push(disTile.getComponent("XCMJOutTileMgr"));
            this._disTileMgrList[i].init(headPos[i]);

            let opNode = cc.find("operAct" + headPos[i], this.node);
            this._operActNodeList.push(opNode);
        }
    },

    /**用户进入房间 */
    userEnterRoom(data) {
        let idx = XCMJModel.getUserIndexByUID(data.uid);
        let headcom = this._userList[idx]
        if (headcom) {
            headcom.init(data)
            if (this._gameStatus === ApiXcmj.gameStatus.HUANSANZHANG) {
                if (!XCMJModel.getIsHuanPai(data.chairID)) {
                    // console.log("当前位置还没有选择", data.chairID)
                    headcom.setState(1);
                }
            }
            // else if (this._gameStatus === ApiXcmj.gameStatus.DINGQUE) {
            //     if (!XCMJModel.getDingQueType(data.uid)) {
            //         headcom.setState(2);
            //     }
            // }
        }
    },

    /**恢复所有人的总输赢分数 */
    initTotalScore(userWinTotalScore) {
        if (userWinTotalScore && XCMJModel.scoreState()) {
            let len = Object.keys(userWinTotalScore)
            if (len.length > 0) {
                for (const uid in userWinTotalScore) {
                    if (Object.hasOwnProperty.call(userWinTotalScore, uid)) {
                        const s = userWinTotalScore[uid];
                        let idx = XCMJModel.getUserIndexByUID(uid);
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
        let idx = XCMJModel.getUserIndexByChairID(data.chairID);
        let headcom = this._userList[idx];
        if (headcom) {
            headcom.leave();
        }
        if (data.uid == UserModel.getData('uid')) {
            if (!XCMJModel.getRoomID() ||
                XCMJModel.getRoomID() == data.roomID) {
                this.enterHall();
            }
        }
    },

    /**GPS定位检查 */
    verifyZuobi(roomUserInfo) {
        if (!XCMJModel.getGameRuleByKey("fangzuobi")) return;
        if (!roomUserInfo || roomUserInfo.chairID >= XCMJModel.getChairCount()) return;
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
        let idx = XCMJModel.getUserIndexByChairID(data.chairID);
        let com = this._userList[idx];
        if (com) com.setReady(true);
        if (data.chairID == XCMJModel.getMyChairID()) {
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
        XCMJModel.setCurBureau(data.curBureau);
        this.txt_round.string = `${data.curBureau}/${XCMJModel.getMaxBureau()}局`;
        this.btn_invite.active = false;
        this.btn_copy.active = false;
        this.btn_leave.active = false;
        this.btn_dismiss.active = data.curBureau != 0 && !XCMJModel.getGameRuleByKey("canNotDissmiss");
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
        let idx = XCMJModel.getUserIndexByUID(data.uid);
        let com = this._userList[idx];
        if (com) com.setBanker(true);
    },

    /**游戏状态跳转 */
    onGameStatusUpdate(data) {
        this._gameStatus = data.gameStatus;
        if (this._gameStatus == ApiXcmj.gameStatus.NONE ||
            this._gameStatus == ApiXcmj.gameStatus.DICES) {
            this.onLastTilesCountUpdate(0);
        }
        this.com_clock.setTick(data.tick);
        this.com_clock.hideDice();
        this.hideReadyIcon();
        this.btn_ready.active = false
        this.btnBackHall.active = false
        this.readyTick.sync(0);
        this._comHuanpai.onHuanPaiStatus(data)
        switch (this._gameStatus) {
            case ApiXcmj.gameStatus.NONE:
                XCMJModel.reset();
                this.resetTable();
                break;
            case ApiXcmj.gameStatus.PLAYING:
                this._handTileMgrList[0].setAllTilesDown();
                this._comHuanpai.reset()
                break;
            case ApiXcmj.gameStatus.HUANSANZHANG:
                // console.log("开始换三张")
                this._userList.forEach(c => {
                    c.setState(1)
                });
                break;
            default:
                break;
        }
    },

    /**发牌 */
    onSendTiles(data, isAni) {
        if (!data.handCards) return;
        let lastOpt = XCMJModel.getLastOperate();
        let isTest = UserModel.getData('isTest');
        let handCards = data.handCards;
        for (const uid in handCards) {
            let user = XCMJModel.getUserByUID(uid);
            if (!user) continue;
            let idx = XCMJModel.getUserIndexByUID(uid);
            let hcom = this._handTileMgrList[idx];
            if (!hcom) continue;
            if (!isAni) XCMJModel.delZimoCard(uid);
            let tiles = XCMJModel.getHandCards(uid, false)
            let drawTile = !!lastOpt && lastOpt.uid == uid && lastOpt.operate == ApiXcmj.operateType.GET ? lastOpt.card : null;
            if (drawTile != null) {
                tiles.splice(tiles.indexOf(drawTile), 1)
                hcom.setDrawTile(drawTile)
            }
            if (idx == 0 || !isTest) {
                hcom.updateStandTiles(tiles, null, isAni);
            } else {
                hcom.updateLieTiles(tiles, null);
            }
        }
    },

    /**通知用户操作 */
    onGameTurn(data) {
        this.setTilesGary(-1);
        /**更新时间和位置 */
        this.com_clock.setDir(XCMJModel.getUserIndexByUID(data.uid));
        this.com_clock.setTick(data.tick);
        let isTest = UserModel.getData('isTest');

        let idx = XCMJModel.getUserIndexByUID(data.uid);
        if (idx == 0) { //被操作人是自己
            this._handTileMgrList[0].setBaiPai() //重置摆牌状态
        }

        let isMoPai = false
        if (data.operateArray && (data.operateArray.indexOf(ApiXcmj.operateType.QI) != -1 ||
            data.operateArray.indexOf(ApiXcmj.operateType.GET) != -1 ||
            data.operateArray.indexOf(ApiXcmj.operateType.HU_ZHI) != -1)) {
            //通知出牌
            isMoPai = data.operateArray.indexOf(ApiXcmj.operateType.GET) != -1 || data.card != null;
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
                        bundle: Enums.bundleType.XCMJ
                    });
                    if (idx == 0 && data.operateArray.indexOf(ApiXcmj.operateType.QI) != -1) {
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
        let turn = Utils.deepCopy(data)
        if (turn.operateArray && turn.operateArray.length > 0 &&
            !turn.operateArray.includes(ApiXcmj.operateType.GET)) {
            this.com_opt.onGameTurn(turn);
            if (!isMoPai && idx != 0 && !turn.operateArray.includes(ApiXcmj.operateType.QI)) {
                this._handTileMgrList[0].setBaiPai() //重置摆牌状态
            }
        } else {
            this.com_opt.onClearTurn();
        }
        this.checkTingPai();
    },

    /**摆牌完成 */
    onBaiPaiEnd(data, isReconnect = false) {
        let idx = XCMJModel.getUserIndexByUID(data.uid)
        let hcom = this._handTileMgrList[idx]
        if (hcom) {
            hcom.onBaiPaiEnd(data.cardList)
        }
        if (idx == 0) {
            this.checkTingPai()
            this.com_opt.onBaiPaiEnd()
            if (!isReconnect) {
                /**刷新自己的手牌 */
                let handCards = XCMJModel.getHandCards(XCMJModel.getMyUID(), false)
                this._handTileMgrList[0].updateStandTiles(handCards)
            }
        } else {
            let isTest = UserModel.getData('isTest');
            let handCards = XCMJModel.getHandCards(data.uid, false)
            let com = this._handTileMgrList[idx]
            if (com && !isReconnect) {
                if (isTest) {
                    com.updateLieTiles(handCards)
                } else {
                    com.updateStandTiles(handCards)
                }
            }
        }

        let user = XCMJModel.getUserByUID(data.uid)
        let sex = 'nv';
        if (user) {
            sex = (user.userInfo.sex == 0) ? 'nan' : 'nv';
        }
        AssetsManager.playEffect({
            path: `res/audio/${sex}/baipai`,
            bundle: Enums.bundleType.XCMJ
        });
    },

    /**检查 听牌 */
    checkTingPai() {
        let operateUid = XCMJModel.getCurOptUID();
        let myUid = XCMJModel.getMyUID();
        let idx = XCMJModel.getUserIndexByUID(myUid);
        let hcom = this._handTileMgrList[idx];
        let handCards = XCMJModel.getHandCards(myUid);
        let winHandChecks = handCards.slice();
        let tingHandChecks = handCards.slice();
        let selfBpList = XCMJModel.getBaiPaiInfo(XCMJModel.getMyUID())
        this.com_opt.checkBaiPai() //检测是否可以摆牌
        if (selfBpList && selfBpList.length > 0) { //如果自己已经摆牌
            this.btn_ting.active = true //必定听牌
            let winTingFilter = XCMJModel.tingFilter(null, winHandChecks);
            let canWinList = XCMJLogic.getTingList(winTingFilter.cards, winTingFilter.ghostCardsCount);
            let huList = XCMJLogic.getBaiPaiHuCards(winTingFilter.cards, selfBpList)
            for (let i = 0; i < canWinList.length; i++) {
                const info = canWinList[i];
                /**删掉不能听的牌 */
                if (!huList.includes(info.cardID)) {
                    canWinList.splice(i, 1)
                    i--
                }
            }
            this._canWinList = canWinList;
        } else {
            if (operateUid != myUid) {
                /**不是自己操作 去掉打听标记 显示听牌按钮*/
                if (hcom) hcom.setTingIcons();
                let winTingFilter = XCMJModel.tingFilter(null, winHandChecks);
                let canWinList = XCMJLogic.getTingList(winTingFilter.cards, winTingFilter.ghostCardsCount);
                this.btn_ting.active = canWinList.length > 0;
                this._canWinList = canWinList;
                //let ghostCard = XCMJModel.getGhostCard();
                // if (canWinList.length > 0 && ghostCard > 0) {
                //     let ghostCheck = canWinList.find((card) => {
                //         return card.cardID == ghostCard;
                //     });
                //     if (!ghostCheck) {
                //         this._canWinList.push({
                //             cardID: ghostCard,
                //             rate: 1
                //         })
                //     }
                // }
            } else if (operateUid == myUid) {
                let tingCards = [];
                this._tingList = [];
                //判断是否需要删除手牌
                let repeatFilter = Array.from(new Set(tingHandChecks));
                for (const cardId of repeatFilter) {
                    let copyTingHandCards = tingHandChecks.slice();
                    let tingFilter = XCMJModel.tingFilter(cardId, copyTingHandCards);
                    let canTingList = XCMJLogic.getTingList(tingFilter.cards, tingFilter.ghostCardsCount);
                    if (!canTingList || canTingList.length == 0) continue;
                    tingCards.push(cardId);
                }
                this._tingList = Array.from(new Set(tingCards));
                if (this._tingList.length > 0) {
                    if (hcom) hcom.setTingIcons(this._tingList);
                }
            }
        }
    },

    showTingLight() {
        let tiles = XCMJModel.getHandCards(XCMJModel.getMyUID())
        if (tiles.length >= 14) {
            return
        }
        let winTingFilter = XCMJModel.tingFilter(null, tiles.slice());
        let canWinList = XCMJLogic.getTingList(winTingFilter.cards, winTingFilter.ghostCardsCount);
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
        let idx = XCMJModel.getUserIndexByUID(data.uid);
        if (typeof (idx) == "number") {
            let com = this.genAniNode(this._operActNodeList[idx])
            com && com.showHuIndex(data.operate, data.plusInfo.huSequence, data.chairID, isAni)
        }
    },

    /**用户操作广播 */
    onUserOpt(data) {
        let isTest = UserModel.getData("isTest");
        this.setTilesGary(-1);
        this.com_opt.onClearTurn();
        if (data.uid == XCMJModel.getMyUID()) {
            this.com_ting.node.active = false;
            this._handTileMgrList[0].setTingIcons();
        }
        let idx = XCMJModel.getUserIndexByUID(data.uid);
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
        if (data.operate == ApiXcmj.operateType.QI) {
            let moOpt = XCMJModel.getQiByMo(data);
            if (!!moOpt && moOpt.card != data.card) {
                drawTile = moOpt.card;
            }
        }
        /**更新手牌 */
        let hcom = this._handTileMgrList[idx];
        let handCards = XCMJModel.getHandCards(data.uid, false);
        if (!hcom) return;
        if (idx != 0 && !!isTest) {
            hcom.updateLieTiles(handCards);
        } else {
            drawTile = idx == 0 ? drawTile : null;
            hcom.updateStandTiles(handCards, drawTile);
        }
        let optPengGang = () => {
            let pengGangArray = XCMJModel.getPengGangArrayByUID(data.uid);
            let optCom = this._optTileMgrList[idx];
            if (optCom) optCom.updateOptTiles(pengGangArray);
            let lastOut = XCMJModel.getLastOutCardRecord();
            if (!!lastOut.isDel) {
                let localIndex = XCMJModel.getUserIndexByUID(lastOut.opt.uid);
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
            let lastOut = XCMJModel.getLastOutCardRecord();
            if (!!lastOut.isDel) {
                let localIndex = XCMJModel.getUserIndexByUID(lastOut.opt.uid);
                this._disTileMgrList[localIndex].afterOptUpdateTiles(lastOut.opt.card);
                this.updatePointer();
            }
        }

        let showAni = (type) => {
            let audioType = type;
            if (audioType < typeNameList.length) {
                AssetsManager.playEffect({
                    path: `res/audio/${sex}/${typeNameList[audioType]}`,
                    bundle: Enums.bundleType.XCMJ
                });
            }
            /**展示动画 */
            let com = this.genAniNode(this._operActNodeList[idx])
            com.showOpt(type);
            /**展示刮风和下雨 */
            if (type == 2) {
                let t = 5
                if (data.operate === ApiXcmj.operateType.GANG_ZHI) {
                    t = 7 //下雨
                }
                let fcom = this.genAniNode(this.node)
                fcom.showOpt(t)
            }
            if (type >= 3) {
                this.showHuIdx(data, true);
            }
        }

        switch (data.operate) {
            case ApiXcmj.operateType.QI: //出牌
                AssetsManager.playEffect({
                    path: `res/audio/${sex}/` + data.card,
                    bundle: Enums.bundleType.XCMJ
                });
                AssetsManager.playEffect({
                    path: 'res/audio/main/push',
                    bundle: Enums.bundleType.XCMJ
                });
                if (idx == 0) {
                    this._handTileMgrList[0].setTouch(false)
                }
                /**更新桌子上的牌 */
                let out = XCMJModel.getOutTilesByUID(data.uid)
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
            case ApiXcmj.operateType.CHI: //吃牌
                showAni(0)
                optPengGang()
                break;
            case ApiXcmj.operateType.PENG: //碰牌
                showAni(1)
                optPengGang()
                break;
            case ApiXcmj.operateType.GANG_BU: //补杠
                showAni(2)
                optPengGang()
                break;
            case ApiXcmj.operateType.GANG_CHI: //吃杠
                showAni(2)
                optPengGang()
                break;
            case ApiXcmj.operateType.GANG_ZHI: //暗杠
                showAni(2)
                optPengGang();
                break;
            case ApiXcmj.operateType.HU_CHI: //接炮
                showAni(3);
                optHu();
                break;
            case ApiXcmj.operateType.HU_ZHI: //自摸
                showAni(4)
                optHu();
                break;
            case ApiXcmj.operateType.HU_QIANG: //抢杠
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
                let index = XCMJModel.getUserIndexByChairID(i)
                this.showOptScore(score, index)
            }
        }
    },

    onSmall(data) {
        /**隐藏操作按钮 */
        this.com_opt.node.active = false
        this.deleteMoveNode();
        let result = JSON.parse(JSON.stringify(data.result));
        let isTest = UserModel.getData("isTest");
        let myUid = XCMJModel.getMyUID();
        if (!!result) {
            for (const user of result) {
                if (!user || user.uid == myUid) continue; //处理没有调试权限时其他人摊牌
                if (!user.userCards || !user.userCards[user.uid]) continue;
                let userCards = user.userCards[user.uid];
                let idx = XCMJModel.getUserIndexByUID(user.uid);
                if (!this._handTileMgrList[idx]) continue;
                if (user.winScores > 0) {
                    let huFilter = [ApiXcmj.operateType.HU_ZHI, ApiXcmj.operateType.YOU_JIN, ApiXcmj.operateType.SAN_JIN];
                    user.huCards = user.huCards || [];
                    if (huFilter.indexOf(user.huType) != -1) {
                        //赢家删除胡牌
                        let huCardIndex = userCards.indexOf(user.huCards);
                        if (huCardIndex >= 0) {
                            userCards.splice(huCardIndex, 1);
                        }
                    }
                    userCards = XCMJModel.sortTiles(user.uid, userCards);
                    this._handTileMgrList[idx].updateLieTiles(userCards);
                    this._handTileMgrList[idx].setHuTile(user.huCards);
                } else {
                    this._handTileMgrList[idx].updateLieTiles(userCards);
                }
            }
            AssetsManager.playEffect({
                path: 'res/audio/main/push',
                bundle: Enums.bundleType.XCMJ
            });
        }
        data.enterHall = this.enterHall.bind(this);
        data.mainComp = this;
        data.isBureauFull = (XCMJModel.getCurBureau() == XCMJModel.getMaxBureau());
        data.path = "res/prefab/XCMJResultDialog";
        data.isResult = true;
        data.bundle = Enums.bundleType.XCMJ;
        MessageCallback.emitMessage('RemoveGameResult');
        if (XCMJModel.getGameRuleByKey("zhaNiao")) {
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
            let acom = aniNode.getComponent("XCMJOperAct")
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
        this.btn_ting.active = false;
        this.com_ting.node.active = false;
        this.com_clock.reset();
        this.updatePointer();
        this.setTilesGary(-1);

        this.onLastTilesCountUpdate(0);
        this._canWinList = [];
        this.com_opt.reset()
    },

    /**手牌点击，牌被抬起来 */
    onTileUp(tileCom) {
        /**打听显示 */
        let myUid = XCMJModel.getMyUID();
        let handCards = XCMJModel.getHandCards(myUid)
        if (this._tingList.includes(tileCom.flower)) {
            let myTiles = handCards.slice();
            let tingFilter = XCMJModel.tingFilter(tileCom.flower, myTiles);
            let canWinList = XCMJLogic.getTingList(tingFilter.cards, tingFilter.ghostCardsCount);
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

    /**显示摆牌 */
    onShowBaiPai(baiPaiList) {
        if (baiPaiList && baiPaiList.length > 0) {
            this._handTileMgrList[0].setBaiPai(baiPaiList)
        } else {
            this._handTileMgrList[0].setBaiPai()
        }
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
        let fidx = XCMJModel.getUserIndexByChairID(fromChairID)
        let tidx = XCMJModel.getUserIndexByChairID(toChairID)
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
        // this.menuLayList.stopAllActions()
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
                this._onMenuCloseClick();
                // this.menu.active = false;
                break
            case "btn_leave": //离开房间
                this._onMenuCloseClick();
                if (!UserModel.isInRoom()) {
                    this.enterHall();
                    return;
                }
                if (XCMJModel.getCurBureau() == 0) {
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
                    gameType: Enums.bundleType.XCMJ,
                    musicType: Enums.bundleType.MAHJONG,
                });
                break;
            case "btn_review": //回看
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiXcmj.gameReviewNotify());
                break;
            case "btn_msg": //聊天
                if (CCUtil.clickInterval(event.target, 1)) return;
                let params = {
                    gameRule: XCMJModel.getGameRule(),
                    chat: (chat) => {
                        ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
                    }
                }
                AssetsManager.chatDialog(params);
                break;
            case "btn_roomInfo": //规则
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 1)) return;
                let rule = XCMJModel.getGameRule();
                if (!rule) return;
                AssetsManager.tableDialog({
                    gameRule: rule,
                });
                break;
            case "btn_ting": //听牌
                if (this._canWinList.length > 0 && !this.com_ting.node.active) {
                    for (let i = 0; i < this._canWinList.length; i++) {
                        if (!this._canWinList[i]) continue;
                        this._canWinList[i].count = XCMJModel.getRestCardCount(this._canWinList[i].cardID);
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
                    users: XCMJModel.getUsers(),
                    chairCount: XCMJModel.getChairCount(),
                    fangzuobi: XCMJModel.getGameRuleByKey('fangzuobi')
                })
                break;
            case "btn_deposit": //开始托管
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiXcmj.gameTrushNotify(true));
                break;
            case "btn_quxiaotuoguan": //取消托管
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiXcmj.gameTrushNotify(false));
                break;
            case "btn_invite": //邀请
                let gameRule = XCMJModel.getGameRule();
                gameRule = gameRule || {};
                gameRule.roomId = XCMJModel.getRoomID();
                let share = ConfigModel.getRoomRuleShare(gameRule);
                NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
                break;
            case "btn_copy": //复制
                let str = ConfigModel.getRoomShare(Enums.bundleType.XCMJ, XCMJModel.getRoomID());
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
        let idx = XCMJModel.getUserIndexByUID(data.uid)
        let com = this._userList[idx];
        if (!com) return;
        com.gameChat(data)
    },
    // 好友邀请
    onShowInvite() {
        AssetsManager.friendDialog({
            gameRule: XCMJModel.getGameRule(),
        })
    },


    /**消息监听 */
    messageCallbackHandler(route, msg) {
        if (route === 'RoomMessagePush') {
            if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
                this.gameInit(msg.data);
            } else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
                XCMJModel.otherUserJoinRoom(msg.data.roomUserInfo);
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
                msg.data.myChairID = XCMJModel.getMyChairID();
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
                let idx = XCMJModel.getUserIndexByChairID(msg.data.chairID);
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
            if (msg.type === ApiXcmj.GAME_BUREAU_PUSH) {
                this.onGameRoundUpdate(msg.data);
            } else if (msg.type === ApiXcmj.GAME_STATUS_PUSH) { //游戏状态
                XCMJModel.setGameStatus(msg.data.gameStatus);
                this.onGameStatusUpdate(msg.data);
            } else if (msg.type === ApiXcmj.GAME_SEND_CARDS_PUSH) { //发牌
                this.deleteMoveNode();
                this.com_clock.hideDice();
                // XCMJModel.setGhostCard(msg.data.laiZiCards);
                XCMJModel.setHandCards(msg.data.handCards);
                this.onSendTiles(msg.data, true);
            } else if (msg.type === ApiXcmj.GAME_DICES_PUSH) {
                this.com_clock.showDiceAni(msg.data.dice1, msg.data.dice2);
            } else if (msg.type === ApiXcmj.GAME_USER_HUAN_PAI_SUGGEST_PUSH) { //换牌推荐
                this._comHuanpai.onUsrHuanPaiSuggest(msg.data)
                if (msg.data.uid === XCMJModel.myUid) {
                    this._handTileMgrList[0].setHuanPai(msg.data.cardList)
                }
            } else if (msg.type === ApiXcmj.GAME_HUAN_PAI_PUSH) { //个人选择完成
                // console.log("个人换牌完成", msg.data)
                if (!msg.data.cardList || !Array.isArray(msg.data.cardList)) {
                    return
                }
                XCMJModel.onHuanPaiChoose(msg.data)
                this._comHuanpai.onHuanPaiChoose(msg.data)
                let idx = XCMJModel.getUserIndexByUID(msg.data.uid)
                let hcom = this._handTileMgrList[idx]
                if (hcom) {
                    hcom.onHuanPaiChoose(msg.data)
                    let isTest = UserModel.getData('isTest');
                    if (idx != 0 && isTest) {
                        let handCards = XCMJModel.getHandCards(msg.data.uid)
                        hcom.updateLieTiles(handCards)
                    }
                }
                let ucom = this._userList[idx]
                if (ucom) ucom.setState()
            } else if (msg.type === ApiXcmj.GAME_USER_HUAN_PAI_END_PUSH) { //换牌完成
                // console.log("换牌阶段完成", msg.data)
                XCMJModel.onHuanPaiEnd(msg.data)
                this._comHuanpai.onHuanPaiEnd(msg.data)
                let idx = XCMJModel.getUserIndexByUID(msg.data.uid)
                let hcom = this._handTileMgrList[idx]
                if (hcom) {
                    let isTest = UserModel.getData('isTest');
                    hcom.onHuanPaiEnd(msg.data, isTest)
                }
            } else if (msg.type === ApiXcmj.GAME_TURN_OPERATE_PUSH) { //用户操作广播
                this.deleteMoveNode();
                XCMJModel.onUserOpt(msg.data);
                this.onUserOpt(msg.data);
                this.checkTingPai()
                this.com_opt.showBtnBai()
            } else if (msg.type === ApiXcmj.GAME_TURN_PUSH) { //通知用户操作
                // console.log("通知用户操作", msg.data)
                this.deleteMoveNode();
                XCMJModel.onGameTurn(msg.data);
                this.onGameTurn(msg.data);
                this.com_opt.showBtnBai()
            } else if (msg.type === ApiXcmj.GAME_USER_SHAI_PAI_PUSH) { //用户摆牌完成
                // console.log("用户摆牌完成", msg.data)
                XCMJModel.setBaiPaiInfo(msg.data)
                this.onBaiPaiEnd(msg.data);
                this.com_opt.showBtnBai()
            } else if (msg.type === ApiXcmj.GAME_ALL_HU_CARDS_PUSH) { //更新不能出的牌
                // console.log("更新不能出的牌==", msg.data)
                XCMJModel.setSelfAllHuCards(msg.data)
                let isMyTurn = XCMJModel.isTurn(XCMJModel.getMyUID())
                this._handTileMgrList[0].setTouch(isMyTurn)
            } else if (msg.type === ApiXcmj.GAME_BANKER_PUSH) { //庄家位置更新
                this.onBankerUpdate(msg.data);
            } else if (msg.type === ApiXcmj.GAME_REST_CARDS_COUNT_PUSH) { //剩余牌数量更新
                this.onLastTilesCountUpdate(msg.data.restCardsCount);
            } else if (msg.type === ApiXcmj.GAME_END_PUSH) {
                // console.log("游戏结束《《《《《《《《《", msg);
                UserModel.setData('roomID', '');
                let date = Utils.getDateFormat();
                if (msg.data.result.length > 0) {
                    this.showMJAllResultFunc = () => {
                        this.showMJAllResultFunc = null;
                        msg.data.mainComp = this;
                        msg.data.isUnionCreate = XCMJModel.isUnionCreate();
                        msg.data.enterHall = this.enterHall.bind(this);
                        msg.data.roomDismissReason = msg.data.reason;
                        msg.data.path = 'res/prefab/XCMJAllResult';
                        msg.data.bundle = Enums.bundleType.XCMJ;
                        msg.data.date = date.yyyymmddhhmmss;
                        msg.data.roomID = XCMJModel.getRoomID();
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
            } else if (msg.type === ApiXcmj.GAME_REVIEW_PUSH) {
                // console.log("查看回放==", msg.data.reviewRecord, msg.data.reviewRecord.length)
                let reviewRecord = msg.data.reviewRecord;
                if (reviewRecord && reviewRecord.length > 0) {
                    AssetsManager.createDialog({
                        bundle: Enums.bundleType.XCMJ,
                        path: "res/prefab/XCMJResultDialog",
                        reviewRecord: reviewRecord,
                    });
                } else {
                    AssetsManager.tipDialog('暂无回放没有数据');
                }
            } else if (msg.type === ApiXcmj.GAME_RESULT_PUSH) { //小结算
                this.onSmall(msg.data);
            } else if (msg.type === ApiXcmj.GAME_TRUST_PUSH) { //开始托管
                if (XCMJModel.myUid == msg.data.uid) {
                    this.tuoguan.active = msg.data.trust
                }
            } else if (msg.type === ApiXcmj.GAME_GANG_SCORE_PUSH) { //杠分
                let list = {
                    [msg.data.uid]: msg.data.detail.score
                }
                for (let i = 0; i < msg.data.detail.loseUid.length; i++) {
                    list[msg.data.detail.loseUid[i]] = msg.data.detail.score * -1
                }
                for (const uid in list) {
                    if (Object.hasOwnProperty.call(list, uid)) {
                        const score = list[uid];
                        let index = XCMJModel.getUserIndexByUID(uid)
                        this.showOptScore(score, index)
                    }
                }
            } else if (msg.type === ApiXcmj.GAME_QIANG_GANG_DELETE_PUSH) { //抢杠胡之后删除手牌
                // console.log("抢杠胡之后删除手牌==", msg.data)
                XCMJModel.qiangGangHuDel(msg.data)
                let h = XCMJModel.getHandCards(msg.data.uid, false)
                let idx = XCMJModel.getUserIndexByUID(msg.data.uid)
                let hcom = this._handTileMgrList[idx]
                if (hcom) hcom.updateStandTiles(h)
            }
        } else if (route === 'ReconnectSuccess') {
            this.getRoomSceneInfo();
        } else if (route === 'SelfEntryRoomPush') {
            if (msg.gameType != XCMJModel.getBundleType()) {
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