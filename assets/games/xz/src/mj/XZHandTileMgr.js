const XZLogic = require('../XZLogic');
const XZModel = require('../XZModel');
const AssetsManager = require('../../../../src/utils/AssetsManager');
const Enums = require('../../../../src/const/Enums');
const ApiXz = require('../ApiXz');
const ApiRoom = require('../../../../src/api/ApiRoom');
const CCUtil = require('../../../../src/utils/CCUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        standPfb: cc.Prefab, //立起来的牌
        liePfb: cc.Prefab, //平摊的牌
        standLayout: cc.Node,
        lieLayout: cc.Node,
        tip1: cc.Node,
        tip2: cc.Node,
        /**本地位置号 */
        _idx: null,
        /**手牌脚本列表 */
        _standTileList: null,
        _lieTileList: null,
        /**手牌id列表 */
        _tileIdList: null,
        _tingInfo: [],
        _maxRate: 0,
        _maxCount: 0,
        _tileUpY: 40,
    },


    onDestroy() {
        cc.systemEvent.off("discard", this.onDiscard, this)
        cc.systemEvent.off("chooseCard", this.onChooseCard, this)
        cc.systemEvent.off("enterHuanPai", this.onHuanSanZhang, this)
    },

    /**初始化 */
    init(idx) {
        if (this._idx == null) {
            this._idx = idx
        } else {
            // console.log("已经初始化过了")
            return
        }
        if (this._idx == 0) {
            cc.systemEvent.on("discard", this.onDiscard, this)
            cc.systemEvent.on("chooseCard", this.onChooseCard, this)
            cc.systemEvent.on("enterHuanPai", this.onHuanSanZhang, this)
            this.node.scale = CCUtil.getHandCardScale(13)
            this.scheduleOnce(() => {
                this.node.getComponent(cc.Widget).updateAlignment();
            }, 0.1)
        }
        this._standTileList = []
        this._lieTileList = []
        this._tileIdList = []
        for (let i = 0; i < 15; i++) {
            let stand = cc.instantiate(this.standPfb)
            let lie = cc.instantiate(this.liePfb)
            let scom = stand.addComponent('XZSingleTile')
            let lcom = lie.addComponent('XZSingleTile')
            scom.init()
            if (this._idx === 0) {
                scom.setTouchListener()
            }
            lcom.init()
            lcom.setNodeShow(false)
            this._standTileList.push(scom)
            this._lieTileList.push(lcom)
            stand.name = i + ""
            lie.name = i + ""
            if (i < 14) {
                stand.parent = this.standLayout
                lie.parent = this.lieLayout
                scom.setNodeShow(false)
            } else {
                stand.parent = this.node
                lie.parent = this.node
                scom.setNodeOpacity(0)
                if (this._idx == 0) {
                    lie.y = -12
                }
            }
        }
        this.setNoTouch(true)
    },

    /**出牌 */
    onDiscard(tileCom) {
        if (XZModel.getCurOptChairID() != XZModel.getMyChairID()) { //是否轮到自己操作
            return
        }
        let g = XZModel.getGameStatus()
        if (g == ApiXz.gameStatus.PLAYING) {
            /**发送出牌消息 */
            /**如果手中有定缺的牌 只能打定缺牌 */
            if (XZModel.getHasDingQueCard(XZModel.getMyChairID()) && XZLogic.getCardColor(tileCom.flower) !== XZModel.getDingQueType(XZModel.getMyChairID())) {
                AssetsManager.tipDialog("请先打定缺的牌！")
                return
            }
            ApiRoom.gameMessageNotify(ApiXz.gameOperateNotify(tileCom.flower, ApiXz.operateType.QI));
            /**如果这张牌是摸的牌 直接隐藏*/
            if (parseInt(tileCom.node.name) === this._standTileList.length - 1) {
                this.setDrawTile()
            }
        }
    },

    /**选中牌 */
    onChooseCard(tileCom) {
        let g = XZModel.getGameStatus()
        if (!g) {
            return
        }
        if (tileCom.node.y == this._tileUpY) {
            if (g == ApiXz.gameStatus.HUANSANZHANG) { //换三张可以选3张牌
                tileCom.updateTilePos(cc.v2(tileCom.node.x, 0))
                tileCom.huanIdx = 0
            } else {
                this.onDiscard(tileCom)
            }
        } else {
            if (g == ApiXz.gameStatus.HUANSANZHANG) {
                //换三张只可以选3张牌 注意不能把摸的那张牌算进去
                let upCount = 0
                let huanPaiList = []
                let huanIdxList = []
                for (let i = 0; i < this._standTileList.length - 1; i++) {
                    const com = this._standTileList[i];
                    if (com.huanIdx > 1) {
                        upCount++
                        huanPaiList.push(com.flower)
                        huanIdxList.push(com.huanIdx)
                    }
                }
                let checkList = huanPaiList.slice()
                checkList.push(tileCom.flower)
                let isDiff = !this.checkColor(checkList) && this.checkColor(huanPaiList) ||
                    !this.checkColor(huanPaiList)
                if (upCount >= 3 || (isDiff && upCount > 0)) {
                    let downCount = upCount - 2 //颜色一样留两张
                    if (isDiff) { //颜色不一样全部放下去
                        downCount = upCount
                    }
                    huanIdxList.sort((a, b) => a - b)
                    // console.log("排序==", huanIdxList)
                    for (let i = 0; i < huanIdxList.length; i++) {
                        let com = this._standTileList.find(c => c.huanIdx == huanIdxList[i])
                        if (com) {
                            com.huanIdx = 0
                            com.updateTilePos(cc.v2(com.node.x, 0))
                            downCount--
                        }
                        if (downCount <= 0) {
                            break;
                        }
                    }
                }
                tileCom.huanIdx = Date.now()
            } else {
                for (let i = 0; i < this._standTileList.length; i++) {
                    const com = this._standTileList[i];
                    com.updateTilePos(cc.v2(com.node.x, 0))
                }
                cc.systemEvent.emit("tileUp", tileCom)
            }
            tileCom.updateTilePos(cc.v2(tileCom.node.x, this._tileUpY))
        }
    },

    /**花色检测 true颜色一样 */
    checkColor(huanPaiList) {
        let color = -1
        for (let i = 0; i < huanPaiList.length; i++) {
            const card = huanPaiList[i];
            if (color == -1) {
                color = XZLogic.getCardColor(card)
            } else {
                if (color !== XZLogic.getCardColor(card)) {
                    return false
                }
            }
        }
        return true
    },

    /**发送换三张 */
    onHuanSanZhang() {
        let huanPaiList = []
        for (let i = 0; i < this._standTileList.length - 1; i++) {
            const com = this._standTileList[i];
            if (com.node.y == this._tileUpY) {
                huanPaiList.push(com.flower)
            }
        }
        if (huanPaiList.length !== 3) {
            /**数量不够 */
            AssetsManager.tipDialog("请选择三张牌！")
            return
        }
        if (!this.checkColor(huanPaiList)) {
            /**花色不同 */
            AssetsManager.tipDialog("请选择花色一样的牌！")
            return
        }
        /**发送换牌消息 */
        ApiRoom.gameMessageNotify(ApiXz.gameHuanPaiNotify(huanPaiList));
    },

    /**
     * 刷新立起来的牌
     * @param {Array} tileArr 手牌列表
     * @param {number} drawTile 摸的牌
     * @param {boolean} isAni 是否播放发牌动画
     */
    updateStandTiles(tileArr, drawTile = null, isAni = false) {
        this._tileIdList = tileArr
        this.node.active = true
        this.standLayout.active = true
        this.lieLayout.active = false
        let drawIndex = tileArr.indexOf(drawTile);
        for (let i = 0; i < this._standTileList.length - 1; i++) {
            const t = tileArr[i];
            const com = this._standTileList[i]
            if (t) {
                com.flower = t
                com.setNodeShow(true)
                com.setNodeOpacity(255)
                com.updateTilePos(cc.v2(com.node.x, 0))
                if (drawIndex != -1 &&
                    drawIndex == i &&
                    i != tileArr.length - 1) {
                    this.showSortTileAni(com);
                }
            } else {
                com.setNodeShow(false)
            }
        }

        if (this._idx == 0 && isAni) {
            let dt = 0
            for (let i = 0; i < this._standTileList.length - 1; i++) {
                const com = this._standTileList[i];
                if (i != 0 && i % 4 == 0) {
                    dt += 0.2
                }
                if (com.node.active) {
                    com.runTileAnimate(dt)
                }
            }
        }
    },

    /**
     * 刷新摊开的牌
     * @param {Array} tileArr 手牌数组
     * @param {number} huId 胡的牌或者摸的牌
     */
    updateLieTiles(tileArr, huId = null) {
        this._tileIdList = tileArr
        this.standLayout.active = false
        this.lieLayout.active = true
        this.node.active = true
        this._standTileList[this._standTileList.length - 1].setNodeShow(false)
        for (let i = 0; i < this._lieTileList.length; i++) {
            const com = this._lieTileList[i];
            const t = tileArr[i];
            if (t) {
                com.flower = t
                com.setNodeShow(true)
                com.setNodeOpacity(255)
            } else {
                if (i == this._lieTileList.length - 1) {
                    com.setNodeShow(true)
                    if (huId && typeof (huId) == "number") {
                        com.flower = huId
                        com.setNodeOpacity(255)
                    } else {
                        com.setNodeOpacity(0)
                    }
                } else
                    com.setNodeShow(false)
            }
        }
    },

    /**设置轮到自己操作 */
    setIsMyTurn() {
        if (this._idx != 0) {
            return
        }
        const type = XZModel.getDingQueType(XZModel.getMyChairID())
        if (type != -1 && XZModel.getHasDingQueCard()) {
            for (let i = 0; i < this._standTileList.length; i++) {
                const com = this._standTileList[i]
                if (com.flower != 60) {
                    let hua = XZLogic.getCardColor(com.flower)
                    com.setGray(hua != type)
                    com.isNoTouch = hua != type
                }
            }
        } else {
            this.setNoTouch(false)
        }

        if (cc.isValid(this.tip1) && cc.isValid(this.tip2)) {
            let lastopt = XZModel.getLastOperate()
            if (lastopt) {
                // this.tip2.active = true
                // this.tip1.active = false
                if (lastopt.operate == ApiXz.operateType.PENG) {
                    this.setPengChu()
                }
            } else {
                this.tip1.active = true
                this.tip2.active = false
            }
        }
    },

    hideTips() {
        if (cc.isValid(this.tip1)) this.tip1.active = false
        if (cc.isValid(this.tip2)) this.tip2.active = false
    },

    /**设置换三张推荐牌 */
    setHuanPai(suggestList) {
        this.setAllTilesDown()
        let hidx = 1
        for (let i = 0; i < suggestList.length; i++) {
            const t = suggestList[i];
            let com = this._standTileList.find(c => {
                return (c.flower == t && c.node.y == 0)
            })
            if (com) {
                com.updateTilePos(cc.v2(com.node.x, this._tileUpY))
                com.huanIdx = Date.now() + hidx++
            }
        }
        this.setNoTouch(false)
    },

    /**个人换牌完成 */
    onHuanPaiChoose(data) {
        let list = data.cardList
        for (let i = 0; i < list.length; i++) {
            let t = list[i]
            let com = null
            if (this._idx == 0) {
                com = this._standTileList.find(c => {
                    return (c.node.y == this._tileUpY && c.flower == t)
                })
                if (com) {
                    com.updateTilePos(cc.v2(com.node.x, 0))
                }
            } else {
                // if (!t || t == 60) {
                com = this._standTileList[i]
                // }
            }
            if (com) {
                com.setNodeShow(false)
            }
        }
    },

    /**换牌完成 */
    onHuanPaiEnd(data) {
        /**等换牌动画播放完成后刷新 */
        this.scheduleOnce(() => {
            let cards = XZModel.getHandCards(data.chairID);
            this.updateStandTiles(cards, null, false)
            if (this._idx == 0) {
                let cardList = data.cardList.slice()
                this.setHuanPai(cardList)
            }
        }, 1.5)
    },

    /**设置禁止触摸 true为禁止触摸*/
    setNoTouch(isNoTouch) {
        for (let i = 0; i < this._standTileList.length; i++) {
            const com = this._standTileList[i]
            com.isNoTouch = isNoTouch
            if (isNoTouch) {
                com.setMaskShow(false)
                com.setGray(false)
                com.updateTilePos(cc.v2(com.node.x, 0))
            }
        }
    },

    /**碰牌后设置牌分离 */
    setPengChu() {
        if (XZModel.getGameStatus() == ApiXz.gameStatus.PLAYING) {
            /**轮到自己出牌的时候把最后一张牌放到摸牌位置 */
            let drawTile = this._standTileList[this._standTileList.length - 1];
            if (!drawTile.node.active || !drawTile.node.opacity) {
                let lastTile = null
                for (let i = this._standTileList.length - 2; i >= 0; i--) {
                    lastTile = this._standTileList[i]
                    if (lastTile.node.active && lastTile.node.opacity) {
                        break;
                    }
                }
                if (lastTile) {
                    let drawTile1 = this.setDrawTile(lastTile.flower, false);
                    if (drawTile1) {
                        lastTile.setNodeShow(false)
                        drawTile1.isNoTouch = lastTile.isNoTouch
                        drawTile1.setGray(drawTile1.isNoTouch)
                    }
                }
            }
        }
    },

    /**设置所有手牌放下去 */
    setAllTilesDown() {
        for (let i = 0; i < this._standTileList.length; i++) {
            const com = this._standTileList[i]
            com.updateTilePos(cc.v2(com.node.x, 0))
        }
    },

    /**摸牌 */
    setDrawTile(tileId = -1, isAni = false) {
        let drawTileMgr = this._standTileList[this._standTileList.length - 1]
        if (!tileId || tileId == -1) {
            drawTileMgr.setNodeOpacity(0)
            return
        }
        drawTileMgr.flower = tileId
        drawTileMgr.setNodeShow(true)
        if (this._idx == 0 && isAni) {
            drawTileMgr.runTileAnimate()
        } else {
            drawTileMgr.setNodeOpacity(255)
        }
        return drawTileMgr
    },

    /**展示理牌动画 */
    showSortTileAni(handTile) {
        if (this._idx != 0) return;
        let drawTile = this._standTileList[this._standTileList.length - 1]
        if (!handTile || !drawTile) return;
        let flyNode = cc.instantiate(drawTile.node)
        flyNode.name = "flyNode"
        flyNode.opacity = 255
        flyNode.active = true
        flyNode.parent = AssetsManager.root
        flyNode.scale = this.node.scale
        let startPos = CCUtil.postionConvert(drawTile.node, AssetsManager.root)
        let endPos = CCUtil.postionConvert(handTile.node, AssetsManager.root)
        // console.log("开始和结束的位置==", startPos.x, startPos.y, endPos.x, endPos.y)
        flyNode.setPosition(startPos)
        this.setDrawTile()
        handTile.setNodeOpacity(0)
        let dt = Math.abs(startPos.x - endPos.x) / 4000
        if (dt > 0.2) {
            dt = 0.2
        }
        cc.tween(flyNode).by(0.05, {
            y: 100,
        }).to(0, {
            angle: -45
        }).to(dt, {
            x: endPos.x
        }).to(0, {
            angle: 0
        }).by(0.05, {
            y: -100
        }).call(() => {
            handTile.setNodeOpacity(255);
            flyNode.destroy();
        }).start();
    },

    /**胡牌 */
    setHuTile(tileId) {
        let hucom = this._lieTileList[this._lieTileList.length - 1]
        let mocom = this._standTileList[this._standTileList.length - 1]
        mocom.setNodeShow(false)
        hucom.flower = tileId
        hucom.setNodeShow(true)
        hucom.setNodeOpacity(255)
        return hucom.node
    },

    /**设置听牌标记显示 */
    setTingIcons(tingList = []) {
        this.checkTingInfo(tingList);
        this._standTileList.forEach(t => {
            let tingType = 0;
            if (tingList.includes(t.flower)) {
                let tingInfo = this.getTingTile(t.flower);
                // console.log('听牌检测', this._tingInfo, tingInfo);
                if (tingInfo && tingInfo.rate == this._maxRate && this._maxRate > 1) {
                    tingType = 3;
                } else if (tingInfo && tingInfo.count == this._maxCount && this._maxCount > 1) {
                    tingType = 2;
                } else {
                    tingType = 1;
                }
            }
            t.setTingIcon(tingType);
        });
    },

    checkTingInfo(tingList) {
        this._tingInfo = [];
        this._maxRate = -1;
        this._maxCount = -1;
        for (const ting of tingList) {
            let handTiles = XZModel.getHandCards(XZModel.getMyChairID())
            let idx = handTiles.indexOf(ting);
            let tingInfo = {
                tile: null,
                rate: 0,
                count: 0
            };
            if (idx != -1) {
                handTiles.splice(idx, 1);
                tingInfo.tile = ting;
            }
            let rates = [];
            let canWinList = XZLogic.getCanWinCards(handTiles, true);
            if (canWinList.length > 0) {
                for (let i = 0; i < canWinList.length; i++) {
                    let item = canWinList[i];
                    item.count = XZModel.getRestCardCount(item.card);
                    tingInfo.count += item.count;
                    rates.push(item.rate);
                }
                tingInfo.rate = Math.max(...rates);
            }
            this._tingInfo.push(tingInfo);
        }
        let tingCount = this._tingInfo.length;
        if (tingCount > 0) {
            let tempMaxRate = this._tingInfo.slice();
            tempMaxRate.sort((a, b) => {
                return b.rate - a.rate;
            });
            if (tempMaxRate[0].rate != tempMaxRate[tingCount - 1].rate) {
                this._maxRate = tempMaxRate[0].rate;
            }
            let tempMaxCount = this._tingInfo.slice();
            tempMaxCount.sort((a, b) => {
                return b.count - a.count;
            });
            if (tempMaxCount[0].count != tempMaxCount[tingCount - 1].count) {
                this._maxCount = tempMaxCount[0].count;
            }
        }
    },

    getTingTile(tile) {
        let ting = this._tingInfo.find((item) => {
            return item.tile == tile;
        })
        return ting;
    },

    reset() {
        this.setAllTilesDown()
        for (let i = 0; i < this._standTileList.length; i++) {
            const com = this._standTileList[i]
            com.flower = 60
            com.huanIdx = 0
            com.reset()
            const com1 = this._lieTileList[i]
            com1.flower = 60
            com1.reset()
            com1.setNodeShow(false)
            if (i < 14) {
                com.setNodeShow(false)
            } else {
                com.setNodeShow(true)
                com.setNodeOpacity(0)
            }
        }
        this.hideTips()
    },



    // update (dt) {},
});