const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const BJJModel = require("./BJJModel")
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const ApiBjj = require('./ApiBjj');

let cardPos = [{
    init: cc.v2(-95, 0),
}, {
    init: cc.v2(-0, 0),
}, {
    init: cc.v2(95, 0),
}, {
    init: cc.v2(-95, 0),
}, {
    init: cc.v2(-0, 0),
}, {
    init: cc.v2(95, 0),
}, {
    init: cc.v2(-95, 0),
}, {
    init: cc.v2(-0, 0),
}, {
    init: cc.v2(95, 0),
}]

let TOU_COUNT = 3,
    ZHONG_COUNT = 3,
    WEI_COUNT = 3,
    CARD_COUNT = 9

cc.Class({
    extends: cc.Component,

    properties: {
        cardPfb: cc.Prefab,
        showCardLayout1: cc.Node,
        showCardLayout2: cc.Node,
        showCardLayout3: cc.Node,
        cardTypeNode: cc.Node,
        xiTypeNode: cc.Node,
        cardScoreNode: cc.Node,
        stateLiPaiNode: cc.Node,
        btn_baipai: cc.Node,
        btn_chakan: cc.Node,
        btn_yincang: cc.Node,
        qipaiNode: cc.Node,
        totalScoreNode: cc.Node,
        txt_totalScore: cc.Label,
        /**牌容器 */
        sendCardLayout: cc.Node,

        _cardTypeInitX: [],
        /**分数 */
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

        this.cardTypeNode.active = false
        this.cardScoreNode.active = false
        this.stateLiPaiNode.active = false
        this.totalScoreNode.active = false
        this.qipaiNode.active = false
        if (this._idx == 0) {
            if (cc.isValid(this.btn_baipai)) {
                this.btn_baipai.on("click", this.onBtnBaiPai, this)
            }
            if (cc.isValid(this.btn_chakan)) {
                this.btn_chakan.on("click", this.onBtnChaKan, this)
            }
            if (cc.isValid(this.btn_yincang)) {
                this.btn_yincang.on("click", this.onBtnYinCang, this)
            }
        }

        let getNewCard = (i, layout, list) => {
            let node = cc.instantiate(this.cardPfb)
            node.y = 0
            node.parent = layout
            node.name = i + ""
            let com = node.addComponent('BJJCard')
            com.init()
            com.setNodeShow(true)
            com.setNodeOpacity(0)
            list.push(com)
            return node
        }

        for (let i = 0; i < CARD_COUNT; i++) {
            getNewCard(i, this.sendCardLayout, this._sendCardComList)
            let node = null
            if (i < 3) {
                node = getNewCard(i, this.showCardLayout1, this._showCardComList)
            } else if (i < 6) {
                node = getNewCard(i, this.showCardLayout2, this._showCardComList)
            } else {
                node = getNewCard(i, this.showCardLayout3, this._showCardComList)
            }
            node.setPosition(cardPos[i].init)
        }

        for (let i = 1; i <= 4; i++) {
            let ct = cc.find("" + i, this.cardTypeNode)
            let cs = cc.find("" + i, this.cardScoreNode)
            ct.active = false
            cs.active = false
            this._cardTypeInitX.push(ct.x)
            this._cardScoreInitX.push(cs.x)
        }
    },

    showBtnBaiPai(isShow) {
        if (cc.isValid(this.btn_baipai)) {
            this.btn_baipai.active = isShow && BJJModel.getSelfIsPlaying()
        }
    },
    showBtnChaKan(isShow) {
        if (cc.isValid(this.btn_chakan)) {
            this.btn_chakan.active = isShow && BJJModel.getSelfIsPlaying()
        }
    },
    showBtnYinCang(isShow) {
        if (cc.isValid(this.btn_yincang)) {
            this.btn_yincang.active = isShow && BJJModel.getSelfIsPlaying()
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
        let user = BJJModel.getShowCardsUser(BJJModel.myUid)
        let handCards = user.touCards.concat(user.zhongCards).concat(user.weiCards)
        let typeArr = []
        for (let i = 0; i < this._showCardComList.length; i++) {
            const com = this._showCardComList[i];
            com.flower = handCards[i]
            com.setNodeShow(true)
            com.setCover(false)
            typeArr.push(handCards[i])
        }
        this.showCardLayout1.active = true
        this.showCardLayout2.active = true
        this.showCardLayout3.active = true
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
        this.cardTypeNode.active = false
        this.cardScoreNode.active = false
        this.totalScoreNode.active = false
        this.cardTypeNode.children.forEach(node => {
            node.stopAllActions()
            node.active = false
        });
        this.cardScoreNode.children.forEach(node => {
            node.stopAllActions()
            node.active = false
        });
        for (let i = 0; i < this._showCardComList.length; i++) {
            const com = this._showCardComList[i];
            com.node.stopAllActions()
            com.updateNodePos(cardPos[i].init)
            com.updateNodeAngle(0)
        }
        this.showCardLayout1.active = false
        this.showCardLayout2.active = false
        this.showCardLayout3.active = false
        this.showCardLayout1.stopAllActions()
        this.showCardLayout2.stopAllActions()
        this.showCardLayout3.stopAllActions()
        this.showCardLayout1.scale = 1
        this.showCardLayout2.scale = 1
        this.showCardLayout3.scale = 1
        this.sendCardLayout.active = false
        this.stateLiPaiNode.active = false
        this.showBtnBaiPai(false)
        this.showBtnChaKan(false)
        this.showBtnYinCang(false)
        this.showGiveupCard(false)
    },

    resetShowLayout() {
        this.showCardLayout1.active = false
        this.showCardLayout2.active = false
        this.showCardLayout3.active = false
    },

    /**发牌 */
    sendCards(cardArr = [], isAni = false) {
        if (!cardArr || cardArr.length == 0) {
            this.sendCardLayout.active = false
            return
        }
        this.node.active = true
        this.sendCardLayout.active = true
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
            if (BJJModel.getSelfIsPlaying() && this._idx != 0 || !BJJModel.getSelfIsPlaying()) {
                this.stateLiPaiNode.active = true
                this.showLiPaiAni(true)
            } else {
                this.stateLiPaiNode.active = false
                this.sendCards()
            }
        } else {
            this.stateLiPaiNode.active = false
            this.sendCards()
            this.showLiPaiAni(false)
            if (state == 2) {
                this.showLiPaiFinishAni()
                // this.showBtnChaKan(true)
                // this.showBtnBaiPai(true)
                // this.showBtnYinCang(false)
            } else if (state == 3) {
                this.cardTypeNode.children.forEach(node => node.active = false)
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
            this.sendCardLayout.active = true
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
        this.showCardLayout1.active = true
        this.showCardLayout2.active = true
        this.showCardLayout3.active = true
        this.showCardLayout1.parent.active = true
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
        let layout = this.showCardLayout1
        let startIdx = 0
        let endIdx = 3
        let sortList = data.touList
        if (dao == 2) {
            layout = this.showCardLayout2
            startIdx = 3
            endIdx = 6
            sortList = data.zhongList
        } else if (dao == 3) {
            layout = this.showCardLayout3
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
            // /**展示牌型 */
            // this.showCardType(dao, userInfo.type, isAni)
            // /**展示分数 */
            // this.showCardScore(dao, userInfo.score, isAni)
            this.showCardTypeAndScore(dao, userInfo, isAni)
            if (isAni) { //声音
                let audioUrl = "res/audio/t_" + userInfo.type
                AssetsManager.playEffect({
                    path: audioUrl,
                    bundle: Enums.bundleType.BJJ
                });
            }
        }

    },

    /**同时展示牌型和分数 */
    showCardTypeAndScore(dao, userInfo, isAni = false) {
        let type = userInfo.type
        let score = userInfo.score
        let infoNode = cc.find("" + dao, this.cardTypeNode)
        if (infoNode) {
            this.cardTypeNode.active = true
            let scoreStr = score + ""
            let url = 'res/font/fnt_game3'
            if (score >= 0) {
                scoreStr = "+" + score
                url = 'res/font/fnt_game4'
            }

            let label = infoNode.getComponent(cc.Label)
            AssetsManager.loadAsset({
                path: url,
                aType: cc.Font,
                bundle: Enums.bundleType.BJJ
            }, (font) => {
                if (!!font || !cc.isValid(this.node)) {
                    label.font = font;
                    label.node.active = true;
                    label.string = dao < 4 ? ApiBjj.cardTypeStr[type] : "喜分"
                    label.string += scoreStr
                }
            });

            let cartTypeScale = 1
            infoNode.stopAllActions()
            let initX = this._cardTypeInitX[dao - 1]
            infoNode.x = initX
            infoNode.scale = cartTypeScale
            infoNode.active = true

            if (isAni) {
                infoNode.scale = 0
                let offSetX = -200
                if (this._idx >= 1 && this._idx <= 3) {
                    offSetX = -offSetX
                }
                infoNode.x = initX + offSetX
                cc.tween(infoNode).to(0.2, {
                    x: initX,
                    scale: cartTypeScale
                }, {
                    easing: "backOut"
                }).start()
            }
        }
    },

    /**展示牌型 */
    showCardType(dao, type, isAni = false) {
        let cartTypeScale = 0.65
        this.cardTypeNode.active = true
        let cardType = cc.find("" + dao, this.cardTypeNode)
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
                bundle: Enums.bundleType.BJJ
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
        let cardScore = cc.find("" + dao, this.cardScoreNode)
        if (!cardScore) return;
        this.cardScoreNode.active = true
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
            bundle: Enums.bundleType.BJJ
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
        this.totalScoreNode.active = true
        let str = ""
        let url = 'res/font/fnt_game3'
        if (score >= 0) {
            str = "+" + score
            url = 'res/font/fnt_game4'
        } else {
            str += score
        }
        AssetsManager.loadAsset({
            path: url,
            aType: cc.Font,
            bundle: Enums.bundleType.BJJ
        }, (font) => {
            if (!!font || !cc.isValid(this.node)) {
                this.txt_totalScore.font = font;
            }
        });
        this.txt_totalScore.string = "总计" + str;
        let aniNode = this.txt_totalScore.node
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
        this.xiTypeNode.removeAllChildren()
        if (!plusType || !Array.isArray(plusType) || plusType.length == 0) {
            return
        }
        this.xiTypeNode.active = true
        for (let i = 0; i < plusType.length; i++) {
            const type = plusType[i].type;
            let node = new cc.Node()
            // node.anchorX = 1
            node.parent = this.xiTypeNode
            let sp = node.addComponent(cc.Sprite)
            let url = "res/sprite/cardType/t_" + type
            AssetsManager.loadSpriteFrame({
                path: url,
                sprite: sp,
                bundle: Enums.bundleType.BJJ
            })
        }
    },

    /**弃牌 */
    showGiveupCard(isShow = false, isAni = false) {
        this._showCardComList.forEach(com => {
            com.setGray(isShow)
        })
        this.qipaiNode.active = isShow
        this.qipaiNode.scale = 0.5
        this.qipaiNode.stopAllActions()
        if (isAni) {
            this.qipaiNode.scale = 1.5
            let action = cc.scaleTo(0.3, 0.5);
            action.easing(cc.easeIn(3));
            cc.tween(this.qipaiNode).then(action).start()
        }
    },
});