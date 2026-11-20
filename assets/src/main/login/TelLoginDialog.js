const AssetsManager = require('../../utils/AssetsManager');
const LoginManager = require('../../utils/LoginManager');
const Enums = require('../../const/Enums');
const ApiHttp = require('../../api/ApiHttp');
const ConfigModel = require('../../model/ConfigModel');
const Configs = require('../../const/Configs');
const Utils = require('../../utils/Utils');
const CCUtil = require('../../utils/CCUtil');
const SubManager = require('../../utils/SubManager');
const CacheManager = require('../../utils/CacheManager');
const Codes = require('../../const/Codes');

cc.Class({
    extends: cc.Component,

    properties: {
        codeLay: cc.Node,
        btnCode: cc.Node,
        pwdLay: cc.Node,
        btnPwd: cc.Node,
        phoneEdit: cc.EditBox,
        vcodeEdit: cc.EditBox,
        pwdEdit: cc.EditBox,
        getCodeBtn: cc.Node,
        cdLabel: cc.Label,
        btnRegister: cc.Node,
        savePwd: cc.Toggle,
    },

    start() {
        this.btnRegister.active = cc.sys.isBrowser || !!Configs.development || !!ConfigModel.getData('phoneRegister');
        let account = CacheManager.getItem("phone");
        let save = parseInt(CacheManager.getItem("savapwd")) == 1;
        if (typeof (account) == 'string' && account.length > 0 && !!save) {
            account = JSON.parse(account);
            this.phoneEdit.string = account.account;
            this.pwdEdit.string = account.password;
        }
        this.savePwd.isChecked = !!save;
    },

    onBtnClk(event, param) {
        switch (param) {
            case 'login':
                if (CCUtil.clickInterval(event.target, 2)) return;
                let acc = this.phoneEdit.string;
                let pwd = this.pwdEdit.string;
                let vcode = this.vcodeEdit.string;
                if (acc.length < 11) {
                    AssetsManager.tipDialog('请输入正确的手机号！');
                    return;
                }
                let account = {
                    account: acc,
                    smsCode: vcode,
                    password: pwd,
                    loginPlatform: Enums.loginPlatform.MOBILE_PHONE
                };
                if (this.codeLay.active) {
                    //验证码登录
                    if (vcode === '') {
                        AssetsManager.tipDialog('请输入有效的验证码！');
                        return;
                    }
                    account.password = "";
                } else {
                    let pwdAble = Utils.pwdVerify(pwd, 6, 10);
                    if (!pwdAble) {
                        AssetsManager.tipDialog(`密码中必须包含字母（不区分大小写）、数字，请重新输入~`);
                        return;
                    }
                    account.smsCode = "";
                }
                LoginManager.login(
                    account,
                    null,
                    () => {
                        if (!this.codeLay.active) {
                            CacheManager.setItem('phone', JSON.stringify(account));
                            LoginManager.addAcc(account);
                        }
                        SubManager.enterBundle(Enums.bundleType.HALL);
                    },
                    (err) => {
                        if (this.savePwd.isChecked) {
                            AssetsManager.popDialog({
                                content: "帐号或密码错误，是否清除当前帐号",
                                ok: () => {
                                    CacheManager.delItem('phone');
                                },
                                no: () => { }
                            });
                        } else {
                            CacheManager.delItem('phone');
                            // AssetsManager.tipDialog("登录失败，请检查账号密码后重试");
                            AssetsManager.tipDialog(Codes[err]);
                        }
                    });
                break;
            case 'getCode':
                let tempAccount = this.phoneEdit.string;
                if (tempAccount === '') {
                    AssetsManager.tipDialog('请输入手机号！');
                    return;
                }

                if (tempAccount.length < 11) {
                    AssetsManager.tipDialog('请输入正确的手机号！');
                    return;
                }
                ApiHttp.getPhoneCode(tempAccount, () => {
                    AssetsManager.tipDialog("发送成功");
                }, () => {
                    AssetsManager.tipDialog("发送失败，请稍后重试");
                });
                this.getCodeBtn.active = false;
                let time = 60;
                this.unscheduleAllCallbacks();
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
                break;
            case 'close':
                this.onClose();
                break;
            case 'register':
                AssetsManager.createDialog({
                    path: "res/prefab/main/login/TelRegDialog",
                    cb: this.onClose.bind(this),
                    bundle: ConfigModel.getSkin()
                });
                break;
            case 'modifyPwd':
                AssetsManager.createDialog({
                    path: "res/prefab/main/login/TelPwdModifyDialog",
                    bundle: ConfigModel.getSkin()
                });
                break;
            case 'pwdswitch':
            case 'codeswitch':
                this.unscheduleAllCallbacks();
                this.cdLabel.string = '';
                this.getCodeBtn.active = true;
                this.vcodeEdit.string = '';
                this.pwdEdit.string = '';
                this.codeLay.active = param === 'codeswitch';
                this.pwdLay.active = !this.codeLay.active;
                this.btnPwd.active = this.codeLay.active;
                this.btnCode.active = !this.codeLay.active;
                break;
            case 'save':
                let save = event.isChecked ? 1 : 0;
                CacheManager.setItem('savapwd', save.toString())
                break;
        }
    },
    onClose() {
        if (this.node.getComponent('DialogWidgetCtrl')) {
            this.node.getComponent('DialogWidgetCtrl').out();
        } else {
            this.node.destroy();
        }
    }

});