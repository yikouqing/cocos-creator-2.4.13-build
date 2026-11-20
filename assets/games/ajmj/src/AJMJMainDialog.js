const ApiAjmj = require('./ApiAjmj');
const ApiRoom = require('../../../src/api/ApiRoom');;
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const MessageCallback = require('../../../src/utils/MessageCallback');
const UserModel = require('../../../src/model/UserModel');
const Codes = require('../../../src/const/Codes');
const ConfigModel = require('../../../src/model/ConfigModel');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AJMJModel = require('./AJMJModel');
const AJMJLogic = require('./AJMJLogic');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const SubManager = require('../../../src/utils/SubManager');
const Events = require('../../../src/const/Events');

cc.Class({
    extends: cc.Component,

    properties: {
        com_opt: require("AJMJOperate"),
        com_clock: require("AJMJClock"),
        com_ting: require("AJMJTingTips"),
        readyTick: require('AJMJReadyTick'),
        com_caiShen: require("AJMJCaiShen"),
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
        effectNode: cc.Node,
        btnBackHall: cc.Node,
        btnYuYin: cc.Node,
        canNotDismissBar: cc.Node,
        headPfbLeft: cc.Prefab,
        headPfbRight: cc.Prefab,

        tog_rule: cc.Node,
        text_rule: cc.Label,

        /**用户脚本列表 下标为本地座位号*/
        _userList: [],
        /**手牌脚本列表 */
        _handTileMgrList: [],
        /**操作牌脚本列表 */
        _optTileMgrList: [],
        /**打出牌脚本列表 */
        _disTileMgrList: [],
        _huaTileMgrList: [],
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
        this.com_caiShen.reset();
        this.menuLay.active = false;
        this.tog_rule.active = false;
        this.txt_name.string = `游戏名:${ConfigModel.getGameName(Enums.bundleType.AJMJ)}`;
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
        ConfigModel.setData('lastScene', 'AJMJ');
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
        let isUnionCreate = AJMJModel.isUnionCreate();
        let unionID = !!isUnionCreate ? AJMJModel.getRoomCreatorByKey('unionID') : null;
        SubManager.exitBundle(unionID);
    },

    /**初始化和断线重连 */
    gameInit(data) {
        MessageCallback.emitMessage('RemoveGameResult');
        this.unscheduleAllCallbacks();
        this.resetTable();
        AJMJModel.init(data);
        AJMJLogic.initRule(data.gameRule)
        let isTest = UserModel.getData("isTest");
        this._gameStatus = data.gameData.gameStatus;
        let lastOpt = AJMJModel.getLastOperate();
        let myUid = AJMJModel.getMyUID();
        let users = AJMJModel.getUsers();
        let operateUid = data.gameData.operateUid;
        this.com_clock.gameInit(AJMJModel.getChairCount(), AJMJModel.getMyChairID())
        if (this._gameStatus == ApiAjmj.gameStatus.NONE && AJMJModel.getCurBureau() == 0) {
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
        let unionID = AJMJModel.isUnionCreate() ? AJMJModel.getRoomCreatorByKey('unionID') : null;
        let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
        this.btn_invite.active = AJMJModel.getCurBureau() == 0 && !!isShowInvite;
        this.btn_copy.active = AJMJModel.getCurBureau() == 0 && !!isShowInvite;
        this.btn_location.active = !!AJMJModel.getGameRuleByKey('showGps');
        this.btn_ready.active = (this._gameStatus === ApiAjmj.gameStatus.NONE && data.gameData.userPlayStatus[myUid] == ApiRoom.userStatusEnum.NONE);
        this.btn_leave.active = data.gameData.curBureau == 0;
        this.btn_dismiss.active = data.gameData.curBureau != 0 && !AJMJModel.getGameRuleByKey("canNotDissmiss");
        this.btnBackHall.active = data.gameData.curBureau == 0 && AJMJModel.isUnionCreate();
        let yuyin = AJMJModel.getGameRuleByKey('yuyin');
        this.btnYuYin.active = !!yuyin && ConfigModel.getData('voiceSpeaker');
        let tm = AJMJModel.getGameRuleByKey("trustTm")
        this.btn_deposit.active = tm && tm > 0;
        if (this.btn_ready.active && AJMJModel.getCurBureau() == 0 && AJMJModel.getGameRuleByKey("unReadyKick") > 0) {
            let tick = AJMJModel.getGameRuleByKey("unReadyKick") || 10;
            this.readyTick.sync(tick);
        } else {
            this.readyTick.sync(0);
        }
        if (this.canNotDismissBar) this.canNotDismissBar.active = AJMJModel.getGameRuleByKey("canNotDissmiss");
        /**房间号和局数 */
        this.txt_roomId.string = `房间号:${data.roomID}`;
        this.txt_round.string = `局 数:${data.gameData.curBureau}/${data.gameData.maxBureau}局\n底 分:${AJMJModel.getGameRuleByKey("baseScore")}`;
        this.onLastTilesCountUpdate(data.gameData.restCardsCount);
        this.showTest();
        if (this._gameStatus > ApiAjmj.gameStatus.DICES) {
            //如果是自己的轮次 并且上一次打牌的人不是自己时删除最近一次摸的牌
            if (!!lastOpt && lastOpt.operate == ApiAjmj.operateType.GET) {
                let idx = AJMJModel.getUserIndexByUID(lastOpt.uid);
                let card = lastOpt.card;
                if (!!this._handTileMgrList[idx]) {
                    if (idx == 0 || !isTest) {
                        let huaList = AJMJModel.getHuaList();
                        if (!huaList.includes(card)) {
                            this._handTileMgrList[idx].setDrawTile(card, false);
                        }
                    } else {
                        this._handTileMgrList[idx].setHuTile(card);
                    }
                }
            }
            this.onSendTiles(data.gameData, false);
            for (const user of users) {
                let idx = AJMJModel.getUserIndexByUID(user.uid);
                /**恢复吃碰杠的牌 */
                let pengGangArray = AJMJModel.getPengGangArrayByUID(user.uid);
                if (pengGangArray.length > 0 && !!this._optTileMgrList[idx]) {
                    this._optTileMgrList[idx].updateOptTiles(pengGangArray);
                }
                /**恢复打出的牌 */
                let out = AJMJModel.getOutTilesByUID(user.uid);
                if (out.length > 0 && !!this._disTileMgrList[idx]) {
                    let last = this._disTileMgrList[idx].showOutTiles(out);
                    if (data.gameData.lastOperateUid == user.uid &&
                        !!last &&
                        last.flower == data.gameData.operateCard) {
                        this.updatePointer(last.node)
                    }
                }
            }

            if (this._gameStatus === ApiAjmj.gameStatus.PLAYING) {
                /**恢复方向指示 */
                let idx = AJMJModel.getUserIndexByUID(operateUid);
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
                            let idx = AJMJModel.getUserIndexByChairID(i)
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

            let huaCards = data.gameData.huaCards;
            for (const uid in huaCards) {
                AJMJModel.sethuaCards(uid, huaCards[uid])
                let index = AJMJModel.getUserIndexByUID(uid);
                this._huaTileMgrList[index].huaCardsSync(huaCards[uid]);
            }
            this.com_caiShen.showCaiShen(false);
        }
        /**恢复托管标记 */
        let userTrustArray = data.gameData.autoUser
        if (userTrustArray) {
            this.tuoguan.active = userTrustArray[AJMJModel.myUid]
        }

    },

    /**判断人数，初始化头像位置 */
    seatsInit() {
        if (this._userList.length > 0) {
            return
        }
        let chairCount = AJMJModel.getChairCount();
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
        this._huaTileMgrList.length = 0;

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
            this._userList.push(headNode.getComponent("AJMJHead"));
            this._userList[i].initRes();
            let handTile = cc.find("tableInfo/handTiles" + idx, this.node);
            let optTile = cc.find("tableInfo/optTiles" + idx, this.node);
            if (!optTile) {
                optTile = cc.find("optTiles" + idx, handTile);
            }
            let disTile = cc.find("tableInfo/outTiles" + idx, this.node);
            let huaTiles = cc.find("tableInfo/huaTiles" + idx, this.node);
            this._handTileMgrList.push(handTile.getComponent("AJMJHandTileMgr"));
            this._handTileMgrList[i].init(idx);
            this._optTileMgrList.push(optTile.getComponent("AJMJOptTileMgr"));
            this._optTileMgrList[i].init(i);
            this._disTileMgrList.push(disTile.getComponent("AJMJOutTileMgr"));
            this._disTileMgrList[i].init(idx);
            this._huaTileMgrList.push(huaTiles.getComponent("AJMJHuaTileMgr"));
            this._huaTileMgrList[i].init(i);
            let opNode = cc.find("operAct" + idx, this.node);
            this._operActNodeList.push(opNode);
        }
    },

    /**用户进入房间 */
    userEnterRoom(data) {
        let idx = AJMJModel.getUserIndexByUID(data.uid);
        let headcom = this._userList[idx]
        if (headcom) {
            headcom.init(data)
        }
    },

    /**恢复所有人的总输赢分数 */
    initTotalScore(userWinTotalScore) {
        if (userWinTotalScore && AJMJModel.scoreState()) {
            let len = Object.keys(userWinTotalScore)
            if (len.length > 0) {
                for (const uid in userWinTotalScore) {
                    if (Object.hasOwnProperty.call(userWinTotalScore, uid)) {
                        const s = userWinTotalScore[uid];
                        let idx = AJMJModel.getUserIndexByUID(uid);
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
        let idx = AJMJModel.getUserIndexByChairID(data.chairID);
        let headcom = this._userList[idx];
        if (headcom) {
            headcom.leave();
        }
        if (data.uid == UserModel.getData('uid')) {
            if (!AJMJModel.getRoomID() ||
                AJMJModel.getRoomID() == data.roomID) {
                this.enterHall();
            }
        }
    },

    /**GPS定位检查 */
    verifyZuobi(roomUserInfo) {
        if (!AJMJModel.getGameRuleByKey("fangzuobi")) return;
        if (!roomUserInfo || roomUserInfo.chairID >= AJMJModel.getChairCount()) return;
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
        let distanceLimit = parseInt(AJMJModel.getGameRuleByKey('distanceLimit'));
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
        let idx = AJMJModel.getUserIndexByChairID(data.chairID);
        let com = this._userList[idx];
        if (com) com.setReady(true);
        if (data.chairID == AJMJModel.getMyChairID()) {
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
        AJMJModel.setCurBureau(data.curBureau);
        this.btnBackHall.active = data.curBureau == 0;
        MessageCallback.emitMessage('RemoveGameResult');
        this.btn_dismiss.active = data.curBureau != 0 && !AJMJModel.getGameRuleByKey("canNotDissmiss");
        this.txt_round.string = `局 数:${data.curBureau}/${AJMJModel.getMaxBureau()}局\n底 分:${AJMJModel.getGameRuleByKey("baseScore")}`;
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
        let idx = AJMJModel.getUserIndexByUID(data.uid);
        let com = this._userList[idx];
        if (com) com.setBanker(true);
    },

    /**游戏状态跳转 */
    onGameStatusUpdate(data) {
        this._gameStatus = data.gameStatus;
        if (this._gameStatus == ApiAjmj.gameStatus.NONE ||
            this._gameStatus == ApiAjmj.gameStatus.DICES) {
            this.onLastTilesCountUpdate(0);
        }
        this.com_clock.setTick(data.tick);
        this.com_clock.hideDice();
        this.hideReadyIcon();
        this.btn_ready.active = AJMJModel.getCurBureau() == 0 && this._gameStatus == ApiAjmj.gameStatus.NONE;
        this.readyTick.sync(0);
        switch (this._gameStatus) {
            case ApiAjmj.gameStatus.NONE:
                AJMJModel.reset();
                this.resetTable();

                break;
            case ApiAjmj.gameStatus.PLAYING:
                this._handTileMgrList[0].setAllTilesDown();
                break;
            default:
                break;
        }
    },

    /**发牌 */
    onSendTiles(data, isAni) {
        let isTest = UserModel.getData('isTest');
        AJMJModel.setGhostCard(data.laiZiCards);
        AJMJModel.setHandCards(data.handCards);
        let lastOpt = AJMJModel.getLastOperate();
        if (!data.handCards) return;
        let handCards = data.handCards;
        for (const uid in handCards) {
            let user = AJMJModel.getUserByUID(uid);
            if (!user) continue;
            handCards[uid] = handCards[uid] || [];
            let tiles = handCards[uid].slice();
            tiles = AJMJModel.sortTiles(tiles);
            let idx = AJMJModel.getUserIndexByUID(uid);
            let hcom = this._handTileMgrList[idx];
            if (!hcom) continue;
            let drawTile = !!lastOpt && lastOpt.uid == uid && lastOpt.operate == ApiAjmj.operateType.GET ? lastOpt.card : null;
            let isDraw = !!lastOpt && lastOpt.uid == uid && lastOpt.operate == ApiAjmj.operateType.GET;
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

    onBuHua(data) {
        if (!data) return;
        let uid = data.uid;
        let moCardID = data.card;
        let curHuaID = data.curHua;
        this.syncViewAudio(uid, 'gang');
        AJMJModel.setBuHuaCards(uid, moCardID);
        let isTest = UserModel.getData('isTest');
        let huaCards = AJMJModel.gethuaCards(uid);
        let handCards = AJMJModel.getHandCards(uid);
        let index = AJMJModel.getUserIndexByUID(uid);
        this._huaTileMgrList[index].huaCardsSync(huaCards);
        this.showOptAinm(index, (ctrl) => { ctrl.showOpt(8) });
        if (index != 0 && !isTest) {
            //不是本家也没有调试
            curHuaID = 0;
            moCardID = 0;
        };
        this.updateUidHandCardsShow(uid, handCards, curHuaID, moCardID, true);
    },

    updateUidHandCardsShow(uid, cardsList, delCardID, moCardID, isMoAinm) {
        if (!uid || !Array.isArray(cardsList)) return;
        let index = AJMJModel.getUserIndexByUID(uid);
        let handCtrl = this._handTileMgrList[index];
        let delIndex = cardsList.indexOf(delCardID);
        if (delIndex >= 0) cardsList.splice(delIndex, 1);
        let handCards = AJMJModel.sortTiles(cardsList.slice());
        if (handCtrl) {
            if (index != 0 && !!UserModel.getData('isTest')) {
                handCtrl.updateLieTiles(handCards);
                handCtrl.setHuTile(moCardID);
            } else {
                handCtrl.updateStandTiles(handCards);
                handCtrl.setDrawTile(moCardID, index == 0 && isMoAinm);
            }
        }
        handCards.push(moCardID);
        AJMJModel.setHandCardsByUID(uid, handCards);
    },

    /**通知用户操作 */
    onGameTurn(data) {
        this.setTilesGary(-1);
        AJMJModel.onGameTurn(data);
        this.com_clock.setTick(data.tick);
        let isTest = UserModel.getData('isTest');
        let index = AJMJModel.getUserIndexByUID(data.uid);
        this.com_clock.setDir(AJMJModel.getUserIndexByUID(data.uid));
        if (data.plusInfo && data.plusInfo.userCards) {
            let moCardID = data.card, handCards = data.plusInfo.userCards;
            this.updateUidHandCardsShow(data.uid, handCards, moCardID, moCardID);
        }
        /**更新时间和位置 */
        if (data.operateArray) {
            let isGet = data.operateArray.some(opt => opt.type == ApiAjmj.operateType.GET)
            let isQi = data.operateArray.some(opt => opt.type == ApiAjmj.operateType.QI)
            if (isGet || isQi) {
                //通知出牌
                let isMoPai = isGet || data.card != null;
                for (let i = 0; i < this._handTileMgrList.length; i++) {
                    const comp = this._handTileMgrList[i];
                    if (!comp) continue;
                    if (index == i) {
                        if (isMoPai && (index == 0 || !isTest)) {
                            comp.setDrawTile(data.card, index == 0 && data.card != AJMJModel.getBuHuaCards(data.uid));
                        } else if (isMoPai && !!isTest && index != 0) {
                            comp.setHuTile(data.card);
                        }
                        AssetsManager.playEffect({
                            path: 'res/audio/main/give',
                            bundle: Enums.bundleType.AJMJ
                        });
                        if (index == 0 && isQi) {
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
        AJMJModel.setBuHuaCards(data.uid, null);
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
        let gameStatus = AJMJModel.getGameStatus();
        let operateUid = AJMJModel.getCurOptUID();
        let myUid = AJMJModel.getMyUID();
        // console.log("恢复听牌===", operateUid, myUid)
        let idx = AJMJModel.getUserIndexByUID(myUid);
        let hcom = this._handTileMgrList[idx];
        let handCards = AJMJModel.getHandCards(myUid);
        let winHandChecks = handCards.slice();
        let tingHandChecks = handCards.slice();
        if (operateUid != myUid) {
            /**不是自己操作 去掉打听标记 显示听牌按钮*/
            if (hcom) hcom.setTingIcons();
            let winTingFilter = AJMJModel.tingFilter(null, winHandChecks);
            let canWinList = AJMJLogic.getTingList(winTingFilter.cards, winTingFilter.ghostCardsCount);
            this.btn_ting.active = canWinList.length > 0;
            let ghostCard = AJMJModel.getGhostCard();
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
                let tingFilter = AJMJModel.tingFilter(cardId, copyTingHandCards);
                let canTingList = AJMJLogic.getTingList(tingFilter.cards, tingFilter.ghostCardsCount);
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
        let tiles = AJMJModel.getHandCards(AJMJModel.getMyUID())
        if (tiles.length >= 14) {
            return
        }
        let winTingFilter = AJMJModel.tingFilter(null, tiles.slice());
        let canWinList = AJMJLogic.getTingList(winTingFilter.cards, winTingFilter.ghostCardsCount);
        if (canWinList && canWinList.length > 0) { //如果听牌，播放听牌光效
            let node = this._handTileMgrList[0].node
            let optNode = cc.instantiate(this.operActPfb)
            let pos = CCUtil.postionConvert(node, this._operActNodeList[0])
            optNode.parent = this._operActNodeList[0]
            optNode.setPosition(pos)
            optNode.scale = node.scale
            let com = optNode.getComponent('AJMJOperAct')
            com.showTingLight()
        }
    },

    syncViewAudio(uid, audioName) {
        if (!uid) return false;
        let sex = AJMJModel.getUserSexByUID(uid);
        AssetsManager.playEffect({
            bundle: Enums.bundleType.AJMJ,
            path: `res/audio/${sex}/${audioName}`,
        });
    },

    /**用户操作广播 */
    onUserOpt(data) {
        AJMJModel.onUserOpt(data);
        this.deleteMoveNode();
        let isTest = UserModel.getData("isTest");
        this.setTilesGary(-1);
        if (data.uid == AJMJModel.getMyUID()) {
            this.com_opt.onClearTurn();
            this.com_ting.node.active = false;
            this._handTileMgrList[0].setTingIcons();
        }
        let idx = AJMJModel.getUserIndexByUID(data.uid);
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
        if (data.operate == ApiAjmj.operateType.QI) {
            let moOpt = AJMJModel.getQiByMo(data);
            if (!!moOpt && moOpt.card != data.card) {
                drawTile = moOpt.card;
            }
        }
        /**更新手牌 */
        let hcom = this._handTileMgrList[idx];
        let handCards = AJMJModel.getHandCards(data.uid);
        if (!hcom) return;
        if (idx != 0 && !!isTest) {
            hcom.updateLieTiles(handCards);
        } else {
            drawTile = idx == 0 ? drawTile : null;
            hcom.updateStandTiles(handCards, drawTile);
        }
        let optPengGang = () => {
            let pengGangArray = AJMJModel.getPengGangArrayByUID(data.uid);
            let optCom = this._optTileMgrList[idx];
            if (optCom) optCom.updateOptTiles(pengGangArray);
            let lastOut = AJMJModel.getLastOutCardRecord();
            if (!!lastOut.isDel) {
                let localIndex = AJMJModel.getUserIndexByUID(lastOut.opt.uid);
                this._disTileMgrList[localIndex].afterOptUpdateTiles(lastOut.opt.card);
                this.updatePointer();
            }
        }

        let optHu = () => {
            /** 亮出胡的牌 */
            let hcom = this._handTileMgrList[idx];
            if (hcom) {
                let huNode = hcom.setHuTile(data.card);
                this.showOptAinm(idx, (aniCom) => {
                    let optNode = this._operActNodeList[idx]
                    this.scheduleOnce(() => {
                        let pos = CCUtil.postionConvert(huNode, optNode)
                        aniCom.node.setPosition(pos)
                        aniCom.node.scale = hcom.node.scale
                        aniCom.showHuLight()
                    }, 0.2)
                })
            }

            /**删除桌子上的牌 */
            let lastOut = AJMJModel.getLastOutCardRecord();
            if (!!lastOut.isDel) {
                let localIndex = AJMJModel.getUserIndexByUID(lastOut.opt.uid);
                this._disTileMgrList[localIndex].afterOptUpdateTiles(lastOut.opt.card);
                this.updatePointer();
            }
        }

        let showAni = (type) => {
            if (type >= 3 && idx == 0) {
                this._handTileMgrList[0].showHuAniFire()
            }
            /**展示动画 */
            if (type >= 4) return;
            let audioType = type;
            let typeNameList = ["chi", "peng", "gang", "hu", "zimo"];
            if (audioType < typeNameList.length) {
                AssetsManager.playEffect({
                    bundle: Enums.bundleType.AJMJ,
                    path: `res/audio/${sex}/${typeNameList[audioType]}`,
                });
            }
            this.showOptAinm(idx, (ctrl) => {
                ctrl.showOpt(type, () => {
                    /**展示胡牌牌型 */
                    if (type >= 3) {
                        this.showOptAinm(idx, (ctrl) => {
                            ctrl.showHuType(data.plusInfo.huPaiType)
                        })
                    } else /**显示落地提示 */
                        if (data.plusInfo.luoDiType > 0) {
                            this.showOptAinm(idx, (ctrl) => {
                                ctrl.node.scale = 0.7;
                                ctrl.showHuType(data.plusInfo.luoDiType + 100);
                            })
                        }
                })
            });
        }

        switch (data.operate) {
            case ApiAjmj.operateType.QI: //出牌
                AssetsManager.playEffect({
                    path: 'res/audio/main/push',
                    bundle: Enums.bundleType.AJMJ
                });
                if (idx == 0) {
                    this._handTileMgrList[0].setTouch(false)
                }
                /**更新桌子上的牌 */
                let out = AJMJModel.getOutTilesByUID(data.uid)
                let last = null,
                    disCom = this._disTileMgrList[idx]
                if (disCom) last = disCom.showOutTiles(out)
                if (last && last.flower == data.card) {
                    this.updatePointer(last.node)
                }
                let card = data.card
                let ghostCard = AJMJModel.getGhostCard()
                if (ghostCard.includes(card)) {
                    this.syncViewAudio(data.uid, 'piao');
                    this.showOptAinm(idx, (ctrl) => {
                        ctrl.showOpt(0, null, true);
                    });
                } else {
                    AssetsManager.playEffect({
                        path: `res/audio/${sex}/` + data.card,
                        bundle: Enums.bundleType.AJMJ
                    });
                }
                if (idx == 0) {
                    this.showTingLight()
                }
                break;
            case ApiAjmj.operateType.CHI: //吃牌
                showAni(0)
                optPengGang()
                break;
            case ApiAjmj.operateType.PENG: //碰牌
                showAni(1)
                optPengGang()
                break;
            case ApiAjmj.operateType.GANG_BU: //补杠
                showAni(2)
                optPengGang()
                break;
            case ApiAjmj.operateType.GANG_CHI: //吃杠
                showAni(2)
                optPengGang()
                break;
            case ApiAjmj.operateType.GANG_ZHI: //暗杠
                showAni(2)
                optPengGang();
                break;
            case ApiAjmj.operateType.HU_CHI: //接炮
                showAni(3);
                optHu();
                break;
            case ApiAjmj.operateType.HU_ZHI: //自摸
                showAni(4)
                optHu();
                break;
            case ApiAjmj.operateType.HU_QIANG: //抢杠
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
                let index = AJMJModel.getUserIndexByChairID(i)
                // this.showOptScore(score, index)
            }
        }
    },




    onSmall(data) {
        this.deleteMoveNode();
        let result = Utils.deepCopy(data.result)
        let myUid = AJMJModel.getMyUID();
        if (!!result) {
            for (const user of result) {
                if (!user) continue; //处理没有调试权限时其他人摊牌
                if (!user.userCards || !user.userCards[user.uid]) continue;
                let index = AJMJModel.getUserIndexByUID(user.uid);
                if (!this._handTileMgrList[index]) continue;
                // this.showOptScore(user.winScores, idx);
                let userCards = user.userCards[user.uid];
                userCards = AJMJModel.sortTiles(userCards);
                if (user.winScores > 0) {
                    let huFilter = [ApiAjmj.cardType.ZIMO];
                    user.huCards = user.huCards || [];
                    if (huFilter.indexOf(user.huType) != -1) {
                        let huCardIndex = userCards.indexOf(user.huCards);
                        if (huCardIndex >= 0) {   //赢家删除胡牌
                            userCards.splice(huCardIndex, 1);
                        }
                    }
                    if (user.huType) {
                        let maxScore = 0, maxObj = null;
                        let list = [ApiAjmj.cardType.HUASCORE];
                        let userPlusType = user.userPlusType || [];
                        userPlusType.forEach((curObj) => {
                            if (!list.includes(curObj.type)
                                && curObj.score > maxScore) {
                                maxScore = curObj.score;
                                maxObj = curObj;
                            }
                        })
                        if (!!maxObj) {
                            let huType = maxObj.type || 0;
                            this.syncViewAudio(user.uid, 'hu_' + huType);
                            this.showOptAinm(index, (ctrl) => {
                                ctrl.showHuType(huType);
                            });
                        };
                    }
                    this._handTileMgrList[index].setHuTile(user.huCards);
                }
                userCards = AJMJModel.sortTiles(userCards);
                this._handTileMgrList[index].updateLieTiles(userCards);
            }
            AssetsManager.playEffect({
                path: 'res/audio/main/push',
                bundle: Enums.bundleType.AJMJ
            });
            this.scheduleOnce(() => {
                this.btn_ready.active = true;
                for (const user of result) {
                    let idx = AJMJModel.getUserIndexByUID(user.uid);
                    this._operActNodeList[idx].removeAllChildren();
                    this.showOptScore(user.winScores, idx)
                }
            }, 1);
        }
        data.isResult = true;
        data.mainComp = this;
        data.bundle = Enums.bundleType.AJMJ;
        data.path = "res/prefab/AJMJResultDialog";
        data.enterHall = this.enterHall.bind(this);
        data.isBureauFull = (AJMJModel.getCurBureau() == AJMJModel.getMaxBureau());
        // AssetsManager.createDialog(data);
    },

    /**展示操作分数 */
    showOptScore(score, index) {
        if (!score || score == 0) return
        this.showOptAinm(index, (ctrl) => {
            ctrl.showOptScoreAni(score)
        });
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
        this._huaTileMgrList.forEach(c => {
            c.reset()
        })
        this._userList.forEach(c => {
            c.setBanker(false)
            c.setLight(false)
        });
        this._operActNodeList.forEach(n => {
            n.removeAllChildren()
        })
        this.deleteFlyNode();
        this.btn_ting.active = false;
        this.com_ting.node.active = false;
        this.com_caiShen.reset();
        this.com_clock.reset();
        this.updatePointer();
        this.setTilesGary(-1);
        this.onLastTilesCountUpdate(0);
        this._canWinList = [];
    },

    showOptAinm(index, funs) {
        if (!this._operActNodeList[index]) return;
        let optNode = cc.instantiate(this.operActPfb);
        optNode.parent = this._operActNodeList[index];
        let optCtrl = optNode.getComponent('AJMJOperAct');
        if (funs && optCtrl) funs(optCtrl);
    },

    /**手牌点击，牌被抬起来 */
    onTileUp(tileCom) {
        /**打听显示 */
        let myUid = AJMJModel.getMyUID();
        let handCards = AJMJModel.getHandCards(myUid)
        if (this._tingList.includes(tileCom.flower)) {
            let myTiles = handCards.slice();
            let tingFilter = AJMJModel.tingFilter(tileCom.flower, myTiles);
            let canWinList = AJMJLogic.getTingList(tingFilter.cards, tingFilter.ghostCardsCount);
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
        let fidx = AJMJModel.getUserIndexByChairID(fromChairID)
        let tidx = AJMJModel.getUserIndexByChairID(toChairID)
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
        this._roomsLayPos.show = cc.v2(this._roomsLayPos.hide.x - this.menuLayList.width - CCUtil.getFixWidget(), this._roomsLayPos.hide.y);
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
                    gameType: Enums.bundleType.AJMJ,
                    musicType: Enums.bundleType.MAHJONG,
                });
                break;
            case "btn_review": //回看
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiAjmj.gameReviewNotify());
                break;
            case "btn_msg": //聊天
                if (CCUtil.clickInterval(event.target, 1)) return;
                let params = {
                    gameRule: AJMJModel.getGameRule(),
                    chat: (chat) => {
                        ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
                    }
                }
                AssetsManager.chatDialog(params);
                break;
            case "btn_roomInfo": //规则
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 1)) return;
                let rule = AJMJModel.getGameRule();
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
                        this._canWinList[i].count = AJMJModel.getRestCardCount(this._canWinList[i].cardID);
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
                    users: AJMJModel.getUsers(),
                    chairCount: AJMJModel.getChairCount(),
                    fangzuobi: AJMJModel.getGameRuleByKey('fangzuobi')
                })
                break;
            case "btn_deposit": //开始托管
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiAjmj.gameTrushNotify(true));
                break;
            case "btn_quxiaotuoguan": //取消托管
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiAjmj.gameTrushNotify(false));
                break;
            case "btn_invite": //邀请
                let gameRule = AJMJModel.getGameRule();
                gameRule = gameRule || {};
                gameRule.roomId = AJMJModel.getRoomID();
                let share = ConfigModel.getRoomRuleShare(gameRule);
                NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
                break;
            case "btn_copy": //复制
                let str = ConfigModel.getRoomShare(Enums.bundleType.AJMJ, AJMJModel.getRoomID());
                NativeUtil.copyText(str);
                break;
            case "tog_rule":
                this.tog_rule.active = !this.tog_rule.active;
                if (this.tog_rule.active) {
                    this.text_rule.string = AJMJModel.getTerseRule(AJMJModel.getGameRule(), "\n");
                }
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
        let curBureau = AJMJModel.getCurBureau();
        if (curBureau > 0) {
            AssetsManager.tipDialog('现在不能退出游戏');
            return;
        }
        ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
    },


    onChat(data) {
        let idx = AJMJModel.getUserIndexByUID(data.uid)
        let com = this._userList[idx];
        if (!com) return;
        com.gameChat(data)
    },
    // 好友邀请
    onShowInvite() {
        AssetsManager.friendDialog({
            gameRule: AJMJModel.getGameRule(),
        })
    },


    /**消息监听 */
    messageCallbackHandler(route, msg) {
        if (route === 'RoomMessagePush') {
            if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
                this.gameInit(msg.data);
            } else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
                AJMJModel.otherUserJoinRoom(msg.data.roomUserInfo);
                this.verifyZuobi(msg.data.roomUserInfo);
                this.userEnterRoom(msg.data.roomUserInfo);
            } else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
                this.userLeaveRoom(msg.data.roomUserInfo);
            } else if (msg.type === ApiRoom.USER_READY_PUSH) {
                this.onUserReady(msg.data);
            } else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
                // console.log('玩家操作-发起解散', msg);
                if (!msg.data.userList || msg.data.userList.length == 0) return;
                msg.data.myChairID = AJMJModel.getMyChairID();
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
                let idx = AJMJModel.getUserIndexByChairID(msg.data.chairID);
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

            // console.log("安吉麻将=游戏消息=》", msg.type, msg.data)
            if (msg.type === ApiAjmj.GAME_BUREAU_PUSH) {
                this.onGameRoundUpdate(msg.data);
            } else if (msg.type === ApiAjmj.GAME_STATUS_PUSH) { //游戏状态
                // console.log("状态更新===", msg.data)
                AJMJModel.setGameStatus(msg.data.gameStatus);
                AJMJModel.setTick(msg.data.tick)
                this.onGameStatusUpdate(msg.data);
            } else if (msg.type === ApiAjmj.GAME_SEND_CARDS_PUSH) { //发牌
                // console.log("发牌===", msg.data)
                AJMJModel.setFanCard(msg.data.fanCard) //翻财神
                this.deleteMoveNode();
                this.com_clock.hideDice();
                this.onSendTiles(msg.data, true);
                this.scheduleOnce(() => {
                    this.com_caiShen.showCaiShen(true)
                    let bankerUid = AJMJModel.getBankerUid()
                    let out = AJMJModel.getOutTilesByUID(bankerUid)
                    if (out.length > 0) {
                        let idx = AJMJModel.getUserIndexByUID(bankerUid)
                        let disCom = this._disTileMgrList[idx]
                        if (disCom) {
                            let last = disCom.showOutTiles(out)
                            this.updatePointer(last.node)
                        }
                    }
                }, 0.5)
            } else if (msg.type === ApiAjmj.GAME_BU_HUA_PUSH) {
                // console.log("更新补花==", msg.data)
                AJMJModel.sethuaCards(msg.data.uid, msg.data.huaCards);
                this.onBuHua(msg.data)
            } else if (msg.type === ApiAjmj.PIAO_HUA_LIMIT_PUSH) {
                // isLimit: true
                // uid: "620057"
                AJMJModel.setLimit(msg.data.isLimit);
            } else if (msg.type === ApiAjmj.GAME_DICES_PUSH) {
                this.com_clock.showDiceAni(msg.data.dice1, msg.data.dice2);
            } else if (msg.type === ApiAjmj.GAME_TURN_OPERATE_PUSH) {
                this.onUserOpt(msg.data);
            } else if (msg.type === ApiAjmj.GAME_TURN_PUSH) {
                this.deleteMoveNode();
                this.onGameTurn(msg.data);
            } else if (msg.type === ApiAjmj.GAME_BANKER_PUSH) { //庄家位置更新
                // console.log("更新庄家==", msg.data)
                AJMJModel.setBankerUID(msg.data.uid)
                this.onBankerUpdate(msg.data);
            } else if (msg.type === ApiAjmj.GAME_REST_CARDS_COUNT_PUSH) { //剩余牌数量更新
                this.onLastTilesCountUpdate(msg.data.restCardsCount);
            } else if (msg.type === ApiAjmj.GAME_END_PUSH) {
                // console.log("游戏结束《《《《《《《《《", msg);
                UserModel.setData('roomID', '');
                let date = Utils.getDateFormat();
                if (msg.data.result.length > 0) {
                    this.showMJAllResultFunc = () => {
                        this.showMJAllResultFunc = null;
                        msg.data.mainComp = this;
                        msg.data.isUnionCreate = AJMJModel.isUnionCreate();
                        msg.data.enterHall = this.enterHall.bind(this);
                        msg.data.roomDismissReason = msg.data.reason;
                        msg.data.path = 'res/prefab/AJMJAllResult';
                        msg.data.bundle = Enums.bundleType.AJMJ;
                        msg.data.date = date.yyyymmddhhmmss;
                        msg.data.roomID = AJMJModel.getRoomID();
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
            } else if (msg.type === ApiAjmj.GAME_REVIEW_PUSH) {
                console.log("回看数据==", msg.data)
                let reviewRecord = msg.data.reviewRecord;
                if (reviewRecord && reviewRecord.length > 0) {
                    AssetsManager.createDialog({
                        bundle: Enums.bundleType.AJMJ,
                        path: "res/prefab/AJMJResultDialog",
                        reviewRecord: reviewRecord,
                    });
                } else {
                    AssetsManager.tipDialog('暂无回放没有数据');
                }
            } else if (msg.type === ApiAjmj.GAME_RESULT_PUSH) {
                // console.log("小结算==", msg.data)
                this.onSmall(msg.data);
            } else if (msg.type === ApiAjmj.GAME_TRUST_PUSH) { //开始托管
                if (AJMJModel.myUid == msg.data.uid) {
                    this.tuoguan.active = msg.data.trust
                }
            }
        } else if (route === 'ReconnectSuccess') {
            this.getRoomSceneInfo();
        } else if (route === 'SelfEntryRoomPush') {
            if (msg.gameType != AJMJModel.getBundleType()) {
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