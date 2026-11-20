const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const UserModel = require('../../../src/model/UserModel');
const Utils = require('../../../src/utils/Utils');
const Enums = require('../../../src/const/Enums');
const ApiTdk = require('./ApiTdk');
const TDKModel = require("./TDKModel")
const MessageCallback = require('../../../src/utils/MessageCallback');

cc.Class({
	extends: cc.Component,

	properties: {
		lostNode: cc.Node,
		winNode: cc.Node,
		content: cc.Node,
		btn_cancel: cc.Node,
		clock: cc.Node,
		itemNode: cc.Node,
		cardPfb: cc.Prefab,
		txt_time: cc.Label,
		restCardsContent: cc.Node,
		bureauLabel: cc.Label,
	},

	start() {
		MessageCallback.addListener('RemoveGameResult', this);
		this.tick = 30;
		let resBtnNode = cc.find('resBtnNode', this.node);
		let reviewBtnNode = cc.find("reviewBtnNode", this.node);
		// console.log('结算包数据', this.node.nodeParams);
		if (this.node.nodeParams.isReview) { //视频回放页面隐藏继续按钮
			reviewBtnNode.active = false;
			resBtnNode.active = false;
			this.result = this.node.nodeParams.result
		} else if (this.node.nodeParams.isResult) { //正常结算页面
			reviewBtnNode.active = false;
			resBtnNode.active = true;
		} else { //战绩回放页面显示左右翻页按钮
			resBtnNode.active = false;
			reviewBtnNode.active = true;
			this.reviewRecord = this.node.nodeParams.reviewRecord;
			if (!this.reviewRecord) {
				this.reviewRecord = this.node.nodeParams.list;
			}
			// console.log("回放数据==", this.reviewRecord)
			// let lastItem = this.reviewRecord[this.reviewRecord.length - 1];
			// if (lastItem && !lastItem.result) {
			// 	/* 最后一局未完成，删除 */
			// 	this.reviewRecord.pop();
			// }
			this.bureau = 0;
		}

		if (this.node.nodeParams.isReview || this.node.nodeParams.isResult) {
			this.result = this.node.nodeParams.result
			this.setResultInfo()
		} else {
			this.showResult()
		}
	},

	showResult() {
		this.bureauLabel.string = (this.bureau + 1) + "";
		this.result = this.reviewRecord[this.bureau]
		this.setResultInfo()
	},

	onBtnClick(event, parameters) {

		if (parameters === 'ready') {
			if (!this.node.nodeParams.isBureauFull) {
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify());
				this.node.destroy();
			} else {
				if (this.node.nodeParams.mainDialog.showTDKAllResultFuc) {
					this.node.nodeParams.mainDialog.showTDKAllResultFuc();
					this.node.destroy();
				}
			}
		} else if (parameters === 'exit') {
			if (this.node.nodeParams.isBureauFull && this.node.nodeParams.mainDialog.showTDKAllResultFuc) {
				this.node.nodeParams.mainDialog.showTDKAllResultFuc();
			}
			this.node.destroy();
		}
	},

	showAnimation(isWin) {
		if (this.node.nodeParams.isResult || this.node.nodeParams.isReview) {
			let title = null;
			let url = ""
			if (isWin) {
				title = this.winNode.getChildByName('titleBg');
				url = "res/audio/main/win"
			} else {
				title = this.lostNode.getChildByName('titleBg');
				url = "res/audio/main/lose"
			}
			AssetsManager.playEffect({
				path: url,
				bundle: Enums.bundleType.TDK
			});
			title.scale = 3;
			let action = cc.scaleTo(0.3, 1);
			action.easing(cc.easeIn(3));
			title.runAction(action);
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
		let com = card.addComponent('TDKCard')
		com.init()
		com.flower = cardId
		com.setNodeShow(true)
		return com
	},

	setResultInfo() {
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

			cc.find("banker", itemNode).active = info.isBanker

			/**手牌 */
			let userCards = info.cards && info.cards.slice()
			let Layout = cc.find("Layout", itemNode)
			if (userCards && Array.isArray(userCards)) {
				for (let j = 0; j < userCards.length; j++) {
					const cardId = userCards[j];
					let cardCom = this.getNewCard(cardId)
					cardCom.node.parent = Layout
				}
				/**总点数 */
				let sum = TDKModel.getPointSum(userCards)
				let txt_dian = cc.find("txt_dian", itemNode)
				if (txt_dian) {
					txt_dian.getComponent(cc.Label).string = "总点数:" + sum
				}
			}

			/**弃牌 */
			let qipaiNode = cc.find("qipai", itemNode)
			qipaiNode.active = info.operateType == ApiTdk.operateType.CANCEL
			/**烂锅 */
			if (info.isLanGuo) {
				qipaiNode.active = true
				AssetsManager.loadSpriteFrame({
					path: "res/sprite/state/languo",
					sprite: qipaiNode.getComponent(cc.Sprite),
					bundle: Enums.bundleType.TDK
				});
			}

			/**总输赢 */
			let gold = info.winScore
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

			/**下注 */
			if (info.pourScore) {
				let txt_bet = cc.find("txt_bet", itemNode).getComponent(cc.Label)
				txt_bet.string = `下注:${info.pourScore}`
			}
		}

		this.showAnimation(isWin)
		this.lostNode.active = !isWin;
		this.winNode.active = isWin;
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