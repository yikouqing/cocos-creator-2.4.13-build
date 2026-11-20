const Utils = require('../../../src/utils/Utils');
const CCUtil = require('../../../src/utils/CCUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        scoreLbl: cc.Label,
        _score: null,
        _pour: null,
        _enable: false,
    },

    bind(enable, pour, score) {
        this._score = score;
        this._pour = pour;
        this._enable = enable;
        CCUtil.setGrayShader(this.node, !enable);
        this.scoreLbl.string = `${Utils.formatNumberWithDecimal(score, 1)}分`;
    },

    onClick() {
        if (!this._score || !this._enable) return;
        this._pour && this._pour(this._score);
    },

});