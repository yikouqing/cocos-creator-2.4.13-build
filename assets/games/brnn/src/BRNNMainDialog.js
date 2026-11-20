const ApiBrnn = require('./ApiBrnn');
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
const BRNNModel = require("./BRNNModel")
const CCUtil = require("../../../src/utils/CCUtil")
const Events = require('../../../src/const/Events');

cc.Class({
	extends: cc.Component,

	properties: {
		handCardPfb: cc.Prefab,
		headSelfPfb: cc.Prefab,
		headBankerPfb: cc.Prefab,
		gameTrendPfb: cc.Prefab,
		otherListPfb: cc.Prefab,
		aniPfb: cc.Prefab,
		selfNode: cc.Node,
		bankerNode: cc.Node,
		bankerListNode: cc.Node,
		trendNode: cc.Node,
		menuLay: cc.Node,
		btn_yuyin: cc.Node,
		btn_other: cc.Node,
		btn_shangZhuang: cc.Node,
		sendCardNode: cc.Node,
		littleResNode: cc.Node,
		txt_roomId: cc.Label,
		txt_bankerWait: cc.Label,

		topLay: cc.Node,
		bottomLay: cc.Node,
		rightLay: cc.Node,
		leftLay: cc.Node,
		animationNode: cc.Node,
		rolenv: cc.Node,

		com_chip: require("BRNNPour"),
		com_pool: require("BRNNPool"),
		com_clock: require("BRNNClock"),
		_comOtherList: null,
		_comBankerList: null,

		/**用户脚本列表 下标为本地座位号*/
		_userList: [],
		/**手牌脚本列表 0号位置是庄家*/
		_handCardList: [],
		/**游戏状态 */
		_gameStatus: 0,
	},

	onLoad() {
		AssetsManager.init(this.node.parent);
		this.initHeadAndTiles()
		cc.game.on(cc.game.EVENT_SHOW, this.onEventShow, this);
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

	/**入场动画 */
	start() {
		this.topLay.y = 300
		this.bottomLay.y = -300
		this.leftLay.x = -300
		this.rightLay.x = 300
		let aniTime = 0.5
		cc.tween(this.topLay).to(aniTime, {
			y: 0
		}, {
			easing: "quadOut"
		}).start()
		cc.tween(this.bottomLay).to(aniTime, {
			y: 0
		}, {
			easing: "quadOut"
		}).start()
		cc.tween(this.leftLay).to(aniTime, {
			x: 0
		}, {
			easing: "quadOut"
		}).start()
		cc.tween(this.rightLay).to(aniTime, {
			x: 0
		}, {
			easing: "quadOut"
		}).start()
		/**添加按钮事件 */
		CCUtil.nodeRecursive(this.node, (node) => {
			let tog = node.getComponent(cc.Toggle)
			let btn = node.getComponent(cc.Button)
			if (btn || tog) {
				node.on("click", this.btnClickCallFunc, this)
			}
			/**初始化音量按钮 */
			if (tog) {
				if (node.name == "tog_music") {
					tog.isChecked = AudioUtil.isMusicMute()
				} else if (node.name == "tog_sound") {
					tog.isChecked = AudioUtil.isEffectMute()
				}
			}
		})
		/**滑板动画 */
		this.rolenv.x = -440
		cc.tween(this.rolenv).delay(2).call(() => {
			this.rolenv.scaleX = -1
		}).to(5, {
			x: 230
		}).delay(1).call(() => {
			this.rolenv.scaleX = 1
		}).to(5, {
			x: -440
		}).union().repeatForever().start()
	},

	onDestroy() {
		MessageCallback.removeListener(Events.clientEvents.gvUploadFileSuccess, this);
		cc.game.off(cc.game.EVENT_SHOW, this.onEventShow, this);
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

	/**初始化头像和牌 */
	initHeadAndTiles() {
		let cardPos = [0, 1, 2, 3, 4]
		for (let i = 0; i < cardPos.length; i++) {
			let idx = cardPos[i];
			let c = cc.find("cards/card" + idx, this.node)
			c.removeAllChildren()
			let cardNode = cc.instantiate(this.handCardPfb)
			cardNode.parent = c
			this._handCardList.push(cardNode.getComponent("BRNNCardMgr"))
			this._handCardList[i].init(idx)
		}

		/**0号是自己  1号是庄家 */
		let myHead = cc.instantiate(this.headSelfPfb)
		myHead.parent = this.selfNode
		myHead.getComponent("BRNNHead").initRes()
		let bankerHead = cc.instantiate(this.headBankerPfb)
		bankerHead.parent = this.bankerNode
		bankerHead.getComponent("BRNNHead").initRes()
		this._userList.push(myHead.getComponent("BRNNHead"))
		this._userList.push(bankerHead.getComponent("BRNNHead"))

		/**走势列表 */
		let trendNode = cc.instantiate(this.gameTrendPfb)
		trendNode.parent = this.trendNode

		/**其他人列表 */
		let other = cc.instantiate(this.otherListPfb)
		other.parent = this.leftLay.parent
		this._comOtherList = other.getComponent("BRNNOtherList")
		/**庄家*/
		let banker = cc.instantiate(this.otherListPfb)
		banker.parent = this.bankerListNode
		this._comBankerList = banker.getComponent("BRNNOtherList")
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
		let isUnionCreate = BRNNModel.isUnionCreate();
		let unionID = !!isUnionCreate ? BRNNModel.getRoomCreatorByKey('unionID') : null;
		SubManager.exitBundle(unionID);
	},

	/**重置桌子上的信息 */
	resetTable() {
		this._handCardList.forEach(com => {
			com.reset()
		});
		this._userList.forEach(com => {
			com.reset()
		});
		this.com_pool.reset()
		AssetsManager.clearDialog(['BRNNResultDialog'])
	},

	gameInit(data) {
		this.unscheduleAllCallbacks();
		this.resetTable()
		BRNNModel.init(data)
		this.txt_roomId.string = "房间号" + BRNNModel.getRoomID()
		this._gameStatus = BRNNModel.getGameStatus()
		this.com_chip.init(data.gameData)
		this.com_clock.setClock(data.gameData.tick, this._gameStatus)
		this.com_pool.init(data.gameData)
		let myInfo = BRNNModel.getUserByUID(BRNNModel.myUid)
		this._userList[0].init(myInfo)
		this.onBankerUpdate(data.gameData)
		this._comBankerList.setData(data.gameData.bankerList)
		this.setUpBankerBtnShow()
		/**等待上庄列表 */
		this.onBankerWaitListChange(data.gameData.bankerList)
		/**恢复结算界面 */
		if (this._gameStatus == ApiBrnn.gameStatus.RESULT && data.gameData.result) {
			this.showResDialog(data.gameData)
		}
	},

	/**用户进入房间 */
	userEnterRoom(data) {

	},

	/**用户离开房间 */
	userLeaveRoom(data) {
		if (data.uid == UserModel.getData('uid')) {
			if (!BRNNModel.getRoomID() ||
				BRNNModel.getRoomID() == data.roomID) {
				this.enterHall()
			}
		}
	},

	/**游戏状态图更新 */
	onGameStatusUpdate(data) {
		this._gameStatus = data.gameStatus
		this.com_clock.setClock(data.tick, data.gameStatus)
		switch (this._gameStatus) {
			case ApiBrnn.gameStatus.POUR_SCORE:
				this.showAni(2)
				break;
			case ApiBrnn.gameStatus.RESULT:
				this.showAni(3)
				break;
			case ApiBrnn.gameStatus.NONE:
				cc.systemEvent.emit("betOnceSucss") //刷新筹码选择
				this.resetTable()
				break;
			default:
				break;
		}
	},

	showAni(type, callFunc = null) {
		let ani = cc.instantiate(this.aniPfb)
		ani.parent = this.animationNode
		ani.getComponent("BRNNAni").showSpineAni(type, callFunc)
	},

	/**更新庄家
	 */
	onBankerUpdate(data) {
		let banker = data.bankerUid[0]
		if (banker) {
			let info = {
				uid: banker.uid,
				userInfo: banker,
				isBanker: true
			}
			this._userList[1].init(info)
		} else {
			this._userList[1].leave()
		}
		this.setUpBankerBtnShow()
	},

	/**设置上庄按钮显示 */
	setUpBankerBtnShow() {
		let bankerUid = BRNNModel.getBankerUid()
		let bankerList = BRNNModel.getBankerList()
		let isShowShangzhuang = bankerUid.every(info => info.uid != BRNNModel.myUid) &&
			bankerList.every(info => info.uid != BRNNModel.myUid)
		this.btn_shangZhuang.active = isShowShangzhuang
	},

	/**跟新庄家等待列表 */
	onBankerWaitListChange(list) {
		this._comBankerList.setData(list)
		this.txt_bankerWait.string = list.length + "人"
	},

	/**下分推送
	 */
	onPourScore(data) {
		if (data.isSuccess) {
			let node = this._userList[0].node
			if (data.uid != BRNNModel.myUid) {
				node = this.btn_other
			}
			cc.systemEvent.emit("betOnceSucss")
			this.com_pool.onPourScore(data, node)
		} else {
			AssetsManager.tipDialog(data.message)
		}
	},

	/**展示结算界面 */
	showResDialog(data) {
		data.bundle = Enums.bundleType.BRNN
		data.mainDialog = this
		data.path = 'res/prefab/BRNNResultDialog'
		data.data = data
		data.parent = this.littleResNode
		AssetsManager.createDialog(data);
	},

	/**游戏结算 */
	onGameResult(data) {
		let dt = 1
		let result = Utils.deepCopy(data.result)
		/**发牌背 */
		let bankerCom = this._handCardList[4]
		this.scheduleOnce(() => {
			bankerCom.sendCards(result.bankerCards, this.sendCardNode)
			AssetsManager.playEffect({
				path: "res/audio/sound-sendcard",
				bundle: Enums.bundleType.BRNN
			});
		}, dt)
		dt += 0.3
		for (let i = 0; i < result.playerCards.length; i++) {
			const info = result.playerCards[i];
			let com = this._handCardList[i]
			this.scheduleOnce(() => {
				com.sendCards(info, this.sendCardNode)
				AssetsManager.playEffect({
					path: "res/audio/sound-sendcard",
					bundle: Enums.bundleType.BRNN
				});
			}, dt)
			dt += 0.3
		}
		/**展示牌和牌型 */
		for (let i = 0; i < result.playerCards.length; i++) {
			const info = result.playerCards[i];
			let com = this._handCardList[i]
			this.scheduleOnce(() => {
				com.showCard(info, true)
			}, dt)
			dt += 1
		}
		this.scheduleOnce(() => {
			bankerCom.showCard(result.bankerCards, true)
		}, dt)
		dt += 1
		/**展示赢的动画 */
		let winPool = result.winPool
		this.scheduleOnce(() => {
			this.com_pool.showWinAni(winPool)
		}, dt)
		dt += 1
		/**展示输赢飞筹码 */
		this.scheduleOnce(() => {
			this.com_pool.flyChipsToSB(winPool, this._userList[0].node, this.btn_other, this._userList[1].node)
		}, dt)
		dt += 2
		/**改变用户分数 */
		let winScore = result.winScore
		this.scheduleOnce(() => {
			let selfCom = this._userList[0]
			let bankerCom = this._userList[1]
			selfCom.setUserScoreAfterAni(winScore)
			bankerCom.setUserScoreAfterAni(winScore)
		}, dt)
		/**显示结算界面 */
		dt += 0.5
		this.scheduleOnce(() => {
			this.showResDialog(data)
		}, dt)
	},

	/**语音相关 */
	_yuYinShow() {
		return
		let isInSeat = BRNNModel.isInSeat();
		let yuyin = BRNNModel.getGameRuleByKey('yuyin');
		this.btn_yuyin.active = isInSeat && !!yuyin && ConfigModel.getData('voiceSpeaker');
	},

	_onUploadSuccess(fileId) {
		return
		this._lastChatTick = this._lastChatTick || 0;
		if ((Date.now() - this._lastChatTick) < 2000) {
			AssetsManager.tipDialog("亲，请勿频繁发送消息哦~");
			return;
		}
		this._lastChatTick = Date.now();
		ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(Enums.chatType.VOICE, fileId, null))
	},

	onGift(fromChairID, toChairID, giftID) {
		let fidx = BRNNModel.getUserChairIndex(fromChairID)
		let tidx = BRNNModel.getUserChairIndex(toChairID)
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

	_onLeaveClick() {
		if (!UserModel.isInRoom()) {
			this.enterHall();
			return;
		}
		ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
	},

	_onMenuOpen() {
		this.menuLay.stopAllActions()
		this.menuLay.y = 500
		this.menuLay.active = true;
		cc.tween(this.menuLay).to(0.2, {
			y: 0
		}, {
			easing: "quadOut"
		}).start()
	},

	_onMenuCloseClick() {
		this.menuLay.stopAllActions()
		cc.tween(this.menuLay).to(0.2, {
			y: 500
		}, {
			easing: "quadIn"
		}).start()
	},

	/**按钮响应 */
	btnClickCallFunc(event, param) {
		let node = event.node || event.target
		// console.log("点击了按钮", node.name, node, event.target)
		switch (node.name) {
			case "btn_openMenu": //菜单
				if (CCUtil.clickInterval(node, 0.2)) {
					return;
				}
				this._onMenuOpen()
				break;
			case "btn_leave": //离开房间
				if (CCUtil.clickInterval(node, 0.2)) {
					return;
				}
				this._onLeaveClick();
				break;
			case "btn_rule": //规则
				if (CCUtil.clickInterval(node, 0.2)) {
					return;
				}
				AssetsManager.createDialog({
					bundle: Enums.bundleType.BRNN,
					path: "res/prefab/BRNNRule",
				});
				break;
			case "btn_shangZhuang": //上庄
				if (CCUtil.clickInterval(node, 1)) {
					return;
				}
				let myInfo = BRNNModel.getUserByUID(BRNNModel.myUid)
				let bankerScore = BRNNModel.getGameRuleByKey("bankerScore")
				if (bankerScore > myInfo.userInfo.score) {
					AssetsManager.tipDialog(`您的积分不足${bankerScore}分，无法上庄`)
					return
				}
				AssetsManager.createDialog({
					bundle: Enums.bundleType.BRNN,
					path: "res/prefab/BRNNUpBanker",
				});
				break;
			case "btn_xiaZhuang": //下庄
				if (CCUtil.clickInterval(node, 1)) {
					return;
				}
				ApiRoom.gameMessageNotify(ApiBrnn.gameUserApplyBankerNotify(BRNNModel.myUid));
				break;
			case "btn_other": //其他玩家
				this._comOtherList.showList(1)
				break;
			case "btn_waitBanker": //庄家列表
				this._comBankerList.showList(2)
				break;
			case "btn_closeMenu": //关闭
				this._comBankerList.hideList()
				this._comOtherList.hideList()
				this._onMenuCloseClick()
				break;
			case "btn_rebet": //续投
				ApiRoom.gameMessageNotify(ApiBrnn.gameUserFollowPourNotify());
				break;
			case "tog_music": //选中是静音，未选中是恢复
				AudioUtil.setMusicMute(event.isChecked)
				break;
			case "tog_sound":
				AudioUtil.setEffectMute(event.isChecked)
				break;
			default:
				break;
		}
	},

	/**消息监听 */
	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				// console.log("初始化================================", msg.data)
				this.gameInit(msg.data);
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				BRNNModel.addUser(msg.data.roomUserInfo);
				this.userEnterRoom(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				if (msg.data.roomUserInfo.chairID != BRNNModel.getMyChairID()) {
					BRNNModel.delUser(msg.data.roomUserInfo.chairID);
				}
				this.userLeaveRoom(msg.data.roomUserInfo)
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_RESPONSE) {
				// console.log("退出房间", msg.data)
				if (!msg.data.isSuccess) {
					AssetsManager.tipDialog(msg.data.message)
				}
			} else if (msg.type === ApiRoom.GAME_END_PUSH) { } else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
				if (!msg.data.userList || msg.data.userList.length == 0) return;
				msg.data.myChairID = BRNNModel.getMyChairID();
				AssetsManager.disDialog(msg.data);
			} else if (msg.type === ApiRoom.USER_CHAT_PUSH) {
				let idx = BRNNModel.getUserChairIndex(msg.data.chairID)
				let com = this._userList[idx]
				if (com) {
					com.gameChat(msg.data)
				}
			} else if (msg.type === ApiRoom.USER_GIFT_SEND_PUSH) {
				this.onGift(msg.data.fromChairID, msg.data.toChairID, msg.data.giftID);
			} else if (msg.type === ApiRoom.USER_VOICE_PUSH) {
				this._voiceMsgQueue.push(msg.data);
			} else if (msg.type === ApiRoom.USER_OFF_LINE_PUSH) {
				let idx = BRNNModel.getUserChairIndex(msg.data.chairID)
				let com = this._userList[idx]
				if (com) com.setOffline(true)
			} else if (msg.type === ApiRoom.ROOM_USER_INFO_CHANGE_PUSH) { //用户信息刷新
				// console.log("用户信息变化", msg.data)
				BRNNModel.userInfoChange(msg.data)
				this._userList.forEach(com => {
					if (com) {
						com.userInfoChange(msg.data)
					}
				});
			} else if (msg.type === ApiRoom.USER_GAME_STATUS_PUSH) { //用户游戏状态
				BRNNModel.updateUserPlayStatus(msg.data.userPlayStatus);
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiBrnn.GAME_STATUS_PUSH) { //游戏状态
				// console.log("游戏状态===", msg.data)
				BRNNModel.setGameStatus(msg.data)
				this.onGameStatusUpdate(msg.data)
			} else if (msg.type === ApiBrnn.GAME_USER_POUR_SCORE_PUSH) { //玩家下分推送
				this.onPourScore(msg.data)
			} else if (msg.type === ApiBrnn.GAME_RESULT_PUSH) { //游戏结算
				// console.log("结算===", msg.data)
				this.onGameResult(msg.data)
			} else if (msg.type === ApiBrnn.GAME_USER_APPLY_BANKER_PUSH) { //上庄结果
				// console.log("上庄结果===", msg.data)
				if (msg.data.uid == BRNNModel.myUid) {
					AssetsManager.tipDialog(msg.data.message)
					AssetsManager.clearDialog(['BRNNUpBanker'])
					if (msg.data.isSuccess) {
						this.setUpBankerBtnShow()
						cc.systemEvent.emit("betOnceSucss") //刷新筹码选择
					}
				}
			} else if (msg.type === ApiBrnn.BANKER_CHANGR_PUSH) {
				// console.log("等待上庄列表", msg.data)
				BRNNModel.setBankerList(msg.data.bankerList)
				this.onBankerWaitListChange(msg.data.bankerList)
			} else if (msg.type === ApiRoom.GAME_BANKER_PUSH) {
				// console.log("庄家变化==", msg.data)
				BRNNModel.setBankerUid(msg.data.bankerUid)
				this.onBankerUpdate(msg.data)
			}
		} else if (route === 'ReconnectSuccess') {
			this.getRoomSceneInfo();
		} else if (route === 'SelfEntryRoomPush') {
			if (msg.gameType != BRNNModel.getBundleType()) {
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