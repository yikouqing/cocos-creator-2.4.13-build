const ApiEnsmj = require('./ApiEnsmj');
const UserModel = require('../../../src/model/UserModel');
const ENSMJModel = require('./ENSMJModel');

cc.Class({
    extends: cc.Component,

    properties: {
        node_Show: cc.Node,
        node_Item: cc.Node,
    },

    onLoad() {
        let count = 0;
        this.node_Item.active = false;
        this.node_Show.removeAllChildren();
        let ghostCard = ENSMJModel.getGhostCard();
        let listShow = ENSMJModel.getPilaiCardBegin();
        let callback = this.node.nodeParams.callback;

        let showFanPai = () => {
            let id = listShow[count];
            let judgeCount = () => {
                count += 1;
                if (count >= listShow.length) {
                    this.scheduleOnce(() => {
                        callback && callback();
                        this.node.destroy();
                    }, 0.5);
                } else {
                    showFanPai()
                }
            }
            if (id) {
                let cardNode = cc.instantiate(this.node_Item);
                let cardCtrl = cardNode.addComponent('ENSMJSingleTile');
                let guang = cardNode.getChildByName("guang");
                cardNode.parent = this.node_Show;
                guang.active = false;
                cardCtrl.init();
                cardCtrl.flower = id;
                cardNode.active = true;
                cardCtrl.setCover(true);
                cc.tween(cardNode)
                    .delay(0.1)
                    .set({ scaleX: -1 })
                    .to(0.15, { scaleX: 0 })
                    .call(() => {
                        cardCtrl.setCover(false);
                    })
                    .to(0.15, { scaleX: 1 })
                    .delay(0.1)
                    .call(() => {
                        guang.active = ghostCard == id;
                        judgeCount();
                    })
                    .start();
            } else {
                judgeCount()
            }
        }
        showFanPai();
    }
});