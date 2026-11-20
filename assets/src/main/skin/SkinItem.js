const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const MessageCallback = require('../../utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        skinSprite: cc.Sprite,
        checked: cc.Node,
        _skin: null,
    },

    start() { },

    init(skin) {
        this._skin = skin;
        this.checked.active = !!skin && skin.curId == skin.skinId;
        let skinId = !!skin ? skin.skinId : 0;
        AssetsManager.loadSpriteFrame({
            path: `sprite/skin/skin${skinId}`,
            sprite: this.skinSprite
        });
    },


    sync(skin) {
        if (!this._skin) return;
        this.checked.active = skin.skinId == this._skin.skinId;
    },

    onClick() {
        if (!this._skin) return;
        MessageCallback.emitMessage('OnSkinSelectClick', this._skin);
    },

});