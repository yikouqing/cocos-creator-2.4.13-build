const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiMjnn = require('./ApiMjnn');
const CCUtil = require('../../../src/utils/CCUtil');
const ApiRoom = require('../../../src/api/ApiRoom');

cc.Class({
    extends: cc.Component,

    properties: {
        cardContent: cc.Node,
        selectedContent: cc.Node,
        cardItem: cc.Node,
        _selectedList: [],
    },

    onLoad() {
        this._selectedNum = 5;
        this.cardItem.active = false;
        this._nextUid = this.node.nodeParams.nextUid;
        this._callback = this.node.nodeParams.callback;
        MessageCallback.addListener('GameMessagePush', this);
        ApiRoom.gameMessageNotify(ApiMjnn.gameGetTestCardsNotify(this._nextUid));
        this.node.active = false;
    },

    messageCallbackHandler(route, msg) {
        if (route === 'GameMessagePush') {
            if (msg.type === ApiMjnn.GAME_GET_TEST_CARDS_PUSH) {
                this.showAllCard(msg)
            } else if (msg.type === ApiMjnn.GAME_SET_TEST_CARDS_PUSH) {
                if (!!msg.data.isSuccess) {
                    AssetsManager.tipDialog('成功了');
                } else {
                    AssetsManager.tipDialog('换牌失败，请重试');
                }
                this.destroySelf()
            }
        }
    },

    showAllCard(msg) {

        // console.log("msg", msg)
        let curArr = msg.data.testCards || [];
        let allArr = msg.data.allCardsData || [];
        if (!allArr.length && this._callback) {
            this._callback();
            this.destroySelf();
            this._callback = null;
            return
        }
        this.node.active = true;
        let newArr = curArr.slice();
        this._selectedList = curArr.slice();
        this.cardContent.removeAllChildren();
        this.selectedContent.removeAllChildren();
        allArr = allArr.concat(curArr.slice());
        allArr.sort((a, b) => a - b);
        for (let i = 0; i < allArr.length; i++) {
            const cardID = allArr[i];
            /**相同的牌重叠显示 */
            let node = this.cardContent.getChildByName(cardID + "")
            if (cc.isValid(node)) {
                let txt_num = node.getChildByName("txt_num").getComponent(cc.Label)
                if (!!txt_num.string) {
                    let numlist = txt_num.string.split("/");
                    let sum = parseInt(numlist[1]) + 1;
                    txt_num.string = `0/${sum}`;
                } else {
                    txt_num.string = "0/2";
                }
            } else {
                this.generateNewCard(1, cardID)
            }
        }

        /**显示选中的牌 */
        this.cardContent.children.forEach(curNode => {
            let cardID = parseInt(curNode.name);
            let index = newArr.indexOf(cardID);
            while (index !== -1) {
                newArr.splice(index, 1);
                curNode.getChildByName("selected").active = true;
                let txt_num = curNode.getChildByName("txt_num").getComponent(cc.Label);
                if (!!txt_num.string) {
                    let numlist = txt_num.string.split("/");
                    let selectNum = parseInt(numlist[0]) + 1;
                    txt_num.string = `${selectNum} /${numlist[1]}`;
                }
                index = newArr.indexOf(cardID);
            }
        });
        /**显示选中列表 */
        this._selectedList.forEach((cardID) => {
            this.generateNewCard(2, cardID)
        })
    },

    generateNewCard(type, cardID) {
        let node = cc.instantiate(this.cardItem);
        node.name = cardID + "";
        node.setPosition(0, 0);
        node.active = true;
        node.getChildByName("txt_num").getComponent(cc.Label).string = "";
        if (type == 1) {
            node.parent = this.cardContent
            node.on(cc.Node.EventType.TOUCH_END, this.clickNode.bind(this));
        } else if (type == 2) {
            node.parent = this.selectedContent
            node.on(cc.Node.EventType.TOUCH_END, this.clickNode2.bind(this));
        }
        let com = node.addComponent('MJNNSingleTile');
        com.init();
        com.flower = cardID;
        com.setNodeShow(true);
    },

    addCardToSelectList(node) {
        this._selectedList.push(parseInt(node.name))
        let selectedList = this._selectedList
        this.selectedContent.removeAllChildren();
        for (let i = 0; i < selectedList.length; i++) {
            const cardData = selectedList[i];
            this.generateNewCard(2, cardData);
        }
    },

    /**选中牌 */
    clickNode(event) {
        if (this._selectedList.length >= this._selectedNum) {
            AssetsManager.tipDialog(`不能大于${this._selectedNum}张`);
            return
        }
        let node = event.target
        let selected = node.getChildByName("selected")
        if (!selected.active) {
            selected.active = true
        }

        let txt_num = node.getChildByName("txt_num").getComponent(cc.Label)
        let num = 1
        if (!!txt_num.string) {
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
        let card = this.cardContent.getChildByName(node.name);
        let txt_num = card.getChildByName("txt_num").getComponent(cc.Label);
        let selected = card.getChildByName("selected");
        selected.active = false;
        if (!!txt_num.string) {
            let numlist = txt_num.string.split("/");
            let sn = parseInt(numlist[0]) - 1;
            txt_num.string = `${sn}/${numlist[1]}`;
            selected.active = !!sn;
        }
        /**删除选择数组里面的牌 */
        let idx = this._selectedList.indexOf(parseInt(node.name));
        if (idx !== -1) this._selectedList.splice(idx, 1);
        node.removeFromParent() //删除该节点
    },

    /**发送选中数据 */
    enterSetCard() {
        if (this._selectedList.length != this._selectedNum) {
            AssetsManager.tipDialog(`请选择${this._selectedNum}张`);
            return
        }
        if (this.type == 0) {
            this.Cards = this._selectedList || this.Cards;
        } else {
            this.handCards = this._selectedList || this.handCards;
        }
        ApiRoom.gameMessageNotify(ApiMjnn.gameSetTestCardsNotify(this._nextUid, this.handCards));
    },
    /**按钮响应 */
    onBtnClick(event, clickType) {
        if (CCUtil.clickInterval(event)) {
            return;
        }
        switch (clickType) {
            case "btn_enter":
                this.enterSetCard()
                break;
            case "btn_close":
                this.destroySelf()
                break;
        }
    },



    destroySelf() {
        this.node.destroy();
    },
    onDestroy() {
        MessageCallback.removeListener('GameMessagePush', this);
    },
});