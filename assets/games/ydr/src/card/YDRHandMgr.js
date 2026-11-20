const ApiRoom = require('../../../../src/api/ApiRoom');
const Enums = require('../../../../src/const/Enums');
const ApiYdr = require('../ApiYdr');
const CCUtil = require('../../../../src/utils/CCUtil');
const AssetsManager = require('../../../../src/utils/AssetsManager');

cc.Class({
    extends: cc.Component,

    properties: {
        handPfb: cc.Prefab,
        /**本地位置号 */
        _idx: null,
        /**手牌脚本列表 */
        _cardComList: null,
        /**手牌数据 */
        _cardInfo: null,
        /**动画牌列表 */
        _aniNodeList: [],
    },

    onDestroy() {
        cc.systemEvent.off("discard", this.onDiscard, this)
    },

    /**初始化 */
    init(idx = null) {
        if (idx == null) {
            return
        }
        if (this._idx == null) {
            this._idx = idx;
        } else {
            /**只能初始化一次 */
            return
        }
        if (this._idx == 0) {
            cc.systemEvent.on("discard", this.onDiscard, this);
            this._outAni = this.node.parent.getChildByName("outAni")
            this._outAni.active = false
            let line = this._outAni.getChildByName("line")
            cc.tween(line).to(1, {
                opacity: 0
            }).to(1, {
                opacity: 255
            }).union().repeatForever().start()
        }

        this._moCardPfb = this.node.parent.getChildByName("moCard") //摸牌动画的牌
        this._moCardShow = this.node.parent.getChildByName("show0") //摸牌的初始节点
        this._showNode = this.node.parent.getChildByName("show" + this._idx) //展示动画的节点
        this._cardLay = this.node.getChildByName("cardLay")
        this._cardLay.removeAllChildren()
        /**初始化手牌 10排5张*/
        this._cardComList = []
        let groupPfb = this.node.getChildByName("group")
        for (let i = 0; i < 10; i++) {
            let group = cc.instantiate(groupPfb)
            group.parent = this._cardLay
            group.y = 0
            group.name = i + ""
            this._cardComList[i] = []
            for (let j = 0; j < 5; j++) {
                let card = cc.instantiate(this.handPfb)
                card.parent = group
                card.x = 0
                let com = card.addComponent('YDRCard')
                com.init()
                com.setNodeShow(false)
                if (this._idx == 0) {
                    com.setTouchListener()
                }
                this._cardComList[i].push(com)
            }
        }
    },

    /**
     * 刷新手牌
     * @param {Array} cardArr 手牌列表
     * @param {boolean} isAni 是否播放发牌动画
     */
    updateHandCards(cardArr, isAni = false) {
        this.node.active = true
        this._cardInfo = cardArr
        for (let i = 0; i < this._cardComList.length; i++) {
            const info = cardArr[i];
            let comList = this._cardComList[i]
            let lay = comList[0].node.parent
            lay.y = 0
            if (info) {
                let cardList = info.cardList
                for (let j = 0; j < comList.length; j++) {
                    const com = comList[j];
                    let id = cardList[j]
                    if (id) {
                        com.flower = id
                        com.setNodeShow(true)
                        com.setMask(info.isShaUp)
                    } else {
                        com.setNodeShow(false)
                    }
                }
                lay.active = true
            } else {
                lay.active = false
            }
        }

        if (isAni && this._idx == 0) {
            for (let i = 0; i < this._cardComList.length; i++) {
                let comList = this._cardComList[i]
                let lay = comList[0].node.parent
                lay.y = -500
                cc.tween(lay).delay(0.05 * i).call(() => {
                    AssetsManager.playEffect({
                        path: "res/audio/common/fapai",
                        bundle: Enums.bundleType.YDR
                    });
                }).to(0.2, {
                    y: 0
                }).start()
            }
        }
    },

    /**设置轮到自己操作 */
    setIsMyTurn(isTurn) {
        // console.log("轮到自己出牌==", isTurn, this._idx)
        if (this._idx == 0) {
            let cardArr = this._cardInfo
            for (let i = 0; i < this._cardComList.length; i++) {
                const info = cardArr[i];
                let comList = this._cardComList[i]
                let lay = comList[0].node.parent
                if (info && lay.active) {
                    let cardList = info.cardList
                    for (let j = 0; j < comList.length; j++) {
                        const com = comList[j];
                        let id = cardList[j]
                        com.isTouch = isTurn && !info.isShaUp && com.flower == id
                    }
                }
            }
            this._outAni.active = isTurn
        }
    },

    /**设置扣牌 */
    setKouPai() {
        this._cardComList.forEach(arr => {
            arr.forEach(t => {
                if (t.node.parent.active) {
                    t.setMask(true)
                    t.isTouch = false
                }
            });
        });
    },

    /**摸牌 */
    showMoPaiAni(cardId) {
        // this.delMoCard()
        let cardNode = cc.instantiate(this._moCardPfb)
        cardNode.parent = this.node.parent
        cardNode.setPosition(this._moCardShow.getPosition())
        cardNode.angle = -90
        cardNode.name = "showMoPai" + cardId
        this._aniNodeList.push(cardNode)
        let com = cardNode.addComponent('YDRCard')
        com.init()
        com.flower = cardId
        com.setCover(true)
        com.setNodeShow(true)
        com.setSelfLight(this._idx == 0)
        cardNode.scale = 0
        cc.tween(cardNode).to(0.05, {
            scale: 1.3
        }).to(0.1, {
            scale: 1.1
        }).delay(0.1).call(() => {
            if (cardId) {
                com.setCover(false)
            }
        }).to(0.3, {
            angle: 0,
            position: this._showNode.getPosition(),
            scale: 1
        }).start()
    },

    /**展示飞到牌堆 */
    showFlyToPaiDui(cardId) {
        let node = this.node.parent.getChildByName("showMoPai" + cardId)
        // console.log("展示飞到牌堆==", node.x, node.y)
        if (cc.isValid(node)) {
            if (cardId == 100) { //财神直接飞到头像

            }
            let lastMoCom = null
            for (let i = 0; i < this._cardComList.length; i++) {
                const list = this._cardComList[i];
                lastMoCom = list.find(info => info.flower == cardId)
                if (lastMoCom) {
                    break;
                }
            }
            if (lastMoCom && this._idx == 0) {
                let lay = lastMoCom.node.parent.getComponent(cc.Layout)
                lay.updateLayout()
                lastMoCom.setNodeOpacity(0)
                let endPos = CCUtil.postionConvert(lastMoCom.node, this.node.parent)
                // node.stopAllActions()
                cc.tween(node).delay(0.8).to(0.2, {
                    position: endPos,
                    opacity: 0,
                }).removeSelf().start()
                lastMoCom.node.stopAllActions()
                cc.tween(lastMoCom.node).delay(1).to(0.1, {
                    opacity: 255
                }).start()
            } else {
                let endPos = this.node.parent.getChildByName("opt" + this._idx).getPosition()
                // node.stopAllActions()
                cc.tween(node).delay(0.8).to(0.2, {
                    position: endPos,
                    opacity: 0,
                }).removeSelf().start()
            }
        }
    },

    /**展示胡牌 */
    showHuPai(cardId) {
        let node = this.node.parent.getChildByName("showMoPai" + cardId)
        if (!cc.isValid(node)) {
            node = this.node.parent.getChildByName("showDisCard" + cardId)
        }
        if (cc.isValid(node)) {
            let endPos = this._showNode.getPosition()
            let com = node.getComponent('YDRCard')
            com && com.setSelfLight(this._idx == 0)
            node.stopAllActions()

            let action = cc.scaleTo(0.3, 1);
            action.easing(cc.easeIn(3));
            cc.tween(node).to(0.1, {
                position: endPos,
                scale: 3,
                angle: 0
            }).then(action).start()
        }
    },

    /**删掉展示牌 */
    delMoCard() {
        this._aniNodeList.forEach(disCard => {
            if (cc.isValid(disCard)) {
                disCard.destroy()
            }
        });
        this._aniNodeList.length = 0
    },

    /**出牌 */
    onDiscard(com) {
        // console.log("出牌===", com.flower)
        ApiRoom.gameMessageNotify(ApiYdr.gameOperateNotify(ApiYdr.operateType.QI, com.flower, []));
    },

    reset() {
        this.node.active = false;
        this._cardComList.forEach(arr => {
            arr.forEach(t => {
                t.node.parent.active = false;
                t.setNodeShow(false);
                t.setMask(false)
                t.isTouch = false
            });
        });
        this._cardInfo = null
        this.delMoCard()
    },

});