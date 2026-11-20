const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const GDModel = require('./GDModel');

cc.Class({
    extends: cc.Component,

    properties: {
        timeLbl: cc.Label,
        _time: -1,
    },

    start() {
        this.init();
    },

    init() {
        let time = GDModel.getTick();
        this._time = time.time;
        this.timeLbl.string = `${Math.floor(this._time)}`;
        this.schedule(() => {
            this._time--;
            this.timeLbl.string = `${Math.floor(this._time)}`;
            if (this._time == 3 &&
                GDModel.getCurOperateUID() == GDModel.getMyUID()) {
                AssetsManager.playEffect({
                    path: "res/audio/main/sound_remind",
                    bundle: Enums.bundleType.GD
                });
            }
            if (this._time <= 0) {
                this.unscheduleAllCallbacks();
                this.timeLbl.string = '0';
            }
        }, 1);
    },

});