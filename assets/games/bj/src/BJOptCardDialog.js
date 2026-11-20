const BJLogic = require('./BJLogic');
const BJModel = require('./BJModel');
const Enums = require('../../../src/const/Enums');
const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const Configs = require('../../../src/const/Configs');
const ApiBj = require('./ApiBj');

let TOU_COUNT = 3,
    ZHONG_COUNT = 3,
    WEI_COUNT = 3,
    CARD_COUNT = 9

cc.Class({
    extends: cc.Component,

    properties: {
        btn_cancel1: cc.Node,
        btn_cancel2: cc.Node,
        btn_cancel3: cc.Node,
        btn_auto: cc.Node,
        btn_qipai: cc.Node,
        btn_daxiao: cc.Node,
        btn_huase: cc.Node,
        layout_up1: cc.Node,
        layout_up2: cc.Node,
        layout_up3: cc.Node,
        cardType1: cc.Sprite,
        cardType2: cc.Sprite,
        cardType3: cc.Sprite,
        txt_time: cc.Label,

        cardTypeBtns: cc.Node,
        downBtnLayout: cc.Node,
        layout_handCards: cc.Node,
        upNode: cc.Node,
        maskNode: cc.Node,

        cardPfb: cc.Prefab,

        flyNode: cc.Node,

        /**手牌 */
        _handComList: [],
        /**头中尾道牌 */
        _touIdxList: [],
        _zhongIdxList: [],
        _weiIdxList: [],
        /**牌抬起来的偏移 */
        _upY: 30,
        _selectCardIdx: -1,
        _tick: 0,
        /**当前排序模式 1大小 2花色 */
        _curSortType: -1,
        /**是否正在排序 中 */
        _isInSorting: false,
        _checkTime: 0,
        _isInAni: false,
    },

    onLoad() {
        BJLogic.init(BJModel.getGameRule())
        let addClick = (node) => {
            node.on("click", this.btnClickCallFunc, this)
        }
        this.cardTypeBtns.children.forEach(btnNode => {
            addClick(btnNode)
        });
        this.downBtnLayout.children.forEach(btnNode => {
            addClick(btnNode)
        });
        addClick(this.btn_cancel1)
        addClick(this.btn_cancel2)
        addClick(this.btn_cancel3)
        addClick(this.layout_up1.parent)
        addClick(this.layout_up2.parent)
        addClick(this.layout_up3.parent)
        addClick(this.btn_auto)
        addClick(this.btn_qipai)
        addClick(this.btn_daxiao)
        addClick(this.btn_huase)
    },

    start() {
        let data = this.node.nodeParams;
        /**提示的数据 */
        this._tipList = {};
        this._tipIdxList = {};
        /**初始化界面 */
        this.btn_cancel1.active = false
        this.btn_cancel2.active = false
        this.btn_cancel3.active = false
        this.cardType1.node.active = false
        this.cardType2.node.active = false
        this.cardType3.node.active = false
        this.downBtnLayout.active = false
        this.init(data)
    },

    getNewCard(id, parent, name = "") {
        let cardNode = cc.instantiate(this.cardPfb)
        cardNode.parent = parent
        cardNode.name = name
        let com = cardNode.addComponent('BJCard')
        com.init()
        com.setNodeShow(true)
        com.flower = id
        return com
    },

    /**初始化 */
    init(data) {
        this.flyNode.removeAllChildren()
        /**显示牌 */
        this._handCardArr = data.handCards
        this.sortCard(1, true)
        let isAni = data.isAni || false
        for (let i = 0; i < this._handCardArr.length; i++) {
            const id = this._handCardArr[i];
            let com = this.getNewCard(id, this.layout_handCards, i + "")
            if (isAni) {
                com.setNodeOpacity(0)
            }
            this._handComList.push(com)
        }
        if (isAni) {
            this.scheduleOnce(() => {
                this.sendCardsAni()
            })
        } else {
            this.addMoveAndEndEvent()
            this.cardTypeBtns.active = true
            this.upNode.active = true
            this.maskNode.active = true
            this.btn_daxiao.active = false
            this.btn_huase.active = true
        }

        /**显示牌型按钮 */
        this.setTypeButton()
        /**显示倒计时 */
        this.setClock(data.tick)
        this.btn_auto.active = false
        this._autoCards = BJLogic.getAutoCards(this._handCardArr.slice())
        this.scheduleOnce(() => {
            this.btn_auto.active = true
        }, 0.2)
    },

    /**给手牌排序 1 按大小  2按花色 */
    sortCard(type, isInit = false) {
        if (this._isInSorting) {
            AssetsManager.tipDialog("正在排序中,请勿频繁点击")
            return
        }
        if (this._curSortType == type) {
            return
        }
        this._curSortType = type
        this._isInSorting = true
        /**排序之前需要收集当前显示中的手牌id  以及放到上面的手牌的id */
        let handShowIdList = []
        if (!isInit) {
            for (let i = 0; i < this._handComList.length; i++) {
                const com = this._handComList[i];
                if (com.node.active) {
                    handShowIdList.push(com.flower)
                }
            }
        }

        let handCards = this._handCardArr.slice()
        handCards.sort((a, b) => a - b)
        let group = []
        if (type == 1) {
            group = BJLogic.getGroupByPoint(handCards)
        } else if (type == 2) {
            group = BJLogic.getGroupByColor(handCards)
        }
        let wangList = BJLogic.getCardsJoker(handCards)
        let paixu = []
        for (const point in group) {
            if (Object.hasOwnProperty.call(group, point)) {
                paixu = paixu.concat(group[point])
            }
        }
        paixu = paixu.reverse()
        if (wangList.length > 0) {
            paixu = paixu.concat(wangList)
        }
        this._handCardArr = paixu
        if (!isInit) {
            /**排序之后需要重新刷新显示中的手牌 更新放在上面的手牌的idx */
            for (let i = 0; i < this._handCardArr.length; i++) {
                const id = this._handCardArr[i];
                const com = this._handComList[i]
                com.flower = id
                com.node.name = i + ""
                this.cardUpOrDown(com, 2)
                if (handShowIdList.includes(id)) {
                    com.setNodeShow(true)
                } else {
                    com.setNodeShow(false)
                }
            }

            let checkUp = (idxList, layout) => {
                idxList.length = 0
                let coms = layout.children.map(node => node.getComponent('BJCard'))
                for (let i = 0; i < coms.length; i++) {
                    const com = coms[i]
                    let idx = this._handCardArr.indexOf(com.flower)
                    idxList.push(idx)
                    let narr = com.node.name.split("_")
                    com.node.name = narr[0] + "_" + idx
                }
            }
            checkUp(this._touIdxList, this.layout_up1)
            checkUp(this._zhongIdxList, this.layout_up2)
            checkUp(this._weiIdxList, this.layout_up3)
        }
        this.scheduleOnce(() => {
            if (!isInit) {
                this.btn_daxiao.active = this._curSortType == 2
                this.btn_huase.active = this._curSortType == 1
            }
            this._isInSorting = false
        }, 0.1)
    },

    /**发牌动画 */
    sendCardsAni() {
        let flyTime = [0.4, 0.35, 0.3, 0.25, 0.2, 0.28, 0.35, 0.45, 0.55]
        let cardIdList = Utils.shuffle(this._handCardArr.slice())
        let aniComList = []

        this.cardTypeBtns.active = false
        this.upNode.active = false
        this.maskNode.active = false
        this.btn_daxiao.active = false
        this.btn_huase.active = false

        for (let i = 0; i < cardIdList.length; i++) {
            const id = cardIdList[i];
            let com = this.getNewCard(id, this.layout_handCards.parent)
            com.setNodeScale(this.layout_handCards.scale)
            aniComList.push(com)
            let endCom = this._handComList[i]
            let endPos = CCUtil.postionConvert(endCom.node, this.layout_handCards.parent)
            cc.tween(com.node).delay(0.01 * i).to(flyTime[i], {
                position: endPos
            }, {
                easing: "quadOut"
            }).start()
        }
        this.scheduleOnce(() => {
            AssetsManager.playEffect({
                path: "res/audio/fapai",
                bundle: Enums.bundleType.BJ
            });
            for (let i = 0; i < aniComList.length; i++) {
                const com = aniComList[i];
                com.flower = this._handCardArr[i]
                com.setCover(true)
                const hcom = this._handComList[i]
                cc.tween(com.node).delay(0.05 * i).to(0.1, {
                    scaleX: 0
                }).call(() => {
                    com.setCover(false)
                }).to(0.1, {
                    scaleX: com.node.scaleX
                }).call(() => {
                    hcom.setNodeOpacity(255)
                    if (i == this._handComList.length - 1) {
                        this.scheduleOnce(() => {
                            this.addMoveAndEndEvent()
                            /**显示其他模块 */
                            this.cardTypeBtns.active = true
                            this.upNode.active = true
                            this.maskNode.active = true
                            this.btn_daxiao.active = false
                            this.btn_huase.active = true
                        }, 1)
                    }
                }).removeSelf().start()
            }
        }, 0.56)
    },

    /**设置牌型按钮 */
    setTypeButton() {
        var chooseArr = this.getRestCardArr();
        let btns = this.cardTypeBtns.children
        if (chooseArr.length <= 0) {
            btns.forEach(node => {
                node.getComponent(cc.Button).interactable = false
            });
            this._tipList = {}
            return;
        }

        this.updateTipList()
        for (let i = ApiBj.cardType.DUI; i <= ApiBj.cardType.SANTIAO; i++) {
            let btn = cc.find("btn_" + i, this.cardTypeBtns)
            if (btn) {
                btn.getComponent(cc.Button).interactable = !!this._tipList[i]
            }
        }
    },

    /**更新提示数据 */
    updateTipList() {
        var chooseArr = this.getRestCardArr();
        if (chooseArr.length <= 0) {
            this._tipIdxList = {}
            this._tipList = {}
            return;
        }
        let tips = BJLogic.getCardTypeList(chooseArr);
        this._tipList = tips
        this._tipIdxList = {}
        for (const key in this._tipList) {
            if (Object.hasOwnProperty.call(this._tipList, key)) {
                this._tipIdxList[key] = 0
            }
        }
    },

    setClock(t) {
        if (BJModel.getGameRuleByKey("liPaiTime") == 0) {
            this._tick = -1
            this.txt_time.node.parent.active = false
        } else {
            this.txt_time.node.parent.active = true
            this._tick = Math.floor(t)
            this.txt_time.string = this._tick + ""
        }
    },

    /**给牌添加点击响应 */
    addMoveAndEndEvent() {
        this.layout_handCards.on(cc.Node.EventType.TOUCH_END, this.onTouchCardEnd, this);
        this.layout_handCards.on(cc.Node.EventType.TOUCH_START, this.onTouchCardStart, this);
        this.layout_handCards.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.layout_handCards.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchCardEnd, this);
    },

    onTouchCardStart(event, param) {
        this.touchStartPos = event.touch.getLocation()
    },
    onTouchMove(event, param) {
        this.checkChooseCard(event, 1)
    },
    onTouchCardEnd(event, param) {
        this.checkChooseCard(event, 2)
        AssetsManager.playEffect({
            path: "res/audio/main/sound_select_card",
            bundle: Enums.bundleType.BJ
        });
    },

    /**获取矩形 */
    getTouchRect(curPos) {
        let width = Math.abs(this.touchStartPos.x - curPos.x)
        width = width <= 2 ? 2 : width
        let x = this.touchStartPos.x,
            y = this.touchStartPos.y
        if (this.touchStartPos.x > curPos.x) {
            x -= width
        }
        return cc.rect(x, y, width, 2)
    },

    /**获取当前显示中牌的idx */
    getShowCardIdxs() {
        let tmp = []
        for (let i = 0; i < this._handComList.length; i++) {
            const com = this._handComList[i];
            if (com.node.active) {
                tmp.push(i)
            }
        }
        return tmp
    },

    /**判断牌的滑动抬起和放下 */
    checkChooseCard(event, type) {
        let rect1 = this.getTouchRect(event.touch.getLocation())
        let showIdxList = this.getShowCardIdxs()
        for (let i = 0; i < showIdxList.length; ++i) {
            let com = this._handComList[showIdxList[i]];
            if (!com.node.active) {
                continue;
            }
            let rect2 = CCUtil.getBoundingBoxToWorldWithoutChildren(com.node)
            let com2 = this._handComList[showIdxList[i + 1]]
            if (com2 && com2.node.active) {
                rect2.width += this.layout_handCards.getComponent(cc.Layout).spacingX
            }
            let intersect = rect1.intersects(rect2)
            if (type == 1) {
                let isBianhua = com.setGray(intersect)
                if (isBianhua) {
                    AssetsManager.playEffect({
                        path: "res/audio/main/sound_select_card",
                        bundle: Enums.bundleType.BJ
                    });
                }
            } else if (type == 2) {
                if (intersect) {
                    this.cardUpOrDown(com)
                    this.onTouchCard(null, showIdxList[i])
                }
            }
        }
    },

    /**点击牌 交换上下牌的位置 */
    onTouchCard(event, param) {
        var i = param
        if (typeof (param) == "string") {
            i = parseInt(param)
        }
        if (i < 0 || i >= CARD_COUNT || param == null) {
            return;
        }

        if (this.getCardIsUp(i) && this._selectCardIdx !== -1) {
            let layout = this.layout_up1
            let jharr = this._touIdxList
            let jhname = "t"
            if (this._zhongIdxList.includes(this._selectCardIdx)) {
                layout = this.layout_up2
                jharr = this._zhongIdxList
                jhname = "z"
            } else if (this._weiIdxList.includes(this._selectCardIdx)) {
                layout = this.layout_up3
                jharr = this._weiIdxList
                jhname = "w"
            }
            this.jiaoHuanUpDownCard(layout, jharr, jhname, this._selectCardIdx)
        }
    },

    /**
     * 单个牌被抬起或者放下
     * @param {cardNodeCom} com 牌脚本
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

    /* 获取剩余的牌 */
    getRestCardArr(isindex = false) {
        var chooseArr = [];
        var i, canInsert;
        if (!this._handCardArr) {
            // console.error("没有手牌==", this._handCardArr)
            return
        }
        for (i = 0; i < this._handCardArr.length; ++i) {
            canInsert = true;
            if (this._touIdxList.length > 0 && this._touIdxList.indexOf(i) !== -1) {
                canInsert = false;
            }
            if (this._zhongIdxList.length > 0 && this._zhongIdxList.indexOf(i) !== -1) {
                canInsert = false;
            }
            if (this._weiIdxList.length > 0 && this._weiIdxList.indexOf(i) !== -1) {
                canInsert = false;
            }
            if (canInsert) {
                if (isindex) {
                    chooseArr.push(i);
                } else {
                    chooseArr.push(this._handCardArr[i]);
                }

            }
        }
        return chooseArr;
    },


    checkAndResetCard() {
        this._handComList.forEach(com => {
            this.cardUpOrDown(com, 2)
        });
        this.checkIsCanShowCard()
        this.resetUpCard()
    },

    /**上面牌的选中响应 */
    onClickUpCard(event, param) {
        let n = event.node.name.split("_")
        let idx = parseInt(n[1])
        let layout = this.layout_up1
        let arr = this._touIdxList
        if (n[0] === "z") {
            layout = this.layout_up2
            arr = this._zhongIdxList
        } else if (n[0] === "w") {
            layout = this.layout_up3
            arr = this._weiIdxList
        }
        /**找出点击的那张牌 */
        let children = layout.children
        let cardNode = children.find(c => {
            let list = c.name.split("_")
            let i = parseInt(list[1])
            return i == idx
        })
        let cardCom = cardNode.getComponent('BJCard')
        if (idx !== this._selectCardIdx && this._selectCardIdx !== -1) {
            /**交换牌 */
            /**找出需要交换的那张牌 */
            /**同一道无法交换 */
            if (arr.includes(this._selectCardIdx)) {
                return
            }
            let jhlayout = this.layout_up1
            let jharr = this._touIdxList
            let jhname = "t"
            if (this._zhongIdxList.includes(this._selectCardIdx)) {
                jhlayout = this.layout_up2
                jharr = this._zhongIdxList
                jhname = "z"
            } else if (this._weiIdxList.includes(this._selectCardIdx)) {
                jhlayout = this.layout_up3
                jharr = this._weiIdxList
                jhname = "w"
            }
            let del = arr.indexOf(idx)
            arr.splice(del, 1, this._selectCardIdx)
            del = jharr.indexOf(this._selectCardIdx)
            jharr.splice(del, 1, idx)
            this._selectCardIdx = -1
            /**刷新两道的牌 */
            this.updateUpCard(layout, arr, n[0])
            this.updateUpCard(jhlayout, jharr, jhname)
        } else if (idx === this._selectCardIdx) {
            /**取消选中 */
            this._selectCardIdx = -1
            cardCom.setGray(false)
        } else if (this._selectCardIdx === -1) {
            /**如果有下方选中的牌，交换两个牌的位置 */
            if (this.jiaoHuanUpDownCard(layout, arr, n[0], idx)) {
                return
            }
            /**选中牌置灰 */
            this._selectCardIdx = idx
            cardCom.setGray(true)
        }
    },

    // 根据牌设置牌型
    setTypeNameByCards(arr, sprite) {
        var array = [];
        for (var i = 0; i < arr.length; ++i) {
            array.push(this._handCardArr[arr[i]]);
        }
        var url = this.getTypeUrlByCardArr(array);
        AssetsManager.loadSpriteFrame({
            path: url,
            sprite: sprite,
            bundle: Enums.bundleType.BJ
        });
        sprite.node.active = true;
    },

    /**获取牌型图片的url */
    getTypeUrlByCardArr(array) {
        let typeRes = BJLogic.getCardType(array);
        let url = 'res/sprite/cardType/t_' + typeRes.type
        return url;
    },

    /**剩余牌自动填充 */
    restCardAutoFill() {
        var canFill = false,
            restCardArr, i, name;
        if (this._touIdxList.length === TOU_COUNT && this._zhongIdxList.length === ZHONG_COUNT) {
            canFill = true;
            name = "w"
        }
        if (this._touIdxList.length === TOU_COUNT && this._weiIdxList.length === WEI_COUNT) {
            canFill = true;
            name = "z"
        }
        if (this._zhongIdxList.length === ZHONG_COUNT && this._weiIdxList.length === WEI_COUNT) {
            canFill = true;
            name = "t"
        }
        if (this._touIdxList.length + this._zhongIdxList.length + this._weiIdxList.length === TOU_COUNT + ZHONG_COUNT + WEI_COUNT) {
            canFill = false;
        }
        if (canFill) {
            restCardArr = this.getRestCardArr();
            for (i = 0; i < this._handCardArr.length; ++i) {
                if (restCardArr.indexOf(this._handCardArr[i]) !== -1) {
                    let com = this._handComList[i]
                    this.cardUpOrDown(com, 1)
                }
            }
            this.onClickUpDao(name);
            this.scheduleOnce(() => {
                if (!this.verifySortCard(true)) {
                    let sanDaoPai = [{
                        idxList: this._touIdxList.slice(),
                        type: 0,
                        point: 0,
                    },
                    {
                        idxList: this._zhongIdxList.slice(),
                        type: 0,
                        point: 0,
                    },
                    {
                        idxList: this._weiIdxList.slice(),
                        type: 0,
                        point: 0,
                    }
                    ]
                    for (let i = 0; i < sanDaoPai.length; i++) {
                        const list = sanDaoPai[i].idxList;
                        let idarr = []
                        for (let j = 0; j < list.length; ++j) {
                            idarr.push(this._handCardArr[list[j]]);
                        }
                        if (idarr.length != 3) { //需要3道牌都满足条件
                            return
                        }
                        let cardType = BJLogic.getCardType(idarr)
                        if (!sanDaoPai[i] || !cardType) {
                            return
                        }
                        sanDaoPai[i] = Object.assign(sanDaoPai[i], cardType)
                    }
                    /**排序 */
                    sanDaoPai.sort((a, b) => a.point - b.point)
                    sanDaoPai.sort((a, b) => a.type - b.type)
                    this._touIdxList = sanDaoPai[0].idxList
                    this._zhongIdxList = sanDaoPai[1].idxList
                    this._weiIdxList = sanDaoPai[2].idxList
                    this.updateUpCard(this.layout_up1, this._touIdxList, "t")
                    this.updateUpCard(this.layout_up2, this._zhongIdxList, "z")
                    this.updateUpCard(this.layout_up3, this._weiIdxList, "w")
                    AssetsManager.tipDialog("摆牌顺序错误，已为您自动调整")
                }
            }, 0.5)
        }
    },

    /**
     * 刷新某一道的牌
     * @param {cc.Node} layout 父节点
     * @param {Array<number>} cardIdxArr 牌的idx数组
     * @param {string} name 节点名字
     */
    updateUpCard(layout, cardIdxArr, name) {
        this.updateTipList()
        layout.removeAllChildren()
        let cardCount = 3
        if (cardIdxArr.length == cardCount) {
            let cardIdarr = []
            for (let i = 0; i < this._handCardArr.length; i++) {
                const id = this._handCardArr[i];
                if (cardIdxArr.includes(i)) {
                    cardIdarr.push(id)
                }
            }
            let paixu = BJLogic.typeCardsSortByScores(cardIdarr, true)
            let tmp = []
            for (let i = 0; i < paixu.length; i++) {
                let idx = this._handCardArr.indexOf(paixu[i])
                tmp.push(idx)
            }
            if (tmp.length == cardIdxArr.length) {
                cardIdxArr = tmp
            }
        }

        let isAni = new Array(cardIdxArr.length).fill(true)
        let endComList = []
        for (i = 0; i < cardIdxArr.length; ++i) {
            let hcom = this._handComList[cardIdxArr[i]]

            if (!hcom.node.active) {
                isAni[i] = false
            }

            if (!isAni[i]) {
                hcom.setNodeShow(false)
            } else {
                hcom.setNodeOpacity(0)
            }
            let node = cc.instantiate(this.cardPfb)
            let com = node.addComponent('BJCard')
            com.init()
            let id = this._handCardArr[cardIdxArr[i]]
            com.flower = id
            node.name = name + "_" + cardIdxArr[i]
            node.parent = layout;
            /**添加牌的点击事件 */
            node.addComponent(cc.Button)
            node.on("click", this.onClickUpCard, this)
            if (isAni[i]) {
                com.setNodeOpacity(0)
            }
            endComList.push(com)
        }
        if (isAni.includes(true)) {
            this.scheduleOnce(() => {
                for (let i = 0; i < cardIdxArr.length; i++) {
                    if (isAni[i]) {
                        let id = this._handCardArr[cardIdxArr[i]]
                        let hcom = this._handComList[cardIdxArr[i]]
                        let com = this.getNewCard(id, this.flyNode)
                        com.setNodeScale(this.layout_handCards.scale)
                        let startPos = CCUtil.postionConvert(hcom.node, this.flyNode)
                        com.updateNodePos(startPos)
                        let endCom = endComList[i]
                        let endPos = CCUtil.postionConvert(endCom.node, this.flyNode)
                        cc.tween(com.node).delay(0.05 * i).to(0.2, {
                            position: endPos,
                            scale: layout.scale
                        }).call(() => {
                            hcom.setNodeShow(false)
                            hcom.setNodeOpacity(255)
                            endCom.setNodeOpacity(255)
                            endCom.setNodeShow(true)
                        }).removeSelf().start()
                    }
                }
            })
        }

        let typeSprite = this.cardType1
        if (name === "z") {
            typeSprite = this.cardType2
        } else if (name === "w") {
            typeSprite = this.cardType3
        }
        let tmp = WEI_COUNT
        if (name === "t") {
            tmp = TOU_COUNT
        }
        if (cardIdxArr.length === tmp) {
            this.setTypeNameByCards(cardIdxArr, typeSprite);
        }
    },

    /**
     * 交换上下的牌
     * @param {cc.Node} layout 父节点
     * @param {Array<number>} cardIdxArr 牌的idx数组
     * @param {string} name 节点名字
     * @param {number} upCardIdx 选中的上面的牌
     * @returns 
     */
    jiaoHuanUpDownCard(layout, cardIdxArr, name, upCardIdx) {
        var count = 0,
            cardIdx;
        for (let i = 0; i < this._handComList.length; ++i) {
            if (this.getCardIsUp(i)) {
                ++count;
                cardIdx = i
            }
        }
        if (count === 1) {
            let idx = cardIdxArr.indexOf(upCardIdx)
            cardIdxArr.splice(idx, 1, cardIdx)
            this.updateUpCard(layout, cardIdxArr, name)
            this._handComList[upCardIdx].setNodeShow(true)
            this.checkAndResetCard()
            this.setTypeButton();

            let typeSprite = this.cardType1
            let tmp = TOU_COUNT
            if (name === "z") {
                typeSprite = this.cardType2
                tmp = ZHONG_COUNT
            } else if (name === "w") {
                typeSprite = this.cardType3
                tmp = WEI_COUNT
            }
            if (cardIdxArr.length === tmp) {
                this.setTypeNameByCards(cardIdxArr, typeSprite);
            }

            this._selectCardIdx = -1
            return true
        }
        return false
    },

    /**检查牌型是否可以提交 */
    checkIsCanShowCard() {
        if (this._touIdxList.length + this._zhongIdxList.length + this._weiIdxList.length === CARD_COUNT) {
            this.downBtnLayout.active = true
        } else {
            this.downBtnLayout.active = false
        }
    },

    /**重置上面牌的颜色 */
    resetUpCard() {
        let c1 = this.layout_up1.children
        let c2 = this.layout_up2.children
        let c3 = this.layout_up3.children
        c1.forEach(node => {
            node.getComponent('BJCard').setGray(false)
        });
        c2.forEach(node => {
            node.getComponent('BJCard').setGray(false)
        });
        c3.forEach(node => {
            node.getComponent('BJCard').setGray(false)
        });
        this._selectCardIdx = -1
    },

    setCardUp(chooseArr) {
        for (let i = 0; i < this._handComList.length; i++) {
            const com = this._handComList[i];
            this.cardUpOrDown(com, 2)
            if (chooseArr.includes(i)) {
                this.cardUpOrDown(com, 1)
            }
        }
    },

    /**获取牌是否抬起来 */
    getCardIsUp(idx) {
        let com = this._handComList[idx]
        if (com) {
            return com.node.y == this._upY
        }
        return false
    },

    /**
     * 点击牌型按钮
     * @param {string} type 牌型名字
     * @returns 
     */
    onTouchType(type) {
        type = parseInt(type)
        let resout = null
        resout = this._tipList[type]
        if (!resout || !Array.isArray(resout)) {
            return
        }

        if (this._tipIdxList[type] >= resout.length) {
            this._tipIdxList[type] = 0 //用于轮流推荐所有牌型
        }

        let arr = [];
        let idList = resout[this._tipIdxList[type]]
        for (let i = 0; i < this._handCardArr.length; i++) {
            const id = this._handCardArr[i];
            if (idList.includes(id) && !arr.includes(i) && this._handComList[i].node.active) {
                arr.push(i)
            }
        }
        this.setCardUp(arr)
        this._tipIdxList[type]++
    },

    /**
     * 点击了上面三道按钮
     * @param {string} name t z w三道的名字
     */
    onClickUpDao(name) {
        let count = 0
        let idxArr = this._touIdxList
        let layout = this.layout_up1
        let maxCount = TOU_COUNT
        let tipName = "头道"
        let btn_cancel = this.btn_cancel1
        if (name == "z") {
            idxArr = this._zhongIdxList
            layout = this.layout_up2
            maxCount = ZHONG_COUNT
            tipName = "中道"
            btn_cancel = this.btn_cancel2
        } else if (name == "w") {
            idxArr = this._weiIdxList
            layout = this.layout_up3
            maxCount = WEI_COUNT
            tipName = "尾道"
            btn_cancel = this.btn_cancel3
        }
        let idxList = []
        for (let i = 0; i < this._handComList.length; i++) {
            const isUp = this.getCardIsUp(i);
            if (isUp && (name == "t" && !this._zhongIdxList.includes(i) && !this._weiIdxList.includes(i) ||
                name == "z" && !this._touIdxList.includes(i) && !this._weiIdxList.includes(i) ||
                name == "w" && !this._zhongIdxList.includes(i) && !this._touIdxList.includes(i))) {
                count++
                idxList.push(i)
            }
        }
        if (count + idxArr.length > maxCount) {
            AssetsManager.tipDialog(`${tipName}最多${maxCount}张牌`)
            return
        }

        for (let i = 0; i < idxList.length; i++) {
            idxArr.push(idxList[i])
        }
        this.updateUpCard(layout, idxArr, name)
        this.checkAndResetCard();
        this.setTypeButton();
        this.restCardAutoFill();

        btn_cancel.active = idxArr.length > 0;
    },

    /**
     * 点击取消按钮
     * @param {string} name a全部取消 tzw
     */
    onClickCancel(name) {
        if (this.flyNode.children.length > 0) {
            return
        }
        if (name == "a") {
            this.layout_up1.removeAllChildren()
            this.layout_up2.removeAllChildren()
            this.layout_up3.removeAllChildren()
            this.btn_cancel1.active = false
            this.btn_cancel2.active = false
            this.btn_cancel3.active = false
            this.cardType1.node.active = false
            this.cardType2.node.active = false
            this.cardType3.node.active = false
            this._handComList.forEach(com => {
                com.setNodeShow(true)
            });
            this._touIdxList.length = 0
            this._zhongIdxList.length = 0
            this._weiIdxList.length = 0
            this.downBtnLayout.active = false
        } else {
            let lay = this.layout_up1
            let btn_cancel = this.btn_cancel1
            let cardType = this.cardType1
            let idxArr = this._touIdxList
            if (name == "z") {
                lay = this.layout_up2
                btn_cancel = this.btn_cancel2
                cardType = this.cardType2
                idxArr = this._zhongIdxList
            } else if (name == "w") {
                lay = this.layout_up3
                btn_cancel = this.btn_cancel3
                cardType = this.cardType3
                idxArr = this._weiIdxList
            }

            lay.removeAllChildren()
            btn_cancel.active = false
            cardType.node.active = false
            for (let i = 0; i < idxArr.length; i++) {
                const j = idxArr[i];
                let com = this._handComList[j]
                com && com.setNodeShow(true)
            }
            idxArr.length = 0
        }
        this.checkAndResetCard();
        this.setTypeButton();
    },

    /**根据牌值获取牌的下标 */
    getCardIndex(cardArr, chooseArr, arr = []) {
        let indexArr = [];
        for (let x = 0; x < cardArr.length; x++) {
            for (let y = 0; y < chooseArr.length; y++) {
                if (chooseArr[y] === cardArr[x] && arr.indexOf(y) == -1 && indexArr.indexOf(y) == -1) {
                    indexArr.push(y);
                    break;
                }
            }
        }
        return indexArr;
    },

    /**自动摆牌的回调 */
    autoSortCallBack() {
        let cardArr = this._autoCards
        let arr1 = this.getCardIndex(cardArr[0], this._handCardArr);
        let arr2 = this.getCardIndex(cardArr[1], this._handCardArr, arr1);
        this.onClickCancel("a");
        this.scheduleOnce(() => {
            this.setCardUp(arr1);
            this.onClickUpDao("t")
        }, 0.2)
        this.scheduleOnce(() => {
            this.setCardUp(arr2);
            this.onClickUpDao("z")
        }, 0.4)
    },

    verifySortCard(isUpdateCard = false) {
        var touCardIdArr = [],
            zhongCardIdArr = [],
            weiCardIdArr = [];
        var i;
        for (i = 0; i < this._touIdxList.length; ++i) {
            touCardIdArr.push(this._handCardArr[this._touIdxList[i]]);
        }
        for (i = 0; i < this._zhongIdxList.length; ++i) {
            zhongCardIdArr.push(this._handCardArr[this._zhongIdxList[i]]);
        }
        for (i = 0; i < this._weiIdxList.length; ++i) {
            weiCardIdArr.push(this._handCardArr[this._weiIdxList[i]]);
        }
        if (touCardIdArr.length == TOU_COUNT && zhongCardIdArr.length == ZHONG_COUNT) {
            if (BJLogic.compareCards(touCardIdArr, zhongCardIdArr) == 1) {
                if (!isUpdateCard) AssetsManager.tipDialog('中道必须大于头道');
                return false;
            }
        }
        if (weiCardIdArr.length == WEI_COUNT && zhongCardIdArr.length == ZHONG_COUNT) {
            if (BJLogic.compareCards(zhongCardIdArr, weiCardIdArr) == 1) {
                if (!isUpdateCard) AssetsManager.tipDialog('尾道必须大于中道');
                return false;
            }
        }
        if (weiCardIdArr.length == WEI_COUNT && touCardIdArr.length == TOU_COUNT) {
            if (BJLogic.compareCards(touCardIdArr, weiCardIdArr) == 1) {
                if (!isUpdateCard) AssetsManager.tipDialog('尾道必须大于头道');
                return false;
            }
        }
        return true;
    },

    /**按钮响应 */
    btnClickCallFunc(event, param) {
        let node = event.target || event.node;
        switch (node.name) {
            case "btn_auto":
                if (CCUtil.clickInterval(node, 1, true)) {
                    return
                }
                this.autoSortCallBack()
                break;
            case "btn_qipai":
                AssetsManager.popDialog({
                    content: '确定要弃牌吗？',
                    ok: () => {
                        ApiRoom.gameMessageNotify(ApiBj.userCancelNotify())
                    },
                    no: () => { },
                    parent: this.node,
                });
                break;
            case "btn_daxiao":
                this.sortCard(1)
                break;
            case "btn_huase":
                this.sortCard(2)
                break;
            case "btn_up1":
                this.onClickUpDao("t")
                break;
            case "btn_up2":
                this.onClickUpDao("z")
                break;
            case "btn_up3":
                this.onClickUpDao("w")
                break;
            case "btn_cancel1":
                this.onClickCancel("t")
                break;
            case "btn_cancel2":
                this.onClickCancel("z")
                break;
            case "btn_cancel3":
                this.onClickCancel("w")
                break;
            case "btn_allcancel":
                this.onClickCancel("a")
                cc.systemEvent.emit("optCardAllCancel")
                break;
            case "btn_showcard":
                if (this.flyNode.children.length > 0) {
                    return
                }
                if (CCUtil.clickInterval(node, 1, true)) {
                    return
                }
                if (this._touIdxList.length + this._weiIdxList.length + this._zhongIdxList.length != CARD_COUNT) {
                    return
                }
                if (!this.verifySortCard()) {
                    return
                }

                let touCards = []
                for (let i = 0; i < this._touIdxList.length; i++) {
                    touCards.push(this._handCardArr[this._touIdxList[i]])
                }
                let zhongCards = []
                for (let i = 0; i < this._zhongIdxList.length; i++) {
                    zhongCards.push(this._handCardArr[this._zhongIdxList[i]])
                }
                let weiCards = []
                for (let i = 0; i < this._weiIdxList.length; i++) {
                    weiCards.push(this._handCardArr[this._weiIdxList[i]])
                }
                ApiRoom.gameMessageNotify(ApiBj.showCardsNotify(touCards, zhongCards, weiCards))
                break;
            default:
                let t = node.name.split("_")[1]
                this.onTouchType(t)
                break;
        }
    },

    update(dt) {
        if (this._tick < 0) {
            return
        }
        this._tick -= dt;
        let tick = Math.floor(this._tick);
        tick = (tick < 0) ? 0 : tick;
        this.txt_time.string = tick;
    },
});