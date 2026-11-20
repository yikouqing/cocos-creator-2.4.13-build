const SGBJHModel = require('./SGBJHModel');
const ApiSgbjh = require('./ApiSgbjh');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiHall = require('../../../src/api/ApiHall');
const UserModel = require('../../../src/model/UserModel');
const SGBJHLogic = require('./SGBJHLogic');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AudioUtil = require('../../../src/utils/AudioUtil');
const Utils = require('../../../src/utils/Utils');
const SubManager = require('../../../src/utils/SubManager');
const Codes = require('../../../src/const/Codes');
const ConfigModel = require('../../../src/model/ConfigModel');
const CCUtil = require('../../../src/utils/CCUtil');
const Events = require('../../../src/const/Events');

cc.Class({
	extends: cc.Component,
	properties: {
		readyButton: cc.Node,
		showCardsButton: cc.Node,
		roomIdLabel: cc.Label,
		txt_gameName: cc.Label,
		bureauLabel: cc.Label,
		btn_zuoxia: cc.Node,
		btnLocation: cc.Node,
		btnLookOn: cc.Node,
		lookOnMark: cc.Node,
		menuLay: cc.Node,
		menuSprite: cc.Sprite,
		menuLayList: cc.Node,
		btnTest: cc.Node,
		btnBackHall: cc.Node,
		btnYuYin: cc.Node,
		btnDismiss: cc.Node,
		btnExit: cc.Node,
		canNotDismissBar: cc.Node,

		_headsCtl: [],
		_cardsCtrl: [],
	},

	onLoad() {
		AssetsManager.init(this.node);
		this.headNodeArray = [];
		this.cardsNodeArray = [];
		// 菜单点击
		this.menuLay.active = false
		SGBJHModel.init(); /* 保存数据 */
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
		MessageCallback.addListener('OnGameOnceAgain', this);
		MessageCallback.addListener('TestClickReq', this)
		this._playingSeat = null;
		this._voiceMsgQueue = [];
		this._lastPlayTime = null;
		/* 获取场景 */
		this.scheduleOnce(function () {
			// console.log("是否在房间中==", UserModel.isInRoom())
			if (!UserModel.isInRoom()) {
				AssetsManager.tipDialog("房间不存在")
				this.scheduleOnce(() => {
					this.enterHall()
				}, 0.5)
			} else {
				ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
			}
		}, 0.2);
	},

	/*
	 * 游戏初始化
	 * 断线重连
	 */
	gameInit(data) {
		this.unscheduleAllCallbacks();
		this.setHeadAndCard();
		this.roomIdLabel.string = '房号:' + SGBJHModel.getRoomID();
		this.bureauLabel.string = '局数:' + SGBJHModel.getCurBureau() + '/' + SGBJHModel.getMaxBureau();
		let gameName = ConfigModel.getBundleConfig(data.gameRule.gameType)
		this.txt_gameName.string = `游戏:${gameName.name}`
		let user = SGBJHModel.getUserByChairID(SGBJHModel.getMyChairID());
		if (user) {
			if (SGBJHModel.getGameStatus() == ApiSgbjh.gameStatus.NONE &&
				user.userStatus != ApiRoom.userStatusEnum.READY &&
				user.userStatus != ApiRoom.userStatusEnum.PLAYING &&
				user.userStatus != ApiRoom.userStatusEnum.LOOK &&
				SGBJHModel.getCurBureau() < SGBJHModel.getMaxBureau() &&
				SGBJHModel.getMyChairID() < SGBJHModel.getChairCount()) {
				this.readyButton.active = true;
			} else {
				this.readyButton.active = false;
			}
			this.showCardsButton.active = false;
			cc.find('cuopai', this.node).active = false;
			if (SGBJHModel.getGameStatus() == ApiSgbjh.gameStatus.SHOW_CARDS) {
				if (!SGBJHModel.getShowCards(SGBJHModel.getMyChairID()) && SGBJHModel.getIsPlayingByChairID(SGBJHModel.getMyChairID())) {
					this.showCardsButton.active = true;
					/* TODO 服务器数据修改
					cc.find('cuopai', this.node).active = SGBJHModel.getGameRule().cuopai; */
				}
			}
		}
		/* cc.find('TrustLabel', this.node).active = SGBJHModel.getTrustByChairID(SGBJHModel.getMyChairID()); */
		cc.find('Tuoguan', this.node).active = SGBJHModel.getTrustByChairID(SGBJHModel.getMyChairID());
		this.onTuoGuanSwitch();
		/* cc.find('Setting/Layout/TuoButton', this.node).active = SGBJHModel.getGameRule().canTrust; */
		let unionID = SGBJHModel.isUnionCreate() ? SGBJHModel.getRoomCreatorByKey('unionID') : null;
		let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
		cc.find('copy', this.node).active = SGBJHModel.getCurBureau() == 0 && !!isShowInvite;
		cc.find('invite', this.node).active = SGBJHModel.getCurBureau() == 0 && !!isShowInvite;
		cc.find('backhall', this.node).active = false //(SGBJHModel.getCurBureau() == 0);
		this.btnBackHall.active = SGBJHModel.getCurBureau() == 0 && SGBJHModel.isUnionCreate();
		this._yuYinShow();
		this.btnLookOn.active = !!SGBJHModel.getGameRuleByKey('canWatch');
		this.btnLocation.active = SGBJHModel.getGameRuleByKey('maxPlayerCount') < 6 && !!SGBJHModel.getGameRuleByKey('showGps');
		this.btnTest.active = SGBJHModel.getGameRuleByKey('test');
		this.btnDismiss.active = SGBJHModel.getGameRuleByKey('canDismiss');;
		if (this.canNotDismissBar) this.canNotDismissBar.active = SGBJHModel.getGameRuleByKey("canNotDissmiss");
		this.verifyZuobi(user);
		this.showTest();
		this.showSitDownButton();
	},

	_yuYinShow() {
		let isInSeat = SGBJHModel.isInSeat();
		let yuyin = SGBJHModel.getGameRuleByKey('yuyin');
		this.btnYuYin.active = !!isInSeat && !!yuyin && ConfigModel.getData('voiceSpeaker');
	},

	onTuoGuanSwitch() {
		let user = SGBJHModel.getUserByChairID(SGBJHModel.getMyChairID());
		if (SGBJHModel.getMyChairID() >= SGBJHModel.getChairCount()) {
			this.lookOnMark.active = user && user.userStatus == ApiRoom.userStatusEnum.LOOK;
		} else {
			this.lookOnMark.active = user && user.userStatus == ApiRoom.userStatusEnum.LOOK;
		}
	},

	verifyZuobi(roomUserInfo) {
		if (!SGBJHModel.getGameRuleByKey('fangzuobi')) return;
		if (!roomUserInfo || roomUserInfo.chairID >= SGBJHModel.getChairCount()) return;
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
		for (let i = 0; i < SGBJHModel.getChairCount(); ++i) {
			let user = SGBJHModel.getUserByChairID(i);
			if (!user || user.chairID == roomUserInfo.chairID) continue;
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

	addHeadClickEvent(node) {
		if (node.hasEventListener(cc.Node.EventType.TOUCH_START)) return;
		node.on(cc.Node.EventType.TOUCH_START, () => {
			if (SGBJHModel.getMyChairID() >= SGBJHModel.getChairCount()) {
				AssetsManager.tipDialog('观战玩家无法查看详细信息');
				return;
			}
			if (CCUtil.clickInterval(node, 0.5)) return;
			let logic = node.getComponent('SGBJHHead');
			let user = SGBJHModel.getUserByChairID(logic.getChairID());

			// console.log("user", user)
			let showHeadDetail = () => {
				try {
					let params = {
						fromChairID: SGBJHModel.getMyChairID(),
						toChairID: logic.getChairID(),
						canSendGift: SGBJHModel.getMyChairID() < SGBJHModel.getChairCount(),
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
			if (!!SGBJHModel.getUserTest() && !!user && !!user.userInfo.uid && !SGBJHModel.isInWatch()) {
				AssetsManager.createDialog({
					user: user,
					callback: showHeadDetail,
					bundle: Enums.bundleType.SGBJH,
					path: "res/prefab/SGBJHTestSelect",
				})
				return
			} else {
				showHeadDetail();
			}

		}, this);
	},

	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.gameInit(msg.data);
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_RESPONSE) {
				if (msg.data.chairID === SGBJHModel.getMyChairID()) { }
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				this.showHeadNode(msg.data.roomUserInfo.chairID);
				this.verifyZuobi(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				this.hideHeadNode(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				this.userReadyPush(msg.data.chairID);
			} else if (msg.type === ApiRoom.GAME_END_PUSH) { } else if (msg.type === ApiRoom.ROOM_DISMISS_PUSH) { } else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
				msg.data.myChairID = SGBJHModel.getMyChairID();
				AssetsManager.nisDialog(msg.data);
			} else if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
				if (msg.data.code != 0) {
					if (msg.data.uid == UserModel.getData('uid')) {
						AssetsManager.tipDialog(Codes[msg.data.code]);
					}
					return;
				};
				let user = SGBJHModel.getUserByChairID(SGBJHModel.getMyChairID());
				if (SGBJHModel.getGameStatus() == ApiSgbjh.gameStatus.NONE &&
					user.userStatus != ApiRoom.userStatusEnum.READY &&
					user.userStatus != ApiRoom.userStatusEnum.PLAYING &&
					user.userStatus != ApiRoom.userStatusEnum.LOOK &&
					SGBJHModel.getCurBureau() < SGBJHModel.getMaxBureau() &&
					SGBJHModel.getMyChairID() < SGBJHModel.getChairCount()) {
					this.readyButton.active = true;
				} else {
					this.readyButton.active = false;
				}
				this.onTuoGuanSwitch();
				this.showSitDownButton()
				if (user &&
					user.userStatus == ApiRoom.userStatusEnum.LOOK &&
					msg.data.fromChairID < SGBJHModel.getChairCount() &&
					msg.data.toChairID >= SGBJHModel.getChairCount()) {
					SGBJHModel.pourScore(msg.data.fromChairID, 0);
				}
			} else if (msg.type === ApiRoom.USER_CHAT_PUSH) {
				this.onChat(msg.data);
			} else if (msg.type === ApiRoom.USER_GIFT_SEND_PUSH) {
				this.onGift(msg.data.fromChairID, msg.data.toChairID, msg.data.giftID);
			} else if (msg.type === ApiRoom.USER_VOICE_PUSH) {
				this._voiceMsgQueue.push(msg.data);
			} else if (msg.type === ApiRoom.BE_SHORT_OF_GOLD_COINS_PUSH) {
				if (msg.data.uid == UserModel.getData('uid')) {
					AssetsManager.tipDialog('金币不足，不可加入！');
				}
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiSgbjh.GAME_BUREAU_PUSH) {
				this.btnBackHall.active = false;
				this._yuYinShow();
				this.bureauLabel.string = '局数：' + SGBJHModel.getCurBureau() + '/' + SGBJHModel.getMaxBureau();
				let unionID = SGBJHModel.isUnionCreate() ? SGBJHModel.getRoomCreatorByKey('unionID') : null;
				let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
				cc.find('copy', this.node).active = SGBJHModel.getCurBureau() == 0 && !!isShowInvite;
				cc.find('invite', this.node).active = SGBJHModel.getCurBureau() == 0 && !!isShowInvite;
				// cc.find('backhall', this.node).active = (SGBJHModel.getCurBureau() == 0);
			} else if (msg.type === ApiSgbjh.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus == ApiSgbjh.gameStatus.NONE) {
					this.onTuoGuanSwitch();
				}
				this._yuYinShow();
				if (msg.data.gameStatus == ApiSgbjh.gameStatus.SHOW_CARDS) {
					this.showCardsButton.active = SGBJHModel.getIsPlayingByChairID(SGBJHModel.getMyChairID());
					cc.find('cuopai', this.node).active = SGBJHModel.getIsPlayingByChairID(SGBJHModel.getMyChairID()) && SGBJHModel.getGameRule().cuopai;
				} else {
					this.showCardsButton.active = false;
					cc.find('cuopai', this.node).active = false;
				}
				let user = SGBJHModel.getUserByChairID(SGBJHModel.getMyChairID());
				if (SGBJHModel.getGameStatus() == ApiSgbjh.gameStatus.NONE &&
					user.userStatus != ApiRoom.userStatusEnum.READY &&
					user.userStatus != ApiRoom.userStatusEnum.PLAYING &&
					user.userStatus != ApiRoom.userStatusEnum.LOOK &&
					SGBJHModel.getCurBureau() < SGBJHModel.getMaxBureau() &&
					SGBJHModel.getMyChairID() < SGBJHModel.getChairCount()) {
					this.readyButton.active = true;
				} else {
					this.readyButton.active = false;
				}
				// if (SGBJHModel.getMaxBureau() == "自由局" && SGBJHModel.getMyChairID() != SGBJHModel.getBankerChairID() && msg.data.gameStatus == ApiSgbjh.gameStatus.NONE && SGBJHModel.getMyChairID() < SGBJHModel.getChairCount()) {
				// 	cc.find('backhall', this.node).active = true;
				// } else {
				// 	cc.find('backhall', this.node).active = false;
				// }
			} else if (msg.type === ApiSgbjh.GAME_SHOW_CARDS_PUSH) {
				if (msg.data.chairID == SGBJHModel.getMyChairID()) {
					if (msg.data.cuopai) {
						this.showCardsButton.active = true;
						cc.find('cuopai', this.node).active = true;
					} else {
						this.showCardsButton.active = false;
						cc.find('cuopai', this.node).active = false;
					}
				}
			} else if (msg.type === ApiSgbjh.GAME_END_PUSH) {
				UserModel.setData('roomID', '');
				if (msg.data.result.length > 0) {
					msg.data.enterHall = this.enterHall.bind(this);
					msg.data.path = 'res/prefab/SGBJHResult';
					msg.data.bundle = Enums.bundleType.SGBJH;
					AssetsManager.createDialog(msg.data);
				} else {
					this.enterHall();
				}
			} else if (msg.type === ApiSgbjh.GAME_TRUST_PUSH) {
				if (msg.data.chairID == SGBJHModel.getMyChairID()) {
					/* cc.find('TrustLabel', this.node).active = msg.data.trust; */
					cc.find('Tuoguan', this.node).active = msg.data.trust;
				}
			} else if (msg.type === ApiSgbjh.GAME_REVIEW_PUSH) {
				if (msg.data.list.length != 0) {
					msg.data.path = 'res/prefab/SGBJHReview';
					msg.data.bundle = Enums.bundleType.SGBJH;
					AssetsManager.createDialog(msg.data);
				} else {
					AssetsManager.tipDialog('没有数据');
				}
			} else if (msg.type === ApiSgbjh.GAME_RESULT_PUSH) {
				cc.find('CuopaiNode', this.node).destroyAllChildren();
			} else if (msg.type === ApiSgbjh.GAME_SEND_CARDS_PUSH) {
				this.showTestCard()
			}
		} else if (route === 'ReconnectSuccess') {
			// console.log('断线重连=====================');
			this.onReconnectCheck();
		} else if (route == 'UpdateGameBg') { } else if (route === 'SelfEntryRoomPush') {
			if (msg.gameType != SGBJHModel.getBundleType()) {
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

	/*
	 * 显示玩家头像
	 */
	showHeadNode() {
		/* this.getHeadNodeByChairID(chairID).active = true; */
	},

	/*
	 * 隐藏玩家头像
	 */
	hideHeadNode(data) {
		if (data.uid == UserModel.getData('uid')) {
			if (!SGBJHModel.getRoomID() ||
				data.roomID === SGBJHModel.getRoomID()) {
				this.enterHall();
			}
		}
	},

	/*
	 * 根据chairid获取头像节点
	 * @param chairID 椅子id
	 */
	getHeadNodeByChairID(chairID) {
		let headNode = null;
		for (let node of this.headNodeArray) {
			if (node.getComponent('SGBJHHead').getChairID() == chairID) {
				headNode = node;
				break;
			}
		}
		return headNode;
	},

	/*
	 * 根据chairid获取手牌节点
	 * @param chairID 椅子id
	 */
	getCardsNodeByChairID(chairID) {
		let chairCount = SGBJHModel.getChairCount();
		let index = (chairID + chairCount - SGBJHModel.getMyChairID()) % chairCount;
		return this.cardsNodeArray[index];
	},

	/*
	 * 玩家准备推送
	 */
	userReadyPush(chairID) {
		if (chairID == SGBJHModel.getMyChairID()) {
			this.readyButton.active = false;
		}
	},

	onReadyClick() {

		ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify(true));
		this.readyButton.active = false;
	},

	onShowCardsClick(event, param) {

		if (param == 0) {
			ApiRoom.gameMessageNotify(ApiSgbjh.gameShowCardsNotify());
		} else {
			let card = SGBJHModel.getHandChairCardByIndex(SGBJHModel.getMyChairID(), 2);
			if (!!card) {
				cc.find('CuopaiNode', this.node).destroyAllChildren();
				let params = {
					parent: cc.find('CuopaiNode', this.node),
					card: card,
					cards: SGBJHModel.getHandCardsByChairID(SGBJHModel.getMyChairID()),
					type: SGBJHLogic.getCardColor(card),
					val: SGBJHLogic.getCardNumber(card),
					cb: () => {
						ApiRoom.gameMessageNotify(ApiSgbjh.gameShowCardsNotify());
					},
				};
				AssetsManager.rubDialog(params);
			}
		}
		cc.find('cuopai', this.node).active = false;
		this.showCardsButton.active = false;
	},

	onExitClick(event, param) {
		this._onMenuCloseClick();
		if (!UserModel.isInRoom()) {
			this.enterHall();
			return;
		}
		if (!!SGBJHModel.getGameStarted() && SGBJHModel.getMyChairID() < SGBJHModel.getChairCount()) {
			AssetsManager.tipDialog('游戏进行中，不能退出房间！');
			return;
		}
		ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
	},

	onDisClick(event, param) {
		this._onMenuCloseClick();
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

	onDestroy() {
		SGBJHModel.onDestroy();
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
		ConfigModel.setData('lastScene', 'sgbjh');
	},

	enterHall() {
		let roomCreatorInfo = SGBJHModel.getRoomCreator();
		let isUnionCreate = roomCreatorInfo.creatorType == Enums.roomCreatorType.UNION_CREATE;
		let unionID = !!isUnionCreate ? roomCreatorInfo.unionID : null;
		SubManager.exitBundle(unionID);
	},

	showDissButton() {
		let user = SGBJHModel.getUserByChairID(SGBJHModel.getMyChairID());
		this.btnDismiss.active = SGBJHModel.getCurBureau() > 0 && user.chairID < SGBJHModel.getChairCount() && !SGBJHModel.getGameRuleByKey('canNotDissmiss');
		this.btnExit.active = SGBJHModel.getCurBureau() == 0 || user.chairID >= SGBJHModel.getChairCount();
	},

	showSettingBg() {
		this.menuLay.active = true;
		AssetsManager.loadSpriteFrame({
			path: 'sprite/common/pull',
			sprite: this.menuSprite
		});
	},

	onLookOnClick() {
		this._onMenuCloseClick();
		let users = SGBJHModel.getLookOnUsers();
		if (users.length == 0) {
			AssetsManager.tipDialog('暂无观战玩家！');
			return;
		}
		AssetsManager.standDialog({
			users: users
		});
	},

	onSwitchClick() {
		this.showDissButton();
		this.showSettingBg();
	},

	onSettingClick() {
		this._onMenuCloseClick();
		AssetsManager.setDialog({
			type: 'duoren',
			gameType: Enums.bundleType.SGBJH,
			musicType: Enums.bundleType.CIRCLE,
		});
	},

	onRuleClick() {
		this._onMenuCloseClick()
		let node = cc.find('RoomInfo', this.node);
		if (CCUtil.clickInterval(node, 0.5)) return;
		AssetsManager.tableDialog({
			gameRule: SGBJHModel.getGameRule(),
		});
	},

	onTrustClick() {
		this._onMenuCloseClick();
		ApiRoom.gameMessageNotify(ApiSgbjh.gameTrushNotify(true));
	},

	onCancelTuoguan() {

		ApiRoom.gameMessageNotify(ApiSgbjh.gameTrushNotify(false));
	},

	onCopyRoomID() {

		let str = ConfigModel.getRoomShare(Enums.bundleType.SGBJH, SGBJHModel.getRoomID());
		NativeUtil.copyText(str);
	},

	onInviteFriend() {
		let gameRule = SGBJHModel.getGameRule();
		gameRule = gameRule || {};
		let roomId = SGBJHModel.getRoomID();
		gameRule.roomId = roomId;
		let share = ConfigModel.getRoomRuleShare(gameRule);
		// console.log('测试-分享', share);
		NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
	},

	onReview() {
		this._onMenuCloseClick();
		ApiRoom.gameMessageNotify(ApiSgbjh.gameReviewNotify());
	},

	onChat(data) {
		let idx = SGBJHModel.getUserChairIndex(data.chairID)
		let com = this.headNodeArray[idx].getComponent("SGBJHHead");
		if (!com) return;
		com.gameChat(data)
	},

	getHeadInSeat() {
		let players = {
			node: [],
			cid: []
		}
		for (let node of this.headNodeArray) {
			//节点显示则为有人
			if (!node.active) continue;
			if (!node.getComponent('SGBJHHead')) continue;
			players.node.push(node);
			players.cid.push(node.getComponent('SGBJHHead').getChairID());
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

	update() {
		if (this._lastPlayTime != null) {
			if (Date.now() > this._lastPlayTime + 200) {
				this.onPlayerOver();
				this._lastPlayTime = null;
			}
		}
	},

	onPlayerOver() {
		//console.log("onPlayCallback:" + this._playingSeat);
		this._playingSeat.getComponent("SGBJHHead").setVoice(false);
		this._playingSeat = null;
	},

	onRefrush(event) {
		this._onMenuCloseClick();
		if (CCUtil.clickInterval(event.target, 10, true)) return;
		AssetsManager.tipDialog('刷新界面可以修复游戏显示问题');

		// console.clash("sangong-onRefrush", SGBJHModel.getRoomData());
		this.messageCallbackHandler('ReconnectSuccess');
	},

	setHeadAndCard() {
		this.headNodeArray = [];
		this.cardsNodeArray = [];
		let chairCount = SGBJHModel.getGameRule().maxPlayerCount;
		let choosedArray = [1, 2, 3, 4, 6, 8, 9, 10];
		if (chairCount == 6) {
			choosedArray = [1, 2, 3, 6, 9, 10];
		} else if (chairCount == 10) {
			choosedArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
		}
		for (let i = 1; i <= 10; ++i) {
			let headNode = this.node.getChildByName('Head' + i);
			let cardsNode = this.node.getChildByName('Cards' + i);
			if (!headNode || !cardsNode) continue;
			headNode.active = false;
			cardsNode.active = false;
			if (choosedArray.indexOf(i) != -1) {
				this.headNodeArray.push(headNode);
				this.cardsNodeArray.push(cardsNode);
			}
		}
		for (let index = 0; index < this.headNodeArray.length; index++) {
			this.headNodeArray[index].getComponent('SGBJHHead').setIndex(index);
			this.cardsNodeArray[index].getComponent('SGBJHCards').setIndex(index);
			this.addHeadClickEvent(this.headNodeArray[index]);
		}
	},

	onHideMenuClick() {
		this.menuLay.active = false;
		AssetsManager.loadSpriteFrame({
			path: 'sprite/common/menu',
			sprite: this.menuSprite
		});
	},

	/**给没座位的人显示坐下按钮 */
	showSitDownButton() {
		let curBureau = SGBJHModel.getCurBureau();
		let maxBureau = SGBJHModel.getMaxBureau();
		let canEnter = SGBJHModel.getGameRuleByKey('canEnter') && maxBureau != curBureau;
		// (!!canEnter || curBureau == 0) &&
		this.btn_zuoxia.active = SGBJHModel.getMyChairID() >= SGBJHModel.getChairCount() &&
			(!!canEnter || curBureau == 0) &&
			SGBJHModel.checkHaveEmptySeat();
	},

	/**坐下按钮响应 */
	onBtnSitDown() {
		/**检查是否还有空位，有就发送坐下命令 */
		let chairID = SGBJHModel.getCanSitDownChairID();
		if (chairID == -1 || !this.headNodeArray[chairID]) {
			AssetsManager.tipDialog('没有座位可以坐下！');
			// this.btn_zuoxia.active = false;
			return;
		}
		let head = this.headNodeArray[chairID].getComponent("SGBJHHead");
		if (!head) return;
		// console.log('找到座位坐下', chairID);
		head.onSeatClick();
	},

	onLocationClick() {
		this._onMenuCloseClick()
		AssetsManager.locationDialog({
			users: SGBJHModel.getPlayerTakeSeats(),
			chairCount: SGBJHModel.getChairCount(),
			fangzuobi: SGBJHModel.getGameRuleByKey('fangzuobi')
		})
	},

	onChatClick() {
		let params = {
			gameRule: SGBJHModel.getGameRule(),
			chat: (chat) => {
				ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
			}
		}
		AssetsManager.chatDialog(params);
	},

	onBtnTest() {
		let jushu = SGBJHModel.getCurBureau()
		if (!SGBJHModel.isInSeat() || jushu <= 0) {
			return;
		}
		AssetsManager.createDialog({
			bundle: Enums.bundleType.SGBJH,
			path: "res/prefab/SGBJHtest"
		})
	},

	showTest() {
		let tmp = UserModel.getData("isTest")
		this.btnTest.active = false // !!tmp;
	},

	showTestCard() {
		let tmp = UserModel.getData("isTest")
		if (!tmp) return;
		ApiRoom.gameMessageNotify(ApiSgbjh.gameLookCardsNotify(SGBJHModel.getMyChairID()));
	},
	// 邀请好友
	onShowInvite() {
		AssetsManager.friendDialog({
			gameRule: SGBJHModel.getGameRule(),
		})
	},



	_onMenuOpen() {
		this.menuLayList.active = true
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