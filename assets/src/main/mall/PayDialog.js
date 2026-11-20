const AssetsManager = require('../../utils/AssetsManager');
const ApiHall = require('../../api/ApiHall');
const ConfigModel = require('../../model/ConfigModel');
const NativeUtil = require('../../utils/NativeUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        _order: null,
        _pay: 2
    },

    start() {
        this._order = this.node.nodeParams ? this.node.nodeParams.order : null;
        this._pay = 2;
    },

    buttonClicks(event, params) {
        switch (params) {
            case 'close':
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
                break;
            case 'alipay':
                this._pay = 2;
                break;
            case 'wxpay':
                this._pay = 1;
                break;
            case 'confirm':
                this._onConfirm();
                break;
            default:
                break;
        }
    },

    _onConfirm() {
        let reqData = {
            type: this._pay,
            count: this._order.count
        };
        ApiHall.getRechargeOrderRequest(reqData, (res) => {
            // console.log('获取订单', res);
            if (res.code != 0 || !res.msg) {
                AssetsManager.tipDialog('获取订单失败！');
                return;
            }
            AssetsManager.createDialog({
                path: 'res/prefab/main/mall/PayDetailDialog',
                bundle: ConfigModel.getSkin(),
                order: res.msg
            });
            this.node.destroy();
        })
    },

});