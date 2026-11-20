const SGLogic = require('./SGLogic');
const ApiSg = require('./ApiSg');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const Enums = require('../../../src/const/Enums');

cc.Class({
	extends: cc.Component,
	properties: {
		itemNode: cc.Node,
		layout: cc.Node,
		bureau: cc.Label,
	},

	start() {
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
			// console.log('data.cards.length', data.cards.length)
			for (let j = 0; j < data.cards.length; ++j) {
				let cardNode = cc.find('card' + (j + 1), node);
				AssetsManager.loadSpriteFrame({
					path: 'sprite/cards/' + data.cards[j],
					sprite: cardNode.getComponent(cc.Sprite)
				});
			}
			AssetsManager.loadSpriteFrame({
				path: this.getTypeUrl(data.cards),
				sprite: cc.find('cardtype', node).getComponent(cc.Sprite),
				bundle: Enums.bundleType.SG
			});
			let stateNode = cc.find('state', node);
			if (data.rob == null) {
				stateNode.active = false
			} else {
				let stateUrl = 'res/sprite/' + ((data.rob) ? 'qiangzhuang' : 'buqiang');
				AssetsManager.loadSpriteFrame({
					path: stateUrl,
					sprite: stateNode.getComponent(cc.Sprite),
					bundle: Enums.bundleType.SG
				});
			}
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

	getTypeUrl(cards) {
		let type = SGLogic.getCardsType(cards);
		let url = 'res/sprite/';
		if (type == ApiSg.cardsType.BAOZI) {
			url += 'baozi';
		} else if (type == ApiSg.cardsType.SANGONG) {
			url += 'sangong';
		} else {
			let gong = SGLogic.getGongCount(cards);
			let num = 0;
			for (let card of cards) {
				num = (num + SGLogic.getCardValue(card)) % 10;
			}
			url += ['', 'dangong', 'shuanggong'][gong];
			url += ['lingdian', 'yidian', 'erdian', 'sandian', 'sidian', 'wudian', 'liudian', 'qidian', 'badian', 'jiudian'][num];
		}
		return url;
	},
});