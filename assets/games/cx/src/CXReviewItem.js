const ApiCx = require('./ApiCx');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Utils = require('../../../src/utils/Utils');
const Enums = require('../../../src/const/Enums');
const UserModel = require('../../../src/model/UserModel');
const CXModel = require('./CXModel');
const ConfigModel = require('../../../src/model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        head: cc.Sprite,
        nick: cc.Label,
        banker: cc.Node,
        actionLay: cc.Node,
        actionType: cc.Label,
        oneCards: cc.Node,
        oneTypeNode: cc.Node,
        oneType: cc.Label,
        twoCards: cc.Node,
        twoTypeNode: cc.Node,
        twoType: cc.Label,
        pourScore: cc.Label,
        winScore: cc.Label,
        mangoScore: cc.Label,
    },

    bind(data) {
        let user = Utils.clone(data);
        let endCards = user.userEndCards;
        let allCards = user.cards || {};
        let userCards = allCards[user.uid] || [];
        let cards = userCards.slice();
        let baseCards = [],
            endCard = cards[3];
        for (let index = 0; index < 2; index++) {
            baseCards.push(cards[index]);
        }
        if (!!endCards) {
            if (endCards.oneType == ApiCx.cardType.SHANHUA) {
                endCards.oneCards = endCards.oneCards || [];
                endCards.twoCards = endCards.twoCards || [];
                let oneCard = endCards.oneCards.pop();
                endCards.twoCards.unshift(oneCard);
            }
            if (!!endCards.oneCards) {
                this.oneCards.active = true;
                for (let index = 0; index < this.oneCards.children.length; index++) {
                    this.oneCards.children[index].active = true;
                    AssetsManager.loadSpriteFrame({
                        path: ConfigModel.getCardUrl(endCards.oneCards[index]),
                        sprite: this.oneCards.children[index].getComponent(cc.Sprite)
                    });
                    let mark = this.oneCards.children[index].getChildByName('mark');
                    if (!mark) continue;
                    let markSprite = mark.getComponent(cc.Sprite);
                    if (!markSprite) continue;
                    markSprite.spriteFrame = null;
                    let markType = baseCards.includes(endCards.oneCards[index]) ? 'dipai' : endCards.oneCards[index] === endCard ? 'weipai' : '';
                    AssetsManager.loadSpriteFrame({
                        path: 'res/sprite/review/' + markType,
                        sprite: markSprite,
                        bundle: Enums.bundleType.CX,
                    });
                }
                this.oneType.string = ApiCx.cardTypeName[endCards.oneType];
                this.oneTypeNode.active = true;
            } else {
                this.oneTypeNode.active = false;
                this.oneCards.active = false;
            }
            if (!!endCards.twoCards) {
                this.twoCards.active = true;
                for (let index = 0; index < this.twoCards.children.length; index++) {
                    this.twoCards.children[index].active = true;
                    AssetsManager.loadSpriteFrame({
                        path: ConfigModel.getCardUrl(endCards.twoCards[index]),
                        sprite: this.twoCards.children[index].getComponent(cc.Sprite)
                    });
                    let mark = this.twoCards.children[index].getChildByName('mark');
                    if (!mark) continue;
                    let markSprite = mark.getComponent(cc.Sprite);
                    if (!markSprite) continue;
                    markSprite.spriteFrame = null;
                    let markType = baseCards.includes(endCards.twoCards[index]) ? 'dipai' : endCards.twoCards[index] === endCard ? 'weipai' : '';
                    AssetsManager.loadSpriteFrame({
                        path: 'res/sprite/review/' + markType,
                        sprite: markSprite,
                        bundle: Enums.bundleType.CX
                    });
                }
                if (endCards.oneType == ApiCx.cardType.SHANHUA) {
                    this.twoType.string = "";
                    this.twoTypeNode.active = false;
                } else {
                    this.twoType.string = ApiCx.cardTypeName[endCards.twoType];
                    this.twoTypeNode.active = true;
                }
            } else {
                this.twoCards.active = false;
                this.twoTypeNode.active = false;
            }
        } else {
            //玩家未分牌时
            let uid = UserModel.getData('uid');
            cards = cards || [];
            if (uid != user.uid && !user.showBase) {
                //不是自己不显示底牌
                cards[0] = 0;
                cards[1] = 0;
            }
            this.oneCards.active = true;
            this.twoCards.active = true;
            this.oneType.string = '';
            this.twoType.string = '';
            this.oneTypeNode.active = false;
            this.twoTypeNode.active = false;
            let cardNodeList = [];
            for (let index = 0; index < 4; index++) {
                if (index < 2) {
                    cardNodeList.push(this.oneCards.children[index]);
                } else {
                    cardNodeList.push(this.twoCards.children[index - 2]);
                }
            }
            for (let index = 0; index < cardNodeList.length; index++) {
                if (cards[index] >= 0) {
                    if (!cardNodeList[index]) continue;
                    cardNodeList[index].active = true;
                    AssetsManager.loadSpriteFrame({
                        path: ConfigModel.getCardUrl(cards[index]),
                        sprite: cardNodeList[index].getComponent(cc.Sprite)
                    });
                    let mark = cardNodeList[index].getChildByName('mark');
                    if (!mark) continue;
                    let markSprite = mark.getComponent(cc.Sprite);
                    if (!markSprite) continue;
                    markSprite.spriteFrame = null;
                    let markType = baseCards.includes(cards[index]) ? 'dipai' : cards[index] === endCard ? 'weipai' : '';
                    AssetsManager.loadSpriteFrame({
                        path: 'res/sprite/review/' + markType,
                        sprite: markSprite,
                        bundle: Enums.bundleType.CX
                    });
                } else {
                    if (!cardNodeList[index]) continue;
                    cardNodeList[index].active = false;
                }
            }
        }
        this.banker.active = !!user.isBanker;
        user.winScore = user.winScore || 0;
        let winSymbol = user.winScore > 0 ? "+" : user.winScore < 0 ? "-" : "";
        user.winScore = Math.abs(user.winScore);
        if (user.winScore > 0) {
            this.winScore.node.color = cc.color(250, 255, 2);
        } else if (user.winScore < 0) {
            this.winScore.node.color = cc.color(133, 135, 10);
        } else {
            this.winScore.node.color = cc.color(255, 255, 255);
        }
        this.winScore.string = `赢分 ${winSymbol}${Utils.formatNumberWithDecimal(user.winScore, 1)}`;
        this.pourScore.string = `投注 ${Utils.formatNumberWithDecimal(user.pourScore, 1)}`;
        user.mangoWinScore = user.mangoWinScore || 0;
        let symbol = user.mangoWinScore > 0 ? "+" : user.mangoWinScore < 0 ? "-" : "";
        user.mangoWinScore = Math.abs(user.mangoWinScore);
        this.mangoScore.node.active = user.mangoWinScore != 0;
        this.mangoScore.string = `芒果 ${symbol}${Utils.formatNumberWithDecimal(user.mangoWinScore, 1)}`;
        this.actionLay.active = user.operateType != 0;
        this.actionType.string = ApiCx.operateTypeName[user.operateType];
        AssetsManager.loadSpriteFrame({
            path: user.avatar,
            sprite: this.head
        });
        this.nick.string = user.nickname;
    },

});