const Utils = require('../../../src/utils/Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        round: cc.Label,
        score: cc.Label,
        laneTypeOne: cc.Node,
        laneTypeTwo: cc.Node
    },

    bind(index, score) {
        this.round.string = `第${index}局`;
        this.laneTypeOne.active = (index - 1) % 2 == 0;
        this.laneTypeTwo.active = (index - 1) % 2 != 0;
        if (score > 0) {
            this.score.string = `+${Utils.formatNumberWithDecimal(score,1)}`;
        } else if (score < 0) {
            this.score.string = `${Utils.formatNumberWithDecimal(score,1)}`;
        } else {
            this.score.string = `0`;
        }
    }

});