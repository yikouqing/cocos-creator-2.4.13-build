const MessageCallback = require('../../../src/utils/MessageCallback');
const Enums = require('../../../src/const/Enums');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiXGPdk = require('./ApiXGPdk');
const AssetsManager = require('../../../src/utils/AssetsManager');
const gameLogic = require('./XGPDKGameLogic');
const XGPDKModel = require("./XGPDKModel")

cc.Class({
    extends: cc.Component,

    properties: {

        _mainDialog: null,
        cardContent: cc.Node,
        selectedContent: cc.Node,
        canEnter: true,
        selectedList: []
    },

    onLoad() {
        this._mainDialog = this.node.nodeParams.mainDialog;
        MessageCallback.addListener('GameMessagePush', this);
    },

    onDestroy() {
        MessageCallback.removeListener('GameMessagePush', this);
    },

    start() {
        ApiRoom.gameMessageNotify(ApiXGPdk.gameGetTestCardsNotify());
    },

    messageCallbackHandler(router, msg) {
        if (router === 'GameMessagePush') {
            if (msg.type === ApiXGPdk.GAME_GET_TEST_CARDS_PUSH) {
                this.showAllCard(msg)
            } else if (msg.type === ApiXGPdk.GAME_SET_TEST_CARDS_PUSH) {
                if (!!msg.data && !!msg.data.isSuccess) {
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
        if (!msg.data.allCardsData || !Array.isArray(msg.data.allCardsData)) return;
        let selectedList = msg.data.testCards || [];
        let allCardList = msg.data.allCardsData.concat(selectedList)
        allCardList = gameLogic.sortCardList(allCardList)
        allCardList.sort((a, b) => a - b)
        let cardItem = cc.find("cardItem", this.node)
        for (let i = 0; i < allCardList.length; i++) {
            const cardData = allCardList[i];
            let node = cc.instantiate(cardItem)
            node.name = cardData + ""
            node.parent = this.cardContent
            AssetsManager.loadSpriteFrame({
                path: 'sprite/cards/' + cardData,
                sprite: node.getComponent(cc.Sprite),
            });
            if (selectedList.indexOf(cardData) !== -1) {
                node.getChildByName("selected").active = true
            }
            node.on(cc.Node.EventType.TOUCH_END, this.clickNode.bind(this));
        }

        this.selectedList = selectedList
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
    },

    /**选中牌 */
    clickNode(event) {
        let node = event.target
        let selected = node.getChildByName("selected")
        selected.active = !selected.active;
        if (selected.active) {
            if (this.selectedList.length >= 16) {
                AssetsManager.tipDialog('一次只能选择16张牌！');
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
        if (!this.canEnter) return;
        let list = this.cardContent.children;
        let cardDataList = []
        list.forEach(card => {
            let selected = card.getChildByName("selected")
            if (selected.active) {
                let cardData = parseInt(card.name)
                cardDataList.push(cardData)
            }
        });
        // console.log('提交', cardDataList)
        let cardCount = XGPDKModel.getGameRuleByKey("cardCount")
        if (cardDataList.length != cardCount) {
            AssetsManager.tipDialog(`必须选${cardCount}张`);
            return;
        }
        ApiRoom.gameMessageNotify(ApiXGPdk.gameSetTestCardsNotify(cardDataList));
        this.canEnter = false
        this.scheduleOnce(() => {
            this.canEnter = true
        }, 5)
    },

});