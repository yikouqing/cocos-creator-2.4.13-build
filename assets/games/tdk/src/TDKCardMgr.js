const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const ApiTdk = require('./ApiTdk');
const ApiRoom = require('../../../src/api/ApiRoom');
const CCUtil = require('../../../src/utils/CCUtil');
const TDKModel = require("./TDKModel")


cc.Class({
    extends: cc.Component,

    properties: {
        cardPfb: cc.Prefab,

        /**本地位置号 */
        _idx: null,
        /**手牌脚本列表 */
        _cardComList: null,
        /**牌容器 */
        _cardLayout: null,
        /**是否添加了监听 */
        _isAddClick: false,
        /**弃牌标志 */
        _imgQipai: null,
        /**第一个说话标记 */
        _imgFirst: null,
        /**点数 */
        _txt_dianshu: null,
        /**手牌数组 */
        _cardArrList: [],
        _dianshustr: ""
    },


    onDestroy() { },

    /**初始化 */
    init(idx) {
        if (this._idx == null) {
            this._idx = idx
        } else {
            // console.log("已经初始化过了", this._idx)
            return
        }
        this._imgQipai = cc.find("qipai", this.node)
        this._txt_dianshu = cc.find("lay/txt_dianshu", this.node).getComponent(cc.Label)
        this._txt_dianshu.string = ""
        this._imgFirst = cc.find("lay/first", this.node)
        this._imgQipai.active = false
        this._cardComList = []
        this._cardLayout = cc.find("layout", this.node)
        this._cardLayout.removeAllChildren()
        for (let i = 0; i < 5; i++) {
            let com = this.getNewCard(this._cardLayout)
            com.setNodeOpacity(0)
            this._cardComList.push(com)
        }
    },

    /**点击看牌 */
    onLookClick() {
        if (this._idx != 0 || !TDKModel.getSelfIsPlaying()) {
            return
        }
        this.unscheduleAllCallbacks();
        let he = this.getPointSum(true)
        this.setDianshu(he, 0)
        for (let i = 0; i < 2; i++) {
            const com = this._cardComList[i];
            com.setCover(false)
            this.scheduleOnce(() => {
                com.setCover(true)
                this._txt_dianshu.string = this._dianshustr
            }, 2)
        }
    },

    /**扣牌 */
    onKouPai() {
        this.unscheduleAllCallbacks();
        let showCount = 0
        for (let i = 0; i < this._cardComList.length; i++) {
            const com = this._cardComList[i];
            if (i <= 1) {
                com.setCover(true)
            }
            com.setGray(true)
            if (com.node.active && com.node.opacity == 255) {
                showCount++
            }
        }
        /**设置图片的位置 */
        let x = (5 - showCount) * 30
        if (this._cardLayout.anchorX == 0) {
            x *= -1
        }
        this._imgQipai.x = x
        this._imgQipai.active = true
        AssetsManager.loadSpriteFrame({
            path: "res/sprite/state/qipai",
            sprite: this._imgQipai.getComponent(cc.Sprite),
            bundle: Enums.bundleType.TDK
        });
        if (this._idx == 0) {
            this._isAddClick = false
            this._cardLayout.off("click", this.onLookClick, this)
        }
    },

    /**烂锅 */
    onLanGuo() {
        this.unscheduleAllCallbacks();
        let showCount = 0
        for (let i = 0; i < this._cardComList.length; i++) {
            const com = this._cardComList[i];
            if (com.node.active && com.node.opacity == 255) {
                showCount++
            }
        }
        /**设置图片的位置 */
        let x = (5 - showCount) * 30
        if (this._cardLayout.anchorX == 0) {
            x *= -1
        }
        this._imgQipai.x = x
        this._imgQipai.active = true
        AssetsManager.loadSpriteFrame({
            path: "res/sprite/state/languo",
            sprite: this._imgQipai.getComponent(cc.Sprite),
            bundle: Enums.bundleType.TDK
        });
    },

    /**生成一张新的牌 */
    getNewCard(parent) {
        let card = cc.instantiate(this.cardPfb)
        card.parent = parent
        let com = card.addComponent('TDKCard')
        com.init()
        return com
    },

    sendCard(arr, isAni = false, sendNode = null) {
        if (!arr) {
            return
        }
        let flyAniTime = 0.2
        let flyDelayTime = 0.15
        if (this._idx == 0 && !this._isAddClick) {
            this._isAddClick = true
            this._cardLayout.on("click", this.onLookClick, this)
        }
        if (Array.isArray(arr) && arr.length > 1) {
            this._cardArrList = arr.slice()
            for (let i = 0; i < this._cardComList.length; i++) {
                const card = arr[i];
                const com = this._cardComList[i]
                if (card || card == 0) {
                    com.flower = card
                    com.setNodeShow(true)
                    if (this._idx == 0 && i <= 1) {
                        com.setCover(true)
                    }
                    if (isAni && sendNode) {
                        com.setNodeOpacity(0)
                        let startPos = CCUtil.postionConvert(sendNode, this.node)
                        let endPos = CCUtil.postionConvert(com.node, this.node)
                        let scom = this.getNewCard(this.node)
                        scom.flower = 0
                        scom.updateNodePos(startPos)
                        scom.setNodeScale(0)
                        cc.tween(scom.node).delay(flyDelayTime * (i + 1)).to(flyAniTime, {
                            position: endPos,
                            scale: this._cardLayout.scale,
                            angle: 360,
                        }).call(() => {
                            com.setNodeOpacity(255)
                        }).removeSelf().start()
                        AssetsManager.playEffect({
                            path: 'res/audio/main/fapai',
                            bundle: Enums.bundleType.TDK
                        });
                    } else {
                        com.setNodeOpacity(255)
                    }
                } else {
                    com.setNodeShow(false)
                }
            }
        } else {
            if (typeof (arr) == "number") {
                this._cardArrList.push(arr)
                for (let i = 0; i < this._cardComList.length; i++) {
                    const com = this._cardComList[i];
                    if (!com.node.active) {
                        com.flower = arr
                        com.setNodeShow(true)
                        if (isAni && sendNode) {
                            com.setNodeOpacity(0)
                            let startPos = CCUtil.postionConvert(sendNode, this.node)
                            let endPos = CCUtil.postionConvert(com.node, this.node)
                            let scom = this.getNewCard(this.node)
                            scom.flower = 0
                            scom.updateNodePos(startPos)
                            scom.setNodeScale(0)
                            cc.tween(scom.node).to(flyAniTime, {
                                position: endPos,
                                scale: this._cardLayout.scale,
                                angle: 360,
                            }).call(() => {
                                com.setNodeOpacity(255)
                            }).removeSelf().start()
                            AssetsManager.playEffect({
                                path: 'res/audio/main/fapai',
                                bundle: Enums.bundleType.TDK
                            });
                        } else {
                            com.setNodeOpacity(255)
                        }
                        break;
                    }
                }
            }
        }
        /**设置点数文字的位置 */
        this.scheduleOnce(() => {
            let x = this._cardLayout.x
            if (this._cardLayout.anchorX == 0) {
                x += (this._cardLayout.width * this._cardLayout.scale)
            } else x -= (this._cardLayout.width * this._cardLayout.scale)
            this._txt_dianshu.node.parent.x = x
        }, 0.1)
    },

    showCard(arr, isAni = false) {
        this._cardArrList = arr.slice()
        if (this._idx == 0 && this._isAddClick) {
            this._isAddClick = false
            this._cardLayout.off("click", this.onLookClick, this)
        }
        for (let i = 0; i < this._cardComList.length; i++) {
            const card = arr[i];
            const com = this._cardComList[i]
            if (card || card == 0) {
                com.flower = card
                com.setNodeShow(true)
                com.setNodeScale(1)
                if (isAni) {
                    com.node.stopAllActions()
                    com.setCover(true)
                    cc.tween(com.node).delay(0.1 * i).to(0.1, {
                        scaleX: 0
                    }).call(() => {
                        com.setCover(false)
                    }).to(0.1, {
                        scaleX: 1
                    }).start()
                }
            }
        }
    },

    reset() {
        this._cardComList.forEach(com => {
            com.reset()
            com.setNodeShow(false)
        });
        this._cardArrList.length = 0
        this._imgQipai.active = false
        this._txt_dianshu.string = ""
        this._dianshustr = ""
        this.setMaxIcon(false)
    },



    /**获取点数之和 */
    getPointSum(isAll = false) {
        if (!this._cardArrList || this._cardArrList.length < 2) {
            return 0
        }
        let startIdx = 2
        if (isAll) {
            startIdx = 0
        }
        let arr = []
        for (let i = startIdx; i < this._cardArrList.length; i++) {
            const card = this._cardArrList[i];
            arr.push(card)
        }
        return TDKModel.getPointSum(arr)
    },

    /**设置第一个说话的标记 */
    setMaxIcon(isShow) {
        if (this._imgFirst) {
            this._imgFirst.active = isShow
        }
    },

    /**设置点数和和差值 */
    setDianshu(sum, sub, isRecord = false) {
        if (!sum || sum <= 0) {
            return
        }
        this._txt_dianshu.string = sum + ""
        if (sub != 0) {
            this._txt_dianshu.string += `(${sub})`
        }
        if (isRecord) {
            this._dianshustr = this._txt_dianshu.string
        }
    },
});