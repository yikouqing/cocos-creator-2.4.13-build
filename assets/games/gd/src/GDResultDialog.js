const ApiRoom = require('../../../src/api/ApiRoom');
const ApiGd = require('./ApiGd');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const UserModel = require('../../../src/model/UserModel');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const GDModel = require('./GDModel');
const MessageCallback = require('../../../src/utils/MessageCallback');

cc.Class({
	extends: cc.Component,

	properties: {
		lostNode: cc.Node,
		winNode: cc.Node,
		btnNode: cc.Node,
		btnContinue: cc.Node,
		listNode: cc.Node,
		restNode: cc.Node,
		clock: cc.Node,
		timeLbl: cc.Label,
		roundLbl: cc.Label,
	},

	start() {
		// console.log("创建结束界面", this.node.nodeParams)
		MessageCallback.addListener('RemoveGameResult', this);
		let resultData = this.node.nodeParams.resultData;
		this.winNode.active = false;
		this.lostNode.active = false;
		let time = GDModel.getTick();
		this.tick = time.time || 30;
		if (!resultData.result) return;
		let result = resultData.result;
		let undeals = resultData.allLeftCards || [];
		this.roundLbl.string = `${this.node.nodeParams.curBureau}/${this.node.nodeParams.maxBureau}局`;
		this.showAllResult = this.node.nodeParams.onEnd;

		AssetsManager.loadAsset({
			path: 'res/prefab/GDResultItem',
			aType: cc.Prefab,
			bundle: Enums.bundleType.GD
		}, (item) => {
			if (!item || !cc.isValid(this.listNode)) return;
			for (const user of result) {
				let player = cc.instantiate(item);
				this.listNode.addChild(player);
				player.getComponent('GDResultItem') && player.getComponent('GDResultItem').bind(user);
				if (user.uid == UserModel.getData('uid')) {
					if (user.winScores > 0) {
						AssetsManager.playEffect({
							path: "res/audio/main/sound_win",
							bundle: Enums.bundleType.GD
						});
						this.lostNode.active = false;
						this.winNode.active = true;
					} else {
						AssetsManager.playEffect({
							path: "res/audio/main/sound_lose",
							bundle: Enums.bundleType.GD
						});
						this.lostNode.active = true;
						this.winNode.active = false;
					}
					this.showAnimation(user.winScores > 0);
				}
			}
		});
		AssetsManager.loadAsset({
			path: 'res/prefab/GDCard',
			bundle: Enums.bundleType.GD,
			aType: cc.Prefab
		}, (item) => {
			if (!item || !cc.isValid(this.restNode)) return;
			for (const id of undeals) {
				let card = cc.instantiate(item);
				this.restNode.addChild(card);
				card.getComponent('GDCard') && card.getComponent('GDCard').result(id);
			}
		});

		if (!!this.node.nodeParams.isReview) {
			this.btnNode.active = false;
			this.btnContinue.active = true;
		} else {
			this.btnNode.active = !this.node.nodeParams.isBureauFull;
			this.btnContinue.active = !!this.node.nodeParams.isBureauFull;
		}
	},

	onBtnClick(event, parameters) {
		if (parameters === 'ready') {
			if (!this.node.nodeParams.isBureauFull) {
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify());
			} else {
				if (!!GDModel.getGameEndData() && !!this.showAllResult) {
					//展示大结算
					GDModel.setGameRoundEndData(null);
					this.showAllResult(GDModel.getGameEndData());
					this.node.destroy();
				}
			}
		} else if (parameters === 'exit') {
			if (!this.node.nodeParams.isReview &&
				!!this.node.nodeParams.isBureauFull &&
				!!GDModel.getGameEndData() && !!this.showAllResult) {
				//展示大结算
				GDModel.setGameRoundEndData(null);
				this.showAllResult(GDModel.getGameEndData());
			}

			if (this.node.nodeParams.isReview) {
				this.node.destroy();
			} else {
				if (GDModel.getGameEndData()) {
					this.node.destroy();
				}
			}
		} else if (parameters === 'back') {
			this.node.destroy();
		}
	},

	showAnimation(isWin) {
		this.winNode.stopAllActions();
		this.lostNode.stopAllActions();
		let effect = !!isWin ? this.winNode : this.lostNode;
		effect.scale = 3;
		cc.tween(effect)
			.to(0.3, {
				scale: 1
			}, {
				easing: 'easeIn'
			})
			.start();
	},

	update(dt) {
		if (!!this.node.nodeParams.isReview) return
		this.tick -= dt;
		let second = Math.floor(this.tick);
		if (second <= 0) {
			this.clock.active = false;
		} else {
			this.clock.active = true;
			this.timeLbl.string = second;
		}
	},

	onDestroy() {
		MessageCallback.removeListener('RemoveGameResult', this);
	},

	messageCallbackHandler(route, msg) {
		if (route === 'RemoveGameResult') {
			this.node.destroy();
		}
	},

});