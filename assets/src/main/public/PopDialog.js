const AssetsManager = require('../../utils/AssetsManager');

cc.Class({
    extends: cc.Component,

    properties: {
        contentLabel: cc.Label,
        okBtn: cc.Node,
        cancelBtn: cc.Node
    },

    start() {
        this.init();
    },

    onBtnClk(event, param) {
        switch (param) {
            case 'ok':
                !!this.node.nodeParams.ok && this.node.nodeParams.ok();
                this.node.destroy();
                break;
            case 'cancel':
                !!this.node.nodeParams.no && this.node.nodeParams.no();
                this.node.destroy();
                break;
        }
    },

    init() {
        this.contentLabel.string = this.node.nodeParams.content || '';
        this.okBtn.active = !!this.node.nodeParams.ok;
        this.cancelBtn.active = !!this.node.nodeParams.no;
    },

});