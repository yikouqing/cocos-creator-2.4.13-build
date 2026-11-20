const AssetsManager = require('../../../utils/AssetsManager');
const CCUtil = require('../../../utils/CCUtil');
const UserModel = require('../../../model/UserModel');
const Utils = require('../../../utils/Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        avatar: cc.Sprite,
        nickname: cc.Label,
        uid: cc.Label,
        spreaderId: cc.Label,
        spreaderAvatar: cc.Sprite,
        spreaderNick: cc.Label,
        yestodayRounds: cc.Label,
        yestodayWins: cc.Label,
        todayRounds: cc.Label,
        todayWins: cc.Label,
    },

    initWidget(userInfo) {
        AssetsManager.loadSpriteFrame({
            path: userInfo.avatar,
            sprite: this.avatar
        });
        this.nickname.string = CCUtil.stringClamp(userInfo.nickname, 7, '..');
        this.uid.string = userInfo.uid;
        if (!!userInfo.spreaderInfo) {
            this.spreaderId.string = userInfo.spreaderInfo.uid;
            this.spreaderNick.string = CCUtil.stringClamp(userInfo.spreaderInfo.nickname, 6);
            AssetsManager.loadSpriteFrame({
                path: userInfo.spreaderInfo.avatar,
                sprite: this.spreaderAvatar
            });
        } else {
            this.spreaderId.string = '';
            this.spreaderNick.string = '';
            this.spreaderAvatar.spriteFrame = null;
        }
        this.todayWins.string = Utils.formatNumberWithSymbol(userInfo.todayWinScore, 1);
        this.todayRounds.string = Utils.formatNumberWithSymbol(userInfo.todayDraw, 1);
        this.yestodayWins.string = Utils.formatNumberWithSymbol(userInfo.yesterdayWinScore, 1);
        this.yestodayRounds.string = Utils.formatNumberWithSymbol(userInfo.yesterdayDraw, 1);
    },

});