const ApiGct = require('./ApiGct');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const ApiRoom = require('../../../src/api/ApiRoom');

cc.Class({
    extends: cc.Component,

    properties: {
        _mainDialog: null,
        _userList: []
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
        this.initHeadPos()
    },

    reqLookCard() {
        ApiRoom.gameMessageNotify(ApiGct.gameLookCardsNotify(this._mainDialog.myChairID));
    },

    messageCallbackHandler(route, msg) {
        if (route === 'GameMessagePush') {
            switch (msg.type) {
                case ApiGct.GAME_LOOK_CARDS_PUSH:
                    this.showAllCard(msg)
                    break;
                case ApiGct.GAME_START_PUSH:
                    this.cleanTable()
                    this.reqLookCard()
                    break;
                case ApiGct.GAME_USER_OUT_CARD_PUSH:
                    this.reqLookCard()
                    break;
                case ApiGct.GAME_USER_PASS_PUSH:
                    this.reqLookCard()
                    break;
                case ApiGct.GAME_RESULT_PUSH:
                    this.cleanTable()
                    break;
                default:
                    break;
            }
        } else if (route == "RoomMessagePush") {
            if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
                this.cleanTable()
            } else if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
                this.cleanTable()
            }
        }
    },

    /**清除界面 */
    cleanTable() {
        for (let i = 0; i < 5; i++) {
            let userContent = cc.find("user" + (i + 1), this.node);
            if (cc.isValid(userContent)) {
                userContent.removeAllChildren();
            }
        }
    },

    showAllCard(msg) {
        let cardList = msg.data.userArray
        if (!msg.data.userArray || !Array.isArray(msg.data.userArray) || !Array.isArray(msg.data.userArray[0])) {
            // console.log("没有数据！")
            this.cleanTable()
            return
        }
        let cardItem = cc.find("cardItem", this.node)
        for (let i = 0; i < cardList.length; i++) {
            const userCardList = cardList[i];
            if (!userCardList || !Array.isArray(userCardList)) {
                continue
            }
            let index = this._mainDialog.getUserChairIndex(i)
            if (index === 0) {
                continue;
            }
            let head = this._mainDialog._userList[index].node
            if (!head || !head.active) {
                continue;
            }
            let userContent = this._userList[index]
            // console.log("=========", index, userContent)
            userContent.removeAllChildren();
            userContent.setPosition(head.getPosition())
            userContent.y += 30;
            if (userContent.x < 0) userContent.x += 120;
            else userContent.x -= 120;
            // console.log((index + 1), "设置的位置==", userContent.x, userContent.y, userCardList)
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
    },

    initHeadPos() {
        let headPos = [1, 2, 3, 4, 5]
        let playerCount = this._mainDialog.gameRule.maxPlayerCount
        if (playerCount == 2) {
            headPos = [1, 3]
        } else if (playerCount == 3) {
            headPos = [1, 2, 5]
        } else if (playerCount == 4) {
            headPos = [1, 2, 4, 5]
        }
        this._userList.length = 0
        for (let i = 0; i < headPos.length; i++) {
            let h = cc.find("user" + headPos[i], this.node)
            this._userList.push(h)
            h.removeAllChildren()
        }
        // console.log("this._userList", this._userList)
    },
});