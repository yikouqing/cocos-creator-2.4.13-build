const ApiERPdk = require('./ApiERPdk');
const ApiRoom = require('../../../src/api/ApiRoom');
const gameLogic = require('./ERPDKGameLogic');
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
const ERPDKModel = require("./ERPDKModel")
const CCUtil = require("../../../src/utils/CCUtil")
const Events = require('../../../src/const/Events');

cc.Class({
	extends: cc.Component,

	properties: {
		com_optBtn: require("ERPDKOptBtn"),
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
		btn_cardRecords: cc.Node,
		btnYuYin: cc.Node,
		menuLay: cc.Node,
		menuLayList: cc.Node,
		cardRecords: cc.Node,
		tuoguan: cc.Node,
		btn_deposit: cc.Node,
		clockPfb: cc.Prefab,
		animationNode: cc.Node,
		aniPfb: cc.Prefab,
		btnBackHall: cc.Node,
		headLeft: cc.Prefab,
		headRight: cc.Prefab,
		canNotDismissBar: cc.Node,

		/**用户脚本列表 下标为本地座位号*/
		_userList: [],
		/**手牌脚本列表 */
		_handCardList: [],
		/**出牌脚本列表 */
		_outCardList: [],
		/**游戏状态 */
		_gameStatus: 0,
		/**上一轮出牌 */
		_lastOut: null,
	},

	onLoad() {
		// 菜单点击
		this.menuLay.active = false
		AssetsManager.init(this.node.parent);
		cc.game.on(cc.game.EVENT_SHOW, this.onEventShow, this);
		MessageCallback.addListener(Events.clientEvents.gvUploadFileSuccess, this);
		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
		MessageCallback.addListener('UpdateGameBg', this);
		MessageCallback.addListener('UpdateGameCardBg', this);
		MessageCallback.addListener('SelfEntryRoomPush', this);
		MessageCallback.addListener('CreateRoomFail', this);
		MessageCallback.addListener('UpdateGameBgm', this);
		MessageCallback.addListener('QuickJoinFail', this);
		MessageCallback.addListener('JoinGameAgainPush', this);
		MessageCallback.addListener('OnGameOnceAgain', this);
		MessageCallback.addListener('TestClickReq', this)
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
		cc.game.off(cc.game.EVENT_SHOW, this.onEventShow, this);
		MessageCallback.removeListener(Events.clientEvents.gvUploadFileSuccess, this);
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
		MessageCallback.removeListener('UpdateGameBg', this);
		MessageCallback.removeListener('UpdateGameCardBg', this);
		MessageCallback.removeListener('SelfEntryRoomPush', this);
		MessageCallback.removeListener('CreateRoomFail', this);
		MessageCallback.removeListener('UpdateGameBgm', this);
		MessageCallback.removeListener('QuickJoinFail', this);
		MessageCallback.removeListener('JoinGameAgainPush', this);
		MessageCallback.removeListener('OnGameOnceAgain', this);
		MessageCallback.removeListener('TestClickReq', this)
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
		let isUnionCreate = ERPDKModel.isUnionCreate();
		let unionID = !!isUnionCreate ? ERPDKModel.getRoomCreatorByKey('unionID') : null;
		SubManager.exitBundle(unionID);
	},

	resetTable() {
		this._userList.forEach(com => {
			com.reset()
		});
		this._handCardList.forEach(com => {
			com.reset()
		});
		this._outCardList.forEach(com => {
			com.reset()
		});
		this.com_optBtn.showOptNode(false)
	},

	gameInit(data) {
		this.unscheduleAllCallbacks();
		MessageCallback.emitMessage('RemoveGameResult');
		this.resetTable()
		ERPDKModel.init(data)
		gameLogic.init(ERPDKModel.getGameRule())
		this._gameStatus = data.gameData.gameStatus
		this.initHeadAndCard()

		/**初始化用户信息 */
		let roomUserInfoArr = data.roomUserInfoArr
		let myUserInfo = null
		for (let i = 0; i < roomUserInfoArr.length; i++) {
			const user = roomUserInfoArr[i];
			this.userEnterRoom(user)
			if (user.chairID == ERPDKModel.getMyChairID()) {
				myUserInfo = user
			}
		}
		this.initTotalScore(data.gameData.userWinTotalScore)
		if (this.canNotDismissBar) this.canNotDismissBar.active = ERPDKModel.getGameRuleByKey("canNotDissmiss");
		/**按钮显示 */
		let yuyin = ERPDKModel.getGameRuleByKey('yuyin');
		this.btnYuYin.active = !!yuyin && ConfigModel.getData('voiceSpeaker');
		this.btn_invite.active = ERPDKModel.getCurBureau() == 0 && !cc.sys.isBrowser && !!ConfigModel.getData('gameWechatInvite');
		this.btn_copy.active = ERPDKModel.getCurBureau() == 0 && !cc.sys.isBrowser && !!ConfigModel.getData('gameWechatInvite');
		this.btn_location.active = !!ERPDKModel.getGameRuleByKey("showGps");
		this.btn_ready.active = (this._gameStatus === ApiERPdk.gameStatus.NONE && myUserInfo && myUserInfo.playStatus != ApiRoom.playStatus.READY);
		this.btn_leave.active = data.gameData.curBureau == 0;
		this.btn_dismiss.active = data.gameData.curBureau != 0 && !ERPDKModel.getGameRuleByKey("canNotDissmiss");
		this.btn_deposit.active = ERPDKModel.getGameRuleByKey("canTrust");
		this.btn_cardRecords.active = ERPDKModel.getGameRuleByKey("isCardRecorder");
		this.btn_shezhi.active = false // UserModel.getData("isTest");
		if (this.btn_cardRecords.active) {
			this.cardRecords.x = -this.cardRecords.parent.width;
		}
		this.btnBackHall.active = data.gameData.curBureau == 0 && ERPDKModel.isUnionCreate();

		/**房间号和局数 */
		this.txt_roomId.string = `房号:${data.roomID}`
		this.txt_round.string = `局数:${data.gameData.curBureau}/${data.gameData.maxBureau}`
		this.txt_gameName.string = `游戏:${ConfigModel.getGameName(Enums.bundleType.ERPDK)}`

		/**恢复记牌器 */
		this.onCardRecords(data.gameData.leftCards)

		if (this._gameStatus == ApiERPdk.gameStatus.SEND_CARDS || this._gameStatus == ApiERPdk.gameStatus.USER_OPERATE) {
			/**恢复手牌 */
			this.updateHandCard(data.gameData)
			/**恢复操作 */
			let optData = {
				tick: data.gameData.tick,
				cards: data.gameData.lastOperateCards,
				uid: data.gameData.curOperateUid,
				lastOperateUid: data.gameData.lastOperateUid,
			}
			this.onGameTurn(optData)
			/**恢复出的牌或者pass */
			let lastOut = null,
				operateRecords = data.gameData.operateRecords;
			for (let i = operateRecords.length - 1; i >= 0; i--) {
				const opt = operateRecords[i]
				if (opt && opt.type == ApiERPdk.operateType.OUT) {
					lastOut = opt
					break
				}
			}
			if (lastOut && lastOut.uid != data.gameData.curOperateUid) {
				let idx = this.getUserIdxByUid(lastOut.uid)
				let ocom = this._outCardList[idx]
				ocom && ocom.updateCards(lastOut.cards)
			}
		}

		/**恢复托管标记 */
		let userTrustArray = data.gameData.autoUser
		if (userTrustArray) {
			this.tuoguan.active = userTrustArray[ERPDKModel.myUid]
		}
	},

	/**判断人数，初始化头像位置 */
	initHeadAndCard() {
		let chairCount = ERPDKModel.getChairCount()
		if (this._userList.length == chairCount) {
			return
		}
		let headPos = [0, 1, 3]
		if (chairCount == 2) {
			headPos = [0, 2]
		}
		this._userList.length = 0
		this._handCardList.length = 0
		this._outCardList.length = 0

		for (let i = 0; i < headPos.length; i++) {
			let idx = headPos[i]
			let h = cc.find("head" + idx, this.node)
			h.removeAllChildren()
			let headNode = null
			if (idx == 0 || idx == 3) {
				headNode = cc.instantiate(this.headLeft)
			} else {
				headNode = cc.instantiate(this.headRight)
			}
			if (cc.isValid(headNode)) {
				headNode.parent = h
				this._userList.push(headNode.getComponent("ERPDKHead"))
				this._userList[i].initRes()
			}

			let handCard = cc.find("handCard" + idx, this.node)
			let outCard = cc.find("outCard" + idx, this.node)
			this._handCardList.push(handCard.getComponent("ERPDKCardMgr"))
			this._handCardList[i].init(idx)
			this._handCardList[i].addTouchEvent()

			this._outCardList.push(outCard.getComponent("ERPDKCardMgr"))
			this._outCardList[i].init(idx)
		}
	},

	/**用户进入房间 */
	userEnterRoom(data) {
		let idx = ERPDKModel.getUserChairIndex(data.chairID)
		let headcom = this._userList[idx]
		if (headcom) {
			headcom.init(data)
		}
	},

	/**恢复所有人的总输赢分数 */
	initTotalScore(userWinTotalScore) {
		if (userWinTotalScore && ERPDKModel.scoreState()) {
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
		let idx = ERPDKModel.getUserChairIndex(data.chairID)
		let headcom = this._userList[idx]
		if (headcom) {
			headcom.leave()
		}
		if (data.uid == UserModel.getData('uid')) {
			if (!ERPDKModel.getRoomID() ||
				ERPDKModel.getRoomID() == data.roomID) {
				this.enterHall()
			}
		}
	},

	/**玩家准备 */
	onUserReady(data) {
		let idx = ERPDKModel.getUserChairIndex(data.chairID)
		let com = this._userList[idx]
		if (com) com.setReady(true)
		if (data.chairID == ERPDKModel.getMyChairID()) {
			this.btn_ready.active = false
			this.resetTable()
		}
	},

	/**隐藏所有准备图标 */
	hideReadyIcon() {
		this._userList.forEach(userCom => {
			userCom.setReady(false)
		});
	},

	/**更新局数 */
	onGameRoundUpdate(data) {
		MessageCallback.emitMessage('RemoveGameResult');
		// console.log("更新局数==", data)
		ERPDKModel.setCurBureau(data.curBureau)
		this.txt_round.string = `局数:${data.curBureau}/${ERPDKModel.getMaxBureau()}`
		this.btn_invite.active = false
		this.btn_copy.active = false
		this.btn_leave.active = false
		this.btn_dismiss.active = data.curBureau != 0 && !ERPDKModel.getGameRuleByKey("canNotDissmiss");
		this.resetTable()
	},

	/**更新庄家 */
	onBankerUpdate(chairID) {
		let idx = ERPDKModel.getUserChairIndex(chairID)
		let com = this._userList[idx]
		if (com) com.setBanker(true)
	},

	/**游戏状态图更新 */
	onGameStatusUpdate(data) {
		// console.log("游戏状态==", data)
		this._gameStatus = data.gameStatus
		this.btn_ready.active = false
		this.btnBackHall.active = false
		this.hideReadyIcon()
		switch (this._gameStatus) {
			case ApiERPdk.gameStatus.NONE:
				this.btn_ready.active = true
				break
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
		let idx = ERPDKModel.getUserChairIndex(chairId)
		// console.log("获取到的座位号==", idx)
		return idx
	},

	/**刷新牌 */
	updateHandCard(data, isAni = false) {
		ERPDKModel.setHandCards(data.handCards)
		let handCards = data.handCards
		for (const uid in handCards) {
			if (Object.hasOwnProperty.call(handCards, uid)) {
				const cardarr = handCards[uid];
				let idx = this.getUserIdxByUid(uid)
				let hcom = this._handCardList[idx]
				if (idx == 0) {
					hcom && hcom.updateCards(cardarr, isAni)
				} else {
					/**展示手牌数量 */
					let ucom = this._userList[idx]
					ucom && ucom.setCardCount(cardarr.length)
					let isTest = UserModel.getData("isTest")
					if (!!isTest) {
						hcom && hcom.updateCards(cardarr)
					}
				}
			}
		}
	},

	/**记牌器 */
	onCardRecords(leftCards) {
		// console.log("记牌器===leftCards", leftCards)
		if (!leftCards || !Array.isArray(leftCards)) {
			return
		}
		leftCards.forEach(cardInfo => {
			this.cardRecords.getChildByName(cardInfo.card + "").getComponent(cc.Label).string = cardInfo.count + ""
		});
	},

	/**删除所有闹钟 */
	delAllClock() {
		this.com_optBtn.setClock()
		this._userList.forEach(com => {
			com.setClock()
		});
	},

	/**
	 * 检查第一手出牌的提示
	 * @param {[{}]} tipData 
	 */
	checkFirstOutTip(tipData) {
		let isFirstChairID = ERPDKModel.getGameRuleByKey("heitao5");
		isFirstChairID = false;
		let firstCard = 53
		for (let i = 1; i < this._userList.length; i++) {
			const com = this._userList[i];
			if (com.getCardCount() != ERPDKModel.getGameRuleByKey("cardCount")) {
				isFirstChairID = false
				break
			}
		}
		let handCardArr = ERPDKModel.getMyHandCard()
		let curBureau = ERPDKModel.getCurBureau()
		if (curBureau == 1 && isFirstChairID && handCardArr && handCardArr.includes(firstCard)) {
			/**展示必出标记 */
			this._handCardList[0].showMustIcon(firstCard)
			/**必须出黑桃3 把没有黑桃3的提示去掉 */
			for (let i = 0; i < tipData.length; i++) {
				let info = tipData[i];
				if (info && !info.cardList.includes(firstCard)) {
					tipData.splice(i, 1)
					i--
				}
			}
		}
	},

	/**通知玩家出牌 
	 * cards
	 tick
	 uid
	 lastOperateUid
	*/
	onGameTurn(data) {
		this._lastOut = data.cards
		this.delAllClock()
		this.com_optBtn.showOptNode(false)
		let clockNode = cc.instantiate(this.clockPfb)
		clockNode.getComponent("ERPDKClock").init(data.tick)
		if (data.uid == ERPDKModel.myUid) {
			/**设置提示信息 */
			let tipData = gameLogic.searchOutCard(ERPDKModel.getMyHandCard(), this._lastOut)
			this.checkFirstOutTip(tipData)
			this._handCardList[0].setTipData(tipData)
			/**显示操作按钮和时钟 */
			this.com_optBtn.showOptNode(true, tipData.length == 0)
			this.com_optBtn.setClock(clockNode)
			this._outCardList[0].updateCards()
			this._userList[0].setPassNode(false)
		} else {
			/**显示头像上的时钟 */
			let idx = this.getUserIdxByUid(data.uid)
			let ucom = this._userList[idx]
			if (ucom) {
				ucom.setClock(clockNode)
				ucom.setPassNode(false)
			}
			let ocom = this._outCardList[idx]
			ocom && ocom.updateCards()
		}
	},

	/**玩家出牌返回
	 * cards
	 * errMsg
	 * handCards
	 * isSuccess
	 * operateType
	 * uid
	 * operateInfo
	 */
	onUserOpt(data) {
		if (data.operateInfo.isSuccess) {
			/**刷新手牌 */
			this.updateHandCard(data.operateInfo)
			/**去掉按钮 */
			if (data.uid == ERPDKModel.myUid) {
				this.com_optBtn.showOptNode(false)
			}
			/**去掉所有的不出 */
			this._userList.forEach(com => {
				com.setPassNode(false)
			});

			this.onCardRecords(data.operateInfo.leftCards)

			let optType = data.operateInfo.operateType
			let idx = this.getUserIdxByUid(data.uid)
			let ocom = this._outCardList[idx]
			let ucom = this._userList[idx]
			let user = ucom && ucom.getUserData()
			/**展示出的牌或者展示pass */
			if (optType == ApiERPdk.operateType.OUT) {
				ucom && ucom.setPassNode(false)
				ocom && ocom.updateCards(data.operateInfo.cards, false, true)
				this.playCardTypeAni(data.operateInfo.cardType, idx, data.operateInfo.cards.length)
				this.playOptSound(data.operateInfo.cardType, user && user.userInfo.sex, data.operateInfo.cards)
				/**牌数量报警 */
				let num = data.operateInfo.handCards[data.uid].length
				if (num <= 2) {
					let audio = "res/audio/man/man_baojing" + num
					if (user && user.userInfo.sex == 1) {
						audio = audio.replace(/man/g, "woman");
					}
					AssetsManager.playEffect({
						path: audio,
						bundle: Enums.bundleType.ERPDK
					});
				}
			} else if (optType == ApiERPdk.operateType.PASS) {
				ocom && ocom.updateCards()
				ucom && ucom.setPassNode(true)

				let audio = "res/audio/man/man_buyao1";
				if (user && user.userInfo.sex == 1) {
					audio = audio.replace(/man/g, "woman");
				}
				AssetsManager.playEffect({
					path: audio,
					bundle: Enums.bundleType.ERPDK
				});
			}
		} else {
			if (data.operateInfo.errMsg) {
				AssetsManager.tipDialog(data.operateInfo.errMsg);
			}
		}
	},

	/**
	 * 播放牌型动画
	 * @param {number} cardType 
	 * @param {number} idx 
	 * @param {number} len
	 */
	playCardTypeAni(cardType, idx, len) {
		let type = null //0顺子 1连对 2三张 3三带一 4三带二 5飞机 6飞机带翅膀 7四带一 8四带二 9四代三 10炸弹 11 春天
		if (cardType === ApiERPdk.cardType.BOMB_CARD || cardType === ApiERPdk.cardType.TIAN_BOMB) {
			type = 10
			console.log("播放炸弹动画", idx)
			this.showBoomScore(idx);
		} else if (cardType === ApiERPdk.cardType.DOUBLE_LINE) {
			type = 1
		} else if (cardType === ApiERPdk.cardType.THREE_LINE) {
			type = 2
			if (len == 6) {
				type = 5
			}
		} else if (cardType === ApiERPdk.cardType.THREE_LINE_TAKE_ONE) {
			type = 3
			if (len > 6) {
				type = 6
			}
		} else if (cardType === ApiERPdk.cardType.THREE_LINE_TAKE_TWO) {
			type = 4
			if (len > 6) {
				type = 6
			}
		} else if (cardType === ApiERPdk.cardType.FOUR_LINE_TAKE_X) {
			type = 7
			if (len == 6) {
				type = 8
			} else if (len == 7) {
				type = 9
			}
		} else if (cardType === ApiERPdk.cardType.DOUBLE_LINE) {
			type = 1
		} else if (cardType === ApiERPdk.cardType.SINGLE_LINE) {
			type = 0
		} else if (cardType == 100) {
			type = 11
		}
		if (type == null) {
			return
		}

		let com = this._outCardList[idx]
		let aniNode = cc.instantiate(this.aniPfb)
		let aniCom = aniNode.getComponent("ERPDKActAnimation")

		let timeScale = 1
		if (type <= 10) {
			let sc = idx == 0 ? 1.3 : 1
			aniNode.scale = sc
			// if (type == 10) {
			// 	this.animationNode.removeAllChildren()
			// 	aniNode.parent = this.animationNode
			// } else
			com.setAniNode(aniNode)
			timeScale = type < 10 ? 0.7 : 1.2
			aniNode.x += 50
		} else {
			this.animationNode.removeAllChildren()
			aniNode.parent = this.animationNode
		}
		aniCom.showOptAni(type, timeScale)
	},

	/**
	 * 播放牌型声音
	 * @param {number} cardType 
	 * @param {number} sex 
	 * @param {Array<number>} cardArr
	 */
	playOptSound(cardType, sex, cardArr) {
		let len = cardArr.length
		let audioUrl = "res/audio/man/"
		let value = gameLogic.getCardValue(cardArr[0]);
		// console.log("播放声音==", cardType, sex, cardArr)
		if (len > 3 && this._lastOut) {
			audioUrl = "res/audio/man/man_dani" + Utils.getRandomNum(1, 3);
		} else if (cardType === ApiERPdk.cardType.BOMB_CARD || cardType === ApiERPdk.cardType.TIAN_BOMB) {
			audioUrl += "man_zhadan"
		} else if (cardType === ApiERPdk.cardType.THREE_LINE) {
			if (len >= 6) {
				audioUrl += "man_feiji"
			} else {
				audioUrl += "man_tuple" + value
			}
		} else if (cardType === ApiERPdk.cardType.THREE_LINE_TAKE_ONE) {
			if (len > 6) {
				audioUrl += "man_feiji"
			} else {
				audioUrl += "man_sandaiyi"
			}
		} else if (cardType === ApiERPdk.cardType.THREE_LINE_TAKE_TWO) {
			if (len > 6) {
				audioUrl += "man_feiji"
			} else {
				audioUrl += "man_sandaiyidui"
			}
		} else if (cardType === ApiERPdk.cardType.FOUR_LINE_TAKE_X) {
			if (len == 6) {
				audioUrl += "man_sidaier"
			}
		} else if (cardType === ApiERPdk.cardType.DOUBLE_LINE) {
			audioUrl += "man_liandui"
		} else if (cardType === ApiERPdk.cardType.SINGLE_LINE) {
			audioUrl += "man_shunzi"
		} else if (cardType === ApiERPdk.cardType.SINGLE) {
			audioUrl += "man_" + value
		} else if (cardType === ApiERPdk.cardType.DOUBLE) {
			audioUrl += "man_dui" + value
		} else if (cardType == 100) {

		}

		if (sex == 1) {
			audioUrl = audioUrl.replace(/man/g, "woman");
		}
		// console.log("audiourl==", audioUrl)
		AssetsManager.playEffect({
			path: audioUrl,
			bundle: Enums.bundleType.ERPDK
		});
	},

	showBoomScore(idx) {
		let boomScore = ERPDKModel.getGameRuleByKey("boomScore");
		boomScore = parseInt(boomScore);
		if (isNaN(boomScore)) boomScore = 0;
		this._userList.forEach((com, i) => {
			com.setBoomScore(i == idx ? boomScore : (-1 * boomScore));
		});
	},

	onUserScoreSync(data) {
		console.log("onUserScoreSync==", data)
		ERPDKModel.userGameScoreSync(data);
		if (!data.userScore) return;
		for (const uid in data.userScore) {
			let idx = this.getUserIdxByUid(uid)
			let com = this._userList[idx]
			com && com.setUserScore(data.userScore[uid])
		}
	},

	onGameResult(data) {
		let dt = 0
		if (data.hasChuntian) {
			/* 有春天 */
			this.playCardTypeAni(100, 0, 0)
			dt = 1
		}

		let isLastRound = ERPDKModel.getCurBureau() == ERPDKModel.getMaxBureau()

		this.scheduleOnce(() => { // 显示结果
			data.bundle = Enums.bundleType.ERPDK
			data.myChairID = this.myChairID
			data.isBureauFull = isLastRound
			data.mainDialog = this
			data.path = 'res/prefab/ERPDKResultDialog'
			data.isResult = true
			data.tick = ERPDKModel.getTick()
			AssetsManager.createDialog(data);
		}, dt);
	},

	onChat(data) {
		let idx = this.getUserIdxByUid(data.uid)
		let com = this._userList[idx];
		if (!com) return;
		com.gameChat(data)
	},

	onGift(fromChairID, toChairID, giftID) {
		let fidx = ERPDKModel.getUserChairIndex(fromChairID)
		let tidx = ERPDKModel.getUserChairIndex(toChairID)
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
		let tmp = UserModel.getData("isTest")
		if (!tmp) return
		AssetsManager.createDialog({
			bundle: Enums.bundleType.ERPDK,
			path: "res/prefab/PDKSelectTest",
			mainDialog: this
		})
	},

	onBtnCardRecords() {
		this.cardRecords.stopAllActions()
		let endx = -this.cardRecords.parent.width
		let es = "backIn"
		if (this.cardRecords.x == endx || (this.cardRecords.x >= endx && this.cardRecords.x < 0)) {
			endx = 0
			es = "backOut"
		}
		// console.log("初始位置==", endx, this.cardRecords.x, this.cardRecords.parent.width)
		cc.tween(this.cardRecords)
			.to(0.35, {
				x: endx
			}, {
				easing: es
			}).start();
	},

	/**按钮响应 */
	btnClickCallFunc(event, param) {
		// console.log("按钮响应==", event.target.name, event)
		switch (event.target.name) {
			case "btn_leave": //离开房间
				this._onMenuCloseClick();
				if (!UserModel.isInRoom()) {
					this.enterHall();
					return;
				}
				if (ERPDKModel.getCurBureau() == 0) {
					ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
				} else {
					AssetsManager.tipDialog('现在不能退出游戏');
				}
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
				if (CCUtil.clickInterval(event.target, 10)) {
					return;
				}
				AssetsManager.tipDialog('刷新界面可以修复游戏显示问题');
				this.getRoomSceneInfo()
				break;
			case "btn_setting": //设置
				this._onMenuCloseClick();
				AssetsManager.setDialog({
					type: "round",
					gameType: Enums.bundleType.ERPDK,
					musicType: Enums.bundleType.POKER,
				});
				break;
			case "btn_review": //回看
				this._onMenuCloseClick();
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				ApiRoom.gameMessageNotify(ApiERPdk.gameReviewNotify());
				break;
			case "btn_msg": //聊天
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				let params = {
					gameRule: ERPDKModel.getGameRule(),
					chat: (chat) => {
						ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
					}
				}
				AssetsManager.chatDialog(params);
				break;
			case "btn_wanfa": //规则
				this._onMenuCloseClick();
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				let rule = ERPDKModel.getGameRule()
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
					chairCount: ERPDKModel.getChairCount(),
					fangzuobi: ERPDKModel.getGameRuleByKey('fangzuobi')
				})
				break;
			case "btn_deposit": //开始托管
				this._onMenuCloseClick();
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				ApiRoom.gameMessageNotify(ApiERPdk.gameTrushNotify(true));
				break;
			case "btn_quxiaotuoguan": //取消托管
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				ApiRoom.gameMessageNotify(ApiERPdk.gameTrushNotify(false));
				break;
			case "btn_invite": //邀请
				let gameRule = ERPDKModel.getGameRule()
				gameRule = gameRule || {};
				gameRule.roomId = ERPDKModel.getRoomID();
				let share = ConfigModel.getRoomRuleShare(gameRule);
				NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
				break;
			case "btn_copy": //复制
				let str = ConfigModel.getRoomShare(Enums.bundleType.ERPDK, ERPDKModel.getRoomID());
				NativeUtil.copyText(str);
				break;
			case "btn_shezhi":
				this._onMenuCloseClick();
				this.onBtnTest();
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
				ApiRoom.gameMessageNotify(ApiERPdk.gameUserOperateNotify(cardDataArr, ApiERPdk.operateType.OUT));
				break;
			case "btn_pass":
				ApiRoom.gameMessageNotify(ApiERPdk.gameUserOperateNotify([], ApiERPdk.operateType.PASS));
				break;
			case "btn_tip":
				this._handCardList[0].showTipCards()
				break;
			case "btn_cardRecord":
				this._onMenuCloseClick();
				if (CCUtil.clickInterval(event.target, 0.5)) {
					return;
				}
				this.onBtnCardRecords()
				break;
			case "btn_back":
				this.enterHall()
				break;
			default:
				break;
		}
	},


	btnClick(event, param) {
		switch (param) {
			case 'menus':
				this.menuLay.active = true;
				this._onMenuOpen();
				break;
			case 'menuclose':
				this._onMenuCloseClick();
				break;

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



	// 邀请好友
	onShowInvite() {
		AssetsManager.friendDialog({
			gameRule: ERPDKModel.getGameRule(),
		})
	},

	/**消息监听 */
	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				// console.log('gameInit=============================', msg.data);
				this.gameInit(msg.data);
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				this.userEnterRoom(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				this.userLeaveRoom(msg.data.roomUserInfo)
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				// console.log("收到了玩家准备==", msg.data)
				this.onUserReady(msg.data)
			} else if (msg.type === ApiRoom.GAME_END_PUSH) {
				// console.log("游戏结束《《《《《《《《《", msg)
			} else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
				if (!msg.data.userList || msg.data.userList.length == 0) return;
				msg.data.myChairID = ERPDKModel.getMyChairID();
				AssetsManager.disDialog(msg.data);
			} else if (msg.type === ApiRoom.USER_CHAT_PUSH) {
				// console.log("收到了聊天", msg.data)
				this.onChat(msg.data);
			} else if (msg.type === ApiRoom.USER_GIFT_SEND_PUSH) {
				this.onGift(msg.data.fromChairID, msg.data.toChairID, msg.data.giftID);
			} else if (msg.type === ApiRoom.USER_VOICE_PUSH) {
				// this._voiceMsgQueue.push(msg.data);
			} else if (msg.type === ApiRoom.USER_OFF_LINE_PUSH) {
				let idx = ERPDKModel.getUserChairIndex(msg.data.chairID)
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
				// console.log("玩家总输赢==", msg.data)
				this.initTotalScore(msg.data.userWinTotalScore)
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiERPdk.GAME_BUREAU_PUSH) {
				this.onGameRoundUpdate(msg.data)
			} else if (msg.type === ApiERPdk.GAME_STATUS_PUSH) { //游戏状态
				ERPDKModel.setGameStatus(msg.data.gameStatus)
				ERPDKModel.setTick(msg.data.tick)
				this.onGameStatusUpdate(msg.data)
			} else if (msg.type === ApiERPdk.GAME_SEND_CARDS_PUSH) { //发牌
				this.updateHandCard(msg.data, true)
			} else if (msg.type === ApiERPdk.GAME_USER_OPERATE_START_PUSH) {
				this.onGameTurn(msg.data)
			} else if (msg.type === ApiERPdk.GAME_USER_OPERATE_PUSH) {
				this.onUserOpt(msg.data)
			} else if (msg.type === ApiERPdk.GAME_BANKER_PUSH) { //庄家位置更新
				this.onBankerUpdate(msg.data.bankerChairID)
			} else if (msg.type === ApiERPdk.GAME_END_PUSH) {
				UserModel.setData('roomID', '');
				if (msg.data.result.length > 0) {
					msg.data.enterHall = this.enterHall.bind(this);
					msg.data.path = 'res/prefab/ERPDKAllResult';
					msg.data.bundle = Enums.bundleType.ERPDK;
					msg.data.isUnionCreate = ERPDKModel.isUnionCreate();
					msg.data.unionID = ERPDKModel.getRoomCreatorByKey("unionID")
					msg.data.gameRule = ERPDKModel.getGameRule()
					msg.data.roomID = ERPDKModel.getRoomID();
					this.unscheduleAllCallbacks();
					this.scheduleOnce(() => {
						MessageCallback.emitMessage('RemoveGameResult');
						AssetsManager.createDialog(msg.data);
					}, 2);
				} else {
					this.enterHall();
				}
			} else if (msg.type === ApiERPdk.GAME_REVIEW_PUSH) {
				let reviewRecord = msg.data.list || [];
				if (reviewRecord && reviewRecord.length > 0) {
					AssetsManager.createDialog({
						bundle: Enums.bundleType.ERPDK,
						path: "res/prefab/ERPDKResultDialog",
						reviewRecord: reviewRecord,
					});
				} else {
					AssetsManager.tipDialog('没有数据');
				}
			} else if (msg.type === ApiERPdk.GAME_RESULT_PUSH) {
				this.onGameResult(msg.data)
			} else if (msg.type === ApiERPdk.GAME_TRUST_PUSH) { //开始托管
				if (ERPDKModel.myUid == msg.data.uid) {
					this.tuoguan.active = msg.data.trust
				}
			} else if (msg.type === ApiERPdk.GAME_USER_SCORE_CHANGE_PUSH) { //开始托管
				this.onUserScoreSync(msg.data);
			}
		} else if (route === 'ReconnectSuccess') {
			this.getRoomSceneInfo();
		} else if (route === 'SelfEntryRoomPush') {
			if (msg.gameType != ERPDKModel.getBundleType()) {
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