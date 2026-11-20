const ApiMnPdk = require('./ApiMnPdk');
const ApiRoom = require('../../../src/api/ApiRoom');
const gameLogic = require('./MNPDKGameLogic');
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
const CCUtil = require('../../../src/utils/CCUtil');
const Events = require('../../../src/const/Events');

cc.Class({
	extends: cc.Component,

	properties: {
		bureauLabel: cc.Label,
		txt_gameName: cc.Label,
		handCardWidgetCtrl: require('MNPDKHandCradWidgetCtrl'),
		operationBtnWidgetCtrl: require('MNPDKOperationBtnWdigetCtrl'),
		showOutCardWidgetPrefab: cc.Prefab,
		showHandCardWidgetPrefab: cc.Prefab,
		clockWidgetPrefab: cc.Prefab,
		cardNode: cc.Node,
		animationNode: cc.Node,
		roomIDLabel: cc.Label,
		btnLocation: cc.Node,
		menuLay: cc.Node,
		menuLayList: cc.Node,
		xiaojiesuan: cc.Node,
		dajiesuan: cc.Node,
		btnBackHall: cc.Node,
		btnReady: cc.Node,
		btnYuYin: cc.Node,
		MNPDKTest: cc.Node,
		btnDismiss: cc.Node,
		btnExit: cc.Node,
		canNotDismissBar: cc.Node,

		/**用户脚本列表 下标为本地座位号*/
		_userList: [],
	},

	onLoad() {
		this._curScores = [];
		AssetsManager.init(this.node);
		this.gameInited = false;
		this.myChairID = -1;
		this.roomID = "";
		// 菜单点击
		this.menuLay.active = false
		this.handCardWidgetCtrl.initWidget();
		this.turnCardDataArr = [];
		this.roomUserInfoArr = [null, null, null];
		/**最大游戏人数 */
		this.MAX_USER_NUM = 3
		/**牌数量 */
		this.CARD_COUNT = 13

		for (let i = 1; i <= this.MAX_USER_NUM; i++) {
			let h = cc.find("Head" + i, this.node)
			let com = h.getComponent("MNPDKHead")
			this._userList.push(com)
			com.initRes()
		}
		cc.game.on(cc.game.EVENT_SHOW, this.onEventShow, this);
		MessageCallback.addListener(Events.clientEvents.gvUploadFileSuccess, this);
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
		this._playingSeat = null;
		this._voiceMsgQueue = [];
		this._lastPlayTime = null;
		// 获取场景
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
		this.updateCard0Node();
	},

	updateCard0Node() {
		let url = ConfigModel.getCardUrl();
		AssetsManager.loadSpriteFrame({
			path: url,
			sprite: this.cardNode.getComponent(cc.Sprite)
		});
		for (let i = 2; i <= this.MAX_USER_NUM; i++) {
			let cardCount = cc.find('Head' + i + '/cardCount', this.node);
			AssetsManager.loadSpriteFrame({
				path: url,
				sprite: cardCount.getComponent(cc.Sprite)
			});
		}
	},

	onDestroy() {
		cc.game.off(cc.game.EVENT_SHOW, this.onEventShow, this);
		MessageCallback.removeListener(Events.clientEvents.gvUploadFileSuccess, this);
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

	enterHall() {
		let isUnionCreate = this.roomCreatorInfo && this.roomCreatorInfo.creatorType == Enums.roomCreatorType.UNION_CREATE;
		let unionID = !!isUnionCreate ? this.roomCreatorInfo.unionID : null;
		SubManager.exitBundle(unionID);
	},

	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.USER_LEAVE_ROOM_RESPONSE) {
				if (msg.data.chairID === this.myChairID) { }
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				if (!this.gameInited) return;
				// 设置信息
				this.onUserEntryRoom(msg.data.roomUserInfo);
				this.verifyZuobi(msg.data.roomUserInfo);
				this.updatePlayerHeadPos()
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				// 删除用户信息
				this.onUserLeaveRoom(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				if (!this.gameInited) return;
				// 用户准备
				this.onUserReady(msg.data.chairID);
			} else if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				UserModel.setDatas(msg.data);
				this._curScores = msg.data.gameData.curScores;
				// console.log("房间信息,", msg.data)
				this.roomIDLabel.string = "房号:" + msg.data.roomID;
				this.roomID = msg.data.roomID;
				this.roomCreatorInfo = msg.data.roomCreatorInfo;
				this.gameInit(msg.data.roomUserInfoArr, msg.data.gameData, msg.data.gameRule);
				this.updatePlayerHeadPos();
			} else if (msg.type === ApiRoom.ROOM_USER_INFO_CHANGE_PUSH) {

				for (let i = 0; i < this.roomUserInfoArr.length; ++i) {
					if (this.roomUserInfoArr[i] && this.roomUserInfoArr[i].userInfo.uid === msg.data.changeInfo.uid) {
						this.roomUserInfoArr[i].userInfo = msg.data.changeInfo;
						break;
					}
				}
				this._userList.forEach(com => {
					if (com) {
						com.userInfoChange(msg.data)
					}
				});
				// if (this.curBureau == this.gameRule.bureau) {
				this.updateUserInfo();
				// }
			} else if (msg.type === ApiRoom.ROOM_DISMISS_PUSH) {
				this.askForExitArr = null;
				this.roomDismissReason = msg.data.reason;
			} else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
				this.askForExitArr = msg.data.chairIDArr;
				if (msg.data.chairIDArr.indexOf(false) != -1) {
					this.askForExitArr = null;
				}
				msg.data.myChairID = this.myChairID;
				AssetsManager.nisDialog(msg.data);
			} else if (msg.type === ApiRoom.USER_GIFT_SEND_PUSH) {
				// console.log('礼物----', msg);
				this.onGift(msg.data.fromChairID, msg.data.toChairID, msg.data.giftID);
			} else if (msg.type == ApiRoom.USER_OFF_LINE_PUSH) {
				let index = this.getUserChairIndex(msg.data.chairID);
				let com = this._userList[index]
				com && com.setOffline(true)
			} else if (msg.type === ApiRoom.USER_VOICE_PUSH) {
				this._voiceMsgQueue.push(msg.data);
			} else if (msg.type === ApiRoom.BE_SHORT_OF_GOLD_COINS_PUSH) {
				if (msg.data.uid == UserModel.getData('uid')) {
					AssetsManager.tipDialog('金币不足，不可加入！');
				}
			} else if (msg.type === ApiRoom.ROOM_USER_WIN_TOTAL_PUSH) {
				this.initTotalScore(msg.data.userWinTotalScore)
			} else if (msg.type === ApiRoom.USER_CHAT_PUSH) {
				let index = this.getUserChairIndex(msg.data.chairID);
				let com = this._userList[index]
				com && com.gameChat(msg.data)
			}
		} else if (route === 'GameMessagePush') {
			if (!this.gameInited) return;
			if (msg.type === ApiMnPdk.GAME_START_PUSH) {
				MessageCallback.emitMessage('RemoveGameResult');
				this.btnBackHall.active = false
				this.gameStarted = true;
				this.curBureau = msg.data.curBureau;
				this.bureauLabel.string = '局数：' + msg.data.curBureau + '/' + (this.gameRule.bureau === 9999 ? "自由局" : this.gameRule.bureau);
				this.onGameStart(msg.data.curChairID, msg.data.selfCardArr);
				let unionID = this._isUnionCreate() ? this.getRoomCreatorByKey('unionID') : null;
				let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
				cc.find('copy', this.node).active = msg.data.curBureau == 0 && !!isShowInvite;
				cc.find('invite', this.node).active = msg.data.curBureau == 0 && !!isShowInvite;
				this.isFirstTurnArray = [true, true, true];
				let bg = cc.find('Setting/Layout/bg', this.node);
				if (!!bg && !!bg.active) {
					this.showSettingBg();
				}
			} else if (msg.type === ApiMnPdk.GAME_USER_OUT_CARD_PUSH) {
				this.isFirstTurnArray[msg.data.chairID] = false;
				this.onUserOutCard(msg.data.chairID, msg.data.outCardArr, msg.data.curChairID, msg.data.leftCardCount, msg.data.enablePass, msg.data.handCardArr);
			} else if (msg.type === ApiMnPdk.GAME_USER_PASS_PUSH) {
				this.isFirstTurnArray[msg.data.chairID] = false;
				this.onUserPass(msg.data.chairID, msg.data.curChairID, msg.data.isNewTurn, msg.data.enablePass, msg.data.handCardArr);
			} else if (msg.type === ApiMnPdk.GAME_RESULT_PUSH) {
				this._curScores = msg.data.curScores;
				this.onGameResult(msg.data);
			} else if (msg.type == ApiMnPdk.GAME_DISMISS_PUSH) {
				if (msg.data.userArray) {
					msg.data.isUnionCreate = this._isUnionCreate();
					msg.data.enterHall = this.enterHall.bind(this);
					msg.data.roomDismissReason = msg.data.reason;
					msg.data.myChairID = this.myChairID;
					msg.data.gameRule = this.gameRule;
					msg.data.roomCreatorInfo = this.roomCreatorInfo;
					msg.data.roomID = this.roomID;
					msg.data.curScore = this.getCurScore(this.myChairID);
					msg.data.path = 'res/prefab/MNPDKAllResult';
					msg.data.bundle = Enums.bundleType.MNPDK;
					msg.data.parent = this.dajiesuan;
					this.showMNPDKAllResultFuc = () => {
						this.showMNPDKAllResultFuc = null;
						AssetsManager.createDialog(msg.data);
					};
					this.unscheduleAllCallbacks();
					this.scheduleOnce(() => {
						MessageCallback.emitMessage('RemoveGameResult');
						this.showMNPDKAllResultFuc && this.showMNPDKAllResultFuc();
					}, 2);
				} else {
					this.enterHall();
				}
			} else if (msg.type == ApiMnPdk.GAME_TRUST_PUSH) {
				if (msg.data.chairID == this.myChairID) {
					cc.find('Tuoguan', this.node).active = msg.data.trust;
				}
			} else if (msg.type == ApiMnPdk.GAME_PRETURN_CARDS_PUSH) {
				if (!msg.data.list || msg.data.list.length == 0) {
					AssetsManager.tipDialog('当前局轮次没有出牌记录！');
					return;
				}
				let logic = cc.find('PreTurnCards', this.node).getComponent('MNPDKPreTurnCards');
				logic.init(msg.data.list);
			} else if (msg.type === ApiMnPdk.GAME_INFORM_DRUM_VITALITY_PUSH) {
				/**通知该哪个位置鼓春 */
				this.onGameInformDrumVialityPush(msg)
			} else if (msg.type === ApiMnPdk.GAME_DRUM_VITALITY_PUSH) {
				/**鼓春结果 */
				this.onGameDrumVialityPush(msg)
			} else if (msg.type === ApiMnPdk.GAME_PULL_BACK_PUSH) {
				/**拉回来的结果 */
				this.onGamePullBackPush(msg)
			} else if (msg.type === ApiMnPdk.GAME_INFORM_PULL_BACK_PUSH) {
				/**通知庄家显示拉回来按钮 */
				this.onGameInformPullBackPush(msg)
			} else if (msg.type === ApiMnPdk.GAME_BANKER_PUSH) {
				// console.log("定庄==", msg)
				this.setBanker(msg)
			} else if (msg.type == ApiMnPdk.GAME_USER_OUT_CARD_TURN_PUSH) { //通知第一次该哪个玩家出牌，这个消息每局只会发一次
				this.onUserStartOutCard(msg.data.chairID, true, false);
			}
		} else if (route === 'ReconnectSuccess') {
			this.onReconnectCheck();
		} else if (route == 'UpdateGameBg') { } else if (route == 'UpdateGameCardBg') {
			this.updateCard0Node();
		} else if (route === 'SelfEntryRoomPush') {
			if (msg.gameType != this.getBundleType()) {
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

	getCurScore(chairID) {
		let score = 0;
		for (let i = 0; i < this.MAX_USER_NUM; ++i) {
			let roomUserInfo = this.roomUserInfoArr[i];
			if (!roomUserInfo) continue;
			if (roomUserInfo.chairID == chairID) {
				if (this._isUnionCreate()) {
					score = roomUserInfo.userInfo.score >= 0 ? roomUserInfo.userInfo.score : 0;
				} else {
					score = this._curScores[chairID] || 0;
				}
				break;
			}
		}
		return score;
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

	getBundleType() {
		return Enums.bundleType.MNPDK;
	},

	onBtnClick(event, parameter) {
		if (!this.gameInited) return;

		if (parameter === 'ready') {
			/* this.resetGame(); */
			ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify());
		} else if (parameter === 'pass') {
			// this.selfOutCardCallback(null); 
		} else if (parameter === 'scene') {
			this.handCardWidgetCtrl.resetCardPos();
		} else if (parameter === 'tip') {
			if (!!this.turnCardDataArr && this.turnCardDataArr.length > 0) {
				if (!this.handCardWidgetCtrl.searchOutCard(this.turnCardDataArr)) {
					this.selfOutCardCallback(null);
				}
			}
		} else if (parameter === 'outCard') {
			let selectedCardDataArr = this.handCardWidgetCtrl.getSelectedCard();
			// 下家报单，出单牌的时候判定
			let nextBaodan = false;
			/**找出下家 */
			let nextChairID = -1
			let i = this.myChairID
			while (1) {
				i++
				if (i >= this.roomUserInfoArr.length) {
					i = 0
				}
				if (this.roomUserInfoArr[i] !== null) {
					nextChairID = i
					break
				}
			}
			if (nextChairID !== -1 && nextChairID != this.myChairID) {
				let nextIdx = this.getUserChairIndex(nextChairID)
				// console.log("nextIdx==", nextIdx, "nextChairID=", nextChairID, "myChairID=", this.myChairID)
				let com = this._userList[nextIdx]
				if (com && com.getCardCount() === 1 && selectedCardDataArr.length === 1) {
					nextBaodan = true
				}
			}
			// console.log("是否报单==", nextBaodan)
			if (nextBaodan) { // 必须出最大牌
				let allCardDataArr = this.handCardWidgetCtrl.getAllCard();
				let outCardLogicValue = gameLogic.getCardLogicValue(selectedCardDataArr[0]);
				for (let i = 0; i < allCardDataArr.length; ++i) {
					if (gameLogic.getCardLogicValue(allCardDataArr[i]) > outCardLogicValue) {
						AssetsManager.tipDialog("下家已经报单，单牌必须出最大牌");
						return;
					}
				}
			}
			this.selfOutCardCallback(selectedCardDataArr);
		} else if (parameter === 'exit') {
			if (!UserModel.isInRoom()) {
				this.enterHall();
				return;
			}
			if (!this.gameStarted || this.gameStatus == ApiMnPdk.gameStatus.NONE) {
				ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
			} else {
				AssetsManager.popDialog({
					content: '是否确定发出解散申请？',
					ok: () => {
						ApiRoom.roomMessageNotify(ApiRoom.getAskForDismissNotifyData({
							isExit: true
						}));
					},
					no: () => { }
				});
			}
		} else if (parameter === 'settings') {
			AssetsManager.setDialog({
				type: 'round',
				gameType: Enums.bundleType.MNPDK,
				musicType: Enums.bundleType.POKER,
			});
		} else if (parameter === 'rule') { } else if (parameter === "guchun") { //鼓春
			ApiRoom.gameMessageNotify(ApiMnPdk.gameDrumVitalityNotify(true));
		} else if (parameter === "bugu") { //不鼓春
			ApiRoom.gameMessageNotify(ApiMnPdk.gameDrumVitalityNotify(false));
		} else if (parameter === "lahuilai") { //拉回来
			ApiRoom.gameMessageNotify(ApiMnPdk.gamePullBackNotify(true));
		} else if (parameter === "bula") { //不拉回来
			ApiRoom.gameMessageNotify(ApiMnPdk.gamePullBackNotify(false));
		}
	},

	//获取所有玩家
	getUsers() {
		return this.roomUserInfoArr || [];
	},

	getRoomData() {
		var msg = {
			gameRule: this.gameRule,
			bureau: this.bureauLabel.string,
			handCards: this.handCardWidgetCtrl.getAllCard(),
			roomUserInfoArr: this.roomUserInfoArr,
			roomCreatorInfo: this.roomCreatorInfo,
		};
		return msg;
	},

	gameInit(roomUserInfoArr, gameData, gameRule) {
		MessageCallback.emitMessage('RemoveGameResult');
		this.unscheduleAllCallbacks();
		// console.log('游戏初始化', roomUserInfoArr);
		this.gameInited = true;
		this.askForExitArr = null;
		this.clearOtherUsers();
		for (let user of roomUserInfoArr) {
			this.roomUserInfoArr[user.chairID] = user;
		}
		this._bankerChairID = gameData.guChunChairID
		this.gameStarted = gameData.gameStarted;
		this.gameRule = gameRule;
		this.curBureau = gameData.curBureau;
		this.btnLocation.active = gameRule.maxPlayerCount < 6 && !!this.gameRule.showGps;
		this.isFirstTurnArray = gameData.isFirstTurnArray;
		this.bureauLabel.string = '局数：' + gameData.curBureau + '/' + (this.gameRule.bureau === 9999 ? "自由局" : this.gameRule.bureau);
		this.txt_gameName.string = `游戏:${ConfigModel.getGameName(Enums.bundleType.MNPDK)}`;
		this.btnBackHall.active = gameData.curBureau == 0 && this._isUnionCreate();
		let yuyin = this.gameRule.yuyin;
		this.btnYuYin.active = !!yuyin && ConfigModel.getData('voiceSpeaker');
		if (this.canNotDismissBar) this.canNotDismissBar.active = this.getGameRuleByKey("canNotDissmiss");
		// 获取自己的位置
		for (let i = 0; i < roomUserInfoArr.length; ++i) {
			let roomUserInfo = roomUserInfoArr[i];
			if (roomUserInfo.userInfo.uid === UserModel.getData('uid')) {
				this.myChairID = roomUserInfo.chairID;
				break;
			}
		}
		// 设置用户信息
		for (let i = 0; i < roomUserInfoArr.length; ++i) {
			this.onUserEntryRoom(roomUserInfoArr[i]);
		}
		this.resetGame();
		this.verifyZuobi(roomUserInfoArr[this.myChairID]);
		if (gameData.guChunStatus === ApiMnPdk.guChunStatus.PULL_BACK) {
			if (gameData.guChunChairID !== -1) {
				let index = this.getUserChairIndex(gameData.guChunChairID)
				let com = this._userList[index]
				if (com) com.setShenBao(true)
			}
			let bankerIndex = this.getUserChairIndex(gameData.bankerChairID)
			let bankerCom = this._userList[bankerIndex]
			if (bankerCom) bankerCom.setQiangShenBao(true)
		} else if (gameData.guChunStatus === ApiMnPdk.guChunStatus.GU_CHUN) {
			if (gameData.guChunChairID !== -1) {
				let index = this.getUserChairIndex(gameData.guChunChairID)
				let com = this._userList[index]
				if (com) com.setShenBao(true)
			}
		}

		this.initTotalScore(gameData.userWinTotalScore)

		// 未开局状态
		if (gameData.gameStatus === ApiMnPdk.gameStatus.NONE) {
			let unionID = this._isUnionCreate() ? this.getRoomCreatorByKey('unionID') : null;
			let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
			cc.find('copy', this.node).active = gameData.curBureau == 0 && !!isShowInvite;
			cc.find('invite', this.node).active = gameData.curBureau == 0 && !!isShowInvite;
			// cc.find('backhall', this.node).active = gameData.curBureau == 0;
			for (let user of roomUserInfoArr) {
				if (user.userStatus == ApiRoom.userStatusEnum.READY) {
					this.onUserReady(user.chairID);
				} else {
					if (user.chairID == this.myChairID && this.curBureau < this.gameRule.bureau) {
						this.btnReady.active = true;
					}
				}
			}
		} else if (gameData.gameStatus === ApiMnPdk.gameStatus.GU_CHUN) { //鼓春状态
			/**设置手牌 */
			this.handCardWidgetCtrl.onSendCard(gameData.selfCardArr, false);
			this.handCardWidgetCtrl.startGame();
			/**设置玩家牌数量 */
			for (let i = 0; i < this.MAX_USER_NUM; ++i) {
				this.updateCardCount(i, this.CARD_COUNT);
			}
			// gameStatus:3
			// guChunChairID:-1
			// guChunStatus:0
			// tick:-1
			switch (gameData.guChunStatus) {
				case ApiMnPdk.guChunStatus.NONE:
					/**如果鼓春未操作，显示按钮和倒计时 */
					if (gameData.tick > 0) {
						this.onGameInformDrumVialityPush({
							data: {
								chairID: gameData.opreatChairID,
								tick: gameData.tick
							}
						})
					}
					break;
				case ApiMnPdk.guChunStatus.GU_CHUN:
					/**已经鼓春没有拉回来 ,庄家位置显示拉回来按钮*/
					if (gameData.tick > 0) {
						this.onGameInformPullBackPush({
							data: {
								bankerChairID: gameData.opreatChairID,
								tick: gameData.tick
							}
						})
					}
					break;
			}
		} else if (gameData.gameStatus === ApiMnPdk.gameStatus.OUT_CARD) {
			// 设置手牌
			this.handCardWidgetCtrl.onSendCard(gameData.selfCardArr, false);
			this.handCardWidgetCtrl.startGame();
			// 设置其他玩家手牌数
			for (let i = 0; i < gameData.allUserCardCountArr.length; ++i) {
				// 设置其他玩家手牌数
				this.updateCardCount(i, gameData.allUserCardCountArr[i]);
				let index = this.getUserChairIndex(i);
				// 设置是否需要显示警告
				if (gameData.allUserCardCountArr[i].length === 1) {
					let com = this._userList[index]
					com && com.setAlertAnimation(true)
				}
			}

			// 不是新的一轮则记录上一轮出牌
			this.turnCardDataArr = gameData.turnCardDataArr;
			// 如果是自己出牌，则显示出牌按钮
			if (gameData.curChairID === this.myChairID) {
				this.operationBtnWidgetCtrl.startOutCard(gameData.curChairID === gameData.turnWinerChairID, gameData.enablePass, true);
			}
			// 设置定时器
			this.showClock(gameData.curChairID, this.autoOutCard.bind(this));
		}
		cc.find('Tuoguan', this.node).active = gameData.userTrustArray[this.myChairID];
		cc.find('menu/menuList/bg/TuoButton', this.node).active = true;
		for (let i = 1; i <= this.MAX_USER_NUM; ++i) {
			let node = cc.find('Head' + i + '/msgbg', this.node);
			this.addHeadClickEvent(node, i - 1);
		}
		this.showTest();
		this.showDissButton()
	},

	/**恢复所有人的总输赢分数 */
	initTotalScore(userWinTotalScore) {
		// console.log(userWinTotalScore, this.gameRule.tongji, this.gameRule.tongji, '输赢分');
		if (userWinTotalScore && this.scoreState()) {
			let len = Object.keys(userWinTotalScore)
			if (len.length > 0) {
				for (const chairId in userWinTotalScore) {
					if (Object.hasOwnProperty.call(userWinTotalScore, chairId)) {
						const s = userWinTotalScore[chairId];
						let idx = this.getUserChairIndex(chairId)
						let com = this._userList[idx]
						if (com) com.setTotalScore(s)
					}
				}
			}

		} else {
			this._userList.forEach((user) => {
				user.setTotalScore('0')
			})
		}
	},

	getGameRuleByKey(key) {
		if (!this.gameRule) return null;
		return this.gameRule[key] || null;
	},

	getRoomCreatorByKey(key) {
		return !!this.roomCreatorInfo ? this.roomCreatorInfo[key] : null;
	},

	addHeadClickEvent(node, index) {
		if (!cc.isValid(node)) {
			return
		}
		return
		node.on(cc.Node.EventType.TOUCH_START, () => {
			if (CCUtil.clickInterval(node, 0.5)) return;
			let toChairID = (index + this.myChairID) % this.MAX_USER_NUM;
			let user = this.roomUserInfoArr[toChairID];
			let showHeadDetail = () => {
				try {
					let params = {
						fromChairID: this._mainDialog.myChairID,
						toChairID: user.chairID,
						canSendGift: true,
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
			if (this.getUserTest() && !!user) {
				AssetsManager.createDialog({
					user: user,
					callback: showHeadDetail,
					optChairID: user.chairID,
					bundle: Enums.bundleType.MNPDK,
					path: "res/prefab/MNPDKTestSelect",
				})
				return
			} else {
				showHeadDetail();
			}
		}, this);
	},

	resetGame() {
		MessageCallback.emitMessage('RemoveGameResult');
		// 清除手牌
		this.handCardWidgetCtrl.resetWidget();
		// 清除所有提示
		this.clearState();

		this._userList.forEach(com => {
			com.setOutCard()
		});

		// 清除按钮
		this.operationBtnWidgetCtrl.clearWidget();

		// 清除上轮牌
		this.turnCardDataArr = [];
		// 清楚手牌显示
		// for (let i = 0; i < this.showHandCardNode.length; ++i) {
		// 	this.showHandCardNode[i].removeAllChildren();
		// }

		// 清除发牌动画
		this.stopSendCardAnimation();
	},

	onReconnection() {
		this.resetGame();
		ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
	},

	clearOtherUsers() {
		this._userList.forEach(com => {
			com.leave()
		});
	},

	onUserEntryRoom(roomUserInfo) {
		// 设置用户角色、昵称、金币
		let index = this.getUserChairIndex(roomUserInfo.chairID);
		// console.log('玩家座位号-坐下', index, this.myChairID, this.MAX_USER_NUM)
		let userCom = this._userList[index]
		userCom.init(roomUserInfo, this)
		let score = 0;
		if (this._isUnionCreate()) {
			score = roomUserInfo.userInfo.score >= 0 ? roomUserInfo.userInfo.score : 0;
		} else {
			score = this._curScores[roomUserInfo.chairID] || 0;
		}
		userCom.setUserScore(score)

		this.roomUserInfoArr[roomUserInfo.chairID] = roomUserInfo;
	},

	verifyZuobi(roomUserInfo) {
		if (!this.gameRule.fangzuobi) return;
		if (this.gameRule.maxPlayerCount == 2) return;
		if (roomUserInfo.chairID >= this.gameRule.maxPlayerCount) return;
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

	onUserLeaveRoom(roomUserInfo) {
		// 删除用户信息
		if (roomUserInfo.uid === UserModel.getData('uid')) {
			if (!this.roomID || this.roomID == roomUserInfo.roomID) {
				this.enterHall();
			}
		} else {
			let index = this.getUserChairIndex(roomUserInfo.chairID);
			let com = this._userList[index]
			if (com) {
				com.reset()
				com.leave()
			}
			this.roomUserInfoArr[roomUserInfo.chairID] = null;
		}
	},

	updateUserInfo() {
		for (let i = 0; i < this.MAX_USER_NUM; ++i) {
			let roomUserInfo = this.roomUserInfoArr[i];
			if (!!roomUserInfo) {
				let index = this.getUserChairIndex(roomUserInfo.chairID);
				let score = 0;
				if (this._isUnionCreate()) {
					score = roomUserInfo.userInfo.score >= 0 ? roomUserInfo.userInfo.score : 0;
				} else {
					score = this._curScores[roomUserInfo.chairID] || 0;
				}
				let com = this._userList[index]
				com && com.setUserScore(score)
			}
		}
	},

	onUserReady(chairID) {
		// 显示准备状态
		if (!!this.roomUserInfoArr[chairID]) {
			// console.log('玩家准备', chairID, this.roomUserInfoArr[chairID]);
			this.roomUserInfoArr[chairID].userStatus = ApiRoom.userStatusEnum.READY;
		}
		if (chairID == this.myChairID) {
			let bg = cc.find('Setting/Layout/bg', this.node);
			if (!!bg && bg.active) {
				this.showSettingBg();
			}
			this.resetGame();
			this.btnReady.active = false;
		}
		let index = this.getUserChairIndex(chairID);
		let com = this._userList[index]
		com && com.setReady(true)
	},

	onGameStart(curChairID, selfCardDataArr) {
		this.resetGame();
		if (this.handCardWidgetCtrl.getAllCard().length !== 0) {
			this.handCardWidgetCtrl.resetWidget();
		}
		// 清除状态
		this.clearState();
		// 开始发牌
		let length = selfCardDataArr.length;
		let cardCount = (this.CARD_COUNT);
		if (length != cardCount) { }
		this.handCardWidgetCtrl.onSendCard(selfCardDataArr, true, function (index) {
			AssetsManager.playEffect({
				path: "res/audio/main/sound_send_card",
				bundle: Enums.bundleType.MNPDK
			});
			if (index >= length) {
				// 显示先手玩家
				// 发牌动画结束后，开始鼓春流程
				this.handCardWidgetCtrl.startGame();
				//设置第一个玩家开始出牌
				// this.onUserStartOutCard(curChairID, true, false);
				// 停止动画
				this.stopSendCardAnimation();
			}
		}.bind(this));
		// 播放发牌动画
		this.showSendCardAnimation();
		// 显示玩家牌数
		for (let i = 0; i < this.MAX_USER_NUM; ++i) {
			this.updateCardCount(i, this.CARD_COUNT);
		}
		this._userList.forEach(com => {
			com.setReady(false)
		});
		// cc.find('backhall', this.node).active = false;
	},

	onUserStartOutCard(chairID, isNewTurn, enablePass) {
		let index = this.getUserChairIndex(chairID);
		// 设置下一个出牌玩家
		if (chairID === this.myChairID && !enablePass) {
			this.operationBtnWidgetCtrl.startOutCard(isNewTurn, enablePass, true);
		}
		if (chairID === this.myChairID || enablePass) {
			let com = this._userList[index]
			com && com.setOutCard()
		}
		// 清理自己家的出牌
		for (let i = 0; i < this._userList.length; ++i) {
			const com = this._userList[i]
			if (com && isNewTurn) {
				com.setReady(false)
				// com.setPassNode(false)
			}
		}
		// 开启定时器
		if (!enablePass) {
			this.showClock(chairID, this.autoOutCard.bind(this));
		}
		if (isNewTurn && chairID == this.myChairID) {
			let handCardDataArr = this.handCardWidgetCtrl.getAllCard();
			let allCardDataArr = this.handCardWidgetCtrl.getAllCard();
			this.gameRule.lastTurn = allCardDataArr.length == handCardDataArr.length
			let cardType = gameLogic.getRestCardsType(handCardDataArr, this.gameRule);
			// console.log("检查到的牌型==", cardType, !!cardType)
			if (!!cardType) {
				// console.log("自动出牌")
				let autoCardArr = handCardDataArr.slice();
				this.selfOutCardCallback(autoCardArr);
			}
		}
	},

	selfOutCardCallback(cardDataArr) {
		if (!cardDataArr) { // 发送消息
			// ApiRoom.gameMessageNotify(ApiMnPdk.gameUserPassNotify());
			// this.sendOutPass();
			// console.log("出错了，没有找到牌型")
		} else {
			if (cardDataArr.length === 0) { // 提示
				//AssetsManager.tipDialog('出牌错误');
				return;
			}
			// 检查牌是否符合要求
			let allCardDataArr = this.handCardWidgetCtrl.getAllCard();
			this.gameRule.lastTurn = allCardDataArr.length == cardDataArr.length
			cardDataArr = gameLogic.sortCardList(cardDataArr);
			let cardType = gameLogic.getCardType(cardDataArr, this.gameRule);
			let handCards = gameLogic.sortCardList(this.handCardWidgetCtrl.getAllCard());
			// console.log("出的牌==", cardDataArr, "牌型==", cardType)
			if (handCards.length == cardDataArr.length) {
				cardType = gameLogic.getRestCardsType(cardDataArr, this.gameRule);
			}
			if (cardType === ApiMnPdk.cardType.ERROR) { // 提示
				AssetsManager.tipDialog('出牌不符合规则');
				return;
			}
			if (this.turnCardDataArr.length > 0) {
				if (!gameLogic.compareCard(this.turnCardDataArr, cardDataArr, this.gameRule, this.gameRule.lastTurn)) { // 提示错误
					AssetsManager.tipDialog('出牌必须大过上轮');
					return;
				}
			}
			// /* 拆分炸弹检测 */
			// if (!this.gameRule.chaizhadan && (cardType != ApiMnPdk.cardType.FOUR_LINE_TAKE_TWO && cardType != ApiMnPdk.cardType.BOMB_CARD)) {
			// 	let boomArray = [];
			// 	for (let i = 3; i < handCards.length; ++i) {
			// 		if (gameLogic.getCardValue(handCards[i]) == gameLogic.getCardValue(handCards[i - 1]) &&
			// 			gameLogic.getCardValue(handCards[i]) == gameLogic.getCardValue(handCards[i - 2]) &&
			// 			gameLogic.getCardValue(handCards[i]) == gameLogic.getCardValue(handCards[i - 3])) {
			// 			boomArray.push(gameLogic.getCardValue(handCards[i]));
			// 		}
			// 	}
			// 	if (boomArray.length > 0) {
			// 		for (let card of cardDataArr) {
			// 			if (boomArray.indexOf(gameLogic.getCardValue(card)) != -1) {
			// 				AssetsManager.tipDialog('炸弹不能拆分');
			// 				return;
			// 			}
			// 		}
			// 	}
			// }

			/* 摆尾 */
			// if (cardType == ApiMnPdk.cardType.THREE_LINE || cardType == ApiMnPdk.cardType.THREE_LINE_TAKE_ONE) {
			// 	if (!lastTurn || this.gameRule.baiwei) {
			// 		AssetsManager.tipDialog('三张必须带两张牌');
			// 		return;
			// 	}
			// }
			/* if (!lastTurn && this.gameRule.baiwei && (cardType == ApiMnPdk.cardType.THREE_LINE || cardType == ApiMnPdk.cardType.THREE_LINE_TAKE_ONE)) {
				AssetsManager.tipDialog('三张必须带两张牌');
				return;
			} */

			/* 首局黑桃5必出 */
			let isFirstChairID = true;
			let handCount = (this.CARD_COUNT);
			let firstCard = 0x35 //this.getFirstOutCard(allCardDataArr);
			if (this.gameRule.firstRoundOut == ApiMnPdk.firstRoundOut.HEITAOWU && allCardDataArr.length == handCount && allCardDataArr.includes(firstCard)) {
				for (let i = 1; i < this._userList.length; i++) {
					const com = this._userList[i];
					if (com.getCardCount() != handCount) {
						isFirstChairID = false
						break
					}
				}
			} else {
				isFirstChairID = false;
			}
			// console.log("是不是首轮出牌", isFirstChairID)
			if (this.curBureau == 1 && isFirstChairID) {
				let color = gameLogic.getCardColor(firstCard) / 16;
				color = ['方块', '梅花', '红桃', '黑桃'][color];
				let tt = cardDataArr.includes(firstCard)
				// console.log("选择的牌中是否包含了黑桃5", tt, cardDataArr)
				if (cardDataArr.indexOf(firstCard) == -1) {
					AssetsManager.tipDialog('首张牌必出' + color + gameLogic.getCardValue(firstCard));
					return;
				}
			}
			// 出牌
			ApiRoom.gameMessageNotify(ApiMnPdk.gameUserOutCardNotify(cardDataArr));
			this.sendOutMyCard(cardDataArr);
		}
	},

	onUserOutCard(chairID, cardDataArr, curChairID, leftCardCount, enablePass, handCardArr) {

		for (let i = 0; i < this._userList.length; ++i) {
			const com = this._userList[i]
			if (com) {
				com.setReady(false)
				com.setPassNode(false)
			}
		}
		let index = this.getUserChairIndex(chairID);
		let isPreOperate = true; // 是否提前出牌，预操作 
		let userCom = this._userList[index]
		userCom && userCom.setClock()
		this.updateCardCount(chairID, leftCardCount); // 更新玩家手牌数
		if (chairID !== this.myChairID) {
			isPreOperate = false;
			if (leftCardCount === 1) { // 设置是否需要显示警告
				userCom && userCom.setAlertAnimation(true)
				let audio = 'res/audio/man/man_baojing1';
				let user = this.roomUserInfoArr[chairID];
				if (user && user.userInfo.sex == 1) {
					audio = audio.replace(/man/g, "woman");
				}
				AssetsManager.playEffect({
					path: audio,
					bundle: Enums.bundleType.MNPDK
				});
			}
		} else {
			let curCardArr = this.handCardWidgetCtrl.getAllCard();
			isPreOperate = (curCardArr.length == handCardArr.length);
			let handCardArrTemp = handCardArr;
			if (isPreOperate) {
				curCardArr.sort((a, b) => a - b);
				handCardArrTemp.sort((a, b) => a - b);
				for (let i = 0; i < curCardArr.length && isPreOperate; ++i) {
					isPreOperate = (curCardArr[i] == handCardArrTemp[i]);
				}
			}
			if (curChairID >= 0) { // 设置下一个出牌玩家
				this.onUserStartOutCard(curChairID, false, enablePass);
			}
			if (!isPreOperate) {
				let clockNode = this.operationBtnWidgetCtrl.getClockNode(); // 停止计时器
				if (!!clockNode) {
					clockNode.destroyAllChildren();
				}
				this.operationBtnWidgetCtrl.clearWidget(); // 隐藏按钮
				// this.handCardWidgetCtrl.removeCard(cardDataArr); // 删除牌
				// this.handCardWidgetCtrl.resetSearchOutCardState();
				this.handCardWidgetCtrl.resetWidget();
				this.handCardWidgetCtrl.onSendCard(handCardArr, false);
				this.handCardWidgetCtrl.startGame();
			}
		}
		if (!isPreOperate) {
			this.playOutCardSound(!this.turnCardDataArr || this.turnCardDataArr.length === 0, cardDataArr, chairID); // 播放出牌音效
			this.turnCardDataArr = cardDataArr;
		}
		let node = cc.instantiate(this.showOutCardWidgetPrefab);
		userCom && userCom.setOutCard()
		userCom && userCom.setOutCard(node)

		let ctrl = node.getComponent('MNPDKShowOutCardWidgetCtrl');
		ctrl.initWidget(cardDataArr, index);
		if (!isPreOperate) {
			this.playOutCardAnimation(cardDataArr, ctrl); // 播放动画
		}
		if (curChairID >= 0) { // 设置下一个出牌玩家
			this.onUserStartOutCard(curChairID, false, enablePass);
		}
	},

	sendOutMyCard(cardDataArr) {
		let index = this.getUserChairIndex(this.myChairID);
		let clockNode = this.operationBtnWidgetCtrl.getClockNode(); // 停止计时器
		if (!!clockNode) {
			clockNode.destroyAllChildren();
		}
		this.operationBtnWidgetCtrl.clearWidget(); // 隐藏按钮
		this.handCardWidgetCtrl.removeCard(cardDataArr); // 删除牌
		this.handCardWidgetCtrl.resetSearchOutCardState();
		this.playOutCardSound(!this.turnCardDataArr || this.turnCardDataArr.length === 0, cardDataArr, this.myChairID); // 播放出牌音效
		this.turnCardDataArr = cardDataArr;
		let node = cc.instantiate(this.showOutCardWidgetPrefab); // 显示出牌
		let com = this._userList[index]
		com && com.setOutCard()
		com && com.setOutCard(node)
		let ctrl = node.getComponent('MNPDKShowOutCardWidgetCtrl');
		ctrl.initWidget(cardDataArr, index);
		this.playOutCardAnimation(cardDataArr, ctrl); // 播放动画
	},

	playOutCardSound(isFirst, cardDataArr, chairID) {
		let cardType = gameLogic.getCardType(cardDataArr, this.gameRule);
		let audio = "";
		if (cardType === ApiMnPdk.cardType.SINGLE) {
			let value = gameLogic.getCardValue(cardDataArr[0]);
			audio = "res/audio/man/man_" + value;
		} else if (cardType === ApiMnPdk.cardType.DOUBLE) {
			let value = gameLogic.getCardValue(cardDataArr[0]);
			audio = "res/audio/man/man_dui" + value;
		} else if (cardType === ApiMnPdk.cardType.THREE_LINE) {
			let value = gameLogic.getCardValue(cardDataArr[0]);
			audio = "res/audio/man/man_tuple" + value;
		} else if (cardType === ApiMnPdk.cardType.SINGLE_LINE) {
			if (isFirst) {
				audio = "res/audio/man/man_shunzi";
			} else {
				audio = "res/audio/man/man_dani" + Utils.getRandomNum(1, 3);
			}
		} else if (cardType === ApiMnPdk.cardType.DOUBLE_LINE) {
			if (isFirst) {
				audio = "res/audio/man/man_liandui";
			} else {
				audio = "res/audio/man/man_dani" + Utils.getRandomNum(1, 3);
			}
		} else if (cardType === ApiMnPdk.cardType.THREE_LINE) {
			if (isFirst) {
				audio = "res/audio/man/man_feiji";
			} else {
				audio = "res/audio/man/man_dani" + Utils.getRandomNum(1, 3);
			}
		} else if (cardType === ApiMnPdk.cardType.THREE_LINE_TAKE_ONE) {
			if (isFirst) {
				if (cardDataArr.length === 4) {
					audio = "res/audio/man/man_sandaiyi";
				} else {
					audio = "res/audio/man/man_feiji";
				}
			} else {
				audio = "res/audio/man/man_dani" + Utils.getRandomNum(1, 3);
			}
		} else if (cardType === ApiMnPdk.cardType.THREE_LINE_TAKE_TWO) {
			if (isFirst) {
				if (cardDataArr.length === 5) {
					audio = "res/audio/man/man_sandaiyidui";
				} else {
					audio = "res/audio/man/man_feiji";
				}
			} else {
				audio = "res/audio/man/man_dani" + Utils.getRandomNum(1, 3);
			}
		} else if (cardType === ApiMnPdk.cardType.BOMB_CARD) {
			audio = "res/audio/man/man_zhadan";
		} else if (cardType === ApiMnPdk.cardType.FOUR_LINE_TAKE_TWO) {
			audio = "res/audio/man/man_sidaier";
		} else if (cardType === ApiMnPdk.cardType.FOUR_LINE_TAKE_THREE) {
			audio = "res/audio/man/man_sidaisan";
		}
		let user = this.roomUserInfoArr[chairID];
		if (user && user.userInfo.sex == 1) {
			audio = audio.replace(/man/g, "woman");
		}
		AssetsManager.playEffect({
			path: audio,
			bundle: Enums.bundleType.MNPDK
		});
	},

	playOutCardAnimation(cardDataArr, ctrl) {
		let ainmType = null;
		let cardType = gameLogic.getCardType(cardDataArr, this.gameRule);
		if (cardType === ApiMnPdk.cardType.BOMB_CARD) {
			ainmType = 10;
		} else if (cardType === ApiMnPdk.cardType.THREE_LINE) {// 三连
			if (cardDataArr.length > 3) {
				ainmType = 6;
			} else {
				ainmType = 2;
			}
		} else if (cardType === ApiMnPdk.cardType.THREE_LINE_TAKE_ONE) {// 三连带1
			if (cardDataArr.length > 4) {
				ainmType = 6;
			} else {
				ainmType = 3;
			}
		} else if (cardType === ApiMnPdk.cardType.THREE_LINE_TAKE_TWO) {// 三连带2
			if (cardDataArr.length > 5) {
				ainmType = 6;
			} else {
				ainmType = 4;
			}
		} else if (cardType === ApiMnPdk.cardType.SINGLE_LINE) {// 单连
			ainmType = 0;
		} else if (cardType === ApiMnPdk.cardType.DOUBLE_LINE) {// 对连
			ainmType = 1;
		} else if (cardType === ApiMnPdk.cardType.FOUR_LINE_TAKE_TWO) {// 四带2
			ainmType = 8;
		} else if (cardType === ApiMnPdk.cardType.FOUR_LINE_TAKE_THREE) {// 四带3
			ainmType = 9;
		}

		if (ainmType != null) {
			let outCardPos = ctrl.getCenterPos();
			let targetPos = ctrl.node.convertToWorldSpaceAR(outCardPos);
			let ainmPos = this.animationNode.convertToNodeSpaceAR(targetPos);
			ainmPos && this.showAinm(ainmType, (node) => {
				this.animationNode.addChild(node);
			}, ainmPos);
		}
	},

	showAinm(ainmType, runFunc, pos = cc.v2(0, 0), endFunc) {
		if (ainmType == null) return;
		AssetsManager.loadAsset({
			path: "res/prefab/MNPDKEffectAinm",
			bundle: Enums.bundleType.MNPDK,
			aType: cc.Prefab
		}, (item) => {
			if (!item) return;
			const ainmNode = cc.instantiate(item);
			let ctrl = ainmNode.getComponent("MNPDKEffectAinm");
			ctrl.showOptAni(ainmType, endFunc);
			runFunc && runFunc(ainmNode);
			ainmNode.setPosition(pos);
		});
	},

	onUserPass(chairID, curChairID, isNewTurn, enablePass, handCardArr) {
		let isPreOperate = true;

		for (let i = 0; i < this._userList.length; ++i) {
			const com = this._userList[i]
			if (com) {
				com.setReady(false)
				com.setPassNode(false)
			}
		}
		// 显示pass状态
		let index = this.getUserChairIndex(chairID);
		let userCom = this._userList[index]
		if (userCom) userCom.setPassNode(true)
		if (chairID !== this.myChairID) {
			isPreOperate = false;
		} else {
			let curCardArr = this.handCardWidgetCtrl.getAllCard();
			isPreOperate = (curCardArr.length == handCardArr.length);
			let handCardArrTemp = handCardArr;
			if (isPreOperate) {
				curCardArr.sort((a, b) => a - b);
				handCardArrTemp.sort((a, b) => a - b);
				for (let i = 0; i < curCardArr.length && isPreOperate; ++i) {
					isPreOperate = (curCardArr[i] == handCardArrTemp[i]);
				}
			}
			if (!isPreOperate) {
				let clockNode = this.operationBtnWidgetCtrl.getClockNode();
				if (!!clockNode) { // 停止计时器
					clockNode.destroyAllChildren();
				}
				this.operationBtnWidgetCtrl.clearWidget(); // 隐藏按钮
				this.handCardWidgetCtrl.resetWidget();
				this.handCardWidgetCtrl.resetCardPos(); // 重置手牌位置
				this.handCardWidgetCtrl.resetSearchOutCardState();
				this.handCardWidgetCtrl.onSendCard(handCardArr, false);
				this.handCardWidgetCtrl.startGame();
			}
		}
		if (isNewTurn) {
			this.turnCardDataArr = [];
		}
		// 删除定时器

		userCom && userCom.setClock()

		// 设置下一个出牌玩家
		if (curChairID >= 0) {
			this.onUserStartOutCard(curChairID, isNewTurn, enablePass);
		}

		let audio = "res/audio/man/man_buyao1";
		let user = this.roomUserInfoArr[chairID];
		if (user && user.userInfo.sex == 1) {
			audio = audio.replace(/man/g, "woman");
		}
		AssetsManager.playEffect({
			path: audio,
			bundle: Enums.bundleType.MNPDK
		});
	},

	sendOutPass() {
		let clockNode = this.operationBtnWidgetCtrl.getClockNode();
		if (!!clockNode) { // 停止计时器
			clockNode.destroyAllChildren();
		}
		this.operationBtnWidgetCtrl.clearWidget(); // 隐藏按钮
		this.handCardWidgetCtrl.resetCardPos(); // 重置手牌位置
		this.handCardWidgetCtrl.resetSearchOutCardState();
		let audio = "res/audio/man/man_buyao1";
		let user = this.roomUserInfoArr[this.myChairID];
		if (user && user.userInfo.sex == 1) {
			audio = audio.replace(/man/g, "woman");
		}
		AssetsManager.playEffect({
			path: audio,
			bundle: Enums.bundleType.MNPDK
		});
	},

	showOtherCards(resultData) {
		// for (let i = 0; i < this.MAX_USER_NUM; ++i) {
		// 	let index = this.getUserChairIndex(i);
		// 	if (index === 0 || !resultData.allHandCards) continue;
		// 	this.showHandCardNode[index].removeAllChildren();
		// 	let cardArr = resultData.allHandCards[i];
		// 	if (cardArr.length > 0 && this.roomUserInfoArr[i]) {
		// 		for (let j = 0; j < cardArr.length; j += 10) {
		// 			let node = cc.instantiate(this.showHandCardWidgetPrefab);
		// 			let ctrl = node.getComponent('MNPDKShowHandCardWidgetCtrl');
		// 			ctrl.initWidget(cardArr.slice(j, j + 10), index);
		// 			node.parent = this.showHandCardNode[index];
		// 		}
		// 	}
		// }
	},

	onGameResult(resultData) {

		// 隐藏状态
		this.clearState()

		if (resultData.hasChuntian) {
			/* 有春天 */
			this.showAinm(11, (node) => {
				this.node.addChild(node)
			})
		}

		this.scheduleOnce(function () { // 显示结果
			let nodeParams = { // 创建结束界面
				bundle: Enums.bundleType.MNPDK,
				resultData: resultData,
				myChairID: this.myChairID,
				isBureauFull: (this.curBureau == this.gameRule.bureau),
				isDismissing: this.isDismissing.bind(this),
				mainDialog: this,
				path: 'res/prefab/MNPDKResultDialog',
				parent: this.xiaojiesuan,
			};
			AssetsManager.createDialog(nodeParams);
			this.btnReady.active = true && (this.curBureau < this.gameRule.bureau);
			this.updateUserInfo(); // 刷新用户信息
		}.bind(this), (this.curBureau == this.gameRule.bureau) ? 0 : 0.5);

		this._userList.forEach(com => {
			com.setOutCard()
		});
	},

	autoOutCard() {
		let autoCardArr = null;
		if (this.turnCardDataArr.length === 0) {
			let handCardDataArr = this.handCardWidgetCtrl.getAllCard();
			if (!!gameLogic.getCardType(handCardDataArr, this.gameRule)) {
				autoCardArr = handCardDataArr.slice();
			} else {
				autoCardArr = [handCardDataArr[handCardDataArr.length - 1]];
			}
		} else {
			if (!!this.handCardWidgetCtrl.searchOutCard(this.turnCardDataArr, this.gameRule)) {
				autoCardArr = this.handCardWidgetCtrl.getSelectedCard();
			}
		}
		this.selfOutCardCallback(autoCardArr);
	},

	showClock(chairID, timeOutCallback, time = null) {
		if (!time) {
			time = this.getIsFirstTurnByChairID(chairID) ? 30 : ApiMnPdk.OUT_CARD_TIME;
		}
		let node = cc.instantiate(this.clockWidgetPrefab);
		let ctrl = node.getComponent('MNPDKClockWidgetCtrl');
		ctrl.isDismissing = this.isDismissing.bind(this);
		let index = this.getUserChairIndex(chairID);
		let com = this._userList[index]
		com && com.setClock();

		if (this.myChairID != chairID) {
			com && com.setClock(node)
		} else {
			let clockNode = this.operationBtnWidgetCtrl.getClockNode(); // 停止计时器
			if (clockNode) {
				clockNode.destroyAllChildren();
				clockNode.addChild(node);
				node.setPosition(0, 0);
			}
		}
		ctrl.startClock(time, (this.myChairID === chairID) ? timeOutCallback : null);
	},

	updateCardCount(chairID, count) {
		if (chairID === this.myChairID) {
			return;
		}
		let index = this.getUserChairIndex(chairID);
		let com = this._userList[index]
		if (!com) return

		com.setCardCount(count)

	},

	getUserByUID(uid) {
		if (!this.roomUserInfoArr) return null;
		let roomUser = null;
		roomUser = this.roomUserInfoArr.find((user) => {
			return user.uid === uid;
		});
		return roomUser;
	},

	/**座位号转换 */
	getUserChairIndex(chairID) {
		return (chairID - this.myChairID + this.MAX_USER_NUM) % this.MAX_USER_NUM;
	},

	clearState() {
		/**清除鼓和拉的标志 */
		this._userList.forEach(com => {
			com.reset()
		});
	},

	// 动画
	// 发牌动画
	showSendCardAnimation() {
		// this.cardNode.active = true;

		let endpos = this.handCardWidgetCtrl.node.getPosition()
		for (let i = 0; i < 10; i++) {
			let dt = 0.1 * i
			// console.log("创建牌===", i, dt)
			// this.scheduleOnce(this.createCard, 0.1 * i);
			let node0 = cc.instantiate(this.cardNode);
			node0.active = true;
			node0.parent = this.cardNode.parent;
			cc.tween(node0).delay(dt).to(0.1, {
				position: endpos
			}).call(() => {
				node0.destroy()
			}).start()
		}
	},

	// 停止发牌动画
	stopSendCardAnimation() {
		// this.cardNode.active = false;
		// this.unschedule(this.createCard);
	},

	// 创建牌
	createCard() {
		// console.log("穿件怕====")
		let node0 = cc.instantiate(this.cardNode);
		node0.active = true;
		node0.parent = this.cardNode.parent;
		node0.runAction(cc.sequence([cc.moveBy(0.2, cc.v2(0, -300)), cc.removeSelf()]));

		// if (this.roomUserInfoArr[(this.myChairID + 1) % 3]) {
		// 	let node1 = cc.instantiate(this.cardNode);
		// 	node1.active = true;
		// 	node1.parent = this.cardNode.parent;
		// 	node1.runAction(cc.sequence([cc.moveBy(0.2, cc.v2(400, -100)), cc.removeSelf()]));
		// }

		// if (this.roomUserInfoArr[(this.myChairID + 2) % 3]) {
		// 	let node2 = cc.instantiate(this.cardNode);
		// 	node2.active = true;
		// 	node2.parent = this.cardNode.parent;
		// 	node2.runAction(cc.sequence([cc.moveBy(0.2, cc.v2(-400, -100)), cc.removeSelf()]));
		// }
	},

	showDissButton() {
		let curBureau = this.curBureau
		this.btnDismiss.active = curBureau > 0 && !this.getGameRuleByKey("canNotDissmiss");
		this.btnExit.active = curBureau == 0;
	},

	showSettingBg() {
		AssetsManager.loadSpriteFrame({
			path: 'sprite/common/pull',
			sprite: this.menuSprite
		});
	},

	onSwitchClick() {
		if (!this.gameInited) return;
		this.showDissButton()
		this.showSettingBg()
	},

	onTrustClick() {
		this._onMenuCloseClick();
		ApiRoom.gameMessageNotify(ApiMnPdk.gameTrushNotify(true));
	},

	onCancelTuoguan() {
		ApiRoom.gameMessageNotify(ApiMnPdk.gameTrushNotify(false));
	},

	onSettingClick() {
		this._onMenuCloseClick();
		AssetsManager.setDialog({
			type: 'round',
			gameType: Enums.bundleType.MNPDK,
			musicType: Enums.bundleType.POKER,
		});
		this.showSettingBg();
	},

	onRuleClick() {
		this._onMenuCloseClick();
		let node = cc.find('RoomInfo', this.node);
		if (CCUtil.clickInterval(node, 0.5)) return;
		AssetsManager.tableDialog({
			gameRule: this.gameRule,
		});
	},

	onDisClick(event, param) {
		this._onMenuCloseClick();
		if (param != 'backhall') {
			this.showSettingBg();
		}
		AssetsManager.popDialog({
			content: '是否确定发出解散申请？',
			ok: () => {
				ApiRoom.roomMessageNotify(ApiRoom.getAskForDismissNotifyData({
					isExit: true
				}));
			},
			no: () => { }
		});
	},

	onExitClick(event, param) {
		this._onMenuCloseClick();
		if (param != 'backhall') {
			this.showSettingBg();
		}
		if (!UserModel.isInRoom()) {
			this.enterHall();
			return;
		}
		ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
	},

	hasHeitao3(cards) {
		for (let card of cards) {
			if (card == 0x33) {
				return true;
			}
		}
		return false;
	},

	onReadyClick() {

		this.onBtnClick(null, 'ready');
		this.btnReady.active = false;
	},

	onCopyRoomID() {

		let str = ConfigModel.getRoomShare(Enums.bundleType.MNPDK, this.roomID);
		NativeUtil.copyText(str);
	},

	onInviteFriend() {

		let gameRule = this.gameRule;
		gameRule = gameRule || {};
		let roomId = this.roomID;
		gameRule.roomId = roomId;
		let share = ConfigModel.getRoomRuleShare(gameRule);
		// console.log('测试-分享', share);
		NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
	},

	onReview() {
		this._onMenuCloseClick();
		ApiRoom.gameMessageNotify(ApiMnPdk.gamePreTurnCardsNotify());
	},

	getGameRule() {
		return this.gameRule || {};
	},


	onGift(fromChairID, toChairID, giftID) {
		let startIndex = this.getUserChairIndex(fromChairID);
		let sender = this._userList[startIndex].node;
		let reciever = [],
			rids = [];
		if (fromChairID == toChairID) {
			if (!this.roomUserInfoArr) return;
			for (let index = 0; index < this.roomUserInfoArr.length; index++) {
				if (!this.roomUserInfoArr[index]) continue;
				let playerIndex = this.getUserChairIndex(this.roomUserInfoArr[index].chairID);
				let pnode = this._userList[playerIndex].node
				if (!pnode) continue;
				reciever.push(pnode);
				rids.push(this.roomUserInfoArr[index].chairID);
			}
		} else {
			let endIndex = this.getUserChairIndex(toChairID);
			let endCom = this._userList[endIndex]
			if (!endCom) return;
			reciever.push(endCom.node);
			rids.push(toChairID);
		}
		AssetsManager.addGift({
			sid: fromChairID,
			rids: rids,
			reciever: reciever,
			sender: sender,
			id: giftID,
			parent: this.node
		})
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
		this._playingSeat.getChildByName("playVioce").active = false;
		this._playingSeat = null;
	},

	/*
	 * 首轮获取必须先出的牌
	 */
	getFirstOutCard(cards) {
		for (let i = 0x35; i <= 0x3C; ++i) {
			for (let j = i; j >= 0x01; j -= 0x10) {
				for (let k = 0; k < cards.length; ++k) {
					if (cards[k] == j) {
						return cards[k];
					}
				}
			}
		}
		return null;
	},

	isDismissing() {
		return !!this.askForExitArr;
	},

	onRefrush(event) {
		if (!this.gameInited) {
			return;
		}
		if (CCUtil.clickInterval(event.target, 10, true)) return;
		AssetsManager.tipDialog('刷新界面可以修复游戏显示问题');
		this.messageCallbackHandler('ReconnectSuccess');
	},

	getIsFirstTurnByChairID(chairID) {
		return this.isFirstTurnArray[chairID];
	},

	/**动态设置头像位置 */
	updatePlayerHeadPos() {
		let maxCount = this.gameRule.maxPlayerCount
		if (maxCount === 2) {
			// for (let i = 2; i <= this.MAX_USER_NUM; i++) {
			// 	let head = cc.find("Head" + i, this.node)
			// 	if (head && head.active) {
			// 		let x = i <= 3 ? 300 : -300
			// 		head.setPosition(cc.v2(x, 230));
			// 		break
			// 	}
			// }
			// let head2 = cc.find('Head2', this.node);
			// head2.setPosition(cc.v2(300, 245));

			// let head3 = cc.find('Head3', this.node);
			// head3.setPosition(cc.v2(-160, 245));
		}

	},

	setBanker(msg) {
		this._bankerChairID = msg.data.bankerChairID
		let index = this.getUserChairIndex(msg.data.bankerChairID);
		for (let i = 0; i < this.MAX_USER_NUM; ++i) {
			let bankNode = cc.find("Head" + (i + 1) + "/banker", this.node);
			bankNode.active = (i == index);
		}
	},

	/**通知应该哪个位置显示鼓春按钮 */
	onGameInformDrumVialityPush(msg) {
		// chairID: chairID,
		// 	tick: tick,
		// console.log("收到鼓春通知", msg.data, this.myChairID)
		let data = msg.data
		if (data.chairID === this.myChairID) {
			this.operationBtnWidgetCtrl.showGuChunNode()
		}
		this.showClock(data.chairID, () => { }, data.tick)
	},

	/**通知庄家显示拉回来按钮 */
	onGameInformPullBackPush(msg) {
		// console.log("收到拉回来显示通知", msg.data, this.myChairID)
		let data = msg.data
		if (data.bankerChairID === this.myChairID)
			this.operationBtnWidgetCtrl.showLaNode()
		this.showClock(data.bankerChairID, () => { }, data.tick)
	},

	/**鼓春结果 */
	onGameDrumVialityPush(msg) {
		/**去掉当前位置时钟和按钮显示 */
		let data = msg.data;
		// console.log("收到鼓春结果", msg.data, data.trust)
		let index = this.getUserChairIndex(data.chairID);
		let user = this.roomUserInfoArr[data.chairID];
		this.operationBtnWidgetCtrl.clearWidget();

		let com = this._userList[index]
		if (com) {
			com.setShenBao(data.trust)
			com.setClock()
		}
		// let audio = 'res/audio/man/man_' + (!!data.trust ? 'guchun' : 'bugu');
		// if (user && user.userInfo.sex == 1) {
		// 	audio = audio.replace(/man/g, "woman");
		// }
		// console.log('收到鼓春结果1', audio);
		// AssetsManager.playEffect({
		// 	path: audio,
		// 	bundle: Enums.bundleType.MNPDK
		// });
		this.showGuLaAni(1, data.trust, index);
	},

	/**拉回来结果 */
	onGamePullBackPush(msg) {
		let data = msg.data;
		// console.log("收到拉回来结果", msg.data, data.trust)
		let index = this.getUserChairIndex(data.bankerChairID);
		let user = this.roomUserInfoArr[data.chairID];

		this.operationBtnWidgetCtrl.clearWidget();
		let com = this._userList[index]
		if (com) {
			com.setQiangShenBao(data.trust)
			com.setClock()
		}
		// let audio = 'res/audio/man/man_' + (!!data.trust ? 'lahui' : 'bula');
		// if (user && user.userInfo.sex == 1) {
		// 	audio = audio.replace(/man/g, "woman");
		// }
		// console.log('收到拉回来结果', audio);
		// AssetsManager.playEffect({
		// 	path: audio,
		// 	bundle: Enums.bundleType.MNPDK
		// })
		this.showGuLaAni(2, data.trust, index);
	},

	/**
	 * 展示鼓和拉的动画
	 * @param {number} type 1 gu 2 la
	 * @param {boolean} trust 结果
	 * @param {number} index 座位号
	 */
	showGuLaAni(type, trust, index) {
		AssetsManager.loadAsset({
			path: "res/prefab/MNPDKGuChunAnimation",
			aType: cc.Prefab,
			bundle: Enums.bundleType.MNPDK
		}, (pfb) => {
			if (!pfb) return;
			let guNode = cc.instantiate(pfb);
			let com = this._userList[index]
			com && com.setClock(guNode)
			let aniCom = guNode.getComponent("MNPDKGuChunAnimation");
			if (type == 1) {
				aniCom.showGuchun(trust);
			} else {
				aniCom.showLa(trust);
			}
		});
	},

	_isUnionCreate() {
		if (!this.roomCreatorInfo) return false;
		return this.roomCreatorInfo.creatorType == Enums.roomCreatorType.UNION_CREATE;
	},

	onBtnTest() {
		let tmp = UserModel.getData("isTest")
		if (!tmp) {
			return
		}
		AssetsManager.createDialog({
			bundle: Enums.bundleType.MNPDK,
			path: "res/prefab/MNPDKSelectTest",
			mainDialog: this
		})
	},

	showTest() {
		let tmp = UserModel.getData("isTest")
		// tmp = false;
		// cc.find("Setting/btn_test", this.node).active = tmp;
		if (tmp) {
			let n = cc.find("MNPDKTest", this.MNPDKTest)
			if (!cc.isValid(n)) {
				AssetsManager.createDialog({
					bundle: Enums.bundleType.MNPDK,
					path: "res/prefab/MNPDKTest",
					parent: this.MNPDKTest,
					mainDialog: this,
				})
			}
		}
	},

	onLocationClick() {
		this._onMenuCloseClick();
		AssetsManager.locationDialog({
			users: this.getUsers(),
			chairCount: this.gameRule.maxPlayerCount,
			fangzuobi: this.gameRule.fangzuobi
		})
	},

	onChatClick() {
		let params = {
			gameRule: this.gameRule,
			chat: (chat) => {
				ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
			}
		}
		AssetsManager.chatDialog(params);
	},

	// 邀请好友
	onShowInvite() {
		AssetsManager.friendDialog({
			gameRule: this.getGameRule(),
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

		}
	},


	/**
	 * 获取玩家调试
	 * @param {*} uid 不传入默认自己
	 * @returns 
	 */
	getUserTest(uid) {
		let userUid = !!uid ? uid : UserModel.getData('uid');
		let array = this.roomUserInfoArr || [];
		if (!userUid || !array.length) return false;
		for (let index = 0; index < array.length; index++) {
			let curData = array[index];
			if (!!curData && !!curData.userInfo) {
				let curuid = curData.userInfo.uid;
				if (!!curuid && curuid == userUid) {
					return !!curData.userInfo.isTest;
				}
			}
		}
		return false;
	},

	/**
	 * 分数状态
	 * @returns 0》不操作、1》大厅和普通场、2》比赛场统计
	 */
	scoreState() {
		if (!!this.roomCreatorInfo) {
			let creatorType = this.roomCreatorInfo.creatorType;
			if (creatorType == Enums.roomCreatorType.USER_CREATE) { //玩家创建
				return 1;
			} else if (creatorType == Enums.roomCreatorType.UNION_CREATE) { //联盟创建
				let unionType = this.getRoomCreatorByKey('unionType');
				if (unionType == Enums.UnionType.NORMAL) {
					return 1;
				} else if (this.getGameRuleByKey("tongji")) {
					return 2;
				}
			}
		}
		return 0;
	}
});