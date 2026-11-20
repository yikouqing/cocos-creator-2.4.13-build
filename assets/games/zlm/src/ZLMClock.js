const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');

cc.Class({
    extends: cc.Component,

    properties: {
        txt_time: cc.Label,
        _tick: 0,
        _checkTime: 0,
    },

    init(t) {
        this._tick = t <= 0 ? 0 : Math.floor(t)
        this.txt_time.string = this._tick + ""
    },

    update(dt) {
        if (this._tick >= 0) {
            this._checkTime += dt
            if (this._checkTime >= 1) {
                this._checkTime = 0
                if (this._tick - 1 >= 0) {
                    this._tick--
                }
                this.txt_time.string = this._tick + ""
                if (this._tick == 3) {
                    AssetsManager.playEffect({
                        path: "res/audio/main/sound_remind",
                        bundle: Enums.bundleType.ZLM
                    });
                }
            }
        }
    },

});