const TSMJModel = require('./TSMJModel');
const ApiTsmj = require('./ApiTsmj');
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
			if (msg.type === ApiTsmj.GAME_INQTIRE_ARRCARDS_PUSH) {
				let cards = msg.data.allCardsData;
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
					let com = node.addComponent('TSMJSingleTile');
					com.init();
					com.flower = i;
					let labelNode = new cc.Node;
					let lebel = labelNode.addComponent(cc.Label);
					lebel.string = dataArr[i] + "张";
					lebel.fontSize = 20;
					labelNode.parent = node;
					labelNode.setPosition(cc.v2(0, -80));
					com.setMaskShow(i == msg.data.testCards)
					if (i == msg.data.testCards) {
						let l2 = new cc.Node;
						let com = l2.addComponent(cc.Label)
						com.string = "已选";
						com.fontSize = 30;
						com.enableBold = true;
						l2.color = cc.Color.WHITE;
						l2.parent = node;
						l2.setPosition(0, -35);
					}
					node.on(cc.Node.EventType.TOUCH_END, this.clickNode.bind(this, i));
					node.parent = this.layout;
				}

			} else if (msg.type === ApiTsmj.GAME_SUBSTRATUM_TRADE_CARDS_PUSH) {
				if (msg.data.isSuccess) {
					AssetsManager.tipDialog('换牌成功！');
				} else {
					AssetsManager.tipDialog('换牌失败，请重试！');
				}
				this.ScrollView.active = false;
			}
		} else if (route === 'TestClickReq') {
			this.onTestClick()
		}
	},

	clickNode(card) {
		ApiRoom.gameMessageNotify(ApiTsmj.gameSubstratumTradeCardsNotify(parseInt(card)));
		this.ScrollView.active = false;
	},

	onTestClick() {
		if (this.ScrollView.active) {
			this.ScrollView.active = false;
		} else {
			let jushu = TSMJModel.getCurBureau()
			let tmp = UserModel.getData("isTest")
			if (!tmp || jushu <= 0) {
				return
			}
			ApiRoom.gameMessageNotify(ApiTsmj.gameInqtireArrcardsNotify());
		}
	},

	onDestroy() {
		MessageCallback.removeListener('GameMessagePush', this);
		MessageCallback.removeListener('TestClickReq', this)
	}
});