const Utils = require('../../../utils/Utils');
const AssetsManager = require('../../../utils/AssetsManager');
const CCUtil = require('../../../utils/CCUtil');
const UserModel = require('../../../model/UserModel');
const ConfigModel = require('../../../model/ConfigModel');
const ApiHall = require('../../../api/ApiHall');
const MessageCallback = require('../../../utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        avatar: cc.Sprite,
        uidLabel: cc.Label,
        nicknameLabel: cc.Label,
        rebateLabel: cc.Label,
        yesterdayUse: cc.Label,
        todayUse: cc.Label,
        rebateEditBox: cc.EditBox,
        myRebateLabel: cc.Label,
        modifyRebateRateNode: cc.Node,
        modifyLimitNode: cc.Node,
        limitEditBox: cc.EditBox,
        limitLabel: cc.Label,
        curLimitLabel: cc.Label,
    },

    onLoad() {
        let curOptUid = UserModel.getData('uid');
        this.unionID = this.node.nodeParams.unionID;
        this.userUnionInfo = UserModel.getUnionInfo(this.unionID);
        this.userUnionItem = UserModel.getUserUnion(this.unionID);
        this.isCurOptOwner = !!this.userUnionItem && this.userUnionItem.ownerUid == curOptUid;
        this.isCurOptManager = !!this.userUnionInfo && !!this.userUnionInfo.manager;
        this.userInfo = this.node.nodeParams.userInfo;
        AssetsManager.loadSpriteFrame({
            path: this.userInfo.avatar,
            sprite: this.avatar
        });
        this.uidLabel.string = this.userInfo.uid;
        this.nicknameLabel.string = CCUtil.stringClamp(this.userInfo.nickname, 7, '..');;
        this.rebateLabel.string = Utils.formatNumberWithDecimal(this.userInfo.rebateRate * 100) + "%";
        this.curLimitLabel.string = this.userInfo.limitScore;
        this.limitLabel.string = this.userInfo.limitScore || 0;
        this.yesterdayUse.string = Utils.formatNumberWithSymbol(this.userInfo.yesterdayRebate, 2);
        this.todayUse.string = Utils.formatNumberWithSymbol(this.userInfo.todayRebate, 2);
        this.curOptRebate = !!this.userUnionInfo ? (this.userUnionInfo.rebateRate || 0) : 0;
        this.curOptRebate = !!this.isCurOptOwner || !!this.isCurOptManager ? 1 : this.curOptRebate;
        this.myRebateLabel.string = `${Utils.formatNumberWithDecimal(this.curOptRebate * 100)}%`;
    },

    start() { },

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
                        this.modifyRebateRateNode.active = false;
                        this.rebateEditBox.string = "";
                        MessageCallback.emitMessage('OnMofifyRebateSync', this.userInfo);
                        AssetsManager.tipDialog("修改成功");
                        return;
                    }
                    let reqData = {
                        unionID: this.unionID,
                        memberUid: this.userInfo.uid,
                        rebateRate: rebateRate / 100
                    };
                    ApiHall.updateUnionRebateRequest(reqData, () => {
                        this.rebateLabel.string = rebateRate + "%";
                        this.rebateEditBox.string = "";
                        this.modifyRebateRateNode.active = false;
                        this.userInfo.rebateRate = rebateRate / 100;
                        MessageCallback.emitMessage('OnMofifyRebateSync', this.userInfo);
                        AssetsManager.tipDialog("修改成功");
                    });
                },
                no: () => { }
            });
        } else if (parameter === 'closeNode') {
            this.modifyRebateRateNode.active = false;
        } else if (parameter === 'modify') {
            this.modifyRebateRateNode.active = true;
            this.rebateEditBox.string = "";
        } else if (parameter === 'closeLimit') {
            this.modifyLimitNode.active = false;
        } else if (parameter === 'modifyLimit') {
            this.modifyLimitNode.active = true;
            this.limitEditBox.string = "";
        } else if (parameter === 'limitConfirm') {
            if (this.limitEditBox.string == '') {
                AssetsManager.tipDialog("请输入警戒值！");
                return;
            }
            let limitRate = parseInt(this.limitEditBox.string);
            if (limitRate < 0) {
                AssetsManager.tipDialog("警戒值不能小于0！");
                return;
            }
            let content = "将队长" + this.userInfo.nickname + "的警戒值设置为" + limitRate + "，是否确定调整？";
            AssetsManager.popDialog({
                content: content,
                ok: () => {
                    if (limitRate === this.userInfo.limitScore) {
                        this.modifyLimitNode.active = false;
                        this.limitEditBox.string = "";
                        MessageCallback.emitMessage('OnMofifyLimitScoreSync', this.userInfo);
                        AssetsManager.tipDialog("警戒值设置成功！");
                        return;
                    }
                    let reqData = {
                        unionID: this.unionID,
                        memberUid: this.userInfo.uid,
                        limitScore: limitRate
                    };
                    ApiHall.updateUnionLimitRequest(reqData, () => {
                        this.limitLabel.string = limitRate;
                        this.limitEditBox.string = "";
                        this.modifyLimitNode.active = false;
                        this.userInfo.limitScore = limitRate;
                        MessageCallback.emitMessage('OnMofifyLimitScoreSync', this.userInfo);
                        AssetsManager.tipDialog("警戒值设置成功！");
                    });
                },
                no: () => { }
            });
        }


    }
});