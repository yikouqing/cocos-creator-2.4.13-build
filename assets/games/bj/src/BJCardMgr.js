const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const BJModel = require("./BJModel")
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');

let cardPos = [{
    init: cc.v2(-115, 0),
}, {
    init: cc.v2(0, 0),
}, {
    init: cc.v2(115, 0),
}, {
    init: cc.v2(-115, 0),
}, {
    init: cc.v2(0, 0),
}, {
    init: cc.v2(115, 0),
}, {
    init: cc.v2(-115, 0),
}, {
    init: cc.v2(0, 0),
}, {
    init: cc.v2(115, 0),
}]

let TOU_COUNT = 3,
    ZHONG_COUNT = 3,
    WEI_COUNT = 3,
    CARD_COUNT = 9

cc.Class({
    extends: cc.Component,

    properties: {
        cardPfb: cc.Prefab,
        /**牌容器 */
        _sendCardLayout: null,
        _showCardLayout1: null, //头道
        _showCardLayout2: null, //中道
        _showCardLayout3: null, //尾道
        /**牌型 */
        _cardTypeNode: null,
        _cardTypeInitX: [],
        /**分数 */
        _cardScoreNode: null,
        _cardScoreInitX: [],
        /**牌脚本列表 */
        _sendCardComList: [],
        _showCardComList: [],
        /**是否初始化 */
        _isInit: false,
        /**牌抬起来的偏移量 */
        _upY: 30,
        /**位置 */
        _idx: null,
        /**座位号 */
        _chairId: null,
        /**按钮 */
        _btn_chakan: null,
        _btn_baipai: null,
        /**初始化位置 */
        _initPos: [],
    },

    init(idx) {
        if (this._isInit) {
            return
        }
        this.node.active = true
        this._isInit = true
        this._idx = idx
        this._sendCardLayout = this.node.getChildByName("sendCard")
        let showCard = this.node.getChildByName("showCard")
        this._showCardLayout1 = showCard.getChildByName("layout1")
        this._showCardLayout2 = showCard.getChildByName("layout2")
        this._showCardLayout3 = showCard.getChildByName("layout3")
        this._cardTypeNode = this.node.getChildByName("cardType")
        this._cardTypeNode.active = false
        this._xiTypeNode = this._cardTypeNode.getChildByName("xiType")
        this._cardScoreNode = this.node.getChildByName("cardScore")
        this._cardScoreNode.active = false
        this._stateLiPaiNode = this.node.getChildByName("state")
        this._stateLiPaiNode.active = false
        this._btn_baipai = this.node.getChildByName("btn_baipai")
        this._btn_chakan = this.node.getChildByName("btn_chakan")
        this._btn_yincang = this.node.getChildByName("btn_yincang")
        this._totalScore = this.node.getChildByName("totalScore")
        this._totalScore.active = false
        this._txt_totalScore = this._totalScore.getChildByName("txt_totalScore").getComponent(cc.Label)
        this._qipaiNode = this.node.getChildByName("qipai")
        this._qipaiNode.active = false
        if (this._idx == 0) {
            if (cc.isValid(this._btn_baipai)) {
                this._btn_baipai.on("click", this.onBtnBaiPai, this)
            }
            if (cc.isValid(this._btn_chakan)) {
                this._btn_chakan.on("click", this.onBtnChaKan, this)
            }
            if (cc.isValid(this._btn_yincang)) {
                this._btn_yincang.on("click", this.onBtnYinCang, this)
            }
        }

        let getNewCard = (i, layout, list) => {
            let node = cc.instantiate(this.cardPfb)
            node.y = 0
            node.parent = layout
            node.name = i + ""
            let com = node.addComponent('BJCard')
            com.init()
            com.setNodeShow(true)
            com.setNodeOpacity(0)
            list.push(com)
            return node
        }

        for (let i = 0; i < CARD_COUNT; i++) {
            getNewCard(i, this._sendCardLayout, this._sendCardComList)
            let node = null
            if (i < 3) {
                node = getNewCard(i, this._showCardLayout1, this._showCardComList)
            } else if (i < 6) {
                node = getNewCard(i, this._showCardLayout2, this._showCardComList)
            } else {
                node = getNewCard(i, this._showCardLayout3, this._showCardComList)
            }
            node.setPosition(cardPos[i].init)
        }

        for (let i = 1; i <= 4; i++) {
            let ct = cc.find("" + i, this._cardTypeNode)
            let cs = cc.find("" + i, this._cardScoreNode)
            ct.active = false
            cs.active = false
            this._cardTypeInitX.push(ct.x)
            this._cardScoreInitX.push(cs.x)
        }
    },

    showBtnBaiPai(isShow) {
        if (cc.isValid(this._btn_baipai)) {
            this._btn_baipai.active = isShow && BJModel.getSelfIsPlaying()
        }
    },
    showBtnChaKan(isShow) {
        if (cc.isValid(this._btn_chakan)) {
            this._btn_chakan.active = isShow && BJModel.getSelfIsPlaying()
        }
    },
    showBtnYinCang(isShow) {
        if (cc.isValid(this._btn_yincang)) {
            this._btn_yincang.active = isShow && BJModel.getSelfIsPlaying()
        }
    },

    /**重新摆牌 */
    onBtnBaiPai() {
        cc.systemEvent.emit("chongxinbaipai")
        this.setShowState(3)
        this.resetShowLayout()
    },


    /**查看已经摆好的牌 */
    onBtnChaKan() {
        this.showLiPaiFinishAni()
        // this.showBtnChaKan(false)
        // this.showBtnYinCang(true)
        // this.showBtnBaiPai(true)
        let user = BJModel.getShowCardsUser(BJModel.myUid)
        let handCards = user.touCards.concat(user.zhongCards).concat(user.weiCards)
        let typeArr = []
        for (let i = 0; i < this._showCardComList.length; i++) {
            const com = this._showCardComList[i];
            com.flower = handCards[i]
            com.setNodeShow(true)
            com.setCover(false)
            typeArr.push(handCards[i])
        }
        this._showCardLayout1.active = true
        this._showCardLayout2.active = true
        this._showCardLayout3.active = true
    },

    onBtnYinCang() {
        this.setShowState(3)
        this.setShowState(2)
        // this.resetShowLayout()
    },

    /**设置座位号 */
    setChairId(cid) {
        this._chairId = cid
    },

    /**重置 */
    reset() {
        this.unscheduleAllCallbacks();
        this._cardTypeNode.active = false
        this._cardScoreNode.active = false
        this._totalScore.active = false
        this._cardTypeNode.children.forEach(node => {
            node.stopAllActions()
            node.active = false
        });
        this._cardScoreNode.children.forEach(node => {
            node.stopAllActions()
            node.active = false
        });
        for (let i = 0; i < this._showCardComList.length; i++) {
            const com = this._showCardComList[i];
            com.node.stopAllActions()
            com.updateNodePos(cardPos[i].init)
            com.updateNodeAngle(0)
        }
        this._showCardLayout1.active = false
        this._showCardLayout2.active = false
        this._showCardLayout3.active = false
        this._showCardLayout1.stopAllActions()
        this._showCardLayout2.stopAllActions()
        this._showCardLayout3.stopAllActions()
        this._showCardLayout1.scale = 1
        this._showCardLayout2.scale = 1
        this._showCardLayout3.scale = 1
        this._sendCardLayout.active = false
        this.showBtnBaiPai(false)
        this.showBtnChaKan(false)
        this.showBtnYinCang(false)
        this.showGiveupCard(false)
    },

    resetShowLayout() {
        this._showCardLayout1.active = false
        this._showCardLayout2.active = false
        this._showCardLayout3.active = false
    },

    /**发牌 */
    sendCards(cardArr = [], isAni = false) {
        if (!cardArr || cardArr.length == 0) {
            this._sendCardLayout.active = false
            return
        }
        this.node.active = true
        this._sendCardLayout.active = true
        let arr = cardArr.slice()
        for (let i = 0; i < this._sendCardComList.length; i++) {
            const com = this._sendCardComList[i];
            let cardId = arr[i]
            if (cardId || cardId === 0) {
                com.flower = cardId
                com.setNodeOpacity(255)
                com.setNodeShow(true)
            } else {
                com.setNodeShow(false)
            }
        }
        /**发牌动画 */
        if (isAni) {
            for (let i = 0; i < this._sendCardComList.length; i++) {
                const com = this._sendCardComList[i];
                let dt = i * 0.08
                com.setNodeOpacity(0)
                cc.tween(com.node).delay(dt).to(0.08, {
                    opacity: 255
                }).start()
            }
        }
    },

    /**
     * 设置理牌状态
     * @param {number} state 1理牌中 2理牌完成 3清理理牌完成动画
     */
    setShowState(state) {
        if (state == 1) {
            if (BJModel.getSelfIsPlaying() && this._idx != 0 || !BJModel.getSelfIsPlaying()) {
                this._stateLiPaiNode.active = true
                this.showLiPaiAni(true)
            } else {
                this._stateLiPaiNode.active = false
                this.sendCards()
            }
        } else {
            this._stateLiPaiNode.active = false
            this.sendCards()
            this.showLiPaiAni(false)
            if (state == 2) {
                this.showLiPaiFinishAni()
                // this.showBtnChaKan(true)
                // this.showBtnBaiPai(true)
                // this.showBtnYinCang(false)
            } else if (state == 3) {
                this._cardTypeNode.children.forEach(node => node.active = false)
                this.showBtnBaiPai(false)
                this.showBtnChaKan(false)
                this.showBtnYinCang(false)
                this.showLiPaiFinishAni()
            }
        }
    },

    /**显示理牌中动画 波浪式动画*/
    showLiPaiAni(isShow) {
        for (let i = 0; i < this._sendCardComList.length; i++) {
            const com = this._sendCardComList[i];
            com.node.stopAllActions()
            com.updateNodePos(cc.v2(com.node.x, 0))
        }
        this.unscheduleAllCallbacks()

        if (isShow) {
            this._sendCardLayout.active = true
            this.schedule(() => {
                for (let i = 0; i < this._sendCardComList.length; i++) {
                    const com = this._sendCardComList[i];
                    com.setNodeShow(true)
                    com.setNodeOpacity(255)
                    cc.tween(com.node).delay(i * 0.1).by(0.3, {
                        y: 40
                    }).by(0.3, {
                        y: -40
                    }).start()
                }
            }, 2)
        }
    },

    /**展示理牌完成 */
    showLiPaiFinishAni() {
        this._showCardComList.forEach(com => {
            com.setCover(true)
            com.setNodeOpacity(255)
        });
        this._showCardLayout1.active = true
        this._showCardLayout2.active = true
        this._showCardLayout3.active = true
        this._showCardLayout1.parent.active = true
    },


    /**
     * 展示牌
     * @param {object} data 结算数据
     * @param {number} dao 展示那一道
     * @param {boolean} isAni 是否展示动画
     * @returns 
     */
    showCards(data, dao, uid, isAni = false) {
        this.node.active = true
        let layout = this._showCardLayout1
        let startIdx = 0
        let endIdx = 3
        let sortList = data.touList
        if (dao == 2) {
            layout = this._showCardLayout2
            startIdx = 3
            endIdx = 6
            sortList = data.zhongList
        } else if (dao == 3) {
            layout = this._showCardLayout3
            startIdx = 6
            endIdx = 9
            sortList = data.weiList
        }

        /**展示牌 */
        layout.active = true
        let tou = data.touList.find(info => info.uid == uid).cards
        let zhong = data.zhongList.find(info => info.uid == uid).cards
        let wei = data.weiList.find(info => info.uid == uid).cards
        let handCards = tou.concat(zhong).concat(wei)
        let t = 0
        for (let i = startIdx; i < endIdx; i++) {
            let com = this._showCardComList[i]
            com.flower = handCards[i]
            com.node.stopAllActions()
            com.setNodeShow(true)
            com.setNodeScale(1)
            com.setCover(false)
            // com.setMaIcon(data.mapai == handCards[i])
            if (isAni) {
                com.setCover(true)
                cc.tween(com.node).delay(0.05 * t).to(0.1, {
                    scaleX: 0
                }).call(() => {
                    com.setCover(false)
                }).to(0.1, {
                    scaleX: 1
                }).start()
                t++
            }
        }

        let userInfo = sortList.find(t => t.uid == uid)
        if (userInfo) {
            /**展示牌型 */
            this.showCardType(dao, userInfo.type, isAni)
            /**展示分数 */
            this.showCardScore(dao, userInfo.score, isAni)
            if (isAni) { //声音
                let audioUrl = "res/audio/t_" + userInfo.type
                AssetsManager.playEffect({
                    path: audioUrl,
                    bundle: Enums.bundleType.BJ
                });
            }
        }

    },

    /**展示牌型 */
    showCardType(dao, type, isAni = false) {
        let cartTypeScale = 0.65
        this._cardTypeNode.active = true
        let cardType = cc.find("" + dao, this._cardTypeNode)
        cardType.stopAllActions()
        let initX = this._cardTypeInitX[dao - 1]
        cardType.x = initX
        cardType.scale = cartTypeScale
        if (cardType) {
            cardType.active = true
            let url = "res/sprite/cardType/t_" + type
            AssetsManager.loadSpriteFrame({
                path: url,
                sprite: cardType.getComponent(cc.Sprite),
                bundle: Enums.bundleType.BJ
            })
            if (isAni) {
                cardType.scale = 0
                let offSetX = -200
                if (this._idx >= 1 && this._idx <= 3) {
                    offSetX = -offSetX
                }
                cardType.x = initX + offSetX
                cc.tween(cardType).to(0.2, {
                    x: initX,
                    scale: cartTypeScale
                }, {
                    easing: "backOut"
                }).start()
            }
        }
    },

    /**展示分数 */
    showCardScore(dao, score = null, isAni = false) {
        let cardScore = cc.find("" + dao, this._cardScoreNode)
        if (!cardScore) return;
        this._cardScoreNode.active = true
        cardScore.active = true
        let str = score + ""
        let url = 'res/font/fnt_game3'
        if (score >= 0) {
            str = "+" + score
            url = 'res/font/fnt_game4'
        }

        let label = cardScore.getComponent(cc.Label)
        AssetsManager.loadAsset({
            path: url,
            aType: cc.Font,
            bundle: Enums.bundleType.BJ
        }, (font) => {
            if (!!font || !cc.isValid(this.node)) {
                label.font = font;
                label.string = str;
                label.node.active = true;
            }
        });

        let initX = this._cardScoreInitX[dao - 1]
        cardScore.x = initX
        cardScore.stopAllActions()
        if (isAni) {
            cardScore.scale = 0
            cc.tween(cardScore).delay(0.5).to(0.2, {
                // x: initX,
                scale: 1
            }).start()
        } else {
            cardScore.scale = 1
        }
    },

    /**展示总分 */
    showTotalScore(score, isAni = false) {
        this._totalScore.active = true
        let str = ""
        if (score >= 0) {
            str = "+" + score
            this._txt_totalScore.node.color = cc.color("#FFF000")
        } else {
            str += score
            this._txt_totalScore.node.color = cc.color("#FF0000")
        }
        this._txt_totalScore.string = str
        let aniNode = this._txt_totalScore.node
        aniNode.scale = 1
        aniNode.stopAllActions()
        if (isAni) {
            aniNode.scale = 3;
            let action = cc.scaleTo(0.3, 1);
            action.easing(cc.easeIn(3));
            cc.tween(aniNode).then(action).start()
        }
    },

    /**
     * 展示特殊牌型
     * @param {Array} plusType 特殊牌型数组
     */
    showXiType(plusType) {
        this._xiTypeNode.removeAllChildren()
        if (!plusType || !Array.isArray(plusType) || plusType.length == 0) {
            return
        }
        this._xiTypeNode.active = true
        for (let i = 0; i < plusType.length; i++) {
            const type = plusType[i].type;
            let node = new cc.Node()
            node.anchorX = 1
            node.parent = this._xiTypeNode
            let sp = node.addComponent(cc.Sprite)
            let url = "res/sprite/cardType/t_" + type
            AssetsManager.loadSpriteFrame({
                path: url,
                sprite: sp,
                bundle: Enums.bundleType.BJ
            })
        }
    },

    /**弃牌 */
    showGiveupCard(isShow = false, isAni = false) {
        this._showCardComList.forEach(com => {
            com.setGray(isShow)
        })
        this._qipaiNode.active = isShow
        this._qipaiNode.scale = 0.5
        this._qipaiNode.stopAllActions()
        if (isAni) {
            this._qipaiNode.scale = 1.5
            let action = cc.scaleTo(0.3, 0.5);
            action.easing(cc.easeIn(3));
            cc.tween(this._qipaiNode).then(action).start()
        }
    },
});