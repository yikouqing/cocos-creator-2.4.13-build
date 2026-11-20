const RCSSGModel = require('./RCSSGModel');
const ApiRcssg = require('./ApiRcssg');
const MAX_HUAN_COUNT = 5 //可以换牌的最大张数

cc.Class({
    extends: cc.Component,

    properties: {
        tilePfb0: cc.Prefab,
        tilePfb1: cc.Prefab,
        tilePfb2: cc.Prefab,
        tilePfb3: cc.Prefab,
        txt_tip: cc.Label,

        _ani0: null, //顺时针
        _ani1: null, //逆时针
        _ani2: null, //对家
        _show: null, //显示用牌
        _opt: null, //操作按钮
        _aniType: null, //动画的类型
        _roundCardNodePos: [], //圆形动画的牌初始节点
        _upDownCardNodePos: [], //上下动画的牌初始节点
        _upDownArrowNodePos: [], //上下动画箭头的初始节点
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

    init() {
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

        let chairCount = RCSSGModel.getChairCount()
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
                let c2 = tileNode.addComponent('RCSSGSingleTile')
                c2.init()
                c2.setCover(true)
                list.push(c2)
            }
            this._allTiles.push(list)
            card2.active = false
        }
        for (let i = 0; i < 2; i++) {
            let arrow = cc.find("arrow" + i, this._ani2)
            this._upDownArrowNodePos.push(arrow.getPosition())
        }
    },

    gameInit(data) {
        this.init()
        if (data.gameStatus === ApiRcssg.gameStatus.HUANSANZHANG) {
            this._opt.active = false
            let huanpai = RCSSGModel.getGameRuleByKey("huanpai")
            if (huanpai == 1 || RCSSGModel.getMyUID() == RCSSGModel.getBankerUid()) {
                if (!RCSSGModel.getIsHuanPai(RCSSGModel.getMyChairID())) {
                    this._opt.active = true
                }
            } else if (huanpai == 2) {
                if (!RCSSGModel.getIsHuanPai(RCSSGModel.getMyChairID()) && RCSSGModel.getIsHuanPai(RCSSGModel.getBankerChairID())) {
                    this._opt.active = true
                }
            }
            if (this._opt.active) this.setTipText()
            this._aniType = data.huanPaiType
            let chairCount = RCSSGModel.getChairCount()
            let huanCount = RCSSGModel.getMaxHuanPaiCount()
            for (let i = 0; i < chairCount; i++) {
                let showIdx = RCSSGModel.getUserIndexByChairID(i)
                let node = cc.find(`${this._idxList[showIdx]}`, this._show)
                if (cc.isValid(node) && RCSSGModel.getIsHuanPai(i)) {
                    this._show.active = true
                    node.active = true
                    node.stopAllActions()
                    node.angle = 0
                    node.setPosition(0, 0)
                    this.showUserTile(showIdx, huanCount)
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
        if (data.uid === RCSSGModel.getMyUID()) {
            this._opt.active = true
            this._aniType = data.huanPaiType
            this._allTiles.forEach(list => {
                list.forEach(c => {
                    c.updateBackImage()
                })
            });
            this.setTipText()
        }
    },

    /**设置文字 */
    setTipText() {
        let huanCount = RCSSGModel.getMaxHuanPaiCount()
        let huanType = RCSSGModel.getGameRuleByKey("huanpai")
        let str = "请选择三张同花色的牌！"
        if (huanType == 2) {
            if (RCSSGModel.getBankerUid() == RCSSGModel.getMyUID()) {
                str = `请选择1-${huanCount}张同花色的牌！`
            } else
                str = `请选择${huanCount}张同花色的牌！`
        }
        this.txt_tip.string = str
    },

    /**换牌结束 */
    onHuanPaiEnd(data) {
        if (data.uid === RCSSGModel.getMyUID()) {
            // console.log("换牌完成", data)
            this._opt.active = false
            this.showAni(this._aniType)
        }
    },

    /**个人换牌完成 */
    onHuanPaiChoose(data) {
        if (data.uid === RCSSGModel.getMyUID()) {
            this._opt.active = false
        }
        let count = data.cardList.length //换牌的张数
        this._show.active = true
        let idx = RCSSGModel.getUserIndexByUID(data.uid)
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

    /**状态检查 */
    onHuanPaiStatus(data) {
        if (data.gameStatus !== ApiRcssg.gameStatus.HUANSANZHANG) {
            this._opt.active = false
        }
    },

    onBtnEnter() {
        cc.systemEvent.emit("enterHuanPai")
    },

    onGameHuanPaiNotifySuss() {
        this._opt.active = false
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

    /**展示动画 */
    showAni(type) {
        //服务器和前端的顺和逆是反的，要反着来
        if (type === ApiRcssg.huanPaiType.SHUN) {
            this._ani0.active = true
            this.roundAniPro(ApiRcssg.huanPaiType.NI, this._ani0)
        } else if (type === ApiRcssg.huanPaiType.DUI) {
            this._ani2.active = true
            this.upDownAni(this._ani2)
        } else if (type === ApiRcssg.huanPaiType.NI) {
            this._ani1.active = true
            this.roundAniPro(ApiRcssg.huanPaiType.SHUN, this._ani1)
        }
    },

    /**
     * 上下动画
     * @param {*} pnode 父节点
     */
    upDownAni(pnode) {
        pnode.active = true
        pnode.stopAllActions()
        for (let i = 0; i < 2; i++) {
            let arrow = cc.find(`arrow${i}`, pnode)
            arrow.stopAllActions()
            let arrowPos = this._upDownArrowNodePos[i]
            arrow.opacity = 255
            arrow.setPosition(arrowPos)
            let arrowEndPos = cc.v2(arrowPos.x, arrowPos.y * -1)
            /**箭头 */
            cc.tween(arrow).to(0.3, {
                opacity: 0
            }).to(0.3, {
                opacity: 255
            }).delay(0.2).to(0.8, {
                position: arrowEndPos
            }).delay(0.6).call(() => {
                pnode.active = false
                arrow.setPosition(arrowPos)
            }).start()
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
        let arrow = cc.find("arrow", pnode)
        arrow.opacity = 255
        arrow.angle = 0
        pnode.active = true
        let endAngle = 90
        if (type === ApiRcssg.huanPaiType.NI) {
            endAngle = -90
        }
        /**箭头转动 */
        cc.tween(arrow).to(0.3, {
            opacity: 0
        }).to(0.3, {
            opacity: 255
        }).union().repeat(2).to(0.6, {
            angle: endAngle
        }).delay(0.6).call(() => {
            pnode.active = false
            arrow.angle = 0
        }).start()

        /**牌动画 */
        this._show.active = true
        let userCount = RCSSGModel.getChairCount()
        let startAngle = -90
        if (type === ApiRcssg.huanPaiType.NI) {
            startAngle = 90
        }
        for (let i = 0; i < this._show.children.length; i++) {
            const node = cc.find(`${i}`, this._show)
            if (!node || !node.active) {
                continue;
            }
            cc.tween(node).delay(1.2).call(() => {
                node.angle = startAngle
                if (userCount == 3) {
                    if ((type === ApiRcssg.huanPaiType.SHUN && i == 3) || (type === ApiRcssg.huanPaiType.NI && i == 1)) {
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