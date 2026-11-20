const CCUtil = require('../../../../src/utils/CCUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        outPfb: cc.Prefab,
        moCardPfb: cc.Prefab,
        /**手牌脚本列表 */
        _outCardComList: null,
        /**动画牌列表 */
        _aniNodeList: [],
    },

    init(idx) {
        if (this._idx == null) {
            this._idx = idx;
        } else {
            return;
        }
        this._outCardComList = [];
        this._showNode = this.node.parent.getChildByName("show" + this._idx) //展示动画的节点
        this.node.removeAllChildren()
    },

    getNewCard(id) {
        let node = cc.instantiate(this.outPfb);
        node.parent = this.node
        let com = node.addComponent('LSEQSCard')
        com.init()
        com.flower = id;
        return com;
    },

    /**刷新出牌列表 */
    updateOutCard(cardArr = [], isReview) {
        // console.log("刷新了出牌列表", cardArr)
        this._lastIdx = -1
        if (isReview && cardArr.length < this._outCardComList.length) { //兼容回放往前调的时候刷新
            this.reset()
        }
        for (let i = 0; i < cardArr.length; i++) {
            const cardId = cardArr[i];
            let com = this._outCardComList[i]
            if (!com) {
                com = this.getNewCard(cardId)
                this._outCardComList.push(com)
            }
            com.flower = cardId
            com.setNodeShow(true)
            this._lastIdx = i
            // console.log("设置了last==", this._lastIdx)
        }
    },

    /**展示出的牌 */
    showDisCard(cardId) {
        this.delDisCard()
        let cardNode = cc.instantiate(this.moCardPfb)
        cardNode.parent = this.node.parent
        cardNode.setPosition(this._showNode.getPosition())
        cardNode.angle = 0
        cardNode.name = "showDisCard" + cardId
        this._aniNodeList.push(cardNode)
        let com = cardNode.addComponent('LSEQSCard')
        com.init()
        com.setNodeShow(true)
        com.flower = cardId
        com.setSelfLight(this._idx == 0)
        cardNode.scale = 0
        cc.tween(cardNode).to(0.05, {
            scale: 1.2
        }).to(0.1, {
            scale: 1
        }).start()
    },

    showDiuAni(cardId) {
        let node = this.node.parent.getChildByName("showMoPai" + cardId)
        if (!cc.isValid(node)) {
            node = this.node.parent.getChildByName("showDisCard" + cardId)
        }
        if (cc.isValid(node)) {
            // console.log("展示丢牌动画==", this._lastIdx)
            let lastCom = this._outCardComList[this._lastIdx]
            let lay = this.node.getComponent(cc.Layout)
            lay.updateLayout()
            lastCom.setNodeOpacity(0)
            let endPos = CCUtil.postionConvert(lastCom.node, this.node.parent)
            node.stopAllActions()
            cc.tween(node).to(0.2, {
                position: endPos,
                scale: 0.4,
                angle: -90
            }).removeSelf().start()
            lastCom.node.stopAllActions()
            cc.tween(lastCom.node).delay(0.2).to(0.1, {
                opacity: 255
            }).start()
        }
    },

    /**删掉展示牌 */
    delDisCard() {
        this._aniNodeList.forEach(disCard => {
            if (cc.isValid(disCard)) {
                disCard.destroy()
            }
        });
        this._aniNodeList.length = 0
    },

    reset() {
        this._outCardComList.forEach(com => {
            com.setNodeShow(false)
        })
        this.delDisCard()
    },
});