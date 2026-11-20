cc.Class({
    extends: cc.Component,

    properties: {
        tilePfb: cc.Prefab,
        layout: cc.Node,
    },


    showMaPai(result = null) {
        if (!result) {
            this.node.active = false
            return
        }

        this.layout.removeAllChildren()
        this.unscheduleAllCallbacks();

        let cards = result.myMaCards.slice();
        let nodeArray = [];
        for (let i = 0; i < cards.length; ++i) {
            let node = cc.instantiate(this.tilePfb);
            let com = node.addComponent('HZSingleTile')
            com.init()
            com.setCover(true)
            com.setNodeShow(true)
            node.parent = this.layout;
            node.y = 0
            node.active = true;
            nodeArray.push(com);
        }
        if (nodeArray.length == 0) {
            this.node.active = false
            return
        }
        this.node.active = true;
        this.schedule(() => {
            if (nodeArray.length > 0) {
                let tileCom = nodeArray.shift();
                let card = cards.shift();
                tileCom.flower = card.card
                tileCom.setCover(false)
                if (card.win) {
                    tileCom.node.runAction(cc.sequence([
                        cc.scaleTo(0.05, 1.3),
                        cc.scaleTo(0.05, 1.1),
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
    },

});