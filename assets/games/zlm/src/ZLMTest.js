const ApiZlm = require('./ApiZlm');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const ApiRoom = require('../../../src/api/ApiRoom');

cc.Class({
    extends: cc.Component,

    properties: {
        _mainDialog: null
    },

    onDestroy() {
        MessageCallback.removeListener('GameMessagePush', this);
        MessageCallback.removeListener('RoomMessagePush', this);
    },

    start() {
        this._mainDialog = this.node.nodeParams.mainDialog;
        MessageCallback.addListener('GameMessagePush', this);
        MessageCallback.addListener('RoomMessagePush', this);
        this.reqLookCard();
    },

    reqLookCard() { },

    messageCallbackHandler(route, msg) {
        // if (route === 'GameMessagePush') {
        //     switch (msg.type) {
        //         case ApiZlm.GAME_LOOK_CARDS_PUSH:
        //             this.showAllCard(msg)
        //             break;
        //         case ApiZlm.GAME_START_PUSH:
        //             this.cleanTable()
        //             this.reqLookCard()
        //             break;
        //         case ApiZlm.GAME_USER_OUT_CARD_PUSH:
        //             this.reqLookCard()
        //             break;
        //         case ApiZlm.GAME_USER_PASS_PUSH:
        //             this.reqLookCard()
        //             break;
        //         case ApiZlm.GAME_RESULT_PUSH:
        //             this.cleanTable()
        //             break;
        //         default:
        //             break;
        //     }
        // } else if (route == "RoomMessagePush") {
        //     if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
        //         this.cleanTable()
        //     } else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
        //         this.cleanTable()
        //     }
        // }
    },

    /**清除界面 */
    cleanTable() {
        for (let i = 0; i < 3; i++) {
            let userContent = cc.find("user" + (i + 1), this.node);
            if (cc.isValid(userContent)) {
                userContent.removeAllChildren();
            }
        }
    },

    showAllCard(msg) {
        // console.log('调试牌得数据', msg);
        let cardList = msg.data.userArray
        if (!msg.data.userArray || !Array.isArray(msg.data.userArray) || !Array.isArray(msg.data.userArray[0])) {
            this.cleanTable()
            return
        }
        let cardItem = cc.find("cardItem", this.node)
        for (let i = 0; i < cardList.length; i++) {
            const userCardList = cardList[i];
            let index = this._mainDialog.getUserChairIndex(i)
            if (index === 0) {
                continue;
            }
            let head = cc.find("Head" + (index + 1), this._mainDialog.node)
            if (!head || !head.active) {
                continue;
            }
            let userContent = cc.find("user" + (index + 1), this.node);
            userContent.removeAllChildren();
            userContent.setPosition(head.getPosition())
            userContent.y = 200;
            if (userContent.x < 0) userContent.x += 50;
            else userContent.x -= 50;
            for (let j = 0; j < userCardList.length; j++) {
                const cardData = userCardList[j];
                let node = cc.instantiate(cardItem)
                node.name = cardData + ""
                node.parent = userContent;
                node.active = true;
                AssetsManager.loadSpriteFrame({
                    path: 'sprite/cards/' + cardData,
                    sprite: node.getComponent(cc.Sprite)
                });
            }
        }
    }

});