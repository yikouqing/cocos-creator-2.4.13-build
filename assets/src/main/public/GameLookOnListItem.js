const AssetsManager = require('../../utils/AssetsManager');
const CCUtil = require('../../utils/CCUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        head: cc.Sprite,
        nickLbl: cc.Label,
        uidLbl: cc.Label
    },

    onLoad() {},

    bind(user) {
        this.nickLbl.string = CCUtil.stringClamp(user.userInfo.nickname, 8, '..');
        if (this.uidLbl) this.uidLbl.string = `ID:${user.userInfo.uid}`;
        AssetsManager.loadSpriteFrame({
            path: user.userInfo.avatar,
            sprite: this.head
        });
    },

});