const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const UserModel = require('../../../src/model/UserModel');
const Utils = require('../../../src/utils/Utils');
const Enums = require('../../../src/const/Enums');
const ApiQzsss = require('./ApiQzsss');
const QZSSSModel = require('./QZSSSModel');
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
		restCardsContent: cc.Node,
		bureauLabel: cc.Label,
		tog_qiepai: cc.Toggle,
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
				if (this.tog_qiepai && this.tog_qiepai.node.active && this.tog_qiepai.isChecked) {
					ApiRoom.gameMessageNotify(ApiQzsss.gameUserChooseWashNotify());
				}
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
				bundle: Enums.bundleType.QZSSS
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
		let com = card.addComponent('QZSSSCard')
		com.init()
		com.flower = cardId
		com.setNodeShow(true)
		return com
	},

	setResultInfo() {
		let resultData = this.result
		let myUid = UserModel.getData("uid")
		this.content.removeAllChildren()
		let loser = {
			score: 0,
			uid: 0
		}
		this.lostNode.active = false
		this.winNode.active = false
		for (const uid in resultData.userList) {
			if (Object.hasOwnProperty.call(resultData.userList, uid)) {
				const info = resultData.userList[uid];
				let itemNode = cc.instantiate(this.itemNode)
				itemNode.parent = this.content;
				itemNode.y = 0
				itemNode.active = true;
				let nameLabel = cc.find('txt_name', itemNode).getComponent(cc.Label);
				nameLabel.string = CCUtil.stringClamp(info.nickname, 6, '..');
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
				let cardTypeCom = []
				let userCards = resultData.cardsArr[uid]
				if (userCards && Array.isArray(userCards)) {
					let lay1 = cc.find("layout1", itemNode)
					let lay2 = cc.find("layout2", itemNode)
					let lay3 = cc.find("layout3", itemNode)
					for (let i = 0; i < userCards.length; i++) {
						const cid = userCards[i];
						let cardCom = this.getNewCard(cid)
						cardCom.setMaIcon(cid == resultData.mapai)
						if (i < 3) {
							cardCom.node.parent = lay1
							cardTypeCom[1] = cardCom
						} else if (i < 8) {
							cardCom.node.parent = lay2
							cardTypeCom[2] = cardCom
						} else if (i < 13) {
							cardCom.node.parent = lay3
							cardTypeCom[3] = cardCom
						}
					}
				}

				/**牌型 */
				let touType = resultData.touSort.find(tou => tou.uid == id)
				let zhongType = resultData.zhongSort.find(zhong => zhong.uid == id)
				let weiType = resultData.weiSort.find(wei => wei.uid == id)
				let teShuSort = resultData.teShuSort.find(teshu => teshu.uid == id)
				let showType = (type, dao) => {
					let cardType = cc.find("cardType" + dao, itemNode).getComponent(cc.Sprite)
					if (type && cardType) {
						if (dao == 4) {
							let url = "res/sprite/cardType/" + type
							AssetsManager.loadSpriteFrame({
								path: url,
								sprite: cardType,
								bundle: Enums.bundleType.QZSSS
							})
						} else {
							cardTypeCom[dao] && cardTypeCom[dao].setCardType && cardTypeCom[dao].setCardType(type)
						}
					}
				}
				if (touType && zhongType && weiType) {
					showType(touType.type, 1)
					showType(zhongType.type, 2)
					showType(weiType.type, 3)
				} else if (teShuSort) {
					showType(teShuSort.teShuType, 4)
				}

				/**总分数 */
				let score = resultData.totalScore[id]
				if (score > 0) {
					let winLabel = cc.find('txt_win', itemNode).getComponent(cc.Label);
					winLabel.node.active = true;
					winLabel.string = '+' + score;
					cc.find("icon", itemNode).active = true
				} else {
					if (score <= loser.score) { //记录最低分
						loser.score = score
						loser.uid = id
					}
					let loseLabel = cc.find('txt_lose', itemNode).getComponent(cc.Label);
					loseLabel.node.active = true;
					loseLabel.string = score;
				}
				/**播放输赢声音和动画 */
				if (parseInt(myUid) === parseInt(id)) {
					let isWin = score > 0
					this.lostNode.active = !isWin;
					this.winNode.active = isWin;
					this.showAnimation(isWin)
					cc.find("itembg1", itemNode).active = false
					cc.find("itembg2", itemNode).active = true
				}
				/**下注和抢庄 */
				let txt_bet = cc.find("txt_bet", itemNode).getComponent(cc.Label)
				let str = ""
				let robBankList = resultData.robBankList
				if (robBankList && robBankList.length > 0) {
					let robInfo = robBankList.find(r => r.uid == id)
					if (robInfo) {
						str = robInfo.robScale == 0 ? "不抢" : ("抢X" + robInfo.robScale)
					}
				}
				let userBetScore = resultData.userBetScore[id]
				if (userBetScore && id != this.bankerUid) {
					str += ` 下注:${userBetScore.score}倍`
				}
				txt_bet.string = str
			}
		}
		if (loser.uid == myUid && QZSSSModel.getCurBureau() != QZSSSModel.getMaxBureau()) { //输的最多的人显示切牌选择
			this.tog_qiepai.node.active = true
		} else this.tog_qiepai.node.active = false
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