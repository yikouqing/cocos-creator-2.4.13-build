const ApiRoom = require('../../../../src/api/ApiRoom');
const Enums = require('../../../../src/const/Enums');
const ApiLseqs = require('../ApiLseqs');
const CCUtil = require('../../../../src/utils/CCUtil');
const AssetsManager = require('../../../../src/utils/AssetsManager');
const LSEQSModel = require('../LSEQSModel');
const Utils = require('../../../../src/utils/Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        handPfb: cc.Prefab,
        moCardPfb: cc.Prefab,
        /**本地位置号 */
        _idx: null,
        /**手牌脚本列表 */
        _cardComList: null,
        /**动画牌列表 */
        _aniNodeList: [],
        _moveNode: null,
    },

    onDestroy() {
        cc.systemEvent.off("discard", this.onDiscard, this)
        cc.systemEvent.off("moveEnd", this.onMoveEnd, this)
    },

    /**初始化 */
    init(idx = null) {
        if (idx == null) {
            return
        }
        if (this._idx == null) {
            this._idx = idx;
        } else {
            /**只能初始化一次 */
            return
        }
        if (this._idx == 0) {
            cc.systemEvent.on("discard", this.onDiscard, this);
            cc.systemEvent.on("moveEnd", this.onMoveEnd, this)
            this._outAni = this.node.parent.getChildByName("outAni")
            this._outAni.active = false
            let line = this._outAni.getChildByName("line")
            cc.tween(line).to(2, {
                opacity: 0
            }).to(2, {
                opacity: 255
            }).union().repeatForever().start()
        }

        this._moCardShow = this.node.parent.getChildByName("show0") //摸牌的初始节点
        this._showNode = this.node.parent.getChildByName("show" + this._idx) //展示动画的节点
        this._cardLay = this.node.getChildByName("cardLay")
        this._cardLay.removeAllChildren()
        /**初始化手牌 11排5张*/
        this._cardComList = []
        let groupPfb = this.node.getChildByName("group")
        for (let i = 0; i < 11; i++) {
            let group = cc.instantiate(groupPfb)
            group.parent = this._cardLay
            group.y = 0
            group.name = i + ""
            this._cardComList[i] = []
            for (let j = 0; j < 5; j++) {
                let card = cc.instantiate(this.handPfb)
                card.parent = group
                card.x = 0
                let com = card.addComponent('LSEQSCard')
                com.init()
                com.setNodeShow(false)
                com.layIdx = i
                com.cardIdx = j
                if (this._idx == 0) {
                    com.setTouchListener()
                }
                this._cardComList[i].push(com)
            }
        }
    },

    /**
     * 刷新手牌
     * @param {Array} cardArr 手牌列表
     * @param {boolean} isAni 是否播放发牌动画
     */
    updateHandCards(cardArr, isAni = false) {
        this.deleteMoveNode()
        this.node.active = true
        let jiaoList = LSEQSModel.getJiaoList()
        for (let i = 0; i < this._cardComList.length; i++) {
            const info = cardArr[i];
            let comList = this._cardComList[i]
            let lay = comList[0].node.parent
            lay.y = 0
            this.removeTouchListener(lay)
            if (info) {
                let cardList = info.cardList
                let quchong = Array.from(new Set(cardList))
                let noTouch = quchong.length == 1 && cardList.length >= 3
                let huCount = LSEQSModel.getGroupHuCount(cardList)
                if (noTouch) { //如果这一组牌不能出，单独给容器添加监听
                    this.addTouchListener(lay)
                }
                for (let j = 0; j < comList.length; j++) {
                    const com = comList[j];
                    let id = cardList[j]
                    if (id) {
                        com.flower = id
                        com.setNodeShow(true)
                        if (this._idx == 0) {
                            com.setJiao(jiaoList.includes(id))
                            com.isTouch = !noTouch
                            com.removeTouchListener()
                            if (!noTouch) {//如果这一组牌不能出，需要去掉牌上面的监听，否则会点击穿透
                                com.setTouchListener()
                            }
                        }
                        com.setHuCount(0, false)
                        if (j == cardList.length - 1) {
                            com.setHuCount(huCount, true)
                        }
                    } else {
                        com.setNodeShow(false)
                    }
                }
                lay.active = true
            } else {
                lay.active = false
            }
        }

        if (isAni && this._idx == 0) {
            for (let i = 0; i < this._cardComList.length; i++) {
                let comList = this._cardComList[i]
                let lay = comList[0].node.parent
                lay.y = -500
                cc.tween(lay).delay(0.05 * i).call(() => {
                    AssetsManager.playEffect({
                        path: "res/audio/common/fapai",
                        bundle: LSEQSModel.getGameType()
                    });
                }).to(0.2, {
                    y: 0
                }).start()
            }
        }
    },

    /**设置轮到自己操作 */
    setIsMyTurn(isTurn) {
        // console.log("轮到自己出牌==", isTurn, this._idx)
        if (this._idx == 0) {
            let cardArr = LSEQSModel.getCusHandList()
            let jiaoList = LSEQSModel.getJiaoList()
            for (let i = 0; i < this._cardComList.length; i++) {
                const info = cardArr[i];
                let comList = this._cardComList[i]
                let lay = comList[0].node.parent
                if (info && lay.active) {
                    let cardList = info.cardList
                    for (let j = 0; j < comList.length; j++) {
                        const com = comList[j];
                        let id = cardList[j]
                        // com.isTouch = isTurn && com.flower == id 
                        com.setJiao(jiaoList.includes(id))
                    }
                }
            }
            LSEQSModel.setIsMyTurn(isTurn)
            this._outAni.active = isTurn
        }
    },

    /**摸牌 */
    showMoPaiAni(cardId) {
        // this.delMoCard()
        let cardNode = cc.instantiate(this.moCardPfb)
        cardNode.parent = this.node.parent
        cardNode.setPosition(this._moCardShow.getPosition())
        cardNode.angle = -90
        cardNode.name = "showMoPai" + cardId
        this._aniNodeList.push(cardNode)
        let com = cardNode.addComponent('LSEQSCard')
        com.init()
        com.flower = cardId
        com.setCover(true)
        com.setNodeShow(true)
        com.setSelfLight(this._idx == 0)
        cardNode.scale = 0
        cc.tween(cardNode).to(0.05, {
            scale: 1.3
        }).to(0.05, {
            scale: 1.1
        }).delay(0.05).call(() => {
            if (cardId) {
                com.setCover(false)
            }
        }).to(0.15, {
            angle: 0,
            position: this._showNode.getPosition(),
            scale: 1
        }).start()
    },

    /**展示飞到牌堆 */
    showFlyToPaiDui(cardId) {
        let node = this.node.parent.getChildByName("showMoPai" + cardId)
        // console.log("展示飞到牌堆==", node.x, node.y)
        if (cc.isValid(node)) {
            if (cardId == 100) { //财神直接飞到头像

            }
            let lastMoCom = null
            for (let i = 0; i < this._cardComList.length; i++) {
                const list = this._cardComList[i];
                lastMoCom = list.find(info => info.flower == cardId)
                if (lastMoCom) {
                    break;
                }
            }
            if (lastMoCom && this._idx == 0) {
                let lay = lastMoCom.node.parent.getComponent(cc.Layout)
                lay.updateLayout()
                lastMoCom.setNodeOpacity(0)
                let endPos = CCUtil.postionConvert(lastMoCom.node, this.node.parent)
                // node.stopAllActions()
                cc.tween(node).delay(0.8).to(0.2, {
                    position: endPos,
                    opacity: 0,
                }).removeSelf().start()
                lastMoCom.node.stopAllActions()
                cc.tween(lastMoCom.node).delay(1).to(0.1, {
                    opacity: 255
                }).start()
            } else {
                let endPos = this.node.parent.getChildByName("opt" + this._idx).getPosition()
                // node.stopAllActions()
                cc.tween(node).delay(0.8).to(0.2, {
                    position: endPos,
                    opacity: 0,
                }).removeSelf().start()
            }
        }
    },

    /**展示胡牌 */
    showHuPai(cardId) {
        let node = this.node.parent.getChildByName("showMoPai" + cardId)
        if (!cc.isValid(node)) {
            node = this.node.parent.getChildByName("showDisCard" + cardId)
        }
        if (cc.isValid(node)) {
            let endPos = this._showNode.getPosition()
            let com = node.getComponent('LSEQSCard')
            com && com.setSelfLight(this._idx == 0)
            node.stopAllActions()

            let action = cc.scaleTo(0.3, 1);
            action.easing(cc.easeIn(3));
            cc.tween(node).to(0.1, {
                position: endPos,
                scale: 3,
                angle: 0
            }).then(action).start()
        }
    },

    /**删掉展示牌 */
    delMoCard() {
        this._aniNodeList.forEach(disCard => {
            if (cc.isValid(disCard)) {
                disCard.destroy()
            }
        });
        this._aniNodeList.length = 0
    },

    /**出牌 */
    onDiscard(com) {
        // console.log("出牌===", com.flower)
        if (LSEQSModel.getLimitCard() == com.flower) {
            AssetsManager.tipDialog("上吐下泻！")
            return
        }
        ApiRoom.gameMessageNotify(ApiLseqs.gameOperateNotify(ApiLseqs.operateType.QI, com.flower, [], [],
            { layIdx: com.layIdx, cardIdx: com.cardIdx }));
    },

    getShowCount(parentNode) {
        let showCount = 0;
        parentNode.children.forEach(node => {
            if (node.active) {
                showCount++;
            }
        });
        return showCount;
    },

    /**拖牌结束 */
    onMoveEnd(moveNodePos, pricom) {
        if (this._idx != 0) return;
        let root = AssetsManager.getRoot()
        if (cc.isValid(root)) {
            /**找出X 轴上最接近的牌 容器,并且该容器中显示牌最多只有3张*/
            let minDis = 99999999
            let targetLayIdx = null //目标容器的下标
            let startLayIdx = pricom.layIdx //原始容器的下标
            let startCardIdx = pricom.cardIdx //原始牌的下标
            let cusCardArr = LSEQSModel.getCusHandList()
            // console.log("cusCardArr==", cusCardArr)
            for (let i = 0; i < cusCardArr.length; i++) {
                const cardList = cusCardArr[i].cardList;
                const comGroup = this._cardComList[i];
                if (!comGroup) {
                    continue;
                }
                const com = comGroup[0];
                let groupLay = com.node.parent
                let quchong = Array.from(new Set(cardList))
                if (cardList.length >= 3 && quchong.length == 1) {
                    continue; //跳过3张或者4张一样的牌
                }
                if (groupLay.active && (cardList.length <= 3 || startLayIdx == i)) {
                    let pos = CCUtil.postionConvert(groupLay, root) //比较的位置
                    if (Math.abs(pos.x - moveNodePos.x) < minDis) {
                        minDis = Math.abs(pos.x - moveNodePos.x)
                        targetLayIdx = i
                    }
                }
            }
            // console.log("拖牌结束===", startLayIdx, targetLayIdx, minDis);
            if (targetLayIdx >= 0 /**&& (targetLayIdx != startLayIdx || targetLayIdx == startLayIdx && minDis > 150)*/) {
                //删除原位置的牌
                cusCardArr[startLayIdx].cardList.splice(startCardIdx, 1)
                if (cusCardArr[startLayIdx].cardList.length == 0) {
                    cusCardArr.splice(startLayIdx, 1) //如果本组牌没有了，删除组
                    if (targetLayIdx > startLayIdx) { //删除的组如果在目标组前面，会导致整个数组下标减少1
                        targetLayIdx--
                    }
                }
                //放入新位置的牌
                if ((targetLayIdx == 0 || targetLayIdx == cusCardArr.length - 1) &&
                    minDis > 150 && cusCardArr.length < 10) { //新开一列
                    if (targetLayIdx == cusCardArr.length - 1) {
                        targetLayIdx++
                    }
                    let newInfo = {
                        cardList: [pricom.flower],
                    }
                    cusCardArr.splice(targetLayIdx, 0, newInfo)
                } else {
                    /**数据调整 */
                    if (!cusCardArr[targetLayIdx]) {
                        cusCardArr[targetLayIdx] = {}
                        cusCardArr[targetLayIdx].cardList = []
                    }
                    let targetCardIdx = 0 //目标牌的下标
                    const comGroup = this._cardComList[targetLayIdx];
                    minDis = 99999999
                    /**找到距离最近的牌的位置 */
                    for (let i = 0; i < comGroup.length; i++) {
                        const com = comGroup[i];
                        if (com.node.active) {
                            let pos = CCUtil.postionConvert(com.node, root) //比较的位置
                            if (Math.abs(pos.y - moveNodePos.y) < minDis) {
                                minDis = Math.abs(pos.y - moveNodePos.y)
                                targetCardIdx = i
                            }
                        }
                    }
                    // console.log("找到的牌的位置==", targetLayIdx, targetCardIdx)
                    /**放到第一个位置 */
                    cusCardArr[targetLayIdx].cardList.splice(targetCardIdx, 0, pricom.flower)

                }
                LSEQSModel.setCusHandList(cusCardArr)
                /**重新刷新手牌 */
                this.updateHandCards(cusCardArr)
            }
        }
    },

    reset() {
        this.node.active = false;
        this._cardComList.forEach(arr => {
            arr.forEach(t => {
                t.node.parent.active = false;
                t.setNodeShow(false);
                t.reset()
            });
        });
        this.delMoCard()
    },

    /**3个或者4个组的移动 */
    addTouchListener(node) {
        node.on(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        node.on(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        node.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
        node.on(cc.Node.EventType.TOUCH_CANCEL, this.touchEnd, this);
    },

    removeTouchListener(node) {
        node.off(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        node.off(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        node.off(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
        node.off(cc.Node.EventType.TOUCH_CANCEL, this.touchEnd, this);
    },

    touchStart(event) {
        this.deleteMoveNode()
        this._beginPos = CCUtil.postionConvert(event.target, AssetsManager.getRoot())
    },

    touchMove(event) {
        let root = AssetsManager.getRoot();
        if (cc.isValid(root)) {
            if (!this._moveNode || !cc.isValid(this._moveNode)) {
                this._moveNode = cc.instantiate(event.target)
                this._moveNode.opacity = 180
                this._moveNode.name = event.target.name;
                let pos = CCUtil.postionConvert(event.target, root);
                this._moveNode.setPosition(pos);
                this._moveNode.parent = root;
                this._moveNode.scale = this._cardLay.scale;
                let touch = event.touch;
                let item = cc.v2(touch.getLocation().x, touch.getLocation().y);
                let deltaMove = item.sub(touch.getStartLocation());
                this._moveNode.setPosition(
                    this._beginPos.x + deltaMove.x,
                    this._beginPos.y + deltaMove.y
                );
            } else {
                let touch = event.touch;
                let item = cc.v2(touch.getLocation().x, touch.getLocation().y);
                let deltaMove = item.sub(touch.getStartLocation());
                if (cc.isValid(this._moveNode)) {
                    this._moveNode.setPosition(
                        this._beginPos.x + deltaMove.x,
                        this._beginPos.y + deltaMove.y
                    );
                }
            }
        }
    },

    touchEnd(event) {
        if (cc.isValid(this._moveNode)) {
            let movePos = this._moveNode.getPosition();
            let startLayIdx = parseInt(this._moveNode.name)
            let minDis = 9999999999999999
            let targetLayIdx = null //目标容器的下标
            let cusCardArr = LSEQSModel.getCusHandList()
            let root = AssetsManager.getRoot();
            for (let i = 0; i < cusCardArr.length; i++) {
                const comGroup = this._cardComList[i];
                const com = comGroup[0];
                let groupLay = com.node.parent
                let pos = CCUtil.postionConvert(groupLay, root) //比较的位置
                if (i != startLayIdx && Math.abs(pos.x - movePos.x) < minDis) {
                    minDis = Math.abs(pos.x - movePos.x)
                    targetLayIdx = i
                }
            }
            if (targetLayIdx >= 0 && targetLayIdx != startLayIdx) {
                let info = Utils.deepCopy(cusCardArr[startLayIdx])
                if ((targetLayIdx == cusCardArr.length - 1) && minDis > 150 || targetLayIdx > startLayIdx) {
                    targetLayIdx++
                }
                if (targetLayIdx > startLayIdx) {
                    cusCardArr.splice(targetLayIdx, 0, info)
                    cusCardArr.splice(startLayIdx, 1)
                } else {
                    cusCardArr.splice(startLayIdx, 1)
                    cusCardArr.splice(targetLayIdx, 0, info)
                }
                LSEQSModel.setCusHandList(cusCardArr)
                /**重新刷新手牌 */
                this.updateHandCards(cusCardArr)
            }
        }
        this.deleteMoveNode();
    },

    deleteMoveNode() {
        if (cc.isValid(this._moveNode)) {
            this._moveNode.destroy()
            this._moveNode = null
        }
    },

});