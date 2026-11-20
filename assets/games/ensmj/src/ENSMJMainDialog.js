const ApiEnsmj = require('./ApiEnsmj');
const ApiRoom = require('../../../src/api/ApiRoom');;
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const UserModel = require('../../../src/model/UserModel');
const Codes = require('../../../src/const/Codes');
const ConfigModel = require('../../../src/model/ConfigModel');
const NativeUtil = require('../../../src/utils/NativeUtil');
const ENSMJModel = require('./ENSMJModel');
const ENSMJLogic = require('./ENSMJLogic');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const SubManager = require('../../../src/utils/SubManager');
const Events = require('../../../src/const/Events');
const MessageCallback = require('../../../src/utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        com_opt: require("ENSMJOperate"),
        com_clock: require("ENSMJClock"),
        com_ting: require("ENSMJTingTips"),
        readyTick: require('ENSMJReadyTick'),
        pointer: cc.Node,
        tuoguan: cc.Node,
        menuLay: cc.Node,
        menuLayList: cc.Node,
        txt_last: cc.Label,
        txt_round: cc.Label,
        txt_roomId: cc.Label,
        txt_gameName: cc.Label,
        btn_location: cc.Node,
        btn_copy: cc.Node,
        btn_invite: cc.Node,
        btn_ready: cc.Node,
        btn_leave: cc.Node,
        btn_dismiss: cc.Node,
        btn_shezhi: cc.Node,
        btn_ting: cc.Node,
        btn_deposit: cc.Node,
        btn_menu: cc.Node,
        btnBackHall: cc.Node,
        operActPfb: cc.Prefab,
        btnYuYin: cc.Node,
        canNotDismissBar: cc.Node,

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
        _menuLayPos: null,
    },

    onLoad() {
        this.onInIt();
    },
    /**消息监听 */
    messageCallbackHandler(route, msg) {
        // console.log("恩施麻将=》route", route, msg.type, msg.data)
        if (route === 'RoomMessagePush') {
            if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
                this.gameInit(msg.data);
            } else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
                ENSMJModel.otherUserJoinRoom(msg.data.roomUserInfo);
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
                msg.data.myChairID = ENSMJModel.getMyChairID();
                AssetsManager.disDialog(msg.data);
                ENSMJModel.setResult(null);
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
                let CurIndex = ENSMJModel.getUserIndexByChairID(msg.data.chairID);
                let userCtrl = this._userList[CurIndex];
                if (userCtrl) userCtrl.setOffline(true);
            } else if (msg.type === ApiRoom.ROOM_USER_INFO_CHANGE_PUSH) { //用户信息刷新
                this._userList.forEach(ctrl => {
                    !!ctrl && ctrl.userInfoChange(msg.data);
                });
            } else if (msg.type === ApiRoom.ROOM_USER_WIN_TOTAL_PUSH) {
                this.initTotalScore(msg.data.userWinTotalScore);
            }
        } else if (route === 'GameMessagePush') {
            if (msg.type === ApiEnsmj.GAME_BUREAU_PUSH) {
                this.onGameRoundUpdate(msg.data);
            } else if (msg.type === ApiEnsmj.GAME_STATUS_PUSH) { //游戏状态
                ENSMJModel.setGameStatus(msg.data.gameStatus);
                this.onGameStatusUpdate(msg.data);
            } else if (msg.type === ApiEnsmj.GAME_SEND_CARDS_PUSH) { //发牌
                // console.log("603==发玩家手牌", msg.data)
                this.deleteMoveNode();
                this.com_clock.hideDice();
                this.onSendTiles(msg.data, true);
            } else if (msg.type === ApiEnsmj.GAME_DICES_PUSH) {
                this.com_clock.showDiceAni(msg.data.dice1, msg.data.dice2);
            } else if (msg.type === ApiEnsmj.GAME_TURN_OPERATE_PUSH) { //用户操作广播
                // console.log("615==用户操作广播", msg.data);
                this.deleteMoveNode();
                ENSMJModel.onUserOpt(msg.data);
                this.onUserOpt(msg.data);
                this.checkTingPai()
            } else if (msg.type === ApiEnsmj.GAME_TURN_PUSH) { //通知用户操作
                // console.log("614==通知用户操作", msg.data);
                this.deleteMoveNode();
                ENSMJModel.onGameTurn(msg.data);
                this.onGameTurn(msg.data);
            } else if (msg.type === ApiEnsmj.GAME_ALL_HU_CARDS_PUSH) { //更新不能出的牌
                // console.log("627==更新不能出的牌==", msg.data)
                ENSMJModel.setSelfAllHuCards(msg.data)
                let isMyTurn = ENSMJModel.isTurn(ENSMJModel.getMyUID())
                this._handTileMgrList[0].setTouch(isMyTurn)
            } else if (msg.type === ApiEnsmj.GAME_BANKER_PUSH) { //庄家位置更新
                ENSMJModel.setBankerUID(msg.data.uid);
                this.onBankerUpdate(msg.data.uid);
            } else if (msg.type === ApiEnsmj.GAME_REST_CARDS_COUNT_PUSH) { //剩余牌数量更新
                this.onLastTilesCountUpdate(msg.data.restCardsCount);
            } else if (msg.type === ApiEnsmj.GAME_REVIEW_PUSH) {
                // console.log("607==查看回放==", msg.data.reviewRecord, msg.data.reviewRecord.length)
                let reviewRecord = msg.data.reviewRecord;
                if (reviewRecord && reviewRecord.length > 0) {
                    AssetsManager.createDialog({
                        bundle: Enums.bundleType.ENSMJ,
                        path: "res/prefab/ENSMJResultDialog",
                        reviewRecord: reviewRecord,
                    });
                } else {
                    AssetsManager.tipDialog('暂无回放没有数据');
                }
            } else if (msg.type === ApiEnsmj.GAME_RESULT_PUSH) { //小结算
                // console.log("606==小结算==", msg.data)
                ENSMJModel.setResult(msg.data);
                this.onSmall(msg.data);
            } else if (msg.type === ApiEnsmj.GAME_END_PUSH) {
                // console.log("609==游戏大结算", msg.data);
                ENSMJModel.setAllResult(msg.data);
                this._onEnd(msg.data);
            } else if (msg.type === ApiEnsmj.GAME_TRUST_PUSH) { //开始托管
                if (ENSMJModel.myUid == msg.data.uid) {
                    this.tuoguan.active = msg.data.trust
                }
            } else if (msg.type === ApiEnsmj.GAME_GANG_SCORE_PUSH) { //杠分
                let list = {
                    [msg.data.uid]: msg.data.detail.score
                }
                for (let i = 0; i < msg.data.detail.loseUid.length; i++) {
                    list[msg.data.detail.loseUid[i]] = msg.data.detail.score * -1
                }
                for (const uid in list) {
                    if (Object.hasOwnProperty.call(list, uid)) {
                        const score = list[uid];
                        let index = ENSMJModel.getUserIndexByUID(uid)
                        this.showOptScore(score, index)
                    }
                }
            } else if (msg.type === ApiEnsmj.GAME_QIANG_GANG_DELETE_PUSH) { //抢杠胡之后删除手牌
                // console.log("抢杠胡之后删除手牌==", msg.data)
                ENSMJModel.qiangGangHuDel(msg.data)
                let handCard = ENSMJModel.getHandCards(msg.data.uid, false)
                let CurIndex = ENSMJModel.getUserIndexByUID(msg.data.uid)
                let handCtrl = this._handTileMgrList[CurIndex];
                if (handCtrl) handCtrl.updateStandTiles(handCard)
            }
        } else if (route === 'ReconnectSuccess') {
            this.getRoomSceneInfo();
        } else if (route === 'SelfEntryRoomPush') {
            if (msg.gameType != ENSMJModel.getBundleType()) {
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

    _syncAinm(uid, funs, showNode) {
        if (!showNode) {
            let idx = ENSMJModel.getUserIndexByUID(uid);
            showNode = this._operActNodeList[idx];
        }
        if (showNode) {
            let optNode = cc.instantiate(this.operActPfb);
            let actCtrl = optNode.getComponent('ENSMJOperAct');
            optNode.parent = showNode;
            if (funs) funs(actCtrl);
        }
    },


    /**
     * 同步用户
     * @param {*} uid 
     * @param {*} funs 
     */
    _syncUser(uid, funs) {
        let idx = ENSMJModel.getUserIndexByUID(uid);
        let Ctrl = this._userList[idx];
        if (Ctrl && funs) funs(Ctrl);
    },

    /**初始化和断线重连 */
    gameInit(data) {
        this.resetTable();
        ENSMJModel.init(data);
        this.unscheduleAllCallbacks();
        let myUid = ENSMJModel.getMyUID();
        let gameRule = ENSMJModel.getGameRule();
        ENSMJLogic.init(ENSMJModel.getGameRule());
        let operateUid = data.gameData.operateUid;
        this._gameStatus = data.gameData.gameStatus;
        this.showTestBtn(UserModel.getData("isTest"));
        MessageCallback.emitMessage('RemoveGameResult');
        //房间信息
        let bundle = ConfigModel.getBundleConfig(gameRule.gameType);
        this.txt_roomId.string = `房号:${data.roomID}`;
        this.txt_gameName.string = bundle.name;
        this.onGameRoundUpdate(data.gameData);
        //用户信息
        this.seatsInit();
        let roomUserInfoArr = data.roomUserInfoArr || [];
        for (let i = 0; i < roomUserInfoArr.length; i++) {
            const user = roomUserInfoArr[i];
            this.userEnterRoom(user);
        }
        this.initTotalScore(data.gameData.userWinTotalScore); //输赢统计
        this.onLastTilesCountUpdate(data.gameData.restCardsCount); //剩余牌数
        if (this.canNotDismissBar) this.canNotDismissBar.active = ENSMJModel.getGameRuleByKey("canNotDissmiss")
        //按钮显示
        let unionID = ENSMJModel.isUnionCreate() ? ENSMJModel.getRoomCreatorByKey('unionID') : null;
        let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
        this.btn_ready.active = (this._gameStatus === ApiEnsmj.gameStatus.NONE && data.gameData.userPlayStatus[myUid] == ApiRoom.userStatusEnum.NONE);
        this.btn_invite.active = ENSMJModel.getCurBureau() == 0 && !!isShowInvite;
        this.btn_copy.active = ENSMJModel.getCurBureau() == 0 && !!isShowInvite;
        if (this.btn_ready.active && ENSMJModel.getCurBureau() == 0 && ENSMJModel.getGameRuleByKey("unReadyKick") > 0) {
            let tick = ENSMJModel.getGameRuleByKey("unReadyKick") || 10;
            this.readyTick.sync(tick);
        } else {
            this.readyTick.sync(0);
        }
        let yuyin = ENSMJModel.getGameRuleByKey('yuyin');
        this.btnYuYin.active = !!yuyin && ConfigModel.getData('voiceSpeaker');
        this.btn_location.active = !!ENSMJModel.getGameRuleByKey("showGps");
        this.btn_dismiss.active = data.gameData.curBureau != 0 && !ENSMJModel.getGameRuleByKey("canNotDissmiss");
        this.btn_leave.active = data.gameData.curBureau == 0;
        let userTrustArray = data.gameData.autoUser || {};
        this.tuoguan.active = !!userTrustArray[myUid];
        let tm = ENSMJModel.getGameRuleByKey("trustTm");
        this.btn_deposit.active = tm && tm > 0;


        //状态管理
        this.com_clock.node.active = true;
        this.com_clock.gameInit(ENSMJModel.getChairCount(), ENSMJModel.getMyChairID());
        if (this._gameStatus == ApiEnsmj.gameStatus.NONE && ENSMJModel.getCurBureau() == 0) {
            this.com_clock.node.active = false;
        }
        //牌面恢复
        if (this._gameStatus > ApiEnsmj.gameStatus.DICES) {
            /**恢复手牌 */
            this.onSendTiles(data.gameData, false);
            let users = ENSMJModel.getUsers();
            for (const user of users) {
                let CurIndex = ENSMJModel.getUserIndexByUID(user.uid);
                let PiLaiArray = ENSMJModel.getPiLaiArrayByUID(user.uid);
                this._handTileMgrList[CurIndex].showPiLai(PiLaiArray);//恢复痞赖杠摆牌
                this._userList[CurIndex].showFanVal(user.uid);
                /**恢复吃碰杠的牌 */
                let pengGangArray = ENSMJModel.getPengGangArrayByUID(user.uid);
                if (pengGangArray.length > 0 && !!this._optTileMgrList[CurIndex]) {
                    this._optTileMgrList[CurIndex].updateOptTiles(pengGangArray);
                }
                /**恢复打出的牌 */
                let out = ENSMJModel.getOutTilesByUID(user.uid);
                if (out.length > 0 && !!this._disTileMgrList[CurIndex]) {
                    let last = this._disTileMgrList[CurIndex].showOutTiles(out);
                    if (last && data.gameData.lastOperateUid == user.uid &&
                        last.flower == data.gameData.operateCard) {
                        this.updatePointer(last.node)
                    }
                }
            }

            if (this._gameStatus === ApiEnsmj.gameStatus.PLAYING) {
                /**恢复方向指示 */
                let curOptIdx = ENSMJModel.getUserIndexByUID(operateUid);
                this.com_clock.setDir(curOptIdx);
                this.com_clock.setTick(data.gameData.tick);
                /**设置该谁出牌 */
                if (myUid == operateUid) { //&& data.gameData.lastOperateUid != myUid
                    this._handTileMgrList[0].setIsMyTurn();
                    if (!data.gameData.operateCard) {
                        this._handTileMgrList[0].setPengChu();
                    }
                }

                /**设置胡牌顺序 */
                let userHuList = data.gameData.userHuDoneList
                if (userHuList && Array.isArray(userHuList)) {
                    for (let i = 0; i < userHuList.length; i++) {
                        let huUser = userHuList[i];
                        if (huUser) {
                            this.showHuIdx({
                                uid: huUser.uid,
                                card: huUser.card,
                                operate: huUser.operateType,
                                plusInfo: {
                                    index: huUser.huIndex
                                },
                            })
                        }
                        /**恢复胡的那张牌 */
                        let huIdx = ENSMJModel.getUserIndexByUID(huUser.uid);
                        let hcom = this._handTileMgrList[huIdx];
                        if (hcom) hcom.setHuTile(huUser.card);
                    }
                }
                this.checkTingPai();
            } else {
                this.btn_ting.active = false;
            }
        }

        if (data.gameData.userCanOperate && data.gameData.userCanOperate[myUid]) {
            let userOperate = data.gameData.userCanOperate[myUid];
            userOperate.operateCard = data.gameData.operateCard;
            this.com_opt.gameInit(userOperate);
        }
    },

    /**判断人数，初始化头像位置 */
    seatsInit() {
        let chairCount = ENSMJModel.getChairCount();
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
            let CurIndex = headPos[i];
            let headNode = cc.find("head" + CurIndex, this.node);
            this._userList.push(headNode.getComponent("ENSMJHead"));
            this._userList[i].initRes();

            let handTile = cc.find("RootTiles/handTiles" + CurIndex, this.node);
            let optTile = cc.find("RootTiles/optTiles" + CurIndex, this.node);
            if (!optTile) {
                optTile = cc.find("optTiles" + CurIndex, handTile);
            }
            let disTile = cc.find("RootTiles/outTiles" + CurIndex, this.node);
            this._disTileMgrList.push(disTile.getComponent("ENSMJOutTileMgr"));
            this._disTileMgrList[i].init(CurIndex);

            this._handTileMgrList.push(handTile.getComponent("ENSMJHandTileMgr"));
            this._handTileMgrList[i].init(CurIndex);

            this._optTileMgrList.push(optTile.getComponent("ENSMJOptTileMgr"));
            this._optTileMgrList[i].init(CurIndex);

            let opNode = cc.find("operAct" + CurIndex, this.node);
            this._operActNodeList.push(opNode);

            let huaTile = cc.find("RootTiles/huaTiles" + CurIndex, this.node);
        }
    },

    /**用户进入房间 */
    userEnterRoom(data) {
        this._syncUser(data.uid, (ctrl) => {
            ctrl.init(data);
        })
    },

    /**恢复所有人的总输赢分数 */
    initTotalScore(userWinTotalScore) {
        if (userWinTotalScore && ENSMJModel.scoreState()) {
            let len = Object.keys(userWinTotalScore)
            if (len.length > 0) {
                for (const uid in userWinTotalScore) {
                    if (Object.hasOwnProperty.call(userWinTotalScore, uid)) {
                        const s = userWinTotalScore[uid];
                        this._syncUser(uid, (ctrl) => {
                            ctrl.setTotalScore(s);
                        })
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
        this._syncUser(data.uid, (ctrl) => {
            ctrl.leave();
        })
        if (data.uid == UserModel.getData('uid')) {
            if (!ENSMJModel.getRoomID() || ENSMJModel.getRoomID() == data.roomID) {
                this.enterHall();
            }
        }
    },

    /**玩家准备 */
    onUserReady(data) {
        let idx = ENSMJModel.getUserIndexByChairID(data.chairID);
        let userCtrl = this._userList[idx];
        if (userCtrl) userCtrl.setReady(true);
        if (data.chairID == ENSMJModel.getMyChairID()) {
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
        ENSMJModel.setCurBureau(data.curBureau);
        AssetsManager.clearDialog(['ENSMJFanPai']);
        MessageCallback.emitMessage('RemoveGameResult');
        this.txt_round.string = `${ENSMJModel.getCurBureau()}/${ENSMJModel.getMaxBureau()}局`;
        this.btnBackHall.active = ENSMJModel.getCurBureau() == 0 && ENSMJModel.isUnionCreate();
        this.btn_dismiss.active = ENSMJModel.getCurBureau() != 0 && !ENSMJModel.getGameRuleByKey("canNotDissmiss");
    },

    /**更新剩余牌数量 */
    onLastTilesCountUpdate(count) {
        if (!count) count = 0
        this.txt_last.string = `x${count}`
    },

    /**更新庄家 */
    onBankerUpdate(uid) {
        this._userList.forEach(ctrl => {
            ctrl.setReady(false);
        });
        this._syncUser(uid, (ctrl) => {
            ctrl.setReady(true);
        })
    },

    /**游戏状态跳转 */
    onGameStatusUpdate(data) {
        // console.log("游戏状态===>", data)
        this._gameStatus = data.gameStatus;
        if (this._gameStatus == ApiEnsmj.gameStatus.NONE ||
            this._gameStatus == ApiEnsmj.gameStatus.DICES) {
            this.onLastTilesCountUpdate(0);
        }

        this.hideReadyIcon();
        this.readyTick.sync(0);
        this.com_clock.hideDice();
        this.com_clock.setTick(data.tick);
        this.btn_ready.active = ENSMJModel.getCurBureau() == 0 && this._gameStatus == ApiEnsmj.gameStatus.NONE;
        switch (this._gameStatus) {
            case ApiEnsmj.gameStatus.NONE:
                ENSMJModel.reset();
                this.resetTable();
                break;
            case ApiEnsmj.gameStatus.PLAYING:
                this._handTileMgrList[0].setAllTilesDown();
                break;
            case ApiEnsmj.gameStatus.RESULT:
                break;
            default:
                break;
        }
    },

    /**发牌 */
    onSendTiles(data, isAnim) {
        if (!data.handCards) return;
        let handCards = data.handCards;
        this.com_clock.showPiLai(false);
        ENSMJModel.setHandCards(handCards);
        ENSMJModel.setGhostCard(data.laiZiCards);
        ENSMJModel.setPilaiCardBegin(data.pilaiCardBegin);
        let lastOpt = ENSMJModel.getLastOperate();
        let isTest = UserModel.getData('isTest');
        for (const uid in handCards) {
            let idx = ENSMJModel.getUserIndexByUID(uid);
            let userObj = ENSMJModel.getUserByUID(uid);
            let handCtrl = this._handTileMgrList[idx];
            if (!userObj || !handCtrl) continue;
            if (!isAnim) ENSMJModel.delZimoCard(uid);
            let tiles = ENSMJModel.getHandCards(uid, false)
            let drawTile = !!lastOpt && lastOpt.uid == uid && lastOpt.operate == ApiEnsmj.operateType.GET ? lastOpt.card : null;
            if (drawTile != null) {
                tiles.splice(tiles.indexOf(drawTile), 1)
                handCtrl.setDrawTile(drawTile)
            }
            if (idx == 0 || !isTest) {
                handCtrl.updateStandTiles(tiles, null, isAnim);
            } else {
                handCtrl.updateLieTiles(tiles, null);
            }
        }
        if (isAnim) {
            AssetsManager.createDialog({
                parent: this.node,
                path: "res/prefab/ENSMJFanPai",
                bundle: Enums.bundleType.ENSMJ,
                callback: () => { this.com_clock.showPiLai(true); },
            });
        } else {
            this.com_clock.showPiLai(true);
        }
    },

    /**通知用户操作 */
    onGameTurn(turn) {
        this.setTilesGary(-1);
        let data = Utils.deepCopy(turn);
        this.com_clock.setTick(data.tick);
        let isTest = UserModel.getData('isTest');
        // console.log("通知用户操作=》", data.uid, data);
        let CurIndex = ENSMJModel.getUserIndexByUID(data.uid);
        this.com_clock.setDir(CurIndex);

        let isMoPai = false;
        if (data.operateArray && (data.operateArray.indexOf(ApiEnsmj.operateType.QI) != -1 || data.operateArray.indexOf(ApiEnsmj.operateType.GET) != -1)) {
            //通知出牌
            isMoPai = data.operateArray.indexOf(ApiEnsmj.operateType.GET) != -1 || data.card != null;
            for (let i = 0; i < this._handTileMgrList.length; i++) {
                const comp = this._handTileMgrList[i];
                if (!comp) continue;
                if (CurIndex == i) {
                    if (isMoPai && (CurIndex == 0 || !isTest)) {
                        comp.setDrawTile(data.card, CurIndex == 0);
                    } else if (isMoPai && !!isTest && CurIndex != 0) {
                        comp.setHuTile(data.card);
                    }
                    if (isMoPai) {
                        AssetsManager.playEffect({
                            path: 'res/audio/main/give',
                            bundle: Enums.bundleType.ENSMJ
                        });
                    }
                    if (CurIndex == 0 && data.operateArray.indexOf(ApiEnsmj.operateType.QI) != -1) {
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

        if (turn.operateArray && turn.operateArray.length > 0 && !turn.operateArray.includes(ApiEnsmj.operateType.GET)) {
            this.com_opt.onGameTurn(turn);
        } else {
            this.com_opt.onClearTurn();
        }
        this.checkTingPai();
    },

    /**检查 听牌 */
    checkTingPai() {
        let myUid = ENSMJModel.getMyUID();
        let operateUid = ENSMJModel.getCurOptUID();
        let CurIndex = ENSMJModel.getUserIndexByUID(myUid);
        let handCards = ENSMJModel.getHandCards(myUid);
        let hadnCtrl = this._handTileMgrList[CurIndex];
        let handCardsArr = handCards.slice();
        if (!ENSMJModel.isCanShowTingBtn()) {
            this._tingList = []
            this._canWinList = []
            this.btn_ting.active = false
            return
        }
        let checkXiaoXue = (list) => {
            /**如果选了小血禁胡要进行判断 */
            let xiaoXueFilter = [ApiEnsmj.cardType.XIAOXUE, ApiEnsmj.cardType.PIHU]
            if (ENSMJModel.getGameRuleByKey("xiaoxuejinhu") && !ENSMJModel.getSelfIsGang()) {
                // console.log("检测小雪1111111==", Utils.deepCopy(list))
                for (let i = 0; i < list.length; i++) {
                    const info = list[i];
                    if (xiaoXueFilter.includes(info.type)) {
                        list.splice(i, 1)
                        i--
                    }
                }
                // console.log("检测小雪22222222==", Utils.deepCopy(list))
            }
        }
        let operateRecords = ENSMJModel.getOperateRecords(myUid);
        if (operateUid == myUid) {
            //判断是否需要删除手牌
            this._tingList = [];
            let tingCards = [];
            let repeatFilter = Array.from(new Set(handCardsArr));
            for (const cardId of repeatFilter) {
                let copyTingHandCards = handCardsArr.slice();
                let tingFilter = ENSMJModel.tingFilter(cardId, copyTingHandCards);
                let canTingList = ENSMJLogic.getTingList(tingFilter.cards, tingFilter.ghostCardsCount, operateRecords);
                checkXiaoXue(canTingList)

                if (canTingList && canTingList.length) {
                    tingCards.push(cardId);
                }
            }
            this._tingList = Array.from(new Set(tingCards));
            if (this._tingList.length && hadnCtrl) {
                hadnCtrl.setTingIcons(this._tingList);
            }
        } else {
            //不是自己操作 去掉打听标记 显示听牌按钮
            if (hadnCtrl) hadnCtrl.setTingIcons();

            let winTingFilter = ENSMJModel.tingFilter(null, handCardsArr);
            let canWinList = ENSMJLogic.getTingList(winTingFilter.cards, winTingFilter.ghostCardsCount, operateRecords);
            checkXiaoXue(canWinList)
            this.btn_ting.active = canWinList.length > 0;
            let ghostCard = ENSMJModel.getGhostCard();
            if (canWinList.length > 0 && ghostCard > 0) {
                let ghostCheck = canWinList.find((info) => {
                    return info.cardID == ghostCard
                });
                if (!ghostCheck) {
                    canWinList.push({
                        cardID: ghostCard,
                        rate: 1
                    })
                }
            }
            this._canWinList = canWinList;
        }

    },

    showTingLight() {
        let tiles = ENSMJModel.getHandCards(ENSMJModel.getMyUID())
        if (tiles.length >= 14) {
            return
        }
        let checkXiaoXue = (list) => {
            /**如果选了小血禁胡要进行判断 */
            let xiaoXueFilter = [ApiEnsmj.cardType.XIAOXUE, ApiEnsmj.cardType.PIHU]
            if (ENSMJModel.getGameRuleByKey("xiaoxuejinhu") && !ENSMJModel.getSelfIsGang()) {
                // console.log("检测小雪1111111==", Utils.deepCopy(list))
                for (let i = 0; i < list.length; i++) {
                    const info = list[i];
                    if (xiaoXueFilter.includes(info.type)) {
                        list.splice(i, 1)
                        i--
                    }
                }
                // console.log("检测小雪22222222==", Utils.deepCopy(list))
            }
        }
        let pgList = ENSMJModel.getOperateRecords(ENSMJModel.getMyUID())
        let winTingFilter = ENSMJModel.tingFilter(null, tiles.slice());
        let canWinList = ENSMJLogic.getTingList(winTingFilter.cards, winTingFilter.ghostCardsCount, pgList);
        checkXiaoXue(canWinList)
        if (canWinList && canWinList.length > 0) { //如果听牌，播放听牌光效
            this._syncAinm(null, (com) => {
                let node = this._handTileMgrList[0].node
                let pos = CCUtil.postionConvert(node, this._operActNodeList[0])
                com.showTingLight()
                com.node.setPosition(pos)
                com.node.scale = node.scale
            }, this._operActNodeList[0])
        }
    },

    /**展示胡牌序列 */
    showHuIdx(data, isAnim = false) {
        return
        data && this._syncAinm(data.uid, (ctrl) => {
            ctrl.showHuIndex(data.operate, data.plusInfo.index, data.uid, isAnim);
        })
    },

    /**用户操作广播 */
    onUserOpt(data) {
        this.setTilesGary(-1);
        this.com_opt.onClearTurn();
        let plusInfo = data.plusInfo || null;
        let isTest = UserModel.getData("isTest");
        let CurIndex = ENSMJModel.getUserIndexByUID(data.uid);
        let CurUserCtrl = this._userList[CurIndex];
        let CurHandCtrl = this._handTileMgrList[CurIndex];
        let CurHandCard = ENSMJModel.getHandCards(data.uid, false);
        let CurUserInfo = CurUserCtrl ? CurUserCtrl.getUserData() : null;
        let CurUserSex = !!CurUserInfo && (CurUserInfo.userInfo.sex == 0) ? 'nan' : 'nv';
        CurUserCtrl && CurUserCtrl.showFanVal(data.uid);

        if (data.uid == ENSMJModel.getMyUID()) {
            this.com_ting.node.active = false;
            this._handTileMgrList[0].setTingIcons();
        }
        //展示分数
        if (plusInfo && plusInfo.winScoreRecord && plusInfo.winScoreRecord.length > 0) {
            for (let i = 0; i < plusInfo.winScoreRecord.length; i++) {
                let index = ENSMJModel.getUserIndexByChairID(i);
                const score = plusInfo.winScoreRecord[i];
                this.showOptScore(score, index);
            }
        }
        //隐藏所有位置的摸的那张牌
        for (let i = 0; i < this._handTileMgrList.length; i++) {
            const handCtrl = this._handTileMgrList[i];
            if (handCtrl) {
                if (i == 0 || !isTest) {
                    handCtrl.setDrawTile();
                } else {
                    handCtrl.setHuTile();
                }
            }
        }
        let drawTile = null;
        if (data.operate == ApiEnsmj.operateType.QI) {
            let moOpt = ENSMJModel.getQiByMo(data);
            if (!!moOpt && moOpt.card != data.card) {
                drawTile = moOpt.card;
            }
        }
        if (CurHandCtrl) {
            if (CurIndex != 0 && !!isTest) {
                CurHandCtrl.updateLieTiles(CurHandCard);
            } else {
                drawTile = CurIndex == 0 ? drawTile : null;
                CurHandCtrl.updateStandTiles(CurHandCard, drawTile);
            }
        }

        let optPengGang = () => {
            let pengGangArray = ENSMJModel.getPengGangArrayByUID(data.uid);
            let optCom = this._optTileMgrList[CurIndex];
            if (optCom) optCom.updateOptTiles(pengGangArray);
            let lastOut = ENSMJModel.getLastOutCardRecord();
            if (!!lastOut.isDel) {
                let localIndex = ENSMJModel.getUserIndexByUID(lastOut.opt.uid);
                this._disTileMgrList[localIndex].afterOptUpdateTiles(lastOut.opt.card);
                this.updatePointer();
            }
        }

        let optHu = () => {
            if (CurHandCtrl) {
                let huNode = CurHandCtrl.setHuTile(data.card)
                let optNode = this._operActNodeList[CurIndex]
                this.scheduleOnce(() => {
                    this._syncAinm(null, (aniCom) => {
                        let pos = CCUtil.postionConvert(huNode, optNode)
                        aniCom.node.setPosition(pos)
                        aniCom.node.scale = CurHandCtrl.node.scale
                        aniCom.showHuLight()
                    }, optNode)
                }, 0.2)
            }
            let lastOut = ENSMJModel.getLastOutCardRecord();
            if (!!lastOut.isDel) {//删除桌子上的牌
                let localIndex = ENSMJModel.getUserIndexByUID(lastOut.opt.uid);
                this._disTileMgrList[localIndex].afterOptUpdateTiles(lastOut.opt.card);
                this.updatePointer();
            }
        }


        let showAnim = (ainmType) => {
            let audioType = ainmType;
            let audioList = ["chi", "peng", "gang", "hu", "zimo", "men"];
            if (audioType < audioList.length) {
                AssetsManager.playEffect({
                    bundle: Enums.bundleType.ENSMJ,
                    path: `res/audio/${CurUserSex}/${audioList[audioType]}`,
                });
            }
            if (this._JiPaiAinm) {
                this._JiPaiAinm = false;
                return
            }
            if (ainmType >= 3) {
                this.showHuIdx(data, true);
            }
            //展示动画
            let optNode = cc.instantiate(this.operActPfb);
            let CtrlAct = optNode.getComponent('ENSMJOperAct');
            if (ainmType == 2) {
                let curType = 5; //刮风
                if (data.operate === ApiEnsmj.operateType.GANG_ZHI) {
                    curType = 7 //下雨
                }
                optNode.parent = this.node;
                CtrlAct.showOpt(curType);
            } else {
                optNode.parent = this._operActNodeList[CurIndex];
                CtrlAct.showOpt(ainmType);
            }
        }

        switch (data.operate) {
            case ApiEnsmj.operateType.QI: //出牌
                AssetsManager.playEffect({
                    bundle: Enums.bundleType.ENSMJ,
                    path: `res/audio/${CurUserSex}/` + data.card,
                });
                AssetsManager.playEffect({
                    path: 'res/audio/main/push',
                    bundle: Enums.bundleType.ENSMJ
                });
                if (CurIndex == 0) {
                    this._handTileMgrList[0].setTouch(false)
                }
                /**更新桌子上的牌 */
                let last = null,
                    disCom = this._disTileMgrList[CurIndex];
                let out = ENSMJModel.getOutTilesByUID(data.uid);
                if (disCom) last = disCom.showOutTiles(out)
                if (last && last.flower == data.card) {
                    this.updatePointer(last.node);
                }
                if (CurIndex == 0) {
                    this.showTingLight()
                }
                break;
            case ApiEnsmj.operateType.CHI: //吃牌
                showAnim(0)
                optPengGang()
                break;
            case ApiEnsmj.operateType.PENG: //碰牌
                showAnim(1)
                optPengGang()
                break;
            case ApiEnsmj.operateType.GANG_BU: //补杠
                showAnim(2)
                optPengGang()
                break;
            case ApiEnsmj.operateType.GANG_CHI: //吃杠
                showAnim(2)
                optPengGang()
                break;
            case ApiEnsmj.operateType.GANG_ZHI: //暗杠
                showAnim(2)
                optPengGang();
                break;
            case ApiEnsmj.operateType.HU_CHI: //接炮
                showAnim(3);
                optHu();
                break;
            case ApiEnsmj.operateType.HU_ZHI: //自摸
                showAnim(4)
                optHu();
                break;
            case ApiEnsmj.operateType.HU_QIANG: //抢杠
                showAnim(3)
                optHu();
                break;
            case ApiEnsmj.operateType.BU_PILAI: //补痞癞操作
                let PiLaiArray = ENSMJModel.getPiLaiArrayByUID(data.uid);
                CurHandCtrl && CurHandCtrl.showPiLai(PiLaiArray);
                optPengGang()
                showAnim(2)
                break;
            default:
                break;
        }
    },


    onSmall(data) {
        this.deleteMoveNode();
        this.com_opt.node.active = false;
        let myUid = ENSMJModel.getMyUID();
        let isTest = UserModel.getData("isTest");
        let result = JSON.parse(JSON.stringify(data.result));
        if (!!result) {
            AssetsManager.playEffect({
                path: 'res/audio/main/push',
                bundle: Enums.bundleType.ENSMJ
            });
            for (const user of result) {
                if (user.userHuList && user.huType) {
                    let cardType = 0
                    if (user.userHuList.cardTypeList && user.userHuList.cardTypeList[0]) cardType = user.userHuList.cardTypeList[0].type
                    this._syncAinm(user.uid, (ctrl) => {
                        ctrl.showHuType(cardType, true);
                    })
                }
                if (!user || user.uid == myUid) continue; //处理没有调试权限时其他人摊牌
                if (!user.userCards || !user.userCards[user.uid]) continue;
                let CurIndex = ENSMJModel.getUserIndexByUID(user.uid);
                if (!this._handTileMgrList[CurIndex]) continue;
                let userCards = user.userCards[user.uid];
                if (user.winScores > 0) {
                    let huFilter = [ApiEnsmj.operateType.HU_ZHI];
                    user.huCards = user.huCards || [];
                    if (huFilter.indexOf(user.huType) != -1) { //赢家删除胡牌
                        let huCardIndex = userCards.indexOf(user.huCards);
                        if (huCardIndex >= 0) {
                            userCards.splice(huCardIndex, 1);
                        }
                    }
                    this._handTileMgrList[CurIndex].setHuTile(user.huCards);
                }
                userCards = ENSMJModel.sortTiles(user.uid, userCards);
                this._handTileMgrList[CurIndex].updateLieTiles(userCards);
            }
        }
        let createResultDialog = () => {
            data.mainComp = this;
            data.isResult = true;
            data.bundle = Enums.bundleType.ENSMJ;
            data.onEnd = this._onEnd.bind(this);
            data.path = "res/prefab/ENSMJResultDialog";
            data.enterHall = this.enterHall.bind(this);
            data.isBureauFull = (ENSMJModel.getCurBureau() == ENSMJModel.getMaxBureau());
            AssetsManager.createDialog(data);
        }
        this.scheduleOnce(createResultDialog, 2);
    },

    _onEnd(data) {
        if (!!ENSMJModel.getResult()) return;
        UserModel.setData('roomID', '');
        ENSMJModel.setAllResult(null);
        if (data.result.length > 0) {
            this.showMJAllResultFunc = () => {
                this.showMJAllResultFunc = null;
                data.mainComp = this;
                data.isUnionCreate = ENSMJModel.isUnionCreate();
                data.enterHall = this.enterHall.bind(this);
                data.roomDismissReason = data.reason;
                data.path = 'res/prefab/ENSMJAllResult';
                data.bundle = Enums.bundleType.ENSMJ;
                this.unscheduleAllCallbacks();
                this.scheduleOnce(() => {
                    MessageCallback.emitMessage('RemoveGameResult');
                    AssetsManager.createDialog(data);
                }, 2);
            };
            this.showMJAllResultFunc && this.showMJAllResultFunc();
        } else {
            this.enterHall();
        }
    },

    /**展示操作分数 */
    showOptScore(score, index) {
        // console.log("展示操作分数", score)
        if (!score || score == 0) return
        return
        let operActNode = this._operActNodeList[index];
        this._syncAinm(null, (ctrl) => {
            ctrl.showOptScoreAni(score, index)
        }, operActNode)
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
        this._handTileMgrList.forEach(ctrl => {
            ctrl.reset()
        });
        this._disTileMgrList.forEach(ctrl => {
            ctrl.reset()
        });
        this._optTileMgrList.forEach(ctrl => {
            ctrl.reset()
        });

        this._userList.forEach(ctrl => {
            ctrl.reset();
        });
        this._operActNodeList.forEach(node => {
            node.removeAllChildren()
        })
        this._canWinList = [];
        this.deleteFlyNode();
        this.updatePointer();
        this.setTilesGary(-1);
        this.com_opt.reset();
        this.com_clock.reset();
        this.btn_ting.active = false;
        this.com_ting.node.active = false;
        this.onLastTilesCountUpdate(0);
    },

    /**手牌点击，牌被抬起来 */
    onTileUp(tileCom) {
        /**打听显示 */
        let myUid = ENSMJModel.getMyUID();
        this.com_ting.node.active = false;
        let handCards = ENSMJModel.getHandCards(myUid)
        if (this._tingList.includes(tileCom.flower)) {
            let myTiles = handCards.slice();
            let tingFilter = ENSMJModel.tingFilter(tileCom.flower, myTiles);
            let canWinList = ENSMJLogic.getTingList(tingFilter.cards, tingFilter.ghostCardsCount);
            if (canWinList.length > 0) {
                this.com_ting.showWinCards(canWinList)
            }
        }
        /**桌面上的牌和吃碰杠的牌 相同的牌变灰 */
        this.setTilesGary(tileCom.flower)
    },

    /**显示摆牌 */
    onShowBaiPai(baiPaiList) {

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

    showTestBtn(isShow) {
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

    /**按钮响应 */
    btnClickCallFunc(event, param) {
        switch (event.target.name) {
            case "btn_menu": //菜单
                this._showMenu();
                break;
            case "node_menu": //关闭菜单
                this._hideMenu();
                break
            case "btn_leave": //离开房间
                this._hideMenu();
                if (!UserModel.isInRoom()) {
                    this.enterHall();
                    return;
                }
                if (ENSMJModel.getCurBureau() == 0) {
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
                this._hideMenu();
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
                this._hideMenu();
                if (CCUtil.clickInterval(event.target, 10)) return;
                AssetsManager.tipDialog('刷新界面可以修复游戏显示问题');
                this.getRoomSceneInfo();
                break;
            case "btn_setting": //设置
                this._hideMenu();
                AssetsManager.setDialog({
                    type: "mahjong",
                    gameType: Enums.bundleType.ENSMJ,
                    musicType: Enums.bundleType.MAHJONG,
                });
                break;
            case "btn_review": //回看
                this._hideMenu();
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiEnsmj.gameReviewNotify());
                break;
            case "btn_msg": //聊天
                this._hideMenu();
                if (CCUtil.clickInterval(event.target, 1)) return;
                let params = {
                    gameRule: ENSMJModel.getGameRule(),
                    chat: (chat) => {
                        ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
                    }
                }
                AssetsManager.chatDialog(params);
                break;
            case "btn_rules": //规则
                this._hideMenu();
                if (CCUtil.clickInterval(event.target, 1)) return;
                let rule = ENSMJModel.getGameRule();
                if (!rule) return;
                AssetsManager.tableDialog({
                    gameRule: rule,
                });
                break;
            case "btn_ting": //听牌
                this._hideMenu();
                // this._canWinList = ENSMJModel.getTingList();
                if (this._canWinList.length > 0 && !this.com_ting.node.active) {
                    for (let i = 0; i < this._canWinList.length; i++) {
                        if (!this._canWinList[i]) continue;
                        this._canWinList[i].count = ENSMJModel.getRestCardCount(this._canWinList[i].cardID);
                    }
                    this.com_ting.showWinCards(this._canWinList);
                } else {
                    this.com_ting.node.active = false;
                }
                break;
            case "btn_location": //定位
                this._hideMenu();
                if (CCUtil.clickInterval(event.target, 1)) return;
                AssetsManager.locationDialog({
                    users: ENSMJModel.getUsers(),
                    chairCount: ENSMJModel.getChairCount(),
                    fangzuobi: ENSMJModel.getGameRuleByKey('fangzuobi')
                })
                break;
            case "btn_deposit": //开始托管
                this._hideMenu();
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiEnsmj.gameTrushNotify(true));
                break;
            case "btn_quxiaotuoguan": //取消托管
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiEnsmj.gameTrushNotify(false));
                break;
            case "btn_invite": //邀请
                this._hideMenu();
                let gameRule = ENSMJModel.getGameRule();
                gameRule = gameRule || {};
                gameRule.roomId = ENSMJModel.getRoomID();
                let share = ConfigModel.getRoomRuleShare(gameRule);
                NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
                break;
            case "btn_copy": //复制
                let str = ConfigModel.getRoomShare(Enums.bundleType.ENSMJ, ENSMJModel.getRoomID());
                NativeUtil.copyText(str);
                break;
            case "btn_back":
                this.enterHall()
                break;
            default:
                break;
        }
    },

    // 好友邀请
    onShowInvite() {
        AssetsManager.friendDialog({
            gameRule: ENSMJModel.getGameRule(),
        })
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
            ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
        } else {
            this.enterHall();
        }
    },

    /**返回大厅 */
    enterHall() {
        let isUnionCreate = ENSMJModel.isUnionCreate();
        let unionID = !!isUnionCreate ? ENSMJModel.getRoomCreatorByKey('unionID') : null;
        SubManager.exitBundle(unionID);
    },

    /**GPS定位检查 */
    verifyZuobi(roomUserInfo) {
        if (!ENSMJModel.getGameRuleByKey("fangzuobi")) return;
        if (!roomUserInfo || roomUserInfo.chairID >= ENSMJModel.getChairCount()) return;
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
    onChat(data) {
        this._syncUser(data.uid, (ctrl) => {
            ctrl.gameChat(data)
        })
    },
    onGift(fromChairID, toChairID, giftID) {
        let fidx = ENSMJModel.getUserIndexByChairID(fromChairID)
        let tidx = ENSMJModel.getUserIndexByChairID(toChairID)
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

    onInIt() {
        this.updatePointer();
        this.showTestBtn(false);
        this.btn_deposit.active = false;
        this.btn_location.active = false;
        AssetsManager.init(this.node.parent);
        MessageCallback.addListener(Events.clientEvents.gvUploadFileSuccess, this);
        MessageCallback.addListener('RoomMessagePush', this);
        MessageCallback.addListener('GameMessagePush', this);
        MessageCallback.addListener('ReconnectSuccess', this);
        MessageCallback.addListener('SelfEntryRoomPush', this);
        MessageCallback.addListener('CreateRoomFail', this);
        MessageCallback.addListener('QuickJoinFail', this);
        MessageCallback.addListener('JoinGameAgainPush', this);
        MessageCallback.addListener('OnGameOnceAgain', this);
        cc.game.on(cc.game.EVENT_SHOW, this.onEventShow, this);
        cc.systemEvent.on("tipBaiPai", this.onShowBaiPai, this);
        cc.systemEvent.on("tileUp", this.onTileUp, this);
        this.getRoomSceneInfo();
    },

    start() {
        this.menuLayList.getComponent(cc.Widget) && this.menuLayList.getComponent(cc.Widget).updateAlignment();
        this._menuLayPos = {
            show: cc.v2(),
            hide: cc.v2()
        };
        this._menuLayPos.hide = this.menuLayList.getPosition(cc.v2());
        this._menuLayPos.show = cc.v2(this._menuLayPos.hide.x + this.menuLayList.width + CCUtil.getFixWidget(), this._menuLayPos.hide.y);
        this.menuLayList.opacity = 0;
        this.menuLayList.setPosition(this._menuLayPos.hide);
        this.menuLay.active = false;
    },

    _showMenu() {
        this.btn_menu.active = false
        this.menuLay.active = true;
        this.menuLayList.stopAllActions();
        this.menuLayList.opacity = 0;
        this.menuLayList.setPosition(this._menuLayPos.hide);
        cc.tween(this.menuLayList)
            .to(0.5, {
                opacity: 255,
                position: cc.v3(this._menuLayPos.show)
            }, {
                easing: 'smooth'
            })
            .start();
    },

    _hideMenu() {
        this.btn_menu.active = true
        this.menuLay.active = false;
        this.menuLayList.stopAllActions();
        this.menuLayList.opacity = 0;
        this.menuLayList.setPosition(this._menuLayPos.hide);
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
        ConfigModel.setData('lastScene', 'mhxl');
        AssetsManager.release();
    },

    update(dt) { },
});