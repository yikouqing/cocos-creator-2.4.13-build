const ApiQjmj = require('./ApiQjmj');
const ApiRoom = require('../../../src/api/ApiRoom');;
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const UserModel = require('../../../src/model/UserModel');
const Codes = require('../../../src/const/Codes');
const ConfigModel = require('../../../src/model/ConfigModel');
const NativeUtil = require('../../../src/utils/NativeUtil');
const QJMJModel = require('./QJMJModel');
const QJMJLogic = require('./QJMJLogic');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const SubManager = require('../../../src/utils/SubManager');
const Events = require('../../../src/const/Events');
const MessageCallback = require('../../../src/utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        com_ma: require("QJMJMaPai"),
        com_opt: require("QJMJOperate"),
        com_clock: require("QJMJClock"),
        com_ting: require("QJMJTingTips"),
        com_huanpai: require("QJMJHuanPai"),
        readyTick: require('QJMJReadyTick'),
        huanpaiNode: cc.Node,
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
        _menTilesMgrList: [],
        /**游戏状态 */
        _gameStatus: 0,
        /**听牌列表 */
        _canWinList: [],
        /**打听列表 */
        _tingList: [],
        _menuLayPos: null,
        _isClickReview: false,
    },

    onLoad() {
        this.onInIt();
    },
    /**消息监听 */
    messageCallbackHandler(route, msg) {
        if (msg && msg.type && msg.data) {
            console.log("綦江麻将==接收》", msg.type, msg.data)
        }
        if (route === 'RoomMessagePush') {
            if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
                this.gameInit(msg.data);
            } else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
                QJMJModel.otherUserJoinRoom(msg.data.roomUserInfo);
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
                msg.data.myChairID = QJMJModel.getMyChairID();
                AssetsManager.disDialog(msg.data);
                QJMJModel.setResult(null);
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
                let idx = QJMJModel.getUserIndexByChairID(msg.data.chairID);
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
            if (msg.type === ApiQjmj.GAME_BUREAU_PUSH) {
                this.onGameRoundUpdate(msg.data);
            } else if (msg.type === ApiQjmj.GAME_STATUS_PUSH) { //游戏状态
                QJMJModel.setGameStatus(msg.data.gameStatus);
                this.onGameStatusUpdate(msg.data);
            } else if (msg.type === ApiQjmj.GAME_SEND_CARDS_PUSH) { //发牌
                this.deleteMoveNode();
                this.com_clock.hideDice();
                QJMJModel.setHandCards(msg.data.handCards);
                this.onSendTiles(msg.data, true);
            }

            else if (msg.type === ApiQjmj.GAME_DICES_PUSH) {
                this.com_clock.showDiceAni(msg.data.dice1, msg.data.dice2);
            }
            else if (msg.type === ApiQjmj.GAME_USER_HUAN_PAI_SUGGEST_PUSH) { //换牌推荐
                this.com_huanpai.onUsrHuanPaiSuggest(msg.data)
                if (msg.data.uid === QJMJModel.myUid) {
                    this._handTileMgrList[0].setHuanPai(msg.data.cardList)
                }
            } else if (msg.type === ApiQjmj.GAME_HUAN_PAI_PUSH) { //个人选择完成
                // console.log("个人换牌完成", msg.data)
                if (!msg.data.cardList || !Array.isArray(msg.data.cardList)) {
                    return
                }
                QJMJModel.onHuanPaiChoose(msg.data)
                this.com_huanpai.onHuanPaiChoose(msg.data)
                let idx = QJMJModel.getUserIndexByUID(msg.data.uid)
                let hcom = this._handTileMgrList[idx]
                if (hcom) {
                    hcom.onHuanPaiChoose(msg.data)
                    let isTest = UserModel.getData('isTest');
                    if (idx != 0 && isTest) {
                        let handCards = QJMJModel.getHandCards(msg.data.uid)
                        hcom.updateLieTiles(handCards)
                    }
                }
                let ucom = this._userList[idx]
                if (ucom) ucom.setState()
            } else if (msg.type === ApiQjmj.GAME_USER_HUAN_PAI_END_PUSH) { //换牌完成
                // console.log("换牌阶段完成", msg.data)
                QJMJModel.onHuanPaiEnd(msg.data)
                this.com_huanpai.onHuanPaiEnd(msg.data)
                let idx = QJMJModel.getUserIndexByUID(msg.data.uid)
                let hcom = this._handTileMgrList[idx]
                if (hcom) {
                    let isTest = UserModel.getData('isTest');
                    hcom.onHuanPaiEnd(msg.data, isTest)
                }
            } else if (msg.type === ApiQjmj.GAME_TURN_OPERATE_PUSH) { //用户操作广播
                this.deleteMoveNode();
                QJMJModel.onUserOpt(msg.data);
                this.onUserOpt(msg.data);
                this.checkTingPai()
                this.com_opt.showBtnBai()
            } else if (msg.type === ApiQjmj.GAME_TURN_PUSH) { //通知用户操作
                this.deleteMoveNode();
                QJMJModel.onGameTurn(msg.data);
                this.onGameTurn(msg.data);
                this.com_opt.showBtnBai()
            } else if (msg.type === ApiQjmj.GAME_ALL_HU_CARDS_PUSH) { //可胡推送
                // console.log("627==更新不能出的牌==", msg.data)
                QJMJModel.setSelfAllHuCards(msg.data)
                let isMyTurn = QJMJModel.isTurn(QJMJModel.getMyUID())
                this._handTileMgrList[0].setTouch(isMyTurn)
            } else if (msg.type === ApiQjmj.GAME_BANKER_PUSH) { //庄家位置更新
                // console.log("601==庄家位置更新=====", msg.data)
                this.onBankerUpdate(msg.data.uid, msg.data.chuangguanUser);
            } else if (msg.type === ApiQjmj.GAME_REST_CARDS_COUNT_PUSH) { //剩余牌数量更新
                this.onLastTilesCountUpdate(msg.data.restCardsCount);
            } else if (msg.type === ApiQjmj.GAME_REVIEW_PUSH) {
                console.log("607==查看回放==", "this._isClickReview", this._isClickReview, msg.data);
                let reviewRecord = msg.data.reviewRecord || [];
                let CurRecord = reviewRecord[QJMJModel.getCurBureau() - 1];
                if (!!this._isClickReview) {
                    CurRecord && reviewRecord.splice(QJMJModel.getCurBureau() - 1, 1);
                    if (reviewRecord.length) {
                        AssetsManager.createDialog({
                            reviewRecord: reviewRecord,
                            bundle: Enums.bundleType.QJMJ,
                            path: "res/prefab/QJMJResultDialog",
                        });
                    } else {
                        AssetsManager.tipDialog('暂无回放数据');
                    }
                } else {
                    if (CurRecord && QJMJModel.isUserHu()) {
                        QJMJModel.setResult(CurRecord);
                        this.onSmall(CurRecord);
                    }
                }
                this._isClickReview = false;
            } else if (msg.type === ApiQjmj.GAME_RESULT_PUSH) { //小结算
                let isFan = false;
                if (msg.data && msg.data.result) {
                    let result = Utils.deepCopy(msg.data.result);
                    for (const user of result) {
                        if (!isFan && !!user.isFan) {
                            isFan = true;
                        }
                    }
                }
                QJMJModel.setResult(msg.data);
                QJMJModel.setisFan(isFan);
                this.onSmall(msg.data);
            } else if (msg.type === ApiQjmj.GAME_FAN_JI_PAI_END_PUSH) {
                QJMJModel.setisFan(!!msg.data.isFan);
                this.onSmall(QJMJModel.getResult());
            } else if (msg.type === ApiQjmj.GAME_END_PUSH) {
                QJMJModel.setAllResult(msg.data);
                this._onEnd(msg.data);
            } else if (msg.type === ApiQjmj.GAME_TRUST_PUSH) { //开始托管
                if (QJMJModel.myUid == msg.data.uid) {
                    this.tuoguan.active = msg.data.trust
                }
            } else if (msg.type === ApiQjmj.GAME_GANG_SCORE_PUSH) { //杠分
                let list = {
                    [msg.data.uid]: msg.data.detail.score
                }
                for (let i = 0; i < msg.data.detail.loseUid.length; i++) {
                    list[msg.data.detail.loseUid[i]] = msg.data.detail.score * -1
                }
                for (const uid in list) {
                    if (Object.hasOwnProperty.call(list, uid)) {
                        const score = list[uid];
                        let index = QJMJModel.getUserIndexByUID(uid)
                        this.showOptScore(score, index)
                    }
                }
            } else if (msg.type === ApiQjmj.GAME_QIANG_GANG_DELETE_PUSH) { //抢杠胡之后删除手牌
                // console.log("抢杠胡之后删除手牌==", msg.data)
                QJMJModel.qiangGangHuDel(msg.data)
                let h = QJMJModel.getHandCards(msg.data.uid, false)
                let idx = QJMJModel.getUserIndexByUID(msg.data.uid)
                let hcom = this._handTileMgrList[idx];
                if (hcom) hcom.updateStandTiles(h)
            }
        } else if (route === 'ReconnectSuccess') {
            this.getRoomSceneInfo();
        } else if (route === 'SelfEntryRoomPush') {
            if (msg.gameType != QJMJModel.getBundleType()) {
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

    /**初始化和断线重连 */
    gameInit(data) {
        this.resetTable();
        QJMJModel.init(data);
        this.com_clock.gameInit();
        this.unscheduleAllCallbacks();
        let myUid = QJMJModel.getMyUID();
        let gameRule = QJMJModel.getGameRule();
        QJMJLogic.init(QJMJModel.getGameRule());
        this.com_huanpai.gameInit(data.gameData);
        this.seatsInit(QJMJModel.getChairCount());
        this._gameStatus = data.gameData.gameStatus;
        MessageCallback.emitMessage('RemoveGameResult');
        let bundle = ConfigModel.getBundleConfig(gameRule.gameType);
        //房间信息
        this.txt_gameName.string = bundle.name;
        this.txt_roomId.string = `房号:${data.roomID}`;
        this.txt_round.string = `${QJMJModel.getCurBureau()}/${data.gameData.maxBureau}局`;
        //玩家信息
        let roomUserInfoArr = QJMJModel.getUsers();
        for (let i = 0; i < roomUserInfoArr.length; i++) {
            const user = roomUserInfoArr[i];
            this.userEnterRoom(user);
        }
        this.initTotalScore(data.gameData.userWinTotalScore); //输赢统计

        //功能按钮
        let unionID = QJMJModel.isUnionCreate() ? QJMJModel.getRoomCreatorByKey('unionID') : null;
        let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
        this.btn_copy.active = QJMJModel.getCurBureau() == 0 && !!isShowInvite;
        this.btn_invite.active = QJMJModel.getCurBureau() == 0 && !!isShowInvite;
        let userTrustArray = data.gameData.autoUser || {};
        this.btn_ting.active = false;
        this.tuoguan.active = !!userTrustArray[myUid];
        this.showTestBtn(UserModel.getData("isTest"));
        this.btn_leave.active = QJMJModel.getCurBureau() == 0;
        this.btn_deposit.active = !!QJMJModel.getGameRuleByKey("trustTm");
        this.btn_location.active = !!QJMJModel.getGameRuleByKey("showGps");
        this.btnBackHall.active = QJMJModel.getCurBureau() == 0 && QJMJModel.isUnionCreate();
        this.btnYuYin.active = !!QJMJModel.getGameRuleByKey('yuyin') && ConfigModel.getData('voiceSpeaker');
        this.btn_dismiss.active = QJMJModel.getCurBureau() != 0 && !QJMJModel.getGameRuleByKey("canNotDissmiss");
        if (this.canNotDismissBar) this.canNotDismissBar.active = QJMJModel.getGameRuleByKey("canNotDissmiss");
        this.btn_ready.active = !QJMJModel.isUserHu() && (this._gameStatus === ApiQjmj.gameStatus.NONE && data.gameData.userPlayStatus[myUid] == ApiRoom.userStatusEnum.NONE);
        if (this.btn_ready.active && QJMJModel.getCurBureau() == 0 && QJMJModel.getGameRuleByKey("unReadyKick") > 0) {
            this.readyTick.sync(QJMJModel.getGameRuleByKey("unReadyKick"));
        } else {
            this.readyTick.sync(0);
        }
        //桌面信息
        if (this._gameStatus > ApiQjmj.gameStatus.DICES || QJMJModel.isUserHu()) {
            let operateUid = data.gameData.operateUid;
            let curOptIdx = QJMJModel.getUserIndexByUID(operateUid);
            this.com_clock.setTick(data.gameData.tick);
            this.com_clock.setDir(curOptIdx);
            this.onSendTiles(data.gameData, false);
            this.onLastTilesCountUpdate(data.gameData.restCardsCount); //剩余牌数
            this.onBankerUpdate(data.gameData.bankerUid, data.gameData.chuangguanUser);
            for (const user of roomUserInfoArr) {
                let idx = QJMJModel.getUserIndexByUID(user.uid);
                /**恢复吃碰杠的牌 */
                let pengGangArray = QJMJModel.getPengGangArrayByUID(user.uid);
                if (pengGangArray.length > 0 && !!this._optTileMgrList[idx]) {
                    this._optTileMgrList[idx].updateOptTiles(pengGangArray);
                }
                /**恢复打出的牌 */
                let out = QJMJModel.getOutTilesByUID(user.uid);
                if (out.length > 0 && !!this._disTileMgrList[idx]) {
                    let last = this._disTileMgrList[idx].showOutTiles(out);
                    if (last && data.gameData.lastOperateUid == user.uid &&
                        last.flower == data.gameData.operateCard) {
                        this.updatePointer(last.node)
                    }
                }
            }
            if (QJMJModel.isUserHu()) {
                this.com_clock.setDir(-1);
                this._isClickReview = false;
                let userHuList = data.gameData.userHuDoneList || [];
                ApiRoom.gameMessageNotify(ApiQjmj.gameReviewNotify());
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
                        /**恢复胡的那张牌 */
                        let huIdx = QJMJModel.getUserIndexByUID(huUser.uid);
                        let hcom = this._handTileMgrList[huIdx];
                        if (hcom) hcom.setHuTile(huUser.card);
                        if (!!QJMJModel.getGameRuleByKey("fanji") && !QJMJModel.getisFan() && huUser.uid == QJMJModel.getMyUID()) {
                            this.com_opt.shwoFanJi(true);
                        }
                    }
                }
            } else {
                /**恢复换三张 */
                if (this._gameStatus === ApiQjmj.gameStatus.HUANSANZHANG && data.gameData.suggestCard) {
                    if (!QJMJModel.getIsHuanPai(QJMJModel.getMyChairID())) {
                        let sug = data.gameData.suggestCard[myUid];
                        this._handTileMgrList[0].setHuanPai(sug);
                    }
                }
                /**恢复操作提示 */
                if (data.gameData.userCanOperate && data.gameData.userCanOperate[myUid]) {
                    let userOperate = data.gameData.userCanOperate[myUid];
                    userOperate.operateCard = data.gameData.operateCard;
                    this.com_opt.gameInit(userOperate);
                }
                /**设置该谁出牌 */
                if (this._gameStatus === ApiQjmj.gameStatus.PLAYING) {
                    if (myUid == operateUid) {
                        this._handTileMgrList[0].setIsMyTurn();
                        if (!data.gameData.operateCard) {
                            this._handTileMgrList[0].setPengChu();
                        }
                    }
                }
                this.checkTingPai();
            }
        }
    },

    /**判断人数，初始化头像位置 */
    seatsInit(chairCount) {
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
        this._menTilesMgrList.length = 0;
        for (let i = 0; i < 4; i++) {
            let h = cc.find("head" + i, this.node);
            h.active = false;
        }
        for (let i = 0; i < headPos.length; i++) {
            let CurIndex = headPos[i];
            let h = cc.find("head" + CurIndex, this.node);
            this._userList.push(h.getComponent("QJMJHead"));
            this._userList[i].initRes();

            let handTile = cc.find("RootTiles/handTiles" + CurIndex, this.node);
            let optTile = cc.find("RootTiles/optTiles" + CurIndex, this.node);
            if (!optTile) {
                optTile = cc.find("optTiles" + CurIndex, handTile);
            }
            let disTile = cc.find("RootTiles/outTiles" + CurIndex, this.node);
            this._disTileMgrList.push(disTile.getComponent("QJMJOutTileMgr"));
            this._disTileMgrList[i].init(CurIndex);

            this._handTileMgrList.push(handTile.getComponent("QJMJHandTileMgr"));
            this._handTileMgrList[i].init(CurIndex);

            this._optTileMgrList.push(optTile.getComponent("QJMJOptTileMgr"));
            this._optTileMgrList[i].init(CurIndex);

            let opNode = cc.find("operAct" + CurIndex, this.node);
            this._operActNodeList.push(opNode);

            let huaTile = cc.find("RootTiles/huaTiles" + CurIndex, this.node);

            this._menTilesMgrList.push(huaTile.getComponent("QJMJMenTileMgr"));
            this._menTilesMgrList[i].init(CurIndex);
        }
    },

    /**用户进入房间 */
    userEnterRoom(data) {
        this._syncUser(data.uid, (ctrl) => {
            ctrl.init(data);
            if (this._gameStatus === ApiQjmj.gameStatus.HUANSANZHANG) {
                if (!QJMJModel.getIsHuanPai(data.chairID)) {
                    ctrl.setState(1);
                }
            }
        })
    },

    /**
     * 同步用户
     * @param {*} uid 
     * @param {*} funs 
     */
    _syncUser(uid, funs) {
        if (!uid) return false;
        let idx = QJMJModel.getUserIndexByUID(uid);
        let Ctrl = this._userList[idx];
        if (Ctrl && funs) funs(Ctrl);
    },

    /**恢复所有人的总输赢分数 */
    initTotalScore(userWinTotalScore) {
        if (userWinTotalScore && QJMJModel.scoreState()) {
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
            if (!QJMJModel.getRoomID() || QJMJModel.getRoomID() == data.roomID) {
                this.enterHall();
            }
        }
    },

    /**玩家准备 */
    onUserReady(data) {
        let idx = QJMJModel.getUserIndexByChairID(data.chairID);
        let com = this._userList[idx];
        if (com) com.setReady(true);
        if (data.chairID == QJMJModel.getMyChairID()) {
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
        QJMJModel.setCurBureau(data.curBureau);
        AssetsManager.clearDialog(['QJMJFanPai']);
        MessageCallback.emitMessage('RemoveGameResult');
        this.txt_round.string = `${data.curBureau}/${QJMJModel.getMaxBureau()}局`;
        this.btn_dismiss.active = data.curBureau != 0 && !QJMJModel.getGameRuleByKey("canNotDissmiss");
    },

    /**更新剩余牌数量 */
    onLastTilesCountUpdate(count) {
        QJMJModel.setRestCardsCount(count);
        this.txt_last.string = !!count ? `x${count}` : "";
    },

    /**更新庄家 */
    onBankerUpdate(uid, chuangguanUid) {
        // console.log("更新庄家===chuangguanUid", chuangguanUid)
        QJMJModel.setChuangGuanUser(chuangguanUid);
        this._syncUser(uid, (ctrl) => {
            ctrl.setBanker(true);
        })
        this._syncUser(chuangguanUid, (ctrl) => {
            ctrl.showChuang(true);
        })
    },

    /**游戏状态跳转 */
    onGameStatusUpdate(data) {
        this.hideReadyIcon();
        this.readyTick.sync(0);
        this.com_clock.hideDice();
        this.btnBackHall.active = false;
        this.com_clock.setTick(data.tick);
        this._gameStatus = data.gameStatus;
        this.com_huanpai.onHuanPaiStatus(data);
        if (this._gameStatus == ApiQjmj.gameStatus.NONE ||
            this._gameStatus == ApiQjmj.gameStatus.DICES) {
            this.onLastTilesCountUpdate(0);
        }
        this.btn_ready.active = QJMJModel.getCurBureau() == 0 && this._gameStatus == ApiQjmj.gameStatus.NONE;
        switch (this._gameStatus) {
            case ApiQjmj.gameStatus.NONE:
                QJMJModel.reset();
                this.resetTable();
                break;
            case ApiQjmj.gameStatus.PLAYING:
                this._handTileMgrList[0].setAllTilesDown();
                this.com_huanpai.reset()
                break;
            case ApiQjmj.gameStatus.HUANSANZHANG:
                this._userList.forEach(c => {
                    c.setState(1)
                });
                break;
            default:
                break;
        }
    },

    /**发牌 */
    onSendTiles(data, isAnim) {
        // console.log("发牌==》", data)
        if (!data.handCards) return;
        let lastOpt = QJMJModel.getLastOperate();
        let isTest = UserModel.getData('isTest');
        let handCards = data.handCards;
        for (const uid in handCards) {
            let user = QJMJModel.getUserByUID(uid);
            if (!user) continue;
            let idx = QJMJModel.getUserIndexByUID(uid);
            let hcom = this._handTileMgrList[idx];
            if (!hcom) continue;
            if (!isAnim) QJMJModel.delZimoCard(uid);
            let tiles = QJMJModel.getHandCards(uid, false)
            let drawTile = !!lastOpt && lastOpt.uid == uid && lastOpt.operate == ApiQjmj.operateType.GET ? lastOpt.card : null;
            if (drawTile != null) {
                tiles.splice(tiles.indexOf(drawTile), 1)
                hcom.setDrawTile(drawTile)
            }
            if (idx == 0 || !isTest) {
                hcom.updateStandTiles(tiles, null, isAnim);
            } else {
                hcom.updateLieTiles(tiles, null);
            }
        }
    },


    removeAllAct() {
        let allRecords = QJMJModel.getAllOperateRecords();
        if (allRecords.length < 2) {
            this._operActNodeList.forEach(n => {
                n.removeAllChildren();
            })
        }
    },

    /**通知用户操作 */
    onGameTurn(data) {
        // console.log("614==通知用户操作", data);
        this.removeAllAct();
        this.setTilesGary(-1);
        let isTest = UserModel.getData('isTest');
        let idx = QJMJModel.getUserIndexByUID(data.uid);
        this.com_clock.setTick(data.tick);
        this.com_clock.setDir(idx);
        if (idx == 0) { //被操作人是自己
            this._handTileMgrList[0].setBaiPai() //重置摆牌状态
        }
        let isMoPai = false;
        let isSiZhangZiMo = false;
        if (!!QJMJModel.getGameRuleByKey("zuihousizhangbihu")) {
            if (QJMJModel.getRestCardsCount() <= 4) {
                if (data.operateArray.indexOf(ApiQjmj.operateType.HU_ZHI) != -1) {
                    // data.operateArray.push(ApiQjmj.operateType.QI)
                    isSiZhangZiMo = true;
                }
            }
        }
        if (isSiZhangZiMo || (data.operateArray && (data.operateArray.indexOf(ApiQjmj.operateType.QI) != -1 || data.operateArray.indexOf(ApiQjmj.operateType.GET) != -1))) {
            //通知出牌
            isMoPai = data.operateArray.indexOf(ApiQjmj.operateType.GET) != -1 || data.card != null;
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
                        bundle: Enums.bundleType.QJMJ
                    });
                    if (idx == 0 && data.operateArray.indexOf(ApiQjmj.operateType.QI) != -1) {
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
        if (turn.operateArray && turn.operateArray.length > 0 && !turn.operateArray.includes(ApiQjmj.operateType.GET)) {
            this.com_opt.onGameTurn(turn);
            if (!isMoPai && idx != 0 && !turn.operateArray.includes(ApiQjmj.operateType.QI)) {
                this._handTileMgrList[0].setBaiPai() //重置摆牌状态
            }
        } else {
            this.com_opt.onClearTurn();
        }
        this.checkTingPai();
    },

    /**摆牌完成 */
    onBaiPaiEnd(data, isReconnect = false) {
        let idx = QJMJModel.getUserIndexByUID(data.uid)
        let hcom = this._handTileMgrList[idx]
        if (hcom) {
            hcom.onBaiPaiEnd(data.cardList)
        }
        if (idx == 0) {
            this.checkTingPai()
            this.com_opt.onBaiPaiEnd()
            if (!isReconnect) {
                /**刷新自己的手牌 */
                let handCards = QJMJModel.getHandCards(QJMJModel.getMyUID(), false)
                this._handTileMgrList[0].updateStandTiles(handCards)
            }
        } else {
            let isTest = UserModel.getData('isTest');
            let handCards = QJMJModel.getHandCards(data.uid, false)
            let com = this._handTileMgrList[idx]
            if (com && !isReconnect) {
                if (isTest) {
                    com.updateLieTiles(handCards)
                } else {
                    com.updateStandTiles(handCards)
                }
            }
        }

        let user = QJMJModel.getUserByUID(data.uid);
        let sex = user && user.userInfo.sex == 0 ? 'nan' : 'nv';
        AssetsManager.playEffect({
            bundle: Enums.bundleType.QJMJ,
            path: `res/audio/${sex}/baipai`,
        });
    },

    /**检查 听牌 */
    checkTingPai() {
        if (!QJMJModel.isHuPaiTiShi()) {
            this.btn_ting.active = false;
            return;
        }
        let myUid = QJMJModel.getMyUID();
        let operateUid = QJMJModel.getCurOptUID();
        let handCards = QJMJModel.getHandCards(myUid);
        let idx = QJMJModel.getUserIndexByUID(myUid);
        let hcom = this._handTileMgrList[idx];
        let winHandChecks = handCards.slice();
        let tingHandChecks = handCards.slice();
        if (operateUid != myUid) {
            /**不是自己操作 去掉打听标记 显示听牌按钮*/
            if (hcom) hcom.setTingIcons();
            let operateRecords = QJMJModel.getOperateRecords(myUid);
            let winTingFilter = QJMJModel.tingFilter(null, winHandChecks);
            let canWinList = QJMJLogic.getTingList(winTingFilter.cards, winTingFilter.ghostCardsCount, operateRecords);
            this.btn_ting.active = canWinList.length > 0;
            this._canWinList = canWinList;
        } else if (operateUid == myUid) {
            let tingCards = [];
            this._tingList = [];
            //判断是否需要删除手牌
            let repeatFilter = Array.from(new Set(tingHandChecks));
            for (const cardId of repeatFilter) {
                let copyTingHandCards = tingHandChecks.slice();
                let tingFilter = QJMJModel.tingFilter(cardId, copyTingHandCards);
                let canTingList = QJMJLogic.getTingList(tingFilter.cards, tingFilter.ghostCardsCount);
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
        let tiles = QJMJModel.getHandCards(QJMJModel.getMyUID())
        if (tiles.length >= 14) {
            return
        }
        let operateRecords = QJMJModel.getOperateRecords(QJMJModel.getMyUID());
        let winTingFilter = QJMJModel.tingFilter(null, tiles.slice());
        let canWinList = QJMJLogic.getTingList(winTingFilter.cards, winTingFilter.ghostCardsCount, operateRecords);
        console.log("tinglight==", canWinList)
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
        let idx = QJMJModel.getUserIndexByUID(data.uid);
        if (typeof (idx) == "number") {
            let com = this.genAniNode(this._operActNodeList[idx])
            com && com.showHuIndex(data.operate, data.plusInfo.huSequence, data.chairID, isAni)
        }
    },

    /**用户操作广播 */
    onUserOpt(data) {
        // console.log("615==用户操作广播", data);
        this.setTilesGary(-1);
        this.com_opt.onClearTurn();
        let plusInfo = data.plusInfo || null;
        let isTest = UserModel.getData("isTest");
        let CurIndex = QJMJModel.getUserIndexByUID(data.uid);
        let CurUserCtrl = this._userList[CurIndex];
        let CurUserInfo = CurUserCtrl ? CurUserCtrl.getUserData() : null;
        let CurUserSex = !!CurUserInfo && (CurUserInfo.userInfo.sex == 0) ? 'nan' : 'nv';

        if (data.uid == QJMJModel.getMyUID()) {
            this.com_ting.node.active = false;
            this._handTileMgrList[0].setTingIcons();
        }
        //展示分数
        if (plusInfo && plusInfo.winScoreRecord && plusInfo.winScoreRecord.length > 0) {
            for (let i = 0; i < plusInfo.winScoreRecord.length; i++) {
                let index = QJMJModel.getUserIndexByChairID(i);
                const score = plusInfo.winScoreRecord[i];
                this.showOptScore(score, index);
            }
        }
        //隐藏所有位置的摸的那张牌
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
        if (data.operate == ApiQjmj.operateType.QI) {
            let moOpt = QJMJModel.getQiByMo(data);
            if (!!moOpt && moOpt.card != data.card) {
                drawTile = moOpt.card;
            }
        }
        /**更新手牌 */
        let CtrlHandTile = this._handTileMgrList[CurIndex];
        let handCards = QJMJModel.getHandCards(data.uid, false);
        if (!CtrlHandTile) return;
        if (CurIndex != 0 && !!isTest) {
            CtrlHandTile.updateLieTiles(handCards);
        } else {
            drawTile = CurIndex == 0 ? drawTile : null;
            CtrlHandTile.updateStandTiles(handCards, drawTile);
        }
        let optPengGang = () => {
            let pengGangArray = QJMJModel.getPengGangArrayByUID(data.uid);
            let optCom = this._optTileMgrList[CurIndex];
            if (optCom) optCom.updateOptTiles(pengGangArray);
            let lastOut = QJMJModel.getLastOutCardRecord();
            if (!!lastOut.isDel) {
                let localIndex = QJMJModel.getUserIndexByUID(lastOut.opt.uid);
                this._disTileMgrList[localIndex].afterOptUpdateTiles(lastOut.opt.card);
                this.updatePointer();
            }
        }

        let optHu = () => {
            /** 亮出胡的牌 */
            let hcom = this._handTileMgrList[CurIndex];
            if (hcom) {
                let huNode = hcom.setHuTile(data.card)
                let optNode = this._operActNodeList[CurIndex]
                this.scheduleOnce(() => {
                    let pos = CCUtil.postionConvert(huNode, optNode)
                    let aniCom = this.genAniNode(optNode, null, pos)
                    aniCom.node.scale = hcom.node.scale
                    aniCom.showHuLight()
                }, 0.2)
            }
            /**删除桌子上的牌 */
            let lastOut = QJMJModel.getLastOutCardRecord();
            if (!!lastOut.isDel) {
                let localIndex = QJMJModel.getUserIndexByUID(lastOut.opt.uid);
                this._disTileMgrList[localIndex].afterOptUpdateTiles(lastOut.opt.card);
                this.updatePointer();
            }
        }

        let optMen = () => {
            let hcom = this._menTilesMgrList[CurIndex];
            if (hcom && plusInfo) hcom.menCardsSync(data.card, plusInfo.operateType);
        }

        let showAni = (ainmType) => {
            let audioType = ainmType;
            let audioList = ["chi", "peng", "gang", "hu", "zimo", "men"];
            if (audioType == ApiQjmj.operateType.MENPAI) {
                audioType = 5;
            }
            if (audioType < audioList.length) {
                AssetsManager.playEffect({
                    bundle: Enums.bundleType.QJMJ,
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
            let com = this.genAniNode(this._operActNodeList[CurIndex])
            com.showOpt(ainmType);
            if (ainmType == 2) {
                let t = 5; //刮风
                if (data.operate === ApiQjmj.operateType.GANG_ZHI) {
                    t = 7 //下雨
                }
                let fcom = this.genAniNode(this.node)
                fcom.showOpt(t)
            }
        }

        switch (data.operate) {
            case ApiQjmj.operateType.QI: //出牌
                AssetsManager.playEffect({
                    bundle: Enums.bundleType.QJMJ,
                    path: `res/audio/${CurUserSex}/` + data.card,
                });
                AssetsManager.playEffect({
                    path: 'res/audio/main/push',
                    bundle: Enums.bundleType.QJMJ
                });
                if (CurIndex == 0) {
                    this._handTileMgrList[0].setTouch(false)
                }
                /**更新桌子上的牌 */
                let last = null,
                    disCom = this._disTileMgrList[CurIndex];
                let out = QJMJModel.getOutTilesByUID(data.uid);
                if (disCom) last = disCom.showOutTiles(out)
                if (last && last.flower == data.card) {
                    this.updatePointer(last.node);
                }
                if (CurIndex == 0) {
                    this.showTingLight()
                }
                break;
            case ApiQjmj.operateType.CHI: //吃牌
                showAni(0)
                optPengGang()
                break;
            case ApiQjmj.operateType.PENG: //碰牌
                showAni(1)
                optPengGang()
                break;
            case ApiQjmj.operateType.GANG_BU: //补杠
                showAni(2)
                optPengGang()
                break;
            case ApiQjmj.operateType.GANG_CHI: //吃杠
                showAni(2)
                optPengGang()
                break;
            case ApiQjmj.operateType.GANG_ZHI: //暗杠
                showAni(2)
                optPengGang();
                break;
            case ApiQjmj.operateType.HU_CHI: //接炮
                showAni(3);
                optHu();
                break;
            case ApiQjmj.operateType.HU_ZHI: //自摸
                showAni(4)
                optHu();
                break;
            case ApiQjmj.operateType.MENPAI: //闷
                showAni(ApiQjmj.operateType.MENPAI);
                optMen();
                break;
            case ApiQjmj.operateType.HU_QIANG: //抢杠
                showAni(3)
                optHu();
                break;
            default:
                break;
        }

    },

    onSmall(data) {
        console.log("606==小结算==", data)
        this.com_opt.reset();
        this.deleteMoveNode();
        if (!data) return false;
        let myUid = QJMJModel.getMyUID();
        let huInfo = null, maPaiInfo = null;
        let isTest = UserModel.getData("isTest");
        let result = JSON.parse(JSON.stringify(data.result));
        QJMJModel.maxBureau = data.maxBureau || QJMJModel.getMaxBureau();
        if (!!result) {
            for (const user of result) {
                if (!user) continue;
                if (!huInfo && !!user.huInfo) {
                    huInfo = user.huInfo;
                }
                if (!maPaiInfo && !!user.maPaiInfo) {
                    maPaiInfo = user.maPaiInfo;
                };
                if (!user.userCards || !user.userCards[user.uid]) continue;
                let idx = QJMJModel.getUserIndexByUID(user.uid);
                if (!this._handTileMgrList[idx]) continue;
                let userCards = user.userCards[user.uid];
                if (!!user.huInfo) {
                    user.huCards = user.huCards || [];
                    let huFilter = [ApiQjmj.operateType.HU_ZHI];
                    if (huFilter.includes(user.huType)) { //删除胡牌
                        let huCardIndex = userCards.indexOf(user.huCards);
                        if (huCardIndex >= 0) userCards.splice(huCardIndex, 1);
                    }
                    this._handTileMgrList[idx].setHuTile(user.huCards);
                }
                userCards = QJMJModel.sortTiles(user.uid, userCards);
                this._handTileMgrList[idx].updateLieTiles(userCards);
            }
        }
        //无胡牌玩家或已翻鸡牌不阻拦
        if (!!QJMJModel.getGameRuleByKey("fanji") && !QJMJModel.getisFan() && !!huInfo) {
            this.com_opt.shwoFanJi(huInfo.uid == QJMJModel.getMyUID());
            return
        }
        AssetsManager.playEffect({
            path: 'res/audio/main/push',
            bundle: Enums.bundleType.QJMJ
        });
        let createResultDialog = () => {
            let isBureauFull = QJMJModel.getCurBureau() >= QJMJModel.getMaxBureau();
            let chuangguan = QJMJModel.getGameRule("chuangguan");
            let cgUID = QJMJModel.getChuangGuanUser();
            if (!!cgUID && !!chuangguan && !!huInfo) {
                isBureauFull = false;
            }
            data.mainComp = this;
            data.isResult = true;
            data.bundle = Enums.bundleType.QJMJ;
            data.onEnd = this._onEnd.bind(this);
            data.path = "res/prefab/QJMJResultDialog";
            data.enterHall = this.enterHall.bind(this);
            data.isBureauFull = isBureauFull;
            AssetsManager.createDialog(data);
        }
        this.scheduleOnce(() => {
            let maCards = !!maPaiInfo ? maPaiInfo.maCards || [] : [];
            if (!!QJMJModel.getGameRuleByKey("fanji") && !!maPaiInfo && !!maCards.length) {
                AssetsManager.createDialog({
                    result: result,
                    maPaiInfo: maPaiInfo,
                    bundle: Enums.bundleType.QJMJ,
                    callback: createResultDialog,
                    gameRule: QJMJModel.getGameRule(),
                    path: "res/prefab/QJMJFanPai",
                });
            } else {
                createResultDialog();
            }
        }, 0);
    },

    _onEnd(data) {
        // console.log("609==游戏大结算", data);
        if (!!QJMJModel.getResult()) {
            QJMJModel.setisFan(true);
            this.onSmall(QJMJModel.getResult());
            return
        };
        UserModel.setData('roomID', '');
        QJMJModel.setAllResult(null);
        if (data.result.length > 0) {
            this.showMJAllResultFunc = () => {
                this.showMJAllResultFunc = null;
                data.mainComp = this;
                data.isUnionCreate = QJMJModel.isUnionCreate();
                data.enterHall = this.enterHall.bind(this);
                data.roomDismissReason = data.reason;
                data.path = 'res/prefab/QJMJAllResult';
                data.bundle = Enums.bundleType.QJMJ;
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
            let acom = aniNode.getComponent("QJMJOperAct")
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
        this._menTilesMgrList.forEach(c => {
            c.reset()
        });
        this._userList.forEach(c => {
            c.reset();
        });
        this._operActNodeList.forEach(n => {
            n.removeAllChildren()
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
        let myUid = QJMJModel.getMyUID();
        this.com_ting.node.active = false;
        let handCards = QJMJModel.getHandCards(myUid)
        if (this._tingList.includes(tileCom.flower)) {
            let myTiles = handCards.slice();
            let tingFilter = QJMJModel.tingFilter(tileCom.flower, myTiles);
            let canWinList = QJMJLogic.getTingList(tingFilter.cards, tingFilter.ghostCardsCount);
            if (canWinList.length > 0) {
                this.com_ting.showWinCards(canWinList)
            }
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
                if (QJMJModel.getCurBureau() == 0) {
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
                    gameType: Enums.bundleType.QJMJ,
                    musicType: Enums.bundleType.MAHJONG,
                });
                break;
            case "btn_review": //回看
                this._hideMenu();
                if (CCUtil.clickInterval(event.target, 1)) return;
                this._isClickReview = true;
                ApiRoom.gameMessageNotify(ApiQjmj.gameReviewNotify());
                break;
            case "btn_msg": //聊天
                this._hideMenu();
                if (CCUtil.clickInterval(event.target, 1)) return;
                let params = {
                    gameRule: QJMJModel.getGameRule(),
                    chat: (chat) => {
                        ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
                    }
                }
                AssetsManager.chatDialog(params);
                break;
            case "btn_rules": //规则
                this._hideMenu();
                if (CCUtil.clickInterval(event.target, 1)) return;
                let rule = QJMJModel.getGameRule();
                if (!rule) return;
                AssetsManager.tableDialog({
                    gameRule: rule,
                });
                break;
            case "btn_ting": //听牌
                this._hideMenu();
                // this._canWinList = QJMJModel.getTingList();
                if (this._canWinList.length > 0 && !this.com_ting.node.active) {
                    for (let i = 0; i < this._canWinList.length; i++) {
                        if (!this._canWinList[i]) continue;
                        this._canWinList[i].count = QJMJModel.getRestCardCount(this._canWinList[i].cardID);
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
                    users: QJMJModel.getUsers(),
                    chairCount: QJMJModel.getChairCount(),
                    fangzuobi: QJMJModel.getGameRuleByKey('fangzuobi')
                })
                break;
            case "btn_deposit": //开始托管
                this._hideMenu();
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiQjmj.gameTrushNotify(true));
                break;
            case "btn_quxiaotuoguan": //取消托管
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiQjmj.gameTrushNotify(false));
                break;
            case "btn_invite": //邀请
                this._hideMenu();
                let gameRule = QJMJModel.getGameRule();
                gameRule = gameRule || {};
                gameRule.roomId = QJMJModel.getRoomID();
                let share = ConfigModel.getRoomRuleShare(gameRule);
                NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
                break;
            case "btn_copy": //复制
                let str = ConfigModel.getRoomShare(Enums.bundleType.QJMJ, QJMJModel.getRoomID());
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
            gameRule: QJMJModel.getGameRule(),
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
        let isUnionCreate = QJMJModel.isUnionCreate();
        let unionID = !!isUnionCreate ? QJMJModel.getRoomCreatorByKey('unionID') : null;
        SubManager.exitBundle(unionID);
    },

    /**GPS定位检查 */
    verifyZuobi(roomUserInfo) {
        if (!QJMJModel.getGameRuleByKey("fangzuobi")) return;
        if (!roomUserInfo || roomUserInfo.chairID >= QJMJModel.getChairCount()) return;
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
        this._syncUser(data.uid, (com) => {
            com.gameChat(data)
        })
    },
    onGift(fromChairID, toChairID, giftID) {
        let fidx = QJMJModel.getUserIndexByChairID(fromChairID)
        let tidx = QJMJModel.getUserIndexByChairID(toChairID)
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
        AssetsManager.init(this.node);
        this.btn_deposit.active = false;
        this.btn_location.active = false;
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
        this.menuLayList.stopAllActions();
        this.menuLayList.opacity = 0;
        this.menuLayList.setPosition(this._menuLayPos.hide);
        this.btn_menu.active = true
        this.menuLay.active = false;
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
        ConfigModel.setData('lastScene', 'QJMJ');
        AssetsManager.release();
    },

    update(dt) { },
});