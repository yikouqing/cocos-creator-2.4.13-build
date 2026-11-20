const ConfigModel = require('../../../src/model/ConfigModel');
const AssetsManager = require('../../../src/utils/AssetsManager');

cc.Class({
    extends: cc.Component,

    properties: {
        cardSprite: cc.Sprite,
        cardLight: cc.Node,
        cardGray: cc.Node,
        cardEye: cc.Node,

        _cardId: 0,
    },

    onLoad() {
        if (this.cardGray) this.cardGray.active = false;
        if (this.cardLight) this.cardLight.active = false;
        if (this.cardEye) this.cardEye.active = false;
    },

    cardFlop(id, callback = null) {
        this._cardId = id;
        this.node.active = true;
        if (this.cardLight) this.cardLight.active = false;
        if (this.cardGray) this.cardGray.active = false;
        if (this.cardEye) this.cardEye.active = false;
        AssetsManager.loadSpriteFrame({
            path: ConfigModel.getCardUrl(),
            sprite: this.cardSprite
        });
        this.node.stopAllActions();
        this.node.setScale(1, 1);
        cc.tween(this.node)
            .to(0.15, {
                scaleX: 0.5
            })
            .call(() => {
                AssetsManager.loadSpriteFrame({
                    path: ConfigModel.getCardUrl(id),
                    sprite: this.cardSprite
                })
            })
            .to(0.15, {
                scaleX: 1
            })
            .call(() => {
                callback && callback();
            })
            .start();
    },

    //结算时玩家牌的展示
    cardsCheck(id, cards) {
        this.node.active = true;
        this.node.stopAllActions();
        this.node.setScale(1, 1);
        AssetsManager.loadSpriteFrame({
            path: ConfigModel.getCardUrl(id),
            sprite: this.cardSprite
        });
        if (this.cardLight) this.cardLight.active = cards.indexOf(id) != -1;
        if (this.cardGray) this.cardGray.active = cards.indexOf(id) == -1;
    },

    //重置牌节点
    cardBack(visible) {
        this.node.stopAllActions();
        this.cardValue = -1;
        this.node.active = visible;
        if (this.cardLight) this.cardLight.active = false;
        if (this.cardGray) this.cardGray.active = false;
        if (this.cardEye) this.cardEye.active = false;
        this.node.stopAllActions();
        this.node.setScale(1, 1);
        AssetsManager.loadSpriteFrame({
            path: ConfigModel.getCardUrl(),
            sprite: this.cardSprite
        });
    },

    showCard(id) {
        this.node.active = true;
        this.node.stopAllActions();
        this.node.setScale(1, 1);
        AssetsManager.loadSpriteFrame({
            path: ConfigModel.getCardUrl(id),
            sprite: this.cardSprite
        });
    },

    cardShow() {
        if (this.cardEye) this.cardEye.active = !this.cardEye.active;
    },

    cardClick(event, param) {

    },

    cardSync(id) {
        this.node.setScale(1, 1);
        this._cardId = id;
        this.node.active = true;
        if (this.cardEye) this.cardEye.active = false;
        if (this.cardLight) this.cardLight.active = false;
        AssetsManager.loadSpriteFrame({
            path: ConfigModel.getCardUrl(id),
            sprite: this.cardSprite
        });
    }
});