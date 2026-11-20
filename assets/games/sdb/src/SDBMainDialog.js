const SDBModel = require('./SDBModel');
const ApiSdb = require('./ApiSdb');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const UserModel = require('../../../src/model/UserModel');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiHall = require('../../../src/api/ApiHall');
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
		roomIdLabel: cc.Label,
		bureauLabel: cc.Label,
		txt_gameName: cc.Label,
		btn_zuoxia: cc.Node,
		btnLocation: cc.Node,
		btnLookOn: cc.Node,
		btnMenu: cc.Node,
		btnTuoguan: cc.Node,
		lookOnEffect: cc.Node,
		menuLay: cc.Node,
		menuLayList: cc.Node,
		btnBackHall: cc.Node,
		btnYuYin: cc.Node,
		btnDismiss: cc.Node,
		btnExit: cc.Node,
		canNotDismissBar: cc.Node,
	},

	onLoad() {
		AssetsManager.init(this.node);
		this.headNodeArray = [];
		this.cardsNodeArray = [];
		// 菜单点击
		this.menuLay.active = false
		SDBModel.init();
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
		this.roomIdLabel.string = '房号:' + SDBModel.getRoomID();
		this.bureauLabel.string = '局数:' + SDBModel.getCurBureau() + '/' + SDBModel.getMaxBureau();
		let gameName = ConfigModel.getBundleConfig(data.gameRule.gameType)
		this.txt_gameName.string = `游戏:${gameName.name}`
		let user = SDBModel.getUserByChairID(SDBModel.getMyChairID());
		if (user) {
			if (SDBModel.getGameStatus() == ApiSdb.gameStatus.NONE &&
				user.userStatus != ApiRoom.userStatusEnum.READY &&
				user.userStatus != ApiRoom.userStatusEnum.LOOK &&
				user.userStatus != ApiRoom.userStatusEnum.PLAYING &&
				SDBModel.getCurBureau() < SDBModel.getMaxBureau() &&
				SDBModel.getMyChairID() < SDBModel.getChairCount()) {
				this.readyButton.active = true;
			} else {
				this.readyButton.active = false;
			}
		}
		/* cc.find('TrustLabel', this.node).active = SDBModel.getTrustByChairID(SDBModel.getMyChairID()); */
		cc.find('Tuoguan', this.node).active = SDBModel.getTrustByChairID(SDBModel.getMyChairID());
		this.onTuoGuanSwitch();
		/* cc.find('Setting/Layout/TuoButton', this.node).active = SDBModel.getGameRule().canTrust; */
		// cc.find('Setting/TuoButton', this.node).active = true;
		this.btnTuoguan.active = true;
		let unionID = SDBModel.isUnionCreate() ? SDBModel.getRoomCreatorByKey('unionID') : null;
		let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
		cc.find('copy', this.node).active = SDBModel.getCurBureau() == 0 && !!isShowInvite;
		cc.find('invite', this.node).active = SDBModel.getCurBureau() == 0 && !!isShowInvite;
		// cc.find('backhall', this.node).active = (SDBModel.getCurBureau() == 0);
		this.btnLookOn.active = !!SDBModel.getGameRuleByKey('canWatch');
		this.btnLocation.active = SDBModel.getGameRuleByKey('maxPlayerCount') < 6 && !!SDBModel.getGameRuleByKey('showGps');
		this.btnBackHall.active = SDBModel.getCurBureau() == 0 && SDBModel.isUnionCreate();
		if (this.canNotDismissBar) this.canNotDismissBar.active = SDBModel.getGameRuleByKey("canNotDissmiss");
		this._yuYinShow();
		this.verifyZuobi(user);
		this.showSitDownButton();
		this.showTest();
		this.showDissButton();
	},

	_yuYinShow() {
		let isInSeat = SDBModel.isInSeat();
		let yuyin = SDBModel.getGameRuleByKey('yuyin');
		this.btnYuYin.active = !!isInSeat && !!yuyin && ConfigModel.getData('voiceSpeaker');
	},

	onTuoGuanSwitch() {
		let user = SDBModel.getUserByChairID(SDBModel.getMyChairID());
		if (SDBModel.getMyChairID() >= SDBModel.getChairCount()) {
			this.lookOnEffect.active = user && user.userStatus == ApiRoom.userStatusEnum.LOOK;
		} else {
			this.lookOnEffect.active = user && user.userStatus == ApiRoom.userStatusEnum.LOOK;
		}
	},

	verifyZuobi(roomUserInfo) {
		if (!SDBModel.getGameRuleByKey('fangzuobi')) return;
		if (!roomUserInfo || roomUserInfo.chairID >= SDBModel.getChairCount()) return;
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
		for (let i = 0; i < SDBModel.getChairCount(); ++i) {
			let user = SDBModel.getUserByChairID(i);
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
			if (SDBModel.getMyChairID() >= SDBModel.getChairCount()) {
				AssetsManager.tipDialog('观战玩家无法查看详细信息');
				return;
			}
			if (CCUtil.clickInterval(node, 0.5)) return;
			let logic = node.getComponent('SDBHead');
			let user = SDBModel.getUserByChairID(logic.getChairID());

			// console.log("user", user)
			let showHeadDetail = () => {
				try {
					let params = {
						fromChairID: SDBModel.getMyChairID(),
						toChairID: logic.getChairID(),
						canSendGift: SDBModel.getMyChairID() < SDBModel.getChairCount(),
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
			if (!!SDBModel.getUserTest() && !!user && !SDBModel.isInWatch()) {
				AssetsManager.createDialog({
					user: user,
					callback: showHeadDetail,
					optChairID: user.chairID,
					bundle: Enums.bundleType.SDB,
					path: "res/prefab/SDBTestSelect",
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
				if (msg.data.chairID === SDBModel.getMyChairID()) { }
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				this.verifyZuobi(msg.data.roomUserInfo);
				this.showHeadNode(msg.data.roomUserInfo.chairID);
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				this.hideHeadNode(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				this.userReadyPush(msg.data.chairID);
			} else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
				msg.data.myChairID = SDBModel.getMyChairID();
				AssetsManager.nisDialog(msg.data);
			} else if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
				if (msg.data.code != 0) {
					if (msg.data.uid == UserModel.getData('uid')) {
						AssetsManager.tipDialog(Codes[msg.data.code]);
					}
					return;
				};
				let user = SDBModel.getUserByChairID(SDBModel.getMyChairID());
				if (SDBModel.getGameStatus() == ApiSdb.gameStatus.NONE &&
					user.userStatus != ApiRoom.userStatusEnum.READY &&
					user.userStatus != ApiRoom.userStatusEnum.LOOK &&
					user.userStatus != ApiRoom.userStatusEnum.PLAYING &&
					SDBModel.getCurBureau() < SDBModel.getMaxBureau() &&
					SDBModel.getMyChairID() < SDBModel.getChairCount()) {
					this.readyButton.active = true;
				} else {
					this.readyButton.active = false;
				}
				this.onTuoGuanSwitch();
				// if (SDBModel.getMyChairID() >= SDBModel.getChairCount()) {
				this.showSitDownButton();
				// }
				if (user &&
					user.userStatus == ApiRoom.userStatusEnum.LOOK &&
					msg.data.fromChairID < SDBModel.getChairCount() &&
					msg.data.toChairID >= SDBModel.getChairCount()) {
					SDBModel.pourScore(msg.data.fromChairID, 0);
				}
				let bg = cc.find('Setting/bg', this.node);
				if (msg.data.uid == UserModel.getData('uid') && !!this.menuLayList && this.menuLayList.active) {
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
			if (msg.type === ApiSdb.GAME_BUREAU_PUSH) {
				this.btnBackHall.active = false;
				this._yuYinShow();
				this.bureauLabel.string = '局数：' + SDBModel.getCurBureau() + '/' + SDBModel.getMaxBureau();
				let unionID = SDBModel.isUnionCreate() ? SDBModel.getRoomCreatorByKey('unionID') : null;
				let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
				cc.find('copy', this.node).active = SDBModel.getCurBureau() == 0 && !!isShowInvite;
				cc.find('invite', this.node).active = SDBModel.getCurBureau() == 0 && !!isShowInvite;
				// cc.find('backhall', this.node).active = (SDBModel.getCurBureau() == 0);
				let bg = cc.find('Setting/bg', this.node);
				let takeSeat = SDBModel.checkUserTakeSeat(SDBModel.getMyChairID());
				if (!!this.menuLayList &&
					!!this.menuLayList.active &&
					takeSeat) {
					this.showSettingBg();
				}
			} else if (msg.type === ApiSdb.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus == ApiSdb.gameStatus.NONE) {
					this.onTuoGuanSwitch();
				}
				this._yuYinShow();
				let user = SDBModel.getUserByChairID(SDBModel.getMyChairID());
				if (SDBModel.getGameStatus() == ApiSdb.gameStatus.NONE &&
					user.userStatus != ApiRoom.userStatusEnum.READY &&
					user.userStatus != ApiRoom.userStatusEnum.LOOK &&
					user.userStatus != ApiRoom.userStatusEnum.PLAYING &&
					SDBModel.getCurBureau() < SDBModel.getMaxBureau() &&
					SDBModel.getMyChairID() < SDBModel.getChairCount()) {
					this.readyButton.active = true;
				} else {
					this.readyButton.active = false;
				}
				if (SDBModel.getMaxBureau() == "自由局" &&
					SDBModel.getMyChairID() != SDBModel.getBankerChairID() &&
					msg.data.gameStatus == ApiSdb.gameStatus.NONE &&
					SDBModel.getMyChairID() < SDBModel.getChairCount()) {
					// cc.find('backhall', this.node).active = true;
				} else {
					// cc.find('backhall', this.node).active = false;
				}
			} else if (msg.type === ApiSdb.GAME_END_PUSH) {
				UserModel.setData('roomID', '');
				if (msg.data.result.length > 0) {
					msg.data.enterHall = this.enterHall.bind(this);
					msg.data.path = 'res/prefab/SDBResult';
					msg.data.bundle = Enums.bundleType.SDB;
					AssetsManager.createDialog(msg.data);
				} else {
					this.enterHall();
				}
			} else if (msg.type === ApiSdb.GAME_TRUST_PUSH) {
				if (msg.data.chairID == SDBModel.getMyChairID()) {
					/* cc.find('TrustLabel', this.node).active = msg.data.trust; */
					cc.find('Tuoguan', this.node).active = msg.data.trust;
				}
			} else if (msg.type === ApiSdb.GAME_REVIEW_PUSH) {
				if (msg.data.list.length != 0) {
					msg.data.path = 'res/prefab/SDBReview';
					msg.data.bundle = Enums.bundleType.SDB;
					AssetsManager.createDialog(msg.data);
				} else {
					AssetsManager.tipDialog('没有数据');
				}
			} else if (msg.type === ApiSdb.GAME_SEND_CARDS_PUSH) {
				this.showTestCard()
			}
		} else if (route === 'ReconnectSuccess') {
			// console.log('断线重连=====================');
			this.onReconnectCheck();
		} else if (route == 'UpdateGameBg') { } else if (route === 'SelfEntryRoomPush') {
			if (msg.gameType != SDBModel.getBundleType()) {
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
			if (!SDBModel.getRoomID() ||
				data.roomID === SDBModel.getRoomID()) {
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
			if (node.getComponent('SDBHead').getChairID() == chairID) {
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
		let chairCount = SDBModel.getChairCount();
		let index = (chairID + chairCount - SDBModel.getMyChairID()) % chairCount;
		return this.cardsNodeArray[index];
	},

	/*
	 * 玩家准备推送
	 */
	userReadyPush(chairID) {
		if (chairID == SDBModel.getMyChairID()) {
			this.readyButton.active = false;
			// let bg = cc.find('Setting/Layout/bg', this.node);

			if (!!this.menuLayList && this.menuLayList.active) {
				this.showSettingBg();
			}
		}
	},

	onReadyClick(event, param) {

		ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify(true));
		this.readyButton.active = false;
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

	onDestroy() {
		SDBModel.onDestroy();
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

	enterHall() {
		let roomCreatorInfo = SDBModel.getRoomCreator();
		let isUnionCreate = roomCreatorInfo.creatorType == Enums.roomCreatorType.UNION_CREATE;
		let unionID = !!isUnionCreate ? roomCreatorInfo.unionID : null;
		SubManager.exitBundle(unionID);
	},

	showDissButton() {
		let user = SDBModel.getUserByChairID(SDBModel.getMyChairID());
		this.btnDismiss.active = SDBModel.getCurBureau() > 0 && user.chairID < SDBModel.getChairCount() && !SDBModel.getGameRuleByKey('canNotDissmiss');
		this.btnExit.active = SDBModel.getCurBureau() == 0 || user.chairID >= SDBModel.getChairCount();
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
		let users = SDBModel.getLookOnUsers();
		if (users.length == 0) {
			AssetsManager.tipDialog('暂无观战玩家！');
			return;
		}
		AssetsManager.standDialog({
			users: users
		});
	},

	onSwitchClick() {

		this.showDissButton()
		this.showSettingBg()
	},

	onSettingClick() {
		this._onMenuCloseClick()
		AssetsManager.setDialog({
			type: 'duoren',
			gameType: Enums.bundleType.SDB,
			musicType: Enums.bundleType.POKER,
		});
		this.showSettingBg();
	},

	onRuleClick() {
		this._onMenuCloseClick()
		let node = cc.find('menu/Layout/bg/rule_help', this.node);
		if (CCUtil.clickInterval(node, 0.5)) return;
		AssetsManager.tableDialog({
			gameRule: SDBModel.getGameRule(),
		});
	},

	onTrustClick() {
		this._onMenuCloseClick()
		ApiRoom.gameMessageNotify(ApiSdb.gameTrushNotify(true));
	},

	onCancelTuoguan() {

		ApiRoom.gameMessageNotify(ApiSdb.gameTrushNotify(false));
	},

	onCopyRoomID() {

		let str = ConfigModel.getRoomShare(Enums.bundleType.SDB, SDBModel.getRoomID());
		NativeUtil.copyText(str);
	},

	onInviteFriend() {

		let gameRule = SDBModel.getGameRule();
		gameRule = gameRule || {};
		let roomId = SDBModel.getRoomID();
		gameRule.roomId = roomId;
		let share = ConfigModel.getRoomRuleShare(gameRule);
		// console.log('测试-分享', share);
		NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
	},

	onReview() {
		this._onMenuCloseClick()
		ApiRoom.gameMessageNotify(ApiSdb.gameReviewNotify());
	},

	getHeadInSeat() {
		let players = {
			node: [],
			cid: []
		}
		for (let node of this.headNodeArray) {
			//节点显示则为有人
			if (!node.active) continue;
			if (!node.getComponent('SDBHead')) continue;
			players.node.push(node);
			players.cid.push(node.getComponent('SDBHead').getChairID());
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

	onChat(fromChairID, toChairID, msg) {

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
		this._playingSeat.getComponent("SDBHead").setVoice(false);
		this._playingSeat = null;
	},

	onRefrush(event) {
		this._onMenuCloseClick()
		if (CCUtil.clickInterval(event.target, 10, true)) return;
		AssetsManager.tipDialog('刷新界面可以修复游戏显示问题');
		// console.clash("sangong-onRefrush", SDBModel.getRoomData());
		this.messageCallbackHandler('ReconnectSuccess');
	},

	setHeadAndCard() {
		this.headNodeArray = [];
		this.cardsNodeArray = [];
		let chairCount = SDBModel.getGameRule().maxPlayerCount;
		let choosedArray = [1, 2, 4, 5, 6, 7, 8, 10]
		if (chairCount == 6) {
			choosedArray = [1, 2, 4, 6, 8, 10];
		} else if (chairCount == 10) {
			choosedArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
		}
		for (let i = 0; i < chairCount; ++i) {
			let headNode = this.node.getChildByName('Head' + choosedArray[i]);
			let cardsNode = this.node.getChildByName('Cards' + choosedArray[i]);
			this.headNodeArray.push(headNode);
			headNode.getComponent('SDBHead').setIndex(i);
			this.addHeadClickEvent(headNode)
			this.cardsNodeArray.push(cardsNode);
			cardsNode.getComponent('SDBCards').setIndex(i);
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
		let curBureau = SDBModel.getCurBureau();
		let maxBureau = SDBModel.getMaxBureau();
		let canEnter = SDBModel.getGameRuleByKey('canEnter') && maxBureau != curBureau;
		this.btn_zuoxia.active = SDBModel.getMyChairID() >= SDBModel.getChairCount() &&
			(!!canEnter || curBureau == 0) &&
			SDBModel.checkHaveEmptySeat();
	},

	/**坐下按钮响应 */
	onBtnSitDown() {
		/**检查是否还有空位，有就发送坐下命令 */
		let chairID = SDBModel.getCanSitDownChairID();
		if (chairID == -1 || !this.headNodeArray[chairID]) {
			AssetsManager.tipDialog('没有座位可以坐下！');
			// this.btn_zuoxia.active = false;
			return;
		}
		let head = this.headNodeArray[chairID].getComponent("SDBHead");
		if (!head) return;
		// console.log('找到座位坐下', chairID);
		head.onSeatClick();
	},

	showTest() {
		let tmp = UserModel.getData("isTest")
		cc.find("Setting/btn_test", this.node).active = false // !!tmp;
	},

	showTestCard() {
		let tmp = UserModel.getData("isTest")
		if (!tmp) return;
		ApiRoom.gameMessageNotify(ApiSdb.gameLookCardsNotify(SDBModel.getMyChairID()));
	},

	onBtnTest() {
		let jushu = SDBModel.getCurBureau()
		if (!SDBModel.isInSeat() || jushu <= 0) {
			return;
		}
		let gameStatus = SDBModel.getGameStatus()
		if (gameStatus <= ApiSdb.gameStatus.POUR_SCORE || gameStatus === ApiSdb.gameStatus.RESULT) {
			// AssetsManager.tipDialog('请在发牌后再进行操作');
			return;
		}
	},

	onLocationClick() {
		this._onMenuCloseClick();
		AssetsManager.locationDialog({
			users: SDBModel.getPlayerTakeSeats(),
			chairCount: SDBModel.getChairCount(),
			fangzuobi: SDBModel.getGameRuleByKey('fangzuobi')
		})
	},

	onChatClick() {
		let params = {
			gameRule: SDBModel.getGameRule(),
			chat: (chat) => {
				ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
			}
		}
		AssetsManager.chatDialog(params);
	},

	// 邀请好友
	onShowInvite() {
		AssetsManager.friendDialog({
			gameRule: SDBModel.getGameRule(),
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