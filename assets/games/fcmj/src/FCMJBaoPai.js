const CCUtil = require('../../../src/utils/CCUtil');

const initX = [-42, 42]

cc.Class({
    extends: cc.Component,

    properties: {
        tilePfb: cc.Prefab,
        _baoList: [],
    },

    onLoad() {
        for (let i = 0; i < 2; i++) {
            let cardNode = cc.instantiate(this.tilePfb)
            cardNode.parent = this.node
            let com = cardNode.addComponent("FCMJSingleTile")
            com.init()
            com.flower = 0
            com.setNodeShow(false)
            com.updateTilePos(cc.v2(initX[i], 0))
            // com.setGhostIcon(true)
            this._baoList.push(com)
        }
    },

    showBaoPai(arr = [], startNode) {
        let count = arr.length
        for (let i = 0; i < count; i++) {
            let com = this._baoList[i]
            com.flower = arr[i]
            com.node.scale = 1
            com.node.stopAllActions()
            com.updateTilePos(cc.v2(initX[i], 0))
            com.setNodeShow(true)
            com.setGhostIcon(com.flower != 0)
        }
        if (cc.isValid(startNode)) {
            let pos = CCUtil.postionConvert(startNode, this.node)
            let startPos = [pos]
            if (count == 2) {
                startPos = [cc.v2(pos.x - 90, pos.y), cc.v2(pos.x + 90, pos.y)]
            }
            for (let i = 0; i < count; i++) {
                let com = this._baoList[i]
                com.updateTilePos(startPos[i])
                com.node.scale = 3
                cc.tween(com.node).delay(i * 0.05).to(0.1, {
                    scale: 2
                }, {
                    easing: "backOut"
                }).delay(0.3).to(0.3, {
                    position: cc.v2(initX[i], 0),
                    scale: 1
                }).start()
            }
        }
    },

    reset() {
        this._baoList.forEach(com => {
            com.setNodeShow(false)
        });
    },
});