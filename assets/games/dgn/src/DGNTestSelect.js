const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiDgn = require('./ApiDgn');

cc.Class({
    extends: cc.Component,

    properties: {
        cardContent: cc.Node,
        selectedContent: cc.Node,
        tog_shenglv: cc.Toggle,
        _selectedOverlap: false,
    },

    onLoad() {
        this._selectedCount = 5;
        this._user = this.node.nodeParams.user;
        this.cardItem = cc.find("cardItem", this.node);
        if (this.cardItem) this.cardItem.active = false;
        this._callback = this.node.nodeParams.callback;
        this._optChairID = this.node.nodeParams.optChairID;
        MessageCallback.addListener('GameMessagePush', this);
        ApiRoom.gameMessageNotify(ApiDgn.getCardListNotify(this._optChairID));
        // this.node.active = false;
    },

    onDestroy() {
        MessageCallback.removeListener('GameMessagePush', this);
    },

    messageCallbackHandler(route, msg) {
        if (!this.node) return;
        if (route === 'GameMessagePush') {
            switch (msg.type) {
                case ApiDgn.GAME_GET_CARDLIST_PUSH:
                    this.showAllCard(msg);
                    break;
                case ApiDgn.GAME_CHANGE_HANDCARDS_PUSH:
                    if (!!msg.data && !!msg.data.isSuccess || !!msg.data.trust) {
                        AssetsManager.tipDialog('操作成功！');
                    } else {
                        AssetsManager.tipDialog('操作失败，请重试!');
                    }
                    this.destroySelf();
                    break;
                default:
                    break;
            }
        }
    },


    /**按钮响应 */
    onBtnClick(event, clickType) {
        if (CCUtil.clickInterval(event)) {
            return;
        }
        switch (clickType) {
            case "btn_enter":
                this.enterSetCard();
                break;
            case "btn_close":
                this.destroySelf();
                break;
            case "tog_shenglv":
                this.sendData(0);
                break;
        }
    },


    destroySelf() {
        this.node.destroy();
    },


    showAllCard(msg) {
        let curArr = msg.data.cardData || [];
        let allArr = msg.data.cardDataArr || [];
        if (!allArr.length && this._callback) {
            this._callback();
            this.destroySelf();
            this._callback = null;
            return
        }
        this.node.active = true;
        let newArr = curArr.slice();
        this._selectedList = curArr.slice();
        allArr = allArr.concat(curArr.slice());
        this.cardContent.removeAllChildren();
        this.selectedContent.removeAllChildren();
        if (!this.cardItem || !allArr.length) return;
        allArr.sort((a, b) => a - b);
        allArr.forEach((cardID) => {
            let node = this.cardContent.getChildByName(cardID + "");
            if (cc.isValid(node)) {
                let txt_num = node.getChildByName("txt_num").getComponent(cc.Label);
                if (txt_num.string == "") {
                    txt_num.string = "0/2"
                } else {
                    let numlist = txt_num.string.split("/");
                    let sum = parseInt(numlist[1]) + 1;
                    txt_num.string = `0/${sum}`;
                }
            } else {
                this.generateNewCard(1, cardID);
            }
        })

        this.cardContent.children.forEach(n => { //显示选中的牌
            let cardID = parseInt(n.name);
            let index = newArr.indexOf(cardID);
            while (index !== -1) {
                newArr.splice(index, 1);
                n.getChildByName("selected").active = true;
                let txt_num = n.getChildByName("txt_num").getComponent(cc.Label);
                if (txt_num.string != "") {
                    let numlist = txt_num.string.split("/");
                    let selectNum = parseInt(numlist[0]) + 1;
                    txt_num.string = `${selectNum}/${numlist[1]}`;
                }
                index = newArr.indexOf(cardID);
            }
        });
        curArr.forEach((cardID) => { //显示选中列表
            this.generateNewCard(2, cardID)
        })
    },

    generateNewCard(type, cardID) {
        if (this._selectedOverlap && type == 2) {
            let selectedNode = this.selectedContent.getChildByName(cardID);
            if (cc.isValid(selectedNode)) {
                let txt_SelectedNum = selectedNode.getChildByName("txt_num").getComponent(cc.Label);
                let numlist = txt_SelectedNum.string.split("/");
                let selectNum = parseInt(numlist[0]) + 1;
                txt_SelectedNum.string = `${selectNum}/${numlist[1]}`;
                return;
            }
        }

        let node = cc.instantiate(this.cardItem);
        node.name = cardID + "";
        node.active = true;
        if (type == 1) {
            node.parent = this.cardContent
            node.on(cc.Node.EventType.TOUCH_END, this.clickNode.bind(this));
        } else if (type == 2) {
            node.parent = this.selectedContent
            node.on(cc.Node.EventType.TOUCH_END, this.clickNode2.bind(this));
            if (this._selectedOverlap) {
                node.getChildByName("txt_num").getComponent(cc.Label).string = "1/2";
            }
        }
        AssetsManager.loadSpriteFrame({
            path: 'sprite/cards/' + cardID,
            sprite: node.getComponent(cc.Sprite)
        });
    },


    addCardToSelectList(node) {
        this._selectedList.push(parseInt(node.name))
        let selectedList = this._selectedList;
        this.selectedContent.removeAllChildren();
        for (let i = 0; i < selectedList.length; i++) {
            const cardID = selectedList[i];
            this.generateNewCard(2, cardID)
        }
    },

    /**选中牌 */
    clickNode(event) {
        if (this._selectedList.length >= this._selectedCount) {
            AssetsManager.tipDialog(`不能大于${this._selectedCount}张`);
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
        if (this._selectedOverlap) {
            let txt_SelectedNum = node.getChildByName("txt_num").getComponent(cc.Label)
            let numlist = txt_SelectedNum.string.split("/")
            let sn = parseInt(numlist[0]) - 1
            txt_SelectedNum.string = `${sn}/${numlist[1]}`
            if (sn == 0) {
                node.removeFromParent()
            }
        } else {
            node.removeFromParent()
        }
    },
    /**发送选中数据 */
    enterSetCard() {
        if (this._selectedList.length > this._selectedCount) {
            AssetsManager.tipDialog(`不能大于${this._selectedCount}张`);
            return
        }
        if (this._selectedList.length == 0) {
            return
        }
        let wangCount = 0,
            allwangCount = 4;
        this._selectedList.forEach(cardid => {
            if (cardid == 78 || cardid == 79) {
                wangCount++
            }
        });
        if (wangCount > allwangCount) {
            AssetsManager.tipDialog(`不能大于${allwangCount}张王`);
            return
        }
        ApiRoom.gameMessageNotify(ApiDgn.gameChangeHandCardsNotify(this._optChairID, this._selectedList));
    }

});