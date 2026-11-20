const ApiFjsss = require('./ApiFjsss');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const SubManager = require('../../../src/utils/SubManager');
const UserModel = require('../../../src/model/UserModel');
const Events = require('../../../src/const/Events');
const ApiHall = require('../../../src/api/ApiHall');
const AudioUtil = require('../../../src/utils/AudioUtil');
const ConfigModel = require('../../../src/model/ConfigModel');
const Codes = require('../../../src/const/Codes');
const FJSSSModel = require("./FJSSSModel")
const CCUtil = require("../../../src/utils/CCUtil")
const gameUtil = require("./FJSSSUtil");

cc.Class({
	extends: cc.Component,

	properties: {
		txt_name: cc.Label,
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
		img_guanzhan: cc.Node,
		// menu: cc.Node,
		menuLay: cc.Node,
		menuLayList: cc.Node,
		tuoguan: cc.Node,
		btn_deposit: cc.Node,
		animationNode: cc.Node,
		sortCardNode: cc.Node,
		allResNode: cc.Node,
		littleResNode: cc.Node,
		cardPfb: cc.Prefab,
		aniPfb: cc.Prefab,
		btnBackHall: cc.Node,
		btnYuYin: cc.Node,
		com_optBtn: require("FJSSSOpt"),
		com_mapai: require("FJSSSCard"),
		btnAniList: [cc.Node],
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
		AssetsManager.init(this.node.parent);
		// 菜单点击
		this.menuLay.active = false;
		this.com_mapai.init();
		this.com_mapai.node.parent.opacity = 0;
		this.txt_name.string = `游戏:${ConfigModel.getGameName(Enums.bundleType.FJSSS)}`;
		cc.game.on(cc.game.EVENT_SHOW, this.onEventShow, this);
		cc.systemEvent.on("chongxinbaipai", this.showOptCardDialog, this)
		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener(Events.clientEvents.gvUploadFileSuccess, this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
		MessageCallback.addListener('UpdateGameCardBg', this);
		MessageCallback.addListener('SelfEntryRoomPush', this);
		MessageCallback.addListener('CreateRoomFail', this);
		MessageCallback.addListener('QuickJoinFail', this);
		MessageCallback.addListener('JoinGameAgainPush', this);
		MessageCallback.addListener('TestClickReq', this)
		MessageCallback.addListener('OnGameOnceAgain', this);
		/* 获取场景信息 */
		this.getRoomSceneInfo();
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
		let isUnionCreate = FJSSSModel.isUnionCreate();
		let unionID = !!isUnionCreate ? FJSSSModel.getRoomCreatorByKey('unionID') : null;
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

	_yuYinShow() {
		let isInSeat = FJSSSModel.isInSeat();
		let yuyin = FJSSSModel.getGameRuleByKey('yuyin');
		this.btnYuYin.active = !!isInSeat && !!yuyin && ConfigModel.getData('voiceSpeaker');
	},

	gameInit(data) {
		this.unscheduleAllCallbacks();
		FJSSSModel.init(data)
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
			if (user.chairID == FJSSSModel.getMyChairID()) {
				myUserInfo = user
			}
		}
		this.initTotalScore(data.gameData.userWinTotalScore)
		if (this.canNotDismissBar) this.canNotDismissBar.active = FJSSSModel.getGameRuleByKey("canNotDissmiss")
		/**按钮显示 */
		let maxPlayerCount = FJSSSModel.getChairCount()
		this.btn_invite.active = FJSSSModel.getCurBureau() == 0 && !cc.sys.isBrowser;
		this.btn_copy.active = FJSSSModel.getCurBureau() == 0 && !cc.sys.isBrowser;
		this.btn_location.active = !!FJSSSModel.getGameRuleByKey("showGps")
		this.btn_ready.active = (myUserInfo.chairID < maxPlayerCount && this._gameStatus === ApiFjsss.gameStatus.NONE && myUserInfo && myUserInfo.playStatus != ApiRoom.playStatus.READY)
		this.btn_leave.active = (data.gameData.curBureau == 0 || myUserInfo.chairID >= maxPlayerCount)
		this.btn_dismiss.active = (!FJSSSModel.getGameRuleByKey("canNotDissmiss") && data.gameData.curBureau != 0 && myUserInfo.chairID < maxPlayerCount)
		this.btn_deposit.active = FJSSSModel.getGameRuleByKey("canTrust")
		this.btnBackHall.active = data.gameData.curBureau == 0 && FJSSSModel.isUnionCreate();
		this._yuYinShow();
		this.showSitDownButton()

		/**房间号和局数 */
		this.txt_roomId.string = `房号:${data.roomID}`
		this.txt_round.string = `局数:${data.gameData.curBureau}/${data.gameData.maxBureau}`

		/**恢复桌面 */
		this.showMaPai(-1)
		let myUid = UserModel.getData("uid")
		if (data.gameData.gameStarted) {
			this.setClock(data.gameData)
		}
		//进入房间提示准备时间
		// if (this.btn_ready.active && FJSSSModel.getCurBureau() == 0) {
		// 	let t = FJSSSModel.getGameRuleByKey("kickUserTime")
		// 	if (t) {
		// 		this.setClock({
		// 			tick: t,
		// 			totalTick: t
		// 		})
		// 	}
		// }

		if (data.gameData.gameStarted) {
			if (data.gameData.bankerUid) {
				this.onBankerUpdate({
					uid: data.gameData.bankerUid,
					userList: data.gameData.robBankList
				})
			}

			let userBetScore = data.gameData.userBetScore
			if (userBetScore) {
				for (const uid in userBetScore) {
					if (Object.hasOwnProperty.call(userBetScore, uid)) {
						this.onPlayerBet(userBetScore[uid])
					}
				}
			}
		}

		if (this._gameStatus == ApiFjsss.gameStatus.SHOW_CARD) {
			let showCardsUser = data.gameData.showCardsUser
			let showMyOpt = true
			showCardsUser.forEach(u => {
				let idx = this.getUserIdxByUid(u.uid)
				let hcom = this._handCardList[idx]
				if (hcom) {
					if (u.isShow) {
						if (u.uid == myUid) {
							showMyOpt = false
						}
						hcom.setShowState(2)
					} else {
						hcom.setShowState(1)
					}
				}
			});
			/**显示理牌界面 */
			if (showMyOpt) {
				this.showOptCardDialog()
			}
			this.showMaPai(data.gameData.mapai)
		} else if (this._gameStatus == ApiFjsss.gameStatus.POUR_SCORE) {
			this.onSendCard(data.gameData)
			let userBetScore = data.gameData.userBetScore
			let isbet = false
			for (const uid in userBetScore) {
				if (uid == myUid) {
					isbet = true
				}
			}
			if (!isbet) {
				this.onPourScoreStart({
					bankerUid: data.gameData.bankerUid,
					scoreList: [1, 2, 3, 4, 5],
					tick: 0
				})
			}
		} else if (this._gameStatus == ApiFjsss.gameStatus.ROB_BANK) {
			this.onSendCard(data.gameData)
			let robBankList = data.gameData.robBankList
			let isRob = false
			robBankList.forEach(info => {
				if (info.uid == myUid) {
					isRob = true
				}
				this.onRobBanker(info)
			});
			if (!isRob) {
				this.com_optBtn.setRobBankerNode(true)
			}
		} else if (this._gameStatus == ApiFjsss.gameStatus.SEND_CARDS) {
			this.onSendCard(data.gameData)
		}
		if (data.gameData.result && myUserInfo.chairID < maxPlayerCount) {
			this.showResDialog(data.gameData)
		}
		this.showTest()
	},

	/**初始化头像和牌 */
	initHeadAndTiles() {
		let headPos = [0, 1, 2, 3, 4, 5, 6, 7]
		let playerCount = FJSSSModel.getChairCount()
		switch (playerCount) {
			case 4:
				headPos = [0, 2, 4, 6]
				break;
			case 5:
				headPos = [0, 1, 3, 5, 7]
				break;
			case 6:
				headPos = [0, 1, 3, 4, 5, 7]
				break;
			case 7:
				headPos = [0, 1, 2, 3, 5, 6, 7]
				break;
		}
		this._userList.length = 0
		this._handCardList.length = 0

		for (let i = 0; i < headPos.length; i++) {
			let h = cc.find("head" + headPos[i], this.node)
			this._userList.push(h.getComponent("FJSSSHead"))
			this._userList[i].initRes()

			let handCard = cc.find("cards/hand" + headPos[i], this.node)
			this._handCardList.push(handCard.getComponent("FJSSSCardMgr"))
			this._handCardList[i].init(headPos[i])
		}
	},

	/**用户进入房间 */
	userEnterRoom(data) {
		if (data.chairID >= FJSSSModel.getChairCount() || data.playStatus == ApiRoom.playStatus.WATCH) {
			return
		}
		let idx = FJSSSModel.getUserChairIndex(data.chairID)
		let headcom = this._userList[idx]
		// console.log("初始化用户==", idx, headcom, data)
		if (headcom) {
			headcom.init(data)
		}
		let cardcom = this._handCardList[idx]
		cardcom && cardcom.setChairId(data.chairID)
	},

	/**恢复所有人的总输赢分数 */
	initTotalScore(userWinTotalScore) {
		if (userWinTotalScore && FJSSSModel.scoreState()) {
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
		if (data.chairID < FJSSSModel.getChairCount()) {
			let idx = FJSSSModel.getUserChairIndex(data.chairID)
			let headcom = this._userList[idx]
			if (headcom) {
				headcom.leave()
			}
		}
		if (data.uid == UserModel.getData('uid')) {
			if (!FJSSSModel.getRoomID() ||
				FJSSSModel.getRoomID() == data.roomID) {
				this.enterHall()
			}
		}
	},

	/**玩家准备 */
	onUserReady(data) {
		let idx = FJSSSModel.getUserChairIndex(data.chairID)
		let com = this._userList[idx]
		if (com) com.setReady(true)
		if (data.chairID == FJSSSModel.getMyChairID()) {
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
		MessageCallback.emitMessage('RemoveGameResult');
		this._yuYinShow();
		// console.log("更新局数==", data)
		FJSSSModel.setCurBureau(data.curBureau)
		this.txt_round.string = `局数:${data.curBureau}/${FJSSSModel.getMaxBureau()}`
		this.btn_invite.active = false
		this.btn_copy.active = false
		let myUserInfo = FJSSSModel.getUserByChairID(FJSSSModel.getMyChairID())
		this.btn_leave.active = (myUserInfo.chairID >= FJSSSModel.getChairCount())
		this.btn_dismiss.active = (!FJSSSModel.getGameRuleByKey("canNotDissmiss") && myUserInfo.chairID < FJSSSModel.getChairCount())
		this.resetTable()
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
		for (let i = 0; i < FJSSSModel.getChairCount(); i++) {
			let idx = FJSSSModel.getUserChairIndex(i)
			let hcom = this._handCardList[idx]
			if (hcom && FJSSSModel.getIsPlayingByChairID(i)) {
				hcom.setShowState(type)
			}
		}
	},

	/**游戏状态图更新 */
	onGameStatusUpdate(data) {
		// console.log("游戏状态==", data)
		this._gameStatus = data.gameStatus
		this.btn_ready.active = false
		this.btnBackHall.active = false
		this.hideReadyIcon()
		this.com_optBtn.reset()
		this.setClock(data)
		switch (this._gameStatus) {
			case ApiFjsss.gameStatus.ROB_BANK:
				this.com_optBtn.setRobBankerNode(true)
				break;
			case ApiFjsss.gameStatus.SHOW_CARD:
				this.setAllCardShowState(1)
				this.showOptCardDialog()
				AssetsManager.playEffect({
					path: "res/audio/start_poker",
					bundle: Enums.bundleType.FJSSS
				});
				break;
			case ApiFjsss.gameStatus.RESULT:
				this.setAllCardShowState(3)
				break;
			case ApiFjsss.gameStatus.NONE:
				this.resetTable()
				this.btn_ready.active = FJSSSModel.getMyChairID() < FJSSSModel.getChairCount()
				break;
			case ApiFjsss.gameStatus.START_GAME:
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
		let idx = FJSSSModel.getUserChairIndex(chairId)
		// console.log("获取到的座位号==", idx)
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
			let flycom = flyNode.addComponent('FJSSSCard')
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
		ani.getComponent("FJSSSAni").showSpineAni(type, callFunc)
	},

	/**展示洗牌界面 */
	showWashCard(data) {
		if (data.userIDList.includes(FJSSSModel.myUid)) {
			AssetsManager.createDialog({
				path: 'res/prefab/FJSSSQiePai',
				bundle: Enums.bundleType.FJSSS,
				countDown: data.time,
				parent: this.animationNode
			});
		}
	},

	/**发牌 */
	onSendCard(data, isAni = false) {
		let handCards = JSON.parse(JSON.stringify(data.handCards))
		let paibei = new Array(13).fill(60)
		for (const uid in handCards) {
			if (Object.hasOwnProperty.call(handCards, uid)) {
				let h = handCards[uid];
				let idx = this.getUserIdxByUid(uid)
				let hcom = this._handCardList[idx]
				if (h.length == 8) {
					if (idx == 0) {
						h.length = 13
						h.fill(60, 8, 13)
					} else {
						h = paibei
					}
					hcom && hcom.sendCards(h, isAni)
				} else {
					hcom && hcom.sendCards(paibei, isAni)
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
					bundle: Enums.bundleType.FJSSS
				});
			}
		}
	},

	/**更新庄家
	 * uid"859718"
		  userList:
	 */
	onBankerUpdate(data, isAni = false) {
		// console.log("更新庄家==", data)
		let bankerIdx = this.getUserIdxByUid(data.uid)
		let bankercom = this._userList[bankerIdx]
		if (!bankercom) {
			// console.log("没有找到庄家，uid=", data.uid)
			return
		}
		this._userList.forEach(ucom => {
			ucom.setRobScale()
			ucom.setBanker(false)
		});
		/**找到庄家的倍数 */
		let robScale = 1
		data.userList.forEach(u => {
			if (u.uid == data.uid) {
				robScale = u.robScale
			}
		});
		if (!isAni) {
			bankercom.setBanker(true)
			bankercom.setRobScale(robScale, false)
			return
		}
		let fly = () => {
			let bankerNode = bankercom.getBanker()
			let endpos = CCUtil.postionConvert(bankerNode, this.animationNode)
			let flyBanker = cc.instantiate(bankerNode)
			flyBanker.parent = this.animationNode
			flyBanker.setPosition(0, 0)
			flyBanker.active = true
			cc.tween(flyBanker).to(0.5, {
				position: endpos
			}).call(() => {
				flyBanker.destroy()
				bankercom.setBanker(true)
				bankercom.setRobScale(robScale, false)
			}).start()
		}
		if (data.userList && data.userList.length > 1) {
			/**播放抢庄动画 */
			let dt = 0
			for (let i = 0; i < data.userList.length; i++) {
				let idx1 = this.getUserIdxByUid(data.userList[i].uid);
				let ucom = this._userList[idx1]
				// console.log("播放了抢庄动画", idx1, ucom)
				if (ucom) {
					let light = ucom.getLight()
					light.stopAllActions()
					let cishu = 5
					let jiange = 1
					if (idx1 == bankerIdx) {
						cishu = 10
						jiange = 2
					}
					cc.tween(light).delay(dt).call(() => {
						light.active = true
						light.opacity = 255
					}).blink(jiange, cishu).call(() => {
						light.active = false
						if (idx1 == bankerIdx) {
							fly()
						}
					}).start()
				}
				dt += 0.2
			}
			AssetsManager.playEffect({
				path: "res/audio/main/rob",
				bundle: Enums.bundleType.FJSSS
			});
		} else {
			fly()
		}
	},

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
	showOptCardDialog() {
		/**旁观状态不显示 */
		if (!FJSSSModel.getSelfIsPlaying()) {
			return
		}
		let data = {
			handCards: FJSSSModel.getMyHandCard(),
			tick: FJSSSModel.tick,
			bundle: Enums.bundleType.FJSSS,
			path: 'res/prefab/FJSSSOptCardDialog',
			parent: this.sortCardNode
		}
		AssetsManager.createDialog(data)
	},

	/**删除操作界面 */
	delOptCardDialog() {
		AssetsManager.clearDialog(['FJSSSOptCardDialog']);
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

	/**结算比牌动画 完整*/
	showResCardAniAll(data) {
		let dt = 0 //总动画时间
		let bipaiDt = 1 //每道牌比牌间隔
		let teshupaiDt = 1.2 //特殊牌间隔
		let daqiangDt = 1.8 //每次打枪间隔
		let quanleidaDt = 3 //全垒打间隔

		let res = data.result
		let touSort = res.touSort
		let zhongSort = res.zhongSort
		let weiSort = res.weiSort

		let biPaiType = FJSSSModel.getGameRuleByKey("biPaiType")

		for (let i = 0; i < touSort.length; i++) {
			const info = touSort[i];
			let idx = this.getUserIdxByUid(info.uid)
			let hcom = this._handCardList[idx]
			if (hcom) {
				/**执行动画 */
				this.scheduleOnce(() => {
					hcom.showCards(res, 1, info.uid, true)
				}, dt)
				if (biPaiType == 1) {
					dt += bipaiDt
				}
			}
		}
		if (biPaiType == 2) {
			dt += bipaiDt
		}

		for (let i = 0; i < zhongSort.length; i++) {
			const info = zhongSort[i];
			let idx = this.getUserIdxByUid(info.uid)
			let hcom = this._handCardList[idx]
			if (hcom) {
				/**执行动画 */
				this.scheduleOnce(() => {
					hcom.showCards(res, 2, info.uid, true)
				}, dt)
				if (biPaiType == 1) {
					dt += bipaiDt
				}
			}
		}
		if (biPaiType == 2) {
			dt += bipaiDt
		}

		for (let i = 0; i < weiSort.length; i++) {
			const info = weiSort[i];
			let idx = this.getUserIdxByUid(info.uid)
			let hcom = this._handCardList[idx]
			if (hcom) {
				/**执行动画 */
				this.scheduleOnce(() => {
					hcom.showCards(res, 3, info.uid, true)
				}, dt)
				if (biPaiType == 1) {
					dt += bipaiDt
				}
			}
		}

		/**特殊牌型 */
		if (biPaiType == 2) {
			dt += bipaiDt
		}
		let teShuSort = res.teShuSort
		let isHaveTeshu = false
		for (let i = 0; i < teShuSort.length; i++) {
			const info = teShuSort[i];
			let idx = this.getUserIdxByUid(info.uid)
			let hcom = this._handCardList[idx]
			if (hcom) {
				/**执行动画 */
				this.scheduleOnce(() => {
					hcom.showCardsSpecial(res, info.uid, true)
				}, dt)
				if (biPaiType == 1) {
					dt += teshupaiDt
				}
				isHaveTeshu = true
			}
		}

		if (isHaveTeshu && biPaiType == 2) {
			dt += bipaiDt
		}
		/**打枪动画 */
		let daqiangArr = res.daqiangArr
		let showedList = [] //已经显示过的位置
		/**排序，全垒打放到最后面 */
		let qobj = null,
			qkey = null,
			paixuArr = [],
			jifen = FJSSSModel.getGameRuleByKey("jifen") //计分模式 1翻倍 2 +1
		for (const uid in daqiangArr) {
			const obj = daqiangArr[uid]
			let isq = false
			for (const key in obj) {
				const score = obj[key];
				if (score == 4 && jifen == 1 || score == 2 && jifen == 2) {
					qobj = obj
					qkey = uid
					isq = true
					break
				}
			}
			if (!isq) {
				let d = {
					uid: uid,
					dq: obj
				}
				paixuArr.push(d)
			}
		}
		if (qobj) {
			let d = {
				uid: qkey,
				dq: qobj
			}
			paixuArr.push(d)
		}

		// console.log("排序后====", paixuArr, daqiangArr)
		for (let i = 0; i < paixuArr.length; i++) {
			const obj = paixuArr[i];
			let idx1 = this.getUserIdxByUid(obj.uid)
			/**根据座位号找到node */
			let c1 = this._handCardList[idx1]
			// console.log("打枪的座位号", i, curNode, obj)
			let quanleida = false
			let dq = obj.dq //这个对象里面下标表示座位号，如果是正表示朝该座位打枪，如果是负数表示被该座位打枪
			for (const uid in dq) {
				if (Object.hasOwnProperty.call(dq, uid)) {
					const score = dq[uid];
					if (score == 4 && jifen == 1 || score == 2 && jifen == 2) {
						quanleida = true
					}
					if (score != 0 && uid != obj.uid && (score != -4 && jifen == 1 || score != -2 && jifen == 2)) {
						let tmp = [parseInt(obj.uid), parseInt(uid)]
						tmp.sort((a, b) => a - b)
						let str = tmp.join(",")
						/**判断已经显示过的位置不再显示 */
						if (!showedList.includes(str)) {
							/**找到打枪或者被打枪的node */
							let idx2 = this.getUserIdxByUid(uid)
							let o2 = this._handCardList[idx2]
							// console.log("被打枪的座位号", key, othNode, score)
							if (c1 && o2) {
								this.scheduleOnce(() => {
									if (score > 0) { //c打o
										c1.showDqAni(o2.node)
										o2.showBdqAni()
									} else if (score < 0) { //o打c
										o2.showDqAni(c1.node)
										c1.showBdqAni()
									}
								}, dt)
								dt += daqiangDt
							}
							showedList.push(str)
						}
					}
				}
			}
			/**全垒打 */
			if (quanleida) {
				// console.log("全垒打==", i)
				this.scheduleOnce(() => {
					this.showAni(2)
				}, dt)
				dt += quanleidaDt
			}
		}
		return dt
	},

	/**展示结算界面 */
	showResDialog(data) {
		let isLastRound = FJSSSModel.getCurBureau() == FJSSSModel.getMaxBureau()
		data.bundle = Enums.bundleType.FJSSS
		data.myChairID = this.myChairID
		data.isBureauFull = isLastRound
		data.mainDialog = this
		data.path = 'res/prefab/FJSSSResultDialog'
		data.isResult = true
		data.parent = this.littleResNode
		AssetsManager.createDialog(data);
	},

	/**游戏结算 */
	onGameResult(data) {
		/**删除操作界面 */
		this.delOptCardDialog()
		/**隐藏理牌状态和动态 */
		this._handCardList.forEach(com => {
			com.resetShowLayout()
		});

		let biPaiType = FJSSSModel.getGameRuleByKey("biPaiType")
		if (biPaiType != 3) {
			// let now = Date.now()
			this.showAni(3, () => {
				let dt = 0
				dt += this.showResCardAniAll(data)
				this.scheduleOnce(() => { // 显示结果
					/**动画结束后再改变用户分数 */
					this._userList.forEach(com => {
						com.setUserScoreAfterAni()
					})
					this.showResDialog(data)
				}, dt);
				this.scheduleOnce(() => {
					if (this.showAllResultFuc) {
						MessageCallback.emitMessage('RemoveGameResult');
						this.showAllResultFuc()
					}
				}, dt + 3)
			})
		} else {
			// ApiRoom.gameMessageNotify(ApiFjsss.gameStartTimeDelayNotify(1));
			this.showResDialog(data)
			this.scheduleOnce(() => {
				if (this.showAllResultFuc) {
					MessageCallback.emitMessage('RemoveGameResult');
					this.showAllResultFuc()
				}
			}, 1)
		}
	},

	onGift(fromChairID, toChairID, giftID) {
		let fidx = FJSSSModel.getUserChairIndex(fromChairID)
		let tidx = FJSSSModel.getUserChairIndex(toChairID)
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

	onBtnTest(data) {
		// let isInChair = true //FJSSSModel.getMyChairID() < FJSSSModel.getChairCount()
		// let tmp = UserModel.getData("isTest")
		// if (!tmp || !isInChair) {
		// 	return
		// }
		// AssetsManager.createDialog({
		// 	bundle: Enums.bundleType.FJSSS,
		// 	path: "res/prefab/FJSSSSelectTest",
		// 	mainDialog: this,
		// 	user: data
		// })
	},

	showTest() {
		let tmp = UserModel.getData("isTest")
		this.btn_shezhi.active = false //!!tmp
	},

	/**给没座位的人显示坐下按钮 */
	showSitDownButton() {
		let curBureau = FJSSSModel.getCurBureau();
		let maxBureau = FJSSSModel.getMaxBureau();
		let canEnter = FJSSSModel.getGameRuleByKey('canEnter') && maxBureau != curBureau;
		// (!!canEnter || curBureau == 0) &&
		this.btn_zuoxia.active = FJSSSModel.getMyChairID() >= FJSSSModel.getChairCount() &&
			(!!canEnter || curBureau == 0) &&
			FJSSSModel.checkHaveEmptySeat();
		this.img_guanzhan.active = FJSSSModel.getMyChairID() >= FJSSSModel.getChairCount();
	},

	/**坐下按钮响应 */
	onBtnSitDown() {
		/**检查是否还有空位，有就发送坐下命令 */
		let chairID = FJSSSModel.getCanSitDownChairID();
		let idx = FJSSSModel.getUserChairIndex(chairID)
		if (chairID == -1 || !this._userList[idx]) {
			AssetsManager.tipDialog('没有座位可以坐下！');
			return;
		}
		// console.log('找到座位坐下', chairID);
		ApiRoom.roomMessageNotify(ApiRoom.getUserChangeSeatNotify(FJSSSModel.getMyChairID(), chairID));
	},

	/**观战列表响应 */
	onLookOnClick() {

		let users = FJSSSModel.getLookOnUsers();
		if (users.length == 0) {
			AssetsManager.tipDialog('暂无观战玩家！');
			return;
		}
		AssetsManager.standDialog({
			users: users
		});
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
		// console.log("按钮响应==", event.target.name, event)
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
				if (!UserModel.isInRoom()) {
					this.enterHall();
					return;
				}
				ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
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
				if (CCUtil.clickInterval(event.target, 10, true)) return;
				AssetsManager.tipDialog('刷新界面可以修复游戏显示问题');
				this.getRoomSceneInfo()
				break;
			case "btn_setting": //设置
				this._onMenuCloseClick();
				AssetsManager.setDialog({
					type: "duoren",
					gameType: Enums.bundleType.FJSSS,
					musicType: Enums.bundleType.CIRCLE,
				});
				break;
			case "btn_review": //回看
				this._onMenuCloseClick();
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				ApiRoom.gameMessageNotify(ApiFjsss.gameReviewNotify());
				break;
			case "btn_msg": //聊天
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				let params = {
					gameRule: FJSSSModel.getGameRule(),
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
				let rule = FJSSSModel.getGameRule()
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
					chairCount: FJSSSModel.getChairCount(),
					fangzuobi: FJSSSModel.getGameRuleByKey('fangzuobi')
				})
				break;
			case "btn_deposit": //开始托管
				this._onMenuCloseClick();
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				ApiRoom.gameMessageNotify(ApiFjsss.gameTrushNotify(true));
				break;
			case "btn_quxiaotuoguan": //取消托管
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				ApiRoom.gameMessageNotify(ApiFjsss.gameTrushNotify(false));
				break;
			case "btn_invite": //邀请
				let gameRule = FJSSSModel.getGameRule()
				gameRule = gameRule || {};
				gameRule.roomId = FJSSSModel.getRoomID();
				let share = ConfigModel.getRoomRuleShare(gameRule);
				NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
				break;
			case "btn_copy": //复制
				let str = ConfigModel.getRoomShare(Enums.bundleType.FJSSS, FJSSSModel.getRoomID())
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
				// this.onBtnTest()
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
			gameRule: FJSSSModel.getGameRule(),
		})
	},


	/**消息监听 */
	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				// console.log('gameInit=============================', msg.data);
				this.gameInit(msg.data);
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				FJSSSModel.addUser(msg.data.roomUserInfo);
				this.userEnterRoom(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				if (msg.data.roomUserInfo.chairID != FJSSSModel.getMyChairID()) {
					FJSSSModel.delUser(msg.data.roomUserInfo.chairID);
				}
				this.userLeaveRoom(msg.data.roomUserInfo)
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				// console.log("收到了玩家准备==", msg.data)
				this.onUserReady(msg.data)
			} else if (msg.type === ApiRoom.GAME_END_PUSH) {
				// console.log("游戏结束《《《《《《《《《", msg)
			} else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
				if (!msg.data.userList || msg.data.userList.length == 0) return;
				msg.data.myChairID = FJSSSModel.getMyChairID();
				AssetsManager.disDialog(msg.data);
			} else if (msg.type === ApiRoom.USER_CHAT_PUSH) {
				let idx = FJSSSModel.getUserChairIndex(msg.data.chairID)
				let com = this._userList[idx]
				if (com) {
					com.gameChat(msg.data)
				}
			} else if (msg.type === ApiRoom.USER_GIFT_SEND_PUSH) {
				this.onGift(msg.data.fromChairID, msg.data.toChairID, msg.data.giftID);
			} else if (msg.type === ApiRoom.USER_VOICE_PUSH) {
				this._voiceMsgQueue.push(msg.data);
			} else if (msg.type === ApiRoom.USER_OFF_LINE_PUSH) {
				let idx = FJSSSModel.getUserChairIndex(msg.data.chairID)
				let com = this._userList[idx]
				if (com) com.setOffline(true)
			} else if (msg.type === ApiRoom.ROOM_USER_INFO_CHANGE_PUSH) { //用户信息刷新
				this._userList.forEach(com => {
					if (com) {
						com.userInfoChange(msg.data)
					}
				});
				FJSSSModel.userInfoChange(msg.data.changeInfo)
			} else if (msg.type === ApiRoom.ROOM_USER_WIN_TOTAL_PUSH) {
				/**玩家总输赢分数 */
				// console.log("玩家总输赢==", msg.data)
				this.initTotalScore(msg.data.userWinTotalScore)
			} else if (msg.type === ApiRoom.USER_GAME_STATUS_PUSH) {
				// console.log('玩家状态推送', msg.data)
				FJSSSModel.updateUserPlayStatus(msg.data.userPlayStatus);
			} else if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
				if (msg.data.code != 0) {
					if (msg.data.uid == UserModel.getData('uid')) {
						AssetsManager.tipDialog(Codes[msg.data.code]);
					}
					return;
				};
				FJSSSModel.setUserPropertyByUID(msg.data.uid, 'userStatus', msg.data.userStatus);
				FJSSSModel.setUserPropertyByUID(msg.data.uid, 'chairID', msg.data.toChairID);
				if (msg.data.uid == UserModel.getData('uid') && msg.data.toChairID >= FJSSSModel.getChairCount()) {
					//我自己被强制旁观
					this._userList[0].leave()
				}
				if (msg.data.toChairID < FJSSSModel.getChairCount()) {
					if (msg.data.uid == UserModel.getData('uid')) {
						this._userList.forEach(com => {
							com.leave()
						});
						this.getRoomSceneInfo()
					} else {
						/**重新刷新座位 */
						let user = FJSSSModel.getUserByChairID(msg.data.toChairID)
						this.userEnterRoom(user)
					}
				}
				//强制显示未入座的坐下按钮
				this.showSitDownButton();
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiFjsss.GAME_BUREAU_PUSH) {
				this.onGameRoundUpdate(msg.data)
			} else if (msg.type === ApiFjsss.GAME_STATUS_PUSH) { //游戏状态
				FJSSSModel.setGameStatus(msg.data)
				this.onGameStatusUpdate(msg.data)
			} else if (msg.type === ApiFjsss.GAME_SEND_CARDS_PUSH) { //发牌
				// console.log("发牌==", msg.data)
				FJSSSModel.setHandCards(msg.data.handCards)
				FJSSSModel.setTeShuType(msg.data.teShuType)
				FJSSSModel.setMaPai(msg.data.mapai)
				this.onSendCard(msg.data, true)
			} else if (msg.type === ApiFjsss.GAME_MA_PAI_PUSH) { //更新马牌
				this.showMaPai(msg.data.mapai, true)
			} else if (msg.type === ApiFjsss.GAME_ROB_BANK_PUSH) { //抢庄返回
				// console.log("个人抢庄返回", msg.data)
				this.onRobBanker(msg.data, true)
			} else if (msg.type === ApiFjsss.GAME_BANKER_PUSH) { //庄家位置更新
				this.onBankerUpdate(msg.data, true)
			} else if (msg.type === ApiFjsss.GAME_USER_POUR_SCORE_PUSH) { //玩家下分推送
				// console.log("下分推送==", msg.data)
				this.onPourScoreStart(msg.data)
			} else if (msg.type === ApiFjsss.GAME_USER_SCORE_PUSH) { //下注
				// console.log("下注结果==", msg.data)
				this.onPlayerBet(msg.data)
			} else if (msg.type === ApiFjsss.SHOW_CARDS_PUSH) { //亮牌结果
				// console.log("亮牌结果==", msg.data)
				FJSSSModel.setShowCardsUser(msg.data.cardsList)
				this.onShowCard(msg.data)
			} else if (msg.type === ApiFjsss.GAME_USER_WASH_CARD_PUSH) { //用户洗牌
				this.showWashCard(msg.data)
			} else if (msg.type === ApiFjsss.RE_SHOW_CARDS_ERROR) { //重新摆牌砖石不够
				this.delOptCardDialog()
				AssetsManager.tipDialog("重新摆牌失败,钻石不足")
			} else if (msg.type === ApiFjsss.GAME_END_PUSH) {
				if (msg.data.result.length > 0) {
					msg.data.enterHall = this.enterHall.bind(this);
					msg.data.path = 'res/prefab/FJSSSAllResult';
					msg.data.bundle = Enums.bundleType.FJSSS;
					msg.data.isUnionCreate = FJSSSModel.isUnionCreate();
					msg.data.unionID = FJSSSModel.getRoomCreatorByKey("unionID")
					msg.data.gameRule = FJSSSModel.getGameRule()
					msg.data.roomID = FJSSSModel.getRoomID()
					msg.data.parent = this.allResNode;
					this.showAllResultFuc = () => {
						this.showAllResultFuc = null
						this.unscheduleAllCallbacks();
						this.resetTable();
						AssetsManager.createDialog(msg.data);
					}
					this.scheduleOnce(() => {
						if (this.showAllResultFuc) {
							MessageCallback.emitMessage('RemoveGameResult');
							this.showAllResultFuc()
						}
					}, 2);
				} else {
					this.enterHall();
				}
			} else if (msg.type === ApiFjsss.GAME_REVIEW_PUSH) {
				let reviewRecord = msg.data.list
				if (reviewRecord && reviewRecord.length > 0) {
					AssetsManager.createDialog({
						bundle: Enums.bundleType.FJSSS,
						path: "res/prefab/FJSSSResultDialog",
						reviewRecord: reviewRecord,

					});
				} else {
					AssetsManager.tipDialog('没有数据');
				}
			} else if (msg.type === ApiFjsss.GAME_RESULT_PUSH) {
				this.onGameResult(msg.data)
			}
		} else if (route === 'ReconnectSuccess') {
			this.getRoomSceneInfo();
		} else if (route === 'SelfEntryRoomPush') {
			if (msg.gameType != FJSSSModel.getBundleType()) {
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
			this.onBtnTest(msg.data)
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