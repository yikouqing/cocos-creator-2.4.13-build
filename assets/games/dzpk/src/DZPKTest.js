const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiDzpk = require('./ApiDzpk');
const DZPKModel = require('./DZPKModel');
const Enums = require('../../../src/const/Enums');
const CCUtil = require('../../../src/utils/CCUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        card: cc.Node,
        cards: cc.Node,
        listNode: cc.Node,
        btnSubmit: cc.Node,

        _cardsPos: null,
        _cards: null,
        _allCards: null,
    },

    onLoad() {
        AssetsManager.loadAsset({
            path: 'res/prefab/DZPKTestItem',
            bundle: Enums.bundleType.DZPK,
            aType: cc.Prefab
        });
    },

    start() {
        this.btnSubmit.active = false;
        MessageCallback.addListener('RoomMessagePush', this);
        MessageCallback.addListener('GameMessagePush', this);
        cc.systemEvent.on('OnTestSelected', this._onTestSelected, this);
        for (let index = 0; index < this.cards.children.length; index++) {
            this.cards.children[index].stopAllActions();
            this.cards.children[index].setPosition(cc.v2(0, 0));
            this.cards.children[index].active = false;
        }
        ApiRoom.gameMessageNotify(ApiDzpk.getGetTestCardsNotify())
    },

    init() {
        this.listNode.destroyAllChildren();
        AssetsManager.loadAsset({
            path: 'res/prefab/DZPKTestItem',
            bundle: Enums.bundleType.DZPK,
            aType: cc.Prefab
        }, (item) => {
            if (!item || !cc.isValid(this.listNode)) return;
            this.listNode.destroyAllChildren();
            for (let index = 0; index < this._allCards.length; index++) {
                const card = cc.instantiate(item);
                this.listNode.addChild(card);
                card.getComponent('DZPKTestItem') &&
                    card.getComponent('DZPKTestItem').bind(this._cards, this._allCards[index]);
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
        if (this._cards.length != 2) return;
        ApiRoom.gameMessageNotify(ApiDzpk.setTestCardsNotify(this._cards))
    },

    _onTestSelected(card) {
        let index = this._cards.indexOf(card);
        if (index == -1) {
            if (this._cards.length == 2) {
                AssetsManager.tipDialog('一次最多只能换2张牌！');
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
        this.btnSubmit.active = this._cards.length == 2;
        let cardsLength = this._cards.length;
        let cardsRelativePos = CCUtil.getStraightNodesPos(0, this._cards.length, this.card.getContentSize(), cc.v2(0.5, 0.5), 0, 0, 10);
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
            if (msg.type === ApiDzpk.GAME_STATUS_PUSH) {
                let gameStatus = DZPKModel.getGameStatus();
                if (gameStatus == ApiDzpk.gameStatus.NONE ||
                    gameStatus == ApiDzpk.gameStatus.DEAL ||
                    ApiDzpk.gameStatus.RESULT) {
                    this.node.destroy();
                }
            } else if (msg.type === ApiDzpk.GAME_SET_TEST_CARDS_PUSH) {
                // console.log('选牌结束', msg.data)
                if (!!msg.data.isSuccess) {
                    AssetsManager.tipDialog('选牌成功！');
                    this.node.destroy();
                    return;
                }
                AssetsManager.tipDialog('选牌失败，请重试！')
            } else if (msg.type === ApiDzpk.GAME_GET_TEST_CARDS_PUSH) {
                // console.log('选牌', msg);
                this._allCards = msg.data.allCardsData || [];
                this._cards = msg.data.testCards || [];
                this._allCards = this._allCards.concat(this._cards);
                this._allCards.sort((a, b) => {
                    return a - b;
                });
                this.init();
            }
        }
    },

    onDestroy() {
        MessageCallback.removeListener('RoomMessagePush', this);
        MessageCallback.removeListener('GameMessagePush', this);
        cc.systemEvent.off('OnTestSelected', this._onTestSelected, this);
    },

});