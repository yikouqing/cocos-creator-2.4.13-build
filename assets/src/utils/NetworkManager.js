const MessageCallback = require('./MessageCallback');
const AssetsManager = require('./AssetsManager');
const Codes = require('../../src/const/Codes');
const UserModel = require('../../src/model/UserModel');
const CryptoUtil = require('./CryptoUtil');
const pomelo = window.pomelo;

var exp = module.exports;

exp.init = function (data, cb) {
    pomelo.init({
        host: data.host,
        port: data.port,
        log: true
    }, cb);
};

exp.disconnect = function () {
    pomelo.disconnect();
};

exp.request = function (route, req, succ, fail) {
    pomelo.request(route, req, (res) => {
        let data = typeof (res) == 'string' ? CryptoUtil.decrypt(res) : res;
        // 如果含有updateUserData字段，则是更新数据
        if ("updateUserData" in data) {
            MessageCallback.emitMessage("UpdateUserInfoPush", data.updateUserData);
            UserModel.setDatas(data.updateUserData);
        }
        if (data.code !== Codes.OK) {
            if (!!fail) {
                if ((typeof (fail) === 'function')) {
                    fail(data);
                } else {
                    MessageCallback.emitMessage(fail, data);
                }
            }
            if (!!Codes[data.code]) {
                // console.log('API_FAIL', data);
                AssetsManager.tipDialog(Codes[data.code]);
            } else {
                AssetsManager.tipDialog('游戏错误，错误码：' + data.code);
            }
        } else {
            if (!!succ) {
                if (typeof (succ) === 'function') {
                    succ(data);
                } else {
                    MessageCallback.emitMessage(succ, data);
                }
            }
        }
    });
};

exp.send = function (route, msg, succ, fail) {
    // console.log("route, msg",route, msg,)
    let req = CryptoUtil.encrypt(msg);
    this.request(route, req, succ, fail);
};

exp.notify = function (route, msg) {
    let req = CryptoUtil.encrypt(msg);
    pomelo.notify(route, req);
};

exp.addReceiveListen = function (route, succ) {
    succ = succ || route;
    let listener = (msg) => {
        if (!!succ) {
            // console.log('push:' + succ, msg);
            MessageCallback.emitMessage(succ, msg);
        }
    };
    pomelo.on(route, listener);
    return listener;
};

exp.removeListener = function (route, callback) {
    pomelo.removeListener(route, callback);
};

exp.removeAllListeners = function () {
    pomelo.removeAllListeners();
};

exp.httpRequest = function (params) {
    let method = params.method || 'GET';
    let url = params.url;
    let xhr = new XMLHttpRequest();
    let reqData = params.data;
    xhr.onload = function () {
        if (xhr.status === 200) {
            let response = xhr.response;
            if (typeof (response) == 'string') {
                let parse = JSON.parse(response);
                if (typeof (parse) != 'object') {
                    params.cb && params.cb({
                        code: Codes.FAIL
                    });
                } else {
                    params.cb && params.cb(parse);
                }
            } else if (typeof (response) == 'object') {
                params.cb && params.cb(response);
            } else {
                params.cb && params.cb({
                    code: Codes.FAIL
                });
            }
        } else {
            params.cb && params.cb({
                code: Codes.FAIL
            });
        }
    };
    xhr.timeout = 20000;
    xhr.ontimeout = function () {
        params.cb && params.cb({
            code: Codes.FAIL
        });
    };
    xhr.onerror = function (e) {
        params.cb && params.cb({
            code: Codes.FAIL
        });
    };
    let link = '';
    if (method == 'POST') {
        xhr.open(method, url, true);
        xhr.setRequestHeader("CONTENT-TYPE", "application/x-www-form-urlencoded");
        if (!!reqData) {
            let keys = Object.keys(reqData);
            if (keys.length != 0) {
                for (let key in reqData) {
                    if (reqData.hasOwnProperty(key)) {
                        if (link.length > 0) {
                            link += "&";
                        }
                        link += (key + "=" + reqData[key]);
                    }
                }
            }
            if (link.length > 0) {
                xhr.send(encodeURI(link));
            } else {
                xhr.send();
            }
        } else {
            xhr.send();
        }
    } else {
        if (!!reqData) {
            let keys = Object.keys(reqData);
            if (keys.length != 0) {
                link = '?';
                for (let key in reqData) {
                    if (link != '?') link += "&";
                    link += key + "=" + reqData[key];
                }
            }
        }
        xhr.open(method, url + encodeURI(link));
        xhr.send();
    }
};