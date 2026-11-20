const AssetsManager = require('../../utils/AssetsManager');
const CCUtil = require('../../utils/CCUtil');
const NativeUtil = require('../../utils/NativeUtil');
const Utils = require('../../utils/Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        qrCodeLay: cc.Node,
        qrCodeNode: cc.Node,
        wxPayNode: cc.Node,
        aliPayNode: cc.Node,
        dateLbl: cc.Label,
        orderLbl: cc.Label,
        timerLbl: cc.RichText,
        _order: null,
        _payEndTime: 0,
    },

    start() {
        this._order = this.node.nodeParams ? this.node.nodeParams.order : null;
        if (!this._order) return;
        this.orderLbl.string = `商户订单号:${this._order.out_trade_no}`;
        this.timerLbl.string = `二维码有效时间:<color=#FF0000>03</c>分<color=#FF0000>00</color>秒,失效勿付!`;
        this.wxPayNode.active = this._order.type == 'wxpay';
        this.aliPayNode.active = !this.wxPayNode.active;
        let date = Utils.getDateFormat();
        this.dateLbl.string = date.yyyymmddhhmmss;
        this._payEndTime = 300 * 1000 + Date.now();
        CCUtil.drawQRCode(this.qrCodeNode, this._order.qrcode);
    },

    update(dt) {
        if (this._payEndTime == 0) return;
        let endTime = Utils.timerToEnd(this._payEndTime);
        if (endTime.leftSec >= 0) {
            this.timerLbl.string = `二维码有效时间:<color=#FF0000>${endTime.timeMin}</c>分<color=#FF0000>${endTime.timeSec}</color>秒,失效勿付!`;
        } else {
            this._payEndTime = 0;
        }
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
            case 'copy':
                NativeUtil.copyText(this._order.qrcode);
                break;
            case 'save':
                this._onSave();
                break;
            default:
                break;
        }
    },

    _onSave() {
        let imgPath = CCUtil.capScreen(this.qrCodeLay, false);
        NativeUtil.savePhoto(imgPath, 0, () => {
            AssetsManager.tipDialog('二维码保存相册成功！');
            this.node.destroy();
        });
    },

});