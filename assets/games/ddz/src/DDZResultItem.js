const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const Enums = require('../../../src/const/Enums');
const DDZModel = require('./DDZModel');
cc.Class({
    extends: cc.Component,

    properties: {
        head: cc.Sprite,
        nick: cc.Label,
        id: cc.Label,
        bomb: cc.Label,
        cards: cc.Node,
        rest: cc.Label,
        win: cc.Label,
        lose: cc.Label,
        winMark: cc.Node,
        banker: cc.Node
    },

    bind(data) {
        AssetsManager.loadSpriteFrame({
            path: data.avatar,
            sprite: this.head
        });
        this.nick.string = data.nickname;
        this.id.string = data.uid;
        if (data.winScores > 0) {
            this.win.string = `+${Utils.formatNumberWithDecimal(data.winScores, 1)}`;
            this.lose.string = '';
        } else if (data.winScores < 0) {
            this.lose.string = `${Utils.formatNumberWithDecimal(data.winScores, 1)}`;
            this.win.string = '';
        } else {
            this.lose.string = '0';
            this.win.string = '0';
        }
        let gameRule = data.gameRule
        let laizi = gameRule.isLai || false;
        let laiZiList = laizi ? gameRule.laiZiList || [] : [];
        this.banker.active = data.uid == data.bankerUid;
        this.bomb.string = data.userBoomCounts || 0;
        this.winMark.active = data.winScores > 0;
        if (!data.beginCards) return;
        let beginCards = data.beginCards,
            handCards = data.handCards || [];
        this.rest.string = `剩余${handCards.length}张`;
        AssetsManager.loadAsset({
            path: 'res/prefab/DDZCard',
            bundle: Enums.bundleType.DDZ,
            aType: cc.Prefab
        }, (item) => {
            if (!item || !cc.isValid(this.cards)) return;
            this.cards.destroyAllChildren();
            for (const id of beginCards) {
                const card = cc.instantiate(item);
                this.cards.addChild(card);
                let cardCtrl = card.getComponent('DDZCard');
                cardCtrl.setMark(handCards.indexOf(id) != -1);
                cardCtrl.setLaiZi(DDZModel.isLaiZiCardID(id, laiZiList));
                cardCtrl.flower = id;
            }
        });
    },

});