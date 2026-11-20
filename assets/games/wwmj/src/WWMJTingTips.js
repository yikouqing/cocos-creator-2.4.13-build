const WWMJModel = require('./WWMJModel');

cc.Class({
	extends: cc.Component,
	properties: {
		layout1: cc.Node,
		layout2: cc.Node,
		item: cc.Node,
	},

	showWinCards(cards) {
		this.node.active = true;
		this.layout1.removeAllChildren();
		this.layout2.removeAllChildren();
		this.layout2.active = false;
		let idx = -1
		if (cards.length > 14) {
			idx = Math.floor(cards.length / 2)
			this.layout2.active = true;
		}
		for (let i = 0; i < cards.length; i++) {
			const item = cards[i];
			let node = cc.instantiate(this.item);
			node.active = true;
			if (idx > i) {
				node.parent = this.layout2
			} else {
				node.parent = this.layout1;
			}
			let tile = cc.find("tile", node).addComponent('WWMJSingleTile')
			tile.init();
			tile.flower = item.cardID;
			let cardCount = WWMJModel.getRestCardCount(item.cardID);
			cc.find('txt_num', node).getComponent(cc.Label).string = cardCount + '张';
			cc.find('txt_fan', node).getComponent(cc.Label).string = item.rate + '番';
		}
	},
});