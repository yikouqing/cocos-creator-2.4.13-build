const Utils = require('../../../utils/Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        startEdit: cc.EditBox,
        endEdit: cc.EditBox,
        cashEdit: cc.EditBox
    },

    init() {
        this.startEdit.string = '';
        this.endEdit.string = '';
        this.endEdit.string = '';
    },

    getConfig() {
        let startNum = parseFloat(this.startEdit.string);
        startNum = isNaN(startNum) || startNum < 0 ? 0 : startNum;
        startNum = Utils.formatNumberWithDecimal(startNum, 1);
        this.startEdit.string = `${startNum > 0 ? startNum : ''}`;
        let endNum = parseFloat(this.endEdit.string);
        endNum = isNaN(endNum) || endNum < 0 ? 0 : endNum;
        endNum = Utils.formatNumberWithDecimal(endNum, 1);
        this.endEdit.string = `${endNum > 0 ? endNum : ''}`;
        let cashNum = parseFloat(this.cashEdit.string);
        cashNum = isNaN(cashNum) || cashNum < 0 ? 0 : cashNum;
        cashNum = Utils.formatNumberWithDecimal(cashNum, 1);
        this.cashEdit.string = `${cashNum > 0 ? cashNum : ''}`;
        return {
            minScore: startNum,
            maxScore: endNum,
            rebateScore: cashNum,
        };
    },

    sync(data) {
        if (data) {
            this.startEdit.string = data.minScore;
            this.endEdit.string = data.maxScore;
            this.cashEdit.string = data.rebateScore;
        } else {
            this.startEdit.string = '';
            this.endEdit.string = '';
            this.cashEdit.string = '';
        }

    },


});