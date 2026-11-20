const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const EZGDTModel = require("./EZGDTModel")
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiEzgdt = require('./ApiEzgdt');
cc.Class({
    extends: cc.Component,

    properties: {
        cardPfb: cc.Prefab,
    },

    onLoad() {
        let myCard = EZGDTModel.getMyHandCard()
        for (let i = 0; i < myCard.length; i++) {
            const cardId = myCard[i];
            let cardNode = cc.instantiate(this.cardPfb)
            cardNode.parent = this.node.getChildByName("card")
            let com = cardNode.getComponent("CNJJCuoPaiCard")
            com && com.bind(cardId)
            cardNode.on(cc.Node.EventType.TOUCH_MOVE, this._touchMove, this)
            cardNode.on(cc.Node.EventType.TOUCH_END, this._touchEnd, this)
        }

        this._checkMove = 600
        this._checkEnd = 450
    },

    showCard() {
        ApiRoom.gameMessageNotify(ApiEzgdt.showCardsNotify())
        this.node.destroy()
    },

    _touchMove(event) {
        // console.log('滑动扑克牌', event, event.getDeltaX(), event.target.name)
        event.target.x += event.getDeltaX();
        event.target.y += event.getDeltaY();

        if (event.target.x > this._checkMove) {
            event.target.x = this._checkMove;
            // this.showCard()
        }
        if (event.target.x < -this._checkMove) {
            event.target.x = -this._checkMove;
            // this.showCard()
        }
        if (event.target.y > this._checkMove) {
            event.target.y = this._checkMove;
            // this.showCard()
        }
        if (event.target.y < -this._checkMove) {
            event.target.y = -this._checkMove;
            // this.showCard()
        }

    },

    _touchEnd(event) {
        if (event.target.x > this._checkEnd || event.target.x < -this._checkEnd || event.target.y > this._checkEnd || event.target.y < -this._checkEnd) {
            this.showCard()
        }
    }
});