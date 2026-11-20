const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        head: cc.Sprite,
        nick: cc.Label
    },

    bind(user) {
        this.nick.string = CCUtil.stringClamp(user.userInfo.nickname, 6, '..');
        AssetsManager.loadSpriteFrame({
            path: user.userInfo.avatar,
            sprite: this.head
        });
    },

});