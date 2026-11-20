const ApiRoom = require('../../../src/api/ApiRoom');
const ApiMnPdk = require('./ApiMnPdk');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const UserModel = require('../../../src/model/UserModel');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const MessageCallback = require('../../../src/utils/MessageCallback');

cc.Class({
	extends: cc.Component,

	properties: {
		lostNode: cc.Node,
		winNode: cc.Node,
		btnNode: cc.Node,
		listNode: cc.Node
	},

	start() {
		MessageCallback.addListener('RemoveGameResult', this);
		this.tick = 30;
		// console.log('结算包数据', this.node.nodeParams);
		let resultData = this.node.nodeParams.resultData;
		let myChairID = this.node.nodeParams.myChairID;
		if (resultData.winChairID === myChairID) { // 播放音效
			AssetsManager.playEffect({
				path: "res/audio/main/sound_win",
				bundle: Enums.bundleType.MNPDK
			});
		} else {
			AssetsManager.playEffect({
				path: "res/audio/main/sound_lose",
				bundle: Enums.bundleType.MNPDK
			});
		}
		this.showAnimation(resultData.winChairID === myChairID);
		if (resultData.winChairID === myChairID) {
			this.lostNode.active = false;
			this.winNode.active = true;
		} else {
			this.lostNode.active = true;
			this.winNode.active = false;
		}

		let item = cc.find('Item', this.node);
		let nicks = resultData.nicknameArr;
		let allCardArr = resultData.allCardArr;
		let handCardArr = resultData.allHandCards;
		if (!nicks) return;
		for (let i = 0; i < nicks.length; ++i) {
			if (!nicks[i]) continue;
			let itemNode = cc.instantiate(item);
			itemNode.parent = this.listNode;
			itemNode.active = true;
			let nameLabel = cc.find('name', itemNode).getComponent(cc.Label);
			nameLabel.string = Utils.convertNickname(resultData.nicknameArr[i]);
			let idLabel = cc.find('id', itemNode).getComponent(cc.Label);
			let id = resultData.idArr[i] || ""
			// idLabel.string = 'ID:' + (id != UserModel.getData("uid") ? Utils.stringSecurity(id) : id);
			idLabel.string = 'ID:' + id;
			let headSprite = cc.find('head', itemNode).getComponent(cc.Sprite);
			AssetsManager.loadSpriteFrame({
				path: resultData.headArr[i],
				sprite: headSprite
			});

			/**庄家图标
			 *
			 let guChunInfo = {
				  guChunStatus: this.guChunStatus,
				  guChunChairID: this.guChunChairID,
				  bankerChairID: this.bankerChairID
			 }
			 */
			let banker = cc.find("banker", itemNode)
			banker.active = resultData.guChunInfo.bankerChairID === i

			/**鼓和拉的图标 */
			if ((resultData.guChunInfo.guChunStatus === ApiMnPdk.guChunStatus.GU_CHUN ||
				resultData.guChunInfo.guChunStatus === ApiMnPdk.guChunStatus.PULL_BACK) &&
				resultData.guChunInfo.guChunChairID >= 0) {
				let gu = cc.find("gu", itemNode)
				gu.active = resultData.guChunInfo.guChunChairID === i
				if (resultData.guChunInfo.guChunStatus === ApiMnPdk.guChunStatus.PULL_BACK) {
					let la = cc.find("la", itemNode)
					la.active = resultData.guChunInfo.bankerChairID === i
				}
			}

			/**显示手牌 */
			let card = cc.find('Card', itemNode);
			for (let j = 0; j < handCardArr[i].length; ++j) {
				let handCardTemp = handCardArr[i];
				let cards = handCardTemp[j].concat([0]);
				let leftCards = allCardArr[i];
				for (let k = 0; k < cards.length; ++k) {
					let cardNode = cc.instantiate(card);
					cardNode.active = true;
					cardNode.y = 0;
					if (cards[k] == 0 || !cards[k]) continue;
					AssetsManager.loadSpriteFrame({
						path: 'sprite/cards/' + cards[k],
						sprite: cardNode.getComponent(cc.Sprite)
					});
					cardNode.color = leftCards.indexOf(cards[k]) == -1 ? cc.Color.GRAY : cc.Color.WHITE;
					this.scheduleOnce(() => {
						cardNode.parent = cc.find('Layout', itemNode);
					}, 0.1)
				}
			}
			let gold = resultData.winArr[i];
			if (gold > 0) {
				let winLabel = cc.find('win', itemNode).getComponent(cc.Label);
				winLabel.node.active = true;
				winLabel.string = '+' + gold;
			} else {
				let loseLabel = cc.find('lose', itemNode).getComponent(cc.Label);
				loseLabel.node.active = true;
				loseLabel.string = gold;
			}

			let restLabel = cc.find('rest', itemNode).getComponent(cc.Label);
			restLabel.string = '剩余牌数：' + resultData.allCardArr[i].length;
			let bombLabel = cc.find('bomb', itemNode).getComponent(cc.Label);
			bombLabel.string = '' + resultData.bombArr[i];
			cc.find('icon', itemNode).active = (resultData.winChairID == i);
		}

		let restCards = resultData.allLeftCards //没有发的牌
		let restLayout = cc.find('Rest/RestCards', this.node);
		let itemcard = cc.find('card', restLayout);
		for (let i = 0; i < restCards.length; i++) {
			const card = restCards[i];
			let node = cc.instantiate(itemcard);
			AssetsManager.loadSpriteFrame({
				path: 'sprite/cards/' + card,
				sprite: node.getComponent(cc.Sprite)
			});
			node.parent = restLayout;
			node.y = 0;
			node.active = true;
		}

		if (this.node.nodeParams.isBureauFull) {
			cc.find('btnNode', this.node).active = false;
			cc.find('ContinueBtn', this.node).active = true;
		} else if (this.node.nodeParams.isReview) {
			cc.find('btnNode', this.node).active = false;
			cc.find('ContinueBtn', this.node).active = false;
		}
	},

	onBtnClick(event, parameters) {

		if (parameters === 'ready') {
			if (!this.node.nodeParams.isBureauFull) {
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify());
				this.node.destroy();
			} else {
				if (this.node.nodeParams.mainDialog.showMNPDKAllResultFuc) {
					this.node.nodeParams.mainDialog.showMNPDKAllResultFuc();
					this.node.destroy();
				}
			}
		} else if (parameters === 'exit') {
			if (this.node.nodeParams.isBureauFull && this.node.nodeParams.mainDialog.showMNPDKAllResultFuc) {
				this.node.nodeParams.mainDialog.showMNPDKAllResultFuc();
			} else if (this.node.nodeParams.mainDialog.gameRule.bureau === 9999) {
				AssetsManager.popDialog({
					content: '确认退出游戏?',
					ok: () => {
						ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
					},
					no: () => { }
				});
			}
			this.node.destroy();
		}
	},

	showAnimation(isWin) {
		{
			let title = null;
			if (isWin) {
				title = this.winNode.getChildByName('titleBg');
			} else {
				title = this.lostNode.getChildByName('titleBg');
			}
			title.scale = 3;
			let action = cc.scaleTo(0.3, 1);
			action.easing(cc.easeIn(3));
			title.runAction(action);
		}
	},

	update(dt) {
		if (this.node.nodeParams.isReview) return
		if (this.node.nodeParams.isDismissing()) return;
		this.tick -= dt;
		let second = Math.floor(this.tick);
		if (second <= 0) {
			cc.find('btnNode/Clock', this.node).active = false;
		} else {
			cc.find('btnNode/Clock/Label', this.node).getComponent(cc.Label).string = second;
		}
	},

	messageCallbackHandler(route, msg) {
		if (route === 'RemoveGameResult') {
			this.node.destroy();
		}
	},

	onDestroy() {
		MessageCallback.removeListener('RemoveGameResult', this);

	},
});