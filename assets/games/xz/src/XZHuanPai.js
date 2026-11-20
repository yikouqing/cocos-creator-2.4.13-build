const XZModel = require('./XZModel');
const ApiXz = require('./ApiXz');
const MAX_HUAN_COUNT = 3 //可以换牌的最大张数

cc.Class({
    extends: cc.Component,

    properties: {
        tilePfb0: cc.Prefab,
        tilePfb1: cc.Prefab,
        tilePfb2: cc.Prefab,
        tilePfb3: cc.Prefab,

        _ani0: null, //顺时针
        _ani1: null, //逆时针
        _ani2: null, //对家
        _show: null, //显示用牌
        _opt: null, //操作按钮
        _aniType: null, //动画的类型
        _isInit: false,
        _allTiles: [],
        _idxList: [],
    },

    // LIFE-CYCLE CALLBACKS:
    onLoad() {
        cc.systemEvent.on("gameHuanPaiNotifySuss", this.onGameHuanPaiNotifySuss, this)
    },
    onDestroy() {
        cc.systemEvent.off("gameHuanPaiNotifySuss", this.onGameHuanPaiNotifySuss, this)
    },

    init(cnum = null) {
        if (this._isInit) {
            return
        }
        this._isInit = true
        this._ani0 = cc.find("ani0", this.node)
        this._ani1 = cc.find("ani1", this.node)
        this._ani2 = cc.find("ani2", this.node)
        this._show = cc.find("show", this.node)
        this._opt = cc.find("opt", this.node)
        let btn_enter = cc.find("opt/btn_enter", this.node)
        btn_enter.on("click", this.onBtnEnter, this)

        let chairCount = XZModel.getChairCount()
        if (!!cnum) {
            chairCount = cnum
        }
        let headPos = [0, 1, 2, 3]
        if (chairCount == 2) {
            headPos = [0, 2]
        } else if (chairCount == 3) {
            headPos = [0, 1, 3]
        }
        this._idxList = headPos

        for (let i = 0; i < headPos.length; i++) {
            let idx = headPos[i]
            let card2 = cc.find("" + idx, this._show)
            let list = []
            for (let j = 0; j < MAX_HUAN_COUNT; j++) {
                const n2 = card2.getChildByName("lay")
                let tileNode = cc.instantiate(this["tilePfb" + idx])
                tileNode.parent = n2
                let c2 = tileNode.addComponent('XZSingleTile')
                c2.init()
                c2.setCover(true)
                list.push(c2)
            }
            this._allTiles.push(list)
            card2.active = false
        }
    },

    gameInit(data) {
        this.init()
        if (data.gameStatus === ApiXz.gameStatus.HUANSANZHANG) {
            let myChairID = XZModel.getMyChairID()
            this._opt.active = false
            if (XZModel.getIsHuanPai(myChairID) === 0) {
                this._opt.active = true
            }
            this._aniType = data.huanPaiType

            let chairCount = XZModel.getChairCount()
            for (let i = 0; i < chairCount; i++) {
                let showIdx = XZModel.getUserChairIndex(i)
                let node = cc.find(`${this._idxList[showIdx]}`, this._show)
                if (cc.isValid(node) && XZModel.getIsHuanPai(i) !== 0) {
                    this._show.active = true
                    node.active = true
                    node.stopAllActions()
                    node.angle = 0
                    node.setPosition(0, 0)
                }
            }
        } else {
            this.reset()
        }
    },

    reset() {
        if (!this._isInit) return
        this._show.active = false
        for (let i = 0; i < this._show.children.length; i++) {
            const node = cc.find(`${i}`, this._show)
            node.stopAllActions()
            node.active = false
            node.angle = 0
            node.setPosition(0, 0)
        }
        this._ani0.active = false
        this._ani1.active = false
        this._ani2.active = false
    },



    /**换牌推荐 */
    onUsrHuanPaiSuggest(data) {
        // console.log("换牌推荐", data)
        if (data.chairID === XZModel.getMyChairID()) {
            this._opt.active = true
            this._aniType = data.huanPaiType
            this._allTiles.forEach(list => {
                list.forEach(c => {
                    c.updateBackImage()
                })
            });
            for (let i = 0; i < this._show.children.length; i++) {
                const node = cc.find(`${i}`, this._show)
                node.stopAllActions()
                node.active = false
                node.angle = 0
                node.setPosition(0, 0)
            }
        }
    },

    /**换牌完成 */
    onHuanPaiEnd(data) {
        // console.log("换牌完成", data)
        if (data.chairID === XZModel.getMyChairID()) {
            this._opt.active = false
            this.showAni(this._aniType)
        }
    },

    /**个人换牌完成 */
    onHuanPaiChoose(data) {
        if (data.chairID === XZModel.getMyChairID()) {
            this._opt.active = false
        }
        let count = data.cardList.length //换牌的张数
        this._show.active = true
        let idx = XZModel.getUserChairIndex(data.chairID)
        let node = cc.find(`${this._idxList[idx]}`, this._show)
        node.active = true
        this.showUserTile(idx, count)
    },

    showUserTile(idx, count) {
        let list = this._allTiles[idx]
        // console.log("i", idx, list)
        list.forEach(c => {
            c.updateBackImage()
            c.setNodeShow(count > 0)
            // console.log("设置显示==", count, c.node.active, c.node.parent.active, c.node.parent.parent.active)
            count--
        });
    },

    /**回放换牌设置 */
    setReviewHuanPaiChoose(idx, cardList) {
        this._show.active = true
        let comList = this._allTiles[idx]
        for (let i = 0; i < comList.length; i++) {
            const com = comList[i];
            let id = cardList[i]
            if (id || id == 0) {
                com.flower = id
                com.node.parent.active = true
                com.node.parent.parent.active = true
            } else {
                com.setNodeShow(false)
            }
        }
    },

    /**状态检查 */
    onHuanPaiStatus(data) {
        if (data.gameStatus !== ApiXz.gameStatus.HUANSANZHANG) {
            this._opt.active = false
        }
    },

    onBtnEnter() {
        cc.systemEvent.emit("enterHuanPai")
    },

    onGameHuanPaiNotifySuss() {
        this._opt.active = false
    },

    /**展示动画 */
    showAni(aniType) {
        //服务器和前端的顺和逆是反的，要反着来
        if (aniType === ApiXz.huanPaiType.SHUN) {
            this._ani0.active = true
            this.roundAniPro(ApiXz.huanPaiType.NI, this._ani0)
        } else if (aniType === ApiXz.huanPaiType.DUI) {
            this._ani2.active = true
            this.upDownAni(this._ani2)
        } else if (aniType === ApiXz.huanPaiType.NI) {
            this._ani1.active = true
            this.roundAniPro(ApiXz.huanPaiType.SHUN, this._ani1)
        }
    },

    /**
     * 上下动画
     * @param {*} pnode 父节点
     */
    upDownAni(pnode) {
        pnode.active = true
        pnode.stopAllActions()
        cc.tween(pnode).delay(1.3).call(() => {
            pnode.active = false
        }).start()
        for (let i = 0; i < 2; i++) {
            /**牌 */
            for (let i = 0; i < this._show.children.length; i++) {
                let node = cc.find(`${i}`, this._show)
                if (cc.isValid(node)) {
                    if (i == 0) {
                        node.setPosition(0, 480)
                    } else if (i == 1) {
                        node.setPosition(-490, 0)
                    } else if (i == 2) {
                        node.setPosition(0, -480)
                    } else if (i == 3) {
                        node.setPosition(490, 0)
                    }
                    cc.tween(node).delay(0.8).to(0.8, {
                        position: cc.v2(0, 0)
                    }).delay(0.6).call(() => {
                        node.active = false
                    }).start()
                }
            }
        }
    },

    /**
     * 圆形动画
     * @param {*} type 顺时针或者逆时针
     */
    roundAniPro(type, pnode) {
        pnode.active = true
        cc.tween(pnode).delay(1.3).call(() => {
            pnode.active = false
        }).start()

        /**牌动画 */
        this._show.active = true
        let userCount = XZModel.getChairCount()
        let startAngle = -90
        if (type === ApiXz.huanPaiType.NI) {
            startAngle = 90
        }
        for (let i = 0; i < this._show.children.length; i++) {
            const node = cc.find(`${i}`, this._show)
            if (!node || !node.active) {
                continue;
            }
            node.stopAllActions()
            cc.tween(node).delay(1.2).call(() => {
                node.angle = startAngle
                if (userCount == 3) {
                    if ((type === ApiXz.huanPaiType.SHUN && i == 3) || (type === ApiXz.huanPaiType.NI && i == 1)) {
                        node.angle = startAngle * 2
                    }
                }
            }).to(0.6, {
                angle: 0
            }).delay(0.6).call(() => {
                node.active = false
            }).start()
        }
    },
});