cc.Class({
    extends: cc.Component,

    properties: {
        layout: cc.Layout,
        content: cc.Label
    },

    start() {
        this.init();
    },

    init() {
        if (!this.node.nodeParams) {
            this.node.destroy();
            return;
        }
        this.content.string = this.node.nodeParams.content;
        if (!!this.layout) {
            this.layout.updateLayout();
        }
        this.node.setPosition(cc.v2(0, 0));
        cc.tween(this.node)
            .by(0.15, {
                position: cc.v3(0, 65)
            })
            .delay(1.5)
            .removeSelf()
            .start();
    }
});