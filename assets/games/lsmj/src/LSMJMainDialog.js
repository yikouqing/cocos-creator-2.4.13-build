const ApiLsmj = require('./ApiLsmj');
const ApiRoom = require('../../../src/api/ApiRoom');;
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const MessageCallback = require('../../../src/utils/MessageCallback');
const UserModel = require('../../../src/model/UserModel');
const Codes = require('../../../src/const/Codes');
const ConfigModel = require('../../../src/model/ConfigModel');
const NativeUtil = require('../../../src/utils/NativeUtil');
const LSMJModel = require('./LSMJModel');
const LSMJLogic = require('./LSMJLogic');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const SubManager = require('../../../src/utils/SubManager');
const Events = require('../../../src/const/Events');

cc.Class({
    extends: cc.Component,

    properties: {
        com_opt: require("LSMJOperate"),
        com_clock: require("LSMJClock"),
        com_ting: require("LSMJTingTips"),
        readyTick: require('LSMJReadyTick'),
        com_dingQue: require("LSMJDingQue"),

        txt_name: cc.Label,
        txt_round: cc.Label,
        txt_roomId: cc.Label,
        txt_time: cc.Label,
        txt_last: cc.Label,
        btn_location: cc.Node,
        btn_copy: cc.Node,
        btn_invite: cc.Node,
        btn_ready: cc.Node,
        btn_leave: cc.Node,
        btn_dismiss: cc.Node,
        btn_ting: cc.Node,
        btn_menu: cc.Node,
        menuLay: cc.Node,
        menuLayList: cc.Node,
        huanPaiNode: cc.Node,
        pointer: cc.Node,
        tuoguan: cc.Node,
        btn_deposit: cc.Node,
        operActPfb: cc.Prefab,
        effectNode: cc.Node,
        btnBackHall: cc.Node,
        btnYuYin: cc.Node,
        canNotDismissBar: cc.Node,
        huanPaiPfb: cc.Prefab,
        headPfbLeft: cc.Prefab,
        headPfbRight: cc.Prefab,

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
        _com_huanPai: null,

    },

    onLoad() {
        AssetsManager.init(this.node);
        LSMJModel.setReview();
        this.menuLay.active = false;
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
        let huanPai = cc.instantiate(this.huanPaiPfb)
        huanPai.parent = this.huanPaiNode;
        this._com_huanPai = huanPai.getComponent("LSMJHuanPai")
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
        ConfigModel.setData('lastScene', 'gdtdh');
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
        let isUnionCreate = LSMJModel.isUnionCreate();
        let unionID = !!isUnionCreate ? LSMJModel.getRoomCreatorByKey('unionID') : null;
        SubManager.exitBundle(unionID);
    },

    /**初始化和断线重连 */
    gameInit(data) {
        // console.log("------------gameInit==========", data)
        AssetsManager.clearDialog(["LSMJResultDialog"])
        this.unscheduleAllCallbacks();
        this.resetTable();
        LSMJModel.init(data);
        LSMJLogic.initRule(data.gameRule)
        this.com_dingQue.gameInit(data.gameData)
        this._com_huanPai.gameInit(data.gameData);
        let isTest = UserModel.getData("isTest");
        this._gameStatus = data.gameData.gameStatus;
        let lastOpt = LSMJModel.getLastOperate();
        let myUid = LSMJModel.getMyUID();
        let users = LSMJModel.getUsers();
        let operateUid = data.gameData.operateUid;
        this.com_clock.gameInit(LSMJModel.getChairCount(), LSMJModel.getMyChairID())
        if (this._gameStatus == ApiLsmj.gameStatus.NONE && LSMJModel.getCurBureau() == 0) {
            this.com_clock.node.active = false;
        } else {
            this.com_clock.node.active = true;
        }
        this.com_opt.onClearTurn()
        if (data.gameData.userCanOperate) {
            let optData = {
                operateCard: data.gameData.operateCard,
                operateArray: data.gameData.userCanOperate,
            }
            this.com_opt.gameInit(optData);
        }
        this.seatsInit();
        /**初始化用户信息 */
        this._userList.forEach(com => {
            com.leave()
        });
        let roomUserInfoArr = data.roomUserInfoArr;
        for (let i = 0; i < roomUserInfoArr.length; i++) {
            const user = roomUserInfoArr[i];
            this.userEnterRoom(user);
        }
        this.initTotalScore(data.gameData.userWinTotalScore);
        /**按钮显示 */
        let unionID = LSMJModel.isUnionCreate() ? LSMJModel.getRoomCreatorByKey('unionID') : null;
        let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
        this.btn_invite.active = LSMJModel.getCurBureau() == 0 && !!isShowInvite;
        this.btn_copy.active = LSMJModel.getCurBureau() == 0 && !!isShowInvite;
        this.btn_location.active = !!LSMJModel.getGameRuleByKey('showGps');
        this.btn_ready.active = (!LSMJModel.isGameStarted() && data.gameData.userPlayStatus[myUid] == ApiRoom.userStatusEnum.NONE);
        this.btn_leave.active = LSMJModel.getCurBureau() == 0
        this.btn_dismiss.active = LSMJModel.getCurBureau() > 0 && !LSMJModel.getGameRuleByKey("canNotDissmiss");
        this.btnBackHall.active = false //data.gameData.curBureau == 0 && LSMJModel.isUnionCreate();
        let yuyin = LSMJModel.getGameRuleByKey('yuyin');
        this.btnYuYin.active = !!yuyin && ConfigModel.getData('voiceSpeaker');
        let tm = LSMJModel.getGameRuleByKey("trustTm")
        this.btn_deposit.active = tm && tm > 0;
        if (this.btn_ready.active && LSMJModel.getCurBureau() == 0 && LSMJModel.getGameRuleByKey("unReadyKick") > 0) {
            let tick = LSMJModel.getGameRuleByKey("unReadyKick") || 10;
            this.readyTick.sync(tick);
        } else {
            this.readyTick.sync(0);
        }
        if (this.canNotDismissBar) this.canNotDismissBar.active = LSMJModel.getGameRuleByKey("canNotDissmiss");
        /**房间号和局数 */
        this.txt_name.string = `${ConfigModel.getGameName(LSMJModel.getGameType())}`;
        this.txt_roomId.string = `房号:${data.roomID}`;
        this.setRoundShow()
        this.onLastTilesCountUpdate(data.gameData.restCardsCount);
        if (this._gameStatus > ApiLsmj.gameStatus.DICES) {
            //如果是自己的轮次 并且上一次打牌的人不是自己时删除最近一次摸的牌
            if (!!lastOpt &&
                lastOpt.operate == ApiLsmj.operateType.GET) {
                let idx = LSMJModel.getUserIndexByUID(lastOpt.uid);
                let card = lastOpt.card;
                if (!!this._handTileMgrList[idx]) {
                    if (idx == 0 || !isTest) {
                        this._handTileMgrList[idx].setDrawTile(card, false);
                    } else {
                        this._handTileMgrList[idx].setHuTile(card);
                    }
                }
            }
            this.onSendTiles(data.gameData, false, true);
            for (const user of users) {
                let idx = LSMJModel.getUserIndexByUID(user.uid);
                /**恢复吃碰杠的牌 */
                let pengGangArray = LSMJModel.getPengGangArrayByUID(user.uid);
                if (pengGangArray.length > 0 && !!this._optTileMgrList[idx]) {
                    this._optTileMgrList[idx].updateOptTiles(pengGangArray);
                }
                /**恢复打出的牌 */
                let out = LSMJModel.getOutTilesByUID(user.uid);
                if (out.length > 0 && !!this._disTileMgrList[idx]) {
                    let last = this._disTileMgrList[idx].showOutTiles(out);
                    if (data.gameData.lastOperateUid == user.uid &&
                        !!last &&
                        last.flower == data.gameData.operateCard) {
                        this.updatePointer(last.node)
                    }
                }
            }

            if (this._gameStatus === ApiLsmj.gameStatus.PLAYING) {
                /**恢复方向指示 */
                let idx = LSMJModel.getUserIndexByUID(operateUid);
                this.com_clock.setDir(idx);
                this.com_clock.setTick(data.gameData.tick);
                /**设置该谁出牌 */
                if (myUid == operateUid && data.gameData.lastOperateUid != myUid) {
                    this._handTileMgrList[0].setIsMyTurn();
                    if (!data.gameData.operateCard) {
                        this._handTileMgrList[0].setPengChu();
                    }
                }

                /**恢复胡的那张牌 */
                let userHuDonList = LSMJModel.getUserHuDonList();
                userHuDonList = userHuDonList || [];
                userHuDonList.forEach((user) => {
                    let idx = LSMJModel.getUserIndexByUID(user.uid)
                    let hcom = this._handTileMgrList[idx];
                    if (idx == 0 || !!isTest || user.operateType != ApiLsmj.operateType.HU_ZHI) {
                        hcom && hcom.setHuTile(user.card);
                    } else {
                        hcom && hcom.setDrawTile(user.card);
                    }
                });
                this.checkTingPai();
            } else {
                this.btn_ting.active = false;
            }

            /**恢复换三张 */
            if (this._gameStatus === ApiLsmj.gameStatus.HUANPAI && data.gameData.suggestCard) {
                if (!LSMJModel.getIsHuanPai(LSMJModel.getMyChairID())) {
                    let sug = data.gameData.suggestCard[myUid];
                    this._handTileMgrList[0].setHuanPai(sug);
                }
            }
            /**恢复飘标记 */
            let piaoFen = data.gameData.piaoFen || {}
            for (const uid in piaoFen) {
                if (Object.hasOwnProperty.call(piaoFen, uid)) {
                    const isPiao = piaoFen[uid];
                    let idx = LSMJModel.getUserIndexByUID(uid)
                    let com = this._userList[idx]
                    if (com) com.setPiao(isPiao)
                }
            }
            this.showHuIdx()
        }
        /**恢复托管标记 */
        let userTrustArray = data.gameData.autoUser
        if (userTrustArray) {
            this.tuoguan.active = userTrustArray[LSMJModel.myUid]
        }
    },

    /**判断人数，初始化头像位置 */
    seatsInit() {
        if (this._userList.length > 0) {
            return
        }
        let chairCount = LSMJModel.getChairCount();
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

        for (let i = 0; i < headPos.length; i++) {
            let idx = headPos[i]
            let h = cc.find("head" + idx, this.node)
            let headNode = null
            if (idx == 0 || idx == 3) {
                headNode = cc.instantiate(this.headPfbLeft)
            } else {
                headNode = cc.instantiate(this.headPfbRight)
            }
            headNode.parent = h
            this._userList.push(headNode.getComponent("LSMJHead"));
            this._userList[i].initRes();
            let handTile = cc.find("tiles/handTiles" + idx, this.node);
            let optTile = cc.find("tiles/optTiles" + idx, this.node);
            if (!optTile) {
                optTile = cc.find("optTiles" + idx, handTile);
            }
            let disTile = cc.find("tiles/outTiles" + idx, this.node);
            this._handTileMgrList.push(handTile.getComponent("LSMJHandTileMgr"));
            this._handTileMgrList[i].init(idx);
            this._optTileMgrList.push(optTile.getComponent("LSMJOptTileMgr"));
            this._optTileMgrList[i].init(i);
            this._disTileMgrList.push(disTile.getComponent("LSMJOutTileMgr"));
            this._disTileMgrList[i].init(idx);
            let opNode = cc.find("operAct" + idx, this.node);
            this._operActNodeList.push(opNode);
        }
    },

    /**用户进入房间 */
    userEnterRoom(data) {
        let idx = LSMJModel.getUserIndexByUID(data.uid);
        let headcom = this._userList[idx]
        if (headcom) {
            headcom.init(data)
            let dtype = LSMJModel.getDingQueType(data.uid)
            if (this._gameStatus !== ApiLsmj.gameStatus.NONE) {
                headcom.setDingque(dtype)
            }
            if (this._gameStatus === ApiLsmj.gameStatus.DINGQUE) {
                if (dtype === -1) {
                    headcom.setState(2)
                }
            }
            if (this._gameStatus === ApiLsmj.gameStatus.HUANPAI) {
                if (!LSMJModel.getIsHuanPai(data.chairID)) {
                    headcom.setState(1);
                }
            }
        }
    },

    /**恢复所有人的总输赢分数 */
    initTotalScore(userWinTotalScore) {
        if (userWinTotalScore && LSMJModel.scoreState()) {
            let len = Object.keys(userWinTotalScore)
            if (len.length > 0) {
                for (const uid in userWinTotalScore) {
                    if (Object.hasOwnProperty.call(userWinTotalScore, uid)) {
                        const s = userWinTotalScore[uid];
                        let idx = LSMJModel.getUserIndexByUID(uid);
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
        let idx = LSMJModel.getUserIndexByChairID(data.chairID);
        let headcom = this._userList[idx];
        if (headcom) {
            headcom.leave();
        }
        if (data.uid == UserModel.getData('uid')) {
            if (!LSMJModel.getRoomID() ||
                LSMJModel.getRoomID() == data.roomID) {
                this.enterHall();
            }
        }
    },

    /**GPS定位检查 */
    verifyZuobi(roomUserInfo) {
        if (!LSMJModel.getGameRuleByKey("fangzuobi")) return;
        if (!roomUserInfo || roomUserInfo.chairID >= LSMJModel.getChairCount()) return;
        let add1 = null;
        try {
            add1 = JSON.parse(roomUserInfo.userInfo.address);
        } catch (e) { }
        if (!add1) {
            // AssetsManager.popDialog({
            //     content: `玩家${roomUserInfo.userInfo.nickname}定位未知！`,
            //     ok: () => {}
            // });
            return;
        }
        let distanceLimit = parseInt(LSMJModel.getGameRuleByKey('distanceLimit'));
        if (isNaN(distanceLimit) || distanceLimit < 100) {
            distanceLimit = 100;
        }
        distanceLimit /= 1000;
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
            if (!add2) continue;
            if (add2.x == 0 && add2.y == 0) continue;
            let distance = Utils.getDistanceByLocation(add1, add2);
            if (distance < distanceLimit) {
                AssetsManager.popDialog({
                    content: `玩家${roomUserInfo.userInfo.nickname}与玩家${user.userInfo.nickname}距离过近！`,
                    ok: () => { },
                    no: () => { }
                });
                break;
            }
        }
    },

    /**玩家准备 */
    onUserReady(data) {
        let idx = LSMJModel.getUserIndexByChairID(data.chairID);
        let com = this._userList[idx];
        if (com) com.setReady(true);
        if (data.chairID == LSMJModel.getMyChairID()) {
            this.btn_ready.active = false;
            this.readyTick.sync(0);
            AssetsManager.clearDialog(["LSMJResultDialog"])
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
        // MessageCallback.emitMessage('RemoveGameResult');
        AssetsManager.clearDialog(["LSMJResultDialog"])
        LSMJModel.setCurBureau(data.curBureau);
        this.setRoundShow()
        this.btnBackHall.active = false;
        this.btn_invite.active = false;
        this.btn_copy.active = false;
        this.btn_leave.active = false;
        this.btn_dismiss.active = !LSMJModel.getGameRuleByKey("canNotDissmiss");
    },

    /**设置局数和倒数显示 */
    setRoundShow() {
        this.txt_round.string = `${LSMJModel.getCurBureau()}/${LSMJModel.getMaxBureau()}局`;
    },

    /**更新剩余牌数量 */
    onLastTilesCountUpdate(count) {
        if (count > 0) {
            this.txt_last.string = `${count}`;
        } else {
            this.txt_last.string = '';
        }
    },

    /**更新庄家 */
    onBankerUpdate(data) {
        let idx = LSMJModel.getUserIndexByUID(data.uid);
        let com = this._userList[idx];
        if (com) com.setBanker(true);
    },

    /**游戏状态跳转 */
    onGameStatusUpdate(data) {
        this._gameStatus = data.gameStatus;
        if (this._gameStatus == ApiLsmj.gameStatus.NONE ||
            this._gameStatus == ApiLsmj.gameStatus.DICES) {
            this.onLastTilesCountUpdate(0);
        }
        this.com_clock.setTick(data.tick);
        this.com_clock.hideDice();
        this.hideReadyIcon();
        this.btn_ready.active = false
        this.readyTick.sync(0);
        this.deleteQiePaiAni()
        this.com_dingQue.onDingQueStatus(data)
        this._com_huanPai.onHuanPaiStatus(data);
        switch (this._gameStatus) {
            case ApiLsmj.gameStatus.NONE:
                LSMJModel.reset();
                this.resetTable();
                break;
            case ApiLsmj.gameStatus.PLAYING:
                this._handTileMgrList[0].setAllTilesDown();
                this._com_huanPai.reset();
                break;
            case ApiLsmj.gameStatus.DINGQUE:
                this._com_huanPai.reset();
                this._userList.forEach(c => {
                    c.setState(2)
                });
                this._handTileMgrList[0].setAllTilesDown()
                break;
            case ApiLsmj.gameStatus.HUANPAI:
                this._userList.forEach(c => {
                    c.setState(1)
                });
                break;
            default:
                this._userList.forEach(c => {
                    c.setState()
                });
                break;
        }
    },

    /**换牌推荐 */
    onHuanPaiSuggest(data) {
        this._com_huanPai.onUsrHuanPaiSuggest(data)
        if (data.uid === LSMJModel.getMyUID()) {
            this._handTileMgrList[0].setHuanPai(data.cardList)
            this.com_clock.setTick(data.totalTick)
        }
    },

    /**发牌 */
    onSendTiles(data, isAni, isInit) {
        let isTest = UserModel.getData('isTest');
        LSMJModel.setLaiZiCards(data.laiZiCards);
        LSMJModel.setHandCards(data.handCards);
        LSMJModel.setFanCard(data.fanCard)
        let lastOpt = LSMJModel.getLastOperate();
        if (!data.handCards) return;
        let handCards = data.handCards;
        for (const uid in handCards) {
            let user = LSMJModel.getUserByUID(uid);
            if (!user) continue;
            let tiles = LSMJModel.getHandCards(uid)
            let idx = LSMJModel.getUserIndexByUID(uid);
            let hcom = this._handTileMgrList[idx];
            if (!hcom) continue;
            let drawTile = !!lastOpt && lastOpt.uid == uid && lastOpt.operate == ApiLsmj.operateType.GET ? lastOpt.card : null;
            let isDraw = !!lastOpt && lastOpt.uid == uid && lastOpt.operate == ApiLsmj.operateType.GET;
            if (!!isDraw) {
                if (idx == 0 || !!isTest) {
                    let drawTileIndex = tiles.indexOf(drawTile);
                    if (drawTileIndex >= 0) tiles.splice(drawTileIndex, 1);
                } else {
                    tiles.splice(0, 1);
                }
            }
            if (isInit) {
                let huList = LSMJModel.getUserHuDonList()
                let huOpt = huList.find(opt => opt.uid == uid && (opt.operateType == ApiLsmj.operateType.HU_ZHI
                    || opt.operateType == ApiLsmj.operateType.HU_QIANG || opt.operateType == ApiLsmj.operateType.HU_TI));
                if (huOpt && huOpt.card) {
                    let huTileIndex = tiles.indexOf(huOpt.card);
                    tiles.splice(huTileIndex, 1);
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
        LSMJModel.onGameTurn(data);
        this.setTilesGary(-1);
        this.com_clock.setDir(LSMJModel.getUserIndexByUID(data.uid));
        this.com_clock.setTick(data.tick);
        let isTest = UserModel.getData('isTest');
        /**更新时间和位置 */
        let idx = LSMJModel.getUserIndexByUID(data.uid);
        if (data.operateArray) {
            let isGet = data.operateArray.some(opt => opt.type == ApiLsmj.operateType.GET)
            let isQi = data.operateArray.some(opt => opt.type == ApiLsmj.operateType.QI)
            if (isGet || isQi) {
                let tileId = data.card
                //通知出牌
                let isMoPai = isGet || tileId != null;
                for (let i = 0; i < this._handTileMgrList.length; i++) {
                    const comp = this._handTileMgrList[i];
                    if (!comp) continue;
                    if (idx == i) {
                        if (isMoPai && (idx == 0 || !isTest)) {
                            comp.setDrawTile(tileId, idx == 0);
                        } else if (isMoPai && !!isTest && idx != 0) {
                            comp.setHuTile(tileId);
                        }
                        AssetsManager.playEffect({
                            path: 'res/audio/main/give',
                            bundle: LSMJModel.getGameType()
                        });
                        if (idx == 0 && isQi) {
                            comp.setIsMyTurn();
                            if (!tileId) {
                                comp.setPengChu()
                            }
                        }
                    } else {
                        comp.setTouch(false);
                    }
                }
            }
        }
        let turn = Utils.deepCopy(data)
        if (turn.operateArray && turn.operateArray.length > 1) {
            this.com_opt.onGameTurn(turn);
        } else {
            this.com_opt.onClearTurn();
        }
        this.checkTingPai();
    },

    /**检查 听牌 */
    checkTingPai() {
        let myUid = LSMJModel.getMyUID();
        let queList = LSMJModel.getDingQueList()
        if (queList.length > 1) {
            return
        }
        let operateUid = LSMJModel.getCurOptUID();
        // console.log("恢复听牌===", operateUid, myUid)
        let idx = LSMJModel.getUserIndexByUID(myUid);
        let hcom = this._handTileMgrList[idx];
        let handCards = LSMJModel.getHandCards(myUid);
        let winHandChecks = handCards.slice();
        let tingHandChecks = handCards.slice();

        if (operateUid != myUid) {
            /**不是自己操作 去掉打听标记 显示听牌按钮*/
            if (hcom) hcom.setTingIcons();
            let winTingFilter = LSMJModel.tingFilter(null, winHandChecks);
            let canWinList = LSMJModel.getTingListEx(winTingFilter.cards, true);
            this._canWinList = Utils.uniqueByProperty(canWinList, "cardID")
            this.btn_ting.active = this._canWinList.length > 0;
            // console.log("听牌==", this._canWinList, winTingFilter)
        } else if (operateUid == myUid) {
            let tingCards = [];
            this._tingList = [];
            //判断是否需要删除手牌
            let repeatFilter = Array.from(new Set(tingHandChecks));
            for (const cardId of repeatFilter) {
                let copyTingHandCards = tingHandChecks.slice();
                let tingFilter = LSMJModel.tingFilter(cardId, copyTingHandCards);
                let canTingList = LSMJModel.getTingListEx(tingFilter.cards);
                if (!canTingList || canTingList.length == 0) continue;
                tingCards.push(cardId);
            }
            this._tingList = Array.from(new Set(tingCards));
            if (this._tingList.length > 0) {
                if (hcom) hcom.setTingIcons(this._tingList);
            }
            // console.log("打听列表==", this._tingList)
        }
    },

    showTingLight() {
        if (LSMJModel.getHasDingQueCard()) {
            return
        }
        let tiles = LSMJModel.getHandCards(LSMJModel.getMyUID())
        if (tiles.length >= 14) {
            return
        }
        let winTingFilter = LSMJModel.tingFilter(null, tiles.slice());
        let canWinList = LSMJModel.getTingListEx(winTingFilter.cards, true);
        if (canWinList && canWinList.length > 0) { //如果听牌，播放听牌光效
            canWinList = Utils.uniqueByProperty(canWinList, "cardID")
            if (Utils.deepEqual(canWinList, this._canWinList)) {
                return
            }
            let node = this._handTileMgrList[0].node
            let pos = CCUtil.postionConvert(node, this._operActNodeList[0])
            let com = this.genOperActNode(null, this._operActNodeList[0])
            com.node.setPosition(pos)
            com.node.scale = node.scale
            com.showTingLight()
        }
    },

    /**用户操作广播 */
    onUserOpt(data) {
        LSMJModel.onUserOpt(data);
        this.deleteMoveNode();
        let isTest = UserModel.getData("isTest");
        this.setTilesGary(-1);
        if (data.uid == LSMJModel.getMyUID()) {
            this.com_opt.onClearTurn();
            this.com_ting.node.active = false;
            this._handTileMgrList[0].setTingIcons();
        }
        let idx = LSMJModel.getUserIndexByUID(data.uid);
        let user = null,
            ucom = this._userList[idx];
        if (ucom) user = ucom.getUserData();
        let sex = 'nv';
        if (user) sex = (user.userInfo.sex == 0) ? 'nan' : 'nv';
        let typeNameList = ["chi", "peng", "gang", "hu", "zimo", "", "", "", "fei", "ti"];
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
        if (data.operate == ApiLsmj.operateType.QI) {
            let moOpt = LSMJModel.getQiByMo(data);
            if (!!moOpt && moOpt.card != data.card) drawTile = moOpt.card;
        }
        /**更新手牌 */
        let hcom = this._handTileMgrList[idx];
        let handCards = LSMJModel.getHandCards(data.uid);
        if (!hcom) return;
        if (idx != 0 && !!isTest) {
            hcom.updateLieTiles(handCards);
        } else {
            drawTile = idx == 0 ? drawTile : null;
            hcom.updateStandTiles(handCards, drawTile);
        }
        let optPengGang = () => {
            let pengGangArray = LSMJModel.getPengGangArrayByUID(data.uid);
            let optCom = this._optTileMgrList[idx];
            if (optCom) optCom.updateOptTiles(pengGangArray);
            let lastOut = LSMJModel.getLastOutCardRecord();
            if (!!lastOut.isDel) {
                let localIndex = LSMJModel.getUserIndexByUID(lastOut.opt.uid);
                this._disTileMgrList[localIndex].afterOptUpdateTiles(lastOut.opt.card);
                this.updatePointer();
            }
        }

        let optHu = () => {
            /** 亮出胡的牌 */
            let hcom = this._handTileMgrList[idx];
            if (hcom) {
                let huNode = null;
                if (idx == 0 || !!isTest || data.operate != ApiLsmj.operateType.HU_ZHI) {
                    huNode = hcom.setHuTile(data.card);
                } else {
                    let drawTile = hcom.setDrawTile(data.card);
                    huNode = drawTile.node;
                }
                let optNode = this._operActNodeList[idx]
                this.scheduleOnce(() => {
                    let pos = CCUtil.postionConvert(huNode, optNode)
                    let aniCom = this.genOperActNode(null, optNode)
                    aniCom.node.scale = hcom.node.scale
                    aniCom.node.setPosition(pos)
                    aniCom.showHuLight()
                }, 0.2)
            }

            /**删除桌子上的牌 */
            let lastOut = LSMJModel.getLastOutCardRecord();
            if (!!lastOut.isDel) {
                let localIndex = LSMJModel.getUserIndexByUID(lastOut.opt.uid);
                this._disTileMgrList[localIndex].afterOptUpdateTiles(lastOut.opt.card);
                this.updatePointer();
            }
        }

        let showAni = (type) => {
            let audioType = type;
            if (audioType < typeNameList.length) {
                AssetsManager.playEffect({
                    path: `res/audio/${sex}/${typeNameList[audioType]}`,
                    bundle: LSMJModel.getGameType()
                });
            }
            /**展示动画 */
            let com = this.genOperActNode(null, this._operActNodeList[idx])
            com.showOpt(type, () => {
                /**展示胡牌牌型 */
                // if (type >= 3) {
                //     let com = this.showHuAni(null, this._operActNodeList[idx])
                //     com.showHuType(data.plusInfo.huPaiType)
                // }
            });
            /**展示刮风和下雨 */
            // if (type == 2) {
            //     let t = 5
            //     if (data.operate === ApiLsmj.operateType.GANG_ZHI) {
            //         t = 7 //下雨
            //     }
            //     AssetsManager.playEffect({
            //         path: `res/audio/main/${t == 5 ? "guafeng" : ""}`,
            //         bundle: LSMJModel.getGameType()
            //     });
            //     let fcom = this.genOperActNode(null, this.effectNode)
            //     fcom.showOpt(t)
            // }
            if (type == 3 || type == 4) {
                this.showHuIdx(data.uid, true); //胡牌序列
                if (idx == 0) { //胡牌的火焰动画
                    this._handTileMgrList[0].setAllGray()
                    this._handTileMgrList[0].showHuAniFire()
                }
            }
        }

        switch (data.operate) {
            case ApiLsmj.operateType.QI: //出牌
                AssetsManager.playEffect({
                    path: `res/audio/${sex}/` + data.card,
                    bundle: LSMJModel.getGameType()
                });
                AssetsManager.playEffect({
                    path: 'res/audio/main/push',
                    bundle: LSMJModel.getGameType()
                });
                if (idx == 0) {
                    this._handTileMgrList[0].setTouch(false)
                }
                /**更新桌子上的牌 */
                let out = LSMJModel.getOutTilesByUID(data.uid)
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
            case ApiLsmj.operateType.CHI: //吃牌
                showAni(0)
                optPengGang()
                break;
            case ApiLsmj.operateType.PENG: //碰牌
                showAni(1)
                optPengGang()
                break;
            case ApiLsmj.operateType.GANG_BU: //补杠
                showAni(2)
                optPengGang()
                break;
            case ApiLsmj.operateType.GANG_CHI: //吃杠
                showAni(2)
                optPengGang()
                break;
            case ApiLsmj.operateType.GANG_ZHI: //暗杠
                showAni(2)
                optPengGang();
                break;
            case ApiLsmj.operateType.HU_CHI: //接炮
                showAni(3);
                optHu();
                break;
            case ApiLsmj.operateType.HU_ZHI: //自摸
                showAni(4)
                optHu();
                break;
            case ApiLsmj.operateType.HU_QIANG: //抢杠
                showAni(3)
                optHu();
                break;
            case ApiLsmj.operateType.HU_TI: //抢提胡
                showAni(3)
                optHu();
                break;
            case ApiLsmj.operateType.TI: //提
                showAni(9)
                optPengGang()
                break;
            default:
                break;
        }
        /**展示分数 */
        let plusInfo = data.plusInfo;
        if (plusInfo && plusInfo.winScoreRecord && plusInfo.winScoreRecord.length > 0) {
            for (let i = 0; i < plusInfo.winScoreRecord.length; i++) {
                const score = plusInfo.winScoreRecord[i];
                let index = LSMJModel.getUserIndexByChairID(i)
                this.showOptScore(score, index)
            }
        }
    },

    onSmall(data) {
        this.deleteMoveNode();
        this.com_opt.onClearTurn();//清掉操作列表状态
        AssetsManager.clearDialog(["LSMJResultDialog"])
        let result = Utils.deepCopy(data.result)
        let myUid = LSMJModel.getMyUID();
        if (!!result) {
            for (const user of result) {
                if (!user) continue; //处理没有调试权限时其他人摊牌
                if (!user.userCards || !user.userCards[user.uid]) continue;
                LSMJModel.setHandCardsByUID(user.uid, user.userCards[user.uid])
                let userCards = LSMJModel.getHandCards(user.uid)
                let idx = LSMJModel.getUserIndexByUID(user.uid);
                if (!this._handTileMgrList[idx]) continue;
                if (user.huType > 0) {
                    let huFilter = [ApiLsmj.operateType.HU_ZHI, ApiLsmj.operateType.HU_CHI, ApiLsmj.operateType.HU_QIANG, ApiLsmj.operateType.HU_TI];
                    user.huCards = user.huCards || null;
                    if (huFilter.indexOf(user.huType) != -1) {
                        //赢家删除胡牌
                        let huCardIndex = userCards.indexOf(user.huCards);
                        if (huCardIndex >= 0) userCards.splice(huCardIndex, 1);
                    }
                    this._handTileMgrList[idx].setHuTile(user.huCards);
                }
                userCards = LSMJModel.sortTiles(user.uid, userCards);
                this._handTileMgrList[idx].updateLieTiles(userCards);
            }
            AssetsManager.playEffect({
                path: 'res/audio/main/push',
                bundle: LSMJModel.getGameType()
            });
        }
        data.enterHall = this.enterHall.bind(this);
        data.mainComp = this;
        data.isBureauFull = (LSMJModel.getCurBureau() == LSMJModel.getMaxBureau());
        data.path = "res/prefab/LSMJResultDialog";
        data.isResult = true;
        data.bundle = LSMJModel.getGameType();
        let dt = 0.5
        this.scheduleOnce(() => {
            AssetsManager.createDialog(data);
        }, dt)
    },

    /**展示操作分数 */
    showOptScore(score, index) {
        if (!score || score == 0) return
        let operActNode = this._operActNodeList[index]
        if (cc.isValid(operActNode)) {
            let nName = "optScoreNode"
            let aNode = operActNode.getChildByName(nName)
            if (cc.isValid(aNode)) {
                aNode.destroy()
            }
            let acom = this.genOperActNode(null, operActNode, nName)
            if (acom) acom.showOptScoreAni(score)
        }
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
            c.reset()
        });
        this._operActNodeList.forEach(n => {
            n.removeAllChildren()
        })
        this.deleteFlyNode();
        this.deleteQiePaiAni();
        this.btn_ting.active = false;
        this.com_ting.node.active = false;
        this.com_clock.reset();
        this._com_huanPai.reset()
        this.updatePointer();
        this.setTilesGary(-1);
        this.onLastTilesCountUpdate(0);
        this._canWinList = [];
    },

    /**手牌点击，牌被抬起来 */
    onTileUp(tileCom) {
        /**打听显示 */
        let myUid = LSMJModel.getMyUID();
        let handCards = LSMJModel.getHandCards(myUid)
        if (this._tingList.includes(tileCom.flower)) {
            let myTiles = handCards.slice();
            let tingFilter = LSMJModel.tingFilter(tileCom.flower, myTiles);
            let canWinList = LSMJModel.getTingListEx(tingFilter.cards, true);
            // console.log("打听显示==", canWinList)
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
        window.chatTimer = window.chatTimer || 0;
        // console.log('延迟测试----聊天----', Date.now() - window.chatTimer);
        let fidx = LSMJModel.getUserIndexByChairID(fromChairID)
        let tidx = LSMJModel.getUserIndexByChairID(toChairID)
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

    /**定缺完成 */
    onUserDingQue(data) {
        this.com_dingQue.onUserDingQue(data)
        if (data.uid == LSMJModel.getMyUID()) {
            this._handTileMgrList[0].updateStandTiles(LSMJModel.getHandCards(data.uid))
            this.com_dingQue.hide();
        }
        /**设置头像上的图标 */
        let idx = LSMJModel.getUserIndexByUID(data.uid)
        let com = this._userList[idx]
        if (com) {
            let startNode = this._operActNodeList[idx]
            com.setDingque(data.type, startNode)
        }
    },

    /**飘分完成 */
    onPiaoFenEnd(data) {
        if (data.piaoFen) {
            let idx = LSMJModel.getUserIndexByUID(data.uid)
            let com = this._userList[idx]
            if (com) {
                let startNode = this._operActNodeList[idx]
                com.setPiao(data.piaoFen, startNode)
            }
        }
    },

    onQiangGangQiangTiDel(data) {
        let h = LSMJModel.getHandCards(data.uid)
        let idx = LSMJModel.getUserIndexByUID(data.uid)
        let hcom = this._handTileMgrList[idx];
        if (hcom) hcom.updateStandTiles(h)
    },

    /**生成一个新的操作动画 */
    genOperActNode(uid, showNode, nodeName = "operAni") {
        if (!showNode) {
            let idx = LSMJModel.getUserIndexByUID(uid);
            showNode = this._operActNodeList[idx];
        }
        let optNode = cc.instantiate(this.operActPfb);
        optNode.name = nodeName
        let com = optNode.getComponent('LSMJOperAct');
        optNode.parent = showNode;
        return com
    },

    /**展示胡牌序列 */
    showHuIdx(uid, isAnim = false) {
        let huList = LSMJModel.getUserHuDonList()
        if (isAnim && uid) {
            let index = huList.findIndex((info) => {
                return info.uid == uid
            })
            if (index !== -1) {
                let huInfo = huList[index]
                index++
                let com = this.genOperActNode(uid)
                com.showHuIndex(huInfo.operateType, index, uid, isAnim);
            }
        } else {
            for (let i = 0; i < huList.length; i++) {
                const huInfo = huList[i];
                const index = i + 1
                let com = this.genOperActNode(huInfo.uid)
                com.showHuIndex(huInfo.operateType, index, huInfo.uid, isAnim);
            }
        }
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

    /**删除切牌动画 */
    deleteQiePaiAni() {
        let q = this.node.getChildByName("qiePaiAni")
        if (cc.isValid(q)) {
            q.destroy()
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
                this._onMenuCloseClick();
                break
            case "btn_leave": //离开房间
                this._onMenuCloseClick();
                this._onLeaveClick();
                break;
            case "btn_back": //离开房间
                this.enterHall();
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
                    gameType: LSMJModel.getGameType(),
                    musicType: Enums.bundleType.MAHJONG,
                });
                break;
            case "btn_review": //回看
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiLsmj.gameReviewNotify());
                break;
            case "btn_msg": //聊天
                if (CCUtil.clickInterval(event.target, 1)) return;
                let params = {
                    gameRule: LSMJModel.getGameRule(),
                    chat: (chat) => {
                        ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
                    }
                }
                AssetsManager.chatDialog(params);
                break;
            case "btn_roomInfo": //规则

                if (CCUtil.clickInterval(event.target, 1)) return;
                let rule = LSMJModel.getGameRule();
                if (!rule) return;
                AssetsManager.tableDialog({
                    gameRule: rule,
                });
                break;
            case "btn_ting": //听牌
                this._onMenuCloseClick();
                if (this._canWinList.length > 0 && !this.com_ting.node.active) {
                    for (let i = 0; i < this._canWinList.length; i++) {
                        if (!this._canWinList[i]) continue;
                        this._canWinList[i].count = LSMJModel.getRestCardCount(this._canWinList[i].cardID);
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
                    users: LSMJModel.getUsers(),
                    chairCount: LSMJModel.getChairCount(),
                    fangzuobi: LSMJModel.getGameRuleByKey('fangzuobi')
                })
                break;
            case "btn_deposit": //开始托管
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiLsmj.gameTrushNotify(true));
                break;
            case "btn_quxiaotuoguan": //取消托管
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiLsmj.gameTrushNotify(false));
                break;
            case "btn_invite": //邀请
                let gameRule = LSMJModel.getGameRule();
                gameRule = gameRule || {};
                gameRule.roomId = LSMJModel.getRoomID();
                let share = ConfigModel.getRoomRuleShare(gameRule);
                NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
                break;
            case "btn_copy": //复制
                let str = ConfigModel.getRoomShare(LSMJModel.getGameType(), LSMJModel.getRoomID());
                NativeUtil.copyText(str);
                break;
            default:
                break;
        }
    },

    _onLeaveClick() {
        let curBureau = LSMJModel.getCurBureau();
        if (curBureau > 0) {
            AssetsManager.tipDialog('现在不能退出游戏');
            return;
        }
        ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
    },


    onChat(data) {
        let idx = LSMJModel.getUserIndexByUID(data.uid)
        let com = this._userList[idx];
        if (!com) return;
        com.gameChat(data)
    },
    // 好友邀请
    onShowInvite() {
        AssetsManager.friendDialog({
            gameRule: LSMJModel.getGameRule(),
        })
    },


    /**消息监听 */
    messageCallbackHandler(route, msg) {
        if (route === 'RoomMessagePush') {
            if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
                this.gameInit(msg.data);
            } else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
                LSMJModel.otherUserJoinRoom(msg.data.roomUserInfo);
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
                msg.data.myChairID = LSMJModel.getMyChairID();
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
                let idx = LSMJModel.getUserIndexByChairID(msg.data.chairID);
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
            if (msg.type === ApiLsmj.GAME_BUREAU_PUSH) {
                // console.log("局数更新===", msg.data)
                this.onGameRoundUpdate(msg.data);
            } else if (msg.type === ApiLsmj.GAME_STATUS_PUSH) { //游戏状态
                // console.log("状态更新===", msg.data)
                LSMJModel.setGameStatus(msg.data.gameStatus);
                LSMJModel.setTick(msg.data.tick)
                this.onGameStatusUpdate(msg.data);
            } else if (msg.type === ApiLsmj.GAME_USER_DING_QUE_PUSH) { //定缺完成
                // console.log("定缺完成", msg.data)
                LSMJModel.setDingQueType(msg.data.uid, msg.data.type)
                this.onUserDingQue(msg.data)
                this.showTingLight()
            } else if (msg.type === ApiLsmj.GAME_SEND_CARDS_PUSH) { //发牌
                // console.log("发牌===", msg.data)
                this.deleteMoveNode();
                this.com_clock.hideDice();
                this.onSendTiles(msg.data, true);
            } else if (msg.type === ApiLsmj.GAME_DICES_PUSH) {
                this.com_clock.showDiceAni(msg.data.dice1, msg.data.dice2);
            } else if (msg.type === ApiLsmj.GAME_USER_HUAN_PAI_SUGGEST_PUSH) { //换牌推荐
                this.onHuanPaiSuggest(msg.data)
            } else if (msg.type === ApiLsmj.GAME_HUAN_PAI_PUSH) { //个人选择完成
                // console.log("个人换牌完成", msg.data)
                if (!msg.data.cardList || !Array.isArray(msg.data.cardList)) return
                LSMJModel.onHuanPaiChoose(msg.data)
                this._com_huanPai.onHuanPaiChoose(msg.data)
                let idx = LSMJModel.getUserIndexByUID(msg.data.uid)
                let hcom = this._handTileMgrList[idx]
                if (hcom) {
                    hcom.onHuanPaiChoose(msg.data)
                    let isTest = UserModel.getData('isTest');
                    if (idx != 0 && isTest) {
                        let handCards = LSMJModel.getHandCards(msg.data.uid)
                        hcom.updateLieTiles(handCards)
                    }
                }
                let ucom = this._userList[idx]
                if (ucom) ucom.setState()
            } else if (msg.type === ApiLsmj.GAME_USER_HUAN_PAI_END_PUSH) { //换牌完成
                // console.log("换牌阶段完成", msg.data)
                LSMJModel.onHuanPaiEnd(msg.data)
                this._com_huanPai.onHuanPaiEnd(msg.data)
                let idx = LSMJModel.getUserIndexByUID(msg.data.uid)
                let hcom = this._handTileMgrList[idx]
                if (hcom) {
                    let isTest = UserModel.getData('isTest');
                    hcom.onHuanPaiEnd(msg.data, isTest)
                }
            } else if (msg.type === ApiLsmj.GAME_TURN_OPERATE_PUSH) {
                // console.log("用户操作", msg.data)
                this.onUserOpt(msg.data);
            } else if (msg.type === ApiLsmj.GAME_TURN_PUSH) {
                // console.log("轮到谁了", msg.data)
                this.deleteMoveNode();
                this.onGameTurn(msg.data);
            } else if (msg.type === ApiLsmj.GAME_BANKER_PUSH) { //庄家位置更新
                // console.log("更新庄家==", msg.data)
                LSMJModel.setBankerUID(msg.data.uid)
                this.onBankerUpdate(msg.data);
            } else if (msg.type === ApiLsmj.GAME_REST_CARDS_COUNT_PUSH) { //剩余牌数量更新
                this.onLastTilesCountUpdate(msg.data.restCardsCount);
            } else if (msg.type === ApiLsmj.GAME_END_PUSH) {
                // console.log("游戏结束《《《《《《《《《", msg);
                UserModel.setData('roomID', '');
                let date = Utils.getDateFormat();
                if (msg.data.result.length > 0) {
                    this.showMJAllResultFunc = () => {
                        this.showMJAllResultFunc = null;
                        msg.data.mainComp = this;
                        msg.data.isUnionCreate = LSMJModel.isUnionCreate();
                        msg.data.enterHall = this.enterHall.bind(this);
                        msg.data.roomDismissReason = msg.data.reason;
                        msg.data.path = 'res/prefab/LSMJAllResult';
                        msg.data.bundle = LSMJModel.getGameType();
                        msg.data.date = date.yyyymmddhhmmss;
                        msg.data.roomID = LSMJModel.getRoomID();
                        AssetsManager.createDialog(msg.data);
                    };
                    this.unscheduleAllCallbacks();
                    this.scheduleOnce(() => {
                        if (this.showMJAllResultFunc) {
                            AssetsManager.clearDialog(["LSMJResultDialog"])
                            this.showMJAllResultFunc();
                        }
                    }, 2);
                } else {
                    this.enterHall();
                }
            } else if (msg.type === ApiLsmj.GAME_REVIEW_PUSH) {
                // console.log("回看数据==", msg.data)
                let reviewRecord = msg.data.reviewRecord;
                if (reviewRecord && reviewRecord.length > 0) {
                    AssetsManager.createDialog({
                        bundle: LSMJModel.getGameType(),
                        path: "res/prefab/LSMJResultDialog",
                        reviewRecord: reviewRecord,
                    });
                } else {
                    AssetsManager.tipDialog('暂无回放没有数据');
                }
            } else if (msg.type === ApiLsmj.GAME_RESULT_PUSH) {
                // console.log("小结算==", msg.data)
                this.onSmall(msg.data);
            } else if (msg.type === ApiLsmj.GAME_TRUST_PUSH) { //开始托管
                if (LSMJModel.myUid == msg.data.uid) {
                    this.tuoguan.active = msg.data.trust
                }
            } else if (msg.type === ApiLsmj.GAME_PIAOFEN_PUSH) {
                // console.log("飘分结束==", msg.data)
                this.onPiaoFenEnd(msg.data)
            } else if (msg.type === ApiLsmj.GAME_QIANG_GANG_QIANG_TI_DELETE_PUSH) {
                //抢杠胡抢提之后删除手牌
                // console.log('测试-抢删手牌', msg.data)
                LSMJModel.qiangGangQiangTiDel(msg.data);
                this.onQiangGangQiangTiDel(msg.data);
            } else if (msg.type === ApiLsmj.GAME_USER_TING_PAI_CARDS_PUSH) {
                LSMJModel.onTingCardsSync(msg.data);
            }
        } else if (route === 'ReconnectSuccess') {
            this.getRoomSceneInfo();
        } else if (route === 'SelfEntryRoomPush') {
            if (msg.gameType != LSMJModel.getBundleType()) {
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