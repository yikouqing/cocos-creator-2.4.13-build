const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const ConfigModel = require('../../../src/model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        cards: [require('SZCuoPaiCard')],
        back: cc.Node,
        card1: cc.Node,
        card2: cc.Node,
        card3: cc.Node,
        _cb: null
    },

    onLoad() {
        this.back.setPosition(cc.v2(0, 0));
        this.card1.setPosition(cc.v2(0, 0));
        this.card2.setPosition(cc.v2(0, 0));
        this.card3.setPosition(cc.v2(0, 0));
        this.back.on(cc.Node.EventType.TOUCH_MOVE, this._touchMove, this);
        this.card1.on(cc.Node.EventType.TOUCH_MOVE, this._touchMove, this);
        this.card2.on(cc.Node.EventType.TOUCH_MOVE, this._touchMove, this);
        this.card3.on(cc.Node.EventType.TOUCH_MOVE, this._touchMove, this);
        MessageCallback.addListener('UpdateGameCardBg', this);
        this.updateCardsBgSprite();
        this._init();
    },

    updateCardsBgSprite() {
        let cardBg = this.back.getComponent(cc.Sprite);
        if (!cardBg) return;
        AssetsManager.loadSpriteFrame({
            path: ConfigModel.getCardUrl(),
            sprite: cardBg
        });
    },

    _init() {
        if (!this.node.nodeParams) return;
        let data = this.node.nodeParams;
        let cards = data.cards;
        this._cb = data.cb;
        if (!cards) {
            this.node.destroy();
            return;
        }
        for (let index = 0; index < cards.length; index++) {
            if (!this.cards[index]) continue;
            this.cards[index].bind(cards[index]);
        }
        this.scheduleOnce(() => {
            this._cb && this._cb();
        }, 6.5);
    },

    messageCallbackHandler(route, msg) {
        if (route === 'UpdateGameCardBg') {
            this.updateCardsBgSprite();
        }
    },

    _touchMove(event) {
        // console.log('滑动扑克牌', event, event.getDeltaX(), event.target.name)
        if (event.target.x < 0) {
            event.target.x = 0;
        }
        event.target.x += event.getDeltaX();
        if (event.target.name != 'back') {
            if (event.target.x >= this.back.x - 50) {
                event.target.x = this.back.x - 50;
            }
        } else {
            if (event.target.x > 250) {
                event.target.x = 250;
            }
        }
    },

    onDestroy() {
        this._cb && this._cb();
        MessageCallback.removeListener('UpdateGameCardBg', this);
        this.back.off(cc.Node.EventType.TOUCH_MOVE, this._touchMove, this);
        this.card1.off(cc.Node.EventType.TOUCH_MOVE, this._touchMove, this);
        this.card2.off(cc.Node.EventType.TOUCH_MOVE, this._touchMove, this);
        this.card3.off(cc.Node.EventType.TOUCH_MOVE, this._touchMove, this);
    },

    show() {
        this._cb && this._cb();
        this.node.destroy();
    }

    // update (dt) {},
});