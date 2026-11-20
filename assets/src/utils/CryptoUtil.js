const ConfigModel = require('../model/ConfigModel');
const crypto = require('crypto');

var utils = module.exports;

utils.decrypt = function (data) {
    data = data || "";
    let authKey = ConfigModel.getAuthKey('cryptoKey');
    let authIv = ConfigModel.getAuthKey('cryptoIv');
    let decipher = crypto.createDecipheriv('aes-256-cbc', authKey, authIv);
    let decrypted = decipher.update(data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
}

utils.encrypt = function (data) {
    data = data || {};
    if (typeof (data) == 'object') data = JSON.stringify(data);
    let authKey = ConfigModel.getAuthKey('cryptoKey');
    let authIv = ConfigModel.getAuthKey('cryptoIv');
    let cipher = crypto.createCipheriv('aes-256-cbc', authKey, authIv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

utils.license = function (license) {
    license = license || "";
    let authKey = ConfigModel.getAuthKey('licenseKey');
    let authIv = ConfigModel.getAuthKey('licenseIv');
    let decipher = crypto.createDecipheriv('aes-256-cbc', authKey, authIv);
    let decrypted = decipher.update(license, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
}