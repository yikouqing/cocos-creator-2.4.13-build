const CJSJYModel = require('./CJSJYModel');
const ApiCjsjy = require('./ApiCjsjy');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiHall = require('../../../src/api/ApiHall');
const UserModel = require('../../../src/model/UserModel');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const NativeUtil = require('../../../src/utils/NativeUtil');
const Utils = require('../../../src/utils/Utils');
const SubManager = require('../../../src/utils/SubManager');
const Codes = require('../../../src/const/Codes');
const ConfigModel = require('../../../src/model/ConfigModel');
const CCUtil = require('../../../src/utils/CCUtil');
const Events = require('../../../src/const/Events');

cc.Class({
	extends: cc.Component,
	properties: {
		readyButton: cc.Node,
		showCardsButton: cc.Node,
		roomIdLabel: cc.Label,
		txt_gameName: cc.Label,
		bureauLabel: cc.Label,
		btn_zuoxia: cc.Node,
		btnLocation: cc.Node,
		btnLookOn: cc.Node,
		btn_copy: cc.Node,
		btn_invite: cc.Node,
		btn_tuoguan: cc.Node,
		btn_exit: cc.Node,
		btn_cuoPai: cc.Node,
		lookOnMark: cc.Node,
		menuLay: cc.Node,
		menuSprite: cc.Sprite,
		menuLayList: cc.Node,
		btnTest: cc.Node,
		btnBackHall: cc.Node,
		btnYuYin: cc.Node,
		btnDismiss: cc.Node,
		btnExit: cc.Node,
		canNotDismissBar: cc.Node,
		tuoGuanNode: cc.Node,

		headSelfPfb: cc.Prefab,
		headRightPfb: cc.Prefab,
		headLeftPfb: cc.Prefab,
		headTopPfb: cc.Prefab,
		handCardPfb: cc.Prefab,
		bankerNode: cc.Node,
		faPaiNode: cc.Node,
		cuoPaiNode: cc.Node,


		_userList: [],
		_handCardList: [],
	},

	onLoad() {
		AssetsManager.init(this.node);
		// 菜单点击
		this.menuLay.active = false
		CJSJYModel.init(); /* 保存数据 */
		cc.game.on(cc.game.EVENT_SHOW, this.onEventShow, this);
		MessageCallback.addListener(Events.clientEvents.gvUploadFileSuccess, this);
		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
		MessageCallback.addListener('UpdateGameBg', this);
		MessageCallback.addListener('SelfEntryRoomPush', this);
		MessageCallback.addListener('CreateRoomFail', this);
		MessageCallback.addListener('QuickJoinFail', this);
		MessageCallback.addListener('JoinGameAgainPush', this);
		MessageCallback.addListener('OnGameOnceAgain', this);
		MessageCallback.addListener('TestClickReq', this)
		MessageCallback.addListener('tiaoguocuopai', this)
		this._playingSeat = null;
		this._voiceMsgQueue = [];
		this._lastPlayTime = null;
		/* 获取场景 */
		this.scheduleOnce(function () {
			// console.log("是否在房间中==", UserModel.isInRoom())
			if (!UserModel.isInRoom()) {
				AssetsManager.tipDialog("房间不存在")
				this.scheduleOnce(() => {
					this.enterHall()
				}, 0.5)
			} else {
				ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
			}
		}, 0.2);
	},

	/**初始化头像和牌 */
	initHeadAndCard() {
		if (this._userList && this._userList.length > 0) {
			return
		}
		let headPos = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
		let pCount = CJSJYModel.getChairCount()
		if (pCount == 6) {
			headPos = [0, 1, 3, 5, 7, 9]
		} else if (pCount == 8) {
			headPos = [0, 1, 2, 3, 5, 7, 8, 9]
		}
		this._userList.length = 0
		this._handCardList.length = 0

		for (let i = 0; i < headPos.length; i++) {
			let idx = headPos[i]
			let h = cc.find("head" + idx, this.node)
			let pfb = this.headSelfPfb
			if (idx >= 1 && idx <= 3) {
				pfb = this.headRightPfb
			} else if (idx >= 4 && idx <= 6) {
				pfb = this.headTopPfb
			} else if (idx >= 7 && idx <= 9) {
				pfb = this.headLeftPfb
			}
			let hNode = cc.instantiate(pfb)
			hNode.parent = h
			this._userList.push(hNode.getComponent("CJSJYHead"))

			let cardParent = cc.find("handCard" + idx, this.node)
			let handNode = cc.instantiate(this.handCardPfb)
			handNode.parent = cardParent
			this._handCardList.push(handNode.getComponent("CJSJYCardMgr"))
			this._handCardList[i].init(idx)
		}
	},

	/**用户进入房间 */
	userEnterRoom(data) {
		if (data.chairID >= CJSJYModel.getChairCount()) {
			return
		}
		let idx = CJSJYModel.getUserChairIndex(data.chairID)
		let headcom = this._userList[idx]
		// console.log("初始化用户==", idx, headcom, data)
		if (headcom) {
			headcom.init(data)
		}
	},

	/**用户离开房间 */
	userLeaveRoom(data) {
		if (data.chairID < CJSJYModel.getChairCount()) {
			let idx = CJSJYModel.getUserChairIndex(data.chairID)
			let headcom = this._userList[idx]
			if (headcom) {
				headcom.leave()
			}
		}
		if (data.uid == UserModel.getData('uid')) {
			if (!CJSJYModel.getRoomID() ||
				CJSJYModel.getRoomID() == data.roomID) {
				this.enterHall()
			}
		}
	},

	/*
	 * 游戏初始化
	 * 断线重连
	 */
	gameInit(data) {
		this.unscheduleAllCallbacks();
		this.initHeadAndCard();
		this.resetTable()
		this._userList.forEach(com => {
			com.leave()
		});
		/**初始化用户信息 */
		let roomUserInfoArr = data.roomUserInfoArr
		let myUserInfo = null
		for (let i = 0; i < roomUserInfoArr.length; i++) {
			const user = roomUserInfoArr[i];
			this.userEnterRoom(user)
			if (user.chairID == CJSJYModel.getMyChairID()) {
				myUserInfo = user
			}
		}

		this.roomIdLabel.string = '房号:' + CJSJYModel.getRoomID();
		this.bureauLabel.string = '局数:' + CJSJYModel.getCurBureau() + '/' + CJSJYModel.getMaxBureau();
		let gameName = ConfigModel.getBundleConfig(data.gameRule.gameType)
		this.txt_gameName.string = `游戏:${gameName.name}`
		let user = CJSJYModel.getUserByChairID(CJSJYModel.getMyChairID());
		if (user) {
			if (CJSJYModel.getGameStatus() == ApiCjsjy.gameStatus.NONE &&
				user.userStatus != ApiRoom.userStatusEnum.READY &&
				user.userStatus != ApiRoom.userStatusEnum.PLAYING &&
				user.userStatus != ApiRoom.userStatusEnum.LOOK &&
				CJSJYModel.getCurBureau() < CJSJYModel.getMaxBureau() &&
				CJSJYModel.getMyChairID() < CJSJYModel.getChairCount()) {
				this.readyButton.active = true;
			} else {
				this.readyButton.active = false;
			}
			this.showCardsButton.active = false;
			this.btn_cuoPai.active = false;
			if (CJSJYModel.getGameStatus() == ApiCjsjy.gameStatus.SHOW_CARDS) { //选牌提示
				if (CJSJYModel.getHandCardsByChairID(CJSJYModel.getMyChairID()) &&
					!CJSJYModel.getShowCards(CJSJYModel.getMyChairID()) &&
					CJSJYModel.getIsPlayingByChairID(CJSJYModel.getMyChairID())) {
					this.showCardsButton.active = true;
				}
			}
		}
		this.tuoGuanNode.active = CJSJYModel.getTrustByChairID(CJSJYModel.getMyChairID());
		this.onTuoGuanSwitch();
		let unionID = CJSJYModel.isUnionCreate() ? CJSJYModel.getRoomCreatorByKey('unionID') : null;
		let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
		this.btn_copy.active = CJSJYModel.getCurBureau() == 0 && !!isShowInvite;
		this.btn_invite.active = CJSJYModel.getCurBureau() == 0 && !!isShowInvite;
		this.btn_exit.active = false //(CJSJYModel.getCurBureau() == 0);
		this.btnBackHall.active = CJSJYModel.getCurBureau() == 0 && CJSJYModel.isUnionCreate();
		this.btn_tuoguan.active = CJSJYModel.getGameRuleByKey("canTrust")
		this._yuYinShow();
		this.btnLookOn.active = !!CJSJYModel.getGameRuleByKey('canWatch');
		this.btnLocation.active = CJSJYModel.getGameRuleByKey('maxPlayerCount') < 6 && !!CJSJYModel.getGameRuleByKey('showGps');
		if (this.canNotDismissBar) this.canNotDismissBar.active = CJSJYModel.getGameRuleByKey("canNotDissmiss");
		this.verifyZuobi(user);
		this.showTest();
		this.showSitDownButton();

		for (let i = 0; i < roomUserInfoArr.length; i++) {
			const user = roomUserInfoArr[i];
			let idx = CJSJYModel.getUserChairIndex(user.chairID)
			if (CJSJYModel.getIsPlayingByChairID(user.chairID)) {
				let com = this._userList[idx]
				if (user.chairID != CJSJYModel.getBankerChairID()) {
					/**恢复下注 */
					com.setBetScore(CJSJYModel.getPourScoreByChairID(user.chairID))
				}
				if (CJSJYModel.getGameStatus() == ApiCjsjy.gameStatus.ROB_BANK) {
					/**恢复抢庄倍数 */
					com.setRobScale(true)
				}
			}
		}

		/**恢复手牌 */
		if (CJSJYModel.getGameStatus() != ApiCjsjy.gameStatus.NONE) {
			let handCards = Utils.deepCopy(data.gameData.handCards)
			for (let i = 0; i < handCards.length; i++) {
				const cardList = handCards[i];
				if (cardList) {
					let idx = CJSJYModel.getUserChairIndex(i)
					let hcom = this._handCardList[idx]
					hcom.sendCards(cardList)
				}
			}
		}
		/**恢复亮牌数据 */
		if (CJSJYModel.getGameStatus() == ApiCjsjy.gameStatus.SHOW_CARDS) {
			// cards
			// chairID
			// cuopai
			// plusInfo
			let myShowInfo = null
			let useCardType = data.gameData.useCardType
			for (let i = 0; i < useCardType.length; i++) {
				const plusInfo = useCardType[i];
				if (plusInfo) {
					let showInfo = {
						cards: CJSJYModel.getHandCardsByChairID(i),
						chairID: i,
						plusInfo,
					}
					this.onShowCard(showInfo, false)
					if (i == myUserInfo.chairID) {
						myShowInfo = showInfo
					}
				}
			}
			if (CJSJYModel.getIsPlayingByChairID(myUserInfo.chairID)) {
				if (!CJSJYModel.getShowCards(myUserInfo.chairID)) { //如果自己么有亮牌，显示提示
					this._handCardList[0].showTypeTipFirst()
				} else if (myShowInfo) { //亮过牌了显示牌型
					this._handCardList[0].showCard(myShowInfo)
					this._handCardList[0].showLiPaiComplete()
				}
			}
		}
	},


	/**隐藏头像上的图标*/
	hideHeadIcon() {
		this._userList.forEach(userCom => {
			userCom.setReady(false)
			userCom.setRobScale(false)
		});
	},

	/**庄家更新 */
	onBankerUpdate(data) {
		let robChairIDs = data.robChairIDs
		let bankerChairID = data.bankerChairID;
		let flyStartNode = this.bankerNode
		flyStartNode.stopAllActions()
		flyStartNode.setPosition(0, 0)

		let fly = () => {
			let idx = CJSJYModel.getUserChairIndex(bankerChairID)
			let com = this._userList[idx]
			let bNode = com.getBanker()
			let endPos = CCUtil.postionConvert(bNode, flyStartNode.parent)
			flyStartNode.active = true
			flyStartNode.opacity = 255
			cc.tween(flyStartNode).to(0.5, {
				position: endPos
			}).call(() => {
				com.setBanker(true)
				flyStartNode.active = false
			}).start()
		}

		if (robChairIDs.length == 1) { //只有一个人，直接飞
			fly()
		} else {
			AssetsManager.playEffect({
				path: 'res/audio/main/rob_zhuang_ani',
				bundle: Enums.bundleType.SGBJH
			});
			let dt = 0
			for (let i = 0; i < robChairIDs.length; i++) {
				let cid = robChairIDs[i]
				let idx = CJSJYModel.getUserChairIndex(cid)
				let ucom = this._userList[idx]
				if (ucom) {
					let light = ucom.getLight()
					light.stopAllActions()
					let cishu = 5
					let jiange = 1
					if (cid == bankerChairID) {
						cishu = 10
						jiange = 2
					}
					// console.log("播放了动画==", dt)
					cc.tween(light).delay(dt).call(() => {
						light.active = true
						light.opacity = 255
					}).blink(jiange, cishu).call(() => {
						light.active = false
						if (cid == bankerChairID) {
							fly()
						}
					}).start()
				}
				dt += 0.2
			}
		}
	},

	onSendCard(data, isAni = false) {
		let gameStatus = CJSJYModel.getGameStatus()
		let handCards = Utils.deepCopy(data.handCards)
		for (let i = 0; i < handCards.length; i++) {
			const cardList = handCards[i];
			if (cardList) {
				let idx = CJSJYModel.getUserChairIndex(i)
				let hcom = this._handCardList[idx]
				if (gameStatus == ApiCjsjy.gameStatus.SEND_CARDS) {
					hcom.sendCards(cardList, isAni ? this.faPaiNode : null)
				} else if (CJSJYModel.getIsPlayingByChairID(CJSJYModel.getMyChairID())) {
					if (!CJSJYModel.getGameRuleByKey("cuopai")) { //么有搓牌直接显示
						hcom.showLastCard(cardList, true)
					}
				}
			}
		}
	},

	onShowCard(data, isAni = false) {
		if (data.cuopai) {
			return
		}
		if (data.chairID == CJSJYModel.getMyChairID()) {
			this.showCardsButton.active = false
			this.btn_cuoPai.active = false
		}
		let idx = CJSJYModel.getUserChairIndex(data.chairID)
		let hcom = this._handCardList[idx]
		if (hcom) {
			if (CJSJYModel.getGameStatus() == ApiCjsjy.gameStatus.SHOW_CARDS) {
				hcom.showLiPaiComplete()
			} else if (CJSJYModel.getGameStatus() == ApiCjsjy.gameStatus.RESULT) {
				hcom.showCard(data, isAni)
			}
		}
	},

	_yuYinShow() {
		let isInSeat = CJSJYModel.isInSeat();
		let yuyin = CJSJYModel.getGameRuleByKey('yuyin');
		this.btnYuYin.active = !!isInSeat && !!yuyin && ConfigModel.getData('voiceSpeaker');
	},

	onTuoGuanSwitch() {
		let user = CJSJYModel.getUserByChairID(CJSJYModel.getMyChairID());
		if (CJSJYModel.getMyChairID() >= CJSJYModel.getChairCount()) {
			this.lookOnMark.active = user && user.userStatus == ApiRoom.userStatusEnum.LOOK;
		} else {
			this.lookOnMark.active = user && user.userStatus == ApiRoom.userStatusEnum.LOOK;
		}
	},

	verifyZuobi(roomUserInfo) {
		if (!CJSJYModel.getGameRuleByKey('fangzuobi')) return;
		if (!roomUserInfo || roomUserInfo.chairID >= CJSJYModel.getChairCount()) return;
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
		for (let i = 0; i < CJSJYModel.getChairCount(); ++i) {
			let user = CJSJYModel.getUserByChairID(i);
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

	resetTable() {
		this._userList.forEach(com => {
			com.reset()
		})
		this._handCardList.forEach(com => {
			com.reset()
		})
	},

	onGameResult(data) {
		let useCardType = data.result.useCardType
		for (let chairID = 0; chairID < useCardType.length; chairID++) {
			const plusInfo = useCardType[chairID];
			if (plusInfo) {
				let showInfo = {
					cards: CJSJYModel.getHandCardsByChairID(chairID),
					chairID,
					plusInfo,
				}
				this.onShowCard(showInfo, true)
			}
		}

		for (let i = 0; i < data.result.sgWinScores.length; i++) {
			if (CJSJYModel.getIsPlayingByChairID(i) && CJSJYModel.getHandCardsByChairID(i)) {
				let scores = [data.result.sgWinScores[i], data.result.jhWinScores[i]]
				let idx = CJSJYModel.getUserChairIndex(i)
				let hcom = this._handCardList[idx]
				hcom.showScore(scores, true)
			}
		}
		//飞金币
		let bankerChairID = CJSJYModel.getBankerChairID()
		let bankerIdx = CJSJYModel.getUserChairIndex(bankerChairID)
		let bankerCom = this._userList[bankerIdx]
		let winList = []
		let loseList = []
		let winScores = data.result.winScores
		for (let i = 0; i < winScores.length; i++) {
			const score = winScores[i];
			if (i != bankerChairID && CJSJYModel.getIsPlayingByChairID(i) && CJSJYModel.getHandCardsByChairID(i)) {
				let idx = CJSJYModel.getUserChairIndex(i)
				if (score > 0) {
					winList.push(idx)
				} else if (score < 0) {
					loseList.push(idx)
				}
			}
		}

		let icon = bankerCom.getGoldIcon()
		let flygold = (s_pos, e_pos) => {
			AssetsManager.playEffect({
				path: 'res/audio/main/fly_gold',
				bundle: Enums.bundleType.CJSJY
			});
			for (let i = 0; i < 10; ++i) {
				let node = cc.instantiate(icon);
				node.setPosition(s_pos);
				node.parent = this.node;
				cc.tween(node).delay(0.05 * i).to(0.3, {
					position: e_pos
				}).removeSelf().start()
			}
		}
		let bankerPos = CCUtil.postionConvert(bankerCom.node, this.node)
		winList.forEach(idx => {
			let c = this._userList[idx]
			if (c) {
				let pos = CCUtil.postionConvert(c.node, this.node)
				flygold(bankerPos, pos)
			}
		});
		loseList.forEach(idx => {
			let c = this._userList[idx]
			if (c) {
				let pos = CCUtil.postionConvert(c.node, this.node)
				flygold(pos, bankerPos)
			}
		});
		this.scheduleOnce(() => {
			for (let i = 0; i < winScores.length; i++) {
				const score = winScores[i];
				if (CJSJYModel.getIsPlayingByChairID(i) && CJSJYModel.getHandCardsByChairID(i)) {
					let idx = CJSJYModel.getUserChairIndex(i)
					let com = this._userList[idx]
					if (com) com.setUserScoreAfterAni(score)
				}
			}
		}, 0.8)
	},

	onTiaoGuoCuoPai() {
		this.btn_cuoPai.active = false
		this.showCardsButton.active = true
	},

	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.gameInit(msg.data);
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				CJSJYModel.addUser(msg.data.roomUserInfo);
				this.userEnterRoom(msg.data.roomUserInfo);
				this.verifyZuobi(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				if (msg.data.roomUserInfo.chairID != CJSJYModel.getMyChairID()) {
					CJSJYModel.delUser(msg.data.roomUserInfo.chairID);
				}
				this.userLeaveRoom(msg.data.roomUserInfo)
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				this.userReadyPush(msg.data.chairID);
			} else if (msg.type === ApiRoom.GAME_END_PUSH) { } else if (msg.type === ApiRoom.ROOM_DISMISS_PUSH) { } else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
				msg.data.myChairID = CJSJYModel.getMyChairID();
				AssetsManager.nisDialog(msg.data);
			} else if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
				// console.log("用户坐下===", msg)
				if (msg.data.code != 0) {
					if (msg.data.uid == UserModel.getData('uid')) {
						AssetsManager.tipDialog(Codes[msg.data.code]);
					}
					return;
				};
				let user = CJSJYModel.getUserByChairID(CJSJYModel.getMyChairID());
				if (CJSJYModel.getGameStatus() == ApiCjsjy.gameStatus.NONE &&
					user.userStatus != ApiRoom.userStatusEnum.READY &&
					user.userStatus != ApiRoom.userStatusEnum.PLAYING &&
					user.userStatus != ApiRoom.userStatusEnum.LOOK &&
					CJSJYModel.getCurBureau() < CJSJYModel.getMaxBureau() &&
					CJSJYModel.getMyChairID() < CJSJYModel.getChairCount()) {
					this.readyButton.active = true;
				} else {
					this.readyButton.active = false;
				}
				this.onTuoGuanSwitch();
				this.showSitDownButton()
				if (user &&
					user.userStatus == ApiRoom.userStatusEnum.LOOK &&
					msg.data.fromChairID < CJSJYModel.getChairCount() &&
					msg.data.toChairID >= CJSJYModel.getChairCount()) {
					CJSJYModel.pourScore(msg.data.fromChairID, 0);
				}
				if (msg.data.uid == UserModel.getData('uid') && msg.data.toChairID >= CJSJYModel.getChairCount()) {
					//我自己被强制旁观
					this._userList[0].leave()
				}
				if (msg.data.toChairID < CJSJYModel.getChairCount()) {
					if (msg.data.uid == UserModel.getData('uid')) {
						this._userList.forEach(com => {
							com.leave()
						});
						if (UserModel.isInRoom()) {
							ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
						} else {
							this.enterHall();
						}
					} else {
						/**重新刷新座位 */
						let user = CJSJYModel.getUserByChairID(msg.data.toChairID)
						this.userEnterRoom(user)
					}
				}
			} else if (msg.type === ApiRoom.USER_CHAT_PUSH) {
				// console.log("用户聊天===", msg.data)
				this.onChat(msg.data);
			} else if (msg.type === ApiRoom.USER_GIFT_SEND_PUSH) {
				this.onGift(msg.data.fromChairID, msg.data.toChairID, msg.data.giftID);
			} else if (msg.type === ApiRoom.USER_VOICE_PUSH) {
				this._voiceMsgQueue.push(msg.data);
			} else if (msg.type === ApiRoom.BE_SHORT_OF_GOLD_COINS_PUSH) {
				if (msg.data.uid == UserModel.getData('uid')) {
					AssetsManager.tipDialog('金币不足，不可加入！');
				}
			} else if (msg.type === ApiRoom.ROOM_USER_INFO_CHANGE_PUSH) { //用户信息刷新
				// console.log('加锅推筒子-ROOM_USER_INFO_CHANGE_PUSH', msg.data);
				this._userList.forEach(com => {
					if (com) {
						com.userInfoChange(msg.data)
					}
				});
			} else if (msg.type === ApiRoom.ROOM_USER_WIN_TOTAL_PUSH) {
				let userWinTotalScore = msg.data.userWinTotalScore || {}
				this._userList.forEach(com => com.setTotalScore(userWinTotalScore))
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiCjsjy.GAME_BUREAU_PUSH) {
				this.btnBackHall.active = false;
				this._yuYinShow();
				this.bureauLabel.string = '局数：' + CJSJYModel.getCurBureau() + '/' + CJSJYModel.getMaxBureau();
				let unionID = CJSJYModel.isUnionCreate() ? CJSJYModel.getRoomCreatorByKey('unionID') : null;
				let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
				this.btn_copy.active = CJSJYModel.getCurBureau() == 0 && !!isShowInvite;
				this.btn_invite.active = CJSJYModel.getCurBureau() == 0 && !!isShowInvite;
				// this.btn_exit.active = (CJSJYModel.getCurBureau() == 0);
			} else if (msg.type === ApiCjsjy.GAME_STATUS_PUSH) {
				// console.log("游戏状态切换", msg.data)
				if (msg.data.gameStatus == ApiCjsjy.gameStatus.NONE) {
					this.onTuoGuanSwitch();
					this.resetTable()
				}
				this._yuYinShow();
				if (msg.data.gameStatus == ApiCjsjy.gameStatus.SHOW_CARDS) {
					this.showCardsButton.active = CJSJYModel.getIsPlayingByChairID(CJSJYModel.getMyChairID());
					if (CJSJYModel.getGameRuleByKey("cuopai") && !CJSJYModel.getUserTest()) { //搓牌按钮
						this.btn_cuoPai.active = true
					}
				} else {
					this.showCardsButton.active = false;
					this.btn_cuoPai.active = false
				}
				let user = CJSJYModel.getUserByChairID(CJSJYModel.getMyChairID());
				if (CJSJYModel.getGameStatus() == ApiCjsjy.gameStatus.NONE &&
					user.userStatus != ApiRoom.userStatusEnum.READY &&
					user.userStatus != ApiRoom.userStatusEnum.PLAYING &&
					user.userStatus != ApiRoom.userStatusEnum.LOOK &&
					CJSJYModel.getCurBureau() < CJSJYModel.getMaxBureau() &&
					CJSJYModel.getMyChairID() < CJSJYModel.getChairCount()) {
					this.readyButton.active = true;
				} else {
					this.readyButton.active = false;
				}
				this.hideHeadIcon()
			} else if (msg.type === ApiCjsjy.GAME_ROB_BANK_PUSH) { //抢庄返回
				let idx = CJSJYModel.getUserChairIndex(msg.data.chairID)
				let com = this._userList[idx]
				if (com) com.setRobScale(true);
			} else if (msg.type === ApiCjsjy.GAME_BANKER_PUSH) { //庄家显示
				// this.setBanker(msg.data.robChairIDs, true);
				this.onBankerUpdate(msg.data)
			} else if (msg.type === ApiCjsjy.GAME_POUR_SCORE_PUSH) { //玩家下注
				let idx = CJSJYModel.getUserChairIndex(msg.data.chairID)
				let com = this._userList[idx]
				com.setBetScore(msg.data.score, true);
				// com.setUserScore(CJSJYModel.getCurScore(msg.data.chairID))
			} else if (msg.type === ApiCjsjy.GAME_SEND_CARDS_PUSH) { //发牌
				// console.log("发牌===", msg.data)
				this.onSendCard(msg.data, true)
				if (CJSJYModel.getIsPlayingByChairID(CJSJYModel.getMyChairID()) && msg.data.cardTypeList &&
					(!CJSJYModel.getGameRuleByKey("cuopai") || CJSJYModel.getUserTest())) {
					this._handCardList[0].showTypeTipFirst()
				}
			} else if (msg.type === ApiCjsjy.GAME_SHOW_CARDS_PUSH) {
				// console.log("亮牌===", msg.data)
				this.onShowCard(msg.data, true)
			} else if (msg.type === ApiCjsjy.GAME_END_PUSH) {
				UserModel.setData('roomID', '');
				if (msg.data.result.length > 0) {
					msg.data.enterHall = this.enterHall.bind(this);
					msg.data.path = 'res/prefab/CJSJYResult';
					msg.data.bundle = Enums.bundleType.CJSJY;
					AssetsManager.createDialog(msg.data);
				} else {
					this.enterHall();
				}
			} else if (msg.type === ApiCjsjy.GAME_TRUST_PUSH) {
				if (msg.data.chairID == CJSJYModel.getMyChairID()) {
					this.tuoGuanNode.active = msg.data.trust;
				}
			} else if (msg.type === ApiCjsjy.GAME_REVIEW_PUSH) {
				if (msg.data.list.length != 0) {
					msg.data.path = 'res/prefab/CJSJYReview';
					msg.data.bundle = Enums.bundleType.CJSJY;
					AssetsManager.createDialog(msg.data);
				} else {
					AssetsManager.tipDialog('没有数据');
				}
			} else if (msg.type === ApiCjsjy.GAME_RESULT_PUSH) {
				// console.log("游戏结算==", msg.data)
				this.onGameResult(msg.data)
			} else if (msg.type === ApiCjsjy.GAME_SEND_CARDS_PUSH) {
				this.showTestCard()
			}
		} else if (route === 'ReconnectSuccess') {
			// console.log('断线重连=====================');
			this.onReconnectCheck();
		} else if (route == 'UpdateGameBg') { } else if (route === 'SelfEntryRoomPush') {
			if (msg.gameType != CJSJYModel.getBundleType()) {
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
		} else if (route === 'TestClickReq') {
			this.onBtnTest()
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
		} else if (route === "tiaoguocuopai") {
			this.onTiaoGuoCuoPai()
		}
	},

	onEventShow() {
		this.onReconnectCheck();
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

	onReconnectCheck() {
		if (UserModel.isInRoom()) {
			ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
		} else {
			this.enterHall();
		}
	},

	/*
	 * 玩家准备推送
	 */
	userReadyPush(chairID) {
		if (chairID == CJSJYModel.getMyChairID()) {
			this.readyButton.active = false;
		}
		let idx = CJSJYModel.getUserChairIndex(chairID)
		let com = this._userList[idx]
		if (com) com.setReady(true)
	},

	onReadyClick() {
		ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify(true));
		this.readyButton.active = false;
	},

	onShowCardsClick(event, param) {
		if (param == 0) {
			let myCard = this._handCardList[0].getShowCardList()
			if (myCard.length != 3) {
				AssetsManager.tipDialog("请选择一张不要的牌")
				return
			}
			// console.log("发送了亮牌===", param)
			ApiRoom.gameMessageNotify(ApiCjsjy.gameShowCardsNotify(myCard));
		} else if (param == 1) { //搓牌
			let cards = CJSJYModel.getHandCardsByChairID(CJSJYModel.getMyChairID())
			let lastCard = cards[cards.length - 1]
			let dialogData = {
				parent: this.cuoPaiNode,
				card: lastCard,
				cards: cards,
				type: CJSJYModel.getCardColor(lastCard),
				val: CJSJYModel.getCardPoint(lastCard),
				cb: () => {
					this.btn_cuoPai.active = false
					this._handCardList[0].showLastCard(cards)
					this._handCardList[0].showTypeTipFirst()
					this.showCardsButton.active = true
				},
			};
			AssetsManager.rubDialog(dialogData);
		}
	},

	onExitClick(event, param) {
		this._onMenuCloseClick();
		if (!UserModel.isInRoom()) {
			this.enterHall();
			return;
		}
		if (!!CJSJYModel.getGameStarted() && CJSJYModel.getMyChairID() < CJSJYModel.getChairCount()) {
			AssetsManager.tipDialog('游戏进行中，不能退出房间！');
			return;
		}
		ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
	},

	onDisClick(event, param) {
		this._onMenuCloseClick();
		let params = {
			content: '是否确定发出解散申请？',
			ok: () => {
				ApiRoom.roomMessageNotify(ApiRoom.getAskForDismissNotifyData({
					isExit: true
				}));
			},
			no: () => { }
		}
		AssetsManager.popDialog(params);
	},

	onDestroy() {
		CJSJYModel.onDestroy();
		cc.game.off(cc.game.EVENT_SHOW, this.onEventShow, this);
		MessageCallback.removeListener(Events.clientEvents.gvUploadFileSuccess, this);
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
		MessageCallback.removeListener('UpdateGameBg', this);
		MessageCallback.removeListener('SelfEntryRoomPush', this);
		MessageCallback.removeListener('CreateRoomFail', this);
		MessageCallback.removeListener('QuickJoinFail', this);
		MessageCallback.removeListener('JoinGameAgainPush', this);
		MessageCallback.removeListener('TestClickReq', this)
		MessageCallback.removeListener('OnGameOnceAgain', this);
		MessageCallback.removeListener('tiaoguocuopai', this);
		ConfigModel.setData('lastScene', 'sgbjh');
	},

	enterHall() {
		let roomCreatorInfo = CJSJYModel.getRoomCreator();
		let isUnionCreate = roomCreatorInfo.creatorType == Enums.roomCreatorType.UNION_CREATE;
		let unionID = !!isUnionCreate ? roomCreatorInfo.unionID : null;
		SubManager.exitBundle(unionID);
	},

	showDissButton() {
		let user = CJSJYModel.getUserByChairID(CJSJYModel.getMyChairID());
		this.btnDismiss.active = CJSJYModel.getCurBureau() > 0 && user.chairID < CJSJYModel.getChairCount() && !CJSJYModel.getGameRuleByKey('canNotDissmiss');
		this.btnExit.active = CJSJYModel.getCurBureau() == 0 || user.chairID >= CJSJYModel.getChairCount();
	},

	showSettingBg() {
		this.menuLay.active = true;
		AssetsManager.loadSpriteFrame({
			path: 'sprite/common/pull',
			sprite: this.menuSprite
		});
	},

	onLookOnClick() {
		this._onMenuCloseClick();
		let users = CJSJYModel.getLookOnUsers();
		if (users.length == 0) {
			AssetsManager.tipDialog('暂无观战玩家！');
			return;
		}
		AssetsManager.standDialog({
			users: users
		});
	},

	onSwitchClick() {
		this.showDissButton();
		this.showSettingBg();
	},

	onSettingClick() {
		this._onMenuCloseClick();
		AssetsManager.setDialog({
			type: 'duoren',
			gameType: Enums.bundleType.CJSJY,
			musicType: Enums.bundleType.CIRCLE,
		});
	},

	onRuleClick() {
		this._onMenuCloseClick()
		let node = cc.find('RoomInfo', this.node);
		if (CCUtil.clickInterval(node, 0.5)) return;
		AssetsManager.tableDialog({
			gameRule: CJSJYModel.getGameRule(),
		});
	},

	onTrustClick() {
		this._onMenuCloseClick();
		ApiRoom.gameMessageNotify(ApiCjsjy.gameTrushNotify(true));
	},

	onCancelTuoguan() {

		ApiRoom.gameMessageNotify(ApiCjsjy.gameTrushNotify(false));
	},

	onCopyRoomID() {

		let str = ConfigModel.getRoomShare(Enums.bundleType.CJSJY, CJSJYModel.getRoomID());
		NativeUtil.copyText(str);
	},

	onInviteFriend() {
		let gameRule = CJSJYModel.getGameRule();
		gameRule = gameRule || {};
		let roomId = CJSJYModel.getRoomID();
		gameRule.roomId = roomId;
		let share = ConfigModel.getRoomRuleShare(gameRule);
		// console.log('测试-分享', share);
		NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
	},

	onReview() {
		this._onMenuCloseClick();
		ApiRoom.gameMessageNotify(ApiCjsjy.gameReviewNotify());
	},

	onChat(data) {
		let idx = CJSJYModel.getUserChairIndex(data.chairID)
		let com = this._userList[idx]
		if (!com) return;
		com.gameChat(data)
	},


	onGift(fromChairID, toChairID, giftID) {
		let fidx = CJSJYModel.getUserChairIndex(fromChairID)
		let tidx = CJSJYModel.getUserChairIndex(toChairID)
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
			sid: fromChairID,
			rids: rids,
			reciever: reciever,
			sender: sender,
			id: giftID,
			parent: this.node
		});
	},

	update() {
		if (this._lastPlayTime != null) {
			if (Date.now() > this._lastPlayTime + 200) {
				this.onPlayerOver();
				this._lastPlayTime = null;
			}
		}
	},

	onPlayerOver() {
		//console.log("onPlayCallback:" + this._playingSeat);
		this._playingSeat.getComponent("CJSJYHead").setVoice(false);
		this._playingSeat = null;
	},

	onRefrush(event) {
		this._onMenuCloseClick();
		if (CCUtil.clickInterval(event.target, 10, true)) return;
		AssetsManager.tipDialog('刷新界面可以修复游戏显示问题');
		this.messageCallbackHandler('ReconnectSuccess');
	},

	onHideMenuClick() {
		this.menuLay.active = false;
		AssetsManager.loadSpriteFrame({
			path: 'sprite/common/menu',
			sprite: this.menuSprite
		});
	},

	/**给没座位的人显示坐下按钮 */
	showSitDownButton() {
		let curBureau = CJSJYModel.getCurBureau();
		let maxBureau = CJSJYModel.getMaxBureau();
		let canEnter = CJSJYModel.getGameRuleByKey('canEnter') && maxBureau != curBureau;
		// (!!canEnter || curBureau == 0) &&
		this.btn_zuoxia.active = CJSJYModel.getMyChairID() >= CJSJYModel.getChairCount() &&
			(!!canEnter || curBureau == 0) &&
			CJSJYModel.checkHaveEmptySeat();
	},

	/**坐下按钮响应 */
	onBtnSitDown() {
		/**检查是否还有空位，有就发送坐下命令 */
		let chairID = CJSJYModel.getCanSitDownChairID();
		let idx = CJSJYModel.getUserChairIndex(chairID)
		if (chairID == -1 || !this._userList[idx]) {
			AssetsManager.tipDialog('没有座位可以坐下！');
			return;
		}
		// console.log('找到座位坐下', idx);
		ApiRoom.roomMessageNotify(ApiRoom.getUserChangeSeatNotify(CJSJYModel.getMyChairID(), chairID));
	},

	onLocationClick() {
		this._onMenuCloseClick()
		AssetsManager.locationDialog({
			users: CJSJYModel.getPlayerTakeSeats(),
			chairCount: CJSJYModel.getChairCount(),
			fangzuobi: CJSJYModel.getGameRuleByKey('fangzuobi')
		})
	},

	onChatClick() {
		let params = {
			gameRule: CJSJYModel.getGameRule(),
			chat: (chat) => {
				ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
			}
		}
		AssetsManager.chatDialog(params);
	},

	onBtnTest() {
		let jushu = CJSJYModel.getCurBureau()
		if (!CJSJYModel.isInSeat() || jushu <= 0) {
			return;
		}
		AssetsManager.createDialog({
			bundle: Enums.bundleType.CJSJY,
			path: "res/prefab/CJSJYtest"
		})
	},

	showTest() {
		let tmp = UserModel.getData("isTest")
		this.btnTest.active = false // !!tmp;
	},

	showTestCard() {
		let tmp = UserModel.getData("isTest")
		if (!tmp) return;
		ApiRoom.gameMessageNotify(ApiCjsjy.gameLookCardsNotify(CJSJYModel.getMyChairID()));
	},
	// 邀请好友
	onShowInvite() {
		AssetsManager.friendDialog({
			gameRule: CJSJYModel.getGameRule(),
		})
	},


	_onMenuOpen() {
		this.menuLayList.active = true
		this.menuLayList.stopAllActions()
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
				easing: 'sineOut'
			})
			.call(() => {
				this._moveAction = false;
			})
			.start();
		this.showDissButton()
		this.showSettingBg()

	},

	_onMenuCloseClick() {
		this.menuLay.active = false;
	},


	btnClicks(event, param) {

		switch (param) {
			case 'menu':
				this._onMenuOpen();
				break;
			case 'menuclose':
				this._onMenuCloseClick();
				break;
			case "btn_back":
				this.enterHall()
				break;
		}
	},


});