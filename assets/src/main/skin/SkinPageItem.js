const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const MessageCallback = require('../../utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        skinSprite: cc.Sprite,
        checked: cc.Node,
        nameLbl: cc.Label,
        _skin: null,
    },

    start() { },

    init(selected, skinId, index) {
        this._skin = skinId;
        this.checked.active = !!skinId && selected == this._skin;
        if (this.nameLbl) this.nameLbl.string = '皮肤' + index;
        AssetsManager.loadSpriteFrame({
            path: `sprite/skin/skin${skinId}`,
            sprite: this.skinSprite
        });
    },

    sync(skin) {
        if (!this._skin) return;
        this.checked.active = skin == this._skin;
    },

    onClick() {
        if (!this._skin) return;
        MessageCallback.emitMessage('OnSkinPageClick', this._skin);
    },

});