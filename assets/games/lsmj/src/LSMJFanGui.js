const LSMJModel = require("./LSMJModel")
const CCUtil = require('../../../src/utils/CCUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        aniTileItem: cc.Prefab,
        guiTileItem: cc.Prefab,
        layoutGui: cc.Node,

        mask: cc.Node,
        _aniGuiCom: [],
        _guiCom: [],
    },

    init() {
        this.mask.active = false

        /**展示在桌面上的鬼牌 */
        for (let i = 0; i < 3; i++) {
            let tNode = cc.instantiate(this.guiTileItem)
            tNode.parent = this.layoutGui
            let com = tNode.addComponent("LSMJSingleTile")
            com.init()
            com.setNodeOpacity(0)
            this._guiCom.push(com)
        }
        /**用来展示动画的牌 1张翻的牌 2张鬼牌*/
        for (let i = 0; i < 3; i++) {
            let tNode = cc.instantiate(this.aniTileItem)
            tNode.parent = this.node
            let com = tNode.addComponent("LSMJSingleTile")
            com.init()
            com.setNodeOpacity(0)
            com.node.scale = 2
            this._aniGuiCom.push(com)
        }
    },

    reset() {
        this._guiCom.forEach(com => {
            com.setNodeOpacity(0)
        });
    },

    showLaiZi(cardList, benJin) {
        if (cardList.length == 0) {
            return
        }
        let laizi = cardList.slice()
        laizi.sort()
        if (benJin && !laizi.includes(benJin)) {
            laizi.splice(1, 0, benJin)
        }
        this.mask.active = false
        for (let i = 0; i < this._aniGuiCom.length; i++) {
            const aniCom = this._aniGuiCom[i];
            const guiCom = this._guiCom[i];
            if (aniCom) {
                aniCom.node.stopAllActions()
                aniCom.setNodeOpacity(0)
                aniCom.updateTilePos(cc.v2(0, 0))
                aniCom.setNodeShow(true)
                aniCom.node.scale = 2
            }
            if (guiCom) {
                guiCom.node.stopAllActions()
                guiCom.setNodeOpacity(0)
                guiCom.setNodeShow(true)
                if (laizi[i]) {
                    guiCom.flower = laizi[i]
                    guiCom.setNodeOpacity(255)
                }
            }
        }
    },

    showAni(cardList, benJin) {
        if (!cardList || cardList.length == 0) {
            return
        }
        let laizi = cardList.slice()
        laizi.sort()
        if (benJin && !laizi.includes(benJin)) {
            laizi.splice(1, 0, benJin)
        }
        this.mask.active = false
        let xList = [0]
        if (laizi.length == 2) {
            xList = [-150, 150]
        } else if (laizi.length == 3) {
            xList = [-200, 0, 200]
        }

        for (let i = 0; i < this._aniGuiCom.length; i++) {
            const aniCom = this._aniGuiCom[i];
            const guiCom = this._guiCom[i];
            if (aniCom) {
                aniCom.setNodeOpacity(0)
                aniCom.updateTilePos(cc.v2(xList[i], 0))
                aniCom.setNodeShow(true)
                aniCom.node.scale = 2
            }
            if (guiCom) {
                guiCom.setNodeOpacity(0)
                guiCom.setNodeShow(true)
            }
        }

        for (let i = 0; i < laizi.length; i++) {
            const id = laizi[i];
            let flyEndCom = this._guiCom[i]
            let aniCom = this._aniGuiCom[i]
            if (!flyEndCom || !aniCom) {
                continue
            }
            flyEndCom.flower = id
            flyEndCom.setNodeOpacity(0)
            aniCom.flower = id
            aniCom.setCover(true)
            let flyEndPos = CCUtil.postionConvert(flyEndCom.node, this.node)
            cc.tween(aniCom.node).delay(0.1).to(0.1, {
                scaleX: 0
            }).call(() => {
                aniCom.setCover(false)
            }).to(0.1, {
                scaleX: 2
            }).delay(0.3).to(0.2, {
                position: flyEndPos,
                scale: 0.5,
                opacity: 0
            }).call(() => {
                flyEndCom.setNodeOpacity(255)
            }).start()
        }

    },
});