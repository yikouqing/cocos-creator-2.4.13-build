const AssetsManager = require('../../../src/utils/AssetsManager');
const ConfigModel = require('../../../src/model/ConfigModel');
const Enums = require('../../../src/const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {},

    onLoad() {
        AssetsManager.init(this.node);
        AssetsManager.createDialog({
            bundle: Enums.bundleType.GCT,
            path: 'res/prefab/GCTMainDialog'
        });
    },

    onDestroy() {
        ConfigModel.setData('lastScene', 'gct');
        AssetsManager.release();
    }

});