const AssetsManager = require('../../utils/AssetsManager');
const Utils = require('../../utils/Utils');
const ApiHall = require('../../api/ApiHall');
const UserModel = require('../../model/UserModel');
const MessageCallback = require('../../utils/MessageCallback');
const ConfigModel = require('../../model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        noteEdit: cc.EditBox,
        linkEdit: cc.EditBox,
        redNode: cc.Node,
    },

    start() {
        MessageCallback.addListener('UpdateUserInfoPush', this);
        MessageCallback.addListener('ReconnectSuccess', this);
        this.redSync();
    },

    messageCallbackHandler(route, data) {
        switch (route) {
            case 'UpdateUserInfoPush':
            case 'ReconnectSuccess':
                this.redSync();
                break;
        }
    },

    redSync() {
        this.redNode.active = UserModel.unreadEmailCount() > 0;
    },

    btnClick(event, params) {

        switch (params) {
            case 'close':
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
                break;
            case 'submit':
                this._onSubmit();
                break;
            case 'email':
                AssetsManager.createDialog({
                    path: 'res/prefab/main/mail/MailDialog',
                    bundle: ConfigModel.getSkin(),
                });
                break;
        }
    },

    _onSubmit() {
        let msg = this.noteEdit.string;
        let msgLen = Utils.getCharCount(msg);
        if (msgLen <= 0) {
            AssetsManager.tipDialog('输入内容有误！');
            return;
        }
        if (msgLen > 400) {
            AssetsManager.tipDialog('请您控制在200字以内！');
            return;
        }
        let nickname = UserModel.getData('nickname');
        let reqData = {
            nick: nickname,
            message: this.noteEdit.string,
            contact: this.linkEdit.string
        };
        ApiHall.noteRequest(reqData, (res) => {
            // console.log('提交', res);
            if (res.code != 0) {
                AssetsManager.tipDialog('啊哦~提交失败！系统开小差了~');
                return;
            }
            AssetsManager.tipDialog('提交成功！感谢您的宝贵意见，我们会用心对待您的每次发声！');
            this.node.destroy();
        });
    },

    onDestroy() {
        MessageCallback.removeListener('UpdateUserInfoPush', this);
        MessageCallback.removeListener('ReconnectSuccess', this);
    },

});