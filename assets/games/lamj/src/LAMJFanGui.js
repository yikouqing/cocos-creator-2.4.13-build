const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const ApiLamj = require('./ApiLamj');
const Utils = require('../../../src/utils/Utils');
const LAMJModel = require("./LAMJModel")
const CCUtil = require('../../../src/utils/CCUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        aniTileItem: cc.Prefab,
        guiTileItem: cc.Prefab,
        layoutGui: cc.Node,
        node_fan: cc.Node,
        node_ding: cc.Node,
        mask: cc.Node,
        _aniGuiCom: [],
        _guiCom: [],
    },

    init() {
        this.mask.active = false
        this.node_fan.active = false
        this.node_ding.active = false
        /**展示在桌面上的鬼牌 */
        for (let i = 0; i < 2; i++) {
            let tNode = cc.instantiate(this.guiTileItem)
            tNode.parent = this.layoutGui
            let com = tNode.addComponent("LAMJSingleTile")
            com.init()
            com.setNodeOpacity(0)
            this._guiCom.push(com)
        }
        /**用来展示动画的牌 1张翻的牌 2张鬼牌*/
        for (let i = 0; i < 3; i++) {
            let tNode = cc.instantiate(this.aniTileItem)
            tNode.parent = this.node
            let com = tNode.addComponent("LAMJSingleTile")
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

    showLaiZi(laizi) {
        if (laizi.length == 0) {
            return
        }
        let laiziType = LAMJModel.getGameRuleByKey("laiZiType")
        if (laiziType == 5) {
            return
        }
        this.mask.active = false
        this.node_fan.active = false
        this.node_ding.active = false
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

    showAni(fan, laizi) {
        if (laizi.length == 0) {
            return
        }
        let laiziType = LAMJModel.getGameRuleByKey("laiZiType")
        if (laiziType == 5) {
            return
        }

        this.mask.active = false
        this.node_fan.active = false
        this.node_ding.active = false
        for (let i = 0; i < this._aniGuiCom.length; i++) {
            const aniCom = this._aniGuiCom[i];
            const guiCom = this._guiCom[i];
            if (aniCom) {
                aniCom.setNodeOpacity(0)
                aniCom.updateTilePos(cc.v2(0, 0))
                aniCom.setNodeShow(true)
                aniCom.node.scale = 2
            }
            if (guiCom) {
                guiCom.setNodeOpacity(0)
                guiCom.setNodeShow(true)
            }
        }
        let flyEndCom = this._guiCom[0]
        let aniCom = this._aniGuiCom[0]
        flyEndCom.flower = laizi[0]
        flyEndCom.setNodeOpacity(0)
        aniCom.flower = laizi[0]
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

    },
});