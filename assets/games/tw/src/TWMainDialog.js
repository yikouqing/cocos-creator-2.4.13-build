const TWModel = require('./TWModel');
const TWLogic = require('./TWLogic');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiTw = require('./ApiTw');
const MessageCallback = require('../../../src/utils/MessageCallback');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const SubManager = require('../../../src/utils/SubManager');
const UserModel = require('../../../src/model/UserModel');
const ApiHall = require('../../../src/api/ApiHall');
const Enums = require('../../../src/const/Enums');
const AudioUtil = require('../../../src/utils/AudioUtil');
const Utils = require('../../../src/utils/Utils');
const Codes = require('../../../src/const/Codes');
const ConfigModel = require('../../../src/model/ConfigModel');
const NetworkLogic = require("../../../src/utils/NetworkLogic")
const CCUtil = require('../../../src/utils/CCUtil');
const Events = require('../../../src/const/Events');

cc.Class({
	extends: cc.Component,
	properties: {
		robBankButtons: cc.Node,
		pourScoresButtons: cc.Node,
		readyButton: cc.Node,
		roomIdLabel: cc.Label,
		bureauLabel: cc.Label,
		txt_gameName: cc.Label,
		sortCardWidgetPrefab: cc.Prefab,
		guaiPaiTipWidgetPrefab: cc.Prefab,
		maipaiNode: cc.Node,
		btn_zuoxia: cc.Node,
		btnLocation: cc.Node,
		btnLookOn: cc.Node,
		btnTuoGuan: cc.Node,
		sortCardNode: cc.Node,
		kaishiAni: sp.Skeleton,
		quanleida: sp.Skeleton,
		allResNode: cc.Node,
		littleResNode: cc.Node,
		washCardNode: cc.Node,
		lookOnEffect: cc.Node,
		menuLay: cc.Node,
		menuLayList: cc.Node,
		btnBackHall: cc.Node,
		btnYuYin: cc.Node,
		btnDismiss: cc.Node,
		btnExit: cc.Node,
		canNotDismissBar: cc.Node,

		_lookOnEffect: null,
		_lookOnScoreEffect: null,
	},

	onLoad() {
		this._refrushType = 100
		AssetsManager.init(this.node);
		this.headNodeArray = [];
		this.cardsNodeArray = [];
		// 菜单点击
		this.menuLay.active = false
		TWModel.init(); /* 保存数据 */
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

		/**设置骨骼动画监听 */
		this.kaishiAni.setCompleteListener(() => {
			this.kaishiAni.node.active = false
		});
		this.quanleida.setCompleteListener(() => {
			this.quanleida.node.active = false
		})
		this.kaishiAni.node.active = false
		this.quanleida.node.active = false
	},

	_yuYinShow() {
		let isInSeat = TWModel.isInSeat();
		let yuyin = TWModel.getGameRuleByKey('yuyin');
		this.btnYuYin.active = !!isInSeat && !!yuyin && ConfigModel.getData('voiceSpeaker');
	},

	/*
	 * 游戏初始化
	 * 断线重连
	 */
	gameInit(data) {
		MessageCallback.emitMessage('RemoveGameResult');
		this.unscheduleAllCallbacks();
		this.cardsNodeArray.forEach(n => {
			n.active = false
		});
		this.setHeadAndCard();
		this.roomIdLabel.string = '房号：' + TWModel.getRoomID();
		this.bureauLabel.string = '局数：' + TWModel.getCurBureau() + '/' + TWModel.getMaxBureau();
		let gameName = ConfigModel.getBundleConfig(data.gameRule.gameType)
		this.txt_gameName.string = `游戏:${gameName.name}`
		let user = TWModel.getUserByChairID(TWModel.getMyChairID());
		if (user) {
			if (TWModel.getGameStatus() == ApiTw.gameStatus.NONE &&
				user.userStatus != ApiRoom.userStatusEnum.READY &&
				user.userStatus != ApiRoom.userStatusEnum.LOOK &&
				user.userStatus != ApiRoom.userStatusEnum.PLAYING &&
				TWModel.getCurBureau() < TWModel.getMaxBureau() &&
				TWModel.getMyChairID() < TWModel.getChairCount()) {
				this.readyButton.active = true;
				// console.trace("准备按钮显示")
			} else {
				this.readyButton.active = false;
			}
			if (TWModel.getGameStatus() == ApiTw.gameStatus.BAI_PAI) {
				if (TWModel.getIsPlayingByChairID(TWModel.getMyChairID())) {
					// this.scheduleOnce(this.onBaiPai.bind(this), 2);
					this.onBaiPai();
				}

			} else if (TWModel.getGameStatus() == ApiTw.gameStatus.ROB_BANK) {

			}
		}
		if (TWLogic.mapai) {
			this.setMaPaiNode();
		} else {
			this.maipaiNode.active = false;
		}
		this._yuYinShow();
		this.btnTuoGuan.active = TWModel.getGameRuleByKey("canTrust")
		cc.find('Tuoguan', this.node).active = TWModel.getTrustByChairID(TWModel.getMyChairID());
		this.onTuoGuanSwitch();
		// cc.find('Setting/TuoButton', this.node).active = TWModel.getGameRuleByKey("canTrust")
		// cc.find('Setting/Layout/TuoButton', this.node).active = false;
		let unionID = TWModel.isUnionCreate() ? TWModel.getRoomCreatorByKey('unionID') : null;
		let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
		cc.find('copy', this.node).active = TWModel.getCurBureau() == 0 && !!isShowInvite;
		cc.find('invite', this.node).active = TWModel.getCurBureau() == 0 && !!isShowInvite;
		cc.find('backhall', this.node).active = false //(TWModel.getCurBureau() == 0);
		// this.btnLookOn.active = !!TWModel.getGameRuleByKey('canWatch');
		if (this.canNotDismissBar) this.canNotDismissBar.active = TWModel.getGameRuleByKey("canNotDissmiss");
		this.btnBackHall.active = TWModel.getCurBureau() == 0 && TWModel.isUnionCreate();
		this.btnLocation.active = TWModel.getGameRuleByKey('maxPlayerCount') < 6 && TWModel.getGameRuleByKey("showGps")
		this.verifyZuobi(user);
		this.showSitDownButton();
		this.showTest();
		this.showDissButton();
		this.washCardNode.removeAllChildren()
		//如果有结算信息马上显示
		if (TWModel.getResult() && user && user.userStatus != ApiRoom.userStatusEnum.READY) {
			this.unscheduleAllCallbacks()
			this.destroySortCardWidet()
			let res = TWModel.getResult()
			let touSort = res.touSort
			let zhongSort = res.zhongSort
			let weiSort = res.weiSort

			// for (let i = 0; i < touSort.length; i++) {
			// 	const info = touSort[i];
			// 	/**找到节点 */
			// 	let cardNode = this.cardsNodeArray.find(n => {
			// 		let com = n.getComponent("TWCardItem")
			// 		return com.getChairID() === info.chairId
			// 	})

			// 	cardNode.getComponent("TWCardItem").setCardType2();
			// 	cardNode.getComponent("TWCardItem").showTouDao(res, false);
			// }

			// for (let i = 0; i < zhongSort.length; i++) {
			// 	const info = zhongSort[i];
			// 	/**找到节点 */
			// 	let cardNode = this.cardsNodeArray.find(n => {
			// 		let com = n.getComponent("TWCardItem")
			// 		return com.getChairID() === info.chairId
			// 	})
			// 	cardNode.getComponent("TWCardItem").showZhongDao(res, false);
			// }

			// for (let i = 0; i < weiSort.length; i++) {
			// 	const info = weiSort[i];
			// 	/**找到节点 */
			// 	let cardNode = this.cardsNodeArray.find(n => {
			// 		let com = n.getComponent("TWCardItem")
			// 		return com.getChairID() === info.chairId
			// 	})
			// 	cardNode.getComponent("TWCardItem").showWeiDao(res, false);
			// }

			// let teShuSort = res.teShuSort
			// teShuSort.forEach(tes => {
			// 	let cnode = this.cardsNodeArray.find(c => {
			// 		let com = c.getComponent("TWCardItem")
			// 		return com.getChairID() == tes.chairId
			// 	})
			// 	if (cc.isValid(cnode)) {
			// 		let com = cnode.getComponent("TWCardItem")
			// 		com.showMianbai(res)
			// 	}
			// });
			this.cardsNodeArray.forEach(n => {
				n.active = false
			});
			if (this.littleResNode.childrenCount === 0) {
				let data = {
					result: res
				}
				// console.log("结算=", data)
				data.path = 'res/prefab/TWResultDialog';
				data.bundle = Enums.bundleType.SSS;
				data.parent = this.littleResNode
				AssetsManager.createDialog(data);
				this.readyButton.active = true;
			}
		}
	},

	verifyZuobi(roomUserInfo) {
		if (!TWModel.getGameRule().fangzuobi) return;
		if (!roomUserInfo || roomUserInfo.chairID >= TWModel.getChairCount()) return;
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
		for (let i = 0; i < TWModel.getChairCount(); ++i) {
			let user = TWModel.getUserByChairID(i);
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

	/**设置显示马牌 */
	setMaPaiNode() {
		let url = "res/sprite/cards/" + TWLogic.mapai;
		AssetsManager.loadSpriteFrame({
			path: url,
			sprite: this.maipaiNode.getChildByName("card").getComponent(cc.Sprite),
			bundle: Enums.bundleType.SSS
		}, () => {
			this.maipaiNode.active = true;
		});
	},

	glassAnimal(cb) {
		AssetsManager.playEffect({
			path: 'res/audio/qld',
			bundle: Enums.bundleType.SSS
		});
		this.scheduleOnce(() => {
			AssetsManager.playEffect({
				path: 'res/audio/suiboli',
				bundle: Enums.bundleType.SSS
			});
		}, 1.7)
		this.quanleida.node.active = true
		this.quanleida.setAnimation(0, "quanleida", false)
	},

	addHeadClickEvent(node) {
		if (node.hasEventListener(cc.Node.EventType.TOUCH_START)) return;
		node.on(cc.Node.EventType.TOUCH_START, () => {
			if (CCUtil.clickInterval(node, 0.5)) return;
			let logic = node.parent.getComponent('TWHead');
			let tmp = UserModel.getData("isTest")
			if (tmp) {
				this.onBtnTest(logic.getChairID())
				return;
			}
			if (TWModel.getMyChairID() >= TWModel.getChairCount()) {
				AssetsManager.tipDialog('观战玩家无法查看详细信息');
				return;
			}
			let user = TWModel.getUserByChairID(logic.getChairID());
			try {
				let params = {
					fromChairID: TWModel.getMyChairID(),
					toChairID: logic.getChairID(),
					canSendGift: TWModel.getMyChairID() < TWModel.getChairCount(),
					avatar: user.userInfo.avatar,
					id: user.userInfo.uid,
					ip: user.userInfo.lastLoginIP,
					location: user.userInfo.location,
					gold: user.userInfo.score,
					name: user.userInfo.nickname,
				};
				AssetsManager.headDialog(params);
			} catch (e) { }

		}, this);
	},

	onTuoGuanSwitch() {
		this.lookOnEffect.destroyAllChildren();
		let user = TWModel.getUserByChairID(TWModel.getMyChairID());
		this.lookOnEffect.active = !!user && user.userStatus == ApiRoom.userStatusEnum.LOOK;
		return;
		if (TWModel.getMyChairID() >= TWModel.getChairCount()) {
			// console.log('玩家状态', user);
			if (user && user.userStatus == ApiRoom.userStatusEnum.LOOK) {
				if (!!this._lookOnEffect && cc.isValid(this._lookOnEffect)) return;

				this._lookOnEffect = null;
				this._lookOnScoreEffect = null;
				AssetsManager.loadAsset({
					path: 'prefab/effect/EffectLookOn',
					aType: cc.Prefab
				}, (as) => {
					if (!as || !cc.isValid(this.node) || cc.isValid(this._lookOnEffect)) return;
					this._lookOnEffect = cc.instantiate(as);
					this._lookOnEffect.parent = this.lookOnEffect;
				});
			} else {
				this.lookOnEffect.destroyAllChildren();
				this._lookOnEffect = null;
				this._lookOnScoreEffect = null;
			}
		} else {
			if (user && user.userStatus == ApiRoom.userStatusEnum.LOOK) {
				if (!!this._lookOnScoreEffect && cc.isValid(this._lookOnScoreEffect)) return;
				this.lookOnEffect.destroyAllChildren();
				this._lookOnEffect = null;
				this._lookOnScoreEffect = null;
				AssetsManager.loadAsset({
					path: 'prefab/effect/EffectScoreLess',
					aType: cc.Prefab
				}, (as) => {
					if (!as || !cc.isValid(this.node) || cc.isValid(this._lookOnScoreEffect)) return;
					this._lookOnScoreEffect = cc.instantiate(as);
					this._lookOnScoreEffect.parent = this.lookOnEffect;
				});
			} else {
				this.lookOnEffect.destroyAllChildren();
				this._lookOnEffect = null;
				this._lookOnScoreEffect = null;
			}
		}
	},

	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				// console.log('gameInit=============================');
				this._refrushType = 2 //刷新成功
				this.gameInit(msg.data);
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_RESPONSE) {
				if (msg.data.chairID === TWModel.getMyChairID()) { }
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				this.showHeadNode(msg.data.roomUserInfo.chairID);
				this.verifyZuobi(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				this.hideHeadNode(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				this.userReadyPush(msg.data.chairID);
			} else if (msg.type === ApiRoom.ROOM_DISMISS_PUSH) { } else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
				msg.data.myChairID = TWModel.getMyChairID();
				AssetsManager.nisDialog(msg.data);
			} else if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
				if (msg.data.code != 0) {
					if (msg.data.uid == UserModel.getData('uid')) {
						AssetsManager.tipDialog(Codes[msg.data.code]);
					}
					return;
				};
				let user = TWModel.getUserByChairID(TWModel.getMyChairID());
				if (TWModel.getGameStatus() == ApiTw.gameStatus.NONE &&
					user.userStatus != ApiRoom.userStatusEnum.READY &&
					user.userStatus != ApiRoom.userStatusEnum.LOOK &&
					user.userStatus != ApiRoom.userStatusEnum.PLAYING &&
					TWModel.getCurBureau() < TWModel.getMaxBureau() &&
					TWModel.getMyChairID() < TWModel.getChairCount()) {
					this.readyButton.active = true;
					// console.trace("准备按钮显示")
				} else {
					this.readyButton.active = false;
				}
				this.onTuoGuanSwitch();
				this.showSitDownButton();
				if (user &&
					user.userStatus == ApiRoom.userStatusEnum.LOOK &&
					msg.data.fromChairID < TWModel.getChairCount() &&
					msg.data.toChairID >= TWModel.getChairCount()) {
					TWModel.pourScore(msg.data.fromChairID, 0);
				}
				let bg = cc.find('Setting/Layout/bg', this.node);
				if (msg.data.uid == UserModel.getData('uid') && !!bg && bg.active) {
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
			if (msg.type === ApiTw.GAME_BUREAU_PUSH) {
				MessageCallback.emitMessage('RemoveGameResult');
				this.bureauLabel.string = '局数：' + TWModel.getCurBureau() + '/' + TWModel.getMaxBureau();
				let unionID = TWModel.isUnionCreate() ? TWModel.getRoomCreatorByKey('unionID') : null;
				let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
				cc.find('copy', this.node).active = TWModel.getCurBureau() == 0 && !!isShowInvite;
				cc.find('invite', this.node).active = TWModel.getCurBureau() == 0 && !!isShowInvite;
				let bg = cc.find('Setting/Layout/bg', this.node);
				let takeSeat = TWModel.checkUserTakeSeat(TWModel.getMyChairID());
				this._yuYinShow();
				if (!!bg &&
					!!bg.active &&
					takeSeat) {
					this.showSettingBg();
				}
			} else if (msg.type === ApiTw.GAME_STATUS_PUSH) {
				this.btnBackHall.active = false
				if (msg.data.gameStatus == ApiTw.gameStatus.NONE) {
					this.onTuoGuanSwitch();
				}
				this._yuYinShow();
				if (msg.data.gameStatus == ApiTw.gameStatus.BAI_PAI) {
					this.littleResNode.removeAllChildren()
					this.onBaiPai();
				}
				if (msg.data.gameStatus != ApiTw.gameStatus.BAI_PAI) {
					let node = cc.find("TWGuaipaiTipWidget", this.node);
					if (node) {
						node.active = false;
					}
				}

				if (TWModel.getGameStatus() == ApiTw.gameStatus.NONE &&
					TWModel.getCurBureau() < TWModel.getMaxBureau() &&
					TWModel.getMyChairID() < TWModel.getChairCount()) {
					// this.readyButton.active = true;
					// console.trace("准备按钮显示")
				} else {
					this.readyButton.active = false;
				}

				if (TWModel.getGameStatus() == ApiTw.gameStatus.SEND_CARDS) {
					this.kaishiAni.node.active = true
					this.kaishiAni.setAnimation(0, "animation", false)
					AssetsManager.playEffect({
						path: "res/audio/startGame",
						bundle: Enums.bundleType.SSS
					});
					this.destroySortCardWidet()
					this.unscheduleAllCallbacks()
					this.littleResNode.removeAllChildren()
					this.cardsNodeArray.forEach(n => {
						n.active = false
					});
				} else {
					this.kaishiAni.node.active = false
				}

				if (TWModel.getGameStatus() == ApiTw.gameStatus.WASH_CARD) { //洗牌的时候清除可能存在的界面
					this.destroySortCardWidet()
					this.unscheduleAllCallbacks()
					this.littleResNode.removeAllChildren()
					this.cardsNodeArray.forEach(n => {
						n.active = false
					});
				}
				// if (TWModel.getMaxBureau() == "自由局" && msg.data.gameStatus == ApiTw.gameStatus.NONE && TWModel.getMyChairID() < TWModel.getChairCount()) {
				// 	cc.find('backhall', this.node).active = true;
				// } else {
				cc.find('backhall', this.node).active = false;
				// }
			} else if (msg.type === ApiTw.GAME_SHOW_CARDS_PUSH) {
				this.onCardSort(msg.data);
			} else if (msg.type === ApiTw.GAME_END_PUSH) {
				UserModel.setData('roomID', '');
				if (TWModel.getCurBureau() === TWModel.getMaxBureau()) return;
				// console.log("游戏结束了")
				if (msg.data.result.length > 0) {
					msg.data.enterHall = this.enterHall.bind(this);
					msg.data.path = 'res/prefab/TWResult';
					msg.data.bundle = Enums.bundleType.SSS;
					msg.data.parent = this.allResNode
					AssetsManager.createDialog(msg.data);
				} else {
					this.enterHall();
				}
			} else if (msg.type === ApiTw.GAME_TRUST_PUSH) {
				if (msg.data.chairID == TWModel.getMyChairID()) {
					cc.find('Tuoguan', this.node).active = msg.data.trust;
				}
			} else if (msg.type === ApiTw.GAME_REVIEW_PUSH) {
				if (msg.data.list.length != 0) {
					msg.data.path = 'res/prefab/TWResultDialog';
					msg.data.bundle = Enums.bundleType.SSS;
					AssetsManager.createDialog(msg.data);
				} else {
					AssetsManager.tipDialog('没有数据');
				}
			} else if (msg.type === ApiTw.GAME_RESULT_PUSH) {
				this.showCards(msg.data)
			} else if (msg.type === ApiTw.GAME_USER_WASH_CARD_PUSH) { //用户洗牌
				this.showWashCard(msg.data)
			}
		} else if (route === 'ReconnectSuccess') {
			// console.log('断线重连=====================');
			this.onReconnectCheck();
		} else if (route == 'UpdateGameBg') { } else if (route === 'SelfEntryRoomPush') {
			if (msg.gameType != TWModel.getBundleType()) {
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
			// this.onBtnTest()
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

	/**展示洗牌界面 */
	showWashCard(data) {
		let myChairID = TWModel.getMyChairID()
		if (data.chairIDList.includes(myChairID)) {
			AssetsManager.createDialog({
				path: 'res/prefab/TWQiePai',
				bundle: Enums.bundleType.SSS,
				countDown: data.time,
				parent: this.washCardNode
			});
		}
	},

	/**展示总结算 */
	showAllResult(msg) {
		// console.log("游戏结束了")
		msg.data.enterHall = this.enterHall.bind(this);
		msg.data.path = 'res/prefab/TWResult';
		msg.data.bundle = Enums.bundleType.SSS;
		msg.data.parent = this.allResNode;
		this.unscheduleAllCallbacks();
		this.scheduleOnce(() => {
			MessageCallback.emitMessage('RemoveGameResult');
			AssetsManager.createDialog(msg.data);
		}, 2);
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
		if (this._refrushType !== 1) {
			// console.log("开始刷新倒计时")
			this._refrushType = 1 //开始计时
			this._timeCheck = 0
		}
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
			if (!TWModel.getRoomID() ||
				data.roomID === TWModel.getRoomID()) {
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
			if (node.getComponent('TWHead').getChairID() == chairID) {
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
		let chairCount = TWModel.getChairCount();
		let index = (chairID + chairCount - TWModel.getMyChairID()) % chairCount;
		return this.cardsNodeArray[index];
	},

	/*
	 * 玩家准备推送
	 */
	userReadyPush(chairID) {
		if (chairID == TWModel.getMyChairID()) {
			this.readyButton.active = false;
			let bg = cc.find('Setting/Layout/bg', this.node);
			if (!!bg && bg.active) {
				this.showSettingBg();
			}
		}
		this.destroySortCardWidet()
	},

	onReadyClick(event, param) {
		ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify(true));
		this.readyButton.active = false;
	},

	onSendCards() {

	},

	onBaiPai() {
		if ((this.sortCardWidgetCtrl && !!this.sortCardWidgetCtrl.node) || TWModel.sortCardChairArr[TWModel.getMyChairID()]) {
			return;
		}
		if (!TWModel.getIsPlayingByChairID(TWModel.getMyChairID())) {
			return;
		}
		let myCardArr = TWModel.getHandCardsByChairID(TWModel.getMyChairID());
		if (!myCardArr || myCardArr.length != 13) {
			// console.log("没有手牌不做显示")
			return
		}
		let node = cc.instantiate(this.sortCardWidgetPrefab);
		node.parent = this.sortCardNode;
		this.sortCardWidgetCtrl = node.getComponent("TWSortCardWidgetCtrl");
		this.sortCardWidgetCtrl.setCardArr(myCardArr);
		let tesupaiName = TWModel.getGameRule().tesupai ? TWLogic.getTeShuPaiCardType(myCardArr) : false;
		if (tesupaiName) {
			let guaiPaiNode = cc.instantiate(this.guaiPaiTipWidgetPrefab);
			guaiPaiNode.parent = this.node;
			guaiPaiNode.getComponent('TWGuaipaiTipWidgetCtrl').setLabel(tesupaiName);
		}
	},

	onCardSort(data) {
		if (data.chairId === TWModel.getMyChairID()) {
			// if (!data.isNosort) {
			// 	this.sortCardWidgetCtrl.setCardArr(data.cardArr);
			// }

			let node = cc.find("TWGuaipaiTipWidget", this.node);
			if (node) {
				node.active = false;
			}
			this.destroySortCardWidet()
		}
		let cardNode = this.getCardsNodeByChairID(data.chairId)
		if (cc.isValid(cardNode)) {
			let cardItem = cardNode.getComponent("TWCardItem");
			if (!!cardItem) {
				cardItem.onSortCardsPush();
			}
		}
	},

	onDisClick(event, param) {
		this._onMenuCloseClick()
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
		this._onMenuCloseClick()
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
		TWModel.onDestroy();
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
		let isUnionCreate = TWModel.isUnionCreate();
		let unionID = !!isUnionCreate ? TWModel.getRoomCreatorByKey('unionID') : null;
		SubManager.exitBundle(unionID);
	},

	showDissButton() {
		let user = TWModel.getUserByChairID(TWModel.getMyChairID());
		this.btnDismiss.active = TWModel.getCurBureau() > 0 && user.chairID < TWModel.getChairCount() && !TWModel.getGameRuleByKey('canNotDissmiss');
		this.btnExit.active = TWModel.getCurBureau() == 0 || user.chairID >= TWModel.getChairCount();
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
		let users = TWModel.getLookOnUsers();
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
	onTrustClick() {
		this._onMenuCloseClick();
		ApiRoom.gameMessageNotify(ApiTw.gameTrushNotify(true));
	},

	onSettingClick() {
		this._onMenuCloseClick()
		AssetsManager.setDialog({
			type: 'duoren',
			gameType: Enums.bundleType.SSS,
			musicType: Enums.bundleType.POKER,
		});
		this.showSettingBg();
	},

	onRuleClick() {
		this._onMenuCloseClick();
		let node = cc.find('menu/menuList/bg/RuleButton', this.node);
		if (CCUtil.clickInterval(node, 0.5)) return;
		AssetsManager.tableDialog({
			gameRule: TWModel.getGameRule(),
		});
	},

	onCancelTuoguan() {
		ApiRoom.gameMessageNotify(ApiTw.gameTrushNotify(false));
	},

	onCopyRoomID() {
		let str = ConfigModel.getRoomShare(Enums.bundleType.SSS, DGNModel.getRoomID());
		NativeUtil.copyText(str);
	},

	onInviteFriend() {
		let gameRule = TWModel.getGameRule();
		gameRule = gameRule || {};
		let roomId = TWModel.getRoomID();
		gameRule.roomId = roomId;
		let share = ConfigModel.getRoomRuleShare(gameRule);
		// console.log('测试-分享', share);
		NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
	},

	onReview() {
		this._onMenuCloseClick();
		ApiRoom.gameMessageNotify(ApiTw.gameReviewNotify());
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
			if (!node.getComponent('TWHead')) continue;
			players.node.push(node);
			players.cid.push(node.getComponent('TWHead').getChairID());
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
		if (this._refrushType == 1) {
			this._timeCheck += dt
			if (this._timeCheck >= 3) {
				this._refrushType = 100
				/**刷新失败直接断线 */
				NetworkLogic.disconnect(true)
			}
		}
	},

	onPlayerOver() {
		//console.log("onPlayCallback:" + this._playingSeat);
		this._playingSeat.getComponent("TWHead").setVoice(false);
		this._playingSeat = null;
	},

	onRefrush(event) {
		this._onMenuCloseClick()
		if (CCUtil.clickInterval(event.target, 5, true)) return;
		AssetsManager.tipDialog('刷新界面可以修复游戏显示问题');
		this.messageCallbackHandler('ReconnectSuccess');
	},

	setHeadAndCard() {
		let chairCount = TWModel.getGameRule().maxPlayerCount;
		let headPosArray = [cc.v2(-267, -293), cc.v2(606, -138), cc.v2(596, 111), cc.v2(257, 281), cc.v2(-42, 303), cc.v2(-333, 281), cc.v2(-605, 107), cc.v2(-606, -138)];
		let cardPosArray = [cc.v2(0, -202), cc.v2(400, -159), cc.v2(400, 76), cc.v2(220, 191), cc.v2(0, 191), cc.v2(-279, 191), cc.v2(-438, 76), cc.v2(-451, -164)];
		let choosedArray = [1, 2, 3, 4, 5, 6, 7, 8];
		if (chairCount == 6) {
			headPosArray = [cc.v2(-267, -293), cc.v2(606, -138), cc.v2(596, 111), cc.v2(-42, 303), cc.v2(-605, 107), cc.v2(-605, -141)];
			cardPosArray = [cc.v2(0, -202), cc.v2(400, -159), cc.v2(400, 76), cc.v2(-0, 191), cc.v2(-438, 76), cc.v2(-451, -164)];
			choosedArray = [1, 2, 4, 5, 6, 8];
		} else if (chairCount == 4) {
			headPosArray = [cc.v2(-267, -293), cc.v2(596, 111), cc.v2(-42, 303), cc.v2(-605, 107)];
			cardPosArray = [cc.v2(0, -202), cc.v2(400, 76), cc.v2(0, 191), cc.v2(-438, 76)];
			choosedArray = [1, 3, 5, 7];
		}
		// headPosArray = this.fitIphone(headPosArray);
		// cardPosArray = this.fitIphone(cardPosArray);
		for (let i = 0; i < chairCount; ++i) {
			let headNode = this.node.getChildByName('Head' + choosedArray[i]);
			let cardsNode = this.node.getChildByName('TWCardItem' + choosedArray[i]);
			if (i > 0) {
				// headNode.setPosition(headPosArray[i]);
				// cardsNode.setPosition(cardPosArray[i]);
			}
			this.headNodeArray.push(headNode);
			headNode.getComponent('TWHead').setIndex(i);
			this.addHeadClickEvent(headNode.getChildByName('headedg'));
			this.cardsNodeArray.push(cardsNode);
			cardsNode.getComponent('TWCardItem').setIndex(i);
		}
		for (let i = 1; i <= 8; ++i) {
			if (choosedArray.indexOf(i) == -1) {
				let headNode = this.node.getChildByName('Head' + i);
				let cardsNode = this.node.getChildByName('TWCardItem' + i);
				if (headNode) {
					headNode.destroy();
				}
				if (cardsNode) {
					cardsNode.destroy();
				}
			}
		}
		// console.log("重置了节点")
	},

	// 苹果iphonex位置特殊处理
	fitIphone(array) {
		let designWidth = 1334;
		let designHeight = 750;
		let visibleWidth = cc.visibleRect.width;
		let visibleHeight = cc.visibleRect.height;
		if (cc.visibleRect.width / cc.visibleRect.height > 1.8) {
			if (array.length == 6) {
				array[0] = cc.v2(-visibleWidth / 2 + array[0].x + designWidth / 2, -visibleHeight / 2 + array[0].y + designHeight / 2); // 左下 
				array[1] = cc.v2(visibleWidth / 2 - designWidth / 2 + array[1].x, array[1].y); // 右 
				array[2] = cc.v2(visibleWidth / 2 - designWidth / 2 + array[2].x, visibleHeight / 2 - designHeight / 2 + array[2].y); // 右上 
				array[3] = cc.v2(array[3].x, visibleHeight / 2 - designHeight / 2 + array[3].y); // 上 
				array[4] = cc.v2(-visibleWidth / 2 + array[4].x + designWidth / 2, visibleHeight / 2 - designHeight / 2 + array[4].y); // 左上 
				array[5] = cc.v2(-visibleWidth / 2 + array[5].x + designWidth / 2, array[5].y); // 左 
			} else if (array.length == 8) {
				array[0] = cc.v2(-visibleWidth / 2 + array[0].x + designWidth / 2, -visibleHeight / 2 + array[0].y + designHeight / 2); // 左下 
				array[1] = cc.v2(visibleWidth / 2 - designWidth / 2 + array[1].x, -visibleHeight / 2 + array[1].y + designHeight / 2); // 右下
				array[2] = cc.v2(visibleWidth / 2 - designWidth / 2 + array[2].x, visibleHeight / 2 - designHeight / 2 + array[2].y); // 右上 
				array[3] = cc.v2(visibleWidth / 2 - designWidth / 2 + array[3].x, visibleHeight / 2 - designHeight / 2 + array[3].y); // 右上 
				array[4] = cc.v2(array[4].x, visibleHeight / 2 - designHeight / 2 + array[4].y); // 上 
				array[5] = cc.v2(-visibleWidth / 2 + array[5].x + designWidth / 2, visibleHeight / 2 - designHeight / 2 + array[5].y); // 左上 
				array[6] = cc.v2(-visibleWidth / 2 + array[6].x + designWidth / 2, visibleHeight / 2 - designHeight / 2 + array[6].y); // 左上 
				array[7] = cc.v2(-visibleWidth / 2 + array[7].x + designWidth / 2, -visibleHeight / 2 + array[7].y + designHeight / 2); // 左下
			} else if (array.length == 10) {
				array[0] = cc.v2(-visibleWidth / 2 + array[0].x + designWidth / 2, -visibleHeight / 2 + array[0].y + designHeight / 2); // 左下 
				array[1] = cc.v2(visibleWidth / 2 - designWidth / 2 + array[1].x, -visibleHeight / 2 + array[1].y + designHeight / 2); // 右下
				array[2] = cc.v2(visibleWidth / 2 - designWidth / 2 + array[2].x, visibleHeight / 2 - designHeight / 2 + array[2].y); // 右上 
				array[3] = cc.v2(visibleWidth / 2 - designWidth / 2 + array[3].x, visibleHeight / 2 - designHeight / 2 + array[3].y); // 右上 
				array[4] = cc.v2(visibleWidth / 2 - designWidth / 2 + array[4].x, visibleHeight / 2 - designHeight / 2 + array[4].y); // 右上 
				array[5] = cc.v2(array[5].x, visibleHeight / 2 - designHeight / 2 + array[5].y); // 上 
				array[6] = cc.v2(-visibleWidth / 2 + array[6].x + designWidth / 2, visibleHeight / 2 - designHeight / 2 + array[6].y); // 左上 
				array[7] = cc.v2(-visibleWidth / 2 + array[7].x + designWidth / 2, visibleHeight / 2 - designHeight / 2 + array[7].y); // 左上 
				array[8] = cc.v2(-visibleWidth / 2 + array[8].x + designWidth / 2, visibleHeight / 2 - designHeight / 2 + array[8].y); // 左上 
				array[9] = cc.v2(-visibleWidth / 2 + array[9].x + designWidth / 2, -visibleHeight / 2 + array[9].y + designHeight / 2); // 左下
			}
		}
		return array;
	},

	/**给没座位的人显示坐下按钮 */
	showSitDownButton() {
		let curBureau = TWModel.getCurBureau();
		let maxBureau = TWModel.getMaxBureau();
		let canEnter = TWModel.getGameRuleByKey('canEnter') && maxBureau != curBureau;
		// (!!canEnter || curBureau == 0) &&
		this.btn_zuoxia.active = TWModel.getMyChairID() >= TWModel.getChairCount() &&
			(!!canEnter || curBureau == 0) &&
			TWModel.checkHaveEmptySeat();
	},

	/**坐下按钮响应 */
	onBtnSitDown() {
		/**检查是否还有空位，有就发送坐下命令 */
		let chairID = TWModel.getCanSitDownChairID();
		if (chairID == -1 || !this.headNodeArray[chairID]) {
			AssetsManager.tipDialog('没有座位可以坐下！');
			// this.btn_zuoxia.active = false;
			return;
		}
		let head = this.headNodeArray[chairID].getComponent("TWHead");
		if (!head) return;
		// console.log('找到座位坐下', chairID);
		head.onSeatClick();
	},

	onLocationClick() {
		this._onMenuCloseClick()
		AssetsManager.locationDialog({
			users: TWModel.getUsers(),
			chairCount: TWModel.getChairCount(),
			fangzuobi: TWModel.getGameRuleByKey('fangzuobi')
		})
	},

	onChatClick() {
		let params = {
			gameRule: TWModel.getGameRule(),
			chat: (chat) => {
				ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
			}
		}
		AssetsManager.chatDialog(params);
	},

	showTest() {
		let tmp = UserModel.getData("isTest")
		cc.find("Setting/btn_test", this.node).active = false //!!tmp;
	},

	onBtnTest(chairID) {
		let tmp = UserModel.getData("isTest")
		if (!!TWModel.isInWatch() || !tmp) return;
		AssetsManager.createDialog({
			bundle: Enums.bundleType.SSS,
			path: "res/prefab/TWSelectTest",
			user: {
				chairID
			}
		})
	},

	/**删除摆牌界面 */
	destroySortCardWidet() {
		if (this.sortCardWidgetCtrl && this.sortCardWidgetCtrl.node) {
			this.sortCardWidgetCtrl.node.destroy();
			this.sortCardWidgetCtrl = null
		}
	},

	showCards(data) {
		this.destroySortCardWidet()
		this.cardsNodeArray.forEach(n => {
			let com = n.getComponent("TWCardItem")
			com.setCardType2()
		});
		let res = data.result
		let touSort = res.touSort
		let zhongSort = res.zhongSort
		let weiSort = res.weiSort
		let dt = 0
		let donghuajiange = 0.5
		for (let i = 0; i < touSort.length; i++) {
			const info = touSort[i];
			/**找到节点 */
			let cardNode = this.cardsNodeArray.find(n => {
				let com = n.getComponent("TWCardItem")
				return com.getChairID() === info.chairId
			})
			// console.log(info, cardNode)
			/**执行动画 */
			this.scheduleOnce(() => {
				cardNode.getComponent("TWCardItem").showTouDao(res, true);
				// cardNode.getComponent("TWCardItem").setCardType3(res, true);
			}, dt)
			dt += donghuajiange
		}

		for (let i = 0; i < zhongSort.length; i++) {
			const info = zhongSort[i];
			/**找到节点 */
			let cardNode = this.cardsNodeArray.find(n => {
				let com = n.getComponent("TWCardItem")
				return com.getChairID() === info.chairId
			})
			// console.log(info, cardNode)
			/**执行动画 */
			this.scheduleOnce(() => {
				cardNode.getComponent("TWCardItem").showZhongDao(res, true);
				// cardNode.getComponent("TWCardItem").setCardType4(res, true);
			}, dt)
			dt += donghuajiange
		}

		for (let i = 0; i < weiSort.length; i++) {
			const info = weiSort[i];
			/**找到节点 */
			let cardNode = this.cardsNodeArray.find(n => {
				let com = n.getComponent("TWCardItem")
				return com.getChairID() === info.chairId
			})
			// console.log(info, cardNode)
			/**执行动画 */
			this.scheduleOnce(() => {
				cardNode.getComponent("TWCardItem").showWeiDao(res, true);
				// cardNode.getComponent("TWCardItem").setCardType5(res, true);
			}, dt)
			dt += donghuajiange
		}

		/**特殊牌型 */
		dt += donghuajiange
		let teShuSort = res.teShuSort
		let isHaveTeshu = false
		teShuSort.forEach(tes => {
			let cnode = this.cardsNodeArray.find(c => {
				let com = c.getComponent("TWCardItem")
				return com.getChairID() == tes.chairId
			})
			if (cc.isValid(cnode)) {
				this.scheduleOnce(() => {
					let com = cnode.getComponent("TWCardItem")
					com.showMianbai(res)
				}, dt)
				dt += 1
				isHaveTeshu = true
			}
		});

		if (isHaveTeshu) {
			dt++
		}
		/**打枪动画 */
		let daqiangArr = res.daqiangArr
		let showedList = [] //已经显示过的位置
		/**排序，全垒打放到最后面 */
		let qobj = null,
			qkey = null,
			paixuArr = []
		for (const i in daqiangArr) {
			const obj = daqiangArr[i]
			let isq = false
			for (const key in obj) {
				const score = obj[key];
				if (score == 4) {
					qobj = obj
					qkey = i
					isq = true
					break
				}
			}
			if (!isq) {
				let d = {
					chairId: i,
					dq: obj
				}
				paixuArr.push(d)
			}
		}
		if (qobj) {
			let d = {
				chairId: qkey,
				dq: qobj
			}
			paixuArr.push(d)
		}

		// console.log("排序后====", paixuArr, daqiangArr)

		for (let i = 0; i < paixuArr.length; i++) {
			const obj = paixuArr[i];
			/**根据座位号找到node */
			let curNode = this.cardsNodeArray.find(c => {
				let com = c.getComponent("TWCardItem")
				return com.getChairID() == obj.chairId
			})
			// console.log("打枪的座位号", i, curNode, obj)
			let quanleida = false
			let dq = obj.dq //这个对象里面下标表示座位号，如果是正表示朝该座位打枪，如果是负数表示被该座位打枪
			for (const cid in dq) {
				if (Object.hasOwnProperty.call(dq, cid)) {
					const score = dq[cid];
					if (score == 4) {
						quanleida = true
					}
					if (score != 0 && cid != obj.chairId && score != -4) {
						let tmp = [parseInt(obj.chairId), parseInt(cid)]
						tmp.sort((a, b) => a - b)
						let str = tmp.join(",")
						/**判断已经显示过的位置不再显示 */
						if (!showedList.includes(str)) {
							/**找到打枪或者被打枪的node */
							let othNode = this.cardsNodeArray.find(c => {
								let com = c.getComponent("TWCardItem")
								return com.getChairID() == cid
							})
							// console.log("被打枪的座位号", key, othNode, score)
							this.scheduleOnce(() => {
								let c1 = curNode.getComponent("TWCardItem")
								let o2 = othNode.getComponent("TWCardItem")
								if (score > 0) { //c打o
									c1.showDqAni(o2.getChairID())
									o2.showBDqAni()
								} else if (score < 0) { //o打c
									o2.showDqAni(c1.getChairID())
									c1.showBDqAni()
								}
							}, dt)
							dt += 1.5
							showedList.push(str)

						}
					}
				}
			}
			/**全垒打 */
			if (quanleida) {
				// console.log("全垒打==", i)
				this.scheduleOnce(() => {
					this.glassAnimal()
				}, dt)
				dt += 2
			}
		}

		this.scheduleOnce(() => {
			// console.log("结算=", data)
			data.path = 'res/prefab/TWResultDialog';
			data.bundle = Enums.bundleType.SSS;
			data.parent = this.littleResNode
			AssetsManager.createDialog(data);
			this.readyButton.active = true;
		}, dt)

		/**如果有总结算，显示总结算 */
		this.scheduleOnce(() => {
			if (TWModel.getCurBureau() === TWModel.getMaxBureau() && TWModel.getAllResultInfo()) {
				this.showAllResult(TWModel.getAllResultInfo())
			}
		}, dt + 1)

	},


	// 邀请好友
	onShowInvite() {
		this._onMenuCloseClick();
		AssetsManager.friendDialog({
			gameRule: TWModel.getGameRule(),
		})
	},


	_onMenuOpen() {
		this.menuLay.active = true
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


	btnClick(event, param) {
		switch (param) {
			case "menu": //菜单
				this._onMenuOpen();
				break;
			case "menuclose": //关闭菜单
				this._onMenuCloseClick();
				break
			case "btn_back":
				this.enterHall()
				break;
		}
	}

});