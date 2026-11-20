const CJSJYModel = require('./CJSJYModel');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ApiCjsjy = require('./ApiCjsjy');
const MessageCallback = require('../../../src/utils/MessageCallback');

let CARD_COUNT = 4
let CARD_POSX4 = [-153, -51, 51, 153]
let CARD_POSX4_1 = [-325.5, -108.5, 108.5, 325.5]

cc.Class({
	extends: cc.Component,

	properties: {
		cardPfb: cc.Prefab,
		cardLayout: cc.Node,
		ctPfb: cc.Prefab,
		chooseEndNode: cc.Node,
		cardTypeCom: require("CJSJYCardType"),

		/**牌脚本列表 */
		_showCardComList: [],
		/**是否初始化 */
		_isInit: false,
		/**牌抬起来的偏移量 */
		_upY: null,
		/**位置 */
		_idx: null,
		/**牌X位置列表 */
		_posList: null,
		_selectIdx: null
	},

	getNewCard(i) {
		let node = cc.instantiate(this.cardPfb)
		node.parent = this.cardLayout
		node.name = i + ""
		let com = node.addComponent('CJSJYCard')
		com.init()
		return com
	},

	init(idx) {
		if (this._isInit) {
			return
		}
		this._upY = 20
		this.node.active = true
		this._isInit = true
		this._idx = idx
		this.cardTypeCom.setIdx(idx)
		this.cardTypeCom.hideSelf();
		this.setChooseEnd(false)
		this._posList = CARD_POSX4
		if (idx == 0) {
			this._posList = CARD_POSX4_1
			this.chooseEndNode.y = 190
			this.chooseEndNode.x = this._posList[3]
		}
		for (let i = 0; i < CARD_COUNT; i++) {
			let com = this.getNewCard(i)
			com.updateNodePos(cc.v2(this._posList[i], 0))
			com.setNodeShow(false)
			this._showCardComList.push(com)
			if (idx == 0) {
				com.node.on(cc.Node.EventType.TOUCH_END, this.onCardClick, this);
			}
		}
	},

	onCardClick(event) {
		//console.log("点击了牌==", event.target.name, CJSJYModel.getGameStatus(), CJSJYModel.getShowCards(CJSJYModel.getMyChairID()), CJSJYModel.getIsPlayingByChairID(CJSJYModel.getMyChairID()))
		if (CJSJYModel.getGameStatus() == ApiCjsjy.gameStatus.SHOW_CARDS && !CJSJYModel.getShowCards(CJSJYModel.getMyChairID()) &&
			CJSJYModel.getIsPlayingByChairID(CJSJYModel.getMyChairID())) {
			let idx = parseInt(event.target.name)
			if (idx == this._selectIdx) {
				// console.log("重复选择")
				return
			}

			/**跳过搓牌 */
			for (let i = 0; i < this._showCardComList.length; i++) {
				const com = this._showCardComList[i];
				if (com.flower == 0) {
					let myCard = CJSJYModel.getHandCardsByChairID(CJSJYModel.getMyChairID())
					this.showLastCard(myCard, true)
					this.showTypeTipFirst()
					MessageCallback.emitMessage("tiaoguocuopai")
					return
				}
			}

			this._selectIdx = idx
			let selectId = null
			for (let i = 0; i < this._showCardComList.length; i++) {
				const com = this._showCardComList[i];
				com.setGray(i == idx)
				com.updateNodePos(cc.v2(com.node.x, i == idx ? this._upY : 0))
				if (i == idx) {
					selectId = com.flower
				}
			}
			/**设置牌型 */
			if (selectId != null) {
				let cardTypeList = CJSJYModel.getCardTypeList()
				let ct = cardTypeList.find(info => info.card == selectId)
				if (ct) {
					let data = {
						plusInfo: ct,
						chairID: CJSJYModel.getMyChairID()
					}
					this.showCardType(data)
				}
			}
		}
	},

	/**第一次显示提示 */
	showTypeTipFirst() {
		let cardTypeList = CJSJYModel.getCardTypeList()
		let ct = cardTypeList[0]
		if (!ct) {
			return
		}
		let data = {
			plusInfo: ct,
			chairID: CJSJYModel.getMyChairID()
		}
		let isShowed = false //防止一样的牌ID
		for (let i = 0; i < this._showCardComList.length; i++) {
			const com = this._showCardComList[i];
			com.setGray(false)
			com.updateNodePos(cc.v2(com.node.x, 0))
			if (!isShowed && com.flower == ct.card) {
				this._selectIdx = i
				com.setGray(true)
				com.updateNodePos(cc.v2(com.node.x, this._upY))
				isShowed = true
			}
		}
		this.showCardType(data)
	},

	setChooseEnd(isShow = false) {
		if (cc.isValid(this.chooseEndNode)) {
			this.chooseEndNode.active = isShow
		}
	},

	/**重置 */
	reset() {
		for (let i = 0; i < this._showCardComList.length; i++) {
			const com = this._showCardComList[i];
			com.setNodeShow(false)
			com.setLaiziIcon(false)
			com.setGray(false)
			com.updateNodePos(cc.v2(com.node.x, 0))
		}
		this.cardTypeCom.hideSelf();
		this.setChooseEnd(false)
		this._selectIdx = null
	},

	/**发牌 */
	sendCards(cardArr, flyStartNode) {
		if (!cardArr || cardArr.length == 0) {
			return
		}
		let cposx = this._posList

		for (let i = 0; i < this._showCardComList.length; i++) {
			const com = this._showCardComList[i];
			let cid = cardArr[i]
			if (cid || cid == 0) {
				com.flower = cardArr[i]
				com.setNodeShow(true)
				com.setNodeScale(1)
				com.updateNodePos(cc.v2(cposx[i], 0))
				com.setGray(false)
			} else {
				com.setNodeShow(false)
			}
		}
		/**发牌动画 */
		if (flyStartNode) {
			let startPos = CCUtil.postionConvert(flyStartNode, this.cardLayout)
			for (let i = 0; i < this._showCardComList.length; i++) {
				const com = this._showCardComList[i];
				com.updateNodePos(startPos)
				com.setNodeScale(0.1)
				let endPos = cc.v3(cposx[i], 0, 0)
				cc.tween(com.node).delay(0.05 * i).to(0.1, {
					position: endPos,
					scale: 1
				}).call(() => {
					AssetsManager.playEffect({
						path: 'audio/common/foldpai'
					});
				}).start()
			}
		}
	},

	/**展示第四张牌 */
	showLastCard(cardArr, isAni = false) {
		if (this._idx != 0 || CJSJYModel.getUserTest()) {
			return
		}
		for (let i = 0; i < this._showCardComList.length; i++) {
			const com = this._showCardComList[i];
			let cid = cardArr[i]
			com.flower = cid
			com.node.stopAllActions()
			com.setNodeScale(1)
			if (i == this._showCardComList.length - 1) {
				if (isAni) {
					com.setCover(true)
					cc.tween(com.node).delay(0.05 * i).to(0.1, {
						scaleX: 0
					}).call(() => {
						com.setCover(false)
					}).to(0.1, {
						scaleX: 1
					}).start()
				}
			}
		}
	},

	/**展示牌 */
	showCard(data, isAni) {
		let cardArr = data.cards.slice()
		let endCard = data.plusInfo.endCards.slice()
		if (cardArr.length != this._showCardComList.length) {
			return
		}
		/**获取变化前的手牌数据 */
		let laiIdx = []
		let replaCementCards = data.plusInfo.replaCementCards
		if (replaCementCards && typeof (replaCementCards) == "object" && Object.keys(replaCementCards).length > 0) {
			let hand = replaCementCards.HandCards.slice() //换过后的牌
			let huanPai = replaCementCards.HuanCards.slice() //换之前的牌
			for (let i = 0; i < huanPai.length; i++) {
				const before = huanPai[i];
				const after = hand[i]
				let idx = cardArr.indexOf(before)
				if (idx != -1) {
					cardArr[idx] = after
					laiIdx.push(idx)
				}
			}
		}

		if (CJSJYModel.getUserTest()) {
			isAni = false
		}
		this.setChooseEnd(false)
		for (let i = 0; i < this._showCardComList.length; i++) {
			const com = this._showCardComList[i];
			com.flower = cardArr[i]
			com.setNodeShow(true)
			com.setGray(!endCard.includes(cardArr[i]))
			com.updateNodePos(cc.v2(com.node.x, 0))
			if (laiIdx.includes(i)) {
				com.setLaiziIcon(true)
			}

			if (isAni && this._idx != 0) {
				cc.tween(com.node).delay(0.05 * i).to(0.1, {
					scaleX: 0
				}).call(() => {
					com.setCover(false)
				}).to(0.1, {
					scaleX: 1
				}).call(() => {
					if (i == this._showCardComList.length - 1) {
						this.showCardType(data, isAni)
					}
				}).start()
			}
		}
		if (!isAni || isAni && this._idx == 0) {
			this.showCardType(data, isAni)
		}
	},

	/**展示牌型 */
	showCardType(data, isAni = false) {
		let p = data.plusInfo;
		let types = [p.sanGongType, p.jinHuaType]
		this.cardTypeCom.showCardType(types, p.sanGongPoint, data.chairID, isAni)
	},

	/**展示分数 */
	showScore(scores, isAni = false) {
		this.cardTypeCom.showScore(scores, isAni)
	},

	/**获取提交的牌 */
	getShowCardList() {
		let list = []
		for (let i = 0; i < this._showCardComList.length; i++) {
			const com = this._showCardComList[i];
			if (com.node.active && com.node.y == 0) {
				list.push(com.flower)
			}
		}
		return list
	},

	/**显示理牌完成 */
	showLiPaiComplete() {
		this.setChooseEnd(true)
		if (this._idx != 0 && !CJSJYModel.getUserTest()) {
			this._showCardComList.forEach(com => {
				com.setCover(true)
			});
		}
	},
});