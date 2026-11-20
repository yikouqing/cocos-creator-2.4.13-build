const Configs = require('../const/Configs');
const ConfigModel = require('../model/ConfigModel');
const ABManager = require('../utils/ABManager');
const CCUtil = require('./CCUtil');
const AssetsManager = require('./AssetsManager');
const NodePoolManager = require('./NodePoolManager');
const EffectFilter = ['hall', 'start', 'union'];

var exp = module.exports;

exp.init = function () {
    AssetsManager.loadAsset({
        path: 'prefab/effect/EffectClick',
        aType: cc.Prefab
    }, (item) => {
        if (!item) return;
        NodePoolManager.init('clickEffectPool', item, 10);
    });
}

//回收BET
exp.revokeClick = function (node) {
    NodePoolManager.put('clickEffectPool', node);
}

exp.addClick = function (pos) {
    if (cc.sys.isBrowser) ConfigModel.setData('clickEffect', true);
    if (!ConfigModel.getData('clickEffect')) return;
    let scene = cc.director.getScene();
    if (!EffectFilter.includes(scene.name)) return;
    let root = AssetsManager.getRoot();
    if (!root || !cc.isValid(root)) return;
    let cItem = NodePoolManager.get('clickEffectPool');
    if (!cItem) return;
    let cNode = cc.instantiate(cItem);
    let toPos = root.convertToNodeSpaceAR(pos, cc.v2());
    cNode.setPosition(toPos);
    root.addChild(cNode);
}