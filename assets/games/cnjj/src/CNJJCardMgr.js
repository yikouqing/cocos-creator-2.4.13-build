const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const CNJJModel = require("./CNJJModel")
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const ApiCnjj = require('./ApiCnjj');

let CARD_COUNT = 2
let CARD_POSX = [-51, 51]

cc.Class({
    extends: cc.Component,

    properties: {
        cardPfb: cc.Prefab,
        cardLayout: cc.Node,
        cardTypeNode: cc.Node,

        _cardTypeInitX: null,
        /**牌脚本列表 */
        _showCardComList: [],
        /**是否初始化 */
        _isInit: false,
        /**牌抬起来的偏移量 */
        _upY: 30,
        /**位置 */
        _idx: null,
        /**座位号 */
        _chairId: null,
    },

    init(idx) {
        if (this._isInit) {
            return
        }
        this.node.active = true
        this._isInit = true
        this._idx = idx

        this.cardTypeNode.active = false
        this._cardTypeInitX = this.cardTypeNode.x

        for (let i = 0; i < CARD_COUNT; i++) {
            let com = this.getNewCard(i)
            com.updateNodePos(cc.v2(CARD_POSX[i], 0))
            com.setNodeShow(false)
            this._showCardComList.push(com)
        }
    },

    getNewCard(i) {
        let node = cc.instantiate(this.cardPfb)
        node.parent = this.cardLayout
        node.name = i + ""
        let com = node.addComponent('CNJJCard')
        com.init()
        return com
    },

    /**设置座位号 */
    setChairId(cid) {
        this._chairId = cid
    },

    /**重置 */
    reset() {
        for (let i = 0; i < this._showCardComList.length; i++) {
            const com = this._showCardComList[i];
            com.setNodeShow(false)
        }
        this.cardTypeNode.active = false
    },

    /**发牌 */
    sendCards(cardArr, flyStartNode) {
        if (!cardArr || cardArr.length == 0) {
            return
        }
        for (let i = 0; i < this._showCardComList.length; i++) {
            const com = this._showCardComList[i];
            com.flower = cardArr[i]
            com.setNodeShow(true)
            com.setCover(true)
            com.setNodeScale(1)
        }
        /**发牌动画 */
        if (flyStartNode) {
            let startPos = CCUtil.postionConvert(flyStartNode, this.cardLayout)
            for (let i = 0; i < this._showCardComList.length; i++) {
                const com = this._showCardComList[i];
                com.updateNodePos(startPos)
                com.setNodeScale(0.1)
                let endPos = cc.v3(CARD_POSX[i], 0, 0)
                cc.tween(com.node).delay(0.05 * i).call(() => {
                    AssetsManager.playEffect({
                        path: 'audio/common/foldpai'
                    });
                }).to(0.1, {
                    position: endPos,
                    scale: 1
                }).start()
            }
        }
    },

    /**展示牌 */
    showCard(data, isAni) {
        let cardArr = data.cardsList
        if (cardArr.length != this._showCardComList.length) {
            return
        }
        for (let i = 0; i < this._showCardComList.length; i++) {
            const com = this._showCardComList[i];
            com.flower = cardArr[i]
            com.setNodeShow(true)
            if (isAni) {
                cc.tween(com.node).delay(0.05 * i).to(0.1, {
                    scaleX: 0
                }).call(() => {
                    com.setCover(false)
                    AssetsManager.playEffect({
                        path: "res/audio/sound-fanpai",
                        bundle: Enums.bundleType.CNJJ
                    });
                }).to(0.1, {
                    scaleX: 1
                }).call(() => {
                    if (i == this._showCardComList.length - 1) {
                        this.showCardType(data, isAni)
                    }
                }).start()
            }
        }
        if (!isAni) {
            this.showCardType(data)
        }
    },

    /**展示牌型 */
    showCardType(data, isAni = false) {
        let type = ""
        let ctype = data.cardsType
        if (ctype.type == ApiCnjj.cardType.DANZHANG) {
            type = ctype.type + "_" + ctype.point
        } else if (ctype.type == ApiCnjj.cardType.DUIZI) {
            type = "2"
        }

        let cartTypeScale = 1
        let tNode = this.cardTypeNode
        let initX = this._cardTypeInitX
        tNode.stopAllActions()
        tNode.x = initX
        tNode.scale = cartTypeScale
        tNode.active = true
        let url = "res/sprite/cardType/" + type
        AssetsManager.loadSpriteFrame({
            path: url,
            sprite: tNode.getComponent(cc.Sprite),
            bundle: Enums.bundleType.CNJJ
        })
        if (isAni) {
            tNode.scale = 0
            let offSetX = -200

            tNode.x = initX + offSetX
            cc.tween(tNode).to(0.2, {
                x: initX,
                scale: cartTypeScale
            }, {
                easing: "backOut"
            }).start()

            let sex = CNJJModel.getUserSexByUid(data.uid) == 0 ? "man" : "woman"
            let audioUrl = "res/audio/" + sex + "/" + type
            AssetsManager.playEffect({
                path: audioUrl,
                bundle: Enums.bundleType.CNJJ
            });
        }
    },
});