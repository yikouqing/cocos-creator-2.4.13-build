const CCUtil = require('../../utils/CCUtil');

cc.Class({
    extends: cc.Component,

    properties: {},

    start() {
        let layout = this.node.getComponent(cc.Layout);
        if (!layout) return;
        layout.spacingX *= CCUtil.getScaleFitRate();
        // console.log('刷新LAY_OUT', layout.spacingX);
        layout.updateLayout();
    },

});