const Utils = require('../../../utils/Utils');
const MessageCallback = require('../../../utils/MessageCallback');
const AssetsManager = require('../../../utils/AssetsManager')
const UserModel = require('../../../model/UserModel');
const ApiHall = require('../../../api/ApiHall');

cc.Class({
    extends: cc.Component,

    properties: {
        curScoreLabel: cc.Label,
        safeScoreLabel: cc.Label,
        scoreInputLbl: cc.Label,
        _input: [],
        _optType: 0, //0存  1 取
    },

    start() {
        this._input = [];
        this.unionID = this.node.nodeParams.unionID;
        this.updateScore(null);
        MessageCallback.addListener('UpdateUserInfoPush', this);
        MessageCallback.addListener('UpdateOperationSafeBoxList', this);
    },

    onDestroy() {
        MessageCallback.removeListener('UpdateUserInfoPush', this);
        MessageCallback.removeListener('UpdateOperationSafeBoxList', this);
    },

    messageCallbackHandler(route, msg) {
        switch (route) {
            case 'UpdateUserInfoPush':
                this.updateScore(msg);
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
                path: "res/prefab/union/main/UnionRebateRecordDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this.unionID
            });
        } else if (param === 'modifyRecord') {
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/UnionChangeScoreRecordDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this.unionID
            });
        } else if (param === 'quchu' || param === 'cunru') {
            this._input = this._input || [];
            let score = parseFloat(this._input.join(''));
            if (isNaN(score)) {
                this.scoreInputLbl.string = "0";
                this._input = [];
                AssetsManager.tipDialog(`请输入正确的积分`);
                return
            }
            let unionInfoItem = UserModel.getUnionInfo(this.unionID);
            if (param === 'quchu') {
                if (score > unionInfoItem.saveScore) {
                    AssetsManager.tipDialog(`请输入正确的积分`);
                    return
                }
                score *= -1;
            } else {
                if (score > unionInfoItem.score) {
                    AssetsManager.tipDialog(`请输入正确的积分`);
                    return
                }
            }
            let reqData = {
                count: score,
                unionID: this.unionID
            };
            ApiHall.saveBoxOperationRequest(reqData, () => {
                MessageCallback.emitMessage("UpdateOperationSafeBoxList");
                this.scoreInputLbl.string = "0";
                this._input = [];
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

    updateScore(data) {
        let unionInfoItem = null;
        if (!data || !data.unionInfo) {
            unionInfoItem = UserModel.getUnionInfo(this.unionID);
        } else {
            let unionInfo = data.unionInfo;
            unionInfoItem = unionInfo.find((ele) => {
                return ele.unionID === this.unionID;
            });
        }
        if (!unionInfoItem) return;
        this.curScoreLabel.string = Utils.formatNumberWithSymbol(unionInfoItem.score, 2);
        this.safeScoreLabel.string = Utils.formatNumberWithSymbol(unionInfoItem.saveScore, 2);
    },

});