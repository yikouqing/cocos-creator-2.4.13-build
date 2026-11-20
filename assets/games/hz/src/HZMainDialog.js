const ApiHz = require('./ApiHz');
const ApiRoom = require('../../../src/api/ApiRoom');;
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiHall = require('../../../src/api/ApiHall');
const AudioUtil = require('../../../src/utils/AudioUtil');
const SubManager = require('../../../src/utils/SubManager');
const MessageCallback = require('../../../src/utils/MessageCallback');
const UserModel = require('../../../src/model/UserModel');
const Utils = require('../../../src/utils/Utils');
const Codes = require('../../../src/const/Codes');
const ConfigModel = require('../../../src/model/ConfigModel');
const NativeUtil = require('../../../src/utils/NativeUtil');
const HZModel = require('./HZModel');
const HZLogic = require('./HZLogic');
const CCUtil = require('../../../src/utils/CCUtil');
const MJTableUtil = require('./MJTableUtil');
const Events = require('../../../src/const/Events');

cc.Class({
    extends: cc.Component,

    properties: {
        com_opt: require("HZOperate"),
        com_clock: require("HZClock"),
        com_ting: require("HZTingTips"),
        com_mapai: require("HZMaPai"),
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
        btn_shezhi: cc.Node,
        btn_ting: cc.Node,
        btn_menu: cc.Node,
        menuLay: cc.Node,
        menuLayList: cc.Node,
        pointer: cc.Node,
        tuoguan: cc.Node,
        btn_deposit: cc.Node,
        operActPfb: cc.Prefab,
        btnBackHall: cc.Node,
        btnYuYin: cc.Node,
        btnAniList: [cc.Node],
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
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        MJTableUtil.init();
        AssetsManager.init(this.node);
        // 菜单点击
        this.menuLay.active = false;
        this.txt_name.string = `游戏:${ConfigModel.getGameName(Enums.bundleType.HZ)}`;
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
        cc.systemEvent.on("tileUp", this.onTileUp, this)
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
        ConfigModel.setData('lastScene', 'hz');
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
        let isUnionCreate = HZModel.isUnionCreate();
        let unionID = !!isUnionCreate ? HZModel.getRoomCreatorByKey('unionID') : null;
        SubManager.exitBundle(unionID);
    },

    /**初始化和断线重连 */
    gameInit(data) {
        MessageCallback.emitMessage('RemoveGameResult');
        this.unscheduleAllCallbacks();
        this.resetTable()
        HZModel.init(data)
        this._gameStatus = data.gameData.gameStatus
        this.com_clock.gameInit(HZModel.getChairCount(), HZModel.getMyChairID())
        this.com_mapai.showMaPai()
        if (this._gameStatus == ApiHz.gameStatus.NONE && HZModel.getCurBureau() == 0) {
            this.com_clock.node.active = false;
        } else {
            this.com_clock.node.active = true;
        }
        this.com_opt.gameInit(data.gameData)
        let myChairID = HZModel.getMyChairID()
        this.checkHeadPos()
        /**初始化用户信息 */
        let roomUserInfoArr = data.roomUserInfoArr
        let myUserInfo = {}
        for (let i = 0; i < roomUserInfoArr.length; i++) {
            const user = roomUserInfoArr[i];
            this.userEnterRoom(user)
            if (user.chairID == HZModel.getMyChairID()) {
                myUserInfo = user
            }
        }
        this.updateCurUserScore(data.gameData.curScores)
        this.initTotalScore(data.gameData.userWinTotalScore)

        /**按钮显示 */
        let unionID = HZModel.isUnionCreate() ? HZModel.getRoomCreatorByKey('unionID') : null;
        let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
        this.btn_invite.active = HZModel.getCurBureau() == 0 && !!isShowInvite;
        this.btn_copy.active = HZModel.getCurBureau() == 0 && !!isShowInvite;
        this.btn_location.active = !!HZModel.getGameRuleByKey('showGps');
        this.btn_ready.active = this._gameStatus === ApiHz.gameStatus.NONE && myUserInfo.userStatus != ApiRoom.userStatusEnum.READY
        this.btn_leave.active = data.gameData.curBureau == 0
        this.btn_dismiss.active = data.gameData.curBureau != 0 && !HZModel.getGameRuleByKey("canNotDissmiss");
        this.btn_deposit.active = HZModel.getGameRuleByKey("canTrust")
        this.btnBackHall.active = data.gameData.curBureau == 0 && HZModel.isUnionCreate();
        let yuyin = HZModel.getGameRuleByKey('yuyin');
        this.btnYuYin.active = !!yuyin && ConfigModel.getData('voiceSpeaker');
        /**房间号和局数 */
        this.txt_roomId.string = `房号:${data.roomID}`
        this.txt_round.string = `局数:${data.gameData.curBureau}/${data.gameData.maxBureau}`
        if (this.canNotDismissBar) this.canNotDismissBar.active = HZModel.getGameRuleByKey("canNotDissmiss");
        this.onLastTilesCountUpdate(data.gameData.restCardsCount)

        this.showTest()

        if (this._gameStatus > ApiHz.gameStatus.DICES) {
            let count = HZModel.getChairCount()
            /**恢复手牌 */
            this.onSendTiles(data.gameData, false)
            let lastOpt = HZModel.getLastOperate();
            let isTest = UserModel.getData("isTest");
            //如果是自己的轮次 并且上一次打牌的人不是自己时删除最近一次摸的牌
            if (!!lastOpt &&
                lastOpt.operate == ApiHz.operateType.GET) {
                let idx = HZModel.getUserChairIndex(lastOpt.chairID);
                let card = lastOpt.card;
                let hcom = this._handTileMgrList[idx]
                if (hcom) {
                    if (idx == 0 || !isTest) {
                        hcom.setDrawTile(card, false);
                    } else {
                        hcom.setHuTile(card);
                    }
                }
            }
            for (let i = 0; i < count; i++) {
                let idx = HZModel.getUserChairIndex(i)
                /**恢复吃碰杠的牌 */
                let pengGangArray = HZModel.getPengGangArrayByChairID(i);
                if (pengGangArray.length > 0) {
                    let optCom = this._optTileMgrList[idx]
                    if (optCom) {
                        optCom.updateOptTiles(pengGangArray)
                    }
                }
                /**恢复打出的牌 */
                let out = HZModel.getOutTiles(i)
                // console.log("出牌列表==", out, i)
                if (out.length > 0) {
                    let lastout = null
                    let record = data.gameData.operateRecord
                    // for (let i = record.length - 1; i >= 0; i--) {
                    const opt = record[record.length - 1];
                    const opt1 = record[record.length - 2];
                    if (opt && opt1 && opt1.operate == ApiHz.operateType.QI && opt.operate == ApiHz.operateType.GET) {
                        lastout = opt1
                        // break;
                    } else if (opt && opt.operate == ApiHz.operateType.QI) {
                        lastout = opt
                    }
                    // }
                    let last = null,
                        disCom = this._disTileMgrList[idx]
                    if (disCom) {
                        last = disCom.showOutTiles(out)
                    }
                    // console.log("最后出的牌==", lastout, i, record)
                    if (last && lastout && i == lastout.chairID && last.flower == lastout.card) {
                        this.updatePointer(last.node)
                    }
                }
            }

            if (this._gameStatus === ApiHz.gameStatus.PLAYING) {
                let curChairID = data.gameData.curChairID
                /**恢复方向指示 */
                let idx = HZModel.getUserChairIndex(curChairID)
                this.com_clock.setDir(idx)
                this.com_clock.setTick(data.gameData.tick)
                /**设置该谁出牌 */
                let optarr = data.gameData.operateArrays[curChairID]
                if (optarr && Array.isArray(optarr) && optarr.includes(ApiHz.operateType.QI) && HZModel.getMyChairID() == curChairID) {
                    this._handTileMgrList[0].setIsMyTurn()
                }

                /**恢复听牌 */
                let tile = null
                optarr = data.gameData.operateArrays[myChairID] || []
                if (optarr.includes(ApiHz.operateType.QI)) {
                    let opt = HZModel.getOptRecord(curChairID)
                    for (let i = opt.length - 1; i >= 0; i--) {
                        const o = opt[i];
                        if (o.operate == ApiHz.operateType.GET) {
                            tile = o.card
                            break;
                        }
                    }
                }
                this.checkTingPai({
                    operateArray: optarr || [],
                    chairID: curChairID,
                    card: tile,
                })

                /**恢复托管标记 */
                let userTrustArray = data.gameData.userTrustArray
                if (userTrustArray && Array.isArray(userTrustArray)) {
                    this.tuoguan.active = userTrustArray[HZModel.getMyChairID()]
                }
            } else {
                this.btn_ting.active
            }
            this.showTestCard()
        }
    },

    /**判断人数，初始化头像位置 */
    checkHeadPos() {
        let chairCount = HZModel.getChairCount()
        let headPos = [0, 1, 2, 3]
        if (chairCount == 2) {
            headPos = [0, 2]
        } else if (chairCount == 3) {
            headPos = [0, 1, 3]
        }
        this._userList.length = 0
        this._handTileMgrList.length = 0
        this._optTileMgrList.length = 0
        this._disTileMgrList.length = 0
        this._operActNodeList.length = 0
        for (let i = 0; i < 4; i++) {
            let h = cc.find("head" + i, this.node)
            h.active = false
        }
        let g = HZLogic.getGhostList()
        for (let i = 0; i < headPos.length; i++) {
            let h = cc.find("head" + headPos[i], this.node)
            this._userList.push(h.getComponent("HZHead"))
            this._userList[i].initRes()

            let handTile = cc.find("tiles/handTiles" + headPos[i], this.node)
            let optTile = cc.find("tiles/optTiles" + headPos[i], this.node)
            if (!optTile) {
                optTile = cc.find("optTiles" + headPos[i], handTile)
            }
            let disTile = cc.find("tiles/outTiles" + headPos[i], this.node)
            this._handTileMgrList.push(handTile.getComponent("HZHandTileMgr"))
            this._handTileMgrList[i].init(headPos[i], g)
            this._optTileMgrList.push(optTile.getComponent("HZOptTileMgr"))
            this._optTileMgrList[i].init(headPos[i], g)
            this._disTileMgrList.push(disTile.getComponent("HZOutTileMgr"))
            this._disTileMgrList[i].init(headPos[i], g)

            let opNode = cc.find("operAct" + headPos[i], this.node)
            this._operActNodeList.push(opNode)
        }
    },

    /**用户进入房间 */
    userEnterRoom(data) {
        let idx = HZModel.getUserChairIndex(data.chairID)
        let headcom = this._userList[idx]
        if (headcom) {
            headcom.init(data)
        }
        if (data.chairID == HZModel.getMyChairID()) {
            this.verifyZuobi(data)
        }
    },

    /**如果不是联盟创建，更新用户分数 */
    updateCurUserScore(curScores) {
        if (!HZModel.isUnionCreate()) {
            if (curScores && Array.isArray(curScores)) {
                for (let i = 0; i < curScores.length; i++) {
                    const s = curScores[i];
                    let idx = HZModel.getUserChairIndex(i)
                    let com = this._userList[idx]
                    if (com) com.setUserScore(s)
                }
            }
        }
    },

    /**恢复所有人的总输赢分数 */
    initTotalScore(userWinTotalScore) {
        if (userWinTotalScore && HZModel.scoreState()) {
            let len = Object.keys(userWinTotalScore)
            if (len.length > 0) {
                for (const chairId in userWinTotalScore) {
                    if (Object.hasOwnProperty.call(userWinTotalScore, chairId)) {
                        const s = userWinTotalScore[chairId];
                        let idx = HZModel.getUserChairIndex(chairId)
                        let com = this._userList[idx]
                        if (com) com.setTotalScore(s)
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
        let idx = HZModel.getUserChairIndex(data.chairID)
        let headcom = this._userList[idx]
        if (headcom) {
            headcom.leave()
        }
        if (data.uid == UserModel.getData('uid')) {
            if (!HZModel.getRoomID() ||
                HZModel.getRoomID() == data.roomID) {
                this.enterHall()
            }
        }
    },

    /**GPS定位检查 */
    verifyZuobi(roomUserInfo) {
        if (!HZModel.getGameRuleByKey("fangzuobi")) return;
        if (!roomUserInfo || roomUserInfo.chairID >= HZModel.getChairCount()) return;
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
        let idx = HZModel.getUserChairIndex(data.chairID)
        let com = this._userList[idx]
        if (com) com.setReady(true)
        if (data.chairID == HZModel.getMyChairID()) {
            this.btn_ready.active = false
        }
    },

    /**隐藏所有准备图标 */
    hideReadyIcon() {
        this._userList.forEach(userCom => {
            userCom.setReady(false)
        });
    },

    /**更新局数 */
    onGameRoundUpdate(data) {
        // console.log("更新局数==", data)
        HZModel.setCurBureau(data.curBureau)
        this.txt_round.string = `局数:${data.curBureau}/${HZModel.getMaxBureau()}`
        this.btn_invite.active = false
        this.btn_copy.active = false
        this.btn_leave.active = false
        this.btn_dismiss.active = data.curBureau != 0 && !HZModel.getGameRuleByKey("canNotDissmiss");
    },

    /**更新剩余牌数量 */
    onLastTilesCountUpdate(count) {
        this.txt_last.string = `剩${count}张`
    },

    /**更新庄家 */
    onBankerUpdate(chairID) {
        let idx = HZModel.getUserChairIndex(chairID)
        for (let index = 0; index < this._userList.length; index++) {
            let com = this._userList[index];
            if (!com) continue;
            com.setBanker(idx == index);
        }
    },

    /**游戏状态跳转 */
    onGameStatusUpdate(data) {
        // console.log("游戏状态==", data)
        this._gameStatus = data.gameStatus
        this.com_clock.setTick(data.tick)
        this.btn_ready.active = false
        this.btnBackHall.active = false
        this.hideReadyIcon()

        switch (this._gameStatus) {
            case ApiHz.gameStatus.NONE:
                HZModel.reset()
                this.resetTable()
                this.btn_ready.active = true
                break;
            case ApiHz.gameStatus.PIGSCORE:

                break;
            default:
                break;
        }
    },

    /**发牌 */
    onSendTiles(data, isAni) {
        HZModel.setHandCards(data.handCards)
        let lastOpt = HZModel.getLastOperate()
        for (let i = 0; i < data.handCards.length; i++) {
            if (!isAni) HZModel.delZimoCard(i, this._huPaiList[i]);
            let tiles = HZModel.getHandCards(i)
            let idx = HZModel.getUserChairIndex(i)
            let hcom = this._handTileMgrList[idx]
            if (hcom) {
                let drawTile = !!lastOpt && lastOpt.chairID == i && lastOpt.operate == ApiHz.operateType.GET ? lastOpt.card : null;
                let drawTileIndex = tiles.indexOf(drawTile);
                if (drawTileIndex >= 0) {
                    tiles.splice(drawTileIndex, 1);
                }
                hcom.updateStandTiles(tiles, null, isAni)
            }
        }
    },

    /**通知用户操作 */
    onGameTurn(data) {
        HZModel.onGameTurn(data)
        this.setTilesGary(-1)
        /**更新时间和位置 */
        this.com_clock.setDir(HZModel.getUserChairIndex(data.chairID))
        this.com_clock.setTick(data.tick)

        let idx = HZModel.getUserChairIndex(data.chairID)

        if (data.operateArray.includes(ApiHz.operateType.QI)) { //通知出牌
            for (let i = 0; i < this._handTileMgrList.length; i++) {
                const com = this._handTileMgrList[i];
                if (idx == i) {
                    if (data.card) { //摸牌
                        com.setDrawTile(data.card, true)
                        AssetsManager.playEffect({
                            path: 'res/audio/main/give',
                            bundle: Enums.bundleType.HZ
                        });
                    }
                    if (idx == 0)
                        com.setIsMyTurn()
                } else {
                    com.setNoTouch(true)
                }
            }
        }
        this.checkTingPai(data)
        if (data.operateArray.length > 1) {
            if (data.chairID == HZModel.getMyChairID()) {
                /**更新操作按钮 */
                this.com_opt.onGameTurn(data)
            }
        }

    },

    /**检查 听牌 */
    checkTingPai(data) {
        let idx = HZModel.getUserChairIndex(data.chairID)
        /**检查听牌 展示打听标记 */
        let tiles = HZModel.getHandCards(HZModel.getMyChairID())
        if (idx == 0) {
            let isZimo = false
            if ((tiles.length === 14 || data.card != null) && data.operateArray.includes(ApiHz.operateType.QI)) {
                isZimo = true
            }
            let tingList = HZLogic.getTingCards(tiles, HZModel.getGameRuleByKey("qidui"))
            if (tingList && tingList.length > 0) {
                let hcom = this._handTileMgrList[idx]
                if (hcom) hcom.setTingIcons(tingList)
            }
            this._tingList = tingList
        } else {
            /**不是自己操作 去掉打听标记 显示听牌按钮*/
            this._handTileMgrList[0].setTingIcons()
            let canWinList = HZLogic.getCanWinCards(tiles, HZModel.getGameRuleByKey("qidui"))
            this.btn_ting.active = canWinList.length > 0
            this._canWinList = canWinList
        }
    },

    showTingLight() {
        let tiles = HZModel.getHandCards(HZModel.getMyChairID())
        if (tiles.length >= 14) {
            return
        }
        let canWinList = HZLogic.getCanWinCards(tiles.slice(), HZModel.getGameRuleByKey("qidui"))
        if (canWinList && canWinList.length > 0) { //如果听牌，播放听牌光效
            let node = this._handTileMgrList[0].node
            let pos = CCUtil.postionConvert(node, this._operActNodeList[0])
            let com = this.genAniNode(this._operActNodeList[0], null, pos)
            com.node.scale = node.scale
            com.showTingLight()
        }
    },


    /**用户操作广播 */
    // card
    // chairID
    // operate
    onUserOpt(data) {
        HZModel.onUserOpt(data)
        this.setTilesGary(-1)
        if (data.chairID == HZModel.getMyChairID()) {
            this.com_opt.onUserOpt(data)
            this.com_ting.node.active = false
            this._handTileMgrList[0].setTingIcons()
        }
        let idx = HZModel.getUserChairIndex(data.chairID)
        let user = null,
            ucom = this._userList[idx]
        if (ucom) user = ucom.getUserData()
        let sex = 'nv';
        if (user) {
            sex = (user.userInfo.sex == 0) ? 'nan' : 'nv';
        }
        let typeNameList = ["chi", "peng", "gang", "hu", "zimo"]
        /**隐藏所有位置的摸的那张牌 */
        for (let i = 0; i < this._handTileMgrList.length; i++) {
            const com = this._handTileMgrList[i];
            if (com) {
                com.setDrawTile()
            }
        }
        /**上次摸的手牌 */
        let drawTile = null;
        if (data.operate == ApiHz.operateType.QI) {
            let moOpt = HZModel.getQiByMo(data);
            if (!!moOpt && moOpt.card != data.card) {
                drawTile = moOpt.card;
            }
        }
        /**更新手牌 */
        let tmp = UserModel.getData("isTest")
        if (!tmp || (tmp && idx == 0)) {
            let arr = HZModel.getHandCards(data.chairID)
            let hcom = this._handTileMgrList[idx]
            if (hcom) hcom.updateStandTiles(arr, drawTile)
        }

        let optPengGang = () => {
            /**刷新吃碰杠的牌 */
            let pengGangArray = HZModel.getPengGangArrayByChairID(data.chairID);
            // console.log("吃碰杠的牌", pengGangArray)
            let optCom = this._optTileMgrList[idx]
            if (optCom) optCom.updateOptTiles(pengGangArray)
            /**删掉桌子上的牌 */
            let lastOut = HZModel.getLastOutCardRecord()
            if (lastOut) {
                let i = HZModel.getUserChairIndex(lastOut.chairID)
                this._disTileMgrList[i].afterOptUpdateTiles(lastOut.card)
                this.updatePointer()
            }
        }

        let optHu = () => {
            /** 亮出胡的牌 */
            let hcom = this._handTileMgrList[idx]
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
            let lo = HZModel.getLastOutCardRecord();
            if (lo) {
                let i = HZModel.getUserChairIndex(lo.chairID);
                this._disTileMgrList[i].afterOptUpdateTiles(lo.card);
                this.updatePointer();
            }
            this._huPaiList[data.chairID] = data.card
        }

        let showAni = (type) => {
            /**声音 */
            if (type < typeNameList.length) {
                AssetsManager.playEffect({
                    path: `res/audio/${sex}/${typeNameList[type]}`,
                    bundle: Enums.bundleType.HZ
                });
            }
            /**展示动画 */
            let com = this.genAniNode(this._operActNodeList[idx])
            com.showOpt(type)
        }

        switch (data.operate) {
            case ApiHz.operateType.QI: //出牌
                AssetsManager.playEffect({
                    path: `res/audio/${sex}/` + data.card,
                    bundle: Enums.bundleType.HZ
                });
                AssetsManager.playEffect({
                    path: 'res/audio/main/push',
                    bundle: Enums.bundleType.HZ
                });
                if (idx == 0) {
                    this._handTileMgrList[0].setNoTouch(true)
                }
                /**更新桌子上的牌 */
                let out = HZModel.getOutTiles(data.chairID)
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
            case ApiHz.operateType.CHI: //吃牌
                showAni(0)
                optPengGang()
                break;
            case ApiHz.operateType.PENG: //碰牌
                showAni(1)
                optPengGang()
                break;
            case ApiHz.operateType.GANG_BU: //补杠
                showAni(2)
                optPengGang()
                break;
            case ApiHz.operateType.GANG_CHI: //吃杠
                showAni(2)
                optPengGang()
                break;
            case ApiHz.operateType.GANG_ZHI: //暗杠
                showAni(2)
                optPengGang()
                break;
            case ApiHz.operateType.HU_CHI: //接炮
                showAni(3)
                optHu()
                break;
            case ApiHz.operateType.HU_ZHI: //自摸
                showAni(4)
                optHu()
                break;
            case ApiHz.operateType.HU_QIANG: //抢杠
                showAni(3)
                optHu()
                break;
            default:
                break;
        }
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
            let acom = aniNode.getComponent("HZOperAct")
            return acom
        }
        return null
    },

    /**更新指示器位置*/
    updatePointer(lastTile) {
        if (!cc.isValid(lastTile)) {
            this.pointer.active = false
            return
        }
        this.scheduleOnce(() => {
            const pos = CCUtil.postionConvert(lastTile, this.node)
            this.pointer.setPosition(pos)
            this.pointer.active = true
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
        });
        this._operActNodeList.forEach(n => {
            n.removeAllChildren()
        })

        this.deleteFlyNode()
        this._huPaiList = []
        this.btn_ting.active = false
        this.com_ting.node.active = false
        this.com_clock.setDir(-1)
        this.com_clock.setTick(0)
        this.updatePointer()
        this.setTilesGary(-1)
    },

    /**手牌点击，牌被抬起来 */
    onTileUp(tileCom) {
        /**打听显示 */
        if (this._tingList.includes(tileCom.flower)) {
            let myTiles = HZModel.getHandCards(HZModel.getMyChairID())
            let idx = myTiles.indexOf(tileCom.flower)
            if (idx != -1) {
                myTiles.splice(idx, 1)
            }
            let canWinList = HZLogic.getCanWinCards(myTiles, HZModel.getGameRuleByKey("qidui"))
            if (canWinList.length > 0) {
                for (let i = 0; i < canWinList.length; i++) {
                    let item = canWinList[i];
                    item.count = HZModel.getRestCardCount(item.card)
                }
                this.com_ting.showWinCards(canWinList)
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
        let fidx = HZModel.getUserChairIndex(fromChairID)
        let tidx = HZModel.getUserChairIndex(toChairID)
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
        let tmp = UserModel.getData("isTest")
        this.btn_shezhi.active = false
    },

    showTestCard() {
        let tmp = UserModel.getData("isTest")
        if (tmp) {
            ApiRoom.gameMessageNotify(ApiHz.gameLookCardsNotify(HZModel.getMyChairID()));
        }
    },

    /**删除有可能存在的拖动牌 */
    deleteMoveNode() {
        let p = AssetsManager.getRoot()
        let n = p.getChildByName("moveNode")
        if (cc.isValid(n)) {
            n.destroy()
        }
    },

    /**删除有可能存在的飞行牌 */
    deleteFlyNode() {
        let p = AssetsManager.getRoot()
        let f = p.getChildByName("flyNode")
        if (cc.isValid(f)) {
            f.destroy()
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
        // console.log("按钮响应==", event.target.name, event)

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
                if (HZModel.getCurBureau() == 0) {
                    ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
                } else {
                    AssetsManager.tipDialog('现在不能退出游戏');
                }
                break;
            case "btn_ready": //准备
                ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify(true));
                this.btn_ready.active = false
                break;
            case "btn_dismiss": //解散
                this._onMenuCloseClick();
                AssetsManager.popDialog({
                    content: '是否确定发出解散申请？',
                    ok: () => {
                        ApiRoom.roomMessageNotify(ApiRoom.getAskForDismissNotifyData({
                            isExit: true
                        }));
                    },
                    no: () => { }
                });
                break;
            case "btn_refresh": //刷新
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 10)) {
                    return;
                }
                AssetsManager.tipDialog('刷新界面可以修复游戏显示问题');
                this.getRoomSceneInfo()
                break;
            case "btn_setting": //设置
                this._onMenuCloseClick();
                AssetsManager.setDialog({
                    type: "mahjong",
                    gameType: Enums.bundleType.HZ,
                    musicType: Enums.bundleType.MAHJONG,
                });
                break;
            case "btn_review": //回看
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 1)) {
                    return;
                }
                ApiRoom.gameMessageNotify(ApiHz.gameReviewNotify());
                break;
            case "btn_msg": //聊天
                if (CCUtil.clickInterval(event.target, 1)) {
                    return;
                }
                let params = {
                    gameRule: HZModel.getGameRule(),
                    chat: (chat) => {
                        ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
                    }
                }
                AssetsManager.chatDialog(params);
                break;
            case "btn_roomInfo": //规则
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 1)) {
                    return;
                }
                let rule = HZModel.getGameRule()
                if (!rule) {
                    return
                }
                AssetsManager.tableDialog({
                    gameRule: rule,
                });
                break;
            case "btn_ting": //听牌
                if (this._canWinList.length > 0 && this.com_ting.node.active == false) {
                    for (let i = 0; i < this._canWinList.length; i++) {
                        let item = this._canWinList[i];
                        item.count = HZModel.getRestCardCount(item.card)
                    }
                    this.com_ting.showWinCards(this._canWinList)
                } else {
                    this.com_ting.node.active = false
                }
                break;
            case "btn_location": //定位
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 1)) {
                    return;
                }
                let users = []
                for (let i = 0; i < this._userList.length; i++) {
                    const u = this._userList[i];
                    let data = u.getUserData()
                    if (data) {
                        users.push(data)
                    }
                }
                AssetsManager.locationDialog({
                    users: users,
                    chairCount: HZModel.getChairCount(),
                    fangzuobi: HZModel.getGameRuleByKey('fangzuobi')
                })
                break;
            case "btn_deposit": //开始托管
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 1)) {
                    return;
                }
                ApiRoom.gameMessageNotify(ApiHz.gameTrushNotify(true));
                break;
            case "btn_quxiaotuoguan": //取消托管
                if (CCUtil.clickInterval(event.target, 1)) {
                    return;
                }
                ApiRoom.gameMessageNotify(ApiHz.gameTrushNotify(false));
                break;
            case "btn_invite": //邀请
                let gameRule = HZModel.getGameRule()
                gameRule = gameRule || {};
                gameRule.roomId = HZModel.getRoomID();
                let share = ConfigModel.getRoomRuleShare(gameRule);
                NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
                break;
            case "btn_copy": //复制
                let str = ConfigModel.getRoomShare(Enums.bundleType.HZ, HZModel.getRoomID())
                NativeUtil.copyText(str);
                break;
            case "btn_back":
                this.enterHall()
                break;
            default:
                break;
        }
    },

    // 邀请好友
    onShowInvite() {
        AssetsManager.friendDialog({
            gameRule: HZModel.getGameRule(),
        })
    },
    /**消息监听 */
    messageCallbackHandler(route, msg) {
        if (route === 'RoomMessagePush') {
            if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
                // console.log('gameInit=============================', msg.data);
                this.gameInit(msg.data);
            } else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
                this.userEnterRoom(msg.data.roomUserInfo);
                this.verifyZuobi(msg.data.roomUserInfo);
            } else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
                this.userLeaveRoom(msg.data.roomUserInfo)
            } else if (msg.type === ApiRoom.USER_READY_PUSH) {
                // console.log("收到了玩家准备==", msg.data)
                this.onUserReady(msg.data)
            } else if (msg.type === ApiRoom.GAME_END_PUSH) {
                // console.log("游戏结束《《《《《《《《《", msg)
            } else if (msg.type === ApiRoom.ROOM_DISMISS_PUSH) {
                // console.log("房间被解散《《《《《《《《《《《", msg)
            } else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
                msg.data.myChairID = HZModel.getMyChairID();
                AssetsManager.nisDialog(msg.data);
            } else if (msg.type === ApiRoom.USER_GIFT_SEND_PUSH) {
                this.onGift(msg.data.fromChairID, msg.data.toChairID, msg.data.giftID);
            } else if (msg.type === ApiRoom.USER_VOICE_PUSH) {
                this._voiceMsgQueue.push(msg.data);
            } else if (msg.type === ApiRoom.USER_OFF_LINE_PUSH) {
                let idx = HZModel.getUserChairIndex(msg.data.chairID)
                let com = this._userList[idx]
                if (com) com.setOffline(true)
            } else if (msg.type === ApiRoom.ROOM_USER_INFO_CHANGE_PUSH) { //用户信息刷新
                this._userList.forEach(com => {
                    if (com) {
                        com.userInfoChange(msg.data)
                    }
                });
            } else if (msg.type === ApiRoom.ROOM_USER_WIN_TOTAL_PUSH) {
                /**玩家总输赢分数 */
                // console.log("玩家总输赢==", msg.data)
                this.initTotalScore(msg.data.userWinTotalScore)
            } else if (msg.type === ApiRoom.USER_CHAT_PUSH) {
                let idx = HZModel.getUserChairIndex(msg.data.chairID)
                let com = this._userList[idx]
                if (com) {
                    com.gameChat(msg.data)
                }
            }
        } else if (route === 'GameMessagePush') {
            if (msg.type === ApiHz.GAME_BUREAU_PUSH) {
                MessageCallback.emitMessage('RemoveGameResult');
                this.onGameRoundUpdate(msg.data)
            } else if (msg.type === ApiHz.GAME_STATUS_PUSH) { //游戏状态
                HZModel.setGameStatus(msg.data.gameStatus)
                this.onGameStatusUpdate(msg.data)
                this.com_mapai.showMaPai()
            } else if (msg.type === ApiHz.GAME_SEND_CARDS_PUSH) { //发牌
                this.deleteMoveNode()
                this.onSendTiles(msg.data, true)
                this.showTestCard()
            } else if (msg.type === ApiHz.GAME_TURN_OPERATE_PUSH) {
                // console.log("有用户操作了牌==", msg.data)
                this.deleteMoveNode()
                this.onUserOpt(msg.data)
                this.showTestCard()
            } else if (msg.type === ApiHz.GAME_TURN_PUSH) {
                // console.log("通知该谁操作", msg.data)
                this.deleteMoveNode()
                this.onGameTurn(msg.data)
            } else if (msg.type === ApiHz.GAME_BANKER_PUSH) { //庄家位置更新
                this.onBankerUpdate(msg.data.bankerChairID)
            } else if (msg.type === ApiHz.GAME_REST_CARDS_COUNT_PUSH) { //剩余牌数量更新
                this.onLastTilesCountUpdate(msg.data.restCardsCount)
            } else if (msg.type === ApiHz.GAME_END_PUSH) {
                UserModel.setData('roomID', '');
                if (msg.data.result.length > 0) {
                    msg.data.enterHall = this.enterHall.bind(this);
                    msg.data.mjMainDialog = this;
                    msg.data.isBureauFull = (HZModel.getCurBureau() == HZModel.getMaxBureau());
                } else {
                    this.enterHall();
                }
            } else if (msg.type === ApiHz.GAME_REVIEW_PUSH) {
                let reviewRecord = msg.data.reviewRecord
                if (reviewRecord && reviewRecord.length > 0) {
                    AssetsManager.createDialog({
                        bundle: Enums.bundleType.HZ,
                        path: "res/prefab/HZResultDialog",
                        reviewRecord: reviewRecord,
                    });
                } else {
                    AssetsManager.tipDialog('没有数据');
                }
            } else if (msg.type === ApiHz.GAME_RESULT_PUSH) {
                this.deleteMoveNode()
                this.com_mapai.showMaPai(msg.data.result)
                msg.data.enterHall = this.enterHall.bind(this);
                msg.data.mjMainDialog = this;
                msg.data.isBureauFull = (HZModel.getCurBureau() == HZModel.getMaxBureau());
                msg.data.path = "res/prefab/HZResultDialog";
                msg.data.isResult = true
                msg.data.bundle = Enums.bundleType.HZ;
                AssetsManager.createDialog(msg.data);

                /**如果不是联盟创建 更新用户分数 */
                this.updateCurUserScore(msg.data.result.curScores)
            } else if (msg.type == ApiHz.GAME_DISMISS_PUSH) {
                let date = Utils.getDateFormat();
                if (msg.data.userArray) {
                    this.showMJAllResultFunc = () => {
                        this.showMJAllResultFunc = null;
                        msg.data.isUnionCreate = HZModel.isUnionCreate();
                        msg.data.enterHall = this.enterHall.bind(this);
                        msg.data.roomDismissReason = msg.data.reason;
                        msg.data.path = 'res/prefab/HZAllResult';
                        msg.data.bundle = Enums.bundleType.HZ;
                        msg.data.myUnionScore = 0
                        msg.data.date = date.yyyymmddhhmmss;
                        msg.data.roomID = HZModel.getRoomID();
                        if (msg.data.isUnionCreate) { //获取自己的联盟分数
                            for (let i = 0; i < this._userList.length; i++) {
                                const u = this._userList[i];
                                let userData = u.getUserData()
                                if (userData && userData.userInfo.uid == UserModel.getData("uid")) {
                                    msg.data.myUnionScore = userData.userInfo.score
                                    break;
                                }
                            }
                        }
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
            } else if (msg.type === ApiHz.GAME_LOOK_CARDS_PUSH) {
                if (!msg.data.userArray || !Array.isArray(msg.data.userArray) || !Array.isArray(msg.data.userArray[0])) {
                    // console.log("没有数据！")
                    return
                }
                HZModel.setHandCards(msg.data.userArray)
                for (let i = 0; i < msg.data.userArray.length; i++) {
                    let idx = HZModel.getUserChairIndex(i)
                    if (idx != 0) {
                        HZModel.delZimoCard(i, this._huPaiList[i])
                        let hand = HZModel.getHandCards(i)
                        if (hand && hand.length > 0) {
                            let hcom = this._handTileMgrList[idx]
                            if (hcom) hcom.updateLieTiles(hand, this._huPaiList[i])
                        }
                    }
                }
            } else if (msg.type === ApiHz.GAME_TRUST_PUSH) {
                if (msg.data.chairID == HZModel.getMyChairID()) {
                    this.tuoguan.active = msg.data.trust;
                }
            }
        } else if (route === 'ReconnectSuccess') {
            this.getRoomSceneInfo();
        } else if (route === 'SelfEntryRoomPush') {
            if (msg.gameType != HZModel.getBundleType()) {
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