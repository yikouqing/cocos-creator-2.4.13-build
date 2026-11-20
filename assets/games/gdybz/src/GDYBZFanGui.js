const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const ApiGdybz = require('./ApiGdybz');
const Utils = require('../../../src/utils/Utils');
const GDYBZModel = require("./GDYBZModel")
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
            let com = tNode.addComponent("GDYBZSingleTile")
            com.init()
            com.setNodeOpacity(0)
            this._guiCom.push(com)
        }
        /**用来展示动画的牌 1张翻的牌 2张鬼牌*/
        for (let i = 0; i < 3; i++) {
            let tNode = cc.instantiate(this.aniTileItem)
            tNode.parent = this.node
            let com = tNode.addComponent("GDYBZSingleTile")
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
        let laiziType = GDYBZModel.getGameRuleByKey("laiZiType")
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
        let laiziType = GDYBZModel.getGameRuleByKey("laiZiType")
        if (laiziType == 5) {
            return
        }
        this.node_ding.active = false
        this.node_fan.active = false
        this.mask.active = false
        if (laiziType == ApiGdybz.laiZiType.FAN || laiziType == ApiGdybz.laiZiType.SHUANG) { //翻鬼和翻双鬼
            this.mask.active = true
            let endX = [190, 410]
            let dt = 0.8
            if (laizi.length == 1) {
                endX = [this.node_ding.x]
                dt = 0.4
            }
            //最后一张是翻的牌
            for (let i = 0; i < this._aniGuiCom.length; i++) {
                const com = this._aniGuiCom[i];
                com.updateTilePos(cc.v2(this.node_fan.x, 0))
                com.setNodeOpacity(255)
                com.setNodeShow(true)
                com.node.scale = 2
                if (laizi[i]) {
                    com.flower = laizi[i]
                    let flyCom = this._guiCom[i]
                    flyCom.flower = laizi[i]
                    flyCom.setNodeOpacity(0)
                    let flyEndPos = CCUtil.postionConvert(flyCom.node, this.node)
                    com.setNodeOpacity(0)

                    if (i == 0) {
                        cc.tween(com.node).delay(0.3).call(() => {
                            com.setNodeOpacity(255)
                        }).to(0.3, {
                            x: endX[0]
                        }).call(() => {
                            this.node_ding.active = true
                        }).delay(dt).call(() => {
                            this.mask.active = false
                            this.node_ding.active = false
                            this.node_fan.active = false
                        }).to(0.3, {
                            position: flyEndPos,
                            scale: 0.5,
                            opacity: 0
                        }).call(() => {
                            flyCom.setNodeOpacity(255)
                        }).start()
                    } else if (i == 1) {
                        cc.tween(com.node).delay(0.3).call(() => {
                            com.setNodeOpacity(255)
                        }).to(0.3, {
                            x: endX[0]
                        }).delay(0.02).to(0.2, {
                            x: endX[1]
                        }).delay(dt - 0.3).to(0.3, {
                            position: flyEndPos,
                            scale: 0.5,
                            opacity: 0
                        }).call(() => {
                            flyCom.setNodeOpacity(255)
                        }).start().start()
                    }
                } else {
                    com.flower = fan
                    com.setCover(true)
                    this.node_fan.active = true
                    cc.tween(com.node).delay(0.1).to(0.1, {
                        scaleX: 0
                    }).call(() => {
                        com.setCover(false)
                    }).to(0.1, {
                        scaleX: 2
                    }).delay(0.6 + dt - 0.3).call(() => {
                        com.setNodeOpacity(0)
                    }).start()
                    break;
                }
            }
        } else if (laiziType == ApiGdybz.laiZiType.BAI || laiziType == ApiGdybz.laiZiType.ZHONG) { //普通鬼
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
        }
    },
});