const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const DDZModel = require('./DDZModel');

cc.Class({
    extends: cc.Component,

    properties: {
        clock: cc.Node,
        btnCallOne: cc.Button,
        btnCallTwo: cc.Button,
        btnCallThree: cc.Button,
    },

    sync() {
        let canNabs = DDZModel.getCanCallRates();
        this.btnCallOne.interactable = !!canNabs.one;
        this.btnCallTwo.interactable = !!canNabs.two;
        this.btnCallThree.interactable = !!canNabs.three;
        this.node.active = true;
        this.clock.destroyAllChildren();
        AssetsManager.loadAsset({
            path: 'res/prefab/DDZClock',
            bundle: Enums.bundleType.DDZ,
            aType: cc.Prefab
        }, (item) => {
            this.clock.destroyAllChildren();
            if (!item || !cc.isValid(this.clock) || !this.node.active) return;
            const clock = cc.instantiate(item);
            this.clock.addChild(clock);
        })
    },

    clear() {
        this.clock.destroyAllChildren();
        this.node.active = false;
    },

});