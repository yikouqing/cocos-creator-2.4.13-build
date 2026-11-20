const ApiYdr = require('../ApiYdr');
const Enums = require('../../../../src/const/Enums');
const CCUtil = require('../../../../src/utils/CCUtil');

let LAY_COUNT = {
    [3]: 0,
    [4]: -43.3,
    [5]: -65,
}

cc.Class({
    extends: cc.Component,

    properties: {
        optPfb: cc.Prefab,
        /**本地位置号 */
        _idx: null,
        /**手牌脚本列表 */
        _cardComList: null,
    },

    /**初始化*/
    init(idx) {
        if (this._idx == null) {
            this._idx = idx;
        } else {
            return;
        }
        this._moCardPfb = this.node.parent.getChildByName("moCard")
        this._showStartPos = this.node.parent.getChildByName("show0").getPosition() //操作动画开始的节点
        this._cardLay = this.node.getChildByName("cardLay")
        this._cardLay.removeAllChildren()
        /**初始化操作牌 9排5张*/
        this._cardComList = []
        let groupPfb = this.node.getChildByName("group")
        for (let i = 0; i < 9; i++) {
            let group = cc.instantiate(groupPfb)
            group.parent = this._cardLay
            group.y = 0
            group.name = i + ""
            this._cardComList[i] = []
            for (let j = 0; j < 5; j++) {
                let card = cc.instantiate(this.optPfb)
                card.parent = group
                card.x = 0
                let com = card.addComponent('YDRCard')
                com.init()
                com.setNodeShow(false)
                this._cardComList[i].push(com)
            }
        }
        this.node.active = false;
    },

    /**更新操作手牌 */
    updateOptCards(cardArr) {
        this.node.active = true
        this._lastIdx = -1
        for (let i = 0; i < this._cardComList.length; i++) {
            const comGroup = this._cardComList[i];
            let arr = cardArr[i]
            if (arr && Array.isArray(arr) && arr.length > 0) {
                comGroup[0].node.parent.active = true
                for (let j = 0; j < comGroup.length; j++) {
                    const com = comGroup[j];
                    let cardId = arr[j]
                    if (cardId) {
                        com.flower = cardId
                        com.setNodeShow(true)
                    } else {
                        com.setNodeShow(false)
                    }
                }
                this._lastIdx = i
                comGroup[0].node.parent.getComponent(cc.Layout).spacingY = LAY_COUNT[arr.length]
            } else {
                comGroup[0].node.parent.active = false
            }
        }
    },

    /**展示操作牌动画 */
    showOptAni() {
        if (this._lastIdx >= 0) {
            let comGroup = this._cardComList[this._lastIdx]
            let groupNode = comGroup[0].node.parent
            groupNode.opacity = 0
            groupNode.getComponent(cc.Layout).updateLayout()
            let suby = 55
            for (let i = 0; i < comGroup.length; i++) {
                const optCom = comGroup[i];
                if (optCom.node.active) {
                    // this.scheduleOnce(()=>{},0.1)
                    let endPos = CCUtil.postionConvert(optCom.node, this.node.parent)
                    let node = cc.instantiate(this._moCardPfb)
                    node.parent = this.node.parent
                    node.active = true
                    node.angle = 0
                    node.scale = 0
                    node.setPosition(this._showStartPos)
                    node.y -= (suby * i)
                    // console.log("操作动画节点start==", node.x, node.y, node.active)
                    // console.log("操作动画节点end==", endPos.y)
                    let com = node.addComponent('YDRCard')
                    com.init()
                    com.flower = optCom.flower
                    com.setNodeShow(true)
                    cc.tween(node).to(0.05, {
                        scale: 1.3
                    }).to(0.1, {
                        scale: 1
                    }).delay(0.5 + (0.05 * i)).to(0.3, {
                        position: endPos,
                        angle: -90,
                        scale: 0,
                    }).removeSelf().start()
                }
            }
            cc.tween(groupNode).delay(1).to(0.1, {
                opacity: 255
            }).start()
            this._lastIdx = -1
        }
    },

    /**设置牌变灰 */
    setTileGary(tileId = -1) {
        this._cardComList.forEach(tlist => {
            tlist.forEach(t => {
                if (t.node.parent.active && t.node.active) {
                    t.setGray(t.flower === tileId);
                }
            })
        })
    },

    reset() {
        this.node.active = false;
        this._cardComList.forEach(arr => {
            arr.forEach(t => {
                t.node.parent.active = false;
                t.setNodeShow(false);
            });
        });
    },
});