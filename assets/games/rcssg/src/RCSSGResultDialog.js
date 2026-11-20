const ApiRoom = require('../../../src/api/ApiRoom');
const ApiRcssg = require('./ApiRcssg');
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const UserModel = require('../../../src/model/UserModel');
const RCSSGModel = require('./RCSSGModel');
const MAX_USER_NUM = 4;
const huIndexUrl = "res/sprite/rank/";
const Utils = require('../../../src/utils/Utils');
const SubManager = require("../../../src/utils/SubManager")
const MessageCallback = require('../../../src/utils/MessageCallback');
const ConfigModel = require('../../../src/model/ConfigModel');

cc.Class({
	extends: cc.Component,
	properties: {
		userLayOut: cc.Node,
		userItemNode: cc.Node,
		cardTypeItemNode: cc.Node,
		cardPfb: cc.Prefab,
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
			this.reviewRecord = this.node.nodeParams.reviewRecord;
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
		console.log('用户信息', this.resultData);
		let myUid = UserModel.getData("uid");
		this.userLayOut.removeAllChildren();
		if (!this.resultData) return;
		let users = this.resultData;
		this._maxPlayerCount = users.length;
		let myScore = 0,
			CurHuInfo = null,
			CurHuType = null;
		for (const userObj of users) {
			if (!CurHuInfo && !!userObj.huInfo) {
				CurHuInfo = userObj.huInfo;
				CurHuType = userObj.huType;
			}
		}
		for (const userObj of users) {
			if (!userObj) continue;
			let userItem = cc.instantiate(this.userItemNode);
			userItem.active = true;
			let CurUid = userObj.uid;
			userItem.parent = this.userLayOut;
			cc.find("banker", userItem).active = userObj.bankerUid == CurUid;

			cc.find('txt_nick', userItem).getComponent(cc.Label).string = CCUtil.stringClamp(userObj.nickname, 4, '..');
			// cc.find('txt_uid', userItem).getComponent(cc.Label).string = CurUid != myUid ? Utils.stringSecurity(CurUid) : CurUid;
			cc.find('txt_uid', userItem).getComponent(cc.Label).string = 'ID:' + CurUid;
			AssetsManager.loadSpriteFrame({
				path: userObj.avatar,
				sprite: cc.find('head', userItem).getComponent(cc.Sprite)
			});
			let lose = cc.find('lose', userItem).getComponent(cc.Label);
			let win = cc.find('win', userItem).getComponent(cc.Label);
			let score = parseFloat(userObj.winScores) || 0;
			lose.node.active = false;
			win.node.active = false;
			if (CurUid == myUid) {
				myScore = score;
				this._myChairId = userObj.chairID;
			}

			if (score > 0) {
				win.node.active = true;
				win.string = '+' + Utils.formatNumberWithDecimal(score, 2);
			} else {
				lose.node.active = true;
				lose.string = Utils.formatNumberWithDecimal(score, 2);
			}

			let cardsLayout = cc.find('cardsLayout', userItem);
			if (cardsLayout) cardsLayout.removeAllChildren()
			if (cardsLayout.getComponent(cc.Layout)) {
				cardsLayout.getComponent(cc.Layout).enabled = false;
			}
			let cardWidth = 82,
				nullWidth = 15,
				posx = cardWidth / 2;
			let pengGangArray = userObj.operateArray || [];
			if (pengGangArray.length > 0) {
				for (let i = 0; i < pengGangArray.length; ++i) {
					let obj = pengGangArray[i];
					let count = (ApiRcssg.operateType.PENG == obj.operate || ApiRcssg.operateType.CHI == obj.operate) ? 3 : 4;
					let cardList = [obj.card, obj.card, obj.card];
					if (ApiRcssg.operateType.PENG !== obj.operate) {
						cardList = obj.plusInfo.cardList;
					}
					for (let j = 0; j < count; ++j) {
						let card = cardList[j];
						let node = this.getPengGangCardNode(userObj.laiZiCards, card, j, obj.operate == ApiRcssg.operateType.GANG_ZHI);
						node.parent = cardsLayout;
						if (count == 4 && j == 3) {
							node.y = 14;
							node.x = posx - 2 * cardWidth;
						} else {
							node.x = posx;
							posx += cardWidth;
						}
					}
					posx += nullWidth;
				}
			}

			let huInfo = userObj.huInfo ? Utils.deepCopy(userObj.huInfo) : null;
			let spr_huIndex = cc.find('huType', userItem).getComponent(cc.Sprite);
			let huType = huInfo ? huInfo.operateType : -1;
			let huCards = huInfo ? huInfo.card : -1;
			let huIndex = huInfo ? huInfo.huIndex : -1;
			spr_huIndex.node.active = false;


			if (huInfo && huInfo.uid == CurUid && huInfo.addCardType.length) {
				spr_huIndex.node.active = true;
				AssetsManager.loadSpriteFrame({
					path: `res/sprite/rank/${huIndex}${huType === ApiRcssg.operateType.HU_ZHI ? "zimo" : "hu"}`,
					// path: `res/sprite/hu/hu${huType}`,
					bundle: Enums.bundleType.RCSSGMJ,
					sprite: spr_huIndex,
				});
			}
			let handCards = userObj.userCards && userObj.userCards[CurUid] ? userObj.userCards[CurUid].slice() : [];
			/**如果是自摸，手牌里面删除胡的那张牌再做显示 */
			if (huType === ApiRcssg.operateType.HU_ZHI) {
				let huCardIndex = handCards.indexOf(huCards);
				if (huCardIndex >= 0) {
					handCards.splice(huCardIndex, 1);
				}
			}
			this.sortHandCards(handCards);

			for (let i = 0; i < handCards.length; ++i) {
				let com = this.getCardNode(handCards[i], userObj.laiZiCards);
				com.node.parent = cardsLayout;
				com.node.x = posx;
				posx += cardWidth;
			}
			if (huCards && huCards > 0) {
				let com = this.getCardNode(huCards, userObj.laiZiCards);
				com.node.parent = cardsLayout;
				posx += nullWidth;
				com.node.x = posx;
			}

			/**听牌标记 */
			if (userObj.tianTing) {
				let tianTing = Object.keys(userObj.tianTing)
				cc.find("ting", userItem).active = tianTing.includes(CurUid)
			}

			let cardTypeLayout = cc.find("cardTypeLayout", userItem);
			let showCurStr = (str) => {
				let txtNode = cc.instantiate(this.cardTypeItemNode);
				txtNode.getComponent(cc.Label).string = str;
				txtNode.parent = cardTypeLayout;
			}

			let array = userObj.userPlusType[CurUid];
			let userPlusType = [];
			let newObj = {};
			for (let index = 0; index < array.length; index++) {
				const CurObj = array[index];
				if (!newObj[CurObj.type]) {
					newObj[CurObj.type] = [];
				}
				newObj[CurObj.type].push(CurObj.score);
			}
			for (const key in newObj) {
				let sonList = newObj[key] || [];
				let allscore = sonList.reduce((a, b) => a + b);
				userPlusType.push({
					type: parseInt(key),
					score: allscore
				});
			}
			// console.log("原始加番数组", array, userPlusType);
			let allscore = 0;
			if (Array.isArray(userPlusType) && userPlusType.length > 0) {
				userPlusType.forEach(info => {
					if (info.type && !!info.score) {
						let score = Utils.formatNumberWithDecimal(info.score, 1);
						let name = ApiRcssg.plusRateTypeStr[info.type];
						let str = score > 0 ? "+" + score : score;
						allscore += score;
						showCurStr(name + str);
					}
				});
			}
			// console.log("allscore", allscore, "baseScore", this._gameRule.baseScore, "结果", allscore * this._gameRule.baseScore)
		}
		let url = `res/sprite/result/liuju`;
		if (CurHuInfo) {
			if (myScore > 0) {
				url = "res/sprite/result/win";
			} else {
				url = "res/sprite/result/lose";
			}
		}
		AssetsManager.loadSpriteFrame({
			bundle: Enums.bundleType.RCSSGMJ,
			sprite: this.img_title,
			path: url,
		})
	},

	/**头像点击响应 */
	userTogClick(event) { },

	showResult() {
		this.bureauLabel.string = this.bureau + 1;
		let CurRecord = Utils.deepCopy(this.reviewRecord[this.bureau])
		console.log(this.bureau, "CurRecord", CurRecord);
		this._maPaiInfo = CurRecord.maPaiInfo;
		this.resultData = CurRecord.result;
		this._winUid = CurRecord.winUid;
		this.setAllHandCards();
	},

	/**给手牌重新排序 */
	sortHandCards(handCards) {
		handCards.sort((a, b) => a - b); //摆的牌排前面
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

			RCSSGModel.setResult(null);
			console.log("大结算数据====》", RCSSGModel.getAllResult())
			if (!!RCSSGModel.getAllResult() && !!this.showAllResult) {
				this.showAllResult(RCSSGModel.getAllResult());
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

	getCardNode(card, ghost) {
		let node = cc.instantiate(this.cardPfb);
		let com = node.addComponent('RCSSGSingleTile');
		node.active = true;
		node.y = 0;
		com.init();
		com.flower = card;
		com.setNodeShow(true);
		com.setGhostIcon(ghost == card);
		return com;
	},

	getPengGangCardNode(ghost, card, i, isAnGang) {
		let node = cc.instantiate(this.cardPfb);
		let com = node.addComponent('RCSSGSingleTile')
		node.active = true;
		node.y = 0;
		com.init();
		com.flower = card;
		com.setNodeShow(true);
		com.setGhostIcon(card == ghost);
		if (!!isAnGang && i == 3) {
			com.setCover(true)
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

	messageCallbackHandler(route, msg) {
		if (route === 'RemoveGameResult') {
			this.node.destroy();
		}
	},

	onDestroy() {
		MessageCallback.removeListener('RemoveGameResult', this);

	},
});