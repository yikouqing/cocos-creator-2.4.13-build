const ApiJgPtj = require('./ApiJgPtj');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const SubManager = require('../../../src/utils/SubManager');
const UserModel = require('../../../src/model/UserModel');
const ConfigModel = require('../../../src/model/ConfigModel');
const Codes = require('../../../src/const/Codes');
const JGPTJModel = require("./JGPTJModel")
const CCUtil = require("../../../src/utils/CCUtil")
const Events = require('../../../src/const/Events');

cc.Class({
	extends: cc.Component,

	properties: {
		ctrl_TableTile: require("JGPTJTableTileMgr"),
		ctrl_OptBtn: require("JGPTJOpt"),
		txt_round: cc.Label,
		txt_roomId: cc.Label,
		allTiles: cc.Node,
		pab_Card: cc.Prefab,
		menuLay: cc.Node,
		menuLayList: cc.Node,
		animationNode: cc.Node,
		diceAniPfb: cc.Prefab,
		tuoguan: cc.Node,
		btn_location: cc.Node,
		btn_copy: cc.Node,
		btn_invite: cc.Node,
		btn_ready: cc.Node,
		btn_leave: cc.Node,
		btn_dismiss: cc.Node,
		btn_shezhi: cc.Node,
		btn_zuoxia: cc.Node,
		btn_menu: cc.Node,
		btn_deposit: cc.Node,
		btnBackHall: cc.Node,
		btnYuYin: cc.Node,
		canNotDismissBar: cc.Node,
		tips_zhunbei: cc.Node,
		tips_kaipai: cc.Node,
		tips_waitgame: cc.Node,
		tips_guanzhan: cc.Node,

		/**用户脚本列表 下标为本地座位号*/
		_userList: [],
		/**手牌脚本列表 */
		_handCardList: [],
		/**游戏状态 */
		_gameStatus: 0,
		/**当前发牌的牌堆下标 */
		_sendCardIdx: 0,
		/**当前正在飞的所有牌 */
		_allFlyNode: [],
	},

	onLoad() {
		this.resetShow();
		this.resetTable();
		this.menuLay.active = false;
		this.btn_zuoxia.active = false;
		this.ctrl_TableTile.shwoNode(false);
		AssetsManager.init(this.node.parent);
		cc.game.on(cc.game.EVENT_SHOW, this.onEventShow, this);
		cc.systemEvent.on(Events.clientEvents.gvUploadFileSuccess, this._onUploadSuccess, this);
		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
		MessageCallback.addListener('UpdateGameCardBg', this);
		MessageCallback.addListener('SelfEntryRoomPush', this);
		MessageCallback.addListener('JoinGameAgainPush', this);
		MessageCallback.addListener('OnGameOnceAgain', this);
		MessageCallback.addListener('CreateRoomFail', this);
		MessageCallback.addListener('QuickJoinFail', this);
		MessageCallback.addListener('TestClickReq', this)
		this.getRoomSceneInfo(); //获取场景信息
	},
	resetShow() {
		this.btn_copy.active = false;
		this.btn_invite.active = false;
		this.tips_kaipai.active = false;
		this.tips_zhunbei.active = false;
		this.tips_waitgame.active = false;
		this.tips_guanzhan.active = JGPTJModel.isLookOnUID();
	},

	onDestroy() {
		cc.game.off(cc.game.EVENT_SHOW, this.onEventShow, this);
		cc.systemEvent.off(Events.clientEvents.gvUploadFileSuccess, this._onUploadSuccess, this);
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
		MessageCallback.removeListener('UpdateGameCardBg', this);
		MessageCallback.removeListener('SelfEntryRoomPush', this);
		MessageCallback.removeListener('CreateRoomFail', this);
		MessageCallback.removeListener('QuickJoinFail', this);
		MessageCallback.removeListener('JoinGameAgainPush', this);
		MessageCallback.removeListener('OnGameOnceAgain', this);
		MessageCallback.removeListener('TestClickReq', this)
	},

	/**切换后台返回 */
	onEventShow() {
		this.getRoomSceneInfo();
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

	/**获取房间信息 */
	getRoomSceneInfo() {
		// return
		if (UserModel.isInRoom()) {
			ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
		} else {
			this.enterHall();
		}
	},

	/**返回大厅 */
	enterHall() {
		let isUnionCreate = JGPTJModel.isUnionCreate();
		let unionID = !!isUnionCreate ? JGPTJModel.getRoomCreatorByKey('unionID') : null;
		SubManager.exitBundle(unionID);
	},

	resetTable() {
		this.delAllFlyNode();
		this.ctrl_OptBtn.reset();
		this._userList.forEach(ctrl => {
			ctrl.reset()
		});
		this._handCardList.forEach(ctrl => {
			ctrl.node.stopAllActions();
			ctrl.reset()
		});
		this.unscheduleAllCallbacks();
		AssetsManager.clearDialog(['JGPTJResultDialog', 'JGPTJCuoPai']);
	},

	_yuYinShow() {
		let isInSeat = JGPTJModel.isInSeat();
		let yuyin = JGPTJModel.getGameRuleByKey('yuyin');
		this.btnYuYin.active = !!isInSeat && !!yuyin && ConfigModel.getData('voiceSpeaker');
	},

	gameInit(data) {
		JGPTJModel.init(data);
		let myUserInfo = null;
		this.initHeadAndTiles();
		let gameData = data.gameData;
		this.unscheduleAllCallbacks();
		this.ctrl_TableTile.shwoAllCard();
		let myUid = UserModel.getData("uid");
		this._gameStatus = gameData.gameStatus;
		this.animationNode.removeAllChildren();
		MessageCallback.emitMessage('RemoveGameResult');
		this._userList.forEach(ctrl => { ctrl.leave() });
		let roomUserInfoArr = data.roomUserInfoArr || [];
		let showCardsUser = gameData.showCardsUser || [];
		// console.log("初始化==this._gameStatus", this._gameStatus, data);
		this.resetTable();
		this.resetShow();
		roomUserInfoArr.forEach((user) => {
			if (user.uid == JGPTJModel.getMyUid()) {
				myUserInfo = user;
			}
			this.userEnterRoom(user);
		})
		showCardsUser.forEach(info => {
			if (info.uid == JGPTJModel.getMyUid()) {
				this.tips_kaipai.active = this._gameStatus === ApiJgPtj.gameStatus.SHOW_CARD;
				JGPTJModel.setMyshowCard(true);
			}
		})

		this._yuYinShow();
		this.showSitDownButton();
		this.initTotalScore(gameData.userWinTotalScore);
		/**房间号和局数 */
		this.txt_roomId.string = `游戏:加锅牌九  房号:${data.roomID}`;
		this.txt_round.string = `局数:${gameData.curBureau}/${gameData.maxBureau}`;
		/**按钮显示 */
		let maxPlayerCount = JGPTJModel.getChairCount();
		let unionID = JGPTJModel.getRoomCreatorByKey('unionID');
		let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
		this.btn_deposit.active = JGPTJModel.getGameRuleByKey("canTrust");
		this.btn_location.active = !!JGPTJModel.getGameRuleByKey("showGps");
		this.btn_copy.active = JGPTJModel.getCurBureau() == 0 && !!isShowInvite;
		this.btn_invite.active = JGPTJModel.getCurBureau() == 0 && !!isShowInvite;
		this.btnBackHall.active = gameData.curBureau == 0 && JGPTJModel.isUnionCreate() && !!ConfigModel.getData('unionRoomLeaveForWhile');
		this.btn_leave.active = (gameData.curBureau == 0 || myUserInfo.chairID >= maxPlayerCount);
		this.tips_zhunbei.active = this._gameStatus === ApiJgPtj.gameStatus.NONE && myUserInfo.playStatus == ApiRoom.playStatus.READY;
		this.btn_dismiss.active = (gameData.curBureau != 0 && myUserInfo.chairID < maxPlayerCount && !JGPTJModel.getGameRuleByKey("canNotDissmiss"));
		this.btn_ready.active = (myUserInfo.chairID < maxPlayerCount && this._gameStatus === ApiJgPtj.gameStatus.NONE && myUserInfo && myUserInfo.playStatus != ApiRoom.playStatus.READY)
		if (this.canNotDismissBar) this.canNotDismissBar.active = JGPTJModel.getGameRuleByKey("canNotDissmiss");
		/**恢复桌面 */
		if (gameData.gameStarted) {
			this.delAllFlyNode();
			this.ctrl_OptBtn.setClock(gameData.tick);
			this.onBankerUpdate({ uid: gameData.bankerUid });
			this.ctrl_OptBtn.showGuo({ score: gameData.maxPourScore });
		}
		//恢复下注分
		let userBetScore = gameData.userBetScore || {};
		for (const uid in userBetScore) {
			let score = userBetScore[uid];
			JGPTJModel.setUserBetScore(uid, score);
			let CurIndex = JGPTJModel.getUserIdxByUid(uid);
			let userCtrl = this._userList[CurIndex];
			userCtrl && userCtrl.setBetScore(score);
		}
		if (this._gameStatus === ApiJgPtj.gameStatus.QIE_GUO) {
			this.ctrl_OptBtn.showQieGuoBtn(gameData.bankerUid == myUid);
		} else if (this._gameStatus === ApiJgPtj.gameStatus.ROB_BANK) {
			let robBankList = gameData.robBankList || [];
			let isShowBtn = true;
			robBankList.forEach(robInfo => {
				this.onRobBanker(robInfo);
				if (robInfo.uid == myUid) {
					isShowBtn = false;
				}
			});
			if (isShowBtn) {
				this.ctrl_OptBtn.setRobBankerNode(true)
			}
		} else if (this._gameStatus === ApiJgPtj.gameStatus.POUR_SCORE) {
			let CurObj = {
				bankerUid: gameData.bankerUid,
				maxPourScore: gameData.maxPourScore || 0,
				minPourScore: gameData.minPourScore || 0,
				touBaBiManPourScores: gameData.touBaBiManPourScores || [],
			}
			this.onPourScoreStart(CurObj);
		} else if (this._gameStatus === ApiJgPtj.gameStatus.SHOW_CARD || this._gameStatus === ApiJgPtj.gameStatus.SEND_CARDS) {
			this.onSendCard(gameData, false);
			showCardsUser.forEach(info => {
				let CurIndex = JGPTJModel.getUserChairIndex(info.chairID);
				let handCtrl = this._handCardList[CurIndex];
				if (handCtrl) {
					if (JGPTJModel.isSmallCard()) {
						handCtrl.showCardType(info);
						handCtrl.updateLieTiles(info.cards);
						return
					} else {
						handCtrl.updateLieTilesX([], 4)
					}
				}
			});
			this.ctrl_OptBtn.setOptCardNode(!JGPTJModel.getMyshowCard() && this._gameStatus === ApiJgPtj.gameStatus.SHOW_CARD);
		} else if (this._gameStatus === ApiJgPtj.gameStatus.RESULT) {
			this.onSendCard(gameData, false);
			this.onGameResult(gameData, true);
		}
		this.showTest()
	},

	/**初始化头像和牌 */
	initHeadAndTiles() {
		let headPos = [0, 1, 2, 3];
		this._userList.length = 0;
		this._handCardList.length = 0;
		for (let i = 0; i < headPos.length; i++) {
			let headNode = cc.find("head" + headPos[i], this.node);
			this._userList.push(headNode.getComponent("JGPTJHead"));
			this._userList[i].initRes();
			let handCard = cc.find("Table/hand" + headPos[i], this.node);
			this._handCardList.push(handCard.getComponent("JGPTJHandTileMgr"));
			this._handCardList[i].init(headPos[i]);
		}
	},
	/**用户进入房间 */
	userEnterRoom(data) {
		if (data.chairID >= JGPTJModel.getChairCount() || data.playStatus == ApiRoom.playStatus.WATCH) {
			return
		}
		let CurIndex = JGPTJModel.getUserChairIndex(data.chairID);
		let headCtrl = this._userList[CurIndex];
		headCtrl && headCtrl.init(data);
		this.showSitDownButton();
	},

	/**恢复所有人的总输赢分数 */
	initTotalScore(userWinTotalScore) {
		if (userWinTotalScore && !!JGPTJModel.scoreState()) {
			userWinTotalScore = userWinTotalScore || {};
			let keys = Object.keys(userWinTotalScore);
			if (keys.length > 0) {
				for (const uid in userWinTotalScore) {
					const s = userWinTotalScore[uid];
					let idx = JGPTJModel.getUserIdxByUid(uid)
					let com = this._userList[idx]
					if (com) com.setTotalScore(s);
				}
			} else {
				this._userList.forEach((ctrl) => {
					ctrl.setTotalScore(0);
				})
			}
		} else {
			this._userList.forEach((ctrl) => {
				ctrl.setTotalScore('0')
			})
		}
	},

	/**用户离开房间 */
	userLeaveRoom(data) {
		if (data.chairID < JGPTJModel.getChairCount()) {
			let CurIndex = JGPTJModel.getUserChairIndex(data.chairID)
			let headCtrl = this._userList[CurIndex]
			if (headCtrl) {
				headCtrl.leave()
			}
		}
		if (data.uid == UserModel.getData('uid')) {
			if (!JGPTJModel.getRoomID() ||
				JGPTJModel.getRoomID() == data.roomID) {
				this.enterHall()
			}
		}
	},

	/**玩家准备 */
	onUserReady(data) {
		let CurIndex = JGPTJModel.getUserChairIndex(data.chairID)
		let userCtrl = this._userList[CurIndex]
		userCtrl && userCtrl.showGuanZhan(false);
		userCtrl && userCtrl.setReady(true);
		if (data.chairID == JGPTJModel.getMyChairID()) {
			this.tips_waitgame.active = false;
			this.tips_zhunbei.active = true;
			this.btn_ready.active = false;
			this.resetTable()
		}
	},

	/**隐藏所有准备图标*/
	hideReadyIcon() {
		this._userList.forEach(ctrl => {
			ctrl.setReady(false)
		});
	},

	/**更新局数 */
	onGameRoundUpdate(data) {
		this._yuYinShow();
		this.resetTable();
		this.btn_copy.active = false;
		this.btn_invite.active = false;
		this.btnBackHall.active = false;
		JGPTJModel.setCurBureau(data.curBureau);
		MessageCallback.emitMessage('RemoveGameResult');
		let myUserInfo = JGPTJModel.getUserByChairID(JGPTJModel.getMyChairID());
		this.btn_leave.active = (myUserInfo.chairID >= JGPTJModel.getChairCount());
		this.txt_round.string = `局数:${data.curBureau}/${JGPTJModel.getMaxBureau()}`;
		this.btn_dismiss.active = (myUserInfo.chairID < JGPTJModel.getChairCount() && !JGPTJModel.getGameRuleByKey("canNotDissmiss"));
	},

	delAllFlyNode() {
		this._allFlyNode.forEach(node => {
			node.destroy()
		});
		this._allFlyNode.length = 0
	},


	/**游戏状态图更新 */
	onGameStatusUpdate(data) {
		this._yuYinShow();
		this.delAllFlyNode();
		this.hideReadyIcon();
		this.ctrl_OptBtn.reset();
		this.btn_ready.active = false;
		this.tips_zhunbei.active = false;
		this._gameStatus = data.gameStatus;
		this.ctrl_OptBtn.setClock(data.tick);
		JGPTJModel.setGameStatus(this._gameStatus);
		// console.log("游戏状态==", this._gameStatus, data)
		switch (this._gameStatus) {
			case ApiJgPtj.gameStatus.ROB_BANK:
				this.ctrl_TableTile.shwoAllCard();
				this.ctrl_OptBtn.setRobBankerNode(true)
				break;
			case ApiJgPtj.gameStatus.RESULT:
				this.tips_kaipai.active = false;
				AssetsManager.clearDialog(['JGPTJCuoPai']);
				break;
			case ApiJgPtj.gameStatus.SHOW_CARD:
				this.ctrl_OptBtn.setOptCardNode(true)
				break;
			case ApiJgPtj.gameStatus.QIE_GUO:
			case ApiJgPtj.gameStatus.POUR_SCORE:
				this.ctrl_TableTile.shwoAllCard();
				break;
			case ApiJgPtj.gameStatus.NONE:
				this.resetShow();
				this.resetTable();
				JGPTJModel.reset();
				this.btn_ready.active = true;
				this.ctrl_OptBtn.showGuo(null);
				this.ctrl_TableTile.shwoAllCard();
				AssetsManager.playEffect({
					path: "res/audio/main/duijukaishi",
					bundle: Enums.bundleType.JGPTJ
				});
				break;
			default:
				break;
		}
	},

	onShowCardX(data) {
		if (data.uid == JGPTJModel.getMyUid()) {
			this.ctrl_OptBtn.setOptCardNode(false);
			this.tips_kaipai.active = true;
			JGPTJModel.setMyshowCard(true);
		}
		let CurIndex = JGPTJModel.getUserIdxByUid(data.uid)
		if (!JGPTJModel.getUserByUID(data.uid)) {//没玩家信息uid为chairId
			CurIndex = JGPTJModel.getUserChairIndex(parseInt(data.uid));
		}
		let handCtrl = this._handCardList[CurIndex];
		if (handCtrl) handCtrl.updateLieTilesX([], JGPTJModel.isSmallCard() ? 2 : 4, true);
	},

	/**亮牌结果 */
	onShowCard(data) {
		if (!!data.cardsList) {
			JGPTJModel.setShowCardsUser(data.cardsList);
		}
		return
		if (!JGPTJModel.isSmallCard()) {
			return
		}
		let isPlaySound = false;
		if (data.chairID == JGPTJModel.getMyChairID()) {
			isPlaySound = !JGPTJModel.getMyshowCard();
			this.ctrl_OptBtn.setOptCardNode(false);
			this.tips_kaipai.active = true;
			JGPTJModel.setMyshowCard(true);
		}
		let info = data.cardsList;
		let CurIndex = JGPTJModel.getUserChairIndex(info.chairID)
		let handCtrl = this._handCardList[CurIndex]
		if (handCtrl) {
			handCtrl.showCardType(info, isPlaySound);
			handCtrl.updateLieTiles(info.cards, true);
		}
	},


	/**发牌 */
	onSendCard(data, isAnim = false) {
		// console.log("发牌===data", data)
		let handCards = data.handCards || {};
		let cardTypeList = data.cardTypeList;
		JGPTJModel.setHandCards(handCards);
		JGPTJModel.setCardTypeList(cardTypeList);
		let isMaxCuoPai = false;
		if (!JGPTJModel.isSmallCard() && JGPTJModel.isCuoPai()) {
			isMaxCuoPai = !JGPTJModel.getMyshowCard();
		}
		// isAnim = true;
		// data.dice1 = 2;
		// data.dice2 = 6;
		let showHandCard = () => {
			let startIndex = 0;
			let saizi = data.dice1 + data.dice2;
			let maxIndex = this._handCardList.length - 1;
			let allCardList = this.ctrl_TableTile.getAllCardList();
			// let startIndex = JGPTJModel.getChairIdByUid(JGPTJModel.getBankerUid()) + 1;
			// startIndex = startIndex > maxIndex ? 0 : startIndex;
			// while (saizi > 1) {
			// 	startIndex++;
			// 	startIndex = startIndex > maxIndex ? 0 : startIndex;
			// 	saizi--;
			// }
			if (isAnim) {
				let maxPlayerCount = JGPTJModel.getGameRuleByKey("maxPlayerCount") || 4;
				let bankerChairID = JGPTJModel.getChairIdByUid(JGPTJModel.getBankerUid());
				startIndex = saizi % maxPlayerCount == 0 ? maxIndex : saizi % maxPlayerCount - 1;
				startIndex = (bankerChairID + startIndex) % maxPlayerCount;//得到以庄家为起始位的发牌起始位
				// console.log("点数", saizi, "庄家bankerChairID", bankerChairID, "开始发牌的位置==", startIndex);
			}
			// console.log(JGPTJModel.getBankerUid(), "开始发牌的位置==", startIndex)
			let sendInex = 0;
			let sendCount = 0;
			let sendRecord = (funs) => {
				sendCount += 1;
				startIndex += 1;
				if (startIndex > maxIndex) {
					startIndex = 0;
				}
				if (sendCount > maxIndex) {
					this.ctrl_TableTile.shwoAllCard(isAnim);
				} else {
					funs && funs();
				}
			}
			let sendCard = () => {
				let curData = JGPTJModel.getUserByChairID(startIndex);
				let index = JGPTJModel.getUserChairIndex(startIndex);
				let handCtrl = this._handCardList[index];
				let handList = handCtrl.getlieTileList();
				let handArr = new Array(handList.length);
				let isShow = false, count = 0;
				if (curData && curData.uid) {
					let uid = curData.uid;
					let curCards = handCards[uid] || [];
					if (!isMaxCuoPai) {
						isShow = uid == JGPTJModel.getMyUid();
					}
					if (curCards.length) handArr = curCards.slice();
				}
				if (!isAnim) {
					sendRecord(sendCard.bind(this));
					handCtrl.showCard(handArr, isShow, false, isMaxCuoPai);
				} else {
					handList.forEach((CurHandCtrl) => {
						let flyNode = allCardList[sendInex].node;
						let posStart = CCUtil.postionConvert(flyNode, this.node);
						let posEnd = CCUtil.postionConvert(CurHandCtrl.node, this.node);
						let flyItem = cc.instantiate(flyNode);
						flyItem.setContentSize(80, 160);
						flyItem.setPosition(posStart);
						flyItem.parent = this.node;
						flyItem.stopAllActions();
						flyItem.active = false;
						flyItem.setScale(0.6);
						cc.tween(flyItem)
							.call(() => {
								flyItem.active = true;
								flyNode.active = false
							}).to(0.25, {
								scale: 1,
								position: posEnd,
							}).call(() => {
								count += 1;
								flyItem.active = false;
								CurHandCtrl.setNodeShow(true);
								this._allFlyNode.push(flyItem);
								if (count >= handList.length) {
									handCtrl.setAllCardShow(true);
									sendRecord(sendCard.bind(this));
									handCtrl.showCard(handArr, isShow, isShow, isMaxCuoPai);
								}
							}).start();
						sendInex += 1;
					})
					AssetsManager.playEffect({
						path: 'res/audio/main/sendCard',
						bundle: Enums.bundleType.JGPTJ
					});
				}
			}
			sendCard();
		}
		if (isAnim) {
			this.scheduleOnce(showHandCard, 3.5);
			let diceAniNode = cc.instantiate(this.diceAniPfb);
			diceAniNode.parent = this.animationNode;
			diceAniNode.getComponent("JGPTJDice").init(data.dice1, data.dice2);
		} else {
			showHandCard();
		}
	},

	/**个人抢庄返回 
	 * 
	 */
	onRobBanker(data) {
		if (data.uid == UserModel.getData("uid")) {
			this.ctrl_OptBtn.setRobBankerNode(false)
		}
		let CurIndex = JGPTJModel.getUserIdxByUid(data.uid)
		let userCtrl = this._userList[CurIndex]
		if (userCtrl) userCtrl.setRobScale(data.isRob)
		AssetsManager.playEffect({
			path: "res/audio/woman/qiang" + data.isRob,
			bundle: Enums.bundleType.JGPTJ
		});
	},

	/**更新庄家
	 * uid"859718"
		  userList:
	 */
	onBankerUpdate(data, isAni = false) {
		//		console.log("更新庄家==", data)
		let CurIndex = JGPTJModel.getUserIdxByUid(data.uid);
		this.ctrl_OptBtn.setRobBankerNode(false);
		let bankercom = this._userList[CurIndex];
		JGPTJModel.setBankerUid(data.uid);
		if (!bankercom) {
			// console.log("没有找到庄家，uid=", data.uid)
			return
		}
		this._userList.forEach(userCtrl => {
			userCtrl.setBanker(false)
			userCtrl.setRobScale()
		});
		if (!isAni) {
			bankercom.setBanker(true)
			return
		}
		let fly = () => {
			let bankerNode = bankercom.getBanker()
			let endpos = CCUtil.postionConvert(bankerNode, this.animationNode)
			let flyBanker = cc.instantiate(bankerNode)
			flyBanker.parent = this.animationNode
			flyBanker.setPosition(0, 0)
			flyBanker.active = true
			cc.tween(flyBanker).to(0.5, {
				position: endpos
			}).call(() => {
				flyBanker.destroy()
				bankercom.setBanker(true)
			}).start()
		}
		if (data.userList && data.userList.length > 1) {
			/**播放抢庄动画 */
			let dt = 0
			for (let i = 0; i < data.userList.length; i++) {
				let idx1 = JGPTJModel.getUserIdxByUid(data.userList[i]);
				let ucom = this._userList[idx1]
				if (ucom) {
					let light = ucom.getLight()
					light.stopAllActions()
					let cishu = 5
					let jiange = 1
					if (idx1 == CurIndex) {
						cishu = 10
						jiange = 2
					}
					//		console.log("播放了动画==", dt)
					cc.tween(light).delay(dt).call(() => {
						light.active = true
						light.opacity = 255
					}).blink(jiange, cishu).call(() => {
						light.active = false
						if (idx1 == CurIndex) {
							fly()
						}
					}).start()
				}
				dt += 0.2
			}
			AssetsManager.playEffect({
				path: "res/audio/main/rob",
				bundle: Enums.bundleType.JGPTJ
			});
		} else {
			if (JGPTJModel.getCurBureau() > 1) {
				AssetsManager.playEffect({
					path: "res/audio/main/changeBanker",
					bundle: Enums.bundleType.JGPTJ
				});
			}
			fly()
		}
	},

	/**下分推送，显示下注按钮
	 */
	onPourScoreStart(data) {
		this.btn_ready.active = false;
		JGPTJModel.setPourScoreObj(data);
		this.ctrl_OptBtn.setBetNode(false);
		let myUid = UserModel.getData("uid");
		this.ctrl_OptBtn.setOptCardNode(false);
		this.ctrl_OptBtn.setRobBankerNode(false);
		let obj = JGPTJModel.getUserBetScoreNum(myUid);
		// console.log("下分推送，显示下注按钮data", data, "obj", obj)
		if (data.bankerUid != myUid && obj && !!obj.count) {
			this.ctrl_OptBtn.setBetNode(obj);
		}
	},

	/**玩家下注返回
	 * uid,
	 score
	 */
	onPlayerBet(data, isAni = false) {
		let score = data.score || [];
		let allScore = score.reduce((a, b) => a + b, 0);
		let CurIndex = JGPTJModel.getUserIdxByUid(data.uid)
		let userCtrl = this._userList[CurIndex];
		// userCtrl && userCtrl.showBetScore(score);
		userCtrl && userCtrl.setBetScore(score, isAni);
		let isShow = JGPTJModel.getUserBetScoreNum(data.uid);
		if (data.uid == UserModel.getData("uid")) {
			let obj = JGPTJModel.getUserBetScoreNum(data.uid);
			if (!!obj.count) {
				this.ctrl_OptBtn.setBetNode(obj)
			} else {
				this.ctrl_OptBtn.setBetNode(false);
			}
		}
	},

	onGameResult(data, allShow = false) {
		// console.log("======小结算========data", data, "getShowCardsUser", JGPTJModel.getShowCardsUser())
		let bankerIdx = JGPTJModel.getUserIdxByUid(JGPTJModel.getBankerUid());
		let userCtrl = this._userList[bankerIdx];
		let lastCards = data.lastCards || [];
		JGPTJModel.setlastCards(lastCards);
		let result = data.result || [];
		let showResult = () => {
			if (allShow) return;
			if (data.result) {
				let dt = 0;
				let winList = []
				let loseList = []
				result.forEach(info => {
					let i = JGPTJModel.getUserIdxByUid(info.uid)
					if (i != bankerIdx) {
						if (info.winScores > 0) {
							loseList.push(i)
						} else if (info.winScores < 0) {
							winList.push(i)
						}
					}
					let com = this._userList[i]
					if (com) {
						com.setResScore(info.winScores)
					}
				});
				let icon = userCtrl.getGoldIcon()
				let flygold = (s_pos, e_pos) => {
					if (1) {
						AssetsManager.playEffect({
							path: 'res/audio/main/fly_gold',
							bundle: Enums.bundleType.JGPTJ
						});
						for (let i = 0; i < 10; ++i) {
							let node = cc.instantiate(icon);
							node.setPosition(s_pos);
							node.parent = this.node;
							cc.tween(node).delay(0.08 * i).to(0.3, {
								position: e_pos
							}).removeSelf().start()
						}
					}
				}
				let bankerPos = userCtrl.node.getPosition()
				//庄家先收
				winList.forEach(idx => {
					let c = this._userList[idx]
					if (c) {
						let pos = c.node.getPosition()
						flygold(pos, bankerPos)
					}
				});
				this.scheduleOnce(() => {
					loseList.forEach(idx => {
						let c = this._userList[idx]
						if (c) {
							let pos = c.node.getPosition()
							flygold(bankerPos, pos)
						}
					});
				}, 0.3)
				dt += 2;
				let isLastRound = JGPTJModel.getCurBureau() == JGPTJModel.getMaxBureau()
				this.scheduleOnce(() => { // 显示结果
					if (allShow) return
					data.isResult = true;
					data.mainDialog = this;
					data.myChairID = this.myChairID;
					data.isBureauFull = isLastRound;
					data.bundle = Enums.bundleType.JGPTJ;
					data.path = 'res/prefab/JGPTJResultDialog';
					AssetsManager.createDialog(data);
				}, dt);
			}
		}
		if (JGPTJModel.isSmallCard() && false) {
			showResult();
		} else {
			let getCurObj = (chairID) => {
				let showCardsUser = JGPTJModel.getShowCardsUser();
				for (let index = 0; index < showCardsUser.length; index++) {
					const obj = showCardsUser[index];
					let CurChairID = parseInt(obj.chairID);
					if (CurChairID > JGPTJModel.getChairCount()) {
						if (obj.uid && JGPTJModel.getUserByUID(obj.uid)) {
							CurChairID = JGPTJModel.getChairIdByUid(obj.uid);
						}
					}
					if (obj && CurChairID == chairID) {
						return obj;
					}
				}
				return null;
			}
			let num = 0, allNum = allShow ? 1 : 2;
			let showBiPai = (type) => {
				if (num >= allNum) {
					showResult();
					return;
				}
				num += 1;
				let len = 0;
				let delayTime = 0.45;
				type = allShow ? 0 : type;
				let isPlay = allShow ? false : true;
				this._handCardList.forEach((handCtrl, index) => {
					let CurIndex = JGPTJModel.getUserChairIndex(index);
					handCtrl = this._handCardList[CurIndex];
					handCtrl.node.stopAllActions();
					let obj = getCurObj(index);
					cc.tween(handCtrl.node)
						.delay(allShow ? 0 : delayTime)
						.call(() => {
							len += 1;
							if (len >= this._handCardList.length) showBiPai(0);
							handCtrl.updateLieTilesX(obj ? obj.cards : [], type);
							handCtrl.showCardTypeX(obj ? obj : null, type, isPlay);
						}).start();
					delayTime += 0.45;
				})
			}
			showBiPai(2);
		}
	},

	onGift(fromChairID, toChairID, giftID) {
		let fidx = JGPTJModel.getUserChairIndex(fromChairID)
		let tidx = JGPTJModel.getUserChairIndex(toChairID)
		let sender = this._userList[fidx].node
		let reciever = [],
			rids = [];
		if (fidx == tidx) {
			for (let i = 0; i < this._userList.length; i++) {
				const c = this._userList[i];
				reciever.push(c.node)
				rids.push(i)
			}
		} else {
			reciever.push(this._userList[tidx].node);
			rids.push(tidx);
		}
		AssetsManager.addGift({
			sid: fidx,
			rids: rids,
			reciever: reciever,
			sender: sender,
			id: giftID,
			parent: this.node
		});
	},

	onBtnTest() {
		let myChairID = JGPTJModel.getMyChairID()
		let tmp = UserModel.getData("isTest")
		if (!tmp || myChairID >= JGPTJModel.getChairCount()) {
			return
		}
		AssetsManager.createDialog({
			bundle: Enums.bundleType.JGPTJ,
			path: "res/prefab/JGPTJSelectTest",
			mainDialog: this
		})
	},

	showTest() {
		let tmp = UserModel.getData("isTest")
		this.btn_shezhi.active = false //!!tmp
	},

	/**给没座位的人显示坐下按钮 */
	showSitDownButton() {
		let curBureau = JGPTJModel.getCurBureau();
		let maxBureau = JGPTJModel.getMaxBureau();
		let canEnter = JGPTJModel.getGameRuleByKey('canEnter') && maxBureau != curBureau;
		this.tips_waitgame.active = !JGPTJModel.isLookOnUID() && !JGPTJModel.getSelfIsPlaying() && this._gameStatus > ApiJgPtj.gameStatus.NONE;
		this.btn_zuoxia.active = JGPTJModel.getMyChairID() >= JGPTJModel.getChairCount() && (!!canEnter || curBureau == 0) && JGPTJModel.checkHaveEmptySeat();
	},

	/**坐下按钮响应 */
	onBtnSitDown() {
		/**检查是否还有空位，有就发送坐下命令 */
		let chairID = JGPTJModel.getCanSitDownChairID();
		let CurIndex = JGPTJModel.getUserChairIndex(chairID)
		if (chairID == -1 || !this._userList[CurIndex]) {
			AssetsManager.tipDialog('没有座位可以坐下！');
			return;
		}
		// console.log('找到座位坐下', chairID);
		ApiRoom.roomMessageNotify(ApiRoom.getUserChangeSeatNotify(JGPTJModel.getMyChairID(), chairID));
	},

	/**观战列表响应 */
	onLookOnClick() {
		let users = JGPTJModel.getLookOnUsers();
		if (users.length == 0) {
			AssetsManager.tipDialog('暂无观战玩家！');
			return;
		}
		AssetsManager.standDialog({
			users: users
		});
	},
	_onMenuOpen() {
		this.menuLayList.stopAllActions()
		// this.btn_menu.active = false
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
				easing: 'smooth'
			})
			.call(() => {
				this._moveAction = false;
			})
			.start();
	},

	_onMenuCloseClick() {
		this.btn_menu.active = true
		this.menuLay.active = false;
	},


	/**按钮响应 */
	btnClickCallFunc(event, param) {
		// console.log("按钮响应==", event.target.name, event)
		if (CCUtil.clickInterval(event, 1)) {
			return
		}
		switch (event.target.name) {
			case "btn_menu": //菜单
				this.menuLay.active = true;
				this._onMenuOpen();
				break;
			case "ShowMenu": //关闭菜单
				// this.menu.active = false
				this._onMenuCloseClick();
				break
			case "btn_leave": //离开房间
				this._onMenuCloseClick();
				if (!UserModel.isInRoom()) {
					this.enterHall();
					return;
				}
				ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
				break;
			case "btn_ready": //准备
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify(true));
				this.btn_ready.active = false
				break;
			case "btn_dismiss": //解散
				this._onMenuCloseClick();
				AssetsManager.popDialog({
					content: '是否确定发出解散申请？',
					ok: () => {
						ApiRoom.roomMessageNotify(ApiRoom.getAskForDismissNotifyData({
							isAsker: true
						}));
					},
					no: () => { }
				});
				break;
			case "btn_refresh": //刷新
				this._onMenuCloseClick();
				if (CCUtil.clickInterval(event.target, 10, true)) return;
				AssetsManager.tipDialog('刷新界面可以修复游戏显示问题');
				this.getRoomSceneInfo()
				break;
			case "btn_setting": //设置
				this._onMenuCloseClick();
				AssetsManager.setDialog({
					type: "duoren",
					gameType: Enums.bundleType.JGPTJ,
					musicType: Enums.bundleType.CIRCLE,
				});
				break;
			case "btn_review": //回看
				this._onMenuCloseClick();
				ApiRoom.gameMessageNotify(ApiJgPtj.gameReviewNotify());
				break;
			case "btn_msg": //聊天
				if (JGPTJModel.isLookOnUID()) {
					AssetsManager.tipDialog('你未在游戏中禁止操作!');
					return
				}
				let params = {
					gameRule: JGPTJModel.getGameRule(),
					textList: JGPTJModel.isConfigTexT() ? JGPTJModel.getConfigTexT() : [],
					chat: (chat) => {
						ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
					}
				}
				AssetsManager.chatDialog(params);
				break;
			case "btn_roomInfo": //规则
				this._onMenuCloseClick();

				let rule = JGPTJModel.getGameRule()
				if (!rule) {
					return
				}
				AssetsManager.tableDialog({
					gameRule: rule,
				});
				break;
			case "btn_location": //定位
				this._onMenuCloseClick();
				let users = []
				for (let i = 0; i < this._userList.length; i++) {
					const u = this._userList[i];
					let data = u.getUserData()
					if (data) {
						users.push(data)
					}
				}
				AssetsManager.locationDialog({
					users: users,
					chairCount: JGPTJModel.getChairCount(),
					fangzuobi: JGPTJModel.getGameRuleByKey('fangzuobi')
				})
				break;
			case "btn_deposit": //开始托管
				this._onMenuCloseClick();
				ApiRoom.gameMessageNotify(ApiJgPtj.gameTrushNotify(true));
				break;
			case "btn_quxiaotuoguan": //取消托管
				ApiRoom.gameMessageNotify(ApiJgPtj.gameTrushNotify(false));
				break;
			case "btn_invite": //邀请
				let gameRule = JGPTJModel.getGameRule()
				gameRule = gameRule || {};
				gameRule.roomId = JGPTJModel.getRoomID();
				let share = ConfigModel.getRoomRuleShare(gameRule);
				NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
				break;
			case "btn_copy": //复制
				let str = ConfigModel.getRoomShare(Enums.bundleType.JGPTJ, JGPTJModel.getRoomID())
				NativeUtil.copyText(str);
				break;
			case "bg": //背景按钮 恢复牌
				this._handCardList[0].setAllCardDown()
				break;
			case "btn_out":
				let cardDataArr = this._handCardList[0].getAllUpCardId()
				if (cardDataArr.length <= 0) {
					// console.log("没有选择牌")
					return
				}
				// console.log("出的牌==", cardDataArr)
				ApiRoom.gameMessageNotify(ApiJgPtj.gameUserOperateNotify(cardDataArr, ApiJgPtj.operateType.OUT));
				break;
			case "btn_pass":
				ApiRoom.gameMessageNotify(ApiJgPtj.gameUserOperateNotify([], ApiJgPtj.operateType.PASS));
				break;
			case "btn_tip":
				this._handCardList[0].showTipCards()
				break;
			case "btn_cardRecord":
				this.onBtnCardRecords()
				break;
			case "btn_zuoxia":
				this.onBtnSitDown()
				break;
			case "btn_pangguan":
				this.onLookOnClick()
				break;
			case "btn_shezhi":
				this.onBtnTest();
				break;
			case "btn_back":
				this.enterHall()
				break;
			default:
				break;
		}
	},
	onShowInvite() {
		AssetsManager.friendDialog({
			gameRule: JGPTJModel.getGameRule(),
		})
	},

	/**消息监听 */
	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.gameInit(msg.data);
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				JGPTJModel.addUser(msg.data.roomUserInfo);
				this.userEnterRoom(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				if (msg.data.roomUserInfo.chairID != JGPTJModel.getMyChairID()) {
					JGPTJModel.delUser(msg.data.roomUserInfo.chairID);
				}
				this.userLeaveRoom(msg.data.roomUserInfo)
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				//		console.log("收到了玩家准备==", msg.data)
				this.onUserReady(msg.data)
			} else if (msg.type === ApiRoom.GAME_END_PUSH) {
				//		console.log("游戏结束《《《《《《《《《", msg)
			} else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
				if (!msg.data.userList || msg.data.userList.length == 0) return;
				msg.data.myChairID = JGPTJModel.getMyChairID();
				AssetsManager.disDialog(msg.data);
			} else if (msg.type === ApiRoom.USER_CHAT_PUSH) {
				let idx = JGPTJModel.getUserChairIndex(msg.data.chairID)
				let com = this._userList[idx]
				if (com) {
					com.gameChat(msg.data)
				}
			} else if (msg.type === ApiRoom.USER_GIFT_SEND_PUSH) {
				this.onGift(msg.data.fromChairID, msg.data.toChairID, msg.data.giftID);
			} else if (msg.type === ApiRoom.USER_OFF_LINE_PUSH) {
				let idx = JGPTJModel.getUserChairIndex(msg.data.chairID)
				let com = this._userList[idx]
				if (com) com.setOffline(true)
			} else if (msg.type === ApiRoom.ROOM_USER_INFO_CHANGE_PUSH) { //用户信息刷新
				// console.log('加锅推筒子-ROOM_USER_INFO_CHANGE_PUSH', msg.data);
				this._userList.forEach(com => {
					if (com) {
						com.userInfoChange(msg.data)
					}
				});
			} else if (msg.type === ApiRoom.ROOM_USER_WIN_TOTAL_PUSH) {
				/**玩家总输赢分数 */
				// console.log("玩家总输赢==", msg.data)
				this.initTotalScore(msg.data.userWinTotalScore)
			} else if (msg.type === ApiRoom.USER_GAME_STATUS_PUSH) {
				// console.log('玩家状态推送', msg.data)
				JGPTJModel.updateUserPlayStatus(msg.data.userPlayStatus);
			} else if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
				if (msg.data.code != 0) {
					if (msg.data.uid == UserModel.getData('uid')) {
						AssetsManager.tipDialog(Codes[msg.data.code]);
					}
					return;
				};
				JGPTJModel.setUserPropertyByUID(msg.data.uid, 'userStatus', msg.data.userStatus);
				JGPTJModel.setUserPropertyByUID(msg.data.uid, 'chairID', msg.data.toChairID);
				if (msg.data.uid == UserModel.getData('uid') && msg.data.toChairID >= JGPTJModel.getChairCount()) {
					//我自己被强制旁观
					this._userList[0].leave()
				}
				if (msg.data.toChairID < JGPTJModel.getChairCount()) {
					if (msg.data.uid == UserModel.getData('uid')) {
						this._userList.forEach(com => {
							com.leave()
						});
						this.getRoomSceneInfo()
					} else {
						/**重新刷新座位 */
						let user = JGPTJModel.getUserByChairID(msg.data.toChairID)
						this.userEnterRoom(user)
					}
				}
				//强制显示未入座的坐下按钮
				this.showSitDownButton();
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiJgPtj.GAME_BUREAU_PUSH) {
				this.onGameRoundUpdate(msg.data)
			} else if (msg.type === ApiJgPtj.GAME_STATUS_PUSH) { //游戏状态
				JGPTJModel.setGameStatus(msg.data.gameStatus)
				this.onGameStatusUpdate(msg.data)
			} else if (msg.type === ApiJgPtj.GAME_DICES_PUSH) {
				// let diceAniNode = cc.instantiate(this.diceAniPfb)
				// diceAniNode.parent = this.animationNode
				// diceAniNode.getComponent("JGPTJDice").init(msg.data.dice1, msg.data.dice2)
			} else if (msg.type === ApiJgPtj.GAME_SEND_CARDS_PUSH) { //发牌
				// console.log("发牌==", msg.data)
				this.onSendCard(msg.data, true)
			} else if (msg.type === ApiJgPtj.GAME_ROB_BANK_PUSH) { //抢庄返回
				// console.log("个人抢庄返回", msg.data)
				this.onRobBanker(msg.data)
			} else if (msg.type === ApiJgPtj.GAME_BANKER_PUSH) { //庄家位置更新
				this.onBankerUpdate(msg.data, true)
			} else if (msg.type === ApiJgPtj.GAME_USER_POUR_SCORE_PUSH) { //玩家下分推送
				// console.log("下分推送==", msg.data)
				this.onPourScoreStart(msg.data)
			} else if (msg.type === ApiJgPtj.GAME_USER_SCORE_PUSH) { //下注
				// console.log("下注结果==", msg.data)
				JGPTJModel.setUserBetScore(msg.data.uid, msg.data.score);
				this.onPlayerBet(msg.data, true)
			}
			else if (msg.type === ApiJgPtj.SHOW_GAME_USER_PUSH) { //玩家亮牌操作
				// console.log("玩家亮牌操作==", msg.data)
				this.onShowCardX(msg.data)
			} else if (msg.type === ApiJgPtj.SHOW_CARDS_PUSH) { //亮牌结果
				// console.log("亮牌结果==", msg.data)
				this.onShowCard(msg.data)
			} else if (msg.type === ApiJgPtj.GAME_QIE_GUO_OPERATE_PUSH) { //切锅
				//		console.log("切锅推送==", msg.data)
				this.ctrl_OptBtn.showQieGuoBtn(msg.data.uid == JGPTJModel.getMyUid());
			} else if (msg.type === ApiJgPtj.SHOW_GUO_SCORE_PUSH) { //切锅
				// console.log("锅底推送==", msg.data)
				this.ctrl_OptBtn.showGuo(msg.data, true)
				// this.com_optBtn.setQieguoNode(msg.data.uid == UserModel.getData("uid"))
			}
			else if (msg.type === ApiJgPtj.GAME_TRUST_PUSH) { //切锅
				// console.log("切锅推送==", msg.data)
				this.ctrl_OptBtn.showGuo(msg.data, true)
				// this.com_optBtn.setQieguoNode(msg.data.uid == UserModel.getData("uid"))
			}
			else if (msg.type === ApiJgPtj.GAME_END_PUSH) {
				if (msg.data.result.length > 0) {
					msg.data.enterHall = this.enterHall.bind(this);
					msg.data.path = 'res/prefab/JGPTJAllResult';
					msg.data.bundle = Enums.bundleType.JGPTJ;
					msg.data.isUnionCreate = JGPTJModel.isUnionCreate();
					msg.data.isBureauFull = (JGPTJModel.getCurBureau() == JGPTJModel.getMaxBureau() && !JGPTJModel.isLookOnUID());
					msg.data.unionID = JGPTJModel.getRoomCreatorByKey("unionID")
					msg.data.gameRule = JGPTJModel.getGameRule()
					msg.data.roomID = JGPTJModel.getRoomID()
					this.unscheduleAllCallbacks();
					this.scheduleOnce(() => {
						MessageCallback.emitMessage('RemoveGameResult');
						AssetsManager.createDialog(msg.data);
					}, 2);
				} else {
					this.enterHall();
				}
			} else if (msg.type === ApiJgPtj.GAME_REVIEW_PUSH) {
				let reviewRecord = msg.data.list
				if (reviewRecord && reviewRecord.length > 0) {
					AssetsManager.createDialog({
						bundle: Enums.bundleType.JGPTJ,
						path: "res/prefab/JGPTJResultDialog",
						reviewRecord: reviewRecord,

					});
				} else {
					AssetsManager.tipDialog('没有数据');
				}
			} else if (msg.type === ApiJgPtj.GAME_RESULT_PUSH) {
				this.onGameResult(msg.data, false)
			}
		} else if (route === 'ReconnectSuccess') {
			this.getRoomSceneInfo();
		} else if (route === 'SelfEntryRoomPush') {
			if (msg.gameType != JGPTJModel.getBundleType()) {
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
		}
	},
});