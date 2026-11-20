const AssetsManager = require('../../utils/AssetsManager');

cc.Class({
    extends: cc.Component,

    properties: {
        _voice: null
    },

    start() {
        let root = AssetsManager.getRoot();
        AssetsManager.loadAsset({
            path: 'prefab/common/chat/Voice',
            aType: cc.Prefab
        }, (as) => {
            if (!cc.isValid(this.node) ||
                !as ||
                !!this._voice ||
                !cc.isValid(root)) return;
            let voice = cc.instantiate(as);
            root.addChild(voice);
            this._voice = voice.getComponent('Voice');
            this._voice && this._voice.init();
        });
        this.node.on(cc.Node.EventType.TOUCH_START, () => {
            // console.log("cc.Node.EventType.TOUCH_START");
            this._voice && this._voice.on(Date.now());
        });

        this.node.on(cc.Node.EventType.TOUCH_MOVE, () => { });

        this.node.on(cc.Node.EventType.TOUCH_END, () => {
            this._voice && this._voice.end(Date.now())
        });

        this.node.on(cc.Node.EventType.TOUCH_CANCEL, () => {
            this._voice && this._voice.cancel()
        });
    },

});