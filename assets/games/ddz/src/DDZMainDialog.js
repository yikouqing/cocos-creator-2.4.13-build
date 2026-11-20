const ApiDdz = require('./ApiDdz');
const ApiRoom = require('../../../src/api/ApiRoom');
const DDZGameLogic = require('./DDZGameLogic');
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
const DDZModel = require('./DDZModel');
const CCUtil = require('../../../src/utils/CCUtil');
const Events = require('../../../src/const/Events');
const NodePoolManager = require('../../../src/utils/NodePoolManager');
const DDZUtils = require('./DDZUtil');
cc.Class({
	extends: cc.Component,

	properties: {
		opCtrl: require('DDZOutCtrl'),
		readyCtrl: require('DDZReadyCtrl'),
		robCtrl: require('DDZRobCtrl'),
		rateCtrl: require('DDZRateCtrl'),
		rangCtrl: require('DDZYieldCtrl'),
		cardItem: cc.Prefab,
		gameNameLbl: cc.Label,
		roundLbl: cc.Label,
		roomIdLbl: cc.Label,
		deal: cc.Node,
		singleTips: cc.Node,
		btnReady: cc.Node,
		btnCopy: cc.Node,
		btnInvite: cc.Node,
		btnBack: cc.Node,
		btnLocation: cc.Node,
		depositNode: cc.Node,
		btnDeposit: cc.Node,
		menuSprite: cc.Sprite,
		effect: cc.Node,
		btnCardRecord: cc.Node,
		cardRecordList: cc.Node,
		baseCards: cc.Node,
		baseCardsList: cc.Node,
		baseShow: cc.Node,
		rangCount: cc.Label,
		rangShow: cc.Node,
		rangTips: cc.Label,
		menuLay: cc.Node,
		menuLayList: cc.Node,
		btnTest: cc.Node,
		multipleLbl: cc.Label,
		btnBackHall: cc.Node,
		btnYuYin: cc.Node,
		btnDismiss: cc.Node,
		btnExit: cc.Node,
		canNotDismissBar: cc.Node,
		lai_Card: require('DDZCard'),
		headLeft: cc.Prefab,
		headRight: cc.Prefab,
		/**用户脚本列表 下标为本地座位号*/
		_userList: [],
		/**手牌脚本列表 */
		_handCardList: [],
		/**出牌脚本列表 */
		_outCardList: [],

		_userList: [],
		_selects: [],
		_holds: [],
		_cards: [],
		_touchedRect: null,
		_touchedStartPos: cc.Vec2.ZERO,
		_matched: [],
		_handsTouchAble: false,
		_cardRecordListPos: null,
		_cardRecordListShow: false,
		_baseShowPos: [],
	},

	onLoad() {
		NodePoolManager.init('ddzCardPool', this.cardItem, 30);
	},

	start() {
		AssetsManager.init(this.node);
		DDZModel.init({
			cardItem: this.cardItem
		});
		this._handlerInit();
		this._tableInit();
		this._cardBackSync();
	},

	_tableInit() {
		this._opClear();
		this.menuLay.active = false
		this.btnReady.active = false;
		this.gameNameLbl.string = `游戏:${ConfigModel.getGameName(Enums.bundleType.DDZ)}`;
		this.baseCards.getComponent(cc.Widget) && this.baseCards.getComponent(cc.Widget).updateAlignment();
		this._cardRecordListPos = {};
		this._cardRecordListPos.show = this.cardRecordList.getPosition();
		this._cardRecordListPos.hide = cc.v2(this._cardRecordListPos.show.x + this.cardRecordList.width, this._cardRecordListPos.show.y);
		this.cardRecordList.setPosition(this._cardRecordListPos.hide);
		this.btnCardRecord.active = false;
		this._baseShowPos = [];
		for (let index = 0; index < this.baseShow.children.length; index++) {
			let pos = {
				show: cc.v2(),
				base: cc.v2()
			}
			pos.show = this.baseShow.children[index].getPosition();
			pos.base = CCUtil.postionConvert(this.baseCardsList.children[index], this.baseShow);
			this._baseShowPos.push(pos);
		}
		this.baseCards.active = false;
		this.baseShow.active = false;
		this.rangShow.active = false;
		this.rangTips.string = '';
		//初始化后开始游戏
		this._onLoadOver();
	},


	_cardBackSync() {
		let url = ConfigModel.getCardUrl();
		this._userList.forEach((ctrl) => {
			ctrl.cardBackSync(url)
		})
	},



	messageCallbackHandler(route, msg) {
		DDZModel.messageCallbackHandler(route, msg);
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.USER_LEAVE_ROOM_RESPONSE) {
				if (msg.data.chairID === this.myChairID) { };
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				this._onUserEnter(msg.data.roomUserInfo);
				this._verifyZuobi(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				this._onUserLeave(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				this._onUserReady(msg.data);
			} else if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this._gameInit(msg.data);
			} else if (msg.type === ApiRoom.ROOM_DISMISS_PUSH) { } else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
				if (!msg.data.userList || msg.data.userList.length == 0) return;
				msg.data.myChairID = DDZModel.getMyChairID();
				AssetsManager.disDialog(msg.data);
			} else if (msg.type === ApiRoom.USER_CHAT_PUSH) {
				this._onChat(msg.data);
			} else if (msg.type === ApiRoom.USER_GIFT_SEND_PUSH) {
				this._onGift(msg.data.fromChairID, msg.data.toChairID, msg.data.giftID);
			} else if (msg.type == ApiRoom.USER_OFF_LINE_PUSH) {
				this._onOffLine(msg.data);
			} else if (msg.type === ApiRoom.USER_VOICE_PUSH) { } else if (msg.type === ApiRoom.BE_SHORT_OF_GOLD_COINS_PUSH) {
				if (msg.data.uid == UserModel.getData('uid')) {
					AssetsManager.tipDialog('金币不足，不可加入！');
				}
			} else if (msg.type === ApiRoom.ROOM_USER_WIN_TOTAL_PUSH) {
				this._roundScoreSync(msg.data.userWinTotalScore);
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiDdz.GAME_BUREAU_PUSH) {
				this._onRound();
			} else if (msg.type === ApiDdz.GAME_STATUS_PUSH) {
				this._onStatusSync();
			} else if (msg.type == ApiDdz.GAME_RESULT_PUSH) {
				this._onSmall(msg.data);
			} else if (msg.type == ApiDdz.GAME_USER_OPERATE_START_PUSH) {
				this._onOutTurn(msg.data);
			} else if (msg.type == ApiDdz.GAME_ROB_BANK_TURN_PUSH) {
				this._onRobTurn(msg.data);
			} else if (msg.type == ApiDdz.GAME_DOUBLE_TURN_PUSH) {
				this._onRobTurn(msg.data);
				this._baseCardsSync();
			} else if (msg.type == ApiDdz.GAME_SEND_CARDS_PUSH) {
				// console.log('发牌-SEND', msg.data);
				this.updateHandCard(msg.data, true)
			} else if (msg.type == ApiDdz.GAME_ROB_BANK_RESULT_PUSH) {
				this._onRobResult(msg.data);
			} else if (msg.type == ApiDdz.GAME_ROB_SET_RESULT_PUSH) {
				this._onRobSet(msg.data);
			} else if (msg.type == ApiDdz.GAME_DOUBLE_RESULT_PUSH) {
				this._onRateResult(msg.data);
			} else if (msg.type == ApiDdz.GAME_USER_OPERATE_PUSH) {
				this._onOpResult(msg.data);
			} else if (msg.type == ApiDdz.GAME_END_PUSH) {
				this._onEnd(msg.data);
			} else if (msg.type === ApiDdz.GAME_BANK_RANG_PAI_COUNT_ROUND_PUSH) {
				this._onYieldTurn();
			} else if (msg.type === ApiDdz.GAME_BANK_RANG_PAI_COUNT_PUSH) {
				this._onYieldCount();
			} else if (msg.type === ApiDdz.GAME_RANG_PAI_RESULT_PUSH) {
				this._onYieldResult();
			} else if (msg.type === ApiDdz.GAME_REVIEW_PUSH) {
				// console.log('回放', msg);
				let reviewRecord = msg.data.list;
				if (reviewRecord && reviewRecord.length > 0) {
					AssetsManager.createDialog({
						bundle: Enums.bundleType.DDZ,
						path: "res/prefab/DDZReview",
						reviewRecord: reviewRecord,
					});
				} else {
					AssetsManager.tipDialog('暂无回放没有数据');
				}
			} else if (msg.type === ApiDdz.GAME_MULTIPLE_RESULT_PUSH) {
				// console.log('倍数推送', msg);
				this._onMultiple(msg.data);
			}
		} else if (route === 'ReconnectSuccess') {
			this.onReconnectCheck();
		} else if (route == 'UpdateGameBg') { } else if (route == 'UpdateGameCardBg') {
			this._cardBackSync();
		} else if (route === 'SelfEntryRoomPush') {
			if (msg.gameType != DDZModel.getBundleType()) {
				AssetsManager.popDialog({
					content: `进入游戏失败,请返回大厅后再试！`,
					ok: this._enterHall.bind(this)
				});
				return;
			}
			UserModel.setData('gameType', msg.gameType);
			ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
		} else if (route === 'CreateRoomFail') {
			this.unscheduleAllCallbacks();
			AssetsManager.popDialog({
				content: Codes[msg.code],
				ok: this._enterHall.bind(this)
			});
		} else if (route === 'QuickJoinFail') {
			AssetsManager.popDialog({
				content: Codes[msg.code],
				ok: this._enterHall.bind(this)
			});
		} else if (route === 'JoinGameAgainPush') {
			this.unscheduleAllCallbacks();
			AssetsManager.popDialog({
				content: Codes[msg.code],
				ok: this._enterHall.bind(this)
			});
		} else if (route === 'TestClickReq') {
			this._onTestClick()
		} else if (route === 'OnGameOnceAgain') {
			this.unscheduleAllCallbacks();
			this.scheduleOnce(() => {
				AssetsManager.popDialog({
					content: '再来一局初始化异常，请返回大厅后再试！',
					ok: () => {
						this._enterHall();
					}
				});
			}, 10);
		} else if (route === Events.clientEvents.gvUploadFileSuccess) {
			this._onUploadSuccess(msg)
		}
	},

	onEventShow() {
		this.onReconnectCheck();
	},

	onReconnectCheck() {
		if (UserModel.isInRoom()) {
			ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
		} else {
			this._enterHall();
		}
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
		this._opClear();
	},

	_gameInit(data) {
		console.log("初始化===", data)
		DDZGameLogic.init(data.gameRule)
		MessageCallback.emitMessage('RemoveGameResult');
		this.unscheduleAllCallbacks();
		this._gameInfoSync();
		this._seatsInit();
		this._opSync();
		this._holdsSync();
		this._cardRecordsSync();
		this._baseCardsSync();
		this._userMultipleSync();
		/**初始化用户信息 */
		let roomUserInfoArr = data.roomUserInfoArr || [];
		roomUserInfoArr.forEach(user => {
			let localIndex = DDZModel.getIndexByUID(user.uid);
			this._userList[localIndex].sit(user);
		})
		this._gameStatus = data.gameData.gameStatus;
		if (this._gameStatus != ApiDdz.gameStatus.NONE && this._gameStatus != ApiDdz.gameStatus.GAME_END) {
			/**恢复手牌 */
			this.updateHandCard(data.gameData)
			/**恢复操作 */
			let optData = {
				tick: data.gameData.tick,
				cards: data.gameData.lastOperateCards,
				uid: data.gameData.curOperateUid,
				lastOperateUid: data.gameData.lastOperateUid,
			}
			this._onOutTurn(optData)
			/**恢复出的牌或者pass */
			let lastOut = null;
			let operateRecords = data.gameData.operateRecords;
			for (let i = operateRecords.length - 1; i >= 0; i--) {
				const opt = operateRecords[i]
				if (opt && opt.operateInfo.operateType == ApiDdz.operateType.OUT) {
					lastOut = opt
					break
				}
			}
			if (lastOut && lastOut.uid != data.gameData.curOperateUid) {
				this.showUserOutCard(lastOut.uid, lastOut.operateInfo.cards, null, false);
			}
			if (this._gameStatus > ApiDdz.gameStatus.QIANG_ZHUANG) {
				let bankerUid = data.gameData.bankerUid;
				let idx = DDZModel.getIndexByUID(bankerUid);
				this._userList[idx].showBanker(true);
			}
		}
	},

	/**刷新牌 */
	updateHandCard(data, isAni = false) {
		let handCards = data.handCards;
		DDZModel.onSendCards(data);
		this._cardRecordsSync();
		for (const uid in handCards) {
			if (Object.hasOwnProperty.call(handCards, uid)) {
				const cardarr = DDZModel.getUserHandCardsByUID(uid);//handCards[uid];
				let idx = DDZModel.getIndexByUID(uid)
				let handCtrl = this._handCardList[idx]
				if (idx == 0) {
					handCtrl && handCtrl.updateCards(cardarr, isAni)
				} else {
					/**展示手牌数量 */
					let userCtrl = this._userList[idx]
					userCtrl && userCtrl.setCardCount(true, cardarr.length);
					if (!!UserModel.getData("isTest")) {
						handCtrl && handCtrl.updateCards(cardarr, false, false, uid);
					}
				}
			}
		}
	},

	_userMultipleSync() {
		let gameStatus = DDZModel.getGameStatus();
		let uid = DDZModel.getMyUID();
		let rate = DDZModel.getMultipleByUID(uid);
		if (gameStatus == ApiDdz.gameStatus.NONE ||
			gameStatus == ApiDdz.gameStatus.SEND_CARDS ||
			gameStatus == ApiDdz.gameStatus.QIANG_ZHUANG) {
			this.multipleLbl.string = '';
		} else {
			this.multipleLbl.string = `x${rate}`;
		}
	},

	_baseCardsSync() {
		let gameStatus = DDZModel.getGameStatus();
		if (gameStatus == ApiDdz.gameStatus.USER_OPERATE ||
			gameStatus == ApiDdz.gameStatus.JIA_BEI ||
			gameStatus == ApiDdz.gameStatus.GAME_END) {
			this.baseShow.active = false;
			for (let index = 0; index < this.baseShow.children.length; index++) {
				this.baseShow.children[index].stopAllActions();
				this.baseShow.children[index].setPosition(this._baseShowPos[index].show);
				this.baseShow.children[index].scale = 1;
				AssetsManager.loadSpriteFrame({
					path: ConfigModel.getCardUrl(),
					sprite: this.baseShow.children[index].getComponent(cc.Sprite)
				});
			}
			let baseCards = DDZModel.getBaseCards();
			this.baseCards.active = true;
			this.baseCardsList.active = true;
			for (let index = 0; index < this.baseCardsList.children.length; index++) {
				AssetsManager.loadSpriteFrame({
					path: `sprite/cards/${baseCards[index] || 0}`,
					sprite: this.baseCardsList.children[index].getComponent(cc.Sprite)
				});
			}
		} else {
			this._baseCardsClear();
		}
		if (gameStatus != ApiDdz.gameStatus.NONE &&
			gameStatus != ApiDdz.gameStatus.SEND_CARDS &&
			DDZModel.getGameRuleByKey('maxPlayerCount') == 2) {
			this.rangCount.string = `让${DDZModel.getRangCardsCount()}张`;
		} else {
			this.rangCount.string = '';
		}
	},

	_rangClear() {
		this.rangShow.active = false;
		this.rangShow.stopAllActions();
		this.rangShow.opacity = 0;
		this.rangTips.string = '';
	},

	_baseCardsClear() {
		this.baseCards.active = false;
		this.baseShow.active = false;
		this.baseCardsList.active = false;
		for (let index = 0; index < this.baseShow.children.length; index++) {
			this.baseShow.children[index].stopAllActions();
			this.baseShow.children[index].setPosition(this._baseShowPos[index].show);
			this.baseShow.children[index].scale = 1;
			AssetsManager.loadSpriteFrame({
				path: ConfigModel.getCardUrl(),
				sprite: this.baseShow.children[index].getComponent(cc.Sprite)
			});
		}
		for (let index = 0; index < this.baseCardsList.children.length; index++) {
			AssetsManager.loadSpriteFrame({
				path: ConfigModel.getCardUrl(),
				sprite: this.baseCardsList.children[index].getComponent(cc.Sprite)
			});
		}
	},

	_cardRecordsSync() {
		if (!DDZModel.getGameRuleByKey('isCardRecorder')) return;
		let cardRecords = DDZModel.getCardRecords();
		for (const card of cardRecords) {
			let childName = card.card.toString();
			if (!this.cardRecordList.getChildByName(childName)) continue;
			this.cardRecordList.getChildByName(childName).getComponent(cc.Label).string = card.count;
		}
	},

	_holdsSync(func) {
		this._matched = [];
		let uid = UserModel.getData('uid');
		this._holds = DDZModel.getUserHandCardsByUID(uid);
		let outsType = DDZModel.getLastOutCardType();
		let holdList = Utils.deepCopy(this._holds);
		let outsList = DDZModel.getLastOutCards();
		if (DDZModel.isOnlyLaiZi(holdList) && !outsList.length) {//容错只有赖子
			let typeVal = holdList.length == 4 ? ApiDdz.cardType.CHUN_LAIZI_BOMB : 0
			this._matched = [{ type: typeVal, cardList: holdList }]
		} else {
			let mateArr = DDZGameLogic.searchOutCard(holdList, outsList);
			mateArr.sort((a, b) => { return a.type - b.type; });
			DDZUtils.getOptimizeTips(holdList, mateArr, (newList) => {
				// console.log("提示筛选返回=newList", newList);
				this._handCardList[0].setTipData(newList);
				this._matched = newList;
				func && func();
			}, outsList, outsType);
		}
	},

	_opSync() {
		this._opClear();
		this.btnReady.active = false;
		let uid = UserModel.getData('uid');
		let isMyTurn = DDZModel.checkIsMyTurn();
		let gameStatus = DDZModel.getGameStatus();
		let playStatus = DDZModel.getUserPlayStatusByUID(uid);
		this.btnCardRecord.active = !!DDZModel.getGameRuleByKey('isCardRecorder') && gameStatus == ApiDdz.gameStatus.USER_OPERATE;
		this._handsTouchAble = gameStatus == ApiDdz.gameStatus.USER_OPERATE;
		if (gameStatus == ApiDdz.gameStatus.NONE) {
			if (DDZModel.getCurBureau() > 0) {
				if (playStatus != ApiRoom.playStatus.READY) {
					this.readyCtrl.sync();
				}
			} else {
				this.btnReady.active = playStatus != ApiRoom.playStatus.READY;
				this.readyCtrl.clear();
			}
		} else if (gameStatus == ApiDdz.gameStatus.SEND_CARDS) {
		} else if (gameStatus == ApiDdz.gameStatus.GAME_END) {
			if (playStatus != ApiRoom.playStatus.READY) {
				this.readyCtrl.sync();
			}
			this.readyCtrl.clear();
		} else if (gameStatus == ApiDdz.gameStatus.QIANG_ZHUANG) {
			if (!!isMyTurn) {
				this.robCtrl.sync();
			}
		} else if (gameStatus == ApiDdz.gameStatus.JIA_BEI) {
			if (!!isMyTurn) {
				this.rateCtrl.sync();
			}
		} else if (gameStatus == ApiDdz.gameStatus.USER_OPERATE) {

			if (!!isMyTurn) {
				this._holdsSync(() => {
					this.opCtrl.sync(this._matched);
				})
			}
		} else if (gameStatus == ApiDdz.gameStatus.RANG_PAI) {
			if (!!isMyTurn && DDZModel.getGameRuleByKey('maxPlayerCount') == 2) {
				this.rangCtrl.sync();
			}
		}
	},

	_opClear() {
		this.opCtrl.clear();
		this.rateCtrl.clear();
		this.readyCtrl.clear();
		this.robCtrl.clear();
		this.rangCtrl.clear();
	},

	_cardRecordsClear() {
		if (!DDZModel.getGameRuleByKey('isCardRecorder')) return;
		this.cardRecordList.stopAllActions();
		this.cardRecordList.setPosition(this._cardRecordListPos.hide);
		for (const card of this.cardRecordList.children) {
			card.getComponent(cc.Label).string = '0';
		}
	},

	_seatsInit() {
		let chairCount = DDZModel.getChairCount();
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
		DDZModel.setRelativeChairID();
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
				this._userList.push(headNode.getComponent("DDZSeat"))
				this._userList[i].initRes({
					deal: this.deal,
					comp: this,
					index: i,
				})
			}

			let handCard = cc.find("handCard" + idx, this.node)
			let outCard = cc.find("outCard" + idx, this.node)
			this._handCardList.push(handCard.getComponent("DDZCardMgr"))
			this._handCardList[i].init(idx)
			this._handCardList[i].addTouchEvent()

			this._outCardList.push(outCard.getComponent("DDZCardMgr"))
			this._outCardList[i].init(idx)
		}
	},

	_gameInfoSync() {
		this._yuYinShow();
		this.lai_Card.node.active = !!DDZModel.getGameRuleByKey("isLai");
		this.lai_Card.updateFlowerLai(DDZModel.getLaiZi().join());
		let unionID = DDZModel.isUnionCreate() ? DDZModel.getRoomCreatorByKey('unionID') : null;
		let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
		this.btnTest.active = false //!!UserModel.getData('isTest');
		this.roomIdLbl.string = `房号:${DDZModel.getRoomID()}`;
		this.roundLbl.string = `局数:${DDZModel.getCurBureau()}/${DDZModel.getMaxBureau()}局`;
		this.btnInvite.active = DDZModel.getCurBureau() == 0 && !!isShowInvite;
		this.btnCopy.active = DDZModel.getCurBureau() == 0 && !!isShowInvite;
		this.btnBackHall.active = DDZModel.getCurBureau() == 0 && DDZModel.isUnionCreate();
		if (this.canNotDismissBar) this.canNotDismissBar.active = DDZModel.getGameRuleByKey("canNotDissmiss");
		this.resetTable();
	},

	_yuYinShow() {
		let yuyin = DDZModel.getGameRuleByKey('yuyin');
		this.btnYuYin.active = !!yuyin && ConfigModel.getData('voiceSpeaker');
	},

	_onOffLine(user) {
		let localIndex = DDZModel.getIndexByUID(user.uid);
		if (!this._userList[localIndex]) return;
		this._userList[localIndex].off();
	},

	/**恢复所有人的总输赢分数 */
	_roundScoreSync(scores) {
		if (!DDZModel.scoreState()) return;
		for (const index in scores) {
			let localIndex = DDZModel.getIndexByUID(index);
			if (!this._userList[localIndex]) continue;
			this._userList[localIndex].setTotalScore(scores[index]);
		}
	},

	_onStatusSync() {
		this.btnBackHall.active = false
		let gameStatus = DDZModel.getGameStatus();
		if (gameStatus == ApiDdz.gameStatus.NONE) {
			this._rangClear();
			this._baseCardsClear();
			let users = DDZModel.getUsersInSeat();
			for (let index = 0; index < users.length; index++) {
				let user = users[index];
				let localIndex = DDZModel.getIndexByUID(user.uid);
				if (!this._userList[localIndex]) continue;
				this._userList[localIndex].sit(user);
			}
		}
		this._opSync();
		if (gameStatus == ApiDdz.gameStatus.USER_OPERATE) {
			this._rangClear();
		}
		this._userList.forEach(seat => {
			seat.showClock();
		});
		this._userMultipleSync();
	},

	_onRound() {
		MessageCallback.emitMessage('RemoveGameResult');
		this._gameInfoSync();
	},

	_onChat(data) {
		// console.log('玩家聊天', data);
		let localIndex = DDZModel.getIndexByUID(data.uid);
		if (!this._userList[localIndex]) return;
		this._userList[localIndex].chat(data);
	},

	_onOutTurn(data) {
		// console.log("通知操作=data", data)
		this._opSync();
		this._cardRecordsSync();
		this._userList.forEach(ctrl => ctrl.showClock(false));
		if (!!DDZModel.checkIsMyTurn()) {
			this._holdsSync();
		} else {
			let localIndex = DDZModel.getIndexByUID(data.uid);
			this._userList[localIndex].showClock(true);
		}
	},

	_onRobTurn(data) {
		this._opSync();
		this._userList.forEach(ctrl => ctrl.showClock(false));
		let localIndex = DDZModel.getIndexByUID(data.uid);
		if (data.uid != DDZModel.getMyUID()) {
			this._userList[localIndex].showClock(true);
		}
	},


	_onYieldTurn() {
		// console.log('让牌轮次推送');
		this._opSync();
		let users = DDZModel.getUsersInSeat();
		for (const user of users) {
			let localIndex = DDZModel.getIndexByUID(user.uid);
			if (!this._userList[localIndex]) continue;
			this._userList[localIndex].showOption();
		}
	},

	_onYieldCount() {
		if (DDZModel.getGameRuleByKey('maxPlayerCount') != 2) return;
		let rangCounts = DDZModel.getRangCardsCount()
		this.rangShow.active = rangCounts > 0;
		this.rangShow.stopAllActions();
		this.rangShow.opacity = 0;
		this.rangTips.string = `地主让${rangCounts}张`;
		this.rangCount.string = `让${rangCounts}张`;
		if (rangCounts > 0) {
			cc.tween(this.rangShow)
				.to(0.15, {
					opacity: 255
				})
				.start();
		}
	},

	_onYieldResult() {
		this._rangClear();
		this._opClear();
	},

	_onMultiple(data) {
		if (data.uid != DDZModel.getMyUID()) return;
		this.multipleLbl.string = `x${data.multiples[data.uid] || 0}`;
	},

	_onRobResult(data) {
		// console.log('定庄', data);
		if (!data.isSuccess) {
			AssetsManager.tipDialog(data.errMsg);
			return;
		}
		if (data.uid == DDZModel.getMyUID()) {
			this._opClear();
		}
		let localIndex = DDZModel.getIndexByUID(data.uid);
		this._userList[localIndex].showOption(`jiao${data.gameSnagScore}`);
		DDZModel.playUserSound(`res/audio/man/man_fen${data.gameSnagScore}`);
	},

	_onRobSet(data) {
		this._opClear();
		// console.log('定庄-SET', data);
		let users = DDZModel.getUsersInSeat();
		for (const user of users) {
			let localIndex = DDZModel.getIndexByUID(user.uid);
			this._userList[localIndex].showBanker(user.uid == data.uid, true);
		}
		let localIndex = DDZModel.getIndexByUID(data.uid);
		let holdList = DDZModel.getUserHandCardsByUID(data.uid);
		if (data.uid == DDZModel.getMyUID()) {
			// this._holdsSync()
			this._handCardList[0].updateCards(holdList, 2);
		} else {
			this._userList[localIndex].setCardCount(true, holdList.length);
		}
		let baseCards = DDZModel.getBaseCards();
		this.baseCards.active = true;
		this.baseShow.active = true;
		this.baseCardsList.active = false;
		for (let index = 0; index < this.baseCardsList.children.length; index++) {
			AssetsManager.loadSpriteFrame({
				path: `sprite/cards/${baseCards[index] || 0}`,
				sprite: this.baseCardsList.children[index].getComponent(cc.Sprite)
			});
		}
		for (let index = 0; index < this.baseShow.children.length; index++) {
			this.baseShow.children[index].stopAllActions();
			this.baseShow.children[index].scale = 1;
			this.baseShow.children[index].setPosition(this._baseShowPos[index].show);
			AssetsManager.loadSpriteFrame({
				path: ConfigModel.getCardUrl(),
				sprite: this.baseShow.children[index].getComponent(cc.Sprite)
			});
			cc.tween(this.baseShow.children[index])
				.to(0.15, {
					scaleX: 0.5
				})
				.call(() => {
					AssetsManager.loadSpriteFrame({
						path: 'sprite/cards/' + baseCards[index],
						sprite: this.baseShow.children[index].getComponent(cc.Sprite)
					});
				})
				.to(0.15, {
					scaleX: 1
				})
				.call(() => {
					this.baseShow.children[index].scaleX = 1;
					if (index != this.baseShow.children.length - 1) return;
					for (let k = 0; k < this.baseShow.children.length; k++) {
						this.baseShow.children[k].stopAllActions();
						this.baseShow.children[k].scale = 1;
						this.baseShow.children[k].setPosition(this._baseShowPos[k].show);
						let scale = this.baseCardsList.scaleX / this.baseShow.scaleX;
						cc.tween(this.baseShow.children[k])
							.delay(0.15 + k * 0.1)
							.parallel(
								cc.tween()
									.to(0.35, {
										position: cc.v3(this._baseShowPos[k].base)
									}),
								cc.tween()
									.to(0.35, {
										scale: scale
									}))
							.call(() => {
								if (k == this.baseShow.children.length - 1) {
									this.baseShow.active = false;
									this.baseCardsList.active = true;
								}
							})
							.start()
					}
				})
				.start();
		}
	},

	_onRateResult(data) {
		if (data.uid == DDZModel.getMyUID()) {
			this._opClear();
		}
		let localIndex = DDZModel.getIndexByUID(data.uid);
		this._userList[localIndex].showOption(`jiabei${data.gameSnagScore}`);
		DDZModel.playUserSound(`res/audio/man/man_jiabei${data.gameSnagScore}`);
	},

	_onOpResult(data) {
		// console.log('出牌', data);
		if (!data.operateInfo.isSuccess) {
			AssetsManager.tipDialog(data.operateInfo.errMsg);
			return;
		}
		this._opClear();
		this._cardRecordsSync();
		this.updateHandCard(data.operateInfo);
		let cards = data.operateInfo.cards || [];
		let cardType = data.operateInfo.cardType || 0;
		let optType = data.operateInfo.operateType || 0;
		let localIndex = DDZModel.getIndexByUID(data.uid);
		this._userList.forEach(ctrl => ctrl.showOption());
		this.showUserOutCard(data.uid, cards, cardType, true);
		if (optType == ApiDdz.operateType.PASS) {
			this._userList[localIndex].showOption("buchu");
			DDZModel.playUserSound(`res/audio/man/man_buyao1`, data.uid);
		} else if (optType == ApiDdz.operateType.OUT) {
			DDZModel.playOptSoundAinm(cards, cardType, (ainmNode) => {
				if (cardType == ApiDdz.cardType.WANG_BOMB) {
					ainmNode.setPosition(cc.v2(0, 80));
					this.effect.addChild(ainmNode);
				} else {
					this._outCardList[localIndex].setAniNode(ainmNode);
				}
			}, data.uid);
		}
	},

	showUserOutCard(uid, outList, outType, outAinm = true) {
		if (!uid) return;
		let localIndex = DDZModel.getIndexByUID(uid);
		this._outCardList.forEach(ctrl => ctrl.updateCards([]));
		DDZModel.switchLaiziOutCard(outList, outType, (haveLaiZi, runList) => {
			if (haveLaiZi) {
				this._outCardList[localIndex].updateLaiZiCards(runList, outAinm, uid);
			} else {
				this._outCardList[localIndex].updateCards(runList, false, outAinm, uid);
			}
		});
	},

	_onSmall(data) {
		console.debug('小结算', data);
		this._cardRecordsClear();
		this._opSync();
		this._outCardList.forEach(ctrl => ctrl.updateCards([]));
		let createResultDialog = () => {
			let nodeParams = { // 创建结束界面
				bundle: Enums.bundleType.DDZ,
				resultData: data,
				myChairID: DDZModel.getMyChairID(),
				isBureauFull: DDZModel.getCurBureau() == DDZModel.getMaxBureau(),
				mainDialog: this,
				path: 'res/prefab/DDZResultDialog',
				curBureau: DDZModel.getCurBureau(),
				maxBureau: DDZModel.getMaxBureau(),
				enterHall: this._enterHall.bind(this),
				onEnd: this._onEnd.bind(this)
			};
			AssetsManager.createDialog(nodeParams);
		}
		if (!!data.hasChuntian) {
			DDZModel.showAinm(11, (node) => {
				this.effect.addChild(node);
			}, cc.v2(0, 0), createResultDialog);
		} else {
			createResultDialog();
		}
		if (!data.result) return;
		let result = data.result;
		for (const user of result) {
			let localIndex = DDZModel.getIndexByUID(user.uid);
			if (!this._userList[localIndex]) return;
			this._userList[localIndex].small(user);
		}
	},

	_resultShow(data) {

	},

	_onEnd(data) {
		console.log('展示大结算', data);
		UserModel.setData('roomID', '');
		if (data.result.length > 0) {
			data.enterHall = this._enterHall.bind(this);
			data.path = 'res/prefab/DDZAllResult';
			data.bundle = Enums.bundleType.DDZ;
			data.isUnionCreate = DDZModel.isUnionCreate();
			data.unionID = DDZModel.getRoomCreatorByKey("unionID")
			data.gameRule = DDZModel.getGameRule()
			data.roomID = DDZModel.getRoomID()
			this.unscheduleAllCallbacks();
			this.scheduleOnce(() => {
				MessageCallback.emitMessage('RemoveGameResult');
				AssetsManager.createDialog(data);
			}, 2);
		} else {
			this._enterHall();
		}
	},

	_onUserEnter(user) {
		let localIndex = DDZModel.getIndexByUID(user.uid);
		if (!this._userList[localIndex]) return;
		this._userList[localIndex].sit(user);
	},

	_verifyZuobi(roomUserInfo) {
		if (!DDZModel.getGameRuleByKey('fangzuobi')) return;
		if (DDZModel.getChairCount() == 2) return;
		if (roomUserInfo.chairID >= DDZModel.getChairCount()) return;
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
		for (let user of this.roomUserInfoArr) {
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

	_onUserLeave(user) {
		// 删除用户信息
		if (user.uid === UserModel.getData('uid')) {
			this._enterHall();
		} else {
			let localIndex = DDZModel.getIndexByChairID(user.chairID);
			if (!this._userList[localIndex]) return;
			this._userList[localIndex].leave();
		}
	},

	_onUserReady(data) {
		// 显示准备状态
		// console.log('玩家准备', data);
		if (data.uid == DDZModel.getMyUID()) {
			MessageCallback.emitMessage('RemoveGameResult');
			this._opSync();
		}
		let localIndex = DDZModel.getIndexByUID(data.uid);
		this._userList[localIndex].showOption("ready", false);
		if (data.uid == DDZModel.getMyUID()) {
			this.resetTable();
			this._opClear();
		}
	},

	//刷新解散按钮图片
	_dismissSync() {
		this.btnDismiss.active = DDZModel.getCurBureau() > 0 && !DDZModel.getGameRuleByKey('canNotDissmiss');
		this.btnExit.active = DDZModel.getCurBureau() == 0;
	},

	//刷新设置显示状态
	_showMenuBtns() {
		if (!this.menuLay) return;
		this.menuLay.active = true;
	},
	_onMenuClick() {
		this._dismissSync()
		this._showMenuBtns()
	},

	_onMenuCloseClick() {
		this.menuLay.active = false;
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

		this._dismissSync()
		this._showMenuBtns()
	},


	btnClicks(event, param) {

		switch (param) {
			case 'menu':
				this.menuLay.active = true;
				this._onMenuOpen();
				break;
			case 'menuclose':
				this._onMenuCloseClick();
				break;
			case 'refresh':
				this._onMenuCloseClick();
				this._onRefreshClick(event);
				break;
			case 'deposit':
				this._onMenuCloseClick();
				this._onDepositClick();
				break;
			case 'disdeposit':
				this._onMenuCloseClick();
				this._onDisDepositClick();
				break;
			case 'review':
				this._onMenuCloseClick();
				this._onReviewClick();
				break;
			case 'dismiss':
				this._onMenuCloseClick();
				this._onDismissClick();
				break;
			case 'exit':
				this._onMenuCloseClick();
				this._onExitClick();
				break;
			case 'setting':
				this._onMenuCloseClick();
				this._onSettingClick();
				break;
			case 'test':
				this._onTestClick()
				break;
			case 'location':
				this._onMenuCloseClick();
				this._onLocationClick();
				break;
			case 'chat':
				this._onChatClick();
				break;
			case 'ready':
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify());
				break;
			case 'copy':
				this._onCopyClick();
				break;
			case 'invite':
				this._onInviteClick();
				break;
			case 'rule':
				this._onMenuCloseClick();
				this._onRuleClick(event);
				break;
			case 'rob0':
			case 'rob1':
			case 'rob2':
			case 'rob3':
				let value = parseInt(param.slice(3));
				ApiRoom.gameMessageNotify(ApiDdz.getRobNotify(value));
				break;
			case 'pass':
				this._passClick();
				break;
			case 'out':
				this._outClick();
				break;
			case 'rate0':
			case 'rate1':
				let rate = parseInt(param.slice(4));
				ApiRoom.gameMessageNotify(ApiDdz.getRateNotify(rate))
				break;
			case 'reset':
				this._onResetClick();
				break;
			case 'cardrecord':
				this._onCardRecordClick();
				break;
			case 'tip':
				this._onTipClick();
				break;
			case 'rang0':
			case 'rang2':
			case 'rang3':
			case 'rang4':
				let count = parseInt(param.slice(4));
				ApiRoom.gameMessageNotify(ApiDdz.getYieldNotify(count));
				break;
			case "btn_back":
				this._enterHall();
				break;
		}
	},

	_onTipClick() {
		this._handCardList[0].showTipCards()
	},

	_onCardRecordClick() {
		if (this._cardRecordListShow) {
			this._onHideCardRecord();
		} else {
			this._cardRecordListShow = true;
			this.cardRecordList.stopAllActions();
			this.cardRecordList.setPosition(this._cardRecordListPos.hide);
			cc.tween(this.cardRecordList)
				.to(0.35, {
					position: cc.v3(this._cardRecordListPos.show)
				}, {
					easing: 'backOut'
				})
				.start();
		}
	},

	_onHideCardRecord() {
		this._cardRecordListShow = false;
		this.cardRecordList.stopAllActions();
		this.cardRecordList.setPosition(this._cardRecordListPos.hide);
	},

	_passClick() {
		let lastOutCards = DDZModel.getLastOutCards();
		if (!lastOutCards || lastOutCards.length == 0) {
			AssetsManager.tipDialog('先手必须出牌哦~');
			return;
		}
		ApiRoom.gameMessageNotify(ApiDdz.getOperateNotify(ApiDdz.operateType.PASS, []));

	},

	_outClick() {
		let selectsList = this._handCardList[0].getAllUpCardId()
		// console.log('出牌数据', selectsList)
		if (selectsList.length == 0) {
			AssetsManager.tipDialog('先手必须出牌哦~');
			return;
		}
		ApiRoom.gameMessageNotify(ApiDdz.getOperateNotify(ApiDdz.operateType.OUT, selectsList))
	},

	_onResetClick() {
		// console.log('清除选牌')
		this._onHideCardRecord();
		this._handCardList[0].setAllCardDown();
	},


	_onDepositClick() {
		return;
		ApiRoom.gameMessageNotify(ApiDdz.gameTrushNotify(true));
	},

	_onDisDepositClick() {
		return;
		ApiRoom.gameMessageNotify(ApiDdz.gameTrushNotify(false));
	},

	_onSettingClick() {
		AssetsManager.setDialog({
			type: 'round',
			gameType: Enums.bundleType.DDZ,
			musicType: Enums.bundleType.POKER,
		});
	},

	_onRuleClick(event) {
		if (CCUtil.clickInterval(event.target, 0.5)) return;
		AssetsManager.tableDialog({
			gameRule: DDZModel.getGameRule(),
		});
	},

	_onDismissClick() {
		AssetsManager.popDialog({
			content: '是否确定发出解散申请？',
			ok: () => {
				ApiRoom.roomMessageNotify(ApiRoom.getAskForDismissNotifyData({
					isAsker: true
				}));
			},
			no: () => { }
		});
	},


	_onExitClick() {
		if (!UserModel.isInRoom()) {
			this._enterHall();
			return;
		}
		ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
	},


	_onCopyClick() {
		let str = ConfigModel.getRoomShare(Enums.bundleType.DDZ, DDZModel.getRoomID());
		NativeUtil.copyText(str);
	},

	_onInviteClick() {
		let gameRule = DDZModel.getGameRule();
		gameRule = gameRule || {};
		gameRule.roomId = DDZModel.getRoomID();
		let share = ConfigModel.getRoomRuleShare(gameRule);
		NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
	},

	_onReviewClick() {
		ApiRoom.gameMessageNotify(ApiDdz.gameReviewNotify());
	},

	_onGift(fromChairID, toChairID, giftID) {
		let fromLocalIndex = DDZModel.getIndexByChairID(fromChairID);
		if (!this._userList[fromLocalIndex]) return;
		let sender = this._userList[fromLocalIndex].node;
		let reciever = [],
			rids = [];
		if (fromChairID == toChairID) {
			let players = this._getHeadInSeat();
			reciever = players.node;
			rids = players.cid;
		} else {
			let toLocalIndex = DDZModel.getIndexByChairID(toChairID);
			if (!this._userList[toLocalIndex]) return;
			reciever.push(this._userList[toLocalIndex].node);
			rids.push(toChairID);
		}
		AssetsManager.addGift({
			sid: fromChairID,
			rids: rids,
			reciever: reciever,
			sender: sender,
			id: giftID,
			parent: this.effect
		});
	},

	_getHeadInSeat() {
		let players = {
			node: [],
			cid: []
		}
		let users = DDZModel.getUsersInSeat();
		for (let user of users) {
			//节点显示则为有人
			let localIndex = DDZModel.getIndexByUID(user.uid);
			if (!this._userList[localIndex]) continue;
			players.node.push(this._userList[localIndex].node);
			players.cid.push(user.chairID);
		}
		return players;
	},

	update(dt) { },

	_onRefreshClick(event) {
		if (CCUtil.clickInterval(event.target, 10, true)) return;
		AssetsManager.tipDialog('刷新界面可以修复游戏显示问题');
		this.messageCallbackHandler('ReconnectSuccess');
	},

	_onTestClick() {
		let jushu = DDZModel.getCurBureau()
		if (jushu <= 0) return;
		AssetsManager.createDialog({
			bundle: Enums.bundleType.DDZ,
			path: "res/prefab/DDZSelectTest",
		})
	},

	_onLocationClick() {
		AssetsManager.locationDialog({
			users: DDZModel.getPlayerTakeSeats(),
			chairCount: DDZModel.getChairCount(),
			fangzuobi: DDZModel.getGameRuleByKey('fangzuobi')
		})
	},

	_onChatClick() {
		let params = {
			gameRule: DDZModel.getGameRule(),
			chat: (chat) => {
				ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
			}
		}
		AssetsManager.chatDialog(params);
	},

	// 邀请好友的按钮
	onShowInvite() {
		AssetsManager.friendDialog({
			gameRule: DDZModel.getGameRule(),
		})
	},
	_handlerInit() {
		MessageCallback.addListener(Events.clientEvents.gvUploadFileSuccess, this);
		cc.game.on(cc.game.EVENT_SHOW, this.onEventShow, this);
		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
		MessageCallback.addListener('UpdateGameBg', this);
		MessageCallback.addListener('UpdateGameCardBg', this);
		MessageCallback.addListener('SelfEntryRoomPush', this);
		MessageCallback.addListener('CreateRoomFail', this);
		MessageCallback.addListener('QuickJoinFail', this);
		MessageCallback.addListener('JoinGameAgainPush', this);
		MessageCallback.addListener('OnGameOnceAgain', this);
		MessageCallback.addListener('TestClickReq', this)
	},

	_onLoadOver() {
		if (!UserModel.isInRoom()) {
			AssetsManager.tipDialog("房间不存在")
			this.scheduleOnce(this._enterHall.bind(this), 0.5)
		} else {
			ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
		}
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

	_handlerClear() {
		MessageCallback.removeListener(Events.clientEvents.gvUploadFileSuccess, this);
		cc.game.off(cc.game.EVENT_SHOW, this.onEventShow, this);
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
		MessageCallback.removeListener('UpdateGameBg', this);
		MessageCallback.removeListener('UpdateGameCardBg', this);
		MessageCallback.removeListener('SelfEntryRoomPush', this);
		MessageCallback.removeListener('CreateRoomFail', this);
		MessageCallback.removeListener('QuickJoinFail', this);
		MessageCallback.removeListener('JoinGameAgainPush', this);
		MessageCallback.removeListener('TestClickReq', this)
		MessageCallback.removeListener('OnGameOnceAgain', this);
	},

	onDestroy() {
		this._handlerClear();
		DDZModel.onDestroy();
		ConfigModel.setData('lastScene', 'ddz');
		NodePoolManager.clear('ddzCardPool');
	},

	_enterHall() {
		let isUnionCreate = DDZModel.getRoomCreatorByKey('creatorType') == Enums.roomCreatorType.UNION_CREATE;
		let unionID = !!isUnionCreate ? DDZModel.getRoomCreatorByKey('unionID') : null;
		SubManager.exitBundle(unionID);
	},
});