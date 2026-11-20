const ApiRoom = require('../../../src/api/ApiRoom');
const ApiYdr = require('./ApiYdr');
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const UserModel = require('../../../src/model/UserModel');
const Utils = require('../../../src/utils/Utils');
const YDRLogic = require("./YDRLogic")
const TXT_COLOR = ["#354B88", "#6D1F08"]
const MessageCallback = require('../../../src/utils/MessageCallback');

cc.Class({
	extends: cc.Component,
	properties: {
		content: cc.Node,
		userItemNode: cc.Node,
		cardTypeItemNode: cc.Node,
		cardPfb: cc.Prefab,
		img_title: cc.Sprite,
		img_bg: cc.Sprite,
		txt_clock: cc.Label,
		txt_bureau: cc.Label,
		txt_roomInfo: cc.Label,
		resBtnNode: cc.Node,
		reviewBtnNode: cc.Node,
		clockNode: cc.Node,
		_gameRule: null, //游戏规则
		_roomId: 0, //房间号
	},

	start() {
		MessageCallback.addListener('RemoveGameResult', this);
		if (!!this.node.nodeParams.result) {
			this.resultData = Utils.deepCopy(this.node.nodeParams.result)
			this._gameRule = this.node.nodeParams.plusInfo.gameRule
			this._roomId = this.node.nodeParams.plusInfo.roomID
		}
		this.tick = 30;
		if (this.node.nodeParams.isReview) { //视频回放页面隐藏继续按钮
			this.reviewBtnNode.active = false;
			this.resBtnNode.active = false;
		} else if (this.node.nodeParams.isResult) { //正常结算页面
			this.reviewBtnNode.active = false;
			this.resBtnNode.active = true;
			this.clockNode.active = !this.node.nodeParams.isBureauFull;
		} else { //战绩回放页面显示左右翻页按钮
			this.resBtnNode.active = false;
			this.reviewBtnNode.active = true;
			// console.log('回放', this.node.nodeParams)
			this.reviewRecord = this.node.nodeParams.reviewRecord;
			let lastItem = this.reviewRecord[this.reviewRecord.length - 1];
			if (lastItem && !lastItem.result) {
				/* 最后一局未完成，删除 */
				this.reviewRecord.pop();
			}
			this.bureau = 0;
		}
		if (this.reviewRecord && this.reviewRecord[this.bureau]) {
			this._gameRule = this.reviewRecord[this.bureau].plusInfo.gameRule
			this._roomId = this.reviewRecord[this.bureau].plusInfo.roomID
		}
		this.setRoomInfo()
		if (this.node.nodeParams.isResult) {
			this.setAllHandCards();
			this.node.active = true;
		} else if (this.node.nodeParams.isReview) {
			this.node.active = false
			this.setAllHandCards();
			this.scheduleOnce(() => {
				this.node.active = true
			}, 3)
		} else {
			this.showResult()
		}
	},

	setRoomInfo() {
		let str = ""
		if (this._roomId) {
			str += `房号:${this._roomId}`
		}
		if (this._gameRule) {
			str += `  底分:${this._gameRule.baseScore}`
		}

		if (str != "") {
			this.txt_roomInfo.string = str
		}
	},

	setAllHandCards() {
		this.showUserInfo();
	},

	/**选中头像后展示信息 */
	showUserInfo() {
		this.content.removeAllChildren();
		if (!this.resultData) return;
		let users = this.resultData;
		if (!users) return;
		// console.log('小结算', users);
		let myScore = 0
		let myUid = UserModel.getData("uid")
		let isliuju = true
		let url = "res/sprite/littleResult/"
		for (const user of users) {
			if (!user) continue;
			let uNode = cc.instantiate(this.userItemNode);
			uNode.parent = this.content;
			uNode.active = true;
			uNode.getChildByName("txt_name").getComponent(cc.Label).string = CCUtil.stringClamp(user.nickname, 4, '..');
			uNode.getChildByName("txt_uid").getComponent(cc.Label).string = user.uid != UserModel.getData("uid") ? Utils.stringSecurity(user.uid) : user.uid;
			uNode.getChildByName("banker").active = user.bankerUid == user.uid
			AssetsManager.loadSpriteFrame({
				path: user.avatar,
				sprite: cc.find('head', uNode).getComponent(cc.Sprite)
			});
			let winScores = user.winScores
			if (user.uid == myUid) {
				myScore = winScores
			}
			let txt_win = uNode.getChildByName("txt_win").getComponent(cc.Label)
			if (winScores > 0) {
				txt_win.string = "+" + winScores
			} else {
				txt_win.string = "" + winScores
			}

			let cardsLayout = uNode.getChildByName("cardsLayout")
			let x = 0,
				y = 0
			let addCards = (arr, isHu = false) => {
				for (let i = 0; i < arr.length; i++) {
					const cardId = arr[i];
					let com = this.getCardNode(cardId)
					com.node.parent = cardsLayout
					if (cardsLayout.children.length == 16) {
						y = -165
						x = 0
					}
					com.updateTilePos(cc.v2(x, y))
					x += com.node.width
					com.setHuIcon(isHu)
				}
			}
			/**手牌 */
			let handCards = Utils.deepCopy(user.userCards[user.uid])
			if (handCards && handCards.length > 0) {
				addCards(handCards)
			}

			/**吃碰杠的牌 */
			let optArr = Utils.deepCopy(user.operateArray)
			if (optArr && optArr.length > 0) {
				x += 30
				for (let i = 0; i < optArr.length; i++) {
					const cardList = optArr[i].cardList;
					addCards(cardList)
				}
			}

			let huType = uNode.getChildByName("huType")

			/**胡的牌 */
			if (user.huType != -1) {
				isliuju = false
				x += 30
				addCards([user.huCards], true)

				AssetsManager.loadSpriteFrame({
					path: url + "hu",
					sprite: huType.getComponent(cc.Sprite),
					bundle: Enums.bundleType.YDR
				})
				/**陀数 */
				let txt_tuo = cc.find("txt_tuo", uNode)
				txt_tuo.getComponent(cc.Label).string = user.tuo + "陀"
			}

			if (user.userGameStatus == ApiYdr.userGameStatus.BAOZI) {
				AssetsManager.loadSpriteFrame({
					path: url + "baozi",
					sprite: huType.getComponent(cc.Sprite),
					bundle: Enums.bundleType.YDR
				})
			} else if (user.userGameStatus == ApiYdr.userGameStatus.KOU) {
				AssetsManager.loadSpriteFrame({
					path: url + "xiake",
					sprite: huType.getComponent(cc.Sprite),
					bundle: Enums.bundleType.YDR
				})
			}

			/**番数 */
			let pt = user.userPlusType[user.uid]
			if (pt && Array.isArray(pt) && pt.length > 0) {
				let sum = 0
				let cardTypeLayout = cc.find("cardTypeLayout", uNode)
				pt.forEach(info => {
					let score = info.score //>= 0 ? `+${info.score}` : `${info.score}`
					sum += score
					let txtNode = cc.instantiate(this.cardTypeItemNode)
					txtNode.parent = cardTypeLayout
					txtNode.getComponent(cc.Label).string = ApiYdr.plusRateTypeStr[info.type] + score + "番"
				});
				if (sum > 0) {
					let txt_fan = cc.find("txt_fan", uNode)
					txt_fan.getComponent(cc.Label).string = sum + "番"
				}
			}

		}


		let title = "title_2"
		let bg = "bg_0"
		if (!isliuju) {
			if (myScore > 0) {
				title = "title_1"
				bg = "bg_1"
			} else {
				title = "title_0"
				bg = "bg_0"
			}
		}
		CCUtil.nodeRecursive(this.img_bg.node, (node) => {
			let label = node.getComponent(cc.Label)
			if (label && node.name != "txt_bureau" && node.name != "txt_clock") {
				if (myScore > 0) {
					node.color = cc.color(TXT_COLOR[1])
				} else {
					node.color = cc.color(TXT_COLOR[0])
				}
			}
		})
		AssetsManager.loadSpriteFrame({
			path: url + title,
			sprite: this.img_title,
			bundle: Enums.bundleType.YDR
		})
		AssetsManager.loadSpriteFrame({
			path: url + bg,
			sprite: this.img_bg,
			bundle: Enums.bundleType.YDR
		})
	},

	showResult() {
		this.txt_bureau.string = this.bureau + 1;
		this.resultData = Utils.deepCopy(this.reviewRecord[this.bureau].result)
		this.setAllHandCards()
	},

	update(dt) {
		if (this.node.nodeParams.isResult) {
			this.tick -= dt;
			let tick = Math.floor(this.tick);
			if (tick > 0) {
				this.txt_clock.string = tick;
			} else {
				this.txt_clock.string = '0';
			}
		}
	},

	onBtnClick(event, parameters) {
		if (parameters === 'ready') {
			if (!this.node.nodeParams.isBureauFull) {
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify());
				this.node.destroy();
			} else {
				if (this.node.nodeParams.mainComp &&
					this.node.nodeParams.mainComp.showMJAllResultFunc) {
					this.node.nodeParams.mainComp.showMJAllResultFunc();
				}
				this.node.destroy();
			}
		} else if (parameters === 'exit') {
			this.node.destroy();
		}
	},

	getCardNode(cardId) {
		let node = cc.instantiate(this.cardPfb);
		node.active = true;
		let com = node.addComponent('YDRCard')
		com.init()
		com.flower = cardId;
		com.setNodeShow(true);
		return com;
	},

	/**回放使用的左右按钮 */
	nextResult() {

		if (this.bureau + 1 >= this.reviewRecord.length) return;
		++this.bureau;
		this.showResult();
	},

	preResult() {

		if (this.bureau - 1 < 0) return;
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