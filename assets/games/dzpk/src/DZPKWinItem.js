const Utils = require('../../../src/utils/Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        score: cc.Label
    },

    bind(score) {
        this.score.string = Utils.formatNumberWithDecimal(score || 0, 2);
    },

});