const Utils = require('../../../utils/Utils');
const AssetsManager = require('../../../utils/AssetsManager');
const SubManager = require('../../../utils/SubManager');
const CCUtil = require('../../../utils/CCUtil');
const UserModel = require('../../../model/UserModel');

cc.Class({
    extends: cc.Component,

    properties: {
        dateLbl: cc.Label,
        indexLbl: cc.Label,
        scoreLbl: cc.Label,
    },

    bind(data) {
        this.indexLbl.string = UserModel.getData('uid');
        let date = Utils.getDateFormat(data.createTime);
        this.dateLbl.string = date.yyyymmddhhmm;
        this.scoreLbl.string = Utils.formatNumberWithSymbol(Math.abs(data.count), 2);
    },

});