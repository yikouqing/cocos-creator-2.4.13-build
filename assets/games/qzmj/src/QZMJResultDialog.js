const ApiRoom = require('../../../src/api/ApiRoom');
const ApiQzmj = require('./ApiQzmj');
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const UserModel = require('../../../src/model/UserModel');
const QZMJModel = require('./QZMJModel');
const MAX_USER_NUM = 4;
const huIndexUrl = "res/sprite/rank/";
const Utils = require('../../../src/utils/Utils');
const MessageCallback = require('../../../src/utils/MessageCallback');

cc.Class({
	extends: cc.Component,
	properties: {
		userLayOut: cc.Node,
		userItemNode: cc.Node,
		cardTypeItemNode: cc.Node,
		cardNode: cc.Node,
		clockLabel: cc.Label,
		bureauLabel: cc.Label,
		_myChairId: null, //自己的座位号
	},

	start() {
		MessageCallback.addListener('RemoveGameResult', this);

		if (!!this.node.nodeParams.result) {
			this.resultData = JSON.parse(JSON.stringify(this.node.nodeParams.result));
		}
		this.tick = 30;
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
		} else { //战绩回放页面显示左右翻页按钮
			resBtnNode.active = false;
			reviewBtnNode.active = true;
			// console.log('回放', this.node.nodeParams)
			this.reviewRecord = this.node.nodeParams.reviewRecord;
			let lastItem = this.reviewRecord[this.reviewRecord.length - 1];
			if (lastItem && !lastItem.result) {
				/* 最后一局未完成，删除 */
				this.reviewRecord.pop();
			}
			this.bureau = 0;
		}
		if (this.node.nodeParams.isResult) {
			this.node.active = true;
			this.setAllHandCards();
		} else if (this.node.nodeParams.isReview) {
			this.setAllHandCards();
		} else {
			this.showResult()
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
		cc.find('title_win', this.node).active = false
		cc.find('title_lose', this.node).active = false;
		if (!this.resultData) return;
		let users = this.resultData;
		if (!users) return;
		// console.log('小结算', users);
		for (const user of users) {
			if (!user) continue;
			let uNode = cc.instantiate(this.userItemNode);
			uNode.parent = this.userLayOut;
			uNode.active = true;
			cc.find('txt_nick', uNode).getComponent(cc.Label).string = CCUtil.stringClamp(user.nickname, 4, '..');
			// cc.find('txt_uid', uNode).getComponent(cc.Label).string = user.uid != UserModel.getData("uid") ? Utils.stringSecurity(user.uid) : user.uid;
			cc.find('txt_uid', uNode).getComponent(cc.Label).string = 'ID:' + user.uid;
			AssetsManager.loadSpriteFrame({
				path: user.avatar,
				sprite: cc.find('head', uNode).getComponent(cc.Sprite)
			});
			let score = user.winScores || 0;
			score = parseFloat(score);
			let win = cc.find('win', uNode).getComponent(cc.Label);
			let lose = cc.find('lose', uNode).getComponent(cc.Label);
			let cardsLayout = cc.find('cardsLayout', uNode);
			if (cardsLayout) cardsLayout.removeAllChildren()
			let posx = 0,
				cardWidth = 44.28,
				nullWidth = 15;
			posx += cardWidth / 2;
			let handCards = !user.userCards || !user.userCards[user.uid] ? [] : user.userCards[user.uid];
			let pengGangArray = user.operateArray || [];
			if (pengGangArray.length > 0) {
				for (let i = 0; i < pengGangArray.length; ++i) {
					let obj = pengGangArray[i];
					let count = (ApiQzmj.operateType.PENG == obj.operate || ApiQzmj.operateType.CHI == obj.operate) ? 3 : 4;
					let cardList = [obj.card, obj.card, obj.card];
					if (ApiQzmj.operateType.PENG !== obj.operate) {
						cardList = obj.plusInfo.cardList;
					}
					for (let j = 0; j < count; ++j) {
						let card = cardList[j];
						let node = this.getPengGangCardNode(user.laiZiCards, card, j, obj.operate == ApiQzmj.operateType.GANG_ZHI, obj.operate == ApiQzmj.operateType.GANG_BU);
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
			if (score >= 0) {
				let huTypeSrpite = cc.find('huIndex', uNode).getComponent(cc.Sprite);
				let huType = user.huType || 0;
				huTypeSrpite.spriteFrame = null;
				AssetsManager.loadSpriteFrame({
					path: `res/sprite/hu/hu${huType}`,
					sprite: huTypeSrpite,
					bundle: Enums.bundleType.QZMJ
				})
				win.node.active = true;
				lose.node.active = false
				win.string = '+' + Utils.formatNumberWithDecimal(score);
				let huCards = user.huCards || 0;
				/**如果是自摸，手牌里面删除胡的那张牌再做显示 */
				if (user.huType === ApiQzmj.operateType.HU_ZHI ||
					user.huType === ApiQzmj.operateType.YOU_JIN ||
					user.huType === ApiQzmj.operateType.SAN_JIN) {
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
				lose.node.active = true;
				win.node.active = false
				if (score < 0) lose.string = Utils.formatNumberWithDecimal(score);
				this.sortHandCards(handCards)
				for (let i = 0; i < handCards.length; ++i) {
					let node = this.getCardNode(handCards[i], user.laiZiCards);
					node.parent = cardsLayout;
					node.x = posx;
					posx += cardWidth;
				}
			}


			if (user.uid == UserModel.getData('uid')) {
				cc.find('title_win', this.node).active = score >= 0;
				cc.find('title_lose', this.node).active = !(cc.find('title_win', this.node).active);
			}

			let cardTypeLayout = cc.find('cardTypeLayout', uNode);
			if (!cardTypeLayout) continue;
			let record = user.userWinResult || {};
			for (const key in record) {
				if (!record[key] || parseFloat(record[key]) == 0 || key === 'baseRate') continue;
				let item = cc.instantiate(this.cardTypeItemNode);
				item.parent = cardTypeLayout;
				let score = parseFloat(record[key]);
				let txt_score = item.getComponent(cc.Label);
				let symbol = score > 0 ? '+' : '-';
				let rate = ' ';
				if (key == 'youJinRate') {
					symbol = '';
					rate = '倍 ';
				}
				if (txt_score) txt_score.string = `${ApiQzmj.userWinResult[key]} ${symbol}${Utils.formatNumberWithDecimal(Math.abs(score))}${rate}`;
			}
		}

	},

	/**头像点击响应 */
	userTogClick(event) { },

	showResult() {
		this.bureauLabel.string = this.bureau + 1;
		this.resultData = JSON.parse(JSON.stringify(this.reviewRecord[this.bureau].result));
		this.findMyChairId()
		this.showUserInfo();
	},

	/**给手牌重新排序 */
	sortHandCards(handCards) {
		handCards.sort((a, b) => a - b)
		let ghostList = QZMJModel.getGhostCard();
		let myGhost = []
		for (let i = 0; i < handCards.length; i++) {
			const card = handCards[i];
			if (ghostList == card) {
				myGhost.push(card)
				handCards.splice(i, 1)
				i--;
			}
		}
		for (let i = 0; i < myGhost.length; i++) {
			handCards.unshift(myGhost[i])
		}
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

	getCardNode(card, ghost) {
		let node = cc.instantiate(this.cardNode);
		node.active = true;
		node.y = 0;
		let com = node.addComponent('QZMJSingleTile')
		com.init()
		com.flower = card;
		com.setNodeShow(true);
		com.setGhostIcon(ghost == card);
		return node;
	},

	getPengGangCardNode(ghost, card, i, isAnGang, isBuGang) {
		let node = cc.instantiate(this.cardNode);
		node.active = true;
		node.y = 0;
		let com = node.addComponent('QZMJSingleTile')
		com.init()
		com.flower = card;
		com.setNodeShow(true);
		com.setGhostIcon(card == ghost);
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