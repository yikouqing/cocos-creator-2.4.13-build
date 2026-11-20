const AssetsManager = require('../../utils/AssetsManager');
const Configs = require('../../const/Configs');
const Enums = require('../../const/Enums');
const LoginManager = require('../../utils/LoginManager');
const Codes = require('../../const/Codes');
const SubManager = require('../../utils/SubManager');
const ConfigModel = require('../../model/ConfigModel');
const CacheManager = require('../../utils/CacheManager');

cc.Class({
    extends: cc.Component,

    properties: {
        accEdit: cc.EditBox,
        pwdEdit: cc.EditBox,
        nickNameEdit: cc.EditBox,
    },

    onBtnClick(event, parameter) {
        if (parameter === 'close') {
            this.onClose();
        } else if (parameter === 'register') {
            this.onRegister();
        }
    },

    start() {

    },

    onClose() {
        if (this.node.getComponent('DialogWidgetCtrl')) {
            this.node.getComponent('DialogWidgetCtrl').out();
        } else {
            this.node.destroy();
        }
    },

    onRegister() {
        let acc = this.accEdit.string;
        let pwd = this.pwdEdit.string;
        let nickName = this.nickNameEdit.string;
        if (nickName == "") {
            AssetsManager.tipDialog("昵称不能为空");
            return;
        }
        if (acc == "" || pwd == "") {
            AssetsManager.tipDialog("账号密码不能为空");
            return;
        }
        let sex = Math.random() > 0.5 ? 0 : 1;
        let user = {
            nickname: nickName,
            avatar: ConfigModel.getHead(),
            sex: sex,
        }
        let account = {
            account: acc,
            password: pwd,
            loginPlatform: Enums.loginPlatform.ACCOUNT
        };
        LoginManager.register(
            account,
            user,
            () => {
                account.nickname = nickName;
                CacheManager.setItem('account', JSON.stringify(account));
                LoginManager.addAcc(account);
                this.enterGame();
            }, (err) => {
                if (err === Codes.ACCOUNT_EXIST) {
                    AssetsManager.tipDialog(Codes[err]);
                } else {
                    AssetsManager.tipDialog("注册失败，请检查网络后重试");
                }
            });
    },

    enterGame() {
        SubManager.enterBundle(Enums.bundleType.HALL);
    },
});