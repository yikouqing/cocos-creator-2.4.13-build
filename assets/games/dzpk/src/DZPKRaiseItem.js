const Utils = require('../../../src/utils/Utils');
const AssetsManager = require('../../../src/utils/AssetsManager');
const DZPKModel = require('./DZPKModel');
const ApiDzpk = require('./ApiDzpk');
const ApiRoom = require('../../../src/api/ApiRoom');
const CCUtil = require('../../../src/utils/CCUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        scoreLbl: cc.Label,

        _score: -1,
        _max: -1,
        _min: -1,
    },

    sync(raise) {
        this._score = raise.score;
        this._max = raise.max;
        this._min = raise.min;
        this.scoreLbl.string = `${raise.rate}`;
        let score = parseInt(this._score * this._max);
        let isGray = score < this._min || score > this._max;
        CCUtil.setGrayShader(this.node, isGray);
    },

    onClick() {

        if (this._score == -1) return;
        let isMyTurn = DZPKModel.checkIsMyTurn();
        if (!isMyTurn) return;
        let score = parseInt(this._score * this._max);
        if (score < this._min) {
            AssetsManager.tipDialog('当前加注量不能小于最低值！')
            return;
        }
        if (score > this._max) {
            AssetsManager.tipDialog('当前加注量已大于您的筹码！')
            return;
        }
        if (score >= this._max) {
            ApiRoom.gameMessageNotify(ApiDzpk.getOperateNotify(ApiDzpk.operateType.QIAO, this._max));
        } else {
            ApiRoom.gameMessageNotify(ApiDzpk.getOperateNotify(ApiDzpk.operateType.DA, score));
        }
    },


});