const ApiEzgdt = require('./ApiEzgdt');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const SubManager = require('../../../src/utils/SubManager');
const UserModel = require('../../../src/model/UserModel');
const ConfigModel = require('../../../src/model/ConfigModel');
const Codes = require('../../../src/const/Codes');
const EZGDTModel = require("./EZGDTModel")
const CCUtil = require("../../../src/utils/CCUtil")
const Events = require('../../../src/const/Events');

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
		btn_zuoxia: cc.Node,
		btn_menu: cc.Node,
		menuLay: cc.Node,
		menuLayList: cc.Node,
		tuoguan: cc.Node,
		btn_deposit: cc.Node,
		animationNode: cc.Node,

		btnBackHall: cc.Node,
		btnYuYin: cc.Node,
		com_optBtn: require("EZGDTOpt"),

		headSelfPfb: cc.Prefab,
		headRightPfb: cc.Prefab,
		headLeftPfb: cc.Prefab,
		headTopPfb: cc.Prefab,
		handCardPfb: cc.Prefab,
		faPaiNode: cc.Node,
		cuoPaiNode: cc.Node,
		guanzhan_mark: cc.Node,

		/**用户脚本列表 下标为本地座位号*/
		_userList: [],
		/**手牌脚本列表 */
		_handCardList: [],
		/**牌堆脚本列表 动画用 */
		_allCardList: [],
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
		cc.systemEvent.on(Events.clientEvents.gvUploadFileSuccess, this._onUploadSuccess, this);
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
		/* 获取场景信息 */
		this.getRoomSceneInfo()
	},

	onDestroy: function () {
		cc.game.off(cc.game.EVENT_SHOW, this.onEventShow, this);
		cc.systemEvent.off(Events.clientEvents.gvUploadFileSuccess, this._onUploadSuccess, this);
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
		MessageCallback.removeListener('UpdateGameCardBg', this);
		MessageCallback.removeListener('SelfEntryRoomPush', this);
		MessageCallback.removeListener('CreateRoomFail', this);
		MessageCallback.removeListener('QuickJoinFail', this);
		MessageCallback.removeListener('JoinGameAgainPush', this);
		MessageCallback.removeListener('OnGameOnceAgain', this);
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
		let isUnionCreate = EZGDTModel.isUnionCreate();
		let unionID = !!isUnionCreate ? EZGDTModel.getRoomCreatorByKey('unionID') : null;
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
		this.delCuoPaiDialog()
		this.delAllFlyNode()
	},

	_yuYinShow() {
		let isInSeat = EZGDTModel.isInSeat();
		let yuyin = EZGDTModel.getGameRuleByKey('yuyin');
		this.btnYuYin.active = !!isInSeat && !!yuyin && ConfigModel.getData('voiceSpeaker');
	},

	gameInit(data) {
		this.unscheduleAllCallbacks();
		EZGDTModel.init(data)
		this.com_optBtn.gameInit()
		this.resetTable()
		this.animationNode.removeAllChildren()
		this.initHeadAndCards()
		this._userList.forEach(com => {
			com.leave()
		});
		/**初始化用户信息 */
		let roomUserInfoArr = data.roomUserInfoArr
		let myUserInfo = null
		for (let i = 0; i < roomUserInfoArr.length; i++) {
			const user = roomUserInfoArr[i];
			this.userEnterRoom(user)
			if (user.chairID == EZGDTModel.getMyChairID()) {
				myUserInfo = user
			}
		}
		this.initTotalScore(data.gameData.userWinTotalScore)

		/**按钮显示 */
		let maxPlayerCount = EZGDTModel.getChairCount();
		let unionID = EZGDTModel.isUnionCreate() ? EZGDTModel.getRoomCreatorByKey('unionID') : null;
		let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
		this.btn_invite.active = EZGDTModel.getCurBureau() == 0 && !!isShowInvite;
		this.btn_copy.active = EZGDTModel.getCurBureau() == 0 && !!isShowInvite;
		this.btn_location.active = !!EZGDTModel.getGameRuleByKey("showGps")
		this.btn_ready.active = (myUserInfo.chairID < maxPlayerCount && EZGDTModel.getGameStatus() === ApiEzgdt.gameStatus.NONE && myUserInfo && myUserInfo.playStatus != ApiRoom.playStatus.READY)
		this.btn_leave.active = (data.gameData.curBureau == 0 || myUserInfo.chairID >= maxPlayerCount)
		this.btn_dismiss.active = (data.gameData.curBureau != 0 && myUserInfo.chairID < maxPlayerCount)
		this.btn_dismiss.getComponent(cc.Button).interactable = !EZGDTModel.getGameRuleByKey("canNotDissmiss")
		this.btn_deposit.active = EZGDTModel.getGameRuleByKey("canTrust")
		this.btnBackHall.active = data.gameData.curBureau == 0 && EZGDTModel.isUnionCreate();
		this._yuYinShow();
		this.showSitDownButton();
		/**房间号和局数 */
		this.txt_name.string = `${ConfigModel.getGameName(EZGDTModel.getBundleType())}`;
		this.txt_roomId.string = `房号:${data.roomID}`
		this.txt_round.string = `局数:${data.gameData.curBureau}/${EZGDTModel.getMaxBureau()}`

		/**恢复桌面 */
		let myUid = UserModel.getData("uid")
		if (data.gameData.gameStarted) {
			this.setClock(data.gameData)
			this.delAllFlyNode()
		}

		/**恢复庄家 */
		const bankerUid = data.gameData.bankerUid
		if (bankerUid) {
			this.onBankerUpdate({
				uid: bankerUid
			})
		}

		if (data.gameData.gameStarted) {
			/**恢复手牌 */
			this.onSendCard(data.gameData)

			/**如果已经过了抢庄阶段恢复抢几倍 */
			if (EZGDTModel.getGameStatus() > ApiEzgdt.gameStatus.ROB_BANK) {
				let bankercom = this._userList[EZGDTModel.getUserIndexByUID(bankerUid)]
				if (bankercom) {
					bankercom.setMaxScale(data.gameData.max_scale)
				}
			}
		}

		if (EZGDTModel.getGameStatus() == ApiEzgdt.gameStatus.ROB_BANK) {
			let isShowBtn = true
			let robBankList = data.gameData.robBankList
			robBankList.forEach(robInfo => {
				if (robInfo.uid == myUid) {
					isShowBtn = false
				}
				this.onRobBanker(robInfo)
			});
			if (isShowBtn) {
				this.com_optBtn.setRobBankerNode(true)
			}
		} else if (EZGDTModel.getGameStatus() == ApiEzgdt.gameStatus.POUR_SCORE) {
			if (myUid !== bankerUid) {
				let userBetScore = data.gameData.userBetScore
				let isShowBet = true
				for (const uid in userBetScore) {
					if (Object.hasOwnProperty.call(userBetScore, uid)) {
						const data = userBetScore[uid];
						this.onPlayerBet(data)
						if (uid == myUid) {
							isShowBet = false
						}
					}
				}
				if (isShowBet) {
					this.onPourScoreStart(data.gameData)
				}
			}
		} else if (EZGDTModel.getGameStatus() == ApiEzgdt.gameStatus.SHOW_CARD ||
			EZGDTModel.getGameStatus() == ApiEzgdt.gameStatus.RESULT) {
			if (myUid !== bankerUid) {
				let userBetScore = data.gameData.userBetScore
				for (const uid in userBetScore) {
					if (Object.hasOwnProperty.call(userBetScore, uid)) {
						const data = userBetScore[uid];
						this.onPlayerBet(data)
					}
				}
			}

			let showCardsUser = data.gameData.showCardsUser
			let isShowOpt = true
			if (showCardsUser && showCardsUser.length > 0) {
				showCardsUser.forEach(info => {
					if (info.chairID == EZGDTModel.getMyChairID()) {
						isShowOpt = false
					}
					let idx = EZGDTModel.getUserChairIndex(info.chairID)
					let hcom = this._handCardList[idx]
					if (hcom) {
						hcom.showCard(info)
					}
				});
			}
			this.com_optBtn.setOptCardNode(isShowOpt && EZGDTModel.getGameStatus() == ApiEzgdt.gameStatus.SHOW_CARD)
		}
	},

	/**初始化头像和牌 */
	initHeadAndCards() {
		if (this._userList && this._userList.length > 0) {
			return
		}
		let headPos = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
		let pCount = EZGDTModel.getChairCount()
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
			if (idx >= 1 && idx <= 2) {
				pfb = this.headRightPfb
			} else if (idx >= 3 && idx <= 7) {
				pfb = this.headTopPfb
			} else if (idx >= 8 && idx <= 9) {
				pfb = this.headLeftPfb
			}
			let hNode = cc.instantiate(pfb)
			hNode.parent = h
			this._userList.push(hNode.getComponent("EZGDTHead"))

			let cardParent = cc.find("handCard" + idx, this.node)
			let handNode = cc.instantiate(this.handCardPfb)
			handNode.parent = cardParent
			this._handCardList.push(handNode.getComponent("EZGDTCardMgr"))
			this._handCardList[i].init(idx)
		}
	},

	/**用户进入房间 */
	userEnterRoom(data) {
		if (data.chairID >= EZGDTModel.getChairCount() || data.playStatus == ApiRoom.playStatus.WATCH) {
			return
		}
		let idx = EZGDTModel.getUserChairIndex(data.chairID)
		let headcom = this._userList[idx]
		// console.log("初始化用户==", idx, headcom, data)
		if (headcom) {
			headcom.init(data)
		}
	},

	/**恢复所有人的总输赢分数 */
	initTotalScore(userWinTotalScore) {
		if (userWinTotalScore && !!EZGDTModel.scoreState()) {
			userWinTotalScore = userWinTotalScore || {};
			let keys = Object.keys(userWinTotalScore);
			if (keys.length > 0) {
				for (const uid in userWinTotalScore) {
					const s = userWinTotalScore[uid];
					let idx = EZGDTModel.getUserIndexByUID(uid)
					let com = this._userList[idx]
					if (com) com.setTotalScore(s);
				}
			} else {
				this._userList.forEach((user) => {
					user.setTotalScore(0);
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
		if (data.chairID < EZGDTModel.getChairCount()) {
			let idx = EZGDTModel.getUserChairIndex(data.chairID)
			let headcom = this._userList[idx]
			if (headcom) {
				headcom.leave()
			}
		}
		if (data.uid == UserModel.getData('uid')) {
			if (!EZGDTModel.getRoomID() ||
				EZGDTModel.getRoomID() == data.roomID) {
				this.enterHall()
			}
		}
	},

	/**玩家准备 */
	onUserReady(data) {
		let idx = EZGDTModel.getUserChairIndex(data.chairID)
		let com = this._userList[idx]
		if (com) com.setReady(true)
		if (data.chairID == EZGDTModel.getMyChairID()) {
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
		this._yuYinShow();
		// console.log("更新局数==", data)
		EZGDTModel.setCurBureau(data.curBureau)
		this.txt_round.string = `局数:${data.curBureau}/${EZGDTModel.getMaxBureau()}`
		this.btn_invite.active = false
		this.btn_copy.active = false
		this.btnBackHall.active = false
		let myUserInfo = EZGDTModel.getUserByChairID(EZGDTModel.getMyChairID())
		this.btn_leave.active = (myUserInfo.chairID >= EZGDTModel.getChairCount())
		this.btn_dismiss.active = (myUserInfo.chairID < EZGDTModel.getChairCount())
		this.resetTable()
	},

	delAllFlyNode() {
		this._allFlyNode.forEach(node => {
			node.destroy()
		});
		this._allFlyNode.length = 0
	},

	setClock(data) {
		let str = ["准备中..", "抢庄中..", "发牌中..", "下注中..", "开牌中..", "", ""]
		this.com_optBtn.setClock(data.tick, str[EZGDTModel.getGameStatus()])
	},

	/**游戏状态图更新 */
	onGameStatusUpdate(data) {
		this._yuYinShow();
		console.log("游戏状态==", data)
		this.btn_ready.active = false
		this.hideReadyIcon()
		this.com_optBtn.reset()

		this.delAllFlyNode()
		this.setClock(data)
		switch (EZGDTModel.getGameStatus()) {
			case ApiEzgdt.gameStatus.ROB_BANK:
				this.com_optBtn.setRobBankerNode(true)
				break;
			case ApiEzgdt.gameStatus.SHOW_CARD:
				this.com_optBtn.setOptCardNode(true)
				break;
			case ApiEzgdt.gameStatus.NONE:
				this.resetTable()
				break;
			default:
				break;
		}
	},

	/**发牌 */
	onSendCard(data, isAni = false) {
		EZGDTModel.setHandCards(data.handCards)
		for (const uid in data.handCards) {
			if (Object.prototype.hasOwnProperty.call(data.handCards, uid)) {
				const cards = data.handCards[uid];
				let idx = EZGDTModel.getUserIndexByUID(uid)
				let hcom = this._handCardList[idx]
				if (hcom) hcom.sendCards(cards, isAni ? this.faPaiNode : null, cards.length > 1)
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
		let idx = EZGDTModel.getUserIndexByUID(data.uid)
		let ucom = this._userList[idx]
		if (ucom) ucom.setRobScale(data.isRob)
		if (isAni) {
			let sex = EZGDTModel.getUserSexByUid(data.uid)
			AssetsManager.playEffect({
				path: `res/audio/${sex}/rob` + data.isRob,
				bundle: EZGDTModel.getBundleType()
			});
		}
	},

	/**更新庄家
	 * uid"859718"
		  userList:
	 */
	onBankerUpdate(data, isAni = false) {
		console.log("更新庄家==", data)
		EZGDTModel.setBankerUid(data.uid)
		let idx = EZGDTModel.getUserIndexByUID(data.uid)
		let bankercom = this._userList[idx]
		if (!bankercom) {
			// console.log("没有找到庄家，uid=", data.uid)
			return
		}
		this._userList.forEach(ucom => {
			ucom.setRobScale()
			if (EZGDTModel.getGameRuleByKey("bankerType") != ApiEzgdt.gameType.BAWANGZHUANG) {
				ucom.setBanker(false)
			}
		});
		if (!isAni) {
			bankercom.setBanker(true)
			return
		}
		this.com_optBtn.setRobBankerNode(false);
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
				bankercom.setMaxScale(data.max_scale)
			}).start()
		}
		if (data.userList && data.userList.length > 1) {
			/**播放抢庄动画 */
			let dt = 0
			for (let i = 0; i < data.userList.length; i++) {
				let idx1 = EZGDTModel.getUserIndexByUID(data.userList[i]);
				let ucom = this._userList[idx1]
				if (ucom) {
					let light = ucom.getLight()
					light.stopAllActions()
					let cishu = 5
					let jiange = 1
					if (idx1 == idx) {
						cishu = 10
						jiange = 2
					}
					// console.log("播放了动画==", dt)
					cc.tween(light).delay(dt).call(() => {
						light.active = true
						light.opacity = 255
					}).blink(jiange, cishu).call(() => {
						light.active = false
						if (idx1 == idx) {
							fly()
						}
					}).start()
				}
				dt += 0.1
			}
			AssetsManager.playEffect({
				path: "res/audio/main/rob",
				bundle: EZGDTModel.getBundleType()
			});
		} else {
			// if (EZGDTModel.getCurBureau() > 1) {
			// 	AssetsManager.playEffect({
			// 		path: "res/audio/main/changeBanker",
			// 		bundle: EZGDTModel.getBundleType()
			// 	});
			// }
			fly()
		}
	},

	/**下分推送，显示下注按钮
	 */
	onPourScoreStart(data) {
		// bankerUid"388708"
		// maxPourScore100
		// minPourScore10
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
	onPlayerBet(data, isAni = false) {
		if (data.uid == UserModel.getData("uid")) {
			this.com_optBtn.setBetNode()
		}
		let idx = EZGDTModel.getUserIndexByUID(data.uid)
		let ucom = this._userList[idx]
		if (ucom) {
			ucom.setBetScore(data.score, isAni)
		}
	},

	/**亮牌结果 */
	onShowCard(data) {
		if (data.chairID == EZGDTModel.getMyChairID()) {
			this.com_optBtn.setOptCardNode(false)
		}
		let info = data.cardsList
		let idx = EZGDTModel.getUserChairIndex(info.chairID)
		let hcom = this._handCardList[idx]
		if (hcom) {
			hcom.showCard(info, true)
		}
	},

	delCuoPaiDialog() {
		AssetsManager.clearDialog(['EZGDTCuoPai']);
	},

	onGameResult(data) {
		let dt = 0

		let bankerIdx = EZGDTModel.getUserIndexByUID(EZGDTModel.getBankerUid())
		let ucom = this._userList[bankerIdx]
		// console.log("庄家是==", bankerIdx)
		if (1) {
			let winList = []
			let loseList = []
			let res = data.result
			res.forEach(info => {
				let i = EZGDTModel.getUserIndexByUID(info.uid)
				if (i != bankerIdx) {
					if (info.winScores > 0) {
						winList.push(i)
					} else if (info.winScores < 0) {
						loseList.push(i)
					}
				}
				let com = this._userList[i]
				if (com) {
					com.setResScore(info.winScores, true)
				}
			});
			let icon = ucom.getGoldIcon()
			let flygold = (s_pos, e_pos) => {
				if (1) {
					AssetsManager.playEffect({
						path: 'res/audio/main/fly_gold',
						bundle: EZGDTModel.getBundleType()
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
			}
			let bankerPos = ucom.node.parent.getPosition()
			winList.forEach(idx => {
				let c = this._userList[idx]
				if (c) {
					let pos = c.node.parent.getPosition()
					flygold(bankerPos, pos)
				}
			});
			this.scheduleOnce(() => {
				loseList.forEach(idx => {
					let c = this._userList[idx]
					if (c) {
						let pos = c.node.parent.getPosition()
						flygold(pos, bankerPos)
					}
				});
			}, 0.5)
			dt += 2
		}
	},

	onGift(fromChairID, toChairID, giftID) {
		let fidx = EZGDTModel.getUserChairIndex(fromChairID)
		let tidx = EZGDTModel.getUserChairIndex(toChairID)
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

	/**给没座位的人显示坐下按钮 */
	showSitDownButton() {
		this.btn_zuoxia.active = EZGDTModel.isInWatch() &&
			(!!EZGDTModel.getGameRuleByKey('canEnter') || EZGDTModel.getCurBureau() == 0) &&
			EZGDTModel.checkHaveEmptySeat();
		this.guanzhan_mark.active = EZGDTModel.isInWatch()
	},

	/**坐下按钮响应 */
	onBtnSitDown() {
		/**检查是否还有空位，有就发送坐下命令 */
		let chairID = EZGDTModel.getCanSitDownChairID();
		let idx = EZGDTModel.getUserChairIndex(chairID)
		if (chairID == -1 || !this._userList[idx]) {
			AssetsManager.tipDialog('没有座位可以坐下！');
			return;
		}
		// console.log('找到座位坐下', chairID);
		ApiRoom.roomMessageNotify(ApiRoom.getUserChangeSeatNotify(EZGDTModel.getMyChairID(), chairID));
	},

	/**观战列表响应 */
	onLookOnClick() {

		let users = EZGDTModel.getLookOnUsers();
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
		this.btn_menu.active = false
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
				if (CCUtil.clickInterval(event.target, 10, true)) {
					return;
				}
				AssetsManager.tipDialog('刷新界面可以修复游戏显示问题');
				this.getRoomSceneInfo()
				break;
			case "btn_setting": //设置
				this._onMenuCloseClick();
				AssetsManager.setDialog({
					type: "ttz",
					gameType: EZGDTModel.getBundleType(),
					musicType: Enums.bundleType.MAHJONG,
				});
				break;
			case "btn_review": //回看
				this._onMenuCloseClick();
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				ApiRoom.gameMessageNotify(ApiEzgdt.gameReviewNotify());
				break;
			case "btn_msg": //聊天
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}

				let params = {
					gameRule: EZGDTModel.getGameRule(),
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
				let rule = EZGDTModel.getGameRule()
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
					chairCount: EZGDTModel.getChairCount(),
					fangzuobi: EZGDTModel.getGameRuleByKey('fangzuobi')
				})
				break;
			case "btn_deposit": //开始托管
				this._onMenuCloseClick();
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				ApiRoom.gameMessageNotify(ApiEzgdt.gameTrushNotify(true));
				break;
			case "btn_quxiaotuoguan": //取消托管
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				ApiRoom.gameMessageNotify(ApiEzgdt.gameTrushNotify(false));
				break;
			case "btn_invite": //邀请
				let gameRule = EZGDTModel.getGameRule()
				gameRule = gameRule || {};
				gameRule.roomId = EZGDTModel.getRoomID();
				let share = ConfigModel.getRoomRuleShare(gameRule);
				NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
				break;
			case "btn_copy": //复制
				let str = ConfigModel.getRoomShare(EZGDTModel.getBundleType(), EZGDTModel.getRoomID())
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
				ApiRoom.gameMessageNotify(ApiEzgdt.gameUserOperateNotify(cardDataArr, ApiEzgdt.operateType.OUT));
				break;
			case "btn_pass":
				ApiRoom.gameMessageNotify(ApiEzgdt.gameUserOperateNotify([], ApiEzgdt.operateType.PASS));
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
			case "btn_back":
				this.enterHall()
				break;
			default:
				break;
		}
	},
	onShowInvite() {
		AssetsManager.friendDialog({
			gameRule: EZGDTModel.getGameRule(),
		})
	},

	/**消息监听 */
	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				console.log('gameInit=============================', msg.data);
				this.gameInit(msg.data);
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				EZGDTModel.addUser(msg.data.roomUserInfo);
				this.userEnterRoom(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				if (msg.data.roomUserInfo.chairID != EZGDTModel.getMyChairID()) {
					EZGDTModel.delUser(msg.data.roomUserInfo.chairID);
				}
				this.userLeaveRoom(msg.data.roomUserInfo)
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				// console.log("收到了玩家准备==", msg.data)
				this.onUserReady(msg.data)
			} else if (msg.type === ApiRoom.GAME_END_PUSH) {
				// console.log("游戏结束《《《《《《《《《", msg)
			} else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
				if (!msg.data.userList || msg.data.userList.length == 0) return;
				msg.data.myChairID = EZGDTModel.getMyChairID();
				AssetsManager.disDialog(msg.data);
			} else if (msg.type === ApiRoom.USER_CHAT_PUSH) {
				let idx = EZGDTModel.getUserChairIndex(msg.data.chairID)
				let com = this._userList[idx]
				if (com) {
					com.gameChat(msg.data)
				}
			} else if (msg.type === ApiRoom.USER_GIFT_SEND_PUSH) {
				this.onGift(msg.data.fromChairID, msg.data.toChairID, msg.data.giftID);
			} else if (msg.type === ApiRoom.USER_OFF_LINE_PUSH) {
				let idx = EZGDTModel.getUserChairIndex(msg.data.chairID)
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
				EZGDTModel.updateUserPlayStatus(msg.data.userPlayStatus);
			} else if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
				if (msg.data.code != 0) {
					if (msg.data.uid == UserModel.getData('uid')) {
						AssetsManager.tipDialog(Codes[msg.data.code]);
					}
					return;
				};
				EZGDTModel.setUserPropertyByUID(msg.data.uid, 'userStatus', msg.data.userStatus);
				EZGDTModel.setUserPropertyByUID(msg.data.uid, 'chairID', msg.data.toChairID);
				if (msg.data.uid == UserModel.getData('uid') && msg.data.toChairID >= EZGDTModel.getChairCount()) {
					//我自己被强制旁观
					this._userList[0].leave()
				}
				if (msg.data.toChairID < EZGDTModel.getChairCount()) {
					if (msg.data.uid == UserModel.getData('uid')) {
						this._userList.forEach(com => {
							com.leave()
						});
						this.getRoomSceneInfo()
					} else {
						/**重新刷新座位 */
						let user = EZGDTModel.getUserByChairID(msg.data.toChairID)
						this.userEnterRoom(user)
					}
				}
				//强制显示未入座的坐下按钮
				this.showSitDownButton();
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiEzgdt.GAME_BUREAU_PUSH) {
				this.onGameRoundUpdate(msg.data)
			} else if (msg.type === ApiEzgdt.GAME_STATUS_PUSH) { //游戏状态
				EZGDTModel.setGameStatus(msg.data.gameStatus)
				this.onGameStatusUpdate(msg.data)
			} else if (msg.type === ApiEzgdt.GAME_SEND_CARDS_PUSH) { //发牌
				// console.log("发牌==", msg.data)
				this.onSendCard(msg.data, true)
			} else if (msg.type === ApiEzgdt.GAME_ROB_BANK_PUSH) { //抢庄返回
				// console.log("个人抢庄返回", msg.data)
				this.onRobBanker(msg.data, true)
			} else if (msg.type === ApiEzgdt.GAME_BANKER_PUSH) { //庄家位置更新
				this.onBankerUpdate(msg.data, true)
			} else if (msg.type === ApiEzgdt.GAME_USER_POUR_SCORE_PUSH) { //玩家下分推送
				// console.log("下分推送==", msg.data)
				this.onPourScoreStart(msg.data)
			} else if (msg.type === ApiEzgdt.GAME_USER_SCORE_PUSH) { //下注
				// console.log("下注结果==", msg.data)
				this.onPlayerBet(msg.data, true)
			} else if (msg.type === ApiEzgdt.SHOW_CARDS_PUSH) { //亮牌结果
				// console.log("亮牌结果==", msg.data)
				this.onShowCard(msg.data)
			} else if (msg.type === ApiEzgdt.GAME_END_PUSH) {
				if (msg.data.result.length > 0) {
					msg.data.enterHall = this.enterHall.bind(this);
					msg.data.path = 'res/prefab/EZGDTAllResult';
					msg.data.bundle = EZGDTModel.getBundleType();
					msg.data.isUnionCreate = EZGDTModel.isUnionCreate();
					msg.data.unionID = EZGDTModel.getRoomCreatorByKey("unionID")
					msg.data.gameRule = EZGDTModel.getGameRule()
					msg.data.roomID = EZGDTModel.getRoomID()
					this.unscheduleAllCallbacks();
					this.scheduleOnce(() => {
						AssetsManager.createDialog(msg.data);
					}, 1);
				} else {
					this.enterHall();
				}
			} else if (msg.type === ApiEzgdt.GAME_REVIEW_PUSH) {
				// console.log("回看==", msg.data)
				let reviewRecord = msg.data.list
				if (reviewRecord && reviewRecord.length > 0) {
					AssetsManager.createDialog({
						bundle: EZGDTModel.getBundleType(),
						path: "res/prefab/EZGDTResultDialog",
						reviewRecord: reviewRecord,
						gameRule: EZGDTModel.getGameRule(),
						roomID: EZGDTModel.getRoomID()
					});
				} else {
					AssetsManager.tipDialog('没有数据');
				}
			} else if (msg.type === ApiEzgdt.GAME_RESULT_PUSH) {
				// console.log("游戏结算==", msg.data)
				this.onGameResult(msg.data)
			}
		} else if (route === 'ReconnectSuccess') {
			this.getRoomSceneInfo();
		} else if (route === 'SelfEntryRoomPush') {
			if (msg.gameType != EZGDTModel.getBundleType()) {
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
		}
	},
});