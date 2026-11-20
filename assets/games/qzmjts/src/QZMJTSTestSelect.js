const ApiQzmjTS = require('./ApiQzmjTS');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager')
const ApiRoom = require('../../../src/api/ApiRoom');
const QZMJTSModel = require('./QZMJTSModel');
const Enums = require('../../../src/const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {
        cardContent: cc.Node,
        selectedContent: cc.Node,
        tilePfb: cc.Node,
        _canEnter: true,
        _selectedList: [],

    },

    onLoad() {
        let user = this.node.nodeParams && this.node.nodeParams.user ? this.node.nodeParams.user : null;
        this.userInfo = user.userInfo
        this.uid = this.node.nodeParams && this.node.nodeParams.uid ? this.node.nodeParams.uid : null;
        this.type = this.node.nodeParams && this.node.nodeParams.type ? this.node.nodeParams.type : null;
        this._callback = this.node.nodeParams && this.node.nodeParams.call ? this.node.nodeParams.call : null;
        MessageCallback.addListener('GameMessagePush', this);
        MessageCallback.addListener('TestClickReq', this)
    },

    onDestroy() {
        MessageCallback.removeListener('GameMessagePush', this);
        MessageCallback.removeListener('TestClickReq', this)
    },

    start() {
        this.node.active = false
        // 默认模牌牌库
        this.onCards()

    },

    messageCallbackHandler(route, msg) {
        if (route === 'GameMessagePush') {
            // console.log(msg, '**************');
            if (msg.type === ApiQzmjTS.GAME_INQTIRE_ARRCARDS_PUSH) {
                // msg.data.allCardsData = []
                // console.log('查询牌库', msg);
                if (!msg.data || !msg.data.allCardsData || !msg.data.allCardsData.length) {
                    if (this._callback) {
                        this._callback();
                        this.destroySelf();
                        this._callback = null;
                        return
                    }
                }
                this.showAllCard(msg)
            } else if (msg.type === ApiQzmjTS.GAME_SUBSTRATUM_TRADE_CARDS_PUSH) {
                // console.log('417', msg);
                let mssg = !!this.nullType ? '取消选牌' : '成功了'
                if (!!msg.data.isSuccess == true) {
                    AssetsManager.tipDialog(mssg);
                    this.destroySelf()
                } else {
                    AssetsManager.tipDialog('换牌失败，请重试');
                    this.destroySelf()
                }
            }
        } else if (route === 'TestClickReq') {
            // console.log('查询牌库', msg);

        }
    },

    destroySelf() {
        this.node.destroy();
    },

    /**按钮响应 */
    onBtnClick(event) {
        switch (event.target.name) {
            case "btn_enter":
                this.enterSetCard()
                break;
            case "btn_close":
                // 取消换牌 
                this.nullType = true
                // 发送选中数据
                if (this.type == 0) {
                    this.Cards = [];
                } else {
                    this.handCards = [];
                }
                ApiRoom.gameMessageNotify(ApiQzmjTS.gameSubstratumTradeCardsNotify(this.nullType, this.uid, this.userInfo.uid, this.type, this.Cards, this.handCards));
                this.destroySelf()
                break;
        }
    },

    // 手牌 只能选择13张牌
    onHandCards() {
        //0查询当前牌库 1查询下局牌库
        this.type = 1
        ApiRoom.gameMessageNotify(ApiQzmjTS.gameInqtireArrcardsNotify(this.type, this.userInfo.uid));
    },

    // 摸的牌 只能选择1张牌
    onCards() {
        this.type = 0
        ApiRoom.gameMessageNotify(ApiQzmjTS.gameInqtireArrcardsNotify(this.type, this.userInfo.uid));
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
        let com = node.addComponent('QZMJTSSingleTile')
        com.init()
        com.flower = cardData
        com.setNodeShow(true)
    },

    showAllCard(msg) {
        this.selectedContent.removeAllChildren();
        this.cardContent.removeAllChildren();
        this.node.active = true
        if (!msg.data.allCardsData) return
        let carData = msg.data.testCards || {}
        let userS = carData[this.userInfo.uid]
        this.Cards = userS.Cards || 0
        let selectedList = [];
        this._selectedNum = 0;
        this.handCards = userS.handCards || []
        // console.log(this.type, 'type');
        if (this.type == 0) {
            if (this.Cards) {
                selectedList = [this.Cards]
            }
            this._selectedNum = 1;
        } else {
            let gameNumber = QZMJTSModel.getGameRule()
            this._selectedNum = 16;
            if (this.handCards.length) {
                selectedList = this.handCards
            }
        }

        let allCardList = msg.data.allCardsData


        let ss = selectedList.slice()
        if (Array.isArray(selectedList) && selectedList.length) {
            allCardList = allCardList.concat(selectedList)
        }


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

        // console.log("selectedList", selectedList)

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
                    txt_num.string = `${selectNum} /${numlist[1]}`
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
        if (this._selectedList.length > this._selectedNum - 1) {
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
        if (this._selectedList.length != this._selectedNum) {
            AssetsManager.tipDialog(`请选择${this._selectedNum}张`);
            return
        }
        // console.log("发送的牌==", this._selectedList)
        // uid, nextUid, type, cards, handCards
        // 操作玩家的uid
        this.nullType = false
        if (this.type == 0) {
            this.Cards = this._selectedList || this.Cards
        } else if (this.type == 1) {
            this.handCards = this._selectedList || this.handCards
        } else {
            this.Cards = []
            this.handCards = []
        }
        ApiRoom.gameMessageNotify(ApiQzmjTS.gameSubstratumTradeCardsNotify(this.nullType, this.uid, this.userInfo.uid, this.type, this.Cards, this.handCards));
        this._canEnter = false
        this.scheduleOnce(() => {
            this._canEnter = true
        }, 1)
    }
});