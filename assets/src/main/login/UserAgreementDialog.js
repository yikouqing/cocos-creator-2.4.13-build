const AssetsManager = require('../../utils/AssetsManager');

cc.Class({
    extends: cc.Component,

    properties: {
        contxtLbl: cc.Label
    },

    start() {
        this._callback = this.node.nodeParams.callback;
        this._init();
    },

    _init() {
        AssetsManager.loadAsset({
            path: `json/agrees/user`,
            aType: cc.JsonAsset
        }, (res) => {
            if (!res) return;
            if (!this.contxtLbl || !cc.isValid(this.contxtLbl)) return;
            this.contxtLbl.string = res.json.context;
        })
    },

    onClickBtn(event, param) {
        let isChecked = param == "ok";
        this._callback && this._callback(isChecked);
        this.onClose();
    },

    onClose() {
        if (this.node.getComponent('DialogWidgetCtrl')) {
            this.node.getComponent('DialogWidgetCtrl').out();
        } else {
            this.node.destroy();
        }
    },
});