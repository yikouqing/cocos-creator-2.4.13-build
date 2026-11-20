const NNWjyModel = require('./NNWjyModel');
const ApiNnWjy = require('./ApiNnWjy');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const ConfigModel = require('../../../src/model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        head: cc.Sprite,
        nick: cc.Label,
        uid: cc.Label,
        status: cc.Label,
        winMark: cc.Node,
        List_Cards: cc.Node,
        Item_Cards: cc.Node,
        _user: null,
    },

    bind(user) {
        this._user = user;
        this.winMark.active = !!user.winRate;
        this.status.string = !!user.winRate ? '已开启' : '已关闭';
        AssetsManager.loadSpriteFrame({
            path: user.userInfo.avatar,
            sprite: this.head
        });
        this.nick.string = user.userInfo.nickname;
        this.uid.string = user.userInfo.uid;
        this.showCardsList(user.Cards);
    },

    showCardsList(cardsList = []) {
        this.Item_Cards.active = false;
        this.cardsList = cardsList || [];
        this.List_Cards.destroyAllChildren();
        this.cardsList.forEach((cardsID) => {
            let Item_Cards = cc.instantiate(this.Item_Cards);
            this.List_Cards.addChild(Item_Cards);
            Item_Cards.active = true;
            AssetsManager.loadSpriteFrame({
                path: ConfigModel.getCardUrl(cardsID),
                sprite: Item_Cards.getComponent(cc.Sprite)
            });
        })
    },

    onClick() {
        this._user.winRate = !!this._user.winRate ? 0 : 100;
        this.winMark.active = !!this._user.winRate;
        this.status.string = !!this._user.winRate ? '已开启' : '已关闭';
        this.sendData();
    },



    sendData() {
        if (!this._user) return;
        let params = {
            type: 1,
            Cards: this.cardsList,
            opUid: NNWjyModel.getMyUid(),
            winrate: this._user.winRate,
            uid: this._user.userInfo.uid,
        }
        // console.log(this.winMark.active, '发送', params,)
        ApiRoom.gameMessageNotify(ApiNnWjy.gameSubstratumTradeCardsNotify(NNWjyModel.getMyChairID(), params));
    },

    onChange() {
        if (!!this._user) {
            AssetsManager.createDialog({
                user: this._user,
                bundle: Enums.bundleType.WJYNN,
                cardsList: this.cardsList,
                path: "res/prefab/NNWjyReview",
            })
        }
    },

});