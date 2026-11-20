const NetworkLogic = require('../utils/NetworkLogic');
const Configs = require('../const/Configs');
const ConfigModel = require('../model/ConfigModel');

var api = module.exports;
api.getPhoneCode = function (phoneNumber, cbSuccess, cbFail) {
    let route = `${ConfigModel.getUrl('server')}/getSMSCode`;
    let requestData = {
        phoneNumber: phoneNumber,
    };
    NetworkLogic.gameHttpRequest(route, 'POST', requestData, cbSuccess, cbFail);
};

api.uploadImage = function (file, cbSuccess, cbFail) {
    if (typeof (file) != 'string') file = '';
    file = file.replace(/[/]/g, "_"); //base64中的/替换为_
    file = file.replace(/[+]/g, "-"); //base64中的+替换为-
    let route = `${ConfigModel.getUrl('ftps')}/api/upload`;
    let requestData = {
        file: file
    };
    NetworkLogic.gameHttpRequest(route, 'POST', requestData, cbSuccess, cbFail);
}