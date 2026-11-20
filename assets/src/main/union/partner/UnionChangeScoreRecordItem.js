const CCUtil = require('../../../utils/CCUtil');
const Utils = require('../../../utils/Utils');
const AssetsManager = require('../../../utils/AssetsManager');

cc.Class({
    extends: cc.Component,

    properties: {
        avatar: cc.Sprite,
        giveUid: cc.Label,
        giveNickname: cc.Label,
        gainUid: cc.Label,
        gainAvatar: cc.Sprite,
        gainNickname: cc.Label,
        count: cc.Label,
        time: cc.Label
    },

    start() {

    },

    initWidget(record) {
        AssetsManager.loadSpriteFrame({
            path: record.avatar,
            sprite: this.avatar
        });
        this.giveUid.string = record.uid;
        this.giveNickname.string = CCUtil.stringClamp(record.nickname, 7, '..');;
        this.gainUid.string = record.gainUid;
        AssetsManager.loadSpriteFrame({
            path: record.gainAvatar,
            sprite: this.gainAvatar
        });
        this.gainNickname.string = CCUtil.stringClamp(record.gainNickname, 7, '..');
        this.count.string = Utils.formatNumberWithSymbol(record.count, 3);
        // this.count.string = record.count;
        let date = Utils.getDateFormat(record.createTime);
        this.time.string = date.yyyymmddhhmmss;
    }
});