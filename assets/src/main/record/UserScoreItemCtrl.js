const Utils = require('../../utils/Utils');
const CCUtil = require('../../utils/CCUtil');
const AssetsManager = require('../../utils/AssetsManager');
const UserModel = require('../../model/UserModel');

cc.Class({
    extends: cc.Component,

    properties: {
        uid: cc.Label,
        nickname: cc.Label,
        score: cc.Label,
        avatar: cc.Sprite,
        bigWinNode: cc.Node,
        aloneColor: false,
        winColor: cc.Color,
        loseColor: cc.Color,
    },

    initWidget(userInfo, bigWinList) {
        if (!userInfo) {
            this.uid.node.active = false;
            this.nickname.node.active = false;
            this.score.node.active = false;
            this.avatar.node.active = false;
            this.bigWinNode.active = false;
        } else {
            this.uid.string = "ID:" + userInfo.uid;
            this.nickname.string = CCUtil.stringClamp(userInfo.nickname, 4, "..");
            let score = Utils.formatNumberWithSymbol(userInfo.score, 2);
            if (score < 0) {
                this.score.node.color = cc.color("#FF0000")
                this.score.string = Utils.formatNumberWithSymbol(userInfo.score, 2);
            } else if (score > 0) {
                this.score.node.color = cc.color("#194C00")
                this.score.string = `+${Utils.formatNumberWithSymbol(userInfo.score, 2)}`;
            } else {
                this.score.node.color = cc.color("#194C00")
                this.score.string = Utils.formatNumberWithSymbol(userInfo.score, 2);
            }
            AssetsManager.loadSpriteFrame({
                path: userInfo.avatar,
                sprite: this.avatar
            });
            this.bigWinNode.active = bigWinList.indexOf(userInfo.uid) !== -1 && userInfo.score > 0;
            if (this.aloneColor) { this.score.node.color = score < 0 ? this.loseColor : this.winColor };
        }
    }
});