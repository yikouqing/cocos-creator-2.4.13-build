cc.Class({
    extends: cc.Component,

    properties: {
        tickLbl: cc.Label,
        _endTick: -1,
    },

    sync(tick = 0) {
        if (tick == 0) {
            this._endTick = 0;
            this.node.active = false;
            return;
        }
        this.node.active = true;
        this._endTick = Date.now() + tick * 1000;
    },

    update(dt) {
        if (this._endTick > 0) {
            let tick = this._endTick - Date.now();
            let countDown = Math.floor(tick / 1000);
            this.tickLbl.string = `${countDown}`;
            if (countDown <= 0) {
                this._endTick = 0;
            }
        }
    },
});