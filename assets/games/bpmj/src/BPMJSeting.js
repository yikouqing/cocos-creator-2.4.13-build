const BPMJModel = require('./BPMJModel');
const ApiBpmj = require('./ApiBpmj');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const NetworkManager = require('../../../src/utils/NetworkManager');
const AssetsManager = require('../../../src/utils/AssetsManager');
const UserModel = require('../../../src/model/UserModel');

cc.Class({
	extends: cc.Component,
	properties: {
		layout: cc.Node,
		tilePfb: cc.Prefab,
		_yiXuanCards: null,
		btn_close: cc.Node,
		btn_enter: cc.Node,
	},

	start() {
		MessageCallback.addListener('GameMessagePush', this);
		this.btn_close.on("click", () => {
			this.node.destroy();
		})
		this.btn_enter.on("click", () => {
			ApiRoom.gameMessageNotify(ApiBpmj.gameSubstratumTradeCardsNotify(this._yiXuanCards));
		})
		ApiRoom.gameMessageNotify(ApiBpmj.gameInqtireArrcardsNotify());
	},
	messageCallbackHandler(route, msg) {
		if (route === 'GameMessagePush') {
			if (msg.type === ApiBpmj.GAME_INQTIRE_ARRCARDS_PUSH) {
				this.showTestCard(msg.data);
			} else if (msg.type === ApiBpmj.GAME_SUBSTRATUM_TRADE_CARDS_PUSH) {
				if (msg.data.isSuccess) {
					// AssetsManager.tipDialog('成功！');
					this.node.destroy();
				} else {
					AssetsManager.tipDialog('失败，请重试！');
				}
			}
		}
	},

	showTestCard(data) {
		if (!data) return false;
		this.layout.removeAllChildren();
		let cards = data.allCardsData || [];
		cards.sort(function (a, b) {
			return a - b;
		});
		let dataArr = {};
		for (let x = 0; x < cards.length; x++) {
			if (dataArr.hasOwnProperty(cards[x])) {
				dataArr[cards[x]]++;
			} else {
				dataArr[cards[x]] = 1;
			}
		}
		this._yiXuanCards = data.testCards
		for (let i in dataArr) {
			let node = cc.instantiate(this.tilePfb)
			let com = node.addComponent('BPMJSingleTile');
			com.init();
			com.flower = i;
			let labelNode = new cc.Node;
			let lebel = labelNode.addComponent(cc.Label);
			lebel.string = dataArr[i] + "张";
			lebel.fontSize = 20;
			labelNode.parent = node;
			labelNode.setPosition(cc.v2(0, -80));
			com.setMaskShow(i == data.testCards)
			if (i == data.testCards) {
				this.addNewLabel(node)
			}
			node.on(cc.Node.EventType.TOUCH_END, this.clickNode.bind(this, node));
			node.parent = this.layout;
		}
	},

	addNewLabel(p) {
		let l2 = new cc.Node("l2");
		let label2 = l2.addComponent(cc.Label)
		label2.string = "已选";
		label2.fontSize = 30;
		label2.enableBold = true;
		l2.parent = p;
		l2.setPosition(0, -35);
		l2.color = cc.Color.WHITE;
	},

	clickNode(node) {
		let com = node.getComponent('BPMJSingleTile')
		let label = node.getChildByName("l2")
		if (com.flower == this._yiXuanCards) {
			if (label) label.getComponent(cc.Label).string = ""
			com.setMaskShow(false)
			this._yiXuanCards = null
		} else {
			let allNode = this.layout.children
			allNode.forEach(n => {
				let c = n.getComponent('BPMJSingleTile')
				let l = n.getChildByName("l2")
				c.setMaskShow(false)
				if (l) l.getComponent(cc.Label).string = ""
			});
			com.setMaskShow(true)
			if (label) label.getComponent(cc.Label).string = "已选"
			else this.addNewLabel(node)
			this._yiXuanCards = parseInt(com.flower)
		}
	},

	onDestroy() {
		MessageCallback.removeListener('GameMessagePush', this);
	}
});