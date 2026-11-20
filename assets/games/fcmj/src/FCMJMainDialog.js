const ApiFcmj = require('./ApiFcmj');
const ApiRoom = require('../../../src/api/ApiRoom');;
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const MessageCallback = require('../../../src/utils/MessageCallback');
const UserModel = require('../../../src/model/UserModel');
const Codes = require('../../../src/const/Codes');
const ConfigModel = require('../../../src/model/ConfigModel');
const NativeUtil = require('../../../src/utils/NativeUtil');
const FCMJModel = require('./FCMJModel');
const FCMJLogic = require('./FCMJLogic');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const SubManager = require('../../../src/utils/SubManager');
const Events = require('../../../src/const/Events');

cc.Class({
    extends: cc.Component,

    properties: {
        com_opt: require("FCMJOperate"),
        com_clock: require("FCMJClock"),
        com_ting: require("FCMJTingTips"),
        com_baoPai: require("FCMJBaoPai"),
        readyTick: require('FCMJReadyTick'),
        txt_name: cc.Label,
        txt_round: cc.Label,
        txt_roomId: cc.Label,
        txt_last: cc.Label,
        txt_baseScore: cc.Label,
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
        btnBackHall: cc.Node,
        btnYuYin: cc.Node,
        canNotDismissBar: cc.Node,
        headPfbLeft: cc.Prefab,
        headPfbRight: cc.Prefab,
        fenPaiZhong: cc.Node,
        yaobao2: cc.Node,

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

    onLoad() {
        AssetsManager.init(this.node);
        // 菜单点击
        this.menuLay.active = false;
        this.txt_name.string = `${ConfigModel.getGameName(Enums.bundleType.FCMJ)}`;
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
        ConfigModel.setData('lastScene', 'FCMJ');
        AssetsManager.release();
    },

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
            FCMJModel.setGameInit(false)
            ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
        } else {
            this.enterHall();
        }
    },

    /**返回大厅 */
    enterHall() {
        let isUnionCreate = FCMJModel.isUnionCreate();
        let unionID = !!isUnionCreate ? FCMJModel.getRoomCreatorByKey('unionID') : null;
        SubManager.exitBundle(unionID);
    },

    /**初始化和断线重连 */
    gameInit(data) {
        console.log("init=========", data)
        MessageCallback.emitMessage('RemoveGameResult');
        this.unscheduleAllCallbacks();
        this.resetTable();
        FCMJModel.init(data);
        FCMJLogic.initRule(data.gameRule)
        let isTest = UserModel.getData("isTest");
        this._gameStatus = data.gameData.gameStatus;
        let lastOpt = FCMJModel.getLastOperate();
        let myUid = FCMJModel.getMyUID();
        let users = FCMJModel.getUsers();
        let operateUid = data.gameData.operateUid;
        this.com_clock.gameInit(FCMJModel.getChairCount(), FCMJModel.getMyChairID())
        if (this._gameStatus == ApiFcmj.gameStatus.NONE && FCMJModel.getCurBureau() == 0) {
            this.com_clock.node.active = false;
        } else {
            this.com_clock.node.active = true;
        }
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
        let unionID = FCMJModel.isUnionCreate() ? FCMJModel.getRoomCreatorByKey('unionID') : null;
        let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
        this.btn_invite.active = FCMJModel.getCurBureau() == 0 && !!isShowInvite;
        this.btn_copy.active = FCMJModel.getCurBureau() == 0 && !!isShowInvite;
        this.btn_location.active = !!FCMJModel.getGameRuleByKey('showGps');
        this.btn_ready.active = (this._gameStatus === ApiFcmj.gameStatus.NONE && data.gameData.userPlayStatus[myUid] == ApiRoom.userStatusEnum.NONE);
        this.btn_leave.active = data.gameData.curBureau == 0;
        this.btn_dismiss.active = data.gameData.curBureau != 0 && !FCMJModel.getGameRuleByKey("canNotDissmiss");
        this.btnBackHall.active = data.gameData.curBureau == 0 && FCMJModel.isUnionCreate();
        let yuyin = FCMJModel.getGameRuleByKey('yuyin');
        this.btnYuYin.active = !!yuyin && ConfigModel.getData('voiceSpeaker');
        let tm = FCMJModel.getGameRuleByKey("trustTm")
        this.btn_deposit.active = tm && tm > 0;
        if (this.btn_ready.active && FCMJModel.getCurBureau() == 0 && FCMJModel.getGameRuleByKey("unReadyKick") > 0) {
            let tick = FCMJModel.getGameRuleByKey("unReadyKick") || 10;
            this.readyTick.sync(tick);
        } else {
            this.readyTick.sync(0);
        }
        if (this.canNotDismissBar) this.canNotDismissBar.active = FCMJModel.getGameRuleByKey("canNotDissmiss");
        /**房间号和局数 */
        this.txt_roomId.string = `房号:${data.roomID}`;
        this.txt_round.string = `${data.gameData.curBureau}/${data.gameData.maxBureau}局`;
        this.txt_baseScore.string = `底:${FCMJModel.getGameRuleByKey("baseScore")} `
        let fd = FCMJModel.getGameRuleByKey("fengDing")
        this.txt_baseScore.string += (fd == 0 ? "不封顶" : `顶:${fd}`)
        this.onLastTilesCountUpdate(data.gameData.restCardsCount);
        this.showTest();
        if (this._gameStatus > ApiFcmj.gameStatus.DICES) {
            //如果是自己的轮次 并且上一次打牌的人不是自己时删除最近一次摸的牌
            if (!!lastOpt && lastOpt.operate == ApiFcmj.operateType.GET) {
                let idx = FCMJModel.getUserIndexByUID(lastOpt.uid);
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
                let idx = FCMJModel.getUserIndexByUID(user.uid);
                /**恢复吃碰杠的牌 */
                let pengGangArray = FCMJModel.getPengGangArrayByUID(user.uid);
                if (pengGangArray.length > 0 && !!this._optTileMgrList[idx]) {
                    this._optTileMgrList[idx].updateOptTiles(pengGangArray);
                }
                /**恢复打出的牌 */
                let out = FCMJModel.getOutTilesByUID(user.uid);
                if (out.length > 0 && !!this._disTileMgrList[idx]) {
                    let last = this._disTileMgrList[idx].showOutTiles(out);
                    if (data.gameData.lastOperateUid == user.uid &&
                        !!last &&
                        last.flower == data.gameData.operateCard) {
                        this.updatePointer(last.node)
                    }
                }
            }

            if (this._gameStatus === ApiFcmj.gameStatus.PLAYING) {
                /**恢复方向指示 */
                let idx = FCMJModel.getUserIndexByUID(operateUid);
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
                let caozuoCard = data.gameData.caozuoCard
                if (caozuoCard && Array.isArray(caozuoCard)) {
                    for (let i = 0; i < caozuoCard.length; i++) {
                        let c = caozuoCard[i];
                        if (c && typeof (c) == "number") {
                            let idx = FCMJModel.getUserIndexByChairID(i)
                            let hcom = this._handTileMgrList[idx]
                            if (hcom) hcom.setHuTile(c)
                            // console.log("设置了胡的牌==", idx, c)
                        }
                    }
                }
                this.checkTingPai();

                /**恢复瑶宝 */
                let yaoBaoUser = data.gameData.yaoBaoUser
                if (yaoBaoUser) {
                    let baoType = [ApiFcmj.yaoBaoType.YAO, ApiFcmj.yaoBaoType.GEN]
                    let baoCount = FCMJModel.getGameRuleByKey("baoCount")
                    let baoList = new Array(baoCount).fill(0)
                    if (isTest && data.gameData.baoCards && data.gameData.baoCards.length > 0) {
                        baoList = data.gameData.baoCards
                    }
                    for (const uid in yaoBaoUser) {
                        if (Object.hasOwnProperty.call(yaoBaoUser, uid)) {
                            const user = yaoBaoUser[uid];
                            if (uid == FCMJModel.getMyUID() && baoType.includes(user.type)) {
                                this.com_opt.showYaoBao(user.type)
                            }
                            if (user.type == ApiFcmj.yaoBaoType.YAOED) {
                                this.com_baoPai.showBaoPai(baoList)
                            }
                            if ((user.type == ApiFcmj.yaoBaoType.YAOED || user.type == ApiFcmj.yaoBaoType.GENED)) {
                                if (uid == FCMJModel.getMyUID()) {
                                    FCMJModel.setSelfIsYaoBao(true)
                                }
                                let idx = FCMJModel.getUserIndexByUID(uid)
                                let com = this._userList[idx]
                                if (com) com.setBaoIcon(true)
                            }
                        }
                    }
                }
            } else {
                this.btn_ting.active = false;
            }
        }
        /**恢复托管标记 */
        let userTrustArray = data.gameData.autoUser
        if (userTrustArray) {
            this.tuoguan.active = userTrustArray[FCMJModel.myUid]
        }
        FCMJModel.setGameInit(true)
    },

    /**判断人数，初始化头像位置 */
    seatsInit() {
        if (this._userList.length > 0) {
            return
        }
        let chairCount = FCMJModel.getChairCount();
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
            this._userList.push(headNode.getComponent("FCMJHead"));
            this._userList[i].initRes();
            let handTile = cc.find("tableInfo/handTiles" + idx, this.node);
            let optTile = cc.find("tableInfo/optTiles" + idx, this.node);
            if (!optTile) {
                optTile = cc.find("optTiles" + idx, handTile);
            }
            let disTile = cc.find("tableInfo/outTiles" + idx, this.node);
            this._handTileMgrList.push(handTile.getComponent("FCMJHandTileMgr"));
            this._handTileMgrList[i].init(idx);
            this._optTileMgrList.push(optTile.getComponent("FCMJOptTileMgr"));
            this._optTileMgrList[i].init(i);
            this._disTileMgrList.push(disTile.getComponent("FCMJOutTileMgr"));
            this._disTileMgrList[i].init(idx);

            let opNode = cc.find("operAct" + idx, this.node);
            this._operActNodeList.push(opNode);
        }
    },

    /**用户进入房间 */
    userEnterRoom(data) {
        let idx = FCMJModel.getUserIndexByUID(data.uid);
        let headcom = this._userList[idx]
        if (headcom) {
            headcom.init(data)
        }
    },

    /**恢复所有人的总输赢分数 */
    initTotalScore(userWinTotalScore) {
        if (userWinTotalScore && FCMJModel.scoreState()) {
            let len = Object.keys(userWinTotalScore)
            if (len.length > 0) {
                for (const uid in userWinTotalScore) {
                    if (Object.hasOwnProperty.call(userWinTotalScore, uid)) {
                        const s = userWinTotalScore[uid];
                        let idx = FCMJModel.getUserIndexByUID(uid);
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
        let idx = FCMJModel.getUserIndexByChairID(data.chairID);
        let headcom = this._userList[idx];
        if (headcom) {
            headcom.leave();
        }
        if (data.uid == UserModel.getData('uid')) {
            if (!FCMJModel.getRoomID() ||
                FCMJModel.getRoomID() == data.roomID) {
                this.enterHall();
            }
        }
    },

    /**GPS定位检查 */
    verifyZuobi(roomUserInfo) {
        if (!FCMJModel.getGameRuleByKey("fangzuobi")) return;
        if (!roomUserInfo || roomUserInfo.chairID >= FCMJModel.getChairCount()) return;
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
        let distanceLimit = parseInt(FCMJModel.getGameRuleByKey('distanceLimit'));
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
        let idx = FCMJModel.getUserIndexByChairID(data.chairID);
        let com = this._userList[idx];
        if (com) com.setReady(true);
        if (data.chairID == FCMJModel.getMyChairID()) {
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
        this.btn_copy.active = false;
        this.btn_leave.active = false;
        this.btn_invite.active = false;
        FCMJModel.setCurBureau(data.curBureau);
        this.btnBackHall.active = data.curBureau == 0;
        MessageCallback.emitMessage('RemoveGameResult');
        this.btn_dismiss.active = data.curBureau != 0 && !FCMJModel.getGameRuleByKey("canNotDissmiss");
        this.txt_round.string = `${data.curBureau}/${FCMJModel.getMaxBureau()}局`;
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
        let idx = FCMJModel.getUserIndexByUID(data.uid);
        let com = this._userList[idx];
        if (com) com.setBanker(true);
    },

    /**游戏状态跳转 */
    onGameStatusUpdate(data) {
        this._gameStatus = data.gameStatus;
        if (this._gameStatus == ApiFcmj.gameStatus.NONE ||
            this._gameStatus == ApiFcmj.gameStatus.DICES) {
            this.onLastTilesCountUpdate(0);
        }
        this.com_clock.setTick(data.tick);
        this.com_clock.hideDice();
        this.hideReadyIcon();
        this.btn_ready.active = FCMJModel.getCurBureau() == 0 && this._gameStatus == ApiFcmj.gameStatus.NONE;
        this.readyTick.sync(0);
        switch (this._gameStatus) {
            case ApiFcmj.gameStatus.NONE:
                FCMJModel.reset();
                this.resetTable();
                break;
            case ApiFcmj.gameStatus.PLAYING:
                this._handTileMgrList[0].setAllTilesDown();
                break;
            default:
                break;
        }
    },

    /**发牌 */
    onSendTiles(data, isAni) {
        let isTest = UserModel.getData('isTest');
        FCMJModel.setGhostCard(data.laiZiCards);
        FCMJModel.setHandCards(data.handCards);
        let lastOpt = FCMJModel.getLastOperate();

        if (!data.handCards) return;
        let handCards = data.handCards;
        for (const uid in handCards) {
            let user = FCMJModel.getUserByUID(uid);
            if (!user) continue;
            handCards[uid] = handCards[uid] || [];
            let tiles = handCards[uid].slice();
            tiles = FCMJModel.sortTiles(tiles);
            let idx = FCMJModel.getUserIndexByUID(uid);
            let hcom = this._handTileMgrList[idx];
            if (!hcom) continue;
            let isMoPai = !!lastOpt && lastOpt.uid == uid && lastOpt.operate == ApiFcmj.operateType.GET
            let drawTile = isMoPai ? lastOpt.card : null;
            if (idx == 0 || !isTest) {
                if (isMoPai) {
                    if (idx == 0) {
                        let drawTileIndex = tiles.indexOf(drawTile);
                        if (drawTileIndex >= 0) {
                            tiles.splice(drawTileIndex, 1);
                        }
                    } else {
                        tiles.splice(0, 1);
                    }
                }
                hcom.updateStandTiles(tiles, null, isAni);
            } else {
                if (isMoPai) {
                    let drawTileIndex = tiles.indexOf(drawTile);
                    if (drawTileIndex >= 0) {
                        tiles.splice(drawTileIndex, 1);
                    }
                }
                hcom.updateLieTiles(tiles, null);
            }
        }
    },

    /**通知用户操作 */
    onGameTurn(data) {
        this.setTilesGary(-1);
        FCMJModel.onGameTurn(data);
        this.com_clock.setDir(FCMJModel.getUserIndexByUID(data.uid));
        this.com_clock.setTick(data.tick);
        let isTest = UserModel.getData('isTest');
        /**更新时间和位置 */
        let idx = FCMJModel.getUserIndexByUID(data.uid);
        if (data.operateArray) {
            let isGet = data.operateArray.some(opt => opt.type == ApiFcmj.operateType.GET)
            let isQi = data.operateArray.some(opt => opt.type == ApiFcmj.operateType.QI)
            if (isGet || isQi) {
                //通知出牌
                let isMoPai = isGet || data.card != null;
                let canNotOutCard = data.plusInfo && data.plusInfo.canNotOutCard //海底的时候不允许出牌
                this.fenPaiZhong.active = canNotOutCard
                let isBao = data.plusInfo && data.plusInfo.isBao //摸的牌是不是宝牌
                for (let i = 0; i < this._handTileMgrList.length; i++) {
                    const comp = this._handTileMgrList[i];
                    if (!comp) continue;
                    if (idx == i) {
                        if (isMoPai && (idx == 0 || !isTest)) {
                            comp.setDrawTile(data.card, idx == 0, isBao);
                        } else if (isMoPai && !!isTest && idx != 0) {
                            comp.setHuTile(data.card, isBao);
                        }
                        AssetsManager.playEffect({
                            path: 'res/audio/main/draw',
                            bundle: Enums.bundleType.FCMJ
                        });
                        if (idx == 0 && isQi && !canNotOutCard) {
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
        let gameStatus = FCMJModel.getGameStatus();
        let operateUid = FCMJModel.getCurOptUID();
        let myUid = FCMJModel.getMyUID();
        // console.log("恢复听牌===", operateUid, myUid)
        let idx = FCMJModel.getUserIndexByUID(myUid);
        let hcom = this._handTileMgrList[idx];
        let handCards = FCMJModel.getHandCards(myUid);
        let winHandChecks = handCards.slice();
        let tingHandChecks = handCards.slice();
        let pgList = FCMJModel.getPengGangArrayByUID(FCMJModel.getMyUID())
        if (operateUid != myUid) {
            /**不是自己操作 去掉打听标记 显示听牌按钮*/
            if (hcom) hcom.setTingIcons();
            let winTingFilter = FCMJModel.tingFilter(null, winHandChecks);
            let canWinList = FCMJLogic.getTingList(winTingFilter.cards, winTingFilter.ghostCardsCount, pgList);
            this.btn_ting.active = canWinList.length > 0;
            let ghostCard = FCMJModel.getGhostCard();
            if (canWinList.length > 0 && ghostCard.length > 0) {
                for (let i = 0; i < ghostCard.length; i++) {
                    const card = ghostCard[i];
                    let ghostCheck = canWinList.find((info) => {
                        return info.cardID == card
                    });
                    if (!ghostCheck) {
                        canWinList.push({
                            cardID: card,
                            rate: 1
                        })
                    }
                }
            }
            this._canWinList = canWinList;
        } else if (operateUid == myUid) {
            let tingCards = [];
            this._tingList = [];
            //判断是否需要删除手牌
            let repeatFilter = Array.from(new Set(tingHandChecks));
            for (const cardId of repeatFilter) {
                let copyTingHandCards = tingHandChecks.slice();
                let tingFilter = FCMJModel.tingFilter(cardId, copyTingHandCards);
                let canTingList = FCMJLogic.getTingList(tingFilter.cards, tingFilter.ghostCardsCount, pgList);
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
        let tiles = FCMJModel.getHandCards(FCMJModel.getMyUID())
        if (tiles.length >= 14) {
            return
        }
        let pgList = FCMJModel.getPengGangArrayByUID(FCMJModel.getMyUID())
        let winTingFilter = FCMJModel.tingFilter(null, tiles.slice());
        let canWinList = FCMJLogic.getTingList(winTingFilter.cards, winTingFilter.ghostCardsCount, pgList);
        if (canWinList && canWinList.length > 0) { //如果听牌，播放听牌光效
            let node = this._handTileMgrList[0].node
            let pos = CCUtil.postionConvert(node, this._operActNodeList[0])
            let com = this.genAniNode(this._operActNodeList[0], null, pos)
            com.node.scale = node.scale
            com.showTingLight()
        }
    },

    syncViewAudio(uid, audioName) {
        if (!uid) return false;
        let sex = FCMJModel.getUserSexByUID(uid);
        AssetsManager.playEffect({
            bundle: Enums.bundleType.FCMJ,
            path: `res/audio/${sex}/${audioName}`,
        });
    },

    /**用户操作广播 */
    onUserOpt(data) {
        FCMJModel.onUserOpt(data);
        this.deleteMoveNode();
        let isTest = UserModel.getData("isTest");
        this.setTilesGary(-1);
        if (data.uid == FCMJModel.getMyUID()) {
            this.com_opt.onClearTurn();
            this.com_ting.node.active = false;
            this._handTileMgrList[0].setTingIcons();
        }
        let idx = FCMJModel.getUserIndexByUID(data.uid);
        let user = null,
            ucom = this._userList[idx];
        if (ucom) user = ucom.getUserData();
        let sex = user && user.userInfo.sex == 0 ? 'nan' : 'nv';
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
        if (data.operate == ApiFcmj.operateType.QI) {
            let moOpt = FCMJModel.getQiByMo(data);
            if (!!moOpt && moOpt.card != data.card) {
                drawTile = moOpt.card;
            }
        }
        /**更新手牌 */
        let hcom = this._handTileMgrList[idx];
        let handCards = FCMJModel.getHandCards(data.uid);
        if (!hcom) return;
        if (idx != 0 && !!isTest) {
            hcom.updateLieTiles(handCards);
        } else {
            drawTile = idx == 0 ? drawTile : null;
            hcom.updateStandTiles(handCards, drawTile);
        }
        let optPengGang = () => {
            let pengGangArray = FCMJModel.getPengGangArrayByUID(data.uid);
            let optCom = this._optTileMgrList[idx];
            if (optCom) optCom.updateOptTiles(pengGangArray);
            let lastOut = FCMJModel.getLastOutCardRecord();
            if (!!lastOut.isDel) {
                let localIndex = FCMJModel.getUserIndexByUID(lastOut.opt.uid);
                this._disTileMgrList[localIndex].afterOptUpdateTiles(lastOut.opt.card);
                this.updatePointer();
            }
        }

        let optHu = () => {
            /** 亮出胡的牌 */
            let hcom = this._handTileMgrList[idx];
            let isBao = data.plusInfo && data.plusInfo.isBao
            if (hcom) {
                let huNode = hcom.setHuTile(data.card, isBao)
                let optNode = this._operActNodeList[idx]
                this.scheduleOnce(() => {
                    let pos = CCUtil.postionConvert(huNode, optNode)
                    let aniCom = this.genAniNode(optNode, null, pos)
                    aniCom.node.scale = hcom.node.scale
                    aniCom.showHuLight()
                }, 0.2)
            }

            /**删除桌子上的牌 */
            let lastOut = FCMJModel.getLastOutCardRecord();
            if (!!lastOut.isDel) {
                let localIndex = FCMJModel.getUserIndexByUID(lastOut.opt.uid);
                this._disTileMgrList[localIndex].afterOptUpdateTiles(lastOut.opt.card);
                this.updatePointer();
            }
        }

        let showAni = (type) => {
            let typeNameList = ["chi", "peng", "gang", "hu", "zimo"];
            if (type >= 3 && idx == 0) {
                this._handTileMgrList[0].showHuAniFire()
            }
            /**声音 */
            let huTypeList = [ApiFcmj.operateType.HU_CHI, ApiFcmj.operateType.MOBAOHU, ApiFcmj.operateType.ZHICHONG, ApiFcmj.operateType.SHUANGYANPI]
            let aName = ""
            let audioType = type;
            if (huTypeList.includes(data.operate)) {
                aName = "ht" + data.operate
            } else if (audioType < typeNameList.length) {
                aName = typeNameList[audioType]
            }
            if (aName != "") {
                AssetsManager.playEffect({
                    bundle: Enums.bundleType.FCMJ,
                    path: `res/audio/${sex}/${aName}`,
                });
            }

            /**动画 */
            let com = this.genAniNode(this._operActNodeList[idx])
            com && com.showOpt(type)
        }

        switch (data.operate) {
            case ApiFcmj.operateType.QI: //出牌
                if (idx == 0) {
                    this._handTileMgrList[0].setTouch(false)
                }
                /**更新桌子上的牌 */
                let out = FCMJModel.getOutTilesByUID(data.uid)
                let last = null,
                    disCom = this._disTileMgrList[idx]
                if (disCom) last = disCom.showOutTiles(out)
                if (last && last.flower == data.card) {
                    this.updatePointer(last.node)
                }
                AssetsManager.playEffect({
                    path: `res/audio/${sex}/` + data.card,
                    bundle: Enums.bundleType.FCMJ
                });
                this.scheduleOnce(() => {
                    AssetsManager.playEffect({
                        path: 'res/audio/main/dapai',
                        bundle: Enums.bundleType.FCMJ
                    });
                }, 0.1)
                if (idx == 0) {
                    this.showTingLight()
                }
                break;
            case ApiFcmj.operateType.CHI: //吃牌
                showAni(0)
                optPengGang()
                break;
            case ApiFcmj.operateType.PENG: //碰牌
                showAni(1)
                optPengGang()
                break;
            case ApiFcmj.operateType.GANG_BU: //补杠
                showAni(2)
                optPengGang()
                break;
            case ApiFcmj.operateType.GANG_CHI: //吃杠
                showAni(2)
                optPengGang()
                break;
            case ApiFcmj.operateType.GANG_ZHI: //暗杠
                showAni(2)
                optPengGang();
                break;
            case ApiFcmj.operateType.HU_CHI: //接炮
                showAni(3);
                optHu();
                break;
            case ApiFcmj.operateType.HU_ZHI: //自摸
                showAni(4)
                optHu();
                break;
            case ApiFcmj.operateType.HU_QIANG: //抢杠
                showAni(3)
                optHu();
                break;
            case ApiFcmj.operateType.MOBAOHU: //摸宝胡
                optHu()
                showAni(3)
                break;
            case ApiFcmj.operateType.ZHICHONG: //直冲
            case ApiFcmj.operateType.SHUANGYANPI: //双眼皮
                showAni(3)
                break;
            default:
                break;
        }
        /**展示分数 */
        let plusInfo = data.plusInfo;
        if (plusInfo && plusInfo.winScoreRecord && plusInfo.winScoreRecord.length > 0) {
            for (let i = 0; i < plusInfo.winScoreRecord.length; i++) {
                const score = plusInfo.winScoreRecord[i];
                let index = FCMJModel.getUserIndexByChairID(i)
                // this.showOptScore(score, index)
            }
        }
    },




    onSmall(data) {
        this.deleteMoveNode();
        this.com_opt.onClearTurn();
        let result = Utils.deepCopy(data.result)
        let myUid = FCMJModel.getMyUID();
        if (!!result) {
            let laizi = []
            if (data.plusInfo && data.plusInfo.laiZiCards) {
                laizi = data.plusInfo.laiZiCards
            }
            for (const user of result) {
                if (!user) continue; //处理没有调试权限时其他人摊牌
                if (!user.userCards || !user.userCards[user.uid]) continue;
                let index = FCMJModel.getUserIndexByUID(user.uid);
                if (!this._handTileMgrList[index]) continue;
                let userCards = user.userCards[user.uid];
                userCards = FCMJModel.sortTiles(userCards);
                if (user.winScores > 0 && user.huCards > 0) {
                    let huFilter = [ApiFcmj.huType.ZIMO, ApiFcmj.huType.GANGHUA, ApiFcmj.huType.MOBAO, ApiFcmj.huType.GANGSHANGBAO, ApiFcmj.huType.ZHICHONG];
                    if (huFilter.indexOf(user.huType) != -1) {
                        let huCardIndex = userCards.indexOf(user.huCards);
                        if (huCardIndex >= 0) { //赢家删除胡牌
                            userCards.splice(huCardIndex, 1);
                        }
                    }
                    this._handTileMgrList[index].setHuTile(user.huCards, laizi.includes(user.huCards));
                }
                this._handTileMgrList[index].updateLieTiles(userCards);
            }
            AssetsManager.playEffect({
                path: 'res/audio/main/dapai',
                bundle: Enums.bundleType.FCMJ
            });
        }
        this.fenPaiZhong.active = false
        data.isResult = true;
        data.mainComp = this;
        data.bundle = Enums.bundleType.FCMJ;
        data.path = "res/prefab/FCMJResultDialog";
        data.enterHall = this.enterHall.bind(this);
        data.isBureauFull = (FCMJModel.getCurBureau() == FCMJModel.getMaxBureau());
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
            let acom = aniNode.getComponent("FCMJOperAct")
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
            c.setBaoIcon(false)
        });
        this._operActNodeList.forEach(n => {
            n.removeAllChildren()
        })
        this.deleteFlyNode();
        this.btn_ting.active = false;
        this.com_ting.node.active = false;
        this.com_clock.reset();
        this.com_baoPai.reset();
        this.updatePointer();
        this.setTilesGary(-1);
        this.onLastTilesCountUpdate(0);
        this._canWinList = [];
        this.fenPaiZhong.active = false
        this.yaobao2.active = false
        this.com_opt.onClearTurn();
    },

    /**手牌点击，牌被抬起来 */
    onTileUp(tileCom) {
        /**打听显示 */
        let myUid = FCMJModel.getMyUID();
        let handCards = FCMJModel.getHandCards(myUid)
        if (this._tingList.includes(tileCom.flower)) {
            let myTiles = handCards.slice();
            let tingFilter = FCMJModel.tingFilter(tileCom.flower, myTiles);
            let pgList = FCMJModel.getPengGangArrayByUID(FCMJModel.getMyUID())
            let canWinList = FCMJLogic.getTingList(tingFilter.cards, tingFilter.ghostCardsCount, pgList);
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

    onYaoBao(data, type) {
        if (FCMJModel.getMyUID() == data.uid) {
            this.com_opt.showYaoBao(type)
        }
    },

    /**展示摇宝动画 */
    showYaoBaoAni(data) {
        let baoCount = FCMJModel.getGameRuleByKey("baoCount")
        if (!baoCount) {
            return
        }
        if (data.uid == FCMJModel.getMyUID()) {
            FCMJModel.setSelfIsYaoBao(true)
        }
        let idx = FCMJModel.getUserIndexByUID(data.uid)
        let com = this._userList[idx]
        if (com) com.setYaoBao(true)

        if (data.count && data.count > 0) {
            this.yaobao2.active = true
            this.yaobao2.scale = 1.5
            cc.tween(this.yaobao2).to(0.3, {
                scale: 1
            }, {
                easing: "backOut"
            }).start()
        }

        let cb = () => {
            let arr = data.baoCards
            this.com_baoPai.showBaoPai(arr, com.getBaoPaiNode())
            this.yaobao2.active = false
        }

        if (baoCount == 1) {
            this.com_clock.showDiceAni(data.dice1, data.dice2, cb)
        } else if (baoCount == 2) {
            this.com_clock.showDiceAni1(data.dice1, cb)
        }
    },

    showGenBao(data) {
        let idx = FCMJModel.getUserIndexByUID(data.uid)
        let com = this._userList[idx]
        if (com) {
            com.setGenBao(true)
        }
    },

    onGift(fromChairID, toChairID, giftID) {
        window.chatTimer = window.chatTimer || 0;
        // console.log('延迟测试----聊天----', Date.now() - window.chatTimer);
        let fidx = FCMJModel.getUserIndexByChairID(fromChairID)
        let tidx = FCMJModel.getUserIndexByChairID(toChairID)
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
        // this.btn_shezhi.active = !!isTest;
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
        this._roomsLayPos.show = cc.v2(this._roomsLayPos.hide.x - this.menuLayList.width, this._roomsLayPos.hide.y);
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
                    gameType: Enums.bundleType.FCMJ,
                    musicType: Enums.bundleType.MAHJONG,
                });
                break;
            case "btn_review": //回看
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiFcmj.gameReviewNotify());
                break;
            case "btn_msg": //聊天
                if (CCUtil.clickInterval(event.target, 1)) return;
                let params = {
                    gameRule: FCMJModel.getGameRule(),
                    chat: (chat) => {
                        ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
                    }
                }
                AssetsManager.chatDialog(params);
                break;
            case "btn_roomInfo": //规则
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 1)) return;
                let rule = FCMJModel.getGameRule();
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
                        this._canWinList[i].count = FCMJModel.getRestCardCount(this._canWinList[i].cardID);
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
                    users: FCMJModel.getUsers(),
                    chairCount: FCMJModel.getChairCount(),
                    fangzuobi: FCMJModel.getGameRuleByKey('fangzuobi')
                })
                break;
            case "btn_deposit": //开始托管
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiFcmj.gameTrushNotify(true));
                break;
            case "btn_quxiaotuoguan": //取消托管
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiFcmj.gameTrushNotify(false));
                break;
            case "btn_invite": //邀请
                let gameRule = FCMJModel.getGameRule();
                gameRule = gameRule || {};
                gameRule.roomId = FCMJModel.getRoomID();
                let share = ConfigModel.getRoomRuleShare(gameRule);
                NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
                break;
            case "btn_copy": //复制
                let str = ConfigModel.getRoomShare(Enums.bundleType.FCMJ, FCMJModel.getRoomID());
                NativeUtil.copyText(str);
                break;
            default:
                break;
        }
    },

    _onLeaveClick() {
        if (!UserModel.isInRoom()) {
            this.enterHall();
            return;
        }
        let curBureau = FCMJModel.getCurBureau();
        if (curBureau > 0) {
            AssetsManager.tipDialog('现在不能退出游戏');
            return;
        }
        ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
    },


    onChat(data) {
        let idx = FCMJModel.getUserIndexByUID(data.uid)
        let com = this._userList[idx];
        if (!com) return;
        com.gameChat(data)
    },
    // 好友邀请
    onShowInvite() {
        AssetsManager.friendDialog({
            gameRule: FCMJModel.getGameRule(),
        })
    },


    /**消息监听 */
    messageCallbackHandler(route, msg) {
        if (route === 'RoomMessagePush') {
            if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
                this.gameInit(msg.data);
            } else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
                FCMJModel.otherUserJoinRoom(msg.data.roomUserInfo);
                this.verifyZuobi(msg.data.roomUserInfo);
                this.userEnterRoom(msg.data.roomUserInfo);
            } else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
                this.userLeaveRoom(msg.data.roomUserInfo);
            } else if (msg.type === ApiRoom.USER_READY_PUSH) {
                this.onUserReady(msg.data);
            } else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
                // console.log('玩家操作-发起解散', msg);
                if (!msg.data.userList || msg.data.userList.length == 0) return;
                msg.data.myChairID = FCMJModel.getMyChairID();
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
                let idx = FCMJModel.getUserIndexByChairID(msg.data.chairID);
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
            if (msg.type === ApiFcmj.GAME_BUREAU_PUSH) {
                this.onGameRoundUpdate(msg.data);
            } else if (msg.type === ApiFcmj.GAME_STATUS_PUSH) { //游戏状态
                console.log("状态更新===", msg.data)
                FCMJModel.setGameStatus(msg.data.gameStatus);
                FCMJModel.setTick(msg.data.tick)
                this.onGameStatusUpdate(msg.data);
            } else if (msg.type === ApiFcmj.GAME_SEND_CARDS_PUSH) { //发牌
                // console.log("发牌===", msg.data)
                this.deleteMoveNode();
                this.com_clock.hideDice();
                this.onSendTiles(msg.data, true);
            } else if (msg.type === ApiFcmj.GAME_DICES_PUSH) {
                // console.log("骰子==", msg.data)
                this.com_clock.showDiceAni(msg.data.dice1, msg.data.dice2);
            } else if (msg.type === ApiFcmj.GAME_TURN_OPERATE_PUSH) {
                console.log("用户操作==", msg.data)
                this.onUserOpt(msg.data);
            } else if (msg.type === ApiFcmj.GAME_TURN_PUSH) {
                console.log("轮次==", msg.data)
                this.deleteMoveNode();
                this.com_clock.hideDice()
                this.onGameTurn(msg.data);
            } else if (msg.type === ApiFcmj.USER_START_YAO_BAO_PUSH) { //开始瑶宝
                console.log("开始瑶宝", msg.data)
                this.onYaoBao(msg.data, ApiFcmj.yaoBaoType.YAO)
            } else if (msg.type === ApiFcmj.USER_START_GEN_BAO_PUSH) { //开始更宝
                console.log("开始跟宝", msg.data)
                this.onYaoBao(msg.data, ApiFcmj.yaoBaoType.GEN)
            } else if (msg.type === ApiFcmj.USER_YAO_BAO_OPT_PUSH) {
                console.log("摇宝返回", msg.data)
                this.showYaoBaoAni(msg.data)
            } else if (msg.type === ApiFcmj.USER_GEN_BAO_OPT_PUSH) {
                console.log("跟宝返回", msg.data)
                this.showGenBao(msg.data)
            } else if (msg.type === ApiFcmj.GAME_BANKER_PUSH) { //庄家位置更新
                // console.log("更新庄家==", msg.data)
                FCMJModel.setBankerUID(msg.data.uid)
                this.onBankerUpdate(msg.data);
            } else if (msg.type === ApiFcmj.GAME_REST_CARDS_COUNT_PUSH) { //剩余牌数量更新
                this.onLastTilesCountUpdate(msg.data.restCardsCount);
            } else if (msg.type === ApiFcmj.GAME_END_PUSH) {
                // console.log("游戏结束《《《《《《《《《", msg);
                UserModel.setData('roomID', '');
                let date = Utils.getDateFormat();
                if (msg.data.result.length > 0) {
                    this.showMJAllResultFunc = () => {
                        this.showMJAllResultFunc = null;
                        msg.data.mainComp = this;
                        msg.data.isUnionCreate = FCMJModel.isUnionCreate();
                        msg.data.enterHall = this.enterHall.bind(this);
                        msg.data.roomDismissReason = msg.data.reason;
                        msg.data.path = 'res/prefab/FCMJAllResult';
                        msg.data.bundle = Enums.bundleType.FCMJ;
                        msg.data.date = date.yyyymmddhhmmss;
                        msg.data.roomID = FCMJModel.getRoomID();
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
            } else if (msg.type === ApiFcmj.GAME_REVIEW_PUSH) {
                console.log("回看数据==", msg.data)
                let reviewRecord = msg.data.reviewRecord;
                if (reviewRecord && reviewRecord.length > 0) {
                    AssetsManager.createDialog({
                        bundle: Enums.bundleType.FCMJ,
                        path: "res/prefab/FCMJResultDialog",
                        reviewRecord: reviewRecord,
                    });
                } else {
                    AssetsManager.tipDialog('暂无回放没有数据');
                }
            } else if (msg.type === ApiFcmj.GAME_RESULT_PUSH) {
                console.log("小结算==", msg.data)
                this.onSmall(msg.data);
            } else if (msg.type === ApiFcmj.GAME_TRUST_PUSH) { //开始托管
                if (FCMJModel.myUid == msg.data.uid) {
                    this.tuoguan.active = msg.data.trust
                }
            }
        } else if (route === 'ReconnectSuccess') {
            this.getRoomSceneInfo();
        } else if (route === 'SelfEntryRoomPush') {
            if (msg.gameType != FCMJModel.getBundleType()) {
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