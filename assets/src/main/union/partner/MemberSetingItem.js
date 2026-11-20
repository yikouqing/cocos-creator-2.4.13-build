const AssetsManager = require('../../../utils/AssetsManager');
const CCUtil = require('../../../utils/CCUtil');
const Utils = require('../../../utils/Utils');
const ApiHall = require('../../../api/ApiHall');

cc.Class({
    extends: cc.Component,

    properties: {
        uid: cc.Label,
        nickname: cc.Label,
        avatar: cc.Sprite,
        score: cc.Label,
        safeScore: cc.Label,
        totalScore: cc.Label,
        jilvEditBox: cc.EditBox
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
        if (userInfo.iscontrol) {
            this.jilvEditBox.string = userInfo.iscontrol;
        }

    },

    onBtnClick(event, parameter) {
        var count = parseInt(this.jilvEditBox.string);
        if (count < 0 || count > 100) {
            AssetsManager.tipDialog("输入错误，应为0-100，0为关闭");
            return;
        }
        let reqData = {
            unionID: this.unionID,
            memberUid: this.userInfo.uid,
            count: count
        };
        ApiHall.memberSetingRequest(reqData, () => {
            AssetsManager.tipDialog("操作成功");
            this.jilvEditBox.string = count;
        });
    }

    // update (dt) {},
});