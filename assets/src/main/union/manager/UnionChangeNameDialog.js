const MessageCallback = require('../../../utils/MessageCallback');
const AssetsManager = require('../../../utils/AssetsManager')
const Utils = require('../../../utils/Utils');
const ApiHall = require('../../../api/ApiHall');

cc.Class({
    extends: cc.Component,

    properties: {
        unionName: cc.EditBox
    },

    start() {
        this.unionName.string = this.node.nodeParams.unionInfo.unionName || "";
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
            let unionName = this.unionName.string;
            if (!unionName) {
                AssetsManager.tipDialog("请输入俱乐部名称");
                return;
            }
            if (Utils.getCharCount(unionName) > 12) {
                AssetsManager.tipDialog("俱乐部名称不得多于12个字符(1个中文为两个字符)");
                return;
            }
            let reqData = {
                unionID: this.unionID,
                unionName: unionName
            };
            AssetsManager.popDialog({
                content: "是否确定要修改亲友圈名字",
                ok: () => {
                    ApiHall.updateUnionNameRequest(reqData, (res) => {
                        AssetsManager.tipDialog("修改成功");
                        MessageCallback.emitMessage("UnionInfoSync");
                    });
                },
                no: () => { }
            });

        }
    }
});