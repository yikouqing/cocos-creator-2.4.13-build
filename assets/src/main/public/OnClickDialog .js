cc.Class({
    extends: cc.Component,

    properties: {
        layout: cc.Layout,
        content: cc.Label
    },

    start() {
        this.init()

    },

    init() {
        this.content.string = this.node.nodeParams.string;
        this.pos = this.node.nodeParams.pos;
        if (!!this.layout) {
            this.layout.updateLayout();
        }
        this.node.setPosition(this.pos);
        cc.tween(this.node)
            .by(0.15, {
                position: cc.v3(0, 100)
            })
            .delay(1.5)
            .call(() => {
                this.node.destroy()
            })
            .start();
    }
});