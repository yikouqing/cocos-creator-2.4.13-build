const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const EZGDTModel = require("./EZGDTModel")
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const ApiEzgdt = require('./ApiEzgdt');

let CARD_COUNT = 2
let CARD_POSX = [-51, 51]

cc.Class({
	extends: cc.Component,

	properties: {
		cardPfb: cc.Prefab,
		cardLayout: cc.Node,
		cardTypeNode: cc.Node,
		/**牌脚本列表 */
		_showCardComList: [],
		/**是否初始化 */
		_isInit: false,
		/**位置 */
		_idx: null,
		/**座位号 */
		_chairId: null,
	},

	init(idx) {
		if (this._isInit) {
			return
		}
		this.node.active = true
		this._isInit = true
		this._idx = idx

		for (let i = 0; i < CARD_COUNT; i++) {
			let com = this.getNewCard(i)
			com.updateNodePos(cc.v2(CARD_POSX[i], 0))
			com.setNodeShow(false)
			this._showCardComList.push(com)
		}
	},

	getNewCard(i) {
		let node = cc.instantiate(this.cardPfb)
		node.parent = this.cardLayout
		node.name = i + ""
		let com = node.addComponent('EZGDTCard')
		com.init()
		return com
	},

	/**设置座位号 */
	setChairId(cid) {
		this._chairId = cid
	},

	/**重置 */
	reset() {
		for (let i = 0; i < this._showCardComList.length; i++) {
			const com = this._showCardComList[i];
			com.setNodeShow(false)
		}
		this.cardTypeNode.active = false
	},

	/**发牌 */
	sendCards(cardArr, flyStartNode, isSecond = false) {
		if (!cardArr || cardArr.length == 0) {
			return
		}
		for (let i = 0; i < this._showCardComList.length; i++) {
			const com = this._showCardComList[i];
			let id = cardArr[i]
			if (id || id == 0) {
				com.flower = id
				com.setNodeShow(true)
				com.setNodeScale(1)
				com.updateNodePos(cc.v2(CARD_POSX[i], 0))
			}
		}
		/**发牌动画 */
		if (flyStartNode) {
			let startPos = CCUtil.postionConvert(flyStartNode, this.cardLayout)
			for (let i = 0; i < cardArr.length; i++) {
				if (isSecond && i == 0) continue; //直接发第二张
				const com = this._showCardComList[i];
				com.updateNodePos(startPos)
				com.setNodeScale(0.1)
				let endPos = cc.v3(CARD_POSX[i], 0, 0)
				cc.tween(com.node).delay(0.05 * i).call(() => {
					AssetsManager.playEffect({
						path: 'audio/common/foldpai'
					});
				}).to(0.2, {
					position: endPos,
					scale: 1
				}).start()
			}
		}
	},

	/**展示牌 */
	showCard(data, isAni) {
		let bianId = EZGDTModel.getBianCard(data.cards, data.handCards)
		let cardArr = bianId.length > 0 ? data.handCards : data.cards
		let dt = 0
		for (let i = 0; i < this._showCardComList.length; i++) {
			const com = this._showCardComList[i];
			let isCardAni = isAni && (com.getCoverIsShow() || this._idx == 0)
			let cardId = cardArr[i]
			if (bianId.includes(cardId)) {
				com.updateFlowerLai(cardId)
			} else { com.flower = cardId }
			com.setNodeShow(true)
			com.setNodeScale(1)
			if (isCardAni) {
				dt = 0.05 * i + 0.2 //最后一张翻开的时间
				cc.tween(com.node).delay(0.05 * i).to(0.1, {
					scaleX: 0
				}).call(() => {
					com.setCover(false)
					AssetsManager.playEffect({
						path: "res/audio/sound-fanpai",
						bundle: EZGDTModel.getBundleType()
					});
				}).to(0.1, {
					scaleX: 1
				}).start()
			}
		}
		this.showCardType(data, dt)
	},

	/**展示牌型 */
	showCardType(data, dt = 0) {
		let { type, point } = EZGDTModel.changeTypeAndPoint(data.type, data.point)
		let url = "res/sprite/cardType/" + type + "_" + point
		// console.log("牌型==", url)
		AssetsManager.loadSpriteFrame({
			path: url,
			sprite: this.cardTypeNode.getComponent(cc.Sprite),
			bundle: EZGDTModel.getBundleType(),
		})
		this.cardTypeNode.stopAllActions()
		this.cardTypeNode.scale = 1
		this.cardTypeNode.active = true
		if (dt > 0) {
			this.cardTypeNode.scale = 3;
			let action = cc.scaleTo(0.2, 1);
			action.easing(cc.easeIn(3));
			cc.tween(this.cardTypeNode).delay(dt).then(action).start()

			let sex = EZGDTModel.getUserSexByUid(data.uid)
			AssetsManager.playEffect({
				path: `res/audio/${sex}/` + type + "_" + point,
				bundle: EZGDTModel.getBundleType()
			});
		}
	},
});