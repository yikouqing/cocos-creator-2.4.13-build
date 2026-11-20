const QJMJModel = require('./QJMJModel');

cc.Class({
	extends: cc.Component,
	properties: {
		layout1: cc.Node,
		layout2: cc.Node,
		item: cc.Node,
	},

	onLoad() {
		this.node.active = false;
	},

	showWinCards(cards) {
		// console.log("听牌数据===》", cards)
		this.node.active = true;
		this.layout2.active = false;
		this.layout1.removeAllChildren();
		this.layout2.removeAllChildren();

		let idx = -1
		if (cards.length > 14) {
			idx = Math.floor(cards.length / 2)
			this.layout2.active = true;
		}
		for (let i = 0; i < cards.length; i++) {
			let node = cc.instantiate(this.item);
			const item = cards[i];
			node.active = true;
			if (idx > i) {
				node.parent = this.layout2
			} else {
				node.parent = this.layout1;
			}
			let tile = cc.find("tile", node).addComponent('QJMJSingleTile')
			tile.init();
			tile.flower = item.cardID;
			node.parent.active = true;
			let cardCount = QJMJModel.getRestCardCount(item.cardID);
			cc.find('txt_num', node).getComponent(cc.Label).string = cardCount + '张';
			cc.find('txt_fan', node).getComponent(cc.Label).string = 1 + '番'; //item.rate
		}
		this.node.active = !!cards.length;
	},
});