const Configs = require('../../const/Configs');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {},

    start() {
        this.node.active = !!cc.sys.isBrowser || !!ConfigModel.getData('demo');
    },

    onClick() {
        AssetsManager.skinDialog();
    },

});