cc.Class({
    extends: cc.Component,

    properties: {
        poolScore: cc.Label,
        poolIcon: cc.Node,
    },

    sync(score) {
        this.node.active = true;
        this.poolScore.string = `${parseInt(score)}`;
    },

    clear() {
        this.node.active = false;
        this.poolScore.string = '0';
    }

});