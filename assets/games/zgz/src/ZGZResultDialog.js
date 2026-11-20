const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const UserModel = require('../../../src/model/UserModel');
const Utils = require('../../../src/utils/Utils');
const MessageCallback = require('../../../src/utils/MessageCallback');
const ConfigModel = require('../../../src/model/ConfigModel');
const ZGZModel = require("./ZGZModel")
const ApiZgz = require('./ApiZgz');
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
		gameName: cc.Label,
		roomID: cc.Label,
		ruleLbl: cc.Label,
		time: cc.Label,
		roundLbl: cc.Label,

	},

	start() {
		MessageCallback.addListener('RemoveGameResult', this);
		this.tick = 0;
		let resBtnNode = cc.find('resBtnNode', this.node);
		let reviewBtnNode = cc.find("reviewBtnNode", this.node);

		let bundleObj = ConfigModel.getBundleConfig(Enums.bundleType.ZGZ);
		this.gameName.string = `${bundleObj.name}`;
		if (this.node.nodeParams.isReview) { //视频回放页面隐藏继续按钮
			reviewBtnNode.active = false;
			resBtnNode.active = false;
			this.result = this.node.nodeParams.result
			this.plusInfo = this.node.nodeParams.plusInfo;
		} else if (this.node.nodeParams.isResult) { //正常结算页面
			reviewBtnNode.active = false;
			resBtnNode.active = true;
			this.tick = this.node.nodeParams.tick;
			this.roundLbl.string = `第${this.node.nodeParams.curBureau}/${this.node.nodeParams.maxBureau}局`;
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
			// 房间信息
			this.result = this.node.nodeParams.result
			let gameRule = this.result[0].gameRule
			this.ruleLbl.string = gameRule ? `玩法:${ConfigModel.getRoomRuleShare(gameRule).jiChu}` : ''
			this.roomID.string = this.result[0] ? `房号:${this.result[0].roomID}` : '';
			this.allLeftCards = this.node.nodeParams.allLeftCards || [];
			this.setResultInfo()
		} else {
			this.showResult()
		}
	},

	showResult() {
		this.bureauLabel.string = (this.bureau + 1) + "";
		this.result = this.reviewRecord[this.bureau].result
		let gameRule = this.result[0].gameRule
		this.ruleLbl.string = gameRule ? `玩法:${ConfigModel.getRoomRuleShare(gameRule).jiChu}` : ''
		this.roomID.string = this.result[0] ? `房号:${this.result[0].roomID}` : '';
		this.roundLbl.string = gameRule ? `第${this.bureau + 1}/${gameRule.bureau}局` : '';
		this.allLeftCards = this.reviewRecord[this.bureau].allLeftCards
		this.plusInfo = this.reviewRecord[this.bureau].plusInfo || null;
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

	showAnimation(isWin, winNum) {
		this.winNode.active = isWin;
		this.lostNode.active = !isWin;
		this.lostNode.children.forEach(item => item.active = false);
		let title = null;
		if (isWin) {
			title = this.winNode.getChildByName('win_small_title');
		} else {
			if (winNum == 0) {
				title = this.lostNode.getChildByName('lose_small_titlePing');
			} else {
				title = this.lostNode.getChildByName('lose_small_title');
			}
		}
		if (!title) return;
		title.active = true;
		if (this.node.nodeParams.isResult || this.node.nodeParams.isReview) {
			title.scale = 1.5;
			let action = cc.scaleTo(0.2, 1);
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
		let com = card.addComponent('ZGZCard')
		com.init()
		com.flower = cardId
		com.setNodeShow(true)
		return com
	},

	setResultInfo() {
		let resultData = this.result
		let isWin = false, winNum = 0;
		let myUid = UserModel.getData("uid")
		this.content.removeAllChildren()
		let takingOperate = this.plusInfo ? this.plusInfo.takingOperate : [];
		let userWinStatus = this.plusInfo ? this.plusInfo.userWinStatus : [];
		for (let i = 0; i < resultData.length; i++) {
			const info = resultData[i];
			// 时间
			this.time.string = info.endTime ? `时间:${Utils.getDateFormat(info.endTime).yyyymmddhhmmss}` : '';
			let itemNode = cc.instantiate(this.itemNode)
			itemNode.parent = this.content;
			itemNode.active = true;
			let nameLabel = cc.find('txt_name', itemNode).getComponent(cc.Label);
			nameLabel.string = Utils.convertNickname(info.nickname);
			let idLabel = cc.find('txt_id', itemNode).getComponent(cc.Label);
			let uid = info.uid
			// idLabel.string = 'ID:' + (id != UserModel.getData("uid") ? Utils.stringSecurity(id) : id);
			idLabel.string = 'ID:' + uid;
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
			txt_boomCount.getComponent(cc.Label).string = info.userBoomScore || 0;
			txt_boomCount.active = false;

			/**总输赢 */
			let gold = info.winScores
			if (gold > 0) {
				let winLabel = cc.find('txt_win', itemNode).getComponent(cc.Label);
				winLabel.node.active = true;
				winLabel.string = '+' + gold;
				if (myUid == info.uid) {
					isWin = true
				}
				winNum += 1;
				cc.find("icon", itemNode).active = true
			} else {
				let loseLabel = cc.find('txt_lose', itemNode).getComponent(cc.Label);
				loseLabel.node.active = true;
				loseLabel.string = gold;
			}
			this.nodeRank = cc.find("nodeRank", itemNode);
			this.nodeCard = cc.find("nodeCard", itemNode);
			if (this.nodeRank) {
				let objRank = userWinStatus.find(item => item.uid === uid);
				let uidOpeObj = takingOperate.find(item => item.uid === uid);
				if (uidOpeObj && uidOpeObj.endOperate == ApiZgz.talkType.RENSHU) {
					objRank["status"] = 6;
				};
				this.nodeRank.getComponent(cc.Sprite).spriteFrame = null;
				if (!!objRank && !!objRank.status) {
					AssetsManager.loadSpriteFrame({
						sprite: this.nodeRank.getComponent(cc.Sprite),
						path: `res/rank/rank_${objRank.status}`,
						bundle: Enums.bundleType.ZGZ,
					},);
				};
				this.nodeRank.active = !!objRank;
			}

			if (this.nodeCard) {
				let colorNode = this.nodeCard.getChildByName("colorNode");
				let text_identity = this.nodeCard.getChildByName("text_identity");
				let objOperate = ZGZModel.getBrightInfo(uid, takingOperate);
				text_identity.getComponent(cc.RichText).string = objOperate.str;
				colorNode && colorNode.children.forEach((sonNode, index) => {
					sonNode.getChildByName("show").active = objOperate.seList.includes(index);
				})
				this.nodeCard.active = !!objOperate;
			}
		}
		this.showAnimation(isWin, winNum)

		/**没有发的牌 */
		let allLeftCards = this.allLeftCards || []
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