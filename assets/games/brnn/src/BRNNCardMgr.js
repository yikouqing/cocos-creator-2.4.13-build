const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const BRNNModel = require("./BRNNModel")
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const ApiBrnn = require('./ApiBrnn');

let CARD_COUNT = 5
let CARD_POSX = [-124, -62, 0, 62, 124]

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
        _data: null
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
            com.setNodeOpacity(0)
            com.updateNodePos(cc.v2(CARD_POSX[i], 0))
            this._showCardComList.push(com)
        }
    },

    getNewCard(i) {
        let node = cc.instantiate(this.cardPfb)
        node.parent = this.cardLayout
        node.name = i + ""
        let com = node.addComponent('BRNNCard')
        com.init()
        com.setNodeShow(true)
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
            com.setNodeOpacity(0)
        }
        this.cardTypeNode.active = false
    },

    /**发牌 */
    sendCards(data, flyStartNode) {
        this._data = data
        let cardArr = data.cards
        if (cardArr.length != this._showCardComList.length) {
            return
        }
        for (let i = 0; i < this._showCardComList.length; i++) {
            const com = this._showCardComList[i];
            com.flower = cardArr[i]
            com.setCover(true)
            com.setNodeOpacity(255)
        }
        /**发牌动画 */
        if (flyStartNode) {
            let startPos = CCUtil.postionConvert(flyStartNode, this.cardLayout)
            for (let i = 0; i < this._showCardComList.length; i++) {
                const com = this._showCardComList[i];
                com.updateNodePos(startPos)
                com.setNodeScale(0.1)
                let endPos = cc.v3(CARD_POSX[i], 0, 0)
                cc.tween(com.node).delay(0.05 * i).to(0.1, {
                    position: endPos,
                    scale: 1
                }).start()
            }
        }
    },

    /**展示牌 */
    showCard(data, isAni) {
        let cardArr = data.cards
        if (cardArr.length != this._showCardComList.length) {
            return
        }
        for (let i = 0; i < this._showCardComList.length; i++) {
            const com = this._showCardComList[i];
            com.flower = cardArr[i]
            if (isAni) {
                cc.tween(com.node).delay(0.05 * i).to(0.1, {
                    scaleX: 0
                }).call(() => {
                    com.setCover(false)
                    AssetsManager.playEffect({
                        path: "res/audio/sound-fanpai",
                        bundle: Enums.bundleType.BRNN
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
    },

    /**展示牌型 */
    showCardType(data, isAni = false) {
        let type = 0
        if (data.type == ApiBrnn.cardType.YOUNIU) {
            type = data.point
        } else if (data.type >= ApiBrnn.cardType.NIUNIU) {
            type = data.type + 100
        }
        let cartTypeScale = 1
        let cardType = this.cardTypeNode
        let initX = this._cardTypeInitX
        cardType.stopAllActions()
        cardType.x = initX
        cardType.scale = cartTypeScale
        cardType.active = true
        let url = "res/sprite/cardType/t_" + type
        AssetsManager.loadSpriteFrame({
            path: url,
            sprite: cardType.getComponent(cc.Sprite),
            bundle: Enums.bundleType.BRNN
        })
        if (isAni) {
            cardType.scale = 0
            let offSetX = -200

            cardType.x = initX + offSetX
            cc.tween(cardType).to(0.2, {
                x: initX,
                scale: cartTypeScale
            }, {
                easing: "backOut"
            }).start()

            let audioUrl = "res/audio/nv/f0_nn" + type
            AssetsManager.playEffect({
                path: audioUrl,
                bundle: Enums.bundleType.BRNN
            });
        }
    },
});