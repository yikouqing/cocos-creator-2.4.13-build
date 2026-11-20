const SZLogic = require('./SZLogic');
const AssetsManager = require('../../../src/utils/AssetsManager')
const ApiSz = require('./ApiSz');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils')
const CCUtil = require('../../../src/utils/CCUtil');

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
			cc.find('bg1', node).active = i % 2 == 0;
			cc.find('bg2', node).active = i % 2 == 1;
			if (!data.cards) {
				continue;
			}
			for (let j = 0; j < data.cards.length; ++j) {
				let cardNode = cc.find('card' + (j + 1), node);
				AssetsManager.loadSpriteFrame({
					path: 'sprite/cards/' + data.cards[j],
					sprite: cardNode.getComponent(cc.Sprite)
				});
			}
			let cardType = SZLogic.getCardsType(data.cards);
			let urls = ['', 'danzhang', 'duizi', 'shunzi', 'jinhua', 'shunjin', 'baozi'];
			AssetsManager.loadSpriteFrame({
				path: 'res/sprite/' + urls[cardType],
				sprite: cc.find('cardtype', node).getComponent(cc.Sprite),
				bundle: Enums.bundleType.SZ
			});
			let stateNode = cc.find('state', node);
			if (data.winScore < 0) {
				let url = 'res/sprite/bipaishibai';
				if (data.isAbandon) {
					url = 'res/sprite/yiqipai';
				}
				AssetsManager.loadSpriteFrame({
					path: url,
					sprite: stateNode.getComponent(cc.Sprite),
					bundle: Enums.bundleType.SZ
				});
			} else {
				stateNode.active = false;
			}
			cc.find('pour', node).getComponent(cc.Label).string = `下注:${Utils.formatNumberWithDecimal(data.pourScore)}`;
			let xiQianNode = cc.find('xi', node);
			let xiQianLbl = xiQianNode.getComponent(cc.Label);
			if (data.winScore > 0) {
				let winNode = cc.find('win', node);
				winNode.active = true;
				winNode.getComponent(cc.Label).string = '+' + Utils.formatNumberWithDecimal(data.winScore, 1);
				if (data.awardInfo &&
					data.awardInfo.awardTotalScore > 0) {
					let cardTypeName = data.awardInfo.awardType == ApiSz.cardsType.BAOZI ? '豹子' : data.awardInfo.awardType == ApiSz.cardsType.SHUNJIN ? '顺金' : '';
					if (cardTypeName.length > 0) {
						xiQianLbl.string = `${cardTypeName}喜分+${data.awardInfo.awardTotalScore}`;
					}
				}
			} else {
				let loseNode = cc.find('lose', node);
				loseNode.active = true;
				loseNode.getComponent(cc.Label).string = Utils.formatNumberWithDecimal(data.winScore, 1);
				xiQianLbl.string = '';
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