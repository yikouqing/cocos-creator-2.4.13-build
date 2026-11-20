const gameLogic = require('./LSPDKGameLogic');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const LSPDKModel = require("./LSPDKModel")
const CCUtil = require('../../../src/utils/CCUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        cardPfb: cc.Prefab,
        /**牌容器 */
        _cardLayout: null,
        /**手牌脚本列表 */
        _cardComList: [],
        /**是否初始化 */
        _isInit: false,
        /**是否禁止点击 */
        _isNoTouch: false,
        /**牌抬起来的偏移量 */
        _upY: 30,
        /**位置 */
        _idx: null,
        /**是否添加过监听 */
        _isAddListener: false,
        /**播放动画的节点 */
        _aniNode: null,
        /**提示标记 */
        _tipIndex: 0,
        /**提示数据 */
        _tipData: [],
    },

    onLoad() { },

    init(idx) {
        if (this._isInit) return;
        this._isInit = true;
        this._idx = idx;
        this._cardLayout = cc.find("layout", this.node);
        this._aniNode = cc.find("aniNode", this.node);
        if (idx == 0 && this.node.name == "handCard0") {
            this._cardLayout.scale = CCUtil.getHandCardScale(13)
            this.scheduleOnce(() => {
                let wcom = this._cardLayout.getComponent(cc.Widget)
                if (wcom) wcom.updateAlignment();
            }, 0.1)
        }
        this._initLayoutScale = this._cardLayout.scale;
        for (let i = 0; i < 16; i++) {
            let node = cc.instantiate(this.cardPfb)
            if (cc.isValid(node)) {
                node.y = 0
                node.parent = this._cardLayout
                node.name = i + ""
                let com = node.addComponent('LSPDKCard')
                com.setNodeShow(false)
                this._cardComList.push(com)
            }
        }

    },

    /**添加点击事件 */
    addTouchEvent() {
        if (this._idx == 0 && !this._isAddListener) {
            this._isAddListener = true
            this._cardLayout.on(cc.Node.EventType.TOUCH_START, this.touchStart, this);
            this._cardLayout.on(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
            this._cardLayout.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
            this._cardLayout.on(cc.Node.EventType.TOUCH_CANCEL, this.touchEnd, this);
        }
    },

    /**重置 */
    reset() {
        this._cardComList.forEach(com => {
            this.cardUpOrDown(com, 2)
            com.setNodeShow(false)
            com.setMust(false)
        });
        this.setTipData(null)
    },

    /**点击响应 */
    touchStart(event) {
        if (this._isNoTouch) return
        let touchStartPos = this._cardLayout.convertToNodeSpaceAR(event.touch.getLocation());
        this.touchStartCardIndex = this.getTouchPosIndex(touchStartPos);
    },

    touchMove(event) {
        if (this._isNoTouch) return
        let curPos = this._cardLayout.convertToNodeSpaceAR(event.touch.getLocation());
        let index = this.getTouchPosIndex(curPos);
        for (let i = 0; i < this._cardComList.length; ++i) {
            let com = this._cardComList[i];
            com.setGray((i >= this.touchStartCardIndex && i <= index) || (i >= index && i <= this.touchStartCardIndex))
        }
    },

    touchEnd(event) {
        if (this._isNoTouch) return
        let curPos = this._cardLayout.convertToNodeSpaceAR(event.touch.getLocation());
        let index = this.getTouchPosIndex(curPos);
        let count = 0; //计算抬起来的牌数量
        for (let i = 0; i < this._cardComList.length; ++i) {
            let com = this._cardComList[i];
            if ((i >= this.touchStartCardIndex && i <= index) || (i >= index && i <= this.touchStartCardIndex)) {
                this.cardUpOrDown(com)
                if (com.node.y == this._upY) {
                    count++;
                }
            }
        }
        AssetsManager.playEffect({
            path: "res/audio/main/sound_select_card",
            bundle: Enums.bundleType.LSPDK
        });
        /**选择的牌进行自动筛选 */
        if (count > 3) {
            let seletArr = this.getAllUpCardId()
            let tipData = gameLogic.searchOutCard(seletArr)
            if (tipData.length > 0) {
                /**选出长度最长的牌型 */
                let maxLen = 0
                let cardList = []
                for (let i = 0; i < tipData.length; i++) {
                    let info = tipData[i]
                    if (info.cardList.length > maxLen) {
                        maxLen = info.cardList.length
                        cardList = info.cardList
                    }
                }
                if (cardList.length > 3) {
                    this.setCardUp(cardList)
                }
            }
        }
    },

    getTouchPosIndex(pos) {
        if (this._cardComList.length > 0) {
            // let lastNode = this._cardComList[this._cardComList.length - 1].node;
            let lastNode = null
            for (let i = this._cardComList.length - 1; i >= 0; i--) {
                lastNode = this._cardComList[i].node
                if (lastNode.active) {
                    break;
                }
            }
            let curLength = parseInt(lastNode.name) + 1
            if (pos.x >= lastNode.x - lastNode.width / 2) {
                return curLength - 1;
            } else {
                let layout = this._cardLayout.getComponent(cc.Layout)
                let len = lastNode.x - lastNode.width / 2 - pos.x;
                let offset = lastNode.width + layout.spacingX;
                let index = curLength - Math.floor(len / offset) - 2;
                if (index < 0) index = 0;
                return index;
            }
        }
    },

    /**
     * 单个牌被抬起或者放下
     * @param {LSPDKCard} com 牌脚本
     * @param {number} type 1 抬起  2放下
     */
    cardUpOrDown(com, type = 0) {
        let y = com.node.y == this._upY ? 0 : this._upY
        if (type == 1) {
            y = this._upY
        } else if (type == 2) {
            y = 0
        }
        com.setGray(false)
        com.updateNodePos(cc.v2(com.node.x, y))
    },

    /**
     * 获取所有抬起的牌id
     * @returns [number]
     */
    getAllUpCardId() {
        let cardIdList = []
        this._cardComList.forEach(com => {
            if (com.node.active && com.node.y >= this._upY) {
                cardIdList.push(com.flower)
            }
        });
        return cardIdList
    },

    /**显示必出标记 */
    showMustIcon(cardId) {
        let com = this._cardComList.find(c => c.flower == cardId && c.node.active)
        if (com) {
            com.setMust(true)
        }
    },

    /**刷新牌 */
    updateCards(cardArr = [], isAni = false, isOutAni = false) {
        for (let i = 0; i < this._cardComList.length; i++) {
            const com = this._cardComList[i];
            let cardId = cardArr[i]
            this.cardUpOrDown(com, 2)
            if (cardId) {
                com.flower = cardId
                com.setNodeOpacity(isAni ? 0 : 255)
                com.setNodeShow(true)
            } else {
                com.setNodeShow(false)
            }
        }
        /**发牌动画 */
        if (isAni) {
            // console.log("播放发牌动画")
            this._isNoTouch = true
            this.scheduleOnce(() => {
                for (let i = 0; i < this._cardComList.length; i++) {
                    const com = this._cardComList[i];
                    if (!com.node.active) continue;
                    let node = AssetsManager.createSpriteNode({
                        path: 'sprite/cards/' + com.flower,
                        width: com.node.width,
                        height: com.node.height
                    });
                    node.parent = this.node.parent
                    node.scale = this._initLayoutScale
                    let endPos = CCUtil.postionConvert(com.node, this.node.parent)
                    cc.tween(node).delay(0.04 * i).to(0.2, {
                        position: endPos
                    }, {
                        easing: "quadOut"
                    }).call(() => {
                        AssetsManager.playEffect({
                            path: "res/audio/main/sound_send_card",
                            bundle: Enums.bundleType.LSPDK
                        });
                        com.setNodeOpacity(255)
                        if (i == this._cardComList.length - 1) {
                            this._isNoTouch = false
                        }
                    }).removeSelf().start()
                }
            }, 0.02)
        } else {
            this._isNoTouch = false
        }

        /**出牌动画 */
        if (isOutAni) {
            this._cardLayout.scale = 0
            cc.tween(this._cardLayout).to(0.2, {
                scale: this._initLayoutScale
            }, {
                easing: "backOut"
            }).start()
        } else {
            this._cardLayout.stopAllActions()
            this._cardLayout.scale = this._initLayoutScale
        }
    },

    /**把所有抬起的牌放下去 */
    setAllCardDown() {
        this._cardComList.forEach(com => {
            this.cardUpOrDown(com, 2)
        });
    },

    /**
     * 设置牌抬起来
     * @param {Array<number>} cardArr 提示的牌
     */
    setCardUp(cardArr) {
        if (!cardArr) {
            this.setAllCardDown()
        } else {
            this.setAllCardDown()
            cardArr.forEach(cardId => {
                let com = this._cardComList.find(c => c.flower == cardId)
                if (com) {
                    this.cardUpOrDown(com, 1)
                }
            });
        }
    },

    /**设置提示数据 */
    setTipData(data) {
        this._tipData = data
        this._tipIndex = 0
        this._isNoTouch = false
    },

    /**展示提示牌 */
    showTipCards() {
        if (!this._tipData || this._tipData.length == 0) {
            return
        }
        const info = this._tipData[this._tipIndex]
        this._tipIndex++
        if (!this._tipData[this._tipIndex]) {
            this._tipIndex = 0
        }
        let cardList = info.cardList.slice()
        this.setCardUp(cardList)
    },

    /**设置动画节点 */
    setAniNode(node) {
        if (cc.isValid(this._aniNode)) {
            this._aniNode.removeAllChildren()
            if (cc.isValid(node)) {
                this._aniNode.addChild(node)
            }
        }
    },
});