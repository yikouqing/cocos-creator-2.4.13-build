const AssetsManager = require('./AssetsManager');
const Codes = require('../../src/const/Codes');
const NetworkManager = require('./NetworkManager');
const LoginManager = require('./LoginManager');
const ConfigModel = require('../model/ConfigModel');
const CacheManager = require('./CacheManager');

var exp = module.exports;

exp.init = function () {
    this.isManualCloseServerConnection = false;
    NetworkManager.removeAllListeners();
    NetworkManager.addReceiveListen('close', 'ServerDisconnection');
    NetworkManager.addReceiveListen('ServerMessagePush', 'ServerMessagePush');
};

exp.connectToServer = function (host, port, cb) {
    let ws = ConfigModel.getUrl('ws');
    NetworkManager.init({
        host: ws.host,
        port: ws.port
    }, cb);
};

exp.disconnect = function (autoReconnect) {
    this.isManualCloseServerConnection = !autoReconnect;
    NetworkManager.disconnect();
};

exp.reconnection = function (cb) {
    let token = CacheManager.getItem('token');
    if (!token) {
        cb && cb({
            code: 1
        });
    } else {
        LoginManager.reconnection(token,
            (res) => {
                cb && cb(res);
            }, () => {
                cb && cb({
                    code: 1
                });
            });
    }
};

exp.gameHttpRequest = function (url, method, data, succ, fail) {
    let params = {
        url: url,
        method: method,
        data: data,
        cb: (res) => {
            if (res.code !== 0) {
                if (!!fail) {
                    fail && fail(res.code);
                } else {
                    AssetsManager.tipDialog(Codes[res.code]);
                }
            } else {
                succ && succ(res);
            }
        }
    };
    NetworkManager.httpRequest(params);
};

exp.isManualCloseConnection = function () {
    return this.isManualCloseServerConnection;
}

exp.setManualCloseConnection = function (manual) {
    this.isManualCloseServerConnection = manual;
}