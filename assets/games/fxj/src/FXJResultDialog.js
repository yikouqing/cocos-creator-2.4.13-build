const ApiRoom = require('../../../src/api/ApiRoom');
const ApiFxj = require('./ApiFxj');
const FXJLogic = require('./FXJLogic');
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
		cardNode: cc.Node,
		clockLabel: cc.Label,
		bureauLabel: cc.Label,
		shengli: cc.Node,
		shibai: cc.Node,
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
		this._ghostList = FXJLogic.getGhostList(this.reviewRecord[0].playType)

		if (this.node.nodeParams.isResult) {
			this.node.active = false
			this.setAllHandCards();
			this.scheduleOnce(() => {
				this.node.active = true
			}, 3)
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
			cardWidth = 50,
			nullWidth = 20;
		posx += cardWidth / 2;
		let pengGangArray = this.resultData.operateArray[chairID]
		if (pengGangArray.length > 0) {
			for (let i = 0; i < pengGangArray.length; ++i) {
				let obj = pengGangArray[i];
				let count = (ApiFxj.operateType.PENG == obj.operate || ApiFxj.operateType.CHI == obj.operate) ? 3 : 4;
				let cardList = [obj.card, obj.card, obj.card]
				if (ApiFxj.operateType.PENG !== obj.operate) { //如果不是碰，使用plusInfo里面的数据
					cardList = obj.plusInfo.cardList
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
					let node = this.getPengGangCardNode(card, j, obj.operate == ApiFxj.operateType.GANG_ZHI);
					node.parent = layout;
					if (count == 4 && j == 3) {
						node.y = 12;
						node.x = posx - 2 * cardWidth;
					} else {
						node.x = posx;
						posx += cardWidth;
					}
				}
				posx += nullWidth;
			}
		}
		let handCards = []
		if (this.resultData && this.resultData.handCards && this.resultData.handCards[chairID]) {
			handCards = this.resultData.handCards[chairID].slice()
		}
		let fangGangCount = 0;
		if (this.resultData.fangGangArray && this.resultData.fangGangArray.length > 0) {
			for (let i = 0; i < this.resultData.fangGangArray.length; ++i) {
				if (this.resultData.fangGangArray[i] == chairID) {
					++fangGangCount;
				}
			}
		}

		let resultLabel = cc.find('resultLabel', item).getComponent(cc.Label)
		let txt_cardType = cc.find("txt_cardType", item).getComponent(cc.Label)
		let resultStr = ""
		let cardTypeStr = ""
		if (this.resultData.userBaseScore && this.resultData.userBaseScore.length > 0) {
			resultStr = "胡分:" + this.resultData.userBaseScore[chairID] + " " //+ "\n"
		}
		if (this.resultData.userPigScoreArr && this.resultData.userPigScoreArr.length > 0) {
			resultStr += "养猪:" + this.resultData.userPigScoreArr[chairID] + " " // + "\n"
		}
		if (this.resultData.userDianJiArr && this.resultData.userDianJiArr.length > 0) {
			resultStr += "点鸡:" + this.resultData.userDianJiArr[chairID]
		}

		if (this.resultData.winChairIDArray.indexOf(chairID) != -1) {
			cc.find('icon', item).active = true;
			let huCard = this.resultData.huCard

			/**如果是自摸，手牌里面删除胡的那张牌再做显示 */
			if (this.resultData.huType === ApiFxj.operateType.HU_ZHI) {
				for (let i = 0; i < handCards.length; i++) {
					if (huCard === handCards[i]) {
						handCards.splice(i, 1)
						break
					}
				}
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

			if (this.resultData.huType === ApiFxj.operateType.HU_ZHI) cardTypeStr = "自摸"
			else if (this.resultData.huType === ApiFxj.operateType.HU_CHI) cardTypeStr = "接炮"
			let ct = this.resultData.cardType[chairID]
			cardTypeStr += " " + ApiFxj.cardTypeStr[ct]
			if (this.resultData.plusRateList && this.resultData.plusRateList[chairID] && this.resultData.plusRateList[chairID].length > 0) {
				this.resultData.plusRateList[chairID].forEach(type => {
					cardTypeStr += " " + ApiFxj.plusRateTypeStr[type]
				});
			}
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
		resultLabel.string = resultStr

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
			this.shengli.active = score >= 0;
			this.shibai.active = !this.shengli.active;
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
		let node = cc.instantiate(this.cardNode);
		node.active = true;
		node.y = 0;
		let com = node.addComponent('FXJSingleTile')
		com.init()
		com.flower = card
		com.setNodeShow(true)
		com.setGhostIcon(this._ghostList.includes(card))
		return node;
	},

	getPengGangCardNode(card, i, isAnGang = false) {
		let node = cc.instantiate(this.cardNode);
		node.active = true;
		node.y = 0;
		let com = node.addComponent('FXJSingleTile')
		com.init()
		com.flower = card
		com.setNodeShow(true)
		let isGhost = this._ghostList.includes(card)
		com.setGhostIcon(isGhost)
		if (isAnGang) {
			if ((i == 0 && !isGhost) || i == 1 || i == 2) {
				com.setCover(true)
				com.setGhostIcon(false)
			}
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