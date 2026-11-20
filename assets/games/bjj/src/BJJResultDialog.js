const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const UserModel = require('../../../src/model/UserModel');
const Utils = require('../../../src/utils/Utils');
const Enums = require('../../../src/const/Enums');
const ApiBjj = require('./ApiBjj');
const BJJModel = require('./BJJModel');
const CCUtil = require('../../../src/utils/CCUtil');
const BJJLogic = require('./BJJLogic');
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
		tog_qiepai: cc.Toggle,

		winbg: cc.Node,
		losebg: cc.Node,
	},

	start() {
		MessageCallback.addListener('RemoveGameResult', this);
		this.tick = 30;
		let resBtnNode = cc.find('resBtnNode', this.node);
		let reviewBtnNode = cc.find("reviewBtnNode", this.node);
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
					ApiRoom.gameMessageNotify(ApiBjj.gameUserChooseWashNotify());
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
				bundle: Enums.bundleType.BJJ
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
		let com = card.addComponent('BJJCard')
		com.init()
		com.setNodeShow(true)
		com.flower = cardId
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
		let isWin = false
		for (const uid in resultData.userList) {
			if (Object.hasOwnProperty.call(resultData.userList, uid)) {
				const info = resultData.userList[uid];
				let id = info.uid
				let score = resultData.totalScore[id]
				if (parseInt(myUid) === parseInt(id)) isWin = score > 0
			}
		}
		this.winbg.active = isWin
		this.losebg.active = !isWin

		for (const uid in resultData.userList) {
			if (Object.hasOwnProperty.call(resultData.userList, uid)) {
				const info = resultData.userList[uid];
				let itemNode = cc.instantiate(this.itemNode)
				/**设置字体颜色 */
				itemNode.children.forEach(node => {
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
				nameLabel.string = CCUtil.stringClamp(info.nickname, 6, '..');
				let idLabel = cc.find('txt_id', itemNode).getComponent(cc.Label);
				let id = info.uid
				idLabel.string = 'ID:' + (id != UserModel.getData("uid") ? Utils.stringSecurity(id) : id);
				let headSprite = cc.find('head', itemNode).getComponent(cc.Sprite);
				AssetsManager.loadSpriteFrame({
					path: info.avatar,
					sprite: headSprite
				});

				// cc.find("banker", itemNode).active = id == this.bankerUid
				/**手牌 */
				let tou = resultData.touList.find(info => info.uid == uid)
				let zhong = resultData.zhongList.find(info => info.uid == uid)
				let wei = resultData.weiList.find(info => info.uid == uid)
				let lay1 = cc.find("layout1", itemNode)
				let lay2 = cc.find("layout2", itemNode)
				let lay3 = cc.find("layout3", itemNode)
				if (tou && zhong && wei) {
					let userCards = tou.cards.concat(zhong.cards).concat(wei.cards)
					let cardTypeCom = {}
					if (Array.isArray(userCards) && userCards.length > 0) {
						for (let i = 0; i < userCards.length; i++) {
							const cid = userCards[i];
							let cardCom = this.getNewCard(cid)
							if (i < 3) {
								cardCom.node.parent = lay1
								cardTypeCom[1] = cardCom
							} else if (i < 6) {
								cardCom.node.parent = lay2
								cardTypeCom[2] = cardCom
							} else if (i < 9) {
								cardCom.node.parent = lay3
								cardTypeCom[3] = cardCom
							}
						}
					}

					/**牌型 */
					let showType = (type, dao) => {
						if (type) {
							let url = "res/sprite/cardType/t_" + type
							if (dao == 4) {
								let cardType = itemNode.getChildByName("cardType" + dao)
								let node = new cc.Node()
								node.anchorX = 1
								node.parent = cardType
								let sp = node.addComponent(cc.Sprite)
								AssetsManager.loadSpriteFrame({
									path: url,
									sprite: sp,
									bundle: Enums.bundleType.BJJ
								})
							} else {
								cardTypeCom[dao] && cardTypeCom[dao].setCardType && cardTypeCom[dao].setCardType(type)
							}
						}
					}
					showType(tou.type, 1)
					showType(zhong.type, 2)
					showType(wei.type, 3)

					let plusType = resultData.plusType[uid]
					// console.log("plusTpe===", plusType)
					if (plusType && Array.isArray(plusType) && plusType.length > 0) {
						let txt_xitype = itemNode.getChildByName("txt_xitype")
						let layout4 = itemNode.getChildByName("layout4")
						for (let i = 0; i < plusType.length; i++) {
							const t = plusType[i];
							let str = "" + ApiBjj.cardXiTypeStr[t.type] + t.score + "喜"
							let txt = cc.instantiate(txt_xitype)
							txt.getComponent(cc.Label).string = str
							txt.parent = layout4
							txt.y = 0
						}
					}

					/**每道牌的分数 */
					let s1 = itemNode.getChildByName("txt_score1").getComponent(cc.Label)
					let s2 = itemNode.getChildByName("txt_score2").getComponent(cc.Label)
					let s3 = itemNode.getChildByName("txt_score3").getComponent(cc.Label)
					this.setTypeScore(tou.score, s1)
					this.setTypeScore(zhong.score, s2)
					this.setTypeScore(wei.score, s3)

					/**喜分 */
					let xiScore = resultData.xiScore[uid]
					if (xiScore || xiScore == 0) {
						let txt_xifen = itemNode.getChildByName("txt_xifen").getComponent(cc.Label)
						if (xiScore >= 0) {
							xiScore = "+" + xiScore
						}
						txt_xifen.string = "喜分:" + xiScore
					}
					let bgNode = itemNode.getChildByName("bgNode")
					if (bgNode) {
						bgNode.active = true
					}
				} else {
					let cancelUser = resultData.cancelUser
					if (cancelUser && Array.isArray(cancelUser)) {
						if (cancelUser.includes(id)) {
							let handCards = resultData.handCards ? resultData.handCards[id] : []
							let userCards = [0, 0, 0, 0, 0, 0, 0, 0, 0]
							if (handCards && Array.isArray(handCards) && handCards.length == 9) {
								userCards = BJJLogic.typeCardsSortByScores(resultData.handCards[id].slice(), true)
							}
							for (let i = 0; i < userCards.length; i++) {
								const cid = userCards[i];
								let cardCom = this.getNewCard(cid)
								cardCom.setGray(true)
								if (i < 3) {
									cardCom.node.parent = lay1
								} else if (i < 6) {
									cardCom.node.parent = lay2
								} else if (i < 9) {
									cardCom.node.parent = lay3
								}
							}
						}
					}
					itemNode.getChildByName("qipai").active = true
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
					isWin = score > 0
					this.lostNode.active = !isWin;
					this.winNode.active = isWin;
					// this.showAnimation(isWin)
					// cc.find("itembg1", itemNode).active = false
					// cc.find("itembg2", itemNode).active = true
				}
			}
		}
		// if (loser.uid == myUid && BJJModel.getCurBureau() != BJJModel.getMaxBureau()) { //输的最多的人显示切牌选择
		// 	this.tog_qiepai.node.active = true
		// } else 
		this.tog_qiepai.node.active = false
	},

	setTypeScore(score, label) {
		let str = score + ""
		let url = 'res/font/fnt_game3'
		if (score >= 0) {
			str = "+" + score
			url = 'res/font/fnt_game4'
		}

		AssetsManager.loadAsset({
			path: url,
			aType: cc.Font,
			bundle: Enums.bundleType.BJJ
		}, (font) => {
			if (!!font || !cc.isValid(this.node)) {
				label.font = font;
				label.string = str;
				label.node.active = true;
			}
		});
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