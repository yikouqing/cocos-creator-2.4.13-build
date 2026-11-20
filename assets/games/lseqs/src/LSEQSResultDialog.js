const ApiRoom = require('../../../src/api/ApiRoom');
const ApiLseqs = require('./ApiLseqs');
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const UserModel = require('../../../src/model/UserModel');
const Utils = require('../../../src/utils/Utils');
const LSEQSLogic = require("./LSEQSLogic")
const TXT_COLOR = ["#354B88", "#6D1F08"]
const MessageCallback = require('../../../src/utils/MessageCallback');
const LSEQSModel = require('./LSEQSModel');

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
		txt_gameRule: cc.Label,
		txt_time: cc.Label,
		resBtnNode: cc.Node,
		reviewBtnNode: cc.Node,
		clockNode: cc.Node,
		_gameRule: null, //游戏规则
		_roomId: 0, //房间号
		_plusInfo: null,
	},

	start() {
		MessageCallback.addListener('RemoveGameResult', this);
		if (!!this.node.nodeParams.result) {
			this.resultData = Utils.deepCopy(this.node.nodeParams.result)
			this._gameRule = this.node.nodeParams.plusInfo.gameRule
			this._roomId = this.node.nodeParams.plusInfo.roomID
			this._plusInfo = Utils.deepCopy(this.node.nodeParams.plusInfo)
		}
		this.tick = 30;
		if (this.node.nodeParams.isReview) { //视频回放页面隐藏继续按钮
			this.reviewBtnNode.active = false;
			this.resBtnNode.active = false;
		} else if (this.node.nodeParams.isResult) { //正常结算页面
			this.reviewBtnNode.active = false;
			this.resBtnNode.active = true;
			this.clockNode.active = false
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
			this._plusInfo = Utils.deepCopy(this.reviewRecord[this.bureau].plusInfo)
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
		let isHaveSelf = false
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
			let winScores = Utils.formatNumberWithDecimal(user.winScores, 1)
			if (user.uid == myUid) {
				myScore = winScores
				isHaveSelf = true
			}
			let txt_win = uNode.getChildByName("txt_win").getComponent(cc.Label)
			if (winScores > 0) {
				txt_win.string = "+" + winScores
			} else {
				txt_win.string = "" + winScores
			}

			let zu = uNode.getChildByName("zu")
			let cardsLayout = uNode.getChildByName("cardsLayout")
			let x = 0
			let addCards = (arr, huCount, huCard = null, isBaYu = false) => {
				let cardList = arr.slice()
				let zuNode = cc.instantiate(zu)
				zuNode.parent = cardsLayout
				zuNode.y = 0
				zuNode.x = x
				x += zuNode.width + 5
				if (huCard) {
					let huIdx = cardList.indexOf(huCard)
					if (huIdx >= 0) {
						cardList.splice(huIdx, 1)
					}
				}
				if (isBaYu) {
					cardList.push(arr[0])
				}
				for (let i = 0; i < cardList.length; i++) {
					const cardId = cardList[i];
					let com = this.getCardNode(cardId)
					com.node.parent = zuNode.getChildByName("group")
					if (isBaYu) {
						if (i == cardList.length - 1) {
							com.setYu(true)
						} else if (i == 0) {
							com.setNodeOpacity(150)
						}
					}
				}
				if (huCard) {
					let com = this.getCardNode(huCard)
					com.node.parent = zuNode.getChildByName("group")
					com.setHuIcon(true)
					cardList.push(huCard)
				}
				let txt_hu = cc.find("txt_hu", zuNode).getComponent(cc.Label)
				if (cardList.length >= 3 && huCount >= 0) {
					txt_hu.string = huCount + ""
				} else txt_hu.string = ""
			}

			/**吃碰杠的牌 */
			let optArr = Utils.deepCopy(user.operateArray)
			if (optArr && optArr.length > 0) {
				for (let i = 0; i < optArr.length; i++) {
					const info = optArr[i]
					if (info.operate == ApiLseqs.operateType.CHI) { //把吃的第一张放到最前面
						let idx1 = info.cardList.indexOf(info.card) //吃的那张牌放到第一位
						if (idx1 != -1) {
							info.cardList.splice(idx1, 1)
							info.cardList.unshift(info.card)
						}
					}
					addCards(info.cardList, info.huCount, false, info.isBaYu)
					if (info.baiList && info.baiList.length > 0) {
						for (let j = 0; j < info.baiList.length; j++) {
							let list = info.baiList[j]
							let idx2 = list.indexOf(info.card) //吃的那张牌放到第一位
							if (idx2 != -1) {
								list.splice(idx2, 1)
								list.unshift(info.card)
							}
							let baiHuCount = info.baiCount[j] || 0
							addCards(list, baiHuCount)
						}
					}
				}
			}

			/**手牌 */
			let handCards = Utils.deepCopy(user.huBaiCards)
			if (!handCards || !handCards.length) {
				handCards = Utils.deepCopy(user.handBaiCards)
			}
			if (handCards && handCards.length > 0) {
				x += 20
				let huInfo = null
				handCards.forEach(info => {
					if (!huInfo && user.huType != -1 && user.huCards && info.cardList.includes(user.huCards)) {
						huInfo = info
					} else
						addCards(info.cardList, info.huCount)
				});
				if (huInfo) { //胡的列放到最后
					isliuju = false
					addCards(huInfo.cardList, huInfo.huCount, user.huCards)
					cc.find("txt_huCount", uNode).getComponent(cc.Label).string = "胡数" + user.huScore
				}
			}

			/**番数 */
			let pt = user.userPlusType
			if (pt && Array.isArray(pt) && pt.length > 0) {
				let cardTypeLayout = cc.find("cardTypeLayout", uNode)
				pt.forEach(info => {
					let symbol = info.scoreType == 0 ? "x" : ""
					let score = info.score
					if (score >= 0 && info.scoreType != 0) {
						symbol = "+"
					}
					if (info.type == ApiLseqs.plusRateType.TAIPAO) {
						symbol = ""
						score = ""
					}
					let txtNode = cc.instantiate(this.cardTypeItemNode)
					txtNode.parent = cardTypeLayout
					txtNode.getComponent(cc.Label).string = ApiLseqs.plusRateTypeStr[info.type] + symbol + score
				});
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
			if (label && node.name != "txt_bureau" && node.name != "txt_clock" && node.name != "txt_gameRule") {
				if (myScore > 0) {
					node.color = cc.color(TXT_COLOR[1])
				} else {
					node.color = cc.color(TXT_COLOR[0])
				}
			}
		})
		if (!isHaveSelf) {
			this.img_title.node.active = false
		} else {
			AssetsManager.loadSpriteFrame({
				path: url + title,
				sprite: this.img_title,
				bundle: LSEQSModel.getGameType()
			})
		}
		AssetsManager.loadSpriteFrame({
			path: url + bg,
			sprite: this.img_bg,
			bundle: LSEQSModel.getGameType()
		})
	},

	showResult() {
		this.txt_bureau.string = this.bureau + 1;
		this.resultData = Utils.deepCopy(this.reviewRecord[this.bureau].result)
		this._plusInfo = Utils.deepCopy(this.reviewRecord[this.bureau].plusInfo)
		this.setAllHandCards()
		this.setRoomInfo()
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
			if (this.node.nodeParams.mainComp &&
				this.node.nodeParams.mainComp.showMJAllResultFunc) {
				this.node.nodeParams.mainComp.showMJAllResultFunc();
			} else {
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify());
			}
			this.node.destroy();
		} else if (parameters === 'exit') {
			this.node.destroy();
		}
	},

	getCardNode(cardId) {
		let node = cc.instantiate(this.cardPfb);
		node.active = true;
		let com = node.addComponent('LSEQSCard')
		com.init()
		com.flower = cardId;
		com.setNodeShow(true);
		let curBureau = this._plusInfo ? this._plusInfo.curBureau : -1
		if (cardId != curBureau) {
			com.setQuan(LSEQSLogic.getCardNumber(cardId) == curBureau)
		}
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

	setRoomInfo() {
		let str = ""
		if (this._roomId) {
			str += `房号:${this._roomId}`
		}
		if (this._plusInfo) {
			let fanti = ["", "壹", "贰", "叁", "肆", "伍", "陆", "柒", "捌", "玖", "拾"];
			str += `  ${fanti[this._plusInfo.curBureau]}/${fanti[this._plusInfo.maxBureau]}圈  第${this._plusInfo.curGameBureau}局`;
		}
		this.txt_roomInfo.string = str

		if (this._gameRule) {
			let ruleStr = `玩法: 底分${this._gameRule.baseScore}`;
			if (this._gameRule.isQuanHu) ruleStr += " 圈胡"
			if (this._gameRule.isTianDiHu) ruleStr += " 天地胡"
			if (this._gameRule.isKun) ruleStr += " 坤"
			if (this._gameRule.isPiao) ruleStr += " 漂"
			if (this._gameRule.isDaHu) ruleStr += " 大胡"
			if (this._gameRule.isShangTai) ruleStr += " 上台"
			if (this._gameRule.isQingYiSe) ruleStr += " 清一色"
			if (this._gameRule.isShuangQuan) ruleStr += " 双圈"
			if (this._gameRule.isBaYuJiaHu) ruleStr += " 巴雨加胡"
			if (this._gameRule.fengDing == 0) {
				ruleStr += (" 不封顶")
			} else {
				ruleStr += (" " + this._gameRule.fengDing + "胡封顶")
			}
			this.txt_gameRule.string = ruleStr
		}

		this.txt_time.string = ""
		if (this._plusInfo.endTime) {
			let df = Utils.getDateFormat(this._plusInfo.endTime);
			this.txt_time.string = df.yyyymmddhhmmss;
		}
	},
});