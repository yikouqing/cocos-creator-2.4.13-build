const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const Enums = require('../../../src/const/Enums');

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
        ranking: cc.Node
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

        let ranking = data.playerRanking || 0;
        this.ranking.active = !!ranking;
        ranking && AssetsManager.loadSpriteFrame({
            bundle: Enums.bundleType.GD,
            path: `res/sprite/main/spr_ming_${ranking}`,
            sprite: this.ranking.getComponent(cc.Sprite)
        });
        let userBoomCounts = data.userBoomCounts || [];
        this.bomb.string = userBoomCounts.length || 0;
        this.winMark.active = data.winScores > 0;
        if (!data.beginCards) return;
        let beginCards = data.beginCards,
            handCards = data.handCards || [];

        // console.log("beginCards", beginCards)
        this.rest.string = `剩余${handCards.length}张`;
        AssetsManager.loadAsset({
            path: 'res/prefab/GDCard',
            bundle: Enums.bundleType.GD,
            aType: cc.Prefab
        }, (item) => {
            if (!item || !cc.isValid(this.cards)) return;
            this.cards.destroyAllChildren();
            for (const id of beginCards) {
                const card = cc.instantiate(item);
                this.cards.addChild(card);
                card.getComponent('GDCard') && card.getComponent('GDCard').result(id, handCards);
            }
        });
    },

});