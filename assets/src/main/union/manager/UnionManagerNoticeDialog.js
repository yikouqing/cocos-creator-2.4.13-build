const MessageCallback = require('../../../utils/MessageCallback');
const AssetsManager = require('../../../utils/AssetsManager')
const ApiHall = require('../../../api/ApiHall');

cc.Class({
    extends: cc.Component,

    properties: {
        noticeEditBox: cc.EditBox
    },

    start() {
        this.unionInfo = this.node.nodeParams.unionInfo;
        this.noticeEditBox.string = this.unionInfo.notice;
    },

    onBtnClick(event, parameter) {
        if (parameter === 'close') {
            if (this.node.getComponent('DialogWidgetCtrl')) {
                this.node.getComponent('DialogWidgetCtrl').out();
            } else {
                this.node.destroy();
            }
        } else if (parameter === 'commit') {
            let reqData = {
                unionID: this.unionInfo.unionID,
                notice: this.noticeEditBox.string
            };
            ApiHall.updateAllUnionNoticeRequest(reqData, (res) => {
                AssetsManager.tipDialog("修改成功");
                MessageCallback.emitMessage("UnionInfoSync");
            });
        }
    },
});