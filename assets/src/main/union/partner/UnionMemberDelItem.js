const AssetsManager = require('../../../utils/AssetsManager');
const CCUtil = require('../../../utils/CCUtil');
const UserModel = require('../../../model/UserModel');
const Utils = require('../../../utils/Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        opAvatar: cc.Sprite,
        opNickname: cc.Label,
        opUid: cc.Label,
        delAvatar: cc.Sprite,
        delNickname: cc.Label,
        delUid: cc.Label,
        delScore: cc.Label,
        opDate: cc.Label,
    },

    initWidget(data) {
        AssetsManager.loadSpriteFrame({
            path: data.avatar,
            sprite: this.opAvatar
        });
        let date = Utils.getDateFormat(parseInt(data.createTime));
        this.opDate.string = date.yyyymmddhhmmss;
        let desc = '';
        if (data.type == 0) {
            desc = `被邀请加入联盟`;
        } else if (data.type == 1) {
            desc = `被踢出联盟`;
        }
        this.delScore.string = desc;
        this.opUid.string = data.uid;
        this.opNickname.string = CCUtil.stringClamp(data.nickname, 6);
        AssetsManager.loadSpriteFrame({
            path: data.doneAvatar,
            sprite: this.doneAvatar
        });
        this.delNickname.string = CCUtil.stringClamp(data.doneNickname, 7, '..');
        this.delUid.string = data.doneUid;
    },

});