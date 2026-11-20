const DZPKModel = require('./DZPKModel');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Utils = require('../../../src/utils/Utils');
const Enums = require('../../../src/const/Enums');
const WIN_LABEL_COLOR = cc.color(218, 85, 28);
const LOSE_LABEL_COLOR = cc.color(20, 107, 176);
const LOSE_USER_NAME_COLOR = cc.color(70, 100, 132);

cc.Class({
    extends: cc.Component,

    properties: {
        itemBg1: cc.Node,
        itemBg2: cc.Node,
        head: cc.Sprite,
        score: cc.Label,
        nick: cc.Label,
        banker: cc.Sprite,
        actionLay: cc.Node,
        actionType: cc.Label,
        pourScore: cc.Label,
        winScore: cc.Label,
        holdCards: [require('DZPKCard')],
        pubCards: [require('DZPKCard')],
        cardTypeLbl: cc.Label
    },

    bind(data) {
        // console.log('牌局回顾', data);
        this.itemBg1.active = data.index % 2 == 0;
        this.itemBg2.active = !this.itemBg1.active;
        let cards = data.cards || [];
        let pubCards = data.publicCards || [];
        let mark = '';
        if (data.isBanker) {
            mark = 'd';
        } else if (data.uid == data.bigblindUid) {
            mark = 'b';
        } else if (data.uid == data.littleblindUid) {
            mark = 's';
        }
        if (mark.length != 0) {
            AssetsManager.loadSpriteFrame({
                path: `res/sprite/chip/${mark}`,
                bundle: Enums.bundleType.DZPK,
                sprite: this.banker
            });
        }
        for (let index = 0; index < this.holdCards.length; index++) {
            cards[index] = cards[index] || 0;
            if (!this.holdCards[index]) continue;
            this.holdCards[index].cardSync(cards[index]);
        }
        for (let index = 0; index < this.pubCards.length; index++) {
            pubCards[index] = pubCards[index] || 0;
            if (!this.pubCards[index]) continue;
            this.pubCards[index].cardSync(pubCards[index]);
        }
        if (data.winScore > 0) {
            this.cardTypeLbl.node.color = WIN_LABEL_COLOR;
            this.winScore.node.color = WIN_LABEL_COLOR;
            this.nick.node.color = WIN_LABEL_COLOR;
            this.winScore.string = `+${Utils.formatNumberWithDecimal(data.winScore)}`;
        } else if (data.winScore < 0) {
            this.cardTypeLbl.node.color = LOSE_USER_NAME_COLOR;
            this.nick.node.color = LOSE_USER_NAME_COLOR;
            this.winScore.node.color = LOSE_LABEL_COLOR;
            this.winScore.string = `${Utils.formatNumberWithDecimal(data.winScore)}`;
        } else {
            this.cardTypeLbl.node.color = LOSE_USER_NAME_COLOR;
            this.nick.node.color = LOSE_USER_NAME_COLOR;
            this.winScore.node.color = LOSE_LABEL_COLOR;
            this.winScore.string = `+${Utils.formatNumberWithDecimal(data.winScore)}`;
        }
        this.cardTypeLbl.string = DZPKModel.getCardTypeName(data.handCardsType[data.uid].cardType);
        this.pourScore.string = `下注:${Utils.formatNumberWithDecimal(data.pourScore)}`;
        this.actionLay.active = data.operateType != 0;
        this.actionType.string = DZPKModel.getOperateTypeName(data.operateType);
        this.score.string = `${Utils.formatNumberWithDecimal(data.userScore)}`;
        AssetsManager.loadSpriteFrame({
            path: data.avatar,
            sprite: this.head
        });
        this.nick.string = data.nickname;
    },

});