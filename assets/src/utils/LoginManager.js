const MessageCallback = require('../utils/MessageCallback');
const AssetsManager = require('../../src/utils/AssetsManager');
const NetworkLogic = require('../../src/utils/NetworkLogic');
const Enums = require('../../src/const/Enums');
const UserModel = require('../model/UserModel');
const CacheManager = require('../../src/utils/CacheManager');
const ApiHall = require('../../src/api/ApiHall');
const ConfigModel = require('../../src/model/ConfigModel');
const Codes = require('../../src/const/Codes');
const ApiAcc = require('../api/ApiAcc');
const NativeUtil = require('../../src/utils/NativeUtil');

var exp = module.exports;

exp.quick = function (acc, auto, cb) {
    let account = this.addAcc();
    if (!!account) {
        if (account.loginPlatform == Enums.loginPlatform.ACCOUNT ||
            account.loginPlatform == Enums.loginPlatform.MOBILE_PHONE) {
            this.login(account,
                acc,
                () => {
                    cb && cb(Codes.OK);
                },
                (err) => {
                    cb && cb(Codes.FAIL);
                });
        } else if (account.loginPlatform == Enums.loginPlatform.WEI_XIN) {
            this.register(account,
                account.userInfo,
                () => {
                    cb && cb(Codes.OK);
                }, () => {
                    cb && cb(Codes.FAIL);
                });
        }
    } else {
        if (!!auto) {
            account = {
                account: Date.now().toString(),
                password: Date.now().toString(),
                loginPlatform: Enums.loginPlatform.ACCOUNT
            };
            this.register(account,
                acc,
                () => {
                    account.nickname = UserModel.getData('nickname');
                    this.addAcc(account);
                    cb && cb(Codes.OK);
                }, () => {
                    cb && cb(Codes.FAIL);
                })
        } else {
            cb && cb(Codes.FAIL);
        }
    }
};

exp.clear = function () {
    let clears = ['token', 'accounts', 'wechat', 'apple', 'phone', 'account']
    CacheManager.delItems(clears);
}

exp.addAcc = function (acc = null) {
    let accounts = CacheManager.getItem('accounts');
    accounts = !!accounts && accounts.length > 0 ? accounts : JSON.stringify([]);
    accounts = JSON.parse(accounts);
    if (typeof (accounts) != 'object') accounts = [];
    let account = null;
    if (!!acc) {
        let index = accounts.findIndex((item) => {
            return item.loginPlatform == acc.loginPlatform && item.account == acc.account;
        });
        if (index != -1) {
            accounts.splice(index, 1);
        }
        accounts.unshift(acc);
        account = acc;
    } else {
        //取第一个
        let tmpAccounts = accounts.slice();
        account = tmpAccounts.shift();
    }
    CacheManager.setItem('accounts', JSON.stringify(accounts));
    return account;
}

exp.delAcc = function (acc = null) {
    if (!acc) return;
    let accounts = CacheManager.getItem('accounts');
    accounts = !!accounts && accounts.length > 0 ? accounts : JSON.stringify([]);
    accounts = JSON.parse(accounts);
    if (typeof (accounts) != 'object') accounts = [];
    let index = accounts.findIndex((item) => {
        return item.loginPlatform == acc.loginPlatform && item.account == acc.account;
    });
    if (index != -1) {
        accounts.splice(index, 1);
    }
    CacheManager.setItem('accounts', JSON.stringify(accounts));
}

exp.login = function (data, acc, succ, fail) {
    // console.log("ceshi", data, acc)
    ApiAcc.login(data.account,
        data.password,
        data.smsCode,
        data.loginPlatform,
        (res) => {
            NetworkLogic.connectToServer(res.msg.serverInfo.host,
                res.msg.serverInfo.port,
                () => {
                    this.loginHall(res.msg.token, acc, succ);
                })
        },
        fail
    );
};

exp.register = function (data, acc, succ, fail) {
    ApiAcc.register(
        data.nickname,
        data.account,
        data.password,
        data.loginPlatform,
        data.smsCode,
        (res) => {
            NetworkLogic.connectToServer(
                res.msg.serverInfo.host,
                res.msg.serverInfo.port,
                () => {
                    this.loginHall(res.msg.token, acc, succ);
                })
        },
        fail
    );
};

exp.wxInfo = function (code, succ, fail) {
    ApiAcc.wxInfo(code, succ, fail)
};

exp.reconnection = function (token, succ, fail) {
    ApiAcc.reconnectionRequest(token,
        (res) => {
            // 登录成功
            NetworkLogic.connectToServer(res.msg.serverInfo.host,
                res.msg.serverInfo.port,
                () => {
                    this.loginHall(res.msg.token, null, succ);
                })
        },
        fail
    );
};

exp.loginHall = function (token, acc, succ) {
    acc = acc || {};
    ApiHall.entry({
        deviceID: NativeUtil.getDeviceId(),
        token: token,
        userInfo: acc
    }, (res) => {
        // 存储token
        CacheManager.setItem('token', token);
        //游戏数据初始化
        ConfigModel.setDatas(res.msg.config);
        //玩家数据初始化
        UserModel.init(res.msg.userInfo);
        succ && succ(res);
        MessageCallback.emitMessage('ReconnectSuccess');
    }, () => {
        // 进入大厅失败，断开服务器
        NetworkLogic.disconnect(false);
        AssetsManager.popDialog({
            content: `连接服务器失败！请重启客户端再试！`,
            ok: () => {
                UserModel.release();
            }
        });
    })
};