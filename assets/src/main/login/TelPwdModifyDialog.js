const AssetsManager = require('../../utils/AssetsManager');
const LoginManager = require('../../utils/LoginManager');
const Enums = require('../../const/Enums');
const ApiHttp = require('../../api/ApiHttp');
const SubManager = require('../../utils/SubManager');
const Codes = require('../../const/Codes');
const Utils = require('../../utils/Utils');
const Configs = require('../../const/Configs');
const ApiHall = require('../../api/ApiHall');
const ApiAcc = require('../../api/ApiAcc');

cc.Class({
    extends: cc.Component,

    properties: {
        phoneEdit: cc.EditBox,
        codeEdit: cc.EditBox,
        pwdEdit: cc.EditBox,
        vpwdEdit: cc.EditBox,
        getCodeBtn: cc.Node,
        cdLabel: cc.Label
    },

    onBtnClk(event, param) {
        switch (param) {
            case 'login':
                let acc = this.phoneEdit.string;
                let code = this.codeEdit.string;
                let pwd = this.pwdEdit.string;
                let vpwd = this.vpwdEdit.string;
                if (acc === '') {
                    AssetsManager.tipDialog('请输入手机号~');
                    return;
                }
                if (acc.length < 11) {
                    AssetsManager.tipDialog('请输入正确的手机号~');
                    return;
                }
                let pwdAble = Utils.pwdVerify(pwd, 6, 10);
                if (!pwdAble) {
                    AssetsManager.tipDialog(`密码中必须包含字母（不区分大小写）、数字，请重新输入~`);
                    return;
                }
                if (pwd != vpwd) {
                    AssetsManager.tipDialog('两次输入密码不一致，请重新输入~');
                    return;
                }
                if (code === '') {
                    AssetsManager.tipDialog('请输入有效的验证码~');
                    return;
                }
                ApiAcc.resetPassword(acc, pwd, code, () => {
                    AssetsManager.tipDialog("修改密码成功~");
                    if (this.node.getComponent('DialogWidgetCtrl')) {
                        this.node.getComponent('DialogWidgetCtrl').out();
                    } else {
                        this.node.destroy();
                    }
                }, () => {
                    AssetsManager.tipDialog("修改密码失败！");
                });
                break;
            case 'getCode': {
                let acc = this.phoneEdit.string;
                if (acc === '') {
                    AssetsManager.tipDialog('请输入手机号！');
                    return;
                }
                if (acc.length < 11) {
                    AssetsManager.tipDialog('请输入正确的手机号！');
                    return;
                }
                ApiHttp.getPhoneCode(acc, () => {
                    AssetsManager.tipDialog("发送成功");
                }, () => {
                    AssetsManager.tipDialog("发送失败，请稍后重试");
                });
                this.getCodeBtn.active = false;
                let time = 60;
                this.unscheduleAllCallbacks();
                this.cdLabel.string = "";
                this.schedule(() => {
                    if (time <= 0) {
                        this.getCodeBtn.active = true;
                        this.cdLabel.string = "";
                        this.unscheduleAllCallbacks();
                        return;
                    }
                    this.cdLabel.string = time + 's';
                    time--;
                }, 1);
            }
                break;
            case 'close': {
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
            }
                break;
        }
    }

    // update (dt) {},
});