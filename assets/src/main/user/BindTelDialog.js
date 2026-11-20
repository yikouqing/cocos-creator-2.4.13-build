const AssetsManager = require('../../utils/AssetsManager');
const ApiHall = require('../../api/ApiHall');
const ApiHttp = require('../../api/ApiHttp');
const Utils = require('../../utils/Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        bindPhoneLay: cc.Node,
        bindAccLay: cc.Node,
        phoneEdit: cc.EditBox,
        pwdEdit: cc.EditBox,
        vpwdEdit: cc.EditBox,
        codeEdit: cc.EditBox,
        getCodeBtn: cc.Node,
        cdLabel: cc.Label,
        editAcc: cc.EditBox, //账号
        editPwd: cc.EditBox, //密码
    },

    start() {
        if (!!this.node.nodeParams) this.bindAccLay.active = this.node.nodeParams.bindType == 0;
        this.bindPhoneLay.active = !this.bindAccLay.active;
    },

    onBtnClk(event, param) {

        switch (param) {
            case 'bindphone':
                let account = this.phoneEdit.string;
                let code = this.codeEdit.string;
                let pwd = this.pwdEdit.string;
                let vpwd = this.vpwdEdit.string;
                if (account === '') {
                    AssetsManager.tipDialog('请输入手机号！');
                    return;
                }
                if (account.length < 11) {
                    AssetsManager.tipDialog('请输入正确的手机号！');
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
                let reqData = {
                    phone: account,
                    smsCode: code,
                    password: pwd
                };
                ApiHall.bindPhoneRequest(reqData, () => {
                    AssetsManager.popDialog({
                        content: "绑定成功",
                        ok: () => {
                            if (this.node.getComponent('DialogWidgetCtrl')) {
                                this.node.getComponent('DialogWidgetCtrl').out();
                            } else {
                                this.node.destroy();
                            }
                        },
                        no: () => { }
                    });
                });
                break;
            case 'getCode': {
                let account = this.phoneEdit.string;
                if (account === '') {
                    AssetsManager.tipDialog('请输入手机号！');
                    return;
                }
                if (account.length < 11) {
                    AssetsManager.tipDialog('请输入正确的手机号！');
                    return;
                }
                ApiHttp.getPhoneCode(account, () => {
                    AssetsManager.tipDialog("发送成功");
                }, () => {
                    AssetsManager.tipDialog("发送失败，请稍后重试");
                });
                this.getCodeBtn.active = false;
                let time = 60;
                this.unscheduleAllCallbacks();
                this.cdLabel.string = '';
                this.schedule(() => {
                    if (time <= 0) {
                        this.cdLabel.string = '';
                        this.getCodeBtn.active = true;
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
            case 'bindacc': //绑定账号
                let acc = this.editAcc.string;
                let apwd = this.editPwd.string;
                if (acc === '') {
                    AssetsManager.tipDialog('请输入账号！');
                    return;
                }
                if (apwd === '') {
                    AssetsManager.tipDialog('请输入密码！');
                    return;
                }
                let reqsData = {
                    account: acc,
                    password: apwd
                };
                ApiHall.bindAccountRequest(reqsData, () => {
                    AssetsManager.popDialog({
                        content: "绑定成功",
                        ok: () => {
                            if (this.node.getComponent('DialogWidgetCtrl')) {
                                this.node.getComponent('DialogWidgetCtrl').out();
                            } else {
                                this.node.destroy();
                            }
                        },
                        no: () => { }
                    });
                });
                break;
        }
    },

});