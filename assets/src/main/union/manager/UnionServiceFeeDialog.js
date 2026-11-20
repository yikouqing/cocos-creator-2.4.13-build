const AssetsManager = require('../../../utils/AssetsManager');
const ApiHall = require('../../../api/ApiHall');
const MessageCallback = require('../../../utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        unionServiceFee: cc.EditBox
    },

    start() {
        this.unionServiceFee.string = this.node.nodeParams.unionInfo.serverScore;;
        this.unionID = this.node.nodeParams.unionInfo.unionID;
    },

    onBtnClick(event, parameter) {
        if (parameter === 'close') {
            if (this.node.getComponent('DialogWidgetCtrl')) {
                this.node.getComponent('DialogWidgetCtrl').out();
            } else {
                this.node.destroy();
            }
        } else if (parameter === 'create') {
            let unionFee = this.unionServiceFee.string;
            if (!unionFee) {
                AssetsManager.tipDialog("请输入0-100的整数");
                return;
            }
            if (parseInt(unionFee) < 0 || parseInt(unionFee) > 100) {
                AssetsManager.tipDialog("请输入0-100的整数");
                return;
            }
            let reqData = {
                unionID: this.unionID,
                serverScore: unionFee
            };
            AssetsManager.popDialog({
                content: `确定要设置联盟服务费为 ${parseInt(unionFee)}% 吗？`,
                ok: () => {
                    ApiHall.updateUnionServiceFeeRequest(reqData, (res) => {
                        MessageCallback.emitMessage('OnUnionServiceFeeUpdate', unionFee);
                    });
                },
                no: () => { }
            });

        }
    }
});