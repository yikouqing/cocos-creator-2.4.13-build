const MessageCallback = require('../../../src/utils/MessageCallback');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiLyc = require('./ApiLyc');
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const LYCModel = require('./LYCModel');

cc.Class({
    extends: cc.Component,

    properties: {
        cardContent: cc.Node
    },

    onLoad() {
        MessageCallback.addListener('GameMessagePush', this);
    },

    onDestroy() {
        MessageCallback.removeListener('GameMessagePush', this);
    },

    start() {
        ApiRoom.gameMessageNotify(ApiLyc.gameInqtireArrcardsNotify(LYCModel.getMyChairID()));
    },

    messageCallbackHandler(route, msg) {
        if (route === 'GameMessagePush') {
            if (msg.type === ApiLyc.GAME_INQTIRE_ARRCARDS_PUSH) {
                // console.log("查询牌库", msg)
                this.showAllCard(msg)
            } else if (msg.type === ApiLyc.GAME_SUBSTRATUM_TRADE_CARDS_PUSH) {
                // console.log("下局换牌结果", msg)
                if (msg.data.trust) {
                    AssetsManager.tipDialog('成功了!');
                    this.destroySelf()
                } else {
                    AssetsManager.tipDialog('换牌失败，请重试!');
                    this.destroySelf()
                }
            }
        }
    },

    destroySelf() {
        this.node.destroy();
    },

    /**按钮响应 */
    onBtnClick(event, param) {
        switch (event.target.name) {
            case "btn_close":
                this.destroySelf()
                break;
        }
    },

    showAllCard(msg) {
        let selectedCard = msg.data.cardData
        let allCardList = msg.data.cardDataArr
        if (!allCardList) {
            return
        }
        allCardList.sort((a, b) => a - b)
        let cardItem = cc.find("cardItem", this.node)
        for (let i = 0; i < allCardList.length; i++) {
            const cardData = allCardList[i];
            let node = cc.instantiate(cardItem)
            node.name = cardData + ""
            node.parent = this.cardContent;
            AssetsManager.loadSpriteFrame({
                path: 'sprite/cards/' + cardData,
                sprite: node.getComponent(cc.Sprite)
            });
            if (selectedCard === cardData) {
                node.getChildByName("selected").active = true
            }
            node.on(cc.Node.EventType.TOUCH_END, this.clickNode.bind(this));
        }
    },

    /**选中牌 */
    clickNode(event) {
        let node = event.target
        let cardData = parseInt(node.name)
        ApiRoom.gameMessageNotify(ApiLyc.gameSubstratumTradeCardsNotify(LYCModel.getMyChairID(), cardData));
    },

});