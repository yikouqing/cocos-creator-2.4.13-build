const AssetsManager = require('../../../src/utils/AssetsManager');
const ConfigModel = require('../../../src/model/ConfigModel');
const Enums = require('../../../src/const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {},

    onLoad() {
        AssetsManager.init(this.node);
        AssetsManager.createDialog({
            bundle: Enums.bundleType.SDB,
            path: 'res/prefab/SDBMainDialog'
        });
    },

    onDestroy() {
        ConfigModel.setData('lastScene', 'sdb');
        AssetsManager.release();
    }

});