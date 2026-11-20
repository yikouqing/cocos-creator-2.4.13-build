const ApiPzhmj = require('./ApiPzhmj');
const ApiRoom = require('../../../src/api/ApiRoom');;
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const MessageCallback = require('../../../src/utils/MessageCallback');
const UserModel = require('../../../src/model/UserModel');
const Codes = require('../../../src/const/Codes');
const ConfigModel = require('../../../src/model/ConfigModel');
const NativeUtil = require('../../../src/utils/NativeUtil');
const PZHMJModel = require('./PZHMJModel');
const PZHMJLogic = require('./PZHMJLogic');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const SubManager = require('../../../src/utils/SubManager');
const Events = require('../../../src/const/Events');

cc.Class({
    extends: cc.Component,

    properties: {
        com_opt: require("PZHMJOperate"),
        com_clock: require("PZHMJClock"),
        com_ting: require("PZHMJTingTips"),
        com_baiPai: require("PZHMJBaiPai"),
        readyTick: require('PZHMJReadyTick'),
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
        this.txt_name.string = `${ConfigModel.getGameName(Enums.bundleType.PZHMJ)}`;
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
        cc.systemEvent.on("changTiaoStart", this.onChangTiaoStart, this);

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
        cc.systemEvent.off("changTiaoStart", this.onChangTiaoStart, this);
        ConfigModel.setData('lastScene', 'PZHMJ');
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
            PZHMJModel.setGameInit(false)
            ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
        } else {
            this.enterHall();
        }
    },

    /**返回大厅 */
    enterHall() {
        let isUnionCreate = PZHMJModel.isUnionCreate();
        let unionID = !!isUnionCreate ? PZHMJModel.getRoomCreatorByKey('unionID') : null;
        SubManager.exitBundle(unionID);
    },

    /**初始化和断线重连 */
    gameInit(data) {
        console.log("init=========", data)
        MessageCallback.emitMessage('RemoveGameResult');
        this.unscheduleAllCallbacks();
        this.resetTable();
        PZHMJModel.init(data);
        PZHMJLogic.initRule(data.gameRule)
        let isTest = UserModel.getData("isTest");
        this._gameStatus = data.gameData.gameStatus;
        let lastOpt = PZHMJModel.getLastOperate();
        let myUid = PZHMJModel.getMyUID();
        let users = PZHMJModel.getUsers();
        let operateUid = data.gameData.operateUid;
        this.com_clock.gameInit(PZHMJModel.getChairCount(), PZHMJModel.getMyChairID())
        if (this._gameStatus == ApiPzhmj.gameStatus.NONE && PZHMJModel.getCurBureau() == 0) {
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
        let unionID = PZHMJModel.isUnionCreate() ? PZHMJModel.getRoomCreatorByKey('unionID') : null;
        let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
        this.btn_invite.active = PZHMJModel.getCurBureau() == 0 && !!isShowInvite;
        this.btn_copy.active = PZHMJModel.getCurBureau() == 0 && !!isShowInvite;
        this.btn_location.active = !!PZHMJModel.getGameRuleByKey('showGps');
        this.btn_ready.active = (this._gameStatus === ApiPzhmj.gameStatus.NONE && data.gameData.userPlayStatus[myUid] == ApiRoom.userStatusEnum.NONE);
        this.btn_leave.active = data.gameData.curBureau == 0;
        this.btn_dismiss.active = data.gameData.curBureau != 0 && !PZHMJModel.getGameRuleByKey("canNotDissmiss");
        this.btnBackHall.active = data.gameData.curBureau == 0 && PZHMJModel.isUnionCreate();
        let yuyin = PZHMJModel.getGameRuleByKey('yuyin');
        this.btnYuYin.active = !!yuyin && ConfigModel.getData('voiceSpeaker');
        let tm = PZHMJModel.getGameRuleByKey("trustTm")
        this.btn_deposit.active = tm && tm > 0;
        if (this.btn_ready.active && PZHMJModel.getCurBureau() == 0 && PZHMJModel.getGameRuleByKey("unReadyKick") > 0) {
            let tick = PZHMJModel.getGameRuleByKey("unReadyKick") || 10;
            this.readyTick.sync(tick);
        } else {
            this.readyTick.sync(0);
        }
        if (this.canNotDismissBar) this.canNotDismissBar.active = PZHMJModel.getGameRuleByKey("canNotDissmiss");
        /**房间号和局数 */
        this.txt_roomId.string = `房号:${data.roomID}`;
        this.txt_round.string = `${data.gameData.curBureau}/${data.gameData.maxBureau}局`;
        this.txt_baseScore.string = `底:${PZHMJModel.getGameRuleByKey("baseScore")} `
        let fd = PZHMJModel.getGameRuleByKey("fengDing")
        this.txt_baseScore.string += (fd == 0 ? "不封顶" : `顶:${fd}`)
        this.onLastTilesCountUpdate(data.gameData.restCardsCount);

        if (this._gameStatus > ApiPzhmj.gameStatus.DICES) {
            //如果是自己的轮次 并且上一次打牌的人不是自己时删除最近一次摸的牌
            if (!!lastOpt && lastOpt.operate == ApiPzhmj.operateType.GET) {
                let idx = PZHMJModel.getUserIndexByUID(lastOpt.uid);
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
                let idx = PZHMJModel.getUserIndexByUID(user.uid);
                /**恢复吃碰杠的牌 */
                let pengGangArray = PZHMJModel.getPengGangArrayByUID(user.uid);
                if (pengGangArray.length > 0 && !!this._optTileMgrList[idx]) {
                    this._optTileMgrList[idx].updateOptTiles(pengGangArray);
                }
                /**恢复打出的牌 */
                let out = PZHMJModel.getOutTilesByUID(user.uid);
                if (out.length > 0 && !!this._disTileMgrList[idx]) {
                    let last = this._disTileMgrList[idx].showOutTiles(out);
                    if (data.gameData.lastOperateUid == user.uid &&
                        !!last &&
                        last.flower == data.gameData.operateCard) {
                        this.updatePointer(last.node)
                    }
                }
            }

            if (this._gameStatus === ApiPzhmj.gameStatus.PLAYING) {
                /**恢复方向指示 */
                let idx = PZHMJModel.getUserIndexByUID(operateUid);
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
                let userHuList = data.gameData.userHuDoneList || [];
                for (let i = 0; i < userHuList.length; i++) {
                    let huUser = userHuList[i];
                    if (huUser) {
                        /**恢复胡的那张牌 */
                        let huIdx = PZHMJModel.getUserIndexByUID(huUser.uid);
                        let hcom = this._handTileMgrList[huIdx];
                        if (hcom) hcom.setHuTile(huUser.card);
                    }
                }
                this.checkTingPai();

                /**恢复摆牌 */
                let shaiPaiUser = Utils.deepCopy(data.gameData.shaiPaiUser)
                for (const uid in shaiPaiUser) {
                    if (Object.hasOwnProperty.call(shaiPaiUser, uid)) {
                        const info = shaiPaiUser[uid];
                        let list = info.cardList.slice();
                        let idx = PZHMJModel.getUserIndexByUID(uid)
                        let hcom = this._handTileMgrList[idx]
                        hcom && hcom.onBaiPaiEnd(list)
                    }
                }
                /**恢复胡牌顺序 */
                this.showHuIdx()
            } else {
                this.btn_ting.active = false;
                /**恢复报听状态 */
                if (PZHMJModel.getGameStatus() == ApiPzhmj.gameStatus.BAOTING) {
                    let baoTingUser = data.gameData.baoTingUser
                    if (baoTingUser && baoTingUser.length > 0) {
                        baoTingUser.forEach(info => {
                            if (!info.isDone) {
                                this.onStartBaoTing(info)
                            }
                        });
                    }
                }
            }
        }
        /**恢复唱歌跳舞标记 */
        let userStatus = data.gameData.userStatus
        if (userStatus) {
            for (const uid in userStatus) {
                if (Object.hasOwnProperty.call(userStatus, uid)) {
                    const ctype = userStatus[uid];
                    let idx = PZHMJModel.getUserIndexByUID(uid)
                    let ucom = this._userList[idx]
                    if (ucom) {
                        ucom.setJiao(ctype == 1)
                        ucom.setSing(ctype == 2)
                        ucom.setDance(ctype == 3)
                    }
                }
            }
        }
        /**恢复托管标记 */
        let userTrustArray = data.gameData.autoUser
        if (userTrustArray) {
            this.tuoguan.active = userTrustArray[PZHMJModel.myUid]
        }
        PZHMJModel.setGameInit(true)
    },

    /**判断人数，初始化头像位置 */
    seatsInit() {
        if (this._userList.length > 0) {
            return
        }
        let chairCount = PZHMJModel.getChairCount();
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
            this._userList.push(headNode.getComponent("PZHMJHead"));
            this._userList[i].initRes();
            let handTile = cc.find("tableInfo/handTiles" + idx, this.node);
            let optTile = cc.find("tableInfo/optTiles" + idx, this.node);
            if (!optTile) {
                optTile = cc.find("optTiles" + idx, handTile);
            }
            let disTile = cc.find("tableInfo/outTiles" + idx, this.node);
            this._handTileMgrList.push(handTile.getComponent("PZHMJHandTileMgr"));
            this._handTileMgrList[i].init(idx);
            this._optTileMgrList.push(optTile.getComponent("PZHMJOptTileMgr"));
            this._optTileMgrList[i].init(i);
            this._disTileMgrList.push(disTile.getComponent("PZHMJOutTileMgr"));
            this._disTileMgrList[i].init(idx);

            let opNode = cc.find("operAct" + idx, this.node);
            this._operActNodeList.push(opNode);
        }
    },

    /**用户进入房间 */
    userEnterRoom(data) {
        let idx = PZHMJModel.getUserIndexByUID(data.uid);
        let headcom = this._userList[idx]
        if (headcom) {
            headcom.init(data)
        }
    },

    /**恢复所有人的总输赢分数 */
    initTotalScore(userWinTotalScore) {
        if (userWinTotalScore && PZHMJModel.scoreState()) {
            let len = Object.keys(userWinTotalScore)
            if (len.length > 0) {
                for (const uid in userWinTotalScore) {
                    if (Object.hasOwnProperty.call(userWinTotalScore, uid)) {
                        const s = userWinTotalScore[uid];
                        let idx = PZHMJModel.getUserIndexByUID(uid);
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
        let idx = PZHMJModel.getUserIndexByChairID(data.chairID);
        let headcom = this._userList[idx];
        if (headcom) {
            headcom.leave();
        }
        if (data.uid == UserModel.getData('uid')) {
            if (!PZHMJModel.getRoomID() ||
                PZHMJModel.getRoomID() == data.roomID) {
                this.enterHall();
            }
        }
    },

    /**GPS定位检查 */
    verifyZuobi(roomUserInfo) {
        if (!PZHMJModel.getGameRuleByKey("fangzuobi")) return;
        if (!roomUserInfo || roomUserInfo.chairID >= PZHMJModel.getChairCount()) return;
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
        let distanceLimit = parseInt(PZHMJModel.getGameRuleByKey('distanceLimit'));
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
        let idx = PZHMJModel.getUserIndexByChairID(data.chairID);
        let com = this._userList[idx];
        if (com) com.setReady(true);
        if (data.chairID == PZHMJModel.getMyChairID()) {
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
        PZHMJModel.setCurBureau(data.curBureau);
        this.btnBackHall.active = data.curBureau == 0;
        MessageCallback.emitMessage('RemoveGameResult');
        this.btn_dismiss.active = data.curBureau != 0 && !PZHMJModel.getGameRuleByKey("canNotDissmiss");
        this.txt_round.string = `${data.curBureau}/${PZHMJModel.getMaxBureau()}局`;
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
        let idx = PZHMJModel.getUserIndexByUID(data.uid);
        let com = this._userList[idx];
        if (com) com.setBanker(true);
    },

    /**游戏状态跳转 */
    onGameStatusUpdate(data) {
        this._gameStatus = data.gameStatus;
        if (this._gameStatus == ApiPzhmj.gameStatus.NONE ||
            this._gameStatus == ApiPzhmj.gameStatus.DICES) {
            this.onLastTilesCountUpdate(0);
        }
        this.com_clock.setTick(data.tick);
        this.com_clock.hideDice();
        this.hideReadyIcon();
        this.btn_ready.active = PZHMJModel.getCurBureau() == 0 && this._gameStatus == ApiPzhmj.gameStatus.NONE;
        this.readyTick.sync(0);
        switch (this._gameStatus) {
            case ApiPzhmj.gameStatus.NONE:
                PZHMJModel.reset();
                this.resetTable();
                break;
            case ApiPzhmj.gameStatus.PLAYING:
                this._handTileMgrList[0].setAllTilesDown();
                break;
            default:
                break;
        }
    },

    /**发牌 */
    onSendTiles(data, isAni) {
        let isTest = UserModel.getData('isTest');
        PZHMJModel.setGhostCard(data.laiZiCards);
        PZHMJModel.setHandCards(data.handCards);
        let lastOpt = PZHMJModel.getLastOperate();

        if (!data.handCards) return;
        let handCards = data.handCards;
        for (const uid in handCards) {
            let user = PZHMJModel.getUserByUID(uid);
            if (!user) continue;
            let tiles = PZHMJModel.getHandCards(uid, false);
            let idx = PZHMJModel.getUserIndexByUID(uid);
            let hcom = this._handTileMgrList[idx];
            if (!hcom) continue;
            let isMoPai = !!lastOpt && lastOpt.uid == uid && lastOpt.operate == ApiPzhmj.operateType.GET
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
        PZHMJModel.onGameTurn(data);
        this.com_clock.setDir(PZHMJModel.getUserIndexByUID(data.uid));
        this.com_clock.setTick(data.tick);
        let isTest = UserModel.getData('isTest');
        /**更新时间和位置 */
        let idx = PZHMJModel.getUserIndexByUID(data.uid);
        if (data.operateArray) {
            let isGet = data.operateArray.some(opt => opt.type == ApiPzhmj.operateType.GET)
            let isQi = data.operateArray.some(opt => opt.type == ApiPzhmj.operateType.QI)
            if (isGet || isQi) {
                //通知出牌
                let isMoPai = isGet || data.card != null;
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
                            path: 'res/audio/main/draw',
                            bundle: Enums.bundleType.PZHMJ
                        });
                        if (idx == 0 && isQi) {
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
        let gameStatus = PZHMJModel.getGameStatus();
        let operateUid = PZHMJModel.getCurOptUID();
        let myUid = PZHMJModel.getMyUID();
        // console.log("恢复听牌===", operateUid, myUid)
        let idx = PZHMJModel.getUserIndexByUID(myUid);
        let hcom = this._handTileMgrList[idx];
        let handCards = PZHMJModel.getHandCards(myUid);
        let pgList = PZHMJModel.getPengGangArrayByUID(PZHMJModel.getMyUID())
        if (operateUid != myUid) {
            let winHandChecks = handCards.slice();
            /**不是自己操作 去掉打听标记 显示听牌按钮*/
            if (hcom) hcom.setTingIcons();
            let winTingFilter = PZHMJModel.tingFilter(null, winHandChecks);
            let canWinList = PZHMJLogic.getTingList(winTingFilter.cards, winTingFilter.ghostCardsCount, pgList);
            this.btn_ting.active = canWinList.length > 0;
            this._canWinList = canWinList;
        } else if (operateUid == myUid) {
            let tingCards = [];
            this._tingList = [];
            let tingHandChecks = handCards.slice();
            //判断是否需要删除手牌
            let repeatFilter = Array.from(new Set(tingHandChecks));
            for (const cardId of repeatFilter) {
                let copyTingHandCards = tingHandChecks.slice();
                let tingFilter = PZHMJModel.tingFilter(cardId, copyTingHandCards);
                let canTingList = PZHMJLogic.getTingList(tingFilter.cards, tingFilter.ghostCardsCount, pgList);
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
        let tiles = PZHMJModel.getHandCards(PZHMJModel.getMyUID())
        if (tiles.length >= 14) {
            return
        }
        let pgList = PZHMJModel.getPengGangArrayByUID(PZHMJModel.getMyUID())
        let winTingFilter = PZHMJModel.tingFilter(null, tiles.slice());
        let canWinList = PZHMJLogic.getTingList(winTingFilter.cards, winTingFilter.ghostCardsCount, pgList);
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
        let sex = PZHMJModel.getUserSexByUID(uid);
        AssetsManager.playEffect({
            bundle: Enums.bundleType.PZHMJ,
            path: `res/audio/${sex}/${audioName}`,
        });
    },

    /**用户操作广播 */
    onUserOpt(data) {
        PZHMJModel.onUserOpt(data);
        PZHMJModel.setBaiPaiInfo(data);
        this.deleteMoveNode();
        let isTest = UserModel.getData("isTest");
        this.setTilesGary(-1);
        if (data.uid == PZHMJModel.getMyUID()) {
            this.com_opt.onClearTurn();
            this.com_ting.node.active = false;
            this._handTileMgrList[0].setTingIcons();
        }
        let idx = PZHMJModel.getUserIndexByUID(data.uid);
        let user = null,
            ucom = this._userList[idx];
        if (ucom) user = ucom.getUserData();
        let sex = user && user.userInfo.sex == 0 ? 'nan' : 'nv';
        /**隐藏所有位置的摸的那张牌 */
        let userHuDoneList = PZHMJModel.getUserHuDonList();
        for (let i = 0; i < this._handTileMgrList.length; i++) {
            const comp = this._handTileMgrList[i];
            if (!comp) continue;
            if (i == 0 || !isTest) {
                comp.setDrawTile();
            } else {
                let isHu = userHuDoneList.some((item) => { //判断是否已经胡了，如果胡了就不隐藏
                    let huidex = PZHMJModel.getUserIndexByUID(item.uid)
                    return huidex == i;
                });
                if (!isHu) {
                    comp.setHuTile();
                }
            }
        }
        let drawTile = null;
        if (data.operate == ApiPzhmj.operateType.QI) {
            let moOpt = PZHMJModel.getQiByMo(data);
            if (!!moOpt && moOpt.card != data.card) {
                drawTile = moOpt.card;
            }
        }
        /**更新手牌 */
        let hcom = this._handTileMgrList[idx];
        let handCards = PZHMJModel.getHandCards(data.uid, false);
        if (!hcom) return;
        if (idx != 0 && !!isTest) {
            hcom.updateLieTiles(handCards);
        } else {
            drawTile = idx == 0 ? drawTile : null;
            hcom.updateStandTiles(handCards, drawTile);
        }
        let optPengGang = () => {
            let pengGangArray = PZHMJModel.getPengGangArrayByUID(data.uid);
            let optCom = this._optTileMgrList[idx];
            if (optCom) optCom.updateOptTiles(pengGangArray);
            let lastOut = PZHMJModel.getLastOutCardRecord();
            if (!!lastOut.isDel) {
                let localIndex = PZHMJModel.getUserIndexByUID(lastOut.opt.uid);
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
            let lastOut = PZHMJModel.getLastOutCardRecord();
            if (!!lastOut.isDel) {
                let localIndex = PZHMJModel.getUserIndexByUID(lastOut.opt.uid);
                this._disTileMgrList[localIndex].afterOptUpdateTiles(lastOut.opt.card);
                this.updatePointer();
            }
        }

        let showAni = (type) => {
            let typeNameList = ["chi", "peng", "gang", "hu", "zimo", "", "", "", "chang", "tiao", "bao"];
            /**声音 */
            let aName = ""
            if (type < typeNameList.length) {
                aName = typeNameList[type]
            }
            if (aName != "") {
                AssetsManager.playEffect({
                    bundle: Enums.bundleType.PZHMJ,
                    path: `res/audio/${sex}/${aName}`,
                });
            }

            /**动画 */
            let com = this.genAniNode(this._operActNodeList[idx])
            com && com.showOpt(type)

            /**展示刮风和下雨 */
            if (type == 2) {
                let t = 5
                if (data.operate === ApiPzhmj.operateType.GANG_ZHI) {
                    t = 7 //下雨
                }
                AssetsManager.playEffect({
                    path: `res/audio/main/${t == 5 ? "guafeng" : ""}`,
                    bundle: Enums.bundleType.PZHMJ
                });
                let fcom = this.genAniNode(this.effectNode)
                fcom.showOpt(t)
            }
            if (type == 3 || type == 4) {
                this.showHuIdx(data.uid, true); //胡牌序列
                if (idx == 0) { //胡牌的火焰动画
                    this._handTileMgrList[0].setAllGray()
                    this._handTileMgrList[0].showHuAniFire()
                }
            }
        }

        switch (data.operate) {
            case ApiPzhmj.operateType.QI: //出牌
                if (idx == 0) {
                    this._handTileMgrList[0].setTouch(false)
                }
                /**更新桌子上的牌 */
                let out = PZHMJModel.getOutTilesByUID(data.uid)
                let last = null,
                    disCom = this._disTileMgrList[idx]
                if (disCom) last = disCom.showOutTiles(out)
                if (last && last.flower == data.card) {
                    this.updatePointer(last.node)
                }
                AssetsManager.playEffect({
                    path: `res/audio/${sex}/` + data.card,
                    bundle: Enums.bundleType.PZHMJ
                });
                this.scheduleOnce(() => {
                    AssetsManager.playEffect({
                        path: 'res/audio/main/dapai',
                        bundle: Enums.bundleType.PZHMJ
                    });
                }, 0.1)
                if (idx == 0) {
                    this.showTingLight()
                }
                break;
            case ApiPzhmj.operateType.CHI: //吃牌
                showAni(0)
                optPengGang()
                break;
            case ApiPzhmj.operateType.PENG: //碰牌
                showAni(1)
                optPengGang()
                break;
            case ApiPzhmj.operateType.GANG_BU: //补杠
                showAni(2)
                optPengGang()
                break;
            case ApiPzhmj.operateType.GANG_CHI: //吃杠
                showAni(2)
                optPengGang()
                break;
            case ApiPzhmj.operateType.GANG_ZHI: //暗杠
                showAni(2)
                optPengGang();
                break;
            case ApiPzhmj.operateType.HU_CHI: //接炮
                showAni(3);
                optHu();
                break;
            case ApiPzhmj.operateType.HU_ZHI: //自摸
                showAni(4)
                optHu();
                break;
            case ApiPzhmj.operateType.HU_QIANG: //抢杠
                showAni(3)
                optHu();
                break;
            case ApiPzhmj.operateType.CHANGGE: //唱歌
                PZHMJModel.setCanOutStatus(data.uid, 2)
                showAni(8)
                if (ucom) ucom.setSing(true)
                break;
            case ApiPzhmj.operateType.TIAOWU: //跳舞
                showAni(9)
                PZHMJModel.setCanOutStatus(data.uid, 3)
                /**展示摆牌 */
                let list = data.plusInfo.cardList.slice();
                let hcom = this._handTileMgrList[idx]
                hcom && hcom.onBaiPaiEnd(list)
                if (ucom) ucom.setDance(true)
                this.com_baiPai.hideNode()
                break;
            case ApiPzhmj.operateType.BAOTING: //报叫
                PZHMJModel.setCanOutStatus(data.uid, 1)
                showAni(10)
                if (ucom) ucom.setJiao(true)
                break;
            default:
                break;
        }
    },




    onSmall(data) {
        this.deleteMoveNode();
        this.com_opt.onClearTurn();
        let result = Utils.deepCopy(data.result)
        if (!!result) {
            let laizi = []
            if (data.plusInfo && data.plusInfo.laiZiCards) {
                laizi = data.plusInfo.laiZiCards
            }
            for (const user of result) {
                if (!user) continue; //处理没有调试权限时其他人摊牌
                if (!user.userCards || !user.userCards[user.uid]) continue;
                let index = PZHMJModel.getUserIndexByUID(user.uid);
                if (!this._handTileMgrList[index]) continue;
                PZHMJModel.setHandCards(user.userCards)
                let userCards = PZHMJModel.getHandCards(user.uid, false)
                if (user.winScores > 0 && user.huCards > 0) {
                    let huFilter = [ApiPzhmj.operateType.HU_ZHI];
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
                bundle: Enums.bundleType.PZHMJ
            });
        }
        data.isResult = true;
        data.mainComp = this;
        data.bundle = Enums.bundleType.PZHMJ;
        data.path = "res/prefab/PZHMJResultDialog";
        data.enterHall = this.enterHall.bind(this);
        data.isBureauFull = (PZHMJModel.getCurBureau() == PZHMJModel.getMaxBureau());
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
            let acom = aniNode.getComponent("PZHMJOperAct")
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
            c.reset()
        });
        this._operActNodeList.forEach(n => {
            n.removeAllChildren()
        })
        this.deleteFlyNode();
        this.btn_ting.active = false;
        this.com_ting.node.active = false;
        this.com_clock.reset();
        this.updatePointer();
        this.setTilesGary(-1);
        this.onLastTilesCountUpdate(0);
        this._canWinList = [];
        this.com_opt.onClearTurn();
    },

    /**手牌点击，牌被抬起来 */
    onTileUp(tileCom) {
        /**打听显示 */
        let myUid = PZHMJModel.getMyUID();
        let handCards = PZHMJModel.getHandCards(myUid)
        // if (PZHMJModel.getIsBaiPai()) { //如果正在跳舞（摆牌），更新摆牌界面
        //     this.com_baiPai.updateBaiPai(tileCom.flower)
        // } 
        if (this._tingList.includes(tileCom.flower)) {
            let myTiles = handCards.slice();
            let tingFilter = PZHMJModel.tingFilter(tileCom.flower, myTiles);
            let pgList = PZHMJModel.getPengGangArrayByUID(PZHMJModel.getMyUID())
            let canWinList = PZHMJLogic.getTingList(tingFilter.cards, tingFilter.ghostCardsCount, pgList);
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

    /**唱跳开始 */
    onChangTiaoStart(type) {
        if (type == 1 && PZHMJModel.getGameStatus() == ApiPzhmj.gameStatus.BAOTING) {
            console.log("直接发送跳舞的消息")
            ApiRoom.gameMessageNotify(ApiPzhmj.gameBaoTingOperateNotify(ApiPzhmj.operateType.CHANGGE))
            return
        }
        if (!this._tingList || this._tingList.length == 0) {
            this.checkTingPai()
        }
        if (type == 1) PZHMJModel.setIsBaoTing(true)
        else if (type == 2) {
            PZHMJModel.setIsBaiPai(true)
            console.log("开始跳舞", this._tingList)
            this.com_baiPai.updateBaiPai(this._tingList[0])
        }
        this._handTileMgrList[0].setChangTiao(type, this._tingList)
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
        let fidx = PZHMJModel.getUserIndexByChairID(fromChairID)
        let tidx = PZHMJModel.getUserIndexByChairID(toChairID)
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

    /**展示胡牌序列 */
    showHuIdx(uid, isAnim = false) {
        let huList = PZHMJModel.getUserHuDonList()
        if (isAnim && uid) {
            let index = huList.findIndex((info) => {
                return info.uid == uid
            })
            if (index !== -1) {
                let huInfo = huList[index]
                index++
                let idx = PZHMJModel.getUserIndexByUID(uid)
                let com = this.genAniNode(this._operActNodeList[idx])
                com.showHuIndex(huInfo.operateType, index, uid, isAnim);
            }
        } else {
            for (let i = 0; i < huList.length; i++) {
                const huInfo = huList[i];
                const index = i + 1
                let idx = PZHMJModel.getUserIndexByUID(huInfo.uid)
                let com = this.genAniNode(this._operActNodeList[idx])
                com.showHuIndex(huInfo.operateType, index, huInfo.uid, isAnim);
            }
        }
    },

    onStartBaoTing(data) {
        if (data.uid == PZHMJModel.getMyUID()) {
            this.checkTingPai()
            let list = [{ type: ApiPzhmj.operateType.BAOTING },
            { type: ApiPzhmj.operateType.CHANGGE }, { type: ApiPzhmj.operateType.TIAOWU }]
            this.com_opt.updateBtn(list)
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
                    gameType: Enums.bundleType.PZHMJ,
                    musicType: Enums.bundleType.MAHJONG,
                });
                break;
            case "btn_review": //回看
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiPzhmj.gameReviewNotify());
                break;
            case "btn_msg": //聊天
                if (CCUtil.clickInterval(event.target, 1)) return;
                let params = {
                    gameRule: PZHMJModel.getGameRule(),
                    chat: (chat) => {
                        ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
                    }
                }
                AssetsManager.chatDialog(params);
                break;
            case "btn_roomInfo": //规则
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 1)) return;
                let rule = PZHMJModel.getGameRule();
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
                        this._canWinList[i].count = PZHMJModel.getRestCardCount(this._canWinList[i].cardID);
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
                    users: PZHMJModel.getUsers(),
                    chairCount: PZHMJModel.getChairCount(),
                    fangzuobi: PZHMJModel.getGameRuleByKey('fangzuobi')
                })
                break;
            case "btn_deposit": //开始托管
                this._onMenuCloseClick();
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiPzhmj.gameTrushNotify(true));
                break;
            case "btn_quxiaotuoguan": //取消托管
                if (CCUtil.clickInterval(event.target, 1)) return;
                ApiRoom.gameMessageNotify(ApiPzhmj.gameTrushNotify(false));
                break;
            case "btn_invite": //邀请
                let gameRule = PZHMJModel.getGameRule();
                gameRule = gameRule || {};
                gameRule.roomId = PZHMJModel.getRoomID();
                let share = ConfigModel.getRoomRuleShare(gameRule);
                NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
                break;
            case "btn_copy": //复制
                let str = ConfigModel.getRoomShare(Enums.bundleType.PZHMJ, PZHMJModel.getRoomID());
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
        let curBureau = PZHMJModel.getCurBureau();
        if (curBureau > 0) {
            AssetsManager.tipDialog('现在不能退出游戏');
            return;
        }
        ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
    },


    onChat(data) {
        let idx = PZHMJModel.getUserIndexByUID(data.uid)
        let com = this._userList[idx];
        if (!com) return;
        com.gameChat(data)
    },
    // 好友邀请
    onShowInvite() {
        AssetsManager.friendDialog({
            gameRule: PZHMJModel.getGameRule(),
        })
    },


    /**消息监听 */
    messageCallbackHandler(route, msg) {
        if (route === 'RoomMessagePush') {
            if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
                this.gameInit(msg.data);
            } else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
                PZHMJModel.otherUserJoinRoom(msg.data.roomUserInfo);
                this.verifyZuobi(msg.data.roomUserInfo);
                this.userEnterRoom(msg.data.roomUserInfo);
            } else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
                this.userLeaveRoom(msg.data.roomUserInfo);
            } else if (msg.type === ApiRoom.USER_READY_PUSH) {
                this.onUserReady(msg.data);
            } else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
                // console.log('玩家操作-发起解散', msg);
                if (!msg.data.userList || msg.data.userList.length == 0) return;
                msg.data.myChairID = PZHMJModel.getMyChairID();
                AssetsManager.disDialog(msg.data);
            } else if (msg.type === ApiRoom.USER_CHAT_PUSH) {
                this.onChat(msg.data);
            } else if (msg.type === ApiRoom.USER_GIFT_SEND_PUSH) {
                this.onGift(msg.data.fromChairID, msg.data.toChairID, msg.data.giftID);
            } else if (msg.type === ApiRoom.USER_VOICE_PUSH) {
                this._voiceMsgQueue.push(msg.data);
            } else if (msg.type === ApiRoom.USER_OFF_LINE_PUSH) {
                let idx = PZHMJModel.getUserIndexByChairID(msg.data.chairID);
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
            if (msg.type === ApiPzhmj.GAME_BUREAU_PUSH) {
                this.onGameRoundUpdate(msg.data);
            } else if (msg.type === ApiPzhmj.GAME_STATUS_PUSH) { //游戏状态
                console.log("状态更新===", msg.data)
                PZHMJModel.setGameStatus(msg.data.gameStatus);
                PZHMJModel.setTick(msg.data.tick)
                this.onGameStatusUpdate(msg.data);
            } else if (msg.type === ApiPzhmj.GAME_SEND_CARDS_PUSH) { //发牌
                console.log("发牌===", msg.data)
                this.deleteMoveNode();
                this.com_clock.hideDice();
                this.onSendTiles(msg.data, true);
            } else if (msg.type === ApiPzhmj.GAME_DICES_PUSH) {
                // console.log("骰子==", msg.data)
                this.com_clock.showDiceAni(msg.data.dice1, msg.data.dice2);
            } else if (msg.type === ApiPzhmj.GAME_TURN_OPERATE_PUSH) {
                console.log("用户操作==", msg.data)
                this.onUserOpt(msg.data);
            } else if (msg.type === ApiPzhmj.GAME_TURN_PUSH) {
                console.log("轮次==", msg.data)
                this.deleteMoveNode();
                this.com_clock.hideDice()
                this.onGameTurn(msg.data);
            } else if (msg.type === ApiPzhmj.GAME_BANKER_PUSH) { //庄家位置更新
                // console.log("更新庄家==", msg.data)
                PZHMJModel.setBankerUID(msg.data.uid)
                this.onBankerUpdate(msg.data);
            } else if (msg.type === ApiPzhmj.GAME_REST_CARDS_COUNT_PUSH) { //剩余牌数量更新
                this.onLastTilesCountUpdate(msg.data.restCardsCount);
            } else if (msg.type === ApiPzhmj.GAME_END_PUSH) {
                // console.log("游戏结束《《《《《《《《《", msg);
                UserModel.setData('roomID', '');
                let date = Utils.getDateFormat();
                if (msg.data.result.length > 0) {
                    this.showMJAllResultFunc = () => {
                        this.showMJAllResultFunc = null;
                        msg.data.mainComp = this;
                        msg.data.isUnionCreate = PZHMJModel.isUnionCreate();
                        msg.data.enterHall = this.enterHall.bind(this);
                        msg.data.roomDismissReason = msg.data.reason;
                        msg.data.path = 'res/prefab/PZHMJAllResult';
                        msg.data.bundle = Enums.bundleType.PZHMJ;
                        msg.data.date = date.yyyymmddhhmmss;
                        msg.data.roomID = PZHMJModel.getRoomID();
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
            } else if (msg.type === ApiPzhmj.GAME_REVIEW_PUSH) {
                console.log("回看数据==", msg.data)
                let reviewRecord = msg.data.reviewRecord;
                if (reviewRecord && reviewRecord.length > 0) {
                    AssetsManager.createDialog({
                        bundle: Enums.bundleType.PZHMJ,
                        path: "res/prefab/PZHMJResultDialog",
                        reviewRecord: reviewRecord,
                    });
                } else {
                    AssetsManager.tipDialog('暂无回放没有数据');
                }
            } else if (msg.type === ApiPzhmj.GAME_RESULT_PUSH) {
                console.log("小结算==", msg.data)
                this.onSmall(msg.data);
            } else if (msg.type === ApiPzhmj.GAME_TRUST_PUSH) { //开始托管
                if (PZHMJModel.myUid == msg.data.uid) {
                    this.tuoguan.active = msg.data.trust
                }
            } else if (msg.type === ApiPzhmj.GAME_ALL_HU_CARDS_PUSH) { //全部胡牌
                console.log("全部胡牌==", msg.data)
                PZHMJModel.setSelfAllHuCards(msg.data.allHuCards)
            } else if (msg.type === ApiPzhmj.GAME_GANG_SCORE_PUSH) {
                console.log("杠分==", msg.data)
                let idx = PZHMJModel.getUserIndexByUID(msg.data.uid)
                this.showOptScore(msg.data.score, idx)
            } else if (msg.type === ApiPzhmj.GAME_QIANG_GANG_DELETE_PUSH) { //抢杠胡之后删除手牌
                // console.log("抢杠胡之后删除手牌==", msg.data)
                PZHMJModel.qiangGangHuDel(msg.data)
                let h = PZHMJModel.getHandCards(msg.data.uid)
                let idx = PZHMJModel.getUserIndexByUID(msg.data.uid)
                let hcom = this._handTileMgrList[idx];
                if (hcom) hcom.updateStandTiles(h)
            } else if (msg.type === ApiPzhmj.GAME_BAO_TING_START_PUSH) { //开始报叫流程
                console.log("开始报叫流程==", msg.data)
                this.onStartBaoTing(msg.data)
            } else if (msg.type === ApiPzhmj.GAME_BAO_TING_OPERATE_PUSH) { //报叫返回
                console.log("报叫返回==", msg.data)
                this.onUserOpt(msg.data)
            }
        } else if (route === 'ReconnectSuccess') {
            this.getRoomSceneInfo();
        } else if (route === 'SelfEntryRoomPush') {
            if (msg.gameType != PZHMJModel.getBundleType()) {
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