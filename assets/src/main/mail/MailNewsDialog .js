const MessageCallback = require('../../utils/MessageCallback');
const Utils = require('../../utils/Utils');
const AssetsManager = require('../../utils/AssetsManager');
const UserModel = require('../../model/UserModel');
const ApiHall = require('../../api/ApiHall');

cc.Class({
    extends: cc.Component,

    properties: {
        emptyTipNode: cc.Node,
        emailContentRoot: cc.Node,
        emailItemPrefab: cc.Prefab,
        info: cc.Node,
        bg: cc.Node,
        title: cc.Label,
        time: cc.Label,
        content: cc.Label,
        rewardNode: cc.Node,
        rewardGold: cc.Node,
        rewardScore: cc.Node,
        rewardGoldNum: cc.Label,
        rewardScoreNum: cc.Label,
        getBtn: cc.Button,
        alreadyGetNode: cc.Node,
    },

    onLoad() {
        MessageCallback.addListener('UpdateMail', this);
        MessageCallback.addListener('showMailInfo', this);
    },

    onDestroy() {
        MessageCallback.removeListener('UpdateMail', this);
        MessageCallback.removeListener('showMailInfo', this);
    },

    messageCallbackHandler(route, msg) {
        switch (route) {
            case 'UpdateMail':
                this.createList();
                break;
            case "showMailInfo":
                this.onShowMailInfo(msg)
                break
        }
    },

    start() {
        if (this.bg) this.bg.active = true
        this.createList();
    },


    onBtnClick(event, param) {

        switch (param) {
            case 'close':
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
                break;
            case 'delete':
                ApiHall.deleteEmailRequest({ emailID: this.data.id }, () => {
                    // console.log('测试-删除邮件', this.data);
                    AssetsManager.tipDialog('删除成功');
                    MessageCallback.emitMessage('UpdateMail');
                });
                break
            case 'guanbi':
                if (this.bg) this.bg.active = true;
                if (this.info) this.info.active = false;
                break
        }
    },

    createList() {
        this.mailItems = {};
        this.emailContentRoot.removeAllChildren();
        let mails = UserModel.getData('emailArr');
        mails = !mails || mails.length === 0 ? [] : JSON.parse(mails);
        this.emptyTipNode.active = mails.length <= 0;
        if (mails.length <= 0) {
            this.info.active = false
            return;
        }
        for (let i = 0; i < mails.length; i++) {
            let item = cc.instantiate(this.emailItemPrefab)
            let ctrl = item.getComponent("EmailItemWidgetCtrl");
            ctrl.init(mails[i])
            item.parent = this.emailContentRoot;

        }
    },

    onShowMailInfo(msg) {
        if (this.bg) this.bg.active = false
        if (this.info) this.info.active = true
        this.rewardGold.active = false;
        this.rewardScore.active = false;
        this.data = msg.mailData;
        this.title.string = this.data.title.substr(0, 10);
        let date = Utils.getDateFormat(this.data.createTime);
        this.time.string = `时间：${date.yyyymmddhhmmss}`;
        this.content.string = this.data.content;
        this.getBtn.node.active = false;
        this.alreadyGetNode.active = false;
        if (this.rewardGoldNum.active || this.rewardScore.active) {
            if (parseInt(this.data.status) === Enums.emailStatus.NOT_RECEIVE) {
                this.getBtn.node.active = true;
            } else {
                this.alreadyGetNode.active = true;
            }
        } else {
            this.rewardNode.active = false;
        }

        if (!this.data.isRead) {
            UserModel.setMailRead(this.data.id);
            ApiHall.readEmailRequest({ emailID: this.data.id }, function () { });
        }
    }
});