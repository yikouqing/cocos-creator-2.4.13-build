const ApiFjsss = require('./ApiFjsss');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager')
const ApiRoom = require('../../../src/api/ApiRoom');
const FJSSSModel = require('./FJSSSModel');
const Enums = require('../../../src/const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {
        cardContent: cc.Node,
        selectedContent: cc.Node,
        _canEnter: true,
        _selectedList: [],
    },

    onLoad() {
        this._user = this.node.nodeParams.user || {};
        MessageCallback.addListener('GameMessagePush', this);
        this._callback = this.node.nodeParams && this.node.nodeParams.callback ? this.node.nodeParams.callback : null;
        ApiRoom.gameMessageNotify(ApiFjsss.gameGetTestCardsNotify(this._user.uid));
        this.node.active = false;
    },

    onDestroy() {
        MessageCallback.removeListener('GameMessagePush', this);
    },

    messageCallbackHandler(route, msg) {
        if (route === 'GameMessagePush') {
            if (msg.type === ApiFjsss.GAME_GET_TEST_CARDS_PUSH) {
                this.showAllCard(msg)
            } else if (msg.type === ApiFjsss.GAME_SET_TEST_CARDS_PUSH) {
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
        let cardItem = cc.find("cardItem", this.node)
        let node = cc.instantiate(cardItem)
        node.name = cardData + ""
        if (type == 1) {
            node.parent = this.cardContent
            node.on(cc.Node.EventType.TOUCH_END, this.clickNode.bind(this));
        } else if (type == 2) {
            node.parent = this.selectedContent
            node.on(cc.Node.EventType.TOUCH_END, this.clickNode2.bind(this));
        }
        let com = node.addComponent('FJSSSCard')
        com.init()
        com.flower = cardData
        com.setNodeShow(true)
    },

    showAllCard(msg) {
        if ((!msg.data.allCardsData || !msg.data.allCardsData.length) && this._callback) {
            this._callback && this._callback();
            this.onClose();
            this._callback = null;
            return
        };
        this.node.active = true;
        let selectedList = msg.data.testCards
        let ss = selectedList && selectedList.slice()
        let allCardList = selectedList && msg.data.allCardsData.concat(selectedList)
        allCardList.sort((a, b) => a - b)
        // console.log("合成过后的牌=", allCardList)
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
                // console.log("选中的牌", cardData, ss)
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

        let count = 13
        if (this._selectedList.length > count) {
            AssetsManager.tipDialog(`不能大于${count}张`);
            return
        }

        let wangCount = 0
        this._selectedList.forEach(cardid => {
            if (cardid == 52 || cardid == 53) {
                wangCount++
            }
        });
        let limit = 7
        if (wangCount >= limit) {
            AssetsManager.tipDialog(`不能大于${limit}张王`);
            return
        }
        // console.log("发送的牌==", this._selectedList)
        ApiRoom.gameMessageNotify(ApiFjsss.gameSetTestCardsNotify(this._selectedList, this._user.uid));
        this._canEnter = false
        this.scheduleOnce(() => {
            this._canEnter = true
        }, 1)
    }
});