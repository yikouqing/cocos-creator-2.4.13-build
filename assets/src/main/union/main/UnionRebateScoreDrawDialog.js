const Utils = require('../../../utils/Utils');
const MessageCallback = require('../../../utils/MessageCallback');
const AssetsManager = require('../../../utils/AssetsManager')
const UserModel = require('../../../model/UserModel');
const ApiHall = require('../../../api/ApiHall');
const ConfigModel = require('../../../model/ConfigModel');
cc.Class({
    extends: cc.Component,

    properties: {
        nowRebateLabel: cc.Label,
        lastRebateLabel: cc.Label,
        safeScoreLabel: cc.Label,
        scoreInputLbl: cc.Label,
        _input: [],
    },

    start() {
        this._input = [];
        this.unionID = this.node.nodeParams.unionID;
        this.rebateInfo = this.node.nodeParams.rebateInfo;
        MessageCallback.addListener('UpdateUserInfoPush', this);
        MessageCallback.addListener('UpdateOperationSafeBoxList', this);
        this._rebateSync();
    },

    _rebateSync() {
        if (!this.rebateInfo) return;
        this.nowRebateLabel.string = `${Utils.formatNumberWithSymbol(this.rebateInfo.todayRebate, 2)}`;
        this.lastRebateLabel.string = `${Utils.formatNumberWithSymbol(this.rebateInfo.yesterdayRebate, 2)}`;
        this.safeScoreLabel.string = `${Utils.formatNumberWithSymbol(this.rebateInfo.safeScore, 2)}`;
    },

    onDestroy() {
        MessageCallback.removeListener('UpdateUserInfoPush', this);
        MessageCallback.removeListener('UpdateOperationSafeBoxList', this);
    },

    messageCallbackHandler(route, msg) {
        switch (route) {
            case 'UpdateUserInfoPush':
                break;
        }
    },

    onBtnClk(event, param) {
        if (param === 'close') {
            if (this.node.getComponent('DialogWidgetCtrl')) {
                this.node.getComponent('DialogWidgetCtrl').out();
            } else {
                this.node.destroy();
            }
        } else if (param === 'record') {
            AssetsManager.createDialog({
                path: 'res/prefab/union/partner/UnionRebateDrawRecordDialog',
                bundle: ConfigModel.getSkin(),
                unionID: this.unionID
            });
        } else if (param === 'draw') {
            if (!this.rebateInfo || this.rebateInfo.safeScore <= 0) {
                AssetsManager.tipDialog('暂无返利可领取！');
                return;
            }
            this._input = this._input || [];
            let score = parseFloat(this._input.join(''));
            if (isNaN(score)) {
                this.scoreInputLbl.string = "0";
                this._input = [];
                AssetsManager.tipDialog(`请输入正确的积分`);
                return
            }
            if (this.scoreInputLbl.string == '' ||
                this.scoreInputLbl.string == "0" ||
                (this._input.length == 2 && this._input[1] == '.')) {
                AssetsManager.tipDialog(`请输入正确的积分`);
                return
            }
            if (score > this.rebateInfo.safeScore) {
                AssetsManager.tipDialog('可领取收益超出限额，请重新输入~');
                return;
            }
            let reqData = {
                unionID: this.unionID,
                count: score
            };
            ApiHall.safeBoxOperationRequest(reqData, (res) => {
                if (res.code != 0) {
                    AssetsManager.tipDialog('领取失败，请稍候再试！');
                    return;
                }
                AssetsManager.tipDialog('领取成功！');
                this.node.destroy();
            });
        } else if (param.indexOf('inputnum') != -1) {
            this.onInput(param.slice(8));
        } else if (param === 'dian') {
            this.onInput('.');
        } else if (param === 'del') {
            this.scoreInputLbl.string = "0";
            this._input = [];
        }
    },

    onInput(input) {
        if (input == '.') {
            if (!!this._input.includes('.')) return;
            if (this._input.length == 0) {
                this._input.push('0');
            }
        }
        this._input.push(input);
        this.scoreInputLbl.string = this._input.join('');
    },

});