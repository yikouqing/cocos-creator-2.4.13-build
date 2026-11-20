const NativeUtil = require('../../utils/NativeUtil');
const Enums = require('../../const/Enums');
const ConfigModel = require('../../model/ConfigModel');
const AssetsManager = require('../../utils/AssetsManager');

cc.Class({
    extends: cc.Component,

    properties: {
        titleLbl: cc.Label,
        txtLbl: cc.Label,
        _txt: null
    },

    bind(key) {
        let configs = Enums.serviceType;
        this.titleLbl.string = `${configs[key]}:`;
        this._txt = ConfigModel.getData(key) || "";
        this.txtLbl.string = `${this._txt}`;
    },

    onClick() {

        if (!this._txt || this._txt.length == 0) return;
        NativeUtil.copyText(this._txt);
    },

});