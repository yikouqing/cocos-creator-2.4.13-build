const ApiMjnn = require('./ApiMjnn');
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
const MJNNModel = require("./MJNNModel")
const CCUtil = require("../../../src/utils/CCUtil")
const Events = require('../../../src/const/Events');

cc.Class({
	extends: cc.Component,

	properties: {
		handCardsList: [require('MJNNHandTileMgr')],
		userList: [require('MJNNHead')],
		optComp: require("MJNNOpt"),
		txtRound: cc.Label,
		txtRoomId: cc.Label,
		btnLocation: cc.Node,
		btnCopy: cc.Node,
		btnInvite: cc.Node,
		btnReady: cc.Node,
		btnLeave: cc.Node,
		btnDismiss: cc.Node,
		btnSheZhi: cc.Node,
		btnZuoXia: cc.Node,
		watchBar: cc.Node,
		btnChat: cc.Node,
		menu: cc.Node,
		tuoguan: cc.Node,
		btnDeposit: cc.Node,
		animationNode: cc.Node,
		menuLay: cc.Node,
		menuLayList: cc.Node,
		btnBackHall: cc.Node,
		btnYuYin: cc.Node,
		canNotDismissBar: cc.Node,

		_aniX: 0,
		/**用户脚本列表 下标为本地座位号*/
		_userCompList: [],
		/**手牌脚本列表 */
		_handCardsComp: [],
		/**当前发牌的牌堆下标 */
		_sendCardIdx: 0,
		/**当前正在飞的所有牌 */
		_allFlyNode: [],
	},

	onLoad() { },

	start() {
		this.menuLay.active = false
		AssetsManager.init(this.node.parent);
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
		this._sceneInit();
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

	_sceneInit() {
		//初始化场景参数
		this._userCompList.length = [];
		this._handCardsComp.length = [];
		this.userList.forEach((user, index, users) => {
			user.init();
		});
		this.handCardsList.forEach((hand, index, hands) => {
			hand.init(index);
		})
		this._getRoomInfo();
	},

	onDestroy() {
		cc.game.off(cc.game.EVENT_SHOW, this.onEventShow, this);
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
		MessageCallback.removeListener(Events.clientEvents.gvUploadFileSuccess, this);
	},

	/**切换后台返回 */
	onEventShow() {
		this._getRoomInfo();
	},

	/**获取房间信息 */
	_getRoomInfo() {
		if (UserModel.isInRoom()) {
			ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
		} else {
			this.enterHall();
		}
	},

	/**返回大厅 */
	enterHall() {
		let isUnionCreate = MJNNModel.isUnionCreate();
		let unionID = !!isUnionCreate ? MJNNModel.getRoomCreatorByKey('unionID') : null;
		SubManager.exitBundle(unionID);
	},

	_reset() {
		this._userCompList.forEach(com => {
			com.reset();
		});
		this._handCardsComp.forEach(com => {
			com.reset();
		});
		this.optComp.reset()
	},

	_yuYinShow() {
		let isInSeat = MJNNModel.isInSeat();
		let yuyin = MJNNModel.getGameRuleByKey('yuyin');
		this.btnYuYin.active = isInSeat && !!yuyin && ConfigModel.getData('voiceSpeaker');
	},

	_gameInit(data) {
		// console.log("初始化-----", data);
		this.unscheduleAllCallbacks();
		MessageCallback.emitMessage('RemoveGameResult');
		MJNNModel.init(data);
		let gameStatus = MJNNModel.getGameStatus();
		this._userCompList = [];
		this._handCardsComp = [];
		let maxPlayerCount = MJNNModel.getChairCount();
		let tableSeats = [0, 1, 2, 3, 4, 5, 6, 7];
		if (maxPlayerCount == 4) {
			//4人场
			tableSeats = [0, 1, 4, 7];
		} else if (maxPlayerCount == 6) {
			//6人场
			tableSeats = [0, 1, 2, 4, 6, 7];
		}
		this.userList.forEach((user, index, list) => {
			if (!!tableSeats.includes(index)) {
				this._userCompList.push(user);
			}
			user.leave();
		});
		this.handCardsList.forEach((cards, index, list) => {
			if (!!tableSeats.includes(index)) {
				this._handCardsComp.push(cards);
			}
			cards.leave();
		});
		this.animationNode.removeAllChildren();
		this._reset();
		/**初始化用户信息 */
		let roomUserInfoArr = data.roomUserInfoArr || [];
		roomUserInfoArr.forEach((user, index, users) => {
			this._onEnter(user);
		});
		this._initTotalScore(data.gameData.userWinTotalScore);
		/**按钮显示 */
		this.btnInvite.active = MJNNModel.getCurBureau() == 0 && !cc.sys.isBrowser && !!ConfigModel.getData('gameWechatInvite');
		this.btnCopy.active = MJNNModel.getCurBureau() == 0 && !cc.sys.isBrowser && !!ConfigModel.getData('gameWechatInvite');
		this.btnBackHall.active = MJNNModel.getCurBureau() == 0 && MJNNModel.isUnionCreate();
		this.btnLocation.active = !!MJNNModel.getGameRuleByKey("showGps");
		if (this.canNotDismissBar) this.canNotDismissBar.active = MJNNModel.getGameRuleByKey("canNotDissmiss")
		this._onReadySync();
		this.btnLeave.active = data.gameData.curBureau == 0 || !MJNNModel.isInSeat();
		this.btnDismiss.active = data.gameData.curBureau > 0 && !!MJNNModel.isInSeat();
		this.btnDeposit.active = MJNNModel.getGameRuleByKey("canTrust")
		this._yuYinShow();
		this._showSit();
		/**房间号和局数 */
		this.txtRoomId.string = `游戏:${ConfigModel.getGameName(Enums.bundleType.MJNN)} 房号:${data.roomID}`
		this.txtRound.string = `局数:${data.gameData.curBureau}/${data.gameData.maxBureau}`

		/**恢复桌面 */
		this._setClock(data.gameData);
		this._onBanker({
			uid: data.gameData.bankerUid
		});
		//抢庄同步
		let robBankList = data.gameData.robBankList || [];
		robBankList.forEach((rob) => {
			this._onRob(rob);
		});
		this.optComp.setRobNode();

		//下分同步
		let userBetScore = data.gameData.userBetScore || {};
		for (const uid in userBetScore) {
			const data = userBetScore[uid];
			this._onBet(data);
		}
		this.optComp.setBetNode();
		//手牌同步
		if (gameStatus != ApiMjnn.gameStatus.NONE) {
			let handCards = data.gameData.handCards || [];
			for (const uid in handCards) {
				let idx = MJNNModel.getUserChairIdxByUID(uid);
				if (!this._handCardsComp[idx]) continue;
				let show = MJNNModel.getShowCards(uid);
				let isShow = (gameStatus == ApiMjnn.gameStatus.SHOW_CARDS || gameStatus == ApiMjnn.gameStatus.RESULT) && !!show;
				if (!!isShow) {
					this._handCardsComp[idx].updateLieTiles(uid, show.cards);
					this._handCardsComp[idx].showCardType(show);
				} else {
					this._handCardsComp[idx].updateLieTiles(uid, handCards[uid]);
				}
			}
		}
		this.optComp.setShowNode();
		this._showTest();
	},

	/**用户进入房间 */
	_onEnter(data) {
		if (data.chairID >= MJNNModel.getChairCount() || data.playStatus == ApiRoom.playStatus.WATCH) return;
		let idx = MJNNModel.getUserChairIdx(data.chairID)
		let headcom = this._userCompList[idx]
		if (!headcom) return;
		headcom.sit(data)
	},

	/**恢复所有人的总输赢分数 */
	_initTotalScore(userWinTotalScore) {
		if (userWinTotalScore && MJNNModel.scoreState()) {
			userWinTotalScore = userWinTotalScore || {};
			let keys = Object.keys(userWinTotalScore);
			if (keys.length > 0) {
				for (const uid in userWinTotalScore) {
					const s = userWinTotalScore[uid];
					let idx = MJNNModel.getUserChairIdxByUID(uid)
					let com = this._userCompList[idx]
					if (com) com.setTotalScore(s);
				}
			} else {
				this._userCompList.forEach((user) => {
					user.setTotalScore(0);
				})
			}
		} else {
			this._userCompList.forEach((user) => {
				user.setTotalScore('0')
			})
		}
	},

	/**用户离开房间 */
	_onLeave(data) {
		if (data.chairID < MJNNModel.getChairCount()) {
			let idx = MJNNModel.getUserChairIdx(data.chairID)
			let headcom = this._userCompList[idx];
			if (!!headcom) {
				headcom.leave();
			}
			let cardsComp = this._handCardsComp[idx];
			if (!!cardsComp) {
				cardsComp.leave();
			}
		}
		if (data.uid == UserModel.getData('uid')) {
			if (!MJNNModel.getRoomID() ||
				MJNNModel.getRoomID() == data.roomID) {
				this.enterHall()
			}
		}
	},

	/**玩家准备 */
	_onReady(data) {
		let idx = MJNNModel.getUserChairIdx(data.chairID);
		let com = this._userCompList[idx];
		if (com) com.setReady(true);
		if (data.chairID == MJNNModel.getMyChairID()) {
			this.btnReady.active = false;
			this._reset()
		}
	},

	/**隐藏所有准备图标*/
	hideReadyIcon() {
		this._userCompList.forEach(userCom => {
			userCom.setReady(false)
		});
	},

	/**更新局数 */
	_onGameRoundUpdate(data) {
		// console.log("更新局数==", data);
		MessageCallback.emitMessage('RemoveGameResult');
		MJNNModel.setCurBureau(data.curBureau);
		this.txtRound.string = `局数:${data.curBureau}/${MJNNModel.getMaxBureau()}`
		this.btnInvite.active = false;
		this.btnCopy.active = false;
		this.btnBackHall.active = false
		let uid = MJNNModel.getMyUID();
		let sUser = MJNNModel.getUserByUID(uid);
		this.btnLeave.active = !!sUser && sUser.chairID >= MJNNModel.getChairCount();
		this.btnDismiss.active = !!sUser && sUser.chairID < MJNNModel.getChairCount();
		this._reset()
	},

	_setClock(data) {
		let gameStatus = MJNNModel.getGameStatus();
		let str = ["等待开始", "发牌中.", "抢庄中", ".下注中.", "亮牌中", "结算中"];
		data.tick = gameStatus == ApiMjnn.gameStatus.NONE ? null : data.tick;
		this.optComp.setClock(data.tick, str[gameStatus]);
	},

	/**游戏状态图更新 */
	_onGameStatus(data) {
		MJNNModel.setGameStatus(data.gameStatus);
		this.btnReady.active = false;
		this.hideReadyIcon();
		this.optComp.reset();
		this._setClock(data);
		this.optComp.setRobNode();
		this.optComp.setShowNode();
		switch (data.gameStatus) {
			case ApiMjnn.gameStatus.NONE:
				this._reset()
				this._onReadySync();
				break;
			case ApiMjnn.gameStatus.SHOW_CARDS:
				this._onShowOpt();
				break;
			case ApiMjnn.gameStatus.POUR_SCORE:
				this._onPourOpt();
				break;
			default:
				break;
		}
	},

	_onReadySync() {
		let gameStatus = MJNNModel.getGameStatus();
		let uid = MJNNModel.getMyUID();
		let playStatus = MJNNModel.getUserPlayStatus(uid);
		this.btnReady.active = !!MJNNModel.isInSeat() && gameStatus === ApiMjnn.gameStatus.NONE && playStatus != ApiRoom.playStatus.READY;
	},

	//进入下分阶段
	_onPourOpt() {
		let isAnZhuangQiangZhuang = MJNNModel.getGameRuleByKey("isAnZhuangQiangZhuang");
		if (!isAnZhuangQiangZhuang) return;
		let canUseTest = MJNNModel.canUseTest();
		if (!!canUseTest) return;
		let uid = MJNNModel.getMyUID();
		let handCards = MJNNModel.getUserCards(uid);
		if (!handCards) return;
		let idx = MJNNModel.getUserChairIdxByUID(uid);
		if (!this._handCardsComp[idx]) return;
		this._handCardsComp[idx].updateLieTiles(uid, handCards);
	},

	//亮牌操作 进入亮牌阶段
	_onShowOpt() {
		let handCards = MJNNModel.getHandCards();
		for (const uid in handCards) {
			let idx = MJNNModel.getUserChairIdxByUID(uid);
			if (!this._handCardsComp[idx]) continue;
			this._handCardsComp[idx].updateLieTiles(uid, handCards[uid], 2);
		}
	},

	/**发牌 */
	_onSend(data, isAni = false) {
		let handCards = data.handCards || {};
		MJNNModel.setHandCards(handCards);
		this._handCardsComp.forEach(com => {
			com.reset();
		});
		for (const uid in handCards) {
			let idx = MJNNModel.getUserChairIdxByUID(uid);
			if (!this._handCardsComp[idx]) continue;
			this._handCardsComp[idx].updateLieTiles(uid, handCards[uid], 1);
		}
	},

	_onRob(data, audio = false) {
		if (data.uid == MJNNModel.getMyUID()) {
			this.optComp.setRobNode();
		}
		let idx = MJNNModel.getUserChairIdxByUID(data.uid)
		let ucom = this._userCompList[idx];
		if (ucom) ucom.setRob(data);
		if (!audio) return;
		let robScale = MJNNModel.getGameRuleByKey("robBankLimit");
		robScale = robScale || 1;
		let url = `res/audio/woman/rob${data.isRob}`;
		if (robScale > 1 && data.isRob > 0) {
			url = `res/audio/woman/rob1${data.isRob}`;
		}
		let user = MJNNModel.getUserByUID();
		if (user && user.userInfo.sex == 0) {
			url = url.replace(/woman/g, "man");
		}
		AssetsManager.playEffect({
			path: url,
			bundle: Enums.bundleType.MJNN
		});
	},

	/**
	 * 定庄
	 * @param {} data 
	 * @param {*} isAni 
	 * @returns 
	 */
	_onBanker(data, isAni = false) {
		MJNNModel.setBankerUID(data.uid);
		this.optComp.setRobNode();
		let idx = MJNNModel.getUserChairIdxByUID(data.uid);
		let userComp = this._userCompList[idx];
		if (!userComp) return;
		this._userCompList.forEach(ucom => {
			ucom.setRob();
			ucom.setBanker(false);
		});
		if (!isAni) {
			userComp.setBanker(true);
			return;
		}
		let fly = () => {
			let bankerNode = userComp.getBanker();
			let endpos = CCUtil.postionConvert(bankerNode, this.animationNode)
			let flyBanker = cc.instantiate(bankerNode)
			flyBanker.parent = this.animationNode
			flyBanker.setPosition(0, 0)
			flyBanker.active = true
			cc.tween(flyBanker).to(0.5, {
				position: endpos
			}).call(() => {
				flyBanker.destroy()
				userComp.setBanker(true)
			}).start()
		}
		if (data.userList && data.userList.length > 1) {
			/**播放抢庄动画 */
			let dt = 0
			for (let i = 0; i < data.userList.length; i++) {
				let idx1 = MJNNModel.getUserChairIdxByUID(data.userList[i]);
				let ucom = this._userCompList[idx1]
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
				dt += 0.2
			}
			AssetsManager.playEffect({
				path: "res/audio/main/rob",
				bundle: Enums.bundleType.MJNN
			});
		} else {
			// if (MJNNModel.getCurBureau() > 1) {
			// 	AssetsManager.playEffect({
			// 		path: "res/audio/main/changeBanker",
			// 		bundle: Enums.bundleType.MJNN
			// 	});
			// }
			fly();
		}
	},

	/**玩家下注返回
	 * uid,
	 score
	 */
	_onBet(data, isAni = false) {
		if (data.uid == MJNNModel.getMyUID()) {
			this.optComp.setBetNode();
		}
		let idx = MJNNModel.getUserChairIdxByUID(data.uid);
		let ucom = this._userCompList[idx];
		if (!ucom) return;
		let isBanker = MJNNModel.isBanker(data.uid);
		if (!!isBanker) {
			ucom.setBet();
		} else {
			ucom.setBet(data.score, isAni);
		}
		if (!!isAni && !!data.isTui) {
			let audio = `res/audio/woman/tui`;
			let user = MJNNModel.getUserByUID(data.uid);
			if (user && user.userInfo.sex == 0) {
				audio = audio.replace(/woman/g, "man");
			}
			AssetsManager.playEffect({
				path: audio,
				bundle: Enums.bundleType.MJNN
			});
		}
	},

	/**亮牌结果 */
	_onShowCard(data) {
		let show = data.cardsList;
		MJNNModel.setShowCards(show);
		if (data.chairID == MJNNModel.getMyChairID()) {
			this.optComp.setShowNode();
		}
		let idx = MJNNModel.getUserChairIdx(show.chairID);
		let hcom = this._handCardsComp[idx];
		if (!hcom) return;
		hcom.updateLieTiles(show.uid, show.cards);
		hcom.showCardType(show, true);
	},

	_onGameResult(data) {
		this.unscheduleAllCallbacks();
		let dt = 0;
		let bankerIdx = MJNNModel.getUserChairIdxByUID(MJNNModel.getBankerUID())
		let ucom = this._userCompList[bankerIdx]
		let winList = [];
		let loseList = [];
		let result = data.result || [];
		result.forEach(user => {
			let idx = MJNNModel.getUserChairIdxByUID(user.uid)
			if (idx != bankerIdx) {
				if (user.winScores > 0) {
					winList.push(idx)
				} else if (user.winScores < 0) {
					loseList.push(idx);
				}
			}
			let com = this._userCompList[idx];
			!!com && com.setWin(user.winScores)
		});
		let icon = ucom.getGoldIcon();
		let flygold = (start, end) => {
			AssetsManager.playEffect({
				path: 'res/audio/main/fly_gold',
				bundle: Enums.bundleType.MJNN
			});
			for (let i = 0; i < 10; ++i) {
				let node = cc.instantiate(icon);
				node.setPosition(start);
				node.parent = this.node;
				cc.tween(node)
					.delay(0.08 * i)
					.to(0.3, {
						position: end
					})
					.removeSelf()
					.start()
			}
		}
		let bankerPos = ucom.node.getPosition();
		winList.forEach(idx => {
			let comp = this._userCompList[idx]
			if (comp) {
				let pos = comp.node.getPosition()
				flygold(bankerPos, pos);
			}
		});
		this.scheduleOnce(() => {
			loseList.forEach(idx => {
				let comp = this._userCompList[idx]
				if (comp) {
					let pos = comp.node.getPosition()
					flygold(pos, bankerPos)
				}
			});
		}, 0.5);
		dt += 2;
		let isLastRound = MJNNModel.getCurBureau() == MJNNModel.getMaxBureau();
		this.scheduleOnce(() => { // 显示结果
			data.bundle = Enums.bundleType.MJNN
			data.myChairID = this.myChairID
			data.isBureauFull = isLastRound
			data.mainDialog = this
			data.path = 'res/prefab/MJNNResultDialog'
			data.isResult = true;
			// AssetsManager.createDialog(data);
		}, dt);
	},

	onGift(fromChairID, toChairID, giftID) {
		let fidx = MJNNModel.getUserChairIdx(fromChairID);
		let tidx = MJNNModel.getUserChairIdx(toChairID);
		let sender = this._userCompList[fidx].node;
		let reciever = [],
			rids = [];
		if (fidx == tidx) {
			for (let i = 0; i < this._userCompList.length; i++) {
				const comp = this._userCompList[i];
				reciever.push(comp.node);
				rids.push(i);
			}
		} else {
			reciever.push(this._userCompList[tidx].node);
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

	_onBtnTest() {
		let pGuan = MJNNModel.isPlaying();
		let isTest = UserModel.getData("isTest")
		if (!isTest || !pGuan) return;
		AssetsManager.createDialog({
			bundle: Enums.bundleType.MJNN,
			path: "res/prefab/MJNNSelectTest",
			mainDialog: this
		})
	},

	_showTest() {
		let isTest = UserModel.getData("isTest");
		this.btnSheZhi.active = false // !!isTest
	},

	/**给没座位的人显示坐下按钮 */
	_showSit() {
		this.btnZuoXia.active = !MJNNModel.isInSeat() &&
			MJNNModel.checkHaveEmptySeat();
		this.watchBar.active = !MJNNModel.isInSeat();
		this.btnChat.active = MJNNModel.isInSeat();
	},

	/**坐下按钮响应 */
	_onBtnSitDown() {
		/**检查是否还有空位，有就发送坐下命令 */
		let chairID = MJNNModel.getCanSitDownChairID();
		let idx = MJNNModel.getUserChairIdx(chairID)
		if (chairID == -1 || !this._userCompList[idx]) {
			AssetsManager.tipDialog('没有座位可以坐下！');
			return;
		}
		// console.log('找到座位坐下', chairID);
		ApiRoom.roomMessageNotify(ApiRoom.getUserChangeSeatNotify(MJNNModel.getMyChairID(), chairID));
	},

	/**观战列表响应 */
	_onLookOnClick() {

		let users = MJNNModel.getLookOnUsers();
		if (users.length == 0) {
			AssetsManager.tipDialog('暂无观战玩家！');
			return;
		}
		AssetsManager.standDialog({
			users: users
		});
	},

	/**按钮响应 */
	btnClickCallFunc(event, param) {
		switch (param) {
			case "onmenu": //菜单
				this.menuLay.active = true;
				this._onMenuOpen();
				break;
			case "offmenu": //关闭菜单
				this.menuLay.active = false
				break
			case "onleave": //离开房间
				if (!UserModel.isInRoom()) {
					this.enterHall();
					return;
				}
				ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
				break;
			case "onready": //准备
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify(true));
				this.btnReady.active = false;
				break;
			case "ondismiss": //解散
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
			case "onrefresh": //刷新
				if (CCUtil.clickInterval(event.target, 10, true)) return;
				AssetsManager.tipDialog('刷新界面可以修复游戏显示问题');
				this._getRoomInfo()
				break;
			case "onsetting": //设置
				AssetsManager.setDialog({
					type: "ttz",
					gameType: Enums.bundleType.MJNN,
				});
				break;
			case "onreview": //回看
				if (CCUtil.clickInterval(event.target, 1)) return;
				ApiRoom.gameMessageNotify(ApiMjnn.gameReviewNotify());
				break;
			case "onmsg": //聊天
				if (CCUtil.clickInterval(event.target, 1)) return;
				let params = {
					gameRule: MJNNModel.getGameRule(),
					chat: (chat) => {
						ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
					}
				}
				AssetsManager.chatDialog(params);
				break;
			case "onroomInfo": //规则
				if (CCUtil.clickInterval(event.target, 1)) return;
				let rule = MJNNModel.getGameRule()
				if (!rule) return;
				AssetsManager.tableDialog({
					gameRule: rule,
				});
				break;
			case "onlocation": //定位
				if (CCUtil.clickInterval(event.target, 1)) return;
				let users = []
				for (let i = 0; i < this._userCompList.length; i++) {
					const u = this._userCompList[i];
					let data = u.getUserData()
					if (data) {
						users.push(data)
					}
				}
				AssetsManager.locationDialog({
					users: users,
					chairCount: MJNNModel.getChairCount(),
					fangzuobi: MJNNModel.getGameRuleByKey('fangzuobi')
				})
				break;
			case "ondeposit": //开始托管
				if (CCUtil.clickInterval(event.target, 1)) return;
				ApiRoom.gameMessageNotify(ApiMjnn.gameTrushNotify(true));
				break;
			case "onquxiaotuoguan": //取消托管
				if (CCUtil.clickInterval(event.target, 1)) return;
				ApiRoom.gameMessageNotify(ApiMjnn.gameTrushNotify(false));
				break;
			case "oninvite": //邀请
				let gameRule = MJNNModel.getGameRule()
				gameRule = gameRule || {};
				gameRule.roomId = MJNNModel.getRoomID();
				let share = ConfigModel.getRoomRuleShare(gameRule);
				NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
				break;
			case "oncopy": //复制
				let str = ConfigModel.getRoomShare(Enums.bundleType.MJNN, MJNNModel.getRoomID())
				NativeUtil.copyText(str);
				break;
			case "onzuoxia":
				if (CCUtil.clickInterval(event.target, 0.5)) return;
				this._onBtnSitDown();
				break;
			case "onpangguan":
				if (CCUtil.clickInterval(event.target, 0.5)) return;
				this._onLookOnClick();
				break;
			case "onshezhi":
				this._onBtnTest();
				break;
			default:
				break;
		}
	},
	onShowInvite() {
		AssetsManager.friendDialog({
			gameRule: MJNNModel.getGameRule(),
		})
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

	/**消息监听 */
	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this._gameInit(msg.data);
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				MJNNModel.addUser(msg.data.roomUserInfo);
				this._onEnter(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				if (msg.data.roomUserInfo.chairID != MJNNModel.getMyChairID()) {
					MJNNModel.delUser(msg.data.roomUserInfo.chairID);
				}
				this._onLeave(msg.data.roomUserInfo)
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				// console.log("收到了玩家准备==", msg.data)
				this._onReady(msg.data)
			} else if (msg.type === ApiRoom.GAME_END_PUSH) {
				// console.log("游戏结束《《《《《《《《《", msg)
			} else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
				if (!msg.data.userList || msg.data.userList.length == 0) return;
				msg.data.myChairID = MJNNModel.getMyChairID();
				AssetsManager.disDialog(msg.data);
			} else if (msg.type === ApiRoom.USER_CHAT_PUSH) {
				let idx = MJNNModel.getUserChairIdx(msg.data.chairID)
				let com = this._userCompList[idx]
				if (com) {
					com.gameChat(msg.data)
				}
			} else if (msg.type === ApiRoom.USER_GIFT_SEND_PUSH) {
				this.onGift(msg.data.fromChairID, msg.data.toChairID, msg.data.giftID);
			} else if (msg.type === ApiRoom.USER_VOICE_PUSH) {
				this._voiceMsgQueue.push(msg.data);
			} else if (msg.type === ApiRoom.USER_OFF_LINE_PUSH) {
				let idx = MJNNModel.getUserChairIdx(msg.data.chairID)
				let com = this._userCompList[idx]
				if (com) com.setOffline(true)
			} else if (msg.type === ApiRoom.ROOM_USER_INFO_CHANGE_PUSH) { //用户信息刷新
				// console.log('加锅推筒子-ROOM_USER_INFO_CHANGE_PUSH', msg.data);
				MJNNModel.updateUserProperties(msg.data.changeInfo);
				this._userCompList.forEach(com => {
					com && com.userInfoChange(msg.data);
				});
			} else if (msg.type === ApiRoom.ROOM_USER_WIN_TOTAL_PUSH) {
				/**玩家总输赢分数 */
				// console.log("玩家总输赢==", msg.data)
				this._initTotalScore(msg.data.userWinTotalScore)
			} else if (msg.type === ApiRoom.USER_GAME_STATUS_PUSH) {
				// console.log('玩家状态推送', msg.data)
				MJNNModel.updateUserPlayStatus(msg.data.userPlayStatus);
			} else if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
				if (msg.data.code != 0) {
					if (msg.data.uid == UserModel.getData('uid')) {
						AssetsManager.tipDialog(Codes[msg.data.code]);
					}
					return;
				}
				MJNNModel.onUserChangeSeat(msg.data);
				if (msg.data.uid == UserModel.getData('uid') &&
					msg.data.toChairID >= MJNNModel.getChairCount()) {
					//我自己被强制旁观
					this._userCompList[0].reset();
					this._handCardsComp[0].reset();
				}
				if (msg.data.toChairID < MJNNModel.getChairCount()) {
					if (msg.data.uid == UserModel.getData('uid')) {
						this._userCompList.forEach(com => {
							com.reset();
						});
						this._handCardsComp.forEach(com => {
							com.reset();
						});
						this._getRoomInfo()
					} else {
						/**重新刷新座位 */
						let user = MJNNModel.getUserByChairID(msg.data.toChairID)
						this._onEnter(user)
					}
				}
				//强制显示未入座的坐下按钮
				this._showSit();
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiMjnn.GAME_BUREAU_PUSH) {
				this._onGameRoundUpdate(msg.data)
			} else if (msg.type === ApiMjnn.GAME_STATUS_PUSH) { //游戏状态
				this._onGameStatus(msg.data)
			} else if (msg.type === ApiMjnn.GAME_SEND_CARDS_PUSH) { //发牌
				// console.log("发牌==", msg.data)
				this._onSend(msg.data, true)
			} else if (msg.type === ApiMjnn.GAME_ROB_BANK_PUSH) { //抢庄返回
				// console.log("个人抢庄返回", msg.data);
				MJNNModel.onUserRobOpt(msg.data);
				this._onRob(msg.data, true);
			} else if (msg.type === ApiMjnn.GAME_BANKER_PUSH) { //庄家位置更新
				this._onBanker(msg.data, true)
			} else if (msg.type === ApiMjnn.GAME_USER_POUR_SCORE_PUSH) { //玩家下分推送
				// console.log("下分推送==", msg.data);
				MJNNModel.onUserPourOpt(msg.data);
				this.optComp.setBetNode();
			} else if (msg.type === ApiMjnn.GAME_USER_SCORE_PUSH) { //下注
				// console.log("下注结果==", msg.data);
				MJNNModel.onUserBetOpt(msg.data);
				this._onBet(msg.data, true);
			} else if (msg.type === ApiMjnn.SHOW_CARDS_PUSH) { //亮牌结果
				// console.log("亮牌结果==", msg.data)
				this._onShowCard(msg.data)
			} else if (msg.type === ApiMjnn.GAME_END_PUSH) {
				if (msg.data.result.length > 0) {
					msg.data.enterHall = this.enterHall.bind(this);
					msg.data.path = 'res/prefab/MJNNAllResult';
					msg.data.bundle = Enums.bundleType.MJNN;
					msg.data.isUnionCreate = MJNNModel.isUnionCreate();
					msg.data.unionID = MJNNModel.getRoomCreatorByKey("unionID")
					msg.data.gameRule = MJNNModel.getGameRule();
					msg.data.roomID = MJNNModel.getRoomID();
					this.unscheduleAllCallbacks();
					this.scheduleOnce(() => {
						MessageCallback.emitMessage('RemoveGameResult');
						AssetsManager.createDialog(msg.data);
					}, 2);
				} else {
					this.enterHall();
				}
			} else if (msg.type === ApiMjnn.GAME_REVIEW_PUSH) {
				let reviewRecord = msg.data.list
				if (reviewRecord && reviewRecord.length > 0) {
					AssetsManager.createDialog({
						bundle: Enums.bundleType.MJNN,
						path: "res/prefab/MJNNResultDialog",
						reviewRecord: reviewRecord,

					});
				} else {
					AssetsManager.tipDialog('没有数据');
				}
			} else if (msg.type === ApiMjnn.GAME_RESULT_PUSH) {
				this._onGameResult(msg.data)
			}
		} else if (route === 'ReconnectSuccess') {
			this._getRoomInfo();
		} else if (route === 'SelfEntryRoomPush') {
			if (msg.gameType != MJNNModel.getBundleType()) {
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
			this._onBtnTest()
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