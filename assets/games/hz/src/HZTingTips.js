const HZModel = require('./HZModel');

cc.Class({
	extends: cc.Component,
	properties: {
		layout1: cc.Node,
		layout2: cc.Node,
		item: cc.Node,
		tilePfb: cc.Prefab,
	},

	showWinCards(cards) {
		// console.log("展示听牌==", cards)
		this.node.active = true;
		this.layout1.removeAllChildren()
		this.layout2.removeAllChildren()
		this.layout2.active = false

		let idx = -1
		if (cards.length > 14) {
			idx = Math.floor(cards.length / 2)
			this.layout2.active = true
		}
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
			let tile = lie.addComponent('HZSingleTile')
			tile.init()
			tile.flower = item.card

			cc.find('txt_num', node).getComponent(cc.Label).string = item.count + '张';
		}
	},
});