const FXJModel = require('./FXJModel');
const ApiFxj = require('./ApiFxj');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');
const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const UserModel = require('../../../src/model/UserModel');

cc.Class({
	extends: cc.Component,
	properties: {
		layout: cc.Node,
		tilePfb: cc.Prefab,
		ScrollView: cc.Node,
	},

	start() {
		MessageCallback.addListener('GameMessagePush', this);
		MessageCallback.addListener('TestClickReq', this)
		this.ScrollView.active = false;
	},

	messageCallbackHandler(route, msg) {
		if (route === 'GameMessagePush') {
			if (msg.type === ApiFxj.GAME_INQTIRE_ARRCARDS_PUSH) {
				if (msg.data.chairID == FXJModel.getMyChairID()) {
					let cards = msg.data.cardDataArr;
					this.ScrollView.active = true;
					this.layout.removeAllChildren();
					cards.sort(function (a, b) {
						return a - b;
					})
					let dataArr = {};
					for (let x = 0; x < cards.length; x++) {
						if (dataArr.hasOwnProperty(cards[x])) {
							dataArr[cards[x]]++;
						} else {
							dataArr[cards[x]] = 1;
						}
					}
					for (let i in dataArr) {
						let node = cc.instantiate(this.tilePfb)
						let com = node.addComponent('FXJSingleTile');
						com.init()
						com.flower = i

						let labelNode = new cc.Node;
						let lebel = labelNode.addComponent(cc.Label);
						lebel.string = dataArr[i] + "张";
						labelNode.parent = node;
						labelNode.setPosition(cc.v2(0, -75));

						if (i == msg.data.cardData) {
							let l2 = new cc.Node;
							let com = l2.addComponent(cc.Label)
							com.string = "已选择"
							com.fontSize = 25
							com.enableBold = true
							l2.color = new cc.color(0, 200, 4)
							l2.parent = node
							l2.setPosition(0, -30)
						}

						node.on(cc.Node.EventType.TOUCH_END, this.clickNode.bind(this, i));
						node.parent = this.layout;
					}

				}
			} else if (msg.type === ApiFxj.GAME_SUBSTRATUM_TRADE_CARDS_PUSH) {
				if (msg.data.trust) {
					AssetsManager.tipDialog('成功了');
				} else {
					AssetsManager.tipDialog('换牌失败，请重试');
				}
				this.ScrollView.active = false
			}
		} else if (route === 'TestClickReq') {
			this.onTestClick()
		}
	},
	clickNode(card) {
		// console.log('clickNode', card);
		ApiRoom.gameMessageNotify(ApiFxj.gameSubstratumTradeCardsNotify(FXJModel.getMyChairID(), [parseInt(card)]));
		this.ScrollView.active = false;
	},

	onTestClick() {
		if (this.ScrollView.active) {
			this.ScrollView.active = false;
		} else {
			let jushu = FXJModel.getCurBureau()
			let tmp = UserModel.getData("isTest")
			if (!tmp || jushu <= 0) {
				return
			}
			ApiRoom.gameMessageNotify(ApiFxj.gameInqtireArrcardsNotify(FXJModel.getMyChairID()));
		}
	},

	onDestroy() {
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('TestClickReq', this)
	}
});