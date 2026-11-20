const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const UserModel = require('../../../src/model/UserModel');
const Utils = require('../../../src/utils/Utils');
const Enums = require('../../../src/const/Enums');
const ApiEzgdt = require('./ApiEzgdt');
const MessageCallback = require('../../../src/utils/MessageCallback');
const EZGDTModel = require("./EZGDTModel")

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
		bureauLabel: cc.Label,
		txt_roomInfo: cc.Label,
		txt_gameRule: cc.Label,
		txt_endTime: cc.Label,
	},

	start() {
		this.itemNode.active = false
		this.tick = 0;
		let resBtnNode = cc.find('resBtnNode', this.node);
		let reviewBtnNode = cc.find("reviewBtnNode", this.node);
		console.log('结算包数据', this.node.nodeParams);
		EZGDTModel.gameRule = this.node.nodeParams.gameRule
		if (this.node.nodeParams.isReview) { //视频回放页面隐藏继续按钮
			reviewBtnNode.active = false;
			resBtnNode.active = false;
			this.result = this.node.nodeParams.result
		} else if (this.node.nodeParams.isResult) { //正常结算页面
			reviewBtnNode.active = false;
			resBtnNode.active = true;
			this.bankerUid = this.node.nodeParams.bankerUid
		} else { //战绩回放页面显示左右翻页按钮
			resBtnNode.active = false;
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
			EZGDTModel.gameRule = this.reviewRecord[this.reviewRecord.length - 1].gameRule
			this.bureau = 0;
		}
		this.setRoomInfo()
		if (this.node.nodeParams.isReview || this.node.nodeParams.isResult) {
			this.result = this.node.nodeParams.result
			this.setResultInfo()
		} else {
			this.showResult()
		}
	},

	setRoomInfo() {
		this.txt_roomInfo.string = `房号:${this.node.nodeParams.roomID}`
		this.txt_gameRule.string = EZGDTModel.getRuleStr()
	},

	showResult() {
		this.bureauLabel.string = (this.bureau + 1) + "";
		this.result = this.reviewRecord[this.bureau].result
		this.bankerUid = this.reviewRecord[this.bureau].bankerUid
		this.max_scale = this.reviewRecord[this.bureau].max_scale
		this.robBankList = this.reviewRecord[this.bureau].robBankList
		this.txt_endTime.string = Utils.getDateFormat(this.reviewRecord[this.bureau].endTime).yyyymmddhhmmss
		this.setResultInfo()
	},

	onBtnClick(event, parameters) {

		if (parameters === 'ready') {
			if (!this.node.nodeParams.isBureauFull) {
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify());
				this.node.destroy();
			} else {
				if (this.node.nodeParams.mainDialog.showEZGDTAllResultFuc) {
					this.node.nodeParams.mainDialog.showEZGDTAllResultFuc();
					this.node.destroy();
				}
			}
		} else if (parameters === 'exit') {
			if (this.node.nodeParams.isBureauFull && this.node.nodeParams.mainDialog.showEZGDTAllResultFuc) {
				this.node.nodeParams.mainDialog.showEZGDTAllResultFuc();
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
				bundle: EZGDTModel.getBundleType()
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
		let com = card.addComponent('EZGDTCard')
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

			cc.find("banker", itemNode).active = id == this.bankerUid

			/**手牌 */
			let cardsInfo = Utils.deepCopy(info.cardsInfo)
			let Layout = cc.find("Layout", itemNode)
			let bianId = EZGDTModel.getBianCard(cardsInfo.cards, cardsInfo.handCards)
			let cardArr = bianId.length > 0 ? cardsInfo.handCards : cardsInfo.cards
			for (let i = 0; i < cardArr.length; i++) {
				let cardId = cardArr[i]
				let com = this.getNewCard(cardId)
				if (bianId.includes(cardId)) {
					com.updateFlowerLai(cardId)
				} else { com.flower = cardId }
				com.node.parent = Layout
			}

			/**牌型 */
			let { type, point } = EZGDTModel.changeTypeAndPoint(cardsInfo.type, cardsInfo.point)
			let url = "res/sprite/cardType/" + type + "_" + point
			let typeNode = cc.find("cardType", itemNode)
			AssetsManager.loadSpriteFrame({
				path: url,
				sprite: typeNode.getComponent(cc.Sprite),
				bundle: EZGDTModel.getBundleType(),
			})

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

			let txt_bet = cc.find("txt_bet", itemNode).getComponent(cc.Label)
			if (this.bankerUid == id && this.max_scale) {
				txt_bet.string = `抢庄:${this.max_scale}倍`
			} else if (this.robBankList) {
				if (this.robBankList.length > 0) {
					let robInfo = this.robBankList.find(info => info.uid == id)
					if (robInfo) {
						if (robInfo.isRob == 0) {
							txt_bet.string = `不抢`
						} else
							txt_bet.string = `抢庄:${robInfo.isRob}倍`
					}
				} else {
					txt_bet.string = `未抢庄`
				}
			}

			/**下注 */
			if (this.bankerUid != id && info.userBetScore) {
				if (txt_bet.string != "") {
					txt_bet.string += "\n"
				}
				txt_bet.string += `下注:${info.userBetScore.score}`
			}

			if (myUid == info.uid) {
				cc.find("bg1", itemNode).active = true
			}
		}

		this.showAnimation(isWin)
		this.lostNode.active = !isWin;
		this.winNode.active = isWin;
	},

	/**回放使用的左右按钮 */
	nextResult: function () {

		if (this.bureau + 1 >= this.reviewRecord.length) {
			return;
		}
		++this.bureau;
		this.showResult();
	},

	preResult: function () {

		if (this.bureau - 1 < 0) {
			return;
		}
		--this.bureau;
		this.showResult();
	},
});