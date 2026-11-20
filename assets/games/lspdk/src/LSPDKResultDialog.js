const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const UserModel = require('../../../src/model/UserModel');
const Utils = require('../../../src/utils/Utils');
const ApiLSPdk = require('./ApiLSPdk');
const MessageCallback = require('../../../src/utils/MessageCallback');

cc.Class({
	extends: cc.Component,

	properties: {
		lostNode: cc.Node,
		winNode: cc.Node,
		content: cc.Node,
		clock: cc.Node,
		itemNode: cc.Node,
		cardPfb: cc.Prefab,
		txt_time: cc.Label,
		restCardsContent: cc.Node,
		bureauLabel: cc.Label,
	},

	start() {
		MessageCallback.addListener('RemoveGameResult', this);
		this.tick = 0;
		let resBtnNode = cc.find('resBtnNode', this.node);
		let reviewBtnNode = cc.find("reviewBtnNode", this.node);
		if (this.node.nodeParams.isReview) { //视频回放页面隐藏继续按钮
			reviewBtnNode.active = false;
			resBtnNode.active = false;
			this.result = this.node.nodeParams.result
		} else if (this.node.nodeParams.isResult) { //正常结算页面
			reviewBtnNode.active = false;
			resBtnNode.active = true;
			this.tick = this.node.nodeParams.tick;
		} else { //战绩回放页面显示左右翻页按钮
			resBtnNode.active = false;
			reviewBtnNode.active = true;
			this.reviewRecord = this.node.nodeParams.reviewRecord;
			let lastItem = this.reviewRecord[this.reviewRecord.length - 1];
			if (lastItem && !lastItem.result) {
				/* 最后一局未完成，删除 */
				this.reviewRecord.pop();
			}
			this.bureau = 0;
		}

		if (this.node.nodeParams.isReview || this.node.nodeParams.isResult) {
			this.result = this.node.nodeParams.result
			this.allLeftCards = this.node.nodeParams.allLeftCards
			this.hasChuntian = this.node.nodeParams.hasChuntian;
			this.setResultInfo()
		} else {
			this.showResult()
		}
	},

	showResult() {
		this.bureauLabel.string = (this.bureau + 1) + "";
		this.result = this.reviewRecord[this.bureau].result
		this.allLeftCards = this.reviewRecord[this.bureau].allLeftCards
		this.hasChuntian = this.reviewRecord[this.bureau].hasChuntian
		this.setResultInfo()
	},

	onBtnClick(event, parameters) {

		if (parameters === 'ready') {
			if (!this.node.nodeParams.isBureauFull) {
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify());
				this.node.destroy();
			} else {
				if (this.node.nodeParams.mainDialog.showPDKAllResultFuc) {
					this.node.nodeParams.mainDialog.showPDKAllResultFuc();
				}
				this.node.destroy();
			}
		} else if (parameters === 'exit') {
			if (this.node.nodeParams.isBureauFull && this.node.nodeParams.mainDialog.showPDKAllResultFuc) {
				this.node.nodeParams.mainDialog.showPDKAllResultFuc();
			}
			this.node.destroy();
		}
	},

	showAnimation(isWin) {
		if (this.node.nodeParams.isResult || this.node.nodeParams.isReview) {
			let title = null;
			if (isWin) {
				title = this.winNode.getChildByName('titleBg');
			} else {
				title = this.lostNode.getChildByName('titleBg');
			}
			title.scale = 3;
			let action = cc.scaleTo(0.3, 1);
			action.easing(cc.easeIn(3));
			cc.tween(title).then(action).start()
		}
	},

	update(dt) {
		if (this.node.nodeParams.isReview) return
		this.tick -= dt;
		let second = Math.floor(this.tick);
		if (second < 0) { } else {
			this.txt_time.string = second;
		}
	},

	getNewCard(cardId) {
		let card = cc.instantiate(this.cardPfb)
		let com = card.addComponent('LSPDKCard')
		com.init()
		com.flower = cardId
		com.setNodeShow(true)
		return com
	},

	setResultInfo() {

		console.log("setResultInfo", this.result)
		let resultData = this.result
		let isWin = false
		let myUid = UserModel.getData("uid")
		this.content.removeAllChildren()
		for (let i = 0; i < resultData.length; i++) {
			const info = resultData[i];

			let itemNode = cc.instantiate(this.itemNode)
			itemNode.parent = this.content;
			itemNode.active = true;
			let nameLabel = cc.find('txt_name', itemNode).getComponent(cc.Label);
			nameLabel.string = Utils.convertNickname(info.nickname);
			let idLabel = cc.find('txt_id', itemNode).getComponent(cc.Label);
			let id = info.uid
			// idLabel.string = 'ID:' + (id != UserModel.getData("uid") ? Utils.stringSecurity(id) : id);
			idLabel.string = 'ID:' + id;
			let headSprite = cc.find('head', itemNode).getComponent(cc.Sprite);
			AssetsManager.loadSpriteFrame({
				path: info.avatar,
				sprite: headSprite
			});

			/**手牌 */
			let userCards = info.userCards.slice()
			let handCards = info.beginCards.slice()
			let Layout = cc.find("Layout", itemNode)
			for (let j = 0; j < handCards.length; j++) {
				const cardId = handCards[j];
				let idx = userCards.indexOf(cardId)
				if (idx != -1) {
					userCards.splice(idx, 1)
				} else {
					let cardCom = this.getNewCard(cardId)
					cardCom.node.parent = Layout
					cardCom.setGray(true)
				}
			}
			userCards = info.userCards.slice()
			for (let j = 0; j < userCards.length; j++) {
				const cardId = userCards[j];
				let cardCom = this.getNewCard(cardId)
				cardCom.node.parent = Layout
			}

			/**剩余手牌数量 */
			let txt_rest = cc.find("txt_rest", itemNode)
			txt_rest.getComponent(cc.Label).string = `剩余牌数:${info.userCards.length}`

			/**炸弹数量 */
			let txt_boomCount = cc.find("txt_boomCount", itemNode)
			txt_boomCount.getComponent(cc.Label).string = info.userBoomScore || 0
			/**名堂分 */
			let txt_mingtang = cc.find("txt_mingtang", itemNode)
			txt_mingtang.getComponent(cc.Label).string = info.userMingTangScore || 0
			/**总输赢 */
			let gold = info.winScores
			if (gold > 0) {
				let winLabel = cc.find('txt_win', itemNode).getComponent(cc.Label);
				winLabel.node.active = true;
				winLabel.string = '+' + gold;
				if (myUid == info.uid) {
					isWin = true
				}
				cc.find("icon", itemNode).active = true
			} else {
				let loseLabel = cc.find('txt_lose', itemNode).getComponent(cc.Label);
				loseLabel.node.active = true;
				loseLabel.string = gold;
			}
			let userMingTangType = info.userMingTangType || [];
			let str = gold > 0 && !!this.hasChuntian ? "春天" : "";
			userMingTangType.forEach(type => {
				str += " " + ApiLSPdk.mingtangTypeStr[type];
			})
			cc.find("chuntian", itemNode).getComponent(cc.Label).string = str;
		}

		this.showAnimation(isWin)
		this.lostNode.active = !isWin;
		this.winNode.active = isWin;

		/**没有发的牌 */
		let allLeftCards = this.allLeftCards
		this.restCardsContent.removeAllChildren()
		for (let i = 0; i < allLeftCards.length; i++) {
			const cardId = allLeftCards[i];
			let cardCom = this.getNewCard(cardId)
			cardCom.node.parent = this.restCardsContent
		}
	},

	/**回放使用的左右按钮 */
	nextResult() {

		if (this.bureau + 1 >= this.reviewRecord.length) {
			return;
		}
		++this.bureau;
		this.showResult();
	},

	preResult() {

		if (this.bureau - 1 < 0) {
			return;
		}
		--this.bureau;
		this.showResult();
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