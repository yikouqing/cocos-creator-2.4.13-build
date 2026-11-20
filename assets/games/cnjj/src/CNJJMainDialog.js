const ApiCnjj = require('./ApiCnjj');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const SubManager = require('../../../src/utils/SubManager');
const UserModel = require('../../../src/model/UserModel');
const Utils = require('../../../src/utils/Utils');
const ApiHall = require('../../../src/api/ApiHall');
const AudioUtil = require('../../../src/utils/AudioUtil');
const ConfigModel = require('../../../src/model/ConfigModel');
const Codes = require('../../../src/const/Codes');
const CNJJModel = require("./CNJJModel")
const CCUtil = require("../../../src/utils/CCUtil")
const Events = require('../../../src/const/Events');

cc.Class({
	extends: cc.Component,

	properties: {
		com_optBtn: require("CNJJOpt"),
		txt_round: cc.Label,
		txt_roomId: cc.Label,
		txt_game: cc.Label,
		btn_location: cc.Node,
		btn_copy: cc.Node,
		btn_invite: cc.Node,
		btn_ready: cc.Node,
		btn_leave: cc.Node,
		btn_dismiss: cc.Node,
		btn_shezhi: cc.Node,
		btn_zuoxia: cc.Node,
		btn_back: cc.Node,
		img_guanzhan: cc.Node,
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
		headLeft: cc.Prefab,
		headRight: cc.Prefab,
		headSelf: cc.Prefab,
		handCardPfb: cc.Prefab,
		btnYuYin: cc.Node,
		canNotDismissBar: cc.Node,
		faPaiNode: cc.Node,

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
		AssetsManager.init(this.node.parent);

		cc.game.on(cc.game.EVENT_SHOW, this.onEventShow, this);
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
		MessageCallback.addListener(Events.clientEvents.gvUploadFileSuccess, this);
		/* 获取场景信息 */
		this.getRoomSceneInfo()
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

	onDestroy() {
		MessageCallback.removeListener(Events.clientEvents.gvUploadFileSuccess, this);
		cc.game.off(cc.game.EVENT_SHOW, this.onEventShow, this);
		cc.systemEvent.off("chongxinbaipai", this.showOptCardDialog, this)
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
		let isUnionCreate = CNJJModel.isUnionCreate();
		let unionID = !!isUnionCreate ? CNJJModel.getRoomCreatorByKey('unionID') : null;
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
	},
	_yuYinShow() {
		let isInSeat = CNJJModel.isInSeat();
		let yuyin = CNJJModel.getGameRuleByKey('yuyin');
		this.btnYuYin.active = isInSeat && !!yuyin && ConfigModel.getData('voiceSpeaker');
	},

	gameInit(data) {
		this.unscheduleAllCallbacks();
		CNJJModel.init(data)
		MessageCallback.emitMessage('RemoveGameResult');
		this.initHeadAndTiles()
		this.resetTable()
		this._gameStatus = data.gameData.gameStatus
		this.animationNode.removeAllChildren()
		AssetsManager.clearDialog(["CNJJBankerDialog", "CNJJCuoPai"])

		this._userList.forEach(com => {
			com.leave()
		});
		/**初始化用户信息 */
		let roomUserInfoArr = data.roomUserInfoArr
		let myUserInfo = null
		for (let i = 0; i < roomUserInfoArr.length; i++) {
			const user = roomUserInfoArr[i];
			this.userEnterRoom(user)
			if (user.chairID == CNJJModel.getMyChairID()) {
				myUserInfo = user
			}
		}
		this.initTotalScore(data.gameData.userWinTotalScore)

		/**按钮显示 */
		let maxPlayerCount = CNJJModel.getChairCount()
		this.btn_invite.active = !CNJJModel.gameStarted && !cc.sys.isBrowser && !!ConfigModel.getData('gameWechatInvite');
		this.btn_copy.active = !CNJJModel.gameStarted && !cc.sys.isBrowser && !!ConfigModel.getData('gameWechatInvite');
		this.btn_location.active = !!CNJJModel.getGameRuleByKey("showGps")
		this.btn_ready.active = !CNJJModel.gameStarted && myUserInfo.chairID < maxPlayerCount && this._gameStatus === ApiCnjj.gameStatus.NONE && myUserInfo.playStatus != ApiRoom.playStatus.READY
		this.btn_leave.active = (!CNJJModel.gameStarted || myUserInfo.chairID >= maxPlayerCount)
		this.btn_dismiss.active = (!CNJJModel.getGameRuleByKey("canNotDissmiss") && CNJJModel.gameStarted && myUserInfo.chairID < maxPlayerCount)
		this.btn_deposit.active = CNJJModel.getGameRuleByKey("canTrust");
		if (this.canNotDismissBar) this.canNotDismissBar.active = CNJJModel.getGameRuleByKey("canNotDissmiss");
		this.btn_back.active = !CNJJModel.gameStarted && CNJJModel.isUnionCreate() && myUserInfo.chairID < maxPlayerCount
		this.showSitDownButton()
		this._yuYinShow();

		/**房间号和局数 */
		this.txt_roomId.string = `房号:${data.roomID}`
		this.txt_round.string = `圈数:${CNJJModel.getCurBureau()}/${data.gameData.maxBureau}`
		this.txt_game.string = `游戏:${ConfigModel.getGameName(Enums.bundleType.CNJJ)}`;

		/**恢复桌面 */
		if (data.gameData.gameStarted) {
			this.setClock(data.gameData)
			/**设置庄家下注 */
			let score = data.gameData.guoBaseScore
			this.com_optBtn.setBetInfo(1, score)
			/**设置庄家标记 */
			let bidx = CNJJModel.getUserIndexByUID(CNJJModel.getBankerUid())
			let bcom = this._userList[bidx]
			bcom && bcom.setBetScore(score)
			//显示几门
			for (let i = 0; i < data.gameData.seatUser.length; i++) {
				const uid = data.gameData.seatUser[i];
				let idx = CNJJModel.getUserIndexByUID(uid)
				let com = this._userList[idx]
				com && com.setMen(i + 1)
			}
			/**恢复闲家下注 */
			let userPourList = data.gameData.userPourList
			let sum = 0
			let maiMaInfo = {}
			for (let i = 0; i < userPourList.length; i++) {
				const info = userPourList[i];
				if (!info.isWatch) {
					let idx = CNJJModel.getUserIndexByUID(info.uid)
					let com = this._userList[idx]
					com && com.setBetScore(info.score)
					sum += info.score
				} else {
					/**统计所有买马数据 */
					if (!maiMaInfo[info.watchUid]) {
						maiMaInfo[info.watchUid] = 0
					}
					maiMaInfo[info.watchUid] += info.score
				}
			}
			this.com_optBtn.setBetInfo(2, sum)
			// console.log("阿咪吗===", maiMaInfo)
			/**恢复买马数据 */
			for (const uid in maiMaInfo) {
				if (Object.hasOwnProperty.call(maiMaInfo, uid)) {
					const mScore = maiMaInfo[uid];
					let idx = CNJJModel.getUserIndexByUID(uid)
					let com = this._userList[idx]
					com && com.setMaiScore(mScore)
				}
			}
		}

		//进入房间提示准备时间
		if (this.btn_ready.active && !CNJJModel.gameStarted) {
			let t = CNJJModel.getGameRuleByKey("unReadyKick")
			if (t) {
				this.setClock({
					tick: t,
					totalTick: t
				})
			}
		}

		if (this._gameStatus == ApiCnjj.gameStatus.POUR_SCORE) {
			let userCanOperate = data.gameData.userCanOperate
			for (const uid in userCanOperate) {
				if (Object.hasOwnProperty.call(userCanOperate, uid)) {
					if (uid == CNJJModel.myUid) {
						const info = userCanOperate[uid];
						if (info.isFixScore) { //固定下注按钮
							this.com_optBtn.setBetOnlyNode(info.isFixScore)
						} else {
							this.com_optBtn.setBetBarNode(true)
						}
					}
				}
			}
			if (data.gameData.isCanMaiMa && myUserInfo.chairID >= maxPlayerCount &&
				data.gameData.userPourList.every(info => info.uid != CNJJModel.myUid)) {
				this.onPlayerOptStart({
					isWatch: true
				})
			}
		} else if (this._gameStatus == ApiCnjj.gameStatus.SEND_CARDS) {
			this.onSendCard(data.gameData)
		} else if (this._gameStatus == ApiCnjj.gameStatus.SHOW_CARDS) {
			if (!CNJJModel.isShowCard(CNJJModel.myUid) && CNJJModel.getSelfIsPlaying()) {
				this.com_optBtn.setHandleCardBtn(true)
			}
			this._userList.forEach(com => {
				let user = com.getUserData()
				if (user) {
					let uid = user.uid
					if (CNJJModel.isShowCard(uid)) {
						let info = data.gameData.showUserList.find(dd => dd.uid == uid)
						this.onShowCard(info)
					} else {
						let hand = CNJJModel.getHandCardByUid(uid)
						if (hand && hand.length > 0) {
							let idx = CNJJModel.getUserIndexByUID(uid)
							let hcom = this._handCardList[idx]
							hcom && hcom.sendCards([0, 0])
						}
					}
				}
			});
		} else if (this._gameStatus == ApiCnjj.gameStatus.BANKER_POUR) {
			if (data.gameData.guoBaseScore == 0 && CNJJModel.getBankerUid() == CNJJModel.myUid) {
				this.com_optBtn.setBetNode({
					minScore: data.gameData.minGuoSocre,
					maxScore: data.gameData.maxGuoScore,
				})
			}
		} else if (this._gameStatus == ApiCnjj.gameStatus.CHANGE_BANKER) {
			if (CNJJModel.getBankerUid() == CNJJModel.myUid) {
				let userCanOperate = data.gameData.userCanOperate[CNJJModel.getBankerUid()]
				if (userCanOperate) {
					AssetsManager.createDialog({
						bundle: Enums.bundleType.CNJJ,
						path: "res/prefab/CNJJBankerDialog",
						operateList: userCanOperate,
					})
				}
			}
		}
	},

	/**初始化头像和牌 */
	initHeadAndTiles() {
		if (this._userList.length > 0) {
			return
		}
		let headPos = [0, 1, 2, 3, 4, 5]
		let playerCount = CNJJModel.getChairCount()
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
			h.removeAllChildren()
			let headNode = null
			if (idx == 0) {
				headNode = cc.instantiate(this.headSelf)
			} else if (idx == 1 || idx == 2 || idx == 3) {
				headNode = cc.instantiate(this.headRight)
			} else {
				headNode = cc.instantiate(this.headLeft)
			}
			headNode.parent = h
			this._userList.push(headNode.getComponent("CNJJHead"))

			let c = cc.find("cards/hand" + idx, this.node)
			c.removeAllChildren()
			let cardNode = cc.instantiate(this.handCardPfb)
			cardNode.parent = c
			this._handCardList.push(cardNode.getComponent("CNJJCardMgr"))
			this._handCardList[i].init(idx)
			/**左右头像移动到中间 */
			if (playerCount <= 4 && (idx == 2 || idx == 4)) {
				h.y = 38
				c.y = 12
			}
		}
	},

	/**用户进入房间 */
	userEnterRoom(data) {
		if (data.chairID >= CNJJModel.getChairCount()) {
			return
		}
		let idx = CNJJModel.getUserIndexByChairID(data.chairID)
		let headcom = this._userList[idx]
		if (headcom) {
			headcom.init(data)
		}
		let cardcom = this._handCardList[idx]
		cardcom && cardcom.setChairId(data.chairID)
	},

	/**恢复所有人的总输赢分数 */
	initTotalScore(userWinTotalScore) {
		if (userWinTotalScore && CNJJModel.scoreState()) {
			let len = Object.keys(userWinTotalScore)
			if (len.length > 0) {
				for (const uid in userWinTotalScore) {
					if (Object.hasOwnProperty.call(userWinTotalScore, uid)) {
						const s = userWinTotalScore[uid];
						let idx = CNJJModel.getUserIndexByUID(uid)
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
		if (data.chairID < CNJJModel.getChairCount()) {
			let idx = CNJJModel.getUserIndexByChairID(data.chairID)
			let headcom = this._userList[idx]
			if (headcom) {
				headcom.leave()
			}
		}
		if (data.uid == UserModel.getData('uid')) {
			if (!CNJJModel.getRoomID() ||
				CNJJModel.getRoomID() == data.roomID) {
				this.enterHall()
			}
		}
	},

	/**玩家准备 */
	onUserReady(data) {
		let idx = CNJJModel.getUserIndexByChairID(data.chairID)
		let com = this._userList[idx]
		if (com) com.setReady(true)
		if (data.chairID == CNJJModel.getMyChairID()) {
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
		CNJJModel.setCurBureau(data.curBureau)
		this.txt_round.string = `圈数:${CNJJModel.getCurBureau()}/${CNJJModel.getMaxBureau()}`
		this.btn_invite.active = false
		this.btn_copy.active = false
		this.btn_back.active = false;
		let myUserInfo = CNJJModel.getUserByChairID(CNJJModel.getMyChairID())
		this.btn_leave.active = (myUserInfo.chairID >= CNJJModel.getChairCount())
		this.btn_dismiss.active = (!CNJJModel.getGameRuleByKey("canNotDissmiss") && myUserInfo.chairID < CNJJModel.getChairCount())
		this.resetTable();
	},

	setClock(data) {
		let str = ["", "正在切换庄家", "等待庄家选择堂底", "等待闲家下注", "发牌中..", "等待玩家亮牌", "结算中..", ""][this._gameStatus]
		let t = data.tick
		if (str == "" || data.totalTick == 0) {
			t = null
		}
		this.com_optBtn.setClock(t, str)
	},

	/**游戏状态图更新 */
	onGameStatusUpdate(data) {
		this._gameStatus = data.gameStatus
		this.btn_ready.active = false
		this.hideReadyIcon()
		this.com_optBtn.reset()
		this.setClock(data)
		if (this._gameStatus != ApiCnjj.gameStatus.CHANGE_BANKER) {
			AssetsManager.clearDialog(["CNJJBankerDialog"])
		}
		AssetsManager.clearDialog(["CNJJCuoPai", "CNJJMaiMa", "CNJJMaiMaResDialog"])
		switch (this._gameStatus) {
			case ApiCnjj.gameStatus.CHANGE_BANKER:
				this.resetTable()
				this.unscheduleAllCallbacks();
				break;
			case ApiCnjj.gameStatus.RESULT:

				break;
			case ApiCnjj.gameStatus.NONE:
				// this.btn_ready.active = CNJJModel.getSelfIsPlaying()
				this.com_optBtn.setBetInfo()
				this.resetTable()
				CNJJModel.reset()
				break;
			case ApiCnjj.gameStatus.POUR_SCORE:
				// if (CNJJModel.myUid != CNJJModel.getBankerUid()) {
				// 	this.com_optBtn.setBetBarNode(true)
				// }
				break;
			case ApiCnjj.gameStatus.SHOW_CARDS:
				this.com_optBtn.setHandleCardBtn(true)
				break;
			default:
				break;
		}
	},


	showAni(type, callFunc = null) {
		let ani = cc.instantiate(this.aniPfb)
		ani.parent = this.animationNode
		ani.getComponent("CNJJAni").showSpineAni(type, callFunc)
	},

	/**发牌 */
	onSendCard(data, isAni = false) {
		let handCards = Utils.deepCopy(data.handCards)
		for (const uid in handCards) {
			if (Object.hasOwnProperty.call(handCards, uid)) {
				let h = handCards[uid];
				let idx = CNJJModel.getUserIndexByUID(uid)
				let hcom = this._handCardList[idx]
				hcom && hcom.sendCards(h, isAni ? this.faPaiNode : null)
			}
		}
	},

	/**个人抢庄返回 
	 * 
	 */
	onRobBanker(data, isAni = false) {

	},

	/**更新庄家
	 * uid"859718"
		  userList:
	 */
	onBankerUpdate(data, isAni = false) {
		CNJJModel.setBankerUid(data.uid)
		let idx = CNJJModel.getUserIndexByUID(data.uid)
		for (let i = 0; i < this._userList.length; i++) {
			const com = this._userList[i];
			com.setBanker(idx == i)
		}
	},

	/**庄家下分推送，显示下注按钮
	 */
	onBankerBetStart(data) {
		// bankerUid:"313335"
		// maxScore:2000
		// minScore:1000
		// userList: ['223633']
		CNJJModel.setSeatUser(data.userList)
		if (data.bankerUid == CNJJModel.myUid) {
			this.com_optBtn.setBetNode(data)
		}
		this._userList.forEach(com => {
			com.setMen()
		});
		//显示几门
		for (let i = 0; i < data.userList.length; i++) {
			const uid = data.userList[i];
			let idx = CNJJModel.getUserIndexByUID(uid)
			let com = this._userList[idx]
			com && com.setMen(i + 1)
		}
	},

	/**庄家下底返回 */
	onBankerBet(data) {
		CNJJModel.setGuoDi(data.guoBaseScore)
		this.com_optBtn.setBetNode()
		this.com_optBtn.setBetInfo(1, data.guoBaseScore)
		let idx = CNJJModel.getUserIndexByUID(data.uid)
		let com = this._userList[idx]
		com && com.setBetScore(data.score, true)
	},

	onPlayerOptStart(data) {
		if (data.isWatch) { //买马
			AssetsManager.createDialog({
				bundle: Enums.bundleType.CNJJ,
				path: "res/prefab/CNJJMaiMa",
				mainDialog: this
			})
		} else { //下注
			if (data.isFixScore) { //固定下注按钮
				this.com_optBtn.setBetOnlyNode(data.isFixScore)
			} else {
				this.com_optBtn.setBetBarNode(true)
			}
		}
	},

	/**玩家下注返回
	 * uid,
	 score
	 */
	onPlayerBet(data) {
		if (data.uid == UserModel.getData("uid")) {
			this.com_optBtn.setBetBarNode()
			this.com_optBtn.setBetOnlyNode()
			AssetsManager.clearDialog(["CNJJMaiMa"])
			if (data.isWatch) {
				AssetsManager.tipDialog("买马成功")
			}
		}
		if (data.isWatch) { //展示买马的分数
			let watchUid = data.watchUid
			let widx = CNJJModel.getUserIndexByUID(watchUid)
			let sum = 0
			for (let i = 0; i < data.userPourList.length; i++) {
				const info = data.userPourList[i];
				if (info.watchUid == watchUid) {
					sum += info.score
				}
			}
			let com = this._userList[widx]
			if (com) com.setMaiScore(sum)
		}
		let idx = CNJJModel.getUserIndexByUID(data.uid)
		let ucom = this._userList[idx]
		if (ucom) {
			if (!data.isWatch) {
				ucom.setBetScore(data.score, true)
				let userPourList = data.userPourList
				let sum = 0
				userPourList.forEach(info => {
					if (!info.isWatch) {
						sum += info.score
					}
				});
				this.com_optBtn.setBetInfo(2, sum)
			}
		}
	},

	/**显示操作界面 */
	showOptCardDialog(isAni = false) {
		/**旁观状态不显示 */
		if (!CNJJModel.getSelfIsPlaying()) {
			return
		}
		let data = {
			autoCards: CNJJModel.getAutoCards(),
			handCards: CNJJModel.getMyHandCard(),
			tick: CNJJModel.tick,
			bundle: Enums.bundleType.CNJJ,
			path: 'res/prefab/CNJJOptCardDialog',
			parent: this.sortCardNode,
			isAni: isAni,
		}
		AssetsManager.createDialog(data)
	},


	/**亮牌结果 */
	onShowCard(data, isAni = false) {
		CNJJModel.addShowCardInfo(data)
		let idx = CNJJModel.getUserIndexByUID(data.uid)
		let hcom = this._handCardList[idx]
		if (hcom) {
			hcom.showCard(data, isAni)
		}
	},

	/**展示结算界面 */
	showResDialog(data) {
		let isLastRound = CNJJModel.getCurBureau() == CNJJModel.getMaxBureau()
		data.bundle = Enums.bundleType.CNJJ
		data.myChairID = this.myChairID
		data.isBureauFull = isLastRound
		data.mainDialog = this
		data.path = 'res/prefab/CNJJResultDialog'
		data.isResult = true
		data.parent = this.littleResNode
		AssetsManager.createDialog(data);
	},

	/**游戏结算 */
	onGameResult(data) {
		let res = data.result
		let dt = 0
		res.forEach(info => {
			if (info.chairID < CNJJModel.getChairCount()) {
				info.cardsList = info.userCards
				let idx = CNJJModel.getUserIndexByUID(info.uid)
				let hcom = this._handCardList[idx]
				if (hcom) { //需要判断是否已经亮过牌了
					let isShow = CNJJModel.isShowCard(info.uid)
					hcom.showCard(info, !isShow)
					if (!isShow) {
						dt = 1
					}
				}
			}
		});

		/**展示买卖输赢 */
		let myMaima = res.find(info => info.uid == CNJJModel.myUid && info.chairID >= CNJJModel.getChairCount())
		if (myMaima) {
			AssetsManager.createDialog({
				bundle: Enums.bundleType.CNJJ,
				path: "res/prefab/CNJJMaiMaResDialog",
				resData: data
			})
		}

		/**飞金币 */
		this.scheduleOnce(() => {
			let bankerIdx = CNJJModel.getUserIndexByUID(CNJJModel.getBankerUid())
			let bankerCom = this._userList[bankerIdx]
			let winList = []
			let loseList = []
			res.forEach(info => {
				let i = CNJJModel.getUserIndexByUID(info.uid)
				if (i != bankerIdx && info.chairID < CNJJModel.getChairCount()) {
					if (info.winScores > 0) {
						winList.push(i)
					} else if (info.winScores < 0) {
						loseList.push(i)
					}
				}
				let com = this._userList[i]
				if (com) {
					com.setMen()
				}
			});

			let icon = bankerCom.getGoldIcon()
			let flygold = (s_pos, e_pos) => {
				AssetsManager.playEffect({
					path: 'res/audio/fly_gold',
					bundle: Enums.bundleType.CNJJ
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
		}, dt)
		dt += 0.8
		this.scheduleOnce(() => {
			res.forEach(info => {
				if (info && info.chairID < CNJJModel.getChairCount()) {
					let idx = CNJJModel.getUserIndexByUID(info.uid)
					let com = this._userList[idx]
					if (com) com.setUserScoreAfterAni(info.winScores)
				}
			})
		}, dt)
	},

	onGift(fromChairID, toChairID, giftID) {
		let fidx = CNJJModel.getUserIndexByChairID(fromChairID)
		let tidx = CNJJModel.getUserIndexByChairID(toChairID)
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
		let jushu = CNJJModel.getCurBureau()
		let pGuan = CNJJModel.getSelfIsPlaying()
		let tmp = UserModel.getData("isTest")
		if (!tmp || jushu <= 0 || !pGuan) {
			return
		}
		AssetsManager.createDialog({
			bundle: Enums.bundleType.CNJJ,
			path: "res/prefab/CNJJSelectTest",
			mainDialog: this
		})
	},

	showTest() {
		let tmp = UserModel.getData("isTest")
		this.btn_shezhi.active = false //!!tmp
	},

	/**给没座位的人显示坐下按钮 */
	showSitDownButton() {
		// let curBureau = CNJJModel.getCurBureau();
		// let maxBureau = CNJJModel.getMaxBureau();
		let canEnter = CNJJModel.getGameRuleByKey('canEnter') // && maxBureau != curBureau;

		this.btn_zuoxia.active = CNJJModel.getMyChairID() >= CNJJModel.getChairCount() &&
			(!!canEnter || curBureau == 0) &&
			CNJJModel.checkHaveEmptySeat();
		this.img_guanzhan.active = CNJJModel.getMyChairID() >= CNJJModel.getChairCount();
	},

	/**坐下按钮响应 */
	onBtnSitDown() {
		/**检查是否还有空位，有就发送坐下命令 */
		let chairID = CNJJModel.getCanSitDownChairID();
		let idx = CNJJModel.getUserIndexByChairID(chairID)
		if (chairID == -1 || !this._userList[idx]) {
			AssetsManager.tipDialog('没有座位可以坐下！');
			return;
		}
		/**检测是否已经买过马了 */
		if (CNJJModel.getSelfIsMaiMa()) {
			AssetsManager.tipDialog('您当局已经买马，无法坐下！');
			return
		}

		ApiRoom.roomMessageNotify(ApiRoom.getUserChangeSeatNotify(CNJJModel.getMyChairID(), chairID));
	},

	/**观战列表响应 */
	onLookOnClick() {
		let users = CNJJModel.getLookOnUsers();
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
		if (CNJJModel.gameStarted && CNJJModel.getMyChairID() < CNJJModel.getChairCount()) {
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
		// console.log("动画的1==", this.menuLayList.x, this.menuLayList.y)
		cc.tween(this.menuLayList)
			.to(0.5, {
				opacity: 255,
				position: cc.v3(this._roomsLayPos.show)
			}, {
				easing: 'sineOut'
			})
			.call(() => {
				// console.log("动画的2==", this.menuLayList.x, this.menuLayList.y, this.menuLayList.scale, this.menuLayList.opacity, this.menuLayList.active)
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
				this._onMenuOpen()
				break;
			case "menu": //关闭菜单
				this._onMenuCloseClick()
				break
			case "btn_leave": //离开房间
				this._onLeaveClick();
				break;
			case "btn_ready": //准备
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify(true));
				this.btn_ready.active = false
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
				if (CCUtil.clickInterval(event.target, 10, true)) {
					return;
				}
				AssetsManager.tipDialog('刷新界面可以修复游戏显示问题');
				this.getRoomSceneInfo()
				break;
			case "btn_setting": //设置
				AssetsManager.setDialog({
					type: "duoren",
					gameType: Enums.bundleType.CNJJ,
				});
				break;
			case "btn_review": //回看
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				ApiRoom.gameMessageNotify(ApiCnjj.gameReviewNotify());
				break;
			case "btn_msg": //聊天
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				let params = {
					gameRule: CNJJModel.getGameRule(),
					chat: (chat) => {
						ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
					}
				}
				AssetsManager.chatDialog(params);
				break;
			case "btn_roomInfo": //规则
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				let rule = CNJJModel.getGameRule()
				if (!rule) {
					return
				}
				AssetsManager.tableDialog({
					gameRule: rule
				});
				break;
			case "btn_location": //定位
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
					chairCount: CNJJModel.getChairCount(),
					fangzuobi: CNJJModel.getGameRuleByKey('fangzuobi')
				})
				break;
			case "btn_deposit": //开始托管
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				ApiRoom.gameMessageNotify(ApiCnjj.gameTrushNotify(true));
				break;
			case "btn_quxiaotuoguan": //取消托管
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				ApiRoom.gameMessageNotify(ApiCnjj.gameTrushNotify(false));
				break;
			case "btn_invite": //邀请
				let gameRule = CNJJModel.getGameRule()
				gameRule = gameRule || {};
				gameRule.roomId = CNJJModel.getRoomID();
				let share = ConfigModel.getRoomRuleShare(gameRule);
				NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
				break;
			case "btn_copy": //复制
				let str = ConfigModel.getRoomShare(Enums.bundleType.CNJJ, CNJJModel.getRoomID())
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
			gameRule: CNJJModel.getGameRule(),
		})
	},


	/**消息监听 */
	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				// console.log("初始化================================", msg.data)
				this.gameInit(msg.data);
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				// console.log("用户进入房间==", msg.data)
				CNJJModel.addUser(msg.data.roomUserInfo);
				this.userEnterRoom(msg.data.roomUserInfo);
				this.showSitDownButton();
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				if (msg.data.roomUserInfo.uid != CNJJModel.myUid) {
					CNJJModel.delUser(msg.data.roomUserInfo.uid);
				}
				this.userLeaveRoom(msg.data.roomUserInfo)
				this.showSitDownButton();
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				this.onUserReady(msg.data)
			} else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
				if (!msg.data.userList || msg.data.userList.length == 0) return;
				msg.data.myChairID = CNJJModel.getMyChairID();
				AssetsManager.disDialog(msg.data);
			} else if (msg.type === ApiRoom.USER_CHAT_PUSH) {
				let idx = CNJJModel.getUserIndexByChairID(msg.data.chairID)
				let com = this._userList[idx]
				if (com) {
					com.gameChat(msg.data)
				}
			} else if (msg.type === ApiRoom.USER_GIFT_SEND_PUSH) {
				this.onGift(msg.data.fromChairID, msg.data.toChairID, msg.data.giftID);
			} else if (msg.type === ApiRoom.USER_VOICE_PUSH) {
				this._voiceMsgQueue.push(msg.data);
			} else if (msg.type === ApiRoom.USER_OFF_LINE_PUSH) {
				let idx = CNJJModel.getUserIndexByChairID(msg.data.chairID)
				let com = this._userList[idx]
				if (com) com.setOffline(true)
			} else if (msg.type === ApiRoom.ROOM_USER_INFO_CHANGE_PUSH) { //用户信息刷新
				// console.log("用户信息刷新", msg.data)
				CNJJModel.userInfoChange(msg.data)
				this._userList.forEach(com => {
					if (com) {
						com.userInfoChange(msg.data)
					}
				});
			} else if (msg.type === ApiRoom.ROOM_USER_WIN_TOTAL_PUSH) {
				/**玩家总输赢分数 */
				this.initTotalScore(msg.data.userWinTotalScore)
			} else if (msg.type === ApiRoom.USER_GAME_STATUS_PUSH) {
				CNJJModel.updateUserPlayStatus(msg.data.userPlayStatus);
			} else if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
				if (msg.data.code != 0) {
					if (msg.data.uid == UserModel.getData('uid')) {
						AssetsManager.tipDialog(Codes[msg.data.code]);
					}
					return;
				};
				CNJJModel.setUserPropertyByUID(msg.data.uid, 'userStatus', msg.data.userStatus);
				CNJJModel.setUserPropertyByUID(msg.data.uid, 'chairID', msg.data.toChairID);
				if (msg.data.uid == UserModel.getData('uid') && msg.data.toChairID >= CNJJModel.getChairCount()) {
					//我自己被强制旁观
					this._userList[0].leave()
				}
				if (msg.data.toChairID < CNJJModel.getChairCount()) {
					if (msg.data.uid == UserModel.getData('uid')) {
						this._userList.forEach(com => {
							com.leave()
						});

						this.getRoomSceneInfo()
					} else {
						/**重新刷新座位 */
						let user = CNJJModel.getUserByChairID(msg.data.toChairID)
						this.userEnterRoom(user)
					}
				}
				//强制显示未入座的坐下按钮
				this.showSitDownButton();
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiCnjj.GAME_BUREAU_PUSH) {
				CNJJModel.gameStarted = true
				this.onGameRoundUpdate(msg.data)
			} else if (msg.type === ApiCnjj.GAME_STATUS_PUSH) { //游戏状态
				// console.log("游戏状态===", msg.data)
				CNJJModel.setGameStatus(msg.data)
				this.onGameStatusUpdate(msg.data)
			} else if (msg.type === ApiCnjj.GAME_SEND_CARDS_PUSH) { //发牌
				// console.log("发牌===", msg.data)
				CNJJModel.setHandCards(msg.data.handCards)
				this.onSendCard(msg.data, true)
			} else if (msg.type === ApiCnjj.GAME_BANKER_PUSH) { //庄家位置更新
				// console.log("庄家位置更新==", msg.data)
				this.onBankerUpdate(msg.data, true)
			} else if (msg.type === ApiCnjj.GAME_BANKER_OPERATE_CHOOSE_PUSH) {
				// console.log("通知玩家是否换庄", msg.data)
				if (msg.data.uid == CNJJModel.myUid) {
					let operateList = msg.data.operateList
					AssetsManager.createDialog({
						bundle: Enums.bundleType.CNJJ,
						path: "res/prefab/CNJJBankerDialog",
						operateList
					})
				}
			} else if (msg.type === ApiCnjj.GAME_BANKER_CHOOSE_PUSH) { //庄家换庄返回
				// console.log("庄家换庄返回===", msg.data)

			} else if (msg.type === ApiCnjj.GAME_BANKER_OPERATE_START_PUSH) { //通知庄家开始下底
				// console.log("通知庄家开始下底==", msg.data)
				this.onBankerBetStart(msg.data)
			} else if (msg.type === ApiCnjj.GAME_USER_OPERATE_START_PUSH) { //通知玩家操作
				// console.log("通知玩家操作==", msg.data)
				this.onPlayerOptStart(msg.data)
			} else if (msg.type === ApiCnjj.GAME_BANKER_OPERATE_PUSH) { //庄家下底返回
				// console.log("庄家下底返回==", msg.data)
				this.onBankerBet(msg.data)
			} else if (msg.type === ApiCnjj.GAME_USER_OPERATE_PUSH) { //玩家下注返回
				// console.log("玩家下注返回==", msg.data)
				CNJJModel.setPourList(msg.data.userPourList)
				this.onPlayerBet(msg.data)
			} else if (msg.type === ApiCnjj.GAME_SHOW_CARDS_PUSH) { //亮牌结果
				// console.log("亮牌结果==", msg.data)
				this.onShowCard(msg.data, true)
			} else if (msg.type === ApiCnjj.GAME_END_PUSH) {
				// console.log("总结算===", msg.data)
				if (msg.data.result.length > 0) {
					msg.data.enterHall = this.enterHall.bind(this);
					msg.data.path = 'res/prefab/CNJJAllResult';
					msg.data.bundle = Enums.bundleType.CNJJ;
					msg.data.isUnionCreate = CNJJModel.isUnionCreate();
					msg.data.isBureauFull = (CNJJModel.getCurBureau() == CNJJModel.getMaxBureau());
					msg.data.unionID = CNJJModel.getRoomCreatorByKey("unionID")
					msg.data.gameRule = CNJJModel.getGameRule()
					msg.data.roomID = CNJJModel.getRoomID()
					msg.data.parent = this.allResNode
					this.showAllResultFuc = () => {
						AssetsManager.clearDialog(["CNJJCuoPai", "CNJJMaiMa", "CNJJMaiMaResDialog", "CNJJBankerDialog"])
						this.showAllResultFuc = null
						this.unscheduleAllCallbacks();
						this.resetTable();
						if (!AssetsManager.checkDialog("res/prefab/CNJJAllResult"))
							AssetsManager.createDialog(msg.data);
					}
					this.scheduleOnce(() => {
						this.showAllResultFuc && this.showAllResultFuc();
					}, 2);
				} else {
					this.enterHall();
				}
			} else if (msg.type === ApiCnjj.GAME_REVIEW_PUSH) {
				// console.log("回看==", msg.data)
				let reviewRecord = msg.data.list
				if (reviewRecord && reviewRecord.length > 0) {
					AssetsManager.createDialog({
						bundle: Enums.bundleType.CNJJ,
						path: "res/prefab/CNJJReview",
						reviewRecord: reviewRecord,

					});
				} else {
					AssetsManager.tipDialog('没有数据');
				}
			} else if (msg.type === ApiCnjj.GAME_RESULT_PUSH) {
				// console.log("小结算===", msg.data)
				this.onGameResult(msg.data)
			}
		} else if (route === 'ReconnectSuccess') {
			this.getRoomSceneInfo();
		} else if (route === 'SelfEntryRoomPush') {
			if (msg.gameType != CNJJModel.getBundleType()) {
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