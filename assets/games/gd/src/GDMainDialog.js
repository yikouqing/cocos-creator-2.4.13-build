const ApiGd = require('./ApiGd');
const ApiRoom = require('../../../src/api/ApiRoom');
const GDGameLogic = require('./GDGameLogic');
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
const GDModel = require('./GDModel');
const CCUtil = require('../../../src/utils/CCUtil');
const GDCard = require('./GDCard');
const Events = require('../../../src/const/Events');
const NodePoolManager = require('../../../src/utils/NodePoolManager');

cc.Class({
	extends: cc.Component,

	properties: {
		userList: [require('GDHead')],
		Ctrl_OpOut: require('GDOutCtrl'), //出牌
		Ctrl_SwapCard: require("GDSwapCardCtrl"), //换牌
		cardItem: cc.Prefab,
		holds: cc.Node,
		text_jushu: cc.Label,
		text_roomID: cc.Label,
		node_LaiZi: cc.Node,
		node_ShowNode: cc.Node,
		node_LaiZiTips: cc.Node,
		node_CardsTips: cc.Node,
		txt_gameName: cc.Label,
		node_YouTips: cc.Node,
		btnYuYin: cc.Node,
		tog_CardPile: cc.Toggle,
		btnReady: cc.Node,
		btn_back: cc.Node,
		btn_readyLay: cc.Node,
		btnCopy: cc.Node,
		btnInvite: cc.Node,
		btnLocation: cc.Node,
		btnDeposit: cc.Node,
		depositNode: cc.Node,
		menuLay: cc.Node,
		menuLayList: cc.Node,
		btnTest: cc.Node,
		btn_leave: cc.Node,
		btn_dismiss: cc.Node,
		canNotDismissBar: cc.Node,
		btnCardRecord: cc.Node,
		cardRecordList: cc.Node,
		btnAniList: [cc.Node],

		_mateList: [], //匹配列表
		_userList: [], //玩家脚本列表
		_holdsList: [], //手牌ID列表
		_cardsList: [], //手牌节点列表
		_selectList: [], //选牌ID列表

		_laiziCard: 0,
		_mateIndex: -1,
		_offSetRateX: 0,
		_offSetRateY: 0,
		_touchedRect: null,
		_handsTouchAble: false,
		_touchedStartPos: cc.Vec2.ZERO,
		_cardRecordListPos: null,
		_cardRecordListShow: false,
		_isTouYou: false, //头游
	},

	onLoad() {
		NodePoolManager.init('gdCardPool', this.cardItem, 30);
	},

	start() {
		GDModel.init({ cardItem: this.cardItem });
		this._tableInit();
		this._handlerInit();
		this._cardBackSync();
		AssetsManager.init(this.node.parent);
	},

	_tableInit() {
		this._opClear();
		this._userList = [];
		this._laiziCard = 0;
		this._LiPaiList = [];
		this._isTouYou = false;
		this._offSetRateX = 0.7;
		this._offSetRateY = 0.7;
		this.setCardRow(false);
		this.showLaiZiTips(false);
		this.menuLay.active = false;
		this.btn_back.active = false;
		this.showTongHuaShunTips([]);
		this._aniX = this.btnAniList[0].x;
		for (let index = 0; index < this.userList.length; index++) {
			if (!this.userList[index]) continue;
			this.userList[index].bind({
				index: index,
				comp: this
			});
		}
		this._cardRecordListPos = {};
		this.btnCardRecord.active = false;
		this._cardRecordListPos.show = this.cardRecordList.getPosition();
		this._cardRecordListPos.hide = cc.v2(this._cardRecordListPos.show.x - this.cardRecordList.width, this._cardRecordListPos.show.y);
		this.cardRecordList.setPosition(this._cardRecordListPos.hide);
		this._onLoadOver();
	},


	/**换牌 :type 进/还*/
	_clickSwapCard(type) {
		let runVal = 10;
		let selectsOk = this._holdsList.length && this._selectList.length == 1;
		let showNo = () => {
			AssetsManager.tipDialog(type ? "选择一张牌值最大的牌进贡" : `选择一张牌值${runVal}或以下的牌还贡`);
			this._clearSelects();
			return false
		}
		if (!selectsOk) {
			showNo();
			return;
		}
		let cardID = this._selectList[0];
		let cardVal = GDGameLogic.getCardLogicValue(cardID);
		if (type) {
			let CurUser = GDModel.getSwapCard(GDModel.getMyUID());
			let FirstID = CurUser.cards || this._holdsList[0];
			selectsOk = cardVal == GDGameLogic.getCardLogicValue(FirstID);
		} else {
			selectsOk = cardVal != this._laiziCard && cardVal <= runVal;
		}
		if (!selectsOk) {
			showNo();
			return;
		} else {
			let selectsList = this._selectList.slice();
			this._handsTouchAble = false;
			let typeVal = type ? 1 : 2;
			this._clearSelects();
			let selectsNum = 0;
			for (let y = 0; y < this._cardsList.length; y++) {
				if (selectsNum >= selectsList.length) {
					break;
				}
				if (!this._cardsList[y]) continue;
				let CardCtrl = this._cardsList[y].getComponent(GDCard);
				let isSelects = selectsList.indexOf(CardCtrl.getCardId()) != -1;
				if (isSelects) {
					selectsNum += 1;
					CardCtrl.gray(true);
				}
			}
			this.Ctrl_SwapCard.hideSwapBtn();
			ApiRoom.gameMessageNotify(ApiGd.getJinGongNotify(GDModel.getMyUID(), typeVal, selectsList))
		}
	},

	/**显示赖子提示 */
	showLaiZiTips(isShow) {
		let showVal = (type, myNum, duiNum) => {
			if (!this.node_LaiZi) return false;
			let show_wo = this.node_LaiZi.getChildByName("show_wo");
			let show_dui = this.node_LaiZi.getChildByName("show_dui");
			let myVal = `<color=${type == 1 ? "#FF0000" : "#000000"}>${myNum}</c>`;
			let duiVal = `<color=${type == 2 ? "#FF0000" : "#000000"}>${duiNum}</c>`;
			show_wo.getChildByName("rich_val").getComponent(cc.RichText).string = myVal;
			show_dui.getChildByName("rich_val").getComponent(cc.RichText).string = duiVal;
		}
		showVal(0, 0, 0);
		if (!this.node_LaiZiTips) return;
		this.node_LaiZiTips.active = false;
		if (isShow) {
			let gameStatus = GDModel.getGameStatus();
			let CarsUpgrade = GDModel.getCarsUpgrade();
			// console.log("gameStatus", gameStatus, "CarsUpgrade", CarsUpgrade,)
			let isStatus =
				gameStatus != ApiGd.gameStatus.NONE &&
				gameStatus != ApiGd.gameStatus.GAME_END;
			if (!isStatus || !CarsUpgrade.length) return;

			let myIndex = 0;
			let duiIndex = 1;
			let myVal = CarsUpgrade[myIndex] || 0;
			let duiVal = CarsUpgrade[duiIndex] || 0;
			let CurBankerID = GDModel.getBankerUID();
			let isHitMy = CurBankerID == GDModel.getMyUID();

			if (CurBankerID && GDModel.getUserByUID(CurBankerID)) {
				let CurUser = GDModel.getUserByUID(CurBankerID);
				myIndex = CurUser.chairID % 2;
				duiIndex = myIndex == 0 ? 1 : 0;
				if (CurBankerID == GDModel.getMyUID()) {
					myVal = CarsUpgrade[myIndex];
					duiVal = CarsUpgrade[duiIndex];
				} else {
					duiVal = CarsUpgrade[myIndex];
					myVal = CarsUpgrade[duiIndex];
				}
			}

			this.node_LaiZiTips.scale = 1;
			this.node_LaiZiTips.active = true;
			cc.Tween.stopAllByTarget(this.node_LaiZiTips);
			this.node_LaiZiTips.getChildByName("spr_wofang").active = isHitMy;
			this.node_LaiZiTips.getChildByName("spr_duifang").active = !isHitMy;
			let node_cardsNum = this.node_LaiZiTips.getChildByName("text_cardsNum");
			node_cardsNum.getComponent(cc.Label).string = isHitMy ? myVal : duiVal;
			cc.tween(this.node_LaiZiTips)
				.to(0.2, {
					scale: 2
				})
				.delay(0.1)
				.to(0.2, {
					scale: 1
				})
				.delay(0.5)
				.call(() => {
					this.node_LaiZiTips.active = false;
					showVal(isHitMy ? 1 : 2, myVal, duiVal);
				})
				.start();
		};
	},


	/**显示名次 */
	showRanking(showAll = true, data = null) {
		if (showAll) { //显示所有
			this._syncUser((ctrl, obj) => {
				ctrl.showRanking(0);
				let Datalist = GDModel.getDatalist(obj.uid); //换牌
				if (!Datalist) {
					ctrl.showSwapCard(null);
				} else {
					let cards = Datalist.cards;
					let cardId = cards.length ? cards[0] : cards;
					cardId && ctrl.showSwapCard(cardId);
				}
			});
		} else {
			if (!data) return;
			let playerRanking = GDModel.getplayerRanking();
			for (const uid in playerRanking) {
				let rankingVal = playerRanking[uid];
				let localIndex = GDModel.getIndexByUID(uid);
				let CurUserCtrl = this._userList[localIndex];
				if (CurUserCtrl) {
					if (rankingVal == 1 && this._isTouYou == false) {
						this._isTouYou = true;
						this.showEffect('res/prefab/GDEffectTouYou', (nodeEffect) => {
							nodeEffect.getChildByName("spr_xiaoji").active = false;
							let sp_xiaoji = nodeEffect.getChildByName("sp_xiaoji");
							let effectSp = sp_xiaoji.getComponent(sp.Skeleton);
							effectSp && effectSp.setCompleteListener((trackEntry, loopCount) => {
								CurUserCtrl.showRanking(rankingVal, nodeEffect);
							})
						})
					} else {
						CurUserCtrl.showRanking(rankingVal, null);
					}
				}
			}
		}
	},


	/**显示选牌 */
	_showSelects() {
		let selectList = this._selectList.slice();
		let selectsNum = 0,
			selectsAll = selectList.length;
		for (let x = 0; x < selectsAll; x++) {
			if (selectsNum >= selectsAll) {
				break;
			}
			if (!selectList[x]) continue;
			let selectsID = selectList[x];
			for (let y = 0; y < this._cardsList.length; y++) {
				if (!this._cardsList[y]) continue;
				let CardCtrl = this._cardsList[y].getComponent(GDCard);
				let isCardsID = selectsID == CardCtrl.getCardId();
				let isSelects = CardCtrl.getSelects();
				if (!isSelects && isCardsID) {
					if (GDModel.getCardRow()) {
						CardCtrl.nodeY(true);
					} else {
						CardCtrl.gray(true);
					}
					CardCtrl.setSelects(true);
					selectList.splice(x, 0);
					selectsNum += 1;
					break;
				}
			}
		}
	},

	/**获取选牌 */
	_getSelects() {
		let selectList = [];
		this._cardsList.forEach(cardItem => {
			let CardCtrl = cardItem.getComponent(GDCard);
			if (CardCtrl.getSelects()) {
				selectList.push(CardCtrl.getCardId());
			}
		})
		return selectList;
	},

	/**重置选牌 */
	_clearSelects() {
		this._mateIndex = -1;
		this._selectList = [];
		this._cancelSelects();
	},

	/**清除选牌 */
	_cancelSelects() {
		if (GDModel.isShowDuiYou()) return
		this._cardsList.forEach((CardNode) => {
			let CardCtrl = CardNode.getComponent(GDCard);
			if (CardCtrl) {
				CardCtrl.setSelects(false);
				CardCtrl.nodeY(false);
				CardCtrl.gray(false);
			}
		})
	},
	/**回收手牌 */
	_clearHolds() {
		while (this.holds.childrenCount != 0) {
			let card = this.holds.children[0];
			card && NodePoolManager.put('gdCardPool', card);
		}
		this.holds.destroyAllChildren();
		this._cardsList = [];
	},

	messageCallbackHandler(route, msg) {
		GDModel.messageCallbackHandler(route, msg);
		if (route === 'RoomMessagePush') {
			if (msg.type === ApiRoom.USER_LEAVE_ROOM_RESPONSE) {
				if (msg.data.chairID === GDModel.getMyChairID()) { };
			} else if (msg.type === ApiRoom.OTHER_USER_ENTRY_ROOM_PUSH) {
				this._onUserEnter(msg.data.roomUserInfo);
				this._verifyZuobi(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
				this._onUserLeave(msg.data.roomUserInfo);
			} else if (msg.type === ApiRoom.USER_READY_PUSH) {
				this._onUserReady();
			} else if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
				this.txt_gameName.string = `游戏:${ConfigModel.getGameName(Enums.bundleType.GD)}`
				this._gameInit();
			} else if (msg.type === ApiRoom.ROOM_DISMISS_PUSH) {

			} else if (msg.type === ApiRoom.ASK_FOR_DISMISS_PUSH) {
				if (!msg.data.userList || msg.data.userList.length == 0) return;
				msg.data.myChairID = GDModel.getMyChairID();
				AssetsManager.disDialog(msg.data);
				GDModel.setGameRoundEndData(null);
			} else if (msg.type === ApiRoom.USER_CHAT_PUSH) {
				this._onChat(msg.data);
			} else if (msg.type === ApiRoom.USER_GIFT_SEND_PUSH) {
				this._onGift(msg.data.fromChairID, msg.data.toChairID, msg.data.giftID);
			} else if (msg.type == ApiRoom.USER_OFF_LINE_PUSH) {
				this._onOffLine(msg.data);
			} else if (msg.type === ApiRoom.USER_VOICE_PUSH) { } else if (msg.type === ApiRoom.BE_SHORT_OF_GOLD_COINS_PUSH) {
				if (msg.data.uid == UserModel.getData('uid')) {
					AssetsManager.tipDialog('金币不足，不可加入！');
				}
			} else if (msg.type === ApiRoom.ROOM_USER_WIN_TOTAL_PUSH) {
				this._roundScoreSync(msg.data.userWinTotalScore);
			}
		} else if (route === 'GameMessagePush') {
			if (msg.type === ApiGd.GAME_BUREAU_PUSH) { //局数推送
				this._gameInfoSync();
			} else if (msg.type === ApiGd.USER_CAHRID_UPDATE_RESULT_PUSH) { // 玩家charid更新推送
				// console.log('616-玩家charid更新-执行', msg.data);
				this._seatsInit();
				this.showRanking(true);
			} else if (msg.type === ApiGd.GAME_STATUS_PUSH) { //470-状态推送
				this._onStatusSync();
			} else if (msg.type === ApiGd.GAME_BANKER_PUSH) {
				this.showLaiZiTips(true);
				this.showRanking(true);
			} else if (msg.type == ApiGd.GAME_SEND_CARDS_PUSH) { //603-发牌推送
				this._onSendCards();
			} else if (msg.type === ApiGd.GAME_JIN_GANG_PUSH) { //602-进贡
				this._onSwapCard();
			} else if (msg.type === ApiGd.GAME_JIN_GANG_RESULT_PUSH) { //622-进贡结果
				this.Ctrl_SwapCard.showSwapCard(this._userList, false);
			} else if (msg.type === ApiGd.GAME_EXCHANGE_PUSH) {
				this.Ctrl_SwapCard.showSwapCard(this._userList, true);
			} else if (msg.type == ApiGd.GAME_USER_OPERATE_START_PUSH) { //604=操作提示-推送
				this._onOutTurn(msg.data);
			} else if (msg.type == ApiGd.GAME_USER_OPERATE_PUSH) { //610-操作结果-推送
				this._onOpResult(msg.data);
			} else if (msg.type == ApiGd.GAME_SIDE_SEND_CARDS_PUSH) {
				this._opSync();
			} else if (msg.type == ApiGd.GAME_PLAYER_RANKING_PUSH) {
				this.showRanking(false, msg.data);
			} else if (msg.type == ApiGd.GAME_RESULT_PUSH) { //小结算
				this._onSmall(msg.data);
			} else if (msg.type == ApiGd.GAME_END_PUSH) { //大结算
				this._onEnd(msg.data);
			} else if (msg.type === ApiGd.GAME_REVIEW_PUSH) { //回放
				// console.log('回放', msg);
				let reviewRecord = msg.data.list;
				if (reviewRecord && reviewRecord.length > 0) {
					AssetsManager.createDialog({
						bundle: Enums.bundleType.GD,
						path: "res/prefab/GDReview",
						reviewRecord: reviewRecord,
					});
				} else {
					AssetsManager.tipDialog('暂无回放没有数据');
				}
			} else if (msg.type == ApiGd.GAME_TRUST_PUSH) {
				this.depositNode.active = !!msg.data.trust;
			}
		} else if (route === 'ReconnectSuccess') {
			this.onEventShow();
		} else if (route == 'UpdateGameBg') { } else if (route == 'UpdateGameCardBg') {
			this._cardBackSync();
		} else if (route === 'SelfEntryRoomPush') {
			if (msg.gameType != GDModel.getBundleType()) {
				AssetsManager.popDialog({
					content: `进入游戏失败,请返回大厅后再试！`,
					ok: this._enterHall.bind(this)
				});
				return;
			}
			UserModel.setData('gameType', msg.gameType);
			ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
		} else if (route === 'CreateRoomFail') {
			this.unscheduleAllCallbacks();
			AssetsManager.popDialog({
				content: Codes[msg.code],
				ok: this._enterHall.bind(this)
			});
		} else if (route === 'QuickJoinFail') {
			AssetsManager.popDialog({
				content: Codes[msg.code],
				ok: this._enterHall.bind(this)
			});
		} else if (route === 'JoinGameAgainPush') {
			this.unscheduleAllCallbacks();
			AssetsManager.popDialog({
				content: Codes[msg.code],
				ok: this._enterHall.bind(this)
			});
		} else if (route === 'TestClickReq') {
			this._onTestClick()
		} else if (route === 'OnGameOnceAgain') {
			this.unscheduleAllCallbacks();
			this.scheduleOnce(() => {
				AssetsManager.popDialog({
					content: '再来一局初始化异常，请返回大厅后再试！',
					ok: () => {
						this._enterHall();
					}
				});
			}, 10);
		} else if (route === Events.clientEvents.gvUploadFileSuccess) {
			this._onUploadSuccess(msg)
		}
	},

	_gameInit() {
		MessageCallback.emitMessage('RemoveGameResult');
		this._seatsInit();
		this.unscheduleAllCallbacks();
		this.showLaiZiTips(true);
		this._cardRecordsSync();
		this._gameInfoSync();
		this._onUserReady();
		this._opSync();
	},

	/**每局 */
	_gameInfoSync() {
		MessageCallback.emitMessage('RemoveGameResult');
		this.showDuiYou();
		this._isTouYou = false;
		this.showRanking(true);
		this.btn_leave.active = GDModel.getCurBureau() == 0;
		this.btn_dismiss.active = GDModel.getCurBureau() > 0 && !GDModel.getGameRuleByKey("canNotDissmiss");
		this.text_roomID.string = `房号:${GDModel.getRoomID()}`;
		this.btnTest.active = false // !!UserModel.getData('isTest');
		this.btnDeposit.active = GDModel.getGameRuleByKey("canTrust");
		this.btnLocation.active = !!GDModel.getGameRuleByKey('showGps');
		this.text_jushu.string = `局数:${GDModel.getCurBureau()}/${GDModel.getMaxBureau()}局`;
		let unionID = GDModel.isUnionCreate() ? GDModel.getRoomCreatorByKey('unionID') : null;
		let isShowInvite = ConfigModel.gameWechatInvitation(unionID);
		this.btnCopy.active = GDModel.getCurBureau() == 0 && !!isShowInvite;
		this.btnInvite.active = GDModel.getCurBureau() == 0 && !!isShowInvite;
		let yuyin = GDModel.getGameRuleByKey('yuyin');
		this.btnYuYin.active = !!yuyin && ConfigModel.getData('voiceSpeaker');
		if (this.canNotDismissBar) this.canNotDismissBar.active = GDModel.getGameRuleByKey("canNotDissmiss")
	},

	showDuiYou() {
		GDModel.setDuiYouUID("", false);
		let userList = GDModel.getUsersInSeat();
		let chairCount = GDModel.getChairCount();
		let youUID = !!GDModel.getnextBitCards().length;
		userList.forEach((user) => {
			let localIndex = GDModel.getIndexByUID(user.uid);
			let isDuiYou = chairCount == 4 && localIndex == 2;
			let CurUser = this._userList[localIndex];
			if (CurUser) {
				CurUser.showDuiYou(isDuiYou);
				let data = CurUser.getUserData();
				if (youUID && isDuiYou && data) {
					GDModel.setDuiYouUID(data.uid, true);
				}
			}
		})
	},

	_opClear() {
		this.Ctrl_OpOut.clear();
		this.Ctrl_SwapCard.clear();
		this.btn_readyLay.active = false;
		this.node_YouTips.active = false;
	},

	/**座位初始化 */
	_seatsInit() {
		this._userList = [];
		GDModel.setRelativeChairID();
		let chairCount = GDModel.getChairCount();
		this.userList.forEach((CurUser, index) => {
			if (chairCount == 2) {
				if (index != 1 && index != 3) {
					this._userList.push(CurUser);
				}
			} else if (chairCount == 3) {
				if (index != 2) {
					this._userList.push(CurUser);
				}
			} else {
				this._userList.push(CurUser);
			}
		})
		this._syncUser((ctrl, obj) => {
			ctrl.sit(obj);
		})
	},

	/**用户进入 */
	_onUserEnter(userObj) {
		if (!userObj) return;
		let localIndex = GDModel.getIndexByUID(userObj.uid);
		if (!!this._userList[localIndex]) {
			this._userList[localIndex].sit(userObj)
		};
	},

	/**
	 * 同步所有用户》返回用户脚本和信息》处理用户方法
	 * @param {*} funs 
	 */
	_syncUser(funs) {
		let userList = GDModel.getUsersInSeat();
		userList.forEach((user) => {
			let localIndex = GDModel.getIndexByUID(user.uid);
			if (this._userList && this._userList[localIndex]) {
				funs && funs(this._userList[localIndex], user);
			}
		})
	},

	/**发牌 */
	_onSendCards() {
		let gameStatus = GDModel.getGameStatus();
		if (gameStatus == ApiGd.gameStatus.SEND_CARDS) {
			this.showLaiZiTips(true);
			this.setCardRow(false);
			this._LiPaiList = [];
		}
		this._syncUser((ctrl, obj) => {
			ctrl.send(obj);
		});
		this._opSync();
	},

	/**同步操作 */
	_opSync() {
		this._opClear();
		this._clearSelects();
		this._updateHoldsShow(false);
		let isDuiYou = GDModel.isShowDuiYou();
		let isMyTurn = GDModel.checkIsMyTurn();
		let CurBureau = GDModel.getCurBureau();
		let gameStatus = GDModel.getGameStatus();
		// console.log("局数》", CurBureau, "游戏状态", gameStatus, "是否我操作", isMyTurn, "队友模式", isDuiYou);
		this.btnCardRecord.active = !!GDModel.getGameRuleByKey('isCardRecorder') && gameStatus == ApiGd.gameStatus.USER_OPERATE;
		this._handsTouchAble = isDuiYou == false && gameStatus != ApiGd.gameStatus.NONE && gameStatus != ApiGd.gameStatus.GAME_END;
		if (gameStatus == ApiGd.gameStatus.NONE) {
			this.btn_readyLay.active = CurBureau == 0;
			if (CurBureau == 0) {
				let playStatus = GDModel.getUserPlayStatusByUID(GDModel.getMyUID());
				this.btn_back.active = playStatus != ApiRoom.playStatus.PLAYING && GDModel.isUnionCreate();
				this.btnReady.active = playStatus != ApiRoom.playStatus.READY;
			}
			// this.btn_back.active = false;
		} else if (gameStatus == ApiGd.gameStatus.SEND_CARDS) { //发牌
		} else if (gameStatus == ApiGd.gameStatus.JIN_GANG) { //进贡
			this._onSwapCard();
			this.Ctrl_SwapCard.showSwapCard(this._userList, false);
		} else if (gameStatus == ApiGd.gameStatus.USER_OPERATE) { //出牌
			isDuiYou = false;
			if (!!isMyTurn && isDuiYou == false) {
				this._updateCardInif(true, (mateList) => {
					this.Ctrl_OpOut.sync(mateList);
				});
			}
		} else if (gameStatus == ApiGd.gameStatus.GAME_END) {
			this._clearHolds();
		}
	},

	/**604=操作提示-推送 */
	_onOutTurn(data) {

		// console.log("604=操作提示-推送", data)
		this._opSync();
		this._cardRecordsSync();
		this._syncUser((userCrtl, userObj) => {
			userObj.isTurn = data.uid == userObj.uid;
			userCrtl.turn(userObj);
		})
	},

	/**610-操作结果-推送 */
	_onOpResult(data) {
		this._cardRecordsSync();
		let operateType = data.operateInfo.operateType;
		if (!data.operateInfo.isSuccess) {
			AssetsManager.tipDialog(data.operateInfo.errMsg);
			return;
		}
		if (data.uid == GDModel.getMyUID()) {
			this._opClear();
			if (operateType != ApiGd.operateType.PASS) {
				this._holdsSync();
			} else {
				this._clearSelects();
			}
		}
		let localIndex = GDModel.getIndexByUID(data.uid);
		if (!this._userList[localIndex]) return;
		this._userList[localIndex].out(data);
		let cards = data.operateInfo.cards || [];
		let cardType = data.operateInfo.cardType || 0;
		if (operateType == ApiGd.operateType.PASS || cards.length == 0) return;
		if (cardType == ApiGd.cardType.TIAN_WANG_BOMB) { // 天王炸
			GDModel.showAinm(7, (node) => {
				this.node_ShowNode.destroyAllChildren();
				this.node_ShowNode.addChild(node);
			})
		}
	},
	/**显示特效 */
	showEffect(path, callback) {
		if (!this.node_ShowNode) return;
		this.node_ShowNode.active = true;
		path && AssetsManager.loadAsset({
			bundle: Enums.bundleType.GD,
			aType: cc.Prefab,
			path: path,
		}, (item) => {
			if (!item || !this.node_ShowNode) return;
			this.node_ShowNode.destroyAllChildren();
			const effect = cc.instantiate(item);
			this.node_ShowNode.addChild(effect);
			effect.setPosition(cc.v2(0, 80));
			callback && callback(effect);
		});
	},

	_onSwapCard() {
		this.Ctrl_SwapCard.hideSwapBtn();
		let jinGangASeat = GDModel.getjinGangASeat();
		for (let index = 0; index < jinGangASeat.length; index++) {
			let CurjinGang = jinGangASeat[index];
			let Cardstype = parseInt(CurjinGang.Cardstype);
			// console.log("我uid", GDModel.getMyUID(), "当前进贡人", CurjinGang)
			if (Cardstype == 3) {
				this.Ctrl_SwapCard.showResist();
				if (CurjinGang.uid != GDModel.getMyUID()) {
					let localIndex = GDModel.getIndexByUID(CurjinGang.uid);
					if (!this._userList[localIndex]) continue;
					// this._userList[localIndex].showResist();
				}
			} else {
				if (CurjinGang.uid == GDModel.getMyUID()) {
					if (!GDModel.getDatalist(GDModel.getMyUID())) {
						this._handsTouchAble = true;
						let isjinGang = Cardstype == 1; //1>进/2返
						// console.log(`我》${isjinGang ? "进贡" : "还贡"}`)
						this.Ctrl_SwapCard.showSwapBtn(isjinGang);
						if (isjinGang) {
							this._selectList = [CurjinGang.cards];
							this._showSelects();
						}
					}
				}
			}
		}
	},

	//用户离线
	_onOffLine(user) {
		let localIndex = GDModel.getIndexByUID(user.uid);
		if (!this._userList[localIndex]) return;
		this._userList[localIndex].off();
	},

	/**恢复所有人的总输赢分数 */
	_roundScoreSync(scores) {
		if (!GDModel.scoreState()) return;
		for (const index in scores) {
			let localIndex = GDModel.getIndexByUID(index);
			if (!this._userList[localIndex]) continue;
			this._userList[localIndex].setTotalScore(scores[index]);
		}
	},
	/**游戏状态同步 */
	_onStatusSync() {
		this._opSync();
		let gameStatus = GDModel.getGameStatus();
		if (gameStatus == ApiGd.gameStatus.NONE) {
			this._syncUser((ctrl, obj) => {
				ctrl.sit(obj);
			});
		}
		this._userList.forEach(ctrl => {
			ctrl.clearStatus();
		});
	},

	_onSmall(data) {
		this._opSync();
		let isBureauFull = false;
		let guo = GDModel.getGameRuleByKey("guo");
		if (!!guo) {
			isBureauFull = guo == this._laiziCard;
		} else {
			isBureauFull = GDModel.getCurBureau() == GDModel.getMaxBureau();
		}
		// console.log("癞子", this._laiziCard, "过几", guo, GDModel.getCurBureau(), GDModel.getMaxBureau(), '小结算======', isBureauFull, data);
		let createResultDialog = () => {
			let nodeParams = { // 创建结束界面
				mainDialog: this,
				resultData: data,
				bundle: Enums.bundleType.GD,
				isBureauFull: isBureauFull,
				onEnd: this._onEnd.bind(this),
				path: 'res/prefab/GDResultDialog',
				myChairID: GDModel.getMyChairID(),
				curBureau: GDModel.getCurBureau(),
				maxBureau: GDModel.getMaxBureau(),
				enterHall: this._enterHall.bind(this),
			};
			AssetsManager.createDialog(nodeParams);
		}
		if (!!data.hasChuntian) { //春天
			data.bundle = Enums.bundleType.GD;
			data.parent = this.node_ShowNode;
			data.callback = createResultDialog;
			data.path = 'res/prefab/GDEffectSpring';
			AssetsManager.createDialog(data);
		} else {
			createResultDialog();
		}

		if (!data.result) return;
		let result = data.result;
		for (const user of result) {
			let localIndex = GDModel.getIndexByUID(user.uid);
			if (!this._userList[localIndex]) return;
			this._userList[localIndex].small(user);
		}
	},

	_onEnd(data) {
		// console.log('展示大结算', data);
		UserModel.setData('roomID', '');
		if (data.result.length > 0) {
			data.bundle = Enums.bundleType.GD;
			data.roomID = GDModel.getRoomID();
			data.path = 'res/prefab/GDAllResult';
			data.gameRule = GDModel.getGameRule();
			data.enterHall = this._enterHall.bind(this);
			data.isUnionCreate = GDModel.isUnionCreate();
			data.unionID = GDModel.getRoomCreatorByKey("unionID");
			this.unscheduleAllCallbacks();
			this.scheduleOnce(() => {
				MessageCallback.emitMessage('RemoveGameResult');
				AssetsManager.createDialog(data);
			}, 2);
		} else {
			this._enterHall();
		}
	},

	_verifyZuobi(roomUserInfo) {
		if (!GDModel.getGameRuleByKey("fangzuobi")) return;
		if (!roomUserInfo || roomUserInfo.chairID >= GDModel.getChairCount()) return;
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
		let distanceLimit = parseInt(GDModel.getGameRuleByKey('distanceLimit'));
		if (isNaN(distanceLimit) || distanceLimit < 100) {
			distanceLimit = 100;
		}
		distanceLimit /= 1000;
		for (let i = 0; i < this._userList.length; ++i) {
			let user = this._userList[i].getUserData()
			if (!user || user.chairID == roomUserInfo.chairID) continue;
			// if (user.userInfo.lastLoginIP == roomUserInfo.userInfo.lastLoginIP) {
			//     AssetsManager.popDialog({
			//         content: `玩家${roomUserInfo.userInfo.nickname}与玩家${user.userInfo.nickname}IP地址相同！`,
			//         ok: () => {}
			//     });
			//     break;
			// }
			let add2 = null;
			try {
				add2 = JSON.parse(user.userInfo.address);
			} catch (e) { }
			if (!add2) continue;
			if (add2.x == 0 && add2.y == 0) continue;
			let distance = Utils.getDistanceByLocation(add1, add2);
			if (distance < distanceLimit) {
				AssetsManager.popDialog({
					content: `玩家${roomUserInfo.userInfo.nickname}与玩家${user.userInfo.nickname}距离过近！`,
					ok: () => { },
					no: () => { }
				});
				break;
			}
		}
	},

	// 用户离开
	_onUserLeave(user) {
		if (user.uid === UserModel.getData('uid')) {
			this._enterHall();
		} else {
			let localIndex = GDModel.getIndexByChairID(user.chairID);
			if (!this._userList[localIndex]) return;
			this._userList[localIndex].leave();
		}
	},
	/**显示准备状态 */
	_onUserReady() {
		if (GDModel.getCurBureau() != 0) return;
		this._syncUser((ctrl, obj) => {
			let playStatus = GDModel.getUserPlayStatusByUID(obj.uid);
			playStatus == 1 && ctrl.ready();
			if (obj.uid == GDModel.getMyUID()) {
				this._clearHolds();
				this._hideMenu();
				this._opSync();
			}
		})
	},


	//刷新设置显示状态
	_showMenuBtns() {
		if (!this.menuLay) return;
		this.menuLay.active = true;
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
		// let dt = 0
		// this.btnAniList.forEach(node => {
		// 	cc.tween(node).stop()
		// 	node.x = this._aniX + 200
		// 	cc.tween(node).delay(dt).to(0.2, {
		// 		x: this._aniX
		// 	}).start()
		// 	dt += 0.05
		// })
	},

	_hideMenu() {
		this.menuLay.active = false;
	},

	_onMenuCloseClick() {
		this._hideMenu();
	},

	btnClicks(event, param) {

		switch (param) {
			case 'menu':
				this._showMenuBtns();
				break;
			case 'menuclose':
				this._onMenuCloseClick();
				break;
			case 'refresh':
				this._onRefreshClick(event);
				break;
			case 'deposit':
				this._onDepositClick();
				break;
			case 'disdeposit':
				this._onDisDepositClick();
				break;
			case 'review':
				this._onReviewClick();
				break;
			case 'dismiss':
				this._onDismissClick();
				break;
			case 'setting':
				this._onSettingClick();
				break;
			case 'test':
				this._onTestClick();
				break;
			case 'location':
				this._onLocationClick();
				break;
			case 'chat':
				this._onChatClick();
				break;
			case 'ready':
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify());
				break;
			case 'copy':
				this._onCopyClick();
				break;
			case 'invite':
				this._onInviteClick();
				break;
			case 'rule':
				this._onRuleClick(event);
				break;
			case 'rob0':
			case 'rob1':
			case 'rob2':
			case 'rob3':
				let value = parseInt(param.slice(3));
				ApiRoom.gameMessageNotify(ApiGd.getRobNotify(value));
				break;
			case 'pass':
				this._passClick();
				break;
			case 'out':
				this._outClick();
				break;
			case 'rate0':
			case 'rate1':
				let rate = parseInt(param.slice(4));
				// ApiRoom.gameMessageNotify(ApiGd.getRateNotify(rate))
				break;
			case 'reset':
				this._onResetClick();
				break;
			case 'tip':
				this._updateCardInif(true, () => {
					this._onTipClick();
				});
				break;
			case 'rang0':
			case 'rang2':
			case 'rang3':
			case 'rang4':
				let count = parseInt(param.slice(4));
				ApiRoom.gameMessageNotify(ApiGd.getYieldNotify(count));
				break;
			case "btn_jingong":
				this._clickSwapCard(true);
				break;
			case "btn_huangong":
				this._clickSwapCard(false);
				break;

			case "btn_back":
				this._enterHall();
				break;
			case "btn_lipai":
				this._setLiPai();
				break;
			case "btn_huifu":
				this._LiPaiList = [];
				this._clearSelects();
				this._updateHoldsShow(false);
				break;
			case 'cardrecord':
				this._onCardRecordClick();
				break;
		}
	},

	_passClick() {
		let lastOutCards = GDModel.getLastOutCards();
		if (!lastOutCards || lastOutCards.length == 0) {
			AssetsManager.tipDialog('先手必须出牌哦~');
			return;
		}
		ApiRoom.gameMessageNotify(ApiGd.getOperateNotify(GDModel.getMyUID(), ApiGd.operateType.PASS, []));
	},

	_outClick() {
		if (!this._selectList || this._selectList.length == 0) {
			AssetsManager.tipDialog('先手必须出牌哦~');
			return;
		}
		ApiRoom.gameMessageNotify(ApiGd.getOperateNotify(GDModel.getMyUID(), ApiGd.operateType.OUT, this._selectList))
	},


	_setLiPai() {
		let cardList = this._getSelects();
		if (!cardList.length) return false;
		let gameRule = GDModel.getGameRule();
		let type = GDGameLogic.getCardType(cardList, gameRule, this._laiziCard);
		if (!type) {
			AssetsManager.tipDialog('牌型不符!请检查选择');
		} else {
			let LaiziCardID = this._laiziCard + 32; //红桃起始牌值32
			let isLaiZi = cardList.indexOf(LaiziCardID) != -1;
			// for (let index = 0; index < this._LiPaiList.length; index++) {
			// 	const sonList = this._LiPaiList[index];
			// 	let isLaiZi = sonList.indexOf(LaiziCardID) != -1;
			// 	if (isLaiZi) {
			// 		this._LiPaiList.splice(index, 1)
			// 	}
			// }
			if (isLaiZi) {
				let getLaiZiNum = (list) => {
					let listLaiZi = list.filter(cardID => cardID == LaiziCardID);
					return listLaiZi.length || 0;
				}
				let count = 0,
					finalIndex = 0;
				let allLaiZiNum = getLaiZiNum(this._holdsList);
				for (let index = 0; index < this._LiPaiList.length; index++) {
					let sonList = this._LiPaiList[index];
					let isLaiZi = sonList.indexOf(LaiziCardID) != -1;
					if (isLaiZi) {
						finalIndex = index;
						count += getLaiZiNum(sonList);
						if (count >= allLaiZiNum) {
							break;
						}
					}
				}
				if (count >= allLaiZiNum) {
					this._LiPaiList.splice(finalIndex, 1)
				}

			}
			this._LiPaiList.push(cardList);
			this._updateHoldsShow(false);
		}
	},

	_updateCardInif(isOutCard, funs) {
		let isDuiYou = GDModel.isShowDuiYou();
		let getHoldsSortList = () => {
			let holdsUID = isDuiYou ? GDModel.getDuiYouUID() : GDModel.getMyUID();
			let holdsList = GDModel.getUserHandCardsByUID(holdsUID);
			let CarsUpgrade = this._laiziCard = GDModel.getUpgrade() || 0;
			let newholdsList = GDGameLogic.sortCardList(holdsList, CarsUpgrade);

			if (isDuiYou) {
				this._LiPaiList = [];
				this.setCardRow(false);
			}
			// isDuiYou && console.log("我ID》", GDModel.getMyUID(), "手牌ID》", holdsUID, "队友手牌", holdsList);
			return newholdsList.slice();
		}
		let holdsList = getHoldsSortList();
		this.node_YouTips.active = isDuiYou;
		let gameRule = GDModel.getGameRule();
		if (isDuiYou) {
			this._LiPaiList = [];
		}
		let lastOutCards = isOutCard ? GDModel.getLastOutCards() : null;
		let lastOutList = lastOutCards && lastOutCards.length ? lastOutCards.slice() : null;
		let NoMateList = isDuiYou ? [] : GDGameLogic.searchOutCard(gameRule, holdsList.slice(), this._laiziCard, null);
		let OutMateList = isDuiYou ? [] : GDGameLogic.searchOutCard(gameRule, holdsList.slice(), this._laiziCard, lastOutList);
		// isDuiYou == false && console.log("打", this._laiziCard, "isOutCard", isOutCard, "我手牌》", holdsList, "上家出牌》", isOutCard ? lastOutList : "", "配牌》OutMateList", isOutCard ? OutMateList : "");
		this._mateList = isOutCard ? OutMateList.slice() : NoMateList.slice();
		this.showTongHuaShunTips(isDuiYou ? [] : holdsList, NoMateList);
		funs && funs(OutMateList, holdsList);
	},

	/**同步手牌 */
	_holdsSync() {
		this._clearHolds();
		this._clearSelects();
		this._updateHoldsShow(true);
	},

	_updateHoldsShow(isOutCard = true) {
		this._updateCardInif(isOutCard, (mateList, holdsList) => {
			let isDuiYou = GDModel.isShowDuiYou();
			let gameStatus = GDModel.getGameStatus();
			let CardsObj = this._getCardsPos(holdsList);
			let isSendCards = gameStatus == ApiGd.gameStatus.SEND_CARDS;
			let initList = CardsObj.initList,
				posList = CardsObj.posList;
			this._cardsList = GDModel.addCardItem(this.holds, this._holdsList.slice(), posList, (CardItem, index) => {
				let GDCardCtrl = CardItem.getComponent(GDCard);
				GDCardCtrl.showBox(initList[index]);
				if (isSendCards) {
					CardItem.opacity = 0;
					cc.tween(CardItem)
						.delay(index * 0.05)
						.to(0.08, {
							opacity: 255
						})
						.call(() => {
							GDCardCtrl.showHuaSe(!GDModel.getCardRow());
						})
						.start();
				} else {
					GDCardCtrl.showHuaSe(!GDModel.getCardRow());
				}

				if (isDuiYou) {
					GDCardCtrl.gray(true);
				}
			})
		});
	},


	/**获取牌位置 */
	_getCardsPos(cardList) {
		let posList = [];
		let initList = [];
		let holdsHeight = 290;
		this._holdsList = cardList;
		if (GDModel.getCardRow()) {
			this.holds.scale = 0.85;
			this.holds.anchorY = 0.5;
			let count = cardList.length;
			let cardSize = GDModel.getCardSize();
			this._offSetRateX = count > 17 ? 0.65 : 0.7;
			let perWidth = cardSize.width * (1 - this._offSetRateX);
			let posY = this.holds.anchorY == 0 ? this.holds.height / 2 : 0;
			let totalWidth = perWidth * (count - 1);
			let startPos = cc.v2(-totalWidth / 2, 0);
			for (let index = 0; index < count; index++) {
				posList.push(cc.v2(startPos.x + index * perWidth, posY));
				initList.push({
					zIndex: index,
					index: 0,
				});
			}
		} else {
			let obj = GDModel.getNewTwoCardList(cardList, this._LiPaiList);
			let newHoldsList = obj && obj.holdsList ? obj.holdsList : [];
			let twoList = obj && obj.twoList ? obj.twoList : [];
			if (newHoldsList.length != cardList.length) {
				// console.log(cardList.length, "牌堆数据错误obj", obj)
			}
			this.holds.anchorY = 0;
			this.holds.scale = 0.8;
			this._offSetRateX = 0.1;
			this._offSetRateY = 0.0;
			this._holdsList = newHoldsList;
			let twoListLen = twoList.length;
			let cardSize = GDModel.getCardSize();
			let perWidth = cardSize.width * (1 - this._offSetRateX);
			let perheight = cardSize.height * (1 - this._offSetRateY);
			let totalWidth = perWidth * (twoListLen - 1);
			for (let indeX = 0; indeX < twoListLen; indeX++) {
				let sonList = twoList[indeX];
				let countY = sonList.length;
				let posX = -totalWidth / 2 + indeX * perWidth;
				for (let indeY = 0; indeY < countY; indeY++) {
					let CurzIndex = countY == 1 ? indeX : indeX - indeY;
					let posY = perheight / 2 + (indeY * 0.28 * perheight);
					let allH = posY + perheight / 2;
					if (allH > holdsHeight) {
						holdsHeight = allH;
					}
					posList.push(cc.v2(posX, posY));
					initList.push({
						zIndex: CurzIndex,
						index: indeY,
					});
				}
			}
		}
		this.holds.height = holdsHeight;
		if (this.holds.getComponent(cc.Widget)) {
			this.holds.getComponent(cc.Widget).Button = 70;
			this.holds.getComponent(cc.Widget).updateAlignment();
		}
		return {
			posList: posList,
			initList: initList
		};
	},


	_onTipClick() {
		// console.log("this._mateList", this._mateList, this._mateIndex)
		if (!this._mateList || this._mateList.length == 0) {
			AssetsManager.tipDialog('没有可出的牌哦~');
			return;
		}
		if (this._mateIndex >= this._mateList.length - 1) {
			this._mateIndex = -1;
		}
		this._mateIndex++;
		let mateList = this._mateList[this._mateIndex];
		this._selectList = mateList.cardList || [];
		this._cancelSelects();
		this._showSelects()
	},


	/**显示底部同花顺按钮 */
	showTongHuaShunTips(holdsList = [], NoMateList = []) {
		this.node_CardsTips.active = holdsList.length;
		if (!holdsList.length) return false;
		this._fangList = [];
		this._meiList = [];
		this._hongList = [];
		this._heiList = [];
		let allTongHuaList = [];
		for (let index = 0; index < NoMateList.length; index++) {
			const element = NoMateList[index];
			if (element.type == ApiGd.cardType.TONG_HUA_SUN) {
				allTongHuaList.push(element);
			}
		}
		if (this._LiPaiList.length) {
			let newHoldsList = holdsList.slice();
			let LiPaiList = this._LiPaiList.slice();
			for (let index0 = 0; index0 < LiPaiList.length; index0++) {
				let sonNum = 0,
					sonList = LiPaiList[index0];
				for (let index1 = 0; index1 < sonList.length; index1++) {
					let CurCardID = sonList[index1];
					for (let index2 = 0; index2 < newHoldsList.length; index2++) {
						let CurHoldsID = newHoldsList[index2];
						if (CurHoldsID && CurCardID == CurHoldsID) {
							newHoldsList.splice(index2, 1);
							sonNum += 1;
							continue
						}
					}
				}
				if (sonNum != sonList.length) {
					LiPaiList.splice(index0, 1);
				}
			}
			// console.log("理牌检验===>", this._LiPaiList)
			this._LiPaiList = LiPaiList.slice();
		};
		let gameStatus = GDModel.getGameStatus();
		let isTips = gameStatus != ApiGd.gameStatus.NONE && gameStatus != ApiGd.gameStatus.GAME_END;
		if (isTips && !!allTongHuaList.length) {
			for (let index = 0; index < allTongHuaList.length; index++) {
				let CurMatched = allTongHuaList[index];
				let curCardID = GDModel.getNoLaiZiCardID(CurMatched.cardList, this._laiziCard);
				let CurHuaSe = GDModel.isHuaSe(curCardID);
				if (CurHuaSe) {
					if (CurHuaSe == 1) {
						this._fangList.push(CurMatched);
					} else if (CurHuaSe == 2) {
						this._meiList.push(CurMatched);
					} else if (CurHuaSe == 3) {
						this._hongList.push(CurMatched);
					} else if (CurHuaSe == 4) {
						this._heiList.push(CurMatched);
					}
				}
			}
		}
		let setbtn = (node, list) => {
			// console.log(node.name, list)
			if (!node) return false;
			node.getComponent(cc.Button).interactable = !!list.length;
		}
		setbtn(this.node_CardsTips.getChildByName("btn_mei"), this._meiList);
		setbtn(this.node_CardsTips.getChildByName("btn_hei"), this._heiList);
		setbtn(this.node_CardsTips.getChildByName("btn_hong"), this._hongList);
		setbtn(this.node_CardsTips.getChildByName("btn_fang"), this._fangList);
	},

	clickTongHuaTips(event, clickType) {
		if (clickType == "btn_mei") {
			this._mateList = this._meiList;
		} else if (clickType == "btn_hei") {
			this._mateList = this._heiList;
		} else if (clickType == "btn_hong") {
			this._mateList = this._hongList;
		} else if (clickType == "btn_fang") {
			this._mateList = this._fangList;
		}
		this._onTipClick();
	},

	_onResetClick() {
		this._clearSelects();
	},
	/**托管 */
	_onDepositClick() {
		this._hideMenu();
		// return;
		ApiRoom.gameMessageNotify(ApiGd.gameTrushNotify(true));
	},
	/**取消托管 */
	_onDisDepositClick() {
		// return;
		ApiRoom.gameMessageNotify(ApiGd.gameTrushNotify(false));
	},

	_onSettingClick() {
		this._hideMenu();
		AssetsManager.setDialog({
			type: 'round',
			gameType: Enums.bundleType.GD,
			musicType: Enums.bundleType.POKER,
		});
	},

	_onRuleClick(event) {
		if (CCUtil.clickInterval(event.target, 0.5)) return;
		AssetsManager.tableDialog({
			gameRule: GDModel.getGameRule(),
		});
	},

	_onDismissClick() {
		this._hideMenu();
		if (!UserModel.isInRoom()) {
			this._enterHall();
			return;
		}
		let curBureau = GDModel.getCurBureau();
		if (curBureau > 0) {
			if (!!GDModel.getGameRuleByKey('canNotDissmiss')) {
				AssetsManager.tipDialog('该房间是禁止解散模式!');
				return
			}
			AssetsManager.popDialog({
				content: '是否确定发出解散申请？',
				ok: () => {
					ApiRoom.roomMessageNotify(ApiRoom.getAskForDismissNotifyData({
						isAsker: true
					}));
				},
				no: () => { }
			});
		} else {
			ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
		}
	},

	_onCopyClick() {
		let str = ConfigModel.getRoomShare(Enums.bundleType.GD, GDModel.getRoomID());
		NativeUtil.copyText(str);
	},

	_onInviteClick() {
		let gameRule = GDModel.getGameRule();
		gameRule = gameRule || {};
		gameRule.roomId = GDModel.getRoomID();
		let share = ConfigModel.getRoomRuleShare(gameRule);
		NativeUtil.wxShareUrl(0, share.url, share.title, share.content);
	},

	_onReviewClick() {
		this._hideMenu();
		ApiRoom.gameMessageNotify(ApiGd.gameReviewNotify());
	},

	//牌背
	_cardBackSync() {
		let url = ConfigModel.getCardUrl();
		for (const seat of this.userList) {
			seat.cardBackSync(url);
		}
	},

	update(dt) { },

	_onRefreshClick(event) {
		if (CCUtil.clickInterval(event.target, 10, true)) return;
		AssetsManager.tipDialog('刷新界面可以修复游戏显示问题');
		this.messageCallbackHandler('ReconnectSuccess');
	},

	_onTestClick() {
		// let jushu = GDModel.getCurBureau()
		// if (jushu <= 0) return;
		AssetsManager.createDialog({
			bundle: Enums.bundleType.GD,
			path: "res/prefab/GDSelectTest",
		})
	},

	_onLocationClick() {
		AssetsManager.locationDialog({
			users: GDModel.getPlayerTakeSeats(),
			chairCount: GDModel.getChairCount(),
			fangzuobi: GDModel.getGameRuleByKey('fangzuobi')
		})
	},

	_onChatClick() {
		let params = {
			gameRule: GDModel.getGameRule(),
			chat: (chat) => {
				ApiRoom.roomMessageNotify(ApiRoom.userChatNotify(chat.type, chat.content, null));
			}
		}
		AssetsManager.chatDialog(params);
	},
	// 邀请好友的按钮
	onShowInvite() {
		AssetsManager.friendDialog({
			gameRule: GDModel.getGameRule(),
		})
	},


	setCardRow(isChecked) {
		GDModel.setCardRow(isChecked);
		this.tog_CardPile.isChecked = !isChecked;
	},
	clickCardPile(event) {
		this.setCardRow(!event.isChecked);
		this._holdsSync();
	},

	onEventShow() {
		if (UserModel.isInRoom()) {
			ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
		} else {
			this._enterHall();
		}
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

	_onLoadOver() {
		if (!UserModel.isInRoom()) {
			AssetsManager.tipDialog("房间不存在")
			this.scheduleOnce(this._enterHall.bind(this), 0.5)
		} else {
			ApiRoom.roomMessageNotify(ApiRoom.getRoomSceneInfoNotify());
		}
	},
	_enterHall() {
		let isUnionCreate = GDModel.getRoomCreatorByKey('creatorType') == Enums.roomCreatorType.UNION_CREATE;
		let unionID = !!isUnionCreate ? GDModel.getRoomCreatorByKey('unionID') : null;
		SubManager.exitBundle(unionID);
	},

	_onChat(data) {
		// console.log('玩家聊天', data);
		let localIndex = GDModel.getIndexByUID(data.uid);
		if (!this._userList[localIndex]) return;
		this._userList[localIndex].chat(data);
	},
	_onGift(fromChairID, toChairID, giftID) {
		let fromLocalIndex = GDModel.getIndexByChairID(fromChairID);
		if (!this._userList[fromLocalIndex]) return;
		let sender = this._userList[fromLocalIndex].node;
		let reciever = [],
			rids = [];
		if (fromChairID == toChairID) {
			let players = {
				node: [],
				cid: []
			}
			this._syncUser((ctrl, obj) => {
				players.node.push(ctrl.node);
				players.cid.push(obj.chairID);
			});
			reciever = players.node;
			rids = players.cid;
		} else {
			let toLocalIndex = GDModel.getIndexByChairID(toChairID);
			if (!this._userList[toLocalIndex]) return;
			reciever.push(this._userList[toLocalIndex].node);
			rids.push(toChairID);
		}
		AssetsManager.addGift({
			parent: this.node_ShowNode,
			reciever: reciever,
			sid: fromChairID,
			sender: sender,
			rids: rids,
			id: giftID,
		});
	},

	_cardRecordsSync() {
		if (!GDModel.getGameRuleByKey('isCardRecorder')) return;
		let cardRecords = GDModel.getCardRecords();
		for (const card of cardRecords) {
			let childName = card.card.toString();
			if (!this.cardRecordList.getChildByName(childName)) continue;
			this.cardRecordList.getChildByName(childName).getComponent(cc.Label).string = card.count;
		}
	},
	_onCardRecordClick() {
		if (this._cardRecordListShow) {
			this._onHideCardRecord();
		} else {
			this._cardRecordListShow = true;
			this.cardRecordList.stopAllActions();
			this.cardRecordList.setPosition(this._cardRecordListPos.hide);
			cc.tween(this.cardRecordList)
				.to(0.35, {
					position: cc.v3(this._cardRecordListPos.show)
				}, {
					easing: 'backOut'
				})
				.start();
		}
	},

	_onHideCardRecord() {
		this._cardRecordListShow = false;
		this.cardRecordList.stopAllActions();
		this.cardRecordList.setPosition(this._cardRecordListPos.hide);
	},

	onDestroy() {
		this._handlerClear();
		GDModel.onDestroy();
		NodePoolManager.clear('gdCardPool')
		ConfigModel.setData('lastScene', 'gd');
	},


	_touchMove(event) {
		this._touchShow(event.touch._startPoint, event.touch._point, false);
	},
	_touchEnd(event) {
		this._touchShow(event.touch._startPoint, event.touch._point, true);
	},
	_touchShow(startPos, endPos, isEndTouch) {
		if (!this._handsTouchAble) return false;
		let halfW = 30, halfH = 20, fixedVal = 10;
		let TouchRect = cc.rect(startPos.x, startPos.y, fixedVal, fixedVal);
		if (startPos.x > endPos.x + halfW) {//向左
			TouchRect = cc.rect(endPos.x, startPos.y, Math.abs(startPos.x - endPos.x), fixedVal);
		} else if (startPos.x < endPos.x - halfW) {//向右
			TouchRect = cc.rect(startPos.x, startPos.y, Math.abs(endPos.x - startPos.x), fixedVal);
		} else if (startPos.y > endPos.y + halfH) {//向下
			TouchRect = cc.rect(startPos.x, endPos.y, fixedVal, Math.abs(startPos.y - endPos.y));
		} else if (startPos.y < endPos.y - halfH) {//向上
			TouchRect = cc.rect(startPos.x, startPos.y, fixedVal, Math.abs(endPos.y - startPos.y));
		}
		// isEndTouch && console.log("startPos", startPos, "\nendPos", endPos, "\nTouchRect", TouchRect)
		this.holds.children.forEach((cardItem) => {
			let CardCtrl = cardItem.getComponent(GDCard);
			let CardBoxNode = CardCtrl.getBoxNode();
			let CardSelects = CardCtrl.getSelects();
			let CardRect = CardBoxNode.getBoundingBoxToWorld();
			let CardIndex = this._selectList.indexOf(CardCtrl.getCardId());
			let isRectRect = cc.Intersection.rectRect(CardRect, TouchRect);
			if (CardIndex == -1) CardCtrl.gray(isRectRect);
			if (isEndTouch && isRectRect) {
				if (CardIndex !== -1 && !!CardSelects) {
					this._selectList.splice(CardIndex, 1);
					CardCtrl.setSelects(false);
					CardCtrl.gray(false);
				} else {
					CardCtrl.setSelects(!CardSelects);
					CardCtrl.gray(!CardSelects);
				}
			}
		})
		if (!isEndTouch) return false;
		this._selectList = this._getSelects();
		// console.log("selectList", this._selectList);
		AssetsManager.playEffect({
			bundle: Enums.bundleType.GD,
			path: "res/audio/main/sound_select_card",
		});
	},
	_handlerInit() {
		this.holds.on(cc.Node.EventType.TOUCH_CANCEL, this._touchEnd, this);
		this.holds.on(cc.Node.EventType.TOUCH_END, this._touchEnd, this);
		this.holds.on(cc.Node.EventType.TOUCH_MOVE, this._touchMove, this);
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
	},

	_handlerClear() {
		MessageCallback.removeListener(Events.clientEvents.gvUploadFileSuccess, this);
		this.holds.off(cc.Node.EventType.TOUCH_CANCEL, this._touchEnd, this);
		this.holds.off(cc.Node.EventType.TOUCH_END, this._touchEnd, this);
		this.holds.off(cc.Node.EventType.TOUCH_MOVE, this._touchMove, this);
		cc.game.off(cc.game.EVENT_SHOW, this.onEventShow, this);
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
});