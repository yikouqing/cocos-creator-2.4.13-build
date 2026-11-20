const CCUtil = require('../../../utils/CCUtil');
const Utils = require('../../../utils/Utils');
const AssetsManager = require('../../../utils/AssetsManager');

cc.Class({
    extends: cc.Component,

    properties: {
        timeLbl: cc.Label,
        layersLbl: cc.Label,
        allGamesLbl: cc.Label,
        joinGamesLbl: cc.Label,
        diamondsLbl: cc.Label,
    },

    initWidget(record) {
        let date = Utils.getDateFormat(record.createTime);
        this.timeLbl.string = date.yyyymmddhhmmss;
        this.layersLbl.string = record.userCount || 0;
        this.allGamesLbl.string = record.drawCount || 0;
        // this.joinGamesLbl.string = record.drawCount;
        this.diamondsLbl.string = record.diamondCount || 0;
    }
});