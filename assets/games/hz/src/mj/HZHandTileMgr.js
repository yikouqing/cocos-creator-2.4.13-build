const HZModel = require('../HZModel');
const AssetsManager = require('../../../../src/utils/AssetsManager');
const Enums = require('../../../../src/const/Enums');
const ApiHz = require('../ApiHz');
const ApiRoom = require('../../../../src/api/ApiRoom');
const CCUtil = require('../../../../src/utils/CCUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        standPfb: cc.Prefab, //立起来的牌
        liePfb: cc.Prefab, //平摊的牌
        standLayout: cc.Node,
        lieLayout: cc.Node,
        /**本地位置号 */
        _idx: null,
        /**手牌脚本列表 */
        _standTileList: null,
        _lieTileList: null,
        /**手牌id列表 */
        _tileIdList: null,
        /**鬼牌列表 */
        _ghostList: [],
    },


    onDestroy() {
        cc.systemEvent.off("discard", this.onDiscard, this)
        cc.systemEvent.off("chooseCard", this.onChooseCard, this)
    },

    /**初始化 */
    init(idx, ghostList) {
        if (this._idx == null) {
            this._idx = idx
            this._ghostList = ghostList
        } else {
            // console.log("已经初始化过了")
            return
        }
        if (this._idx == 0) {
            cc.systemEvent.on("discard", this.onDiscard, this)
            cc.systemEvent.on("chooseCard", this.onChooseCard, this)
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
            stand.name = i.toString();
            lie.name = i.toString();
            let scom = stand.addComponent('HZSingleTile')
            let lcom = lie.addComponent('HZSingleTile')
            scom.init()

            if (this._idx === 0) {
                scom.setTouchListener()
            }
            lcom.init()
            lcom.setNodeShow(false)
            this._standTileList.push(scom)
            this._lieTileList.push(lcom)
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
        if (HZModel.getCurOptChairID() != HZModel.getMyChairID()) { //是否轮到自己操作
            return
        }
        let g = HZModel.getGameStatus()
        if (g == ApiHz.gameStatus.PLAYING) {
            /**发送出牌消息 */
            ApiRoom.gameMessageNotify(ApiHz.gameOperateNotify(tileCom.flower, ApiHz.operateType.QI));
            /**如果这张牌是摸的牌 直接隐藏*/
            if (parseInt(tileCom.node.name) === this._standTileList.length - 1) {
                this.setDrawTile();
            }
        }
    },

    /**选中牌 */
    onChooseCard(tileCom) {
        let g = HZModel.getGameStatus()
        if (!g) {
            return
        }
        if (tileCom.node.y == 40) {
            this.onDiscard(tileCom)
        } else {
            for (let i = 0; i < this._standTileList.length; i++) {
                const com = this._standTileList[i];
                com.updateTilePos(cc.v2(com.node.x, 0))
            }
            cc.systemEvent.emit("tileUp", tileCom)
            tileCom.updateTilePos(cc.v2(tileCom.node.x, 40))
        }
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
                com.setGhostIcon(this._ghostList.includes(t))
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
                com.setGhostIcon(this._ghostList.includes(t))
            } else {
                if (i == this._lieTileList.length - 1) {
                    com.setNodeShow(true)
                    if (huId && typeof (huId) == "number") {
                        com.flower = huId
                        com.setNodeOpacity(255)
                        com.setGhostIcon(this._ghostList.includes(huId))
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
        this.setNoTouch(false)
        let lastopt = HZModel.getLastOperate()
        if (lastopt) {
            if (lastopt.operate == ApiHz.operateType.PENG) {
                this.setPengChu()
            }
        }
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
        if (HZModel.getGameStatus() == ApiHz.gameStatus.PLAYING) {
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
                    let drawTile = this.setDrawTile(lastTile.flower, false);
                    if (drawTile) {
                        lastTile.setNodeShow(false)
                        drawTile.isNoTouch = lastTile.isNoTouch
                        drawTile.setGray(drawTile.isNoTouch)
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
        drawTileMgr.setGhostIcon(this._ghostList.includes(tileId))
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
        hucom.setGhostIcon(this._ghostList.includes(tileId))
        return hucom.node
    },

    /**设置听牌标记显示 */
    setTingIcons(tingList = []) {
        this._standTileList.forEach(t => {
            t.setTingIcon(tingList.includes(t.flower))
        });
    },

    reset() {
        this.setAllTilesDown()
        for (let i = 0; i < this._standTileList.length; i++) {
            const com = this._standTileList[i]
            com.flower = 60
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
    },



    // update (dt) {},
});