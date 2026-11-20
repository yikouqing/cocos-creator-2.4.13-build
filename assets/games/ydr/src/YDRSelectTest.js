const YDRModel = require('./YDRModel');
const ApiYdr = require('./ApiYdr');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const UserModel = require('../../../src/model/UserModel');
const ApiRoom = require('../../../src/api/ApiRoom');

cc.Class({
    extends: cc.Component,
    properties: {
        layout: cc.Node,
        cardPfb: cc.Prefab,
    },

    start() {
        MessageCallback.addListener('GameMessagePush', this);
        ApiRoom.gameMessageNotify(ApiYdr.gameInqtireArrcardsNotify());
    },
    messageCallbackHandler(route, msg) {
        if (route === 'GameMessagePush') {
            if (msg.type === ApiYdr.GAME_INQTIRE_ARRCARDS_PUSH) {
                let cards = msg.data.allCardsData;
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
                    let node = cc.instantiate(this.cardPfb)
                    let com = node.addComponent('YDRCard');
                    com.init();
                    com.flower = i;
                    let labelNode = new cc.Node;
                    let lebel = labelNode.addComponent(cc.Label);
                    lebel.string = dataArr[i] + "张";
                    lebel.fontSize = 30;
                    labelNode.parent = node;
                    labelNode.setPosition(cc.v2(0, -120));
                    com.setMask(i == msg.data.testCards)
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

            } else if (msg.type === ApiYdr.GAME_SUBSTRATUM_TRADE_CARDS_PUSH) {
                if (msg.data.isSuccess) {
                    AssetsManager.tipDialog('换牌成功！');
                    this.onClose()
                } else {
                    AssetsManager.tipDialog('换牌失败，请重试！');
                }
            }
        }
    },

    clickNode(card) {
        ApiRoom.gameMessageNotify(ApiYdr.gameSubstratumTradeCardsNotify(parseInt(card)));
    },

    onClose() {
        this.node.destroy()
    },

    onDestroy() {
        MessageCallback.removeListener('GameMessagePush', this);
    }
});