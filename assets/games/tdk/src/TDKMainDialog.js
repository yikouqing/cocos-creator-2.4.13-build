const ApiTdk = require('./ApiTdk');
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
const TDKModel = require("./TDKModel")
const CCUtil = require("../../../src/utils/CCUtil")
const Events = require('../../../src/const/Events');

cc.Class({
	extends: cc.Component,

	properties: {
		com_optBtn: require("TDKOpt"),
		txt_round: cc.Label,
		txt_roomId: cc.Label,
		txt_gameName: cc.Label,
		txt_allbet: cc.Label,
		btn_location: cc.Node,
		btn_copy: cc.Node,
		btn_invite: cc.Node,
		btn_ready: cc.Node,
		btn_leave: cc.Node,
		btn_dismiss: cc.Node,
		btn_shezhi: cc.Node,
		btn_zuoxia: cc.Node,
		menuLay: cc.Node,
		menuLayList: cc.Node,
		tuoguan: cc.Node,
		btn_deposit: cc.Node,
		animationNode: cc.Node,
		languoAni: cc.Node,
		languoIcon: cc.Node,
		btnBackHall: cc.Node,
		btnYuYin: cc.Node,
		btnAniList: [cc.Node],
		canNotDismissBar: cc.Node,

		_aniX: 0,
		/**用户脚本列表 下标为本地座位号*/
		_userList: [],
		/**手牌脚本列表 */
		_handCardList: [],
		/**游戏状态 */
		_gameStatus: 0,
		/**当前发牌的牌堆下标 */
		_sendCardIdx: 0,
		/**当前正在飞的所有牌 */
		_allFlyNode: [],
	},

	onLoad() {
		AssetsManager.init(this.node.parent);
		// 菜单点击
		this.menuLay.active = false;
		cc.game.on(cc.game.EVENT_SHOW, this.onEventShow, this);
		MessageCallback.addListener(Events.clientEvents.gvUploadFileSuccess, this);
		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
		MessageCallback.addListener('UpdateGameCardBg', this);
		MessageCallback.addListener('SelfEntryRoomPush', this);
		MessageCallback.addListener('CreateRoomFail', this);
		MessageCallback.addListener('QuickJoinFail', this);
		MessageCallback.addListener('JoinGameAgainPush', this);
		MessageCallback.addListener('TestClickReq', this)
		/* 获取场景信息 */
		this.getRoomSceneInfo()
		// this.initHeadAndTiles()
		// this.scheduleOnce(() => {
		// 	for (let i = 0; i < 100; i++) {
		// 		this.com_optBtn.flyChips(2, this._userList[0].node)
		// 	}
		// }, 1)
		// this.scheduleOnce(() => {
		// 	for (let i = 0; i < 100; i++) {
		// 		this.com_optBtn.flyChips(2, null, this._userList[0].node, true)
		// 	}
		// }, 3)
		// this.scheduleOnce(() => {
		// 	this._handCardList.forEach(com => {
		// 		com.sendCard([5, 8, 3], true, this.animationNode)
		// 	});
		// }, 0.5)
		// this.scheduleOnce(() => {
		// 	this._handCardList[1].sendCard(6, true, this.animationNode)
		// }, 3)
	},

	onDestroy() {
		cc.game.off(cc.game.EVENT_SHOW, this.onEventShow, this);
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
		let isUnionCreate = TDKModel.isUnionCreate();
		let unionID = !!isUnionCreate ? TDKModel.getRoomCreatorByKey('unionID') : null;
		SubManager.exitBundle(unionID);
	},

	resetTable() {
		this._userList.forEach(com => {
			com.reset()
		});
		this._handCardList.forEach(com => {
			com.reset()
		});
	},

	_yuYinShow() {
		let isInSeat = TDKModel.isInSeat();
		let yuyin = TDKModel.getGameRuleByKey('yuyin');
		this.btnYuYin.active = !!isInSeat && !!yuyin && ConfigModel.getData('voiceSpeaker');
	},

	gameInit(data) {
		this.txt_allbet.string = ""
		TDKModel.init(data)
		this.com_optBtn.gameInit()
		MessageCallback.emitMessage('RemoveGameResult');
		this.resetTable()
		this._gameStatus = data.gameData.gameStatus
		this.animationNode.removeAllChildren()
		this.initHeadAndTiles()
		this._userList.forEach(com => {
			com.leave()
		});
		/**初始化用户信息 */
		let roomUserInfoArr = data.roomUserInfoArr
		let myUserInfo = null
		for (let i = 0; i < roomUserInfoArr.length; i++) {
			const user = roomUserInfoArr[i];
			this.userEnterRoom(user)
			if (user.chairID == TDKModel.getMyChairID()) {
				myUserInfo = user
			}
		}
		this.initTotalScore(data.gameData.userWinTotalScore)

		/**按钮显示 */
		let maxPlayerCount = TDKModel.getChairCount()
		let unionID = TDKModel.isUnionCreate() ? TDKModel.getRoomCreatorByKey('unionID') : null;
		let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
		this.btn_invite.active = TDKModel.getCurBureau() == 0 && !!isShowInvite;
		this.btn_copy.active = TDKModel.getCurBureau() == 0 && !!isShowInvite;
		this.btn_location.active = !!TDKModel.getGameRuleByKey("showGps")
		this.btn_ready.active = (myUserInfo.chairID < maxPlayerCount && this._gameStatus === ApiTdk.gameStatus.NONE && myUserInfo && myUserInfo.playStatus != ApiRoom.playStatus.READY)
		this.btn_leave.active = (data.gameData.curBureau == 0 || myUserInfo.chairID >= maxPlayerCount)
		this.btn_dismiss.active = (data.gameData.curBureau != 0 && myUserInfo.chairID < maxPlayerCount && !TDKModel.getGameRuleByKey("canNotDissmiss"))
		this.btn_deposit.active = TDKModel.getGameRuleByKey("canTrust")
		this.showSitDownButton()
		let myUid = UserModel.getData("uid")
		this.btnBackHall.active = data.gameData.curBureau == 0 && TDKModel.isUnionCreate();
		this._yuYinShow();
		/**房间号和局数 */
		this.txt_roomId.string = `房号:${data.roomID}`
		this.txt_round.string = `局数:${data.gameData.curBureau}/${data.gameData.maxBureau}`
		let gameName = ConfigModel.getBundleConfig(data.gameRule.gameType)
		this.txt_gameName.string = `游戏:${gameName.name}`;
		if (this.canNotDismissBar) this.canNotDismissBar.active = TDKModel.getGameRuleByKey("canNotDissmiss");
		/**恢复桌面 */
		if (data.gameData.gameStarted) {
			this.delAllFlyNode()
		}

		if (data.gameData.gameStarted) {
			/**恢复手牌 */
			this.onSendCard(data.gameData, false, true)
			/**恢复下注 */
			this.onPlayerBet(data.gameData)
			/**恢复按钮和时间*/
			let optData = {
				operateList: data.gameData.operateList,
				uid: data.gameData.curOperateUid,
				tick: data.gameData.tick,
				score: data.gameData.curScore,
			}
			this.onPourScoreStart(optData)
			/**恢复奖池 */
			let userPourScoreList = data.gameData.userPourScoreList
			if (userPourScoreList && userPourScoreList.length > 0) {
				userPourScoreList.forEach(betInfo => {
					let dd = {
						operateInfo: betInfo
					}
					this.onPlayerOpt(dd, false, true)
				});
			}
			/**恢复已经开牌 */
			let userEndCards = data.gameData.userEndCards
			if (userEndCards && userEndCards.length > 0) {
				userEndCards.forEach(endData => {
					let idx = this.getUserIdxByUid(endData.uid)
					let hcom = this._handCardList[idx]
					if (hcom) {
						hcom.showCard(endData.cards)
					}
				});
			}
			/**恢复弃牌标记 */
			let userOperateStatus = data.gameData.userOperateStatus
			if (userOperateStatus) {
				for (const uid in userOperateStatus) {
					if (Object.hasOwnProperty.call(userOperateStatus, uid)) {
						const optStatus = userOperateStatus[uid];
						if (optStatus == ApiTdk.operateType.CANCEL) {
							let idx = this.getUserIdxByUid(uid)
							let hcom = this._handCardList[idx]
							if (hcom) {
								hcom.onKouPai()
							}
						}
					}
				}
			}
			/**如果在亮牌状态 显示亮牌按钮和时间 */
			if (this._gameStatus == ApiTdk.gameStatus.SHOW_CARDS) {
				if (TDKModel.getSelfIsPlaying() && !TDKModel.getIsKouPai(myUid) && !TDKModel.getIsShowCard(myUid)) {
					this.handleResult(data.gameData.tick)
				}
			}
		}
		this.showTest()
	},

	/**初始化头像和牌 */
	initHeadAndTiles() {
		let headPos = [0, 1, 2, 4, 5]
		let maxPlayerCount = TDKModel.getChairCount()
		if (maxPlayerCount == 2) {
			headPos = [0, 3]
		} else if (maxPlayerCount == 3) {
			headPos = [0, 2, 3]
		} else if (maxPlayerCount == 4) {
			headPos = [0, 1, 3, 5]
		}
		this._userList.length = 0
		this._handCardList.length = 0

		for (let i = 0; i < headPos.length; i++) {
			let h = cc.find("head" + headPos[i], this.node)
			this._userList.push(h.getComponent("TDKHead"))
			this._userList[i].initRes()

			let handCard = cc.find("cards/hand" + headPos[i], this.node)
			this._handCardList.push(handCard.getComponent("TDKCardMgr"))
			this._handCardList[i].init(headPos[i])
		}
	},

	/**用户进入房间 */
	userEnterRoom(data) {
		if (data.chairID >= TDKModel.getChairCount() || data.playStatus == ApiRoom.playStatus.WATCH) {
			return
		}
		let idx = TDKModel.getUserChairIndex(data.chairID)
		let headcom = this._userList[idx]
		// console.log("初始化用户==", idx, headcom, data)
		if (headcom) {
			headcom.init(data)
		}
	},

	/**恢复所有人的总输赢分数 */
	initTotalScore(userWinTotalScore) {
		if (userWinTotalScore && TDKModel.scoreState()) {
			userWinTotalScore = userWinTotalScore || {};
			let keys = Object.keys(userWinTotalScore);
			if (keys.length > 0) {
				for (const uid in userWinTotalScore) {
					const s = userWinTotalScore[uid];
					let idx = this.getUserIdxByUid(uid)
					let com = this._userList[idx]
					if (com) com.setTotalScore(s);
				}
			} else {
				this._userList.forEach((user) => {
					user.setTotalScore(0);
				})
			}
		}
	},

	/**用户离开房间 */
	userLeaveRoom(data) {
		if (data.chairID < TDKModel.getChairCount()) {
			let idx = TDKModel.getUserChairIndex(data.chairID)
			let headcom = this._userList[idx]
			if (headcom) {
				headcom.leave()
			}
		}
		if (data.uid == UserModel.getData('uid')) {
			if (!TDKModel.getRoomID() ||
				TDKModel.getRoomID() == data.roomID) {
				this.enterHall()
			}
		}
	},

	/**玩家准备 */
	onUserReady(data) {
		let idx = TDKModel.getUserChairIndex(data.chairID)
		let com = this._userList[idx]
		if (com) com.setReady(true)
		if (data.chairID == TDKModel.getMyChairID()) {
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
		TDKModel.setCurBureau(data.curBureau)
		this.txt_round.string = `局数:${data.curBureau}/${TDKModel.getMaxBureau()}`
		this.btn_invite.active = false
		this.btn_copy.active = false
		let myUserInfo = TDKModel.getUserByChairID(TDKModel.getMyChairID())
		this.btn_leave.active = (myUserInfo.chairID >= TDKModel.getChairCount())
		this.btn_dismiss.active = (myUserInfo.chairID < TDKModel.getChairCount() && !TDKModel.getGameRuleByKey("canNotDissmiss"))
		this.resetTable()
	},

	delAllFlyNode() {
		this._allFlyNode.forEach(node => {
			node.destroy()
		});
		this._allFlyNode.length = 0
	},


	/**游戏状态图更新 */
	onGameStatusUpdate(data) {
		// console.log("游戏状态==", data);
		this._yuYinShow();
		this._gameStatus = data.gameStatus
		this.btn_ready.active = false
		this.btnBackHall.active = false
		this.hideReadyIcon()
		this.com_optBtn.reset()
		this.languoAni.active = false

		this.delAllFlyNode()
		switch (this._gameStatus) {
			case ApiTdk.gameStatus.NONE:
				this.resetTable()
				this.btn_ready.active = true
				break;
			case ApiTdk.gameStatus.SHOW_CARDS:
				this.handleResult(data.tick)
			case ApiTdk.gameStatus.RESULT:
				TDKModel.setIsKouPai()
				break;
			default:
				break;
		}
	},

	/**亮牌时间给自己显示按钮和时间 */
	handleResult(tick = 0) {
		/**显示亮牌按钮 */
		this.com_optBtn.setOptCardNode(true, {
			operateList: [ApiTdk.operateType.KAIPAI]
		})

		/**在自己位置位置显示时间 */
		let ucom = this._userList[0]
		let clockNode = null
		if (ucom) {
			clockNode = ucom.getClockNode()
		}
		if (clockNode) {
			let pos = CCUtil.postionConvert(clockNode, this.com_optBtn.node)
			this.com_optBtn.setClock(tick, pos)
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
		let idx = TDKModel.getUserChairIndex(chairId)
		// console.log("获取到的座位号==", idx)
		return idx
	},

	/**发牌 */
	onSendCard(data, isAni = false, isReConnect = false) {
		TDKModel.setHandCards(data.handCards)
		TDKModel.setIsLanGuo(data.isCurLanGuo)
		for (const uid in data.handCards) {
			if (Object.hasOwnProperty.call(data.handCards, uid)) {
				let idx = this.getUserIdxByUid(uid)
				let hcom = this._handCardList[idx]
				if (hcom && (!TDKModel.getIsKouPai(uid) || isReConnect)) {
					const handCards = data.handCards[uid];
					if (handCards.length > 3 && !isReConnect) {
						hcom.sendCard(handCards[handCards.length - 1], isAni, this.animationNode)
					} else
						hcom.sendCard(handCards.slice(), isAni, this.animationNode)
				}
			}
		}
		let dt = isAni ? 1 : 0
		this.scheduleOnce(() => {
			this.setEveryDianshu()
		}, dt)
		/**上局 是否蓝过 */
		this.languoAni.active = false
		this.languoIcon.active = data.isCurLanGuo
	},

	/**设置每个人的牌点数 */
	setEveryDianshu(isAll = false) {
		/**计算每个位置的牌点数 */
		let maxValue = -1
		for (let i = 0; i < this._handCardList.length; i++) {
			const hcom = this._handCardList[i];
			let pointSum = hcom.getPointSum(isAll)
			if (maxValue < pointSum) {
				maxValue = pointSum
			}
		}
		for (let i = 0; i < this._handCardList.length; i++) {
			const hcom = this._handCardList[i];
			let pointSum = hcom.getPointSum(isAll)
			hcom.setDianshu(pointSum, pointSum - maxValue, true)
			hcom.setMaxIcon(pointSum == maxValue)
		}
	},

	/**更新庄家
	 * uid"859718"
		  userList:
	 */
	onBankerUpdate(data, isAni = false) {
		// console.log("更新庄家==", data)
	},

	/**下分推送，显示下注按钮
	 * operateList:(2)[1, 4]
	 score:0
	 turn:1
	 uid:"388708"
	 tick:15
	 */
	onPourScoreStart(data) {
		let idx = this.getUserIdxByUid(data.uid)
		/**根据位置显示时间 */
		let ucom = this._userList[idx]
		let clockNode = null
		if (ucom) {
			clockNode = ucom.getClockNode()
		}
		if (clockNode) {
			let pos = CCUtil.postionConvert(clockNode, this.com_optBtn.node)
			this.com_optBtn.setClock(data.tick, pos)
		}
		/**如果是自己，显示按钮,显示自己的手牌 */
		if (idx == 0 && data.operateList && data.operateList.length > 0) {
			this.com_optBtn.setOptCardNode(true, data)
			this._handCardList[0].onLookClick()
		}
	},

	/**玩家分数变化
	 * userPourScore:{uid:score}
	 */
	onPlayerBet(data) {
		let sum = 0
		for (const uid in data.userPourScore) {
			if (Object.hasOwnProperty.call(data.userPourScore, uid)) {
				const score = data.userPourScore[uid];
				sum += score
				let idx = this.getUserIdxByUid(uid)
				let ucom = this._userList[idx]
				if (ucom) {
					ucom.setBetScore(score)
				}
			}
		}
		this.txt_allbet.string = sum + ""
	},

	/**根据分数获取下注的筹码列表 */
	getBetChips(score) {
		let chips = [1, 2, 3, 4, 5]
		let bets = []
		let count = 1
		if (score < 20 && score > 1) count = 2
		else if (score < 100) count = 3
		else if (score >= 100) count = 5
		bets = new Array(count).fill(1)
		// if (chips.includes(score)) {
		// 	bets.push(score)
		// } else {
		// 	let count = Math.floor(score / 5)
		// 	for (let i = 0; i < count; i++) {
		// 		bets.push(5)
		// 	}
		// 	let last = score % 5
		// 	if (last > 0 && last <= 5) {
		// 		bets.push(last)
		// 	}
		// }
		return bets
	},

	/**玩家操作推送 */
	onPlayerOpt(data, isAni = false, isReConnect = false) {
		if (data.uid == UserModel.getData("uid")) {
			this.com_optBtn.setBetNode()
			this.com_optBtn.setOptCardNode()
		}
		if (data.operateInfo) {
			let idx = this.getUserIdxByUid(data.uid)
			let ucom = this._userList[idx]
			let hcom = this._handCardList[idx]
			let type = data.operateInfo.operateType
			/**播放声音 */
			if (ucom && !isReConnect) {
				let data = ucom.getUserData()
				if (data) {
					let audio = "res/audio/woman/"
					if (data.userInfo.sex == 0) {
						audio = audio.replace(/woman/, "man");
					}
					AssetsManager.playEffect({
						path: audio + type,
						bundle: Enums.bundleType.TDK
					});
				}
			}

			/**下注 */
			let check = [ApiTdk.operateType.ALLIN, ApiTdk.operateType.FANTI, ApiTdk.operateType.GEN, ApiTdk.operateType.QIJIAO, ApiTdk.operateType.XIAZHU]
			if (check.includes(type)) {
				let score = data.operateInfo.score
				if (ucom) {
					if (isReConnect) {
						this.com_optBtn.clearChips()
					}
					let bets = this.getBetChips(score)
					for (let i = 0; i < bets.length; i++) {
						const chipValue = bets[i];
						this.com_optBtn.flyChips(chipValue, ucom.node, null, isAni)
					}
				}
				if (!isReConnect) {
					AssetsManager.tipDialog(`+${score}`)
				}
			}
			/**弃牌 */
			if (type == ApiTdk.operateType.CANCEL) {
				if (hcom) {
					hcom.onKouPai()
				}
				TDKModel.setIsKouPai(data.uid)
			}

			/**设置头像上的状态文字 */
			if (ucom && isAni) {
				ucom.setStateTxt(type)
			}
		}
	},

	/**当前最先说话的玩家 */
	onFirstPlayer(data, dt = 0) {
		// let idx = this.getUserIdxByUid(data.uid)
		// let hcom = this._handCardList[idx]
		// if (hcom) {
		// 	this.scheduleOnce(() => {
		// 		hcom.setMaxIcon(true)
		// 	}, dt)
		// }
	},

	/**亮牌结果 */
	onShowCard(data) {
		if (data.uid == TDKModel.myUid) {
			this.com_optBtn.reset()
		}
		let cards = data.result.cards
		let idx = this.getUserIdxByUid(data.uid)
		let showhcom = this._handCardList[idx]
		if (showhcom) {
			showhcom.showCard(cards, true)

			let maxValue = -1
			for (let i = 0; i < this._handCardList.length; i++) {
				const hcom = this._handCardList[i];
				let pointSum = hcom.getPointSum(true)
				if (maxValue < pointSum) {
					maxValue = pointSum
				}
			}
			/**更新亮牌人的点数 */
			let pointSum = showhcom.getPointSum(true)
			showhcom.setDianshu(pointSum, pointSum - maxValue, true)
			showhcom.setMaxIcon(pointSum == maxValue)
		}
	},

	onGameResult(data) {
		/**展示烂锅 */
		if (data.lanGuoUser && Array.isArray(data.lanGuoUser) && data.lanGuoUser.length > 0) {
			data.lanGuoUser.forEach(uid => {
				let idx = this.getUserIdxByUid(uid)
				let hcom = this._handCardList[idx]
				if (hcom) {
					hcom.onLanGuo()
				}
			});
			/**展示蓝过动画 */
			this.languoAni.active = true
			this.languoAni.scale = 0
			cc.tween(this.languoAni).to(0.2, {
				scale: 1
			}, {
				easing: 'backOut'
			}).start()
		}
		/**给赢加飞金币 */
		let wcom = 0
		for (const uid in data.winScores) {
			if (Object.hasOwnProperty.call(data.winScores, uid)) {
				const s = data.winScores[uid];
				let idx = this.getUserIdxByUid(uid)
				let com = this._userList[idx]
				if (com) {
					com.setResScore(s)
				}
				if (s > 0) {
					wcom = com
				}
			}
		}
		if (wcom) {
			this.com_optBtn.flyChips(0, null, wcom.node, true)
		}
		this.txt_allbet.string = ""
	},

	onGift(fromChairID, toChairID, giftID) {
		let fidx = TDKModel.getUserChairIndex(fromChairID)
		let tidx = TDKModel.getUserChairIndex(toChairID)
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
		let pGuan = TDKModel.getSelfIsPlaying()
		let tmp = UserModel.getData("isTest")
		if (!tmp || !pGuan) {
			return
		}
		AssetsManager.createDialog({
			bundle: Enums.bundleType.TDK,
			path: "res/prefab/TDKSelectTest",
			mainDialog: this
		})
	},

	showTest() {
		let tmp = UserModel.getData("isTest")
		this.btn_shezhi.active = false //tmp;
	},

	/**给没座位的人显示坐下按钮 */
	showSitDownButton() {
		let curBureau = TDKModel.getCurBureau();
		let maxBureau = TDKModel.getMaxBureau();
		let canEnter = TDKModel.getGameRuleByKey('canEnter') && maxBureau != curBureau;
		// (!!canEnter || curBureau == 0) &&
		this.btn_zuoxia.active = TDKModel.getMyChairID() >= TDKModel.getChairCount() &&
			(!!canEnter || curBureau == 0) &&
			TDKModel.checkHaveEmptySeat();
	},

	/**坐下按钮响应 */
	onBtnSitDown() {
		/**检查是否还有空位，有就发送坐下命令 */
		let chairID = TDKModel.getCanSitDownChairID();
		let idx = TDKModel.getUserChairIndex(chairID)
		if (chairID == -1 || !this._userList[idx]) {
			AssetsManager.tipDialog('没有座位可以坐下！');
			return;
		}
		// console.log('找到座位坐下', chairID);
		ApiRoom.roomMessageNotify(ApiRoom.getUserChangeSeatNotify(TDKModel.getMyChairID(), chairID));
	},

	/**观战列表响应 */
	onLookOnClick() {

		let users = TDKModel.getLookOnUsers();
		if (users.length == 0) {
			AssetsManager.tipDialog('暂无观战玩家！');
			return;
		}
		AssetsManager.standDialog({
			users: users
		});
	},
	_onMenuOpen() {
		this.menuLay.active = true;
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
				this._onMenuOpen();
				break;
			case "menu": //关闭菜单
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
				if (CCUtil.clickInterval(event.target, 10, true)) {
					return;
				}
				AssetsManager.tipDialog('刷新界面可以修复游戏显示问题');
				this.getRoomSceneInfo()
				break;
			case "btn_setting": //设置
				this._onMenuCloseClick();
				AssetsManager.setDialog({
					type: "duoren",
					gameType: Enums.bundleType.TDK,
					musicType: Enums.bundleType.CIRCLE,
				});
				break;
			case "btn_review": //回看
				this._onMenuCloseClick();
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				ApiRoom.gameMessageNotify(ApiTdk.gameReviewNotify());
				break;
			case "btn_msg": //聊天
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}

				let params = {
					gameRule: TDKModel.getGameRule(),
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
				let rule = TDKModel.getGameRule()
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
					chairCount: TDKModel.getChairCount(),
					fangzuobi: TDKModel.getGameRuleByKey('fangzuobi')
				})
				break;
			case "btn_deposit": //开始托管
				this._onMenuCloseClick();
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				ApiRoom.gameMessageNotify(ApiTdk.gameTrushNotify(true));
				break;
			case "btn_quxiaotuoguan": //取消托管
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				ApiRoom.gameMessageNotify(ApiTdk.gameTrushNotify(false));
				break;
			case "btn_invite": //邀请
				let gameRule = TDKModel.getGameRule()
				gameRule = gameRule || {};
				gameRule.roomId = TDKModel.getRoomID();
				let share = ConfigModel.getRoomRuleShare(gameRule);
				NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
				break;
			case "btn_copy": //复制
				let str = ConfigModel.getShareGameName(Enums.bundleType.TDK) + TDKModel.getRoomID()
				NativeUtil.copyText(str);
				break;
			case "bg": //背景按钮 恢复牌
				this._handCardList[0].setAllCardDown()
				break;
			case "btn_out":
				if (CCUtil.clickInterval(event.target, 0.5)) {
					return;
				}
				let cardDataArr = this._handCardList[0].getAllUpCardId()
				if (cardDataArr.length <= 0) {
					// console.log("没有选择牌")
					return
				}
				// console.log("出的牌==", cardDataArr)
				ApiRoom.gameMessageNotify(ApiTdk.gameUserOperateNotify(cardDataArr, ApiTdk.operateType.OUT));
				break;
			case "btn_pass":
				ApiRoom.gameMessageNotify(ApiTdk.gameUserOperateNotify([], ApiTdk.operateType.PASS));
				break;
			case "btn_tip":
				this._handCardList[0].showTipCards()
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
				this.onBtnTest()
				break;
			case "btn_back":
				this.enterHall()
				break;
			default:
				break;
		}
	},
	onShowInvite() {
		AssetsManager.friendDialog({
			gameRule: TDKModel.getGameRule(),
		})
	},

	/**消息监听 */
	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				// console.log('gameInit=============================', msg.data);
				this.gameInit(msg.data);
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				TDKModel.addUser(msg.data.roomUserInfo);
				this.userEnterRoom(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				if (msg.data.roomUserInfo.chairID != TDKModel.getMyChairID()) {
					TDKModel.delUser(msg.data.roomUserInfo.chairID);
				}
				this.userLeaveRoom(msg.data.roomUserInfo)
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				// console.log("收到了玩家准备==", msg.data)
				this.onUserReady(msg.data)
			} else if (msg.type === ApiRoom.GAME_END_PUSH) {
				// console.log("游戏结束《《《《《《《《《", msg)
			} else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
				if (!msg.data.userList || msg.data.userList.length == 0) return;
				msg.data.myChairID = TDKModel.getMyChairID();
				AssetsManager.disDialog(msg.data);
			} else if (msg.type === ApiRoom.USER_CHAT_PUSH) {
				let idx = TDKModel.getUserChairIndex(msg.data.chairID)
				let com = this._userList[idx]
				if (com) {
					com.gameChat(msg.data)
				}
			} else if (msg.type === ApiRoom.USER_GIFT_SEND_PUSH) {
				this.onGift(msg.data.fromChairID, msg.data.toChairID, msg.data.giftID);
			} else if (msg.type === ApiRoom.USER_VOICE_PUSH) {
				this._voiceMsgQueue.push(msg.data);
			} else if (msg.type === ApiRoom.USER_OFF_LINE_PUSH) {
				let idx = TDKModel.getUserChairIndex(msg.data.chairID)
				let com = this._userList[idx]
				if (com) com.setOffline(true)
			} else if (msg.type === ApiRoom.ROOM_USER_INFO_CHANGE_PUSH) { //用户信息刷新
				// console.log('加锅推筒子-ROOM_USER_INFO_CHANGE_PUSH', msg.data);
				this._userList.forEach(com => {
					if (com) {
						com.userInfoChange(msg.data)
					}
				});
			} else if (msg.type === ApiRoom.ROOM_USER_WIN_TOTAL_PUSH) {
				/**玩家总输赢分数 */
				// console.log("玩家总输赢==", msg.data)
				this.initTotalScore(msg.data.userWinTotalScore)
			} else if (msg.type === ApiRoom.USER_GAME_STATUS_PUSH) {
				// console.log('玩家状态推送', msg.data)
				TDKModel.updateUserPlayStatus(msg.data.userPlayStatus);
			} else if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
				if (msg.data.code != 0) {
					if (msg.data.uid == UserModel.getData('uid')) {
						AssetsManager.tipDialog(Codes[msg.data.code]);
					}
					return;
				};
				TDKModel.setUserPropertyByUID(msg.data.uid, 'userStatus', msg.data.userStatus);
				TDKModel.setUserPropertyByUID(msg.data.uid, 'chairID', msg.data.toChairID);
				if (msg.data.uid == UserModel.getData('uid') && msg.data.toChairID >= TDKModel.getChairCount()) {
					//我自己被强制旁观
					this._userList[0].leave()
				}
				if (msg.data.toChairID < TDKModel.getChairCount()) {
					if (msg.data.uid == UserModel.getData('uid')) {
						this._userList.forEach(com => {
							com.leave()
						});
						this.getRoomSceneInfo()
					} else {
						/**重新刷新座位 */
						let user = TDKModel.getUserByChairID(msg.data.toChairID)
						this.userEnterRoom(user)
					}
				}
				//强制显示未入座的坐下按钮
				this.showSitDownButton();
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiTdk.GAME_BUREAU_PUSH) {
				this.onGameRoundUpdate(msg.data)
			} else if (msg.type === ApiTdk.GAME_STATUS_PUSH) { //游戏状态
				TDKModel.setGameStatus(msg.data.gameStatus)
				this.onGameStatusUpdate(msg.data)
			} else if (msg.type === ApiTdk.GAME_SEND_CARDS_PUSH) { //发牌
				// console.log("发牌==", msg.data)
				this.onSendCard(msg.data, true)
			} else if (msg.type === ApiTdk.GAME_BANKER_PUSH) { //庄家位置更新
				this.onBankerUpdate(msg.data, true)
			} else if (msg.type === ApiTdk.GAME_USER_OPERATE_START_PUSH) { //开始操作推送
				// console.log("开始操作推送==", msg.data)
				this.onPourScoreStart(msg.data)
			} else if (msg.type === ApiTdk.GAME_USER_SCORE_CHANGE_PUSH) { //分数变化
				// console.log("分数变化==", msg.data)
				this.onPlayerBet(msg.data, true)
			} else if (msg.type === ApiTdk.GAME_USER_OPERATE_PUSH) { //玩家操作推送
				// console.log("玩家操作广播==", msg.data)
				this.onPlayerOpt(msg.data, true)
			} else if (msg.type === ApiTdk.GAME_MAX_USER_PUSH) { //当前最先说话的玩家
				// console.log("当前最先说话的玩家==", msg.data)
				// this.onFirstPlayer(msg.data, 1)
			} else if (msg.type === ApiTdk.GAME_SHOW_CARDS_PUSH) { //玩家亮牌
				// console.log("玩家亮牌==", msg.data)
				this.onShowCard(msg.data)
			} else if (msg.type === ApiTdk.GAME_END_PUSH) {
				// console.log("游戏总结算==", msg.data)
				if (msg.data.result.length > 0) {
					msg.data.enterHall = this.enterHall.bind(this);
					msg.data.path = 'res/prefab/TDKAllResult';
					msg.data.bundle = Enums.bundleType.TDK;
					msg.data.isUnionCreate = TDKModel.isUnionCreate();
					msg.data.unionID = TDKModel.getRoomCreatorByKey("unionID")
					msg.data.gameRule = TDKModel.getGameRule()
					msg.data.roomID = TDKModel.getRoomID()
					this.unscheduleAllCallbacks();
					this.scheduleOnce(() => {
						MessageCallback.emitMessage('RemoveGameResult');
						AssetsManager.createDialog(msg.data);
					}, 2);
				} else {
					this.enterHall();
				}
			} else if (msg.type === ApiTdk.GAME_REVIEW_PUSH) {
				let reviewRecord = msg.data.list
				if (reviewRecord && reviewRecord.length > 0) {
					AssetsManager.createDialog({
						bundle: Enums.bundleType.TDK,
						path: "res/prefab/TDKResultDialog",
						reviewRecord: reviewRecord,

					});
				} else {
					AssetsManager.tipDialog('没有数据');
				}
			} else if (msg.type === ApiTdk.GAME_RESULT_PUSH) {
				this.onGameResult(msg.data.result)
			}
		} else if (route === 'ReconnectSuccess') {
			this.getRoomSceneInfo();
		} else if (route === 'SelfEntryRoomPush') {
			if (msg.gameType != TDKModel.getBundleType()) {
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
			AssetsManager.popDialog({
				content: Codes[msg.code],
				ok: () => {
					this.enterHall();
				}
			});
		} else if (route === 'TestClickReq') {
			this.onBtnTest()
		} else if (route === Events.clientEvents.gvUploadFileSuccess) {
			this._onUploadSuccess(msg)
		}
	},
});