const AssetsManager = require('../../utils/AssetsManager');
const CCUtil = require('../../utils/CCUtil');
const MessageCallback = require('../../utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        emailTitle: cc.Label,
        emailTitle1: cc.Label,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() { },

    initWidget(emailInfo) {
        this.emailInfo = emailInfo;

        // this.emailStatus0.active = !this.emailInfo.isRead;
        // this.emailStatus1.active = this.emailInfo.isRead;

        this.emailTitle.string = emailInfo.title;
        this.emailTitle1.string = emailInfo.title;
        // this.emailAbstract.string = emailInfo.content.slice(0, 10) + "...";
        if (this.node.getComponent(cc.Toggle).isChecked) {
            MessageCallback.emitMessage("showMailInfo", {
                mailData: this.emailInfo
            })
        }
    },



    init(email) {
        this.email = email;
        this.emailTitle.string = email.title;
    },
    onShowEmailInfo() {
        MessageCallback.emitMessage("showMailInfo", {
            mailData: this.email
        })
    },

    onBtnClick(event, param) {

        if (event.isChecked) {
            MessageCallback.emitMessage("showMailInfo", {
                mailData: this.emailInfo
            })
        }
    }
});