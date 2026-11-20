const GDTDHModel = require('./GDTDHModel');

cc.Class({
    extends: cc.Component,

    properties: {
        tilePfb: cc.Prefab,
        layout: cc.Node,
    },

    reset() {
        this.node.active = false;
        this.unscheduleAllCallbacks();
        this.layout.removeAllChildren()
    },

    showMaPai(result = null) {
        // console.log("展示马牌===", result)
        if (!result) {
            this.node.active = false
            return
        }
        this.node.active = true;
        this.unscheduleAllCallbacks();
        this.layout.removeAllChildren()

        let cards = result.maCards.slice();
        let myMaCards = result.zhongMaList

        let nodeArray = [];
        for (let i = 0; i < cards.length; ++i) {
            let node = cc.instantiate(this.tilePfb);
            let com = node.addComponent('GDTDHSingleTile')
            com.init()
            com.setCover(true)
            com.setNodeShow(true)
            node.parent = this.layout;
            node.y = 0
            node.active = true;
            nodeArray.push(com);
        }
        this.schedule(() => {
            if (nodeArray.length > 0) {
                let tileCom = nodeArray.shift();
                let card = cards.shift();
                tileCom.flower = card
                tileCom.setCover(false)
                tileCom.setGhostIcon(false)
                if (myMaCards.includes(card)) {
                    tileCom.node.runAction(cc.sequence([
                        cc.scaleTo(0.05, 1.3),
                        cc.scaleTo(0.05, 1),
                        cc.callFunc(() => {
                            cc.find('win', tileCom.node).active = true;
                        })
                    ]));
                }
            }
        }, 0.2, cards.length);
        let dt = 0.5 + nodeArray.length * 0.2
        this.scheduleOnce(() => {
            this.node.active = false;
        }, dt);
        return dt
    },
});