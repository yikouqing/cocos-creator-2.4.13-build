const LYCModel = require('./LYCModel');
const ApiLyc = require('./ApiLyc');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const ConfigModel = require('../../../src/model/ConfigModel');
const Enums = require('../../../src/const/Enums');

cc.Class({
	extends: cc.Component,
	properties: {},

	start() {
		this.node.active = false;
		MessageCallback.addListener('GameMessagePush', this);
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
		this.node.active = true
		// console.log("播放了比牌动画=", fromChairID, toChairID, loseChairID, this.node.active)
		let leftCards = [0, 0]
		let leftUser = LYCModel.getUserByChairID(fromChairID);
		let rightCards = [0, 0]
		let rightUser = LYCModel.getUserByChairID(toChairID);
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
		let failedNode = cc.find('failed', this.node);
		failedNode.setPosition(pos);
		this.showShandian();
		// this.showBoom(() => {
		// 	cc.find('loseleft', this.node).active = fromChairID == loseChairID;
		// 	cc.find('winleft', this.node).active = !cc.find('loseleft', this.node).active;
		// 	cc.find('loseright', this.node).active = toChairID == loseChairID;
		// 	cc.find('winright', this.node).active = !cc.find('loseright', this.node).active;
		// });
		this.scheduleOnce(() => {
			this.node.active = false
		}, 2)
	},

	/**fromChairID: fromChairID,
		toChairID: toChairID,
		winChairID: winChairID,
		toHandCards: toHandCards,
		compareOperateArray */
	messageCallbackHandler(route, msg) {
		if (route === 'GameMessagePush') {
			if (msg.type === ApiLyc.GAME_COMPARE_PUSH) {
				let data = msg.data
				this.compare(data.fromChairID, data.toChairID, -1);
			}
		}
	},

	showBoom(cb) {
		this.node.active = true;
		let failedNode = cc.find('failed', this.node);
		failedNode.active = true;
		let bomNode = cc.find('bom', failedNode);
		bomNode.active = true;
		if (!bomNode.getComponent(cc.Animation)) {
			let animation = bomNode.addComponent(cc.Animation);
			let urls = [];
			for (let i = 1; i <= 8; ++i) {
				urls.push('res/sprite/compare/boom_eff_0' + i);
			}
			AssetsManager.loadAsset({
				path: urls,
				aType: cc.SpriteFrame,
				bundle: Enums.bundleType.LYC
			}, (frames) => {
				if (!frames || !cc.isValid(this.node)) {
					// console.log(urls, 'load error');
					return;
				}
				let clip = cc.AnimationClip.createWithSpriteFrames(frames, 10);
				clip.name = 'boom';
				clip.speed = 0.5;
				animation.addClip(clip);
				animation.play('boom');
			});
		} else {
			bomNode.getComponent(cc.Animation).play('boom');
		}
		AssetsManager.playEffect({
			path: 'res/audio/main/bipai_bomb',
			bundle: Enums.bundleType.LYC
		});
		this.node.runAction(cc.sequence(
			cc.delayTime(1.5),
			cc.callFunc(() => {
				if (cb) cb();
				let animation = bomNode.addComponent(cc.Animation);
				animation.stop('boom');
				bomNode.active = false;
			}),
			cc.delayTime(1.5),
			cc.callFunc(() => {
				this.node.active = false;
			})
		));

		/* this.scheduleOnce(() => {
			this.node.active = false;
		}, 3); */
	},

	showShandian() {
		let sandianNode = cc.find('shandian', this.node);
		sandianNode.active = true;
		if (!sandianNode.getComponent(cc.Animation)) {
			let animation = sandianNode.addComponent(cc.Animation);
			let urls = [];
			for (let i = 1; i <= 6; ++i) {
				urls.push('res/sprite/compare/shandian_0' + i);
			}
			AssetsManager.loadAsset({
				path: urls,
				aType: cc.SpriteFrame,
				bundle: Enums.bundleType.LYC
			}, (frames) => {
				if (!frames || !cc.isValid(this.node)) return;
				let clip = cc.AnimationClip.createWithSpriteFrames(frames, 10);
				clip.name = 'shandian';
				// clip.wrapMode = cc.WrapMode.Loop;
				animation.addClip(clip);
				let anistate = animation.play('shandian');
				anistate.wrapMode = cc.WrapMode.Loop
			});
		} else {
			// sandianNode.getComponent(cc.Animation).play('shandian');
		}
		AssetsManager.playEffect({
			path: 'res/audio/main/bipai_power',
			bundle: Enums.bundleType.LYC
		});
		// this.scheduleOnce(() => {
		// 	sandianNode.active = false;
		// }, 3);
	},

	onDestroy() {
		MessageCallback.removeListener('GameMessagePush', this);
	},
});