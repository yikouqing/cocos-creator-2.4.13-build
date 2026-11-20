const Utils = require('../../../utils/Utils');
const CCUtil = require('../../../utils/CCUtil');
const AssetsManager = require('../../../utils/AssetsManager');
const Enums = require('../../../const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {
        uid: cc.Label,
        nickname: cc.Label,
        scoreLbl: cc.Label,
        avatar: cc.Sprite,
        nowRound: cc.Label,
        lastRound: cc.Label,
        nowWin: cc.Label,
        lastWin: cc.Label,
        yesterdayUser: cc.Label,
        totalDraw: cc.Label,
    },

    start() {

    },

    initWidget(unionInfo, userInfo, unionID) {
        this.unionID = unionID;
        this.userInfo = userInfo;
        this.uid.string = userInfo.uid;
        AssetsManager.loadSpriteFrame({
            path: userInfo.avatar,
            sprite: this.avatar
        });
        this.scoreLbl.string = unionInfo.unionType != Enums.UnionType.NORMAL ? Utils.formatNumberWithSymbol(userInfo.score, 1) : '';
        this.nickname.string = CCUtil.stringClamp(userInfo.nickname, 7, '..');
        this.nowRound.string = Utils.formatNumberWithSymbol(userInfo.todayDraw, 2);
        this.lastRound.string = Utils.formatNumberWithSymbol(userInfo.yesterdayDrawTotal, 2);
        this.nowWin.string = Utils.formatNumberWithSymbol(userInfo.todayWin, 2);
        this.lastWin.string = Utils.formatNumberWithSymbol(userInfo.yesterdayWin, 2);
        this.yesterdayUser.string = Utils.formatNumberWithSymbol(userInfo.yesterdayProvideRebate, 2);
        this.totalDraw.string = userInfo.totalDraw;
    }
});