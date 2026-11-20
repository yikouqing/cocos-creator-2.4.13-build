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
        this.rebateEditBox.string = Utils.formatNumberWithDecimal(this.userInfo.ticketRate * 100);
        this.curOptRebate = !!this.userUnionInfo ? (this.userUnionInfo.ticketRate || 0) : 0;
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
            let ticketRate = parseInt(this.rebateEditBox.string);
            if (ticketRate < 0) {
                AssetsManager.tipDialog("点位不能小于0");
                return;
            }
            if (ticketRate > 100) {
                AssetsManager.tipDialog("点位不能大于100");
                return;
            }
            let canAboveSpreaderTicketRate = ConfigModel.getData('canAboveSpreaderTicketRate');
            if (!canAboveSpreaderTicketRate) {
                if (ticketRate > this.curOptRebate * 100) {
                    AssetsManager.tipDialog("队长门票比例不能大于自己门票比例");
                    return;
                }
            }
            let content = "将队长" + this.userInfo.nickname + "的门票比例从" + Utils.formatNumberWithDecimal(this.userInfo.ticketRate * 100) + "%调至" + ticketRate + "%，是否确定调整";
            AssetsManager.popDialog({
                content: content,
                ok: () => {
                    if (ticketRate === this.userInfo.ticketRate * 100) {
                        MessageCallback.emitMessage('OnMofifyTicketRebateSync', this.userInfo);
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
                        ticketRate: ticketRate / 100
                    };
                    ApiHall.updateUnionTicketRateRequest(reqData, () => {
                        this.rebateEditBox.string = `${ticketRate}%`;
                        this.userInfo.ticketRate = ticketRate / 100;
                        MessageCallback.emitMessage('OnMofifyTicketRebateSync', this.userInfo);
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