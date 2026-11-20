const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const UserModel = require('../../../src/model/UserModel');
const Utils = require('../../../src/utils/Utils');
const Enums = require('../../../src/const/Enums');
const ApiPtj = require('./ApiPtj');
const MessageCallback = require('../../../src/utils/MessageCallback');
const PTJModel = require("./PTJModel")
const CCUtil = require('../../../src/utils/CCUtil');

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
		let reviewBtnNode = cc.find("reviewBtnNode", this.node);
		let resBtnNode = cc.find('resBtnNode', this.node);
		this.itemNode.active = false;
		reviewBtnNode.active = false;
		resBtnNode.active = false;
		this.tick = 30;

		// console.log('结算包数据', this.node.nodeParams);
		if (this.node.nodeParams.isReview) { //视频回放页面隐藏继续按钮
			this.result = this.node.nodeParams.result;
		} else if (this.node.nodeParams.isResult) { //正常结算页面
			resBtnNode.active = true;
			this.bankerUid = this.node.nodeParams.bankerUid
		} else { //战绩回放页面显示左右翻页按钮
			reviewBtnNode.active = true;
			this.reviewRecord = this.node.nodeParams.reviewRecord;
			if (!this.reviewRecord) {
				this.reviewRecord = this.node.nodeParams.list;
			}
			// console.log("回放数据==", this.reviewRecord)
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
			this.setResultInfo()
		} else {
			this.showResult()
		}
	},

	showResult() {
		this.bureauLabel.string = (this.bureau + 1) + "";
		this.result = this.reviewRecord[this.bureau].result
		this.bankerUid = this.reviewRecord[this.bureau].bankerUid
		this.allLeftCards = this.reviewRecord[this.bureau].allLeftCards
		this.setResultInfo()
	},

	onBtnClick(event, parameters) {
		if (parameters === 'ready') {
			if (!this.node.nodeParams.isBureauFull) {
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify());
				this.node.destroy();
			} else {
				if (this.node.nodeParams.mainDialog.showPTJAllResultFuc) {
					this.node.nodeParams.mainDialog.showPTJAllResultFuc();
					this.node.destroy();
				}
			}
		} else if (parameters === 'exit') {
			if (this.node.nodeParams.isBureauFull && this.node.nodeParams.mainDialog.showPTJAllResultFuc) {
				this.node.nodeParams.mainDialog.showPTJAllResultFuc();
			}
			this.node.destroy();
		}
	},

	showAnimation(isWin) {
		if (this.node.nodeParams.isResult || this.node.nodeParams.isReview) {
			let title = null;
			let url = ""
			if (isWin) {
				url = "res/audio/main/win"
				title = this.winNode.getChildByName('titleBg');

			} else {
				url = "res/audio/main/lose"
				title = this.lostNode.getChildByName('titleBg');
			}
			AssetsManager.playEffect({
				bundle: Enums.bundleType.PTJ,
				path: url,
			});
			if (!title) return;
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
		let com = card.addComponent('PTJSingleTile')
		com.init();
		com.flower = cardId;
		com.setNodeShow(true);
		com.showCover(!cardId);
		return com
	},

	setResultInfo() {
		let isWin = false;
		let gameRule = null;
		this.content.removeAllChildren();
		let resultData = this.result || [];
		let myUid = UserModel.getData("uid");
		// console.log("resultData", resultData)
		for (let i = 0; i < resultData.length; i++) {
			let CurNode = cc.instantiate(this.itemNode);
			CurNode.parent = this.content;
			let CurInfo = resultData[i];
			CurNode.active = !!CurInfo;
			let userId = CurInfo.uid;
			let curRule = CurInfo.gameRule;
			if (curRule) gameRule = curRule;
			let txt_difen = cc.find('txt_difen', CurNode);
			txt_difen.active = curRule && !!curRule.baseScore;
			txt_difen.getComponent(cc.Label).string = `底分:${curRule ? curRule.baseScore : 0}分`;
			cc.find("banker", CurNode).active = userId == this.bankerUid;
			let nameLabel = cc.find('txt_name', CurNode).getComponent(cc.Label);
			nameLabel.string = CCUtil.stringClamp(CurInfo.nickname, 6, '..');
			let idLabel = cc.find('txt_id', CurNode).getComponent(cc.Label);
			idLabel.string = 'ID:' + userId; // idLabel.string = 'ID:' + (id != UserModel.getData("uid") ? Utils.stringSecurity(id) : id);
			let headSprite = cc.find('head', CurNode).getComponent(cc.Sprite);
			AssetsManager.loadSpriteFrame({
				path: CurInfo.avatar,
				sprite: headSprite
			});
			let userBetScore = CurInfo.userBetScore || [];
			let betList = cc.find("betList", CurNode);
			PTJModel.showBetScore(betList, userBetScore, cc.size(100, 60))

			/**手牌 */
			let cardsInfo = CurInfo.cardsInfo;
			let cards = cardsInfo.cards || [];
			let userCards = cards.slice();
			let cardList = cc.find("cardList", CurNode);
			cardList.getComponent(cc.Layout).enabled = true;
			cardList.removeAllChildren();
			userCards.forEach(cardId => {
				let cardCom = this.getNewCard(cardId);
				cardCom.node.parent = cardList;
				cardCom.setNodeSize(70, 150);
				cardCom.showCover(false);
			})
			let poslist = [cc.v2(40, 0), cc.v2(140, 0), cc.v2(280, 40), cc.v2(280, -40)];
			cardList.getComponent(cc.Layout).enabled = false;
			cardList.children.forEach((node, index) => {
				node.angle = index > 1 ? 90 : 0;
				const pos = poslist[index];
				node.setPosition(pos);
			})

			/**牌型 */
			let typeNode1 = cc.find("cardType1", CurNode);
			let typeNode2 = cc.find("cardType2", CurNode);
			typeNode1.active = false;
			typeNode2.active = false;
			PTJModel.showTypeSpr(typeNode1, cardsInfo.oneType, cardsInfo.onePoint, 1);
			if (userCards.length == 4) {
				PTJModel.showTypeSpr(typeNode2, cardsInfo.twoType, cardsInfo.twoPoint, 2);
			}
			/**总输赢 */
			let loseLabel = cc.find('txt_lose', CurNode).getComponent(cc.Label);
			let winLabel = cc.find('txt_win', CurNode).getComponent(cc.Label);
			let winScores = CurInfo.winScores || 0,
				isWinRun = winScores > 0;
			cc.find("icon", CurNode).active = isWinRun;
			winLabel.string = '+' + winScores;
			loseLabel.node.active = !isWinRun;
			winLabel.node.active = isWinRun;
			loseLabel.string = winScores;
			if (isWinRun && myUid == userId) {
				isWin = true;
			}
		}

		if (gameRule) {
			gameRule.baseScore;
		}
		this.lostNode.active = !isWin;
		this.winNode.active = isWin;
		this.showAnimation(isWin);
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