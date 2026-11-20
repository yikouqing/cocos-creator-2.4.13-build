const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {
        clockTime: cc.Label
    },

    onLoad() { },

    startClock(time, callback) {
        this.unscheduleAllCallbacks();
        this.curTime = time;
        this.callback = callback;
        this.clockTime.string = this.curTime.toString();
        this.schedule(this.updateClock.bind(this), 1);
    },

    stopClock() {
        this.unscheduleAllCallbacks();
    },

    updateClock() {
        if (this.isDismissing()) {
            return;
        }
        this.curTime--;
        if (this.curTime < 0) {
            this.unscheduleAllCallbacks();
        } else {
            this.clockTime.string = this.curTime.toString();
            if (this.curTime === 5) {
                AssetsManager.playEffect({
                    path: "res/audio/main/sound_remind",
                    bundle: Enums.bundleType.MNPDK
                });
            }
        }
    },

    setClockEnd() {
        this.curTime = 0;
    }
});