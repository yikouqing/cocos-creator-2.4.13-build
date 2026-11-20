const ApiPtj = require('./ApiPtj');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const SubManager = require('../../../src/utils/SubManager');
const UserModel = require('../../../src/model/UserModel');
const ConfigModel = require('../../../src/model/ConfigModel');
const Codes = require('../../../src/const/Codes');
const PTJModel = require("./PTJModel")
const CCUtil = require("../../../src/utils/CCUtil")
const Events = require('../../../src/const/Events');

cc.Class({
	extends: cc.Component,

	properties: {
		ctrl_TableTile: require("PTJTableTileMgr"),
		ctrl_OptBtn: require("PTJOpt"),
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
		this.menuLay.active = false; // 菜单点击
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
		if (UserModel.isInRoom()) {
			ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
		} else {
			this.enterHall();
		}
	},

	/**返回大厅 */
	enterHall() {
		let isUnionCreate = PTJModel.isUnionCreate();
		let unionID = !!isUnionCreate ? PTJModel.getRoomCreatorByKey('unionID') : null;
		SubManager.exitBundle(unionID);
	},

	resetTable() {
		this._userList.forEach(com => {
			com.reset()
		});
		this._handCardList.forEach(com => {
			com.reset()
		});
		this.ctrl_OptBtn.reset()
		this.delCuoPaiDialog()
		this.delAllFlyNode()
	},

	_yuYinShow() {
		let isInSeat = PTJModel.isInSeat();
		let yuyin = PTJModel.getGameRuleByKey('yuyin');
		this.btnYuYin.active = !!isInSeat && !!yuyin && ConfigModel.getData('voiceSpeaker');
	},

	gameInit(data) {
		PTJModel.init(data);
		this.initHeadAndTiles();
		this.unscheduleAllCallbacks();
		this.animationNode.removeAllChildren();
		this._userList.forEach(com => {
			com.leave()
		});
		MessageCallback.emitMessage('RemoveGameResult');
		let roomUserInfoArr = data.roomUserInfoArr || [];
		let showCardsUser = data.gameData.showCardsUser || [];
		this._gameStatus = data.gameData.gameStatus;
		let myUid = UserModel.getData("uid");
		let myUserInfo = null;
		roomUserInfoArr.forEach((user) => {
			if (user.uid == PTJModel.getMyUid()) {
				myUserInfo = user;
			}
			this.userEnterRoom(user);
		})
		showCardsUser.forEach(info => {
			if (info.uid == PTJModel.getMyUid()) {
				PTJModel.setMyshowCard(true);
			}
		})
		this.resetTable();
		this._yuYinShow();;
		this.showSitDownButton();
		this.ctrl_TableTile.shwoAllCard();
		this.initTotalScore(data.gameData.userWinTotalScore);
		/**房间号和局数 */
		this.txt_roomId.string = `游戏:${ConfigModel.getGameName(Enums.bundleType.PTJ)} 房号:${data.roomID}`;
		this.txt_round.string = `局数:${data.gameData.curBureau}/${data.gameData.maxBureau}`;
		/**按钮显示 */
		let maxPlayerCount = PTJModel.getChairCount();
		let unionID = PTJModel.getRoomCreatorByKey('unionID');
		let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
		this.btn_deposit.active = PTJModel.getGameRuleByKey("canTrust");
		this.btn_location.active = !!PTJModel.getGameRuleByKey("showGps");
		this.btn_copy.active = PTJModel.getCurBureau() == 0 && !!isShowInvite;
		this.btn_invite.active = PTJModel.getCurBureau() == 0 && !!isShowInvite;
		this.btnBackHall.active = data.gameData.curBureau == 0 && PTJModel.isUnionCreate();
		this.btn_leave.active = (data.gameData.curBureau == 0 || myUserInfo.chairID >= maxPlayerCount);
		this.btn_dismiss.active = (data.gameData.curBureau != 0 && myUserInfo.chairID < maxPlayerCount && !PTJModel.getGameRuleByKey("canNotDissmiss"));
		this.btn_ready.active = (myUserInfo.chairID < maxPlayerCount && this._gameStatus === ApiPtj.gameStatus.NONE && myUserInfo && myUserInfo.playStatus != ApiRoom.playStatus.READY)
		if (this.canNotDismissBar) this.canNotDismissBar.active = PTJModel.getGameRuleByKey("canNotDissmiss");
		/**恢复桌面 */
		if (data.gameData.gameStarted) {
			this.onBankerUpdate({
				uid: data.gameData.bankerUid
			});
			this.ctrl_OptBtn.setClock(data.gameData.tick)
			this.delAllFlyNode();
		}
		//恢复下注分
		let userBetScore = data.gameData.userBetScore || {};
		for (const uid in userBetScore) {
			let score = userBetScore[uid];
			PTJModel.setUserBetScore(uid, score);
			let idx = PTJModel.getUserIdxByUid(uid);
			let ucom = this._userList[idx];
			ucom && ucom.showBetScore(score);
		}

		if (this._gameStatus == ApiPtj.gameStatus.ROB_BANK) {
			let robBankList = data.gameData.robBankList || [];
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
		} else if (this._gameStatus == ApiPtj.gameStatus.POUR_SCORE) {
			this.onPourScoreStart(data.gameData);
		} else if (this._gameStatus == ApiPtj.gameStatus.SHOW_CARD || this._gameStatus == ApiPtj.gameStatus.SEND_CARDS) {
			this.onSendCard(data.gameData, false);
			showCardsUser.forEach(info => {
				let idx = PTJModel.getUserChairIndex(info.chairID);
				let hcom = this._handCardList[idx];
				if (hcom) {
					hcom.showCardType(info);
					hcom.updateLieTiles(info.cards);
				}
			});
			this.ctrl_OptBtn.setOptCardNode(!PTJModel.getMyshowCard() && this._gameStatus == ApiPtj.gameStatus.SHOW_CARD);
		}
		this.showTest()
	},

	/**初始化头像和牌 */
	initHeadAndTiles() {
		let headPos = [0, 1, 2, 3];
		this._userList.length = 0;
		this._handCardList.length = 0;
		for (let i = 0; i < headPos.length; i++) {
			let h = cc.find("head" + headPos[i], this.node);
			this._userList.push(h.getComponent("PTJHead"));
			this._userList[i].initRes();
			let handCard = cc.find("tiles/hand" + headPos[i], this.node);
			this._handCardList.push(handCard.getComponent("PTJHandTileMgr"));
			this._handCardList[i].init(headPos[i]);
		}
	},
	/**用户进入房间 */
	userEnterRoom(data) {
		if (data.chairID >= PTJModel.getChairCount() || data.playStatus == ApiRoom.playStatus.WATCH) {
			return
		}
		let idx = PTJModel.getUserChairIndex(data.chairID);
		let headcom = this._userList[idx];
		headcom && headcom.init(data);
	},

	/**恢复所有人的总输赢分数 */
	initTotalScore(userWinTotalScore) {
		if (userWinTotalScore && !!PTJModel.scoreState()) {
			userWinTotalScore = userWinTotalScore || {};
			let keys = Object.keys(userWinTotalScore);
			if (keys.length > 0) {
				for (const uid in userWinTotalScore) {
					const s = userWinTotalScore[uid];
					let idx = PTJModel.getUserIdxByUid(uid)
					let com = this._userList[idx]
					if (com) com.setTotalScore(s);
				}
			} else {
				this._userList.forEach((user) => {
					user.setTotalScore(0);
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
		if (data.chairID < PTJModel.getChairCount()) {
			let idx = PTJModel.getUserChairIndex(data.chairID)
			let headcom = this._userList[idx]
			if (headcom) {
				headcom.leave()
			}
		}
		if (data.uid == UserModel.getData('uid')) {
			if (!PTJModel.getRoomID() ||
				PTJModel.getRoomID() == data.roomID) {
				this.enterHall()
			}
		}
	},

	/**玩家准备 */
	onUserReady(data) {
		let idx = PTJModel.getUserChairIndex(data.chairID)
		let com = this._userList[idx]
		if (com) com.setReady(true)
		if (data.chairID == PTJModel.getMyChairID()) {
			this.btn_ready.active = false
			this.resetTable()
		}
	},

	/**隐藏所有准备图标*/
	hideReadyIcon() {
		this._userList.forEach(userCom => {
			userCom.setReady(false)
		});
	},

	/**更新局数 */
	onGameRoundUpdate(data) {
		this._yuYinShow();
		this.resetTable();
		this.btn_copy.active = false;
		this.btn_invite.active = false;
		this.btnBackHall.active = false;
		PTJModel.setCurBureau(data.curBureau);
		MessageCallback.emitMessage('RemoveGameResult');
		let myUserInfo = PTJModel.getUserByChairID(PTJModel.getMyChairID());
		this.btn_leave.active = (myUserInfo.chairID >= PTJModel.getChairCount());
		this.btn_dismiss.active = (myUserInfo.chairID < PTJModel.getChairCount() && !PTJModel.getGameRuleByKey("canNotDissmiss"));
		this.txt_round.string = `局数:${data.curBureau}/${PTJModel.getMaxBureau()}`;
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
		this._gameStatus = data.gameStatus;
		this.ctrl_OptBtn.setClock(data.tick);
		PTJModel.setGameStatus(this._gameStatus);
		// console.log("游戏状态==", this._gameStatus, data)
		switch (this._gameStatus) {
			case ApiPtj.gameStatus.ROB_BANK:
				this.ctrl_TableTile.shwoAllCard();
				this.ctrl_OptBtn.setRobBankerNode(true)
				break;
			case ApiPtj.gameStatus.SHOW_CARD:
				this.ctrl_OptBtn.setOptCardNode(true)
				break;
			case ApiPtj.gameStatus.NONE:
				PTJModel.reset();
				this.resetTable();
				this.btn_ready.active = true;
				this.ctrl_TableTile.shwoNode(false);
				break;
			default:
				break;
		}
	},

	/**亮牌结果 */
	onShowCard(data) {
		let isPlaySound = false;
		if (data.chairID == PTJModel.getMyChairID()) {
			isPlaySound = !PTJModel.getMyshowCard();
			this.ctrl_OptBtn.setOptCardNode(false);
			PTJModel.setMyshowCard(true);
		}
		let info = data.cardsList;
		let idx = PTJModel.getUserChairIndex(info.chairID)
		let hcom = this._handCardList[idx]
		if (hcom) {
			hcom.showCardType(info, isPlaySound);
			hcom.updateLieTiles(info.cards, true);
		}
	},


	/**发牌 */
	onSendCard(data, isAnim = false) {
		// data.cardTypeList = {
		// getMaxCardType: [15, 21, 4, 7],
		// onePoint: 6//点数
		// oneRate: 20//倍数
		// oneType: 14//牌型
		// twoPoint: 1//
		// twoRate: 12
		// twoType: 6
		// }
		let handCards = data.handCards || {};
		let cardTypeList = data.cardTypeList;
		PTJModel.setHandCards(handCards);
		PTJModel.setCardTypeList(cardTypeList);

		let showHandCard = () => {
			let CurIndex = 0;
			let allCardList = this.ctrl_TableTile.getAllCardList();
			for (let i = 0; i < this._handCardList.length; i++) {
				let curData = PTJModel.getUserByChairID(i);
				let index = PTJModel.getUserChairIndex(i);
				let handCtrl = this._handCardList[index];
				let handList = handCtrl.getlieTileList();
				let handArr = new Array(handList.length);
				let isShow = false,
					count = 0;
				if (curData && curData.uid) {
					let uid = curData.uid;
					let curCards = handCards[uid] || [];
					let isMy = uid == PTJModel.getMyUid();
					isShow = isMy || PTJModel.getUserTest();
					if (curCards.length) handArr = curCards.slice();
				}
				if (!isAnim) {
					handCtrl.showCard(handArr, isShow);
				} else {
					handList.forEach((CurHandCtrl) => {
						let flyNode = allCardList[CurIndex].node;
						let firstStart = CCUtil.postionConvert(flyNode, this.node);
						let firstEnd = CCUtil.postionConvert(CurHandCtrl.node, this.node)
						let flyItem = cc.instantiate(flyNode);
						flyItem.setContentSize(80, 160);
						flyItem.setPosition(firstStart);
						flyItem.parent = this.node;
						flyItem.active = false;
						flyItem.setScale(0.6);
						cc.tween(flyItem)
							.call(() => {
								flyItem.active = true;
								flyNode.active = false
							}).to(0.5, {
								scale: 1,
								position: firstEnd,
							}).call(() => {
								count += 1;
								flyItem.active = false;
								CurHandCtrl.setNodeShow(true);
								if (count >= handList.length) {
									handCtrl.showCard(handArr, isShow, isShow);
								}
							}).start();
						this._allFlyNode.push(flyItem);
						CurIndex += 1;
					})
				}
			}
		}

		if (isAnim) {
			this.scheduleOnce(showHandCard, 3.5);
			let diceAniNode = cc.instantiate(this.diceAniPfb);
			diceAniNode.parent = this.animationNode;
			// diceAniNode.getComponent("PTJDice").init(data.dice1, data.dice2, showHandCard);
			diceAniNode.getComponent("PTJDice").init(data.dice1, data.dice2);
			this.scheduleOnce(() => {
				this.ctrl_TableTile.shwoAllCard(true);
			}, 4);
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
		let idx = PTJModel.getUserIdxByUid(data.uid)
		let ucom = this._userList[idx]
		if (ucom) ucom.setRobScale(data.isRob)
		AssetsManager.playEffect({
			path: "res/audio/woman/qiang" + data.isRob,
			bundle: Enums.bundleType.PTJ
		});
	},

	/**更新庄家
	 * uid"859718"
		  userList:
	 */
	onBankerUpdate(data, isAni = false) {
		// console.log("更新庄家==", data)
		let idx = PTJModel.getUserIdxByUid(data.uid)
		let bankercom = this._userList[idx];
		PTJModel.setBankerUid(data.uid);
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
				let idx1 = PTJModel.getUserIdxByUid(data.userList[i]);
				let ucom = this._userList[idx1]
				if (ucom) {
					let light = ucom.getLight()
					light.stopAllActions()
					let cishu = 5
					let jiange = 1
					if (idx1 == idx) {
						cishu = 10
						jiange = 2
					}
					// console.log("播放了动画==", dt)
					cc.tween(light).delay(dt).call(() => {
						light.active = true
						light.opacity = 255
					}).blink(jiange, cishu).call(() => {
						light.active = false
						if (idx1 == idx) {
							fly()
						}
					}).start()
				}
				dt += 0.2
			}
			AssetsManager.playEffect({
				path: "res/audio/main/rob",
				bundle: Enums.bundleType.PTJ
			});
		} else {
			if (PTJModel.getCurBureau() > 1) {
				AssetsManager.playEffect({
					path: "res/audio/main/changeBanker",
					bundle: Enums.bundleType.PTJ
				});
			}
			fly()
		}
	},

	/**下分推送，显示下注按钮
	 */
	onPourScoreStart(data) {

		// console.log("下分推送，显示下注按钮data", data)
		// bankerUid"388708"
		// maxPourScore100
		// minPourScore10
		// tick15
		this.ctrl_OptBtn.setBetNode(false);
		this.ctrl_OptBtn.setOptCardNode(false);
		this.ctrl_OptBtn.setRobBankerNode(false);
		let myUid = UserModel.getData("uid");
		if (data.bankerUid != myUid) {
			let obj = PTJModel.getUserBetScoreNum(myUid);
			// console.log("下分推送，显示下注按钮", obj)
			if (!!obj.count) {
				this.ctrl_OptBtn.setBetNode(obj)
			}
		}
	},

	/**玩家下注返回
	 * uid,
	 score
	 */
	onPlayerBet(data, isAni = false) {
		let score = data.score || [];
		let idx = PTJModel.getUserIdxByUid(data.uid)
		let ucom = this._userList[idx];
		ucom && ucom.showBetScore(score);
		// ucom && ucom.setBetScore(data.score, isAni)
		let isShow = PTJModel.getUserBetScoreNum(data.uid);
		if (data.uid == UserModel.getData("uid")) {
			let obj = PTJModel.getUserBetScoreNum(data.uid);
			if (!!obj.count) {
				this.ctrl_OptBtn.setBetNode(obj)
			} else {
				this.ctrl_OptBtn.setBetNode(false);
			}
		}
	},


	delCuoPaiDialog() {
		AssetsManager.clearDialog(['PTJCuoPai']);
	},

	onGameResult(data) {
		// console.log("小结算数据===data", data);
		let bankerIdx = PTJModel.getUserIdxByUid(PTJModel.getBankerUid());
		let userCtrl = this._userList[bankerIdx];
		let lastCards = data.lastCards || [];
		PTJModel.setlastCards(lastCards);
		// this.ctrl_TableTile.shwoNode(false);
		let dt = 0
		if (1) {
			let winList = []
			let loseList = []
			let result = data.result || [];
			result.forEach(info => {
				let i = PTJModel.getUserIdxByUid(info.uid)
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
						bundle: Enums.bundleType.PTJ
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
			}, 0.5)
			dt += 2
		}

		let isLastRound = PTJModel.getCurBureau() == PTJModel.getMaxBureau()
		this.scheduleOnce(() => { // 显示结果
			data.isResult = true;
			data.mainDialog = this;
			data.myChairID = this.myChairID;
			data.isBureauFull = isLastRound;
			data.bundle = Enums.bundleType.PTJ;
			data.path = 'res/prefab/PTJResultDialog';
			AssetsManager.createDialog(data);
		}, dt);
	},

	onGift(fromChairID, toChairID, giftID) {
		let fidx = PTJModel.getUserChairIndex(fromChairID)
		let tidx = PTJModel.getUserChairIndex(toChairID)
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
		let myChairID = PTJModel.getMyChairID()
		let tmp = UserModel.getData("isTest")
		if (!tmp || myChairID >= PTJModel.getChairCount()) {
			return
		}
		AssetsManager.createDialog({
			bundle: Enums.bundleType.PTJ,
			path: "res/prefab/PTJSelectTest",
			mainDialog: this
		})
	},

	showTest() {
		let tmp = UserModel.getData("isTest")
		this.btn_shezhi.active = false //!!tmp
	},

	/**给没座位的人显示坐下按钮 */
	showSitDownButton() {
		let curBureau = PTJModel.getCurBureau();
		let maxBureau = PTJModel.getMaxBureau();
		let canEnter = PTJModel.getGameRuleByKey('canEnter') && maxBureau != curBureau;
		// (!!canEnter || curBureau == 0) &&
		this.btn_zuoxia.active = PTJModel.getMyChairID() >= PTJModel.getChairCount() &&
			(!!canEnter || curBureau == 0) &&
			PTJModel.checkHaveEmptySeat();
	},

	/**坐下按钮响应 */
	onBtnSitDown() {
		/**检查是否还有空位，有就发送坐下命令 */
		let chairID = PTJModel.getCanSitDownChairID();
		let idx = PTJModel.getUserChairIndex(chairID)
		if (chairID == -1 || !this._userList[idx]) {
			AssetsManager.tipDialog('没有座位可以坐下！');
			return;
		}
		// console.log('找到座位坐下', chairID);
		ApiRoom.roomMessageNotify(ApiRoom.getUserChangeSeatNotify(PTJModel.getMyChairID(), chairID));
	},

	/**观战列表响应 */
	onLookOnClick() {

		let users = PTJModel.getLookOnUsers();
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
		this.btn_menu.active = false
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
			case "menu": //关闭菜单
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
				AssetsManager.tipDialog('刷新界面可以修复游戏显示问题');
				this.getRoomSceneInfo()
				break;
			case "btn_setting": //设置
				this._onMenuCloseClick();
				AssetsManager.setDialog({
					type: "ptj",
					gameType: Enums.bundleType.PTJ,
					musicType: Enums.bundleType.MAHJONG,
				});
				break;
			case "btn_review": //回看
				this._onMenuCloseClick();

				ApiRoom.gameMessageNotify(ApiPtj.gameReviewNotify());
				break;
			case "btn_msg": //聊天
				let params = {
					gameRule: PTJModel.getGameRule(),
					chat: (chat) => {
						ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
					}
				}
				AssetsManager.chatDialog(params);
				break;
			case "btn_roomInfo": //规则
				this._onMenuCloseClick();

				let rule = PTJModel.getGameRule()
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
					chairCount: PTJModel.getChairCount(),
					fangzuobi: PTJModel.getGameRuleByKey('fangzuobi')
				})
				break;
			case "btn_deposit": //开始托管
				this._onMenuCloseClick();
				ApiRoom.gameMessageNotify(ApiPtj.gameTrushNotify(true));
				break;
			case "btn_quxiaotuoguan": //取消托管
				ApiRoom.gameMessageNotify(ApiPtj.gameTrushNotify(false));
				break;
			case "btn_invite": //邀请
				let gameRule = PTJModel.getGameRule()
				gameRule = gameRule || {};
				gameRule.roomId = PTJModel.getRoomID();
				let share = ConfigModel.getRoomRuleShare(gameRule);
				NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
				break;
			case "btn_copy": //复制
				let str = ConfigModel.getRoomShare(Enums.bundleType.PTJ, PTJModel.getRoomID())
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
				ApiRoom.gameMessageNotify(ApiPtj.gameUserOperateNotify(cardDataArr, ApiPtj.operateType.OUT));
				break;
			case "btn_pass":
				ApiRoom.gameMessageNotify(ApiPtj.gameUserOperateNotify([], ApiPtj.operateType.PASS));
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
			gameRule: PTJModel.getGameRule(),
		})
	},

	/**消息监听 */
	messageCallbackHandler(route, msg) {
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				// console.log('gameInit=============================', msg.data);
				this.gameInit(msg.data);
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				PTJModel.addUser(msg.data.roomUserInfo);
				this.userEnterRoom(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				if (msg.data.roomUserInfo.chairID != PTJModel.getMyChairID()) {
					PTJModel.delUser(msg.data.roomUserInfo.chairID);
				}
				this.userLeaveRoom(msg.data.roomUserInfo)
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				// console.log("收到了玩家准备==", msg.data)
				this.onUserReady(msg.data)
			} else if (msg.type === ApiRoom.GAME_END_PUSH) {
				// console.log("游戏结束《《《《《《《《《", msg)
			} else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
				if (!msg.data.userList || msg.data.userList.length == 0) return;
				msg.data.myChairID = PTJModel.getMyChairID();
				AssetsManager.disDialog(msg.data);
			} else if (msg.type === ApiRoom.USER_CHAT_PUSH) {
				let idx = PTJModel.getUserChairIndex(msg.data.chairID)
				let com = this._userList[idx]
				if (com) {
					com.gameChat(msg.data)
				}
			} else if (msg.type === ApiRoom.USER_GIFT_SEND_PUSH) {
				this.onGift(msg.data.fromChairID, msg.data.toChairID, msg.data.giftID);
			} else if (msg.type === ApiRoom.USER_OFF_LINE_PUSH) {
				let idx = PTJModel.getUserChairIndex(msg.data.chairID)
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
				PTJModel.updateUserPlayStatus(msg.data.userPlayStatus);
			} else if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
				if (msg.data.code != 0) {
					if (msg.data.uid == UserModel.getData('uid')) {
						AssetsManager.tipDialog(Codes[msg.data.code]);
					}
					return;
				};
				PTJModel.setUserPropertyByUID(msg.data.uid, 'userStatus', msg.data.userStatus);
				PTJModel.setUserPropertyByUID(msg.data.uid, 'chairID', msg.data.toChairID);
				if (msg.data.uid == UserModel.getData('uid') && msg.data.toChairID >= PTJModel.getChairCount()) {
					//我自己被强制旁观
					this._userList[0].leave()
				}
				if (msg.data.toChairID < PTJModel.getChairCount()) {
					if (msg.data.uid == UserModel.getData('uid')) {
						this._userList.forEach(com => {
							com.leave()
						});
						this.getRoomSceneInfo()
					} else {
						/**重新刷新座位 */
						let user = PTJModel.getUserByChairID(msg.data.toChairID)
						this.userEnterRoom(user)
					}
				}
				//强制显示未入座的坐下按钮
				this.showSitDownButton();
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiPtj.GAME_BUREAU_PUSH) {
				this.onGameRoundUpdate(msg.data)
			} else if (msg.type === ApiPtj.GAME_STATUS_PUSH) { //游戏状态
				PTJModel.setGameStatus(msg.data.gameStatus)
				this.onGameStatusUpdate(msg.data)
			} else if (msg.type === ApiPtj.GAME_DICES_PUSH) {
				// let diceAniNode = cc.instantiate(this.diceAniPfb)
				// diceAniNode.parent = this.animationNode
				// diceAniNode.getComponent("PTJDice").init(msg.data.dice1, msg.data.dice2)
			} else if (msg.type === ApiPtj.GAME_SEND_CARDS_PUSH) { //发牌
				// console.log("发牌==", msg.data)
				this.onSendCard(msg.data, true)
			} else if (msg.type === ApiPtj.GAME_ROB_BANK_PUSH) { //抢庄返回
				// console.log("个人抢庄返回", msg.data)
				this.onRobBanker(msg.data)
			} else if (msg.type === ApiPtj.GAME_BANKER_PUSH) { //庄家位置更新
				this.onBankerUpdate(msg.data, true)
			} else if (msg.type === ApiPtj.GAME_USER_POUR_SCORE_PUSH) { //玩家下分推送
				// console.log("下分推送==", msg.data)
				this.onPourScoreStart(msg.data)
			} else if (msg.type === ApiPtj.GAME_USER_SCORE_PUSH) { //下注
				// console.log("下注结果==", msg.data)
				PTJModel.setUserBetScore(msg.data.uid, msg.data.score);
				this.onPlayerBet(msg.data, true)
			} else if (msg.type === ApiPtj.SHOW_CARDS_PUSH) { //亮牌结果
				// console.log("亮牌结果==", msg.data)
				this.onShowCard(msg.data)
			} else if (msg.type === ApiPtj.GAME_END_PUSH) {
				if (msg.data.result.length > 0) {
					msg.data.enterHall = this.enterHall.bind(this);
					msg.data.path = 'res/prefab/PTJAllResult';
					msg.data.bundle = Enums.bundleType.PTJ;
					msg.data.isUnionCreate = PTJModel.isUnionCreate();
					msg.data.unionID = PTJModel.getRoomCreatorByKey("unionID")
					msg.data.gameRule = PTJModel.getGameRule()
					msg.data.roomID = PTJModel.getRoomID()
					this.unscheduleAllCallbacks();
					this.scheduleOnce(() => {
						MessageCallback.emitMessage('RemoveGameResult');
						AssetsManager.createDialog(msg.data);
					}, 2);
				} else {
					this.enterHall();
				}
			} else if (msg.type === ApiPtj.GAME_REVIEW_PUSH) {
				let reviewRecord = msg.data.list
				if (reviewRecord && reviewRecord.length > 0) {
					AssetsManager.createDialog({
						bundle: Enums.bundleType.PTJ,
						path: "res/prefab/PTJResultDialog",
						reviewRecord: reviewRecord,

					});
				} else {
					AssetsManager.tipDialog('没有数据');
				}
			} else if (msg.type === ApiPtj.GAME_RESULT_PUSH) {
				this.onGameResult(msg.data)
			}
		} else if (route === 'ReconnectSuccess') {
			this.getRoomSceneInfo();
		} else if (route === 'SelfEntryRoomPush') {
			if (msg.gameType != PTJModel.getBundleType()) {
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