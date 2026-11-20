const AssetsManager = require('../../../utils/AssetsManager');
const UserModel = require('../../../model/UserModel');
const ConfigModel = require('../../../model/ConfigModel');
const ApiHall = require('../../../api/ApiHall');
const Utils = require('../../../utils/Utils');
const MessageCallback = require('../../../utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        rebateLabel: cc.Label,
        rebateEditBox: cc.EditBox,
    },

    onLoad() {
        let curOptUid = UserModel.getData('uid');
        this.unionID = this.node.nodeParams.unionID;
        this.userInfo = this.node.nodeParams.userInfo;
        this.unionOwnerID = this.node.nodeParams.unionOwnerID;
        this.userUnionInfo = UserModel.getUnionInfo(this.unionID);
        this.userUnionItem = UserModel.getUserUnion(this.unionID);
        this.isCurOptOwner = !!this.userUnionItem && this.userUnionItem.ownerUid == curOptUid;
        this.isCurOptManager = !!this.userUnionInfo && !!this.userUnionInfo.manager;
        this.cb = this.node.nodeParams.cb;
        this.rebateEditBox.string = Utils.formatNumberWithDecimal(this.userInfo.rebateRate * 100);
        this.curOptRebate = !!this.userUnionInfo ? (this.userUnionInfo.rebateRate || 0) : 0;
        this.curOptRebate = !!this.isCurOptOwner || !!this.isCurOptManager ? 1 : this.curOptRebate;
        this.rebateLabel.string = `${this.curOptRebate * 100}%`;
    },

    onBtnClick(event, parameter) {
        if (parameter === "close") {
            if (this.node.getComponent('DialogWidgetCtrl')) {
                this.node.getComponent('DialogWidgetCtrl').out();
            } else {
                this.node.destroy();
            }
        } else if (parameter === 'confirm') {
            let rebateRate = parseInt(this.rebateEditBox.string);
            if (rebateRate < 0) {
                AssetsManager.tipDialog("点位不能小于0");
                return;
            }
            if (rebateRate > 100) {
                AssetsManager.tipDialog("点位不能大于100");
                return;
            }
            let canAboveSpreaderRebateRate = ConfigModel.getData('canAboveSpreaderRebateRate');
            if (!canAboveSpreaderRebateRate) {
                if (rebateRate > this.curOptRebate * 100) {
                    AssetsManager.tipDialog("队长点位不能大于自己点位");
                    return;
                }
            }
            let content = "将队长" + this.userInfo.nickname + "的点位从" + Utils.formatNumberWithDecimal(this.userInfo.rebateRate * 100) + "%调至" + rebateRate + "%，是否确定调整";
            AssetsManager.popDialog({
                content: content,
                ok: () => {
                    if (rebateRate === this.userInfo.rebateRate * 100) {
                        MessageCallback.emitMessage('OnMofifyRebateSync', this.userInfo);
                        AssetsManager.tipDialog("修改成功");
                        if (this.node.getComponent('DialogWidgetCtrl')) {
                            this.node.getComponent('DialogWidgetCtrl').out();
                        } else {
                            this.node.destroy();
                        }
                        return;
                    }
                    let reqData = {
                        unionID: this.unionID,
                        memberUid: this.userInfo.uid,
                        rebateRate: rebateRate / 100
                    };
                    ApiHall.updateUnionRebateRequest(reqData, () => {
                        this.rebateEditBox.string = `${rebateRate}%`;
                        this.userInfo.rebateRate = rebateRate / 100;
                        MessageCallback.emitMessage('OnMofifyRebateSync', this.userInfo);
                        AssetsManager.tipDialog("修改成功");
                        this.cb && this.cb();
                        if (this.node.getComponent('DialogWidgetCtrl')) {
                            this.node.getComponent('DialogWidgetCtrl').out();
                        } else {
                            this.node.destroy();
                        }
                    });
                },
                no: () => { }
            });
        }
    }

    // update (dt) {},
});