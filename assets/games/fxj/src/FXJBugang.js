const FXJModel = require('./FXJModel');
const ApiFxj = require('./ApiFxj');
const ApiRoom = require('../../../src/api/ApiRoom');
const FXJLogic = require('./FXJLogic');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');

cc.Class({
	extends: cc.Component,
	properties: {
		select: cc.Node,
		_cardArr: [],
		_isInit: false,
	},

	initRes() {
		if (!this._isInit) {
			this._isInit = true
			this.node.active = false
			if (this.select) this.select.active = false
			for (let i = 0; i < 2; i++) {
				if (this.select) {
					let card = cc.find("tile" + i, this.select)
					let com = card.addComponent('FXJSingleTile')
					com.init()
					card.on("click", this.onBugangSelect, this)
				}

				let card1 = cc.find("tile" + i, this.node)
				let com1 = card1.addComponent('FXJSingleTile')
				com1.init()
			}
		}
	},

	gameInit(data) {
		this.initRes()
		if (data.gameStatus !== ApiFxj.gameStatus.PLAYING) {
			this.node.active = false;
		} else {
			/**恢复房间展示 */
			let buGangCards = data.buGangCards
			this.showBugangCard(buGangCards)
			/**选择状态恢复 */
			let operateArrays = data.operateArrays
			for (let i = 0; i < operateArrays.length; i++) {
				const optlist = operateArrays[i];
				if (optlist && i === FXJModel.getMyChairID() && optlist[0] === ApiFxj.operateType.GANG_CHOOSE) {
					this.select.active = true
				}
			}
		}
	},

	/**展示补杠选择 */
	showSelect(isShow) {
		this.select.active = isShow
	},

	/**展示补杠牌 */
	showBugangCard(cardList, ghostList = null) {
		if (!cardList || cardList.length <= 0) return;
		this.node.active = true
		this._cardArr = cardList
		if (!ghostList) {
			ghostList = FXJLogic.getGhostList()
		}
		for (let i = 0; i < cardList.length; i++) {
			const card = cardList[i];
			let com = cc.find("tile" + i, this.node).getComponent('FXJSingleTile')
			if (com) {
				com.flower = card
				com.setGhostIcon(ghostList.includes(card))
			}
			if (this.select) {
				let com1 = cc.find("tile" + i, this.select).getComponent('FXJSingleTile')
				if (com1) {
					com1.flower = card
					com1.setGhostIcon(ghostList.includes(card))
				}
			}
		}
	},

	/**选中补杠牌 */
	onBugangSelect(btn) {
		let idx = parseInt(btn.node.name.slice(4))
		let value = this._cardArr[idx]
		ApiRoom.gameMessageNotify(ApiFxj.gameOperateNotify(value, ApiFxj.operateType.GANG_CHOOSE));
		this.select.active = false
	},


	onDestroy() {

	},
});