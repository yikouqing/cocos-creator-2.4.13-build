const Utils = require('../../../utils/Utils');
const CCUtil = require('../../../utils/CCUtil');
const AssetsManager = require('../../../utils/AssetsManager');

cc.Class({
    extends: cc.Component,

    properties: {
        emptyNode: cc.Node,
        userNode: cc.Node,
        avatar: cc.Sprite,
        nickname: cc.Label,
        winScore: cc.Label,
        userID: cc.Label,
    },

    start() { },

    bind(roomUserInfo) {
        this.node.active = true;
        if (!roomUserInfo) {
            this.emptyNode.active = true;
            this.userNode.active = false;
            this.nickname.string = '空位';
            this.avatar.spriteFrame = null;
            return;
        }
        this.userNode.active = true;
        this.emptyNode.active = false;
        AssetsManager.loadSpriteFrame({
            path: roomUserInfo.avatar,
            sprite: this.avatar
        });
        this.nickname.string = `${CCUtil.stringClamp(roomUserInfo.nickname, 6, '..')}`;
        this.winScore.string = `赢分:${Utils.formatNumberWithSymbol(roomUserInfo.winScore, 1)}`;
        this.userID.string = `ID:${roomUserInfo.uid}`;
    },

    hide() {
        this.userNode.active = false;
        this.emptyNode.active = true;
        this.nickname.string = '空位';
        this.avatar.spriteFrame = null;
        this.node.active = true;
    },

});