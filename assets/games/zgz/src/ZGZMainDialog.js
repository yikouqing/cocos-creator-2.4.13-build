const ApiZgz = require('./ApiZgz');
const ApiRoom = require('../../../src/api/ApiRoom');
const gameLogic = require('./ZGZGameLogic');
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
const ZGZModel = require("./ZGZModel")
const CCUtil = require("../../../src/utils/CCUtil")
const Events = require('../../../src/const/Events');

cc.Class({
	extends: cc.Component,

	properties: {
		com_optBtn: require("ZGZOptBtn"),
		txt_round: cc.Label,
		txt_roomId: cc.Label,
		txt_gameName: cc.Label,
		btn_location: cc.Node,
		btn_copy: cc.Node,
		btn_invite: cc.Node,
		btn_ready: cc.Node,
		btn_leave: cc.Node,
		btn_dismiss: cc.Node,
		btn_shezhi: cc.Node,
		btn_cardRecords: cc.Node,
		btnYuYin: cc.Node,
		btn_msg: cc.Node,
		menuLay: cc.Node,
		menuLayList: cc.Node,
		menuBtn: cc.Node,
		cardRecords: cc.Node,
		tuoguan: cc.Node,
		btn_deposit: cc.Node,
		clockPfb: cc.Prefab,
		animationNode: cc.Node,
		aniPfb: cc.Prefab,
		btnBackHall: cc.Node,
		headLeft: cc.Prefab,
		headRight: cc.Prefab,
		canNotDismissBar: cc.Node,
		btn_invitePlayer: cc.Node,

		text_Rule: cc.Label,
		txt_beishu: cc.Label,

		Item_Result: cc.Prefab,

		/**用户脚本列表 下标为本地座位号*/
		_userList: [],
		/**手牌脚本列表 */
		_handCardList: [],
		/**出牌脚本列表 */
		_outCardList: [],
		/**游戏状态 */
		_gameStatus: 0,
		/**上一轮出牌 */
		_lastOut: null,
		_gameBegins: 0
	},

	onLoad() {
		// 菜单点击
		this.menuLay.active = false
		this.btn_msg.active = false;
		AssetsManager.init(this.node.parent);
		cc.game.on(cc.game.EVENT_SHOW, this.onEventShow, this);
		MessageCallback.addListener(Events.clientEvents.gvUploadFileSuccess, this);
		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
		MessageCallback.addListener('UpdateGameBg', this);
		MessageCallback.addListener('UpdateGameCardBg', this);
		MessageCallback.addListener('SelfEntryRoomPush', this);
		MessageCallback.addListener('CreateRoomFail', this);
		MessageCallback.addListener('UpdateGameBgm', this);
		MessageCallback.addListener('QuickJoinFail', this);
		MessageCallback.addListener('JoinGameAgainPush', this);
		MessageCallback.addListener('OnGameOnceAgain', this);
		MessageCallback.addListener('TestClickReq', this)
		/* 获取场景信息 */
		this.getRoomSceneInfo()
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
		MessageCallback.removeListener('UpdateGameBgm', this);
		MessageCallback.removeListener('QuickJoinFail', this);
		MessageCallback.removeListener('JoinGameAgainPush', this);
		MessageCallback.removeListener('OnGameOnceAgain', this);
		MessageCallback.removeListener('TestClickReq', this)
	},

	/**切换后台返回 */
	onEventShow() {
		this.getRoomSceneInfo();
	},

	/**获取房间信息 */
	getRoomSceneInfo() {
		if (UserModel.isInRoom()) {
			ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
		} else {
			this.enterHall();
		}
	},

	/**返回大厅 */
	enterHall() {
		let isUnionCreate = ZGZModel.isUnionCreate();
		let unionID = !!isUnionCreate ? ZGZModel.getRoomCreatorByKey('unionID') : null;
		SubManager.exitBundle(unionID);
	},

	resetTable() {
		ZGZModel.reset();
		this._userList.forEach(com => {
			com.reset()
		});
		this._handCardList.forEach(com => {
			com.reset()
		});
		this._outCardList.forEach(com => {
			com.reset()
		});
		this.com_optBtn.reset();
	},

	gameInit(data) {
		this.resetTable()
		ZGZModel.init(data)
		this.initHeadAndCard()
		this.unscheduleAllCallbacks();
		this._gameStatus = data.gameData.gameStatus
		MessageCallback.emitMessage('RemoveGameResult');
		/**初始化用户信息 */
		let roomUserInfoArr = data.roomUserInfoArr
		let myUserInfo = null
		for (let i = 0; i < roomUserInfoArr.length; i++) {
			const user = roomUserInfoArr[i];
			this.userEnterRoom(user)
			if (user.chairID == ZGZModel.getMyChairID()) {
				myUserInfo = user
			}
		}
		this.initTotalScore(data.gameData.userWinTotalScore)

		/**按钮显示 */
		let unionID = ZGZModel.isUnionCreate() ? ZGZModel.getRoomCreatorByKey('unionID') : null;
		let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
		let yuyin = ZGZModel.getGameRuleByKey('yuyin');
		this.btnYuYin.active = !!yuyin && ConfigModel.getData('voiceSpeaker');
		this.btn_invite.active = ZGZModel.getCurBureau() == 0 && isShowInvite
		this.btn_copy.active = ZGZModel.getCurBureau() == 0 && isShowInvite
		this.btn_location.active = !!ZGZModel.getGameRuleByKey("showGps");
		if ((this._gameStatus === ApiZgz.gameStatus.NONE && myUserInfo && myUserInfo.playStatus != ApiRoom.playStatus.READY)) {
			if (ZGZModel.getCurBureau() == 0) {
				// this.btn_ready.active = true;
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify(true));
			} else {
				this.btn_ready.active = true;
			}
		}
		// this.btn_invitePlayer.active = ConfigModel.gameOnlineInvitation(unionID) && ZGZModel.getCurBureau() == 0
		this.btn_leave.active = data.gameData.curBureau == 0;
		this.btn_dismiss.active = data.gameData.curBureau != 0 && !ZGZModel.getGameRuleByKey("canNotDissmiss");
		this.btn_deposit.active = ZGZModel.getGameRuleByKey("canTrust") && !!ConfigModel.getData("canManualDeposit");
		if (this.canNotDismissBar) this.canNotDismissBar.active = ZGZModel.getGameRuleByKey("canNotDissmiss");
		this.btn_cardRecords.active = ZGZModel.getGameRuleByKey("isCardRecorder");
		this.btn_msg.active = true//ZGZModel.getGameRuleByKey("chat");
		this.btn_shezhi.active = false // UserModel.getData("isTest");
		if (this.btn_cardRecords.active) {
			this.cardRecords.x = -this.cardRecords.parent.width;
		}
		this.btnBackHall.active = data.gameData.curBureau == 0 && ZGZModel.isUnionCreate();
		if (ZGZModel.getCurBureau() == 0 && ZGZModel.getGameStatus() == 0 && ZGZModel.getGameRuleByKey("unReadyKick")) {
			// AssetsManager.kickOutTickDialog({
			// 	data: data,
			// 	posY: 0,
			// });
		}
		/**房间号和局数 */
		this.txt_round.string = `局数:${data.gameData.curBureau}/${data.gameData.maxBureau}`
		let bundleObj = ConfigModel.getBundleConfig(data.gameRule.gameType);
		this.txt_gameName.string = `${bundleObj.name}`;
		this.txt_roomId.string = `房号:${data.roomID}  底分:${ZGZModel.getGameRuleByKey("baseScore") || 0}`;
		this.text_Rule.string = ZGZModel.getShowRule();
		this.shwoBeiShu(0);
		/**恢复托管标记 */
		let userTrustArray = data.gameData.autoUser
		if (userTrustArray) {
			this.tuoguan.active = userTrustArray[ZGZModel.myUid]
		}
		/**恢复记牌器 */
		this.onCardRecords(data.gameData.leftCards)
		if (this._gameStatus == ApiZgz.gameStatus.SEND_CARDS || this._gameStatus == ApiZgz.gameStatus.USER_OPERATE || this._gameStatus == ApiZgz.gameStatus.TAKING) {
			this.syncUserAndCardInfo();
			let curOperateUid = data.gameData.curOperateUid;
			if (this._gameStatus == ApiZgz.gameStatus.TAKING) {
				if (curOperateUid == ZGZModel.getMyUid()) {
					const takingOperate = data.gameData.takingOperate || [];
					const takingObj = takingOperate.find(obj => obj.uid === curOperateUid);
					if (takingObj) this.com_optBtn.setClock(this.addClock(data.gameData.tick), 1);
					if (takingObj) this.com_optBtn.showOptThree(true, takingObj);

				} else {
					this.showClock(curOperateUid, data.gameData.tick);
					this.com_optBtn.showOptTherTip(true);
				}
				return
			}
			/**恢复操作 */
			let optData = {
				tick: data.gameData.tick,
				cards: data.gameData.lastOperateCards,
				uid: data.gameData.curOperateUid,
				lastOperateUid: data.gameData.lastOperateUid,
			}
			this.onGameTurn(optData)
			/**恢复出的牌或者pass */
			let lastOut = null,
				operateRecords = data.gameData.operateRecords;
			for (let i = operateRecords.length - 1; i >= 0; i--) {
				const opt = operateRecords[i]
				if (opt && opt.type == ApiZgz.operateType.OUT) {
					lastOut = opt
					break
				}
			}
			if (lastOut && lastOut.uid != data.gameData.curOperateUid) {
				let idx = this.getUserIdxByUid(lastOut.uid)
				let ocom = this._outCardList[idx]
				ocom && ocom.updateCards(lastOut.cards)
			}
		}
	},

	syncUserAndCardInfo() {
		this.updateHandCard();
		this.shwoBeiShu(ZGZModel.getStatMultiple())
		this._userList.forEach(ctrl => ctrl.showRank(true));
		this._userList.forEach(ctrl => ctrl.showBrightInfo(true));
	},

	playBrightCardSound(data) {
		let operateInfo = data.operateInfo;
		let soundName = null, uid = data.uid;
		if (!operateInfo || !operateInfo.operate) return;
		let takingOperate = operateInfo.takingOperate || [];
		let curObj = takingOperate.find(obj => obj.uid === uid);
		let operate = curObj ? curObj.endOperate || 0 : 0;
		let endList = curObj ? curObj.endList || [] : [];
		if (endList.length) {
			if (endList.includes(3) && endList.includes(35)) {
				soundName = "sound_sanshuanghong";
			} else if (endList.includes(3)) {
				soundName = "sound_sanfang";
			} else if (endList.includes(35)) {
				soundName = "sound_santao";
			} else {
				soundName = "sound_sanhei";
			}
		} else {
			if (operate == ApiZgz.talkType.RENSHU) {
				soundName = "sound_renshu";
			} else if (operate == ApiZgz.talkType.ZHA) {
				soundName = "sound_zhayigu";
			} else if (operate == ApiZgz.talkType.PASS) {
				soundName = "sound_bushuohua";
			}
		}
		console.log("uid", uid, "soundName", soundName, "curObj", curObj)
		if (soundName) {
			AssetsManager.playEffect({
				path: "res/audio/main/" + soundName,
				bundle: Enums.bundleType.ZGZ,
			});
		}
	},

	shwoBeiShu(num) {
		this.txt_beishu.node.active = num > 0;
		this.txt_beishu.string = `倍数:${num}`;
	},

	/**判断人数，初始化头像位置 */
	initHeadAndCard() {
		let chairCount = ZGZModel.getChairCount()
		if (this._userList.length == chairCount) {
			return
		}
		let headPos = [0, 1, 2, 3, 4]
		this._userList.length = 0
		this._handCardList.length = 0
		this._outCardList.length = 0

		for (let i = 0; i < headPos.length; i++) {
			let idx = headPos[i]
			let h = cc.find("head" + idx, this.node)
			h.getComponent(cc.Sprite).enabled = false;
			h.removeAllChildren()
			let headNode = null
			if (idx == 0 || idx == 3 || idx == 4) {
				headNode = cc.instantiate(this.headLeft)
			} else {
				headNode = cc.instantiate(this.headRight)
			}
			if (cc.isValid(headNode)) {
				headNode.parent = h
				this._userList.push(headNode.getComponent("ZGZHead"))
				this._userList[i].initRes()
			}

			let handCard = cc.find("handCard" + idx, this.node)
			let outCard = cc.find("outCard" + idx, this.node)
			this._handCardList.push(handCard.getComponent("ZGZCardMgr"))
			this._handCardList[i].init(idx)
			this._handCardList[i].addTouchEvent()

			this._outCardList.push(outCard.getComponent("ZGZCardMgr"))
			this._outCardList[i].init(idx)
		}
	},

	/**用户进入房间 */
	userEnterRoom(data) {
		let idx = ZGZModel.getUserChairIndex(data.chairID)
		let headcom = this._userList[idx]
		if (headcom) {
			headcom.init(data)
		}
	},

	/**恢复所有人的总输赢分数 */
	initTotalScore(userWinTotalScore) {
		if (userWinTotalScore && ZGZModel.scoreState()) {
			let len = Object.keys(userWinTotalScore)
			if (len.length > 0) {
				for (const uid in userWinTotalScore) {
					if (Object.hasOwnProperty.call(userWinTotalScore, uid)) {
						const s = userWinTotalScore[uid];
						let idx = this.getUserIdxByUid(uid)
						let com = this._userList[idx]
						if (com) com.setTotalScore(s)
					}
				}
			} else {
				this._userList.forEach((user) => {
					user.setTotalScore(0)
				})
			}

		} else {
			this._userList.forEach((user) => {
				user.setTotalScore('0')
			})
		}
	},

	/**用户离开房间 */
	userLeaveRoom(data) {
		let idx = ZGZModel.getUserChairIndex(data.chairID)
		let headcom = this._userList[idx]
		if (headcom) {
			headcom.leave()
		}
		if (data.uid == UserModel.getData('uid')) {
			if (!ZGZModel.getRoomID() ||
				ZGZModel.getRoomID() == data.roomID) {
				this.enterHall()
			}
		}
	},

	/**玩家准备 */
	onUserReady(data) {
		let idx = ZGZModel.getUserChairIndex(data.chairID)
		let com = this._userList[idx]
		if (com) com.setReady(true)
		if (data.chairID == ZGZModel.getMyChairID()) {
			this.btn_ready.active = false
			this.resetTable()
		}
	},

	/**隐藏所有准备图标 */
	hideReadyIcon() {
		this._userList.forEach(userCom => {
			userCom.setReady(false)
		});
	},

	/**更新局数 */
	onGameRoundUpdate(data) {
		ZGZModel.setCurBureau(data.curBureau);
		MessageCallback.emitMessage('RemoveGameResult');
		MessageCallback.emitMessage('UnReadyKickOutShow', false);
		this.txt_round.string = `局数:${data.curBureau}/${ZGZModel.getMaxBureau()}`;
		this.btn_dismiss.active = ZGZModel.getCurBureau() != 0 && !ZGZModel.getGameRuleByKey("canNotDissmiss");
		this.btn_invite.active = false
		this.btn_leave.active = false
		this.btn_copy.active = false
		this.shwoBeiShu(0);
		this.resetTable()
	},

	/**更新庄家 */
	onBankerUpdate(chairID) {
		let idx = ZGZModel.getUserChairIndex(chairID)
		let com = this._userList[idx]
		if (com) com.setBanker(true)
	},

	/**游戏状态图更新 */
	onGameStatusUpdate(data) {
		// console.log("游戏状态==", data)
		this._gameStatus = data.gameStatus
		this.btn_ready.active = false
		this.btnBackHall.active = false
		this.btn_invitePlayer.active = false
		this.com_optBtn.showOptTherTip(false);
		this.hideReadyIcon()
		switch (this._gameStatus) {
			case ApiZgz.gameStatus.NONE:
				this.btn_ready.active = ZGZModel.getCurBureau() > 0 && ZGZModel.getCurBureau() < ZGZModel.getMaxBureau();
				break
			default:
				break;
		}
	},

	getChairIdByUid(uid) {
		for (let i = 0; i < this._userList.length; i++) {
			const udata = this._userList[i].getUserData();
			if (udata && udata.userInfo && udata.userInfo.uid == uid) {
				return udata.chairID
			}
		}
		return null
	},

	/**通过UID获取玩家位置 */
	getUserIdxByUid(uid) {
		let chairId = this.getChairIdByUid(uid)
		let idx = ZGZModel.getUserChairIndex(chairId)
		// console.log("获取到的座位号==", idx)
		return idx
	},

	/**记牌器 */
	onCardRecords(leftCards) {
		// console.log("记牌器===leftCards", leftCards)
		if (!leftCards || !Array.isArray(leftCards)) {
			return
		}
		leftCards.forEach(cardInfo => {
			this.cardRecords.getChildByName(cardInfo.card + "").getComponent(cc.Label).string = cardInfo.count + ""
		});
	},

	/**删除所有闹钟 */
	delAllClock() {
		this.com_optBtn.setClock()
		this._userList.forEach(com => {
			com.setClock()
		});
	},

	/**通知玩家出牌 
	 * cards
	 tick
	 uid
	 lastOperateUid
	*/
	onGameTurn(data) {
		this.delAllClock()
		this.com_optBtn.reset();
		this._lastOut = data.cards;
		let idx = this.getUserIdxByUid(data.uid);
		this._userList[idx].setPassNode(false);
		this._outCardList[idx].updateCards();
		if (data.uid == ZGZModel.myUid) {
			let handCtrl = this._handCardList[0];
			let upArr = handCtrl.getAllUpCardId();
			let handCard = ZGZModel.getHandCards(ZGZModel.myUid);
			let tipData = gameLogic.searchOutCard(handCard.slice(), this._lastOut);
			if (upArr.length && tipData.length) {//检测选择牌是否正确
				let run = tipData.find(obj => ZGZModel.isArraysEqual(obj.cardList, upArr));
				if (!run) handCtrl.updateCards(handCard.slice());
			}
			this.com_optBtn.showOptNode(true, tipData.length == 0);
			this.com_optBtn.setClock(this.addClock(data.tick));
			handCtrl.setTipData(tipData, this._lastOut);
		} else {
			this.showClock(data.uid, data.tick);
		}
	},

	showClock(uid, time) {
		let idx = this.getUserIdxByUid(uid);
		if (this._userList[idx]) {
			let clockNode = this.addClock(time);
			this._userList[idx].setClock(clockNode);
		}
	},

	addClock(time) {
		let clockNode = cc.instantiate(this.clockPfb);
		clockNode.getComponent("ZGZClock").init(time || 0);
		return clockNode;
	},

	/**刷新牌 */
	updateHandCard(handCards, sendAnim = false, optData = null) {
		handCards = handCards || ZGZModel.handCards;
		ZGZModel.setHandCards(handCards);
		for (const uid in handCards) {
			let idx = this.getUserIdxByUid(uid);
			if (!this._handCardList[idx]) continue;
			let handCtrl = this._handCardList[idx];
			let handList = ZGZModel.getHandCards(uid);
			if (idx == 0) {
				if (optData) {
					if (optData.operateType == ApiZgz.operateType.OUT
						&& optData.uid == ZGZModel.getMyUid()) {
						handCtrl.updateCards(handList);
					}
				} else {
					handCtrl.updateCards(handList, sendAnim);
				}
			} else {
				this._userList[idx].setCardCount(handList.length);
				if (!!UserModel.getData("isTest")) handCtrl.updateCards(handList);
			}
		}
	},

	/**玩家出牌返回
	 * cards
	 * errMsg
	 * handCards
	 * isSuccess
	 * operateType
	 * uid
	 * operateInfo
	 */
	onUserOpt(data) {
		let optData = data.operateInfo
		if (optData.isSuccess) {
			this.updateHandCard(optData.handCards, false, optData);
			let optType = optData.operateType;
			/**去掉按钮 */
			if (data.uid == ZGZModel.myUid) {
				this.com_optBtn.reset();
			}
			/**去掉所有的不出 */
			this._userList.forEach(com => {
				com.setPassNode(false)
			});
			this.onCardRecords(optData.leftCards);
			let idx = this.getUserIdxByUid(data.uid);
			let outCtrl = this._outCardList[idx];
			let userCtrl = this._userList[idx]
			let user = userCtrl && userCtrl.getUserData()
			userCtrl.setPassNode(optType == ApiZgz.operateType.PASS);
			/**展示出的牌或者展示pass */
			if (optType == ApiZgz.operateType.OUT) {
				this._outCardList.forEach(ctrl => ctrl.updateCards());
				outCtrl && outCtrl.updateCards(optData.cards, false, true);
				this.playOptAinmAndSound(optData, idx, user && user.userInfo.sex);
			} else if (optType == ApiZgz.operateType.PASS) {
				outCtrl && outCtrl.updateCards()
				let audio = "res/audio/man/man_buyao1";
				// if (user && user.userInfo.sex == 1) {
				audio = audio.replace(/man/g, "woman");
				// }
				AssetsManager.playEffect({
					bundle: Enums.bundleType.ZGZ,
					path: audio,
				});
			}
		} else {
			if (optData.errMsg) {
				AssetsManager.tipDialog(optData.errMsg);
			}
		}
	},

	playOptAinmAndSound(optData, idx, isWoman) {
		let audioUrl = "", ainmType = 0;
		let cardArr = optData.cards || [];
		let cardType = optData.cardType || 0;
		let cardVale = gameLogic.getCardValue(cardArr[0]);
		if (cardType === ApiZgz.cardType.BOMB_CARD3
			|| cardType === ApiZgz.cardType.BOMB_CARD4) {
			if (cardType === ApiZgz.cardType.BOMB_CARD4) {
				audioUrl += "man_zhadan4";
			} else {
				audioUrl += "man_zhadan";
			}
			ainmType = 1;
		} else if (cardType === ApiZgz.cardType.TIAN_BOMB) {
			if (ZGZModel.isArraysEqual(cardArr, [3, 35])) {
				audioUrl += "man_wangzha2";
			} else {
				audioUrl += "man_wangzha";
			}
			ainmType = 2;
		} else if (cardType === ApiZgz.cardType.DOUBLE) {
			audioUrl += "man_dui" + cardVale;
		} else if (cardType === ApiZgz.cardType.SINGLE) {
			if (cardVale == 3) {
				let cardID = cardArr[0];
				if (cardID == 3 || cardID == 35) {
					audioUrl += `man_${cardVale}_${cardID}`;
				} else {
					audioUrl += `man_${cardVale}_hei`;
				}
			} else {
				audioUrl += "man_" + cardVale;
			}
		}
		if (!!audioUrl) {
			isWoman = true;
			audioUrl = "res/audio/man/" + audioUrl;
			if (isWoman) audioUrl = audioUrl.replace(/man/g, "woman");
			AssetsManager.playEffect({
				bundle: Enums.bundleType.ZGZ,
				path: audioUrl,
			});
		}
		if (!!ainmType) {
			let aniNode = cc.instantiate(this.aniPfb)
			let aniCom = aniNode.getComponent("ZGZActAnimation")
			let timeScale = 1;
			if (ainmType == 1) {
				aniNode.x += idx == 0 ? 0 : idx == 1 || idx == 2 ? 80 : -80;
				aniNode.scale = idx == 0 ? 1 : 0.6;
				timeScale = ainmType < 10 ? 0.7 : 1.2;
				this._outCardList[idx].setAniNode(aniNode)
			} else {
				this.animationNode.removeAllChildren()
				aniNode.parent = this.animationNode
			}
			aniCom.showOptAni(ainmType, timeScale)
		}
	},

	onGameResult(data) {
		this.delAllClock();
		let result = data.result || [];
		result.forEach((obj) => {
			let userCards = obj.userCards || []
			let index = this.getUserIdxByUid(obj.uid);
			let node = cc.instantiate(this.Item_Result);
			node.getComponent("ZGZResultItem").init(obj);
			this._outCardList[index].reset();
			this._outCardList[index].setAniNode(node);
			this._handCardList[index].updateCards(userCards);
		})
		return
		let isLastRound = ZGZModel.getCurBureau() == ZGZModel.getMaxBureau()
		this.scheduleOnce(() => { // 显示结果
			data.bundle = Enums.bundleType.ZGZ
			data.myChairID = this.myChairID
			data.isBureauFull = isLastRound
			data.curBureau = ZGZModel.getCurBureau()
			data.maxBureau = ZGZModel.getMaxBureau()
			data.mainDialog = this
			data.path = 'res/prefab/ZGZResultDialog'
			data.isResult = true
			data.tick = ZGZModel.getTick()
			AssetsManager.createDialog(data);
		}, 0);
	},

	onChat(data) {
		let idx = this.getUserIdxByUid(data.uid)
		let com = this._userList[idx];
		if (!com) return;
		com.gameChat(data)
	},

	onGift(fromChairID, toChairID, giftID) {
		let fidx = ZGZModel.getUserChairIndex(fromChairID)
		let tidx = ZGZModel.getUserChairIndex(toChairID)
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
		let tmp = UserModel.getData("isTest")
		if (!tmp) return
		AssetsManager.createDialog({
			bundle: Enums.bundleType.ZGZ,
			path: "res/prefab/ZGZSelectTest",
			mainDialog: this
		})
	},

	onBtnCardRecords() {
		this.cardRecords.stopAllActions()
		let endx = -this.cardRecords.parent.width
		let es = "backIn"
		if (this.cardRecords.x == endx || (this.cardRecords.x >= endx && this.cardRecords.x < 0)) {
			endx = 0
			es = "backOut"
		}
		// console.log("初始位置==", endx, this.cardRecords.x, this.cardRecords.parent.width)
		cc.tween(this.cardRecords)
			.to(0.35, {
				x: endx
			}, {
				easing: es
			}).start();
	},


	_onExitClick() {
		if (!UserModel.isInRoom()) {
			this.enterHall();
			return;
		}
		if (ZGZModel.getCurBureau() == 0) {
			ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
		} else {
			AssetsManager.tipDialog('现在不能退出游戏');
		}
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

	_onSettingClick() {
		AssetsManager.setDialog({
			type: "round",
			gameType: Enums.bundleType.ZGZ,
			musicType: Enums.bundleType.POKER,
		});
	},

	onLocationClick() {
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
			chairCount: ZGZModel.getChairCount(),
			fangzuobi: ZGZModel.getGameRuleByKey('fangzuobi')
		})
	},

	/**按钮响应 */
	btnClickCallFunc(event, param) {
		// console.log("按钮响应==", event.target.name, event)
		switch (event.target.name) {
			case "btn_leave": //离开房间
				this._onMenuCloseClick();
				this._onExitClick()
				break;
			case "btn_ready": //准备
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify(true));
				this.btn_ready.active = false
				break;
			case "btn_dismiss": //解散
				this._onMenuCloseClick();
				this._onDismissClick()
				break;
			case "btn_refresh": //刷新
				this._onMenuCloseClick();
				if (CCUtil.clickInterval(event.target, 10)) {
					return;
				}
				AssetsManager.tipDialog('刷新界面可以修复游戏显示问题');
				this.getRoomSceneInfo()
				break;
			case "btn_setting": //设置
				this._onMenuCloseClick();
				this._onSettingClick()
				break;
			case "btn_review": //回看
				this._onMenuCloseClick();
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				ApiRoom.gameMessageNotify(ApiZgz.gameReviewNotify());
				break;
			case "btn_msg": //聊天
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				if (!ZGZModel.getCurBureau()) {
					AssetsManager.tipDialog('未开局暂不能使用该功能!');
					return;
				}
				let params = {
					gameRule: ZGZModel.getGameRule(),
					chat: (chat) => {
						ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
					}
				}
				AssetsManager.chatDialog(params);
				break;
			case "btn_wanfa": //规则
				this._onMenuCloseClick();
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				let rule = ZGZModel.getGameRule()
				if (!rule) {
					return
				}
				AssetsManager.tableDialog({
					gameRule: rule,
				});
				break;
			case "btn_location": //定位
				this._onMenuCloseClick();
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				this.onLocationClick()
				break;
			case "btn_deposit": //开始托管
				this._onMenuCloseClick();
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				ApiRoom.gameMessageNotify(ApiZgz.gameTrushNotify(true));
				break;
			case "btn_quxiaotuoguan": //取消托管
				if (CCUtil.clickInterval(event.target, 1)) {
					return;
				}
				ApiRoom.gameMessageNotify(ApiZgz.gameTrushNotify(false));
				break;
			case "btn_invite": //邀请
				let gameRule = ZGZModel.getGameRule()
				gameRule = gameRule || {};
				gameRule.roomId = ZGZModel.getRoomID();
				let share = ConfigModel.getRoomRuleShare(gameRule);
				NativeUtil.wxShareUrl(0, share.url, share.title, share.wanFa);
				break;
			case "btn_copy": //复制
				let str = ConfigModel.getRoomShare(Enums.bundleType.ZGZ, ZGZModel.getRoomID());
				NativeUtil.copyText(str, '');
				break;
			case "btn_shezhi":
				this._onMenuCloseClick();
				this.onBtnTest();
				break;
			case "bg": //背景按钮 恢复牌
				this._handCardList[0].setAllCardDown()
				break;
			case "btn_out":
				if (CCUtil.clickInterval(event.target, 0.5)) {
					return;
				}
				let cardDataArr = this._handCardList[0].getAllUpCardId()
				if (cardDataArr.length <= 0) {
					// console.log("没有选择牌")
					return
				}
				// console.log("出的牌==", cardDataArr)
				ApiRoom.gameMessageNotify(ApiZgz.gameUserOperateNotify(cardDataArr, ApiZgz.operateType.OUT));
				break;
			case "btn_pass":
				ApiRoom.gameMessageNotify(ApiZgz.gameUserOperateNotify([], ApiZgz.operateType.PASS));
				break;
			case "btn_tip":
				this._handCardList[0].showTipCards()
				break;
			case "btn_cardRecord":
				this._onMenuCloseClick();
				if (CCUtil.clickInterval(event.target, 0.5)) {
					return;
				}
				this.onBtnCardRecords()
				break;
			case "btn_back":
				// this.enterHall()
				if (CCUtil.clickInterval(event.target, 1)) return;
				this._onExitClick()
				break;
			default:
				break;
		}
	},


	btnClick(event, param) {
		switch (param) {
			case 'menus':
				this.menuLay.active = true;
				this._onMenuOpen();
				break;
			case 'menuclose':
				this._onMenuCloseClick();
				break;

		}
	},
	_onMenuOpen() {
		this.menuLayList.stopAllActions()
		this.menuLayList.active = true;
		this.menuBtn.active = false;
		this.menuLayList.getComponent(cc.Widget) && this.menuLayList.getComponent(cc.Widget).updateAlignment();
		this._roomsLayPos = {
			show: cc.v2(),
			hide: cc.v2()
		};

		this._roomsLayPos.hide = this.menuLayList.getPosition(cc.v2());
		this._roomsLayPos.show = cc.v2(this._roomsLayPos.hide.x - this.menuLayList.width, this._roomsLayPos.hide.y);
		this.menuLayList.opacity = 0;
		this.menuLayList.setPosition(this._roomsLayPos.hide);
		cc.tween(this.menuLayList)
			.to(0.3, {
				opacity: 255,
				position: cc.v3(this._roomsLayPos.show)
			}).start();
	},

	_onMenuCloseClick() {
		if (this.menuLay.active == false) return;
		cc.tween(this.menuLayList)
			.to(0.1, {
				opacity: 0,
				position: cc.v3(this._roomsLayPos.hide)
			}).call(() => {
				this.menuLay.active = false;
				this.menuBtn.active = true;
			})
			.start();

	},



	// 邀请好友
	onShowInvite() {
		AssetsManager.friendDialog({
			gameRule: ZGZModel.getGameRule(),
		})
	},

	/**消息监听 */
	messageCallbackHandler(route, msg) {
		msg && console.log('扎股子==》', route, msg.type, msg.data ? msg.data : msg);
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				// console.log('gameInit=============================', msg.data);
				this.gameInit(msg.data);
				// 在座位上，进入游戏显示定位
				let isInSeat = ZGZModel.getMyChairID() < ZGZModel.getChairCount()
				if (this._gameBegins == 0 && isInSeat && (!!ZGZModel.getGameRuleByKey('fangzuobi') || !!ZGZModel.getGameRuleByKey('showGps'))) {
					this._gameBegins = 1;
					this.onLocationClick();
				}
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				this.userEnterRoom(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				this.userLeaveRoom(msg.data.roomUserInfo)
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				// console.log("收到了玩家准备==", msg.data)
				this.onUserReady(msg.data)
			} else if (msg.type === ApiRoom.GAME_END_PUSH) {
				// console.log("游戏结束《《《《《《《《《", msg)
			} else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
				if (!msg.data.userList || msg.data.userList.length == 0) return;
				msg.data.myChairID = ZGZModel.getMyChairID();
				AssetsManager.disDialog(msg.data);
			} else if (msg.type === ApiRoom.USER_CHAT_PUSH) {
				// console.log("收到了聊天", msg.data)
				this.onChat(msg.data);
			} else if (msg.type === ApiRoom.USER_GIFT_SEND_PUSH) {
				this.onGift(msg.data.fromChairID, msg.data.toChairID, msg.data.giftID);
			} else if (msg.type === ApiRoom.USER_VOICE_PUSH) {
				// this._voiceMsgQueue.push(msg.data);
			} else if (msg.type === ApiRoom.USER_OFF_LINE_PUSH) {
				let idx = ZGZModel.getUserChairIndex(msg.data.chairID)
				let com = this._userList[idx]
				if (com) com.setOffline(true)
			} else if (msg.type === ApiRoom.ROOM_USER_INFO_CHANGE_PUSH) { //用户信息刷新
				this._userList.forEach(com => {
					if (com) {
						com.userInfoChange(msg.data)
					}
				});
			} else if (msg.type === ApiRoom.ROOM_USER_WIN_TOTAL_PUSH) {
				/**玩家总输赢分数 */
				// console.log("玩家总输赢==", msg.data)
				this.initTotalScore(msg.data.userWinTotalScore)
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiZgz.GAME_BUREAU_PUSH) {
				MessageCallback.emitMessage('GameBeginsMessagePush')
				this.onGameRoundUpdate(msg.data)
			} else if (msg.type === ApiZgz.GAME_STATUS_PUSH) { //游戏状态
				ZGZModel.setGameStatus(msg.data.gameStatus)
				ZGZModel.setTick(msg.data.tick)
				this.onGameStatusUpdate(msg.data)
			} else if (msg.type === ApiZgz.GAME_SEND_CARDS_PUSH) { //发牌
				this.updateHandCard(msg.data.handCards, true);
			} else if (msg.type === ApiZgz.GAME_USER_START_TALKING_PUSH) {
				if (msg.data.uid == ZGZModel.getMyUid()) {
					this.com_optBtn.showOptThree(true, msg.data);
					this.com_optBtn.setClock(this.addClock(msg.data.tick), 1);
				} else {
					this.com_optBtn.showOptTherTip(true);
					this.showClock(msg.data.uid, msg.data.tick);
				}
			} else if (msg.type === ApiZgz.GAME_USER_TALK_PUSH) {
				// console.log("612====推送玩家说话", msg.data)
				let takingOperate = msg.data.operateInfo.takingOperate || [];
				let uid = msg.data.operateInfo.uid || null;
				ZGZModel.setTakingOperate(takingOperate);
				if (uid == ZGZModel.getMyUid()) {
					this.com_optBtn.showOptThree(false);
				}
				let idx = this.getUserIdxByUid(uid);
				if (this._userList[idx]) {
					this._userList[idx].setClock();
				};
				this.syncUserAndCardInfo();
				this.playBrightCardSound(msg.data);
			} else if (msg.type === ApiZgz.GAME_USER_END_YOU_PUSH) {
				ZGZModel.setUserWinStatus(msg.data.userWinStatus);
				this.syncUserAndCardInfo();
			} else if (msg.type === ApiZgz.GAME_USER_OPERATE_START_PUSH) {
				this.onGameTurn(msg.data)
			} else if (msg.type === ApiZgz.GAME_USER_OPERATE_PUSH) {
				this.onUserOpt(msg.data)
			} else if (msg.type === ApiZgz.GAME_BANKER_PUSH) { //庄家位置更新
				this.onBankerUpdate(msg.data.bankerChairID)
			} else if (msg.type === ApiZgz.GAME_END_PUSH) {
				UserModel.setData('roomID', '');
				if (msg.data.result.length > 0) {
					msg.data.enterHall = this.enterHall.bind(this);
					msg.data.path = 'res/prefab/ZGZAllResult';
					msg.data.bundle = Enums.bundleType.ZGZ;
					msg.data.isUnionCreate = ZGZModel.isUnionCreate();
					msg.data.unionID = ZGZModel.getRoomCreatorByKey("unionID")
					msg.data.gameRule = ZGZModel.getGameRule()
					msg.data.roomID = ZGZModel.getRoomID();
					this.unscheduleAllCallbacks();
					this.scheduleOnce(() => {
						MessageCallback.emitMessage('RemoveGameResult');
						AssetsManager.createDialog(msg.data);
					}, 2);
				} else {
					this.enterHall();
				}
			} else if (msg.type === ApiZgz.GAME_REVIEW_PUSH) {
				let reviewRecord = msg.data.list || [];
				if (reviewRecord && reviewRecord.length > 0) {
					AssetsManager.createDialog({
						bundle: Enums.bundleType.ZGZ,
						roomID: ZGZModel.getRoomID(),
						path: "res/prefab/ZGZResultDialog",
						reviewRecord: reviewRecord,
					});
				} else {
					AssetsManager.tipDialog('没有数据');
				}
			} else if (msg.type === ApiZgz.GAME_RESULT_PUSH) {
				this.onGameResult(msg.data)
			} else if (msg.type === ApiZgz.GAME_TRUST_PUSH) { //开始托管
				if (ZGZModel.myUid == msg.data.uid) {
					this.tuoguan.active = msg.data.trust
				}
			}
		} else if (route === 'ReconnectSuccess') {
			this.getRoomSceneInfo();
		} else if (route === 'SelfEntryRoomPush') {
			if (msg.gameType != ZGZModel.getBundleType()) {
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
});