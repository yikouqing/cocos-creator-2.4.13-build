const AssetsManager = require('../../utils/AssetsManager');
const LoginManager = require('../../utils/LoginManager');
const Enums = require('../../const/Enums');
const ApiHttp = require('../../api/ApiHttp');
const SubManager = require('../../utils/SubManager');
const Codes = require('../../const/Codes');
const Utils = require('../../utils/Utils');
const UserModel = require('../../model/UserModel');
const ConfigModel = require('../../model/ConfigModel');
const CacheManager = require('../../utils/CacheManager');

cc.Class({
    extends: cc.Component,

    properties: {
        phoneEdit: cc.EditBox,
        nickEdit: cc.EditBox,
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
                let nick = this.nickEdit.string;
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
                let nickLen = Utils.getCharCount(nick);
                if (nick.length == 0 || nickLen > 16) {
                    AssetsManager.tipDialog(`请输入不超过16位字符的昵称~`);
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
                    AssetsManager.tipDialog('请输入验证码~');
                    return;
                }
                let sex = Math.random() > 0.5 ? 0 : 1;
                let account = {
                    smsCode: code,
                    account: acc,
                    password: pwd,
                    nickname: nick,
                    loginPlatform: Enums.loginPlatform.MOBILE_PHONE
                };
                let user = {
                    nickname: nick,
                    avatar: ConfigModel.getHead(),
                    sex: sex,
                }
                LoginManager.register(
                    account,
                    user,
                    () => {
                        account.nickname = UserModel.getData('nickname');
                        CacheManager.setItem('phone', JSON.stringify(account));
                        LoginManager.addAcc(account);
                        SubManager.enterBundle(Enums.bundleType.HALL);
                    }, (err) => {
                        if (err === Codes.ACCOUNT_EXIST || err === Codes.NICKNAME_EXIST) {
                            AssetsManager.tipDialog(Codes[err]);
                        } else {
                            AssetsManager.tipDialog("注册失败，请稍候重试~");
                        }
                    });
                break;
            case 'getCode': {
                let cacc = this.phoneEdit.string;
                if (cacc === '') {
                    AssetsManager.tipDialog('请输入手机号！');
                    return;
                }
                if (cacc.length < 11) {
                    AssetsManager.tipDialog('请输入正确的手机号！');
                    return;
                }
                ApiHttp.getPhoneCode(cacc, () => {
                    AssetsManager.tipDialog("发送成功");
                }, () => {
                    AssetsManager.tipDialog("发送失败，请稍后重试");
                });
                this.getCodeBtn.active = false;
                let time = 60;
                this.unscheduleAllCallbacks();
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