const SZModel = require('./SZModel');
const ApiSz = require('./ApiSz');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const SubManager = require('../../../src/utils/SubManager');
const UserModel = require('../../../src/model/UserModel');
const CCUtil = require('../../../src/utils/CCUtil');
const ApiHall = require('../../../src/api/ApiHall');
const SZLogic = require('./SZLogic');
const Codes = require('../../../src/const/Codes');
const ConfigModel = require('../../../src/model/ConfigModel');
const Events = require('../../../src/const/Events');
const AudioUtil = require('../../../src/utils/AudioUtil');

cc.Class({
	extends: cc.Component,
	properties: {
		cardsCtrl: [require('SZCards')],
		compareCtrl: require('SZCompare'),
		headsCtrl: [require('SZHead')],
		opCtrl: require('SZOperate'),
		pourCtrl: require('SZPourScore'),
		readyButton: cc.Node,
		lookCardsButton: cc.Node,
		roomIdLabel: cc.Label,
		bureauLabel: cc.Label,
		txt_gameName: cc.Label,
		roundLabel: cc.Label,
		cuopaiPrefab: cc.Prefab,
		btnSitDown: cc.Node,
		btnLocation: cc.Node,
		btnLookOn: cc.Node,
		lookOn: cc.Node,
		menuLay: cc.Node,
		menuLayList: cc.Node,
		menuBtnSprite: cc.Sprite,
		btnDeposit: cc.Node,
		btnTest: cc.Node,
		btnBackHall: cc.Node,
		btnYuYin: cc.Node,
		btnDismiss: cc.Node,
		btnExit: cc.Node,
		canNotDismissBar: cc.Node,

		_menuBtnListPos: null,
		_chairCtrl: [],
		_cardsCtrl: [],
	},

	onLoad() {
		// 菜单点击
		this.menuLay.active = false;
		AssetsManager.init(this.node);
		SZModel.init();
		this.handlerInit();
		this._chairCtrl = [];
		this._cardsCtrl = [];
		this._playingSeat = null;
		this._voiceMsgQueue = [];
		this._lastPlayTime = null;
	},

	start() {
		this.sceneInit();
	},

	handlerInit() {
		cc.game.on(cc.game.EVENT_SHOW, this.onEventShow, this);
		MessageCallback.addListener(Events.clientEvents.gvUploadFileSuccess, this);
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
	},

	handlerRelease() {
		cc.game.off(cc.game.EVENT_SHOW, this.onEventShow, this);
		MessageCallback.removeListener(Events.clientEvents.gvUploadFileSuccess, this);
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
	},

	sceneInit() {
		AssetsManager.loadAsset({
			path: 'res/prefab/SZXiQianLbl',
			aType: cc.Prefab,
			bundle: Enums.bundleType.SZ
		});
		if (!UserModel.isInRoom()) {
			AssetsManager.popDialog({
				content: `房间不存在！`,
				ok: () => {
					this.enterHall();
				}
			});
		} else {
			ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
		}
	},

	/*
	 * 游戏初始化
	 * 断线重连
	 */
	gameInit(data) {
		this.unscheduleAllCallbacks();
		this.seatsInit();
		this.roomIdLabel.string = '房号:' + SZModel.getRoomID();
		this.bureauLabel.string = '局数:' + SZModel.getCurBureau() + '/' + SZModel.getMaxBureau();
		this.roundLabel.string = '轮数:' + SZModel.getCurRound() + '/' + SZModel.getMaxRound();
		let gameName = ConfigModel.getBundleConfig(data.gameRule.gameType)
		this.txt_gameName.string = `游戏:${gameName.name}`
		let user = SZModel.getUserByChairID(SZModel.getMyChairID());
		if (user) {
			if (SZModel.getGameStatus() == ApiSz.gameStatus.NONE &&
				user.userStatus != ApiRoom.userStatusEnum.READY &&
				user.userStatus != ApiRoom.userStatusEnum.LOOK &&
				user.userStatus != ApiRoom.userStatusEnum.PLAYING &&
				SZModel.getCurBureau() < SZModel.getMaxBureau() &&
				SZModel.getMyChairID() < SZModel.getChairCount()) {
				this.readyButton.active = true;
			} else {
				this.readyButton.active = false;
			}
			this.lookCardsButton.active = false;
			if (SZModel.getGameStatus() == ApiSz.gameStatus.POUR_SCORE && SZModel.getCurChairID() == SZModel.getMyChairID()) {
				let userStatus = SZModel.getUserStatusByChairID(SZModel.getMyChairID());
				if (userStatus != ApiSz.userStatus.LOOK &&
					userStatus != ApiSz.userStatus.ABANDON &&
					userStatus != ApiSz.userStatus.LOSE &&
					userStatus != ApiSz.userStatus.TIMEOUTABANDON) {
					let men = SZModel.getGameRuleByKey('gameFrameType');
					this.lookCardsButton.active = men < SZModel.getCurRound();
				}
			}
		}
		cc.find('Tuoguan', this.node).active = SZModel.getTrustByChairID(SZModel.getMyChairID());
		this.onTuoGuanSwitch();
		this.btnDeposit.active = true;
		let unionID = SZModel.isUnionCreate() ? SZModel.getRoomCreatorByKey('unionID') : null;
		let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
		cc.find('lay/copy', this.node).active = SZModel.getCurBureau() == 0 && !!isShowInvite;
		cc.find('lay/invite', this.node).active = SZModel.getCurBureau() == 0 && !!isShowInvite;
		this.btnBackHall.active = SZModel.getCurBureau() == 0 && SZModel.isUnionCreate();
		this.btnTest.active = false // !!UserModel.getData('isTest');
		this.btnLookOn.active = !!SZModel.getGameRuleByKey('canWatch');
		this.btnLocation.active = SZModel.getGameRuleByKey('maxPlayerCount') < 6 && !!SZModel.getGameRuleByKey('showGps');
		this.btnSitDown.active = SZModel.getGameRuleByKey('maxPlayerCount') < 6 && SZModel.getGameRuleByKey('canWatch') && !SZModel.isInSeat();;
		if (this.canNotDismissBar) this.canNotDismissBar.active = SZModel.getGameRuleByKey("canNotDissmiss");
		this._yuYinShow();
		this.verifyZuobi(SZModel.getUserByChairID(SZModel.getMyChairID()));
		this.showSitDownButton();
		this.showDissButton()
		this.showTestCard()
	},

	_yuYinShow() {
		let isInSeat = SZModel.isInSeat();
		let yuyin = SZModel.getGameRuleByKey('yuyin');
		this.btnYuYin.active = !!isInSeat && !!yuyin && ConfigModel.getData('voiceSpeaker');
	},

	onTuoGuanSwitch() {
		let user = SZModel.getUserByChairID(SZModel.getMyChairID());
		this.lookOn.active = (user && user.userStatus == ApiRoom.userStatusEnum.LOOK) || SZModel.getMyChairID() >= SZModel.getChairCount();
	},

	addHeadClickEvent(chair) {
		let head = chair.node;
		if (head.hasEventListener(cc.Node.EventType.TOUCH_START)) return;
		head.on(cc.Node.EventType.TOUCH_START, (event) => {
			if (SZModel.getMyChairID() >= SZModel.getChairCount()) {
				AssetsManager.tipDialog('观战玩家无法查看详细信息');
				return;
			}
			if (CCUtil.clickInterval(event.target, 0.5)) return;
			let logic = head.getComponent('SZHead');
			let user = SZModel.getUserByChairID(logic.getChairID());
			let showHeadDetail = () => {
				try {
					let params = {
						fromChairID: SZModel.getMyChairID(),
						toChairID: logic.getChairID(),
						canSendGift: SZModel.getMyChairID() < SZModel.getChairCount(),
						avatar: user.userInfo.avatar,
						id: user.userInfo.uid,
						ip: user.userInfo.lastLoginIP,
						location: user.userInfo.location,
						gold: user.userInfo.score,
						name: user.userInfo.nickname,
					};
					AssetsManager.headDialog(params);
				} catch (e) { }

			}

			if (!!SZModel.getUserTest() && !!user && !!user.userInfo.uid && !SZModel.isInWatch()) {
				AssetsManager.createDialog({
					user: user,
					callback: showHeadDetail,
					bundle: Enums.bundleType.SZ,
					path: "res/prefab/SZTestSelect",
				})
				return
			}
			showHeadDetail();
		}, this);
	},

	messageCallbackHandler(route, msg) {
		if (!SZModel.isGameInited(route, msg)) return;
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.gameInit(msg.data);
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				this.showHeadNode(msg.data.roomUserInfo.chairID);
				this.verifyZuobi(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				this.hideHeadNode(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				this.userReadyPush(msg.data.chairID);
			} else if (msg.type === ApiRoom.GAME_END_PUSH) { } else if (msg.type === ApiRoom.ROOM_DISMISS_PUSH) { } else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
				msg.data.myChairID = SZModel.getMyChairID();
				AssetsManager.nisDialog(msg.data);
			} else if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
				if (msg.data.code != 0) {
					if (msg.data.uid == UserModel.getData('uid')) {
						AssetsManager.tipDialog(Codes[msg.data.code]);
					}
					return;
				};
				let user = SZModel.getUserByChairID(SZModel.getMyChairID());
				if (SZModel.getGameStatus() == ApiSz.gameStatus.NONE &&
					user.userStatus != ApiRoom.userStatusEnum.READY &&
					user.userStatus != ApiRoom.userStatusEnum.LOOK &&
					user.userStatus != ApiRoom.userStatusEnum.PLAYING &&
					SZModel.getCurBureau() < SZModel.getMaxBureau() &&
					SZModel.getMyChairID() < SZModel.getChairCount()) {
					this.readyButton.active = true;
				} else {
					this.readyButton.active = false;
				}
				this.onTuoGuanSwitch();
				this.showSitDownButton();
				if (user &&
					user.userStatus == ApiRoom.userStatusEnum.LOOK &&
					msg.data.fromChairID < SZModel.getChairCount() &&
					msg.data.toChairID >= SZModel.getChairCount()) {
					SZModel.pourScore(msg.data.fromChairID, 0);
				}
				this.showTestCard()
			} else if (msg.type === ApiRoom.USER_CHAT_PUSH) { } else if (msg.type === ApiRoom.USER_GIFT_SEND_PUSH) {
				this.onGift(msg.data.fromChairID, msg.data.toChairID, msg.data.giftID);
			} else if (msg.type === ApiRoom.USER_VOICE_PUSH) {
				this._voiceMsgQueue.push(msg.data);
			} else if (msg.type === ApiRoom.BE_SHORT_OF_GOLD_COINS_PUSH) {
				if (msg.data.uid == UserModel.getData('uid')) {
					AssetsManager.tipDialog('金币不足，不可加入！');
				}
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiSz.GAME_BUREAU_PUSH) {
				this.btnBackHall.active = false;
				this._yuYinShow();
				this.bureauLabel.string = '局数：' + SZModel.getCurBureau() + '/' + SZModel.getMaxBureau();
				let unionID = SZModel.isUnionCreate() ? SZModel.getRoomCreatorByKey('unionID') : null;
				let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
				cc.find('lay/copy', this.node).active = SZModel.getCurBureau() == 0 && !!isShowInvite;
				cc.find('lay/invite', this.node).active = SZModel.getCurBureau() == 0 && !!isShowInvite;
			} else if (msg.type === ApiSz.GAME_ROUND_PUSH) {
				this.roundLabel.string = '轮数：' + SZModel.getCurRound() + '/' + SZModel.getMaxRound();
			} else if (msg.type === ApiSz.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus == ApiSz.gameStatus.NONE) {
					this.onTuoGuanSwitch();
				}
				this._yuYinShow();
				if (msg.data.gameStatus != ApiSz.gameStatus.SHOW_CARDS) {
					this.lookCardsButton.active = false;
				}
				let user = SZModel.getUserByChairID(SZModel.getMyChairID());
				if (SZModel.getGameStatus() == ApiSz.gameStatus.NONE &&
					user.userStatus != ApiRoom.userStatusEnum.READY &&
					user.userStatus != ApiRoom.userStatusEnum.LOOK &&
					user.userStatus != ApiRoom.userStatusEnum.PLAYING &&
					SZModel.getCurBureau() < SZModel.getMaxBureau() &&
					SZModel.getMyChairID() < SZModel.getChairCount()) {
					this.readyButton.active = true;
				} else {
					this.readyButton.active = false;
				}
				if (SZModel.getGameStatus() == ApiSz.gameStatus.NONE) {
					this.roundLabel.string = '轮数：' + SZModel.getCurRound() + '/' + SZModel.getMaxRound();
				}

			} else if (msg.type === ApiSz.GAME_LOOK_PUSH) {
				let user = SZModel.getUserByChairID(msg.data.chairID);
				let audio = 'res/audio/woman/view';
				if (user && user.userInfo.sex == 0) {
					audio = audio.replace(/woman/, "man");
				}
				AssetsManager.playEffect({
					path: audio,
					bundle: Enums.bundleType.SZ
				});
				if (msg.data.chairID == SZModel.getMyChairID()) {
					this.lookCardsButton.active = false;
					if (msg.data.cuopai) {
						cc.find('CuopaiNode', this.node).destroyAllChildren();
						let card = SZModel.getHandChairCardByIndex(SZModel.getMyChairID(), 2);
						if (!!card) {
							let params = {
								parent: cc.find('CuopaiNode', this.node),
								bundle: Enums.bundleType.SZ,
								path: 'res/prefab/SZCuoPai',
								card: card,
								cards: SZModel.getHandCardsByChairID(SZModel.getMyChairID()),
								type: SZLogic.getCardColor(card),
								val: SZLogic.getCardNumber(card),
								cb: () => {
									let cardLogic = this.getCardsNodeByChairID(SZModel.getMyChairID()).getComponent('SZCards');
									cardLogic.sendCards();
									cardLogic.showType(true);
									cardLogic.updateStateSprite();
								},
							};
							AssetsManager.createDialog(params);
						}
					}
				}
			} else if (msg.type === ApiSz.GAME_END_PUSH) {
				UserModel.setData('roomID', '');
				if (msg.data.result.length > 0) {
					msg.data.enterHall = this.enterHall.bind(this);
					msg.data.path = 'res/prefab/SZResult';
					msg.data.bundle = Enums.bundleType.SZ;
					AssetsManager.createDialog(msg.data);
				} else {
					this.enterHall();
				}
			} else if (msg.type === ApiSz.GAME_TURN_PUSH) {
				if (msg.data.curChairID == SZModel.getMyChairID()) {
					let userStatus = SZModel.getUserStatusByChairID(SZModel.getMyChairID());
					// console.log('我的状态', userStatus);
					if (userStatus != ApiSz.userStatus.LOOK) {
						let men = SZModel.getGameRule().gameFrameType;
						this.lookCardsButton.active = men < SZModel.getCurRound();
					}
				} else {
					cc.find('CuopaiNode', this.node).destroyAllChildren();
					this.lookCardsButton.active = false;
				}
			} else if (msg.type === ApiSz.GAME_TRUST_PUSH) {
				if (msg.data.chairID == SZModel.getMyChairID()) {
					cc.find('Tuoguan', this.node).active = msg.data.trust;
				}
			} else if (msg.type === ApiSz.GAME_REVIEW_PUSH) {
				if (msg.data.list.length != 0) {
					msg.data.path = 'res/prefab/SZReview';
					msg.data.bundle = Enums.bundleType.SZ;
					AssetsManager.createDialog(msg.data);
				} else {
					AssetsManager.tipDialog('没有数据');
				}
			} else if (msg.type === ApiSz.GAME_RESULT_PUSH) {
				cc.find('CuopaiNode', this.node).destroyAllChildren();
			} else if (msg.type === ApiSz.GAME_SEND_CARDS_PUSH) {
				this.showTestCard()
			} else if (msg.type === ApiSz.GAME_ABANDON_PUSH) {
				if (msg.data.chairID == SZModel.getMyChairID()) {
					cc.find('CuopaiNode', this.node).destroyAllChildren();
				}
			}
		} else if (route === 'ReconnectSuccess') {
			this.onReconnectCheck();
		} else if (route == 'UpdateGameBg') { } else if (route === 'SelfEntryRoomPush') {
			if (msg.gameType != SZModel.getBundleType()) {
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

	onEventShow() {
		this.onReconnectCheck();
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

	onReconnectCheck() {
		if (UserModel.isInRoom()) {
			ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
		} else {
			this.enterHall();
		}
	},

	verifyZuobi(roomUserInfo) {
		if (!SZModel.getGameRuleByKey('fangzuobi')) {
			return;
		}
		if (roomUserInfo.chairID >= SZModel.getGameRule().chairCount) {
			return;
		}
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
		for (let i = 0; i < SZModel.getChairCount(); ++i) {
			let user = SZModel.getUserByChairID(i);
			if (!user || user.chairID == roomUserInfo.chairID) {
				continue;
			}
			// if (user.userInfo.lastLoginIP == roomUserInfo.userInfo.lastLoginIP) {
			// 	AssetsManager.popDialog({
			// 		content: `玩家${roomUserInfo.userInfo.nickname}与玩家${user.userInfo.nickname}IP地址相同！`,
			// 		ok: () => {}
			// 	});
			// 	break;
			// }
			let add2 = null;
			try {
				add2 = JSON.parse(user.userInfo.address);
			} catch (e) { }
			if (!add2) {
				continue;
			}
			// let distance = Utils.getDistanceByLocation(add1, add2);
			// if (distance < 0.1) {
			// 	AssetsManager.popDialog({
			// 		content: `玩家${roomUserInfo.userInfo.nickname}与玩家${user.userInfo.nickname}距离过近！`,
			// 		ok: () => {},
			// 		no: () => {}
			// 	});
			// 	break;
			// }
		}
	},

	/*
	 * 显示玩家头像
	 */
	showHeadNode(chairID) {
		/* this.getHeadNodeByChairID(chairID).active = true; */
	},

	/*
	 * 隐藏玩家头像
	 */
	hideHeadNode(data) {
		// console.log('玩家退出', data)
		if (data.uid == UserModel.getData('uid')) {
			if (!SZModel.getRoomID() ||
				data.roomID === SZModel.getRoomID()) {
				this.enterHall();
			}
		}
	},

	/*
	 * 根据chairid获取头像节点
	 * @param chairID 椅子id
	 */
	getHeadNodeByChairID(chairID) {
		let chairNode = null;
		for (let chair of this._chairCtrl) {
			if (!chair) continue;
			if (chair.getChairID() == chairID) {
				chairNode = chair.node;
				break;
			}
		}
		return chairNode;
	},

	/*
	 * 根据chairid获取手牌节点
	 * @param chairID 椅子id
	 */
	getCardsNodeByChairID(chairID) {
		let cardsNode = null;
		for (let cards of this._cardsCtrl) {
			if (!cards) continue;
			if (cards.getChairID() == chairID) {
				cardsNode = cards.node;
				break;
			}
		}
		return cardsNode;
	},

	/*
	 * 玩家准备推送
	 */
	userReadyPush(chairID) {
		if (chairID == SZModel.getMyChairID()) {
			this.readyButton.active = false;
		}
	},

	onReadyClick(event, param) {

		ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify(true));
		this.readyButton.active = false;
	},

	onLookCards(event, param) {
		ApiRoom.gameMessageNotify(ApiSz.gameLookCardsNotify());
		this.lookCardsButton.active = false;
	},

	onDisClick(event, param) {
		this._onMenuCloseClick();
		if (SZModel.isDismissing()) return;
		let params = {
			content: '是否确定发出解散申请？',
			ok: () => {
				ApiRoom.roomMessageNotify(ApiRoom.getAskForDismissNotifyData({
					isExit: true
				}));
			},
			no: () => { }
		}
		AssetsManager.popDialog(params);
	},

	onExitClick(event, param) {
		this._onMenuCloseClick();
		if (!UserModel.isInRoom()) {
			this.enterHall();
			return;
		}
		if (SZModel.getMyChairID() < SZModel.getChairCount() && !!SZModel.getGameStarted()) {
			AssetsManager.tipDialog('游戏进行中，不能退出游戏！')
			return;
		}
		ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
	},

	onDestroy() {
		this.handlerRelease();
		SZModel.onDestroy();
		ConfigModel.setData('lastScene', 'sz');
		AssetsManager.release();
	},

	enterHall() {
		let roomCreatorInfo = SZModel.getRoomCreator();
		let isUnionCreate = roomCreatorInfo.creatorType == Enums.roomCreatorType.UNION_CREATE;
		let unionID = !!isUnionCreate ? roomCreatorInfo.unionID : null;
		SubManager.exitBundle(unionID);
	},

	showDissButton() {
		let user = SZModel.getUserByChairID(SZModel.getMyChairID());
		this.btnDismiss.active = SZModel.getCurBureau() > 0 && user.chairID < SZModel.getChairCount() && !SZModel.getGameRuleByKey('canNotDissmiss');
		this.btnExit.active = SZModel.getCurBureau() == 0 || user.chairID >= SZModel.getChairCount();
	},

	showSettingBg() {
		if (!this.menuLay) return;
		AssetsManager.loadSpriteFrame({
			path: 'sprite/common/pull',
			sprite: this.menuBtnSprite
		});
	},

	onLookOnClick() {
		this._onMenuCloseClick();
		let users = SZModel.getLookOnUsers();
		if (users.length == 0) {
			AssetsManager.tipDialog('暂无观战玩家！');
			return;
		}
		AssetsManager.standDialog({
			users: users
		});
	},


	onSettingClick() {
		this._onMenuCloseClick();
		AssetsManager.setDialog({
			type: 'duoren',
			gameType: Enums.bundleType.SZ,
			musicType: Enums.bundleType.CIRCLE,
		});
	},

	onRuleClick() {
		this._onMenuCloseClick();
		let node = cc.find('RoomInfo', this.node);
		if (CCUtil.clickInterval(node, 0.5)) return;
		AssetsManager.tableDialog({
			gameRule: SZModel.getGameRule(),
		});
	},

	onTrustClick() {
		this._onMenuCloseClick();
		ApiRoom.gameMessageNotify(ApiSz.gameTrushNotify(true));
	},

	onCancelTuoguan() {
		ApiRoom.gameMessageNotify(ApiSz.gameTrushNotify(false));
	},

	onCopyRoomID() {
		let str = ConfigModel.getRoomShare(Enums.bundleType.SZ, SZModel.getRoomID());
		NativeUtil.copyText(str);
	},

	onInviteFriend() {
		let gameRule = SZModel.getGameRule();
		gameRule = gameRule || {};
		let roomId = SZModel.getRoomID();
		gameRule.roomId = roomId;
		let share = ConfigModel.getRoomRuleShare(gameRule);
		NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
	},

	onReview() {
		this._onMenuCloseClick();
		ApiRoom.gameMessageNotify(ApiSz.gameReviewNotify());
	},

	getHeadInSeat() {
		let players = {
			node: [],
			cid: []
		}
		for (let comp of this._chairCtrl) {
			if (!comp || !comp.node || !comp.node.active) continue;
			players.node.push(comp.node);
			players.cid.push(comp.getChairID());
		}
		return players;
	},

	onGift(fromChairID, toChairID, giftID) {
		let sender = this.getHeadNodeByChairID(fromChairID);
		let reciever = [],
			rids = [];
		if (fromChairID == toChairID) {
			let players = this.getHeadInSeat();
			reciever = players.node;
			rids = players.cid;
		} else {
			reciever.push(this.getHeadNodeByChairID(toChairID));
			rids.push(toChairID);
		}
		AssetsManager.addGift({
			sid: fromChairID,
			rids: rids,
			reciever: reciever,
			sender: sender,
			id: giftID,
			parent: this.node
		});
	},

	update(dt) {
		if (this._lastPlayTime != null) {
			if (Date.now() > this._lastPlayTime + 200) {
				this.onPlayerOver();
				this._lastPlayTime = null;
			}
		}
	},

	onPlayerOver() {
		//console.log("onPlayCallback:" + this._playingSeat);
		this._playingSeat.getComponent("SZHead").setVoice(false);
		this._playingSeat = null;
	},

	onRefrush(event) {
		this._onMenuCloseClick();
		if (CCUtil.clickInterval(event.target, 10, true)) return;
		AssetsManager.tipDialog('刷新界面可以修复游戏显示问题');
		this.messageCallbackHandler('ReconnectSuccess');
	},

	seatsInit() {
		this._chairCtrl = [];
		this._cardsCtrl = [];
		let chairCount = SZModel.getGameRule().maxPlayerCount;
		let choosedArray = [0, 1, 2, 4, 5, 6, 8, 9];
		if (chairCount == 6) {
			choosedArray = [0, 1, 2, 5, 8, 9];
		} else if (chairCount == 10) {
			choosedArray = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
		}

		for (let index = 0; index < 10; index++) {
			if (choosedArray.indexOf(index) == -1) {

				this.headsCtrl[index].node.active = false;
				this.cardsCtrl[index].node.active = false;
			} else {
				// console.log(this.headsCtrl[index], index, '123321');
				this.headsCtrl[index].node.active = true;
				this.cardsCtrl[index].node.active = true;
				this._chairCtrl.push(this.headsCtrl[index]);
				this._cardsCtrl.push(this.cardsCtrl[index]);
			}
		}
		for (let index = 0; index < this._chairCtrl.length; index++) {
			this._chairCtrl[index].bind({
				index: index,
				comp: this
			});
			this.addHeadClickEvent(this._chairCtrl[index]);
			this._cardsCtrl[index].bind(index);
		}
	},

	/**给没座位的人显示坐下按钮 */
	showSitDownButton() {
		let curBureau = SZModel.getCurBureau();
		let maxBureau = SZModel.getMaxBureau();
		let canEnter = SZModel.getGameRuleByKey('canEnter') && maxBureau != curBureau;
		// (!!canEnter || curBureau == 0) &&
		this.btnSitDown.active = SZModel.getMyChairID() >= SZModel.getChairCount() &&
			(!!canEnter || curBureau == 0) &&
			SZModel.checkHaveEmptySeat();
	},

	/**坐下按钮响应 */
	onBtnSitDown() {
		/**检查是否还有空位，有就发送坐下命令 */
		let chairID = SZModel.getCanSitDownChairID();
		if (chairID == -1 || !this._chairCtrl[chairID]) {
			AssetsManager.tipDialog('没有座位可以坐下！');
			return;
		}
		let chair = this._chairCtrl[chairID];
		if (!chair) return;
		chair.onSeatClick();
	},

	onLocationClick() {
		this._onMenuCloseClick();
		AssetsManager.locationDialog({
			users: SZModel.getPlayerTakeSeats(),
			chairCount: SZModel.getChairCount(),
			fangzuobi: SZModel.getGameRuleByKey('fangzuobi')
		})
	},

	onChatClick() {
		let params = {
			gameRule: SZModel.getGameRule(),
			chat: (chat) => {
				ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
			}
		}
		AssetsManager.chatDialog(params);
	},


	onBtnTest() {
		let jushu = SZModel.getCurBureau()
		if (!SZModel.isInSeat() || jushu <= 0) {
			return
		}
		AssetsManager.createDialog({
			bundle: Enums.bundleType.SZ,
			path: "res/prefab/SZTest",
			mainDialog: this
		})
	},

	showTestCard() {
		if (!UserModel.getData("isTest")) return;
		ApiRoom.gameMessageNotify(ApiSz.gameLookCardsTestNotify(SZModel.getMyChairID()));
	},

	// 邀请好友
	onShowInvite() {
		this._onMenuCloseClick();
		AssetsManager.friendDialog({
			gameRule: SZModel.getGameRule(),
		})
	},

	_onMenuOpen() {
		this.menuLay.active = true;
		this.menuLayList.stopAllActions()
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



		this.showDissButton()
		this.showSettingBg()

	},

	_onMenuCloseClick() {
		this.menuLay.active = false;
	},


	btnClicks(event, param) {

		switch (param) {
			case 'menu':
				this._onMenuOpen();
				break;
			case 'menuclose':
				this._onMenuCloseClick();
				break;
			case "btn_back":
				this.enterHall()
				break;
		}
	},




});