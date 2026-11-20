const Utils = require('../../../src/utils/Utils');
const XZModel = require('./XZModel');
cc.Class({
	extends: cc.Component,
	properties: {
		layout1: cc.Node,
		layout2: cc.Node,
		item: cc.Node,
		tilePfb: cc.Prefab,
	},

	showWinCards(canWinList) {
		if (!canWinList || !canWinList.length) {
			return
		}
		let cards = Utils.deepCopy(canWinList)
		this.node.active = true;
		this.layout1.removeAllChildren()
		this.layout2.removeAllChildren()
		this.layout2.active = false
		let idx = -1
		if (cards.length > 14) {
			idx = Math.floor(cards.length / 2)
			this.layout2.active = true
		}

		let maxRate = XZModel.getGameRuleByKey("maxRate")
		for (let i = 0; i < cards.length; i++) {
			const item = cards[i]
			let node = cc.instantiate(this.item);
			node.active = true;
			if (idx > i) {
				node.parent = this.layout2
			} else {
				node.parent = this.layout1;
			}
			node.y = 0
			let lie = cc.instantiate(this.tilePfb)
			lie.parent = cc.find("tile", node)
			let com = lie.addComponent('XZSingleTile')
			com.init();
			com.flower = item.card;

			if (item.getPlusRateType && Array.isArray(item.getPlusRateType)) {
				item.rate = item.rate || 0
				item.getPlusRateType.forEach(info => {
					item.rate += info.rate
				});
			}
			if (maxRate && maxRate < item.rate) {
				item.rate = maxRate
			}
			cc.find('txt_num', node).getComponent(cc.Label).string = item.count + '张';
			cc.find('txt_fan', node).getComponent(cc.Label).string = item.rate + '番';
		}
	},
});