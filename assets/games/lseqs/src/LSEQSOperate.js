const LSEQSModel = require('./LSEQSModel');
const ApiLseqs = require('./ApiLseqs');
const ApiRoom = require('../../../src/api/ApiRoom');
const cardCom = require("./card/LSEQSCard");
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const LSEQSLogic = require('./LSEQSLogic');

cc.Class({
	extends: cc.Component,
	properties: {

		choseCard: cc.Node,
		choseItem: cc.Prefab,
		choseGroup: cc.Node,
		cardContent: cc.Node,
		chooseNode: cc.Node,
		buttonLayout: cc.Node,

		baiItem: cc.Prefab,
		light: cc.Node,

		btn_hu: cc.Node,
		btn_chi: cc.Node,
		btn_dui: cc.Node,
		btn_kai: cc.Node,
		btn_guo: cc.Node,
		spine_hu: sp.Skeleton,
		spine_chi: sp.Skeleton,
		spine_dui: sp.Skeleton,
		spine_kai: sp.Skeleton,
		spine_guo: sp.Skeleton,

		_selectOptType: null,
		_optCard: null, //操作的牌
		_optData: null,
		_isInit: false,
		_operateList: null,
		_baiNodeList: [], //摆牌节点列表
	},

	init() {
		if (this._isInit) return
		this._isInit = true
		this.buttonLayout.children.forEach(btn => {
			btn.on("click", this.onButtonClick, this)
		});
		this.choseCard.getChildByName("btn_close").on("click", this.onButtonClick, this)
		this.setSpineListener(this.spine_hu, "hu1", "hu2")
		this.setSpineListener(this.spine_chi, "chi1", "chi2")
		this.setSpineListener(this.spine_dui, "dui1", "dui2")
		this.setSpineListener(this.spine_kai, "kai1", "kai2")
		this.setSpineListener(this.spine_guo, "guo1", "guo2")
		cc.systemEvent.on(LSEQSModel.MSG_BAI_ITEM_CLICK, this.onItemClick1, this)
		cc.systemEvent.on(LSEQSModel.MSG_BAI_ITEM_CLICK1, this.onItemClick2, this)
	},

	onDestroy() {
		cc.systemEvent.off(LSEQSModel.MSG_BAI_ITEM_CLICK, this.onItemClick1, this)
		cc.systemEvent.off(LSEQSModel.MSG_BAI_ITEM_CLICK1, this.onItemClick2, this)
	},

	gameInit(data) {
		this.reset()
		this.onGameTurn(data)
	},

	onGameTurn(data) {
		this._optData = data
		this._operateList = data.operateList || []
		this._optCard = data.card;
		if (data.plusInfo) {
			LSEQSModel.setLimitCard(data.plusInfo.limitCard)
		} else {
			LSEQSModel.setLimitCard(null)
		}
		// console.log("设置按钮", data, this._operateList)
		this.updateBtn(data.operateArray);
	},

	/**更新按钮 */
	updateBtn(operateArray) {
		if (!operateArray || operateArray.length == 0) {
			this.buttonLayout.active = false
			return
		}
		this.buttonLayout.active = true
		this.btn_chi.active = operateArray.includes(ApiLseqs.operateType.CHI)
		if (this.btn_chi.active) this.showOpt(this.spine_chi, "chi1", false)
		this.btn_guo.active = operateArray.includes(ApiLseqs.operateType.GUO)
		if (this.btn_guo.active) this.showOpt(this.spine_guo, "guo1", false)
		this.btn_hu.active = operateArray.includes(ApiLseqs.operateType.HU)
		if (this.btn_hu.active) this.showOpt(this.spine_hu, "hu1", false)
		this.btn_dui.active = operateArray.includes(ApiLseqs.operateType.DUI)
		if (this.btn_dui.active) this.showOpt(this.spine_dui, "dui1", false)
		this.btn_kai.active = operateArray.includes(ApiLseqs.operateType.KAI)
		if (this.btn_kai.active) this.showOpt(this.spine_kai, "kai1", false)
	},

	/**清理摆牌界面 */
	clearBaiNode() {
		this._baiNodeList.forEach(node => {
			node.destroy()
		})
		this._baiNodeList = []
	},

	reset() {
		this.buttonLayout.active = false
		this.choseCard.active = false
		this._optData = null
		this._operateList = null
		this._optCard = null
		this._selectOptType = null
		this.clearBaiNode()
		this.light.active = false
	},

	onButtonClick(btn) {
		// console.log("按钮响应===", btn.node.name)
		switch (btn.node.name) {
			case "btn_chi":
				this.clearBaiNode()
				this.showSelectCardView(ApiLseqs.operateType.CHI, btn.node)
				break;
			case "btn_dui":
				this._selectOptType = ApiLseqs.operateType.DUI
				this.onItemClick()
				break;
			case "btn_kai":
				this._selectOptType = ApiLseqs.operateType.KAI
				this.onItemClick()
				break;
			case "btn_hu":
				// console.log("点击了胡")
				ApiRoom.gameMessageNotify(ApiLseqs.gameOperateNotify(ApiLseqs.operateType.HU, this._optCard));
				break;
			case "btn_guo":
				// console.log("点击了过")
				ApiRoom.gameMessageNotify(ApiLseqs.gameOperateNotify(ApiLseqs.operateType.GUO));
				break;
			case "btn_close":
				if (this._baiNodeList.length > 0) {
					let node = this._baiNodeList.pop()
					if (cc.isValid(node)) {
						node.destroy()
					}
				} else { this.choseCard.active = false }
				break;
			default:
				break;
		}
	},



	/**展示选择界面 */
	showSelectCardView(optType, clickNode) {
		let infoList = this._operateList.filter(p => p.operate == optType)
		if (!infoList || infoList.length == 0) {
			// console.log("没有plus信息", optType)
			return
		}
		let chooseAni = () => {
			this.chooseNode.scale = 0
			this.chooseNode.stopAllActions()
			cc.tween(this.chooseNode).delay(0.05).to(0.1, {
				scale: 1
			}).start()
		}
		if (this._selectOptType === optType) {
			this.choseCard.active = true;
			chooseAni()
			return;
		}
		// console.log("展示的选择界面==", infoList)
		let pos = CCUtil.postionConvert(clickNode, this.choseCard)
		pos.y += 100
		this.chooseNode.setPosition(pos)
		this._selectOptType = optType;
		this.cardContent.removeAllChildren()
		for (let j = 0; j < infoList.length; j++) {
			const info = infoList[j];
			let cardList = info.cardList
			let group = cc.instantiate(this.choseGroup)
			group.getComponent(cc.Layout).spacingY = LSEQSModel.LAY_COUNT[cardList.length]
			group.parent = this.cardContent
			for (let i = 0; i < cardList.length; i++) {
				const cardId = cardList[i];
				let card = cc.instantiate(this.choseItem)
				let com = card.addComponent(cardCom)
				com.init()
				com.flower = cardId
				// console.log("牌==", cardId)
				card.parent = group
			}
			group.name = j + ""
			group.on("click", this.onItemClick, this)
		}

		this.choseCard.active = true;
		chooseAni()
	},

	/**展示摆牌选择界面 */
	showBaiPaiView(idx, baiList, isTwo = false) {
		if (isTwo && this._baiNodeList.length == 2) {
			let node = this._baiNodeList.pop()
			if (cc.isValid(node)) {
				node.destroy()
			}
		} else if (!isTwo) this.clearBaiNode()
		let convertNode = this.cardContent
		if (isTwo) {
			convertNode = this._baiNodeList[0].getComponent("LSEQSBaiItem").getCardContent()
		}
		let pos = CCUtil.postionConvert(convertNode, this.choseCard)
		if (isTwo) {
			pos.x -= (convertNode.width + 20)
		} else pos.x -= (convertNode.width / 2 + 20)
		let baiNode = cc.instantiate(this.baiItem)
		baiNode.parent = this.choseCard
		baiNode.setPosition(pos)
		baiNode.getComponent("LSEQSBaiItem").init(idx, baiList, this._baiNodeList.length + 1)
		this._baiNodeList.push(baiNode)
	},

	/**选中响应 */
	onItemClick(btn) {
		/**发送消息 */
		let idx = 0
		if (btn && btn.node) {
			idx = parseInt(btn.node.name);
			/**设置选中光位置 */
			let lpos = CCUtil.postionConvert(btn.node, this.node)
			this.light.setPosition(lpos)
			this.light.scale = btn.node.scale
			this.light.active = true
			this.light.height = btn.node.height + 40
			this.light.width = btn.node.width + 40
		}
		let infoList = this._operateList.filter(p => p.operate == this._selectOptType)
		let baiPai = null
		if (infoList[idx].baiList) {
			let baiList = infoList[idx].baiList
			if (baiList.length >= 1) {
				/**展示摆牌选择界面 */
				this.showBaiPaiView(idx, baiList)
				return
			}
		}
		let list = infoList[idx].cardList;
		let card = this._optCard
		ApiRoom.gameMessageNotify(ApiLseqs.gameOperateNotify(this._selectOptType, card, list, baiPai));
		this.reset()
	},

	/**摆牌选择响应 */
	onItemClick1(idx, idxBai) {
		let infoList = this._operateList.filter(p => p.operate == this._selectOptType)
		let baiPai = infoList[idx].baiList[idxBai]
		let list = infoList[idx].cardList;
		let card = this._optCard
		this._list = Utils.deepCopy(list)
		this._baiPai = Utils.deepCopy(baiPai)

		/**检查是不是有第二层摆牌 */
		/**先把card从list里面删掉 */
		let cardIdx = list.indexOf(card)
		let copyList = Utils.deepCopy(list)
		if (cardIdx != -1) {
			copyList.splice(cardIdx, 1)
		}
		let myHandCards = LSEQSModel.getHandCards(LSEQSModel.getMyUID(), false)
		/**把copyList和baipai里面的牌从手牌里面删掉 */
		LSEQSLogic.delIds(copyList, myHandCards)
		LSEQSLogic.delIds(baiPai, myHandCards)
		let baiList2 = LSEQSLogic.checkChiAllList(card, myHandCards) //检查是否有第二层摆牌
		console.log("第二层摆牌==", baiList2, copyList, myHandCards, baiPai)
		if (baiList2.length > 0 && myHandCards.includes(card)) {
			this.showBaiPaiView(idx, baiList2, true)
		} else {
			ApiRoom.gameMessageNotify(ApiLseqs.gameOperateNotify(this._selectOptType, card, list, [baiPai]));
			this.reset()
		}
	},

	/**第二层摆牌点击响应 */
	onItemClick2(baiList) {
		let card = this._optCard
		ApiRoom.gameMessageNotify(ApiLseqs.gameOperateNotify(this._selectOptType, card, this._list, [this._baiPai, baiList]));
		this.reset()
	},

	/**展示操作动画 */
	showOpt(optSpine, aniName, loop = false) {
		let track = Utils.getRandomNum(0, 10)
		optSpine.node.active = true
		optSpine.setSkin('default');
		optSpine.timeScale = 1
		optSpine.setAnimation(track, aniName, loop)
	},

	setSpineListener(sp, name1, name2) {
		sp.setCompleteListener((trackEntry, loopCount) => {
			if (trackEntry.animation.name == name1) {
				this.showOpt(sp, name2, true)
			}
		});
	}

});