const ApiNnWjy = require('./ApiNnWjy');
const NNWjyModel = require('./NNWjyModel');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const { Def_Nnwjy } = require('../../../src/const/Defines');
const ConfigModel = require('../../../src/model/ConfigModel');

cc.Class({
	extends: cc.Component,
	properties: {
		itemNode: cc.Node,
		layout: cc.Node,
		bureau: cc.Label,
	},

	onLoad() {
		this.curIndex = 0;
		this.list = this.node.nodeParams.list;
		this.refrushLayout();
	},

	refrushLayout() {
		this.bureau.string = this.curIndex + 1;
		let dataArray = this.list[this.curIndex];
		for (let node of this.layout.children) node.destroy();
		for (let i = 0; i < dataArray.length; ++i) {
			let data = dataArray[i];
			// console.log("回放", data)
			if (!data || !data.cards || data.cards.length != 6) continue;
			let node = cc.instantiate(this.itemNode);
			node.active = true;
			cc.find('bg1', node).active = (i % 2 == 0);
			cc.find('bg2', node).active = (i % 2 == 1);
			let ruffianTradeCards = data.ruffianTradeCards
			for (let j = 0; j < data.cards.length; ++j) {
				let cardNode = cc.find('card' + (j + 1), node);
				let qiBar = cc.find('qi', cardNode);
				let maskBar = cc.find('mask', cardNode);
				let cardData = data.cards[j];
				qiBar.active = !!data.endTypeCards && (data.endTypeCards.qiCards == cardData);
				maskBar.active = !!data.endTypeCards && (data.endTypeCards.qiCards == cardData);
				AssetsManager.loadSpriteFrame({
					path: ConfigModel.getCardUrl(cardData),
					sprite: cardNode.getComponent(cc.Sprite)
				});
				/**添加赖子标记 */
				if (ruffianTradeCards && Array.isArray(ruffianTradeCards) && ruffianTradeCards.length > 0 && ruffianTradeCards.includes(cardData)) {
					this.showGhostIcon(cardNode)
				}
			}
			AssetsManager.loadSpriteFrame({
				path: this.getTypeUrl(data.cardType, data.cards),
				sprite: cc.find('layout/cardtype', node).getComponent(cc.Sprite),
				bundle: Enums.bundleType.WJYNN
			});
			let beishu = cc.find("layout/beishu", node).getComponent(cc.Label)
			if (data.ScaleByType && data.cardType != Def_Nnwjy.cardsType.MEINIU) {
				beishu.node.active = true
				beishu.string = "x" + data.ScaleByType
			} else {
				beishu.node.active = false
			}

			let stateNode = cc.find('state', node);
			let stateUrl = 'res/sprite/' + ['buqiang', 'qiang1', 'qiang2', 'qiang3', 'qiang4'][data.rob || 0];
			AssetsManager.loadSpriteFrame({
				path: stateUrl,
				sprite: stateNode.getComponent(cc.Sprite),
				bundle: Enums.bundleType.WJYNN
			});
			// cc.find('pour', node).getComponent(cc.Label).string = `下注:${Utils.formatNumberWithDecimal(data.pourScore)}`;
			cc.find('pour', node).getComponent(cc.Label).string = '下注:' + Utils.formatNumberWithDecimal(data.pourScore, 3);
			if (data.winScore > 0) {
				let winNode = cc.find('win', node);
				winNode.active = true;
				winNode.getComponent(cc.Label).string = '+' + Utils.formatNumberWithDecimal(data.winScore, 2);
			} else {
				let loseNode = cc.find('lose', node);
				loseNode.active = true;
				loseNode.getComponent(cc.Label).string = Utils.formatNumberWithDecimal(data.winScore, 2);
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

	/**展示癞子标志 */
	showGhostIcon(cardNode) {
		/**在牌上显示癞子标志 */
		let laizi = new cc.Node("laizi")
		laizi.name = "laizi"
		laizi.zIndex = 100
		let sp = laizi.addComponent(cc.Sprite)
		AssetsManager.loadSpriteFrame({
			path: "res/sprite/laizi",
			sprite: sp,
			bundle: Enums.bundleType.WJYNN
		});
		laizi.x = -50
		laizi.y = -40
		laizi.parent = cardNode
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

	getTypeUrl(type, cards) {
		let url = 'res/sprite/';
		if (type == Def_Nnwjy.cardsType.MEINIU) {
			url += 'wuniu';
		} else if (type == Def_Nnwjy.cardsType.YOUNIU) {
			let num = NNWjyModel.getNNLogic().getNiuNumber(cards);
			url += ['wuniu', 'niu1', 'niu2', 'niu3', 'niu4', 'niu5', 'niu6', 'niu7', 'niu8', 'niu9', 'niuniu'][num];
		} else if (type == Def_Nnwjy.cardsType.NIUNIU) {
			url += 'niuniu';
		} else if (type == Def_Nnwjy.cardsType.SHUNZINIU) {
			url += 'shunziniu';
		} else if (type == Def_Nnwjy.cardsType.YINNIU) {
			url += 'yinniu';
		} else if (type == Def_Nnwjy.cardsType.TONGHUANIU) {
			url += 'tonghuaniu';
		} else if (type == Def_Nnwjy.cardsType.WUHUANIU) {
			url += 'wuhuaniu';
		} else if (type == Def_Nnwjy.cardsType.HULUNIU) {
			url += 'huluniu';
		} else if (type == Def_Nnwjy.cardsType.WUXIAONIU) {
			url += 'wuxiaoniu';
		} else if (type == Def_Nnwjy.cardsType.ZHADANNIU) {
			url += 'zhadanniu';
		} else if (type == Def_Nnwjy.cardsType.YITIAOLONG) {
			url += 'yitiaolong';
		} else if (type == Def_Nnwjy.cardsType.TONGHUASHUN) {
			url += 'tonghuashun';
		}
		return url;
	},
});