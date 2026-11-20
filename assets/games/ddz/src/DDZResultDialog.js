const ApiRoom = require('../../../src/api/ApiRoom');
const ApiDdz = require('./ApiDdz');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const UserModel = require('../../../src/model/UserModel');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const DDZModel = require('./DDZModel');
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
		MessageCallback.addListener('RemoveGameResult', this);
		let resultData = this.node.nodeParams.resultData;
		this.winNode.active = false;
		this.lostNode.active = false;
		let time = DDZModel.getTick();
		this.tick = time.time || 30;
		if (!resultData.result) return;
		let result = resultData.result;
		let undeals = resultData.allLeftCards || [];
		this.roundLbl.string = `${this.node.nodeParams.curBureau}/${this.node.nodeParams.maxBureau}局`;
		this.showAllResult = this.node.nodeParams.onEnd;
		AssetsManager.loadAsset({
			path: 'res/prefab/DDZResultItem',
			aType: cc.Prefab,
			bundle: Enums.bundleType.DDZ
		}, (item) => {
			if (!item || !cc.isValid(this.listNode)) return;
			for (const user of result) {
				let player = cc.instantiate(item);
				this.listNode.addChild(player);
				player.getComponent('DDZResultItem') && player.getComponent('DDZResultItem').bind(user);
				if (user.uid == UserModel.getData('uid')) {
					if (user.winScores > 0) {
						AssetsManager.playEffect({
							path: "res/audio/main/sound_win",
							bundle: Enums.bundleType.DDZ
						});
						this.lostNode.active = false;
						this.winNode.active = true;
					} else {
						AssetsManager.playEffect({
							path: "res/audio/main/sound_lose",
							bundle: Enums.bundleType.DDZ
						});
						this.lostNode.active = true;
						this.winNode.active = false;
					}
					this.showAnimation(user.winScores > 0);
				}
			}
		});
		AssetsManager.loadAsset({
			path: 'res/prefab/DDZCard',
			bundle: Enums.bundleType.DDZ,
			aType: cc.Prefab
		}, (item) => {
			if (!item || !cc.isValid(this.restNode)) return;
			for (const id of undeals) {
				let card = cc.instantiate(item);
				let cardCtrl = card.getComponent('DDZCard');
				this.restNode.addChild(card);
				cardCtrl.flower = id;
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
			//展示大结算
			DDZModel.setGameRoundEndData();
			if (!this.node.nodeParams.isBureauFull && !DDZModel.getGameEndData()) {
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify());
			} else {
				if (!!DDZModel.getGameEndData() && !!this.showAllResult) {
					this.showAllResult(DDZModel.getGameEndData());
					this.node.destroy();
				}
			}
		} else if (parameters === 'exit') {
			if (!this.node.nodeParams.isReview &&
				!!this.node.nodeParams.isBureauFull &&
				!!DDZModel.getGameEndData() && !!this.showAllResult) {
				//展示大结算
				this.showAllResult(DDZModel.getGameEndData());
			}
			this.node.destroy();
		} else if (parameters === 'back') {
			if (!!DDZModel.getGameEndData() && !!this.showAllResult) {
				//展示大结算
				this.showAllResult(DDZModel.getGameEndData());
			}
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