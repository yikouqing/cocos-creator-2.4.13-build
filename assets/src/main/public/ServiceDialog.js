const AssetsManager = require('../../utils/AssetsManager');
const Enums = require('../../const/Enums');
const ConfigModel = require('../../model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        content: cc.Node,
    },

    onLoad() {
        AssetsManager.loadAsset({
            path: 'res/prefab/main/public/ServiceItem',
            bundle: ConfigModel.getSkin(),
            aType: cc.Prefab
        });
    },

    btnClicks(event, params) {
        switch (params) {
            case 'close':
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
                break;
        }
    },

    start() {
        let configs = Enums.serviceType;
        AssetsManager.loadAsset({
            path: 'res/prefab/main/public/ServiceItem',
            bundle: ConfigModel.getSkin(),
            aType: cc.Prefab
        }, (pfb) => {
            if (!cc.isValid(this.content) || !pfb) return;
            for (const key in configs) {
                let sVal = ConfigModel.getData(key);
                if (!sVal || sVal.length == 0) continue;
                let sNode = cc.instantiate(pfb);
                this.content.addChild(sNode);
                sNode.getComponent('ServiceItem') && sNode.getComponent('ServiceItem').bind(key);
            }
        });
    },

    // update (dt) {},
});