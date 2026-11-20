const ApiRoom = require('../../../src/api/ApiRoom');
const ApiLamj = require('./ApiLamj');
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const UserModel = require('../../../src/model/UserModel');
const LAMJModel = require('./LAMJModel');
const MAX_USER_NUM = 4;
const Utils = require('../../../src/utils/Utils');
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
		bgwin: cc.Node,
		bglose: cc.Node,
		btn_qiePai: cc.Node,
		laiziLay: cc.Node,
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
			this._maPaiInfo = Utils.deepCopy(this.node.nodeParams.plusInfo.maPaiInfo);
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
			// console.log("结算时间==", LAMJModel.getTick())
			clockNode.active = !this.node.nodeParams.isBureauFull && LAMJModel.getTick() > 0;
			this.tick = LAMJModel.getTick() + 2
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
			this.showQiePai()
			this.node.active = true;
		} else if (this.node.nodeParams.isReview) {
			this.setAllHandCards();
		} else {
			this.showResult()
		}
	},

	showQiePai() {
		if (this._gameRule.qiePaiType == 0) {
			this.btn_qiePai.active = false
		} else if (this._gameRule.qiePaiType == 1) {
			this.btn_qiePai.active = true
		} else if (this._gameRule.qiePaiType == 2) {
			let myUid = UserModel.getData("uid")
			this.btn_qiePai.active = this.resultData && this.resultData.some(user => user.uid == myUid && user.winScores < 0)
		}
	},

	setRoomInfo() {
		let str = ""
		if (this._roomId) {
			str += `房号:${this._roomId}`
		}
		if (this._gameRule) {
			str += `  嘴子数:${this._gameRule.zuiZiCount}`
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
		this.userLayOut.removeAllChildren();
		if (!this.resultData) return;
		let users = this.resultData;
		if (!users) return;
		let loseCount = 0
		for (const user of users) {
			if (!user) continue;
			let uNode = cc.instantiate(this.userItemNode);
			uNode.parent = this.userLayOut;
			uNode.active = true;
			cc.find('txt_nick', uNode).getComponent(cc.Label).string = CCUtil.stringClamp(user.nickname, 6, '..');
			// cc.find('txt_uid', uNode).getComponent(cc.Label).string = user.uid != UserModel.getData("uid") ? Utils.stringSecurity(user.uid) : user.uid;
			cc.find('txt_uid', uNode).getComponent(cc.Label).string = 'ID:' + user.uid;
			cc.find("banker", uNode).active = user.bankerUid == user.uid
			AssetsManager.loadSpriteFrame({
				path: user.avatar,
				sprite: cc.find('head', uNode).getComponent(cc.Sprite)
			});
			let score = user.winScores || 0;
			score = Utils.formatNumberWithDecimal(score);
			let win = cc.find('win', uNode).getComponent(cc.Label);
			let lose = cc.find('lose', uNode).getComponent(cc.Label);
			if (user.uid == UserModel.getData('uid')) {
				this.bgwin.active = score >= 0;
				this.bglose.active = !(this.bgwin.active);
			}
			win.node.active = true;
			lose.node.active = true
			if (score > 0) {
				lose.string = ""
				win.string = '+' + score
			} else {
				win.string = ""
				lose.string = score + ""
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
					let count = (ApiLamj.operateType.PENG == obj.operate || ApiLamj.operateType.CHI == obj.operate) ? 3 : 4;
					let cardList = [obj.card, obj.card, obj.card];
					if (ApiLamj.operateType.PENG !== obj.operate) {
						cardList = obj.plusInfo.cardList;
					}
					for (let j = 0; j < count; ++j) {
						let card = cardList[j];
						let node = this.getPengGangCardNode(user.laiZiCards, card, j, obj.operate == ApiLamj.operateType.GANG_ZHI, obj.operate == ApiLamj.operateType.GANG_BU);
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

			let huTypeSrpite = cc.find('huIndex', uNode).getComponent(cc.Sprite);
			let huType = user.huType || 0;
			if (huType) {
				huTypeSrpite.node.active = true
				huTypeSrpite.spriteFrame = null;
				AssetsManager.loadSpriteFrame({
					path: `res/sprite/hu/hu${huType}`,
					sprite: huTypeSrpite,
					bundle: Enums.bundleType.LAMJ
				})

				let huCards = user.huCards || 0;
				/**如果是自摸，手牌里面删除胡的那张牌再做显示 */
				if (huType === ApiLamj.operateType.HU_ZHI || huType === ApiLamj.operateType.HU_QIANG) {
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
					let huCardNode = this.getCardNode(huCards, user.laiZiCards);
					huCardNode.parent = cardsLayout;
					huCardNode.x = posx;
				}
			} else {
				loseCount++
				this.sortHandCards(handCards)
				for (let i = 0; i < handCards.length; ++i) {
					let node = this.getCardNode(handCards[i], user.laiZiCards);
					node.parent = cardsLayout;
					node.x = posx;
					posx += cardWidth;
				}

				if (user.loseUid == user.uid) {
					huTypeSrpite.node.active = true
					huTypeSrpite.spriteFrame = null;
					AssetsManager.loadSpriteFrame({
						path: `res/sprite/hu/hu100`,
						sprite: huTypeSrpite,
						bundle: Enums.bundleType.LAMJ
					})
				}
			}

			// userPlusType
			let userPlusType = user.userPlusType
			if (Array.isArray(userPlusType) && userPlusType.length > 0) {
				let cardTypeLayout = cc.find("cardTypeLayout", uNode)
				userPlusType.forEach(info => {
					let scoreStr = ""
					if (info.scoreType == 0 && info.score > 0) scoreStr = "+" + info.score
					else if (info.scoreType == 1) scoreStr = "x" + info.score
					else scoreStr = "" + info.score

					/**抢杠胡特殊处理 */
					if (info.type == ApiLamj.cardType.QIANGGANGHU) {
						scoreStr = ""
					}

					let txtNode = cc.instantiate(this.cardTypeItemNode)
					txtNode.parent = cardTypeLayout
					txtNode.y = 0
					txtNode.getComponent(cc.Label).string = ApiLamj.plusRateTypeStr[info.type] + scoreStr
				});
			}
		}

		/**流局 */
		if (users.length == loseCount) {
			this.bglose.active = true
			this.bgwin.active = false
			cc.find("title_liu", this.bglose).active = true
		}

		/**赖子牌 */
		this.laiziLay.removeAllChildren()
		if (this._laiZiCards && this._laiZiCards.length > 0) {
			for (let i = 0; i < this._laiZiCards.length; ++i) {
				let node = this.getCardNode(this._laiZiCards[i], this._laiZiCards);
				node.parent = this.laiziLay;
				node.y = 0;
			}
		}
	},

	/**头像点击响应 */
	userTogClick(event) { },

	showResult() {
		this.bureauLabel.string = this.bureau + 1;
		this.resultData = Utils.deepCopy(this.reviewRecord[this.bureau].result)
		this._maPaiInfo = Utils.deepCopy(this.reviewRecord[this.bureau].plusInfo.maPaiInfo)
		this._laiZiCards = Utils.deepCopy(this.reviewRecord[this.bureau].plusInfo.laiZiCards)
		this.setAllHandCards()
	},

	/**给手牌重新排序 */
	sortHandCards(handCards) {
		handCards.sort((a, b) => a - b)
		let ghostList = this._laiZiCards
		let isWeiBaoPai = ghostList.length > 0 && ghostList[0] < 31
		let myGhost = []

		for (let i = 0; i < handCards.length; i++) {
			const card = handCards[i];
			let isDel = false;
			if (ghostList.includes(card)) {
				myGhost.push(card);
				isDel = true;
			}
			//  else if (card == 35 && isWeiBaoPai) {
			// 	hongzhong.push(card)
			// 	isDel = true
			// }
			if (isDel) {
				handCards.splice(i, 1);
				i--;
			}
		}
		for (let i = myGhost.length - 1; i >= 0; i--) {
			handCards.unshift(myGhost[i])
		}

		// /**如果宝牌不是字牌，红中变成伪宝牌 */
		// if (isWeiBaoPai && hongzhong.length > 0) {
		// 	let bidx = handCards.findIndex(t => t > ghostCard[0])
		// 	for (let i = 0; i < hongzhong.length; i++) {
		// 		const h = hongzhong[i];
		// 		handCards.splice(bidx, 0, h)
		// 	}
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
		} else if (parameters == "qie") { //切牌
			ApiRoom.gameMessageNotify(ApiLamj.gameQiePaiNotify());
			this.node.destroy()
		}
	},

	getCardNode(card, ghost = []) {
		let node = cc.instantiate(this.cardPfb);
		node.active = true;
		node.y = 0;
		let com = node.addComponent('LAMJSingleTile')
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
		let com = node.addComponent('LAMJSingleTile')
		com.init()
		com.flower = card;
		com.setNodeShow(true);
		com.setGhostIcon(ghost.includes(card));
		if (!!isAnGang && i < 3 || !!isBuGang && i == 3) {
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