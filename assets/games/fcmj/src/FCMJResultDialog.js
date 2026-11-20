const ApiRoom = require('../../../src/api/ApiRoom');
const ApiFcmj = require('./ApiFcmj');
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const UserModel = require('../../../src/model/UserModel');
const FCMJModel = require('./FCMJModel');
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
		huScoreItemNode: cc.Node,
		cardPfb: cc.Prefab,
		clockLabel: cc.Label,
		bureauLabel: cc.Label,
		txt_roomInfo: cc.Label,
		txt_guize: cc.Label,
		txt_bao: cc.Node,
		baoLay: cc.Node,
		_myChairId: null, //自己的座位号
		_gameRule: null, //游戏规则
		_roomId: 0, //房间号
	},

	start() {
		MessageCallback.addListener('RemoveGameResult', this);
		this.tick = 0;
		if (!!this.node.nodeParams.result) {
			this.resultData = Utils.deepCopy(this.node.nodeParams.result);
			this._gameRule = this.node.nodeParams.plusInfo.gameRule;
			this._roomId = this.node.nodeParams.plusInfo.roomID;
			this._laiZiCards = Utils.deepCopy(this.node.nodeParams.plusInfo.laiZiCards);
		}
		let resBtnNode = cc.find('resBtnNode', this.node);
		let reviewBtnNode = cc.find("reviewBtnNode", this.node);
		let clockNode = cc.find("Clock", resBtnNode);
		if (this.node.nodeParams.isReview) { //视频回放页面隐藏继续按钮
			reviewBtnNode.active = false;
			resBtnNode.active = false;
		} else if (this.node.nodeParams.isResult) { //正常结算页面
			reviewBtnNode.active = false;
			resBtnNode.active = true;
			clockNode.active = !this.node.nodeParams.isBureauFull;
			this.tick = FCMJModel.getTick() + 2
		} else { //战绩回放页面显示左右翻页按钮
			resBtnNode.active = false;
			reviewBtnNode.active = true;
			this.reviewRecord = this.node.nodeParams.reviewRecord;
			let lastItem = this.reviewRecord[this.reviewRecord.length - 1];
			if (lastItem && !lastItem.result) {
				/* 最后一局未完成，删除 */
				this.reviewRecord.pop();
			}
			this.bureau = 0;
		}
		if (this.reviewRecord && this.reviewRecord[this.bureau]) {
			this._gameRule = this.reviewRecord[this.bureau].plusInfo.gameRule
			this._roomId = this.reviewRecord[this.bureau].plusInfo.roomID
		}
		this.setRoomInfo()
		if (this.node.nodeParams.isResult) {
			this.setAllHandCards();
			this.showEnterAni()
		} else if (this.node.nodeParams.isReview) {
			this.setAllHandCards();
			this.showEnterAni()
		} else {
			this.showResult()
		}
	},

	showEnterAni() {
		this.node.active = true;
		this.node.opacity = 0
		cc.tween(this.node).delay(1).to(0.3, {
			opacity: 255
		}).start()
	},

	setRoomInfo() {
		let str = ""
		if (this._roomId) {
			str += `房号:${this._roomId}`
		}
		if (this._gameRule) {
			str += `  底分:${this._gameRule.baseScore}  `
			str += this._gameRule.fengDing == 0 ? "不封顶" : "封顶:" + this._gameRule.fengDing
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
		this.showBaoPai()
		this.showUserInfo();
	},

	/**选中头像后展示信息 */
	showUserInfo() {
		this.userLayOut.removeAllChildren();
		if (!this.resultData) return;
		let users = this.resultData;
		// console.log("users", users)
		if (!users) return;
		for (const user of users) {
			if (!user) continue;
			let uNode = cc.instantiate(this.userItemNode);
			uNode.parent = this.userLayOut;
			uNode.active = true;
			cc.find('txt_nick', uNode).getComponent(cc.Label).string = CCUtil.stringClamp(user.nickname, 6, '..');
			cc.find('txt_uid', uNode).getComponent(cc.Label).string = 'ID:' + user.uid;
			cc.find("banker", uNode).active = user.bankerUid == user.uid
			AssetsManager.loadSpriteFrame({
				path: user.avatar,
				sprite: cc.find('head', uNode).getComponent(cc.Sprite)
			});
			let score = user.winScores || 0;
			score = parseFloat(score);
			let win = cc.find('win', uNode).getComponent(cc.Label);
			let lose = cc.find('lose', uNode).getComponent(cc.Label);
			if (user.uid == UserModel.getData('uid')) {
				cc.find('title_win', this.node).active = score > 0;
				cc.find('title_lose', this.node).active = !(cc.find('title_win', this.node).active);
			}
			if (score > 0) {
				win.node.active = true;
				lose.node.active = false
				win.string = '+' + Utils.formatNumberWithDecimal(score);
			} else {
				lose.node.active = true;
				win.node.active = false
				lose.string = Utils.formatNumberWithDecimal(score);
			}
			let cardsLayout = cc.find('cardsLayout', uNode);
			if (cardsLayout) cardsLayout.removeAllChildren()
			let posx = 0,
				cardWidth = 82,
				nullWidth = 15;
			posx += cardWidth / 2;
			let handCards = !user.userCards || !user.userCards[user.uid] ? [] : user.userCards[user.uid].slice();
			let pengGangArray = user.operateArray || [];
			if (pengGangArray.length > 0) {
				for (let i = 0; i < pengGangArray.length; ++i) {
					let obj = pengGangArray[i];
					let count = (ApiFcmj.operateType.PENG == obj.operate || ApiFcmj.operateType.CHI == obj.operate) ? 3 : 4;
					let cardList = [obj.card, obj.card, obj.card];
					if (ApiFcmj.operateType.PENG !== obj.operate) {
						cardList = obj.plusInfo.cardList;
					}
					for (let j = 0; j < count; ++j) {
						let card = cardList[j];
						if (!card) {
							break;
						}
						let node = this.getPengGangCardNode(user.laiZiCards, card, j, (obj.operate == ApiFcmj.operateType.GANG_ZHI && obj.card != -1));
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

			let huTypeSrpite = cc.find('huType', uNode).getComponent(cc.Sprite);
			let huType = user.huType || 0;
			if (huType) {
				huTypeSrpite.node.active = true
				huTypeSrpite.spriteFrame = null;
				if (huType != ApiFcmj.huType.DIAN) { //不显示点炮图片
					AssetsManager.loadSpriteFrame({
						path: `res/sprite/hu/hu${huType}`,
						bundle: Enums.bundleType.FCMJ,
						sprite: huTypeSrpite,
					})
				}
				/**如果是自摸，手牌里面删除胡的那张牌再做显示 */
				let huCards = user.huCards || 0;
				let huFilter = [ApiFcmj.huType.ZIMO, ApiFcmj.huType.GANGHUA, ApiFcmj.huType.GANGSHANGBAO, ApiFcmj.huType.MOBAO, ApiFcmj.huType.ZHICHONG];
				if (huFilter.indexOf(huType) != -1) {
					let huCardIndex = handCards.indexOf(huCards);
					if (huCardIndex >= 0) {
						handCards.splice(huCardIndex, 1);
					}
				}
				this.sortHandCards(handCards)
				for (let i = 0; i < handCards.length; ++i) {
					let node = this.getCardNode(handCards[i], user.laiZiCards);
					node.parent = cardsLayout;
					node.x = posx;
					posx += cardWidth;
				}
				if (huCards && huCards > 0) {
					posx += nullWidth;
					let huCardNode = this.getCardNode(huCards, this._laiZiCards);
					huCardNode.parent = cardsLayout;
					huCardNode.x = posx;
				}
			} else {
				this.sortHandCards(handCards)
				for (let i = 0; i < handCards.length; ++i) {
					let node = this.getCardNode(handCards[i], user.laiZiCards);
					node.parent = cardsLayout;
					node.x = posx;
					posx += cardWidth;
				}

				// if (user.loseUid == user.uid) {
				// 	huTypeSrpite.node.active = true
				// 	huTypeSrpite.spriteFrame = null;
				// 	AssetsManager.loadSpriteFrame({
				// 		path: `res/sprite/hu/hu100`,
				// 		sprite: huTypeSrpite,
				// 		bundle: Enums.bundleType.FCMJ
				// 	})
				// }
			}
			let cardTypeLayout = cc.find("cardTypeLayout", uNode)
			if (user.huCardType) {
				let txtNode = cc.instantiate(this.cardTypeItemNode)
				txtNode.parent = cardTypeLayout
				txtNode.y = 0;
				txtNode.getComponent(cc.Label).string = ApiFcmj.cardTypeStr[user.huCardType] + "x" + user.huCardScore
			}
			// userPlusType
			let userPlusType = user.userPlusType
			if (Array.isArray(userPlusType) && userPlusType.length > 0) {

				userPlusType.forEach(info => {
					let score = info.score
					let txtNode = cc.instantiate(this.cardTypeItemNode)
					txtNode.parent = cardTypeLayout
					txtNode.y = 0;
					let symbol = "x"
					if (info.scoreType == 1) {
						symbol = score > 0 ? "+" : ""
					}
					txtNode.getComponent(cc.Label).string = ApiFcmj.plusRateTypeStr[info.type] + symbol + score
				});
			}

			let huScoreLayout = cc.find("huScoreLayout", uNode)
			if (huScoreLayout) {
				let setHuScore = (wenzi, score) => {
					let hnode = cc.instantiate(this.huScoreItemNode)
					hnode.parent = huScoreLayout
					hnode.x = 0
					let txt_huScore = hnode.getComponent(cc.Label)
					let str = "" + score
					if (score > 0) str = "+" + score
					txt_huScore.string = wenzi + str
				}
				// if (user.huScore) {
				// 	setHuScore("胡分", user.huScore)
				// }
				if (user.gangScore) {
					setHuScore("杠分", user.gangScore)
				}
			}

			if (user.yaoBaoUser) {
				let yaoBaoUser = user.yaoBaoUser
				let baoNode = cc.find("bao", uNode)
				if (cc.isValid(baoNode)) {
					let checkType = [ApiFcmj.yaoBaoType.YAOED, ApiFcmj.yaoBaoType.GENED]
					baoNode.active = checkType.includes(yaoBaoUser.type)
				}
			}
		}
	},

	showResult() {
		this.bureauLabel.string = this.bureau + 1;
		let CurRecord = Utils.deepCopy(this.reviewRecord[this.bureau]);
		this._laiZiCards = CurRecord.plusInfo.laiZiCards;
		let gameRule = CurRecord.plusInfo.gameRule;
		this.resultData = CurRecord.result;
		this.txt_guize.string = FCMJModel.getTerseRule(gameRule, "、");
		this.showBaoPai()
		this.setAllHandCards()
	},

	showBaoPai() {
		/**显示宝牌 */
		if (this._laiZiCards && this._laiZiCards.length > 0) {
			this.txt_bao.active = true;
			this.baoLay.removeAllChildren()
			for (let i = 0; i < this._laiZiCards.length; i++) {
				const laiziId = this._laiZiCards[i];
				let tile = this.getCardNode(laiziId, this._laiZiCards)
				tile.parent = this.baoLay
			}
		} else {
			this.txt_bao.active = false
		}
	},

	/**给手牌重新排序 */
	sortHandCards(handCards) {
		handCards.sort((a, b) => a - b)
		// let ghostList = this._laiZiCards
		// let myGhost = []
		// for (let i = 0; i < handCards.length; i++) {
		// 	const card = handCards[i];
		// 	if (ghostList.includes(card)) {
		// 		myGhost.push(card)
		// 		handCards.splice(i, 1)
		// 		i--;
		// 	}
		// }
		// for (let i = myGhost.length - 1; i >= 0; i--) {
		// 	handCards.unshift(myGhost[i])
		// }
	},

	update(dt) {
		if (this.node.nodeParams.isResult) {
			this.tick -= dt;
			let tick = Math.floor(this.tick);
			if (tick > 0) {
				this.clockLabel.string = tick;
			} else {
				this.clockLabel.string = '0';
			}
		}
	},

	onBtnClick(event, parameters) {
		if (parameters === 'ready') {
			if (!this.node.nodeParams.isBureauFull) {
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify());
				this.node.destroy();
			} else {
				if (this.node.nodeParams.mainComp &&
					this.node.nodeParams.mainComp.showMJAllResultFunc) {
					this.node.nodeParams.mainComp.showMJAllResultFunc();
					this.node.destroy();
				}
			}
		} else if (parameters === 'exit') {
			this.node.destroy();
		}
	},

	getCardNode(card, ghost = []) {
		let node = cc.instantiate(this.cardPfb);
		node.active = true;
		node.y = 0;
		let com = node.addComponent('FCMJSingleTile')
		com.init()
		com.flower = card;
		com.setNodeShow(true);
		com.setGhostIcon(ghost.includes(card));
		return node;
	},

	getPengGangCardNode(ghost, card, i, isAnGang, isBuGang) {
		let node = cc.instantiate(this.cardPfb);
		node.active = true;
		node.y = 0;
		let com = node.addComponent('FCMJSingleTile')
		com.init()
		com.flower = card;
		com.setNodeShow(true);
		com.setGhostIcon(ghost.includes(card));
		if (!!isAnGang && i == 3) {
			com.setCover(true)
		}
		return node;
	},

	/**座位号转换 */
	getUserChairIndex(chairID) {
		return (chairID - this._myChairId + MAX_USER_NUM) % MAX_USER_NUM;
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