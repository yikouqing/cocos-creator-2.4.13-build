const Utils = require('../../../utils/Utils');
const AssetsManager = require('../../../utils/AssetsManager');
const CCUtil = require('../../../utils/CCUtil');
const UserModel = require('../../../model/UserModel');
const ConfigModel = require('../../../model/ConfigModel');
const MessageCallback = require('../../../utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        uid: cc.Label,
        nickname: cc.Label,
        avatar: cc.Sprite,
        score: cc.Label,
        safeScore: cc.Label,
        saveScore: cc.Label,
        totalScore: cc.Label,
        role: cc.Sprite,
        scoreLay: cc.Node,

        _canModifyScore: false,
    },

    start() {
        MessageCallback.addListener('OnModifyScoreSync', this);
    },

    initWidget(userInfo, unionID, unionOwnerID) {
        this.unionID = unionID;
        this.unionOwnerID = unionOwnerID;
        this.userInfo = userInfo;
        this.uid.string = userInfo.uid;
        let unionInfoItem = UserModel.getUnionInfo(this.unionID);
        let myUid = UserModel.getData('uid');
        let ownerCanModify = this.unionOwnerID == myUid;
        let managerCanModify = !!unionInfoItem && !!unionInfoItem.manager && userInfo.uid != myUid;
        let partnerCanModify = !!unionInfoItem && !!unionInfoItem.partner && userInfo.spreaderID == myUid && userInfo.uid != myUid;
        this._canModifyScore = !!ownerCanModify || !!managerCanModify || !!partnerCanModify;
        AssetsManager.loadSpriteFrame({
            path: userInfo.avatar,
            sprite: this.avatar
        });
        this.nickname.string = CCUtil.stringClamp(userInfo.nickname, 7, '..');
        this.score.string = Utils.formatNumberWithSymbol(userInfo.score, 1);
        this.safeScore.string = Utils.formatNumberWithSymbol(userInfo.safeScore, 1);
        this.saveScore.string = Utils.formatNumberWithSymbol(userInfo.saveScore, 1);
        this.totalScore.string = Utils.formatNumberWithSymbol(userInfo.score + userInfo.safeScore + userInfo.saveScore, 1);
        this.role.spriteFrame = null;
        if (this.scoreLay) this.scoreLay.active = !!this._canModifyScore;
        let role = null;
        if (!userInfo.isRobot) {
            role = 'cy';
        } else {
            role = 'jqr';
        }
        AssetsManager.loadSpriteFrame({
            path: `res/sprite/role/role_${role}`,
            bundle: ConfigModel.getSkin(),
            sprite: this.role
        });
    },

    updateScore(score) {
        this.userInfo.score = score;
        this.score.string = Utils.formatNumberWithSymbol(this.userInfo.score, 1);
        this.totalScore.string = Utils.formatNumberWithSymbol(this.userInfo.score + this.userInfo.safeScore, 1);
    },

    onBtnClick(event, parameter) {
        if (parameter === 'scoreModify') {
            if (!this._canModifyScore) {
                AssetsManager.tipDialog("不能越级操作！");
                return;
            }
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/UnionChangeMemberScoreDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this.unionID,
                memberUid: this.userInfo.uid,
                score: this.userInfo.score,
                userInfo: this.userInfo,
                unionOwnerID: this.unionOwnerID
            });
        } else if (parameter === 'jia' || parameter === 'jian') {
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/UnionChangeMemberScoreDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this.unionID,
                memberUid: this.userInfo.uid,
                score: this.userInfo.score,
                userInfo: this.userInfo,
                operationType: parameter,
                unionOwnerID: this.unionOwnerID
            });
        }
    },

    messageCallbackHandler(route, msg) {
        switch (route) {
            case 'OnModifyScoreSync':
                this._onModifyScoreSync(msg);
                break;
        }
    },

    _onModifyScoreSync(data) {
        if (!data) return;
        if (!this.userInfo || data.uid != this.userInfo.uid) return;
        this.userInfo.score = data.score;
        this.score.string = Utils.formatNumberWithSymbol(data.score, 1);
        this.totalScore.string = Utils.formatNumberWithSymbol(data.score + this.userInfo.safeScore, 1);
    },

    onDestroy() {
        MessageCallback.removeListener('OnModifyScoreSync', this);
    },

});