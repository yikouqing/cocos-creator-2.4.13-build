const ApiBj = require('./ApiBj');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const SubManager = require('../../../src/utils/SubManager');
const UserModel = require('../../../src/model/UserModel');
const Utils = require('../../../src/utils/Utils');
const Events = require('../../../src/const/Events');
const ConfigModel = require('../../../src/model/ConfigModel');
const Codes = require('../../../src/const/Codes');
const BJModel = require("./BJModel");
const CCUtil = require("../../../src/utils/CCUtil");

cc.Class({
	extends: cc.Component,

	properties: {
		com_optBtn: require("BJOpt"),
		com_mapai: require("BJCard"),
		txt_game: cc.Label,
		txt_round: cc.Label,
		txt_roomId: cc.Label,
		btn_location: cc.Node,
		btn_copy: cc.Node,
		btn_invite: cc.Node,
		btn_ready: cc.Node,
		btn_leave: cc.Node,
		btn_dismiss: cc.Node,
		btn_shezhi: cc.Node,
		btn_zuoxia: cc.Node,
		// menu: cc.Node,
		menuLay: cc.Node,
		menuLayList: cc.Node,
		btnBackHall: cc.Node,
		tuoguan: cc.Node,
		btn_deposit: cc.Node,
		animationNode: cc.Node,
		sortCardNode: cc.Node,
		allResNode: cc.Node,
		littleResNode: cc.Node,
		cardPfb: cc.Prefab,
		aniPfb: cc.Prefab,
		btnAniList: [cc.Node],
		btnYuYin: cc.Node,
		canNotDismissBar: cc.Node,

		_aniX: 0,
		/**用户脚本列表 下标为本地座位号*/
		_userList: [],
		/**手牌脚本列表 */
		_handCardList: [],
		/**游戏状态 */
		_gameStatus: 0,
	},

	onLoad() {
		this.menuLayList.active = false
	},

	start() {
		AssetsManager.init(this.node.parent);
		this._tableInit();
		cc.game.on(cc.game.EVENT_SHOW, this.onEventShow, this);
		MessageCallback.addListener(Events.clientEvents.gvUploadFileSuccess, this);
		cc.systemEvent.on("chongxinbaipai", this.showOptCardDialog, this)
		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
		MessageCallback.addListener('UpdateGameCardBg', this);
		MessageCallback.addListener('SelfEntryRoomPush', this);
		MessageCallback.addListener('CreateRoomFail', this);
		MessageCallback.addListener('QuickJoinFail', this);
		MessageCallback.addListener('JoinGameAgainPush', this);
		MessageCallback.addListener('TestClickReq', this)
		MessageCallback.addListener('OnGameOnceAgain', this);
		this.getRoomSceneInfo()
	},

	_tableInit() {
		// 菜单点击
		this.menuLay.active = false
		this.com_mapai.init();
		this.com_mapai.node.parent.opacity = 0;
	},

	onDestroy() {
		cc.game.off(cc.game.EVENT_SHOW, this.onEventShow, this);
		cc.systemEvent.off("chongxinbaipai", this.showOptCardDialog, this);
		MessageCallback.removeListener(Events.clientEvents.gvUploadFileSuccess, this);
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
		MessageCallback.removeListener('UpdateGameCardBg', this);
		MessageCallback.removeListener('SelfEntryRoomPush', this);
		MessageCallback.removeListener('CreateRoomFail', this);
		MessageCallback.removeListener('QuickJoinFail', this);
		MessageCallback.removeListener('JoinGameAgainPush', this);
		MessageCallback.removeListener('TestClickReq', this)
		MessageCallback.removeListener('OnGameOnceAgain', this);
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
		let isUnionCreate = BJModel.isUnionCreate();
		let unionID = !!isUnionCreate ? BJModel.getRoomCreatorByKey('unionID') : null;
		SubManager.exitBundle(unionID);
	},

	resetTable() {
		this._userList.forEach(com => {
			com.reset()
		});
		this._handCardList.forEach(com => {
			com.reset()
		});
		this.com_optBtn.reset()
		this.delOptCardDialog()
	},

	gameInit(data) {
		this.unscheduleAllCallbacks();
		BJModel.init(data)
		MessageCallback.emitMessage('RemoveGameResult');
		this.delOptCardDialog()
		this.initHeadAndTiles()
		this.resetTable()
		this._gameStatus = data.gameData.gameStatus
		this.animationNode.removeAllChildren()
		this._userList.forEach(com => {
			com.leave()
		});
		/**初始化用户信息 */
		let roomUserInfoArr = data.roomUserInfoArr
		let myUserInfo = null
		for (let i = 0; i < roomUserInfoArr.length; i++) {
			const user = roomUserInfoArr[i];
			this.userEnterRoom(user)
			if (user.chairID == BJModel.getMyChairID()) {
				myUserInfo = user;
			}
		}
		this.initTotalScore(data.gameData.userWinTotalScore)
		/**按钮显示 */
		let maxPlayerCount = BJModel.getChairCount();
		let unionID = BJModel.isUnionCreate() ? BJModel.getRoomCreatorByKey('unionID') : null;
		let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
		this.btn_invite.active = BJModel.getCurBureau() == 0 && !!isShowInvite;
		this.btn_copy.active = BJModel.getCurBureau() == 0 && !!isShowInvite;
		this.btn_location.active = BJModel.getGameRuleByKey("showGps")
		this.btn_ready.active = (myUserInfo.chairID < maxPlayerCount && this._gameStatus === ApiBj.gameStatus.NONE && myUserInfo && myUserInfo.playStatus != ApiRoom.playStatus.READY)
		this.btn_leave.active = (data.gameData.curBureau == 0 || myUserInfo.chairID >= maxPlayerCount)
		this.btn_dismiss.active = (!BJModel.getGameRuleByKey("canNotDissmiss") && data.gameData.curBureau != 0 && myUserInfo.chairID < maxPlayerCount)
		this.btn_deposit.active = BJModel.getGameRuleByKey("canTrust");
		if (this.canNotDismissBar) this.canNotDismissBar.active = BJModel.getGameRuleByKey("canNotDissmiss");
		this.btnBackHall.active = data.gameData.curBureau == 0 && BJModel.isUnionCreate();
		this._yuYinShow();
		this.showSitDownButton()
		/**房间号和局数 */
		this.txt_roomId.string = `房号:${data.roomID}`
		this.txt_round.string = `局数:${data.gameData.curBureau}/${data.gameData.maxBureau}`
		this.txt_game.string = `游戏:${ConfigModel.getGameName(Enums.bundleType.BJ)}`;
		/**恢复桌面 */
		this.showMaPai(-1)
		let myUid = UserModel.getData("uid")
		if (data.gameData.gameStarted) {
			this.setClock(data.gameData)
		}
		// if (BJModel.getCurBureau() > 0) {
		// 	this.btn_ready.setPosition(410, -300)
		// }
		//进入房间提示准备时间
		if (this.btn_ready.active && BJModel.getCurBureau() == 0) {
			let t = BJModel.getGameRuleByKey("unReadyKick")
			if (t) {
				this.setClock({
					tick: t,
					totalTick: t
				})
			}
		}

		if (this._gameStatus == ApiBj.gameStatus.SHOW_CARD) {
			let showCardsUser = data.gameData.showCardsUser
			let allUserUid = data.roomUserInfoArr.map(info => info.uid)
			let showCardUid = showCardsUser.map(info => info.uid)
			let showMyOpt = true
			allUserUid.forEach(uid => {
				let idx = this.getUserIdxByUid(uid)
				let hcom = this._handCardList[idx]
				if (hcom) {
					if (showCardUid.includes(uid)) {
						if (uid == myUid) {
							showMyOpt = false
						}
						hcom.setShowState(2)
					} else {
						let cards = data.gameData.handCards[uid]
						if (cards) {
							if (!BJModel.getSelfIsPlaying()) cards = new Array(9).fill(0)
							hcom.sendCards(cards)
							hcom.setShowState(1)
						}
					}
				}
			});
			let cancelUser = data.gameData.cancelUser
			if (cancelUser && Array.isArray(cancelUser)) {
				cancelUser.forEach(uid => {
					if (uid == myUid) {
						showMyOpt = false
					}
					this.onShowCard({
						uid: uid
					})
				});
			}
			/**显示理牌界面 */
			if (showMyOpt) {
				this.showOptCardDialog()
			}
			// this.showMaPai(data.gameData.mapai)
		} else if (this._gameStatus == ApiBj.gameStatus.SEND_CARDS) {
			this.onSendCard(data.gameData)
		}
		if (data.gameData.result) {
			this.showResCardAniAll(data.gameData, 3)
		}
		this.showTest()
	},

	_yuYinShow() {
		let isInSeat = BJModel.isInSeat();
		let yuyin = BJModel.getGameRuleByKey('yuyin');
		this.btnYuYin.active = !!isInSeat && !!yuyin && ConfigModel.getData('voiceSpeaker');
	},

	/**初始化头像和牌 */
	initHeadAndTiles() {
		let headPos = [0, 1, 2, 3, 4, 5]
		let playerCount = BJModel.getChairCount()
		switch (playerCount) {
			case 2:
				headPos = [0, 3]
				break;
			case 3:
				headPos = [0, 2, 4]
				break;
			case 4:
				headPos = [0, 2, 3, 4]
				break;
			case 5:
				headPos = [0, 1, 2, 4, 5]
				break;
		}
		this._userList.length = 0
		this._handCardList.length = 0

		for (let i = 0; i < headPos.length; i++) {
			let idx = headPos[i]
			let h = cc.find("head" + idx, this.node)
			this._userList.push(h.getComponent("BJHead"))
			this._userList[i].initRes()

			let handCard = cc.find("cards/hand" + idx, this.node)
			this._handCardList.push(handCard.getComponent("BJCardMgr"))
			this._handCardList[i].init(idx)
			if (playerCount <= 4 && (idx == 2 || idx == 4)) {
				h.y = 18
				handCard.y = -8
			}
		}
	},

	/**用户进入房间 */
	userEnterRoom(data) {
		if (data.chairID >= BJModel.getChairCount() || data.playStatus == ApiRoom.playStatus.WATCH) {
			return
		}
		let idx = BJModel.getUserChairIndex(data.chairID)
		let headcom = this._userList[idx]
		if (headcom) {
			headcom.init(data)
		}
		let cardcom = this._handCardList[idx]
		cardcom && cardcom.setChairId(data.chairID)
	},

	/**恢复所有人的总输赢分数 */
	initTotalScore(userWinTotalScore) {
		if (userWinTotalScore && BJModel.scoreState()) {
			let len = Object.keys(userWinTotalScore)
			if (len.length > 0) {
				for (const uid in userWinTotalScore) {
					if (Object.hasOwnProperty.call(userWinTotalScore, uid)) {
						const s = userWinTotalScore[uid];
						let idx = this.getUserIdxByUid(uid)
						let com = this._userList[idx]
						if (com) com.setTotalScore(s)
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
		if (data.chairID < BJModel.getChairCount()) {
			let idx = BJModel.getUserChairIndex(data.chairID)
			let headcom = this._userList[idx]
			if (headcom) {
				headcom.leave()
			}
		}
		if (data.uid == UserModel.getData('uid')) {
			if (!BJModel.getRoomID() ||
				BJModel.getRoomID() == data.roomID) {
				this.enterHall()
			}
		}
	},

	/**玩家准备 */
	onUserReady(data) {
		let idx = BJModel.getUserChairIndex(data.chairID)
		let com = this._userList[idx]
		if (com) com.setReady(true)
		if (data.chairID == BJModel.getMyChairID()) {
			this.btn_ready.active = false
			this.resetTable()
		}
	},

	/**隐藏所有准备图标*/
	hideReadyIcon() {
		this._userList.forEach(userCom => {
			userCom.setReady(false)
		});
	},

	/**更新局数 */
	onGameRoundUpdate(data) {
		BJModel.setCurBureau(data.curBureau);
		this._yuYinShow();
		this.txt_round.string = `局数:${data.curBureau}/${BJModel.getMaxBureau()}`
		this.btn_invite.active = false
		this.btn_copy.active = false
		let myUserInfo = BJModel.getUserByChairID(BJModel.getMyChairID())
		this.btn_leave.active = (myUserInfo.chairID >= BJModel.getChairCount())
		this.btn_dismiss.active = (!BJModel.getGameRuleByKey("canNotDissmiss") && myUserInfo.chairID < BJModel.getChairCount())
		this.resetTable();
	},

	setClock(data) {
		let str = ["s0", "s1", "s2", "", "s4", "", "", "s7"][this._gameStatus]
		let t = data.tick
		if (str == "" || data.totalTick == 0) {
			t = null
		}
		this.com_optBtn.setClock(t, str)
	},

	/**设置所有人的理牌状态 */
	setAllCardShowState(type) {
		for (let i = 0; i < BJModel.getChairCount(); i++) {
			let idx = BJModel.getUserChairIndex(i)
			let hcom = this._handCardList[idx]
			if (hcom && BJModel.getIsPlayingByChairID(i)) {
				hcom.setShowState(type)
			}
		}
	},

	/**游戏状态图更新 */
	onGameStatusUpdate(data) {
		this._yuYinShow();
		this._gameStatus = data.gameStatus
		this.btn_ready.active = false
		this.btnBackHall.active = false
		this.hideReadyIcon()
		this.com_optBtn.reset()
		this.setClock(data)
		switch (this._gameStatus) {
			case ApiBj.gameStatus.SHOW_CARD:
				this.setAllCardShowState(1)
				AssetsManager.playEffect({
					path: "res/audio/start_poker",
					bundle: Enums.bundleType.BJ
				});

				let optDialog = this.sortCardNode.getChildByName("BJOptCardDialog")
				if (cc.isValid(optDialog)) {
					let optcom = optDialog.getComponent("BJOptCardDialog")
					optcom.setClock(data.tick)
				}
				break;
			case ApiBj.gameStatus.RESULT:
				this.setAllCardShowState(3)
				break;
			case ApiBj.gameStatus.NONE:
				// if (BJModel.getCurBureau() > 0) {
				// 	this.btn_ready.setPosition(410, -300)
				// }
				this.btn_ready.active = BJModel.getSelfIsPlaying()
				break;
			case ApiBj.gameStatus.START_GAME:
				this.resetTable()
				this.showAni(1)
				this.unscheduleAllCallbacks();
				break;
			default:
				break;
		}
	},

	getChairIdByUid(uid) {
		for (let i = 0; i < this._userList.length; i++) {
			const udata = this._userList[i].getUserData();
			if (udata && udata.userInfo && udata.userInfo.uid == uid) {
				return udata.chairID
			}
		}
		return null
	},

	/**通过UID获取玩家位置 */
	getUserIdxByUid(uid) {
		let chairId = this.getChairIdByUid(uid)
		let idx = BJModel.getUserChairIndex(chairId)
		return idx;
	},

	/**
	 * 展示马牌
	 * @param {number} cardId 马牌id
	 * @param {boolean} isAni 是否播放动画
	 */
	showMaPai(cardId, isAni = false) {
		if (cardId == -1) {
			this.com_mapai.node.parent.opacity = 0
			return
		}
		this.com_mapai.flower = cardId
		this.com_mapai.setMaIcon(true)
		if (isAni) {
			this.com_mapai.setNodeShow(false)
			let endPos = this.com_mapai.node.parent.getPosition()
			let flyNode = cc.instantiate(this.cardPfb)
			flyNode.parent = this.com_mapai.node.parent.parent
			let flycom = flyNode.addComponent('BJCard')
			flycom.init()
			flycom.flower = this.com_mapai.flower
			flycom.setCover(true)
			flycom.updateNodePos(cc.v2(0, 0))
			flycom.setNodeScale(1)
			flycom.setNodeOpacity(255)
			flycom.setNodeShow(true)
			cc.tween(flyNode).to(0.1, {
				scaleX: 0
			}).call(() => {
				flycom.setCover(false)
			}).to(0.1, {
				scaleX: 1
			}).delay(0.2).to(0.2, {
				scale: 0.5,
				position: endPos
			}, {
				easing: "cubicIn"
			}).call(() => {
				this.com_mapai.node.parent.opacity = 255
				this.com_mapai.setNodeShow(true)
				flyNode.destroy()
			}).start()
		} else {
			this.com_mapai.node.parent.opacity = 255
			this.com_mapai.setNodeShow(true)
		}
	},


	showAni(type, callFunc = null) {
		let ani = cc.instantiate(this.aniPfb)
		ani.parent = this.animationNode
		ani.getComponent("BJAni").showSpineAni(type, callFunc)
	},

	/**展示洗牌界面 */
	showWashCard(data) {
		if (data.userIDList.includes(BJModel.myUid)) {
			AssetsManager.createDialog({
				path: 'res/prefab/BJQiePai',
				bundle: Enums.bundleType.BJ,
				countDown: data.time,
				parent: this.animationNode
			});
		}
	},

	/**发牌 */
	onSendCard(data, isAni = false) {
		let handCards = Utils.deepCopy(data.handCards)
		for (const uid in handCards) {
			if (Object.hasOwnProperty.call(handCards, uid)) {
				let h = handCards[uid];
				let idx = this.getUserIdxByUid(uid)
				let hcom = this._handCardList[idx]
				if (!BJModel.getSelfIsPlaying()) {
					hcom && hcom.sendCards(h, isAni)
				} else {
					if (idx == 0) {
						this.showOptCardDialog(true)
					} else {
						hcom && hcom.sendCards(h, isAni)
					}
				}
			}
		}
	},

	/**个人抢庄返回 
	 * 
	 */
	onRobBanker(data, isAni = false) {
		if (data.uid == UserModel.getData("uid")) {
			this.com_optBtn.setRobBankerNode(false)
		}
		let idx = this.getUserIdxByUid(data.uid)
		let ucom = this._userList[idx]
		if (ucom) {
			ucom.setRobScale(data.robScale, true)
			if (isAni) {
				let audio = 'res/audio/woman/qiangzhuang_0';
				if (data.robScale == 0) {
					audio = 'res/audio/woman/buqiang_0';
				}
				let user = ucom.getUserData()
				if (user && user.userInfo.sex == 0) {
					audio = audio.replace(/woman/, "man");
				}
				AssetsManager.playEffect({
					path: audio,
					bundle: Enums.bundleType.BJ
				});
			}
		}
	},

	/**更新庄家
	 * uid"859718"
		  userList:
	 */
	onBankerUpdate(data, isAni = false) { },

	/**下分推送，显示下注按钮
	 */
	onPourScoreStart(data) {
		// bankerUid"388708"
		// tick15
		if (data.bankerUid == UserModel.getData("uid")) {
			this.com_optBtn.setBetNode()
		} else {
			this.com_optBtn.setBetNode(data)
		}
	},

	/**玩家下注返回
	 * uid,
	 score
	 */
	onPlayerBet(data) {
		if (data.uid == UserModel.getData("uid")) {
			this.com_optBtn.setBetNode()
		}
		let idx = this.getUserIdxByUid(data.uid)
		let ucom = this._userList[idx]
		if (ucom) {
			ucom.setRobScale(data.score, false)
		}
	},

	/**显示操作界面 */
	showOptCardDialog(isAni = false) {
		/**旁观状态不显示 */
		if (!BJModel.getSelfIsPlaying()) {
			return
		}
		let data = {
			autoCards: BJModel.getAutoCards(),
			handCards: BJModel.getMyHandCard(),
			tick: BJModel.tick,
			bundle: Enums.bundleType.BJ,
			path: 'res/prefab/BJOptCardDialog',
			parent: this.sortCardNode,
			isAni: isAni,
		}
		AssetsManager.createDialog(data)
	},

	/**删除操作界面 */
	delOptCardDialog() {
		AssetsManager.clearDialog(['BJOptCardDialog']);
	},

	/**亮牌结果 */
	onShowCard(data) {
		let idx = this.getUserIdxByUid(data.uid)
		let hcom = this._handCardList[idx]
		if (hcom) {
			hcom.setShowState(2)
		}
		if (data.uid == UserModel.getData("uid")) {
			this.delOptCardDialog()
		}
	},

	/**用户弃牌 */
	onGiveupCard(data, isAni = false) {
		let idx = this.getUserIdxByUid(data.uid)
		let hcom = this._handCardList[idx]
		if (hcom) {
			hcom.setShowState(2)
			hcom.showGiveupCard(true, isAni)
		}
		if (data.uid == UserModel.getData("uid")) {
			this.delOptCardDialog()
		}
	},

	/**结算比牌动画 完整*/
	showResCardAniAll(data, biPaiType) {
		let dt = 0 //总动画时间
		let bipaiDt = 0.8 //每道牌比牌间隔

		let res = data.result
		let touSort = res.touList
		let zhongSort = res.zhongList
		let weiSort = res.weiList
		let totalScore = res.totalScore
		let plusType = res.plusType
		let xiScore = res.xiScore

		/**展示弃牌 */
		let cancelUser = res.cancelUser
		if (cancelUser && Array.isArray(cancelUser) && cancelUser.length > 0) {
			cancelUser.forEach(uid => {
				let idx = this.getUserIdxByUid(uid)
				let hcom = this._handCardList[idx]
				if (hcom) {
					hcom.setShowState(2)
					hcom.showGiveupCard(true, true)
				}
			});
		}

		for (let i = touSort.length - 1; i >= 0; i--) {
			const info = touSort[i];
			let idx = this.getUserIdxByUid(info.uid)
			let hcom = this._handCardList[idx]
			if (hcom) {
				/**执行动画 */
				this.scheduleOnce(() => {
					hcom.showCards(res, 1, info.uid, biPaiType != 3)
				}, dt)
				if (biPaiType == 1) {
					dt += bipaiDt
				}
			}
		}
		if (biPaiType == 2) {
			dt += bipaiDt
		}

		for (let i = zhongSort.length - 1; i >= 0; i--) {
			const info = zhongSort[i];
			let idx = this.getUserIdxByUid(info.uid)
			let hcom = this._handCardList[idx]
			if (hcom) {
				/**执行动画 */
				this.scheduleOnce(() => {
					hcom.showCards(res, 2, info.uid, biPaiType != 3)
				}, dt)
				if (biPaiType == 1) {
					dt += bipaiDt
				}
			}
		}
		if (biPaiType == 2) {
			dt += bipaiDt
		}

		for (let i = weiSort.length - 1; i >= 0; i--) {
			const info = weiSort[i];
			let idx = this.getUserIdxByUid(info.uid)
			let hcom = this._handCardList[idx]
			if (hcom) {
				/**执行动画 */
				this.scheduleOnce(() => {
					hcom.showCards(res, 3, info.uid, biPaiType != 3)
				}, dt)
				if (biPaiType == 1) {
					dt += bipaiDt
				}
			}
		}

		if (biPaiType == 2) {
			dt += bipaiDt
		}

		/**展示总分和特殊牌型 */
		this.scheduleOnce(() => {
			for (const uid in totalScore) {
				if (Object.hasOwnProperty.call(totalScore, uid)) {
					const score = totalScore[uid];
					let idx = this.getUserIdxByUid(uid)
					let hcom = this._handCardList[idx]
					if (hcom) {
						hcom.showTotalScore(score, biPaiType != 3)
						hcom.showXiType(plusType[uid])
					}
				}
			}
			for (const uid in xiScore) {
				if (Object.hasOwnProperty.call(xiScore, uid)) {
					const score = xiScore[uid];
					let idx = this.getUserIdxByUid(uid)
					let hcom = this._handCardList[idx]
					if (hcom) {
						hcom.showCardType(4, 999, false)
						hcom.showCardScore(4, score, false)
					}
				}
			}
		}, dt)
		dt += 1
		return dt
	},

	/**展示结算界面 */
	showResDialog(data) {
		data.bundle = Enums.bundleType.BJ
		data.myChairID = this.myChairID
		data.mainDialog = this
		data.path = 'res/prefab/BJResultDialog'
		data.isResult = true
		data.parent = this.littleResNode
		AssetsManager.createDialog(data);
	},

	/**游戏结算 */
	onGameResult(data) {
		/**删除操作界面 */
		this.delOptCardDialog()

		let biPaiType = BJModel.getGameRuleByKey("biPaiType")

		this.showAni(3, () => {
			let dt = 0
			dt += this.showResCardAniAll(data, biPaiType)
			this.scheduleOnce(() => {
				this.showAllResultFuc && this.showAllResultFuc()
			}, dt + 2)
		})
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

	onGift(fromChairID, toChairID, giftID) {
		let fidx = BJModel.getUserChairIndex(fromChairID)
		let tidx = BJModel.getUserChairIndex(toChairID)
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

	onBtnTest() {
		let pGuan = BJModel.getSelfIsPlaying()
		let tmp = UserModel.getData("isTest")
		if (!tmp || !pGuan) {
			return
		}
		AssetsManager.createDialog({
			bundle: Enums.bundleType.BJ,
			path: "res/prefab/BJSelectTest",
			mainDialog: this
		})
	},

	showTest() {
		let tmp = UserModel.getData("isTest")
		this.btn_shezhi.active = false //!!tmp
	},

	/**给没座位的人显示坐下按钮 */
	showSitDownButton() {
		let curBureau = BJModel.getCurBureau();
		let maxBureau = BJModel.getMaxBureau();
		let canEnter = BJModel.getGameRuleByKey('canEnter') && maxBureau != curBureau;
		// (!!canEnter || curBureau == 0) &&
		this.btn_zuoxia.active = BJModel.getMyChairID() >= BJModel.getChairCount() &&
			(!!canEnter || curBureau == 0) &&
			BJModel.checkHaveEmptySeat();
	},

	/**坐下按钮响应 */
	onBtnSitDown() {
		/**检查是否还有空位，有就发送坐下命令 */
		let chairID = BJModel.getCanSitDownChairID();
		let idx = BJModel.getUserChairIndex(chairID)
		if (chairID == -1 || !this._userList[idx]) {
			AssetsManager.tipDialog('没有座位可以坐下！');
			return;
		}
		ApiRoom.roomMessageNotify(ApiRoom.getUserChangeSeatNotify(BJModel.getMyChairID(), chairID));
	},

	/**观战列表响应 */
	onLookOnClick() {
		let users = BJModel.getLookOnUsers();
		if (users.length == 0) {
			AssetsManager.tipDialog('暂无观战玩家！');
			return;
		}
		AssetsManager.standDialog({
			users: users
		});
	},

	_onLeaveClick() {
		if (!UserModel.isInRoom()) {
			this.enterHall();
			return;
		}
		let curBureau = BJModel.getCurBureau();
		if (curBureau > 0 && BJModel.getMyChairID() < BJModel.getChairCount()) {
			AssetsManager.tipDialog('现在不能退出游戏');
		} else {
			ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
		}
	},


	_onMenuOpen() {
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
	},

	_onMenuCloseClick() {
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
				this._onMenuCloseClick();
				break
			case "btn_leave": //离开房间
				this._onLeaveClick();
				break;
			case "btn_ready": //准备
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify(true));
				this.btn_ready.active = false
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
				if (CCUtil.clickInterval(event.target, 10, true)) true
				AssetsManager.tipDialog('刷新界面可以修复游戏显示问题');
				this.getRoomSceneInfo()
				break;
			case "btn_setting": //设置
				this._onMenuCloseClick();
				AssetsManager.setDialog({
					type: "duoren",
					gameType: Enums.bundleType.BJ,
					musicType: Enums.bundleType.CIRCLE,
				});
				break;
			case "btn_review": //回看
				this._onMenuCloseClick();
				if (CCUtil.clickInterval(event.target, 1)) return;
				ApiRoom.gameMessageNotify(ApiBj.gameReviewNotify());
				break;
			case "btn_msg": //聊天
				if (CCUtil.clickInterval(event.target, 1)) return;
				let params = {
					gameRule: BJModel.getGameRule(),
					chat: (chat) => {
						ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
					}
				}
				AssetsManager.chatDialog(params);
				break;
			case "btn_roomInfo": //规则
				this._onMenuCloseClick();
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				let rule = BJModel.getGameRule()
				if (!rule) {
					return
				}
				AssetsManager.tableDialog({
					gameRule: rule,
				});
				break;
			case "btn_location": //定位
				this._onMenuCloseClick();
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				let users = []
				for (let i = 0; i < this._userList.length; i++) {
					const u = this._userList[i];
					let data = u.getUserData()
					if (data) {
						users.push(data)
					}
				}
				AssetsManager.locationDialog({
					users: users,
					chairCount: BJModel.getChairCount(),
					fangzuobi: BJModel.getGameRuleByKey('fangzuobi')
				})
				break;
			case "btn_deposit": //开始托管
				this._onMenuCloseClick();
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				ApiRoom.gameMessageNotify(ApiBj.gameTrushNotify(true));
				break;
			case "btn_quxiaotuoguan": //取消托管
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				ApiRoom.gameMessageNotify(ApiBj.gameTrushNotify(false));
				break;
			case "btn_invite": //邀请
				let gameRule = BJModel.getGameRule()
				gameRule = gameRule || {};
				gameRule.roomId = BJModel.getRoomID();
				let share = ConfigModel.getRoomRuleShare(gameRule);
				NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
				break;
			case "btn_copy": //复制
				let str = ConfigModel.getRoomShare(Enums.bundleType.BJ, BJModel.getRoomID())
				NativeUtil.copyText(str);
				break;
			case "btn_cardRecord":
				if (CCUtil.clickInterval(event.target, 0.5)) {
					return;
				}
				this.onBtnCardRecords()
				break;
			case "btn_zuoxia":
				if (CCUtil.clickInterval(event.target, 0.5)) {
					return;
				}
				this.onBtnSitDown()
				break;
			case "btn_pangguan":
				if (CCUtil.clickInterval(event.target, 0.5)) {
					return;
				}
				this.onLookOnClick()
				break;
			case "btn_shezhi":
				if (CCUtil.clickInterval(event.target, 0.5)) {
					return;
				}
				this.onBtnTest()
				break;
			case "btn_back":
				this.enterHall()
				break;
			default:
				break;
		}
	},

	// 邀请好友
	onShowInvite() {
		AssetsManager.friendDialog({
			gameRule: BJModel.getGameRule(),
		})
	},


	/**消息监听 */
	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.gameInit(msg.data);
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				BJModel.addUser(msg.data.roomUserInfo);
				this.userEnterRoom(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				if (msg.data.roomUserInfo.chairID != BJModel.getMyChairID()) {
					BJModel.delUser(msg.data.roomUserInfo.chairID);
				}
				this.userLeaveRoom(msg.data.roomUserInfo)
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				this.onUserReady(msg.data)
			} else if (msg.type === ApiRoom.GAME_END_PUSH) { } else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
				if (!msg.data.userList || msg.data.userList.length == 0) return;
				msg.data.myChairID = BJModel.getMyChairID();
				AssetsManager.disDialog(msg.data);
			} else if (msg.type === ApiRoom.USER_CHAT_PUSH) {
				let idx = BJModel.getUserChairIndex(msg.data.chairID)
				let com = this._userList[idx]
				if (com) {
					com.gameChat(msg.data)
				}
			} else if (msg.type === ApiRoom.USER_GIFT_SEND_PUSH) {
				this.onGift(msg.data.fromChairID, msg.data.toChairID, msg.data.giftID);
			} else if (msg.type === ApiRoom.USER_VOICE_PUSH) {
				this._voiceMsgQueue.push(msg.data);
			} else if (msg.type === ApiRoom.USER_OFF_LINE_PUSH) {
				let idx = BJModel.getUserChairIndex(msg.data.chairID)
				let com = this._userList[idx]
				if (com) com.setOffline(true)
			} else if (msg.type === ApiRoom.ROOM_USER_INFO_CHANGE_PUSH) { //用户信息刷新
				this._userList.forEach(com => {
					if (com) {
						com.userInfoChange(msg.data)
					}
				});
			} else if (msg.type === ApiRoom.ROOM_USER_WIN_TOTAL_PUSH) {
				/**玩家总输赢分数 */
				this.initTotalScore(msg.data.userWinTotalScore)
			} else if (msg.type === ApiRoom.USER_GAME_STATUS_PUSH) {
				BJModel.updateUserPlayStatus(msg.data.userPlayStatus);
			} else if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
				if (msg.data.code != 0) {
					if (msg.data.uid == UserModel.getData('uid')) {
						AssetsManager.tipDialog(Codes[msg.data.code]);
					}
					return;
				};
				BJModel.setUserPropertyByUID(msg.data.uid, 'userStatus', msg.data.userStatus);
				BJModel.setUserPropertyByUID(msg.data.uid, 'chairID', msg.data.toChairID);
				if (msg.data.uid == UserModel.getData('uid') && msg.data.toChairID >= BJModel.getChairCount()) {
					//我自己被强制旁观
					this._userList[0].leave()
				}
				if (msg.data.toChairID < BJModel.getChairCount()) {
					if (msg.data.uid == UserModel.getData('uid')) {
						this._userList.forEach(com => {
							com.leave()
						});
						this.getRoomSceneInfo()
					} else {
						/**重新刷新座位 */
						let user = BJModel.getUserByChairID(msg.data.toChairID)
						this.userEnterRoom(user)
					}
				}
				//强制显示未入座的坐下按钮
				this.showSitDownButton();
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiBj.GAME_BUREAU_PUSH) {
				MessageCallback.emitMessage('RemoveGameResult');
				this.onGameRoundUpdate(msg.data)
			} else if (msg.type === ApiBj.GAME_STATUS_PUSH) { //游戏状态
				BJModel.setGameStatus(msg.data)
				this.onGameStatusUpdate(msg.data)
			} else if (msg.type === ApiBj.GAME_SEND_CARDS_PUSH) { //发牌
				BJModel.setHandCards(msg.data.handCards)
				BJModel.setAutoCards(msg.data.autoCards)
				this.onSendCard(msg.data, true)
			} else if (msg.type === ApiBj.GAME_MA_PAI_PUSH) { //更新马牌
				this.showMaPai(msg.data.mapai, true)
			} else if (msg.type === ApiBj.GAME_ROB_BANK_PUSH) { //抢庄返回
				this.onRobBanker(msg.data, true)
			} else if (msg.type === ApiBj.GAME_BANKER_PUSH) { //庄家位置更新
				this.onBankerUpdate(msg.data, true)
			} else if (msg.type === ApiBj.GAME_USER_POUR_SCORE_PUSH) { //玩家下分推送
				this.onPourScoreStart(msg.data)
			} else if (msg.type === ApiBj.GAME_USER_SCORE_PUSH) { //下注
				this.onPlayerBet(msg.data)
			} else if (msg.type === ApiBj.SHOW_CARDS_PUSH) { //亮牌结果
				BJModel.setShowCardsUser(msg.data.cardsList)
				this.onShowCard(msg.data)
			} else if (msg.type === ApiBj.USER_CANCEL_PUSH) { //弃牌结果
				this.onShowCard(msg.data)
			} else if (msg.type === ApiBj.GAME_USER_WASH_CARD_PUSH) { //用户洗牌
				this.showWashCard(msg.data)
			} else if (msg.type === ApiBj.GAME_END_PUSH) {
				if (msg.data.result.length > 0) {
					msg.data.enterHall = this.enterHall.bind(this);
					msg.data.path = 'res/prefab/BJAllResult';
					msg.data.bundle = Enums.bundleType.BJ;
					msg.data.isUnionCreate = BJModel.isUnionCreate();
					msg.data.unionID = BJModel.getRoomCreatorByKey("unionID")
					msg.data.gameRule = BJModel.getGameRule()
					msg.data.roomID = BJModel.getRoomID()
					msg.data.parent = this.allResNode
					this.showAllResultFuc = () => {
						this.showAllResultFuc = null
						this.unscheduleAllCallbacks();
						this.resetTable();
						AssetsManager.createDialog(msg.data);
					}
					this.unscheduleAllCallbacks();
					this.scheduleOnce(() => {
						MessageCallback.emitMessage('RemoveGameResult');
						this.showAllResultFuc && this.showAllResultFuc();
					}, 2);
				} else {
					this.enterHall();
				}
			} else if (msg.type === ApiBj.GAME_REVIEW_PUSH) {
				let reviewRecord = msg.data.list
				if (reviewRecord && reviewRecord.length > 0) {
					AssetsManager.createDialog({
						bundle: Enums.bundleType.BJ,
						path: "res/prefab/BJResultDialog",
						reviewRecord: reviewRecord,

					});
				} else {
					AssetsManager.tipDialog('没有数据');
				}
			} else if (msg.type === ApiBj.GAME_RESULT_PUSH) {
				this.onGameResult(msg.data)
			}
		} else if (route === 'ReconnectSuccess') {
			this.getRoomSceneInfo();
		} else if (route === 'SelfEntryRoomPush') {
			if (msg.gameType != BJModel.getBundleType()) {
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
		}
	},
});