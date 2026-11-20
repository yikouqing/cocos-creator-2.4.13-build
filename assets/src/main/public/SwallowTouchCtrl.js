const CCUtil = require('../../utils/CCUtil');

cc.Class({
    extends: cc.Component,

    properties: {},

    start() {
        CCUtil.touchPierce(this.node);
    },
});
