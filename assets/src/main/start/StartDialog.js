const MessageCallback = require('../../utils/MessageCallback');
const NativeUtil = require('../../utils/NativeUtil');
const AssetsManager = require('../../utils/AssetsManager');
const CCUtil = require('../../utils/CCUtil');
const SubManager = require('../../utils/SubManager');
const Enums = require('../../const/Enums');
const UserModel = require('../../model/UserModel');
const LoginManager = require('../../utils/LoginManager');
const ConfigModel = require('../../model/ConfigModel');
const Codes = require('../../const/Codes');
const Utils = require('../../utils/Utils');
const CacheManager = require('../../utils/CacheManager');

cc.Class({
    extends: cc.Component,

    properties: {
        versionLabel: cc.Label,
        btnAccLogin: cc.Node,
        btnTelLogin: cc.Node,
        btnWechatLogin: cc.Node,
        btnAppleLogin: cc.Node,
        userRule: cc.Node,
        togUserRule: cc.Toggle,
        _isWxWebLogin: false,
    },

    start() {
        MessageCallback.addListener('PlatformLogin', this);
        this._isWxWebLogin = false;
        let appChannel = NativeUtil.getAppChannel();
        let channel = ConfigModel.getChannel(appChannel);
        this.versionLabel.string = `Res.${appChannel}.${ConfigModel.getData('resVer') || '1.0.0'}`;
        if (this.btnAccLogin) this.btnAccLogin.active = cc.sys.isBrowser || !!ConfigModel.getData('accountLogin') || !!channel.accountLogin;
        if (this.btnTelLogin) this.btnTelLogin.active = cc.sys.isBrowser || !!ConfigModel.getData('phoneLogin') || !!channel.phoneLogin;
        if (this.btnWechatLogin) this.btnWechatLogin.active = !cc.sys.isBrowser && (!!ConfigModel.getData('wechatLogin') || !!channel.wechatLogin);
        if (this.btnAppleLogin) this.btnAppleLogin.active = !cc.sys.isBrowser && (!!ConfigModel.getData('appleLogin') || !!channel.appleLogin) && (cc.sys.os === cc.sys.OS_IOS || cc.sys.os === cc.sys.OS_OSX);
        this.checkUserRule(true);
        this.getWebWXCode();
    },

    getWebWXCode() {
        if (!cc.sys.isBrowser) return;
        let urlParse = () => {
            var params = {};
            if (window.location == null) {
                return params;
            }
            var name, value;
            var str = window.location.href; //取得整个地址栏
            var num = str.indexOf("?")
            str = str.substr(num + 1); //取得所有参数   stringvar.substr(start [, length ]
            var arr = str.split("&"); //各个参数放到数组里
            for (var i = 0; i < arr.length; i++) {
                num = arr[i].indexOf("=");
                if (num > 0) {
                    name = arr[i].substring(0, num);
                    value = arr[i].substr(num + 1);
                    params[name] = value;
                }
            }
            return params;
        };

        // 获取地址栏所携带code
        let code = urlParse().code;
        if (!code) return;
        if (code == 'false') return;
        let tmp = JSON.stringify(code);
        // 重新设置code，防止被刷新
        window.history.replaceState(null, '', '?code=false');
        this._isWxWebLogin = true
        this.btnAccLogin.parent.active = false;
        this.userRule.active = false
        LoginManager.wxInfo(code, (uData) => {
            MessageCallback.emitMessage('PlatformLogin', {
                platform: Enums.loginPlatform.WEI_XIN,
                userInfo: uData.msg
            });
        }, () => {
            AssetsManager.tipDialog("登录失败，请稍候重试！！")
            this._isWxWebLogin = false;
            this.btnAccLogin.parent.active = true;
            this.userRule.active = true;
        })
    },

    onDestroy() {
        MessageCallback.removeListener('PlatformLogin', this);
    },

    messageCallbackHandler(route, msg) {
        switch (route) {
            case 'PlatformLogin':
                let platform = msg.platform;
                // console.log("wxplatform", JSON.stringify(msg))
                let wechat = {
                    account: msg.userInfo.unionid,
                    password: msg.userInfo.unionid,
                    loginPlatform: Enums.loginPlatform.WEI_XIN
                };
                let user = {
                    nickname: msg.userInfo.nickname,
                    avatar: msg.userInfo.headimgurl,
                    sex: (parseInt(msg.userInfo.sex) + 1) % 2
                };
                LoginManager.register(wechat, user, () => {
                    wechat.userInfo = user;
                    wechat.nickname = user.nickname;
                    if (platform == Enums.loginPlatform.APPLE) {
                        CacheManager.setItem('apple', JSON.stringify(wechat));
                    } else {
                        CacheManager.setItem('wechat', JSON.stringify(wechat));
                    }
                    LoginManager.addAcc(wechat);
                    this.enterGame();
                }, (err) => {
                    if (err === Codes.ACCOUNT_OR_PASSWORD_ERROR) {
                        AssetsManager.popDialog({
                            content: `${Codes[err]}，是否清除当前帐号`,
                            ok: () => {
                                CacheManager.delItem('wechat');
                            },
                            no: () => { }
                        });
                    } else {
                        AssetsManager.tipDialog("登录失败，请检查网络后重试");
                    }
                });
                break;
        }
    },

    onBtnClk(event, param) {
        if (this._isWxWebLogin) {
            // console.log("已经点击了微信登录")
            return
        }
        switch (param) {
            case 'quickStart':
                this.quickLogin();
                break;
            case 'visitorLogin':
                let account = {
                    account: Utils.randomString(16),
                    password: Utils.randomString(16),
                    loginPlatform: Enums.loginPlatform.ACCOUNT
                };
                LoginManager.register(
                    account,
                    null,
                    () => {
                        account.nickname = UserModel.getData('nickname');
                        LoginManager.addAcc(account);
                        this.enterGame();
                    }, (err) => {
                        if (err === Codes.ACCOUNT_OR_PASSWORD_ERROR) {
                            AssetsManager.popDialog({
                                content: `${Codes[err]}，是否清除当前帐号？`,
                                ok: () => {
                                    LoginManager.clear();
                                },
                                no: () => { }
                            });
                        } else {
                            AssetsManager.tipDialog("登录失败，请检查网络后重试");
                        }
                    });
                break;
            case 'phone':
                if (!this.checkUserRule()) return;
                AssetsManager.createDialog({
                    path: "res/prefab/main/login/TelLoginDialog",
                    bundle: ConfigModel.getSkin(),
                });
                break;
            case 'wxLogin':
                if (!this.checkUserRule()) return;
                if (CCUtil.clickInterval(event.target, 2)) return;
                this._onWechatLogin();
                break;
            case 'appleLogin':
                if (!this.checkUserRule()) return;
                if (CCUtil.clickInterval(event.target, 2)) return;
                this._onAppleLogin();
                break;
            case "switchServer":
                this.updateServer(this.serverIndex + 1);
                break;
            case 'switchAccount':
                AssetsManager.createDialog({
                    path: "res/prefab/main/login/WxAccountListDialog",
                    bundle: ConfigModel.getSkin(),
                    cb: this.updateAccountInfo.bind(this)
                });
                break;
            case "accLogin":
                if (!this.checkUserRule()) return;
                AssetsManager.createDialog({
                    path: "res/prefab/main/login/AccLoginDialog",
                    bundle: ConfigModel.getSkin(),
                });
                break;
            case "readAgreement":
                AssetsManager.createDialog({
                    path: "res/prefab/main/login/UserAgreementDialog",
                    bundle: ConfigModel.getSkin(),
                    callback: (isChecked) => {
                        this.setUserRule(isChecked);
                        this.checkUserRule();
                    }
                });
                break;
            case "userAgreement":
                this.setUserRule(!!event.isChecked);
                break;
        }
    },

    _onWechatLogin() {
        let account = CacheManager.getItem("wechat");
        if (typeof (account) == 'string' && account.length > 0) {
            account = JSON.parse(account);
            LoginManager.register(
                account,
                account.userInfo,
                () => {
                    this.enterGame();
                }, (err) => {
                    if (err === Codes.ACCOUNT_OR_PASSWORD_ERROR) {
                        AssetsManager.popDialog({
                            content: `${Codes[err]}，是否清除当前帐号？`,
                            ok: () => {
                                CacheManager.delItem('wechat');
                            },
                            no: () => { }
                        });
                    } else {
                        AssetsManager.tipDialog("登录失败，请检查网络后重试");
                    }
                });
        } else {
            NativeUtil.wxLogin();
        }
    },

    _onAppleLogin() {
        let account = CacheManager.getItem("apple");
        if (typeof (account) == 'string' && account.length > 0) {
            account = JSON.parse(account);
            account.loginPlatform = Enums.loginPlatform.WEI_XIN;//强转
            LoginManager.register(
                account,
                account.userInfo,
                () => {
                    this.enterGame();
                }, (err) => {
                    if (err === Codes.ACCOUNT_OR_PASSWORD_ERROR) {
                        AssetsManager.popDialog({
                            content: `${Codes[err]}，是否清除当前帐号？`,
                            ok: () => {
                                CacheManager.delItem('apple');
                            },
                            no: () => { }
                        });
                    } else {
                        AssetsManager.tipDialog("登录失败，请检查网络后重试");
                    }
                });
        } else {
            NativeUtil.appleLogin();
        }
    },

    enterGame() {
        SubManager.enterBundle(Enums.bundleType.HALL);
    },

    quickLogin() {
        LoginManager.quick(null, true, (err) => {
            if (!!err) {
                if (err === Codes.ACCOUNT_OR_PASSWORD_ERROR) {
                    AssetsManager.popDialog({
                        content: "帐号或密码错误，是否清除当前帐号",
                        ok: () => {
                            LoginManager.clear();
                        },
                        no: () => { }
                    });
                } else {
                    AssetsManager.tipDialog("登录失败，请检查网络后重试");
                }
            } else {
                this.enterGame();
            }
        });
    },

    updateServer(serverIndex) { },

    updateAccountInfo() { },


    setUserRule(isChecked) {
        CacheManager.setItem('userAgreementRead', isChecked);
    },
    checkUserRule(noCheck) {
        let userAgreementRead = CacheManager.getItem('userAgreementRead');
        if (this.togUserRule) {
            this.togUserRule.isChecked = !!userAgreementRead;
        };
        if (!!noCheck) return true;
        if (!userAgreementRead) {
            AssetsManager.tipDialog("请先阅读同意游戏用户协议、隐私保护指引！");
        }
        return !!userAgreementRead;
    },


});