const AssetsManager = require('../../utils/AssetsManager');
const CCUtil = require('../../utils/CCUtil');
const Utils = require('../../utils/Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        dateLbl: cc.Label,
        orderIdLbl: cc.Label,
        orderLbl: cc.Label,
        stateLbl: cc.Label,
        btnWxPay: cc.Node,
        btnAliPay: cc.Node,
        btnDel: cc.Node,
        _order: null
    },

    bind(data) {
        this._order = data;
        let date = Utils.getDateFormat(parseInt(data.createTime));
        this.dateLbl.string = `${date.yyyymmddhhmm}`;
        this.orderIdLbl.string = data.orderNo;
        if (data.addGold > 0) {
            this.orderLbl.string = `${data.count}元购买${data.gold}钻石\n(赠送${data.addGold}钻石)`;
        } else {
            this.orderLbl.string = `${data.count}元购买${data.gold}钻石`;
        }

        let state = data.status == 0 ? '等待支付' : data.status == 1 ? '支付成功' : '支付失败';
        this.stateLbl.string = state;
        // if (data.status == 1) {
        //     this.btnWxPay.active = false;
        //     this.btnAliPay.active = false;
        // } else {
        this.btnWxPay.active = data.payType != 'alipay';
        this.btnAliPay.active = data.payType == 'alipay';
        // }
    },

    buttonClicks(event, params) {
        switch (params) {
            case 'pay':
                break;
            case 'del':
                break;
        }
    },

});