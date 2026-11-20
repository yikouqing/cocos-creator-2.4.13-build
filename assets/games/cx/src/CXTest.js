const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiCx = require('./ApiCx');
const CXModel = require('./CXModel');
const Enums = require('../../../src/const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {
        cards: cc.Node,
        listNode: cc.Node,
        btnSubmit: cc.Node,

        _cardsPos: null,
        _cards: null,
        _allCards: null,
    },

    start() {
        this.btnSubmit.active = false;
        this._allCards = this.node.nodeParams ? this.node.nodeParams.allCardsData || [] : [];
        this._cards = this.node.nodeParams ? this.node.nodeParams.testCards || [] : [];
        this._allCards = this._allCards.concat(this._cards);
        this._allCards.sort((a, b) => {
            return a - b;
        });
        MessageCallback.addListener('RoomMessagePush', this);
        MessageCallback.addListener('GameMessagePush', this);
        cc.systemEvent.on('OnTestSelected', this._onTestSelected, this);
        this._cardsPos = {};
        this._cardsPos.one = [];
        let cardPos = cc.v2(0, 0);
        let cardWidth = this.cards.children[0].width;
        this._cardsPos.one.push(cardPos);
        this._cardsPos.two = [];
        this._cardsPos.two.push(cc.v2(cardPos.x - 0.5 * cardWidth, cardPos.y));
        this._cardsPos.two.push(cc.v2(cardPos.x + 0.5 * cardWidth, cardPos.y));
        this._cardsPos.three = [];
        this._cardsPos.three.push(cc.v2(cardPos.x - cardWidth, cardPos.y));
        this._cardsPos.three.push(cardPos);
        this._cardsPos.three.push(cc.v2(cardPos.x + cardWidth, cardPos.y));
        this._cardsPos.four = [];
        this._cardsPos.four.push(cc.v2(cardPos.x - 1.5 * cardWidth, cardPos.y));
        this._cardsPos.four.push(cc.v2(cardPos.x - 0.5 * cardWidth, cardPos.y));
        this._cardsPos.four.push(cc.v2(cardPos.x + 0.5 * cardWidth, cardPos.y));
        this._cardsPos.four.push(cc.v2(cardPos.x + 1.5 * cardWidth, cardPos.y));
        for (let index = 0; index < this.cards.children.length; index++) {
            this.cards.children[index].stopAllActions();
            this.cards.children[index].setPosition(cardPos);
            this.cards.children[index].active = false;
        }
        this.init();
    },

    init() {
        this.listNode.destroyAllChildren();
        AssetsManager.loadAsset({
            path: 'res/prefab/CXTestItem',
            bundle: Enums.bundleType.CX,
            aType: cc.Prefab
        }, (item) => {
            if (!item || !cc.isValid(this.listNode)) return;
            this.listNode.destroyAllChildren();
            for (let index = 0; index < this._allCards.length; index++) {
                const card = cc.instantiate(item);
                this.listNode.addChild(card);
                card.getComponent('CXTestItem') &&
                    card.getComponent('CXTestItem').bind(this._cards, this._allCards[index]);
            }
        });
        this._selectedSync();
    },

    btnClicks(event, param) {

        switch (param) {
            case 'submit':
                this._onSubmitClick();
                break;
            case 'close':
                this.node.destroy();
                break;
        }
    },

    _onSubmitClick() {
        if (this._cards.length != 4) return;
        ApiRoom.gameMessageNotify(ApiCx.setTestCardsNotify(this._cards))
    },

    _onTestSelected(card) {
        let index = this._cards.indexOf(card);
        if (index == -1) {
            if (this._cards.length == 4) {
                AssetsManager.tipDialog('一次最多只能换4张牌！');
                return;
            }
            this._cards.push(card);
        } else {
            this._cards.splice(index, 1);
        }
        cc.systemEvent.emit('OnTestSelectedSync', this._cards, this);
        this._selectedSync();
    },

    _selectedSync() {
        this.btnSubmit.active = this._cards.length == 4;
        let cardsLength = this._cards.length;
        let cardsRelativePos = this._cardsPos.one;
        if (cardsLength == 1) {
            cardsRelativePos = this._cardsPos.one;
        } else if (cardsLength == 2) {
            cardsRelativePos = this._cardsPos.two;
        } else if (cardsLength == 3) {
            cardsRelativePos = this._cardsPos.three;
        } else if (cardsLength == 4) {
            cardsRelativePos = this._cardsPos.four;
        }
        for (let index = 0; index < this.cards.children.length; index++) {
            if (index < cardsLength) {
                this.cards.children[index].active = true;
                this.cards.children[index].stopAllActions();
                AssetsManager.loadSpriteFrame({
                    path: 'sprite/cards/' + this._cards[index],
                    sprite: this.cards.children[index].getComponent(cc.Sprite)
                });
                cc.tween(this.cards.children[index])
                    .to(0.2, {
                        position: cc.v3(cardsRelativePos[index])
                    })
                    .start();
            } else {
                this.cards.children[index].stopAllActions();
                this.cards.children[index].active = false;
                AssetsManager.loadSpriteFrame({
                    path: 'sprite/cards/' + 0,
                    sprite: this.cards.children[index].getComponent(cc.Sprite)
                });
            }
        }
    },

    messageCallbackHandler(route, msg) {
        if (route === 'RoomMessagePush') {
            if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
                this.node.destroy();
            }
        } else if (route === 'GameMessagePush') {
            if (msg.type === ApiCx.GAME_STATUS_PUSH) {
                let gameStatus = CXModel.getGameStatus();
                if (gameStatus == ApiCx.gameStatus.NONE || ApiCx.gameStatus.RESULT) {
                    // this.node.destroy();
                }
            } else if (msg.type === ApiCx.GAME_SET_TEST_CARDS_PUSH) {
                if (!!msg.data.isSuccess) {
                    AssetsManager.tipDialog('选牌成功，下局生效！');
                    this.node.destroy();
                    return;
                }
                AssetsManager.tipDialog('选牌失败，请重试！')
            }
        }
    },

    onDestroy() {
        MessageCallback.removeListener('RoomMessagePush', this);
        MessageCallback.removeListener('GameMessagePush', this);
        cc.systemEvent.off('OnTestSelected', this._onTestSelected, this);
    },

});