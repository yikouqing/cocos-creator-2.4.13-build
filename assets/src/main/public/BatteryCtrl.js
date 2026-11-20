const NativeUtil = require('../../utils/NativeUtil');
const CCUtil = require('../../utils/CCUtil');
const Utils = require('../../utils/Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        bProgress: cc.ProgressBar,
        dTime: cc.Label,
        _uRate: 0,
        _speed: 5,
    },

    start() {
        this._speed = 10;
        this._timeSync();
        this._batterySync();
    },

    _batterySync() {
        let bLevel = NativeUtil.getBattery();
        this.bProgress.progress = parseFloat(bLevel);
    },

    _timeSync() {
        let time = Date.now();
        let date = Utils.getDateFormat(time);
        this.dTime.string = date.hhmm;
    },

    update(dt) {
        this._uRate += dt * this.speed;
        if (this._uRate >= 1) {
            this._uRate %= 1;
            this._batterySync();
        }
        this._timeSync();
    },

});