const AssetsManager = require('../../utils/AssetsManager');

cc.Class({
    extends: cc.Component,

    properties: {
        itemSprite: cc.Sprite,
        _comp: null,
        _index: -1,
    },

    bind(comp, index) {
        this._comp = comp;
        this._index = index;
        AssetsManager.loadSpriteFrame({
            path: `sprite/emoji/${index}`,
            sprite: this.itemSprite
        });
    },

    onClick() {
        if (!this._comp) return;

        this._comp.onEmotionClick(this._index);
    },

});