const CJSJYModel = require('./CJSJYModel');
const ApiCjsjy = require('./ApiCjsjy');
const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
cc.Class({
    extends: cc.Component,

    properties: {
        cardPfb: cc.Prefab,
        cardLayout: cc.Node,
        btn_enter: cc.Node,
        _cardList: []
    },

    onLoad() {
        let myCard = CJSJYModel.getHandCardsByChairID(CJSJYModel.getMyChairID())
        for (let i = 0; i < myCard.length; i++) {
            const cid = myCard[i];
            let com = this.getNewCard(i)
            com.flower = cid
            com.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this)
            this._cardList.push(com)
        }
        this.btn_enter.on("click", this.onShowCard, this)
    },

    getNewCard(i) {
        let node = cc.instantiate(this.cardPfb)
        node.parent = this.cardLayout
        node.name = i + ""
        let com = node.addComponent('CJSJYCard')
        com.init()
        com.setNodeShow(true)
        return com
    },

    onTouchEnd(event) {
        let idx = parseInt(event.target.name)
        for (let i = 0; i < this._cardList.length; i++) {
            const com = this._cardList[i];
            com.setQiIcon(i == idx)
        }
    },

    onShowCard() {
        let qiCard = null
        for (let i = 0; i < this._cardList.length; i++) {
            const com = this._cardList[i];
            let qiNode = com.getQiIcon()
            if (qiNode.active) {
                qiCard = com.flower
            }
        }
        if (qiCard) {
            let myCard = CJSJYModel.getHandCardsByChairID(CJSJYModel.getMyChairID())
            let idx = myCard.indexOf(qiCard)
            if (idx != -1) {
                myCard.splice(idx, 1)
            }
            ApiRoom.gameMessageNotify(ApiCjsjy.gameShowCardsNotify(myCard));
        } else {
            AssetsManager.tipDialog("请选择一张需要放弃的牌")
        }
    }

});