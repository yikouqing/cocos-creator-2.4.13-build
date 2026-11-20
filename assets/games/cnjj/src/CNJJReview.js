const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const UserModel = require('../../../src/model/UserModel');
const Utils = require('../../../src/utils/Utils');
const Enums = require('../../../src/const/Enums');
const ApiCnjj = require('./ApiCnjj');
const CCUtil = require('../../../src/utils/CCUtil');
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
		bureauLabel: cc.Label,

		winbg: cc.Node,
		losebg: cc.Node,

		maiMaItem: cc.Node,
		maContent: cc.Node,
		maiMaNode: cc.Node,
	},

	start() {
		this.itemNode.active = false
		this.maiMaItem.active = false
		this.maiMaNode.active = false
		MessageCallback.addListener('RemoveGameResult', this);
		this.tick = 30;
		let resBtnNode = cc.find('resBtnNode', this.node);
		let reviewBtnNode = cc.find("reviewBtnNode", this.node);
		if (this.node.nodeParams.isReview) { //视频回放页面隐藏继续按钮
			reviewBtnNode.active = false;
			resBtnNode.active = false;
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
			let lastItem = this.reviewRecord[this.reviewRecord.length - 1];
			if (lastItem && !lastItem.result) {
				/* 最后一局未完成，删除 */
				this.reviewRecord.pop();
			}
			this.bureau = 0;
		}

		if (this.node.nodeParams.isReview || this.node.nodeParams.isResult) {
			this.result = this.node.nodeParams.result
			this.bankerUid = this.node.nodeParams.bankerUid
			this.gameRule = this.node.nodeParams.gameRule
			this.seatUser = this.node.nodeParams.seatUser
			this.setResultInfo()
		} else {
			this.showResult()
		}
	},

	showResult() {
		this.bureauLabel.string = (this.bureau + 1) + "";
		this.result = this.reviewRecord[this.bureau].result
		this.bankerUid = this.reviewRecord[this.bureau].bankerUid
		this.gameRule = this.reviewRecord[this.bureau].gameRule
		this.seatUser = this.reviewRecord[this.bureau].seatUser
		this.setResultInfo()
	},

	onBtnClick(event, parameters) {
		if (parameters === 'ready') {
			if (!this.node.nodeParams.isBureauFull) {
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify());
				this.node.destroy();
			} else {
				if (this.node.nodeParams.mainDialog.showAllResultFuc) {
					this.node.nodeParams.mainDialog.showAllResultFuc();
				}
				this.node.destroy();
			}
		} else if (parameters === 'exit') {
			if (this.node.nodeParams.isBureauFull && this.node.nodeParams.mainDialog.showAllResultFuc) {
				this.node.nodeParams.mainDialog.showAllResultFuc();
			}
			this.node.destroy();
		} else if (parameters === "closeMa") {
			this.maiMaNode.active = false
		}
	},

	showAnimation(isWin) {
		if (this.node.nodeParams.isResult || this.node.nodeParams.isReview) {
			let title = null;
			let url = ""
			if (isWin) {
				title = this.winNode.getChildByName('titleBg');
				url = "res/audio/win"
			} else {
				title = this.lostNode.getChildByName('titleBg');
				url = "res/audio/lose"
			}
			AssetsManager.playEffect({
				path: url,
				bundle: Enums.bundleType.CNJJ
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
		let com = card.addComponent('CNJJCard')
		com.init()
		com.setNodeShow(true)
		com.flower = cardId
		return com
	},

	setResultInfo() {
		let resultData = this.result
		let myUid = UserModel.getData("uid")
		this.content.removeAllChildren()

		this.lostNode.active = false
		this.winNode.active = false
		let isWin = false
		let maxPlayerCount = this.gameRule.maxPlayerCount
		for (let i = 0; i < resultData.length; i++) {
			const info = resultData[i];
			if (info.uid == myUid) {
				isWin = info.winScores > 0
			}
		}

		this.winbg.active = isWin
		this.losebg.active = !isWin

		this.winNode.active = isWin;
		this.lostNode.active = !isWin;

		let maiMaList = resultData.filter(info => info.chairID >= maxPlayerCount)


		for (let i = 0; i < resultData.length; i++) {
			const info = resultData[i];
			let id = info.uid
			if (info.chairID < maxPlayerCount) {
				let itemNode = cc.instantiate(this.itemNode)
				/**设置字体颜色 */
				CCUtil.nodeRecursive(itemNode, node => {
					if (node.name != "txt_win" && node.name != "txt_lose" && node.getComponent(cc.Label)) {
						node.color = isWin ? cc.color("#915418") : cc.color("#0C538A")
					}
					if (node.name == "itembgwin") {
						node.active = isWin
					} else if (node.name == "itembglose") {
						node.active = !isWin
					}
				});
				itemNode.parent = this.content;
				itemNode.y = 0
				itemNode.active = true;
				let nameLabel = cc.find('txt_name', itemNode).getComponent(cc.Label);
				nameLabel.string = CCUtil.stringClamp(info.nickname, 5, '..');
				let idLabel = cc.find('txt_id', itemNode).getComponent(cc.Label);
				idLabel.string = 'ID:' + (id != UserModel.getData("uid") ? Utils.stringSecurity(id) : id);
				let headSprite = cc.find('head', itemNode).getComponent(cc.Sprite);
				AssetsManager.loadSpriteFrame({
					path: info.avatar,
					sprite: headSprite
				});

				//查找买了自己的玩家
				let mai = maiMaList.filter(m => m.pourInfo.watchUid == id)
				let btn_ma = cc.find("btn_ma", itemNode)
				if (mai && mai.length > 0) {
					btn_ma.active = true
					btn_ma.on("click", () => {
						this.maiMaNode.active = true
						this.maContent.removeAllChildren()
						for (let m = 0; m < mai.length; m++) {
							const maInfo = mai[m];
							let maNode = cc.instantiate(this.maiMaItem)
							maNode.parent = this.maContent
							maNode.active = true

							let nameLabel = cc.find('txt_name', maNode).getComponent(cc.Label);
							nameLabel.string = CCUtil.stringClamp(maInfo.nickname, 6, '..');
							let headSprite = cc.find('head', maNode).getComponent(cc.Sprite);
							AssetsManager.loadSpriteFrame({
								path: maInfo.avatar,
								sprite: headSprite
							});
							let txt_bet = cc.find("txt_bet", maNode).getComponent(cc.Label)
							txt_bet.string = maInfo.pourInfo.score + ""

							/**总分数 */
							let score = Utils.formatNumberWithDecimal(maInfo.winScores, 1)
							if (score > 0) {
								let txt_winMa = cc.find('txt_win', maNode).getComponent(cc.Label);
								txt_winMa.string = '+' + score;
							} else {
								let txt_loseMa = cc.find('txt_lose', maNode).getComponent(cc.Label);
								txt_loseMa.string = score;
							}
						}
					}, this)
				} else {
					btn_ma.active = false
				}

				/**庄家 */
				let txt_bet = cc.find("txt_bet", itemNode).getComponent(cc.Label)
				if (id == this.bankerUid) {
					txt_bet.string = "堂底:" + Utils.formatNumberWithDecimal(info.guoBaseScore, 1)
				} else {
					let men = this.seatUser.indexOf(id)
					txt_bet.string = `${men + 1}门\n下注:${info.pourInfo.score}`
				}
				cc.find("banker", itemNode).active = id == this.bankerUid

				/**手牌 */
				let userCards = Utils.deepCopy(info.userCards)
				let cardLayout = cc.find("cardLayout", itemNode)
				if (userCards && userCards.length > 0 && cardLayout) {
					for (let i = 0; i < userCards.length; i++) {
						const cid = userCards[i];
						let cardNode = cc.instantiate(this.cardPfb)
						cardNode.parent = cardLayout
						let com = cardNode.addComponent('CNJJCard')
						com.init()
						com.flower = cid
					}
				}

				/**牌型 */
				let cardTypeStr = ""
				let ctype = info.cardsType
				if (ctype.type == ApiCnjj.cardType.DANZHANG) {
					cardTypeStr = ctype.type + "_" + ctype.point
				} else if (ctype.type == ApiCnjj.cardType.DUIZI) {
					cardTypeStr = "2"
				}
				let tNode = cc.find("cardType", itemNode)
				let url = "res/sprite/cardType/" + cardTypeStr
				AssetsManager.loadSpriteFrame({
					path: url,
					sprite: tNode.getComponent(cc.Sprite),
					bundle: Enums.bundleType.CNJJ
				})

				/**总分数 */
				let score = Utils.formatNumberWithDecimal(info.winScores, 1)
				if (score > 0) {
					let txt_win = cc.find('txt_win', itemNode).getComponent(cc.Label);
					txt_win.node.active = true;
					txt_win.string = '+' + score;
					cc.find("icon", itemNode).active = true
				} else {
					let txt_lose = cc.find('txt_lose', itemNode).getComponent(cc.Label);
					txt_lose.node.active = true;
					txt_lose.string = score;
				}
			}
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

	messageCallbackHandler(route) {
		if (route === 'RemoveGameResult') {
			this.node.destroy();
		}
	},

	onDestroy() {
		MessageCallback.removeListener('RemoveGameResult', this);
	},
});