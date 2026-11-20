const CXModel = require('./CXModel');

cc.Class({
    extends: cc.Component,

    properties: {
        timer: cc.ProgressBar,
        time: cc.Label,
        _endTime: 0,
        _duration: 0,
    },

    sync() {
        this.timer.progress = 0;
        let time = CXModel.getTick();
        this._endTime = Date.now() + time.time * 1000;
        this._duration = time.duration * 1000;
        this.time.string = `分牌倒计时${Math.floor(time.time)}s`;
        this.node.active = true;
    },

    clear() {
        this.timer.progress = 0;
        this.node.active = false;
        this.time.string = '';
    },

    update(dt) {
        if (this.node.active) {
            let left = this._endTime - Date.now();
            if (left <= 0) {
                this.node.active = false;
                return;
            } else {
                let progress = left / this._duration;
                this.timer.progress = progress;
                this.time.string = `分牌倒计时${Math.floor(left/1000)}s`;
            }
        }
    },

});