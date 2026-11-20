const ApiRoom = require('../../../src/api/ApiRoom');
const ApiMhxl = require('./ApiMhxl');
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const UserModel = require('../../../src/model/UserModel');
const MHXLModel = require('./MHXLModel');
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
		userLayOutBig: cc.Node,
		userItemBig: cc.Node,
		userItemScoreType: cc.Node,
		cardTypeItemNode: cc.Node,
		cardNode: cc.Node,
		img_title: cc.Sprite,
		clockLabel: cc.Label,
		bureauLabel: cc.Label,
		txt_roomInfo: cc.Label,
		mapai: cc.Node,
		showBg1: cc.Node,
		showBg2: cc.Node,
		_myChairId: null, //自己的座位号
		_gameRule: null, //游戏规则
		_roomId: 0, //房间号
	},

	start() {
		MessageCallback.addListener('RemoveGameResult', this);
		let reviewBtnNode = cc.find("showBg1/reviewBtnNode", this.node);
		let resBtnNode = cc.find("showBg1/resBtnNode", this.node);
		let Node = cc.find('showBg2', this.node);
		let clockNode = cc.find("Clock", Node);
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
			this.newshowUserInfo();
			this.node.active = false;
			this.scheduleOnce(() => {
				this.node.active = true;
			}, 1);

		} else if (this.node.nodeParams.isResult) { //正常结算
			this.tick = 30;
			this.setAllHandCards();
			this.newshowUserInfo();
			this.node.active = true;
			resBtnNode.active = true;
			this.showAllResult = this.node.nodeParams.onEnd;
			clockNode.active = !this.node.nodeParams.isBureauFull;
			this.showBg1.active = false;
			this.showBg2.active = true;
		} else { //牌局回放
			this.showBg1.active = true;
			this.showBg2.active = false;
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

	showmaPaiInfo(maPaiInfo) {
		let maLabel = this.mapai;
		maLabel.active = false;
		if (!!maPaiInfo && !!maPaiInfo.maCards) {
			maLabel.getComponent(cc.Label).string = "捉鸡牌";
			let maLayout = cc.find('layout', maLabel);
			let myMa = maPaiInfo.zhongMaList;
			let maCards = maPaiInfo.maCards;
			maLabel.active = !!maCards[0];
			maLayout.removeAllChildren();
			maCards = [maCards[0]];
			if (maCards && myMa && Array.isArray(maCards) && Array.isArray(myMa)) {
				for (let i = 0; i < maCards.length; ++i) {
					if (maCards[i]) {
						/*马牌*/
						let node = this.getCardNode(maCards[i]).node;
						node.parent = maLayout;
					}
				}
			}
		}
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
			let cardWidth = 44.28,
				nullWidth = 15,
				posx = cardWidth / 2;
			let pengGangArray = userObj.operateArray || [];
			if (pengGangArray.length > 0) {
				for (let i = 0; i < pengGangArray.length; ++i) {
					let obj = pengGangArray[i];
					let count = (ApiMhxl.operateType.PENG == obj.operate || ApiMhxl.operateType.CHI == obj.operate) ? 3 : 4;
					let cardList = [obj.card, obj.card, obj.card];
					if (ApiMhxl.operateType.PENG !== obj.operate) {
						cardList = obj.plusInfo.cardList;
					}
					for (let j = 0; j < count; ++j) {
						let card = cardList[j];
						let node = this.getPengGangCardNode(userObj.laiZiCards, card, j, obj.operate == ApiMhxl.operateType.GANG_ZHI, obj.operate == ApiMhxl.operateType.GANG_BU);
						node.parent = cardsLayout;
						if (count == 4 && j == 3) {
							node.y = 8;
							node.x = posx - 2 * cardWidth;
						} else {
							node.x = posx;
							posx += cardWidth;
						}
					}
					posx += nullWidth;
				}
			}

			let shaiPai = userObj.shaiPai ? Utils.deepCopy(userObj.shaiPai) : null;
			let huInfo = userObj.huInfo ? Utils.deepCopy(userObj.huInfo) : null;
			let spr_huIndex = cc.find('huIndex', userItem).getComponent(cc.Sprite);
			let lab_huVal = cc.find('huVal', userItem).getComponent(cc.Label);
			let huType = huInfo ? huInfo.operateType : -1;
			let huCards = huInfo ? huInfo.card : -1;
			spr_huIndex.node.active = false;
			lab_huVal.node.active = false;

			if (huInfo && huInfo.uid == CurUid && huInfo.addCardType.length) {
				let obj = huInfo.addCardType[0];
				lab_huVal.string = "胡分+" + obj.score;
				lab_huVal.node.active = obj.score != 0;
				// spr_huIndex.node.active = true;
				// AssetsManager.loadSpriteFrame({
				// 	path: `res/sprite/rank/${huInfo.huIndex}${huType === ApiMhxl.operateType.HU_ZHI ? "zimo" : "hu"}`,
				// 	bundle: Enums.bundleType.MHXL,
				// 	sprite: spr_huIndex,
				// });
			}
			let handCards = userObj.userCards && userObj.userCards[CurUid] ? userObj.userCards[CurUid].slice() : [];
			/**如果是自摸，手牌里面删除胡的那张牌再做显示 */
			if (huType === ApiMhxl.operateType.HU_ZHI) {
				let huCardIndex = handCards.indexOf(huCards);
				if (huCardIndex >= 0) {
					handCards.splice(huCardIndex, 1);
				}
			}
			this.sortHandCards(handCards, shaiPai);
			let myBaiPai = shaiPai ? shaiPai.cardList.slice() : [];
			let isb = myBaiPai.length > 0;
			for (let i = 0; i < handCards.length; ++i) {
				let com = this.getCardNode(handCards[i], userObj.laiZiCards);
				com.node.parent = cardsLayout;
				com.node.x = posx;
				posx += cardWidth;
				let idx = myBaiPai.indexOf(com.flower)
				if (idx != -1) {
					com.setBaiPaiIcon(true)
					myBaiPai.splice(idx, 1)
				}
				if (isb && myBaiPai.length == 0) {
					posx += nullWidth;
					isb = false;
				}
			}
			if (huCards && huCards > 0) {
				let com = this.getCardNode(huCards, userObj.laiZiCards);
				com.node.parent = cardsLayout;
				posx += nullWidth;
				com.node.x = posx;
			}
			this.showmaPaiInfo(userObj.maPaiInfo);
			let lab_plusType = cc.find("lab_plusType", userItem);
			let Lay_plusType = cc.find("Lay_plusType", userItem);
			let showCurStr = (str) => {
				let txtNode = cc.instantiate(lab_plusType);
				txtNode.getComponent(cc.Label).string = str;
				txtNode.parent = Lay_plusType;
			}
			let JiaoZhui = userObj.JiaoZhui || {};
			showCurStr(!!JiaoZhui[CurUid] ? "叫嘴" : "未叫嘴");

			// let jipailist = userObj.jipailist || {};
			// let JiPaiArr = jipailist[CurUid] || [];
			// JiPaiArr.forEach((CurData) => {
			// let type = ApiMhxl.gameJIpaiStr[CurData.JiPaiType]
			// showCurStr(type + "+" + CurData.score);
			// })
			// if (!!userObj.menhuInfo && userObj.menhuInfo.length) {
			// 	let menScore = 0,
			// 		menhuInfo = userObj.menhuInfo;
			// 	menhuInfo.forEach((CurObj) => {
			// 		let addCardType = CurObj.addCardType || [];
			// 		addCardType.forEach((obj) => {
			// 			menScore += obj.score;
			// 		})
			// 	})
			// 	// console.log("menScore", menScore)
			// 	menScore && showCurStr("闷+" + Utils.formatNumberWithDecimal(menScore, 1));
			// }

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
					if (info.score != 0) {
						let score = Utils.formatNumberWithDecimal(info.score, 1);
						let name = ApiMhxl.plusRateTypeStr[info.type];
						let str = score > 0 ? "+" + score : score;
						allscore += score;
						showCurStr(name + str);
					}
				});
			}

			let baseScore = this._gameRule.baseScore;
			// console.log("allscore", allscore, "baseScore", baseScore, "结果", allscore * baseScore)



		}
		let url = "res/sprite/result/lose";
		if (!this._winUid || this._winUid.length == 0) {
			url = `res/sprite/result/liuju`;
		} else if (myScore > 0) {
			url = "res/sprite/result/win";
		}
		AssetsManager.loadSpriteFrame({
			bundle: Enums.bundleType.MHXL,
			sprite: this.img_title,
			path: url,
		})
	},

	/**选中头像后展示信息 */
	newshowUserInfo() {
		// console.log('用户信息22222', this.resultData);
		let myUid = UserModel.getData("uid");
		this.userLayOutBig.removeAllChildren();
		if (!this.resultData) return;
		let users = this.resultData;
		this._maxPlayerCount = users.length;
		let myScore = 0;
		for (const userObj of users) {
			if (!userObj) continue;
			let userItem = cc.instantiate(this.userItemBig);
			userItem.active = true;
			let CurUid = userObj.uid;
			userItem.parent = this.userLayOutBig;
			cc.find("banker", userItem).active = userObj.bankerUid == CurUid;
			cc.find('name', userItem).getComponent(cc.Label).string = CCUtil.stringClamp(userObj.nickname, 4, '..');
			cc.find('uid', userItem).getComponent(cc.Label).string = 'ID:' + CurUid;
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
			/**每一局的分数 */
			let cardsLayout = cc.find('cardType/view/content', userItem);
			if (cardsLayout) cardsLayout.removeAllChildren()
			let showCurStr = (type, score) => {
				// 每一局的分数，和类型
				let itemScore = cc.instantiate(this.userItemScoreType);
				let optType = cc.find('title', itemScore).getComponent(cc.Label)
				let optScore = cc.find('score', itemScore).getComponent(cc.Label)
				optType.string = type;
				optScore.string = score;
				itemScore.parent = cardsLayout;
			}
			let JiaoZhui = userObj.JiaoZhui || {};
			let huInfo = userObj.huInfo || {};
			let jiaoType = cc.find('jiaozui', userItem).getComponent(cc.Label)
			if (!!huInfo && huInfo.uid == CurUid && huInfo.addCardType) {
				let type = huInfo.addCardType[0].type || ''
				jiaoType.string = ApiMhxl.plusRateTypeStr[type] || '';
			} else {
				jiaoType.string = !!JiaoZhui[CurUid] ? "叫嘴" : "未叫嘴"
			}

			//操作类型和分数
			// 取出对应操作数组
			let array = userObj.userPlusType[CurUid];
			// 创建新数组，存入加减好的数据
			let userPlusType = [];
			// 创建新对象，记录操作类型和对应的值
			let newObj = {};
			for (let index = 0; index < array.length; index++) {
				let optType = array[index];
				if (!newObj[optType.type]) {
					newObj[optType.type] = [];
				}
				newObj[optType.type].push(optType.score);
			}

			for (const key in newObj) {
				// 对象取值存在取值不存在赋为空数组
				let sonList = newObj[key] || [];
				// 数组的值累加
				let allscore = sonList.reduce((a, b) => a + b);
				// 新数组存入键和值
				userPlusType.push({
					type: parseInt(key),
					score: allscore
				});
			}


			let allscore = 0;
			if (Array.isArray(userPlusType) && userPlusType.length > 0) {
				userPlusType.forEach(info => {
					if (info.score != 0) {
						let score = Utils.formatNumberWithDecimal(info.score, 1);
						let name = ApiMhxl.plusRateTypeStr[info.type];
						let str = score > 0 ? "+" + score : score;
						allscore += score;
						showCurStr(name, str);
					}
				});
			}

			let baseScore = this._gameRule.baseScore;
		}
		let url = "res/sprite/result/lose";
		if (!this._winUid || this._winUid.length == 0) {
			url = `res/sprite/result/liuju`;
		} else if (myScore > 0) {
			url = "res/sprite/result/win";
		}
		AssetsManager.loadSpriteFrame({
			bundle: Enums.bundleType.MHXL,
			sprite: this.img_title,
			path: url,
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

			MHXLModel.setResult(null);
			// console.log("大结算数据====》", MHXLModel.getAllResult())
			if (!!MHXLModel.getAllResult() && !!this.showAllResult) {
				this.showAllResult(MHXLModel.getAllResult());
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
		} else if (parameters === 'pjxq') {
			this.showBg2.active = false;
			this.showBg1.active = true;
		} else if (parameters === 'back') {
			this.showBg2.active = true;
			this.showBg1.active = false;
		}
	},

	getCardNode(card, ghost) {
		let node = cc.instantiate(this.cardNode);
		let com = node.addComponent('MHXLSingleTile');
		node.active = true;
		node.y = 0;
		com.init();
		com.flower = card;
		com.setNodeShow(true);
		com.setGhostIcon(ghost == card);
		return com;
	},

	getPengGangCardNode(ghost, card, i, isAnGang, isBuGang) {
		let node = cc.instantiate(this.cardNode);
		let com = node.addComponent('MHXLSingleTile')
		node.active = true;
		node.y = 0;
		com.init();
		com.flower = card;
		com.setNodeShow(true);
		com.setGhostIcon(card == ghost);
		if (!!isAnGang && i < 3 || !!isBuGang && i == 3) {
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