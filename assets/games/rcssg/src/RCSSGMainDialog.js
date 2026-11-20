const ApiRcssg = require('./ApiRcssg');
const ApiRoom = require('../../../src/api/ApiRoom');;
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const UserModel = require('../../../src/model/UserModel');
const Codes = require('../../../src/const/Codes');
const ConfigModel = require('../../../src/model/ConfigModel');
const NativeUtil = require('../../../src/utils/NativeUtil');
const RCSSGModel = require('./RCSSGModel');
const RCSSGLogic = require('./RCSSGLogic');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const SubManager = require('../../../src/utils/SubManager');
const Events = require('../../../src/const/Events');
const MessageCallback = require('../../../src/utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        com_opt: require("RCSSGOperate"),
        com_clock: require("RCSSGClock"),
        com_ting: require("RCSSGTingTips"),
        readyTick: require('RCSSGReadyTick'),
        huanPaiNode: cc.Node,
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
        btn_ting: cc.Node,
        btn_deposit: cc.Node,
        btn_menu: cc.Node,
        btnBackHall: cc.Node,
        operActPfb: cc.Prefab,
        btnYuYin: cc.Node,
        canNotDismissBar: cc.Node,

        headPfbLeft: cc.Prefab,
        headPfbRight: cc.Prefab,
        huanPaiPfb: cc.Prefab,
        tip1: cc.Node,
        animationNode: cc.Node,

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
        _isClickReview: false,
        _com_huanPai: null,
    },

    onLoad() {
        AssetsManager.init(this.node);
        this.updatePointer();
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
        cc.systemEvent.on("tileUp", this.onTileUp, this);

        let huanPai = cc.instantiate(this.huanPaiPfb)
        huanPai.parent = this.huanPaiNode
        this._com_huanPai = huanPai.getComponent("RCSSGHuanPai")

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

    /**消息监听 */
    messageCallbackHandler(route, msg) {
        if (route === 'RoomMessagePush') {
            if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
                console.log("gameInit=============", msg.data)
                this.gameInit(msg.data);
            } else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
                RCSSGModel.otherUserJoinRoom(msg.data.roomUserInfo);
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
                msg.data.myChairID = RCSSGModel.getMyChairID();
                AssetsManager.disDialog(msg.data);
                RCSSGModel.setResult(null);
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
                let idx = RCSSGModel.getUserIndexByChairID(msg.data.chairID);
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
            if (msg.type === ApiRcssg.GAME_BUREAU_PUSH) {
                this.onGameRoundUpdate(msg.data);
            } else if (msg.type === ApiRcssg.GAME_STATUS_PUSH) { //游戏状态
                console.log("状态跳转==", msg.data)
                RCSSGModel.setGameStatus(msg.data.gameStatus);
                this.onGameStatusUpdate(msg.data);
            } else if (msg.type === ApiRcssg.GAME_SEND_CARDS_PUSH) { //发牌
                this.deleteMoveNode();
                this.com_clock.hideDice();
                RCSSGModel.setHandCards(msg.data.handCards);
                this.onSendTiles(msg.data, true);
            } else if (msg.type === ApiRcssg.GAME_DICES_PUSH) {
                this.com_clock.showDiceAni(msg.data.dice1, msg.data.dice2);
            } else if (msg.type === ApiRcssg.GAME_USER_HUAN_PAI_SUGGEST_PUSH) { //换牌推荐
                console.log("换牌推荐", msg.data)
                this.onHuanPaiSuggest(msg.data)
            } else if (msg.type === ApiRcssg.GAME_HUAN_PAI_PUSH) { //个人选择完成
                console.log("个人换牌完成", msg.data)
                if (!msg.data.cardList || !Array.isArray(msg.data.cardList)) {
                    return
                }
                RCSSGModel.onHuanPaiChoose(msg.data)
                this._com_huanPai.onHuanPaiChoose(msg.data)
                let idx = RCSSGModel.getUserIndexByUID(msg.data.uid)
                let hcom = this._handTileMgrList[idx]
                if (hcom) {
                    hcom.onHuanPaiChoose(msg.data)
                    let isTest = UserModel.getData('isTest');
                    if (idx != 0 && isTest) {
                        let handCards = RCSSGModel.getHandCards(msg.data.uid)
                        hcom.updateLieTiles(handCards)
                    }
                }
                let ucom = this._userList[idx]
                if (ucom) ucom.setState()
            } else if (msg.type === ApiRcssg.GAME_USER_HUAN_PAI_END_PUSH) { //换牌完成
                console.log("换牌阶段完成", msg.data)
                RCSSGModel.onHuanPaiEnd(msg.data)
                this._com_huanPai.onHuanPaiEnd(msg.data)
                let idx = RCSSGModel.getUserIndexByUID(msg.data.uid)
                let hcom = this._handTileMgrList[idx]
                if (hcom) {
                    let isTest = UserModel.getData('isTest');
                    hcom.onHuanPaiEnd(msg.data, isTest)
                }
            } else if (msg.type === ApiRcssg.GAME_TURN_OPERATE_PUSH) { //用户操作广播
                console.log("615用户操作广播==", msg.data.uid, msg.data)
                this.deleteMoveNode();
                RCSSGModel.onUserOpt(msg.data);
                this.onUserOpt(msg.data);
                this.checkTingPai()
            } else if (msg.type === ApiRcssg.GAME_TURN_PUSH) { //通知用户操作
                console.log("614通知用户操作==", msg.data.uid, msg.data)
                this.deleteMoveNode();
                RCSSGModel.onGameTurn(msg.data);
                this.onGameTurn(msg.data);
            } else if (msg.type === ApiRcssg.GAME_ALL_HU_CARDS_PUSH) { //可胡推送
                console.log("627==可胡推送==", msg.data)
                // RCSSGModel.setSelfAllHuCards(msg.data)
                // let isMyTurn = RCSSGModel.isTurn(RCSSGModel.getMyUID())
                // this._handTileMgrList[0].setTouch(isMyTurn)
            } else if (msg.type === ApiRcssg.GAME_BANKER_PUSH) { //庄家位置更新
                // console.log("601==庄家位置更新=====", msg.data)
                RCSSGModel.setBankerUID(msg.data.uid)
                this.onBankerUpdate(msg.data.uid);
            } else if (msg.type === ApiRcssg.GAME_REST_CARDS_COUNT_PUSH) { //剩余牌数量更新
                this.onLastTilesCountUpdate(msg.data.restCardsCount);
            } else if (msg.type === ApiRcssg.GAME_REVIEW_PUSH) {
                console.log("607==查看回放==", "this._isClickReview", this._isClickReview, msg.data);
                let reviewRecord = msg.data.reviewRecord || [];
                let CurRecord = reviewRecord[RCSSGModel.getCurBureau() - 1];
                if (!!this._isClickReview) {
                    CurRecord && reviewRecord.splice(RCSSGModel.getCurBureau() - 1, 1);
                    if (reviewRecord.length) {
                        AssetsManager.createDialog({
                            reviewRecord: reviewRecord,
                            bundle: Enums.bundleType.RCSSGMJ,
                            path: "res/prefab/RCSSGResultDialog",
                        });
                    } else {
                        AssetsManager.tipDialog('暂无回放数据');
                    }
                } else {
                    if (CurRecord && RCSSGModel.isUserHu()) {
                        RCSSGModel.setResult(CurRecord);
                        this.onSmall(CurRecord);
                    }
                }
                this._isClickReview = false;
            } else if (msg.type === ApiRcssg.GAME_RESULT_PUSH) { //小结算
                let isFan = false;
                if (msg.data && msg.data.result) {
                    let result = Utils.deepCopy(msg.data.result);
                    for (const user of result) {
                        if (!isFan && !!user.isFan) {
                            isFan = true;
                        }
                    }
                }
                RCSSGModel.setResult(msg.data);
                this.onSmall(msg.data);
            } else if (msg.type === ApiRcssg.GAME_END_PUSH) {
                RCSSGModel.setAllResult(msg.data);
                this._onEnd(msg.data);
            } else if (msg.type === ApiRcssg.GAME_TRUST_PUSH) { //开始托管
                if (RCSSGModel.myUid == msg.data.uid) {
                    this.tuoguan.active = msg.data.trust
                }
            } else if (msg.type === ApiRcssg.GAME_USER_BAO_OPERATE_PUSH) { //报听操作推送
                console.log("报听确定操作推送==", msg.data)
                RCSSGModel.setBaoDoneUser(msg.data.uid)
                RCSSGModel.setTianTing(msg.data.uid)
                let idx = RCSSGModel.getUserIndexByUID(msg.data.uid)
                let tcom = this._userList[idx]
                if (tcom) {
                    tcom.setBaoTing(true)
                    tcom.setBaoTingAni(true)
                }
            } else if (msg.type === ApiRcssg.GAME_USER_BAO_PUSH) { //通知报听
                console.log("通知报听==", msg.data)
                if (msg.data.uid == RCSSGModel.getMyUID()) {
                    this.com_opt.showBaoting(true)
                }
            } else if (msg.type === ApiRcssg.GAME_QIANG_GANG_DELETE_PUSH) { //抢杠胡之后删除手牌
                // console.log("抢杠胡之后删除手牌==", msg.data)
                RCSSGModel.qiangGangHuDel(msg.data)
                let h = RCSSGModel.getHandCards(msg.data.uid)
                let idx = RCSSGModel.getUserIndexByUID(msg.data.uid)
                let hcom = this._handTileMgrList[idx];
                if (hcom) hcom.updateStandTiles(h)
            }
        } else if (route === 'ReconnectSuccess') {
            this.getRoomSceneInfo();
        } else if (route === 'SelfEntryRoomPush') {
            if (msg.gameType != RCSSGModel.getBundleType()) {
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
        RCSSGModel.init(data);
        this.resetTable();
        this.com_clock.gameInit();
        this.unscheduleAllCallbacks();
        let myUid = RCSSGModel.getMyUID();
        let gameRule = RCSSGModel.getGameRule();
        RCSSGLogic.init(RCSSGModel.getGameRule());
        this._com_huanPai.gameInit(data.gameData);
        this.seatsInit(RCSSGModel.getChairCount());
        this._gameStatus = data.gameData.gameStatus;
        MessageCallback.emitMessage('RemoveGameResult');
        let bundle = ConfigModel.getBundleConfig(gameRule.gameType);
        //房间信息
        this.txt_gameName.string = bundle.name;
        this.txt_roomId.string = `房号:${data.roomID}`;
        this.txt_round.string = `${RCSSGModel.getCurBureau()}/${data.gameData.maxBureau}局`;
        //玩家信息
        let roomUserInfoArr = RCSSGModel.getUsers();
        for (let i = 0; i < roomUserInfoArr.length; i++) {
            const user = roomUserInfoArr[i];
            this.userEnterRoom(user);
        }
        this.initTotalScore(data.gameData.userWinTotalScore); //输赢统计

        //功能按钮
        let unionID = RCSSGModel.isUnionCreate() ? RCSSGModel.getRoomCreatorByKey('unionID') : null;
        let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
        this.btn_copy.active = RCSSGModel.getCurBureau() == 0 && !!isShowInvite;
        this.btn_invite.active = RCSSGModel.getCurBureau() == 0 && !!isShowInvite;
        let userTrustArray = data.gameData.autoUser || {};
        this.btn_ting.active = false;
        this.tuoguan.active = !!userTrustArray[myUid];
        this.btn_leave.active = RCSSGModel.getCurBureau() == 0;
        this.btn_deposit.active = !!RCSSGModel.getGameRuleByKey("trustTm");
        this.btn_location.active = !!RCSSGModel.getGameRuleByKey("showGps");
        this.btnBackHall.active = RCSSGModel.getCurBureau() == 0 && RCSSGModel.isUnionCreate();
        this.btnYuYin.active = !!RCSSGModel.getGameRuleByKey('yuyin') && ConfigModel.getData('voiceSpeaker');
        this.btn_dismiss.active = RCSSGModel.getCurBureau() != 0 && !RCSSGModel.getGameRuleByKey("canNotDissmiss");
        if (this.canNotDismissBar) this.canNotDismissBar.active = RCSSGModel.getGameRuleByKey("canNotDissmiss");
        this.btn_ready.active = !RCSSGModel.isUserHu() && (this._gameStatus === ApiRcssg.gameStatus.NONE && data.gameData.userPlayStatus[myUid] == ApiRoom.userStatusEnum.NONE);
        if (this.btn_ready.active && RCSSGModel.getCurBureau() == 0 && RCSSGModel.getGameRuleByKey("unReadyKick") > 0) {
            this.readyTick.sync(RCSSGModel.getGameRuleByKey("unReadyKick"));
        } else {
            this.readyTick.sync(0);
        }
        //桌面信息
        if (this._gameStatus > ApiRcssg.gameStatus.DICES || RCSSGModel.isUserHu()) {
            let operateUid = data.gameData.operateUid;
            let curOptIdx = RCSSGModel.getUserIndexByUID(operateUid);
            if (this._gameStatus != ApiRcssg.gameStatus.HUANSANZHANG) {
                this.com_clock.setTick(data.gameData.tick);
                this.com_clock.setDir(curOptIdx);
            }
            this.onSendTiles(data.gameData, false);
            this.onLastTilesCountUpdate(data.gameData.restCardsCount); //剩余牌数
            this.onBankerUpdate(data.gameData.bankerUid, data.gameData.chuangguanUser);
            for (const user of roomUserInfoArr) {
                let idx = RCSSGModel.getUserIndexByUID(user.uid);
                /**恢复吃碰杠的牌 */
                let pengGangArray = RCSSGModel.getPengGangArrayByUID(user.uid);
                if (pengGangArray.length > 0 && !!this._optTileMgrList[idx]) {
                    this._optTileMgrList[idx].updateOptTiles(pengGangArray);
                }
                /**恢复打出的牌 */
                let out = RCSSGModel.getOutTilesByUID(user.uid);
                if (out.length > 0 && !!this._disTileMgrList[idx]) {
                    let last = this._disTileMgrList[idx].showOutTiles(out);
                    if (last && data.gameData.lastOperateUid == user.uid &&
                        last.flower == data.gameData.operateCard) {
                        this.updatePointer(last.node)
                    }
                }
            }
            if (RCSSGModel.isUserHu()) {
                this.com_clock.setDir(-1);
                this._isClickReview = false;
                let userHuList = data.gameData.userHuDoneList || [];
                ApiRoom.gameMessageNotify(ApiRcssg.gameReviewNotify());
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
                        let huIdx = RCSSGModel.getUserIndexByUID(huUser.uid);
                        let hcom = this._handTileMgrList[huIdx];
                        if (hcom) hcom.setHuTile(huUser.card);
                    }
                }
            }
            {
                /**恢复换三张 */
                if (this._gameStatus === ApiRcssg.gameStatus.HUANSANZHANG && data.gameData.suggestCard) {
                    if (!RCSSGModel.getIsHuanPai(RCSSGModel.getMyChairID())) {
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
                if (this._gameStatus === ApiRcssg.gameStatus.PLAYING) {
                    if (myUid == operateUid) {
                        this._handTileMgrList[0].setIsMyTurn();
                        if (!data.gameData.operateCard) {
                            this._handTileMgrList[0].setPengChu();
                        }
                        this.setFirstTip()
                    }
                }
                /**恢复报听按钮 */
                if (this._gameStatus === ApiRcssg.gameStatus.BAOTING) {
                    let BaoUser = data.gameData.BaoUser
                    if (!RCSSGModel.getIsTianTing(myUid) && !RCSSGModel.getIsBaoDone(myUid) && BaoUser.includes(myUid)) {
                        this.com_opt.showBaoting(true)
                    }
                }
                /**恢复报听标记 */
                let tianTing = Object.keys(data.gameData.tianTing || {})
                tianTing.forEach(uid => {
                    let bidx = RCSSGModel.getUserIndexByUID(uid)
                    let b = this._userList[bidx]
                    b && b.setBaoTing(true)
                });
                this.checkTingPai();
            }
        }
    },

    /**判断人数，初始化头像位置 */
    seatsInit(chairCount) {
        if (this._userList.length > 0) {
            this._userList.forEach(u => u.leave())
            return
        }
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
            this._userList.push(headNode.getComponent("RCSSGHead"));
            this._userList[i].initRes();
            let handTile = cc.find("tableInfo/handTiles" + idx, this.node);
            let optTile = cc.find("tableInfo/optTiles" + idx, this.node);
            if (!optTile) {
                optTile = cc.find("optTiles" + idx, handTile);
            }
            let disTile = cc.find("tableInfo/outTiles" + idx, this.node);
            this._handTileMgrList.push(handTile.getComponent("RCSSGHandTileMgr"));
            this._handTileMgrList[i].init(idx);
            this._optTileMgrList.push(optTile.getComponent("RCSSGOptTileMgr"));
            this._optTileMgrList[i].init(i);
            this._disTileMgrList.push(disTile.getComponent("RCSSGOutTileMgr"));
            this._disTileMgrList[i].init(idx);

            let opNode = cc.find("operAct" + idx, this.node);
            this._operActNodeList.push(opNode);
        }
    },

    /**用户进入房间 */
    userEnterRoom(data) {
        this._syncUser(data.uid, (ctrl) => {
            ctrl.init(data);
            if (this._gameStatus === ApiRcssg.gameStatus.HUANSANZHANG) {
                if (!RCSSGModel.getIsHuanPai(data.chairID)) {
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
        let idx = RCSSGModel.getUserIndexByUID(uid);
        let Ctrl = this._userList[idx];
        if (Ctrl && funs) funs(Ctrl);
    },

    /**恢复所有人的总输赢分数 */
    initTotalScore(userWinTotalScore) {
        if (userWinTotalScore && RCSSGModel.scoreState()) {
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
            if (!RCSSGModel.getRoomID() || RCSSGModel.getRoomID() == data.roomID) {
                this.enterHall();
            }
        }
    },

    /**玩家准备 */
    onUserReady(data) {
        let idx = RCSSGModel.getUserIndexByChairID(data.chairID);
        let com = this._userList[idx];
        if (com) com.setReady(true);
        if (data.chairID == RCSSGModel.getMyChairID()) {
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
        RCSSGModel.setCurBureau(data.curBureau);
        AssetsManager.clearDialog(['RCSSGFanPai']);
        MessageCallback.emitMessage('RemoveGameResult');
        this.txt_round.string = `${data.curBureau}/${RCSSGModel.getMaxBureau()}局`;
        this.btn_dismiss.active = data.curBureau != 0 && !RCSSGModel.getGameRuleByKey("canNotDissmiss");
    },

    /**更新剩余牌数量 */
    onLastTilesCountUpdate(count) {
        if (!count) count = 0
        RCSSGModel.setRestCardsCount(count);
        this.txt_last.string = `${count}`
    },

    /**更新庄家 */
    onBankerUpdate(uid) {
        // console.log("更新庄家===chuangguanUid", chuangguanUid)
        this._syncUser(uid, (ctrl) => {
            ctrl.setBanker(true);
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
        this._com_huanPai.onHuanPaiStatus(data);
        if (this._gameStatus == ApiRcssg.gameStatus.NONE ||
            this._gameStatus == ApiRcssg.gameStatus.DICES) {
            this.onLastTilesCountUpdate(0);
        }
        this.btn_ready.active = RCSSGModel.getCurBureau() == 0 && this._gameStatus == ApiRcssg.gameStatus.NONE;
        switch (this._gameStatus) {
            case ApiRcssg.gameStatus.NONE:
                RCSSGModel.reset();
                this.resetTable();
                break;
            case ApiRcssg.gameStatus.PLAYING:
                this._handTileMgrList[0].setAllTilesDown();
                this._com_huanPai.reset()
                RCSSGModel.setCanBaoTing(false)
                break;
            case ApiRcssg.gameStatus.HUANSANZHANG:
                this._userList.forEach(c => {
                    c.setState(1)
                });
                break;
            case ApiRcssg.gameStatus.BAOTING:
                this._handTileMgrList[0].setAllTilesDown();
                break;
            default:
                break;
        }
    },

    /**换牌推荐 */
    onHuanPaiSuggest(data) {
        this._com_huanPai.onUsrHuanPaiSuggest(data)
        if (data.uid === RCSSGModel.myUid) {
            this._handTileMgrList[0].setHuanPai(data.cardList)
            this.com_clock.setTick(data.totalTick)
        }
    },

    /**发牌 */
    onSendTiles(data, isAnim) {
        // console.log("发牌==》", data)
        if (!data.handCards) return;
        let lastOpt = RCSSGModel.getLastOperate();
        let isTest = UserModel.getData('isTest');
        let handCards = data.handCards;
        for (const uid in handCards) {
            let user = RCSSGModel.getUserByUID(uid);
            if (!user) continue;
            let idx = RCSSGModel.getUserIndexByUID(uid);
            let hcom = this._handTileMgrList[idx];
            if (!hcom) continue;
            if (!isAnim) RCSSGModel.delZimoCard(uid);
            let tiles = RCSSGModel.getHandCards(uid)
            let drawTile = !!lastOpt && lastOpt.uid == uid && lastOpt.operate == ApiRcssg.operateType.GET ? lastOpt.card : null;
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


    /**通知用户操作 */
    onGameTurn(data) {
        this.setTilesGary(-1);
        let isTest = UserModel.getData('isTest');
        let idx = RCSSGModel.getUserIndexByUID(data.uid);
        this.com_clock.setTick(data.tick);
        this.com_clock.setDir(idx);

        let isMoPai = false;
        if ((data.operateArray && (data.operateArray.indexOf(ApiRcssg.operateType.QI) != -1 || data.operateArray.indexOf(ApiRcssg.operateType.GET) != -1))) {
            //通知出牌
            isMoPai = data.operateArray.indexOf(ApiRcssg.operateType.GET) != -1 || data.card != null;
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
                        bundle: Enums.bundleType.RCSSGMJ
                    });
                    if (idx == 0 && data.operateArray.indexOf(ApiRcssg.operateType.QI) != -1) {
                        comp.setIsMyTurn();
                        this.setFirstTip()
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
        if (turn.operateArray && turn.operateArray.length > 0 && !turn.operateArray.includes(ApiRcssg.operateType.GET)) {
            this.com_opt.onGameTurn(turn);
        } else {
            this.com_opt.onClearTurn();
        }
        this.checkTingPai();
    },

    /**设置第一手出牌提示 */
    setFirstTip(isShow = true) {
        if (cc.isValid(this.tip1) && RCSSGModel.getMyUID() == RCSSGModel.getBankerUid()) {
            let lastopt = RCSSGModel.getLastOperate()
            if (!lastopt && isShow) this.tip1.active = true
            else this.tip1.active = false
        }
    },

    /**检查 听牌 */
    checkTingPai() {
        let myUid = RCSSGModel.getMyUID();
        let operateUid = RCSSGModel.getCurOptUID();
        let handCards = RCSSGModel.getHandCards(myUid);
        let idx = RCSSGModel.getUserIndexByUID(myUid);
        let hcom = this._handTileMgrList[idx];
        let winHandChecks = handCards.slice();
        let tingHandChecks = handCards.slice();
        if (operateUid != myUid) {
            /**不是自己操作 去掉打听标记 显示听牌按钮*/
            if (hcom) hcom.setTingIcons();
            let operateRecords = RCSSGModel.getOperateRecords(myUid);
            let winTingFilter = RCSSGModel.tingFilter(null, winHandChecks);
            let canWinList = RCSSGLogic.getTingList(winTingFilter.cards, winTingFilter.ghostCardsCount);
            this.btn_ting.active = canWinList.length > 0;
            this._canWinList = canWinList;
        } else if (operateUid == myUid) {
            let tingCards = [];
            this._tingList = [];
            //判断是否需要删除手牌
            let repeatFilter = Array.from(new Set(tingHandChecks));
            for (const cardId of repeatFilter) {
                let copyTingHandCards = tingHandChecks.slice();
                let tingFilter = RCSSGModel.tingFilter(cardId, copyTingHandCards);
                let canTingList = RCSSGLogic.getTingList(tingFilter.cards, tingFilter.ghostCardsCount);
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
        let tiles = RCSSGModel.getHandCards(RCSSGModel.getMyUID())
        if (tiles.length >= 14) {
            return
        }
        let winTingFilter = RCSSGModel.tingFilter(null, tiles.slice());
        let canWinList = RCSSGLogic.getTingList(winTingFilter.cards, winTingFilter.ghostCardsCount);
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
        if (data) {
            let idx = RCSSGModel.getUserIndexByUID(data.uid);
            if (typeof (idx) == "number") {
                let com = this.genAniNode(this._operActNodeList[idx])
                com && com.showHuIndex(data.operate, data.plusInfo.huSequence, data.chairID, isAni)
            }
        }
    },

    /**用户操作广播 */
    onUserOpt(data) {
        // console.log("615==用户操作广播", data);
        this.setTilesGary(-1);
        this.com_opt.onClearTurn();
        let plusInfo = data.plusInfo || null;
        let isTest = UserModel.getData("isTest");
        let CurIndex = RCSSGModel.getUserIndexByUID(data.uid);
        let CurUserCtrl = this._userList[CurIndex];
        let CurUserInfo = CurUserCtrl ? CurUserCtrl.getUserData() : null;
        let CurUserSex = !!CurUserInfo && (CurUserInfo.userInfo.sex == 0) ? 'nan' : 'nv';
        this.setFirstTip(false)
        if (data.uid == RCSSGModel.getMyUID()) {
            this.com_ting.node.active = false;
            this._handTileMgrList[0].setTingIcons();
        }
        //展示分数
        if (plusInfo && plusInfo.winScoreRecord && plusInfo.winScoreRecord.length > 0) {
            for (let i = 0; i < plusInfo.winScoreRecord.length; i++) {
                let index = RCSSGModel.getUserIndexByChairID(i);
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
        if (data.operate == ApiRcssg.operateType.QI) {
            let moOpt = RCSSGModel.getQiByMo(data);
            if (!!moOpt && moOpt.card != data.card) {
                drawTile = moOpt.card;
            }
        }
        /**更新手牌 */
        let CtrlHandTile = this._handTileMgrList[CurIndex];
        let handCards = RCSSGModel.getHandCards(data.uid);
        if (!CtrlHandTile) return;
        if (CurIndex != 0 && !!isTest) {
            CtrlHandTile.updateLieTiles(handCards);
        } else {
            drawTile = CurIndex == 0 ? drawTile : null;
            CtrlHandTile.updateStandTiles(handCards, drawTile);
        }
        let optPengGang = () => {
            let pengGangArray = RCSSGModel.getPengGangArrayByUID(data.uid);
            let optCom = this._optTileMgrList[CurIndex];
            if (optCom) optCom.updateOptTiles(pengGangArray);
            let lastOut = RCSSGModel.getLastOutCardRecord();
            if (!!lastOut.isDel) {
                let localIndex = RCSSGModel.getUserIndexByUID(lastOut.opt.uid);
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
            let lastOut = RCSSGModel.getLastOutCardRecord();
            if (!!lastOut.isDel) {
                let localIndex = RCSSGModel.getUserIndexByUID(lastOut.opt.uid);
                this._disTileMgrList[localIndex].afterOptUpdateTiles(lastOut.opt.card);
                this.updatePointer();
            }
        }

        let showAni = (ainmType) => {
            let audioType = ainmType;
            let audioList = ["chi", "peng", "gang", "hu", "zimo"];

            if (audioType < audioList.length) {
                AssetsManager.playEffect({
                    bundle: Enums.bundleType.RCSSGMJ,
                    path: `res/audio/${CurUserSex}/${audioList[audioType]}`,
                });
            }

            //展示动画
            let CtrlAct = this.genAniNode(this._operActNodeList[CurIndex])
            CtrlAct.showOpt(ainmType);
            if (ainmType == 2) {
                let curType = 5; //刮风
                if (data.operate === ApiRcssg.operateType.GANG_ZHI) {
                    curType = 7 //下雨
                }
                let com = this.genAniNode(this.animationNode)
                com.showOpt(curType);
            }
            if (ainmType >= 3) {
                this.showHuIdx(data, true);
            }
        }

        switch (data.operate) {
            case ApiRcssg.operateType.QI: //出牌
                AssetsManager.playEffect({
                    bundle: Enums.bundleType.RCSSGMJ,
                    path: `res/audio/${CurUserSex}/` + data.card,
                });
                AssetsManager.playEffect({
                    path: 'res/audio/main/push',
                    bundle: Enums.bundleType.RCSSGMJ
                });
                if (CurIndex == 0) {
                    this._handTileMgrList[0].setTouch(false)
                }
                /**更新桌子上的牌 */
                let last = null,
                    disCom = this._disTileMgrList[CurIndex];
                let out = RCSSGModel.getOutTilesByUID(data.uid);
                if (disCom) last = disCom.showOutTiles(out)
                if (last && last.flower == data.card) {
                    this.updatePointer(last.node);
                }
                if (CurIndex == 0) {
                    this.showTingLight()
                }
                break;
            case ApiRcssg.operateType.CHI: //吃牌
                showAni(0)
                optPengGang()
                break;
            case ApiRcssg.operateType.PENG: //碰牌
                showAni(1)
                optPengGang()
                break;
            case ApiRcssg.operateType.GANG_BU: //补杠
                showAni(2)
                optPengGang()
                break;
            case ApiRcssg.operateType.GANG_CHI: //吃杠
                showAni(2)
                optPengGang()
                break;
            case ApiRcssg.operateType.GANG_ZHI: //暗杠
                showAni(2)
                optPengGang();
                break;
            case ApiRcssg.operateType.HU_QIANG: //抢杠胡
            case ApiRcssg.operateType.HU_CHI: //接炮
                showAni(3);
                optHu();
                break;
            case ApiRcssg.operateType.HU_ZHI: //自摸
                showAni(4)
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
        let myUid = RCSSGModel.getMyUID();
        let huInfo = null,
            maPaiInfo = null;
        let isTest = UserModel.getData("isTest");
        let result = Utils.deepCopy(data.result)

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
                let idx = RCSSGModel.getUserIndexByUID(user.uid);
                if (!this._handTileMgrList[idx]) continue;
                let userCards = user.userCards[user.uid];
                if (!!user.huInfo) {
                    user.huCards = user.huCards || [];
                    let huFilter = [ApiRcssg.operateType.HU_ZHI];
                    if (huFilter.includes(user.huType)) { //删除胡牌
                        let huCardIndex = userCards.indexOf(user.huCards);
                        if (huCardIndex >= 0) userCards.splice(huCardIndex, 1);
                    }
                    this._handTileMgrList[idx].setHuTile(user.huCards);
                }
                userCards = RCSSGModel.sortTiles(user.uid, userCards);
                this._handTileMgrList[idx].updateLieTiles(userCards);
            }
        }

        AssetsManager.playEffect({
            path: 'res/audio/main/push',
            bundle: Enums.bundleType.RCSSGMJ
        });
        let createResultDialog = () => {
            let isBureauFull = RCSSGModel.getCurBureau() >= RCSSGModel.getMaxBureau();
            data.mainComp = this;
            data.isResult = true;
            data.bundle = Enums.bundleType.RCSSGMJ;
            data.onEnd = this._onEnd.bind(this);
            data.path = "res/prefab/RCSSGResultDialog";
            data.enterHall = this.enterHall.bind(this);
            data.isBureauFull = isBureauFull;
            AssetsManager.createDialog(data);
        }
        this.scheduleOnce(() => {
            createResultDialog();
        }, 0);
    },

    _onEnd(data) {
        // console.log("609==游戏大结算", data);
        if (!!RCSSGModel.getResult()) {
            this.onSmall(RCSSGModel.getResult());
            return
        };
        UserModel.setData('roomID', '');
        RCSSGModel.setAllResult(null);
        if (data.result.length > 0) {
            this.showMJAllResultFunc = () => {
                this.showMJAllResultFunc = null;
                data.mainComp = this;
                data.isUnionCreate = RCSSGModel.isUnionCreate();
                data.enterHall = this.enterHall.bind(this);
                data.roomDismissReason = data.reason;
                data.path = 'res/prefab/RCSSGAllResult';
                data.bundle = Enums.bundleType.RCSSGMJ;
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
            let acom = aniNode.getComponent("RCSSGOperAct")
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
        this._com_huanPai.reset()
        this.btn_ting.active = false;
        this.com_ting.node.active = false;
        this.onLastTilesCountUpdate(0);
        this.setFirstTip(false)
        this.animationNode.removeAllChildren()
    },

    /**手牌点击，牌被抬起来 */
    onTileUp(tileCom) {
        /**打听显示 */
        let myUid = RCSSGModel.getMyUID();
        this.com_ting.node.active = false;
        let handCards = RCSSGModel.getHandCards(myUid)
        if (this._tingList.includes(tileCom.flower)) {
            let myTiles = handCards.slice();
            let tingFilter = RCSSGModel.tingFilter(tileCom.flower, myTiles);
            let canWinList = RCSSGLogic.getTingList(tingFilter.cards, tingFilter.ghostCardsCount);
            if (canWinList.length > 0) {
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
                if (RCSSGModel.getCurBureau() == 0) {
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
                    gameType: Enums.bundleType.RCSSGMJ,
                    musicType: Enums.bundleType.MAHJONG,
                });
                break;
            case "btn_review": //回看
                this._hideMenu();
                if (CCUtil.clickInterval(event.target, 1)) return;
                this._isClickReview = true;
                ApiRoom.gameMessageNotify(ApiRcssg.gameReviewNotify());
                break;
            case "btn_msg": //聊天
                this._hideMenu();
                if (CCUtil.clickInterval(event.target, 1)) return;
                let params = {
                    gameRule: RCSSGModel.getGameRule(),
                    chat: (chat) => {
                        ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
                    }
                }
                AssetsManager.chatDialog(params);
                break;
            case "btn_rules": //规则
                this._hideMenu();
                if (CCUtil.clickInterval(event.target, 1)) return;
                let rule = RCSSGModel.getGameRule();
                if (!rule) return;
                AssetsManager.tableDialog({
                    gameRule: rule,
                });
                break;
            case "btn_ting": //听牌
                this._hideMenu();
                // this._canWinList = RCSSGModel.getTingList();
                if (this._canWinList.length > 0 && !this.com_ting.node.active) {
                    for (let i = 0; i < this._canWinList.length; i++) {
                        if (!this._canWinList[i]) continue;
                        this._canWinList[i].count = RCSSGModel.getRestCardCount(this._canWinList[i].cardID);
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
                    users: RCSSGModel.getUsers(),
                    chairCount: RCSSGModel.getChairCount(),
                    fangzuobi: RCSSGModel.getGameRuleByKey('fangzuobi')
                })
                break;
            case "btn_deposit": //开始托管
                this._hideMenu();
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiRcssg.gameTrushNotify(true));
                break;
            case "btn_quxiaotuoguan": //取消托管
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiRcssg.gameTrushNotify(false));
                break;
            case "btn_invite": //邀请
                this._hideMenu();
                let gameRule = RCSSGModel.getGameRule();
                gameRule = gameRule || {};
                gameRule.roomId = RCSSGModel.getRoomID();
                let share = ConfigModel.getRoomRuleShare(gameRule);
                NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
                break;
            case "btn_copy": //复制
                let str = ConfigModel.getRoomShare(Enums.bundleType.RCSSGMJ, RCSSGModel.getRoomID());
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
            gameRule: RCSSGModel.getGameRule(),
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
        let isUnionCreate = RCSSGModel.isUnionCreate();
        let unionID = !!isUnionCreate ? RCSSGModel.getRoomCreatorByKey('unionID') : null;
        SubManager.exitBundle(unionID);
    },

    /**GPS定位检查 */
    verifyZuobi(roomUserInfo) {
        if (!RCSSGModel.getGameRuleByKey("fangzuobi")) return;
        if (!roomUserInfo || roomUserInfo.chairID >= RCSSGModel.getChairCount()) return;
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
        let fidx = RCSSGModel.getUserIndexByChairID(fromChairID)
        let tidx = RCSSGModel.getUserIndexByChairID(toChairID)
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
        ConfigModel.setData('lastScene', 'rcssg');
        AssetsManager.release();
    },

    update(dt) { },
});