const MessageCallback = require('../../utils/MessageCallback');
const AssetsManager = require('../../utils/AssetsManager');
const UserModel = require('../../model/UserModel');
const ApiHall = require('../../api/ApiHall');

cc.Class({
    extends: cc.Component,

    properties: {
        listItem: cc.Prefab,
        content: cc.Node,
        noticeListRedPoint: cc.Node,
        onlineServiceRoot: cc.Node,
        emptyNode: cc.Node,

        msgEditBox: cc.EditBox
    },

    updatePlayerInfo() {
        this.noticeListRedPoint.active = UserModel.unreadEmailCount() > 0;
    },

    start() {
        this.showNotice(true);
        this.updatePlayerInfo();

        MessageCallback.addListener('UpdateUserInfoPush', this);
    },

    onDestroy() {
        MessageCallback.removeListener('UpdateUserInfoPush', this);
    },

    messageCallbackHandler(route) {
        switch (route) {
            case 'UpdateUserInfoPush':
                this.updatePlayerInfo();
                break;
        }
    },

    onBtnClk(event, param) {
        switch (param) {
            case 'close':
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
                break;
            case 'notice':
                this.showNotice(true);
                break;
            case 'services':
                this.showServices(true);
                break;
            case 'submit':
                if (!this.msgEditBox.string) {
                    AssetsManager.tipDialog("发送消息为空");
                    return;
                }
                ApiHall.sendCustomerServiceMsgRequest({
                    content: this.msgEditBox.string
                }, () => {
                    AssetsManager.tipDialog("问题已提交，客服将在5分钟内受理");
                    this.msgEditBox.string = "";

                });
                break;
        }
    },

    showNotice(show) {
        if (show) {
            this.showServices(false);
            let data = UserModel.getData('emailArr');
            if (!!data && data.length > 0) {
                data = JSON.parse(data);
                this.emptyNode.active = false;
            } else {
                data = [];
                this.emptyNode.active = true;
            }
            for (let i = data.length - 1; i >= 0; i--) {
                let mailData = data[i];
                let item = cc.instantiate(this.listItem);
                item.parent = this.content;
                item.getComponent('NoticeListItem').updateUI(mailData);
            }
        } else {
            this.content.destroyAllChildren();
            this.emptyNode.active = false;
        }
    },

    showServices(show) {
        if (!!show) {
            this.showNotice(false);
        }
        this.onlineServiceRoot.active = show;
    }

    // update (dt) {},
});