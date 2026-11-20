const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager')
const UserModel = require('../../../src/model/UserModel');
const Utils = require('../../../src/utils/Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        bureau: cc.Label,
        bureau1: cc.Label,
        listNode: cc.Node,
        cardItem: cc.Prefab,
        playerItem: cc.Prefab,
        restNode: cc.Node,


    },

    start() {
        this.curIndex = 0;
        this.reviewRecord = this.node.nodeParams.reviewRecord || [];
        this.review();
    },

    review() {
        this.bureau1.string = this.curIndex + 1;
        this.bureau.string = `第${this.curIndex + 1}局`;
        let resultData = this.reviewRecord[this.curIndex];
        if (!resultData) return;
        let result = resultData.result || [];
        let undeals = resultData.allLeftCards || [];
        this.listNode.removeAllChildren();
        this.restNode.removeAllChildren();
        for (const user of result) {
            let player = cc.instantiate(this.playerItem);
            this.listNode.addChild(player);
            player.getComponent('GDResultItem') && player.getComponent('GDResultItem').bind(user);
        }
        for (const id of undeals) {
            let card = cc.instantiate(this.cardItem);
            this.restNode.addChild(card);
            card.getComponent('GDCard') && card.getComponent('GDCard').result(id);
        }
    },

    onBtnClick(event, parameters) {
        if (parameters === 'left') {
            this.curIndex--;
            this.curIndex = this.curIndex < 0 ? this.reviewRecord.length - 1 : this.curIndex;
            this.review();
        } else if (parameters === 'right') {
            this.curIndex++;
            this.curIndex = this.curIndex >= this.reviewRecord.length ? 0 : this.curIndex;
            this.review();
        } else if (parameters === 'close') {
            if (this.node.getComponent('DialogWidgetCtrl')) {
                this.node.getComponent('DialogWidgetCtrl').out();
            } else {
                this.node.destroy();
            }
        }
    }
});