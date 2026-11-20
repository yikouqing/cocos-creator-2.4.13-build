const NNWjyModel = require('./NNWjyModel');
const ApiNnWjy = require('./ApiNnWjy');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const UserModel = require('../../../src/model/UserModel');
const ApiHall = require('../../../src/api/ApiHall');
const AudioUtil = require('../../../src/utils/AudioUtil');
const NNWjyLogic = require('./NNWjyLogic');
const Utils = require('../../../src/utils/Utils');
const SubManager = require('../../../src/utils/SubManager');
const Codes = require('../../../src/const/Codes');
const ConfigModel = require('../../../src/model/ConfigModel');
const Events = require('../../../src/const/Events');

cc.Class({
	extends: cc.Component,
	properties: {
		robBankButtons: cc.Node,
		pourScoresButtons: cc.Node,
		zuPaiButton: cc.Node,
		readyButton: cc.Node,
		showCardsButton: cc.Node,
		cuoPaiButton: cc.Node,
		nameLabel: cc.Label,
		roomIdLabel: cc.Label,
		bureauLabel: cc.Label,
		cardGhost: cc.Node,
		btn_zuoxia: cc.Node,
		btnLocation: cc.Node,
		btnLookOn: cc.Node,
		lookOnEffect: cc.Node,
		btnYuYin: cc.Node,
		lookOn: cc.Node,
		btn_tuoguan: cc.Node,
		menuBtnSprite: cc.Sprite,
		menuLay: cc.Node,
		menuLayList: cc.Node,
		btnBackHall: cc.Node,
		btnDismiss: cc.Node,
		btnExit: cc.Node,
		canNotDismissBar: cc.Node,
		baiPaiShow: cc.Node,
		cuoPaiLay: cc.Node,

		_cardGhostPos: cc.Vec2,
		_ghosttDealPos: cc.Vec2,
	},

	onLoad() {
		AssetsManager.init(this.node);
		this.headNodeArray = [];
		this.cardsNodeArray = [];
		// 菜单点击
		this.menuLay.active = false;
		this.nameLabel.string = `游戏:${ConfigModel.getGameName(Enums.bundleType.WJYNN)}`;
		NNWjyModel.init(); /* 保存数据 */
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
		this._playingSeat = null;
		this._voiceMsgQueue = [];
		this._lastPlayTime = null;
		/* 获取场景 */
	},

	start() {
		this.baiPaiShow.active = false;
		this._cardGhostPos = this.cardGhost.getPosition();
		this._ghosttDealPos = CCUtil.postionConvert(this.node, this.cardGhost.parent);
		this.cardGhost.active = false;
		if (!UserModel.isInRoom()) {
			AssetsManager.tipDialog("房间不存在")
			this.scheduleOnce(() => {
				this.enterHall()
			}, 0.5)
		} else {
			ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
		}
	},

	/*
	 * 游戏初始化
	 * 断线重连
	 */
	gameInit() {
		this.unscheduleAllCallbacks();
		this.setHeadAndCard();
		this.roomIdLabel.string = '房号:' + NNWjyModel.getRoomID();
		this.bureauLabel.string = '局数:' + NNWjyModel.getCurBureau() + '/' + NNWjyModel.getMaxBureau();
		let user = NNWjyModel.getUserByChairID(NNWjyModel.getMyChairID());
		if (user) {
			this.readyButton.active = NNWjyModel.getGameStatus() == ApiNnWjy.gameStatus.NONE &&
				user.userStatus != ApiRoom.userStatusEnum.LOOK &&
				user.userStatus != ApiRoom.userStatusEnum.PLAYING &&
				user.userStatus != ApiRoom.userStatusEnum.READY &&
				NNWjyModel.getCurBureau() < NNWjyModel.getMaxBureau() &&
				NNWjyModel.getMyChairID() < NNWjyModel.getChairCount();
			this.showCardsButton.active = false;
			this.cuoPaiButton.active = false;
		}
		cc.find('Tuoguan', this.node).active = NNWjyModel.getTrustByChairID(NNWjyModel.getMyChairID());
		this.onTuoGuanSwitch();
		this.btn_tuoguan.active = NNWjyModel.getGameRuleByKey('canTrust');
		let unionID = NNWjyModel.isUnionCreate() ? NNWjyModel.getRoomCreatorByKey('unionID') : null;
		let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
		cc.find('copy', this.node).active = NNWjyModel.getCurBureau() == 0 && !!isShowInvite;
		cc.find('invite', this.node).active = NNWjyModel.getCurBureau() == 0 && !!isShowInvite;
		// cc.find('backhall', this.node).active = (NNModel.getCurBureau() == 0);
		this.btnLookOn.active = !!NNWjyModel.getGameRuleByKey('canWatch');
		this.btnLocation.active = NNWjyModel.getGameRuleByKey('maxPlayerCount') < 6 && !!NNWjyModel.getGameRuleByKey('showGps');
		this.btnBackHall.active = NNWjyModel.getCurBureau() == 0 && NNWjyModel.isUnionCreate();
		if (this.canNotDismissBar) this.canNotDismissBar.active = NNWjyModel.getGameRuleByKey("canNotDissmiss");
		this._yuYinShow();
		this.verifyZuobi(user);
		this.showTest();
		this.showSitDownButton();
		this.showDissButton();
		this.showTestCard();
		this._showChooseCards();
	},

	_showChooseCards() {
		let gameStatus = NNWjyModel.getGameStatus();
		let myChairID = NNWjyModel.getMyChairID();
		let isInPlaying = NNWjyModel.isInPlaying();
		let cuopai = NNWjyModel.getGameRuleByKey('cuopai');
		let canChoose = NNWjyModel.checkOperateCard(myChairID);
		let hasCuo = NNWjyModel.getShowCards(myChairID);
		if (gameStatus == ApiNnWjy.gameStatus.OPERATE_CARDS
			&& !canChoose
			&& !!isInPlaying) {
			// AssetsManager.createDialog({
			// 	bundle: Enums.bundleType.WJYNN,
			// 	path: "res/prefab/NNWjyChooseCard",
			// });
			this.baiPaiShow.active = false;
			this.zuPaiButton.active = true;
			this.cuoPaiButton.active = !!cuopai && !hasCuo;
		} else {
			this.baiPaiShow.active = false;
			this.zuPaiButton.active = false;
			this.cuoPaiButton.active = false;
		}
	},

	_yuYinShow() {
		let isInSeat = NNWjyModel.isInSeat();
		let yuyin = NNWjyModel.getGameRuleByKey('yuyin');
		this.btnYuYin.active = isInSeat && !!yuyin && ConfigModel.getData('voiceSpeaker');
	},

	onTuoGuanSwitch() {
		let user = NNWjyModel.getUserByChairID(NNWjyModel.getMyChairID());
		this.lookOn.active = (user && user.userStatus == ApiRoom.userStatusEnum.LOOK) || NNWjyModel.getMyChairID() >= NNWjyModel.getChairCount();
	},

	verifyZuobi(roomUserInfo) {
		if (!NNWjyModel.getGameRuleByKey('fangzuobi')) return;
		if (!roomUserInfo || roomUserInfo.chairID >= NNWjyModel.getChairCount()) return;
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
		for (let i = 0; i < NNWjyModel.getChairCount(); ++i) {
			let user = NNWjyModel.getUserByChairID(i);
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
			if (NNWjyModel.getMyChairID() >= NNWjyModel.getChairCount()) {
				AssetsManager.tipDialog('观战玩家无法查看详细信息');
				return;
			}
			if (CCUtil.clickInterval(node, 0.5)) return;
			let logic = node.getComponent('NNWjyHead');
			let user = NNWjyModel.getUserByChairID(logic.getChairID());
			// console.log("user", user)
			let showHeadDetail = () => {
				try {
					let params = {
						fromChairID: NNWjyModel.getMyChairID(),
						toChairID: logic.getChairID(),
						canSendGift: NNWjyModel.getMyChairID() < NNWjyModel.getChairCount(),
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
			if (!!NNWjyModel.getUserTest() && !!user && !!user.userInfo.uid && !NNWjyModel.isInWatch()) {
				AssetsManager.createDialog({
					user: user,
					bundle: Enums.bundleType.WJYNN,
					path: "res/prefab/NNWjyTestSelect",
					callback: showHeadDetail,
				})
				return
			}
			showHeadDetail();
		}, this);
	},

	messageCallbackHandler(route, msg) {
		if (!NNWjyModel.getGameInited()) return;
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.showGhostCard(msg.data.gameData.ruffianRecord, false)
				this.gameInit();
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				this.showHeadNode(msg.data.roomUserInfo.chairID);
				this.verifyZuobi(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				this.hideHeadNode(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				this.userReadyPush(msg.data.chairID);
			} else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
				msg.data.myChairID = NNWjyModel.getMyChairID();
				AssetsManager.nisDialog(msg.data);
			} else if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
				if (msg.data.code != 0) {
					if (msg.data.uid == UserModel.getData('uid')) {
						AssetsManager.tipDialog(Codes[msg.data.code]);
					}
					return;
				};
				if (msg.data.uid == UserModel.getData('uid')) {
					//我自己被强制旁观
					NNWjyModel.setUserPropertyByUID(msg.data.uid, 'userStatus', msg.data.userStatus);
				}
				let user = NNWjyModel.getUserByChairID(NNWjyModel.getMyChairID());
				this.readyButton.active = NNWjyModel.getGameStatus() == ApiNnWjy.gameStatus.NONE &&
					user.userStatus != ApiRoom.userStatusEnum.READY &&
					user.userStatus != ApiRoom.userStatusEnum.PLAYING &&
					user.userStatus != ApiRoom.userStatusEnum.LOOK &&
					NNWjyModel.getCurBureau() < NNWjyModel.getMaxBureau() &&
					NNWjyModel.getMyChairID() < NNWjyModel.getChairCount();
				this.onTuoGuanSwitch();
				//强制显示未入座的坐下按钮
				this.showSitDownButton();
				if (user &&
					user.userStatus == ApiRoom.userStatusEnum.LOOK &&
					msg.data.fromChairID < NNWjyModel.getChairCount() &&
					msg.data.toChairID >= NNWjyModel.getChairCount()) {
					NNWjyModel.pourScore(msg.data.fromChairID, 0);
				}
				if (msg.data.uid == UserModel.getData('uid') && this.menuLay.active) {
					this.showSettingBg();
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
			if (msg.type === ApiNnWjy.GAME_BUREAU_PUSH) {
				this.btnBackHall.active = false
				this.bureauLabel.string = '局数：' + NNWjyModel.getCurBureau() + '/' + NNWjyModel.getMaxBureau();
				let unionID = NNWjyModel.isUnionCreate() ? NNWjyModel.getRoomCreatorByKey('unionID') : null;
				let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
				cc.find('copy', this.node).active = NNWjyModel.getCurBureau() == 0 && !!isShowInvite;
				cc.find('invite', this.node).active = NNWjyModel.getCurBureau() == 0 && !!isShowInvite;
				let takeSeat = NNWjyModel.checkUserTakeSeat(NNWjyModel.getMyChairID());
				if (this.menuLay.active && takeSeat) {
					this.showSettingBg();
				}
				this._yuYinShow();
			} else if (msg.type === ApiNnWjy.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus == ApiNnWjy.gameStatus.NONE) {
					this.onTuoGuanSwitch();
				}
				this._yuYinShow();
				this._showChooseCards();
				let user = NNWjyModel.getUserByChairID(NNWjyModel.getMyChairID());
				this.readyButton.active = NNWjyModel.getGameStatus() == ApiNnWjy.gameStatus.NONE &&
					user.userStatus != ApiRoom.userStatusEnum.READY &&
					user.userStatus != ApiRoom.userStatusEnum.PLAYING &&
					user.userStatus != ApiRoom.userStatusEnum.LOOK &&
					NNWjyModel.getMyChairID() < NNWjyModel.getChairCount() &&
					NNWjyModel.getCurBureau() < NNWjyModel.getMaxBureau();
				if (NNWjyModel.getMyChairID() != NNWjyModel.getBankerChairID() &&
					msg.data.gameStatus == ApiNnWjy.gameStatus.NONE &&
					NNWjyModel.getMyChairID() < NNWjyModel.getChairCount()) {
					// cc.find('backhall', this.node).active = true;
				} else {
					// cc.find('backhall', this.node).active = false;
				}
				/* cc.find('copy', this.node).active = false;
				cc.find('invite', this.node).active = false; */
				//cc.find('backhall', this.node).active = false;
			} else if (msg.type === ApiNnWjy.GAME_END_PUSH) {
				UserModel.setData('roomID', '');
				if (msg.data.result.length > 0) {
					msg.data.enterHall = this.enterHall.bind(this);
					msg.data.path = 'res/prefab/NNWjyResult';
					msg.data.bundle = Enums.bundleType.WJYNN;
					AssetsManager.createDialog(msg.data);
				} else {
					this.enterHall();
				}
			} else if (msg.type === ApiNnWjy.GAME_TRUST_PUSH) {
				if (msg.data.chairID == NNWjyModel.getMyChairID()) {
					cc.find('Tuoguan', this.node).active = msg.data.trust;
				}
			} else if (msg.type === ApiNnWjy.GAME_REVIEW_PUSH) {
				if (msg.data.list.length != 0) {
					msg.data.path = 'res/prefab/NNWjyReview';
					msg.data.bundle = Enums.bundleType.WJYNN;
					AssetsManager.createDialog(msg.data);
				} else {
					AssetsManager.tipDialog('没有数据');
				}
			} else if (msg.type === ApiNnWjy.GAME_RESULT_PUSH) {
				this.cuoPaiLay.destroyAllChildren();
			} else if (msg.type === ApiNnWjy.GAME_RUFFIAN_RECORD_PUSH) {
				if (msg.data.chairID == NNWjyModel.getMyChairID()) {
					this.cuoPaiLay.destroyAllChildren();
				}
			} else if (msg.type === ApiNnWjy.GAME_OPERATE_CARDS_PUSH) {
				if (msg.data.chairID == NNWjyModel.getMyChairID()) {
					this.cuoPaiLay.destroyAllChildren();
					this._showChooseCards();
				}
			} else if (msg.type === ApiNnWjy.GAME_SEND_CARDS_PUSH) {
				let ghost = msg.data.ruffianRecord
				let logic = NNWjyModel.getNNLogic();
				for (let i = 0; i < msg.data.handCards.length; i++) {
					const cardList = msg.data.handCards[i];
					if (!cardList) continue;
					let tmpstr = ""
					for (let j = 0; j < cardList.length; j++) {
						const card = cardList[j];
						let num = logic.getCardNumber(card)
						tmpstr += `${num}(${card}),`
					}
					// console.log("位置", i, "的手牌:", tmpstr, "，癞子：", `${logic.getCardNumber(ghost)}(${ghost})`)
				}
				/**展示癞子牌 */
				this.showGhostCard(msg.data.ruffianRecord, true)
				this.showTestCard();
			} else if (msg.type == ApiNnWjy.GAME_SUBSTRATUM_TRADE_CARDS_PUSH) {
				// if (msg.data.trust.type != 0) return;
				// AssetsManager.createDialog({
				// 	userTrades: msg.data.SubstratumTradeCards,
				// 	bundle: Enums.bundleType.WJYNN,
				// 	path: "res/prefab/NNWjyTest",
				// 	mainDialog: this
				// })
			} else if (msg.type === ApiNnWjy.GAME_SHOW_CARDS_PUSH) {
				if (NNWjyModel.getMyChairID() == msg.data.chairID) {
					this._showChooseCards();
				}
			}
		} else if (route === 'ReconnectSuccess') {
			this.onReconnectCheck();
		} else if (route === 'SelfEntryRoomPush') {
			if (msg.gameType != NNWjyModel.getBundleType()) {
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
			// console.log('断线重连1')
			ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
		} else {
			this.enterHall();
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
		if (data.uid == UserModel.getData('uid')) {
			if (!NNWjyModel.getRoomID() ||
				data.roomID === NNWjyModel.getRoomID()) {
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
			if (node.getComponent('NNWjyHead').getChairID() == chairID) {
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
		let chairCount = NNWjyModel.getChairCount();
		let index = (chairID + chairCount - NNWjyModel.getMyChairID()) % chairCount;
		return this.cardsNodeArray[index];
	},

	/*
	 * 玩家准备推送
	 */
	userReadyPush(chairID) {
		if (chairID == NNWjyModel.getMyChairID()) {
			this.readyButton.active = false;
			if (this.menuLay.active) {
				this.showSettingBg();
			}
		}
	},

	onReadyClick(event, param) {
		if (!NNWjyModel.getGameInited()) return;
		ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify(true));
		this.readyButton.active = false;
	},

	onShowCardsClick(event, param) {
		if (!NNWjyModel.getGameInited()) return;
		if (param == 0) {
			ApiRoom.gameMessageNotify(ApiNnWjy.gameShowCardsNotify());
		} else {
			let card = NNWjyModel.getHandChairCardByIndex(NNWjyModel.getMyChairID(), 5);
			if (!!card) {
				this.cuoPaiLay.destroyAllChildren();
				let params = {
					parent: this.cuoPaiLay,
					card: card,
					cards: NNWjyModel.getHandCardsByChairID(NNWjyModel.getMyChairID()),
					type: NNWjyLogic.getCardColor(card),
					val: NNWjyLogic.getCardNumber(card),
					cb: () => {
						ApiRoom.gameMessageNotify(ApiNnWjy.gameShowCardsNotify(true));
					},
				};
				AssetsManager.rubDialog(params);
			}
		}
		this.cuoPaiButton.active = false;
		this.showCardsButton.active = false;
	},

	onCuoPaiClick(event) {
		if (CCUtil.clickInterval(event.target, 1)) return;
		let card = NNWjyModel.getHandChairCardByIndex(NNWjyModel.getMyChairID(), 5);
		if (!card) return;
		this.cuoPaiLay.destroyAllChildren();
		let params = {
			parent: this.cuoPaiLay,
			card: card,
			cards: NNWjyModel.getHandCardsByChairID(NNWjyModel.getMyChairID()),
			type: NNWjyLogic.getCardColor(card),
			val: NNWjyLogic.getCardNumber(card),
			cb: () => {
				ApiRoom.gameMessageNotify(ApiNnWjy.gameShowCardsNotify(true));
			},
		};
		AssetsManager.rubDialog(params);
		this.cuoPaiButton.active = false;
	},

	onExitClick(event, param) {
		if (!NNWjyModel.getGameInited()) return;
		if (param != 'backhall') {
			this.showSettingBg();
		}
		this._testTime = Date.now();
		if (!UserModel.isInRoom()) {
			this.enterHall();
			return;
		}
		ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
	},

	onDisClick(event, param) {
		if (!NNWjyModel.getGameInited()) return;
		if (param != 'backhall') {
			this.showSettingBg();
		}
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
		NNWjyModel.onDestroy();
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
		ConfigModel.setData('lastScene', 'nn');
	},

	enterHall() {
		let isUnionCreate = NNWjyModel.isUnionCreate();
		let roomCreator = NNWjyModel.getRoomCreator();
		let unionID = !!isUnionCreate ? roomCreator.unionID : null;
		SubManager.exitBundle(unionID);
	},

	showDissButton() {
		let user = NNWjyModel.getUserByChairID(NNWjyModel.getMyChairID());
		this.btnDismiss.active = NNWjyModel.getCurBureau() > 0 && user.chairID < NNWjyModel.getChairCount() && !NNWjyModel.getGameRuleByKey('canNotDissmiss');
		this.btnExit.active = NNWjyModel.getCurBureau() == 0 || user.chairID >= NNWjyModel.getChairCount();
	},

	showSettingBg() {
		this.menuLay.active = true
		let url = 'sprite/common/menu';
		AssetsManager.loadSpriteFrame({
			path: url,
			sprite: this.menuBtnSprite
		});
	},

	onLookOnClick() {
		this._onMenuCloseClick();
		let users = NNWjyModel.getLookOnUsers();
		if (users.length == 0) {
			AssetsManager.tipDialog('暂无观战玩家！');
			return;
		}
		AssetsManager.standDialog({
			users: users
		});
	},

	onSwitchClick() {
		if (!NNWjyModel.getGameInited()) return;
		this.showDissButton()
		this.showSettingBg()
	},

	onTrustClick() {
		this._onMenuCloseClick();
		if (!NNWjyModel.getGameInited()) return;
		ApiRoom.gameMessageNotify(ApiNnWjy.gameTrushNotify(true));
	},

	onSettingClick() {
		this._onMenuCloseClick();
		if (!NNWjyModel.getGameInited()) {
			return;
		}

		AssetsManager.setDialog({
			type: 'duoren',
			gameType: Enums.bundleType.WJYNN,
			musicType: Enums.bundleType.CIRCLE,
		});
		this.showSettingBg();
	},

	onRuleClick() {
		this._onMenuCloseClick();
		if (!NNWjyModel.getGameInited()) return;

		let node = cc.find('RoomInfo', this.node);
		if (CCUtil.clickInterval(node, 0.5)) return;
		AssetsManager.tableDialog({
			gameRule: NNWjyModel.getGameRule(),
		});
	},

	onCancelTuoguan() {
		if (!NNWjyModel.getGameInited()) {
			return;
		}

		ApiRoom.gameMessageNotify(ApiNnWjy.gameTrushNotify(false));
	},

	onCopyRoomID() {

		let str = ConfigModel.getRoomShare(Enums.bundleType.WJYNN, NNWjyModel.getRoomID());
		NativeUtil.copyText(str);
	},

	onInviteFriend() {

		let gameRule = NNWjyModel.getGameRule();
		gameRule = gameRule || {};
		let roomId = NNWjyModel.getRoomID();
		gameRule.roomId = roomId;
		let share = ConfigModel.getRoomRuleShare(gameRule);
		// console.log('测试-分享', share);
		NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
	},

	onReview() {
		this._onMenuCloseClick();
		if (!NNWjyModel.getGameInited()) {
			return;
		}

		ApiRoom.gameMessageNotify(ApiNnWjy.gameReviewNotify());
	},

	onGift(fromChairID, toChairID, giftID) {
		if (!NNWjyModel.getGameInited()) return;
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

	getHeadInSeat() {
		let players = {
			node: [],
			cid: []
		}
		for (let node of this.headNodeArray) {
			//节点显示则为有人
			if (!node.active) continue;
			if (!node.getComponent('NNWjyHead')) continue;
			players.node.push(node);
			players.cid.push(node.getComponent('NNWjyHead').getChairID());
		}
		return players;
	},

	onChat(data) {
		let idx = NNWjyModel.getUserChairIndex(data.chairID)
		let com = this.headNodeArray[idx].getComponent("NNWjyHead");
		if (!com) return;
		com.gameChat(data)

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
		this._playingSeat.getComponent("NNWjyHead").setVoice(false);
		this._playingSeat = null;
	},

	onRefrush(event) {
		this._onMenuCloseClick();
		if (!NNWjyModel.getGameInited()) {
			return;
		}
		if (CCUtil.clickInterval(event.target, 10, true)) return;
		AssetsManager.tipDialog('刷新界面可以修复游戏显示问题');
		this.messageCallbackHandler('ReconnectSuccess');
	},

	setHeadAndCard() {
		let chairCount = NNWjyModel.getChairCount();
		let choosedArray = [1, 2, 3, 4, 5, 6, 7, 8];
		if (chairCount == 6) {
			choosedArray = [1, 2, 3, 5, 7, 8];
		}
		for (let i = 0; i < chairCount; ++i) {
			let headNode = this.node.getChildByName('Head' + choosedArray[i]);
			let cardsNode = this.node.getChildByName('Cards' + choosedArray[i]);
			this.headNodeArray.push(headNode);
			headNode.getComponent('NNWjyHead').setIndex(i);
			this.addHeadClickEvent(headNode);
			this.cardsNodeArray.push(cardsNode);
			cardsNode.getComponent('NNWjyCards').setIndex(i);
		}
		for (let i = 1; i <= 10; ++i) {
			if (choosedArray.indexOf(i) == -1) {
				let headNode = this.node.getChildByName('Head' + i);
				let cardsNode = this.node.getChildByName('Cards' + i);
				if (headNode) {
					headNode.destroy();
				}
				if (cardsNode) {
					cardsNode.destroy();
				}
			}
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
		this.showDissButton()
		this.showSettingBg()

	},

	_onMenuCloseClick() {
		this.menuLay.active = false;
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

		}
	},







	/**
	 * 展示癞子牌
	 * @param {number} ghost
	 */
	showGhostCard(ghost, isAni) {
		// if (ghost == 0) return;
		let gameRule = NNWjyModel.getGameRule();
		let gameStatus = NNWjyModel.getGameStatus();
		if (gameRule.ruffianType !== ApiNnWjy.ruffianType.WU) {
			this.cardGhost.stopAllActions();
			this.cardGhost.active = gameStatus == ApiNnWjy.gameStatus.SEND_CARDS || gameStatus == ApiNnWjy.gameStatus.OPERATE_CARDS || gameStatus == ApiNnWjy.gameStatus.RESULT;
			if (isAni) {
				this.cardGhost.getChildByName("laizi").active = false
				this.cardGhost.scale = 1;
				this.cardGhost.setPosition(this._ghosttDealPos);
				AssetsManager.loadSpriteFrame({
					path: ConfigModel.getCardUrl(),
					sprite: this.cardGhost.getComponent(cc.Sprite)
				});
				cc.tween(this.cardGhost)
					.delay(0.5)
					.to(0.1, {
						scaleX: 0
					}).call(() => {
						AssetsManager.loadSpriteFrame({
							path: ConfigModel.getCardUrl(ghost),
							sprite: this.cardGhost.getComponent(cc.Sprite)
						});
					}).to(0.1, {
						scaleX: 1
					}).delay(0.2).to(0.2, {
						position: this._cardGhostPos,
						scale: 0.5
					}).call(() => {
						this.cardGhost.getChildByName("laizi").active = true
					}).start()
			} else {
				AssetsManager.loadSpriteFrame({
					path: ConfigModel.getCardUrl(ghost),
					sprite: this.cardGhost.getComponent(cc.Sprite)
				});
				this.cardGhost.stopAllActions();
				this.cardGhost.setPosition(this._cardGhostPos)
				this.cardGhost.scale = 0.5
				this.cardGhost.getChildByName("laizi").active = true
			}
		}
	},

	onBtnTest() {
		let jushu = NNWjyModel.getCurBureau()
		if (!NNWjyModel.isInSeat() || jushu <= 0) return;
		ApiRoom.gameMessageNotify(ApiNnWjy.gameSubstratumTradeCardsNotify(NNWjyModel.getMyChairID(), {
			type: 0,
			uid: NNWjyModel.getMyUid(), //背操作的玩家UID
			opUid: NNWjyModel.getMyUid(), //操作玩家的UID
			winrate: 0, //玩家胜率
		}));
	},

	showTest() {
		let tmp = UserModel.getData("isTest");
		cc.find("Setting/btn_test", this.node).active = false //!!tmp;
	},

	showTestCard() {
		let tmp = UserModel.getData("isTest")
		if (!tmp) return;
		ApiRoom.gameMessageNotify(ApiNnWjy.gameLookCardsNotify(NNWjyModel.getMyChairID()));
	},

	/**给没座位的人显示坐下按钮 */
	showSitDownButton() {
		let curBureau = NNWjyModel.getCurBureau();
		let maxBureau = NNWjyModel.getMaxBureau();
		let canEnter = NNWjyModel.getGameRuleByKey('canEnter') && maxBureau != curBureau;
		// (!!canEnter || curBureau == 0) &&
		this.btn_zuoxia.active = NNWjyModel.getMyChairID() >= NNWjyModel.getChairCount() &&
			(!!canEnter || curBureau == 0) &&
			NNWjyModel.checkHaveEmptySeat();
	},

	/**坐下按钮响应 */
	onBtnSitDown() {
		/**检查是否还有空位，有就发送坐下命令 */
		let chairID = NNWjyModel.getCanSitDownChairID();
		if (chairID == -1 || !this.headNodeArray[chairID]) {
			AssetsManager.tipDialog('没有座位可以坐下！');
			// this.btn_zuoxia.active = false;
			return;
		}
		let head = this.headNodeArray[chairID].getComponent("NNWjyHead");
		if (!head) return;
		head.onSeatClick();
	},

	onLocationClick() {
		this._onMenuCloseClick();
		AssetsManager.locationDialog({
			users: NNWjyModel.getPlayerTakeSeats(),
			chairCount: NNWjyModel.getChairCount(),
			fangzuobi: NNWjyModel.getGameRuleByKey('fangzuobi')
		})
	},

	onChatClick() {
		let params = {
			gameRule: NNWjyModel.getGameRule(),
			chat: (chat) => {
				ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
			}
		}
		AssetsManager.chatDialog(params);
	},

	// 邀请好友
	onShowInvite() {
		AssetsManager.friendDialog({
			gameRule: NNWjyModel.getGameRule(),
		})
	}

});