const AssetsManager = require('../../utils/AssetsManager');
const Enums = require('../../const/Enums');
const LoginManager = require('../../utils/LoginManager');
const Codes = require('../../const/Codes');
const ConfigModel = require('../../model/ConfigModel');
const Configs = require('../../const/Configs');
const CCUtil = require('../../utils/CCUtil');
const SubManager = require('../../utils/SubManager');
const CacheManager = require('../../utils/CacheManager');

cc.Class({
    extends: cc.Component,

    properties: {
        accEdit: cc.EditBox,
        pwdEdit: cc.EditBox,
        savePwd: cc.Toggle,
        btnRegister: cc.Node
    },

    start() {
        this.btnRegister.active = cc.sys.isBrowser || !!Configs.development || !!ConfigModel.getData('accountRegister');
        let account = CacheManager.getItem("account");
        let save = parseInt(CacheManager.getItem("savapwd")) == 1;
        if (typeof (account) == 'string' && account.length > 0 && !!save) {
            account = JSON.parse(account);
            this.accEdit.string = account.account;
            this.pwdEdit.string = account.password;
        }
        this.savePwd.isChecked = !!save;
    },

    onBtnClick(event, parameter) {
        if (parameter === 'close') {
            this.onClose();
        } else if (parameter === 'login') {
            if (CCUtil.clickInterval(event.target, 2)) return;
            this.onLogin();
        } else if (parameter === "register") {
            AssetsManager.createDialog({
                path: "res/prefab/main/login/AccRegDialog",
                bundle: ConfigModel.getSkin(),
                cb: this.onClose.bind(this)
            });
        } else if (parameter === 'sava') {
            let save = event.isChecked ? 1 : 0;
            CacheManager.setItem('savapwd', save.toString())
        }
    },

    onDestroy() {

    },

    onClose() {
        if (this.node.getComponent('DialogWidgetCtrl')) {
            this.node.getComponent('DialogWidgetCtrl').out();
        } else {
            this.node.destroy();
        }
    },

    onLogin() {
        let acc = this.accEdit.string;
        let pwd = this.pwdEdit.string;
        if (acc == "" || pwd == "") {
            AssetsManager.tipDialog("账号或密码不能为空");
            return;
        }
        let account = {
            account: acc,
            password: pwd,
            loginPlatform: Enums.loginPlatform.ACCOUNT
        };
        LoginManager.login(
            account,
            null,
            () => {
                CacheManager.setItem('account', JSON.stringify(account));
                LoginManager.addAcc(account);
                SubManager.enterBundle(Enums.bundleType.HALL);
            },
            (err) => {
                if (err === Codes.ACCOUNT_OR_PASSWORD_ERROR) {
                    if (this.savePwd.isChecked) {
                        AssetsManager.popDialog({
                            content: "帐号或密码错误，是否清除当前帐号",
                            ok: () => {
                                CacheManager.delItem('account');
                            },
                            no: () => { }
                        });
                    } else {
                        CacheManager.delItem('account');
                    }
                } else {
                    AssetsManager.tipDialog(Codes[err]);
                }
            });
    },
    // update (dt) {},
});