const NetworkLogic = require('../utils/NetworkLogic');
const ConfigModel = require('../model/ConfigModel');

var api = module.exports;
api.login = function (account, password, code, loginPlatform, cbSuccess, cbFail) {
    let route = `${ConfigModel.getUrl('server')}/login`;
    let requestData = {
        account: account,
        password: password,
        loginPlatform: loginPlatform,
        smsCode: code
    };
    NetworkLogic.gameHttpRequest(route, 'POST', requestData, cbSuccess, cbFail);
};

api.resetPassword = function (account, password, code, cbSuccess, cbFail) {
    let route = `${ConfigModel.getUrl('server')}/resetPassword`;
    let requestData = {
        account: account,
        password: password,
        smsCode: code
    };
    NetworkLogic.gameHttpRequest(route, 'POST', requestData, cbSuccess, cbFail);
};

api.register = function (nickname, account, password, loginPlatform, smsCode, cbSuccess, cbFail) {
    let route = `${ConfigModel.getUrl('server')}/register`;
    let requestData = {
        nickname: nickname,
        account: account,
        password: password,
        loginPlatform: loginPlatform,
        smsCode: smsCode
    };
    NetworkLogic.gameHttpRequest(route, 'POST', requestData, cbSuccess, cbFail);
};

api.wxInfo = function (code, cbSuccess, cbFail) {
    let route = `${ConfigModel.getUrl('server')}/wxInfo`;
    let requestData = {
        code: code
    };
    NetworkLogic.gameHttpRequest(route, 'POST', requestData, cbSuccess, cbFail);
};

api.resetPasswordByPhoneRequest = function (account, newPassword, smsCode, imgCodeInfo, cbSuccess, cbFail) {
    let route = `${ConfigModel.getUrl('server')}/resetPasswordByPhone`;
    let requestData = {
        account: account,
        newPassword: newPassword,
        smsCode: smsCode,
        imgCodeInfo: imgCodeInfo
    };
    NetworkLogic.gameHttpRequest(route, 'POST', requestData, cbSuccess, cbFail);
};

api.reconnectionRequest = function (token, cbSuccess, cbFail) {
    let route = `${ConfigModel.getUrl('server')}/reconnection`;
    let requestData = {
        token: token
    };
    NetworkLogic.gameHttpRequest(route, 'POST', requestData, cbSuccess, cbFail);
};