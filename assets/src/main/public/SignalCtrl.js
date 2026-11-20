const NativeUtil = require('../../utils/NativeUtil');
const ApiHall = require('../../api/ApiHall');
const Enums = require('../../const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {
        wifi: cc.Node,
        mobile: cc.Node,
        sVal: cc.Label,
        _uRate: 0,
        _speed: 10,
    },

    start() {
        this._speed = 10;
        this._sigSync();
        this._delaySync();
        this.schedule(this._delaySync, 10)
    },

    _sigSync() {
        let netType = NativeUtil.getNetType();
        this.wifi.active = netType == Enums.netType.WIFI;
        this.mobile.active = netType == Enums.netType.MOBILE;
    },

    _delaySync() {
        ApiHall.getNetDelay((res) => {
            let netType = NativeUtil.getNetType();
            let bLevel = NativeUtil.getSignal();
            if (netType == Enums.netType.WIFI) {
                if (!cc.isValid(this.wifi)) return;
                let wifiBar = this.wifi.children;
            } else {
                if (!cc.isValid(this.mobile)) return;
                let mobileBar = this.mobile.children;
            }
            let delay = !res.msg || !res.msg.delay ? 10 : res.msg.delay;
            this.sVal.string = `${delay}ms`;
        })
    },

    update(dt) {
        this._uRate += dt * this.speed;
        if (this._uRate >= 1) {
            this._uRate %= 1;
            this._sigSync();
        }
    },

});