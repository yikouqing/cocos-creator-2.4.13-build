const MessageCallback = require('../../../src/utils/MessageCallback');
const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const NativeUtil = require('../../../src/utils/NativeUtil');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const SubManager = require('../../../src/utils/SubManager');
const Codes = require('../../../src/const/Codes');
const UserModel = require('../../../src/model/UserModel');
const CXModel = require('./CXModel');
const ApiCx = require('./ApiCx');
const CXLogic = require('./CXLogic');
const ConfigModel = require('../../../src/model/ConfigModel');
const AudioUtil = require('../../../src/utils/AudioUtil');
const NodePoolManager = require('../../../src/utils/NodePoolManager');

cc.Class({
	extends: cc.Component,
	properties: {
		seats: [require('CXSeat')],
		quickPourCtrl: require('CXQuickPourCtrl'), //快速下分控制器
		preOpCtrl: require('CXPreOpCtrl'), //预操作控制器
		opCtrl: require('CXOpCtrl'), //操作控制器
		fenCtrl: require('CXFenCtrl'),
		handCards: [cc.Sprite], //分牌的精灵
		deal: cc.Node, //发牌位
		piNode: cc.Node, //皮点
		piAnim: cc.Node, //皮动画
		piLabel: cc.Label, //皮池数
		mangoNode: cc.Node, //芒果点
		mangoAnim: cc.Node, //芒果动画
		mangoLabel: cc.Label, //芒果池
		tableInfo: cc.Label,
		fenNode: cc.Node, //分牌组节点
		btnBuChong: cc.Node,
		btnQdfp: cc.Node, //按钮-确定分牌
		handCardsNode: cc.Node, //分牌操作区
		daSliderNode: cc.Node,
		daSlider: cc.Slider,
		daSliderBar: cc.Node,
		daSliderScore: cc.Label,
		gpsMark: cc.Node,
		light: cc.Node,
		touTypeBg: cc.Node,
		touType: cc.Label,
		weiTypeBg: cc.Node,
		weiType: cc.Label,
		effectContent: cc.Node,
		mangTypeNode: cc.Node,
		mangType: cc.Label,
		btnInvite: cc.Node,
		btnCopy: cc.Node,
		btnTest: cc.Node,
		canNotDismissBar: cc.Node,
		pourGoldItem: cc.Prefab,

		_seats: [],
		_daSliderSetScore: 0,
		_handCardsPos: [],
		_handCardsRelativePos: null,
		_handCardsDealPos: null,
		_touCardsPos: [],
		_touCards: [],
		_weiCards: [],
		_mangoPos: null,
		_piPos: null,
		_mangTypeNodePos: null,
	},

	onLoad() {
		AudioUtil.stopAll();
		NodePoolManager.init('cxPourGoldPool', this.pourGoldItem, 20);
		AssetsManager.init(this.node);
	},

	start() {
		this.tableInit();
		CXModel.init(); /* 保存数据 */
		cc.game.on(cc.game.EVENT_SHOW, this.onEventShow, this);
		this.daSliderBar.on(cc.Node.EventType.TOUCH_END, this.onDaSliderBarTouchEnd, this);
		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
		MessageCallback.addListener('UpdateGameBg', this);
		MessageCallback.addListener('SelfEntryRoomPush', this);
		MessageCallback.addListener('CreateRoomFail', this);
		MessageCallback.addListener('QuickJoinFail', this);
		MessageCallback.addListener('JoinGameAgainPush', this);
		MessageCallback.addListener('TestClickReq', this)
		MessageCallback.addListener('OnGameOnceAgain', this);
		ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
	},

	onDestroy() {
		CXModel.onDestroy();
		cc.game.off(cc.game.EVENT_SHOW, this.onEventShow, this);
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
		this.daSliderBar.off(cc.Node.EventType.TOUCH_END, this.onDaSliderBarTouchEnd, this);
		ConfigModel.setData('lastScene', 'cx');
		NodePoolManager.clear('cxPourGoldPool');
	},

	tableInit() {
		this.opCtrl.init(this);
		this.preOpCtrl.init(this);
		for (let index = 0; index < this.seats.length; index++) {
			if (!this.seats[index]) continue;
			this.seats[index].init({
				copm: this,
				deal: this.deal,
				index: index
			})
		}
		this._handCardsDealPos = CCUtil.postionConvert(this.deal, this.handCardsNode);
		let uid = UserModel.getData('uid');
		for (let index = 0; index < this.handCards.length; index++) {
			this._handCardsPos.push(this.handCards[index].node.getPosition());
			this.handCards[index].node.uid = uid;
			this.handCards[index].node.curDealCardIndex = index;
		}
		let cardSize = this.handCards[0].node.getContentSize();
		let cardLane = 10;
		this._handCardsRelativePos = {};
		this._handCardsRelativePos.two = this._getCardsPos(0, 2, cardSize, 0, cardLane);
		for (let index = 0; index < this._handCardsRelativePos.two.length; index++) {
			this._touCardsPos.push(cc.v2(this._handCardsRelativePos.two[index].x, this.fenNode.y));
		}
		this._handCardsRelativePos.three = this._getCardsPos(0, 3, cardSize, 0, cardLane);
		this._handCardsRelativePos.four = this._getCardsPos(0, 4, cardSize, 0, cardLane);
		this._handCardsPos = this._getCardsPos(0, 4, cardSize, 0, cardLane);
		this._mangoPos = this.mangoNode.getPosition();
		this._piPos = this.piNode.getPosition();
		this._mangTypeNodePos = {
			show: cc.v2(),
			hide: cc.v2()
		}
		this._mangTypeNodePos.show = this.mangTypeNode.getPosition();
		this._mangTypeNodePos.hide = cc.v2(this._mangTypeNodePos.show.x - this.mangTypeNode.width, this._mangTypeNodePos.show.y);
		this.mangTypeNode.active = false;
	},

	gameInit() {
		this.unscheduleAllCallbacks();
		this.gameSync();
		this.seatsInit();
		this.opSync(0);
		this.gamePoolSync();
	},

	gamePoolSync() {
		let gameStatus = CXModel.getGameStatus();
		if (gameStatus == ApiCx.gameStatus.NONE || gameStatus == ApiCx.gameStatus.RESULT) {
			this.piNode.stopAllActions();
			this.mangoNode.stopAllActions();
			this.piNode.active = false;
			this.mangoNode.active = false;
		} else {
			this.piNode.active = true;
			this.piNode.stopAllActions();
			this.piNode.setPosition(this._piPos);
			this.mangoNode.active = true;
			this.mangoNode.stopAllActions();
			this.mangoNode.setPosition(this._mangoPos);
			this.piLabel.string = `皮池:${Utils.formatNumberWithDecimal(CXModel.getPiScore(), 0)}`;
			this.mangoLabel.string = `芒果:${Utils.formatNumberWithDecimal(CXModel.getMangoScore(), 0)}`;
		}
	},

	gameSync() {
		let unionID = CXModel.isUnionCreate() ? CXModel.getRoomCreatorByKey('unionID') : null;
		let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
		this.btnCopy.active = CXModel.getCurBureau() <= 0 && !!isShowInvite;
		this.btnInvite.active = CXModel.getCurBureau() <= 0 && !!isShowInvite;
		this.btnTest.active = !!UserModel.getData('isTest')
		if (this.canNotDismissBar) this.canNotDismissBar.active = CXModel.getGameRuleByKey("canNotDissmiss")
		let wanfa = [];
		let roomID = CXModel.getRoomID();
		let playerCount = CXModel.getGameRuleByKey('maxPlayerCount');
		this.gpsMark.active = !!CXModel.getGameRuleByKey('showGps') && playerCount < 6;
		if (CXModel.getGameRuleByKey('isDiJiuWang')) {
			wanfa.push('地九王');
		}
		if (CXModel.getGameRuleByKey('isBiFaKeXiu')) {
			wanfa.push('必发招|可休');
		}
		if (CXModel.getGameRuleByKey('isQuanMangZouMang')) {
			wanfa.push('圈芒|揍芒');
		}
		// if (CXModel.getGameRuleByKey('isChaKanDiPai')) {
		// 	wanfa.push('查看底牌');
		// }
		let locationAdministration = CXModel.getGameRuleByKey('showGps');
		this.tableInfo.string = `房号:${roomID}\n人数:${playerCount}人\n局数:${CXModel.getCurBureau()}/${CXModel.getMaxBureau()}\n底皮:${CXModel.getGameRuleByKey('baseScore')}\n${wanfa.join(' ')}\n${!!locationAdministration ? '防作弊' : ''}`;
	},

	seatsInit() {
		CXModel.setRelativeChairID();
		this._seats = [];
		let chairCount = CXModel.getChairCount();
		for (let index = 0; index < this.seats.length; index++) {
			if (chairCount == 2) {
				if (index != 0 && index != 4) {
					this.seats[index].hide();
					continue;
				}
				this._seats.push(this.seats[index]);
			} else if (chairCount == 4) {
				if (index == 1 || index == 3 || index == 5 || index == 7) {
					this.seats[index].hide();
					continue;
				}
				this._seats.push(this.seats[index]);
			} else if (chairCount == 6) {
				if (index == 2 || index == 6) {
					this.seats[index].hide();
					continue;
				}
				this._seats.push(this.seats[index]);
			} else if (chairCount == 8) {
				this._seats.push(this.seats[index]);
			}
		}
		let users = CXModel.getUsersInSeat();
		//先置空
		for (let index = 0; index < this._seats.length; index++) {
			if (!this._seats[index]) continue;
			this._seats[index].bind(index);
		}
		//坐下
		for (let index = 0; index < users.length; index++) {
			let user = users[index];
			let localIndex = CXModel.getIndexByUID(user.uid);
			if (!this._seats[localIndex]) continue;
			this._seats[localIndex].sit(user);
		}
	},

	onTestClick() {
		let jushu = CXModel.getCurBureau()
		if (!CXModel.isInSeat() || jushu <= 0 || !!CXModel.isInWatch()) return;
		ApiRoom.gameMessageNotify(ApiCx.getGetTestCardsNotify())
	},


	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.gameInit();
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_RESPONSE) {
				if (msg.data.chairID === CXModel.getMyChairID()) { }
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				this.verifyZuobi(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				this.onUserLeave(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				this.onUserReady(msg.data);
			} else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
				if (!msg.data.userList || msg.data.userList.length == 0) return;
				msg.data.myChairID = CXModel.getMyChairID();
				AssetsManager.disDialog(msg.data);
			} else if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
				if (msg.data.code != 0) {
					if (msg.data.uid == UserModel.getData('uid')) {
						AssetsManager.tipDialog(Codes[msg.data.code]);
					}
					return;
				}
				this.onChangeSeat(msg.data);
			} else if (msg.type === ApiRoom.USER_CHAT_PUSH) {
				// this.onChat(msg.data.fromChairID, msg.data.toChairID, msg.data.msg);
			} else if (msg.type === ApiRoom.USER_GIFT_SEND_PUSH) {
				this.onGift(msg.data.fromChairID, msg.data.toChairID, msg.data.giftID);
			} else if (msg.type === ApiRoom.BE_SHORT_OF_GOLD_COINS_PUSH) {
				if (msg.data.uid == UserModel.getData('uid')) {
					AssetsManager.tipDialog('金币不足，不可加入！');
				}
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiCx.GAME_BUREAU_PUSH) {
				this.onRoundUpdate();
			} else if (msg.type === ApiCx.GAME_STATUS_PUSH) {
				this.onGameStatusUpdate();
			} else if (msg.type === ApiCx.GAME_SHOW_CARDS_PUSH) {
				this.onShowCards(msg.data);
			} else if (msg.type === ApiCx.GAME_END_PUSH) {
				UserModel.setData('roomID', '');
				if (msg.data.result.length > 0) {
					msg.data.enterHall = this.enterHall.bind(this);
					msg.data.path = 'res/prefab/CXResult';
					msg.data.bundle = Enums.bundleType.CX;
					AssetsManager.createDialog(msg.data);
				} else {
					this.enterHall();
				}
			} else if (msg.type === ApiCx.GAME_RESULT_PUSH) {
				this.onSmallSettle(msg.data);
			} else if (msg.type === ApiCx.GAME_SEND_CARDS_PUSH) {
				this.onSendCards(msg.data);
			} else if (msg.type === ApiCx.GAME_USER_OPERATE_START_PUSH) {
				this.onUserNotify(msg.data);
			} else if (msg.type === ApiCx.GAME_USER_OPERATE_PUSH) {
				this.onUserAction(msg.data);
			} else if (msg.type === ApiCx.GAME_BANKER_PUSH) {
				this.onBankerSet(msg.data);
			} else if (msg.type === ApiCx.GAME_BASE_SCORE_PUSH) {
				this.onBaseScore(msg.data);
			} else if (msg.type === ApiCx.GAME_REVIEW_PUSH) {
				if (msg.data.list.length != 0) {
					msg.data.path = 'res/prefab/CXReview';
					msg.data.bundle = Enums.bundleType.CX;
					AssetsManager.createDialog(msg.data);
				} else {
					AssetsManager.tipDialog('没有数据');
				}
			} else if (msg.type === ApiCx.GAME_USER_BUY_SCORE_PUSH) {
				if (msg.data.code != 0) return;
				this.onBringSucc();
			} else if (msg.type === ApiCx.GAME_GET_TEST_CARDS_PUSH) {
				this.onTest(msg.data);
			}
		} else if (route === 'ReconnectSuccess') {
			this.onReconnectCheck();
		} else if (route == 'UpdateGameBg') { } else if (route === 'SelfEntryRoomPush') {
			if (msg.gameType != CXModel.getBundleType()) {
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
			this.onTestClick()
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

	verifyZuobi(roomUserInfo) {
		if (!CXModel.getGameRuleByKey('fangzuobi')) return;
		if (!roomUserInfo || roomUserInfo.chairID >= CXModel.getChairCount()) return;
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
		for (let i = 0; i < CXModel.getChairCount(); ++i) {
			let user = CXModel.getUserByChairID(i);
			if (!user || user.chairID == roomUserInfo.chairID) continue;
			let add2 = null;
			try {
				add2 = JSON.parse(user.userInfo.address);
			} catch (e) { }
			if (!add2) {
				continue;
			}
		}
	},

	getHeadInSeat() {
		let players = {
			node: [],
			cid: []
		}
		let users = CXModel.getUsersInSeat();
		for (let user of users) {
			//节点显示则为有人
			let localIndex = CXModel.getIndexByUID(user.uid);
			if (!this._seats[localIndex]) continue;
			players.node.push(this._seats[localIndex].player);
			players.cid.push(user.chairID);
		}
		return players;
	},

	onGift(fromChairID, toChairID, giftID) {
		let fromLocalIndex = CXModel.getIndexByChairID(fromChairID);
		if (!this._seats[fromLocalIndex]) return;
		let sender = this._seats[fromLocalIndex].player;
		let reciever = [],
			rids = [];
		if (fromChairID == toChairID) {
			let players = this.getHeadInSeat();
			reciever = players.node;
			rids = players.cid;
		} else {
			let toLocalIndex = CXModel.getIndexByChairID(toChairID);
			if (!this._seats[toLocalIndex]) return;
			reciever.push(this._seats[toLocalIndex].player);
			rids.push(toChairID);
		}
		AssetsManager.addGift({
			sid: fromChairID,
			rids: rids,
			reciever: reciever,
			sender: sender,
			id: giftID,
			parent: this.effectContent
		});
	},

	onRoundUpdate() {
		this.gameSync();
	},

	onGameStatusUpdate() {
		this.light.active = false;
		this.mangTypeNode.stopAllActions();
		this.mangTypeNode.active = false;
		let gameStatus = CXModel.getGameStatus();
		if (gameStatus == ApiCx.gameStatus.NONE) {
			let isTakeSeat = CXModel.checkInSeat();
			if (isTakeSeat) {
				let localIndex = CXModel.getIndexByUID(UserModel.getData('uid'));
				if (localIndex > 0) {
					CXModel.setRelativeChairID();
				}
			}
			//重置游戏
			let users = CXModel.getUsersInSeat();
			//先置空
			for (let index = 0; index < this._seats.length; index++) {
				if (!this._seats[index]) continue;
				this._seats[index].bind(index);
			}
			//坐下
			for (let index = 0; index < users.length; index++) {
				let user = users[index];
				let localIndex = CXModel.getIndexByUID(user.uid);
				if (!this._seats[localIndex]) continue;
				this._seats[localIndex].sit(user);
			}
		}
		if (gameStatus == ApiCx.gameStatus.SHOW_CARDS) {
			this.fenCtrl.sync();
		} else {
			this.fenCtrl.clear();
		}
		this.opSync(1);
	},

	//设置操作光束
	setLight(target) {
		this.light.active = true;
		this.light.stopAllActions();
		this.light.opacity = 0;
		this.light.scaleX = 0;
		let nodePos = CCUtil.postionConvert(target, this.light.parent);
		let lightPos = this.light.getPosition();
		let angle = Math.atan2((nodePos.y - lightPos.y), (nodePos.x - lightPos.x));
		let distance = nodePos.sub(lightPos).mag();
		let rate = distance / this.light.width > 1 ? 1 : distance / this.light.width;
		let alpha = angle * (180 / Math.PI);
		cc.tween(this.light)
			.to(0.6, {
				scaleX: rate,
				opacity: 200,
				angle: alpha + 180
			}, {
				easing: 'expoOut'
			})
			.start();
	},

	onHandsSend(card, round) {
		let uid = UserModel.getData('uid');
		let isTakeSeat = CXModel.checkInSeat();
		let playStatus = CXModel.getUserPlayStatusByUID(uid);
		let cards = CXModel.getUserHandCardsByUID(uid);
		let curDealCardIndex = card.curDealCardIndex;
		if (!!isTakeSeat &&
			playStatus != ApiRoom.playStatus.NONE &&
			playStatus != ApiRoom.playStatus.WATCH) {
			this.handCardsNode.active = true;
			if (round == 1) {
				for (let index = 0; index <= curDealCardIndex; index++) {
					this.handCards[index].node.stopAllActions();
					this.handCards[index].node.scaleX = 1;
					this.handCards[index].node.setPosition(this._handCardsRelativePos.two[index]);
					this.handCards[index].node.handCardId = cards[index];
					AssetsManager.loadSpriteFrame({
						path: 'sprite/cards/' + cards[index],
						sprite: this.handCards[index]
					});
				}
			} else if (round == 2) {
				for (let index = 0; index <= curDealCardIndex; index++) {
					this.handCards[index].node.scaleX = 1;
					this.handCards[index].node.stopAllActions();
					this.handCards[index].node.setPosition(this._handCardsRelativePos.three[index]);
					this.handCards[index].node.handCardId = cards[index];
					AssetsManager.loadSpriteFrame({
						path: 'sprite/cards/' + cards[index],
						sprite: this.handCards[index]
					});
				}
			} else if (round == 3) {
				for (let index = 0; index <= curDealCardIndex; index++) {
					this.handCards[index].node.scaleX = 1;
					this.handCards[index].node.stopAllActions();
					this.handCards[index].node.setPosition(this._handCardsRelativePos.four[index]);
					this.handCards[index].node.handCardId = cards[index];
					AssetsManager.loadSpriteFrame({
						path: 'sprite/cards/' + cards[index],
						sprite: this.handCards[index]
					});
				}
			}
		} else {
			this.fenNode.active = false;
			this.handCardsNode.active = false;
			this.touTypeBg.active = false;
			this.touType.string = '';
			this.weiTypeBg.active = false;
			this.weiType.string = '';
		}
	},

	onShowCards(data) {
		if (!data) return;
		if (data.uid == UserModel.getData('uid')) {
			this.opSync(4);
		}
		let localIndex = CXModel.getIndexByUID(data.uid);
		if (!this._seats[localIndex]) return;
		data.operateType = ApiCx.operateType.FEN;
		this._seats[localIndex].show(data);
	},

	onReconnectCheck() {
		if (UserModel.isInRoom()) {
			ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
		} else {
			this.enterHall();
		}
	},

	onUserReady(data) { },

	onUserLeave(data) {
		if (data.uid == UserModel.getData('uid')) {
			this.enterHall();
			return;
		}
		let localIndex = CXModel.getIndexByChairID(data.chairID);
		if (!this._seats[localIndex]) return;
		this._seats[localIndex].leave();
	},

	onChangeSeat(data) {
		if (data.uid == UserModel.getData('uid')) {
			let localIndex = CXModel.getIndexByUID(data.uid);
			let isTakeSeat = CXModel.checkInSeat();
			if (localIndex > 0 && isTakeSeat) {
				let gameStatus = CXModel.getGameStatus();
				if (gameStatus == ApiCx.gameStatus.NONE) {
					CXModel.setRelativeChairID();
					//切换位置
					let users = CXModel.getUsersInSeat();
					//先置空
					for (let index = 0; index < this._seats.length; index++) {
						if (!this._seats[index]) continue;
						this._seats[index].bind(index);
					}
					//坐下
					for (let index = 0; index < users.length; index++) {
						let user = users[index];
						let localIndex = CXModel.getIndexByUID(user.uid);
						if (!this._seats[localIndex]) continue;
						this._seats[localIndex].sit(user);
					}
				} else {
					if (!this._seats[localIndex]) return;
					let user = CXModel.getUserByUID(data.uid);
					this._seats[localIndex].sit(user);
				}
			} else {
				let localIndex = CXModel.getIndexByUID(data.uid);
				if (!this._seats[localIndex]) return;
				let user = CXModel.getUserByUID(data.uid);
				this._seats[localIndex].sit(user);
			}
			let gameStatus = CXModel.getGameStatus();
			let curBureau = CXModel.getCurBureau();
			if (gameStatus == ApiCx.gameStatus.NONE && curBureau == 0) {
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify(true));
			}
		} else {
			let localIndex = CXModel.getIndexByUID(data.uid);
			if (!this._seats[localIndex]) return;
			let user = CXModel.getUserByUID(data.uid);
			this._seats[localIndex].sit(user);
		}
	},

	/**返回大厅 */
	enterHall() {
		let isUnionCreate = CXModel.isUnionCreate();
		let unionID = isUnionCreate ? CXModel.getRoomCreatorByKey("unionID") : null;
		SubManager.exitBundle(unionID);
	},

	onSmallSettle(data) {
		this.light.active = false;
		this.piNode.stopAllActions();
		this.piNode.setPosition(this._piPos);
		this.mangoNode.stopAllActions();
		this.mangoNode.setPosition(this._mangoPos);
		let piStartPos = CCUtil.postionConvert(this.piNode, this.effectContent);
		let mangoStartPos = CCUtil.postionConvert(this.mangoNode, this.effectContent);
		let result = data.result;
		if (!result) return;
		if (!result.isRoundEnd) {
			let poolAction = [];
			poolAction.push(this.mangoNode);
			poolAction.push(this.piNode);
			let poolActionPos = [];
			poolActionPos.push(mangoStartPos);
			poolActionPos.push(piStartPos);
			let scores = CXModel.getUserPourScores();
			for (let index = 0; index < poolAction.length; index++) {
				cc.tween(poolAction[index])
					.delay(0.5 * index)
					.call(() => {
						AssetsManager.playEffect({
							path: `res/audio/chips`,
							bundle: Enums.bundleType.CX
						});
						for (const uid in scores) {
							if (!(scores[uid] > 0)) continue;
							let localIndex = CXModel.getIndexByUID(uid);
							if (!this._seats[localIndex]) continue;
							let playerPos = CCUtil.postionConvert(this._seats[localIndex].player, this.effectContent);
							for (let m = 0; m < 5; m++) {
								let chip = NodePoolManager.get('cxPourGoldPool');
								this.effectContent.addChild(chip);
								chip.stopAllActions();
								chip.setPosition(poolActionPos[index]);
								cc.tween(chip)
									.delay(0.15 * m)
									.to(0.35, {
										position: cc.v3(playerPos)
									})
									.call(() => {
										NodePoolManager.put('cxPourGoldPool', chip);
									}).start()
							}
						}
					})
					.delay(0.5)
					.call(() => {
						poolAction[index].active = false;
					})
					.start();
			}
			return;
		}
		let scores = result.winScores;
		if (!scores) return;
		let winType = -1; //-1 无赢家 0 别家赢 1自家赢
		for (const uid in scores) {
			let localIndex = CXModel.getIndexByUID(uid);
			if (!this._seats[localIndex]) continue;
			let user = {
				uid: uid,
				win: scores[uid]
			}
			this._seats[localIndex].small(user);
			let playerPos = CCUtil.postionConvert(this._seats[localIndex].player, this.effectContent);
			for (let m = 0; m < 5; m++) {
				let chip = NodePoolManager.get('cxPourGoldPool');
				this.effectContent.addChild(chip);
				chip.stopAllActions();
				chip.setPosition(piStartPos);
				cc.tween(chip)
					.delay(0.15 * m)
					.to(0.35, {
						position: cc.v3(playerPos)
					})
					.call(() => {
						NodePoolManager.put('cxPourGoldPool', chip);
					}).start()
			}
			if (scores[uid] > 0) {
				if (uid == UserModel.getData('uid')) {
					winType = 1;
				} else {
					if (winType != 1) {
						winType = 0;
					}
				}
			}
		}
		if (winType == 1) {
			AssetsManager.playEffect({
				path: 'res/audio/mywin',
				bundle: Enums.bundleType.CX
			});
		} else if (winType == 0) {
			AssetsManager.playEffect({
				path: 'res/audio/playerwin',
				bundle: Enums.bundleType.CX
			});
		}
	},

	onSendCards(data) {
		this.fenNode.active = false;
		this.touTypeBg.active = false;
		this.touType.string = '';
		this.weiTypeBg.active = false;
		this.weiType.string = '';
		this.light.active = false;
		this.opCtrl.clear();
		this.preOpCtrl.clear();
		this.quickPourCtrl.clear();
		this.daSliderNode.active = false;
		//清除玩家的操作状态
		let users = CXModel.getUsersInSeat();
		for (const user of users) {
			let localIndex = CXModel.getIndexByUID(user.uid);
			if (!this._seats[localIndex]) continue;
			this._seats[localIndex].opSync(user);
		}
		let deal = CXModel.getCurDealTurn();
		if (deal == 0) return; //不是发牌状态
		if (!data.handCards) return;
		let deals = Object.keys(data.handCards);
		//先计算从庄家位开始发牌
		let bankerLocalIndex = CXModel.getIndexByUID(CXModel.getBankerUID());
		bankerLocalIndex = bankerLocalIndex == -1 ? 0 : bankerLocalIndex;
		let dealBeforeLocalIndexs = [],
			dealAfterLocalIndexs = [],
			dealLocalIndexs = [];
		for (let index = 0; index < deals.length; index++) {
			let localIndex = CXModel.getIndexByUID(deals[index]);
			if (localIndex == -1) continue;
			if (localIndex >= bankerLocalIndex) {
				dealAfterLocalIndexs.push(localIndex);
			} else {
				dealBeforeLocalIndexs.push(localIndex);
			}
		}
		dealBeforeLocalIndexs = dealBeforeLocalIndexs.reverse(); //倒序
		dealLocalIndexs = dealAfterLocalIndexs.concat(dealBeforeLocalIndexs);
		let dealRoundCards1 = [];
		let dealRoundCards2 = [];
		let dealCards = [];
		let myLocalIndex = CXModel.getIndexByUID(UserModel.getData('uid'));
		if (deal == 1) {
			//发底牌
			for (let index = 0; index < dealLocalIndexs.length; index++) {
				let dealLocalIndex = dealLocalIndexs[index];
				if (!this._seats[dealLocalIndex]) continue;
				this._seats[dealLocalIndex].deals.active = false; //座位上的不显示
				this._seats[dealLocalIndex].tdeals.active = false; //座位上的不显示
				if (myLocalIndex == dealLocalIndex) {
					this.handCardsNode.active = true;
					for (let m = 0; m < this.handCards.length; m++) {
						AssetsManager.loadSpriteFrame({
							path: 'sprite/cards/' + 0,
							sprite: this.handCards[m]
						});
						if (m <= deal) {
							this.handCards[m].node.stopAllActions();
							this.handCards[m].node.dealStartPos = this._handCardsDealPos;
							this.handCards[m].node.dealEndPos = this._handCardsRelativePos.two[m];
							this.handCards[m].node.setPosition(this.handCards[m].node.dealStartPos);
							if (m == 0) {
								dealRoundCards1.push(this.handCards[m].node);
							} else if (m == 1) {
								dealRoundCards2.push(this.handCards[m].node);
							}
						}
						this.handCards[m].node.active = false;
					}
				} else {
					if (!UserModel.getData("isTest")) {
						this._seats[dealLocalIndex].deals.active = false;
						for (let o = 0; o < this._seats[dealLocalIndex].deals.children.length; o++) {
							this._seats[dealLocalIndex].deals.children[o].active = false;
							if (o <= deal) {
								if (o == 0) {
									dealRoundCards1.push(this._seats[dealLocalIndex].deals.children[o]);
								} else if (o == 1) {
									dealRoundCards2.push(this._seats[dealLocalIndex].deals.children[o]);
								}
							}
						}
						this._seats[dealLocalIndex].tdeals.active = false;
						for (let o = 0; o < this._seats[dealLocalIndex].tdeals.children.length; o++) {
							this._seats[dealLocalIndex].tdeals.children[o].stopAllActions();
							this._seats[dealLocalIndex].tdeals.children[o].scaleX = 1;
							this._seats[dealLocalIndex].tdeals.children[o].active = false;
							AssetsManager.loadSpriteFrame({
								path: 'sprite/cards/' + 0,
								sprite: this._seats[dealLocalIndex].tdeals.children[o].getComponent(cc.Sprite)
							});
						}
					} else {
						this._seats[dealLocalIndex].tdeals.active = false;
						for (let o = 0; o < this._seats[dealLocalIndex].tdeals.children.length; o++) {
							let relativePos = deal == 1 ? this._seats[dealLocalIndex].tdeals.children[o].two : deal == 2 ? this._seats[dealLocalIndex].tdeals.children[o].three : this._seats[dealLocalIndex].tdeals.children[o].four;
							this._seats[dealLocalIndex].tdeals.children[o].stopAllActions();
							this._seats[dealLocalIndex].tdeals.children[o].scaleX = 1;
							this._seats[dealLocalIndex].tdeals.children[o].active = false;
							AssetsManager.loadSpriteFrame({
								path: 'sprite/cards/' + 0,
								sprite: this._seats[dealLocalIndex].tdeals.children[o].getComponent(cc.Sprite)
							});
							if (o <= deal) {
								this._seats[dealLocalIndex].tdeals.children[o].dealEndPos = relativePos[o];
								this._seats[dealLocalIndex].tdeals.children[o].setPosition(relativePos[o]);
								if (o == 0) {
									dealRoundCards1.push(this._seats[dealLocalIndex].tdeals.children[o]);
								} else if (o == 1) {
									dealRoundCards2.push(this._seats[dealLocalIndex].tdeals.children[o]);
								}
							}
						}
					}
				}
			}
			dealCards = dealRoundCards1.concat(dealRoundCards2);
		} else if (deal == 2) {
			//发第2轮
			for (let index = 0; index < dealLocalIndexs.length; index++) {
				let dealLocalIndex = dealLocalIndexs[index];
				if (!this._seats[dealLocalIndex]) continue;
				if (myLocalIndex == dealLocalIndex) {
					this.handCardsNode.active = true;
					this._seats[dealLocalIndex].deals.active = false; //座位上的不显示
					this._seats[dealLocalIndex].tdeals.active = false; //座位上的不显示
					for (let m = 0; m < this.handCards.length; m++) {
						let cards = CXModel.getUserHandCardsByUID(this.handCards[m].node.uid);
						if (m <= 1) {
							this.handCards[m].node.active = true;
							this.handCards[m].node.stopAllActions();
							this.handCards[m].node.scaleX = 1;
							this.handCards[m].node.setPosition(this._handCardsRelativePos.three[m]);
							this.handCards[m].node.handCardId = cards[m];
							AssetsManager.loadSpriteFrame({
								path: 'sprite/cards/' + cards[m],
								sprite: this.handCards[m]
							});
						} else if (m != 2) {
							this.handCards[m].node.active = false;
							this.handCards[m].node.stopAllActions();
							this.handCards[m].node.scaleX = 1;
							AssetsManager.loadSpriteFrame({
								path: 'sprite/cards/' + 0,
								sprite: this.handCards[m]
							});
						} else {
							AssetsManager.loadSpriteFrame({
								path: 'sprite/cards/' + 0,
								sprite: this.handCards[m]
							});
							this.handCards[m].node.active = false;
							this.handCards[m].node.dealStartPos = this._handCardsDealPos;
							this.handCards[m].node.dealEndPos = this._handCardsRelativePos.three[m];
							dealRoundCards1.push(this.handCards[m].node); //第一张
						}
					}
				} else {
					if (!UserModel.getData("isTest")) {
						//不是我自己
						this._seats[dealLocalIndex].deals.active = true;
						for (let o = 0; o < this._seats[dealLocalIndex].deals.children.length; o++) {
							this._seats[dealLocalIndex].deals.children[o].active = true;
							this._seats[dealLocalIndex].deals.children[o].stopAllActions();
							this._seats[dealLocalIndex].deals.children[o].setPosition(this._seats[dealLocalIndex].deals.children[o].dealEndPos);
						}
						this._seats[dealLocalIndex].tdeals.active = true;
						for (let o = 0; o < this._seats[dealLocalIndex].tdeals.children.length; o++) {
							let relativePos = this._seats[dealLocalIndex].tdeals.children[o].two;
							this._seats[dealLocalIndex].tdeals.children[o].active = false;
							this._seats[dealLocalIndex].tdeals.children[o].stopAllActions();
							this._seats[dealLocalIndex].tdeals.children[o].scaleX = 1;
							AssetsManager.loadSpriteFrame({
								path: 'sprite/cards/' + 0,
								sprite: this._seats[dealLocalIndex].tdeals.children[o].getComponent(cc.Sprite)
							});
							if (o == deal) {
								this._seats[dealLocalIndex].tdeals.children[o].dealEndPos = relativePos[o - 2];
								this._seats[dealLocalIndex].tdeals.children[o].setPosition(relativePos[o - 2]);
								dealRoundCards1.push(this._seats[dealLocalIndex].tdeals.children[o]);
							}
						}
					} else {
						this._seats[dealLocalIndex].deals.active = false;
						this._seats[dealLocalIndex].tdeals.active = true;
						for (let o = 0; o < this._seats[dealLocalIndex].tdeals.children.length; o++) {
							let relativePos = deal == 1 ? this._seats[dealLocalIndex].tdeals.children[o].two : deal == 2 ? this._seats[dealLocalIndex].tdeals.children[o].three : this._seats[dealLocalIndex].tdeals.children[o].four;
							let cards = CXModel.getUserHandCardsByUID(this._seats[dealLocalIndex].tdeals.children[o].uid);
							this._seats[dealLocalIndex].tdeals.children[o].stopAllActions();
							this._seats[dealLocalIndex].tdeals.children[o].scaleX = 1;
							if (o < deal) {
								this._seats[dealLocalIndex].tdeals.children[o].active = true;
								this._seats[dealLocalIndex].tdeals.children[o].dealEndPos = relativePos[o];
								this._seats[dealLocalIndex].tdeals.children[o].setPosition(relativePos[o]);
								AssetsManager.loadSpriteFrame({
									path: 'sprite/cards/' + cards[o],
									sprite: this._seats[dealLocalIndex].tdeals.children[o].getComponent(cc.Sprite)
								});
							} else if (o == deal) {
								this._seats[dealLocalIndex].tdeals.children[o].active = false;
								this._seats[dealLocalIndex].tdeals.children[o].dealEndPos = relativePos[o];
								this._seats[dealLocalIndex].tdeals.children[o].setPosition(relativePos[o]);
								dealRoundCards1.push(this._seats[dealLocalIndex].tdeals.children[o]);
								AssetsManager.loadSpriteFrame({
									path: 'sprite/cards/' + 0,
									sprite: this._seats[dealLocalIndex].tdeals.children[o].getComponent(cc.Sprite)
								});
							} else {
								this._seats[dealLocalIndex].tdeals.children[o].active = false;
								AssetsManager.loadSpriteFrame({
									path: 'sprite/cards/' + 0,
									sprite: this._seats[dealLocalIndex].tdeals.children[o].getComponent(cc.Sprite)
								});
							}
						}
					}
				}
			}
			dealCards = dealRoundCards1;
		} else if (deal == 3) {
			//发第3轮
			for (let index = 0; index < dealLocalIndexs.length; index++) {
				let dealLocalIndex = dealLocalIndexs[index];
				if (!this._seats[dealLocalIndex]) continue;
				if (myLocalIndex == dealLocalIndex) {
					//我自己
					this.handCardsNode.active = true;
					this._seats[dealLocalIndex].deals.active = false; //座位上的不显示
					this._seats[dealLocalIndex].tdeals.active = false; //座位上的不显示
					for (let m = 0; m < this.handCards.length; m++) {
						let cards = CXModel.getUserHandCardsByUID(this.handCards[m].node.uid);
						if (m <= 2) {
							this.handCards[m].node.active = true;
							this.handCards[m].node.stopAllActions();
							this.handCards[m].node.scaleX = 1;
							this.handCards[m].node.setPosition(this._handCardsRelativePos.four[m]);
							this.handCards[m].node.handCardId = cards[m];
							AssetsManager.loadSpriteFrame({
								path: 'sprite/cards/' + cards[m],
								sprite: this.handCards[m]
							});
						} else if (m == 3) {
							AssetsManager.loadSpriteFrame({
								path: 'sprite/cards/' + 0,
								sprite: this.handCards[m]
							});
							this.handCards[m].node.active = false;
							this.handCards[m].node.dealStartPos = this._handCardsDealPos;
							this.handCards[m].node.dealEndPos = this._handCardsRelativePos.four[m];
							dealRoundCards1.push(this.handCards[m].node); //第一张
						}
					}
				} else {
					//不是我自己
					if (!UserModel.getData("isTest")) {
						this._seats[dealLocalIndex].deals.active = true;
						for (let o = 0; o < this._seats[dealLocalIndex].deals.children.length; o++) {
							this._seats[dealLocalIndex].deals.children[o].active = true;
							this._seats[dealLocalIndex].deals.children[o].stopAllActions();
							this._seats[dealLocalIndex].deals.children[o].setPosition(this._seats[dealLocalIndex].deals.children[o].dealEndPos);
						}
						this._seats[dealLocalIndex].tdeals.active = true;
						for (let o = 0; o < this._seats[dealLocalIndex].tdeals.children.length; o++) {
							let relativePos = this._seats[dealLocalIndex].tdeals.children[o].two;
							if (o == deal - 1) {
								let cards = CXModel.getUserHandCardsByUID(this._seats[dealLocalIndex].tdeals.children[o].uid);
								this._seats[dealLocalIndex].tdeals.children[o].active = true;
								this._seats[dealLocalIndex].tdeals.children[o].stopAllActions();
								this._seats[dealLocalIndex].tdeals.children[o].scaleX = 1;
								this._seats[dealLocalIndex].tdeals.children[o].dealEndPos = relativePos[o - 2];
								this._seats[dealLocalIndex].tdeals.children[o].setPosition(relativePos[o - 2]);
								AssetsManager.loadSpriteFrame({
									path: 'sprite/cards/' + cards[o],
									sprite: this._seats[dealLocalIndex].tdeals.children[o].getComponent(cc.Sprite)
								});
							} else if (o == deal) {
								this._seats[dealLocalIndex].tdeals.children[o].active = false;
								this._seats[dealLocalIndex].tdeals.children[o].stopAllActions();
								this._seats[dealLocalIndex].tdeals.children[o].scaleX = 1;
								this._seats[dealLocalIndex].tdeals.children[o].dealEndPos = relativePos[o - 2];
								this._seats[dealLocalIndex].tdeals.children[o].setPosition(relativePos[o - 2]);
								AssetsManager.loadSpriteFrame({
									path: 'sprite/cards/' + 0,
									sprite: this._seats[dealLocalIndex].tdeals.children[o].getComponent(cc.Sprite)
								});
								dealRoundCards1.push(this._seats[dealLocalIndex].tdeals.children[o]);
							} else {
								this._seats[dealLocalIndex].tdeals.children[o].active = false;
								this._seats[dealLocalIndex].tdeals.children[o].stopAllActions();
								this._seats[dealLocalIndex].tdeals.children[o].scaleX = 1;
								AssetsManager.loadSpriteFrame({
									path: 'sprite/cards/' + 0,
									sprite: this._seats[dealLocalIndex].tdeals.children[o].getComponent(cc.Sprite)
								});
							}
						}
					} else {
						this._seats[dealLocalIndex].deals.active = false;
						this._seats[dealLocalIndex].tdeals.active = true;
						for (let o = 0; o < this._seats[dealLocalIndex].tdeals.children.length; o++) {
							let cards = CXModel.getUserHandCardsByUID(this._seats[dealLocalIndex].tdeals.children[o].uid);
							let relativePos = deal == 1 ? this._seats[dealLocalIndex].tdeals.children[o].two : deal == 2 ? this._seats[dealLocalIndex].tdeals.children[o].three : this._seats[dealLocalIndex].tdeals.children[o].four;
							this._seats[dealLocalIndex].tdeals.children[o].stopAllActions();
							this._seats[dealLocalIndex].tdeals.children[o].scaleX = 1;
							this._seats[dealLocalIndex].tdeals.children[o].dealEndPos = relativePos[o];
							this._seats[dealLocalIndex].tdeals.children[o].setPosition(relativePos[o]);
							if (o < deal) {
								this._seats[dealLocalIndex].tdeals.children[o].active = true;
								AssetsManager.loadSpriteFrame({
									path: 'sprite/cards/' + cards[o],
									sprite: this._seats[dealLocalIndex].tdeals.children[o].getComponent(cc.Sprite)
								});
							} else if (o == deal) {
								this._seats[dealLocalIndex].tdeals.children[o].active = false;
								AssetsManager.loadSpriteFrame({
									path: 'sprite/cards/' + 0,
									sprite: this._seats[dealLocalIndex].tdeals.children[o].getComponent(cc.Sprite)
								});
								dealRoundCards1.push(this._seats[dealLocalIndex].tdeals.children[o]);
							}
						}
					}
				}
			}
			dealCards = dealRoundCards1;
		}
		for (let index = 0; index < dealCards.length; index++) {
			let card = dealCards[index];
			if (!card) continue;
			let uid = card.uid;
			let dealPos = card.dealStartPos;
			let endPos = card.dealEndPos;
			let cards = CXModel.getUserHandCardsByUID(uid);
			let curDealCardIndex = card.curDealCardIndex;
			card.scaleX = 1;
			card.parent.active = true;
			card.active = true;
			card.stopAllActions();
			card.setPosition(dealPos);
			card.stopAllActions();
			cc.tween(card)
				.delay(0.1 * index)
				.call(() => {
					AssetsManager.playEffect({
						path: `res/audio/deal`,
						bundle: Enums.bundleType.CX
					});
				})
				.to(0.25, {
					position: cc.v3(endPos)
				})
				.call(() => {
					if (uid == UserModel.getData('uid')) {
						cc.tween(card)
							.to(0.1, {
								scaleX: 0.5
							})
							.call(() => {
								AssetsManager.loadSpriteFrame({
									path: 'sprite/cards/' + cards[curDealCardIndex],
									sprite: card.getComponent(cc.Sprite)
								});
							})
							.to(0.1, {
								scaleX: 1
							})
							.call(() => {
								card.scaleX = 1;
								this.onHandsSend(card, deal);
							})
							.start();
					} else {
						if (!UserModel.getData('isTest')) {
							if (curDealCardIndex == 2 || curDealCardIndex == 3) {
								cc.tween(card)
									.to(0.1, {
										scaleX: 0.5
									})
									.call(() => {
										AssetsManager.loadSpriteFrame({
											path: 'sprite/cards/' + cards[curDealCardIndex],
											sprite: card.getComponent(cc.Sprite)
										});
									})
									.to(0.1, {
										scaleX: 1
									})
									.call(() => {
										card.scaleX = 1;
									})
									.start();
							}
						} else {
							cc.tween(card)
								.to(0.1, {
									scaleX: 0.5
								})
								.call(() => {
									AssetsManager.loadSpriteFrame({
										path: 'sprite/cards/' + cards[curDealCardIndex],
										sprite: card.getComponent(cc.Sprite)
									});
								})
								.to(0.1, {
									scaleX: 1
								})
								.call(() => {
									card.scaleX = 1;
								})
								.start();
						}
					}
				})
				.start();
		}
	},

	onUserNotify(data) {
		this.opSync(2);
		let localIndex = CXModel.getIndexByUID(data.uid);
		if (!this._seats[localIndex]) return;
		this._seats[localIndex].op();
		this.setLight(this._seats[localIndex].node);
	},

	onBringSucc() {
		let uid = UserModel.getData('uid');
		let isTakeSeat = CXModel.checkInSeat();
		if (!isTakeSeat) return;
		let localIndex = CXModel.getIndexByUID(uid);
		if (!this._seats[localIndex]) return;
		let totalScore = CXModel.getUserTotalScoreByUID(uid);
		this._seats[localIndex].bring(totalScore);
	},

	onTest(data) {
		if (!UserModel.getData('isTest')) return;
		data.path = 'res/prefab/CXTest';
		data.bundle = Enums.bundleType.CX;
		AssetsManager.createDialog(data);
	},

	onBaseScore(data) {
		this.light.active = false;
		let userScore = data.userScore;
		this.piLabel.string = `皮池:${Utils.formatNumberWithDecimal(CXModel.getPiScore(), 0)}`;
		this.mangoLabel.string = `芒果:${Utils.formatNumberWithDecimal(CXModel.getMangoScore(), 0)}`;
		let mangoStartPos = CCUtil.postionConvert(this.deal, this.mangoNode.parent || this.mangoNode);
		let piStartPos = CCUtil.postionConvert(this.deal, this.piNode.parent || this.piNode);
		this.piNode.stopAllActions();
		this.piNode.setPosition(piStartPos);
		this.piNode.active = false;
		this.mangoNode.active = false;
		this.mangoNode.stopAllActions();
		this.mangoNode.setPosition(mangoStartPos);
		this.mangTypeNode.active = true;
		this.mangTypeNode.stopAllActions();
		this.mangTypeNode.setPosition(this._mangTypeNodePos.hide);
		this.mangType.string = data.mangoType == 2 ? '揍芒' : data.mangoType == 3 ? '休芒' : '圈芒';
		cc.tween(this.mangTypeNode)
			.to(0.5, {
				position: cc.v3(this._mangTypeNodePos.show)
			}, {
				easing: 'expoOut'
			})
			.delay(0.2)
			.call(() => {
				this.piNode.active = true;
				this.mangoNode.active = true;
				this.mangTypeNode.active = false;
				let baseScoreAction = [],
					baseScoreActionPos = [];
				baseScoreAction.push(this.piNode);
				baseScoreAction.push(this.mangoNode);
				baseScoreActionPos.push(this._piPos);
				baseScoreActionPos.push(this._mangoPos);
				AssetsManager.playEffect({
					path: `res/audio/chips`,
					bundle: Enums.bundleType.CX
				});
				for (let index = 0; index < baseScoreAction.length; index++) {
					cc.tween(baseScoreAction[index])
						.delay(0.1 * index)
						.to(0.6, {
							position: cc.v3(baseScoreActionPos[index])
						}, {
							easing: 'expoOut'
						})
						.call(() => {
							//下底分
							if (index == baseScoreAction.length - 1) {
								if (!userScore) return;
								for (const uid in userScore) {
									let localIndex = CXModel.getIndexByUID(uid);
									if (!this._seats[localIndex]) continue;
									let user = {
										uid: uid,
										score: userScore[uid]
									}
									this._seats[localIndex].base(user);
								}
							}
						})
						.start();
				}
			})
			.start();
	},

	onBankerSet(data) {
		this.light.active = false;
		let users = CXModel.getUsersInSeat();
		for (const user of users) {
			let localIndex = CXModel.getIndexByUID(user.uid);
			if (!this._seats[localIndex]) continue;
			this._seats[localIndex].button(user.uid == data.uid);
		}
	},

	onUserAction(data) {
		this.opSync(3);
		let localIndex = CXModel.getIndexByUID(data.uid);
		this.light.active = false;
		if (!this._seats[localIndex]) return;
		data.operateInfo.uid = data.uid;
		this._seats[localIndex].action(data.operateInfo);
	},

	btnClicks(event, param) {

		switch (param) {
			case 'daslider':
				this.daSliderNode.active = false;
				break;
			case 'fenpai':
				this.onFenCheck();
				break;
			case 'menu':
			case 'buchong':
				this.onSitClick();
				break;
			case 'detail':
				this.onDetailClick();
				break;
			case 'review':
				this.onReviewClick();
				break;
			case 'test':
				this.onTestClick()
				break;
			case 'gps':
				this.onLocationClick();
				break;
			case 'invite':
				this.onInviteClick();
				break;
			case 'copy':
				this.onCopyClick();
				break;
			default:
				break;
		}
	},

	onCopyClick() {

		let str = ConfigModel.getRoomShare(Enums.bundleType.CX, CXModel.getRoomID());
		NativeUtil.copyText(str);
	},

	onInviteClick() {

		let gameRule = CXModel.getGameRule();
		gameRule = gameRule || {};
		let roomId = CXModel.getRoomID();
		gameRule.roomId = roomId;
		let share = ConfigModel.getRoomRuleShare(gameRule);
		NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
	},

	onLocationClick() {
		AssetsManager.locationDialog({
			users: CXModel.getPlayerTakeSeats(),
			chairCount: CXModel.getChairCount(),
			fangzuobi: CXModel.getGameRuleByKey('fangzuobi')
		})
	},

	onReviewClick() {
		ApiRoom.gameMessageNotify(ApiCx.getReviewNotify());
	},

	onDetailClick() {
		AssetsManager.createDialog({
			path: 'res/prefab/CXGameDetailDilog',
			bundle: Enums.bundleType.CX
		});
	},

	onSitClick() {
		let data = {
			path: 'res/prefab/CXBuyDialog',
			bundle: Enums.bundleType.CX
		}
		AssetsManager.createDialog(data);
	},

	onDaClick() {
		this.daSliderNode.active = true;
		this.daSlider.progress = 0;
		let needPourScore = CXModel.getNeedPourScoreByUID(UserModel.getData('uid')) + CXModel.getGameRuleByKey('baseScore');
		this.daSliderScore.string = needPourScore;
		this._daSliderSetScore = needPourScore;
	},

	opSync(type) {
		let deal = CXModel.getCurDealTurn();
		let gameStatus = CXModel.getGameStatus();
		let uid = UserModel.getData('uid');
		let isTakeSeat = CXModel.checkUserTakeSeat(uid);
		let needPourScore = CXModel.getNeedPourScoreByUID(UserModel.getData('uid'));
		let opType = CXModel.getUserOperateStatusByUID(uid);
		let playStatus = CXModel.getUserPlayStatusByUID(uid);
		let isMyTurn = CXModel.checkIsMyTurn();
		let score = CXModel.getUserTotalScoreByUID(uid);
		let cards = CXModel.getUserHandCardsByUID(uid);
		this.daSliderNode.active = false;
		this.btnQdfp.action = false;
		this.btnBuChong.active = !!isTakeSeat && playStatus == ApiRoom.playStatus.WATCH && score < CXModel.getGameRuleByKey('bringScore');
		if (gameStatus == ApiCx.gameStatus.USER_OPERATE &&
			!!isTakeSeat &&
			playStatus == ApiRoom.playStatus.PLAYING &&
			opType != ApiCx.operateType.QIAO &&
			opType != ApiCx.operateType.FOLD) {
			if (!!isMyTurn) {
				let preOpType = this.preOpCtrl.getOption();
				if (preOpType == -1) {
					this.preOpCtrl.clear();
					this.quickPourCtrl.sync();
					this.opCtrl.sync();
				} else {
					//0-丢 1-休|丢 2-休 3-跟
					if (preOpType == 0) {
						if (needPourScore == 0) {
							this.quickPourCtrl.sync();
							this.opCtrl.sync();
							this.preOpCtrl.clear();
						} else {
							this.quickPourCtrl.clear();
							this.opCtrl.clear();
							ApiRoom.gameMessageNotify(ApiCx.getOperateNotify(ApiCx.operateType.FOLD, 0));
						}
					} else if (preOpType == 1) {
						if (needPourScore == 0) {
							this.quickPourCtrl.clear();
							this.opCtrl.clear();
							this.preOpCtrl.clear();
							ApiRoom.gameMessageNotify(ApiCx.getOperateNotify(ApiCx.operateType.XIU, 0));
						} else {
							this.quickPourCtrl.clear();
							this.opCtrl.clear();
							this.preOpCtrl.clear();
							ApiRoom.gameMessageNotify(ApiCx.getOperateNotify(ApiCx.operateType.FOLD, 0));
						}
					} else if (preOpType == 2) {
						if (needPourScore == 0) {
							this.quickPourCtrl.clear();
							this.opCtrl.clear();
							this.preOpCtrl.clear();
							ApiRoom.gameMessageNotify(ApiCx.getOperateNotify(ApiCx.operateType.XIU, 0));
						} else {
							this.quickPourCtrl.sync();
							this.opCtrl.sync();
							this.preOpCtrl.clear();
							ApiRoom.gameMessageNotify(ApiCx.getOperateNotify(ApiCx.operateType.FOLD, 0));
						}
					} else if (preOpType == 3) {
						if (needPourScore == 0) {
							this.quickPourCtrl.sync(needPourScore);
							this.opCtrl.sync(needPourScore);
							this.preOpCtrl.clear();
						} else {
							if (needPourScore > score) {
								this.quickPourCtrl.sync();
								this.opCtrl.sync();
								this.preOpCtrl.clear();
							} else {
								this.quickPourCtrl.clear();
								this.opCtrl.clear();
								this.preOpCtrl.clear();
								ApiRoom.gameMessageNotify(ApiCx.getOperateNotify(ApiCx.operateType.GEN, needPourScore));
							}
						}
					}
				}
			} else {
				this.quickPourCtrl.clear();
				this.opCtrl.clear();
				//展示预操作
				this.preOpCtrl.sync(needPourScore);
			}
		} else {
			this.preOpCtrl.clear();
			this.opCtrl.clear();
			this.quickPourCtrl.clear();
		}
		if (!!isTakeSeat &&
			playStatus != ApiRoom.playStatus.WATCH &&
			playStatus != ApiRoom.playStatus.NONE &&
			gameStatus != ApiCx.gameStatus.NONE &&
			deal != 0
		) {
			this.handCardsNode.active = opType != ApiCx.operateType.FEN;
			let handCount = 2;
			let relativePos = null;
			if (deal == 1) {
				relativePos = this._handCardsRelativePos.two;
				handCount = 2;
			} else if (deal == 2) {
				if (!!cards[deal]) {
					relativePos = this._handCardsRelativePos.three;
					handCount = 3;
				} else {
					relativePos = this._handCardsRelativePos.two;
					handCount = 2;
				}
			} else if (deal == 3) {
				if (!cards[deal - 1]) {
					relativePos = this._handCardsRelativePos.two;
					handCount = 2;
				} else {
					if (!cards[deal]) {
						relativePos = this._handCardsRelativePos.three;
						handCount = 3;
					} else {
						relativePos = this._handCardsRelativePos.four;
						handCount = 4;
					}
				}
			}
			for (let index = 0; index < this.handCards.length; index++) {
				if (index < handCount) {
					this.handCards[index].node.active = true;
					this.handCards[index].node.stopAllActions();
					this.handCards[index].node.scaleX = 1;
					this.handCards[index].node.setPosition(relativePos[index]);
					this.handCards[index].node.handCardId = cards[index];
					AssetsManager.loadSpriteFrame({
						path: 'sprite/cards/' + cards[index],
						sprite: this.handCards[index]
					});
				} else {
					this.handCards[index].node.active = false;
					AssetsManager.loadSpriteFrame({
						path: 'sprite/cards/' + 0,
						sprite: this.handCards[index]
					});
				}
			}
			this.btnQdfp.active = false;
			this.fenNode.active = false;
			this.touTypeBg.active = false;
			this.touType.string = '';
			this.weiTypeBg.active = false;
			this.weiType.string = '';
			//分牌操作
			if (gameStatus == ApiCx.gameStatus.SHOW_CARDS &&
				opType != ApiCx.operateType.FOLD &&
				opType != ApiCx.operateType.FEN) {
				this.handCardsNode.active = true;
				this.btnQdfp.active = true;
				this.fenNode.active = true;
				this._touCards = [];
				this._weiCards = [];
				for (let index = 0; index < cards.length; index++) {
					this.handCards[index].node.active = true;
					this.handCards[index].node.scaleX = 1;
					this.handCards[index].node.stopAllActions();
					this.handCards[index].node.setPosition(this._handCardsPos[index]);
					this.handCards[index].node.handCardId = cards[index];
					this._weiCards.push(this.handCards[index].node);
					AssetsManager.loadSpriteFrame({
						path: 'sprite/cards/' + cards[index],
						sprite: this.handCards[index]
					});
				}
			} else {
				this.handCardsNode.active = opType != ApiCx.operateType.FEN;
			}
		} else {
			this.handCardsNode.active = false;
			this.fenNode.active = false;
			this.touTypeBg.active = false;
			this.touType.string = '';
			this.weiTypeBg.active = false;
			this.weiType.string = '';
		}
		if (gameStatus == ApiCx.gameStatus.SHOW_CARDS) {
			this.fenCtrl.sync();
		} else {
			this.fenCtrl.clear();
		}
	},

	onFenCheck() {
		let oneCards = [],
			twoCards = [];
		for (let index = 0; index < this._touCards.length; index++) {
			if (!this._touCards[index]) continue;
			oneCards.push(this._touCards[index].handCardId);
		}
		for (let index = 0; index < this._weiCards.length; index++) {
			if (!this._weiCards[index]) continue;
			twoCards.push(this._weiCards[index].handCardId);
		}
		if (oneCards.length != 2 || twoCards.length != 2) return;
		ApiRoom.gameMessageNotify(ApiCx.getShowCardsNotify(oneCards, twoCards));
	},

	onFenClick(event, param) {
		let uid = UserModel.getData('uid');
		let gameStatus = CXModel.getGameStatus();
		let isTakeSeat = CXModel.checkInSeat();
		let opType = CXModel.getUserOperateStatusByUID(uid);
		if (gameStatus != ApiCx.gameStatus.SHOW_CARDS) return;
		if (!isTakeSeat) return;
		if (opType == ApiCx.operateType.FOLD || opType == ApiCx.operateType.FEN) return;

		if (this._touCards.length > 2) return;
		let target = event.target;
		let isInTouCards = false,
			isInWeiCards = false,
			touFreeCount = 2,
			touFreeIndex = -1,
			touCheckIndex = -1,
			weiCheckIndex = -1;
		for (let index = 0; index < 2; index++) {
			let card = this._touCards[index];
			if (!card) {
				touFreeIndex = index;
				continue;
			}
			touFreeCount--;
			if (target.handCardId == card.handCardId) {
				isInTouCards = true;
				touCheckIndex = index;
				break;
			}
		}
		for (let index = 0; index < this._weiCards.length; index++) {
			let card = this._weiCards[index];
			if (!card) continue;
			if (target.handCardId == card.handCardId) {
				weiCheckIndex = index;
				isInWeiCards = true;
				break;
			}
		}
		if (!!isInTouCards) {
			//尾道排序
			this._touCards[touCheckIndex] = null;
			this._weiCards.push(target);
			this._weiCards.sort((a, b) => {
				return a.curDealCardIndex - b.curDealCardIndex;
			});
			let weiCount = this._weiCards.length;
			let weiCardsPos = weiCount == 2 ? this._handCardsRelativePos.two : weiCount == 3 ? this._handCardsRelativePos.three : weiCount == 4 ? this._handCardsRelativePos.four : this._handCardsRelativePos.two;
			for (let index = 0; index < weiCount; index++) {
				this._weiCards[index].scaleX = 1;
				this._weiCards[index].stopAllActions();
				cc.tween(this._weiCards[index])
					.to(0.25, {
						position: cc.v3(weiCardsPos[index])
					}, {
						easing: 'expoOut'
					})
					.start();
			}
		} else {
			if (touFreeCount == 0 || !isInWeiCards) return;
			if (touFreeCount != 0) {
				this.touTypeBg.active = true;
				this.weiTypeBg.active = true;
				this.touType.string = '';
				this.weiType.string = '';
			}
			if (touFreeCount == 2) {
				//头道未选牌
				this._touCards[0] = target;
				this._weiCards.splice(weiCheckIndex, 1);
				target.scaleX = 1;
				target.stopAllActions();
				cc.tween(target)
					.to(0.25, {
						position: cc.v3(this._touCardsPos[0])
					}, {
						easing: 'expoOut'
					})
					.start();
				this._weiCards.sort((a, b) => {
					return a.curDealCardIndex - b.curDealCardIndex;
				});
				let weiCount = this._weiCards.length;
				let weiCardsPos = weiCount == 2 ? this._handCardsRelativePos.two : weiCount == 3 ? this._handCardsRelativePos.three : weiCount == 4 ? this._handCardsRelativePos.four : this._handCardsRelativePos.two;
				for (let index = 0; index < weiCount; index++) {
					this._weiCards[index].scaleX = 1;
					this._weiCards[index].stopAllActions();
					cc.tween(this._weiCards[index])
						.to(0.25, {
							position: cc.v3(weiCardsPos[index])
						}, {
							easing: 'expoOut'
						})
						.start();
				}
			} else if (touFreeCount == 1) {
				this._touCards[touFreeIndex] = target;
				this._weiCards.splice(weiCheckIndex, 1);
				target.scaleX = 1;
				target.stopAllActions();
				cc.tween(target)
					.to(0.25, {
						position: cc.v3(this._touCardsPos[touFreeIndex])
					}, {
						easing: 'expoOut'
					})
					.start();
				this._weiCards.sort((a, b) => {
					return a.curDealCardIndex - b.curDealCardIndex;
				});
				let weiCount = this._weiCards.length;
				let weiCardsPos = weiCount == 2 ? this._handCardsRelativePos.two : weiCount == 3 ? this._handCardsRelativePos.three : weiCount == 4 ? this._handCardsRelativePos.four : this._handCardsRelativePos.two;
				for (let index = 0; index < weiCount; index++) {
					this._weiCards[index].scaleX = 1;
					this._weiCards[index].stopAllActions();
					cc.tween(this._weiCards[index])
						.to(0.25, {
							position: cc.v3(weiCardsPos[index])
						}, {
							easing: 'expoOut'
						})
						.start();
				}
				//检测牌型
			}
		}
		this.checkCardType();
	},

	checkCardType() {
		this.touTypeBg.active = true;
		this.weiTypeBg.active = true;
		let oneCards = [],
			twoCards = [];
		for (let index = 0; index < this._touCards.length; index++) {
			if (!this._touCards[index]) continue;
			oneCards.push(this._touCards[index].handCardId);
		}
		for (let index = 0; index < this._weiCards.length; index++) {
			if (!this._weiCards[index]) continue;
			twoCards.push(this._weiCards[index].handCardId);
		}
		if (oneCards.length != 2 || twoCards.length != 2) {
			this.touTypeBg.active = false;
			this.touType.string = '';
			this.weiTypeBg.active = false;
			this.weiType.string = '';
			return;
		} else {
			let oneType = CXLogic.getCardsType(oneCards);
			let twoType = CXLogic.getCardsType(twoCards);
			this.touType.string = ApiCx.cardTypeName[oneType];
			this.weiType.string = ApiCx.cardTypeName[twoType];
		}
	},

	daSliderEvent() {
		let totalScore = CXModel.getUserTotalScoreByUID(UserModel.getData('uid'));
		let minPourScore = CXModel.getNeedPourScoreByUID(UserModel.getData('uid')) + CXModel.getGameRuleByKey('baseScore');
		minPourScore = Math.min(minPourScore, totalScore);
		this._daSliderSetScore = minPourScore + this.daSlider.progress * (totalScore - minPourScore);
		this._daSliderSetScore = parseInt(this._daSliderSetScore);
		this.daSliderScore.string = this._daSliderSetScore;
	},

	onDaSliderBarTouchEnd() {
		let isMyTurn = CXModel.checkIsMyTurn();
		if (!isMyTurn) {
			this.daSliderNode.active = false;
			return;
		}
		let totalScore = CXModel.getUserTotalScoreByUID(UserModel.getData('uid'));
		if (this._daSliderSetScore >= totalScore) {
			ApiRoom.gameMessageNotify(ApiCx.getOperateNotify(ApiCx.operateType.QIAO, totalScore));
		} else {
			ApiRoom.gameMessageNotify(ApiCx.getOperateNotify(ApiCx.operateType.DA, this._daSliderSetScore));
		}
	},

	onEventShow() {
		this.onReconnectCheck();
	},

	// 邀请好友的按钮
	onShowInvite() {
		AssetsManager.friendDialog({
			gameRule: CXModel.getGameRule(),
		})
	},


	/**
	 * 
	 * @param {*} dir 0 -居中 1-右左 2-左右
	 * @param {*} count 
	 * @returns 
	 */
	_getCardsPos(dir, count, size, offset, lane) {
		let perWidth = size.width * (1 - offset);
		let perHeight = size.height * (1 - offset);
		let totalRow = Math.floor(count / lane);
		let pos = [];
		let startPos = cc.v2(0, 0);
		if (dir == 0) {
			//锚点cc.v2(0.5,0.5) 中心点散开
			let totalWidth = perWidth * (count - 1);
			startPos = cc.v2(-totalWidth / 2, 0);
			for (let index = 0; index < count; index++) {
				pos.push(cc.v2(startPos.x + index * perWidth, 0));
			}
		} else if (dir == 1) {
			//锚点cc.v2(1,0.5) 从右到左
			startPos = cc.v2(-0.5 * size.width, 0);
			for (let index = 0; index < count; index++) {
				let rowIndex = Math.floor(index / lane);
				let colIndex = Math.floor(index % lane);
				let laneCount = rowIndex < totalRow ? lane : count % lane != 0 ? count % lane : lane;
				pos.push(cc.v2(startPos.x - (laneCount - 1 - colIndex) * perWidth, startPos.y - rowIndex * perHeight));
			}
		} else if (dir == 2) {
			//锚点cc.v2(0,1) 从左到右
			startPos = cc.v2(0.5 * size.width,);
			for (let index = 0; index < count; index++) {
				let rowIndex = Math.floor(index / lane);
				let colIndex = Math.floor(index % lane);
				pos.push(cc.v2(startPos.x + colIndex * perWidth, startPos.y - rowIndex * perHeight));
			}
		}
		return pos;
	},


});