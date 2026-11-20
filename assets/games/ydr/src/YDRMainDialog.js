const ApiYdr = require('./ApiYdr');
const ApiRoom = require('../../../src/api/ApiRoom');;
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const MessageCallback = require('../../../src/utils/MessageCallback');
const UserModel = require('../../../src/model/UserModel');
const Codes = require('../../../src/const/Codes');
const ConfigModel = require('../../../src/model/ConfigModel');
const NativeUtil = require('../../../src/utils/NativeUtil');
const YDRModel = require('./YDRModel');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const SubManager = require('../../../src/utils/SubManager');
const YDRLogic = require("./YDRLogic")

cc.Class({
    extends: cc.Component,

    properties: {
        com_opt: require("YDROperate"),
        readyTick: require('YDRReadyTick'),
        operActPfb: cc.Prefab,
        headPfb: [cc.Prefab],
        txt_round: cc.Label,
        txt_roomId: cc.Label,
        txt_time: cc.Label,
        txt_last: cc.Label,
        txt_gameName: cc.Label,
        btn_location: cc.Node,
        btn_copy: cc.Node,
        btn_invite: cc.Node,
        btn_ready: cc.Node,
        btn_leave: cc.Node,
        btn_dismiss: cc.Node,
        btn_shezhi: cc.Node,
        menuLay: cc.Node,
        menuLayList: cc.Node,
        tuoguan: cc.Node,
        btn_deposit: cc.Node,
        effectNode: cc.Node,
        canNotDismissBar: cc.Node,
        moveCardPfb: cc.Prefab,

        /**用户脚本列表 下标为本地座位号*/
        _userList: [],
        /**手牌脚本列表 */
        _handCardMgrList: [],
        /**操作牌脚本列表 */
        _optCardMgrList: [],
        /**打出牌脚本列表 */
        _disCardMgrList: [],
        /**动画节点 */
        _operActNodeList: [],
        /**游戏状态 */
        _gameStatus: 0,
    },

    onLoad() {
        this._onMenuCloseClick()
        AssetsManager.init(this.node);
        YDRModel.setMoveCard(this.moveCardPfb);
        cc.game.on(cc.game.EVENT_SHOW, this.onEventShow, this);
        MessageCallback.addListener('RoomMessagePush', this);
        MessageCallback.addListener('GameMessagePush', this);
        MessageCallback.addListener('ReconnectSuccess', this);
        MessageCallback.addListener('SelfEntryRoomPush', this);
        MessageCallback.addListener('CreateRoomFail', this);
        MessageCallback.addListener('QuickJoinFail', this);
        MessageCallback.addListener('JoinGameAgainPush', this);
        MessageCallback.addListener('OnGameOnceAgain', this);
        this.com_opt.init()
        /* 获取场景信息 */
        this.getRoomSceneInfo();
    },

    onDestroy() {
        cc.game.off(cc.game.EVENT_SHOW, this.onEventShow, this);
        MessageCallback.removeListener('RoomMessagePush', this);
        MessageCallback.removeListener('GameMessagePush', this);
        MessageCallback.removeListener('ReconnectSuccess', this);
        MessageCallback.removeListener('SelfEntryRoomPush', this);
        MessageCallback.removeListener('CreateRoomFail', this);
        MessageCallback.removeListener('QuickJoinFail', this);
        MessageCallback.removeListener('JoinGameAgainPush', this);
        MessageCallback.removeListener('OnGameOnceAgain', this);
        ConfigModel.setData('lastScene', 'ydr');
        AssetsManager.release();
    },

    update(dt) { },

    /**切换后台返回 */
    onEventShow() {
        this.getRoomSceneInfo();
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
        let isUnionCreate = YDRModel.isUnionCreate();
        let unionID = !!isUnionCreate ? YDRModel.getRoomCreatorByKey('unionID') : null;
        SubManager.exitBundle(unionID);
    },

    /**初始化和断线重连 */
    gameInit(data) {
        this.unscheduleAllCallbacks();
        MessageCallback.emitMessage('RemoveGameResult');
        this.resetTable();
        YDRModel.init(data);
        let gameRule = YDRModel.getGameRule()
        YDRLogic.init(gameRule)
        let bundle = ConfigModel.getBundleConfig(gameRule.gameType)
        this.txt_gameName.string = bundle.name

        this._gameStatus = data.gameData.gameStatus;
        let myUid = YDRModel.getMyUID();
        let users = YDRModel.getUsers();

        if (data.gameData.userCanOperate && data.gameData.userCanOperate[myUid]) {
            let userOperate = data.gameData.userCanOperate[myUid];
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
        this.btn_invite.active = YDRModel.getCurBureau() == 0 && !cc.sys.isBrowser && !!ConfigModel.getData('gameWechatInvite');
        this.btn_copy.active = YDRModel.getCurBureau() == 0 && !cc.sys.isBrowser && !!ConfigModel.getData('gameWechatInvite');
        this.btn_location.active = !!YDRModel.getGameRuleByKey('showGps');
        this.btn_ready.active = (this._gameStatus === ApiYdr.gameStatus.NONE && data.gameData.userPlayStatus[myUid] == ApiRoom.userStatusEnum.NONE);
        this.btn_leave.active = data.gameData.curBureau == 0;
        this.btn_dismiss.active = data.gameData.curBureau != 0 && !YDRModel.getGameRuleByKey("canNotDissmiss");
        if (this.canNotDismissBar) this.canNotDismissBar.active = YDRModel.getGameRuleByKey("canNotDissmiss");
        let tm = YDRModel.getGameRuleByKey("trustTm")
        this.btn_deposit.active = tm && tm > 0;
        if (this.btn_ready.active && YDRModel.getCurBureau() == 0 && YDRModel.getGameRuleByKey("unReadyKick") > 0) {
            let tick = YDRModel.getGameRuleByKey("unReadyKick") || 10;
            this.readyTick.sync(tick);
        } else {
            this.readyTick.sync(0);
        }
        /**房间号和局数 */
        this.txt_roomId.string = `房号:${data.roomID}`;
        this.txt_round.string = `${data.gameData.curBureau}/${data.gameData.maxBureau}局`;
        this.onLastTilesCountUpdate(data.gameData.restCardsCount);
        this.showTest();

        if (this._gameStatus >= ApiYdr.gameStatus.SEND_CARDS) {
            /**恢复手牌 */
            this.onSendTiles(data.gameData, false);
            if (this._gameStatus === ApiYdr.gameStatus.PLAYING) {
                let operateUid = data.gameData.operateUid
                let idx = YDRModel.getUserIndexByUID(operateUid)
                /**恢复头像上的时钟 */
                let ucom = this._userList[idx]
                ucom && ucom.showTimerLight(true, data.gameData.tick, data.gameData.totalTick)
                /**自己是否可以出牌 */
                let optInfo = data.gameData.userCanOperate[operateUid]
                this._handCardMgrList[0].setIsMyTurn(idx == 0 && optInfo && optInfo.operateArray &&
                    optInfo.operateArray.includes(ApiYdr.operateType.QI))

                /**恢复每个人吃碰杠的牌 和桌子上的牌*/
                users.forEach(user => {
                    let optlist = YDRModel.getOptCardByUid(user.uid)
                    let dislist = YDRModel.getTableCardByUid(user.uid)
                    let seatIdx = YDRModel.getUserIndexByUID(user.uid)
                    let tuo = YDRModel.getTuoShuByUid(user.uid)
                    let ucom = this._userList[seatIdx]
                    ucom && ucom.setTuoShu(tuo)
                    let ocom = this._optCardMgrList[seatIdx]
                    let dcom = this._disCardMgrList[seatIdx]
                    ocom && ocom.updateOptCards(optlist)
                    dcom && dcom.updateOutCard(dislist)
                });
                /**恢复当前出的牌 */
                let lastOpt = Utils.deepCopy(data.gameData.operateRecords)
                lastOpt = lastOpt[lastOpt.length - 1]
                if (lastOpt) {
                    let lastIdx = YDRModel.getUserIndexByUID(lastOpt.uid)
                    if (lastOpt.operate == ApiYdr.operateType.FAN) {
                        let qiCom = this._handCardMgrList[lastIdx]
                        qiCom && qiCom.showMoPaiAni(lastOpt.card)
                    } else if (lastOpt.operate == ApiYdr.operateType.QI) {
                        let dCom = this._disCardMgrList[lastIdx]
                        dCom && dCom.showDisCard(lastOpt.card)
                    }
                }
            }
            /**恢复起标记 */
            if (data.gameData.gameQiPaiUser) {
                let qiIdx = YDRModel.getUserIndexByUID(data.gameData.gameQiPaiUser)
                let qcom = this._userList[qiIdx]
                qcom && qcom.setQi(true)
            }
            /**下课或者包子 */
            let userGameStatus = data.gameData.userGameStatus
            for (const uid in userGameStatus) {
                if (Object.hasOwnProperty.call(userGameStatus, uid)) {
                    const s = userGameStatus[uid];
                    let uidx = YDRModel.getUserIndexByUID(uid)
                    let ucom = this._userList[uidx]
                    let hcom = this._handCardMgrList[uidx]
                    if (ucom) {
                        ucom.setXiaKe(ApiYdr.userGameStatus.KOU == s)
                        ucom.setBaoZi(ApiYdr.userGameStatus.BAOZI == s)
                    }
                    if (hcom && (ApiYdr.userGameStatus.KOU == s || ApiYdr.userGameStatus.BAOZI == s)) {
                        hcom.setKouPai()
                    }
                }
            }
        }
        /**恢复托管标记 */
        let userTrustArray = data.gameData.autoUser
        if (userTrustArray) {
            this.tuoguan.active = userTrustArray[YDRModel.myUid]
        }
    },

    /**判断人数，初始化头像位置 */
    seatsInit() {
        if (this._userList.length > 0) {
            return
        }
        let headPos = [0, 1, 2];
        if (YDRModel.getChairCount() == 2) {
            headPos = [0, 1]
        }
        this._userList.length = 0;
        this._handCardMgrList.length = 0
        this._optCardMgrList.length = 0
        this._disCardMgrList.length = 0
        this._operActNodeList.length = 0;

        let cards = this.node.getChildByName("cards")
        for (let i = 0; i < headPos.length; i++) {
            let hPos = headPos[i]
            let pfbIdx = 0 //左边的头像
            if (hPos == 1) { //右边的头像
                pfbIdx = 1
            }
            let head = cc.instantiate(this.headPfb[pfbIdx])
            let hParent = this.node.getChildByName("head" + hPos);
            head.parent = hParent
            this._userList.push(head.getComponent("YDRHead"));
            this._userList[i].initRes();

            let hand = cards.getChildByName("hand" + hPos)
            let hcom = hand.getComponent("YDRHandMgr")
            this._handCardMgrList.push(hcom)
            hcom.init(hPos)

            let opt = cards.getChildByName("opt" + hPos)
            let ocom = opt.getComponent("YDROptMgr")
            this._optCardMgrList.push(ocom)
            ocom.init(hPos)

            let dis = cards.getChildByName("out" + hPos)
            let dcom = dis.getComponent("YDROutMgr")
            this._disCardMgrList.push(dcom)
            dcom.init(hPos)

            let opNode = cc.find("operAct" + hPos, this.node);
            this._operActNodeList.push(opNode);
        }
    },

    /**用户进入房间 */
    userEnterRoom(data) {
        let idx = YDRModel.getUserIndexByUID(data.uid);
        let headcom = this._userList[idx]
        if (headcom) {
            headcom.init(data)
        }
    },

    /**恢复所有人的总输赢分数 */
    initTotalScore(userWinTotalScore) {
        if (userWinTotalScore && YDRModel.getGameRuleByKey("tongji")) {
            let len = Object.keys(userWinTotalScore)
            if (len.length > 0) {
                for (const uid in userWinTotalScore) {
                    if (Object.hasOwnProperty.call(userWinTotalScore, uid)) {
                        const s = userWinTotalScore[uid];
                        let idx = YDRModel.getUserIndexByUID(uid);
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
        let idx = YDRModel.getUserIndexByChairID(data.chairID);
        let headcom = this._userList[idx];
        if (headcom) {
            headcom.leave();
        }
        if (data.uid == UserModel.getData('uid')) {
            if (!YDRModel.getRoomID() ||
                YDRModel.getRoomID() == data.roomID) {
                this.enterHall();
            }
        }
    },

    /**GPS定位检查 */
    verifyZuobi(roomUserInfo) {
        if (!YDRModel.getGameRuleByKey("fangzuobi")) return;
        if (!roomUserInfo || roomUserInfo.chairID >= YDRModel.getChairCount()) return;
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
        let idx = YDRModel.getUserIndexByChairID(data.chairID);
        let com = this._userList[idx];
        if (com) com.setReady(true);
        if (data.chairID == YDRModel.getMyChairID()) {
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
        YDRModel.setCurBureau(data.curBureau);
        this.txt_round.string = `${data.curBureau}/${YDRModel.getMaxBureau()}局`;
        this.btn_invite.active = false;
        this.btn_copy.active = false;
        this.btn_leave.active = false;
        this.btn_dismiss.active = data.curBureau != 0 && !YDRModel.getGameRuleByKey("canNotDissmiss");
    },

    /**更新剩余牌数量 */
    onLastTilesCountUpdate(count) {
        if (count > 0) {
            this.txt_last.string = `${count}`;
        } else {
            this.txt_last.string = '0';
        }
    },

    /**更新庄家 */
    onBankerUpdate(data) {
        let idx = YDRModel.getUserIndexByUID(data.uid);
        let com = this._userList[idx];
        if (com) com.setBanker(true);
    },

    /**游戏状态跳转 */
    onGameStatusUpdate(data) {
        this._gameStatus = data.gameStatus;
        if (this._gameStatus == ApiYdr.gameStatus.NONE ||
            this._gameStatus == ApiYdr.gameStatus.DICES) {
            this.onLastTilesCountUpdate(0);
        }

        this.hideReadyIcon();
        this.btn_ready.active = YDRModel.getCurBureau() == 0 && this._gameStatus == ApiYdr.gameStatus.NONE;
        this.readyTick.sync(0);

        switch (this._gameStatus) {
            case ApiYdr.gameStatus.NONE:
                YDRModel.reset();
                this.resetTable();
                break;
            case ApiYdr.gameStatus.PLAYING:
                this.com_opt.reset()
                break;
            default:
                break;
        }
    },

    /**发牌 */
    onSendTiles(data, isAni) {
        let handCards = Utils.deepCopy(data.handCards)
        let isTest = UserModel.getData("isTest");
        for (const uid in handCards) {
            if (uid == YDRModel.getMyUID() || !!isTest) {
                let idx = YDRModel.getUserIndexByUID(uid)
                let baiPaiList = YDRModel.getHandCards(uid)
                // console.log("通过发牌刷新了手牌==", handCards, baiPaiList)
                this._handCardMgrList[idx].updateHandCards(baiPaiList, isAni)
            }
        }
    },

    /**通知用户操作 */
    onGameTurn(data) {
        this.com_opt.reset()
        /**先隐藏所有时钟 */
        this._userList.forEach(com => {
            com.showTimerLight(false)
        });
        let idx = YDRModel.getUserIndexByUID(data.uid)
        let hcom = this._handCardMgrList[idx]
        let ucom = this._userList[idx]
        /**设置头像上的时钟 */
        ucom && ucom.showTimerLight(true, data.tick, data.tick)
        /**设置操作按钮 */
        if (data.uid == YDRModel.getMyUID()) {
            this.com_opt.onGameTurn(data)
            hcom && hcom.setIsMyTurn(data.operateArray.includes(ApiYdr.operateType.QI))
        }
    },

    /**用户操作广播 */
    onUserOpt(data) {
        if (data.operate != ApiYdr.operateType.KOU && data.operate != ApiYdr.operateType.BAOZI) {
            this.com_opt.reset()
        }
        if (data.uid == YDRModel.getMyUID()) {
            this._handCardMgrList[0].setIsMyTurn(false)
            this.com_opt.reset()
        }
        this._userList.forEach(com => {
            com.showTimerLight(false)
        });

        let isTest = UserModel.getData("isTest");
        let idx = YDRModel.getUserIndexByUID(data.uid)
        let ucom = this._userList[idx]
        let hcom = this._handCardMgrList[idx]
        let dcom = this._disCardMgrList[idx]
        let ocom = this._optCardMgrList[idx]

        /**更新陀数 */
        ucom && ucom.setTuoShu(YDRModel.getTuoShuByUid(data.uid))

        /**刷新手牌 */
        let updateHand = () => {
            if (data.uid == YDRModel.getMyUID() || !!isTest) {
                let baiPaiList = YDRModel.getHandCards(data.uid)
                // console.log("用户操作后刷新了手牌", data, baiPaiList)
                hcom && hcom.updateHandCards(baiPaiList)
            }
        }
        /**展示动画 */
        let showAni = () => {
            let showNode = this._operActNodeList[idx]
            if (cc.isValid(showNode)) {
                showNode.removeAllChildren()
                let aniNode = cc.instantiate(this.operActPfb)
                aniNode.parent = showNode
                let aniCom = aniNode.getComponent("YDROperAct")
                aniCom.showOpt(data.operate)
            }
        }
        /**删除所有的出的牌和摸的牌 */
        let delCards = () => {
            for (let i = 0; i < this._handCardMgrList.length; i++) {
                this._handCardMgrList[i].delMoCard()
                this._disCardMgrList[i].delDisCard()
            }
        }

        let user = YDRModel.getUserByUID(data.uid)
        let sex = 'nv';
        if (user) {
            sex = (user.userInfo.sex == 0) ? 'nan' : 'nv';
        }

        let cardPath = `res/audio/${sex}/puke/${data.card}`
        let optPath = `res/audio/${sex}/opt${data.operate}`
        let commPath = "res/audio/common/"

        let playSound = (path) => {
            // console.log("播放了声音", path)
            AssetsManager.playEffect({
                path: path,
                bundle: Enums.bundleType.YDR
            });
        }

        switch (data.operate) {
            case ApiYdr.operateType.QIPAI: //起
                ucom && ucom.setQi(true)
                playSound(optPath)
                break;
            case ApiYdr.operateType.KOU: //扣
                ucom && ucom.setXiaKe(true)
                hcom && hcom.setKouPai()
                playSound(optPath)
                break;
            case ApiYdr.operateType.BAOZI: //包子
                ucom && ucom.setBaoZi(true)
                hcom && hcom.setKouPai()
                playSound(optPath)
                break;
            case ApiYdr.operateType.TOU: //偷
                ucom && ucom.showTouAni(1)
                if (data.uid == YDRModel.getMyUID()) {
                    // console.log("偷牌刷新牌时候的手牌==", YDRModel.getHandCards(YDRModel.myUid))
                    updateHand()
                    let touCards = data.plusInfo.touCards
                    if (touCards && touCards.length > 0) {
                        touCards.forEach(cardId => {
                            hcom && hcom.showMoPaiAni(cardId)
                            hcom && hcom.showFlyToPaiDui(cardId)
                        });
                    }
                }
                break;
            case ApiYdr.operateType.BUTOU: //不偷
                ucom && ucom.showTouAni(2)
                break;
            case ApiYdr.operateType.QI: //出牌
                dcom && dcom.showDisCard(data.card)
                updateHand()
                playSound(cardPath)
                break;
            case ApiYdr.operateType.FAN: //翻牌
                hcom && hcom.showMoPaiAni(data.card)
                playSound(cardPath)
                break;
            case ApiYdr.operateType.GET: //摸牌
                updateHand()
                hcom && hcom.showMoPaiAni(data.card)
                hcom && hcom.showFlyToPaiDui(data.card)
                playSound(cardPath)
                break;
            case ApiYdr.operateType.DIU: //丢牌堆
                this.scheduleOnce(() => {
                    /**刷新丢在桌子上的牌 */
                    let disList = YDRModel.getTableCardByUid(data.uid)
                    dcom && dcom.updateOutCard(disList)
                    dcom && dcom.showDiuAni(data.card)
                    playSound(commPath + "mopai")
                }, 0.3)
                break;
            case ApiYdr.operateType.CHI:
            case ApiYdr.operateType.PENG:
            case ApiYdr.operateType.SHA:
            case ApiYdr.operateType.TUHUO:
                /**刷新吃碰杠的牌 */
                let optList = YDRModel.getOptCardByUid(data.uid)
                ocom && ocom.updateOptCards(optList)
                ocom && ocom.showOptAni()
                showAni()
                updateHand()
                delCards()
                playSound(optPath)
                if (data.operate == ApiYdr.operateType.SHA || data.operate == ApiYdr.operateType.TUHUO) playSound(commPath + "opt" + data.operate)
                break;
            case ApiYdr.operateType.HU:
                /**展示胡的牌 */
                showAni()
                hcom && hcom.showHuPai(data.card)
                playSound(optPath)
                break;
            case ApiYdr.operateType.BUHUA: //财神
                // hcom && hcom.showMoPaiAni(data.card)
                break;
            default:
                break;
        }
    },

    onSmall(data) {
        /**隐藏操作按钮 */
        this.com_opt.reset()
        this.deleteMoveNode();

        data.enterHall = this.enterHall.bind(this);
        data.mainComp = this;
        data.isBureauFull = (YDRModel.getCurBureau() == YDRModel.getMaxBureau());
        data.path = "res/prefab/YDRResultDialog";
        data.isResult = true;
        data.bundle = Enums.bundleType.YDR;
        AssetsManager.createDialog(data);
    },

    /**展示操作分数 */
    showOptScore(score, index) {
        if (!score || score == 0) return
        let operActNode = this._operActNodeList[index]
        if (cc.isValid(operActNode)) {
            let aNode = operActNode.getChildByName("aniNode")
            if (cc.isValid(aNode)) {
                aNode.destroy()
            }
            let aniNode = cc.instantiate(this.operActPfb)
            aniNode.name = "aniNode"
            aniNode.parent = operActNode
            let acom = aniNode.getComponent("YDROperAct")
            if (acom) acom.showOptScoreAni(score)
        }
    },


    /**清除桌面上所有牌 */
    resetTable() {
        this._handCardMgrList.forEach(c => {
            c.reset()
        });
        this._disCardMgrList.forEach(c => {
            c.reset()
        });
        this._optCardMgrList.forEach(c => {
            c.reset()
        });
        this._userList.forEach(c => {
            c.reset()
        });
        this._operActNodeList.forEach(n => {
            n.removeAllChildren()
        })

        this.onLastTilesCountUpdate(0);
        this.com_opt.reset()
    },

    onGift(fromChairID, toChairID, giftID) {
        let fidx = YDRModel.getUserIndexByChairID(fromChairID)
        let tidx = YDRModel.getUserIndexByChairID(toChairID)
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
        this.btn_shezhi.active = false //!!isTest;
    },

    onBtnTest() {
        let jushu = YDRModel.getCurBureau()
        let tmp = UserModel.getData("isTest")
        if (!tmp || jushu <= 0) {
            return
        }
        AssetsManager.createDialog({
            bundle: Enums.bundleType.YDR,
            path: "res/prefab/YDRSelectTest",
            mainDialog: this
        })
    },

    /**删除有可能存在的拖动牌 */
    deleteMoveNode() {
        for (let i = 0; i < 3; i++) {
            let p = AssetsManager.getRoot()
            let n = p.getChildByName("moveNode");
            if (cc.isValid(n)) {
                n.destroy();
            }
        }
    },

    _onLeaveClick() {
        if (!UserModel.isInRoom()) {
            this.enterHall();
            return;
        }
        let curBureau = YDRModel.getCurBureau();
        if (curBureau > 0 && YDRModel.getMyChairID() < YDRModel.getChairCount()) {
            AssetsManager.tipDialog('现在不能退出游戏');
        } else {
            ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
        }
    },

    _onMenuOpen() {
        this.menuLayList.stopAllActions()
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
        // console.log("动画的1==", this.menuLayList.x, this.menuLayList.y)
        cc.tween(this.menuLayList)
            .to(0.5, {
                opacity: 255,
                position: cc.v3(this._roomsLayPos.show)
            }, {
                easing: 'sineOut'
            })
            .call(() => {
                // console.log("动画的2==", this.menuLayList.x, this.menuLayList.y, this.menuLayList.scale, this.menuLayList.opacity, this.menuLayList.active)
                this._moveAction = false;
            })
            .start();
    },

    _onMenuCloseClick() {
        this.menuLay.active = false;
    },

    /**按钮响应 */
    btnClickCallFunc(event, param) {

        switch (event.target.name) {
            case "btn_menu": //菜单
                this.menuLay.active = true;
                this._onMenuOpen()
                break;
            case "menu": //关闭菜单
                this._onMenuCloseClick()
                break
            case "btn_leave": //离开房间
                this._onLeaveClick();
                break;
            case "btn_ready": //准备
                ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify(true));
                this.btn_ready.active = false;
                break;
            case "btn_dismiss": //解散
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
                if (CCUtil.clickInterval(event.target, 10)) return;
                AssetsManager.tipDialog('刷新界面可以修复游戏显示问题');
                this.getRoomSceneInfo()
                break;
            case "btn_setting": //设置
                AssetsManager.setDialog({
                    type: "mahjong",
                    gameType: Enums.bundleType.YDR,
                    musicType: Enums.bundleType.MAHJONG,
                });
                break;
            case "btn_review": //回看
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiYdr.gameReviewNotify());
                break;
            case "btn_msg": //聊天
                if (CCUtil.clickInterval(event.target, 1)) return;
                let params = {
                    gameRule: YDRModel.getGameRule(),
                    chat: (chat) => {
                        ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
                    }
                }
                AssetsManager.chatDialog(params);
                break;
            case "btn_roomInfo": //规则
                if (CCUtil.clickInterval(event.target, 1)) return;
                let rule = YDRModel.getGameRule();
                if (!rule) return;
                AssetsManager.tableDialog({
                    gameRule: rule,
                });
                break;
            case "btn_location": //定位
                if (CCUtil.clickInterval(event.target, 1)) return;
                AssetsManager.locationDialog({
                    users: YDRModel.getUsers(),
                    chairCount: YDRModel.getChairCount(),
                    fangzuobi: YDRModel.getGameRuleByKey('fangzuobi')
                })
                break;
            case "btn_deposit": //开始托管
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiYdr.gameTrushNotify(true));
                break;
            case "btn_quxiaotuoguan": //取消托管
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiYdr.gameTrushNotify(false));
                break;
            case "btn_invite": //邀请
                let gameRule = YDRModel.getGameRule();
                gameRule = gameRule || {};
                gameRule.roomId = YDRModel.getRoomID();
                let share = ConfigModel.getRoomRuleShare(gameRule);
                NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
                break;
            case "btn_copy": //复制
                let str = ConfigModel.getRoomShare(Enums.bundleType.YDR, YDRModel.getRoomID());
                NativeUtil.copyText(str);
            default:
                break;
        }
    },

    onChat(data) {
        let idx = YDRModel.getUserIndexByUID(data.uid)
        let com = this._userList[idx];
        if (!com) return;
        com.gameChat(data)
    },
    // 好友邀请
    onShowInvite() {
        AssetsManager.friendDialog({
            gameRule: YDRModel.getGameRule(),
        })
    },


    /**消息监听 */
    messageCallbackHandler(route, msg) {
        if (route === 'RoomMessagePush') {
            if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
                this.gameInit(msg.data);
            } else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
                YDRModel.otherUserJoinRoom(msg.data.roomUserInfo);
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
                msg.data.myChairID = YDRModel.getMyChairID();
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
                let idx = YDRModel.getUserIndexByChairID(msg.data.chairID);
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
            if (msg.type === ApiYdr.GAME_BUREAU_PUSH) {
                this.onGameRoundUpdate(msg.data);
            } else if (msg.type === ApiYdr.GAME_STATUS_PUSH) { //游戏状态
                // console.log("游戏状态跳转==", msg.data)
                YDRModel.setGameStatus(msg.data.gameStatus);
                this.onGameStatusUpdate(msg.data);
            } else if (msg.type === ApiYdr.GAME_SEND_CARDS_PUSH) { //发牌
                // console.log("发牌===", msg.data)
                this.deleteMoveNode();
                YDRModel.setHandCards(msg.data.handCards);
                this.onSendTiles(msg.data, true);
            } else if (msg.type === ApiYdr.GAME_TURN_OPERATE_PUSH) { //用户操作广播
                // console.log("用户操作广播==", msg.data)
                this.deleteMoveNode();
                YDRModel.onUserOpt(msg.data);
                this.onUserOpt(msg.data);
            } else if (msg.type === ApiYdr.GAME_TURN_PUSH) { //通知用户操作
                // console.log("通知用户操作", msg.data)
                this.deleteMoveNode();
                YDRModel.onGameTurn(msg.data);
                this.onGameTurn(msg.data);
            } else if (msg.type === ApiYdr.GAME_BANKER_PUSH) { //庄家位置更新
                this.onBankerUpdate(msg.data);
            } else if (msg.type === ApiYdr.GAME_REST_CARDS_COUNT_PUSH) { //剩余牌数量更新
                this.onLastTilesCountUpdate(msg.data.restCardsCount);
            } else if (msg.type === ApiYdr.GAME_END_PUSH) {
                // console.log("游戏结束《《《《《《《《《", msg);
                UserModel.setData('roomID', '');
                if (msg.data.result.length > 0) {
                    this.showMJAllResultFunc = () => {
                        this.showMJAllResultFunc = null;
                        msg.data.mainComp = this;
                        msg.data.isUnionCreate = YDRModel.isUnionCreate();
                        msg.data.enterHall = this.enterHall.bind(this);
                        msg.data.roomDismissReason = msg.data.reason;
                        msg.data.path = 'res/prefab/YDRAllResult';
                        msg.data.bundle = Enums.bundleType.YDR;
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
            } else if (msg.type === ApiYdr.GAME_REVIEW_PUSH) {
                // console.log("查看回放==", msg.data.reviewRecord, msg.data.reviewRecord.length)
                let reviewRecord = msg.data.reviewRecord;
                if (reviewRecord && reviewRecord.length > 0) {
                    AssetsManager.createDialog({
                        bundle: Enums.bundleType.YDR,
                        path: "res/prefab/YDRResultDialog",
                        reviewRecord: reviewRecord,
                    });
                } else {
                    AssetsManager.tipDialog('暂无回放没有数据');
                }
            } else if (msg.type === ApiYdr.GAME_RESULT_PUSH) { //小结算
                // console.log("小结算数据==", msg.data)
                this.onSmall(msg.data);
            } else if (msg.type === ApiYdr.GAME_TRUST_PUSH) { //开始托管
                if (YDRModel.myUid == msg.data.uid) {
                    this.tuoguan.active = msg.data.trust
                }
            }
        } else if (route === 'ReconnectSuccess') {
            this.getRoomSceneInfo();
        } else if (route === 'SelfEntryRoomPush') {
            if (msg.gameType != YDRModel.getBundleType()) {
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
        }
    },
});