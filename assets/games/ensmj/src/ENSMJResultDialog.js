const ApiRoom = require('../../../src/api/ApiRoom');
const ApiEnsmj = require('./ApiEnsmj');
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const UserModel = require('../../../src/model/UserModel');
const ENSMJModel = require('./ENSMJModel');
const MAX_USER_NUM = 4;
const huIndexUrl = "res/sprite/rank/";
const Utils = require('../../../src/utils/Utils');
const SubManager = require("../../../src/utils/SubManager")
const MessageCallback = require('../../../src/utils/MessageCallback');

cc.Class({
	extends: cc.Component,
	properties: {
		userLayOut: cc.Node,
		userItemNode: cc.Node,
		cardTypeItemNode: cc.Node,
		cardNode: cc.Node,
		img_title: cc.Sprite,
		clockLabel: cc.Label,
		bureauLabel: cc.Label,
		txt_roomInfo: cc.Label,
		_myChairId: null, //自己的座位号
		_gameRule: null, //游戏规则
		_roomId: 0, //房间号
	},

	start() {
		MessageCallback.addListener('RemoveGameResult', this);
		let reviewBtnNode = cc.find("reviewBtnNode", this.node);
		let resBtnNode = cc.find('resBtnNode', this.node);
		let clockNode = cc.find("Clock", resBtnNode);
		this.userItemNode.active = false;
		this.cardNode.active = false;
		reviewBtnNode.active = false;
		resBtnNode.active = false;
		clockNode.active = false;


		if (!!this.node.nodeParams.result) {
			this._maPaiInfo = Utils.deepCopy(this.node.nodeParams.maPaiInfo);
			this.resultData = Utils.deepCopy(this.node.nodeParams.result);
			this._gameRule = this.node.nodeParams.gameRule;
			this._roomId = this.node.nodeParams.roomID;
			this._winUid = this.node.nodeParams.winUid;
		}

		if (this.node.nodeParams.isReview) { //视频回放
			this.setAllHandCards();
			this.node.active = false;
			this.scheduleOnce(() => {
				this.node.active = true;
			}, 1);
		} else if (this.node.nodeParams.isResult) { //正常结算
			this.tick = 30;
			this.setAllHandCards();
			this.node.active = true;
			resBtnNode.active = true;
			this.showAllResult = this.node.nodeParams.onEnd;
			clockNode.active = !this.node.nodeParams.isBureauFull;

		} else { //牌局回放
			this.bureau = 0;
			reviewBtnNode.active = true;
			this.reviewRecord = this.node.nodeParams.reviewRecord || this.node.nodeParams.list;
			let lastItem = this.reviewRecord[this.reviewRecord.length - 1];
			if (lastItem && !lastItem.result) {
				this.reviewRecord.pop();
			}; //最后一局未完成，删除
			if (this.reviewRecord && this.reviewRecord[this.bureau]) {
				this._gameRule = this.reviewRecord[this.bureau].gameRule;
				this._roomId = this.reviewRecord[this.bureau].roomID;
			};
			this.showResult()
		}
		this.setRoomInfo();
	},

	setRoomInfo() {
		let str = ""
		if (this._roomId) {
			str += `房号:${this._roomId}`
		}
		if (this._gameRule) {
			str += `  底分:${this._gameRule.baseScore}`
		}
		if (str != "") {
			this.txt_roomInfo.string = str
		}
	},

	/**找出自己的座位号 */
	findMyChairId() {
		if (!this.resultData) return;
		this._myChairId = 0;
		for (let i = 0; i < this.resultData.length; i++) {
			const user = this.resultData[i];
			if (UserModel.getData("uid") === user.uid) {
				this._myChairId = i;
			}
		}
	},

	setAllHandCards() {
		this.findMyChairId();
		this.showUserInfo();
	},


	/**选中头像后展示信息 */
	showUserInfo() {
		// console.log('用户信息', this.resultData);
		let myUid = UserModel.getData("uid");
		this.userLayOut.removeAllChildren();
		if (!this.resultData) return;
		let users = this.resultData;
		this._maxPlayerCount = users.length;
		let myScore = 0;
		for (const userObj of users) {
			if (!userObj) continue;
			let userItem = cc.instantiate(this.userItemNode);
			userItem.active = true;
			let CurUid = userObj.uid;
			userItem.parent = this.userLayOut;
			cc.find("banker", userItem).active = userObj.bankerUid == CurUid;
			cc.find('txt_uid', userItem).getComponent(cc.Label).string = 'ID:' + CurUid;
			cc.find('txt_nick', userItem).getComponent(cc.Label).string = CCUtil.stringClamp(userObj.nickname, 4, '..');
			AssetsManager.loadSpriteFrame({
				path: userObj.avatar,
				sprite: cc.find('head', userItem).getComponent(cc.Sprite)
			});


			let score = parseFloat(userObj.winScores) || 0;
			let win = cc.find('win', userItem).getComponent(cc.Label);
			let lose = cc.find('lose', userItem).getComponent(cc.Label);
			win.string = '+' + Utils.formatNumberWithDecimal(score, 2);
			lose.string = Utils.formatNumberWithDecimal(score, 2);
			lose.node.active = score <= 0;
			win.node.active = score > 0;
			if (CurUid == myUid) {
				this._myChairId = userObj.chairID;
				myScore = score;
			}
			let pilaiCards = userObj.pilaiCards || [];
			let userHuList = userObj.userHuList || null;
			let handCards = userObj.userCards && userObj.userCards[CurUid] ? userObj.userCards[CurUid] : [];
			let huCards = userHuList && userObj.huCards ? userObj.huCards : 0,
				huType = userObj.huType || -1;
			let spr_huIndex = cc.find('huIndex', userItem).getComponent(cc.Sprite);
			let lab_huVal = cc.find('huVal', userItem).getComponent(cc.Label);
			spr_huIndex.node.active = false;
			lab_huVal.node.active = false;

			let lab_plusType = cc.find("lab_plusType", userItem);
			let Lay_plusType = cc.find("Lay_plusType", userItem);
			let showCurStr = (str) => {
				let txtNode = cc.instantiate(lab_plusType);
				txtNode.getComponent(cc.Label).string = str;
				txtNode.parent = Lay_plusType;
				txtNode.setPosition(0, 0);
			}
			let piIDArr = [],
				laiID = userObj.laiZiCards || -1;
			let pilaiCardBegin = userObj.pilaiCardBegin || [];
			pilaiCardBegin.forEach((id) => {
				if (laiID != id) piIDArr.push(id);
			})
			let laiNum = 0,
				piNum = 0;
			pilaiCards.forEach((cardID) => {
				if (laiID == cardID) {
					laiNum += 4
				} else {
					piNum += 2;
				}
			})
			if (piNum > 0) showCurStr("痞子杠x" + piNum);
			if (laiNum > 0) showCurStr("赖子杠x" + laiNum);
			if (userHuList) {
				let cardTypeList = userHuList ? userHuList.cardTypeList : []; //0: {type: 6, score: 5}
				let UserWinScore = userHuList ? userHuList.UserWinScore : null;
				if (!!UserWinScore && !!UserWinScore.baseScore) showCurStr("底分x" + UserWinScore.baseScore);
				if (!!UserWinScore && !!UserWinScore.gangScore) showCurStr("杠x" + UserWinScore.gangScore);
				if (!!UserWinScore && !!UserWinScore.gangZhiScore) showCurStr("自摸杠x" + UserWinScore.gangZhiScore);
				cardTypeList.forEach((obj) => {
					showCurStr(ApiEnsmj.cardTypePlus[obj.type] + "x" + obj.score);
				})
			}

			let cardsLayout = cc.find('cardsLayout', userItem);
			cardsLayout.getComponent(cc.Layout).enabled = false;
			if (cardsLayout) cardsLayout.removeAllChildren()
			let operateArray = userObj.operateArray || [];
			let gapWidth = 10,
				cardWidth = 82,
				posx = 0;
			operateArray.forEach((obj) => {
				let plusInfo = obj.plusInfo || null;
				let is_GANG_ZHI = obj.operate == ApiEnsmj.operateType.GANG_ZHI;
				let is_GANG_BU = obj.operate == ApiEnsmj.operateType.GANG_BU;
				let cardList = plusInfo && plusInfo.cardList ? plusInfo.cardList : [];
				if (obj.operate == ApiEnsmj.operateType.BU_PILAI) {
					cardList = []; //不展示痞赖
				}
				cardList.forEach((cardID, index) => {
					let node = this.getPengGangCardNode(cardID, index, is_GANG_ZHI, laiID, piIDArr, is_GANG_BU);
					if (cardList.length == 4 && index == 3) {
						node.x = posx - 2 * cardWidth;
						node.y = 8;
					} else {
						node.x = posx;
						posx += cardWidth;
					}
					node.parent = cardsLayout;
				})
				if (cardList.length) {
					posx += gapWidth;
				}
			})

			/**如果是自摸，手牌里面删除胡的那张牌再做显示 */
			if (huCards && huType === ApiEnsmj.operateType.HU_ZHI) {
				let huCardIndex = handCards.indexOf(huCards);
				if (huCardIndex != -1) handCards.splice(huCardIndex, 1);
			}
			this.sortHandCards(handCards, null);
			handCards.forEach((cardID, index) => {
				let ctrl = this.getCardNode(cardID, laiID, piIDArr);
				ctrl.node.parent = cardsLayout;
				ctrl.node.x = posx;
				posx += cardWidth;
				if (index == handCards.length - 1) {
					posx += gapWidth;
				}
			})
			if (huCards && userHuList) {
				let ctrl = this.getCardNode(huCards, userObj.laiZiCards, piIDArr);
				ctrl.node.parent = cardsLayout;
				ctrl.node.x = posx;
				posx += gapWidth;
			}
		}
		AssetsManager.loadSpriteFrame({
			path: `res/sprite/result/${myScore > 0 ? "win" : "lose"}`,
			bundle: Enums.bundleType.ENSMJ,
			sprite: this.img_title,
		})
	},

	/**头像点击响应 */
	userTogClick(event) { },

	showResult() {
		this.bureauLabel.string = this.bureau + 1;
		this.resultData = Utils.deepCopy(this.reviewRecord[this.bureau].result);
		this._maPaiInfo = Utils.deepCopy(this.reviewRecord[this.bureau].maPaiInfo);
		this._winUid = this.reviewRecord[this.bureau].winUid;
		this.setAllHandCards();
	},

	/**给手牌重新排序 */
	sortHandCards(handCards, shaiPai) {
		let myBaiPai = shaiPai ? shaiPai.cardList.slice() : [];
		handCards.sort((a, b) => a - b); //摆的牌排前面
		myBaiPai.sort((a, b) => b - a);
		let tmp = myBaiPai.slice();

		for (let i = 0; i < handCards.length; i++) {
			const card = handCards[i];
			if (tmp.length == 0) {
				break
			}
			let idx = tmp.indexOf(card)
			if (idx != -1) {
				tmp.splice(idx, 1)
				handCards.splice(i, 1)
				i--;
			}
		}
		for (let i = 0; i < myBaiPai.length; i++) {
			handCards.unshift(myBaiPai[i])
		}
	},

	update(dt) {
		if (this.node.nodeParams.isResult) {
			this.tick -= dt;
			let tick = Math.floor(this.tick);
			this.clockLabel.string = tick > 0 ? tick : '0';
		}
	},

	onBtnClick(event, parameters) {
		if (parameters === 'ready') {
			ENSMJModel.setResult(null);
			// console.log("大结算数据====》", ENSMJModel.getAllResult())
			if (!!ENSMJModel.getAllResult() && !!this.showAllResult) {
				this.showAllResult(ENSMJModel.getAllResult());
				this.node.destroy();
			} else if (!this.node.nodeParams.isBureauFull) {
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify());
				this.node.destroy();
			}
			// if (this.node.nodeParams.mainComp && this.node.nodeParams.mainComp.showMJAllResultFunc) {
			// 	this.node.nodeParams.mainComp.showMJAllResultFunc();
			// 	this.node.destroy();
			// }

		} else if (parameters === 'exit') {
			this.node.destroy();
		}
	},

	getCardNode(cardID, laiID, piList) {
		let node = cc.instantiate(this.cardNode);
		let ctrl = node.addComponent('ENSMJSingleTile');
		node.active = true;
		node.y = 0;
		ctrl.init();
		ctrl.flower = cardID;
		ctrl.setNodeShow(true);
		ctrl.setGhostIcon(laiID == cardID);
		ctrl.setRuffianIcon(piList.indexOf(cardID) != -1);
		return ctrl;
	},

	getPengGangCardNode(cardID, i, isAnGang, laiID, piList, isBuGang) {
		let node = cc.instantiate(this.cardNode);
		let ctrl = node.addComponent('ENSMJSingleTile')
		node.active = true;
		node.y = 0;
		ctrl.init();
		ctrl.flower = cardID;
		ctrl.setNodeShow(true);
		ctrl.setGhostIcon(cardID == laiID);
		ctrl.setRuffianIcon(piList.indexOf(cardID) != -1);
		if (!!isAnGang && i < 3 || !!isBuGang && i == 3) {
			ctrl.setCover(true)
		}
		return node;
	},

	/**回放使用的左右按钮 */
	nextResult() {
		if (this.bureau + 1 >= this.reviewRecord.length) return;
		++this.bureau;
		this.showResult();
	},

	preResult() {
		if (this.bureau - 1 < 0) return;
		--this.bureau;
		this.showResult();
	},

	getIndexByUID(uid) {
		let user = this.getUserByUID(uid);
		let chairID = !!user ? user.chairID : 0;
		return this.getIndexByChairID(chairID);
	},

	getUserByUID(uid) {
		let user = null;
		if (!this.resultData) return null;
		for (let item of this.resultData) {
			if (item.uid == uid) {
				user = item;
				break;
			}
		}
		return user;
	},

	/**座位号转换 */
	getIndexByChairID(chairID) {
		return (chairID - this._myChairId + this._maxPlayerCount) % this._maxPlayerCount;
	},

	messageCallbackHandler(route, msg) {
		if (route === 'RemoveGameResult') {
			this.node.destroy();
		}
	},

	onDestroy() {
		MessageCallback.removeListener('RemoveGameResult', this);

	},
});