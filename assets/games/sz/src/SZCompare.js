const SZModel = require('./SZModel');
const ApiSz = require('./ApiSz');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const ConfigModel = require('../../../src/model/ConfigModel');
const Enums = require('../../../src/const/Enums');

cc.Class({
	extends: cc.Component,
	properties: {
		compareSpine: sp.Skeleton
	},

	onLoad() {
		MessageCallback.addListener('RoomMessagePush', this);
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('ReconnectSuccess', this);
		this.compareSpine.setCompleteListener((trackEntry, loopCount) => {
			this.showBoom();
		});
		this.node.active = false;
	},

	setCards(cards, node) {
		for (let i = 0; i < cards.length; ++i) {
			let url = 'sprite/cards/' + cards[i];
			if (cards[i] == 0) {
				url = ConfigModel.getCardUrl();
			}
			let sprite = node.getChildByName('card' + (i + 1)).getComponent(cc.Sprite);
			AssetsManager.loadSpriteFrame({
				path: url,
				sprite: sprite
			});
		}
	},

	compare(fromChairID, toChairID, loseChairID) {
		this.node.active = true;
		this.node.stopAllActions();
		this.fromChairID = fromChairID;
		this.toChairID = toChairID;
		this.loseChairID = loseChairID;
		let leftCards = SZModel.getHandCardsByChairID(fromChairID);
		let leftUser = SZModel.getUserByChairID(fromChairID);
		let rightCards = SZModel.getHandCardsByChairID(toChairID);
		let rightUser = SZModel.getUserByChairID(toChairID);
		let leftCardsNode = cc.find('cardsleft', this.node);
		let rightCardsNode = cc.find('cardsright', this.node);
		this.setCards(leftCards, leftCardsNode);
		this.setCards(rightCards, rightCardsNode);
		cc.find('nameleft', this.node).getComponent(cc.Label).string = leftUser.userInfo.nickname;
		cc.find('nameright', this.node).getComponent(cc.Label).string = rightUser.userInfo.nickname;
		let leftAvatar = leftUser.userInfo.avatar;
		let rightAvatar = rightUser.userInfo.avatar;
		if (!leftAvatar || leftAvatar.length == 0) {
			leftAvatar = "sprite/common/morentouxiang";
		}
		if (!rightAvatar || rightAvatar.length == 0) {
			rightAvatar = "sprite/common/morentouxiang";
		}
		AssetsManager.loadSpriteFrame({
			path: leftAvatar,
			sprite: cc.find('headleft', this.node).getComponent(cc.Sprite)
		});
		AssetsManager.loadSpriteFrame({
			path: rightAvatar,
			sprite: cc.find('headright', this.node).getComponent(cc.Sprite)
		});
		cc.find('loseleft', this.node).active = false;
		cc.find('winleft', this.node).active = false;
		cc.find('loseright', this.node).active = false;
		cc.find('winright', this.node).active = false;
		let pos = leftCardsNode.getPosition();
		if (loseChairID == toChairID) {
			pos = rightCardsNode.getPosition();
		}
		AssetsManager.playEffect({
			path: 'res/audio/main/bipai_power',
			bundle: Enums.bundleType.SZ
		});
		let trackIndex = Math.floor(Math.random() * 10 + 1);
		this.compareSpine.clearTracks();
		this.compareSpine.premultipliedAlpha = false;
		this.compareSpine.timeScale = 1;
		this.compareSpine.setSkin('default');
		this.compareSpine.setAnimation(trackIndex, 'animation', false);
	},

	messageCallbackHandler(route, msg) {
		if (!SZModel.isGameInited(route, msg)) return;
		if (route === 'GameMessagePush') {
			if (msg.type === ApiSz.GAME_COMPARE_PUSH) {
				this.compare(msg.data.fromChairID, msg.data.toChairID, msg.data.loseChairID);
			}
		}
	},

	showBoom() {
		this.node.stopAllActions();
		AssetsManager.playEffect({
			path: 'res/audio/main/bipai_bomb',
			bundle: Enums.bundleType.SZ
		});
		this.node.runAction(cc.sequence(
			cc.delayTime(1.5),
			cc.callFunc(() => {
				cc.find('loseleft', this.node).active = this.fromChairID == this.loseChairID;
				cc.find('winleft', this.node).active = !cc.find('loseleft', this.node).active;
				cc.find('loseright', this.node).active = this.toChairID == this.loseChairID;
				cc.find('winright', this.node).active = !cc.find('loseright', this.node).active;
			}),
			cc.delayTime(1.5),
			cc.callFunc(() => {
				this.node.active = false;
			})
		));
	},

	onDestroy() {
		MessageCallback.removeListener('RoomMessagePush', this);
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('ReconnectSuccess', this);
	},
});