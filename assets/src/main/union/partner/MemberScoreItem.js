const AssetsManager = require('../../../utils/AssetsManager');
const CCUtil = require('../../../utils/CCUtil');
const Utils = require('../../../utils/Utils');
const ConfigModel = require('../../../model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        uid: cc.Label,
        nickname: cc.Label,
        avatar: cc.Sprite,
        score: cc.Label,
        safeScore: cc.Label,
        totalScore: cc.Label
    },

    start() {

    },

    initWidget(userInfo, unionID, unionOwnerID) {
        this.unionID = unionID;
        this.unionOwnerID = unionOwnerID;
        this.userInfo = userInfo;
        this.uid.string = userInfo.uid;
        AssetsManager.loadSpriteFrame({
            path: userInfo.avatar,
            sprite: this.avatar
        });
        this.nickname.string = CCUtil.stringClamp(userInfo.nickname, 7, '..');
        this.score.string = Utils.formatNumberWithSymbol(userInfo.score, 1);
        this.safeScore.string = Utils.formatNumberWithSymbol(userInfo.safeScore, 1);
        this.totalScore.string = Utils.formatNumberWithSymbol(userInfo.score + userInfo.safeScore, 1);
    },

    updateScore(score) {
        this.userInfo.score = score;
        this.score.string = Utils.formatNumberWithSymbol(this.userInfo.score, 1);
        this.totalScore.string = Utils.formatNumberWithSymbol(this.userInfo.score + this.userInfo.safeScore, 1);
    },

    onBtnClick(event, parameter) {
        if (parameter === 'addScore') {
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/UnionChangeMemberScoreDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this.unionID,
                memberUid: this.userInfo.uid,
                score: this.userInfo.score,
                userInfo: this.userInfo,
                operationType: 'add',
                unionOwnerID: this.unionOwnerID
            });
        } else if (parameter === 'jianScore') {
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/UnionChangeMemberScoreDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this.unionID,
                memberUid: this.userInfo.uid,
                score: this.userInfo.score,
                userInfo: this.userInfo,
                operationType: 'jian',
                unionOwnerID: this.unionOwnerID
            });
        }
    }

    // update (dt) {},
});