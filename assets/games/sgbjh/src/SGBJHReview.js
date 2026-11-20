const CCUtil = require('../../../src/utils/CCUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');

cc.Class({
	extends: cc.Component,
	properties: {
		itemNode: cc.Node,
		layout: cc.Node,
		bureau: cc.Label,
		cardTypePfb: cc.Prefab,
	},

	onLoad() {
		this.curIndex = 0;
		this.list = this.node.nodeParams.list;
		this.refrushLayout();
	},

	refrushLayout() {
		this.bureau.string = this.curIndex + 1;
		let dataArray = this.list[this.curIndex];
		for (let node of this.layout.children) {
			node.destroy();
		}
		for (let i = 0; i < dataArray.length; ++i) {
			let data = dataArray[i];
			let node = cc.instantiate(this.itemNode);
			node.active = true;
			cc.find('bg1', node).active = (i % 2 == 0);
			cc.find('bg2', node).active = (i % 2 == 1);
			for (let j = 0; j < data.endCards.length; ++j) {
				let cardNode = cc.find('card' + (j + 1), node);
				AssetsManager.loadSpriteFrame({
					path: 'sprite/cards/' + data.endCards[j],
					sprite: cardNode.getComponent(cc.Sprite)
				});
			}

			let ct = cc.find('cardtype', node)
			let typeNode = cc.instantiate(this.cardTypePfb)
			typeNode.parent = ct
			typeNode.scale = 0.4
			let com = typeNode.getComponent('SGBJHCardType')
			com.init()
			let p = data.useCardType
			let types = [p.sanGongType, p.jinHuaType]
			com.showCardType(types, p.sanGongPoint, i)
			let stateNode = cc.find('state', node);
			let stateUrl = 'res/sprite/robbank/' + data.rob
			AssetsManager.loadSpriteFrame({
				path: stateUrl,
				sprite: stateNode.getComponent(cc.Sprite),
				bundle: Enums.bundleType.SGBJH
			});
			cc.find('pour', node).getComponent(cc.Label).string = data.pourScore;
			if (data.winScore > 0) {
				let winNode = cc.find('win', node);
				winNode.active = true;
				winNode.getComponent(cc.Label).string = '+' + parseInt(data.winScore);
			} else {
				let loseNode = cc.find('lose', node);
				loseNode.active = true;
				loseNode.getComponent(cc.Label).string = parseInt(data.winScore);
			}
			AssetsManager.loadSpriteFrame({
				path: data.avatar,
				sprite: cc.find('avatar', node).getComponent(cc.Sprite)
			});
			cc.find('name', node).color = i % 2 == 0 ? cc.color(255, 255, 255) : cc.color(255, 255, 255);
			cc.find('name', node).getComponent(cc.Label).string = CCUtil.stringClamp(data.nickname, 6, '..');;
			cc.find('id', node).getComponent(cc.Label).string = "ID:" + data.uid
			cc.find('id', node).color = cc.find('name', node).color
			cc.find('banker', node).active = data.isBanker;
			node.parent = this.layout;
		}
	},

	onLeftClick() {
		--this.curIndex;
		if (this.curIndex < 0) {
			this.curIndex = this.list.length - 1;
		}
		this.refrushLayout();
	},

	onRightClick() {
		++this.curIndex;
		if (this.curIndex >= this.list.length) {
			this.curIndex = 0;
		}
		this.refrushLayout();
	},

	onClose() {
		this.node.destroy();
	},
});