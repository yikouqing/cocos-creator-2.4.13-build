const ClickManager = require('../../utils/ClickManager');

cc.Class({
    extends: cc.Component,

    properties: {
        spClick: sp.Skeleton
    },

    start() {
        this.spClick.setCompleteListener((trackEntry, loopCount) => {
            ClickManager.revokeClick(this.node);
        });
    },

});