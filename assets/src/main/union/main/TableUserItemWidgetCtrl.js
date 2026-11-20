const Utils = require('../../../utils/Utils');
const CCUtil = require('../../../utils/CCUtil');
const AssetsManager = require('../../../utils/AssetsManager');

cc.Class({
    extends: cc.Component,

    properties: {
        userInfoNode: cc.Node,
        avatar: cc.Sprite,
        nickname: cc.Label,
        winScore: cc.Label
    },

    start() { },

    initWidget(roomUserInfo) {
        if (!roomUserInfo) {
            this.userInfoNode.active = true;
            return;
        }
        this.userInfoNode.active = false;
        AssetsManager.loadSpriteFrame({
            path: roomUserInfo.avatar,
            sprite: this.avatar
        });
        this.nickname.string = CCUtil.stringClamp(roomUserInfo.nickname, 6, '..');
        this.winScore.string = Utils.formatNumberWithSymbol(roomUserInfo.winScore, 1);
    }

});