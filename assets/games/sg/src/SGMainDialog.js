const SGModel = require('./SGModel');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiSg = require('./ApiSg');
const MessageCallback = require('../../../src/utils/MessageCallback');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const SubManager = require('../../../src/utils/SubManager');
const UserModel = require('../../../src/model/UserModel');
const ApiHall = require('../../../src/api/ApiHall');
const Enums = require('../../../src/const/Enums');
const AudioUtil = require('../../../src/utils/AudioUtil');
const SGLogic = require('./SGLogic');
const CCUtil = require('../../../src/utils/CCUtil');
const Codes = require('../../../src/const/Codes');
const ConfigModel = require('../../../src/model/ConfigModel');
const Events = require('../../../src/const/Events');

cc.Class({
	extends: cc.Component,
	properties: {
		readyButton: cc.Node,
		showCardsButton: cc.Node,
		roomIdLabel: cc.Label,
		bureauLabel: cc.Label,
		txt_gameName: cc.Label,
		btnZuoXia: cc.Node,
		btnLocation: cc.Node,
		btnLookOn: cc.Node,
		lookOnEffect: cc.Node,
		menuLay: cc.Node,
		menuLayList: cc.Node,
		menuSprite: cc.Sprite,
		btnTest: cc.Node,
		pourArea: cc.Node,
		flyGold: cc.Prefab,
		poolScoreLbl: cc.Label,
		btnBackHall: cc.Node,
		btnYuYin: cc.Node,
		btnDismiss: cc.Node,
		btnExit: cc.Node,
		canNotDismissBar: cc.Node,

		_pourGolds: [],
	},

	onLoad() {
		AssetsManager.init(this.node);
		this.headNodeArray = [];
		this.cardsNodeArray = [];
		// 菜单点击
		this.menuLay.active = false
		SGModel.init(); /* 保存数据 */
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
		this.scheduleOnce(() => {
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

	// 游戏初始化短线重连
	gameInit(data) {
		// 定时器
		this.unscheduleAllCallbacks();
		// 获得头像信息和牌
		this.setHeadAndCard();
		this.roomIdAndLable(data);
		let user = SGModel.getUserByChairID(SGModel.getMyChairID())
		this.buttonActive(user);
		cc.find('Tuoguan', this.node).active = SGModel.getTrustByChairID(SGModel.getMyChairID());
		this.onTuoGuanSwitch();
		let unionID = SGModel.isUnionCreate() ? SGModel.getRoomCreatorByKey('unionID') : null;
		let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
		cc.find('copy', this.node).active = SGModel.getCurBureau() == 0 && !!isShowInvite;
		cc.find('invite', this.node).active = SGModel.getCurBureau() == 0 && !!isShowInvite;
		this.btnLocation.active = SGModel.getGameRuleByKey('maxPlayerCount') < 6 && !!SGModel.getGameRuleByKey('showGps');
		this.btnLookOn.active = !!SGModel.getGameRuleByKey('canWatch');
		this.btnBackHall.active = SGModel.getCurBureau() == 0 && SGModel.isUnionCreate();
		if (this.canNotDismissBar) this.canNotDismissBar.active = SGModel.getGameRuleByKey("canNotDissmiss");
		this._yuYinShow();
		this.verifyZuobi(user);
		this.showSitDownButton();
		this.showTest();
		this.showDissButton();
		this.pourGoldsSync();
	},

	_yuYinShow() {
		let isInSeat = SGModel.isInSeat();
		let yuyin = SGModel.getGameRuleByKey('yuyin');
		this.btnYuYin.active = !!isInSeat && !!yuyin && ConfigModel.getData('voiceSpeaker');
	},

	pourGoldsSync() {
		this.poolScoreLbl.string = `奖池:${SGModel.getTotalPoolScore()}`;
		this._pourGolds = [];
		this.pourArea.destroyAllChildren();
		let pourList = SGModel.getPourList();
		pourList.forEach(element => {
			for (let index = 0; index < 5; index++) {
				let gold = cc.instantiate(this.flyGold);
				let rPos = this.getPourGoldRandomPos();
				gold.parent = this.pourArea;
				gold.setPosition(rPos);
			}
		});
	},

	getPourGoldRandomPos() {
		let areaSize = this.pourArea.getContentSize();
		let nodeSize = cc.size(this.flyGold.data.width, this.flyGold.data.height);
		let contentSize = cc.size(areaSize.width - nodeSize.width - 50, areaSize.height - nodeSize.height - 50);
		let xRandom = (Math.random() * (contentSize.width / 2)) * Math.pow(-1, Math.floor(Math.random() * 3));
		let yRandom = (Math.random() * (contentSize.height / 2)) * Math.pow(-1, Math.floor(Math.random() * 3));
		return cc.v2(xRandom, yRandom);
	},

	showPourGold(node) {
		AssetsManager.playEffect({
			path: 'res/audio/main/fly_gold',
			bundle: Enums.bundleType.SG
		});
		let startPos = CCUtil.postionConvert(node, this.pourArea);
		for (let index = 0; index < 5; index++) {
			let endPos = this.getPourGoldRandomPos();
			let gold = cc.instantiate(this.flyGold);
			gold.parent = this.pourArea;
			gold.setPosition(startPos);
			cc.tween(gold)
				.delay(0.02 * index)
				.to(0.25, {
					position: cc.v3(endPos)
				})
				.start();

		}
	},

	// 邀请按钮搓牌按钮的显示与隐藏
	buttonActive(user) {
		if (!user) return;
		if (SGModel.getGameStatus() == ApiSg.gameStatus.NONE &&
			user.userStatus != ApiRoom.userStatusEnum.READY &&
			user.userStatusEnum != ApiRoom.userStatusEnum.LOOK &&
			user.userStatus != ApiRoom.userStatusEnum.PLAYING &&
			SGModel.getCurBureau() < SGModel.getMaxBureau() &&
			SGModel.getMyChairID() < SGModel.getChairCount()
		) {
			this.readyButton.active = true
		} else {
			this.readyButton.active = false
		}

		this.showCardsButton.active = false
		cc.find('cuopai', this.node).active = false
		if (SGModel.getGameStatus() == ApiSg.gameStatus.SHOW_CARDS) {
			let cards = SGModel.getHandCardsByChairID(SGModel.getMyChairID());
			let carIDD = SGModel.getShowCards(SGModel.getMyChairID())
			let myIDD = SGModel.getIsPlayingByChairID(SGModel.getMyChairID())
			if (!carIDD && myIDD) {
				this.showCardsButton.active = true;
				/* TODO 服务器数据修改
				cc.find('cuopai', this.node).active = SGModel.getGameRule().cuopai; */
			}
		}
	},
	roomIdAndLable(data) {
		this.roomIdLabel.string = `房号:${SGModel.getRoomID()}`
		this.bureauLabel.string = `局数:${SGModel.getCurBureau()} / ${SGModel.getMaxBureau()}`
		let gameName = ConfigModel.getBundleConfig(data.gameRule.gameType)
		this.txt_gameName.string = `游戏:${gameName.name}`
	},

	onTuoGuanSwitch() {
		let user = SGModel.getUserByChairID(SGModel.getMyChairID());
		if (SGModel.getMyChairID() >= SGModel.getChairCount()) {
			this.lookOnEffect.active = user && user.userStatus == ApiRoom.userStatusEnum.LOOK;
		} else {
			this.lookOnEffect.active = user && user.userStatus == ApiRoom.userStatusEnum.LOOK;
		}
	},

	verifyZuobi(roomUserInfo) {
		if (!SGModel.getGameRuleByKey('fangzuobi')) return;
		if (!roomUserInfo || roomUserInfo.chairID >= SGModel.getChairCount()) return;
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
		for (let i = 0; i < SGModel.getChairCount(); ++i) {
			let user = SGModel.getUserByChairID(i);
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
	noClick(node) {
		if (CCUtil.clickInterval(node, 0.5)) return;
	},

	noWatch() {
		if (SGModel.getMyChairID() >= SGModel.getChairCount()) {
			AssetsManager.tipDialog('观战玩家无法查看详细信息');
			return;
		}
	},

	addHeadClickEvent(node) {
		if (node.hasEventListener(cc.Node.EventType.TOUCH_START)) return;
		node.on(cc.Node.EventType.TOUCH_START, () => {
			this.noWatch();
			this.noClick(node);
			let logic = node.getComponent('SGHead');
			let user = SGModel.getUserByChairID(logic.getChairID());
			// console.log("user", user)
			let showHeadDetail = () => {
				try {
					let params = {
						fromChairID: SGModel.getMyChairID(),
						toChairID: logic.getChairID(),
						canSendGift: SGModel.getMyChairID() < SGModel.getChairCount(),
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
			if (!!SGModel.getUserTest() && !!user && !!user.userInfo.uid && !SGModel.isInWatch()) {
				AssetsManager.createDialog({
					user: user,
					callback: showHeadDetail,
					bundle: Enums.bundleType.SG,
					path: "res/prefab/SGTestSelect",
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
				if (msg.data.chairID === SGModel.getMyChairID()) { }
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				this.showHeadNode(msg.data.roomUserInfo.chairID);
				this.verifyZuobi(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				this.hideHeadNode(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				this.userReadyPush(msg.data.chairID);
			} else if (msg.type === ApiRoom.GAME_END_PUSH) { } else if (msg.type === ApiRoom.ROOM_DISMISS_PUSH) { } else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
				msg.data.myChairID = SGModel.getMyChairID();
				AssetsManager.nisDialog(msg.data);
			} else if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
				if (msg.data.code != 0) {
					if (msg.data.uid == UserModel.getData('uid')) {
						AssetsManager.tipDialog(Codes[msg.data.code]);
					}
					return;
				};
				let user = SGModel.getUserByChairID(SGModel.getMyChairID());
				if (SGModel.getGameStatus() == ApiSg.gameStatus.NONE &&
					user.userStatus != ApiRoom.userStatusEnum.READY &&
					user.userStatus != ApiRoom.userStatusEnum.LOOK &&
					user.userStatus != ApiRoom.userStatusEnum.PLAYING &&
					SGModel.getCurBureau() < SGModel.getMaxBureau() &&
					SGModel.getMyChairID() < SGModel.getChairCount()) {
					this.readyButton.active = true;
				} else {
					this.readyButton.active = false;
				}
				this.onTuoGuanSwitch();
				this.showSitDownButton();
				if (user &&
					user.userStatus == ApiRoom.userStatusEnum.LOOK &&
					msg.data.fromChairID < SGModel.getChairCount() &&
					msg.data.toChairID >= SGModel.getChairCount()) {
					SGModel.pourScore(msg.data.fromChairID, 0);
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
			if (msg.type === ApiSg.GAME_BUREAU_PUSH) {
				this.btnBackHall.active = false;
				this._yuYinShow();
				this.bureauLabel.string = '局数：' + SGModel.getCurBureau() + '/' + SGModel.getMaxBureau();
				let unionID = SGModel.isUnionCreate() ? SGModel.getRoomCreatorByKey('unionID') : null;
				let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
				cc.find('copy', this.node).active = SGModel.getCurBureau() == 0 && !!isShowInvite;
				cc.find('invite', this.node).active = SGModel.getCurBureau() == 0 && !!isShowInvite;
				// cc.find('backhall', this.node).active = (SGModel.getCurBureau() == 0);
			} else if (msg.type === ApiSg.GAME_STATUS_PUSH) {
				if (msg.data.gameStatus == ApiSg.gameStatus.NONE) {
					this.pourGoldsSync();
					this.onTuoGuanSwitch();
				}
				this._yuYinShow();
				if (msg.data.gameStatus == ApiSg.gameStatus.SHOW_CARDS) {
					this.showCardsButton.active = SGModel.getIsPlayingByChairID(SGModel.getMyChairID());
					cc.find('cuopai', this.node).active = SGModel.getIsPlayingByChairID(SGModel.getMyChairID()) && SGModel.getGameRule().cuopai;
				} else {
					this.showCardsButton.active = false;
					cc.find('cuopai', this.node).active = false;
				}
				let user = SGModel.getUserByChairID(SGModel.getMyChairID());
				if (SGModel.getGameStatus() == ApiSg.gameStatus.NONE &&
					user.userStatus != ApiRoom.userStatusEnum.READY &&
					user.userStatus != ApiRoom.userStatusEnum.LOOK &&
					user.userStatus != ApiRoom.userStatusEnum.PLAYING &&
					SGModel.getCurBureau() < SGModel.getMaxBureau() &&
					SGModel.getMyChairID() < SGModel.getChairCount()) {
					this.readyButton.active = true;
				} else {
					this.readyButton.active = false;
				}
			} else if (msg.type === ApiSg.GAME_POUR_SCORE_PUSH) {
				// console.log('玩家下分', msg);
				this.poolScoreLbl.string = `奖池:${msg.data.jackpotTotalPoints}`;
			} else if (msg.type === ApiSg.GAME_SHOW_CARDS_PUSH) {
				if (msg.data.chairID == SGModel.getMyChairID()) {
					if (msg.data.cuopai) {
						this.showCardsButton.active = true;
						cc.find('cuopai', this.node).active = true;
					} else {
						this.showCardsButton.active = false;
						cc.find('cuopai', this.node).active = false;
					}
				}
			} else if (msg.type === ApiSg.GAME_END_PUSH) {
				UserModel.setData('roomID', '');
				if (msg.data.result.length > 0) {
					msg.data.enterHall = this.enterHall.bind(this);
					msg.data.path = 'res/prefab/SGResult';
					msg.data.bundle = Enums.bundleType.SG;
					AssetsManager.createDialog(msg.data);
				} else {
					this.enterHall();
				}
			} else if (msg.type === ApiSg.GAME_TRUST_PUSH) {
				if (msg.data.chairID == SGModel.getMyChairID()) {
					/* cc.find('TrustLabel', this.node).active = msg.data.trust; */
					cc.find('Tuoguan', this.node).active = msg.data.trust;
				}
			} else if (msg.type === ApiSg.GAME_REVIEW_PUSH) {
				if (msg.data.list.length != 0) {
					msg.data.path = 'res/prefab/SGReview';
					msg.data.bundle = Enums.bundleType.SG;
					AssetsManager.createDialog(msg.data);
				} else {
					AssetsManager.tipDialog('没有数据');
				}
			} else if (msg.type === ApiSg.GAME_RESULT_PUSH) {
				cc.find('CuopaiNode', this.node).destroyAllChildren();
				/**通比飞金币 */
				let muchness = msg.data.result.muchness;
				if (muchness && Array.isArray(muchness) && muchness.length > 0) {
					for (let i = 0; i < muchness.length; i++) {
						const userWin = muchness[i];
						if (!userWin || !Array.isArray(userWin) || i + 1 > userWin.length - 1) {
							continue
						}
						let hNode = this.getHeadNodeByChairID(i)
						if (!hNode || !hNode.active) continue;
						for (let j = i + 1; j < userWin.length; j++) {
							const win = userWin[j];
							if (win > 0) {
								hNode.getComponent('SGHead').goldMove(i, j)
							} else if (win < 0) {
								this.scheduleOnce(() => {
									hNode.getComponent('SGHead').goldMove(j, i)
								}, 1)
							}
						}
					}
				}
			} else if (msg.type === ApiSg.GAME_SEND_CARDS_PUSH) {
				this.showTestCard()
			}
		} else if (route === 'ReconnectSuccess') {
			// console.log('断线重连=====================');
			this.onReconnectCheck();
		} else if (route == 'UpdateGameBg') { } else if (route === 'SelfEntryRoomPush') {
			if (msg.gameType != SGModel.getBundleType()) {
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
			if (!SGModel.getRoomID() ||
				data.roomID === SGModel.getRoomID()) {
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
			if (node.getComponent('SGHead').getChairID() == chairID) {
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
		let chairCount = SGModel.getChairCount();
		let index = (chairID + chairCount - SGModel.getMyChairID()) % chairCount;
		return this.cardsNodeArray[index];
	},

	/*
	 * 玩家准备推送
	 */
	userReadyPush(chairID) {
		if (chairID == SGModel.getMyChairID()) {
			this.readyButton.active = false;
		}
	},

	onReadyClick(event, param) {

		ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify(true));
		this.readyButton.active = false;
	},

	onShowCardsClick(event, param) {

		if (param == 0) {
			ApiRoom.gameMessageNotify(ApiSg.gameShowCardsNotify());
		} else {
			let card = SGModel.getHandChairCardByIndex(SGModel.getMyChairID(), 2);
			// console.log('搓牌', card);
			if (!!card) {
				cc.find('CuopaiNode', this.node).destroyAllChildren();
				let params = {
					parent: cc.find('CuopaiNode', this.node),
					card: card,
					cards: SGModel.getHandCardsByChairID(SGModel.getMyChairID()),
					type: SGLogic.getCardColor(card),
					val: SGLogic.getCardNumber(card),
					cb: () => {
						ApiRoom.gameMessageNotify(ApiSg.gameShowCardsNotify());
					},
				};
				AssetsManager.rubDialog(params);
			}
		}
		cc.find('cuopai', this.node).active = false;
		this.showCardsButton.active = false;
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

	onExitClick(event, param) {
		this._onMenuCloseClick();
		if (!UserModel.isInRoom()) {
			this.enterHall();
			return;
		}
		if (!!SGModel.getGameStarted() && SGModel.getMyChairID() < SGModel.getChairCount()) {
			AssetsManager.tipDialog('游戏进行中，不能退出房间！');
			return;
		}
		ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
	},

	onDestroy() {
		SGModel.onDestroy();
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
		MessageCallback.removeListener('OnGameOnceAgain', this);
		MessageCallback.removeListener('TestClickReq', this)
	},

	enterHall() {
		let roomCreatorInfo = SGModel.getRoomCreator();
		let isUnionCreate = roomCreatorInfo.creatorType == Enums.roomCreatorType.UNION_CREATE;
		let unionID = !!isUnionCreate ? roomCreatorInfo.unionID : null;
		SubManager.exitBundle(unionID);
	},

	showDissButton() {
		let user = SGModel.getUserByChairID(SGModel.getMyChairID());
		this.btnDismiss.active = SGModel.getCurBureau() > 0 && user.chairID < SGModel.getChairCount() && !SGModel.getGameRuleByKey('canNotDissmiss');
		this.btnExit.active = SGModel.getCurBureau() == 0 || user.chairID >= SGModel.getChairCount();
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
		let users = SGModel.getLookOnUsers();
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
		this._onMenuCloseClick();
		AssetsManager.setDialog({
			type: 'duoren',
			gameType: Enums.bundleType.SG,
			musicType: Enums.bundleType.CIRCLE,
		});
	},

	onRuleClick() {
		this._onMenuCloseClick();
		let node = cc.find('RoomInfo', this.node);
		if (CCUtil.clickInterval(node, 0.5)) return;
		AssetsManager.tableDialog({
			gameRule: SGModel.getGameRule(),
		});
	},

	onTrustClick() {
		this._onMenuCloseClick();
		ApiRoom.gameMessageNotify(ApiSg.gameTrushNotify(true));
	},

	onCancelTuoguan() {

		ApiRoom.gameMessageNotify(ApiSg.gameTrushNotify(false));
	},

	onCopyRoomID() {

		let str = ConfigModel.getRoomShare(Enums.bundleType.SG, SGModel.getRoomID());
		NativeUtil.copyText(str);
	},

	onInviteFriend() {

		let gameRule = SGModel.getGameRule();
		gameRule = gameRule || {};
		let roomId = SGModel.getRoomID();
		gameRule.roomId = roomId;
		let share = ConfigModel.getRoomRuleShare(gameRule);
		// console.log('测试-分享', share);
		NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
	},

	onReview() {
		this._onMenuCloseClick();
		// this.onHideMenuClick();
		ApiRoom.gameMessageNotify(ApiSg.gameReviewNotify());
	},

	onChat(fromChairID, toChairID, msg) { },

	getHeadInSeat() {
		let players = {
			node: [],
			cid: []
		}
		for (let node of this.headNodeArray) {
			//节点显示则为有人
			if (!node.active) continue;
			if (!node.getComponent('SGHead')) continue;
			players.node.push(node);
			players.cid.push(node.getComponent('SGHead').getChairID());
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
		this._playingSeat.getComponent("SGHead").setVoice(false);
		this._playingSeat = null;
	},

	onRefrush(event) {
		// this.onHideMenuClick();
		this._onMenuCloseClick();
		if (CCUtil.clickInterval(event.target, 10, true)) return;
		AssetsManager.tipDialog('刷新界面可以修复游戏显示问题');
		this.messageCallbackHandler('ReconnectSuccess');
	},

	setHeadAndCard() {
		this.headNodeArray = [];
		this.cardsNodeArray = [];
		let chairCount = SGModel.getChairCount();
		let choosedArray = [1, 2, 3, 5, 6, 7, 9, 10];
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
			this.headNodeArray[index].getComponent('SGHead').setIndex(this, index);
			this.cardsNodeArray[index].getComponent('SGCards').setIndex(index);
			this.addHeadClickEvent(this.headNodeArray[index]);
		}
	},

	/**给没座位的人显示坐下按钮 */
	showSitDownButton() {
		let curBureau = SGModel.getCurBureau();
		let maxBureau = SGModel.getMaxBureau();
		let canEnter = SGModel.getGameRuleByKey('canEnter') && maxBureau != curBureau;
		// (!!canEnter || curBureau == 0) &&
		this.btnZuoXia.active = SGModel.getMyChairID() >= SGModel.getChairCount() &&
			(!!canEnter || curBureau == 0) &&
			SGModel.checkHaveEmptySeat();
	},

	/**坐下按钮响应 */
	onBtnSitDown() {
		/**检查是否还有空位，有就发送坐下命令 */
		let chairID = SGModel.getCanSitDownChairID();
		if (chairID == -1 || !this.headNodeArray[chairID]) {
			AssetsManager.tipDialog('没有座位可以坐下！');
			// this.btnZuoXia.active = false;
			return;
		}
		let head = this.headNodeArray[chairID].getComponent("SGHead");
		if (!head) return;
		// console.log('找到座位坐下', chairID);
		head.onSeatClick();
	},

	onLocationClick() {
		this._onMenuCloseClick()
		let users = SGModel.getPlayerTakeSeats();
		AssetsManager.locationDialog({
			users: users,
			chairCount: SGModel.getChairCount(),
			fangzuobi: SGModel.getGameRuleByKey('fangzuobi')
		})
	},

	onChatClick() {
		let params = {
			gameRule: SGModel.getGameRule(),
			chat: (chat) => {
				ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
			}
		}
		AssetsManager.chatDialog(params);
	},

	onHideMenuClick() {
		this.menuLay.active = false;
		AssetsManager.loadSpriteFrame({
			path: 'sprite/common/menu',
			sprite: this.menuSprite
		});
	},

	onBtnTest() {
		let jushu = SGModel.getCurBureau()
		if (!SGModel.isInSeat() || jushu <= 0) {
			return;
		}
		AssetsManager.createDialog({
			bundle: Enums.bundleType.SG,
			path: "res/prefab/SGtest"
		})
	},

	showTest() {
		this.btnTest.active = false //!!UserModel.getData('isTest');
	},

	showTestCard() {
		let tmp = UserModel.getData("isTest")
		if (!tmp) return;
		ApiRoom.gameMessageNotify(ApiSg.gameLookCardsNotify(SGModel.getMyChairID()));
	},
	// 邀请好友
	onShowInvite() {
		AssetsManager.friendDialog({
			gameRule: SGModel.getGameRule(),
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