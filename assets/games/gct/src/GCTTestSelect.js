const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiGct = require('./ApiGct');
const gameLogic = require('./GCTGameLogic');

cc.Class({
    extends: cc.Component,

    properties: {
        cardContent: cc.Node,
        selectedContent: cc.Node,
        selectedList: []
    },

    onLoad() {
        this._cardCount = 10;
        this._callback = this.node.nodeParams.callback;
        this._optChairID = this.node.nodeParams.optChairID;
        MessageCallback.addListener('GameMessagePush', this);
        ApiRoom.gameMessageNotify(ApiGct.gameInqtireArrcardsNotify(this._optChairID));
    },

    onDestroy() {
        MessageCallback.removeListener('GameMessagePush', this);
    },

    messageCallbackHandler(route, msg) {
        if (route === 'GameMessagePush') {
            if (msg.type === ApiGct.GAME_INQTIRE_ARRCARDS_PUSH) {
                this.showAllCard(msg)
            } else if (msg.type === ApiGct.GAME_SUBSTRATUM_TRADE_CARDS_PUSH) {
                if (!!msg.data && !!msg.data.trust) {
                    AssetsManager.tipDialog('成功了');
                } else {
                    AssetsManager.tipDialog('换牌失败，请重试');
                }
                this.onClose()
            }
        }
    },

    onClose() {
        this.node.destroy();
    },

    /**按钮响应 */
    onBtnClick(event, param) {
        if (CCUtil.clickInterval(event)) {
            return;
        }
        switch (event.target.name) {
            case "btn_enter":
                this.enterSetCard()
                break;
            case "btn_close":
                this.onClose()
                break;
        }
    },

    showAllCard(msg) {
        // console.log('牌库', msg)
        let curArr = msg.data.cardData || [];
        let allArr = msg.data.cardDataArr || [];
        if (!allArr.length && this._callback) {
            this._callback();
            this.onClose();
            this._callback = null;
            return
        }
        this.selectedList = curArr.slice();
        allArr = allArr.concat(curArr.slice());
        allArr.sort((a, b) => a - b);
        let cardItem = cc.find("cardItem", this.node)
        for (let i = 0; i < allArr.length; i++) {
            const cardData = allArr[i];
            let node = cc.instantiate(cardItem)
            node.name = cardData + ""
            node.parent = this.cardContent
            AssetsManager.loadSpriteFrame({
                path: 'sprite/cards/' + cardData,
                sprite: node.getComponent(cc.Sprite),
            });
            if (curArr.indexOf(cardData) !== -1) {
                node.getChildByName("selected").active = true
            }
            node.on(cc.Node.EventType.TOUCH_END, this.clickNode.bind(this));
        }

        for (let i = 0; i < curArr.length; i++) {
            const cardData = curArr[i];
            let node = cc.instantiate(cardItem)
            node.name = cardData + ""
            node.parent = this.selectedContent
            AssetsManager.loadSpriteFrame({
                path: 'sprite/cards/' + cardData,
                sprite: node.getComponent(cc.Sprite),
            });
        }
    },

    /**选中牌 */
    clickNode(event) {
        let node = event.target
        let selected = node.getChildByName("selected")
        selected.active = !selected.active;
        if (selected.active) {
            if (this.selectedList.length >= this._cardCount) {
                AssetsManager.tipDialog(`一次只能选择${this._cardCount}张牌！`);
                selected.active = false;
                return;
            }
            let cardItem = cc.find("cardItem", this.node)
            this.selectedList.push(parseInt(node.name))
            let selectedList = gameLogic.sortCardList(this.selectedList)
            this.selectedContent.removeAllChildren()
            for (let i = 0; i < selectedList.length; i++) {
                const cardData = selectedList[i];
                let node = cc.instantiate(cardItem)
                node.name = cardData + ""
                node.parent = this.selectedContent
                AssetsManager.loadSpriteFrame({
                    path: 'sprite/cards/' + cardData,
                    sprite: node.getComponent(cc.Sprite),
                });
            }
        } else {
            let card = this.selectedContent.getChildByName(node.name)
            if (card) {
                let idx = this.selectedList.indexOf(parseInt(node.name))
                if (idx > -1) {
                    this.selectedList.splice(idx, 1)
                }
                card.destroy()
            }
        }
    },

    /**发送选中数据 */
    enterSetCard() {
        let list = this.cardContent.children;
        let cardDataList = []
        list.forEach(card => {
            let selected = card.getChildByName("selected")
            if (selected.active) {
                let cardData = parseInt(card.name)
                cardDataList.push(cardData)
            }
        });
        if (cardDataList.length != this._cardCount && cardDataList.length != 0) {
            AssetsManager.tipDialog(`请选择${this._selectedCount}张牌、或者不选`);
            return;
        }
        ApiRoom.gameMessageNotify(ApiGct.gameSubstratumTradeCardsNotify(this._optChairID, cardDataList));
    },

});