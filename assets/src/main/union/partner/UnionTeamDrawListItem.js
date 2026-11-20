const AssetsManager = require('../../../utils/AssetsManager');
const CCUtil = require('../../../utils/CCUtil');
const ConfigModel = require('../../../model/ConfigModel');
const Utils = require('../../../utils/Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        avatar: cc.Sprite,
        nickname: cc.Label,
        uid: cc.Label,
        totalPlayer: cc.Label,
        yesterdayRounds: cc.Label,
        yesterdayWins: cc.Label,
        todayRounds: cc.Label,
        todayWins: cc.Label,
        btnOp: cc.Node,
        _userInfo: null
    },

    start() { },

    initWidget(userInfo, unionInfo) {
        AssetsManager.loadSpriteFrame({
            path: userInfo.avatar,
            sprite: this.avatar
        });
        this._userInfo = userInfo;
        this.nickname.string = CCUtil.stringClamp(userInfo.nickname, 7, '..');
        this.uid.string = userInfo.uid;
        this.userInfo = userInfo;
        this.unionInfo = unionInfo;
        this.totalPlayer.string = parseInt(userInfo.userCount);
        this.yesterdayRounds.string = `${parseInt(userInfo.yesterdayDraw)}`;
        this.yesterdayWins.string = Utils.formatNumberWithSymbol(userInfo.yesterdayWinScore, 1);
        this.todayRounds.string = `${parseInt(userInfo.todayDraw)}`;
        this.todayWins.string = Utils.formatNumberWithSymbol(userInfo.todayWinScore, 1);
        this.btnOp.active = !!userInfo.isPartner;
    },

    onBtnClick() {

        if (!this.unionInfo) return;
        AssetsManager.createDialog({
            path: "res/prefab/union/partner/UnionTeamRankDialog",
            bundle: ConfigModel.getSkin(),
            unionInfo: this.unionInfo,
            uid: !!this._userInfo ? this._userInfo.uid || null : null
        });
    },

});