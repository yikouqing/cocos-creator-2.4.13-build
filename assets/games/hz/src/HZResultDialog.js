const ApiRoom = require('../../../src/api/ApiRoom');
const ApiHz = require('./ApiHz');
const HZLogic = require('./HZLogic');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const UserModel = require('../../../src/model/UserModel');
const MessageCallback = require('../../../src/utils/MessageCallback');

cc.Class({
	extends: cc.Component,
	properties: {
		cardsLayout: cc.Node,
		itemNode: cc.Node,
		cardPfb: cc.Prefab,
		clockLabel: cc.Label,
		bureauLabel: cc.Label,
		_ghostList: [], //鬼牌列表
	},

	start() {
		MessageCallback.addListener('RemoveGameResult', this);
		this.resultData = this.node.nodeParams.result;
		this.reviewRecord = [{}]
		this.tick = 30;
		let resBtnNode = cc.find('resBtnNode', this.node);
		let reviewBtnNode = cc.find("reviewBtnNode", this.node);
		let clockNode = cc.find("Clock", resBtnNode);
		if (this.node.nodeParams.isReview) { //视频回放页面隐藏继续按钮
			resBtnNode.active = false;
			reviewBtnNode.active = false;
		} else if (this.node.nodeParams.isResult) { //正常结算页面
			reviewBtnNode.active = false;
			resBtnNode.active = true;
			clockNode.active = !this.node.nodeParams.isBureauFull;
		} else { //战绩回放页面显示左右翻页按钮
			resBtnNode.active = false;
			reviewBtnNode.active = true;
			this.reviewRecord = this.node.nodeParams.reviewRecord;
			// console.log("回放数据==", this.reviewRecord)
			let lastItem = this.reviewRecord[this.reviewRecord.length - 1];
			if (lastItem && !lastItem.result) {
				/* 最后一局未完成，删除 */
				this.reviewRecord.pop();
			}
			this.bureau = 0;
		}
		this._ghostList = HZLogic.getGhostList()

		if (this.node.nodeParams.isResult) {
			this.node.active = false
			this.setAllHandCards();
			let dt = 0.5
			if (this.resultData.myMaCards && this.resultData.myMaCards.length > 0) {
				dt += 0.2 * this.resultData.myMaCards.length
			}
			this.scheduleOnce(() => {
				this.node.active = true
			}, dt)
		} else if (this.node.nodeParams.isReview) {
			this._ghostList = this.node.nodeParams.ghostList
			this.setAllHandCards()
		} else {
			this.showResult()
		}
	},

	showResult() {
		this.bureauLabel.string = this.bureau + 1;
		this.resultData = this.reviewRecord[this.bureau].result

		this.setAllHandCards()
	},

	setAllHandCards() {
		// let posy = 350,
		// 	itemHeight = 130;
		// posy -= itemHeight / 2;
		this.cardsLayout.removeAllChildren()
		cc.find('title_win', this.node).active = false
		cc.find('title_lose', this.node).active = false;
		for (let i = 0; i < this.resultData.handCards.length; ++i) {
			if (!this.resultData.handCards[i]) {
				continue;
			}
			let item = this.getHandCardsItem(i);
			item.parent = this.cardsLayout;
			item.active = true;
			// item.y = posy;
			// posy -= itemHeight;
		}




		/**马牌 */
		let myMaCards = this.resultData.myMaCards;
		if (myMaCards && myMaCards.length > 0) {
			let maLabel = cc.find('mapai', this.node);
			maLabel.active = true;
			let maLayout = cc.find('layout', maLabel);
			maLayout.removeAllChildren()

			for (let i = 0; i < myMaCards.length; ++i) {
				/*马牌*/
				let node = this.getCardNode(myMaCards[i].card);
				cc.find('win', node).active = myMaCards[i].win;
				node.parent = maLayout;
			}
		}
	},

	getArrayItemCount(item, array) {
		let count = 0;
		if (array && array.length > 0) {
			for (let i = 0; i < array.length; ++i) {
				if (array[i] == item) {
					++count;
				}
			}
		}
		return count;
	},

	getHandCardsItem(chairID) {
		let item = cc.instantiate(this.itemNode);
		let user = this.resultData.userArray[chairID]
		if (user) {
			cc.find('name', item).getComponent(cc.Label).string = CCUtil.stringClamp(user.nickname, 6, '..');;
			// cc.find('uid', item).getComponent(cc.Label).string = user.uid != UserModel.getData("uid") ? Utils.stringSecurity(user.uid) : user.uid;
			cc.find('uid', item).getComponent(cc.Label).string = 'ID:' + user.uid;
			cc.find('owner', item).active = false
			AssetsManager.loadSpriteFrame({
				path: user.avatar,
				sprite: cc.find('head', item).getComponent(cc.Sprite)
			});
			cc.find('banker', item).active = user.isBanker
		}
		let layout = cc.find('Layout', item);
		let posx = 0,
			cardWidth = 82,
			nullWidth = 15;
		posx += cardWidth / 2;
		let pengGangArray = this.resultData.operateArray[chairID]
		if (pengGangArray.length > 0) {
			for (let i = 0; i < pengGangArray.length; ++i) {
				let obj = pengGangArray[i];
				let count = (ApiHz.operateType.PENG == obj.operate) ? 3 : 4;
				let cardList = []
				for (let i = 0; i < count; i++) {
					cardList.push(obj.card)
				}
				if (count == 4) {
					let tmp = []
					cardList.forEach(t => {
						if (this._ghostList.includes(t)) {
							tmp.unshift(t)
						} else {
							tmp.push(t)
						}
					});
					cardList = tmp
				}
				for (let j = 0; j < count; ++j) {
					let card = cardList[j]
					let node = this.getPengGangCardNode(card, j, obj.operate == ApiHz.operateType.GANG_ZHI, obj.operate == ApiHz.operateType.GANG_BU);
					node.parent = layout;
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
		let handCards = this.resultData.handCards[chairID];
		if (handCards) {
			handCards = handCards.slice()
		}
		let fangGangCount = 0;
		if (this.resultData.fangGangArray && this.resultData.fangGangArray.length > 0) {
			for (let i = 0; i < this.resultData.fangGangArray.length; ++i) {
				if (this.resultData.fangGangArray[i] == chairID) {
					++fangGangCount;
				}
			}
		}

		let txt_cardType = cc.find("txt_cardType", item).getComponent(cc.Label)
		let cardTypeStr = ""

		if (this.resultData.winChairIDArray.indexOf(chairID) != -1) {
			cc.find('icon', item).active = true;
			let huCard = handCards[handCards.length - 1]

			/**如果是自摸，手牌里面删除胡的那张牌再做显示 */
			if (this.resultData.huType === ApiHz.operateType.HU_ZHI) {
				handCards.splice(handCards.length - 1, 1)
			}
			this.sortHandCards(handCards)
			for (let i = 0; i < handCards.length; ++i) {
				let node = this.getCardNode(handCards[i]);
				node.parent = layout;
				node.x = posx;
				posx += cardWidth;
			}
			if (huCard && huCard > 0) {
				posx += nullWidth;
				let huCardNode = this.getCardNode(huCard);
				huCardNode.parent = layout;
				huCardNode.x = posx;
			}

			if (this.resultData.huType === ApiHz.operateType.HU_ZHI) cardTypeStr = "自摸"
			else if (this.resultData.huType === ApiHz.operateType.HU_CHI) cardTypeStr = "接炮"

		} else {
			this.sortHandCards(handCards)
			for (let i = 0; i < handCards.length; ++i) {
				let node = this.getCardNode(handCards[i]);
				node.parent = layout;
				node.x = posx;
				posx += cardWidth;
			}
		}
		if (fangGangCount > 0) {
			cardTypeStr += " 放杠X" + fangGangCount
		}
		txt_cardType.string = cardTypeStr

		let score = this.resultData.scores[chairID];


		if (score > 0) {
			let label = cc.find('win', item).getComponent(cc.Label);
			label.node.active = true;
			label.string = '+' + Math.floor(score);
		} else {
			let label = cc.find('lose', item).getComponent(cc.Label);
			label.node.active = true;
			label.string = Math.floor(score);
		}

		if (user.uid == UserModel.getData('uid')) {
			cc.find('title_win', this.node).active = score >= 0;
			cc.find('title_lose', this.node).active = !(cc.find('title_win', this.node).active);
		}

		return item;
	},

	/**给手牌重新排序 */
	sortHandCards(handCards) {
		handCards.sort((a, b) => a - b)
		let ghostList = this._ghostList
		let myGhost = []
		for (let i = 0; i < handCards.length; i++) {
			const card = handCards[i];
			if (ghostList.includes(card)) {
				myGhost.push(card)
				handCards.splice(i, 1)
				i--
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
				this.node.destroy()
			}
		}
	},

	onBtnClick(event, parameters) {

		if (parameters === 'ready') {
			if (!this.node.nodeParams.isBureauFull) {
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify());
				this.node.destroy();
			} else {
				if (this.node.nodeParams.mjMainDialog &&
					this.node.nodeParams.mjMainDialog.showMJAllResultFunc) {
					this.node.nodeParams.mjMainDialog.showMJAllResultFunc();
					this.node.destroy();
				}
			}
		} else if (parameters === 'exit') {
			this.node.destroy();
		}
	},

	getCardNode(card) {
		let node = cc.instantiate(this.cardPfb);
		node.active = true;
		node.y = 0;
		let com = node.addComponent('HZSingleTile')
		com.init()
		com.flower = card
		com.setNodeShow(true)
		com.setGhostIcon(this._ghostList.includes(card))
		return node;
	},

	getPengGangCardNode(card, i, isAnGang = false, isBuGang = false) {
		let node = cc.instantiate(this.cardPfb);
		node.active = true;
		node.y = 0;
		let com = node.addComponent('HZSingleTile')
		com.init()
		com.flower = card
		com.setNodeShow(true)
		let isGhost = this._ghostList.includes(card)
		com.setGhostIcon(isGhost)
		if (!!isAnGang && i < 3 || !!isBuGang && i == 3) {
			com.setCover(true)
		}

		return node;
	},

	getNullNode() {
		let node = new cc.Node();
		node.width = 20;
		return node;
	},

	nextResult() {

		if (this.bureau + 1 >= this.reviewRecord.length) {
			return;
		}
		++this.bureau;
		this.showResult();
	},

	preResult() {

		if (this.bureau - 1 < 0) {
			return;
		}
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