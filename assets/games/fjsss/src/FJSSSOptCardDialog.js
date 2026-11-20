const FJSSSLogic = require('./FJSSSLogic');
const FJSSSModel = require('./FJSSSModel');
const GameUtil = require('./FJSSSUtil');
const Enums = require('../../../src/const/Enums');
const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const Configs = require('../../../src/const/Configs');
const ApiFjsss = require('./ApiFjsss');

cc.Class({
    extends: cc.Component,

    properties: {
        btn_cancel1: cc.Node,
        btn_cancel2: cc.Node,
        btn_cancel3: cc.Node,
        btn_special: cc.Node,
        btn_auto: cc.Node,
        layout_up1: cc.Node,
        layout_up2: cc.Node,
        layout_up3: cc.Node,
        cardType1: cc.Sprite,
        cardType2: cc.Sprite,
        cardType3: cc.Sprite,
        autoContent: cc.Node,
        autoSortNode: cc.Node,
        txt_time: cc.Label,

        cardTypeBtns: cc.Node,
        downBtnLayout: cc.Node,
        layout_handCards: cc.Node,

        cardPfb: cc.Prefab,
        autoPfb: cc.Prefab,
        /**手牌 */
        _handComList: [],
        /**头中尾道牌 */
        _touIdxList: [],
        _zhongIdxList: [],
        _weiIdxList: [],
        /**牌抬起来的偏移 */
        _upY: 20,
        /**特殊牌型 */
        _specialType: null,
        _selectCardIdx: -1,
        _tick: 0,
        /**自动摆牌界面的初始位置 */
        _autoInitPos: null,
        _autoSortisShow: false
    },

    onLoad() {
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
        addClick(this.btn_special)
        addClick(this.btn_auto)
        this.btn_auto.active = false
        this.scheduleOnce(() => {
            this._autoInitPos = this.autoSortNode.getPosition()
            this.btn_auto.active = !FJSSSModel.getGameRuleByKey("shouDongBaiPai")
            // console.log("手动摆牌==", FJSSSModel.getGameRule())
        }, 0.5)
        this.btn_special.active = FJSSSModel.getTeShuType() != 0
    },

    start() {
        let data = this.node.nodeParams;
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

    /**初始化 */
    init(data) {
        /**显示牌 */
        this._handCardArr = data.handCards

        for (let i = 0; i < this._handCardArr.length; i++) {
            const id = this._handCardArr[i];
            let cardNode = cc.instantiate(this.cardPfb)
            cardNode.parent = this.layout_handCards
            cardNode.name = i + ""
            // this.addMoveAndEndEvent(cardNode, i)
            let com = cardNode.addComponent('FJSSSCard')
            com.init()
            com.setNodeShow(true)
            com.flower = id
            com.setMaIcon(id == FJSSSModel.getMaPai())
            this._handComList.push(com)
        }
        this.addMoveAndEndEvent(this.layout_handCards, 1)

        /**显示牌型按钮 */
        this.setTypeButton()
        /**显示倒计时 */
        this._tick = Math.floor(data.tick)
        this.txt_time.string = this._tick + ""
        if (this._tick == 0 || FJSSSModel.getGameRuleByKey("liPaiTime") == 0) {
            this.txt_time.node.parent.active = false
        } else {
            this.schedule(this.clockScheduler.bind(this), 1);
        }
        /**初始化自动摆牌 */
        let cardArr = GameUtil.getGroupAllPokerType(this._handCardArr);
        if (cardArr) {
            // console.log(cardArr)
            for (let i = 0; i < cardArr.length; i++) {
                const info = cardArr[i];
                let item = cc.instantiate(this.autoPfb)
                item.parent = this.autoContent
                let com = item.getComponent("FJSSSOptAutoItem")
                com.init(i, info, this.autoSortCallBack.bind(this))
            }
        }
        /**是否有特殊牌型 */
        this.showSpecialTip()
    },

    /**设置牌型按钮 */
    setTypeButton() {
        var chooseArr = this.getRestCardArr();
        let btns = this.cardTypeBtns.children
        if (chooseArr.length <= 0) {
            btns.forEach(node => {
                node.getComponent(cc.Button).interactable = false
            });
            return;
        }
        let arr = GameUtil.getAllHoldTypeWithNormal(chooseArr);
        // console.log("设置按钮==", arr)
        for (const name in arr) {
            if (Object.hasOwnProperty.call(arr, name)) {
                let btn = cc.find("btn_" + name, this.cardTypeBtns)
                if (btn) {
                    btn.getComponent(cc.Button).interactable = arr[name]
                }
            }
        }
    },

    clockScheduler() {
        if (this._tick <= 0) {
            this.unscheduleAllCallbacks();
            this.txt_time.node.parent.active = false
        } else {
            this._tick--
            this.txt_time.string = this._tick + ""
        }
    },

    /**给牌添加点击响应 */
    addMoveAndEndEvent(node, i) {
        // console.log("addMoveAndEndEvent", node.name + "  " + i)
        node.on(cc.Node.EventType.TOUCH_END, function (event) {
            this.onTouchCardEnd(event, i);
        }.bind(this));
        node.on(cc.Node.EventType.TOUCH_START, function (event) {
            this.onTouchCardStart(event, i);
        }.bind(this));
        node.on(cc.Node.EventType.TOUCH_MOVE, function (event) {
            this.onTouchMove(event, i);
        }.bind(this));
        node.on(cc.Node.EventType.TOUCH_CANCEL, function (event) {
            this.onTouchCardEnd(event, i);
        }.bind(this));
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
            bundle: Enums.bundleType.FJSSS
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
        let showComList = this.getShowCardIdxs()
        for (let i = 0; i < showComList.length; ++i) {
            let com = this._handComList[showComList[i]];
            if (!com.node.active) {
                continue;
            }
            let rect2 = CCUtil.getBoundingBoxToWorldWithoutChildren(com.node)
            let com2 = this._handComList[showComList[i + 1]]
            if (com2 && com2.node.active) {
                rect2.width += this.layout_handCards.getComponent(cc.Layout).spacingX
            }
            let intersect = rect1.intersects(rect2)
            if (type == 1) {
                let isBianhua = com.setGray(intersect, FJSSSModel.getMaPai())
                if (isBianhua) {
                    AssetsManager.playEffect({
                        path: "res/audio/main/sound_select_card",
                        bundle: Enums.bundleType.FJSSS
                    });
                }
            } else if (type == 2) {
                if (intersect) {
                    this.cardUpOrDown(com)
                    this.onTouchCard(null, showComList[i])
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
        if (i < 0 || i >= 13 || param == null) {
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

        com.setGray(false, FJSSSModel.getMaPai())
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


    sortRestCard() {
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
        let cardCom = cardNode.getComponent('FJSSSCard')
        if (idx !== this._selectCardIdx && this._selectCardIdx !== -1) {
            /**交换牌 */
            // console.log("j1")
            /**找出需要交换的那张牌 */
            /**同一道无法交换 */
            if (arr.includes(this._selectCardIdx)) {
                // console.log("同道无法交换")
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
            // console.log("j2")
            this._selectCardIdx = -1
            cardCom.setGray(false, FJSSSModel.getMaPai())
        } else if (this._selectCardIdx === -1) {
            // console.log("j3")
            /**如果有下方选中的牌，交换两个牌的位置 */
            if (this.jiaoHuanUpDownCard(layout, arr, n[0], idx)) {
                return
            }
            // console.log("j4")
            /**选中牌置灰 */
            // console.log("选中置灰牌", cardNode)
            this._selectCardIdx = idx
            cardCom.setGray(true, FJSSSModel.getMaPai())
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
            bundle: Enums.bundleType.FJSSS
        });
        sprite.node.active = true;
        // console.log("设置了牌型", url)
    },

    /**获取牌型图片的url */
    getTypeUrlByCardArr(array) {
        let typeArr = GameUtil.getAllHoldTypeWithNormal(array);
        let url = 'res/sprite/cardType/sss_w_wulong';
        for (let name in typeArr) {
            if (typeArr[name]) {
                url = 'res/sprite/cardType/sss_w_' + name;
                break;
            }
        }
        return url;
    },

    /**剩余牌自动填充 */
    restCardAutoFill() {
        var canFill = false,
            restCardArr, i, name;
        if (this._touIdxList.length === 3 && this._zhongIdxList.length === 5) {
            canFill = true;
            name = "w"
        }
        if (this._touIdxList.length === 3 && this._weiIdxList.length === 5) {
            canFill = true;
            name = "z"
        }
        if (this._zhongIdxList.length === 5 && this._weiIdxList.length === 5) {
            canFill = true;
            name = "t"
        }
        if (this._touIdxList.length + this._zhongIdxList.length + this._weiIdxList.length === 13) {
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
        }
    },

    /**
     * 刷新某一道的牌
     * @param {cc.Node} layout 父节点
     * @param {Array<number>} cardIdxArr 牌的idx数组
     * @param {string} name 节点名字
     */
    updateUpCard(layout, cardIdxArr, name) {
        layout.removeAllChildren()
        // console.log("刷新的牌==", cardIdxArr)
        for (i = 0; i < cardIdxArr.length; ++i) {
            this._handComList[cardIdxArr[i]].setNodeShow(false)
            let node = cc.instantiate(this.cardPfb)
            let com = node.addComponent('FJSSSCard')
            com.init()
            let id = this._handCardArr[cardIdxArr[i]]
            com.flower = id
            com.setMaIcon(id == FJSSSModel.getMaPai())
            node.name = name + "_" + cardIdxArr[i]
            node.parent = layout;
            /**添加牌的点击事件 */
            node.addComponent(cc.Button)
            node.on("click", this.onClickUpCard, this)
        }

        let typeSprite = this.cardType1
        if (name === "z") {
            typeSprite = this.cardType2
        } else if (name === "w") {
            typeSprite = this.cardType3
        }
        let tmp = 5
        if (name === "t") {
            tmp = 3
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
            this.sortRestCard()
            this.setTypeButton();

            let typeSprite = this.cardType1
            let tmp = 3
            if (name === "z") {
                typeSprite = this.cardType2
                tmp = 5
            } else if (name === "w") {
                typeSprite = this.cardType3
                tmp = 5
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
        if (this._touIdxList.length + this._zhongIdxList.length + this._weiIdxList.length === 13) {
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
            node.getComponent('FJSSSCard').setGray(false, FJSSSModel.getMaPai())
        });
        c2.forEach(node => {
            node.getComponent('FJSSSCard').setGray(false, FJSSSModel.getMaPai())
        });
        c3.forEach(node => {
            node.getComponent('FJSSSCard').setGray(false, FJSSSModel.getMaPai())
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
     * @param {string} name 牌型名字
     * @returns 
     */
    onTouchType(name) {
        var restArr = this.getRestCardArr();
        var resout, i, j, chooseArr;

        resout = GameUtil.getElectionByName(restArr, name, this._lastResout);
        // console.log("获取牌型==", name, resout)
        if (!resout || !Array.isArray(resout)) {
            return
        }
        // console.log(resout, this._lastResout)
        if (this.preName && name !== this.preName) {
            this._lastResout = null //用于轮流推荐所有牌型
        }

        var arr = [];
        for (let y = 0; y < resout.length; y++) {
            for (let x = 0; x < this._handCardArr.length; x++) {
                if (resout[y] == this._handCardArr[x] && arr.indexOf(x) == -1 && this._handComList[x].node.active) {
                    arr.push(x);
                    break;
                }
            }
        }
        // console.log("resout===", resout)

        this.setCardUp(arr)
        this.preName = name;
        this._lastResout = resout
    },

    /**
     * 点击了上面三道按钮
     * @param {string} name t z w三道的名字
     */
    onClickUpDao(name) {
        let count = 0
        let idxArr = this._touIdxList
        let layout = this.layout_up1
        let maxCount = 3
        let tipName = "头道"
        let btn_cancel = this.btn_cancel1
        if (name == "z") {
            idxArr = this._zhongIdxList
            layout = this.layout_up2
            maxCount = 5
            tipName = "中道"
            btn_cancel = this.btn_cancel2
        } else if (name == "w") {
            idxArr = this._weiIdxList
            layout = this.layout_up3
            maxCount = 5
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
        // console.log("放上去的牌==", idxArr)
        this.updateUpCard(layout, idxArr, name)
        this.sortRestCard();
        this.setTypeButton();
        this.restCardAutoFill();

        btn_cancel.active = idxArr.length > 0;
    },

    /**
     * 点击取消按钮
     * @param {string} name a全部取消 tzw
     */
    onClickCancel(name) {
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
        this.sortRestCard();
        this.setTypeButton();
    },

    /**显示自动摆牌界面 */
    showAotuSort() {
        this.autoSortNode.stopAllActions();
        let endx = this._autoInitPos.x
        if (this._autoSortisShow) {
            this._autoSortisShow = false;
        } else {
            this._autoSortisShow = true;
            endx -= 663
        }
        cc.tween(this.autoSortNode).to(0.2, {
            x: endx
        }).start()
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
    autoSortCallBack(cardArr) {
        let arr1 = this.getCardIndex(cardArr[0], this._handCardArr);
        let arr2 = this.getCardIndex(cardArr[1], this._handCardArr, arr1);
        if (!this.lastClickTime) {
            this.lastClickTime = new Date();
        } else {
            if (new Date() - this.lastClickTime <= 500) {
                AssetsManager.tipDialog("点击过快");
                return;
            } else {
                this.lastClickTime = new Date();
            }
        }
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

    verifySortCard() {
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
        if (touCardIdArr.length !== 0 && zhongCardIdArr.length !== 0) {
            if (FJSSSLogic.compareCards(touCardIdArr, zhongCardIdArr)) {
                AssetsManager.tipDialog('中道必须大于头道');
                return false;
            }
        }
        if (weiCardIdArr.length !== 0 && zhongCardIdArr.length !== 0) {
            if (FJSSSLogic.compareCards(zhongCardIdArr, weiCardIdArr)) {
                AssetsManager.tipDialog('尾道必须大于中道');
                return false;
            }
        }
        if (weiCardIdArr.length !== 0 && touCardIdArr.length !== 0) {
            if (FJSSSLogic.compareCards(touCardIdArr, weiCardIdArr)) {
                AssetsManager.tipDialog('尾道必须大于头道');
                return false;
            }
        }
        return true;
    },

    /**显示特殊牌型提示 */
    showSpecialTip() {
        let teshu = FJSSSModel.getTeShuType()
        if (teshu != 0) {
            let data = {
                bundle: Enums.bundleType.FJSSS,
                path: 'res/prefab/FJSSSSpecial',
                parent: this.node
            }
            AssetsManager.createDialog(data)
        }
    },

    /**按钮响应 */
    btnClickCallFunc(event, param) {
        // console.log("按钮响应==", event)
        let node = event.target || event.node
        switch (node.name) {
            case "btn_special":
                this.showSpecialTip()
                break;
            case "btn_auto":
                this.showAotuSort()
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
                if (this._touIdxList.length + this._weiIdxList.length + this._zhongIdxList.length != 13) {
                    return
                }
                if (!this.verifySortCard() || CCUtil.clickInterval(node, 3, true)) {
                    return;
                }
                let cards = []
                for (let i = 0; i < this._touIdxList.length; i++) {
                    cards.push(this._handCardArr[this._touIdxList[i]])
                }
                for (let i = 0; i < this._zhongIdxList.length; i++) {
                    cards.push(this._handCardArr[this._zhongIdxList[i]])
                }
                for (let i = 0; i < this._weiIdxList.length; i++) {
                    cards.push(this._handCardArr[this._weiIdxList[i]])
                }
                // console.log("提交的牌==", cards)
                ApiRoom.gameMessageNotify(ApiFjsss.showCardsNotify(cards, 0))
                break;
            default:
                let typeName = node.name.split("_")[1]
                this.onTouchType(typeName)
                break;
        }
    },
});