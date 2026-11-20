const ApiBpmj = require('./ApiBpmj');
const ApiRoom = require('../../../src/api/ApiRoom');;
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const NetworkManager = require('../../../src/utils/NetworkManager');
const MessageCallback = require('../../../src/utils/MessageCallback');
const UserModel = require('../../../src/model/UserModel');
const Codes = require('../../../src/const/Codes');
const ConfigModel = require('../../../src/model/ConfigModel');
const NativeUtil = require('../../../src/utils/NativeUtil');
const BPMJModel = require('./BPMJModel');
const BPMJLogic = require('./BPMJLogic');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const SubManager = require('../../../src/utils/SubManager');
const Events = require('../../../src/const/Events');

cc.Class({
    extends: cc.Component,

    properties: {
        txt_round: cc.Label,
        txt_roomId: cc.Label,
        txt_time: cc.Label,
        txt_last: cc.Label,
        restCardLayout: cc.Layout,
        btn_location: cc.Node,
        btn_copy: cc.Node,
        btn_invite: cc.Node,
        btn_ready: cc.Node,
        btn_back: cc.Node,
        btn_leave: cc.Node,
        btn_dismiss: cc.Node,
        btn_ting: cc.Node,
        menu: cc.Node,
        pointer: cc.Node,
        tuoguan: cc.Node,
        btn_deposit: cc.Node,
        operActPfb: cc.Prefab,
        ghostCard: cc.Node,
        effectNode: cc.Node,

        headLeft: cc.Prefab,
        headRight: cc.Prefab,

        tilesNode: cc.Node,

        btnAniList: [cc.Node],
        com_opt: require("BPMJOperate"),
        com_clock: require("BPMJClock"),
        com_ting: require("BPMJTingTips"),

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
        /**已经胡牌的列表 */
        _huPai: null,
        _ghostCard: null,
        _ghostCardCPos: null,
    },

    onLoad() {
        this.initGame();
    },

    /**消息监听 */
    messageCallbackHandler(route, msg) {
        if (route === 'RoomMessagePush') {
            if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
                BPMJModel.init(msg.data);
                this.gameInit(msg.data);
            } else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
                BPMJModel.otherUserJoinRoom(msg.data.roomUserInfo);
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
                msg.data.myChairID = BPMJModel.getMyChairID();
                AssetsManager.disDialog(msg.data);
            } else if (msg.type === ApiRoom.GAME_END_PUSH) {
                // console.log("游戏结束《《《《《《《《《", msg);
            } else if (msg.type === ApiRoom.ROOM_DISMISS_PUSH) {
                // console.log("房间被解散《《《《《《《《《《《", msg);
            } else if (msg.type === ApiRoom.USER_CHAT_PUSH) {
                this.onChat(msg.data);
            } else if (msg.type === ApiRoom.USER_GIFT_SEND_PUSH) {
                this.onGift(msg.data.fromChairID, msg.data.toChairID, msg.data.giftID);
            } else if (msg.type === ApiRoom.USER_OFF_LINE_PUSH) {
                let idx = BPMJModel.getUserIndexByChairID(msg.data.chairID);
                let com = this._userList[idx];
                if (com) com.setOffline(true);
            } else if (msg.type === ApiRoom.ROOM_USER_INFO_CHANGE_PUSH) { //用户信息刷新
                this._userList.forEach(com => {
                    !!com && com.userInfoChange(msg.data);
                });
            } else if (msg.type === ApiRoom.ROOM_USER_WIN_TOTAL_PUSH) {

                // console.log("玩家总输赢推送=====msg.data", msg.data)
                this.initTotalScore(msg.data.userWinTotalScore);
            }
        } else if (route === 'GameMessagePush') {
            if (msg.type === ApiBpmj.GAME_BUREAU_PUSH) { //局数推送
                this.onGameRoundUpdate(msg.data);
                AssetsManager.destroyDialog({
                    bundle: Enums.bundleType.BPMJ,
                    path: 'res/prefab/BPMJResultDialog',
                });
            } else if (msg.type === ApiBpmj.GAME_STATUS_PUSH) { //游戏状态
                BPMJModel.setGameStatus(msg.data.gameStatus);
                this.onGameStatusUpdate(msg.data);
            } else if (msg.type === ApiBpmj.GAME_BANKER_PUSH) { //庄家位置更新
                this.onBankerUpdate(msg.data);
            } else if (msg.type === ApiBpmj.GAME_SEND_CARDS_PUSH) { //发牌
                this.deleteMoveNode();
                this.com_clock.hideDice();
                this.onSendTiles(msg.data, true);
            } else if (msg.type === ApiBpmj.GAME_DICES_PUSH) {
                BPMJModel.setDiceInif(msg.data);
                this.com_clock.showDiceAni(msg.data.dice1, msg.data.dice2);
            } else if (msg.type === ApiBpmj.GAME_TURN_PUSH) { //通知用户操作
                this.deleteMoveNode();
                this.onGameTurn(msg.data);
            } else if (msg.type === ApiBpmj.GAME_TURN_OPERATE_PUSH) { //用户操作广播
                this.deleteMoveNode();
                this.onUserOpt(msg.data);
            } else if (msg.type === ApiBpmj.GAME_REST_CARDS_COUNT_PUSH) { //剩余牌数量更新
                this.onLastTilesCountUpdate(msg.data.restCardsCount);
            } else if (msg.type === ApiBpmj.GAME_XIAYU_PUSH) { //下雨推送
                let idx = BPMJModel.getUserIndexByUID(msg.data.uid);
                this.showOptScore(msg.data.score, idx);
            } else if (msg.type === ApiBpmj.GAME_QIANG_GANG_DELETE_PUSH) { //抢杠胡的时候刷新手牌
                // BPMJModel.qiangGangHuDel(msg.data);
                // let h = BPMJModel.getHandCards(msg.data.uid);
                // let idx = BPMJModel.getUserIndexByUID(msg.data.uid);
                // let hcom = this._handTileMgrList[idx];
                // if (!!hcom) {
                //     hcom.updateStandTiles(h);
                // }
            } else if (msg.type === ApiBpmj.GAME_RESULT_PUSH) { //小结算
                this.onSmall(msg.data);
            } else if (msg.type === ApiBpmj.GAME_END_PUSH) { //大结算
                this.onGameEnd(msg.data);
            } else if (msg.type === ApiBpmj.GAME_REVIEW_PUSH) {
                let reviewRecord = msg.data.reviewRecord;
                if (reviewRecord && reviewRecord.length) {
                    AssetsManager.createDialog({
                        bundle: Enums.bundleType.BPMJ,
                        path: "res/prefab/BPMJResultDialog",
                        reviewRecord: reviewRecord,
                    });
                } else {
                    AssetsManager.tipDialog('暂无回放没有数据');
                }
            } else if (msg.type == ApiBpmj.GAME_TRUST_PUSH) { //飘花限制
                if (msg.data && msg.data.uid == BPMJModel.getMyUID()) {
                    this.showTuoGuan(!!msg.data.trust);
                }

            } else if (msg.type == ApiBpmj.PIAO_HUA_LIMIT_PUSH) {
                // console.log("飘花限制====", msg.data)
                BPMJModel.setPiaoHuaLimit(msg.data.uid, msg.data.isLimit);
            }
        } else if (route === 'ReconnectSuccess') {
            this.getRoomSceneInfo();
        } else if (route === 'SelfEntryRoomPush') {
            if (msg.gameType != BPMJModel.getBundleType()) {
                AssetsManager.popDialog({
                    ok: this.enterHall.bind(this),
                    content: `进入游戏失败,请返回大厅后再试！`,
                });
                return;
            }
            UserModel.setData('gameType', msg.gameType);
            ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
        } else if (route === 'CreateRoomFail') {
            this.unscheduleAllCallbacks();
            AssetsManager.popDialog({
                content: Codes[msg.code],
                ok: this.enterHall.bind(this),
            });
        } else if (route === 'QuickJoinFail') {
            AssetsManager.popDialog({
                content: Codes[msg.code],
                ok: this.enterHall.bind(this),
            });
        } else if (route === 'JoinGameAgainPush') {
            this.unscheduleAllCallbacks();
            AssetsManager.popDialog({
                content: Codes[msg.code],
                ok: this.enterHall.bind(this),
            });
        } else if (route === 'OnGameOnceAgain') {
            this.unscheduleAllCallbacks();
            this.scheduleOnce(() => {
                AssetsManager.popDialog({
                    ok: this.enterHall.bind(this),
                    content: '再来一局初始化异常，请返回大厅后再试！',
                });
            }, 10);
        } else if (route === 'TestClickReq') {
            this.onTestClick()
        }
    },

    /**初始化和断线重连 */
    gameInit(data) {
        this.seatsInit();
        this.resetTable();
        this.showTuoGuan(false);
        this.unscheduleAllCallbacks();
        let myUid = BPMJModel.getMyUID();
        let users = BPMJModel.getUsers();
        let gameRule = data.gameData.gameRule;
        let lastOpt = BPMJModel.getLastOperate();

        let operateUid = data.gameData.operateUid;
        this._gameStatus = data.gameData.gameStatus;
        this._huPai = data.gameData.caozuoCard || {};

        let isTest = UserModel.getData("isTest");
        this.com_clock.gameInit(BPMJModel.getChairCount(), BPMJModel.getMyChairID())
        if (this._gameStatus == ApiBpmj.gameStatus.NONE && BPMJModel.getCurBureau() == 0) {
            this.com_clock.node.active = false;
        } else {
            this.com_clock.node.active = true;
        }

        let userCanOperate = data.gameData.userCanOperate || {};
        if (userCanOperate[myUid]) {
            let userOperate = userCanOperate[myUid];
            userOperate.operateCard = data.gameData.operateCard;
            this.com_opt.gameInit(userOperate);
        }
        /**初始化用户信息 */
        let roomUserInfoArr = data.roomUserInfoArr || [];
        for (let i = 0; i < roomUserInfoArr.length; i++) {
            const user = roomUserInfoArr[i];
            this.userEnterRoom(user);
        }
        this.initTotalScore(data.gameData.userWinTotalScore);
        this.onLastTilesCountUpdate(data.gameData.restCardsCount);

        /**房间号和局数 */
        let bundle = ConfigModel.getBundleConfig(gameRule.gameType);
        let roomStr = `游戏:${bundle.name} 房号:${data.roomID}`;
        roomStr += ` 封顶:${gameRule.maxScore}分`;
        roomStr += ` 玩法:${gameRule.qiHuType == 0 ? "一片起胡" : "两片起胡"}`;
        this.txt_roomId.string = roomStr;
        this.txt_round.string = `局数:${data.gameData.curBureau}/${data.gameData.maxBureau}`;
        /**按钮显示 */
        this.btn_leave.active = data.gameData.curBureau == 0;
        this.btn_dismiss.active = data.gameData.curBureau != 0;
        this.btn_deposit.active = BPMJModel.getGameRuleByKey("canTrust");
        this.btn_location.active = BPMJModel.getGameRuleByKey("showGps");
        this.btn_copy.active = BPMJModel.getCurBureau() == 0 && !cc.sys.isBrowser && BPMJModel.isUnionCreate() == false; // !!ConfigModel.getData('gameWechatInvite');
        this.btn_invite.active = BPMJModel.getCurBureau() == 0 && !cc.sys.isBrowser && BPMJModel.isUnionCreate() == false; //!!ConfigModel.getData('gameWechatInvite');
        this.btn_ready.active = (this._gameStatus === ApiBpmj.gameStatus.NONE && BPMJModel.getPlayStatus(myUid) == ApiRoom.userStatusEnum.NONE);
        this.btn_back.active = BPMJModel.getCurBureau() == 0 && BPMJModel.isUnionCreate();
        if (this._gameStatus > ApiBpmj.gameStatus.DICES) {
            //如果是自己的轮次 并且上一次打牌的人不是自己时删除最近一次摸的牌
            if (!!lastOpt && lastOpt.operate == ApiBpmj.operateType.GET) {
                let idx = BPMJModel.getUserIndexByUID(lastOpt.uid);
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
            let diceInfo = data.gameData.diceInfo || null;
            diceInfo && this.com_clock.showDiceVal(true, diceInfo.dice1, diceInfo.dice2);
            for (const user of users) {
                let idx = BPMJModel.getUserIndexByUID(user.uid);
                /**恢复吃碰杠的牌 */
                let pengGangArray = BPMJModel.getPengGangArrayByUID(user.uid);
                if (pengGangArray.length > 0 && !!this._optTileMgrList[idx]) {
                    this._optTileMgrList[idx].updateOptTiles(pengGangArray);
                }
                /**恢复打出的牌 */
                let out = BPMJModel.getOutTilesByUID(user.uid);
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
            if (this._gameStatus === ApiBpmj.gameStatus.HUANSANZHANG && data.gameData.suggestCard) {
                if (!BPMJModel.getIsHuanPai(myUid)) {
                    let sug = data.gameData.suggestCard[myUid];
                    this._handTileMgrList[0].setHuanPai(sug);
                }
            }

            if (this._gameStatus === ApiBpmj.gameStatus.PLAYING) {
                /**恢复方向指示 */
                let idx = BPMJModel.getUserIndexByUID(operateUid);
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
                        let user = BPMJModel.getUserByChairID(i);
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
                            let idx = BPMJModel.getUserIndexByChairID(i)
                            let hcom = this._handTileMgrList[idx]
                            if (hcom) hcom.setHuTile(c)
                            // console.log("设置了胡的牌==", idx, c)
                        }
                    }
                }

                this.checkTingPai();
                /**恢复托管标记 */
                let autoUser = data.gameData.autoUser || {}
                this.showTuoGuan(!!autoUser[BPMJModel.getMyUID()])



            } else {
                this.btn_ting.active = false;
            }
        }
        if (this._gameStatus != ApiBpmj.gameStatus.NONE) {
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
    showTuoGuan(isShow) {
        if (this.tuoguan) {
            this.tuoguan.active = isShow
        }
    },

    /**用户进入房间 */
    userEnterRoom(data) {
        let idx = BPMJModel.getUserIndexByUID(data.uid);
        let headcom = this._userList[idx]
        if (headcom) {
            headcom.init(data);
        }
        if (data.chairID == BPMJModel.getMyChairID()) {
            this.verifyZuobi(data);
        }
    },

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
        let isUnionCreate = BPMJModel.isUnionCreate();
        let unionID = !!isUnionCreate ? BPMJModel.getRoomCreatorByKey('unionID') : null;
        SubManager.exitBundle(unionID);
    },

    /**恢复所有人的总输赢分数 */
    initTotalScore(userWinTotalScore) {
        if (userWinTotalScore && BPMJModel.scoreState()) {
            let len = Object.keys(userWinTotalScore)
            if (len.length) {
                for (const uid in userWinTotalScore) {
                    if (Object.hasOwnProperty.call(userWinTotalScore, uid)) {
                        const s = userWinTotalScore[uid];
                        let idx = BPMJModel.getUserIndexByUID(uid);
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
        let idx = BPMJModel.getUserIndexByChairID(data.chairID);
        let headcom = this._userList[idx];
        if (headcom) {
            headcom.leave();
        }
        if (data.uid == UserModel.getData('uid')) {
            if (!BPMJModel.getRoomID() ||
                BPMJModel.getRoomID() == data.roomID) {
                this.enterHall();
            }
        }
    },

    /**玩家准备 */
    onUserReady(data) {
        let idx = BPMJModel.getUserIndexByChairID(data.chairID);
        let com = this._userList[idx];
        if (com) com.setReady(true);
        if (data.chairID == BPMJModel.getMyChairID()) {
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
        BPMJModel.setCurBureau(data.curBureau);
        this.txt_round.string = `局数:${data.curBureau}/${BPMJModel.getMaxBureau()}`;
        this.btn_back.active = BPMJModel.getCurBureau() == 0 && BPMJModel.isUnionCreate();
        this.btn_invite.active = false;
        this.btn_copy.active = false;
        this.btn_leave.active = false;
        this.btn_dismiss.active = true;
    },

    /**更新剩余牌数量 */
    onLastTilesCountUpdate(count) {
        this.txt_last.string = count > 0 ? `x${count}` : "";
        if (this.restCardLayout) this.restCardLayout.updateLayout();
    },

    /**更新庄家 */
    onBankerUpdate(data) {
        let idx = BPMJModel.getUserIndexByUID(data.uid);
        for (let index = 0; index < this._userList.length; index++) {
            let com = this._userList[index];
            if (!com) continue;
            com.setBanker(idx == index);
        }
    },

    /**游戏状态跳转 */
    onGameStatusUpdate(data) {
        this._gameStatus = data.gameStatus;
        if (this._gameStatus == ApiBpmj.gameStatus.NONE ||
            this._gameStatus == ApiBpmj.gameStatus.DICES) {
            this.onLastTilesCountUpdate(0);
        }
        this.com_clock.setTick(data.tick);
        this.com_clock.hideDice();
        this.hideReadyIcon();
        this.btn_ready.active = BPMJModel.getCurBureau() == 0 && this._gameStatus == ApiBpmj.gameStatus.NONE;

        switch (this._gameStatus) {
            case ApiBpmj.gameStatus.NONE:
                BPMJModel.reset();
                this.resetTable();
                break;
            case ApiBpmj.gameStatus.HUANSANZHANG:
                this._userList.forEach(c => {
                    c.setState(1);
                });
                break;
            case ApiBpmj.gameStatus.DINGQUE:
                this._userList.forEach(c => {
                    c.setState(2);
                });
                this._handTileMgrList[0].setAllTilesDown();
                break;
            case ApiBpmj.gameStatus.PLAYING:
                this._handTileMgrList[0].setAllTilesDown();
                break;
            default:
                break;
        }
    },

    /**发牌 */
    onSendTiles(data, isAni) {
        let isTest = UserModel.getData('isTest');
        BPMJModel.setGhostCard(data.laiZiCards);
        BPMJModel.setHandCards(data.handCards);
        BPMJModel.setHuaCards(data.huaCards);
        let lastOpt = BPMJModel.getLastOperate();
        if (!!this._ghostCard && !!isAni) {
            this.ghostCard.scale = 0;
            this.ghostCard.stopAllActions();
            this.ghostCard.setPosition(0, 0);
            this._ghostCard.setNodeShow(true);
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
            let user = BPMJModel.getUserByUID(uid);
            if (!user) continue;
            handCards[uid] = handCards[uid] || [];
            let tiles = handCards[uid].slice();
            tiles = BPMJModel.sortTiles(tiles);
            let idx = BPMJModel.getUserIndexByUID(uid);
            let hcom = this._handTileMgrList[idx];
            if (!hcom) continue;
            let drawTile = !!lastOpt && lastOpt.uid == uid && lastOpt.operate == ApiBpmj.operateType.GET ? lastOpt.card : null;
            let isDraw = !!lastOpt && lastOpt.uid == uid && lastOpt.operate == ApiBpmj.operateType.GET;
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
        // console.log("通知用户操作", data.uid, data.operateArray, data)
        this.setTilesGary(-1);
        BPMJModel.onGameTurn(data);
        this.com_clock.setTick(data.tick);
        let operateArray = data.operateArray || [];
        let showCard = data.plusInfo && !!data.plusInfo.showCard;
        this.com_clock.setDir(BPMJModel.getUserIndexByUID(data.uid));
        let isHu = operateArray.length == 1 && operateArray.indexOf(ApiBpmj.operateType.HU_ZHI) != -1;
        let isSiBaiBan = operateArray.length == 1 && operateArray.indexOf(ApiBpmj.operateType.SI_BAI_BAN) != -1;
        let isYingHu = data.uid == BPMJModel.getMyUID() && (isHu || isSiBaiBan);
        BPMJModel.setOnlyBaiBan(data.plusInfo && !!data.plusInfo.onlyBaiBan);
        BPMJModel.setYingHu(isYingHu);
        if (operateArray.length && (operateArray.indexOf(ApiBpmj.operateType.QI) != -1 || operateArray.indexOf(ApiBpmj.operateType.GET) != -1) || isYingHu || showCard) {
            let isTest = UserModel.getData('isTest');
            let idx = BPMJModel.getUserIndexByUID(data.uid); //更新时间和位置
            let isMoPai = operateArray.indexOf(ApiBpmj.operateType.GET) != -1 || data.card != null; //通知出牌
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
                        bundle: Enums.bundleType.BPMJ
                    });
                    if (idx == 0 && operateArray.indexOf(ApiBpmj.operateType.QI) != -1) {
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
        if (turn.operateArray && turn.operateArray.length > 1 || isYingHu) {
            this.com_opt.onGameTurn(turn);
        } else {
            this.com_opt.onClearTurn();
        }
        this.checkTingPai();
    },

    /**检查 听牌 */
    checkTingPai() {
        let myUid = BPMJModel.getMyUID();
        let operateUid = BPMJModel.getCurOptUID();
        let gameStatus = BPMJModel.getGameStatus();
        let handCards = BPMJModel.getHandCards(myUid);
        let index = BPMJModel.getUserIndexByUID(myUid);
        let hcom = this._handTileMgrList[index];
        let tingHandChecks = handCards.slice();
        let winHandChecks = handCards.slice();

        if (operateUid != myUid) {
            /**不是自己操作 去掉打听标记 显示听牌按钮*/
            if (hcom) hcom.setTingIcons();
            let winTingFilter = BPMJModel.tingFilter(null, winHandChecks);
            let canWinList = BPMJLogic.getTingList(winTingFilter.cards, winTingFilter.ghostCardsCount);
            this.btn_ting.active = !!canWinList.length
            this._canWinList = canWinList;
            let ghostCard = BPMJModel.getGhostCard();
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
                let tingFilter = BPMJModel.tingFilter(cardId, copyTingHandCards);
                let canTingList = BPMJLogic.getTingList(tingFilter.cards, tingFilter.ghostCardsCount);
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
        let tiles = BPMJModel.getHandCards(BPMJModel.getMyUID())
        if (tiles.length >= 14) {
            return
        }
        let winTingFilter = BPMJModel.tingFilter(null, tiles.slice());
        let canWinList = BPMJLogic.getTingList(winTingFilter.cards, winTingFilter.ghostCardsCount);
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

    },

    /**用户操作广播 */
    onUserOpt(data) {
        // console.log("用户操作广播===>data", data)
        let isTest = UserModel.getData("isTest");
        BPMJModel.onUserOpt(data);
        this.setTilesGary(-1);
        this.com_opt.onClearTurn();
        if (data.uid == BPMJModel.getMyUID()) {
            this.com_ting.node.active = false;
            this._handTileMgrList[0].setTingIcons();
        }
        BPMJModel.setPiaoHuaLimit(data.uid, false);
        let idx = BPMJModel.getUserIndexByUID(data.uid);
        let user = null,
            ucom = this._userList[idx];
        if (ucom) user = ucom.getUserData();
        let sex = user && (user.userInfo.sex == 0) ? 'nan' : 'nv';

        sex = "nv";

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
        if (data.operate == ApiBpmj.operateType.QI) {
            let moOpt = BPMJModel.getQiByMo(data);
            if (!!moOpt && moOpt.card != data.card) {
                drawTile = moOpt.card;
            }
        }
        /**更新手牌 */
        let hcom = this._handTileMgrList[idx];
        let handCards = BPMJModel.getHandCards(data.uid);
        if (!hcom) return;
        if (idx != 0 && !!isTest) {
            hcom.updateLieTiles(handCards);
        } else {
            drawTile = idx == 0 ? drawTile : null;
            hcom.updateStandTiles(handCards, drawTile);
        }
        /**展示分数 */
        let plusInfo = data.plusInfo;
        if (plusInfo && plusInfo.winScoreRecord && plusInfo.winScoreRecord.length > 0) {
            for (let i = 0; i < plusInfo.winScoreRecord.length; i++) {
                const score = plusInfo.winScoreRecord[i];
                let index = BPMJModel.getUserIndexByChairID(i)
                this.showOptScore(score, index)
            }
        }
        let optPengGang = () => {
            let pengGangArray = BPMJModel.getPengGangArrayByUID(data.uid);
            let optCom = this._optTileMgrList[idx];
            if (optCom) optCom.updateOptTiles(pengGangArray);
            let lastOut = BPMJModel.getLastOutCardRecord();
            if (!!lastOut.isDel) {
                let localIndex = BPMJModel.getUserIndexByUID(lastOut.opt.uid);
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
            let lastOut = BPMJModel.getLastOutCardRecord();
            if (!!lastOut.isDel) {
                let localIndex = BPMJModel.getUserIndexByUID(lastOut.opt.uid);
                this._disTileMgrList[localIndex].afterOptUpdateTiles(lastOut.opt.card);
                this.updatePointer();
            }
            this._huPai[data.uid] = data.card;
        }

        let showAni = (type) => {
            let audioType = type;
            let typeNameList = ["chi", "peng", "gang", "hu", "zimo", "qiangganghu"];
            if (data.operate == ApiBpmj.operateType.HU_QIANG) {
                audioType = 5;
            }
            if (audioType < typeNameList.length) {
                AssetsManager.playEffect({
                    path: `res/audio/${sex}/${typeNameList[audioType]}`,
                    bundle: Enums.bundleType.BPMJ
                });
            }
            /**展示动画 */
            let com = this.genAniNode(this._operActNodeList[idx])
            com.showOpt(type);
        }

        switch (data.operate) {
            case ApiBpmj.operateType.QI: //出牌
                AssetsManager.playEffect({
                    path: `res/audio/${sex}/` + data.card,
                    bundle: Enums.bundleType.BPMJ
                });
                AssetsManager.playEffect({
                    path: 'res/audio/main/push',
                    bundle: Enums.bundleType.BPMJ
                });
                if (idx == 0) {
                    this._handTileMgrList[0].setTouch(false)
                }
                /**更新桌子上的牌 */
                let out = BPMJModel.getOutTilesByUID(data.uid)
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
            case ApiBpmj.operateType.CHI: //吃牌

                showAni(0)
                optPengGang()
                break;
            case ApiBpmj.operateType.PENG: //碰牌
                showAni(1)
                optPengGang()
                break;
            case ApiBpmj.operateType.GANG_BU: //补杠
                showAni(2)
                optPengGang()
                break;
            case ApiBpmj.operateType.GANG_CHI: //吃杠
                showAni(2)
                optPengGang()
                break;
            case ApiBpmj.operateType.GANG_ZHI: //暗杠
                showAni(2)
                optPengGang();
                break;
            case ApiBpmj.operateType.HU_CHI: //接炮
                showAni(3);
                optHu();
                break;
            case ApiBpmj.operateType.YOU_JIN: //游金
                showAni(ApiBpmj.operateType.YOU_JIN);
                optHu();
                break;
            case ApiBpmj.operateType.SAN_JIN: //三金倒
                showAni(ApiBpmj.operateType.SAN_JIN);
                optHu();
                break;
            case ApiBpmj.operateType.HU_ZHI: //自摸
                showAni(4)
                optHu();
                break;
            case ApiBpmj.operateType.HU_QIANG: //抢杠
                showAni(3)
                optHu();
                break;
            default:
                break;
        }

    },
    /**小结算 */
    onSmall(data) {
        // console.log("小结算》data", data, BPMJModel.getDiceInif())
        this.deleteMoveNode();
        let myUid = BPMJModel.getMyUID();
        let result = JSON.parse(JSON.stringify(data.result));
        let huFilter = [ApiBpmj.operateType.HU_ZHI, ApiBpmj.operateType.YOU_JIN, ApiBpmj.operateType.SAN_JIN];
        if (!!result) {
            for (const user of result) {
                if (!user || user.uid == myUid) continue; //处理没有调试权限时其他人摊牌
                if (!user.userCards || !user.userCards[user.uid]) continue;
                let idx = BPMJModel.getUserIndexByUID(user.uid);
                let userCards = user.userCards[user.uid];
                if (!this._handTileMgrList[idx]) continue;
                if (user.winScores > 0) {
                    user.huCards = user.huCards || [];
                    if (huFilter.indexOf(user.huType) != -1) { //赢家删除胡牌
                        let huCardIndex = userCards.indexOf(user.huCards);
                        if (huCardIndex >= 0) {
                            userCards.splice(huCardIndex, 1);
                        }
                    }
                    userCards = BPMJModel.sortTiles(userCards);
                    this._handTileMgrList[idx].setHuTile(user.huCards);
                }
                this._handTileMgrList[idx].updateLieTiles(userCards);
            }
            AssetsManager.playEffect({
                path: 'res/audio/main/push',
                bundle: Enums.bundleType.BPMJ,
            });
        }
        data.isBureauFull = (BPMJModel.getCurBureau() == BPMJModel.getMaxBureau());
        data.enterHall = this.enterHall.bind(this);
        data.path = "res/prefab/BPMJResultDialog";
        data.bundle = Enums.bundleType.BPMJ;
        data.mainComp = this;
        data.isResult = true;
        AssetsManager.createDialog(data);
    },
    /**总结算 */
    onGameEnd(data) {
        // console.log("游戏结束》", data);
        if (!data) return false;
        UserModel.setData('roomID', '');
        if (!!data.result && data.result.length) {
            this.showMJAllResultFunc = () => {
                this.showMJAllResultFunc = null;
                data.isBureauFull = BPMJModel.getCurBureau() == BPMJModel.getMaxBureau();
                data.isUnionCreate = BPMJModel.isUnionCreate();
                data.enterHall = this.enterHall.bind(this);
                data.path = 'res/prefab/BPMJAllResult';
                data.roomDismissReason = data.reason;
                data.bundle = Enums.bundleType.BPMJ;
                data.mainComp = this;
                AssetsManager.createDialog(data);
            };
            if (data.reason != Enums.gameRoomDismissReason.BUREAU_FINISHED) {
                this.showMJAllResultFunc();
            }
        } else {
            this.enterHall();
        }
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
            let acom = aniNode.getComponent("BPMJOperAct")
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


    /**手牌点击，牌被抬起来 */
    onTileUp(tileCom) {
        /**打听显示 */
        let myUid = BPMJModel.getMyUID();
        this.com_ting.node.active = false;
        let handCards = BPMJModel.getHandCards(myUid)
        if (this._tingList.includes(tileCom.flower)) {
            let myTiles = handCards.slice();
            let tingFilter = BPMJModel.tingFilter(tileCom.flower, myTiles);
            let canWinList = BPMJLogic.getTingList(tingFilter.cards, tingFilter.ghostCardsCount);
            if (!!canWinList.length) {
                this.com_ting.showWinCards(canWinList)
            }
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

    /**按钮响应 */
    btnClickCallFunc(event, param) {
        switch (event.target.name) {
            case "btn_menu": //菜单
                this.menu.active = true
                let dt = 0
                this.btnAniList.forEach(node => {
                    cc.tween(node).stop()
                    node.x = this._aniX + 400
                    cc.tween(node).delay(dt).to(0.2, {
                        x: this._aniX
                    }).start()
                    dt += 0.05
                })
                break;
            case "showMenu": //关闭菜单
                this.menu.active = false;
                break
            case "btn_leave": //离开房间
                if (!UserModel.isInRoom()) {
                    this.enterHall();
                    return;
                }
                if (BPMJModel.getCurBureau() == 0) {
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
                if (!this.btnClickInterval(event.target.lastClick, 10)) return;
                AssetsManager.tipDialog('刷新界面可以修复游戏显示问题');
                this.getRoomSceneInfo()
                break;
            case "btn_setting": //设置
                AssetsManager.setDialog({
                    type: "mahjong",
                    gameType: Enums.bundleType.BPMJ,
                    musicType: Enums.bundleType.MAHJONG,
                });
                break;
            case "btn_review": //回看
                if (!this.btnClickInterval(event.target.lastClick, 1)) return;
                ApiRoom.gameMessageNotify(ApiBpmj.gameReviewNotify());
                break;
            case "btn_msg": //聊天
                if (!this.btnClickInterval(event.target.lastClick, 1)) return;
                let params = {
                    gameRule: BPMJModel.getGameRule(),
                    chat: (chat) => {
                        ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
                    }
                }
                AssetsManager.chatDialog(params);
                break;
            case "btn_roomInfo": //规则
                if (!this.btnClickInterval(event.target.lastClick, 1)) return;
                let rule = BPMJModel.getGameRule();
                if (!rule) return;
                AssetsManager.tableDialog({
                    gameRule: rule
                });
                break;
            case "btn_ting": //听牌
                if (this._canWinList.length > 0 && !this.com_ting.node.active) {
                    for (let i = 0; i < this._canWinList.length; i++) {
                        if (!this._canWinList[i]) continue;
                        this._canWinList[i].count = BPMJModel.getRestCardCount(this._canWinList[i].cardID);
                    }
                    this.com_ting.showWinCards(this._canWinList);
                } else {
                    this.com_ting.node.active = false;
                }
                break;
            case "btn_location": //定位
                if (!this.btnClickInterval(event.target.lastClick, 1)) return;
                AssetsManager.locationDialog({
                    users: BPMJModel.getUsers(),
                    chairCount: BPMJModel.getChairCount(),
                    fangzuobi: BPMJModel.getGameRuleByKey('fangzuobi')
                });
                break;
            case "btn_deposit": //开始托管
                if (!this.btnClickInterval(event.target.lastClick, 1)) return;
                ApiRoom.gameMessageNotify(ApiBpmj.gameTrushNotify(true));
                break;
            case "btn_quxiaotuoguan": //取消托管
                if (!this.btnClickInterval(event.target.lastClick, 1)) return;
                ApiRoom.gameMessageNotify(ApiBpmj.gameTrushNotify(false));
                break;
            case "btn_invite": //邀请
                let gameRule = BPMJModel.getGameRule();
                gameRule = gameRule || {};
                gameRule.roomId = BPMJModel.getRoomID();
                let share = ConfigModel.getRoomRuleShare(gameRule);
                NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
                break;
            case "btn_copy": //复制
                let str = ConfigModel.getRoomShare(Enums.bundleType.BPMJ, BPMJModel.getRoomID());
                NativeUtil.copyText(str);
                break;
            case "btn_back":
                this.enterHall();
                break
            default:
                break;
        }
        event.target.lastClick = Date.now();
    },

    /**按钮点击间隔控制 */
    btnClickInterval(lastClick, interval) {
        if (lastClick && Date.now() - lastClick < interval * 1000) {
            AssetsManager.tipDialog('请勿频繁操作');
            return false;
        }
        return true;
    },

    onChat(data) {
        let idx = BPMJModel.getUserIndexByUID(data.uid)
        let com = this._userList[idx];
        if (com) com.gameChat(data)
    },
    // 好友邀请
    onShowInvite() {
        AssetsManager.createDialog({
            path: "prefab/public/InviteFriend",
            gameRule: BPMJModel.getGameRule(),
            bundle: ConfigModel.getSkin()
        })
    },
    /**GPS定位检查 */
    verifyZuobi(roomUserInfo) {
        if (!BPMJModel.getGameRuleByKey("fangzuobi")) return;
        if (!roomUserInfo || roomUserInfo.chairID >= BPMJModel.getChairCount()) return;
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
    onGift(fromChairID, toChairID, giftID) {
        let fidx = BPMJModel.getUserIndexByChairID(fromChairID)
        let tidx = BPMJModel.getUserIndexByChairID(toChairID)
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

    /**判断人数，初始化头像位置 */
    seatsInit() {
        if (this._userList.length > 0) {
            return
        }
        let chairCount = BPMJModel.getChairCount();
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
            let headNode = cc.find("head" + i, this.node);
            if (headNode) headNode.active = false;
        }
        for (let i = 0; i < headPos.length; i++) {
            let CurIndex = headPos[i],
                CurHeadNode = null;
            let headAddNode = cc.find("head" + CurIndex, this.node);
            headAddNode && headAddNode.removeAllChildren();
            if (CurIndex == 0 || CurIndex == 3) {
                CurHeadNode = cc.instantiate(this.headLeft)
            } else {
                CurHeadNode = cc.instantiate(this.headRight)
            }
            if (!!CurHeadNode) {
                this._userList.push(CurHeadNode.getComponent("BPMJHead"));
                CurHeadNode.parent = headAddNode;
                this._userList[i].initRes();
            }
            let handTile = cc.find("handTiles" + CurIndex, this.tilesNode);
            let optTile = cc.find("optTiles" + CurIndex, this.tilesNode);
            if (!optTile) {
                optTile = cc.find("optTiles" + CurIndex, handTile);
            }
            let disTile = cc.find("outTiles" + CurIndex, this.tilesNode);
            let huaTile = cc.find("huaTiles" + CurIndex, this.tilesNode);
            this._handTileMgrList.push(handTile.getComponent("BPMJHandTileMgr"));
            this._handTileMgrList[i].init(CurIndex);
            this._optTileMgrList.push(optTile.getComponent("BPMJOptTileMgr"));
            this._optTileMgrList[i].init(CurIndex);
            this._disTileMgrList.push(disTile.getComponent("BPMJOutTileMgr"));
            this._disTileMgrList[i].init(CurIndex);

            let opNode = cc.find("operAct" + CurIndex, this.node);
            this._operActNodeList.push(opNode);
        }
    },

    /**清除桌面上所有牌 */
    resetTable() {
        this._userList.forEach(c => {
            c.setBanker(false)
            c.setLight(false)
        });
        this._handTileMgrList.forEach(c => {
            c.reset()
        });
        this._disTileMgrList.forEach(c => {
            c.reset()
        });
        this._optTileMgrList.forEach(c => {
            c.reset()
        });
        this._operActNodeList.forEach(n => {
            n.removeAllChildren()
        })

        this._huPai = {};
        this._canWinList = [];
        this.deleteFlyNode();
        this.updatePointer();
        this.setTilesGary(-1);
        this.com_clock.reset();
        this.com_opt.onClearTurn();
        this.btn_ting.active = false;
        this.com_ting.node.active = false;
        this.onLastTilesCountUpdate(0);
        if (!!this._ghostCard) {
            this.ghostCard.scale = 1.3;
            this.ghostCard.stopAllActions();
            this._ghostCard.setNodeShow(false);
        }
    },


    initGame() {
        this._huPai = {};
        AssetsManager.init(this.node);
        this._aniX = this.btnAniList[0].x;
        cc.systemEvent.on(Events.clientEvents.gvUploadFileSuccess, this._onUploadSuccess, this);
        cc.game.on(cc.game.EVENT_SHOW, this.onEventShow, this);
        MessageCallback.addListener('RoomMessagePush', this);
        MessageCallback.addListener('GameMessagePush', this);
        MessageCallback.addListener('ReconnectSuccess', this);
        MessageCallback.addListener('SelfEntryRoomPush', this);
        MessageCallback.addListener('CreateRoomFail', this);
        MessageCallback.addListener('QuickJoinFail', this);
        MessageCallback.addListener('JoinGameAgainPush', this);
        MessageCallback.addListener('OnGameOnceAgain', this);
        MessageCallback.addListener('TestClickReq', this)
        cc.systemEvent.on("tileUp", this.onTileUp, this);
        this._ghostCard = this.ghostCard.addComponent('BPMJSingleTile');
        this._ghostCardCPos = this.ghostCard.getPosition();
        if (!!this._ghostCard) {
            this._ghostCard.init();
            this._ghostCard.setNodeShow(false);
        }

        this.getRoomSceneInfo(); //获取场景信息
        this.updatePointer();
    },

    onTestClick() {
        let jushu = BPMJModel.getCurBureau()
        let tmp = UserModel.getData("isTest")
        if (!tmp || jushu <= 0) {
            return
        }
        AssetsManager.createDialog({
            bundle: Enums.bundleType.BPMJ,
            path: "res/prefab/BPMJShowTest",
            mainDialog: this
        })
    },

    onDestroy() {
        cc.systemEvent.off(Events.clientEvents.gvUploadFileSuccess, this._onUploadSuccess, this);
        cc.game.off(cc.game.EVENT_SHOW, this.onEventShow, this);
        MessageCallback.removeListener('RoomMessagePush', this);
        MessageCallback.removeListener('GameMessagePush', this);
        MessageCallback.removeListener('ReconnectSuccess', this);
        MessageCallback.removeListener('SelfEntryRoomPush', this);
        MessageCallback.removeListener('CreateRoomFail', this);
        MessageCallback.removeListener('QuickJoinFail', this);
        MessageCallback.removeListener('JoinGameAgainPush', this);
        MessageCallback.removeListener('OnGameOnceAgain', this);
        MessageCallback.removeListener('TestClickReq', this)
        cc.systemEvent.off("tileUp", this.onTileUp, this);
        ConfigModel.setData('lastScene', 'qzmj');
        AssetsManager.release();
    },

    _onUploadSuccess(fileId) {
        // console.log("接受到回调", fileId);
        this._lastChatTick = this._lastChatTick || 0;
        if ((Date.now() - this._lastChatTick) < 2000) {
            AssetsManager.tipDialog("亲，请勿频繁发送消息哦~");
            return;
        }
        this._lastChatTick = Date.now();
        ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(Enums.chatType.VOICE, fileId, null))
    },
    update(dt) { },

});