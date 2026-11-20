const AssetsManager = require('../../../src/utils/AssetsManager');
const ConfigModel = require('../../../src/model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        cardSprite: cc.Sprite,
        qiMark: cc.Node,

        _cardId: null
    },

    start() {
        cc.systemEvent.on('OnNiuNiuChooseFoldCard', this._sync, this);
    },

    bind(card) {
        this.qiMark.active = false;
        this._cardId = card;
        AssetsManager.loadSpriteFrame({
            path: ConfigModel.getCardUrl(card),
            sprite: this.cardSprite
        });
    },

    onClick() {
        cc.systemEvent.emit('OnNiuNiuChooseFoldCard', this._cardId, this);
    },

    _sync(card) {
        this.qiMark.active = this._cardId == card;
    },

    onDestroy() {
        cc.systemEvent.off('OnNiuNiuChooseFoldCard', this._sync, this);
    },

});
