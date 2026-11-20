const Utils = require('../../../utils/Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        giveUid: cc.Label,
        giveNickname: cc.Label,
        gainUid: cc.Label,
        gainNickname: cc.Label,
        count: cc.Label,
        time: cc.Label
    },

    start() {

    },

    initWidget(record) {
        this.giveUid.string = record.uid;
        this.giveNickname.string = record.nickname;

        this.gainUid.string = record.gainUid;
        this.gainNickname.string = record.gainNickname;

        this.count.string = record.count;
        let date = Utils.getDateFormat(record.createTime);
        this.time.string = date.yyyymmddhhmmss;
    }
});
