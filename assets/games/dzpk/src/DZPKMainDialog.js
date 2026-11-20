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
const DZPKModel = require('./DZPKModel');
const ApiDzpk = require('./ApiDzpk');
const NodePoolManager = require('../../../src/utils/NodePoolManager');
const ConfigModel = require('../../../src/model/ConfigModel');
const AudioUtil = require('../../../src/utils/AudioUtil');

cc.Class({
	extends: cc.Component,
	properties: {
		seats: [require('DZPKSeat')],
		handCards: [require('DZPKCard')], //分牌的精灵
		daRaiseItems: [require('DZPKRaiseItem')],
		pubCards: [require('DZPKCard')],
		pools: [require('DZPKPool')],
		quickPourCtrl: require('DZPKQuickPourCtrl'), //快速下分控制器
		preOpCtrl: require('DZPKPreOpCtrl'), //预操作控制器
		opCtrl: require('DZPKOpCtrl'), //操作控制器
		tableInfo: cc.Label,
		blindInfo: cc.Label,
		deal: cc.Node, //发牌位
		btnBuChong: cc.Node,
		handCardsNode: cc.Node, //分牌操作区
		daSliderNode: cc.Node,
		daSlider: cc.Slider,
		daSliderScore: cc.Label,
		btnDaSliderSubmit: cc.Node,
		btnRaise: cc.Node,
		gpsMark: cc.Node,
		light: cc.Node,
		effectContent: cc.Node,
		btnInvite: cc.Node,
		btnCopy: cc.Node,
		btnTest: cc.Node,
		ruleTipNode: cc.Node,
		ruleInfoNode: cc.Node,
		ruleInfoLbl: cc.Label,
		cardTypeNode: cc.Node,
		cardType: cc.Label,
		daSliderAllInBar: cc.Node,
		daSliderBetNode: cc.Node,
		btnDelay: cc.Node,
		delayTimesLbl: cc.Label,
		canNotDismissBar: cc.Node,
		pourGoldItem: cc.Prefab,

		_seatsPos: [],
		_users: [],
		_usersPos: [],
		_daSliderSetScore: 0,
		_handCardsPos: [],
		_handCardsDealPos: null,
		_pubCardsShowCount: 0,
	},

	onLoad() {
		AudioUtil.stopAll();
		NodePoolManager.init('dzpkPourGoldPool', this.pourGoldItem, 20);
		AssetsManager.init(this.node);
	},

	start() {
		this._tableInit();
		DZPKModel.init(); /* 保存数据 */
		cc.game.on(cc.game.EVENT_SHOW, this._onEventShow, this);
		this.ruleTipNode.on(cc.Node.EventType.TOUCH_START, this._onRuleTipTouch, this);
		this.ruleTipNode.on(cc.Node.EventType.TOUCH_END, this._onRuleTipTouchEnd, this);
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
		MessageCallback.addListener('OnNotInRoomPush', this);
		ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
	},

	onDestroy() {
		DZPKModel.onDestroy();
		cc.game.off(cc.game.EVENT_SHOW, this._onEventShow, this);
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
		MessageCallback.removeListener('UpdateGameBg', this);
		MessageCallback.removeListener('SelfEntryRoomPush', this);
		MessageCallback.removeListener('CreateRoomFail', this);
		MessageCallback.removeListener('QuickJoinFail', this);
		MessageCallback.removeListener('JoinGameAgainPush', this);
		MessageCallback.removeListener('OnGameOnceAgain', this);
		MessageCallback.removeListener('TestClickReq', this)
		MessageCallback.removeListener('OnNotInRoomPush', this);
		this.ruleTipNode.off(cc.Node.EventType.TOUCH_START, this._onRuleTipTouch, this);
		this.ruleTipNode.off(cc.Node.EventType.TOUCH_END, this._onRuleTipTouchEnd, this);
		ConfigModel.setData('lastScene', 'dzpk');
		NodePoolManager.clear('dzpkPourGoldPool');
	},

	_tableInit() {
		this.btnDelay.active = false;
		this.opCtrl.init(this);
		this.preOpCtrl.init(this);
		this._seatsPos = [];
		for (let index = 0; index < this.seats.length; index++) {
			if (!this.seats[index]) continue;
			this.seats[index].init({
				copm: this,
				deal: this.deal,
				index: index,
			});
			this._seatsPos.push(this.seats[index].node.getPosition());
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
		this._handCardsPos = this._getCardsPos(0, 2, cardSize, 0, cardLane);
		this._pubCardsShowCount = 0;
	},

	_gameInit() {
		this.unscheduleAllCallbacks();
		this._gameSync();
		this._seatsInit();
		this._opSync(0);
		this._pubCardsSync();
		this._onPoolsSync();
	},

	_onRuleTipTouch() {
		if (!DZPKModel.getGameStarted()) return;
		this.ruleInfoNode.active = true;
	},

	_onRuleTipTouchEnd() {
		this.ruleInfoNode.active = false;
	},

	_gameSync() {
		let unionID = DZPKModel.isUnionCreate() ? DZPKModel.getRoomCreatorByKey('unionID') : null;
		let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
		this.btnCopy.active = DZPKModel.getCurBureau() <= 0 && !!isShowInvite;
		this.btnInvite.active = DZPKModel.getCurBureau() <= 0 && !!isShowInvite;
		this.btnTest.active = !!UserModel.getData('isTest')
		let wanfa = [];
		let roomID = DZPKModel.getRoomID();
		let playerCount = DZPKModel.getGameRuleByKey('maxPlayerCount');
		this.gpsMark.active = !!DZPKModel.getGameRuleByKey('showGps') && playerCount < 6;
		if (this.canNotDismissBar) this.canNotDismissBar.active = DZPKModel.getGameRuleByKey("canNotDissmiss")
		let bringScore = DZPKModel.getGameRuleByKey('bringScore');
		wanfa.push(`最低带入${parseInt(bringScore)}\n`);
		if (!!DZPKModel.getGameRuleByKey('fangzuobi')) {
			wanfa.push('防作弊\n');
		}
		if (!!DZPKModel.getGameRuleByKey('isSafe')) {
			wanfa.push('开启保险\n');
		}
		if (!!DZPKModel.getGameRuleByKey('isForceStraddle')) {
			wanfa.push('强制Straddle\n');
		}
		if (!!DZPKModel.getGameRuleByKey('isDelayShowCards')) {
			wanfa.push('延迟看牌\n');
		}
		if (!!DZPKModel.getGameRuleByKey('isAutoMaiPai')) {
			wanfa.push('自动埋牌\n');
		}
		let baseScore = DZPKModel.getGameRuleByKey('baseScore');
		let blindScore = DZPKModel.getGameRuleByKey('blindScore');
		this.tableInfo.string = `房号:${roomID} ${playerCount}人 ${DZPKModel.getCurBureau()}/${DZPKModel.getMaxBureau()}局`;
		this.blindInfo.string = `前注:${parseInt(baseScore)} 盲注:${parseInt(blindScore)}/${parseInt(blindScore) * 2}`;
		if (wanfa.length == 0) {
			wanfa.push('无特殊玩法设置\n');
		}
		this.ruleInfoLbl.string = wanfa.join(' ');
	},

	_seatsInit() {
		DZPKModel.setRelativeChairID();
		this._users = [];
		this._usersPos = [];
		let chairCount = DZPKModel.getChairCount();
		let choosedChairs = [0, 1, 2, 3, 4, 5, 6, 7, 8];
		if (chairCount == 2) {
			choosedChairs = [0, 4];
		} else if (chairCount == 3) {
			choosedChairs = [0, 3, 6];
		} else if (chairCount == 4) {
			choosedChairs = [0, 2, 4, 7];
		} else if (chairCount == 5) {
			choosedChairs = [0, 2, 4, 5, 7];
		} else if (chairCount == 6) {
			choosedChairs = [0, 2, 3, 4, 6, 7];
		} else if (chairCount == 7) {
			choosedChairs = [0, 1, 3, 4, 5, 6, 8];
		} else if (chairCount == 8) {
			choosedChairs = [0, 1, 2, 3, 4, 5, 6, 7];
		}
		for (let index = 0; index < this.seats.length; index++) {
			if (choosedChairs.indexOf(index) == -1) {
				this.seats[index].hide();
				continue;
			}
			this._users.push(this.seats[index]);
			this._usersPos.push(this._seatsPos[index]);
		}
		for (let index = 0; index < this._users.length; index++) {
			if (!this._users[index]) continue;
			this._users[index].bind(index);
		}
		this._seatsSync();
	},

	_seatsSync() {
		let uid = UserModel.getData('uid');
		let gameStatus = DZPKModel.getGameStatus();
		let localIndex = DZPKModel.getIndexByUID(uid);
		let isTakeSeat = DZPKModel.checkInSeat();
		//座位移动
		if (localIndex > 0 && !!isTakeSeat && gameStatus == ApiDzpk.gameStatus.NONE) {
			DZPKModel.setRelativeChairID();
			let moveCounts = localIndex;
			for (let i = 0; i < this._users.length; i++) {
				let seatActions = [];
				for (let j = moveCounts + i; j >= i; j--) {
					if (j == moveCounts + i) {
						seatActions.push(cc.callFunc(() => {
							this._users[i].node.setPosition(this._usersPos[Math.floor(j % this._users.length)]);
						}))
					} else {
						seatActions.push(cc.moveTo(0.15, this._usersPos[Math.floor(j % this._users.length)]));
					}
				}
				this._users[i].node.runAction(cc.sequence(seatActions));
			}
			this._users.forEach(seat => {
				seat.leave();
			})
		}
		let users = DZPKModel.getUsersInSeat();
		// console.log('座位刷新', users)
		for (let index = 0; index < users.length; index++) {
			let user = users[index];
			let localIndex = DZPKModel.getIndexByUID(user.uid);
			if (!this._users[localIndex]) continue;
			this._users[localIndex].sit(user);
		}
	},

	//公牌同步
	_pubCardsSync() {
		//清楚公牌
		let gameStatus = DZPKModel.getGameStatus();
		let pubCards = DZPKModel.getPubCards();
		let cardsLength = pubCards.length;
		this._pubCardsShowCount = cardsLength;
		for (let index = 0; index < this.pubCards.length; index++) {
			if (!pubCards[index] || gameStatus == ApiDzpk.gameStatus.NONE) {
				this.pubCards[index].cardBack(false);
			} else {
				this.pubCards[index].cardSync(pubCards[index])
			}
		}
		// if (data['tableState'] == DZPK_GAME_STATE.SETTLE) {
		// 	this.publicCardsCheck(data);
		// 	this.winCardShowController.init(data);
		// } else {
		// 	this.winCardShowController.release();
		// }
	},

	_pubCardsClear() {
		this._pubCardsShowCount = 0;
		for (let index = 0; index < this.pubCards.length; index++) {
			this.pubCards[index].cardBack(false);
		}
	},

	_onPoolsSync() {
		let gameStatus = DZPKModel.getGameStatus();
		let basePools = DZPKModel.getPools();
		let poolCount = basePools.length;
		let baseTotalScore = DZPKModel.getTotalBaseScore();
		if (gameStatus == ApiDzpk.gameStatus.NONE) {
			this._poolsClear();
		} else {
			if (poolCount == 0) {
				for (let index = 0; index < this.pools.length; index++) {
					if (index == 0) {
						this.pools[index].sync(baseTotalScore);
					} else {
						this.pools[index].clear();
					}
				}
			} else {
				for (let index = 0; index < this.pools.length; index++) {
					let pool = basePools[index];
					if (!pool) {
						this.pools[index].clear();
					} else {
						this.pools[index].sync(pool.total);
					}
				}
			}
		}
	},

	_poolsClear() {
		for (const pool of this.pools) {
			pool.clear();
		}
	},

	_onTurnSync() {
		this._onPoolsSync();
		let users = DZPKModel.getUsersInSeat();
		let basePools = DZPKModel.getPools();
		let poolCount = basePools.length;
		let pool = poolCount > 0 ? this.pools[poolCount - 1].node : this.pools[0].node;
		for (const user of users) {
			let localIndex = DZPKModel.getIndexByUID(user.uid);
			if (!this._users[localIndex]) return;
			this._users[localIndex].turn(pool, user);
		}
	},

	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this._gameInit();
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_RESPONSE) {
				if (msg.data.chairID === DZPKModel.getMyChairID()) { }
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				this._verifyZuobi(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				this._onUserLeave(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				this._onUserReady(msg.data);
			} else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
				if (!msg.data.userList || msg.data.userList.length == 0) return;
				msg.data.myChairID = DZPKModel.getMyChairID();
				AssetsManager.disDialog(msg.data);
			} else if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
				if (msg.data.code != 0) {
					if (msg.data.uid == UserModel.getData('uid')) {
						AssetsManager.tipDialog(Codes[msg.data.code]);
					}
					return;
				}
				this._onChangeSeat(msg.data);
			} else if (msg.type === ApiRoom.USER_CHAT_PUSH) {
				// this.onChat(msg.data.fromChairID, msg.data.toChairID, msg.data.msg);
			} else if (msg.type === ApiRoom.USER_GIFT_SEND_PUSH) {
				this._onGift(msg.data.fromChairID, msg.data.toChairID, msg.data.giftID);
			} else if (msg.type === ApiRoom.BE_SHORT_OF_GOLD_COINS_PUSH) {
				if (msg.data.uid == UserModel.getData('uid')) {
					AssetsManager.tipDialog('金币不足，不可加入！');
				}
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiDzpk.GAME_BUREAU_PUSH) {
				this._onRoundSync();
			} else if (msg.type === ApiDzpk.GAME_STATUS_PUSH) {
				this._onGameStatusSync(msg.data);
			} else if (msg.type === ApiDzpk.GAME_SHOW_CARDS_PUSH) {
				this._onShowCards(msg.data);
			} else if (msg.type === ApiDzpk.GAME_END_PUSH) {
				UserModel.setData('roomID', '');
				if (msg.data.result.length > 0) {
					msg.data.enterHall = this.enterHall.bind(this);
					msg.data.path = 'res/prefab/DZPKResult';
					msg.data.bundle = Enums.bundleType.DZPK;
					AssetsManager.createDialog(msg.data);
				} else {
					this.enterHall();
				}
			} else if (msg.type === ApiDzpk.GAME_RESULT_PUSH) {
				this._onSmallSettle(msg.data.result);
			} else if (msg.type === ApiDzpk.GAME_SEND_CARDS_PUSH) {
				this._onSendCards(msg.data);
			} else if (msg.type === ApiDzpk.GAME_PUBLIC_SEND_CARDS_PUSH) {
				this._onSendPublicCards(msg.data);
			} else if (msg.type === ApiDzpk.GAME_USER_OPERATE_START_PUSH) {
				this._onUserNotify(msg.data);
			} else if (msg.type === ApiDzpk.GAME_USER_OPERATE_PUSH) {
				this._onUserAction(msg.data);
			} else if (msg.type === ApiDzpk.GAME_BANKER_PUSH) {
				this._onBankerSet(msg.data);
			} else if (msg.type === ApiDzpk.GAME_BASE_SCORE_PUSH) {
				this._onBaseScore(msg.data);
			} else if (msg.type === ApiDzpk.GAME_BLIND_SCORE_PUSH) {
				this._onBlindScore(msg.data);
			} else if (msg.type === ApiDzpk.GAME_REVIEW_PUSH) {
				if (!msg.data.list || msg.data.list.length == 0) {
					AssetsManager.tipDialog('没有数据');
					return;
				}
				// console.log('回放----', msg)
				msg.data.path = 'res/prefab/DZPKReview';
				msg.data.bundle = Enums.bundleType.DZPK;
				AssetsManager.createDialog(msg.data);
			} else if (msg.type === ApiDzpk.GAME_USER_BUY_SCORE_PUSH) {
				if (msg.data.code != 0) return;
				this._onBringSucc();
			} else if (msg.type === ApiDzpk.GAME_LOOK_CARDS_PUSH) {
				this._onTestCards(msg.data);
			} else if (msg.type === ApiDzpk.GAME_OUTS_MULTIPLYING_POWER_PUSH) {
				this._onInsurePush(msg.data);
			}
		} else if (route === 'ReconnectSuccess') {
			this._onReconnectCheck();
		} else if (route == 'UpdateGameBg') { } else if (route === 'SelfEntryRoomPush') {
			if (msg.gameType != DZPKModel.getBundleType()) {
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
			this._onTestClick()
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
		} else if (route === 'OnNotInRoomPush') {
			this.enterHall()
		}
	},

	_verifyZuobi(roomUserInfo) {
		if (!DZPKModel.getGameRuleByKey('fangzuobi')) return;
		if (!roomUserInfo || roomUserInfo.chairID >= DZPKModel.getChairCount()) return;
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
		for (let i = 0; i < DZPKModel.getChairCount(); ++i) {
			let user = DZPKModel.getUserByChairID(i);
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

	_getHeadInSeat() {
		let players = {
			node: [],
			cid: []
		}
		let users = DZPKModel.getUsersInSeat();
		for (let user of users) {
			//节点显示则为有人
			let localIndex = DZPKModel.getIndexByUID(user.uid);
			if (!this._users[localIndex]) continue;
			players.node.push(this._users[localIndex].player);
			players.cid.push(user.chairID);
		}
		return players;
	},

	_onGift(fromChairID, toChairID, giftID) {
		let fromLocalIndex = DZPKModel.getIndexByChairID(fromChairID);
		if (!this._users[fromLocalIndex]) return;
		let sender = this._users[fromLocalIndex].player;
		let reciever = [],
			rids = [];
		if (fromChairID == toChairID) {
			let players = this._getHeadInSeat();
			reciever = players.node;
			rids = players.cid;
		} else {
			let toLocalIndex = DZPKModel.getIndexByChairID(toChairID);
			if (!this._users[toLocalIndex]) return;
			reciever.push(this._users[toLocalIndex].player);
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

	_onRoundSync() {
		this._gameSync();
	},

	_onGameStatusSync(data) {
		// console.log('游戏状态切换----', data);
		let gameStatus = DZPKModel.getGameStatus();
		if (gameStatus == ApiDzpk.gameStatus.NONE) {
			this._pubCardsShowCount = 0;
			this._seatsSync();
		}
		if (gameStatus == ApiDzpk.gameStatus.NONE ||
			gameStatus == ApiDzpk.gameStatus.BASE) {
			this._pubCardsClear();
		}
		this._opClear();
		this._onTurnSync();
	},

	//设置操作光束
	_setLight(target) {
		if (!DZPKModel.getLight()) {
			this.light.stopAllActions();
			this.light.active = false;
			return;
		}
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

	_onHandsSend(card) {
		let uid = UserModel.getData('uid');
		let isTakeSeat = DZPKModel.checkInSeat();
		let playStatus = DZPKModel.getUserPlayStatusByUID(uid);
		let cards = DZPKModel.getUserHandCardsByUID(uid);
		let curDealCardIndex = card.curDealCardIndex;
		if (!!isTakeSeat &&
			playStatus != ApiRoom.playStatus.NONE &&
			playStatus != ApiRoom.playStatus.WATCH) {
			this.handCardsNode.active = true;
			this._cardTypeSync();
			for (let index = 0; index <= curDealCardIndex; index++) {
				this.handCards[index].node.stopAllActions();
				this.handCards[index].node.setPosition(this._handCardsPos[index]);
				this.handCards[index].cardSync(cards[index]);
			}
		} else {
			this.handCardsNode.active = false;
		}
	},

	_onShowCards(data) {
		if (!data) return;
		let localIndex = DZPKModel.getIndexByUID(data.uid);
		if (!this._users[localIndex]) return;
		this._users[localIndex].show(data);
	},

	_onReconnectCheck() {
		if (UserModel.isInRoom()) {
			ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
		} else {
			this.enterHall();
		}
	},

	_onUserReady(data) {
		// console.log('玩家准备', data);
	},

	_onUserLeave(data) {
		if (data.uid == UserModel.getData('uid')) {
			this.enterHall();
			return;
		}
		let localIndex = DZPKModel.getIndexByChairID(data.chairID);
		if (!this._users[localIndex]) return;
		this._users[localIndex].leave();
	},

	_onChangeSeat(data) {
		let gameStatus = DZPKModel.getGameStatus();
		let curBureau = DZPKModel.getCurBureau();
		let localIndex = DZPKModel.getIndexByUID(data.uid);
		let isTakeSeat = DZPKModel.checkInSeat();
		if (data.uid == UserModel.getData('uid') &&
			!!isTakeSeat &&
			localIndex > 0 &&
			gameStatus == ApiDzpk.gameStatus.NONE) {
			this._seatsSync();
		} else {
			if (!this._users[localIndex]) return;
			let user = DZPKModel.getUserByUID(data.uid);
			this._users[localIndex].sit(user);
		}
		if (data.uid == UserModel.getData('uid') &&
			!!isTakeSeat &&
			curBureau == 0) {
			ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify(true));
		}
	},

	/**返回大厅 */
	enterHall() {
		let isUnionCreate = DZPKModel.isUnionCreate();
		let unionID = !!isUnionCreate ? DZPKModel.getRoomCreatorByKey('unionID') : null;
		SubManager.exitBundle(unionID);
	},

	_onSmallSettle(data) {
		this._opClear();
		if (!data) return;
		let handCards = data.handCards;
		if (!!handCards) {
			//结算展示牌
			let opFilter = [ApiDzpk.operateType.NONE, ApiDzpk.operateType.CANCEL];
			for (const uid in handCards) {
				let localIndex = DZPKModel.getIndexByUID(uid);
				let opType = DZPKModel.getUserOperateStatusByUID(uid);
				if (opFilter.indexOf(opType) != -1) continue; //无状态和弃牌的玩家不展示;
				if (uid == DZPKModel.getMyUid()) {
					this._holdsSync();
				} else {
					if (!this._users[localIndex]) continue;
					this._users[localIndex].test(uid);
				}
			}
		}
		let winList = data.winList;
		if (!!winList) {
			for (let index = 0; index < winList.length; index++) {
				if (!winList[index]) continue;
				let pool = winList[index];
				let users = pool.winUserList;
				let winScore = pool.winScore;
				let poolId = pool.poolID;
				// console.log('小结算-0', data);
				if (!users || !this.pools[poolId]) continue;
				// console.log('小结算-1', data);
				for (const uid of users) {
					let localIndex = DZPKModel.getIndexByUID(uid);
					if (!this._users[localIndex]) continue;
					// console.log('小结算-2', data);
					this._users[localIndex].small({
						pool: this.pools[poolId].node,
						score: winScore,
						delay: index * 0.8,
						uid: uid
					})
				}
			}
		}
	},

	_onSendPublicCards(data) {
		let pubCards = DZPKModel.getPubCards();
		this.pubCardsDeal(pubCards, pubCards.length, () => {
			let users = DZPKModel.getUsersInSeat();
			for (const user of users) {
				if (user.uid == UserModel.getData('uid')) {
					this._cardTypeSync();
				} else {
					let localIndex = DZPKModel.getIndexByUID(user.uid);
					if (!this._users[localIndex]) continue;
					this._users[localIndex].cardTypeSync(user.uid);
				}
			}
		});
	},

	pubCardsDeal(cards, length, callback = null) {
		let show = (cards) => {
			this.pubCardsDeal(cards, length, callback);
		};
		if (this._pubCardsShowCount == length) {
			callback && callback(cards);
		} else {
			if (length >= 3 && this._pubCardsShowCount < 3) {
				let flop = (cardIndex) => {
					this._pubCardsShowCount++;
					//显示牌背
					this.pubCards[cardIndex].cardFlop(cards[cardIndex], () => {
						if (cardIndex == 2) {
							show(cards);
							AssetsManager.playEffect({
								path: 'res/audio/turncard1',
								bundle: Enums.bundleType.DZPK
							});
						} else {
							flop(cardIndex + 1);
						}
					});
				};
				flop(0);
			}
			if (length >= 4 && this._pubCardsShowCount == 3) {
				this._pubCardsShowCount = 4;
				this.pubCards[3].cardFlop(cards[3], () => {
					AssetsManager.playEffect({
						path: 'res/audio/turncard2',
						bundle: Enums.bundleType.DZPK
					});
					show(cards);
				});

			}
			if (length >= 5 && this._pubCardsShowCount == 4) {
				this._pubCardsShowCount = 5;
				this.pubCards[4].cardFlop(cards[4], () => {
					AssetsManager.playEffect({
						path: 'res/audio/turncard3',
						bundle: Enums.bundleType.DZPK
					});
					show(cards);
				});
			}
		}
	},

	_onSendCards(data) {
		// console.log('德州扑克-发手牌推送', data);
		this.light.active = false;
		this.opCtrl.clear();
		this.preOpCtrl.clear();
		this.quickPourCtrl.clear();
		this.daSliderNode.active = false;
		//清除玩家的操作状态
		let users = DZPKModel.getUsersInSeat();
		for (const user of users) {
			let localIndex = DZPKModel.getIndexByUID(user.uid);
			if (!this._users[localIndex]) continue;
			this._users[localIndex].opSync(user);
		}
		if (!data.handCards) return;
		let deals = Object.keys(data.handCards);
		//先计算从庄家位开始发牌
		let bankerLocalIndex = DZPKModel.getIndexByUID(DZPKModel.getBankerUID());
		bankerLocalIndex = bankerLocalIndex == -1 ? 0 : bankerLocalIndex;
		let dealBeforeLocalIndexs = [],
			dealAfterLocalIndexs = [],
			dealLocalIndexs = [];
		for (let index = 0; index < deals.length; index++) {
			let localIndex = DZPKModel.getIndexByUID(deals[index]);
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
		let myLocalIndex = DZPKModel.getIndexByUID(UserModel.getData('uid'));
		//发底牌
		for (let index = 0; index < dealLocalIndexs.length; index++) {
			let dealLocalIndex = dealLocalIndexs[index];
			if (!this._users[dealLocalIndex]) continue;
			this._users[dealLocalIndex].cardTypeNode.active = false;
			this._users[dealLocalIndex].deals.active = false; //座位上的不显示
			this._users[dealLocalIndex].holdsLay.active = false; //座位上的不显示
			if (myLocalIndex == dealLocalIndex) {
				this.handCardsNode.active = true;
				for (let m = 0; m < this.handCards.length; m++) {
					this.handCards[m].node.dealStartPos = this._handCardsDealPos;
					this.handCards[m].node.dealEndPos = this._handCardsPos[m];
					this.handCards[m].cardBack(false);
					this.handCards[m].node.setPosition(this._handCardsDealPos);
					if (m == 0) {
						dealRoundCards1.push(this.handCards[m].node);
					} else if (m == 1) {
						dealRoundCards2.push(this.handCards[m].node);
					}
				}
			} else {
				if (!UserModel.getData("isTest")) {
					this._users[dealLocalIndex].deals.active = false;
					for (let o = 0; o < this._users[dealLocalIndex].deals.children.length; o++) {
						this._users[dealLocalIndex].deals.children[o].active = false;
						if (o == 0) {
							dealRoundCards1.push(this._users[dealLocalIndex].deals.children[o]);
						} else if (o == 1) {
							dealRoundCards2.push(this._users[dealLocalIndex].deals.children[o]);
						}
					}
					this._users[dealLocalIndex].holdsLay.active = false;
					for (let o = 0; o < this._users[dealLocalIndex].holds.length; o++) {
						this._users[dealLocalIndex].holds[o].cardBack(false);
					}
				} else {
					this._users[dealLocalIndex].holdsLay.active = false;
					for (let o = 0; o < this._users[dealLocalIndex].holds.length; o++) {
						let relativePos = this._users[dealLocalIndex].holds[o].node.handCardsPos;
						this._users[dealLocalIndex].holds[o].node.dealEndPos = relativePos[o];
						this._users[dealLocalIndex].holds[o].cardBack(false);
						this._users[dealLocalIndex].holds[o].node.setPosition(relativePos[o]);
						if (o == 0) {
							dealRoundCards1.push(this._users[dealLocalIndex].holds[o].node);
						} else if (o == 1) {
							dealRoundCards2.push(this._users[dealLocalIndex].holds[o].node);
						}
					}
				}
			}
		}
		dealCards = dealRoundCards1.concat(dealRoundCards2);
		for (let index = 0; index < dealCards.length; index++) {
			let card = dealCards[index];
			if (!card) continue;
			let uid = card.uid;
			let dealPos = card.dealStartPos;
			let endPos = card.dealEndPos;
			let cards = DZPKModel.getUserHandCardsByUID(uid);
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
						bundle: Enums.bundleType.DZPK
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
								let cardComp = card.getComponent('DZPKCard');
								if (!cardComp) return;
								cardComp.cardSync(cards[curDealCardIndex]);
							})
							.to(0.1, {
								scaleX: 1
							})
							.call(() => {
								card.scaleX = 1;
								this._onHandsSend(card);
							})
							.start();
					} else {
						if (!!UserModel.getData('isTest')) {
							let curUserLocalIndex = DZPKModel.getIndexByUID(uid);
							if (!!this._users[curUserLocalIndex]) {
								this._users[curUserLocalIndex].cardTypeSync(uid);
							}
							cc.tween(card)
								.to(0.1, {
									scaleX: 0.5
								})
								.call(() => {
									let cardComp = card.getComponent('DZPKCard');
									if (!cardComp) return;
									cardComp.cardSync(cards[curDealCardIndex]);
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

	_onUserNotify(data) {
		this._opSync(2);
		let localIndex = DZPKModel.getIndexByUID(data.uid);
		if (!this._users[localIndex]) return;
		this._users[localIndex].op();
		this._setLight(this._users[localIndex].node);
	},

	_onBringSucc() {
		let uid = UserModel.getData('uid');
		let isTakeSeat = DZPKModel.checkInSeat();
		if (!isTakeSeat) return;
		let localIndex = DZPKModel.getIndexByUID(uid);
		if (!this._users[localIndex]) return;
		let totalScore = DZPKModel.getUserTotalScoreByUID(uid);
		this._users[localIndex].bring(totalScore);
	},

	_onInsurePush(data) {
		data = data || {};
		data.path = 'res/prefab/DZPKInsureDialog';
		data.bundle = Enums.bundleType.DZPK;
		AssetsManager.createDialog(data);
	},

	_onTestCards(data) {
		let gameStatus = DZPKModel.getGameStatus();
		let gsFilter = [ApiDzpk.gameStatus.NONE, ApiDzpk.gameStatus.RESULT];
		if (gsFilter.indexOf(gameStatus) != -1) return;
		if (!data.handCards) return;
		let handCards = data.handCards;
		for (const uid in handCards) {
			let localIndex = DZPKModel.getIndexByUID(uid);
			if (uid == DZPKModel.getMyUid()) {
				this._holdsSync();
			} else {
				if (!this._users[localIndex]) continue;
				this._users[localIndex].test(uid);
			}
		}
	},

	_onBaseScore(data) {
		this.light.active = false;
		let userScore = data.userScore;
		if (!userScore) return;
		AssetsManager.playEffect({
			path: `res/audio/chips`,
			bundle: Enums.bundleType.DZPK
		});
		for (const uid in userScore) {
			let localIndex = DZPKModel.getIndexByUID(uid);
			if (!this._users[localIndex]) continue;
			let user = {
				uid: uid,
				score: userScore[uid]
			}
			this._users[localIndex].base(user);
		}
	},

	_onBlindScore(data) {
		// console.log('德州扑克-大小盲', data);
		this.light.active = false;
		//下底分
		AssetsManager.playEffect({
			path: `res/audio/chips`,
			bundle: Enums.bundleType.DZPK
		});
		let users = DZPKModel.getUsersInSeat();
		for (const user of users) {
			let localIndex = DZPKModel.getIndexByUID(user.uid);
			if (!this._users[localIndex]) continue;
			// console.log('德州扑克-大小盲---2', data)
			this._users[localIndex].blind(data, user);
		}
	},

	_onBankerSet(data) {
		this.light.active = false;
		let users = DZPKModel.getUsersInSeat();
		let lastBankerIndex = DZPKModel.getIndexByChairID(data.lastBankerChairID);
		let curBankerIndex = DZPKModel.getIndexByUID(data.bankerUid);
		// console.log('德州扑克-定庄推送', data, lastBankerIndex, curBankerIndex);
		if (!this._users[curBankerIndex]) return;
		let lastBankerPos = !this._users[lastBankerIndex] ? this._users[curBankerIndex].getBankerPos() : CCUtil.postionConvert(this._users[lastBankerIndex].banker, this._users[curBankerIndex].banker.parent);
		for (const user of users) {
			let localIndex = DZPKModel.getIndexByUID(user.uid);
			if (!this._users[localIndex]) continue;
			this._users[localIndex].button(user.uid == data.bankerUid, curBankerIndex, lastBankerIndex, lastBankerPos);
		}
	},

	_onUserAction(data) {
		// console.log('德州扑克-操作结果推送', data);
		this._opSync(3);
		let localIndex = DZPKModel.getIndexByUID(data.uid);
		this.light.active = false;
		if (!this._users[localIndex]) return;
		data.operateInfo.uid = data.uid;
		this._users[localIndex].action(data.operateInfo);
	},

	btnClicks(event, param) {

		switch (param) {
			case 'daslider':
				this.daSliderNode.active = false;
				break;
			case 'daslidersubmit':
				this._onDaSliderSubmit();
				break;
			case 'menu':
			case 'buchong':
				this._onSitClick();
				break;
			case 'detail':
				this._onDetailClick();
				break;
			case 'review':
				this._onReviewClick();
				break;
			case 'test':
				this._onTestClick()
				break;
			case 'gps':
				this._onLocationClick();
				break;
			case 'invite':
				this._onInviteClick();
				break;
			case 'copy':
				this._onCopyClick();
				break;
			case 'delay':
				this._onDelayClick();
				break;
			default:
				break;
		}
	},

	_onTestClick() {
		if (!UserModel.getData('isTest')) return;
		let jushu = DZPKModel.getCurBureau()
		let uid = DZPKModel.getMyUid();
		if (!!DZPKModel.isInWatch() || jushu <= 0) return;
		let gameStatus = DZPKModel.getGameStatus();
		let gsFilter = [ApiDzpk.gameStatus.NONE, ApiDzpk.gameStatus.RESULT];
		if (gsFilter.indexOf(gameStatus) != -1) {
			AssetsManager.tipDialog('当前阶段不能使用管理功能！');
			return;
		}
		AssetsManager.createDialog({
			path: 'res/prefab/DZPKTest',
			bundle: Enums.bundleType.DZPK
		});
	},

	_onDelayClick() {
		let uid = UserModel.getData('uid');
		let delayTimes = DZPKModel.getUserDelayTimes(uid);
		if (delayTimes <= 0) {
			AssetsManager.tipDialog('演示看牌次数已用完！');
			return;
		}

		ApiRoom.gameMessageNotify(ApiDzpk.getOperateNotify(ApiDzpk.operateType.DELAY, 0));
	},

	_onCopyClick() {

		let str = ConfigModel.getRoomShare(Enums.bundleType.DZPK, DZPKModel.getRoomID());
		NativeUtil.copyText(str);
	},

	_onInviteClick() {

		let gameRule = DZPKModel.getGameRule();
		gameRule = gameRule || {};
		let roomId = DZPKModel.getRoomID();
		gameRule.roomId = roomId;
		let share = ConfigModel.getRoomRuleShare(gameRule);
		// console.log('测试-分享', share);
		NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
	},

	_onLocationClick() {
		AssetsManager.locationDialog({
			users: DZPKModel.getPlayerTakeSeats(),
			chairCount: DZPKModel.getChairCount(),
			fangzuobi: DZPKModel.getGameRuleByKey('fangzuobi'),
		})
	},

	_onReviewClick() {
		ApiRoom.gameMessageNotify(ApiDzpk.getReviewNotify());
	},

	_onDetailClick() {
		AssetsManager.createDialog({
			path: 'res/prefab/DZPKGameDetailDilog',
			bundle: Enums.bundleType.DZPK
		});
	},

	_onSitClick() {
		let data = {
			path: 'res/prefab/DZPKBuyDialog',
			bundle: Enums.bundleType.DZPK
		}
		AssetsManager.createDialog(data);
	},

	onDaClick() {
		this.daSliderNode.active = true;
		this.daSlider.progress = 0;
		let raiseNodePos = CCUtil.postionConvert(this.btnRaise, this.daSliderNode);
		this.btnDaSliderSubmit.setPosition(raiseNodePos);
		let totalScore = DZPKModel.getUserTotalScoreByUID(UserModel.getData('uid'));
		let blindScore = DZPKModel.getGameRuleByKey('blindScore');
		let needPourScore = DZPKModel.getNeedPourScoreByUID(UserModel.getData('uid'));
		let minRaiseScore = needPourScore + parseInt(blindScore) * 2;
		this.daSliderScore.string = minRaiseScore;
		this._daSliderSetScore = minRaiseScore;
		for (let index = 0; index < this.daSliderBetNode.childrenCount; index++) {
			this.daSliderBetNode.children[index].active = false;
		}
		this.daSliderAllInBar.active = false;
		let raiseLength = this.daRaiseItems.length;
		let base = DZPKModel.getBaseRaise();
		for (let index = 0; index < raiseLength; index++) {
			if (!this.daRaiseItems[index]) continue;
			let score = base.scores[index];
			let rate = base.rates[index];
			let raise = {
				score: score,
				min: minRaiseScore,
				max: totalScore,
				rate: rate
			}
			this.daRaiseItems[index].sync(raise);
		}
	},

	_opSync(type) {
		let gameStatus = DZPKModel.getGameStatus();
		let uid = UserModel.getData('uid');
		let isTakeSeat = DZPKModel.checkUserTakeSeat(uid);
		let needPourScore = DZPKModel.getNeedPourScoreByUID(UserModel.getData('uid'));
		let opType = DZPKModel.getUserOperateStatusByUID(uid);
		let playStatus = DZPKModel.getUserPlayStatusByUID(uid);
		let isMyTurn = DZPKModel.checkIsMyTurn();
		let score = DZPKModel.getUserTotalScoreByUID(uid);
		this.daSliderNode.active = false;
		this.btnBuChong.active = !!isTakeSeat && playStatus == ApiRoom.playStatus.WATCH && score < DZPKModel.getGameRuleByKey('bringScore');
		this.btnDelay.active = !!isMyTurn && !!DZPKModel.getGameRuleByKey('isDelayShowCards');
		this.delayTimesLbl.string = `x${DZPKModel.getUserDelayTimes(uid)}`;
		if (gameStatus != ApiDzpk.gameStatus.NONE &&
			gameStatus != ApiDzpk.gameStatus.BASE &&
			gameStatus != ApiDzpk.gameStatus.RESULT &&
			!!isTakeSeat &&
			playStatus == ApiRoom.playStatus.PLAYING &&
			opType != ApiDzpk.operateType.QIAO &&
			opType != ApiDzpk.operateType.CANCEL) {
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
							ApiRoom.gameMessageNotify(ApiDzpk.getOperateNotify(ApiDzpk.operateType.CANCEL, 0));
						}
					} else if (preOpType == 1) {
						if (needPourScore == 0) {
							this.quickPourCtrl.clear();
							this.opCtrl.clear();
							this.preOpCtrl.clear();
							ApiRoom.gameMessageNotify(ApiDzpk.getOperateNotify(ApiDzpk.operateType.XIU, 0));
						} else {
							this.quickPourCtrl.clear();
							this.opCtrl.clear();
							this.preOpCtrl.clear();
							ApiRoom.gameMessageNotify(ApiDzpk.getOperateNotify(ApiDzpk.operateType.CANCEL, 0));
						}
					} else if (preOpType == 2) {
						if (needPourScore == 0) {
							this.quickPourCtrl.clear();
							this.opCtrl.clear();
							this.preOpCtrl.clear();
							ApiRoom.gameMessageNotify(ApiDzpk.getOperateNotify(ApiDzpk.operateType.XIU, 0));
						} else {
							this.quickPourCtrl.sync();
							this.opCtrl.sync();
							this.preOpCtrl.clear();
							ApiRoom.gameMessageNotify(ApiDzpk.getOperateNotify(ApiDzpk.operateType.CANCEL, 0));
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
								ApiRoom.gameMessageNotify(ApiDzpk.getOperateNotify(ApiDzpk.operateType.GEN, needPourScore));
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
		this._holdsSync();
	},

	_holdsSync() {
		let gameStatus = DZPKModel.getGameStatus();
		let uid = UserModel.getData('uid');
		let isTakeSeat = DZPKModel.checkInSeat();
		let playStatus = DZPKModel.getUserPlayStatusByUID(uid);
		let cards = DZPKModel.getUserHandCardsByUID(uid);
		if (!!isTakeSeat &&
			playStatus != ApiRoom.playStatus.WATCH &&
			playStatus != ApiRoom.playStatus.NONE &&
			gameStatus != ApiDzpk.gameStatus.NONE &&
			gameStatus != ApiDzpk.gameStatus.BASE
		) {
			this.handCardsNode.active = true;
			let relativePos = this._handCardsPos;
			for (let index = 0; index < this.handCards.length; index++) {
				this.handCards[index].node.active = true;
				this.handCards[index].node.stopAllActions();
				this.handCards[index].node.setPosition(relativePos[index]);
				this.handCards[index].cardSync(cards[index]);
			}
			this._cardTypeSync();
		} else {
			this.handCardsNode.active = false;
		}
	},

	_opClear() {
		this.preOpCtrl.clear();
		this.opCtrl.clear();
		this.quickPourCtrl.clear();
		this.light.active = true;
		this.light.stopAllActions();
		this.light.opacity = 0;
		this.light.scaleX = 0;
	},

	_cardTypeSync() {
		let uid = UserModel.getData('uid');
		let userPlayStatus = DZPKModel.getUserPlayStatusByUID(uid);
		let gameStatus = DZPKModel.getGameStatus();
		if (gameStatus == ApiDzpk.gameStatus.NONE ||
			userPlayStatus == ApiRoom.playStatus.NONE ||
			userPlayStatus == ApiRoom.playStatus.WATCH) {
			this.cardTypeNode.active = false;
			this.cardType.string = '';
		} else {
			this.cardTypeNode.active = true;
			this.cardType.string = DZPKModel.getUserHandCardsTypeNameByUID(uid);
		}
	},

	daSliderEvent() {
		let totalScore = DZPKModel.getUserTotalScoreByUID(UserModel.getData('uid'));
		let blindScore = DZPKModel.getGameRuleByKey('blindScore');
		let needPourScore = DZPKModel.getNeedPourScoreByUID(UserModel.getData('uid'));
		let minPourScore = needPourScore > 0 ? needPourScore : parseInt(blindScore) * 2;
		this._daSliderSetScore = minPourScore + this.daSlider.progress * (totalScore - minPourScore);
		this._daSliderSetScore = parseInt(this._daSliderSetScore);
		this.daSliderScore.string = this._daSliderSetScore;
		this.daSliderAllInBar.active = this.daSlider.progress >= 1;
		let betsConut = this.daSliderBetNode.childrenCount;
		let showCount = parseInt(betsConut * this.daSlider.progress);
		for (let index = 0; index < this.daSliderBetNode.childrenCount; index++) {
			this.daSliderBetNode.children[index].active = index < showCount;
		}
	},

	_onDaSliderSubmit() {
		let isMyTurn = DZPKModel.checkIsMyTurn();
		if (!isMyTurn) {
			this.daSliderNode.active = false;
			return;
		}
		let totalScore = DZPKModel.getUserTotalScoreByUID(UserModel.getData('uid'));
		// console.log('是否敲', this._daSliderSetScore >= totalScore);
		if (this._daSliderSetScore >= totalScore) {
			ApiRoom.gameMessageNotify(ApiDzpk.getOperateNotify(ApiDzpk.operateType.QIAO, totalScore));
		} else {
			ApiRoom.gameMessageNotify(ApiDzpk.getOperateNotify(ApiDzpk.operateType.DA, this._daSliderSetScore));
		}
	},

	_onEventShow() {
		this._onReconnectCheck();
	},
	// 邀请好友的按钮
	onShowInvite() {
		AssetsManager.friendDialog({
			gameRule: DZPKModel.getGameRule(),
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