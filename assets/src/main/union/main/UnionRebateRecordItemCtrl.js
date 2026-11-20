const Utils = require('../../../utils/Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        roomID: cc.Label,
        type: cc.Label,
        count: cc.Label,
        time: cc.Label
    },

    start() {

    },

    initWidget(record) {
        this.roomID.string = "房间:" + record.roomID;
        this.type.string = !!record.start ? "固定抽分" : "赢家抽分";
        this.count.string = Utils.formatNumberWithSymbol(record.gainCount);
        let date = Utils.getDateFormat(record.createTime);
        this.time.string = date.yyyymmddhhmmss;
    }
});