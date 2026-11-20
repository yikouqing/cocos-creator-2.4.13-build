const LYCModel = require('./LYCModel');
const ApiLyc = require('./ApiLyc');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const Enums = require('../../../src/const/Enums');
const UserModel = require('../../../src/model/UserModel');
const ApiHall = require('../../../src/api/ApiHall');
const AudioUtil = require('../../../src/utils/AudioUtil');
const Utils = require('../../../src/utils/Utils');
const SubManager = require('../../../src/utils/SubManager');
const Codes = require('../../../src/const/Codes');
const ConfigModel = require('../../../src/model/ConfigModel');
const Events = require('../../../src/const/Events');

cc.Class({
	extends: cc.Component,
	properties: {
		readyButton: cc.Node,
		nameLabel: cc.Label,
		roomIdLabel: cc.Label,
		bureauLabel: cc.Label,
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
		canNotDismissBar: cc.Node,
		btnDismiss: cc.Node,
		btnExit: cc.Node,
		animPre: cc.Prefab,
		_lookOnEffect: null,
		_lookOnScoreEffect: null,
	},

	onLoad() {
		AssetsManager.init(this.node);
		LYCModel.init(); /* 保存数据 */
		this.headNodeArray = [];
		this.cardsNodeArray = [];
		// 菜单点击
		this.menuLay.active = false;
		this.nameLabel.string = `游戏:${ConfigModel.getGameName(Enums.bundleType.LYC)}`;
		MessageCallback.addListener(Events.clientEvents.gvUploadFileSuccess, this);
		cc.game.on(cc.game.EVENT_SHOW, this.onEventShow, this);
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
		this.roomIdLabel.string = '房号:' + LYCModel.getRoomID();
		this.bureauLabel.string = '局数:' + LYCModel.getCurBureau() + '/' + LYCModel.getMaxBureau();
		let user = LYCModel.getUserByChairID(LYCModel.getMyChairID());
		if (user) {
			if (LYCModel.getGameStatus() == ApiLyc.gameStatus.NONE &&
				user.userStatus != ApiRoom.userStatusEnum.READY &&
				user.userStatus != ApiRoom.userStatusEnum.PLAYING &&
				user.userStatus != ApiRoom.userStatusEnum.LOOK &&
				LYCModel.getCurBureau() < LYCModel.getMaxBureau() &&
				LYCModel.getMyChairID() < LYCModel.getChairCount()) {
				this.readyButton.active = true;
			} else {
				this.readyButton.active = false;
			}
		}
		this.btnLookOn.active = !!LYCModel.getGameRuleByKey('canWatch');
		cc.find('Tuoguan', this.node).active = LYCModel.getTrustByChairID(LYCModel.getMyChairID());
		this.onTuoGuanSwitch();
		this.btn_tuoguan.active = LYCModel.getGameRule().canTrust;
		let unionID = LYCModel.isUnionCreate() ? LYCModel.getRoomCreatorByKey('unionID') : null;
		let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
		cc.find('copy', this.node).active = LYCModel.getCurBureau() == 0 && !!isShowInvite;
		cc.find('invite', this.node).active = LYCModel.getCurBureau() == 0 && !!isShowInvite;
		if (this.canNotDismissBar) this.canNotDismissBar.active = LYCModel.getGameRuleByKey("canNotDissmiss")
		this._yuYinShow();
		this.btnLocation.active = LYCModel.getGameRuleByKey('maxPlayerCount') < 6 && !!LYCModel.getGameRuleByKey('showGps');
		this.btn_zuoxia.active = LYCModel.getGameRuleByKey('fangzuobi');;
		this.btnBackHall.active = LYCModel.getCurBureau() == 0 && LYCModel.isUnionCreate();
		this.showSitDownButton();
		this.verifyZuobi(user);
		this.showTest();
		this.showDissButton()
	},

	_yuYinShow() {
		let isInSeat = LYCModel.isInSeat();
		let yuyin = LYCModel.getGameRuleByKey('yuyin');
		this.btnYuYin.active = !!isInSeat && !!yuyin && ConfigModel.getData('voiceSpeaker');
	},

	onTuoGuanSwitch() {
		let user = LYCModel.getUserByChairID(LYCModel.getMyChairID());
		this.lookOn.active = (user && user.userStatus == ApiRoom.userStatusEnum.LOOK) || LYCModel.getMyChairID() >= LYCModel.getChairCount();
	},

	verifyZuobi(roomUserInfo) {
		if (!LYCModel.getGameRule().fangzuobi) return;
		if (!roomUserInfo || roomUserInfo.chairID >= LYCModel.getChairCount()) return;
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
		for (let i = 0; i < LYCModel.getChairCount(); ++i) {
			let user = LYCModel.getUserByChairID(i);
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
			if (LYCModel.getMyChairID() >= LYCModel.getChairCount()) {
				AssetsManager.tipDialog('观战玩家无法查看详细信息');
				return;
			}
			if (CCUtil.clickInterval(node, 0.5)) return;
			let logic = node.getComponent('LYCHead');
			let user = LYCModel.getUserByChairID(logic.getChairID());
			// console.log("user", user)
			let showHeadDetail = () => {
				try {
					let params = {
						fromChairID: LYCModel.getMyChairID(),
						toChairID: logic.getChairID(),
						canSendGift: LYCModel.getMyChairID() < LYCModel.getChairCount(),
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

			if (LYCModel.getUserTest() && !!user && !LYCModel.isInWatch()) {
				AssetsManager.createDialog({
					user: user,
					optChairID: user.chairID,
					callback: showHeadDetail,
					bundle: Enums.bundleType.LYC,
					path: "res/prefab/LYCTestSelect",
				})
				return
			} else {
				showHeadDetail();
			}
		}, this);
	},

	messageCallbackHandler(route, msg) {
		if (!LYCModel.getGameInited()) return;
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.gameInit();
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_RESPONSE) {
				if (msg.data.chairID === LYCModel.getMyChairID()) {

				}
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				this.showHeadNode(msg.data.roomUserInfo.chairID);
				this.verifyZuobi(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				this.hideHeadNode(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				this.userReadyPush(msg.data.chairID);
			} else if (msg.type === ApiRoom.GAME_END_PUSH) { } else if (msg.type === ApiRoom.ROOM_DISMISS_PUSH) { } else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
				msg.data.myChairID = LYCModel.getMyChairID();
				AssetsManager.nisDialog(msg.data);
			} else if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
				if (msg.data.code != 0) {
					if (msg.data.uid == UserModel.getData('uid')) {
						AssetsManager.tipDialog(Codes[msg.data.code]);
					}
					return;
				};
				let user = LYCModel.getUserByChairID(LYCModel.getMyChairID());
				if (LYCModel.getGameStatus() == ApiLyc.gameStatus.NONE &&
					user.userStatus != ApiRoom.userStatusEnum.READY &&
					user.userStatus != ApiRoom.userStatusEnum.LOOK &&
					user.userStatus != ApiRoom.userStatusEnum.PLAYING &&
					LYCModel.getCurBureau() < LYCModel.getMaxBureau() &&
					LYCModel.getMyChairID() < LYCModel.getChairCount()) {
					this.readyButton.active = true;
				} else {
					this.readyButton.active = false;
				}
				this.onTuoGuanSwitch();
				this.showSitDownButton();
				if (user &&
					user.userStatus == ApiRoom.userStatusEnum.LOOK &&
					msg.data.fromChairID < LYCModel.getChairCount() &&
					msg.data.toChairID >= LYCModel.getChairCount()) {
					LYCModel.pourScore(msg.data.fromChairID, 0);
				}
				let bg = cc.find('Setting/bg', this.node);
				if (msg.data.uid == UserModel.getData('uid') &&
					!!bg && bg.active) {
					this.showSettingBg();
				}
			} else if (msg.type === ApiRoom.USER_CHAT_PUSH) {
				this.onChat(msg.data.fromChairID, msg.data.toChairID, msg.data.msg);
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
			if (msg.type === ApiLyc.GAME_BUREAU_PUSH) {
				this.bureauLabel.string = '局数：' + LYCModel.getCurBureau() + '/' + LYCModel.getMaxBureau();
				cc.find('copy', this.node).active = LYCModel.getCurBureau() == 0 && !cc.sys.isBrowser;
				cc.find('invite', this.node).active = LYCModel.getCurBureau() == 0 && !cc.sys.isBrowser;
				// cc.find('backhall', this.node).active = (LYCModel.getCurBureau() == 0);
				this._yuYinShow();
				let bg = cc.find('Setting/bg', this.node);
				let takeSeat = LYCModel.checkUserTakeSeat(LYCModel.getMyChairID());
				if (!!bg &&
					!!bg.active &&
					takeSeat) {
					this.showSettingBg();
				}
			} else if (msg.type === ApiLyc.GAME_STATUS_PUSH) {
				this.btnBackHall.active = false;
				this._yuYinShow();
				if (msg.data.gameStatus == ApiLyc.gameStatus.NONE) {
					this.onTuoGuanSwitch();
				}
				let user = LYCModel.getUserByChairID(LYCModel.getMyChairID());
				if (LYCModel.getGameStatus() == ApiLyc.gameStatus.NONE &&
					user.userStatus != ApiRoom.userStatusEnum.READY &&
					user.userStatus != ApiRoom.userStatusEnum.LOOK &&
					user.userStatus != ApiRoom.userStatusEnum.PLAYING &&
					LYCModel.getCurBureau() < LYCModel.getMaxBureau() &&
					LYCModel.getMyChairID() < LYCModel.getChairCount()) {
					this.readyButton.active = true;
				}
				if (LYCModel.getMaxBureau() == "自由局" && LYCModel.getMyChairID() != LYCModel.getBankerChairID() && msg.data.gameStatus == ApiLyc.gameStatus.NONE && LYCModel.getMyChairID() < LYCModel.getChairCount()) {
					// cc.find('backhall', this.node).active = true;
				} else {
					// cc.find('backhall', this.node).active = false;
				}
			} else if (msg.type === ApiLyc.GAME_END_PUSH) {
				UserModel.setData('roomID', '');
				if (msg.data.result.length > 0) {
					msg.data.enterHall = this.enterHall.bind(this);
					msg.data.path = 'res/prefab/LYCResult';
					msg.data.bundle = Enums.bundleType.LYC;
					AssetsManager.createDialog(msg.data);
				} else {
					this.enterHall();
				}
			} else if (msg.type === ApiLyc.GAME_TRUST_PUSH) {
				if (msg.data.chairID == LYCModel.getMyChairID()) {
					/* cc.find('TrustLabel', this.node).active = msg.data.trust; */
					cc.find('Tuoguan', this.node).active = msg.data.trust;
				}
			} else if (msg.type === ApiLyc.GAME_REVIEW_PUSH) {
				if (msg.data.list.length != 0) {
					msg.data.path = 'res/prefab/LYCReview';
					msg.data.bundle = Enums.bundleType.LYC;
					AssetsManager.createDialog(msg.data);
				} else {
					AssetsManager.tipDialog('没有数据');
				}
			} else if (msg.type === ApiLyc.GAME_SEND_CARDS_PUSH) {
				this.showTestCard()
			}
		} else if (route === 'ReconnectSuccess') {
			// console.log('断线重连=====================');
			this.onReconnectCheck();
		} else if (route == 'UpdateGameBg') { } else if (route === 'SelfEntryRoomPush') {
			if (msg.gameType != LYCModel.getBundleType()) {
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
	showHeadNode(chairID) {
		/* this.getHeadNodeByChairID(chairID).active = true; */
	},

	/*
	 * 隐藏玩家头像
	 */
	hideHeadNode(data) {
		if (data.uid == UserModel.getData('uid')) {
			if (!LYCModel.getRoomID() ||
				data.roomID === LYCModel.getRoomID()) {
				this.enterHall();
			}
		}
	},

	/*
	 * 根据chairid获取头像节点
	 * @param chairID 椅子id
	 */
	getHeadNodeByChairID(chairID) {
		let userHead = null;
		for (let node of this.headNodeArray) {
			if (node.getComponent('LYCHead').getChairID() == chairID) {
				userHead = node;
				break;
			}
		}
		return userHead;
	},

	/*
	 * 根据chairid获取手牌节点
	 * @param chairID 椅子id
	 */
	getCardsNodeByChairID(chairID) {
		let chairCount = LYCModel.getChairCount();
		let index = (chairID + chairCount - LYCModel.getMyChairID()) % chairCount;
		return this.cardsNodeArray[index];
	},

	/*
	 * 玩家准备推送
	 */
	userReadyPush(chairID) {
		if (chairID == LYCModel.getMyChairID()) {
			this.readyButton.active = false;
			let bg = cc.find('Setting/bg', this.node);
			if (!!bg && bg.active) {
				this.showSettingBg();
			}
		}
	},

	onReadyClick(event, param) {
		ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify(true));
		this.readyButton.active = false;
	},

	onDisClick(event, param) {
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

	onExitClick(event, param) {
		if (param != 'backhall') {
			this.showSettingBg();
		}
		if (!UserModel.isInRoom()) {
			this.enterHall();
			return;
		}
		ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
	},

	onDestroy() {
		LYCModel.onDestroy();
		MessageCallback.removeListener(Events.clientEvents.gvUploadFileSuccess, this);
		cc.game.off(cc.game.EVENT_SHOW, this.onEventShow, this);
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
		ConfigModel.setData('lastScene', 'lyc');
	},

	enterHall() {
		let roomCreatorInfo = LYCModel.getRoomCreator();
		let isUnionCreate = roomCreatorInfo.creatorType == Enums.roomCreatorType.UNION_CREATE;
		let unionID = !!isUnionCreate ? roomCreatorInfo.unionID : null;
		SubManager.exitBundle(unionID);
	},

	showDissButton() {
		let user = LYCModel.getUserByChairID(LYCModel.getMyChairID());
		this.btnDismiss.active = LYCModel.getCurBureau() > 0 && user.chairID < LYCModel.getChairCount() && !LYCModel.getGameRuleByKey('canNotDissmiss');
		this.btnExit.active = LYCModel.getCurBureau() == 0 || user.chairID >= LYCModel.getChairCount()
	},

	showSettingBg() {
		this.menuLay.active = true;
		AssetsManager.loadSpriteFrame({
			path: 'sprite/common/pull',
			sprite: this.menuBtnSprite
		});
	},

	onSwitchClick() {

		this.showDissButton()
		this.showSettingBg()
	},

	onLookOnClick() {
		this._onMenuCloseClick();
		let users = LYCModel.getLookOnUsers();
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
			gameType: Enums.bundleType.LYC,
			musicType: Enums.bundleType.CIRCLE,
		});
		this.showSettingBg();
	},

	onRuleClick() {
		this._onMenuCloseClick();
		let node = cc.find('RoomInfo', this.node);
		if (CCUtil.clickInterval(node, 0.5)) return;
		AssetsManager.tableDialog({
			gameRule: LYCModel.getGameRule(),
		});
	},

	onTrustClick() {
		this._onMenuCloseClick();
		ApiRoom.gameMessageNotify(ApiLyc.gameTrushNotify(true));
	},

	onCancelTuoguan() {

		ApiRoom.gameMessageNotify(ApiLyc.gameTrushNotify(false));
	},

	onCopyRoomID() {

		let str = ConfigModel.getRoomShare(Enums.bundleType.LYC, LYCModel.getRoomID());
		NativeUtil.copyText(str);
	},

	onInviteFriend() {

		let gameRule = LYCModel.getGameRule();
		gameRule = gameRule || {};
		let roomId = LYCModel.getRoomID();
		gameRule.roomId = roomId;
		let share = ConfigModel.getRoomRuleShare(gameRule);
		// console.log('测试-分享', share);
		NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
	},

	onReview() {
		this._onMenuCloseClick();
		ApiRoom.gameMessageNotify(ApiLyc.gameReviewNotify());
	},

	getHeadInSeat() {
		let players = {
			node: [],
			cid: []
		}
		for (let node of this.headNodeArray) {
			//节点显示则为有人
			if (!node.active) continue;
			if (!node.getComponent('LYCHead')) continue;
			players.node.push(node);
			players.cid.push(node.getComponent('LYCHead').getChairID());
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

	onChat(fromChairID, toChairID, msg) { },

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
		this._playingSeat.getComponent("LYCHead").setVoice(false);
		this._playingSeat = null;
	},

	onRefrush(event) {
		this._onMenuCloseClick();
		if (CCUtil.clickInterval(event.target, 10, true)) return;
		AssetsManager.tipDialog('刷新界面可以修复游戏显示问题');
		this.messageCallbackHandler('ReconnectSuccess');
	},

	setHeadAndCard() {
		let chairCount = LYCModel.getGameRule().maxPlayerCount;
		// let headPosArray = [cc.v2(-586, -293), cc.v2(606, -40), cc.v2(561, 141), cc.v2(199, 265), cc.v2(-37, 265), cc.v2(-261, 265), cc.v2(-568, 141), cc.v2(-605, -37)];
		// let cardPosArray = [cc.v2(35, -245), cc.v2(416, -88), cc.v2(373, 92), cc.v2(166, 154), cc.v2(-42, 154), cc.v2(-275, 154), cc.v2(-470, 92), cc.v2(-508, -85)];
		let choosedArray = [1, 2, 3, 4, 6, 8, 9, 10];
		if (chairCount == 6) {
			// headPosArray = [cc.v2(-586, -293), cc.v2(606, -14), cc.v2(310, 248), cc.v2(-37, 280), cc.v2(-359, 249), cc.v2(-605, -11)];
			// cardPosArray = [cc.v2(35, -245), cc.v2(416, -62), cc.v2(277, 99), cc.v2(-42, 154), cc.v2(-355, 103), cc.v2(-508, -59)];
			choosedArray = [1, 2, 4, 6, 8, 10];
		} else if (chairCount == 10) {
			// headPosArray = [cc.v2(-586, -293), cc.v2(606, -99), cc.v2(606, 29), cc.v2(561, 161), cc.v2(199, 265), cc.v2(-37, 265), cc.v2(-261, 265), cc.v2(-568, 165), cc.v2(-605, 32), cc.v2(-605, -100)];
			// cardPosArray = [cc.v2(35, -245), cc.v2(416, -147), cc.v2(416, -19), cc.v2(373, 112), cc.v2(166, 150), cc.v2(-42, 154), cc.v2(-257, 150), cc.v2(-470, 116), cc.v2(-508, -16), cc.v2(-508, -148)];
			choosedArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
		}

		for (let i = 0; i < chairCount; ++i) {
			let headNode = this.node.getChildByName('Head' + choosedArray[i]);
			let cardsNode = this.node.getChildByName('Cards' + choosedArray[i]);
			if (i > 0) {
				// headNode.setPosition(headPosArray[i]);
				// cardsNode.setPosition(cardPosArray[i]);
			}
			this.headNodeArray.push(headNode);
			headNode.getComponent('LYCHead').setIndex(i);
			this.addHeadClickEvent(headNode);
			this.cardsNodeArray.push(cardsNode);
			cardsNode.getComponent('LYCCards').setIndex(i, this);
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

	/**给没座位的人显示坐下按钮 */
	showSitDownButton() {
		let curBureau = LYCModel.getCurBureau();
		let maxBureau = LYCModel.getMaxBureau();
		let canEnter = LYCModel.getGameRuleByKey('canEnter') && maxBureau != curBureau;
		// (!!canEnter || curBureau == 0) &&
		this.btn_zuoxia.active = LYCModel.getMyChairID() >= LYCModel.getChairCount() &&
			(!!canEnter || curBureau == 0) &&
			LYCModel.checkHaveEmptySeat();
	},

	/**坐下按钮响应 */
	onBtnSitDown() {
		/**检查是否还有空位，有就发送坐下命令 */
		let chairID = LYCModel.getCanSitDownChairID();
		if (chairID == -1 || !this.headNodeArray[chairID]) {
			AssetsManager.tipDialog('没有座位可以坐下！');
			// this.btn_zuoxia.active = false;
			return;
		}
		let head = this.headNodeArray[chairID].getComponent("LYCHead");
		if (!head) return;
		// console.log('找到座位坐下', chairID);
		head.onSeatClick();
	},

	showTest() {
		let tmp = UserModel.getData("isTest")
		cc.find("Setting/btn_test", this.node).active = false // !!tmp;
	},

	showTestCard() {
		let myChairID = LYCModel.getMyChairID()
		let tmp = UserModel.getData("isTest")
		if (!tmp || myChairID >= LYCModel.getChairCount()) return;
		ApiRoom.gameMessageNotify(ApiLyc.gameLookCardsNotify(LYCModel.getMyChairID()));
	},
	onBtnTest() {
		let curOperateChairID = LYCModel.getCurOperateChairID();
		let gameStatus = LYCModel.getGameStatus();
		if (!LYCModel.isInSeat() ||
			gameStatus != ApiLyc.gameStatus.CHOOSE_OPERATE ||
			curOperateChairID != LYCModel.getMyChairID()) return;
		AssetsManager.createDialog({
			bundle: Enums.bundleType.LYC,
			path: "res/prefab/LYCSelectTest",
		})
	},

	onLocationClick() {
		this._onMenuCloseClick();
		AssetsManager.locationDialog({
			users: LYCModel.getPlayerTakeSeats(),
			chairCount: LYCModel.getChairCount(),
			fangzuobi: LYCModel.getGameRuleByKey('fangzuobi')
		})
	},

	onChatClick() {
		let params = {
			gameRule: LYCModel.getGameRule(),
			chat: (chat) => {
				ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
			}
		}
		AssetsManager.chatDialog(params);
	},
	// 邀请好友
	onShowInvite() {
		AssetsManager.friendDialog({
			gameRule: LYCModel.getGameRule(),
		})
	},




	_onMenuOpen() {
		// this.menuLayList.stopAllActions()
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
			case "btn_back":
				this.enterHall()
				break;
		}
	},



});