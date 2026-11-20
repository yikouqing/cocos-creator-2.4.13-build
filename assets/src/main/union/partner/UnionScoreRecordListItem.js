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
        changeScoreLbl: cc.Label,
        userScoreLbl: cc.Label,
        saveScoreLbl: cc.Label,
        dateLbl: cc.Label,
    },

    start() { },

    initWidget(userInfo) {
        // console.log('玩家信息----userInfo', userInfo)
        this.userInfo = userInfo;
        AssetsManager.loadSpriteFrame({
            path: userInfo.avatar,
            sprite: this.avatar
        });
        this.nickname.string = CCUtil.stringClamp(userInfo.nickname, 7, '..');
        this.uid.string = userInfo.uid;
        this.userScoreLbl.string = Utils.formatNumberWithSymbol(userInfo.userScore, 1);
        let changeSymbol = userInfo.score > 0 ? '+' : userInfo.score < 0 ? '-' : '';
        this.changeScoreLbl.string = `${changeSymbol}${Utils.formatNumberWithSymbol(Math.abs(userInfo.score), 1)}`;
        this.saveScoreLbl.string = Utils.formatNumberWithSymbol(userInfo.saveScore, 1);
        let dateStr = userInfo.dayTime.toString();
        this.dateLbl.string = `${dateStr.substring(0, 4)}/${dateStr.substring(4, 6)}/${dateStr.substring(6, 8)}`;
    },

});