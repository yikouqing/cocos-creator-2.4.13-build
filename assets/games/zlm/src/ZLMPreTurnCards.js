const CCUtil = require('../../../src/utils/CCUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');

cc.Class({
	extends: cc.Component,
	properties: {},

	onLoad() {},

	init(list) {
		for (let node of cc.find('Layout', this.node).children) {
			node.destroy();
		}
		let item = cc.find('Item', this.node);
		for (let i = list.length - 1; i >= 0; --i) {
			let data = list[i];
			let node = cc.instantiate(item);
			node.parent = cc.find('Layout', this.node);
			node.active = true;
			AssetsManager.loadSpriteFrame({
				path: data.avatar,
				sprite: cc.find('head', node).getComponent(cc.Sprite)
			});
			cc.find('name', node).getComponent(cc.Label).string = data.name;
			if (data.cards) {
				let cardItem = cc.find('card', node);
				for (let card of data.cards) {
					let cardNode = cc.instantiate(cardItem);
					cardNode.parent = cc.find('Layout', node);
					cardNode.active = true;
					cardNode.y = 0;
					AssetsManager.loadSpriteFrame({
						path: 'sprite/cards/' + card,
						sprite: cardNode.getComponent(cc.Sprite)
					});
				}
			} else {
				cc.find('label', node).active = true;
			}
		}
		this.node.active = true;
	},

	onClose() {
		this.node.active = false;
	},
});