const AssetsManager = require('../../../utils/AssetsManager')
const Enums = require('../../../const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {},

    start() {
        this.gameType = Enums.bundleType.PDK;
        this.callback = this.node.nodeParams.cb;
    },

    onGameTypeClick(event, param) {
        if (param === 'PDK') {
            this.gameType = Enums.bundleType.PDK;
        } else if (param === 'NN') {
            this.gameType = Enums.bundleType.NN;
        } else if (param === 'SG') {
            this.gameType = Enums.bundleType.SG;
        } else if (param === 'SZ') {
            this.gameType = Enums.bundleType.SZ;
        } else if (param === 'GCT') {
            this.gameType = Enums.bundleType.GCT;
        }
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
            case 'createRoom':
                let gameRule = {
                    maxPlayerCount: 6,
                    bureau: 8
                };
                this.callback(this.gameType, gameRule);
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
                break;
        }
    }
});