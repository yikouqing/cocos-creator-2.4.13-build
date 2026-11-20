cc.Class({
    extends: cc.Component,

    properties: {
        win: sp.Skeleton
    },

    start() {
        this.win.setCompleteListener((trackEntry, loopCount) => {
            this.scheduleOnce(() => {
                this.node.destroy();
            }, 3);
        });
        this.scheduleOnce(() => {
            this.node.destroy();
        }, 5);
        this.init();
    },

    init() {
        this.win.clearTracks();
        this.win.premultipliedAlpha = false;
        this.win.timeScale = 1;
        this.win.setSkin('default');
        this.win.setAnimation(1, 'animation', false);
    },

});