const QZMJModel = require('./QZMJModel');
const ApiQzmj = require('./ApiQzmj');
const ApiRoom = require('../../../src/api/ApiRoom');
const GameMessageRouter = 'game.gameHandler.gameMessageNotify';
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {
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

    gameInit(data) {
        this.init()
        if (data.gameStatus === ApiQzmj.gameStatus.HUANSANZHANG) {
            let uid = QZMJModel.getMyUID()
            this._opt.active = false
            if (QZMJModel.getIsHuanPai(uid) === 0) {
                this._opt.active = true
            }
            this._aniType = data.huanPaiType
            let chairCount = QZMJModel.getChairCount()
            for (let i = 0; i < chairCount; i++) {
                let showIdx = QZMJModel.getUserIndexByChairID(i)
                let node = cc.find(`${this._idxList[showIdx]}`, this._show);
                let user = QZMJModel.getUserByChairID(i);
                if (cc.isValid(node) && QZMJModel.getIsHuanPai(user.uid)) {
                    this._show.active = true;
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
        this._show.active = false
        for (let i = 0; i < this._show.children.length; i++) {
            const node = cc.find(`${i}`, this._show)
            node.stopAllActions()
            node.active = false
            node.angle = 0
            node.setPosition(0, 0)
        }
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
        for (let i = 0; i < 4; i++) {
            // let card = cc.find("" + i, this._ani0)
            // let card1 = cc.find("" + i, this._ani1)
            let card2 = cc.find("" + i, this._show)
            card2.active = false
            for (let j = 0; j < card2.children.length; j++) {
                const n2 = card2.children[j];
                let c2 = n2.addComponent('QZMJSingleTile')
                c2.init()
                this._allTiles.push(c2)
            }
            // this._roundCardNodePos.push(card.getPosition())
        }
        for (let i = 0; i < 2; i++) {
            // let card = cc.find("" + i, this._ani2)
            // for (let j = 0; j < card.children.length; j++) {
            //     const n = card.children[j];
            //     let c = n.addComponent('QZMJSingleTile)
            //     c.init()
            //     this._allTiles.push(c)
            // }
            // this._upDownCardNodePos.push(card.getPosition())
            let arrow = cc.find("arrow" + i, this._ani2)
            this._upDownArrowNodePos.push(arrow.getPosition())
        }

        let chairCount = QZMJModel.getChairCount()
        let headPos = [0, 1, 2, 3]
        if (chairCount == 2) {
            headPos = [0, 2]
        } else if (chairCount == 3) {
            headPos = [0, 1, 3]
        }
        this._idxList = headPos
    },

    /**换牌推荐 */
    onUsrHuanPaiSuggest(data) {
        // console.log("换牌推荐", data)
        if (data.chairID === QZMJModel.getMyChairID()) {
            this._opt.active = true
            this._aniType = data.huanPaiType
            this._allTiles.forEach(c => {
                c.updateBackImage()
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
        if (data.chairID === QZMJModel.getMyChairID()) {
            this._opt.active = false
            this.showAni()
        }
    },

    /**个人换牌完成 */
    onHuanPaiChoose(data) {
        if (data.chairID === QZMJModel.getMyChairID()) {
            this._opt.active = false
        }
        this._show.active = true
        let idx = QZMJModel.getUserIndexByChairID(data.chairID)
        let node = cc.find(`${this._idxList[idx]}`, this._show)
        node.active = true
    },

    /**状态检查 */
    onHuanPaiStatus(data) {
        if (data.gameStatus !== ApiQzmj.gameStatus.HUANSANZHANG) {
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
    showAni() {
        //服务器和前端的顺和逆是反的，要反着来
        if (this._aniType === ApiQzmj.huanPaiType.SHUN) {
            this._ani0.active = true
            this.roundAniPro(ApiQzmj.huanPaiType.NI, this._ani0)
        } else if (this._aniType === ApiQzmj.huanPaiType.DUI) {
            this._ani2.active = true
            this.upDownAni(this._ani2)
        } else if (this._aniType === ApiQzmj.huanPaiType.NI) {
            this._ani1.active = true
            this.roundAniPro(ApiQzmj.huanPaiType.SHUN, this._ani1)
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
            // let card = cc.find(`${i}`, pnode)
            // card.stopAllActions()
            // let cardPos = this._upDownCardNodePos[i]
            // card.setPosition(cardPos)
            let arrowEndPos = cc.v2(arrowPos.x, arrowPos.y * -1)
            // let cardEndPos = cc.v2(cardPos.x, cardPos.y * -1)
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
            // cc.tween(card).delay(0.8).to(0.8, {
            //     position: cardEndPos
            // }).delay(0.6).call(() => {
            //     pnode.active = false
            //     card.setPosition(cardPos)
            // }).start()
            for (let i = 0; i < this._show.children.length; i++) {
                let node = cc.find(`${i}`, this._show)
                if (cc.isValid(node)) {
                    if (i == 0) {
                        node.setPosition(0, 330)
                    } else if (i == 1) {
                        node.setPosition(-330, 0)
                    } else if (i == 2) {
                        node.setPosition(0, -330)
                    } else if (i == 3) {
                        node.setPosition(330, 0)
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
        // let cardNodes = []
        // let nodePos = []
        // for (let i = 0; i < 4; i++) {
        //     let n = cc.find(`${i}`, pnode)
        //     cardNodes.push(n)
        //     nodePos.push(n.getPosition())
        // }
        pnode.active = true
        let endAngle = 90
        if (type === ApiQzmj.huanPaiType.NI) {
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
        let userCount = QZMJModel.getChairCount()
        let startAngle = -90
        if (type === ApiQzmj.huanPaiType.NI) {
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
                    if ((type === ApiQzmj.huanPaiType.SHUN && i == 3) || (type === ApiQzmj.huanPaiType.NI && i == 1)) {
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