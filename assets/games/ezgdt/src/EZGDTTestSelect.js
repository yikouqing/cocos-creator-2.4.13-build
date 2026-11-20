const ApiEzgdt = require('./ApiEzgdt');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ApiRoom = require('../../../src/api/ApiRoom');

let CARD_COUNT = 2

cc.Class({
    extends: cc.Component,

    properties: {
        cardPfb: cc.Prefab,
        cardContent: cc.Node,
        selectedContent: cc.Node,
        _canEnter: true,
        _selectedList: [],
    },

    onLoad() {
        this._user = this.node.nodeParams.user || {};
        MessageCallback.addListener('GameMessagePush', this);
        this._callback = this.node.nodeParams && this.node.nodeParams.callback ? this.node.nodeParams.callback : null;
        ApiRoom.gameMessageNotify(ApiEzgdt.gameGetTestCardsNotify(this._user.uid));
        this.node.active = false;
    },

    onDestroy() {
        MessageCallback.removeListener('GameMessagePush', this);
    },

    messageCallbackHandler(route, msg) {
        if (route === 'GameMessagePush') {
            if (msg.type === ApiEzgdt.GAME_GET_TEST_CARDS_PUSH) {
                this.showAllCard(msg)
            } else if (msg.type === ApiEzgdt.GAME_SET_TEST_CARDS_PUSH) {
                if (msg.data.isSuccess) {
                    AssetsManager.tipDialog('成功了');
                    this.onClose()
                } else {
                    AssetsManager.tipDialog('失败，请重试');
                    this.onClose()
                }
            }
        }
    },

    onClose() {
        this.node.destroy();
    },

    /**按钮响应 */
    onBtnClick(event) {
        switch (event.target.name) {
            case "btn_enter":
                this.enterSetCard()
                break;
            case "btn_close":
                this.onClose()
                break;
        }
    },

    generateNewCard(type, cardData) {
        let node = cc.instantiate(this.cardPfb)
        node.name = cardData + ""
        node.active = true
        if (type == 1) {
            node.parent = this.cardContent
            node.on(cc.Node.EventType.TOUCH_END, this.clickNode.bind(this));
        } else if (type == 2) {
            node.parent = this.selectedContent
            node.on(cc.Node.EventType.TOUCH_END, this.clickNode2.bind(this));
        }
        let com = node.addComponent('EZGDTCard')
        com.init()
        com.flower = cardData
        com.setNodeShow(true)
        com.setNodeScale(0.4)
    },

    showAllCard(msg) {
        if ((!msg.data.allCardsData || !msg.data.allCardsData.length) && this._callback) {
            this._callback && this._callback();
            this.onClose();
            this._callback = null;
            return
        };
        this.node.active = true;
        let selectedList = msg.data.testCards || []
        let ss = selectedList.slice()
        let allCardList = msg.data.allCardsData.concat(selectedList)
        allCardList.sort((a, b) => a - b)
        for (let i = 0; i < allCardList.length; i++) {
            const cardData = allCardList[i];

            /**相同的牌重叠显示 */
            let node = this.cardContent.getChildByName("" + cardData)
            if (cc.isValid(node)) {
                let txt_num = node.getChildByName("txt_num").getComponent(cc.Label)
                if (txt_num.string == "") {
                    txt_num.string = "0/2"
                } else {
                    let numlist = txt_num.string.split("/")
                    let sum = parseInt(numlist[1]) + 1
                    txt_num.string = `0/${sum}`
                }
            } else {
                this.generateNewCard(1, cardData)
            }

        }

        /**显示选中的牌 */
        let children = this.cardContent.children
        children.forEach(n => {
            let cardData = parseInt(n.name)
            let ii = ss.indexOf(cardData)
            let i = 0
            while (ii !== -1) {
                ss.splice(ii, 1)
                n.getChildByName("selected").active = true
                let txt_num = n.getChildByName("txt_num").getComponent(cc.Label)
                if (txt_num.string != "") {
                    let numlist = txt_num.string.split("/")
                    let selectNum = parseInt(numlist[0]) + 1
                    txt_num.string = `${selectNum}/${numlist[1]}`
                }
                ii = ss.indexOf(cardData)
            }
        });

        /**显示选中列表 */
        this._selectedList = selectedList
        for (let i = 0; i < selectedList.length; i++) {
            const cardData = selectedList[i];
            this.generateNewCard(2, cardData)
        }
    },

    addCardToSelectList(node) {
        this._selectedList.push(parseInt(node.name))
        let selectedList = this._selectedList
        this.selectedContent.removeAllChildren();
        for (let i = 0; i < selectedList.length; i++) {
            const cardData = selectedList[i];
            this.generateNewCard(2, cardData)
        }
    },

    /**选中牌 */
    clickNode(event) {
        if (this._selectedList.length >= CARD_COUNT) {
            AssetsManager.tipDialog(`不能大于${CARD_COUNT}张`);
            return
        }
        let node = event.target
        let selected = node.getChildByName("selected")
        if (!selected.active) {
            selected.active = true
        }

        let txt_num = node.getChildByName("txt_num").getComponent(cc.Label)
        let num = 1
        if (txt_num.string != "") {
            let numlist = txt_num.string.split("/")
            if (parseInt(numlist[0]) < parseInt(numlist[1])) {
                num = parseInt(numlist[0]) + 1
                txt_num.string = `${num}/${numlist[1]}`
                this.addCardToSelectList(node)
            }
        } else {
            if (!this._selectedList.includes(parseInt(node.name))) {
                this.addCardToSelectList(node)
            }
        }
    },

    /**取消选择牌 */
    clickNode2(event) {
        let node = event.target
        let card = this.cardContent.getChildByName(node.name)
        let selected = card.getChildByName("selected")
        let txt_num = card.getChildByName("txt_num").getComponent(cc.Label)
        if (txt_num.string == "") {
            selected.active = false
        } else {
            let numlist = txt_num.string.split("/")
            let sn = parseInt(numlist[0]) - 1
            txt_num.string = `${sn}/${numlist[1]}`
            if (sn == 0) {
                selected.active = false
            }
        }
        /**删除选择数组里面的牌 */
        let idx = this._selectedList.indexOf(parseInt(node.name))
        if (idx !== -1) {
            this._selectedList.splice(idx, 1)
        }
        /**删除该节点 */
        node.removeFromParent()
    },

    /**发送选中数据 */
    enterSetCard() {
        if (!this._canEnter) return;

        let count = CARD_COUNT
        if (this._selectedList.length > count) {
            AssetsManager.tipDialog(`不能大于${count}张`);
            return
        }
        if (this._selectedList.length == 0) {
            return
        }

        ApiRoom.gameMessageNotify(ApiEzgdt.gameSetTestCardsNotify(this._user.uid, this._selectedList));
        this._canEnter = false
        this.scheduleOnce(() => {
            this._canEnter = true
        }, 1)
    }
});