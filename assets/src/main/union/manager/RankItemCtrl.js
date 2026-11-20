const Utils = require('../../../utils/Utils');
const CCUtil = require('../../../utils/CCUtil');
const AssetsManager = require('../../../utils/AssetsManager');

cc.Class({
    extends: cc.Component,

    properties: {
        uid: cc.Label,
        nickname: cc.Label,
        avatar: cc.Sprite,
        score: cc.Label,
        yesterdayWin: cc.Label,
        totalDraw: cc.Label,
        rank: cc.Label
    },

    initWidget(rank, rankType, userInfo) {
        this.uid.string = userInfo.uid;
        AssetsManager.loadSpriteFrame({
            path: userInfo.avatar,
            sprite: this.avatar
        });
        this.nickname.string = userInfo.nickname;
        this.rank.string = rank;
        this.score.string = !!userInfo.score ? Utils.formatNumberWithSymbol(userInfo.score, 1) : 0;
        this.totalDraw.string = !!userInfo.totalDraw ? Utils.formatNumberWithSymbol(userInfo.totalDraw, 1) : 0;
        if (rankType == 'toayWin') {
            this.yesterdayWin.string = !!userInfo.toayWin ? Utils.formatNumberWithSymbol(userInfo.toayWin, 1) : 0;
        } else {
            this.yesterdayWin.string = !!userInfo.yesterdayWin ? Utils.formatNumberWithSymbol(userInfo.yesterdayWin, 1) : 0;
        }
    }
});