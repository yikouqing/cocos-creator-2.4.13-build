cc.Class({
    extends: cc.Component,

    properties: {
        content: cc.Label
    },

    init(data) {
        if (!data) {
            this.unscheduleAllCallbacks();
            this.node.destroy();
            return;
        }
        this.unscheduleAllCallbacks();
        let delay = data.delay || 10;
        this.content.string = data.content || '';
        this.scheduleOnce(() => {
            this.node.destroy();
        }, delay);
    },

});