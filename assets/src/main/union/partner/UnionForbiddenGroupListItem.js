const AssetsManager = require('../../../utils/AssetsManager');
const ApiHall = require('../../../api/ApiHall');
const ConfigModel = require('../../../model/ConfigModel');
const CCUtil = require('../../../utils/CCUtil');
cc.Class({
    extends: cc.Component,

    properties: {
        groupIndexLbl: cc.Label,
        playersLay: cc.Node,
        playerCountsLbl: cc.Label,

        _group: null,
    },

    initWidget(group) {
        this._group = group;
        this.groupIndexLbl.string = `${group.index + 1}`;
        this.playerCountsLbl.string = `${group.userList ? group.userList.length : 0}人`;
    },

    btnClicks(event, params) {

        switch (params) {
            case 'option':
                this._onOpClick();
                break;
            case 'del':
                this._onDelClick(event);
                break;
        }
    },

    _onOpClick() {
        if (!this._group) return;
        AssetsManager.createDialog({
            path: 'res/prefab/union/partner/UnionForbiddenGroupDetailDialog',
            bundle: ConfigModel.getSkin(),
            group: this._group,
        });
    },

    _onDelClick(event) {
        if (!this._group) return;
        if (CCUtil.clickInterval(event.target, 1.5, true)) return;
        let reqData = {
            unionID: this._group.unionID,
            ruleID: this._group.ruleID
        };
        ApiHall.delForbiddenRuleRequest(reqData, (res) => {
            // console.log('删除规则', res);
            if (res.code == 0) {
                AssetsManager.tipDialog('删除成功！');
                this._group.onSync();
            } else {
                AssetsManager.tipDialog('操作失败！');
            }
        })
    },

});