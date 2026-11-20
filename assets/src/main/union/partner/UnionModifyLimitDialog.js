const AssetsManager = require('../../../utils/AssetsManager');
const ApiHall = require('../../../api/ApiHall');
const MessageCallback = require('../../../utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        limitLabel: cc.Label,
        limitEditBox: cc.EditBox,
    },

    onLoad() {
        this.cb = this.node.nodeParams.cb;
        this.unionID = this.node.nodeParams.unionID;
        this.userInfo = this.node.nodeParams.userInfo;
        this.limitLabel.string = this.userInfo.limitScore || 0;
        this.limitEditBox.string = this.userInfo.limitScore || 0;
    },

    onBtnClick(event, parameter) {
        if (parameter === "close") {
            if (this.node.getComponent('DialogWidgetCtrl')) {
                this.node.getComponent('DialogWidgetCtrl').out();
            } else {
                this.node.destroy();
            }
        } else if (parameter === 'confirm') {
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
                        this.limitEditBox.string = "";
                        MessageCallback.emitMessage('OnMofifyLimitScoreSync', this.userInfo);
                        AssetsManager.tipDialog("警戒值设置成功！");
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
                        limitScore: limitRate
                    };
                    ApiHall.updateUnionLimitRequest(reqData, () => {
                        this.limitLabel.string = limitRate;
                        this.limitEditBox.string = "";
                        this.userInfo.limitScore = limitRate;
                        MessageCallback.emitMessage('OnMofifyLimitScoreSync', this.userInfo);
                        AssetsManager.tipDialog("警戒值设置成功！");
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