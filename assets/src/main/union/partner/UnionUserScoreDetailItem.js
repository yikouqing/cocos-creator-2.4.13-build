const Utils = require('../../../utils/Utils');
const AssetsManager = require('../../../utils/AssetsManager');
const ConfigModel = require('../../../model/ConfigModel');
const CCUtil = require('../../../utils/CCUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        aboveLbl: cc.Label,
        typelbl: cc.Label,
        scoreLbl: cc.Label,
        dateLbl: cc.Label,
    },

    bind(data) {
        // console.log('分数明细', data, Date.now());
        data.changeType = parseInt(data.changeType);
        if (data.changeType == 4) {
            this.typelbl.string = ConfigModel.getGameName(data.gameType);
        } else if (data.changeType == 5) {
            this.typelbl.string = `门票(${ConfigModel.getGameName(data.gameType)})`
        } else if (data.changeType == 6) {
            this.typelbl.string = `抽水(${ConfigModel.getGameName(data.gameType)})`
        } else {
            this.typelbl.string = data.describe;
        }
        let symbol = data.changeCount > 0 ? '+' : data.changeCount < 0 ? '-' : '';
        this.aboveLbl.string = `${symbol}${Utils.formatNumberWithSymbol(Math.abs(data.changeCount), 2)}`;
        this.scoreLbl.string = Utils.formatNumberWithSymbol(data.leftCount, 2);
        let date = Utils.getDateFormat(parseInt(data.createTime));
        this.dateLbl.string = date.yyyymmddhhmm;
    },

});