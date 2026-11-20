const DGNModel = require("./DGNModel");
const ApiDgn = require("./ApiDgn");
const MessageCallback = require("../../../src/utils/MessageCallback");
const NativeUtil = require("../../../src/utils/NativeUtil");
const AssetsManager = require("../../../src/utils/AssetsManager");
const ConfigModel = require("../../../src/model/ConfigModel");
const Enums = require("../../../src/const/Enums");
const UserModel = require("../../../src/model/UserModel");
const ApiHall = require("../../../src/api/ApiHall");
const ApiRoom = require("../../../src/api/ApiRoom");
const AudioUtil = require("../../../src/utils/AudioUtil");
const DGNLogic = require("./DGNLogic");
const Utils = require("../../../src/utils/Utils");
const SubManager = require("../../../src/utils/SubManager");
const Codes = require("../../../src/const/Codes");
const CCUtil = require("../../../src/utils/CCUtil");
const Events = require("../../../src/const/Events");

cc.Class({
  extends: cc.Component,
  properties: {
    robBankButtons: cc.Node,
    robBankCtrl: require("DGNBank"),
    tipCtrl: require("DGNTips"),
    pourScoresButtons: cc.Node,
    readyButton: cc.Node,
    showCardsButton: cc.Node,
    gameNameLbl: cc.Label,
    roomIdLabel: cc.Label,
    baseInfoLbl: cc.Label,
    turnLabel: cc.Label,
    btnLocation: cc.Node,
    btn_zuoxia: cc.Node,
    btnLookOn: cc.Node,
    lookOnEffect: cc.Node,
    menuLay: cc.Node,
    menuLayList: cc.Node,
    btnTest: cc.Node,
    panNode: cc.Node, //锅底位置
    btnBackHall: cc.Node,
    btnYuYin: cc.Node,
    canNotDismissBar: cc.Node,
    btnDismiss: cc.Node,
    btnExit: cc.Node,
  },

  onLoad() {
    AssetsManager.init(this.node);
    this.headNodeArray = [];
    this.cardsNodeArray = [];
    // 菜单点击
    this.menuLay.active = false;
    this.gameNameLbl.string = `游戏:${ConfigModel.getGameName(
      Enums.bundleType.DGN
    )}`;
    DGNModel.init();
    MessageCallback.addListener(Events.clientEvents.gvUploadFileSuccess, this);
    cc.game.on(cc.game.EVENT_SHOW, this.onEventShow, this);
    MessageCallback.addListener("SelfEntryRoomPush", this);
    MessageCallback.addListener("RoomMessagePush", this);
    MessageCallback.addListener("GameMessagePush", this);
    MessageCallback.addListener("ReconnectSuccess", this);
    MessageCallback.addListener("UpdateGameBg", this);
    MessageCallback.addListener("CreateRoomFail", this);
    MessageCallback.addListener("QuickJoinFail", this);
    MessageCallback.addListener("JoinGameAgainPush", this);
    MessageCallback.addListener("OnGameOnceAgain", this);
    MessageCallback.addListener("TestClickReq", this);
    this._playingSeat = null;
    this._lastPlayTime = null;
    this._voiceMsgQueue = [];
    this.tableInit();
    this.scheduleOnce(() => {
      if (!UserModel.isInRoom()) {
        AssetsManager.tipDialog("房间不存在");
        this.scheduleOnce(() => {
          this.enterHall();
        }, 0.5);
      } else {
        ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
      }
    }, 0.2);
  },

  tableInit() {
    for (let index = 1; index <= 10; index++) {
      let headNode = this.node.getChildByName("Head" + index);
      if (!headNode || !headNode.getComponent("DGNHead")) continue;
      headNode.getComponent("DGNHead").init(this);
    }
  },

  _yuYinShow() {
    let isInSeat = DGNModel.isInSeat();
    let yuyin = DGNModel.getGameRuleByKey("yuyin");
    this.btnYuYin.active =
      !!isInSeat && !!yuyin && ConfigModel.getData("voiceSpeaker");
  },

  /*
   * 游戏初始化
   * 断线重连
   */
  gameInit() {
    this.unscheduleAllCallbacks();
    this.setHeadAndCard();
    this.roomIdLabel.string = "房号:" + DGNModel.getRoomID();
    this.baseInfoLbl.string = `首庄:${DGNModel.getGameRuleByKey("shouzhuang")}`;
    this.turnLabel.string = `${DGNModel.getCurBureau()}/${DGNModel.getMaxBureau()}局 第${DGNModel.getTurn()}轮`;
    this.btnLookOn.active = !!DGNModel.getGameRuleByKey("canWatch");
    this.robBankButtons.active =
      !!DGNModel.isInSeat() &&
      DGNModel.getRobScaleByChairID(DGNModel.getMyChairID()) == null &&
      DGNModel.getGameStatus() == ApiDgn.gameStatus.ROB_BANKER;
    this._yuYinShow();
    let user = DGNModel.getUserByChairID(DGNModel.getMyChairID());
    if (user) {
      this.onReadyBtnShow();
      this.showCardsButton.active = false;
      cc.find("cuopai", this.node).active = false;
      if (DGNModel.getGameStatus() == ApiDgn.gameStatus.SHOW_CARDS) {
        let cards = DGNModel.getHandCardsByChairID(DGNModel.getMyChairID());
        if (
          !DGNModel.getShowCards(DGNModel.getMyChairID()) &&
          DGNModel.getIsPlayingByChairID(DGNModel.getMyChairID())
        ) {
          this.showCardsButton.active = true;
          /* TODO 判断搓牌 */
        }
      }

      var pourScoreNode = cc.find("pourbuttons", this.node);
      if (
        DGNModel.getGameStatus() == ApiDgn.gameStatus.POUR_SCORE &&
        DGNModel.getIsPlayingByChairID(DGNModel.getMyChairID()) &&
        DGNModel.getPourScoreByChairID(DGNModel.getMyChairID()) == 0
      ) {
        var logic = pourScoreNode.getComponent("DGNPourScores");
        logic.showSelf();
      } else {
        pourScoreNode.active = false;
      }
      this.verifyZuobi(user);
    }
    cc.find("Tuoguan", this.node).active = DGNModel.getTrustByChairID(
      DGNModel.getMyChairID()
    );
    this.onTuoGuanSwitch();
    let unionID = DGNModel.isUnionCreate()
      ? DGNModel.getRoomCreatorByKey("unionID")
      : null;
    let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
    cc.find("invite", this.node).active =
      !DGNModel.getGameStarted() && !!isShowInvite;
    cc.find("copy", this.node).active =
      !DGNModel.getGameStarted() && !!isShowInvite;
    this.btnLocation.active =
      DGNModel.getGameRuleByKey("maxPlayerCount") < 6 &&
      !!DGNModel.getGameRuleByKey("showGps");
    this.btnBackHall.active =
      DGNModel.getCurBureau() == 0 && DGNModel.isUnionCreate();
    if (this.canNotDismissBar)
      this.canNotDismissBar.active =
        DGNModel.getGameRuleByKey("canNotDissmiss");
    this.btnBackHall.active =
      DGNModel.getCurBureau() == 0 && DGNModel.isUnionCreate();
    if (this.canNotDismissBar)
      this.canNotDismissBar.active =
        DGNModel.getGameRuleByKey("canNotDissmiss");
    if (DGNModel.getMyChairID() == DGNModel.getNextBankerChairID()) {
      this.robBankCtrl.show();
    } else {
      this.robBankCtrl.reset();
    }
    this.showSitDownButton();
    this.showTest();
    this.showDissButton();
  },

  onTuoGuanSwitch() {
    let user = DGNModel.getUserByChairID(DGNModel.getMyChairID());
    if (DGNModel.getMyChairID() >= DGNModel.getChairCount()) {
      this.lookOnEffect.active =
        user && user.userStatus == ApiRoom.userStatusEnum.LOOK;
    } else {
      this.lookOnEffect.active =
        user && user.userStatus == ApiRoom.userStatusEnum.LOOK;
    }
  },

  verifyZuobi(roomUserInfo) {
    if (!DGNModel.getGameRuleByKey("fangzuobi")) return;
    if (!roomUserInfo || roomUserInfo.chairID >= DGNModel.getChairCount())
      return;
    let add1 = null;
    try {
      add1 = JSON.parse(roomUserInfo.userInfo.address);
    } catch (e) { }
    if (!add1) {
      AssetsManager.popDialog({
        content: `玩家${roomUserInfo.userInfo.nickname}定位未知！`,
        ok: () => { },
      });
      return;
    }
    for (let i = 0; i < DGNModel.getChairCount(); ++i) {
      let user = DGNModel.getUserByChairID(i);
      if (!user || user.chairID == roomUserInfo.chairID) continue;
      // if (user.userInfo.lastLoginIP == roomUserInfo.userInfo.lastLoginIP) {
      // 	AssetsManager.popDialog({
      // 		content: `玩家${roomUserInfo.userInfo.nickname}与玩家${user.userInfo.nickname}IP地址相同！`,
      // 		ok: () => {}
      // 	});
      // 	break;
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
      // 	AssetsManager.popDialog({
      // 		content: `玩家${roomUserInfo.userInfo.nickname}与玩家${user.userInfo.nickname}距离过近！`,
      // 		ok: () => {},
      // 		no: () => {}
      // 	});
      // 	break;
      // }
    }
  },

  addHeadClickEvent(node) {
    if (node.hasEventListener(cc.Node.EventType.TOUCH_START)) return;
    node.on(
      cc.Node.EventType.TOUCH_START,
      () => {
        if (!DGNModel.isInSeat()) {
          AssetsManager.tipDialog("观战玩家无法查看详细信息");
          return;
        }
        if (CCUtil.clickInterval(node, 0.5)) return;
        let logic = node.getComponent("DGNHead");
        let user = DGNModel.getUserByChairID(logic.getChairID());
        let showHeadDetail = () => {
          try {
            let params = {
              fromChairID: DGNModel.getMyChairID(),
              toChairID: logic.getChairID(),
              canSendGift: DGNModel.getMyChairID() < DGNModel.getChairCount(),
              avatar: user.userInfo.avatar,
              id: user.userInfo.uid,
              ip: user.userInfo.lastLoginIP,
              location: user.userInfo.location,
              gold: user.userInfo.score,
              name: user.userInfo.nickname,
            };
            AssetsManager.headDialog(params);
          } catch (e) { }
        };
        // console.log("user", user)
        if (DGNModel.getUserTest() && !!user && !DGNModel.isInWatch()) {
          AssetsManager.createDialog({
            user: user,
            optChairID: user.chairID,
            callback: showHeadDetail,
            bundle: Enums.bundleType.DGN,
            path: "res/prefab/DGNTestSelect",
          });
          return;
        } else {
          showHeadDetail();
        }
      },
      this
    );
  },

  messageCallbackHandler(route, msg) {
    if (route === "RoomMessagePush") {
      if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
        // console.log('gameInit=============================');
        this.gameInit();
      } else if (msg.type === ApiRoom.USER_LEAVE_ROOM_RESPONSE) {
        if (msg.data.chairID === DGNModel.getMyChairID()) {
          // this.enterHall();
        }
      } else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
        this.showHeadNode(msg.data.roomUserInfo.chairID);
        this.verifyZuobi(msg.data.roomUserInfo);
      } else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
        this.hideHeadNode(msg.data.roomUserInfo);
      } else if (msg.type === ApiRoom.USER_READY_PUSH) {
        this.userReadyPush(msg.data.chairID);
      } else if (msg.type === ApiRoom.GAME_END_PUSH) {
      } else if (msg.type === ApiRoom.ROOM_DISMISS_PUSH) {
      } else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
        msg.data.myChairID = DGNModel.getMyChairID();
        AssetsManager.nisDialog(msg.data);
      } else if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
        let user = DGNModel.getUserByChairID(DGNModel.getMyChairID());
        if (msg.data.code != 0) {
          if (msg.data.uid == UserModel.getData("uid")) {
            AssetsManager.tipDialog(Codes[msg.data.code]);
          }
          return;
        }
        this.onReadyBtnShow();
        this.onTuoGuanSwitch();
        this.showSitDownButton();
        if (
          user &&
          user.userStatus == ApiRoom.userStatusEnum.LOOK &&
          msg.data.fromChairID < DGNModel.getChairCount() &&
          msg.data.toChairID >= DGNModel.getChairCount()
        ) {
          DGNModel.pourScore(msg.data.fromChairID, 0);
        }
      } else if (msg.type === ApiRoom.USER_CHAT_PUSH) {
        // console.log('发送了聊天消息', msg.data);
        this.onChat(msg.data);
      } else if (msg.type === ApiRoom.USER_GIFT_SEND_PUSH) {
        this.onGift(msg.data.fromChairID, msg.data.toChairID, msg.data.giftID);
      } else if (msg.type === ApiRoom.USER_VOICE_PUSH) {
        this._voiceMsgQueue.push(msg.data);
      } else if (msg.type === ApiRoom.BE_SHORT_OF_GOLD_COINS_PUSH) {
        if (msg.data.uid == UserModel.getData("uid")) {
          AssetsManager.tipDialog("金币不足，不可加入！");
        }
      }
    } else if (route === "GameMessagePush") {
      if (msg.type === ApiDgn.GAME_BUREAU_PUSH) {
        // console.log('局数更新', msg)
        this.baseInfoLbl.string = `首庄:${DGNModel.getGameRuleByKey(
          "shouzhuang"
        )}`;
        this.turnLabel.string = `${DGNModel.getCurBureau()}/${DGNModel.getMaxBureau()}局 第${DGNModel.getTurn()}轮`;
        cc.find("invite", this.node).active = false;
        cc.find("copy", this.node).active = false;
        this.robBankCtrl.reset();
        this._yuYinShow();
      } else if (msg.type === ApiDgn.CHOOSE_BANK_PUSH) {
        if (msg.data.chairID == DGNModel.getMyChairID()) {
          this.robBankCtrl.show();
        } else {
          this.robBankCtrl.reset();
        }
      } else if (msg.type === ApiDgn.GAME_STATUS_PUSH) {
        this.robBankButtons.active =
          !!DGNModel.isInSeat() &&
          DGNModel.getRobScaleByChairID(DGNModel.getMyChairID()) == null &&
          DGNModel.getGameStatus() == ApiDgn.gameStatus.ROB_BANKER;
        this.btnBackHall.active = false;
        this._yuYinShow();
        if (msg.data.gameStatus == ApiDgn.gameStatus.NONE) {
          this.onTuoGuanSwitch();
        }
        this.onReadyBtnShow();
        if (msg.data.gameStatus == ApiDgn.gameStatus.SHOW_CARDS) {
          this.showCardsButton.active = DGNModel.getIsPlayingByChairID(
            DGNModel.getMyChairID()
          );
          cc.find("cuopai", this.node).active =
            DGNModel.getIsPlayingByChairID(DGNModel.getMyChairID()) &&
            DGNModel.getGameRule().cuopai;
        } else {
          this.showCardsButton.active = false;
          cc.find("cuopai", this.node).active = false;
        }

        var showPourNode = cc.find("pourbuttons", this.node);
        if (
          msg.data.gameStatus == ApiDgn.gameStatus.POUR_SCORE &&
          DGNModel.getIsPlayingByChairID(DGNModel.getMyChairID()) &&
          DGNModel.getPourScoreByChairID(DGNModel.getMyChairID()) == 0 &&
          !DGNModel.checkBanker(DGNModel.getMyChairID())
        ) {
          var logic = showPourNode.getComponent("DGNPourScores");
          logic.showSelf();
        } else {
          showPourNode.active = false;
        }

        if (
          DGNModel.getMyChairID() != DGNModel.getBankerChairID() &&
          msg.data.gameStatus == ApiDgn.gameStatus.NONE &&
          DGNModel.getMyChairID() < DGNModel.getChairCount()
        ) {
          // cc.find('backhall', this.node).active = true;
        } else {
          // cc.find('backhall', this.node).active = false;
        }

        this.tipCtrl.refrush();
      } else if (msg.type === ApiDgn.GAME_END_PUSH) {
        UserModel.setData("roomID", "");
        if (msg.data.result.length > 0) {
          msg.data.enterHall = this.enterHall.bind(this);
          msg.data.path = "res/prefab/DGNResult";
          msg.data.bundle = Enums.bundleType.DGN;
          AssetsManager.createDialog(msg.data);
        } else {
          this.enterHall();
        }
      } else if (msg.type === ApiDgn.GAME_TRUST_PUSH) {
        if (msg.data.chairID == DGNModel.getMyChairID()) {
          cc.find("Tuoguan", this.node).active = msg.data.trust;
        }
      } else if (msg.type === ApiDgn.GAME_REVIEW_PUSH) {
        if (msg.data.list.length != 0) {
          msg.data.path = "res/prefab/DGNReview";
          msg.data.bundle = Enums.bundleType.DGN;
          AssetsManager.createDialog(msg.data);
        } else {
          AssetsManager.tipDialog("没有数据");
        }
      } else if (msg.type === ApiDgn.GAME_RESULT_PUSH) {
        for (let node of cc.find("CuopaiNode", this.node).children) {
          node.destroy();
        }
      } else if (msg.type === ApiDgn.POUR_SCORE_PUSH) {
        if (msg.data.shemen) {
          // console.log("射门==", msg.data)
          let footBallLogic = cc
            .find("FootBoll", this.node)
            .getComponent("DGNFootBoll");
          footBallLogic.shemen(this, msg.data.chairID);
        }
        if (DGNModel.getMyChairID() == msg.data.chairID) {
          var showPourNode = cc.find("pourbuttons", this.node);
          showPourNode.active = false;
        }
      } else if (msg.type === ApiDgn.CARDS_PUSH) {
        this.showTestCard();
      }
    } else if (route === "ReconnectSuccess") {
      // console.log('断线重连=====================');
      this.onReconnectCheck();
    } else if (route == "UpdateGameBg") {
    } else if (route === "SelfEntryRoomPush") {
      // return;
      if (msg.gameType != Enums.bundleType.DGN) {
        AssetsManager.popDialog({
          content: `进入游戏失败,请返回大厅后再试！`,
          ok: () => {
            this.enterHall();
          },
        });
        return;
      }
      UserModel.setData("gameType", msg.gameType);
      ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
    } else if (route === "CreateRoomFail") {
      this.unscheduleAllCallbacks();
      AssetsManager.popDialog({
        content: Codes[msg.code],
        ok: () => {
          this.enterHall();
        },
      });
    } else if (route === "QuickJoinFail") {
      AssetsManager.popDialog({
        content: Codes[msg.code],
        ok: () => {
          this.enterHall();
        },
      });
    } else if (route === "JoinGameAgainPush") {
      this.unscheduleAllCallbacks();
      AssetsManager.popDialog({
        content: Codes[msg.code],
        ok: () => {
          this.enterHall();
        },
      });
    } else if (route === "TestClickReq") {
      this.onBtnTest();
    } else if (route === "OnGameOnceAgain") {
      this.unscheduleAllCallbacks();
      this.scheduleOnce(() => {
        AssetsManager.popDialog({
          content: "再来一局初始化异常，请返回大厅后再试！",
          ok: () => {
            this.enterHall();
          },
        });
      }, 10);
    } else if (route === Events.clientEvents.gvUploadFileSuccess) {
      this._onUploadSuccess(msg);
    }
  },

  onReadyBtnShow() {
    let user = DGNModel.getUserByChairID(DGNModel.getMyChairID());
    if (
      DGNModel.getGameStatus() == ApiDgn.gameStatus.NONE &&
      user.userStatus != ApiRoom.userStatusEnum.READY &&
      user.userStatus != ApiRoom.userStatusEnum.PLAYING &&
      user.userStatus != ApiRoom.userStatusEnum.LOOK &&
      DGNModel.getCurBureau() < DGNModel.getMaxBureau() &&
      DGNModel.getMyChairID() < DGNModel.getChairCount()
    ) {
      this.readyButton.active = true;
    } else {
      this.readyButton.active = false;
    }
  },

  onReconnectCheck() {
    if (UserModel.isInRoom()) {
      ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
    } else {
      this.enterHall();
    }
  },

  onEventShow() {
    this.onReconnectCheck();
  },

  /*
   * 显示玩家头像
   */
  showHeadNode(chairID) {
    /* this.getHeadNodeByChairID(chairID).active = true; */
  },

  /*
   * 隐藏玩家头像
   */
  hideHeadNode(data) {
    if (data.uid == UserModel.getData("uid")) {
      if (!DGNModel.getRoomID() || data.roomID === DGNModel.getRoomID()) {
        this.enterHall();
      }
    }
  },

  /*
   * 根据chairid获取头像节点
   * @param chairID 椅子id
   */
  getHeadNodeByChairID(chairID) {
    let head = null;
    for (let node of this.headNodeArray) {
      if (node.getComponent("DGNHead").getChairID() == chairID) {
        head = node;
        break;
      }
    }
    return head;
  },

  getHeadInSeat() {
    let players = {
      node: [],
      cid: [],
    };
    for (let node of this.headNodeArray) {
      //节点显示则为有人
      if (!node.active) continue;
      if (!node.getComponent("DGNHead")) continue;
      players.node.push(node);
      players.cid.push(node.getComponent("DGNHead").getChairID());
    }
    return players;
  },

  /*
   * 根据chairid获取手牌节点
   * @param chairID 椅子id
   */
  getCardsNodeByChairID(chairID) {
    let chairCount = DGNModel.getChairCount();
    let index = (chairID + chairCount - DGNModel.getMyChairID()) % chairCount;
    return this.cardsNodeArray[index];
  },

  /*
   * 玩家准备推送
   */
  userReadyPush(chairID) {
    if (chairID == DGNModel.getMyChairID()) {
      this.readyButton.active = false;
    }
  },

  onReadyClick(event, param) {
    ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify(true));
    this.readyButton.active = false;
  },

  onShowCardsClick(event, param) {
    // console.log('测试-搓牌', param);
    if (param == 0) {
      ApiRoom.gameMessageNotify(ApiDgn.showCardsNotify());
    } else {
      let card = DGNModel.getHandChairCardByIndex(DGNModel.getMyChairID(), 4);
      if (!!card) {
        cc.find("CuopaiNode", this.node).destroyAllChildren();
        let params = {
          parent: cc.find("CuopaiNode", this.node),
          card: card,
          cards: DGNModel.getHandCardsByChairID(DGNModel.getMyChairID()),
          type: DGNLogic.getCardColor(card),
          val: DGNLogic.getCardNumber(card),
          cb: () => {
            ApiRoom.gameMessageNotify(ApiDgn.showCardsNotify());
          },
        };
        AssetsManager.rubDialog(params);
      }
    }
    cc.find("cuopai", this.node).active = false;
    this.showCardsButton.active = false;
  },

  onExitClick(event, param) {
    this._onMenuCloseClick();
    if (!UserModel.isInRoom()) {
      this.enterHall();
      return;
    }
    if (!!DGNModel.getGameStarted() && DGNModel.getMyChairID() < DGNModel.getChairCount()) {
      AssetsManager.tipDialog("游戏进行中，不能退出房间！");
      return;
    }
    ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
  },

  onDisClick(event, param) {
    this._onMenuCloseClick();
    let params = {
      content: "是否确定发出解散申请？",
      ok: () => {
        ApiRoom.roomMessageNotify(
          ApiRoom.getAskForDismissNotifyData({
            isExit: true,
          })
        );
      },
      no: () => { },
    };
    AssetsManager.popDialog(params);
  },

  onDestroy() {
    DGNModel.onDestroy();
    MessageCallback.removeListener(
      Events.clientEvents.gvUploadFileSuccess,
      this
    );
    cc.game.off(cc.game.EVENT_SHOW, this.onEventShow, this);
    MessageCallback.removeListener("RoomMessagePush", this);
    MessageCallback.removeListener("GameMessagePush", this);
    MessageCallback.removeListener("ReconnectSuccess", this);
    MessageCallback.removeListener("UpdateGameBg", this);
    MessageCallback.removeListener("SelfEntryRoomPush", this);
    MessageCallback.removeListener("CreateRoomFail", this);
    MessageCallback.removeListener("QuickJoinFail", this);
    MessageCallback.removeListener("JoinGameAgainPush", this);
    MessageCallback.removeListener("TestClickReq", this);
    MessageCallback.removeListener("OnGameOnceAgain", this);
  },

  _onUploadSuccess(fileId) {
    this._lastChatTick = this._lastChatTick || 0;
    if (Date.now() - this._lastChatTick < 2000) {
      AssetsManager.tipDialog("亲，请勿频繁发送消息哦~");
      return;
    }
    this._lastChatTick = Date.now();
    ApiRoom.roomMessageNotify(
      ApiRoom.userChatNotify(Enums.chatType.VOICE, fileId, null)
    );
  },

  enterHall() {
    let isUnionCreate = DGNModel.isUnionCreate();
    let unionID = !!isUnionCreate
      ? DGNModel.getRoomCreatorByKey("unionID")
      : null;
    SubManager.exitBundle(unionID);
  },

  showDissButton() {
    let user = DGNModel.getUserByChairID(DGNModel.getMyChairID());
    if (this.btnDeposit)
      this.btnDeposit.active = !!DGNModel.getGameRuleByKey("canTrust");
    this.btnExit.active =
      !DGNModel.getTurn() || user.chairID >= DGNModel.getChairCount();
    this.btnDismiss.active =
      DGNModel.getTurn() &&
      user.chairID < DGNModel.getChairCount() &&
      !DGNModel.getGameRuleByKey("canNotDissmiss");
  },

  showSettingBg() {
    this.menuLay.active = true;
    AssetsManager.loadSpriteFrame({
      path: "sprite/common/pull",
      sprite: this.menuSprite,
    });
  },

  onSwitchClick() {
    this.showDissButton();
    this.showSettingBg();
  },

  onLookOnClick() {
    this._onMenuCloseClick();
    let users = DGNModel.getLookOnUsers();
    if (users.length == 0) {
      AssetsManager.tipDialog("暂无观战玩家！");
      return;
    }
    AssetsManager.standDialog({
      users: users,
    });
  },

  onTrustClick() {
    this._onMenuCloseClick();
    ApiRoom.gameMessageNotify(ApiDgn.gameTrushNotify(true));
  },

  onSettingClick() {
    // this.onHideMenuClick();
    this._onMenuCloseClick();
    AssetsManager.setDialog({
      type: "duoren",
      gameType: Enums.bundleType.DGN,
      musicType: Enums.bundleType.CIRCLE,
    });
  },

  onRuleClick() {
    let node = cc.find("RoomInfo", this.node);
    if (CCUtil.clickInterval(node, 0.5)) return;
    AssetsManager.tableDialog({
      gameRule: DGNModel.getGameRule(),
    });
  },

  onCancelTuoguan() {
    ApiRoom.gameMessageNotify(ApiDgn.gameTrushNotify(false));
  },

  onCopyRoomID() {
    let str = ConfigModel.getRoomShare(
      Enums.bundleType.DGN,
      DGNModel.getRoomID()
    );
    NativeUtil.copyText(str);
  },

  onInviteFriend() {
    let gameRule = DGNModel.getGameRule();
    gameRule = gameRule || {};
    let roomId = DGNModel.getRoomID();
    gameRule.roomId = roomId;
    let share = ConfigModel.getRoomRuleShare(gameRule);
    // console.log('测试-分享', share);
    NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
  },

  onReview() {
    this._onMenuCloseClick();
    ApiRoom.gameMessageNotify(ApiDgn.gameReviewNotify());
  },

  onGift(fromChairID, toChairID, giftID) {
    let sender = this.getHeadNodeByChairID(fromChairID);
    let reciever = [],
      rids = [];
    if (fromChairID == toChairID) {
      let players = this.getHeadInSeat();
      reciever = players.node;
      rids = players.cid;
    } else {
      reciever.push(this.getHeadNodeByChairID(toChairID));
      rids.push(toChairID);
    }
    AssetsManager.addGift({
      sid: fromChairID,
      rids: rids,
      reciever: reciever,
      sender: sender,
      id: giftID,
      parent: this.node,
    });
  },

  onChat(data) {
    let idx = DGNModel.getUserChairIndex(data.chairID);
    let com = this.headNodeArray[idx].getComponent("DGNHead");
    if (!com) return;
    com.gameChat(data);
  },

  update(dt) {
    if (this._lastPlayTime != null) {
      if (Date.now() > this._lastPlayTime + 200) {
        this.onPlayerOver();
        this._lastPlayTime = null;
      }
    }
  },

  onPlayerOver() {
    this._playingSeat.getComponent("NNHead").setVoice(false);
    this._playingSeat = null;
  },

  onRefrush(event) {
    this._onMenuCloseClick();
    if (CCUtil.clickInterval(event.target, 10, true)) return;
    AssetsManager.tipDialog("刷新界面可以修复游戏显示问题");
    this.messageCallbackHandler("ReconnectSuccess");
  },

  setHeadAndCard() {
    this.headNodeArray = [];
    this.cardsNodeArray = [];
    let chairCount = DGNModel.getChairCount();
    let choosedArray = [1, 2, 3, 5, 6, 7, 9, 10];
    if (chairCount == 6) {
      choosedArray = [1, 2, 3, 6, 9, 10];
    } else if (chairCount == 10) {
      choosedArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    }
    for (let i = 1; i <= 10; ++i) {
      let headNode = this.node.getChildByName("Head" + i);
      let cardsNode = this.node.getChildByName("Cards" + i);
      if (!headNode || !cardsNode) continue;
      headNode.active = false;
      cardsNode.active = false;
      if (choosedArray.indexOf(i) != -1) {
        this.headNodeArray.push(headNode);
        this.cardsNodeArray.push(cardsNode);
      }
    }
    for (let index = 0; index < this.headNodeArray.length; index++) {
      this.headNodeArray[index].getComponent("DGNHead").setIndex(index);
      this.cardsNodeArray[index].getComponent("DGNCards").setIndex(index);
      this.addHeadClickEvent(this.headNodeArray[index]);
    }
  },

  getUserCompByChairID(chairID) {
    let user = null;
    for (let index = 0; index < this.headNodeArray.length; index++) {
      if (!this.headNodeArray[index].getComponent("DGNHead")) continue;
      if (
        this.headNodeArray[index].getComponent("DGNHead").getChairID() ==
        chairID
      ) {
        user = this.headNodeArray[index];
      }
    }
    return user;
  },

  /**给没座位的人显示坐下按钮 */
  showSitDownButton() {
    let curBureau = DGNModel.getCurBureau();
    let maxBureau = DGNModel.getMaxBureau();
    let canEnter =
      DGNModel.getGameRuleByKey("canEnter") && maxBureau != curBureau;
    // (!!canEnter || curBureau == 0) &&
    this.btn_zuoxia.active =
      DGNModel.getMyChairID() >= DGNModel.getChairCount() &&
      (!!canEnter || curBureau == 0) &&
      DGNModel.checkHaveEmptySeat();
  },

  /**坐下按钮响应 */
  onBtnSitDown() {
    /**检查是否还有空位，有就发送坐下命令 */
    let chairID = DGNModel.getCanSitDownChairID();
    if (chairID == -1 || !this.headNodeArray[chairID]) {
      AssetsManager.tipDialog("没有座位可以坐下！");
      this.btn_zuoxia.active = false;
      return;
    }
    let head = this.headNodeArray[chairID].getComponent("DGNHead");
    if (!head) return;
    // console.log('找到座位坐下', chairID);
    head.onSeatClick();
  },

  onChatClick() {
    let params = {
      gameRule: DGNModel.getGameRule(),
      chat: (chat) => {
        ApiRoom.roomMessageNotify(
          ApiRoom.userChatNotify(chat.type, chat.content, null)
        );
      },
    };
    AssetsManager.chatDialog(params);
  },

  onBtnTest() {
    if (!DGNModel.isInSeat()) {
      return;
    }

    AssetsManager.createDialog({
      bundle: Enums.bundleType.DGN,
      path: "res/prefab/DGNTest",
      mainDialog: this,
    });
  },

  onLocationClick() {
    this._onMenuCloseClick();
    AssetsManager.locationDialog({
      users: DGNModel.getPlayerTakeSeats(),
      chairCount: DGNModel.getChairCount(),
      fangzuobi: DGNModel.getGameRuleByKey("fangzuobi"),
    });
  },

  showTest() {
    let tmp = UserModel.getData("isTest");
    this.btnTest.active = false; //!!tmp;
  },

  showTestCard() {
    let tmp = UserModel.getData("isTest");
    if (!tmp) return;
    ApiRoom.gameMessageNotify(
      ApiDgn.gameLookCardsNotify(DGNModel.getMyChairID())
    );
  },

  // 邀请好友
  onShowInvite() {
    AssetsManager.friendDialog({
      gameRule: DGNModel.getGameRule(),
    });
  },

  _onMenuOpen() {
    this.menuLayList.stopAllActions();
    this.menuLayList.active = true;
    this.menuLayList.getComponent(cc.Widget) &&
      this.menuLayList.getComponent(cc.Widget).updateAlignment();
    this._roomsLayPos = {
      show: cc.v2(),
      hide: cc.v2(),
    };
    this._moveAction = true;
    this._roomsLayPos.hide = this.menuLayList.getPosition(cc.v2());
    this._roomsLayPos.show = cc.v2(
      this._roomsLayPos.hide.x + this.menuLayList.width + CCUtil.getFixWidget(),
      this._roomsLayPos.hide.y
    );
    this.menuLayList.opacity = 0;
    this.menuLayList.setPosition(this._roomsLayPos.hide);
    cc.tween(this.menuLayList)
      .to(
        0.5,
        {
          opacity: 255,
          position: cc.v3(this._roomsLayPos.show),
        },
        {
          easing: "sineOut",
        }
      )
      .call(() => {
        this._moveAction = false;
      })
      .start();
    this.showDissButton();
    this.showSettingBg();
  },

  _onMenuCloseClick() {
    this.menuLay.active = false;
  },

  btnClicks(event, param) {
    switch (param) {
      case "menu":
        this.menuLay.active = true;
        this._onMenuOpen();
        break;
      case "menuclose":
        this._onMenuCloseClick();
        break;
      case "btn_back":
        this.enterHall();
        break;
    }
  },
});
