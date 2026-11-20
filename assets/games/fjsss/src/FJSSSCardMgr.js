const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const FJSSSModel = require("./FJSSSModel")
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const GameUtil = require('./FJSSSUtil');
const UserModel = require('../../../src/model/UserModel');

let cardPos = [{
    init: cc.v2(-85, 0),
    ani: cc.v2(-52, 4),
    angle: 10
}, {
    init: cc.v2(0, 0),
    ani: cc.v2(0, 0),
    angle: 0
}, {
    init: cc.v2(85, 0),
    ani: cc.v2(52, -13),
    angle: -10
}, {
    init: cc.v2(-130, 0),
    ani: cc.v2(-104, -2),
    angle: 20
}, {
    init: cc.v2(-65, 0),
    ani: cc.v2(-52, 4),
    angle: 10
}, {
    init: cc.v2(0, 0),
    ani: cc.v2(0, 0),
    angle: 0
}, {
    init: cc.v2(65, 0),
    ani: cc.v2(52, -13),
    angle: -10
}, {
    init: cc.v2(130, 0),
    ani: cc.v2(104, -35),
    angle: -20
}, {
    init: cc.v2(-170, 0),
    ani: cc.v2(-104, -2),
    angle: 20
}, {
    init: cc.v2(-85, 0),
    ani: cc.v2(-52, 4),
    angle: 10
}, {
    init: cc.v2(0, 0),
    ani: cc.v2(0, 0),
    angle: 0
}, {
    init: cc.v2(85, 0),
    ani: cc.v2(52, -13),
    angle: -10
}, {
    init: cc.v2(170, 0),
    ani: cc.v2(104, -35),
    angle: -20
}]

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
        this._sendCardLayout = cc.find("sendCard", this.node)
        this._showCardLayout1 = cc.find("showCard/layout1", this.node)
        this._showCardLayout2 = cc.find("showCard/layout2", this.node)
        this._showCardLayout3 = cc.find("showCard/layout3", this.node)
        this._cardTypeNode = cc.find("cardType", this.node)
        this._cardTypeNode.active = false
        this._cardScoreNode = cc.find("cardScore", this.node)
        this._cardScoreNode.active = false
        this._gunNode = cc.find("gun", this.node)
        this._gunNode.active = false
        this._stateLiPaiNode = cc.find("state", this.node)
        this._stateLiPaiNode.active = false
        this._holeNode = cc.find("hole", this.node)
        this._btn_baipai = cc.find("btn_baipai", this.node)
        this._btn_chakan = cc.find("btn_chakan", this.node)
        this._btn_yincang = cc.find("btn_yincang", this.node)
        this._showCardBack = cc.find("showCardBack", this.node)
        if (this._idx == 0) {
            if (cc.isValid(this._btn_baipai)) {
                this._btn_baipai.on("click", this.onBtnBaiPai, this)
                // this._txt_diamond = cc.find("lay/txt_diamond", this._btn_baipai).getComponent(cc.Label)
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
            let com = node.addComponent('FJSSSCard')
            com.init()
            com.setNodeShow(true)
            com.setNodeOpacity(0)
            list.push(com)
            return node
        }

        for (let i = 0; i < 13; i++) {
            getNewCard(i, this._sendCardLayout, this._sendCardComList)
            let node = null
            if (i < 3) {
                node = getNewCard(i, this._showCardLayout1, this._showCardComList)
            } else if (i < 8) {
                node = getNewCard(i, this._showCardLayout2, this._showCardComList)
            } else {
                node = getNewCard(i, this._showCardLayout3, this._showCardComList)
            }
            node.setPosition(cardPos[i].init)
        }

        for (let i = 1; i <= 3; i++) {
            let ct = cc.find("" + i, this._cardTypeNode)
            let cs = cc.find("" + i, this._cardScoreNode)
            ct.active = false
            cs.active = false
            this._cardTypeInitX.push(ct.x)
            this._cardScoreInitX.push(cs.x)
        }

        // this.scheduleOnce(() => {
        //     console.log("sdlkgj=================", this._showCardLayout1.children[0].x)
        // }, 1)
    },

    showBtnBaiPai(isShow) {
        if (cc.isValid(this._btn_baipai)) {
            this._btn_baipai.active = isShow && FJSSSModel.getIsPlayingByChairID(FJSSSModel.getMyChairID())
            if (this._btn_baipai.active) {
                // let gold = FJSSSModel.getMyUserInfoByKey("gold")
                // this._txt_diamond.string = `10/${gold}`
                // this._btn_baipai.getComponent(cc.Button).interactable = gold >= 10
            }
        }
    },
    showBtnChaKan(isShow) {
        if (cc.isValid(this._btn_chakan)) {
            this._btn_chakan.active = isShow && FJSSSModel.getIsPlayingByChairID(FJSSSModel.getMyChairID())
        }
    },
    showBtnYinCang(isShow) {
        if (cc.isValid(this._btn_yincang)) {
            this._btn_yincang.active = isShow && FJSSSModel.getIsPlayingByChairID(FJSSSModel.getMyChairID())
        }
    },

    /**获取牌型图片的url */
    getTypeNameByCardArr(array) {
        let typeArr = GameUtil.getAllHoldTypeWithNormal(array);
        // console.log("获取到的牌型==", typeArr)
        for (const name in typeArr) {
            if (Object.hasOwnProperty.call(typeArr, name)) {
                if (typeArr[name]) {
                    return name
                }
            }
        }
        return "wulong";
    },

    /**重新摆牌 */
    onBtnBaiPai() {
        // console.log("重新摆牌")
        cc.systemEvent.emit("chongxinbaipai")
        this.setShowState(3)
        this.resetShowLayout()
    },

    /**查看已经摆好的牌 */
    onBtnChaKan() {
        this.showLiPaiFinishAni(false)
        this.showBtnChaKan(false)
        this.showBtnYinCang(true)
        this.showBtnBaiPai(true)
        let user = FJSSSModel.getShowCardsUser(FJSSSModel.myUid)
        // console.log("获取到的摆牌信息==", user)
        let handCards = user.cards
        let typeArr = []
        for (let i = 0; i < this._showCardComList.length; i++) {
            const com = this._showCardComList[i];
            com.flower = handCards[i]
            com.setNodeShow(true)
            typeArr.push(handCards[i])
            if (i == 2 || i == 7 || i == 12) {
                if (user.teShuType == 0) {
                    let type = this.getTypeNameByCardArr(typeArr)
                    // console.log("获取到的牌型==", type)
                    com.setCardType(type)
                    typeArr.length = 0
                } else {
                    com.setCardType()
                }
            }
        }
        let cardType = cc.find("4", this._cardTypeNode)
        if (user.teShuType != 0) {
            let url = "res/sprite/cardType/" + user.teShuType
            AssetsManager.loadSpriteFrame({
                path: url,
                sprite: cardType.getComponent(cc.Sprite),
                bundle: Enums.bundleType.FJSSS
            })
            cardType.active = true
            this._cardTypeNode.active = true
        } else {
            cardType.active = false
            this._cardTypeNode.active = false
        }
        this._showCardLayout1.active = true
        this._showCardLayout2.active = true
        this._showCardLayout3.active = true
    },

    onBtnYinCang() {
        this.setShowState(3)
        this.setShowState(2)
        this.resetShowLayout()
    },

    /**设置座位号 */
    setChairId(cid) {
        this._chairId = cid
    },

    /**重置 */
    reset() {
        this.unscheduleAllCallbacks();
        this._holeNode.stopAllActions()
        this._holeNode.removeAllChildren()
        this._gunNode.stopAllActions()
        this._gunNode.active = false
        this._cardTypeNode.active = false
        this._cardScoreNode.active = false
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
        this.showLiPaiFinishAni(false)

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
        if (this._idx == 0 && arr.length == 13) {
            let back = []
            let front = []
            arr.forEach(id => {
                if (id == 60) {
                    back.push(id)
                } else {
                    front.push(id)
                }
            });
            arr = back.concat(front)
        }
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
            // console.log("播放发牌动画", this._sendCardComList, arr)
            AssetsManager.playEffect({
                path: "res/audio/fapai",
                bundle: Enums.bundleType.FJSSS
            });
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
        if (!FJSSSModel.getIsPlayingByChairID(this._chairId)) {
            return
        }
        if (state == 1) {
            // this._stateLiPaiNode.active = true
            // let arr = new Array(13).fill(60)
            // this.sendCards(arr)
            // this.showLiPaiAni(true)

            this.sendCards()
            this.showLiPaiFinishAni(true, 1)
        } else {
            // this._stateLiPaiNode.active = false
            this.sendCards()
            // this.showLiPaiAni(false)
            if (state == 2) {
                this.showLiPaiFinishAni(true, 2)
                this.showBtnChaKan(true)
                this.showBtnBaiPai(true)
                this.showBtnYinCang(false)
            } else if (state == 3) {
                this._cardTypeNode.children.forEach(node => node.active = false)
                this.showBtnBaiPai(false)
                this.showBtnChaKan(false)
                this.showBtnYinCang(false)
                this.showLiPaiFinishAni(true, 2)
            }
        }
    },

    /**显示理牌中动画 波浪式动画 暂未启用*/
    showLiPaiAni(isShow) {
        // for (let i = 0; i < this._sendCardComList.length; i++) {
        //     const com = this._sendCardComList[i];
        //     com.node.stopAllActions()
        //     com.updateNodePos(cc.v2(com.node.x, 0))
        // }
        // this.unscheduleAllCallbacks()
        // if (!FJSSSModel.getIsPlayingByChairID(this._chairId)) {
        //     return
        // }
        // if (isShow) {
        //     this.schedule(() => {
        //         for (let i = 0; i < this._sendCardComList.length; i++) {
        //             const com = this._sendCardComList[i];
        //             cc.tween(com.node).delay(i * 0.1).by(0.3, {
        //                 y: 40
        //             }).by(0.3, {
        //                 y: -40
        //             }).start()
        //         }
        //     }, 2)
        // }
    },

    /**展示理牌完成动画 */
    showLiPaiFinishAni(isShow, type = 0) {
        if (cc.isValid(this._showCardBack)) {
            this._showCardBack.removeAllChildren()
            this._showCardBack.scale = 1
        }
        if (!isShow || !FJSSSModel.getIsPlayingByChairID(this._chairId)) {
            return
        }
        let user = FJSSSModel.getUserByChairID(this._chairId)
        let showCardInfo = null
        if (user) {
            showCardInfo = FJSSSModel.getShowCardsUser(user.uid)
        }
        AssetsManager.loadAsset({
            path: 'res/prefab/FJSSSAni',
            bundle: Enums.bundleType.FJSSS,
            aType: cc.Prefab
        }, (item) => {
            if (!item || !cc.isValid(this._showCardBack)) return;
            let aniNode = cc.instantiate(item)
            aniNode.parent = this._showCardBack
            let com = aniNode.getComponent("FJSSSAni")
            com.showLiPaiFinish(type, showCardInfo && showCardInfo.teShuType)
            this._showCardBack.active = true
        });
    },

    //计算角度并返回
    getAngle(point) {
        var pos = this.node.getPosition();
        let angle = Math.atan2(point.y - pos.y, point.x - pos.x) * (180 / Math.PI);
        return angle - 90;
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
        let sortList = data.touSort
        if (dao == 2) {
            layout = this._showCardLayout2
            startIdx = 3
            endIdx = 8
            sortList = data.zhongSort
        } else if (dao == 3) {
            layout = this._showCardLayout3
            startIdx = 8
            endIdx = 13
            sortList = data.weiSort
        }

        /**展示牌 */
        layout.active = true
        let handCards = data.cardsArr[uid]
        for (let i = startIdx; i < endIdx; i++) {
            let com = this._showCardComList[i]
            com.flower = handCards[i]
            com.setNodeShow(true)
            com.setMaIcon(data.mapai == handCards[i])
            if (isAni) {
                com.updateNodeAngle(cardPos[i].angle)
                com.updateNodePos(cardPos[i].ani)
                cc.tween(com.node).delay(0.3).to(0.1, {
                    position: cc.v3(cardPos[i].init),
                    angle: 0
                }).start()
            }
        }
        if (isAni) {
            layout.scale = 0
            cc.tween(layout).to(0.1, {
                scale: 1
            }).start()
        }

        /**展示牌型 */
        let typeInfo = sortList.find(t => t.uid == uid)
        if (typeInfo) {
            this.showCardType(dao, typeInfo.type, isAni)
        }

        /**展示分数 */
        let scoreInfo = data.endScore[uid]
        if (scoreInfo) {
            this.showCardScore(dao, scoreInfo[dao - 1], isAni)
        }

        if (isAni && typeInfo) { //声音
            let aud = typeInfo.type
            if (aud == "santiao" && dao == 1) {
                aud = "cs" //切换成冲三声音
            }
            if (aud == "hulu" && dao == 2) {
                aud = "zdhl"
            }
            AssetsManager.playEffect({
                path: "res/audio/" + aud,
                bundle: Enums.bundleType.FJSSS
            });
        }
    },

    /**展示牌型 */
    showCardType(dao, type, isAni = false) {
        // console.log("展示牌型==", dao, type, isAni, this.node.name)
        let idx = 2
        if (dao == 2) {
            idx = 7
        } else if (dao == 3) {
            idx = 12
        }
        let com = this._showCardComList[idx]
        com.setCardType()
        if (isAni) {
            this._cardTypeNode.active = true
            let cardType = cc.find("" + dao, this._cardTypeNode)
            if (cardType) {
                let url = "res/sprite/cardType/sss_w_" + type
                AssetsManager.loadSpriteFrame({
                    path: url,
                    sprite: cardType.getComponent(cc.Sprite),
                    bundle: Enums.bundleType.FJSSS
                })
                cardType.active = true
                cardType.scale = 0
                let offSetX = -200
                if (this._idx >= 1 && this._idx <= 4) {
                    offSetX = -offSetX
                }
                let initX = this._cardTypeInitX[dao - 1]
                cardType.x = initX + offSetX
                cc.tween(cardType).to(0.2, {
                    x: initX,
                    scale: 1
                }, {
                    easing: "backOut"
                }).delay(0.2).call(() => {
                    cardType.active = false
                    com.setCardType(type)
                }).start()
            }
        } else {
            this._cardTypeNode = false
            com.setCardType(type)
        }
    },

    /**展示分数 */
    showCardScore(dao, score = null, isAni = false) {
        // console.log("展示分数==", dao, score, isAni, this.node.name)
        let cardScore = cc.find("" + dao, this._cardScoreNode)
        if (!cardScore) {
            return
        }
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
            bundle: Enums.bundleType.FJSSS
        }, (font) => {
            if (!!font || !cc.isValid(this.node)) {
                label.font = font;
                label.string = str;
                label.node.active = true;
            }
        });

        let initX = this._cardScoreInitX[dao - 1]
        if (isAni) {
            cardScore.scale = 1
            // cc.tween(cardScore).delay(0.5).to(0.2, {
            //     // x: initX,
            //     scale: 1
            // }).start()
        } else {
            cardScore.scale = 1
            cardScore.x = initX
        }
    },

    /**展示特殊牌型 */
    showCardsSpecial(data, uid, isAni = false) {
        /**展示牌 */
        this._showCardLayout1.active = true
        this._showCardLayout2.active = true
        this._showCardLayout3.active = true
        let handCards = data.cardsArr[uid]
        for (let i = 0; i < handCards.length; i++) {
            let com = this._showCardComList[i]
            if (com) {
                com.flower = handCards[i]
                com.setNodeShow(true)
                com.setMaIcon(data.mapai == handCards[i])
                com.setCardType()
            }
        }
        /**展示牌型 */
        let tInfo = data.teShuSort.find(t => t.uid == uid)
        // console.log("特殊牌型===", tInfo)
        this._cardTypeNode.active = true
        let cardType = cc.find("4", this._cardTypeNode)
        if (!cardType || !tInfo) {
            return
        }
        let url = "res/sprite/cardType/" + tInfo.teShuType
        AssetsManager.loadSpriteFrame({
            path: url,
            sprite: cardType.getComponent(cc.Sprite),
            bundle: Enums.bundleType.FJSSS
        })
        cardType.active = true
        if (isAni) {
            AssetsManager.playEffect({
                path: 'res/audio/' + tInfo.teShuType,
                bundle: Enums.bundleType.FJSSS
            });
            cardType.scale = 3;
            let action = cc.scaleTo(0.3, 1);
            action.easing(cc.easeIn(3));
            cc.tween(cardType).then(action).start()
        } else {
            cardType.scale = 1
        }
    },

    /**打抢 */
    showDqAni(targetNode) {
        this.node.active = true
        let tpos = targetNode.getPosition()
        let selfPos = this.node.getPosition()
        this._gunNode.scaleX = 1
        if (tpos.x > selfPos.x) {
            this._gunNode.scaleX = -1
        } else if (tpos.x == selfPos.x && selfPos.x < 0) {
            this._gunNode.scaleX = -1
        }

        let ag = this.getAngle(tpos)
        this._gunNode.active = true
        this._gunNode.angle = ag
        // console.log("抢的角度==", ag)

        let offX = -14,
            offR = -16;
        AssetsManager.playEffect({
            path: 'res/audio/dq',
            bundle: Enums.bundleType.FJSSS
        });
        cc.tween(this._gunNode).delay(0.1).call(() => {
            AssetsManager.playEffect({
                path: 'res/audio/sanqiang',
                bundle: Enums.bundleType.FJSSS
            });
        }).repeat(3, cc.tween().by(0.1, {
            x: offX,
            angle: offR
        }).by(0.1, {
            x: -offX,
            angle: -offR
        }).delay(0.1)).call(() => {
            this._gunNode.active = false
        }).start()
    },

    /**被打抢 
     * res/sprite/gun/TW_hole1
     */
    showBdqAni() {
        this.node.active = true
        this._holeNode.active = true
        let generateHole = () => {
            let node = new cc.Node()
            node.parent = this._holeNode
            node.scale = 1.5
            node.setPosition(CCUtil.getRandomPos(this._holeNode.width, this._holeNode.height));
            let sp = node.addComponent(cc.Sprite)
            let r = Utils.getRandomNum(1, 3)
            AssetsManager.loadSpriteFrame({
                path: "res/sprite/gun/TW_hole" + r,
                bundle: Enums.bundleType.FJSSS,
                sprite: sp
            })
        }

        cc.tween(this._holeNode).delay(0.2).call(() => {
            generateHole()
        }).delay(0.3).call(() => {
            generateHole()
        }).delay(0.3).call(() => {
            generateHole()
        }).start()
    },
});