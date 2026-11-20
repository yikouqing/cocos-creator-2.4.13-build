const ApiRoom = require('../../../src/api/ApiRoom');
const ApiXz = require('./ApiXz');
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const UserModel = require('../../../src/model/UserModel');
const XZLogic = require('./XZLogic');
const MAX_USER_NUM = 4;
const huIndexUrl = "res/sprite/rank/";
const Utils = require('../../../src/utils/Utils');
const MessageCallback = require('../../../src/utils/MessageCallback');
const XZModel = require('./XZModel');

cc.Class({
	extends: cc.Component,
	properties: {
		cardsLayout: cc.Node,
		cardTypeLayout: cc.Node,
		userItemNode: cc.Node,
		cardTypeItemNode: cc.Node,
		cardNode: cc.Prefab,
		clockLabel: cc.Label,
		bureauLabel: cc.Label,
		userTogContent: cc.Node,
		_myChairId: null, //自己的座位号
	},

	start() {
		MessageCallback.addListener('RemoveGameResult', this);

		this.resultData = this.node.nodeParams.result;
		this.tick = 0;
		let resBtnNode = cc.find('resBtnNode', this.node);
		let reviewBtnNode = cc.find("reviewBtnNode", this.node);
		let clockNode = cc.find("Clock", resBtnNode);
		if (this.node.nodeParams.isReview) { //视频回放页面隐藏继续按钮
			reviewBtnNode.active = false;
			resBtnNode.active = false;
		} else if (this.node.nodeParams.isResult) { //正常结算页面
			reviewBtnNode.active = false;
			resBtnNode.active = true;
			clockNode.active = !this.node.nodeParams.isBureauFull;
			this.tick = this.node.nodeParams.tick;
		} else { //战绩回放页面显示左右翻页按钮
			resBtnNode.active = false;
			reviewBtnNode.active = true;
			this.reviewRecord = this.node.nodeParams.reviewRecord;
			// console.log("回放数据==", this.reviewRecord)
			let lastItem = this.reviewRecord[this.reviewRecord.length - 1];
			if (lastItem && !lastItem.result) {
				/* 最后一局未完成，删除 */
				this.reviewRecord.pop();
			}
			this.bureau = 0;
		}

		if (this.node.nodeParams.isResult) {
			this.node.active = false
			this.setAllHandCards();
			this.scheduleOnce(() => {
				this.node.active = true
			}, 3)
		} else if (this.node.nodeParams.isReview) {
			this.setAllHandCards();
		} else {
			this.showResult()
		}
	},

	/**找出自己的座位号 */
	findMyChairId() {
		if (!this.resultData) {
			// console.log("没有数据")
			return
		}
		this._myChairId = 0
		for (let i = 0; i < this.resultData.userArray.length; i++) {
			const user = this.resultData.userArray[i];
			if (UserModel.getData("uid") === user.uid) {
				this._myChairId = i
				// console.log("自己的座位号==", this._myChairId)
			}
		}
	},

	setAllHandCards() {
		// console.log("结算数据==", this.resultData)
		this.findMyChairId()
		this.generateUserTog()
		this.showUserInfo(0)
	},

	/**生成头像tog */
	generateUserTog() {
		let userArray = this.resultData.userArray
		if (!userArray) {
			// console.log("没有找到用户数据")
			return
		}
		this.userTogContent.removeAllChildren()
		for (let i = 0; i < userArray.length; i++) {
			const user = userArray[i];
			if (user) {
				let item = cc.instantiate(this.userItemNode)
				cc.find('txt_nick', item).getComponent(cc.Label).string = CCUtil.stringClamp(user.nickname, 4, '..');
				cc.find('owner', item).active = (this.resultData.owner == user.uid);
				let head = cc.find('user_bg/head', item)
				AssetsManager.loadSpriteFrame({
					path: user.avatar,
					sprite: head.getComponent(cc.Sprite)

				});

				cc.find('banker', item).active = user.isBanker;
				/**位置图片 */
				let chair = cc.find("chair", item).getComponent(cc.Sprite)
				let idx = this.getUserChairIndex(i)
				AssetsManager.loadSpriteFrame({
					path: `res/sprite/result/chair_${idx}`,
					sprite: chair,
					bundle: XZModel.getBundleType(),
				})
				/**分数 */
				let score = this.resultData.scores[i];
				let txt_score = cc.find("txt_score", item).getComponent(cc.Label)
				if (score > 0) {
					txt_score.string = '+' + Utils.formatNumberWithDecimal(score, 1);
					txt_score.node.color = cc.color("#E6452B")
				} else {
					txt_score.string = Utils.formatNumberWithDecimal(score, 1);
					txt_score.node.color = cc.color("#2D689C")
				}

				item.parent = this.userTogContent
				item.x = 0
				item.name = i + ""
				item.on("click", this.userTogClick, this)
			} else {
				// console.log("小结算数据错误")
				continue;
			}
		}
	},

	/**选中头像后展示信息 */
	showUserInfo(chairId) {
		let user = this.resultData.userArray[chairId]
		if (!user) {
			// console.log("没有用户信息")
			return
		}
		let uNode = cc.find("content/userInfo", this.node)
		// cc.find('txt_nick', uNode).getComponent(cc.Label).string = CCUtil.stringClamp(user.nickname, 4, '..');
		cc.find('txt_nick', uNode).getComponent(cc.Label).string = user.nickname;
		// cc.find('txt_uid', uNode).getComponent(cc.Label).string = user.uid != UserModel.getData("uid") ? Utils.stringSecurity(user.uid) : user.uid;
		cc.find('txt_uid', uNode).getComponent(cc.Label).string = 'ID:' + user.uid;
		/**胡牌顺序 */
		let huTypeSrpite = cc.find('huIndex', uNode).getComponent(cc.Sprite);
		let huType = this.resultData.huType[chairId];
		let name = "hu"
		if (huType === ApiXz.operateType.HU_ZHI) {
			name = "zimo"
		}
		let userHuList = !!this.resultData.userHuList ? this.resultData.userHuList[chairId] : {}; //0是容错处理
		userHuList = userHuList || {};
		let url = huIndexUrl + userHuList.huIdx + name;
		huTypeSrpite.spriteFrame = null
		AssetsManager.loadSpriteFrame({
			path: url,
			sprite: huTypeSrpite,
			bundle: XZModel.getBundleType()
		})
		/**头像 */
		AssetsManager.loadSpriteFrame({
			path: user.avatar,
			sprite: cc.find('user_bg/head', uNode).getComponent(cc.Sprite)
		});

		/**位置图片 */
		let chair = cc.find("chair", uNode).getComponent(cc.Sprite)
		let idx = this.getUserChairIndex(chairId)
		AssetsManager.loadSpriteFrame({
			path: `res/sprite/result/chair_${idx}`,
			sprite: chair,
			bundle: XZModel.getBundleType(),
		})
		/**分数 */
		let score = this.resultData.scores[chairId];
		let win = cc.find('win', uNode).getComponent(cc.Label);
		let lose = cc.find('lose', uNode).getComponent(cc.Label);
		if (score > 0) {
			win.node.active = true;
			lose.node.active = false
			win.string = '+' + Utils.formatNumberWithDecimal(score, 1);
		} else {
			lose.node.active = true;
			win.node.active = false
			lose.string = Utils.formatNumberWithDecimal(score, 1);
		}
		// console.log(win.string, lose.string)

		/**牌 */
		this.cardsLayout.removeAllChildren()
		let posx = 0,
			cardWidth = 43,
			nullWidth = 15;
		posx += cardWidth / 2;
		let handCards = this.resultData.handCards[chairId]
		if (handCards && Array.isArray(handCards)) {
			handCards = this.resultData.handCards[chairId].slice()
		}
		let pengGangArray = this.resultData.operateArray[chairId]
		if (pengGangArray.length > 0) {
			for (let i = 0; i < pengGangArray.length; ++i) {
				let obj = pengGangArray[i];
				let count = (ApiXz.operateType.PENG == obj.operate || ApiXz.operateType.CHI == obj.operate) ? 3 : 4;

				let cardList = [obj.card, obj.card, obj.card]
				if (ApiXz.operateType.PENG !== obj.operate) { //如果不是碰，使用plusInfo里面的数据
					cardList = obj.plusInfo.cardList
				}
				for (let j = 0; j < count; ++j) {
					let card = cardList[j]
					let node = this.getPengGangCardNode(card, j, obj.operate == ApiXz.operateType.GANG_ZHI, obj.operate == ApiXz.operateType.GANG_BU);
					node.parent = this.cardsLayout;
					if (count == 4 && j == 3) {
						node.y = 10;
						node.x = posx - 2 * cardWidth;
					} else {
						node.x = posx;
						posx += cardWidth;
					}
				}
				posx += nullWidth;
			}
		}

		if (this.resultData.winChairIDArray.indexOf(chairId) != -1) {
			let huCard = this.resultData.huCard[chairId]

			/**如果是自摸，手牌里面删除胡的那张牌再做显示 */
			if (this.resultData.huType[chairId] === ApiXz.operateType.HU_ZHI) {
				for (let i = 0; i < handCards.length; i++) {
					if (huCard === handCards[i]) {
						handCards.splice(i, 1)
						break
					}
				}
			}
			this.sortHandCards(handCards)
			for (let i = 0; i < handCards.length; ++i) {
				let node = this.getCardNode(handCards[i]);
				node.parent = this.cardsLayout;
				node.x = posx;
				posx += cardWidth;
			}
			if (huCard && huCard > 0) {
				posx += nullWidth;
				let huCardNode = this.getCardNode(huCard);
				huCardNode.parent = this.cardsLayout;
				huCardNode.x = posx;
			}
		} else {
			this.sortHandCards(handCards)
			for (let i = 0; i < handCards.length; ++i) {
				let node = this.getCardNode(handCards[i]);
				node.parent = this.cardsLayout;
				node.x = posx;
				posx += cardWidth;
			}
		}

		/**操作记录 */
		this.setTxtType(this.cardTypeLayout, chairId)
	},

	/**头像点击响应 */
	userTogClick(event) {
		// console.log("点击了头像", event.isChecked, event.node.name)
		let cid = event.node.name
		this.showUserInfo(parseInt(cid))
	},

	showResult() {
		this.bureauLabel.string = this.bureau + 1;
		this.resultData = this.reviewRecord[this.bureau].result
		this.findMyChairId()
		this.generateUserTog()
		this.showUserInfo(0)
	},

	/**设置类型文字 */
	setTxtType(layout, chairID) {
		layout.removeAllChildren()
		let record = this.resultData.fenRecord[chairID];
		for (let i = 0; i < record.length; i++) {
			let item = cc.instantiate(this.cardTypeItemNode)
			item.x = 0
			const info = record[i];
			let chair = ["本家", "下家", "对家", "上家"][this.getUserChairIndex(info.chairID)]
			let huType = ""
			if (info.cardType && info.huType) {
				/**7张牌的时候 所有7对变成4对 */
				let list = [4, 5, 7, 8, 11]
				if (list.includes(info.cardType) && this.resultData.cardCount === 7) {
					info.cardType += 100
				}
				huType = `(${ApiXz.cardTypeStr[info.cardType]}`
				let fan = info.rate || 0
				if (info.plusRateList && info.plusRateList.length > 0) {
					info.plusRateList.forEach(plusRateInfo => {
						huType += " " + ApiXz.plusRateTypeStr[plusRateInfo.type]
						fan += plusRateInfo.rate
					});
				}
				let maxRate = this.resultData.gameRule ? this.resultData.gameRule.maxRate : 0
				if (maxRate && maxRate < fan) {
					fan = maxRate
				}
				huType += ")     " + fan + "番"
			}
			let txt_record = cc.find("txt_record", item).getComponent(cc.Label)
			let txt_chair = cc.find("txt_chair", item).getComponent(cc.Label)
			let txt_score = cc.find("txt_score", item).getComponent(cc.Label)
			txt_record.string = ApiXz.recordTypeStr[info.recordType] + huType
			txt_chair.string = chair + ""
			let str = ""
			let score = info.score
			if (score >= 0) {
				str += ("+" + Utils.formatNumberWithDecimal(score, 1))
			} else str += (Utils.formatNumberWithDecimal(score, 1) + "")
			txt_score.string = str
			item.parent = layout
		}
	},

	/**给手牌重新排序 */
	sortHandCards(handCards) {
		handCards.sort((a, b) => a - b)
		let ghostList = XZLogic.getGhostList()
		let myGhost = []
		for (let i = 0; i < handCards.length; i++) {
			const card = handCards[i];
			if (ghostList.includes(card)) {
				myGhost.push(card)
				handCards.splice(i, 1)
				i--
			}
		}
		for (let i = 0; i < myGhost.length; i++) {
			handCards.unshift(myGhost[i])
		}
	},

	update(dt) {
		if (this.node.nodeParams.isResult) {
			this.tick -= dt;
			let tick = Math.floor(this.tick);
			if (tick > 0) {
				this.clockLabel.string = tick;
			} else {
				this.clockLabel.string = '0';
			}
		}
	},

	onBtnClick(event, parameters) {

		if (parameters === 'ready') {
			if (!this.node.nodeParams.isBureauFull) {
				ApiRoom.roomMessageNotify(ApiRoom.userReadyNotify());
				this.node.destroy();
			} else {
				// console.log('大结算', this.node.nodeParams.mjMainDialog.showMJAllResultFunc);
				if (this.node.nodeParams.mjMainDialog &&
					this.node.nodeParams.mjMainDialog.showMJAllResultFunc) {
					this.node.nodeParams.mjMainDialog.showMJAllResultFunc();
					this.node.destroy();
				}
			}
		} else if (parameters === 'exit') {
			this.node.destroy();
		}
	},

	getCardNode(card) {
		let node = cc.instantiate(this.cardNode);
		node.active = true;
		node.y = 0;
		let com = node.addComponent('XZSingleTile')
		com.init()
		com.flower = card
		com.setNodeShow(true)
		return node;
	},

	getPengGangCardNode(card, i, isAnGang, isBuGang) {
		let node = cc.instantiate(this.cardNode);
		node.active = true;
		node.y = 0;
		let com = node.addComponent('XZSingleTile')
		com.init()
		com.flower = card
		com.setNodeShow(true)
		if (!!isAnGang && i < 3 || !!isBuGang && i == 3) {
			com.setCover(true)
		}

		return node;
	},

	/**座位号转换 */
	getUserChairIndex(chairID) {
		return (chairID - this._myChairId + MAX_USER_NUM) % MAX_USER_NUM;
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