const AssetsManager = require('../../utils/AssetsManager');
const ClickManager = require('../../utils/ClickManager');

cc.Class({
    extends: cc.Component,

    properties: {
        audioEnable: true,
        audioType: 0,
        _lastTick: 0,
    },

    start() {
        this.node.on(cc.Node.EventType.TOUCH_START, this._onClick, this)
    },

    _onClick(event) {
        let button = this.node.getComponent(cc.Button);
        let toggle = this.node.getComponent(cc.Toggle);
        if ((!!button && !button.interactable) || (!!toggle && !toggle.interactable)) return;
        if (Date.now() - this._lastTick < 200) return;
        this._lastTick = Date.now();
        if (!this.audioEnable) return;
        let touchPos = event.getLocation();
        ClickManager.addClick(touchPos);
        AssetsManager.onClick(this.audioType);
    },

    onDestroy() {
        this.node.off(cc.Node.EventType.TOUCH_START, this._onClick, this)
    },

});