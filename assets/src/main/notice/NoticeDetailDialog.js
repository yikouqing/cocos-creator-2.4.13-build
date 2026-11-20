const AssetsManager = require('../../utils/AssetsManager');

cc.Class({
    extends: cc.Component,

    properties: {
        titleText: cc.Label,
        desText: cc.Label
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start() {
        let data = this.node.nodeParams.data;
        this.titleText.string = data.title;
        this.desText.string = data.content;
    },

    onBtnClk(event, param) {
        switch (param) {
            case 'close':
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
                break;
        }
    },

    // update (dt) {},
});