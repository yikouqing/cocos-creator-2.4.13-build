const LSEQSModel = require('./LSEQSModel');

cc.Class({
	extends: cc.Component,
	properties: {
		layout: cc.Node,
		txt_sum: cc.Label,
		item: cc.Node,
		tilePfb: cc.Prefab,
		showNode: cc.Node,
	},

	start() {
		this.node.on("click", () => { this.node.active = false }, this)
		cc.systemEvent.on(LSEQSModel.MSG_SHOW_TING_TIPS, this.showWinCards, this)
		cc.systemEvent.on(LSEQSModel.MSG_HIDE_TING_TIPS, this.hideSelf, this)
		this.node.active = false
	},

	onDestroy() {
		cc.systemEvent.off(LSEQSModel.MSG_SHOW_TING_TIPS, this.showWinCards, this)
		cc.systemEvent.off(LSEQSModel.MSG_HIDE_TING_TIPS, this.hideSelf, this)
	},

	hideSelf() {
		this.node.active = false
	},

	showWinCards(del) {
		let tingList = LSEQSModel.getTingListEx(del);
		if (!tingList || tingList.length == 0) {
			this.node.active = false
			return;
		}
		this.node.active = true;
		this.showNode.active = true;
		this.layout.removeAllChildren();
		let sum = 0
		for (let i = 0; i < tingList.length; i++) {
			const item = tingList[i];
			let node = cc.instantiate(this.item);
			node.parent = this.layout;
			node.active = true;
			node.y = 0
			let lie = cc.instantiate(this.tilePfb)
			lie.parent = cc.find("tile", node)
			let com = lie.addComponent('LSEQSCard')
			com.init();
			com.flower = item.cardID;
			let cardCount = LSEQSModel.getRestCardCount(item.cardID);
			sum += cardCount
			cc.find('txt_num', node).getComponent(cc.Label).string = cardCount + '张';
		}
		this.txt_sum.string = sum + ''
	},
});