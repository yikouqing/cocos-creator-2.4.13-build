const ApiQzmjTS = require('./ApiQzmjTS');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const MessageCallback = require('../../../src/utils/MessageCallback');
const UserModel = require('../../../src/model/UserModel');
const Codes = require('../../../src/const/Codes');
const ConfigModel = require('../../../src/model/ConfigModel');
const NativeUtil = require('../../../src/utils/NativeUtil');
const QZMJTSModel = require('./QZMJTSModel');
const QZMJTSLogic = require('./QZMJTSLogic');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const SubManager = require('../../../src/utils/SubManager');
const Events = require('../../../src/const/Events');

cc.Class({
    extends: cc.Component,

    properties: {
        com_dingQue: require("QZMJTSDingQue"),
        com_opt: require("QZMJTSOperate"),
        com_clock: require("QZMJTSClock"),
        com_ting: require("QZMJTSTingTips"),
        txt_round: cc.Label,
        txt_roomId: cc.Label,
        txt_gameName: cc.Label,
        txt_time: cc.Label,
        txt_last: cc.Label,
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
        huanpaiNode: cc.Node,
        pointer: cc.Node,
        tuoguan: cc.Node,
        btn_deposit: cc.Node,
        operActPfb: cc.Prefab,
        ghostCard: cc.Node,
        effectNode: cc.Node,
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
        //花牌脚本列表
        _huaTilesMgrList: [],
        /**打出牌脚本列表 */
        _disTileMgrList: [],
        /**动画节点 */
        _operActNodeList: [],
        /**游戏状态 */
        _gameStatus: 0,
        /**换牌脚本 */
        _comHuanpai: null,
        /**听牌列表 */
        _canWinList: [],
        /**打听列表 */
        _tingList: [],
        /**已经胡牌的列表 */
        _huPai: null,
        _ghostCard: null,
        _ghostCardCPos: null,
        _youJinEffect: null,
    },

    onLoad() {
        AssetsManager.init(this.node);
        this._huPai = {};
        this._comHuanpai = this.huanpaiNode.getComponent("QZMJTSHuanPai")
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
        this._ghostCard = this.ghostCard.addComponent('QZMJTSSingleTile');
        this._ghostCardCPos = this.ghostCard.getPosition();
        if (!!this._ghostCard) {
            this._ghostCard.init();
            this._ghostCard.setNodeShow(false);
        }
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
        ConfigModel.setData('lastScene', 'qzmj');
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
        let isUnionCreate = QZMJTSModel.isUnionCreate();
        let unionID = !!isUnionCreate ? QZMJTSModel.getRoomCreatorByKey('unionID') : null;
        SubManager.exitBundle(unionID);
    },

    /**初始化和断线重连 */
    gameInit(data) {
        MessageCallback.emitMessage('RemoveGameResult');
        this.unscheduleAllCallbacks();
        this.resetTable();
        QZMJTSModel.init(data);
        let isTest = UserModel.getData("isTest");
        this._gameStatus = data.gameData.gameStatus;
        let lastOpt = QZMJTSModel.getLastOperate();
        let myUid = QZMJTSModel.getMyUID();
        let users = QZMJTSModel.getUsers();
        let operateUid = data.gameData.operateUid;
        this._huPai = data.gameData.caozuoCard || {};
        this._comHuanpai.gameInit(data.gameData);
        this.com_dingQue.gameInit(data.gameData);
        this.com_clock.gameInit(QZMJTSModel.getChairCount(), QZMJTSModel.getMyChairID())
        if (this._gameStatus == ApiQzmjTS.gameStatus.NONE && QZMJTSModel.getCurBureau() == 0) {
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
        let myUserInfo = {}
        for (let i = 0; i < roomUserInfoArr.length; i++) {
            const user = roomUserInfoArr[i];
            this.userEnterRoom(user);
            if (user.chairID == QZMJTSModel.getMyChairID()) {
                myUserInfo = user
            }
        }
        this.initTotalScore(data.gameData.userWinTotalScore);
        /**按钮显示 */
        let unionID = QZMJTSModel.isUnionCreate() ? QZMJTSModel.getRoomCreatorByKey('unionID') : null;
        let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
        this.btn_invite.active = QZMJTSModel.getCurBureau() == 0 && !!isShowInvite;
        this.btn_copy.active = QZMJTSModel.getCurBureau() == 0 && !!isShowInvite;
        this.btn_location.active = !!QZMJTSModel.getGameRuleByKey('showGps');
        this.btn_ready.active = this._gameStatus === ApiQzmjTS.gameStatus.NONE && data.gameData.userPlayStatus[myUid] == ApiRoom.userStatusEnum.NONE
        this.btn_leave.active = data.gameData.curBureau == 0;
        this.btn_dismiss.active = data.gameData.curBureau != 0 && !QZMJTSModel.getGameRuleByKey("canNotDissmiss");
        let yuyin = QZMJTSModel.getGameRuleByKey('yuyin');
        this.btnYuYin.active = !!yuyin && ConfigModel.getData('voiceSpeaker');
        this.btn_deposit.active = QZMJTSModel.getGameRuleByKey("canTrust");
        this.btnBackHall.active = data.gameData.curBureau == 0 && QZMJTSModel.isUnionCreate();
        if (this.canNotDismissBar) this.canNotDismissBar.active = QZMJTSModel.getGameRuleByKey("canNotDissmiss");

        /**房间号和局数 */
        this.txt_roomId.string = `房号:${data.roomID}`;
        this.txt_round.string = `局数:${data.gameData.curBureau}/${data.gameData.maxBureau}`;
        let gameName = ConfigModel.getBundleConfig(data.gameRule.gameType)
        this.txt_gameName.string = `游戏:${gameName.name}`
        this.onLastTilesCountUpdate(data.gameData.restCardsCount);
        this.showTest();
        if (this._gameStatus > ApiQzmjTS.gameStatus.DICES) {
            //如果是自己的轮次 并且上一次打牌的人不是自己时删除最近一次摸的牌
            if (!!lastOpt &&
                lastOpt.operate == ApiQzmjTS.operateType.GET) {
                let idx = QZMJTSModel.getUserIndexByUID(lastOpt.uid);
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
                let idx = QZMJTSModel.getUserIndexByUID(user.uid);
                /**恢复吃碰杠的牌 */
                let pengGangArray = QZMJTSModel.getPengGangArrayByUID(user.uid);
                if (pengGangArray.length > 0 && !!this._optTileMgrList[idx]) {
                    this._optTileMgrList[idx].updateOptTiles(pengGangArray);
                }
                /**恢复打出的牌 */
                let out = QZMJTSModel.getOutTilesByUID(user.uid);
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
            if (this._gameStatus === ApiQzmjTS.gameStatus.HUANSANZHANG && data.gameData.suggestCard) {
                if (!QZMJTSModel.getIsHuanPai(myUid)) {
                    let sug = data.gameData.suggestCard[myUid];
                    this._handTileMgrList[0].setHuanPai(sug);
                }
            }

            if (this._gameStatus === ApiQzmjTS.gameStatus.PLAYING) {
                /**恢复方向指示 */
                let idx = QZMJTSModel.getUserIndexByUID(operateUid);
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
                        let user = QZMJTSModel.getUserByChairID(i);
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
                            let idx = QZMJTSModel.getUserIndexByChairID(i)
                            let hcom = this._handTileMgrList[idx]
                            if (hcom) hcom.setHuTile(c)
                            // console.log("设置了胡的牌==", idx, c)
                        }
                    }
                }
                this.checkTingPai();
                /**恢复托管标记 */
                let userTrustArray = data.gameData.autoUser || {};
                this.tuoguan.active = !!userTrustArray[myUid];
            } else {
                this.btn_ting.active = false;
            }
        }
        if (this._gameStatus != ApiQzmjTS.gameStatus.NONE) {
            if (!!this._ghostCard) {
                this._ghostCard.setNodeShow(true);
                this.ghostCard.stopAllActions();
                this.ghostCard.scale = 1.3;
                this.ghostCard.setPosition(this._ghostCardCPos);
                this._ghostCard.flower = data.gameData.laiZiCards;
            }
        } else {
            if (!!this._ghostCard) {
                this._ghostCard.setNodeShow(false);
                this.ghostCard.scale = 1.3;
            }
        }
    },

    /**判断人数，初始化头像位置 */
    seatsInit() {
        let chairCount = QZMJTSModel.getChairCount();
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
            this._userList.push(h.getComponent("QZMJTSHead"));
            this._userList[i].initRes();
            let handTile = cc.find("tiles/handTiles" + headPos[i], this.node);
            let optTile = cc.find("tiles/optTiles" + headPos[i], this.node);
            if (!optTile) {
                optTile = cc.find("optTiles" + headPos[i], handTile);
            }
            let disTile = cc.find("tiles/outTiles" + headPos[i], this.node);
            let huaTile = cc.find("tiles/huaTiles" + headPos[i], this.node);
            this._handTileMgrList.push(handTile.getComponent("QZMJTSHandTileMgr"));
            this._handTileMgrList[i].init(headPos[i]);
            this._optTileMgrList.push(optTile.getComponent("QZMJTSOptTileMgr"));
            this._optTileMgrList[i].init(headPos[i]);
            this._disTileMgrList.push(disTile.getComponent("QZMJTSOutTileMgr"));
            this._disTileMgrList[i].init(headPos[i]);
            this._huaTilesMgrList.push(huaTile.getComponent("QZMJTSHuaTileMgr"));
            this._huaTilesMgrList[i].init(headPos[i]);
            let opNode = cc.find("operAct" + headPos[i], this.node);
            this._operActNodeList.push(opNode);
        }
    },

    /**用户进入房间 */
    userEnterRoom(data) {
        let idx = QZMJTSModel.getUserIndexByUID(data.uid);
        let headcom = this._userList[idx]
        if (headcom) {
            headcom.init(data)
            if (this._gameStatus === ApiQzmjTS.gameStatus.HUANSANZHANG) {
                if (!QZMJTSModel.getIsHuanPai(data.uid)) {
                    headcom.setState(1);
                }
            } else if (this._gameStatus === ApiQzmjTS.gameStatus.DINGQUE) {
                if (!QZMJTSModel.getDingQueType(data.uid)) {
                    headcom.setState(2);
                }
            }
            let dtype = QZMJTSModel.getDingQueType(data.chairID)
            headcom.setDingque(dtype);
        }
        if (data.chairID == QZMJTSModel.getMyChairID()) {
            this.verifyZuobi(data);
        }
    },

    /**恢复所有人的总输赢分数 */
    initTotalScore(userWinTotalScore) {
        if (userWinTotalScore && QZMJTSModel.scoreState()) {
            let len = Object.keys(userWinTotalScore)
            if (len.length > 0) {
                for (const uid in userWinTotalScore) {
                    if (Object.hasOwnProperty.call(userWinTotalScore, uid)) {
                        const s = userWinTotalScore[uid];
                        let idx = QZMJTSModel.getUserIndexByUID(uid);
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
        let idx = QZMJTSModel.getUserIndexByChairID(data.chairID);
        let headcom = this._userList[idx];
        if (headcom) {
            headcom.leave();
        }
        if (data.uid == UserModel.getData('uid')) {
            if (!QZMJTSModel.getRoomID() ||
                QZMJTSModel.getRoomID() == data.roomID) {
                this.enterHall();
            }
        }
    },

    /**GPS定位检查 */
    verifyZuobi(roomUserInfo) {
        if (!QZMJTSModel.getGameRuleByKey("fangzuobi")) return;
        if (!roomUserInfo || roomUserInfo.chairID >= QZMJTSModel.getChairCount()) return;
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
        let idx = QZMJTSModel.getUserIndexByChairID(data.chairID);
        let com = this._userList[idx];
        if (com) com.setReady(true);
        if (data.chairID == QZMJTSModel.getMyChairID()) {
            this.btn_ready.active = false;
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
        QZMJTSModel.setCurBureau(data.curBureau);
        this.txt_round.string = `局数:${data.curBureau}/${QZMJTSModel.getMaxBureau()}`;
        this.btn_invite.active = false;
        this.btn_copy.active = false;
        this.btn_leave.active = false;
        this.btn_dismiss.active = data.curBureau != 0 && !QZMJTSModel.getGameRuleByKey("canNotDissmiss");
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
        let idx = QZMJTSModel.getUserIndexByUID(data.uid);
        for (let index = 0; index < this._userList.length; index++) {
            let com = this._userList[index];
            if (!com) continue;
            com.setBanker(idx == index);
        }
    },

    /**游戏状态跳转 */
    onGameStatusUpdate(data) {
        this.btnBackHall.active = false
        this._gameStatus = data.gameStatus;
        if (this._gameStatus != ApiQzmjTS.gameStatus.PLAYING) {
            this.hideYouJinEffect();
        }
        if (this._gameStatus == ApiQzmjTS.gameStatus.NONE ||
            this._gameStatus == ApiQzmjTS.gameStatus.DICES) {
            this.onLastTilesCountUpdate(0);
        }
        this._comHuanpai.onHuanPaiStatus(data);
        this.com_dingQue.onDingQueStatus(data);
        this.com_clock.setTick(data.tick);
        this.com_clock.hideDice();
        this.hideReadyIcon();
        this.btn_ready.active = QZMJTSModel.getCurBureau() == 0 && this._gameStatus == ApiQzmjTS.gameStatus.NONE;

        switch (this._gameStatus) {
            case ApiQzmjTS.gameStatus.NONE:
                QZMJTSModel.reset();
                this.resetTable();
                break;
            case ApiQzmjTS.gameStatus.HUANSANZHANG:
                this._userList.forEach(c => {
                    c.setState(1);
                });
                break;
            case ApiQzmjTS.gameStatus.DINGQUE:
                this._userList.forEach(c => {
                    c.setState(2);
                });
                this._handTileMgrList[0].setAllTilesDown();
                this._comHuanpai.reset();
                break;
            case ApiQzmjTS.gameStatus.PLAYING:
                this._handTileMgrList[0].setAllTilesDown();
                this._comHuanpai.reset();
                break;
            default:
                break;
        }
    },

    /**发牌 */
    onSendTiles(data, isAni) {
        let isTest = UserModel.getData('isTest');
        QZMJTSModel.setGhostCard(data.laiZiCards);
        QZMJTSModel.setHandCards(data.handCards);
        QZMJTSModel.setHuaCards(data.huaCards);
        let lastOpt = QZMJTSModel.getLastOperate();
        if (!!this._ghostCard && !!isAni) {
            this._ghostCard.setNodeShow(true);
            this.ghostCard.stopAllActions();
            this.ghostCard.scale = 0;
            this.ghostCard.setPosition(cc.v2(0, 0));
            this._ghostCard.flower = data.laiZiCards;
            cc.tween(this.ghostCard)
                .to(0.15, {
                    scale: 2
                }, {
                    easing: 'backOut'
                })
                .delay(1)
                .to(0.3, {
                    scale: 1.3,
                    position: cc.v3(this._ghostCardCPos)
                })
                .start();
        }
        if (!data.handCards) return;
        let huaCards = data.huaCards || {};
        let handCards = data.handCards;
        let sex = 'nv';
        let isHua = false;
        for (const uid in handCards) {
            let user = QZMJTSModel.getUserByUID(uid);
            if (!user) continue;
            handCards[uid] = handCards[uid] || [];
            let tiles = handCards[uid].slice();
            tiles = QZMJTSModel.sortTiles(uid, tiles);
            let idx = QZMJTSModel.getUserIndexByUID(uid);
            let hcom = this._handTileMgrList[idx];
            if (!hcom) continue;
            let drawTile = !!lastOpt && lastOpt.uid == uid && lastOpt.operate == ApiQzmjTS.operateType.GET ? lastOpt.card : null;
            let isDraw = !!lastOpt && lastOpt.uid == uid && lastOpt.operate == ApiQzmjTS.operateType.GET;
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
            if (!this._huaTilesMgrList[idx]) continue;
            this._huaTilesMgrList[idx].huaCardsSync(huaCards[uid]);
            if (!huaCards[uid] || huaCards[uid].length == 0) continue;
            isHua = true;
            if (!this._operActNodeList[idx] || !isAni) continue;
            let comp = this.genAniNode(this._operActNodeList[idx])
            if (!comp) continue;
            comp.showOpt(ApiQzmjTS.operateType.BU_HUA);
            let userComp = this._userList[idx];
            if (!userComp) continue;
            let userData = userComp.getUserData();
            if (!userData) continue;
            sex = (userData.userInfo && userData.userInfo.sex == 0) ? 'nan' : 'nv';
        }
        if (!!isHua && !!isAni) {
            AssetsManager.playEffect({
                path: `res/audio/${sex}/buhua`,
                bundle: Enums.bundleType.QZMJTS
            });
        }
    },

    /**补花 */
    onBuHua(data) {
        // console.log('补花消息', data);
        QZMJTSModel.huaCardsSync(data.uid, data.huaCards);
        let idx = QZMJTSModel.getUserIndexByUID(data.uid);
        if (!!this._huaTilesMgrList[idx]) {
            this._huaTilesMgrList[idx].huaCardsSync(data.huaCards);
        }
        if (!this._operActNodeList[idx]) return;
        let comp = this.genAniNode(this._operActNodeList[idx])
        comp.node.scale = 0.8
        if (!comp) return;
        comp.showOpt(ApiQzmjTS.operateType.BU_HUA);
        let userComp = this._userList[idx];
        if (!userComp) return;
        let user = userComp.getUserData();
        if (!user) return;
        let sex = (user.userInfo && user.userInfo.sex == 0) ? 'nan' : 'nv';
        AssetsManager.playEffect({
            path: `res/audio/${sex}/buhua`,
            bundle: Enums.bundleType.QZMJTS
        });
    },

    /**通知用户操作 */
    onGameTurn(data) {
        QZMJTSModel.onGameTurn(data);
        this.setTilesGary(-1);
        this.com_clock.setDir(QZMJTSModel.getUserIndexByUID(data.uid));
        this.com_clock.setTick(data.tick);
        let isTest = UserModel.getData('isTest');
        /**更新时间和位置 */
        let idx = QZMJTSModel.getUserIndexByUID(data.uid);
        if (data.operateArray && (data.operateArray.indexOf(ApiQzmjTS.operateType.QI) != -1 ||
            data.operateArray.indexOf(ApiQzmjTS.operateType.GET) != -1)) {
            //通知出牌
            let isMoPai = data.operateArray.indexOf(ApiQzmjTS.operateType.GET) != -1 || data.card != null;
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
                        bundle: Enums.bundleType.QZMJTS
                    });
                    if (idx == 0 && data.operateArray.indexOf(ApiQzmjTS.operateType.QI) != -1) {
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
        let gameStatus = QZMJTSModel.getGameStatus();
        let operateUid = QZMJTSModel.getCurOptUID();
        let myUid = QZMJTSModel.getMyUID();
        let idx = QZMJTSModel.getUserIndexByUID(myUid);
        let hcom = this._handTileMgrList[idx];
        let handCards = QZMJTSModel.getHandCards(myUid);
        let winHandChecks = handCards.slice();
        let tingHandChecks = handCards.slice();
        if (operateUid != myUid) {
            /**不是自己操作 去掉打听标记 显示听牌按钮*/
            if (hcom) hcom.setTingIcons();
            let winTingFilter = QZMJTSModel.tingFilter(null, winHandChecks);
            let canWinList = QZMJTSLogic.getTingList(winTingFilter.cards, winTingFilter.ghostCardsCount);
            this.btn_ting.active = canWinList.length > 0;
            this._canWinList = canWinList;
            let ghostCard = QZMJTSModel.getGhostCard();
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
                let tingFilter = QZMJTSModel.tingFilter(cardId, copyTingHandCards);
                let canTingList = QZMJTSLogic.getTingList(tingFilter.cards, tingFilter.ghostCardsCount);
                if (!canTingList || canTingList.length == 0) continue;
                tingCards.push(cardId);
            }
            this._tingList = Array.from(new Set(tingCards));
            if (this._tingList.length > 0) {
                if (hcom) hcom.setTingIcons(this._tingList);
            }
        }
        if (this._canWinList.length >= 34 && gameStatus == ApiQzmjTS.gameStatus.PLAYING) {
            if (!!this._youJinEffect && !!cc.isValid(this._youJinEffect)) {
                this._youJinEffect.active = true;
            } else {
                AssetsManager.loadAsset({
                    aType: cc.Prefab,
                    path: 'res/prefab/QZMJTSEffectYouJin',
                    bundle: Enums.bundleType.QZMJTS
                }, (item) => {
                    if (!!cc.isValid(this._youJinEffect) || !cc.isValid(this.effectNode)) return;
                    this._youJinEffect = cc.instantiate(item);
                    this._youJinEffect.parent = this.effectNode;
                });
            }
        } else {
            this.hideYouJinEffect();
        }
    },

    showTingLight() {
        let tiles = QZMJTSModel.getHandCards(QZMJTSModel.getMyUID())
        if (tiles.length >= 17) {
            return
        }
        let winTingFilter = QZMJTSModel.tingFilter(null, tiles.slice());
        let canWinList = QZMJTSLogic.getTingList(winTingFilter.cards, winTingFilter.ghostCardsCount);
        if (canWinList && canWinList.length > 0) { //如果听牌，播放听牌光效
            let node = this._handTileMgrList[0].node
            let pos = CCUtil.postionConvert(node, this._operActNodeList[0])
            let com = this.genAniNode(this._operActNodeList[0], null, pos)
            com.node.scale = node.scale
            com.showTingLight()
        }
    },

    hideYouJinEffect() {
        if (!!this._youJinEffect && !!cc.isValid(this._youJinEffect)) {
            this._youJinEffect.active = false;
        }
    },

    /**展示胡牌序列 */
    showHuIdx(data, isAni = false) {

    },

    /**用户操作广播 */
    onUserOpt(data) {
        let isTest = UserModel.getData("isTest");
        QZMJTSModel.onUserOpt(data);
        this.setTilesGary(-1);
        if (data.uid == QZMJTSModel.getMyUID()) {
            this.com_opt.onClearTurn();
            this.com_ting.node.active = false;
            this._handTileMgrList[0].setTingIcons();
        }
        let idx = QZMJTSModel.getUserIndexByUID(data.uid);
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
        if (data.operate == ApiQzmjTS.operateType.QI) {
            let moOpt = QZMJTSModel.getQiByMo(data);
            if (!!moOpt && moOpt.card != data.card) {
                drawTile = moOpt.card;
            }
        }
        /**更新手牌 */
        let hcom = this._handTileMgrList[idx];
        let handCards = QZMJTSModel.getHandCards(data.uid);
        if (!hcom) return;
        if (idx != 0 && !!isTest) {
            hcom.updateLieTiles(handCards);
        } else {
            drawTile = idx == 0 ? drawTile : null;
            hcom.updateStandTiles(handCards, drawTile);
        }
        let optPengGang = () => {
            let pengGangArray = QZMJTSModel.getPengGangArrayByUID(data.uid);
            let optCom = this._optTileMgrList[idx];
            if (optCom) optCom.updateOptTiles(pengGangArray);
            let lastOut = QZMJTSModel.getLastOutCardRecord();
            if (!!lastOut.isDel) {
                let localIndex = QZMJTSModel.getUserIndexByUID(lastOut.opt.uid);
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
            let lastOut = QZMJTSModel.getLastOutCardRecord();
            if (!!lastOut.isDel) {
                let localIndex = QZMJTSModel.getUserIndexByUID(lastOut.opt.uid);
                this._disTileMgrList[localIndex].afterOptUpdateTiles(lastOut.opt.card);
                this.updatePointer();
            }
            this._huPai[data.uid] = data.card;
        }

        let showAni = (type) => {
            let audioType = type;
            if (type == ApiQzmjTS.operateType.YOU_JIN ||
                type == ApiQzmjTS.operateType.SAN_JIN) {
                audioType = 4; //强制转换音效为自摸音效
            }
            if (audioType < typeNameList.length) {
                AssetsManager.playEffect({
                    path: `res/audio/${sex}/${typeNameList[audioType]}`,
                    bundle: Enums.bundleType.QZMJTS
                });
            }
            /**展示动画 */
            let com = this.genAniNode(this._operActNodeList[idx])
            com.showOpt(type);
        }

        switch (data.operate) {
            case ApiQzmjTS.operateType.QI: //出牌
                AssetsManager.playEffect({
                    path: `res/audio/${sex}/` + data.card,
                    bundle: Enums.bundleType.QZMJTS
                });
                AssetsManager.playEffect({
                    path: 'res/audio/main/push',
                    bundle: Enums.bundleType.QZMJTS
                });
                if (idx == 0) {
                    this._handTileMgrList[0].setTouch(false)
                }
                /**更新桌子上的牌 */
                let out = QZMJTSModel.getOutTilesByUID(data.uid)
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
            case ApiQzmjTS.operateType.CHI: //吃牌
                showAni(0)
                optPengGang()
                break;
            case ApiQzmjTS.operateType.PENG: //碰牌
                showAni(1)
                optPengGang()
                break;
            case ApiQzmjTS.operateType.GANG_BU: //补杠
                showAni(2)
                optPengGang()
                break;
            case ApiQzmjTS.operateType.GANG_CHI: //吃杠
                showAni(2)
                optPengGang()
                break;
            case ApiQzmjTS.operateType.GANG_ZHI: //暗杠
                showAni(2)
                optPengGang();
                break;
            case ApiQzmjTS.operateType.HU_CHI: //接炮
                showAni(3);
                optHu();
                break;
            case ApiQzmjTS.operateType.YOU_JIN: //游金
                showAni(ApiQzmjTS.operateType.YOU_JIN);
                optHu();
                break;
            case ApiQzmjTS.operateType.SAN_JIN: //三金倒
                showAni(ApiQzmjTS.operateType.SAN_JIN);
                optHu();
                break;
            case ApiQzmjTS.operateType.HU_ZHI: //自摸
                showAni(4)
                optHu();
                break;
            case ApiQzmjTS.operateType.HU_QIANG: //抢杠
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
                let index = QZMJTSModel.getUserIndexByChairID(i)
                this.showOptScore(score, index)
            }
        }
    },

    onSmall(data) {
        this.deleteMoveNode();
        let result = JSON.parse(JSON.stringify(data.result));
        let isTest = UserModel.getData("isTest");
        let myUid = QZMJTSModel.getMyUID();
        if (!!result) {
            for (const user of result) {
                if (!user || user.uid == myUid) continue; //处理没有调试权限时其他人摊牌
                if (!user.userCards || !user.userCards[user.uid]) continue;
                let userCards = user.userCards[user.uid];
                let idx = QZMJTSModel.getUserIndexByUID(user.uid);
                if (!this._handTileMgrList[idx]) continue;
                if (user.winScores > 0) {
                    let huFilter = [ApiQzmjTS.operateType.HU_ZHI, ApiQzmjTS.operateType.YOU_JIN, ApiQzmjTS.operateType.SAN_JIN];
                    user.huCards = user.huCards || [];
                    if (huFilter.indexOf(user.huType) != -1) {
                        //赢家删除胡牌
                        let huCardIndex = userCards.indexOf(user.huCards);
                        if (huCardIndex >= 0) {
                            userCards.splice(huCardIndex, 1);
                        }
                    }
                    userCards = QZMJTSModel.sortTiles(user.uid, userCards);
                    this._handTileMgrList[idx].updateLieTiles(userCards);
                    this._handTileMgrList[idx].setHuTile(user.huCards);
                } else {
                    this._handTileMgrList[idx].updateLieTiles(userCards);
                }
            }
            AssetsManager.playEffect({
                path: 'res/audio/main/push',
                bundle: Enums.bundleType.QZMJTS
            });
        }
        data.enterHall = this.enterHall.bind(this);
        data.mainComp = this;
        data.isBureauFull = (QZMJTSModel.getCurBureau() == QZMJTSModel.getMaxBureau());
        data.path = "res/prefab/QZMJTSResultDialog";
        data.isResult = true;
        data.bundle = Enums.bundleType.QZMJTS;
        AssetsManager.createDialog(data);
    },

    /**展示操作分数 */
    showOptScore(score, index) {
        if (!score || score == 0) return
        let operActNode = this._operActNodeList[index];
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
            let acom = aniNode.getComponent("QZMJTSOperAct")
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
        if (!!this._ghostCard) {
            this.ghostCard.stopAllActions();
            this.ghostCard.scale = 1.3;
            this._ghostCard.setNodeShow(false);
        }
        this._huaTilesMgrList.forEach(c => {
            c.reset()
        });
        this.onLastTilesCountUpdate(0);
        this._canWinList = [];
    },

    /**定缺完成 */
    onUserDingQue(data) {
        return;
        this.com_dingQue.onUserDingQue(data)
        if (data.chairID == QZMJTSModel.getMyChairID()) {
            this._handTileMgrList[0].updateStandTiles(QZMJTSModel.getHandCards(data.uid))
        }
        /**设置头像上的图标 */
        let idx = QZMJTSModel.getUserIndexByUID(data.uid)
        let com = this._userList[idx]
        if (!com) return;
        com.setDingque(data.type, true)
    },

    /**手牌点击，牌被抬起来 */
    onTileUp(tileCom) {
        /**打听显示 */
        let myUid = QZMJTSModel.getMyUID();
        let handCards = QZMJTSModel.getHandCards(myUid)
        if (this._tingList.includes(tileCom.flower)) {
            let myTiles = handCards.slice();
            let tingFilter = QZMJTSModel.tingFilter(tileCom.flower, myTiles);
            let canWinList = QZMJTSLogic.getTingList(tingFilter.cards, tingFilter.ghostCardsCount);
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
        let fidx = QZMJTSModel.getUserIndexByChairID(fromChairID)
        let tidx = QZMJTSModel.getUserIndexByChairID(toChairID)
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
                if (QZMJTSModel.getCurBureau() == 0) {
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
                    gameType: Enums.bundleType.QZMJTS,
                    musicType: Enums.bundleType.MAHJONG,
                });
                break;
            case "btn_review": //回看
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiQzmjTS.gameReviewNotify());
                break;
            case "btn_msg": //聊天
                if (CCUtil.clickInterval(event.target, 1)) return;
                let params = {
                    gameRule: QZMJTSModel.getGameRule(),
                    chat: (chat) => {
                        ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
                    }
                }
                AssetsManager.chatDialog(params);
                break;
            case "btn_roomInfo": //规则
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 1)) return;
                let rule = QZMJTSModel.getGameRule();
                if (!rule) return;
                AssetsManager.tableDialog({
                    gameRule: rule,
                });
                break;
            case "btn_ting": //听牌
                if (this._canWinList.length > 0 && !this.com_ting.node.active) {
                    for (let i = 0; i < this._canWinList.length; i++) {
                        if (!this._canWinList[i]) continue;
                        this._canWinList[i].count = QZMJTSModel.getRestCardCount(this._canWinList[i].cardID);
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
                    users: QZMJTSModel.getUsers(),
                    chairCount: QZMJTSModel.getChairCount(),
                    fangzuobi: QZMJTSModel.getGameRuleByKey('fangzuobi')
                })
                break;
            case "btn_deposit": //开始托管
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiQzmjTS.gameTrushNotify(true));
                break;
            case "btn_quxiaotuoguan": //取消托管
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiQzmjTS.gameTrushNotify(false));
                break;
            case "btn_invite": //邀请
                let gameRule = QZMJTSModel.getGameRule();
                gameRule = gameRule || {};
                gameRule.roomId = QZMJTSModel.getRoomID();
                let share = ConfigModel.getRoomRuleShare(gameRule);
                NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
                break;
            case "btn_copy": //复制
                let str = ConfigModel.getRoomShare(Enums.bundleType.QZMJTS, QZMJTSModel.getRoomID());
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
        let idx = QZMJTSModel.getUserIndexByUID(data.uid)
        let com = this._userList[idx];
        if (!com) return;
        com.gameChat(data)
    },
    // 好友邀请
    onShowInvite() {
        AssetsManager.friendDialog({
            gameRule: QZMJTSModel.getGameRule(),
        })
    },


    /**消息监听 */
    messageCallbackHandler(route, msg) {
        if (route === 'RoomMessagePush') {
            if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
                this.gameInit(msg.data);
            } else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
                QZMJTSModel.otherUserJoinRoom(msg.data.roomUserInfo);
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
                msg.data.myChairID = QZMJTSModel.getMyChairID();
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
                let idx = QZMJTSModel.getUserIndexByChairID(msg.data.chairID);
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
            if (msg.type === ApiQzmjTS.GAME_BUREAU_PUSH) {
                this.onGameRoundUpdate(msg.data);
            } else if (msg.type === ApiQzmjTS.GAME_STATUS_PUSH) { //游戏状态
                QZMJTSModel.setGameStatus(msg.data.gameStatus);
                this.onGameStatusUpdate(msg.data);
            } else if (msg.type === ApiQzmjTS.GAME_SEND_CARDS_PUSH) { //发牌
                this.deleteMoveNode();
                this.com_clock.hideDice();
                this.onSendTiles(msg.data, true);
            } else if (msg.type === ApiQzmjTS.GAME_DICES_PUSH) {
                this.com_clock.showDiceAni(msg.data.dice1, msg.data.dice2);
            } else if (msg.type === ApiQzmjTS.GAME_USER_HUAN_PAI_SUGGEST) { //换牌推荐
                this._comHuanpai.onUsrHuanPaiSuggest(msg.data);
                if (msg.data.chairID === QZMJTSModel.getMyChairID()) {
                    this._handTileMgrList[0].setHuanPai(msg.data.cardList);
                }
            } else if (msg.type === ApiQzmjTS.GAME_HUAN_PAI_CHOOSE_PUSH) { //个人选择完成
                if (!msg.data.cardList || !Array.isArray(msg.data.cardList)) return;
                QZMJTSModel.onHuanPaiChoose(msg.data);
                this._comHuanpai.onHuanPaiChoose(msg.data);
                let idx = QZMJTSModel.getUserIndexByChairID(msg.data.chairID);
                let hcom = this._handTileMgrList[idx];
                if (hcom) hcom.onHuanPaiChoose(msg.data);
                let ucom = this._userList[idx];
                if (ucom) ucom.setState();
            } else if (msg.type === ApiQzmjTS.GAME_HUAN_PAI_END_PUSH) { //换牌完成
                QZMJTSModel.onHuanPaiEnd(msg.data);
                this._comHuanpai.onHuanPaiEnd(msg.data);
                let idx = QZMJTSModel.getUserIndexByChairID(msg.data.chairID)
                let hcom = this._handTileMgrList[idx];
                if (hcom) hcom.onHuanPaiEnd(msg.data);
            } else if (msg.type === ApiQzmjTS.GAME_USER_DING_QUE_PUSH) { //定缺完成
                QZMJTSModel.setDingQueType(msg.data.chairID, msg.data.type)
                this.onUserDingQue(msg.data);
            } else if (msg.type === ApiQzmjTS.GAME_TURN_OPERATE_PUSH) {
                this.deleteMoveNode();
                this.onUserOpt(msg.data);
            } else if (msg.type === ApiQzmjTS.GAME_TURN_PUSH) {
                this.deleteMoveNode();
                this.onGameTurn(msg.data);
            } else if (msg.type === ApiQzmjTS.GAME_BU_HUA_PUSH) {
                this.onBuHua(msg.data);
            } else if (msg.type === ApiQzmjTS.GAME_BANKER_PUSH) { //庄家位置更新
                this.onBankerUpdate(msg.data);
            } else if (msg.type === ApiQzmjTS.GAME_REST_CARDS_COUNT_PUSH) { //剩余牌数量更新
                this.onLastTilesCountUpdate(msg.data.restCardsCount);
            } else if (msg.type === ApiQzmjTS.GAME_END_PUSH) {
                // console.log("游戏结束《《《《《《《《《", msg);
                UserModel.setData('roomID', '');
                let date = Utils.getDateFormat();
                if (msg.data.result.length > 0) {
                    this.showMJAllResultFunc = () => {
                        this.showMJAllResultFunc = null;
                        msg.data.mainComp = this;
                        msg.data.isUnionCreate = QZMJTSModel.isUnionCreate();
                        msg.data.isBureauFull = QZMJTSModel.getCurBureau() == QZMJTSModel.getMaxBureau();
                        msg.data.enterHall = this.enterHall.bind(this);
                        msg.data.roomDismissReason = msg.data.reason;
                        msg.data.path = 'res/prefab/QZMJTSAllResult';
                        msg.data.bundle = Enums.bundleType.QZMJTS;
                        msg.data.date = date.yyyymmddhhmmss;
                        msg.data.roomID = QZMJTSModel.getRoomID();
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
            } else if (msg.type === ApiQzmjTS.GAME_REVIEW_PUSH) {
                let reviewRecord = msg.data.reviewRecord;
                if (reviewRecord && reviewRecord.length > 0) {
                    AssetsManager.createDialog({
                        bundle: Enums.bundleType.QZMJTS,
                        path: "res/prefab/QZMJTSResultDialog",
                        reviewRecord: reviewRecord,
                    });
                } else {
                    AssetsManager.tipDialog('暂无回放没有数据');
                }
            } else if (msg.type === ApiQzmjTS.GAME_RESULT_PUSH) {
                this.onSmall(msg.data);
            } else if (msg.type === ApiQzmjTS.GAME_XIAYU_PUSH) { //下雨推送
                let idx = QZMJTSModel.getUserIndexByUID(msg.data.uid);
                this.showOptScore(msg.data.score, idx);
            } else if (msg.type === ApiQzmjTS.GAME_TRUST_PUSH) { //开始托管
                if (QZMJTSModel.getMyUID() == msg.data.uid) {
                    this.tuoguan.active = !!msg.data.trust;
                }
            }
        } else if (route === 'ReconnectSuccess') {
            this.getRoomSceneInfo();
        } else if (route === 'SelfEntryRoomPush') {
            if (msg.gameType != QZMJTSModel.getBundleType()) {
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