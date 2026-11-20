const ApiMhxl = require('./ApiMhxl');
const ApiRoom = require('../../../src/api/ApiRoom');;
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const UserModel = require('../../../src/model/UserModel');
const Codes = require('../../../src/const/Codes');
const ConfigModel = require('../../../src/model/ConfigModel');
const NativeUtil = require('../../../src/utils/NativeUtil');
const MHXLModel = require('./MHXLModel');
const MHXLLogic = require('./MHXLLogic');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const SubManager = require('../../../src/utils/SubManager');
const Events = require('../../../src/const/Events');
const MessageCallback = require('../../../src/utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        com_opt: require("MHXLOperate"),
        com_clock: require("MHXLClock"),
        com_ting: require("MHXLTingTips"),
        readyTick: require('MHXLReadyTick'),
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
    },

    onLoad() {
        this.onInIt();
    },
    /**消息监听 */
    messageCallbackHandler(route, msg) {
        if (route === 'RoomMessagePush') {
            if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
                this.gameInit(msg.data);
            } else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
                MHXLModel.otherUserJoinRoom(msg.data.roomUserInfo);
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
                msg.data.myChairID = MHXLModel.getMyChairID();
                AssetsManager.disDialog(msg.data);
                MHXLModel.setResult(null);
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
                let idx = MHXLModel.getUserIndexByChairID(msg.data.chairID);
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
            if (msg.type === ApiMhxl.GAME_BUREAU_PUSH) {
                this.onGameRoundUpdate(msg.data);
            } else if (msg.type === ApiMhxl.GAME_STATUS_PUSH) { //游戏状态
                MHXLModel.setGameStatus(msg.data.gameStatus);
                this.onGameStatusUpdate(msg.data);
            } else if (msg.type === ApiMhxl.GAME_SEND_CARDS_PUSH) { //发牌
                // console.log("603==发玩家手牌", msg.data)
                this.deleteMoveNode();
                this.com_clock.hideDice();
                // MHXLModel.setGhostCard(msg.data.laiZiCards);
                MHXLModel.setHandCards(msg.data.handCards);
                this.onSendTiles(msg.data, true);
            } else if (msg.type == ApiMhxl.GAME_USER_GU_MAI_SUGGEST_PUSH) {
                let uid = msg.data.uid;
                let gumaifen = msg.data.gumaifen || 0;
                this.com_opt.showGuMai(!gumaifen && uid == MHXLModel.getMyUID());
            } else if (msg.type == ApiMhxl.GAME_GU_MAI_PUSH) {
                this.showGuMai(msg.data.uid, msg.data.cardList, true);
            } else if (msg.type == ApiMhxl.GAME_JI_PAI_PUSH) {
                this.deleteMoveNode();
                this.showJiPai(msg.data.uid, msg.data.JiPaiType, true);
            } else if (msg.type === ApiMhxl.GAME_DICES_PUSH) {
                this.com_clock.showDiceAni(msg.data.dice1, msg.data.dice2);
            } else if (msg.type === ApiMhxl.GAME_TURN_OPERATE_PUSH) { //用户操作广播
                // console.log("615==用户操作广播", msg.data);
                this.deleteMoveNode();
                MHXLModel.onUserOpt(msg.data);
                this.onUserOpt(msg.data);
                this.checkTingPai()
            } else if (msg.type === ApiMhxl.GAME_TURN_PUSH) { //通知用户操作
                // console.log("614==听牌用户操作", msg.data);
                this.deleteMoveNode();
                MHXLModel.onGameTurn(msg.data);
                this.onGameTurn(msg.data);
            } else if (msg.type === ApiMhxl.GAME_USER_SHAI_PAI_PUSH) { //用户摆牌完成
                this.showTianTing(msg.data.uid);
            } else if (msg.type === ApiMhxl.GAME_USER_YUAN_BAO_PUSH) {
                // console.log("621==用户原报", msg.data)
                MHXLModel.onGameTurn(msg.data);
                this.removeAllAct();
                if (msg.data.uid == MHXLModel.getMyUID()) {
                    MHXLModel.setYuanBao(true);
                    this.onGameTurn(msg.data);
                }
            } else if (msg.type === ApiMhxl.GAME_ALL_HU_CARDS_PUSH) { //更新不能出的牌
                // console.log("627==更新不能出的牌==", msg.data)
                MHXLModel.setSelfAllHuCards(msg.data)
                let isMyTurn = MHXLModel.isTurn(MHXLModel.getMyUID())
                this._handTileMgrList[0].setTouch(isMyTurn)
            } else if (msg.type === ApiMhxl.GAME_BANKER_PUSH) { //庄家位置更新
                this.onBankerUpdate(msg.data.uid, msg.data.userList);
            } else if (msg.type === ApiMhxl.GAME_REST_CARDS_COUNT_PUSH) { //剩余牌数量更新
                this.onLastTilesCountUpdate(msg.data.restCardsCount);
            } else if (msg.type === ApiMhxl.GAME_REVIEW_PUSH) {
                // console.log("607==查看回放==", msg.data.reviewRecord, msg.data.reviewRecord.length)
                let reviewRecord = msg.data.reviewRecord;
                if (reviewRecord && reviewRecord.length > 0) {
                    AssetsManager.createDialog({
                        bundle: Enums.bundleType.MHXL,
                        path: "res/prefab/MHXLResultDialog",
                        reviewRecord: reviewRecord,
                    });
                } else {
                    AssetsManager.tipDialog('暂无回放没有数据');
                }
            } else if (msg.type === ApiMhxl.GAME_RESULT_PUSH) { //小结算
                // console.log("606==小结算==", msg.data)
                MHXLModel.setResult(msg.data);
                this.onSmall(msg.data);
            } else if (msg.type === ApiMhxl.GAME_END_PUSH) {
                // console.log("609==游戏大结算", msg.data);
                MHXLModel.setAllResult(msg.data);
                this._onEnd(msg.data);
            } else if (msg.type === ApiMhxl.GAME_TRUST_PUSH) { //开始托管
                if (MHXLModel.myUid == msg.data.uid) {
                    this.tuoguan.active = msg.data.trust
                }
            } else if (msg.type === ApiMhxl.GAME_GANG_SCORE_PUSH) { //杠分
                let list = {
                    [msg.data.uid]: msg.data.detail.score
                }
                for (let i = 0; i < msg.data.detail.loseUid.length; i++) {
                    list[msg.data.detail.loseUid[i]] = msg.data.detail.score * -1
                }
                for (const uid in list) {
                    if (Object.hasOwnProperty.call(list, uid)) {
                        const score = list[uid];
                        let index = MHXLModel.getUserIndexByUID(uid)
                        this.showOptScore(score, index)
                    }
                }
            } else if (msg.type === ApiMhxl.GAME_QIANG_GANG_DELETE_PUSH) { //抢杠胡之后删除手牌
                // console.log("抢杠胡之后删除手牌==", msg.data)
                MHXLModel.qiangGangHuDel(msg.data)
                let h = MHXLModel.getHandCards(msg.data.uid, false)
                let idx = MHXLModel.getUserIndexByUID(msg.data.uid)
                let hcom = this._handTileMgrList[idx];
                if (hcom) hcom.updateStandTiles(h)
            }
        } else if (route === 'ReconnectSuccess') {
            this.getRoomSceneInfo();
        } else if (route === 'SelfEntryRoomPush') {
            if (msg.gameType != MHXLModel.getBundleType()) {
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

    showJiPai(uid, JiPaiType, isAnim = false) {
        this._JiPaiAinm = isAnim;
        this._syncUser(uid, (ctrl) => {
            ctrl.shwoTypeTips(JiPaiType);
        });
        isAnim && this.showOperAct(uid, (CtrlAct) => {
            CtrlAct.showJiPai(JiPaiType, () => {
                this._JiPaiAinm = false;
            });
        })
    },

    showGuMai(uid, cardList, isAnim = false) {
        this._syncUser(uid, (ctrl) => {
            cardList && ctrl.showGuMai(cardList);
        });
        isAnim && this.showOperAct(uid, (ctrl) => {
            if (uid == MHXLModel.getMyUID()) {
                this.com_opt.showGuMai(false);
            }
            ctrl.showGuMai(cardList);
        })
    },

    showOperAct(uid, funs, showNode) {
        if (!showNode) {
            let idx = MHXLModel.getUserIndexByUID(uid);
            showNode = this._operActNodeList[idx];
        }
        if (showNode) {
            let optNode = cc.instantiate(this.operActPfb);
            let CtrlAct = optNode.getComponent('MHXLOperAct');
            optNode.parent = showNode;
            if (funs) funs(CtrlAct);
        }
    },

    showTianTing(uid) {
        if (!uid) return
        if (uid == MHXLModel.getMyUID()) {
            MHXLModel.setTianTing(true);
        }
        this._syncUser(uid, (CtrlUser) => {
            CtrlUser.showTing(true);
        });
        this.showOperAct(uid, (CtrlAct) => {
            CtrlAct.showOpt(ApiMhxl.operateType.DAITIANTING);
        });
        // AssetsManager.playEffect({
        //     bundle: Enums.bundleType.MHXL,
        //     path: `res/audio/${CurUserSex}/${audioList[audioType]}`,
        // });
    },
    /**
     * 同步用户
     * @param {*} uid 
     * @param {*} funs 
     */
    _syncUser(uid, funs) {
        if (!uid) return false;
        let idx = MHXLModel.getUserIndexByUID(uid);
        let Ctrl = this._userList[idx];
        if (Ctrl && funs) funs(Ctrl);
    },

    /**初始化和断线重连 */
    gameInit(data) {
        //初始信息
        MessageCallback.emitMessage('RemoveGameResult');
        this.resetTable();
        MHXLModel.init(data);
        this.unscheduleAllCallbacks();
        let myUid = MHXLModel.getMyUID();
        let gameRule = MHXLModel.getGameRule();
        MHXLLogic.init(MHXLModel.getGameRule());
        let operateUid = data.gameData.operateUid;
        this._gameStatus = data.gameData.gameStatus;
        this.showTestBtn(UserModel.getData("isTest"));
        //房间信息
        this.txt_round.string = `${data.gameData.curBureau}/${data.gameData.maxBureau}局`;
        let bundle = ConfigModel.getBundleConfig(gameRule.gameType);
        this.txt_roomId.string = `房号:${data.roomID}`;
        this.txt_gameName.string = bundle.name;
        //用户信息
        this.seatsInit();
        let roomUserInfoArr = data.roomUserInfoArr;
        for (let i = 0; i < roomUserInfoArr.length; i++) {
            const user = roomUserInfoArr[i];
            this.userEnterRoom(user);
        }
        this.initTotalScore(data.gameData.userWinTotalScore); //输赢统计
        this.onLastTilesCountUpdate(data.gameData.restCardsCount); //剩余牌数
        this.onBankerUpdate(data.gameData.bankerUid, data.gameData.liangZhuangCount);
        if (this.canNotDismissBar) this.canNotDismissBar.active = MHXLModel.getGameRuleByKey("canNotDissmiss")
        //按钮显示
        let unionID = MHXLModel.isUnionCreate() ? MHXLModel.getRoomCreatorByKey('unionID') : null;
        let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
        this.btn_ready.active = (this._gameStatus === ApiMhxl.gameStatus.NONE && data.gameData.userPlayStatus[myUid] == ApiRoom.userStatusEnum.NONE);
        this.btn_invite.active = MHXLModel.getCurBureau() == 0 && !!isShowInvite;
        this.btn_copy.active = MHXLModel.getCurBureau() == 0 && !!isShowInvite;
        if (this.btn_ready.active && MHXLModel.getCurBureau() == 0 && MHXLModel.getGameRuleByKey("unReadyKick") > 0) {
            let tick = MHXLModel.getGameRuleByKey("unReadyKick") || 10;
            this.readyTick.sync(tick);
        } else {
            this.readyTick.sync(0);
        }
        let yuyin = MHXLModel.getGameRuleByKey('yuyin');
        this.btnYuYin.active = !!yuyin && ConfigModel.getData('voiceSpeaker');
        this.btnBackHall.active = data.gameData.curBureau == 0 && MHXLModel.isUnionCreate();
        this.btn_location.active = !!MHXLModel.getGameRuleByKey("showGps");
        this.btn_dismiss.active = data.gameData.curBureau != 0 && !MHXLModel.getGameRuleByKey("canNotDissmiss");
        this.btn_leave.active = data.gameData.curBureau == 0;
        let userTrustArray = data.gameData.autoUser || {};
        this.tuoguan.active = !!userTrustArray[myUid];
        let tm = MHXLModel.getGameRuleByKey("trustTm");
        this.btn_deposit.active = tm && tm > 0;
        //估卖
        let myGuMai = false;
        let GuMaiList = data.gameData.GuMaiList || {};
        for (const uid in GuMaiList) {
            let val = GuMaiList[uid] || 0;
            if (uid == MHXLModel.getMyUID()) {
                myGuMai = true;
            }
            this.showGuMai(uid, val, this._gameStatus == ApiMhxl.gameStatus.GUMAI);
        }
        if (this._gameStatus == ApiMhxl.gameStatus.GUMAI) {
            let gumai = MHXLModel.getGameRuleByKey("gumai");
            let gumaifen = MHXLModel.getGameRuleByKey("gumaifen");
            if (!!gumai && gumaifen == 0 && myGuMai == false) {
                this.com_opt.showGuMai(true);
            }
        }
        //原报
        if (this._gameStatus == ApiMhxl.gameStatus.BAOTING) {
            let yuanBaoDoneUser = data.gameData.yuanBaoDoneUser || [];
            let isYuanBao1 = yuanBaoDoneUser.indexOf(myUid) == -1;
            let yuanBaoUser = data.gameData.yuanBaoUser || [];
            let isYuanBao2 = yuanBaoUser.indexOf(myUid) != -1;
            this.removeAllAct();
            if (isYuanBao2 && isYuanBao1) {
                let dataObj = {
                    uid: myUid,
                    operateArray: [
                        ApiMhxl.operateType.GUO,
                        ApiMhxl.operateType.TIANTING,
                    ],
                    tick: data.gameData.totalTick || 15,
                }
                MHXLModel.onGameTurn(dataObj);
                MHXLModel.setYuanBao(true);
                this.onGameTurn(dataObj);
            }
        }
        //鸡牌
        let Jipailist = data.gameData.jipailist || {};
        for (const uid in Jipailist) {
            let sonList = Jipailist[uid] || [];
            sonList.forEach((CurData) => {
                this.showJiPai(uid, CurData.JiPaiType);
            })
        }
        //天听
        let tianTing = data.gameData.tianTing || {};
        for (const uid in tianTing) {
            this._syncUser(uid, (ctrl) => {
                ctrl.showTing(true);
            })
        }
        //状态管理
        this.com_clock.node.active = true;
        this.com_clock.gameInit(MHXLModel.getChairCount(), MHXLModel.getMyChairID());
        if (this._gameStatus == ApiMhxl.gameStatus.NONE && MHXLModel.getCurBureau() == 0) {
            this.com_clock.node.active = false;
        }
        //牌面恢复
        if (this._gameStatus > ApiMhxl.gameStatus.DICES) {
            /**恢复手牌 */
            this.onSendTiles(data.gameData, false);
            let users = MHXLModel.getUsers();
            for (const user of users) {
                let idx = MHXLModel.getUserIndexByUID(user.uid);
                /**恢复吃碰杠的牌 */
                let pengGangArray = MHXLModel.getPengGangArrayByUID(user.uid);
                if (pengGangArray.length > 0 && !!this._optTileMgrList[idx]) {
                    this._optTileMgrList[idx].updateOptTiles(pengGangArray);
                }
                /**恢复打出的牌 */
                let out = MHXLModel.getOutTilesByUID(user.uid);
                if (out.length > 0 && !!this._disTileMgrList[idx]) {
                    let last = this._disTileMgrList[idx].showOutTiles(out);
                    if (last && data.gameData.lastOperateUid == user.uid &&
                        last.flower == data.gameData.operateCard) {
                        this.updatePointer(last.node)
                    }
                }
            }
            /**恢复推荐选牌 */
            if (this._gameStatus === ApiMhxl.gameStatus.HUANSANZHANG && data.gameData.suggestCard) {
                if (!MHXLModel.getIsHuanPai(MHXLModel.getMyChairID())) {
                    let sug = data.gameData.suggestCard[myUid];
                    this._handTileMgrList[0].setHuanPai(sug);
                }
            }
            if (this._gameStatus === ApiMhxl.gameStatus.PLAYING) {
                /**恢复方向指示 */
                let curOptIdx = MHXLModel.getUserIndexByUID(operateUid);
                this.com_clock.setDir(curOptIdx);
                this.com_clock.setTick(data.gameData.tick);
                /**设置该谁出牌 */
                if (myUid == operateUid) { //&& data.gameData.lastOperateUid != myUid
                    this._handTileMgrList[0].setIsMyTurn();
                    if (!data.gameData.operateCard) {
                        this._handTileMgrList[0].setPengChu();
                    }
                }
                //恢复闷
                let userMenHuDoneList = data.gameData.userMenHuDoneList || [];
                userMenHuDoneList.forEach((menObj) => {
                    let CurIndex = MHXLModel.getUserIndexByUID(menObj.uid);
                    let hcom = this._menTilesMgrList[CurIndex];
                    let operateObj = menObj.operateType;
                    if (!!hcom && !!operateObj) {
                        hcom.menCardsSync(operateObj.card, operateObj.operateType);
                    }
                })

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
                        let huIdx = MHXLModel.getUserIndexByUID(huUser.uid);
                        let hcom = this._handTileMgrList[huIdx];
                        if (hcom) hcom.setHuTile(huUser.card);
                    }
                }
                this.checkTingPai();
            } else {
                this.btn_ting.active = false;
            }
        }

        let DaitianTing = data.gameData.DaitianTing || {};
        let myDaitianTing = DaitianTing[myUid] || {};
        if (myDaitianTing && !!myDaitianTing.type) {
            let tingList = myDaitianTing.getTingList || [];
            if (tingList.length) cc.systemEvent.emit("tianting", {
                tingList: tingList,
                isTing: true
            });
        } else if (data.gameData.userCanOperate && data.gameData.userCanOperate[myUid]) {
            let userOperate = data.gameData.userCanOperate[myUid];
            userOperate.operateCard = data.gameData.operateCard;
            this.com_opt.gameInit(userOperate);
        }
    },

    /**判断人数，初始化头像位置 */
    seatsInit() {
        let chairCount = MHXLModel.getChairCount();
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
            this._userList.push(h.getComponent("MHXLHead"));
            this._userList[i].initRes();

            let handTile = cc.find("RootTiles/handTiles" + CurIndex, this.node);
            let optTile = cc.find("RootTiles/optTiles" + CurIndex, this.node);
            if (!optTile) {
                optTile = cc.find("optTiles" + CurIndex, handTile);
            }
            let disTile = cc.find("RootTiles/outTiles" + CurIndex, this.node);
            this._disTileMgrList.push(disTile.getComponent("MHXLOutTileMgr"));
            this._disTileMgrList[i].init(CurIndex);

            this._handTileMgrList.push(handTile.getComponent("MHXLHandTileMgr"));
            this._handTileMgrList[i].init(CurIndex);

            this._optTileMgrList.push(optTile.getComponent("MHXLOptTileMgr"));
            this._optTileMgrList[i].init(CurIndex);

            let opNode = cc.find("operAct" + CurIndex, this.node);
            this._operActNodeList.push(opNode);

            let huaTile = cc.find("RootTiles/huaTiles" + CurIndex, this.node);

            this._menTilesMgrList.push(huaTile.getComponent("MHXLMenTileMgr"));
            this._menTilesMgrList[i].init(CurIndex);
        }
    },

    /**用户进入房间 */
    userEnterRoom(data) {
        this._syncUser(data.uid, (ctrl) => {
            ctrl.init(data);
            if (this._gameStatus === ApiMhxl.gameStatus.HUANSANZHANG) {
                if (!MHXLModel.getIsHuanPai(data.chairID)) {
                    ctrl.setState(1);
                }
            }
            // else if (this._gameStatus === ApiMHXL.gameStatus.DINGQUE) {
            //     if (!MHXLModel.getDingQueType(data.uid)) {
            //         ctrl.setState(2);
            //     }
            // }

        })
    },

    /**恢复所有人的总输赢分数 */
    initTotalScore(userWinTotalScore) {
        if (userWinTotalScore && MHXLModel.scoreState()) {
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
            if (!MHXLModel.getRoomID() || MHXLModel.getRoomID() == data.roomID) {
                this.enterHall();
            }
        }
    },

    /**玩家准备 */
    onUserReady(data) {
        let idx = MHXLModel.getUserIndexByChairID(data.chairID);
        let com = this._userList[idx];
        if (com) com.setReady(true);
        if (data.chairID == MHXLModel.getMyChairID()) {
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
        this.btn_copy.active = false;
        this.btn_leave.active = false;
        this.btn_dismiss.active = data.curBureau != 0 && !MHXLModel.getGameRuleByKey("canNotDissmiss");
        this.btn_invite.active = false;
        MHXLModel.setCurBureau(data.curBureau);
        this.txt_round.string = `${data.curBureau}/${MHXLModel.getMaxBureau()}局`;
        AssetsManager.clearDialog(['MHXLFanPai']);
    },

    /**更新剩余牌数量 */
    onLastTilesCountUpdate(count) {
        this.txt_last.string = !!count ? `x${count}` : "";
    },

    /**更新庄家 */
    onBankerUpdate(uid, userList) {
        if (!uid) return false;
        this._syncUser(uid, (ctrl) => {
            ctrl.setBanker(true);
            ctrl.showlianzhuang(userList);
        })
    },

    /**游戏状态跳转 */
    onGameStatusUpdate(data) {
        this._gameStatus = data.gameStatus;
        if (this._gameStatus == ApiMhxl.gameStatus.NONE ||
            this._gameStatus == ApiMhxl.gameStatus.DICES) {
            this.onLastTilesCountUpdate(0);
        }
        this.btnBackHall.active = false;
        this.com_clock.setTick(data.tick);
        this.com_clock.hideDice();
        this.hideReadyIcon();
        this.btn_ready.active = MHXLModel.getCurBureau() == 0 && this._gameStatus == ApiMhxl.gameStatus.NONE;
        this.readyTick.sync(0);
        switch (this._gameStatus) {
            case ApiMhxl.gameStatus.NONE:
                MHXLModel.reset();
                this.resetTable();
                break;
            case ApiMhxl.gameStatus.PLAYING:
                this._handTileMgrList[0].setAllTilesDown();
                break;
            case ApiMhxl.gameStatus.HUANSANZHANG:
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
        if (!data.handCards) return;
        let lastOpt = MHXLModel.getLastOperate();
        let isTest = UserModel.getData('isTest');
        let handCards = data.handCards;
        for (const uid in handCards) {
            let user = MHXLModel.getUserByUID(uid);
            if (!user) continue;
            let idx = MHXLModel.getUserIndexByUID(uid);
            let hcom = this._handTileMgrList[idx];
            if (!hcom) continue;
            if (!isAnim) MHXLModel.delZimoCard(uid);
            let tiles = MHXLModel.getHandCards(uid, false)
            let drawTile = !!lastOpt && lastOpt.uid == uid && lastOpt.operate == ApiMhxl.operateType.GET ? lastOpt.card : null;
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
        let allRecords = MHXLModel.getAllOperateRecords();
        if (allRecords.length < 2) {
            this._operActNodeList.forEach(n => {
                n.removeAllChildren();
            })
        }
    },

    /**通知用户操作 */
    onGameTurn(data) {
        this.removeAllAct();
        this.setTilesGary(-1);
        // console.log("通知用户操作", MHXLModel.getMyUID())
        /**更新时间和位置 */
        let isTest = UserModel.getData('isTest');
        let idx = MHXLModel.getUserIndexByUID(data.uid);
        this.com_clock.setTick(data.tick);
        this.com_clock.setDir(idx);
        if (idx == 0) { //被操作人是自己
            this._handTileMgrList[0].setBaiPai() //重置摆牌状态
        }
        let isMoPai = false
        if (data.operateArray && (data.operateArray.indexOf(ApiMhxl.operateType.QI) != -1 || data.operateArray.indexOf(ApiMhxl.operateType.GET) != -1)) {
            //通知出牌
            isMoPai = data.operateArray.indexOf(ApiMhxl.operateType.GET) != -1 || data.card != null;
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
                        bundle: Enums.bundleType.MHXL
                    });
                    if (idx == 0 && data.operateArray.indexOf(ApiMhxl.operateType.QI) != -1) {
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
        if (turn.operateArray && turn.operateArray.length > 0 && !turn.operateArray.includes(ApiMhxl.operateType.GET)) {
            this.com_opt.onGameTurn(turn);
            let operateArray = turn.operateArray;
            let isTIANTING = operateArray.indexOf(ApiMhxl.operateType.DAITIANTING) != -1;
            if (isTIANTING) {
                // this.showTianTing(data.uid);
                let tingList = data.plusInfo ? data.plusInfo.getTingList || [] : [];
                if (tingList.length) cc.systemEvent.emit("tianting", {
                    tingList: tingList,
                    isTing: true
                });
            }
            if (!isMoPai && idx != 0 && !turn.operateArray.includes(ApiMhxl.operateType.QI)) {
                this._handTileMgrList[0].setBaiPai() //重置摆牌状态
            }
        } else {
            this.com_opt.onClearTurn();
        }
        this.checkTingPai();
    },

    /**检查 听牌 */
    checkTingPai() {
        let myUid = MHXLModel.getMyUID();
        let operateUid = MHXLModel.getCurOptUID();
        let handCards = MHXLModel.getHandCards(myUid);
        let idx = MHXLModel.getUserIndexByUID(myUid);
        let hcom = this._handTileMgrList[idx];
        let winHandChecks = handCards.slice();
        let tingHandChecks = handCards.slice();

        if (operateUid != myUid) {
            /**不是自己操作 去掉打听标记 显示听牌按钮*/
            if (hcom) hcom.setTingIcons();
            let operateRecords = MHXLModel.getOperateRecords(myUid);
            let winTingFilter = MHXLModel.tingFilter(null, winHandChecks);
            let canWinList = MHXLLogic.getTingList(winTingFilter.cards, winTingFilter.ghostCardsCount, operateRecords);
            this._canWinList = MHXLModel.getTingGhostList(canWinList);
            this.btn_ting.active = this._canWinList.length > 0;
        } else if (operateUid == myUid) {
            let tingCards = [];
            this._tingList = [];
            //判断是否需要删除手牌
            let repeatFilter = Array.from(new Set(tingHandChecks));
            for (const cardId of repeatFilter) {
                let copyTingHandCards = tingHandChecks.slice();
                let tingFilter = MHXLModel.tingFilter(cardId, copyTingHandCards);
                let canTingList = MHXLLogic.getTingList(tingFilter.cards, tingFilter.ghostCardsCount);
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
        let tiles = MHXLModel.getHandCards(MHXLModel.getMyUID())
        if (tiles.length >= 14) {
            return
        }
        let operateRecords = MHXLModel.getOperateRecords(MHXLModel.getMyUID());
        let winTingFilter = MHXLModel.tingFilter(null, tiles.slice());
        let canWinList = MHXLLogic.getTingList(winTingFilter.cards, winTingFilter.ghostCardsCount, operateRecords);
        canWinList = MHXLModel.getTingGhostList(canWinList);
        if (canWinList && canWinList.length > 0) { //如果听牌，播放听牌光效
            let node = this._handTileMgrList[0].node
            let pos = CCUtil.postionConvert(node, this._operActNodeList[0])
            this.showOperAct(null, (com) => {
                com.showTingLight()
                com.node.scale = node.scale
                com.node.setPosition(pos)
            }, this._operActNodeList[0])

        }
    },

    /**展示胡牌序列 */
    showHuIdx(data, isAnim = false) {

    },

    /**用户操作广播 */
    onUserOpt(data) {
        this.setTilesGary(-1);
        this.com_opt.onClearTurn();
        let plusInfo = data.plusInfo || null;
        let isTest = UserModel.getData("isTest");
        let CurIndex = MHXLModel.getUserIndexByUID(data.uid);
        let CurUserCtrl = this._userList[CurIndex];
        let CurUserInfo = CurUserCtrl ? CurUserCtrl.getUserData() : null;
        let CurUserSex = !!CurUserInfo && (CurUserInfo.userInfo.sex == 0) ? 'nan' : 'nv';

        if (data.uid == MHXLModel.getMyUID()) {
            this.com_ting.node.active = false;
            this._handTileMgrList[0].setTingIcons();
        }
        //展示分数
        if (plusInfo && plusInfo.winScoreRecord && plusInfo.winScoreRecord.length > 0) {
            for (let i = 0; i < plusInfo.winScoreRecord.length; i++) {
                let index = MHXLModel.getUserIndexByChairID(i);
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
        if (data.operate == ApiMhxl.operateType.QI) {
            let moOpt = MHXLModel.getQiByMo(data);
            if (!!moOpt && moOpt.card != data.card) {
                drawTile = moOpt.card;
            }
        }
        /**更新手牌 */
        let CtrlHandTile = this._handTileMgrList[CurIndex];
        let handCards = MHXLModel.getHandCards(data.uid, false);
        if (!CtrlHandTile) return;
        if (CurIndex != 0 && !!isTest) {
            CtrlHandTile.updateLieTiles(handCards);
        } else {
            drawTile = CurIndex == 0 ? drawTile : null;
            CtrlHandTile.updateStandTiles(handCards, drawTile);
        }
        let optPengGang = () => {
            let pengGangArray = MHXLModel.getPengGangArrayByUID(data.uid);
            let optCom = this._optTileMgrList[CurIndex];
            if (optCom) optCom.updateOptTiles(pengGangArray);
            let lastOut = MHXLModel.getLastOutCardRecord();
            if (!!lastOut.isDel) {
                let localIndex = MHXLModel.getUserIndexByUID(lastOut.opt.uid);
                this._disTileMgrList[localIndex].afterOptUpdateTiles(lastOut.opt.card);
                this.updatePointer();
            }
        }

        let optHu = () => {
            /** 亮出胡的牌 */
            let hcom = this._handTileMgrList[CurIndex];
            if (hcom && !!data.card) {
                let huNode = hcom.setHuTile(data.card)
                let optNode = this._operActNodeList[CurIndex]
                huNode && this.scheduleOnce(() => {
                    let pos = CCUtil.postionConvert(huNode, optNode)
                    this.showOperAct(null, (aniCom) => {
                        aniCom.node.scale = hcom.node.scale
                        aniCom.node.setPosition(pos)
                        aniCom.showHuLight()
                    }, optNode)
                }, 0.2)
            }
            /**删除桌子上的牌 */
            let lastOut = MHXLModel.getLastOutCardRecord();
            if (!!lastOut.isDel) {
                let localIndex = MHXLModel.getUserIndexByUID(lastOut.opt.uid);
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
            if (audioType == ApiMhxl.operateType.MENPAI) {
                audioType = 5;
            }
            if (audioType < audioList.length) {
                AssetsManager.playEffect({
                    bundle: Enums.bundleType.MHXL,
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
            let CtrlAct = optNode.getComponent('MHXLOperAct');
            if (ainmType == 2) {
                let curType = 5; //刮风
                if (data.operate === ApiMhxl.operateType.GANG_ZHI) {
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
            case ApiMhxl.operateType.QI: //出牌
                AssetsManager.playEffect({
                    bundle: Enums.bundleType.MHXL,
                    path: `res/audio/${CurUserSex}/` + data.card,
                });
                AssetsManager.playEffect({
                    path: 'res/audio/main/push',
                    bundle: Enums.bundleType.MHXL
                });
                if (CurIndex == 0) {
                    this._handTileMgrList[0].setTouch(false)
                }
                /**更新桌子上的牌 */
                let last = null,
                    disCom = this._disTileMgrList[CurIndex];
                let out = MHXLModel.getOutTilesByUID(data.uid);
                if (disCom) last = disCom.showOutTiles(out)
                if (last && last.flower == data.card) {
                    this.updatePointer(last.node);
                }
                if (CurIndex == 0) {
                    this.showTingLight()
                }
                break;
            case ApiMhxl.operateType.CHI: //吃牌
                showAni(0)
                optPengGang()
                break;
            case ApiMhxl.operateType.PENG: //碰牌
                showAni(1)
                optPengGang()
                break;
            case ApiMhxl.operateType.GANG_BU: //补杠
                showAni(2)
                optPengGang()
                break;
            case ApiMhxl.operateType.GANG_CHI: //吃杠
                showAni(2)
                optPengGang()
                break;
            case ApiMhxl.operateType.GANG_ZHI: //暗杠
                showAni(2)
                optPengGang();
                break;
            case ApiMhxl.operateType.HU_CHI: //接炮
                showAni(3);
                optHu();
                break;
            case ApiMhxl.operateType.HU_ZHI: //自摸
                showAni(4)
                optHu();
                break;
            case ApiMhxl.operateType.MENPAI: //闷
                showAni(ApiMhxl.operateType.MENPAI);
                optMen();
                break;
            case ApiMhxl.operateType.HU_QIANG: //抢杠
                showAni(3)
                optHu();
                break;
            default:
                break;
        }

    },

    onSmall(data) {
        let maPaiInfo = null;
        this.deleteMoveNode();
        this.com_opt.node.active = false;
        let myUid = MHXLModel.getMyUID();
        let isTest = UserModel.getData("isTest");
        let result = JSON.parse(JSON.stringify(data.result));

        if (!!result) {
            AssetsManager.playEffect({
                path: 'res/audio/main/push',
                bundle: Enums.bundleType.MHXL
            });

            for (const user of result) {
                let huUser = user.huInfo || null;
                let JiaoZhui = user.JiaoZhui || {};
                this.showOperAct(user.uid, (ctrl) => {
                    if (!!huUser && !!huUser.addCardType.length) {
                        let addCardType = huUser.addCardType || [];
                        let CurData = addCardType[addCardType.length - 1];
                        ctrl.showHuType(CurData.type);
                    } else {
                        ctrl.showJiaoZui(!!JiaoZhui[user.uid]);
                    }
                })
                if (!maPaiInfo && !!user.maPaiInfo) {
                    maPaiInfo = user.maPaiInfo;
                };
                if (!user || user.uid == myUid) continue; //处理没有调试权限时其他人摊牌
                if (!user.userCards || !user.userCards[user.uid]) continue;
                let idx = MHXLModel.getUserIndexByUID(user.uid);
                if (!this._handTileMgrList[idx]) continue;
                let userCards = user.userCards[user.uid];
                let huInfo = user.huInfo;
                if (huInfo) {
                    let huType = user.huInfo.operateType || 0;
                    let huFilter = [ApiMhxl.operateType.HU_ZHI];
                    if (huFilter.indexOf(huType) != -1) { //赢家删除胡牌
                        let huCardIndex = userCards.indexOf(user.huCards);
                        if (huCardIndex >= 0) userCards.splice(huCardIndex, 1);
                    }
                    this._handTileMgrList[idx].updateLieTiles(userCards);
                    this._handTileMgrList[idx].setHuTile(user.huCards);
                } else {
                    this._handTileMgrList[idx].updateLieTiles(userCards);
                }
            }
        }

        let createResultDialog = () => {
            data.mainComp = this;
            data.isResult = true;
            data.bundle = Enums.bundleType.MHXL;
            data.onEnd = this._onEnd.bind(this);
            data.path = "res/prefab/MHXLResultDialog";
            data.enterHall = this.enterHall.bind(this);
            data.isBureauFull = (MHXLModel.getCurBureau() == MHXLModel.getMaxBureau());
            AssetsManager.createDialog(data);
        }
        this.scheduleOnce(() => {
            let maCards = !!maPaiInfo ? maPaiInfo.maCards || [] : [];
            if (!!maPaiInfo && !!maCards.length) {
                AssetsManager.createDialog({
                    result: result,
                    maPaiInfo: maPaiInfo,
                    bundle: Enums.bundleType.MHXL,
                    callback: createResultDialog,
                    gameRule: MHXLModel.getGameRule(),
                    path: "res/prefab/MHXLFanPai",
                });
            } else {
                createResultDialog();
            }
        }, 2);
    },



    _onEnd(data) {
        if (!!MHXLModel.getResult()) return;
        UserModel.setData('roomID', '');
        MHXLModel.setAllResult(null);
        if (data.result.length > 0) {
            this.showMJAllResultFunc = () => {
                this.showMJAllResultFunc = null;
                data.mainComp = this;
                data.isUnionCreate = MHXLModel.isUnionCreate();
                data.enterHall = this.enterHall.bind(this);
                data.roomDismissReason = data.reason;
                data.path = 'res/prefab/MHXLAllResult';
                data.bundle = Enums.bundleType.MHXL;
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
        let myUid = MHXLModel.getMyUID();
        this.com_ting.node.active = false;
        let handCards = MHXLModel.getHandCards(myUid)
        if (this._tingList.includes(tileCom.flower)) {
            let myTiles = handCards.slice();
            let tingFilter = MHXLModel.tingFilter(tileCom.flower, myTiles);
            let canWinList = MHXLLogic.getTingList(tingFilter.cards, tingFilter.ghostCardsCount);
            canWinList = MHXLModel.getTingGhostList(canWinList);
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
                if (MHXLModel.getCurBureau() == 0) {
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
                    gameType: Enums.bundleType.MHXL,
                    musicType: Enums.bundleType.MAHJONG,
                });
                break;
            case "btn_review": //回看
                this._hideMenu();
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiMhxl.gameReviewNotify());
                break;
            case "btn_msg": //聊天
                this._hideMenu();
                if (CCUtil.clickInterval(event.target, 1)) return;
                let params = {
                    gameRule: MHXLModel.getGameRule(),
                    chat: (chat) => {
                        ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
                    }
                }
                AssetsManager.chatDialog(params);
                break;
            case "btn_rules": //规则
                this._hideMenu();
                if (CCUtil.clickInterval(event.target, 1)) return;
                let rule = MHXLModel.getGameRule();
                if (!rule) return;
                AssetsManager.tableDialog({
                    gameRule: rule,
                });
                break;
            case "btn_ting": //听牌
                this._hideMenu();
                // this._canWinList = MHXLModel.getTingList();
                if (this._canWinList.length > 0 && !this.com_ting.node.active) {
                    for (let i = 0; i < this._canWinList.length; i++) {
                        if (!this._canWinList[i]) continue;
                        this._canWinList[i].count = MHXLModel.getRestCardCount(this._canWinList[i].cardID);
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
                    users: MHXLModel.getUsers(),
                    chairCount: MHXLModel.getChairCount(),
                    fangzuobi: MHXLModel.getGameRuleByKey('fangzuobi')
                })
                break;
            case "btn_deposit": //开始托管
                this._hideMenu();
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiMhxl.gameTrushNotify(true));
                break;
            case "btn_quxiaotuoguan": //取消托管
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiMhxl.gameTrushNotify(false));
                break;
            case "btn_invite": //邀请
                this._hideMenu();
                let gameRule = MHXLModel.getGameRule();
                gameRule = gameRule || {};
                gameRule.roomId = MHXLModel.getRoomID();
                let share = ConfigModel.getRoomRuleShare(gameRule);
                NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
                break;
            case "btn_copy": //复制
                let str = ConfigModel.getRoomShare(Enums.bundleType.MHXL, MHXLModel.getRoomID());
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
            gameRule: MHXLModel.getGameRule(),
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
        let isUnionCreate = MHXLModel.isUnionCreate();
        let unionID = !!isUnionCreate ? MHXLModel.getRoomCreatorByKey('unionID') : null;
        SubManager.exitBundle(unionID);
    },

    /**GPS定位检查 */
    verifyZuobi(roomUserInfo) {
        if (!MHXLModel.getGameRuleByKey("fangzuobi")) return;
        if (!roomUserInfo || roomUserInfo.chairID >= MHXLModel.getChairCount()) return;
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
        let fidx = MHXLModel.getUserIndexByChairID(fromChairID)
        let tidx = MHXLModel.getUserIndexByChairID(toChairID)
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
        ConfigModel.setData('lastScene', 'mhxl');
        AssetsManager.release();
    },

    update(dt) { },
});