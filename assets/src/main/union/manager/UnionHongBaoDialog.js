const AssetsManager = require('../../../utils/AssetsManager')
const ApiHall = require('../../../api/ApiHall');

cc.Class({
    extends: cc.Component,

    properties: {
        openStatus: cc.Toggle,
        startTime: cc.EditBox,
        endTime: cc.EditBox,
        count: cc.EditBox,
        totalScore: cc.EditBox
    },

    start() {
        this.unionInfo = this.node.nodeParams.unionInfo;
        this.unionID = this.node.nodeParams.unionInfo.unionID;
        let hongBaoInfo = this.node.nodeParams.unionInfo.hongBaoInfo;
        if (!!hongBaoInfo) {
            this.openStatus.isChecked = hongBaoInfo.status;
            this.startTime.string = hongBaoInfo.startTime.toString();
            this.endTime.string = hongBaoInfo.endTime.toString();
            this.count.string = hongBaoInfo.count.toString();
            this.totalScore.string = hongBaoInfo.totalScore.toString();
        }
    },

    onBtnClick(event, parameter) {
        if (parameter === 'close') {
            if (this.node.getComponent('DialogWidgetCtrl')) {
                this.node.getComponent('DialogWidgetCtrl').out();
            } else {
                this.node.destroy();
            }
        } else if (parameter === 'confirm') {
            let status = this.openStatus.isChecked;
            if (this.startTime.string.length === 0) {
                AssetsManager.tipDialog("请输入正确活动开始时间");
                return;
            }
            let startTime = parseInt(this.startTime.string);
            if (startTime < 0 || startTime > 23) {
                AssetsManager.tipDialog("请输入正确活动开始时间");
                return;
            }
            if (this.endTime.string.length === 0) {
                AssetsManager.tipDialog("请输入正确活动结束时间");
                return;
            }
            let endTime = parseInt(this.endTime.string);
            if (endTime < 0 || endTime > 23) {
                AssetsManager.tipDialog("请输入正确活动结束时间");
                return;
            }
            if (endTime <= startTime) {
                AssetsManager.tipDialog("活动结束时间必须大于活动开始时间");
                return;
            }
            if (this.count.string.length === 0) {
                AssetsManager.tipDialog("请输入正确红包个数");
                return;
            }
            let count = parseInt(this.count.string);
            if (count <= 0) {
                AssetsManager.tipDialog("请输入正确红包个数");
                return;
            }
            if (this.totalScore.string.length === 0) {
                AssetsManager.tipDialog("请输入正确红包总分");
                return;
            }
            let totalScore = parseInt(this.totalScore.string);
            if (totalScore <= 0) {
                AssetsManager.tipDialog("请输入正确红包总分");
                return;
            }
            if (totalScore < count) {
                AssetsManager.tipDialog("红包总分过低，请重新设置");
                return;
            }
            let reqData = {
                unionID: this.unionID,
                status: status,
                startTime: startTime,
                endTime: endTime,
                count: count,
                totalScore: totalScore
            };
            ApiHall.hongBaoSettingRequest(reqData, totalScore, () => {
                AssetsManager.popDialog({
                    content: "红包设置成功",
                    ok: () => {
                        if (this.node.getComponent('DialogWidgetCtrl')) {
                            this.node.getComponent('DialogWidgetCtrl').out();
                        } else {
                            this.node.destroy();
                        }
                    },
                    no: () => { }
                })
            })
        }
    }
});