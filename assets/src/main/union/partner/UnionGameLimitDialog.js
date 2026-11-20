const AssetsManager = require('../../../utils/AssetsManager');
const CCUtil = require('../../../utils/CCUtil');
const UserModel = require('../../../model/UserModel');
const Utils = require('../../../utils/Utils');
const ApiHall = require('../../../api/ApiHall');

cc.Class({
    extends: cc.Component,

    properties: {
        listContent: cc.Node,
        rulePrefab: cc.Prefab,
        _ruleList: [],
        _opRules: [],
        _uid: null,
        _unionID: null,
        _limits: [],
    },

    start() {
        this._limits = !this.node.nodeParams || !this.node.nodeParams.limits ? [] : this.node.nodeParams.limits;
        this._uid = !this.node.nodeParams || !this.node.nodeParams.uid ? null : this.node.nodeParams.uid;
        this._unionID = !this.node.nodeParams || !this.node.nodeParams.unionID ? null : this.node.nodeParams.unionID;
        this._ruleList = UserModel.getData('unionRuleList');
        this._ruleList = this._ruleList || [];
        this._opRules = [];
        this.rulesInit();
    },

    rulesInit() {
        let ruleList = this._ruleList.slice();
        ruleList.forEach(rule => {
            let ruleItem = cc.instantiate(this.rulePrefab);
            this.listContent.addChild(ruleItem);
            rule.ruleClick = this._ruleClick.bind(this);
            ruleItem.getComponent('UnionGameLimitItem') && ruleItem.getComponent('UnionGameLimitItem').initWidget(rule, this._limits);
        });
    },

    btnClicks(event, params) {
        switch (params) {
            case 'close':
                this._onCloseClick();
                break;
            case 'submit':
                this._onSubmitClick();
                break;
        }
    },

    _onCloseClick() {
        if (this.node.getComponent('DialogWidgetCtrl')) {
            this.node.getComponent('DialogWidgetCtrl').out();
        } else {
            this.node.destroy();
        }
    },

    _onSubmitClick() {
        let reqData = {
            uid: this._uid,
            unionID: this._unionID,
            list: this._opRules
        };
        ApiHall.addUnionUserGameLimitRequest(reqData, (res) => {
            if (res.code != 0) {
                AssetsManager.tipDialog('操作失败！');
            }
            AssetsManager.tipDialog('操作成功！');
            this._onCloseClick();
        });
    },

    _ruleClick(rule) {
        if (!rule) return;
        let ruleId = rule._id || rule.gameRule._id;
        this._opRules = this._opRules || [];
        let ruleIndex = this._opRules.indexOf(ruleId);
        if (ruleIndex != -1) {
            this._opRules.splice(ruleIndex, 1);
        } else {
            this._opRules.push(ruleId);
        }
    },

});