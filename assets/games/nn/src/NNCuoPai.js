const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const MessageCallback = require('../../../src/utils/MessageCallback');
const ConfigModel = require('../../../src/model/ConfigModel');

cc.Class({
	extends: cc.Component,

	properties: {
		handCards: cc.Node,
		touCard: cc.Node,
		lowCard: cc.Node,
		cuoCard: cc.Node,

		_handCards: null,
		_opened: false,
		_cb: null,
	},

	onLoad() {
		this.touCard.on(cc.Node.EventType.TOUCH_START, this.touchStart, this);
		this.touCard.on(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
		this.touCard.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
		this.touCard.on(cc.Node.EventType.TOUCH_CANCEL, this.touchEnd, this);
		MessageCallback.addListener('UpdateGameCardBg', this);
		this.updateCardsBgSprite();
	},

	start() {
		this._handCards = this.node.nodeParams ? this.node.nodeParams.cards : [];
		this._handCards = this._handCards || [];
		this._cb = this.node.nodeParams ? this.node.nodeParams.cb : null;
		if (this._handCards.length == 0) {
			this.node.destroy();
			return;
		}
		this._showCards(4);
	},

	_showCards(max) {
		for (let index = 0; index < this._handCards.length; index++) {
			if (!this.handCards.children[index]) continue;
			this.handCards.children[index].active = index < max;
			AssetsManager.loadSpriteFrame({
				path: ConfigModel.getCardUrl(this._handCards[index]),
				sprite: this.handCards.children[index].getComponent(cc.Sprite)
			});
		}
		if (!this.cuoCard) return;
		let cards = this._handCards.slice();
		let cuoCard = cards.pop();
		AssetsManager.loadSpriteFrame({
			path: `sprite/cuopai/${cuoCard}`,
			sprite: this.cuoCard.getComponent(cc.Sprite)
		});

	},

	messageCallbackHandler(route, msg) {
		if (route === 'UpdateGameCardBg') {
			this.updateCardsBgSprite();
		}
	},

	updateCardsBgSprite() {
		let cardBg = this.touCard.getComponent(cc.Sprite);
		if (!cardBg) return;
		AssetsManager.loadSpriteFrame({
			path: ConfigModel.getCardUrl(),
			sprite: cardBg
		});
	},

	/**触摸响应 */
	touchStart(event) {
		event.target.stopAllActions();
	},

	touchMove(event) {
		event.target.x += event.getDeltaX();
		event.target.y += event.getDeltaY();
	},

	touchEnd(event) {
		let rect1 = CCUtil.getBoundingBoxToWorldWithoutChildren(this.lowCard);
		let rect2 = CCUtil.getBoundingBoxToWorldWithoutChildren(this.touCard);
		if (!rect1.intersects(rect2)) {
			this._opened = true;
			this._showCards(4);
			this._cb && this._cb();
			this.node.destroy();
		}
	},

	onDestroy() {
		if (!this._opened) this._cb && this._cb();
		this.touCard.off(cc.Node.EventType.TOUCH_START, this.touchStart, this);
		this.touCard.off(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
		this.touCard.off(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
		this.touCard.off(cc.Node.EventType.TOUCH_CANCEL, this.touchEnd, this);
		MessageCallback.removeListener('UpdateGameCardBg', this);
	},

});