const ApiDgn = require('./ApiDgn');
const DGNModel = require('./DGNModel');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const Enums = require('../../../src/const/Enums');
const { Def_Dgn } = require('../../../src/const/Defines');

cc.Class({
	extends: cc.Component,
	properties: {
		itemNode: cc.Node,
		layout: cc.Node,
		bureau: cc.Label,
		bank: cc.Label,
	},

	onLoad() {
		this.curIndex = 0;
		this.list = this.node.nodeParams.list;
		this.refrushLayout();
	},

	refrushLayout() {
		/* this.bureau.string = this.curIndex+1; */
		let dataArray = this.list[this.curIndex];
		this.bureau.string = `第${dataArray[0].curBureau}局`;
		this.bank.string = `${dataArray[0].bankerTurn}/${dataArray[0].bankerPourTurn}`;
		for (let node of this.layout.children) {
			node.destroy();
		}
		for (let i = 0; i < dataArray.length; ++i) {
			let data = dataArray[i];
			let node = cc.instantiate(this.itemNode);
			node.active = true;
			cc.find('bg1', node).active = (i % 2 == 0);
			cc.find('bg2', node).active = (i % 2 == 1);
			for (let j = 0; j < data.cards.length; ++j) {
				let cardNode = cc.find('card' + (j + 1), node);
				AssetsManager.loadSpriteFrame({
					path: 'sprite/cards/' + data.cards[j],
					sprite: cardNode.getComponent(cc.Sprite)
				});
			}
			AssetsManager.loadSpriteFrame({
				path: this.getTypeUrl(data.cardType, data.cards),
				bundle: Enums.bundleType.DGN,
				sprite: cc.find('cardtype', node).getComponent(cc.Sprite)
			});
			cc.find('pour', node).getComponent(cc.Label).string = data.pourScore;
			if (data.winScore > 0) {
				let winNode = cc.find('win', node);
				winNode.active = true;
				winNode.getComponent(cc.Label).string = '+' + Utils.formatNumberWithDecimal(data.winScore, 1);
			} else {
				let loseNode = cc.find('lose', node);
				loseNode.active = true;
				loseNode.getComponent(cc.Label).string = Utils.formatNumberWithDecimal(data.winScore, 1);
			}
			AssetsManager.loadSpriteFrame({
				path: data.avatar,
				sprite: cc.find('avatar', node).getComponent(cc.Sprite)
			});
			cc.find('name', node).color = i % 2 == 0 ? cc.color(140, 83, 56) : cc.color(56, 84, 140);
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
		this.node.destroy()
	},

	getTypeUrl(type, cards) {
		let url = 'res/sprite/cardtype/';
		if (type == Def_Dgn.cardsType.MEINIU) {
			url += 'wuniu';
		} else if (type == Def_Dgn.cardsType.YOUNIU) {
			let num = DGNModel.getDGNLogic().getNiuNumber(cards);
			url += ['wuniu', 'niu1', 'niu2', 'niu3', 'niu4', 'niu5', 'niu6', 'niu7', 'niu8', 'niu9', 'niuniu'][num];
		} else if (type == Def_Dgn.cardsType.NIUNIU) {
			url += 'niuniu';
		} else if (type == Def_Dgn.cardsType.SHUNZINIU) {
			url += 'shunziniu';
		} else if (type == Def_Dgn.cardsType.YINNIU) {
			url += 'yinniu';
		} else if (type == Def_Dgn.cardsType.TONGHUANIU) {
			url += 'tonghuaniu';
		} else if (type == Def_Dgn.cardsType.WUHUANIU) {
			url += 'wuhuaniu';
		} else if (type == Def_Dgn.cardsType.HULUNIU) {
			url += 'huluniu';
		} else if (type == Def_Dgn.cardsType.WUXIAONIU) {
			url += 'wuxiaoniu';
		} else if (type == Def_Dgn.cardsType.ZHADANNIU) {
			url += 'zhadanniu';
		} else if (type == Def_Dgn.cardsType.YITIAOLONG) {
			url += 'yitiaolong';
		} else if (type == Def_Dgn.cardsType.TONGHUASHUN) {
			url += 'tonghuashun';
		}
		return url;
	},
});