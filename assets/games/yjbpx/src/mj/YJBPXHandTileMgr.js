const YJBPXLogic = require('../YJBPXLogic');
const YJBPXModel = require('../YJBPXModel');
const AssetsManager = require('../../../../src/utils/AssetsManager');
const Enums = require('../../../../src/const/Enums');
const ApiYjbpx = require('../ApiYjbpx');
const ApiRoom = require('../../../../src/api/ApiRoom');
const CCUtil = require('../../../../src/utils/CCUtil');
const MessageCallback = require('../../../../src/utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        standPfb: cc.Prefab, //立起来的牌
        liePfb: cc.Prefab, //平摊的牌
        standLayout: cc.Node,
        lieLayout: cc.Node,
        baiLayout: cc.Node,
        /**本地位置号 */
        _idx: null,
        _tileUpY: 40,
        /**手牌脚本列表 */
        _standTileList: null,
        _lieTileList: null,
        _baiTileList: null,
    },

    onDestroy() {
        cc.systemEvent.off("discard", this.onDiscard, this)
        cc.systemEvent.off("chooseCard", this.onChooseCard, this)
        cc.systemEvent.off("enterHuanPai", this.onHuanSanZhang, this)
    },

    /**初始化 */
    init(idx) {
        if (this._idx == null) {
            this._idx = idx;
        } else {
            return;
        }
        if (this._idx == 0) {
            cc.systemEvent.on("discard", this.onDiscard, this);
            cc.systemEvent.on("chooseCard", this.onChooseCard, this);
            cc.systemEvent.on("enterHuanPai", this.onHuanSanZhang, this);
            this.node.scale = CCUtil.getHandCardScale(13);
            this.scheduleOnce(() => {
                this.node.getComponent(cc.Widget).updateAlignment();
            }, 0.1)
        }
        this._standTileList = [];
        this._lieTileList = [];
        this._baiTileList = [];
        for (let i = 0; i < 15; i++) {
            let stand = cc.instantiate(this.standPfb);
            let lie = cc.instantiate(this.liePfb);
            let bai = cc.instantiate(this.liePfb);

            let scom = stand.addComponent('YJBPXSingleTile');
            let lcom = lie.addComponent('YJBPXSingleTile');
            let bcom = bai.addComponent('YJBPXSingleTile');
            scom.init();
            lcom.init();
            bcom.init();
            if (this._idx === 0) {
                scom.setTouchListener();
            }
            lcom.setNodeShow(false);
            bcom.setNodeShow(false);
            this._standTileList.push(scom);
            this._lieTileList.push(lcom);
            this._baiTileList.push(bcom)
            stand.name = i.toString();
            lie.name = i.toString();
            if (i < 14) {
                stand.parent = this.standLayout;
                lie.parent = this.lieLayout;
                bai.parent = this.baiLayout;
                scom.setNodeShow(false);
            } else {
                stand.parent = this.node;
                lie.parent = this.node;
                scom.setNodeOpacity(0);
                if (this._idx == 0) {
                    lie.y = -12;
                }
            }
        }
        this.setTouch(false);
        this.baiLayout.active = false;
    },

    /**出牌 */
    onDiscard(tileCom) {
        //如果没有完成初始化，不能出牌
        if (!YJBPXModel.isGameInited()) {
            return
        }
        if (YJBPXModel.getCurOptUID() != YJBPXModel.getMyUID()) return;
        let gameStatus = YJBPXModel.getGameStatus();
        if (gameStatus == ApiYjbpx.gameStatus.PLAYING) {
            let flower = tileCom.flower;
            /**鬼牌不能出 */
            let g = YJBPXModel.getGhostCard()
            if (g.includes(flower)) {
                AssetsManager.tipDialog("癞子牌不能出！")
                return;
            }

            /**必胡可胡的时候不能出牌 */
            if (YJBPXModel.getIsBiHuing()) {
                console.log("必胡状态不能出牌")
                return
            }

            /**发送出牌消息 */
            ApiRoom.gameMessageNotify(ApiYjbpx.gameOperateNotify(flower, ApiYjbpx.operateType.QI));

            /**如果这张牌是摸的牌 直接隐藏*/
            if (parseInt(tileCom.node.name) === this._standTileList.length - 1) {
                this.setDrawTile();
            }
        }
    },

    /**选中牌 */
    onChooseCard(tileCom) {
        let g = YJBPXModel.getGameStatus();
        if (!g) return;
        if (tileCom.node.y == this._tileUpY) {
            if (g == ApiYjbpx.gameStatus.HUANSANZHANG) { //换三张可以选3张牌

            } else {
                this.onDiscard(tileCom);
            }
        } else {
            if (g == ApiYjbpx.gameStatus.HUANSANZHANG) {

            } else {
                for (let i = 0; i < this._standTileList.length; i++) {
                    const com = this._standTileList[i];
                    com.updateTilePos(cc.v2(com.node.x, 0));
                }
                cc.systemEvent.emit("tileUp", tileCom);
            }
            tileCom.updateTilePos(cc.v2(tileCom.node.x, this._tileUpY));
        }
    },

    /**发送换三张 */
    onHuanSanZhang() {

    },

    /**
     * 刷新立起来的牌
     * @param {Array} tileArr 手牌列表
     * @param {number} drawTile 摸的牌
     * @param {boolean} isAni 是否播放发牌动画
     */
    updateStandTiles(tileArr, drawTile = null, isAni = false) {
        this.node.active = true;
        this.standLayout.active = true;
        this.lieLayout.active = false;
        if (tileArr.length == 0) {
            this.standLayout.active = false;
            return;
        }
        let drawIndex = tileArr.indexOf(drawTile);
        for (let i = 0; i < this._standTileList.length - 1; i++) {
            const card = tileArr[i];
            const com = this._standTileList[i];
            if (card != null) {
                com.flower = card;
                com.setNodeOpacity(255);
                if (drawIndex != -1 &&
                    drawIndex == i &&
                    i != tileArr.length - 1) {
                    this.showDraw(com);
                }
                com.setNodeShow(true);
                com.updateTilePos(cc.v2(com.node.x, 0));
            } else {
                com.setNodeShow(false);
            }
        }

        if (this._idx == 0 && isAni) {
            let dt = 0;
            let playSound = (time) => {
                this.scheduleOnce(() => {
                    AssetsManager.playEffect({
                        path: 'res/audio/main/send',
                        bundle: Enums.bundleType.YJBPX
                    });
                }, time)
            }
            for (let i = 0; i < this._standTileList.length - 1; i++) {
                const com = this._standTileList[i];
                if (i == 0) {
                    playSound(dt)
                }
                if (i != 0 && i % 4 == 0) {
                    dt += 0.2;
                    playSound(dt)
                }
                if (com.node.active) {
                    com.runTileAnimate(dt);
                }
            }
        }
    },

    /**
     * 刷新摊开的牌
     * @param {Array} tileArr 手牌数组
     */
    updateLieTiles(tileArr) {
        this.standLayout.active = false
        this.lieLayout.active = true
        this.node.active = true
        if (tileArr.length == 0) {
            this.lieLayout.active = false
            return
        }
        this._standTileList[this._standTileList.length - 1].setNodeShow(false);
        for (let i = 0; i < this._lieTileList.length - 1; i++) {
            const com = this._lieTileList[i];
            const card = tileArr[i];
            if (card != null) {
                com.flower = card;
                com.setNodeShow(true);
                com.setNodeOpacity(255);
            } else {
                com.setNodeShow(false);
            }
        }
    },

    /**设置轮到自己操作 */
    setIsMyTurn() {
        const type = YJBPXModel.getDingQueType(YJBPXModel.getMyUID());
        if (type != -1 && YJBPXModel.getHasDingQueCard()) {
            for (let i = 0; i < this._standTileList.length; i++) {
                const com = this._standTileList[i];
                if (com.flower != 0) {
                    let hua = YJBPXLogic.getCardColor(com.flower);
                    com.setGray(hua != type);
                    com.isTouch = hua == type;
                }
            }
        } else {
            this.setTouch(true);
        }
    },

    /**设置换三张推荐牌 */
    setHuanPai(suggestList) {

    },

    /**个人换牌完成 */
    onHuanPaiChoose(data) {

    },

    /**换牌完成 */
    onHuanPaiEnd(data) {

    },

    /**设置触摸true为触摸*/
    setTouch(isTouch) {
        if (this._idx != 0) {
            return
        }
        for (let i = 0; i < this._standTileList.length; i++) {
            const com = this._standTileList[i];
            com.isTouch = isTouch;
            if (!com.isTouch) {
                com.setMaskShow(false);
            }
        }
    },

    /**碰牌后设置牌分离 */
    setPengChu() {
        if (YJBPXModel.getGameStatus() == ApiYjbpx.gameStatus.PLAYING) {
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
                        drawTile.isTouch = lastTile.isTouch
                        drawTile.setGray(!drawTile.isTouch)
                        drawTile.updateTilePos(cc.v2(drawTile.node.x, 0));
                    }
                }
            }
        }
    },

    /**设置所有手牌放下去 */
    setAllTilesDown() {
        for (let i = 0; i < this._standTileList.length; i++) {
            const com = this._standTileList[i];
            com.updateTilePos(cc.v2(com.node.x, 0));
        }
    },

    /**摸牌 */
    setDrawTile(tileId = null, isAni = false) {
        let drawTile = this._standTileList[this._standTileList.length - 1];
        if (tileId == null) {
            drawTile.setNodeOpacity(0);
            return;
        }
        drawTile.flower = tileId;
        drawTile.setNodeShow(true);
        if (this._idx == 0 && isAni) {
            drawTile.runTileAnimate();
        } else {
            drawTile.setNodeOpacity(255);
        }
        return drawTile
    },

    /**展示理牌动画 */
    showDraw(handTile) {
        if (this._idx != 0) return;
        let drawTile = this._standTileList[this._standTileList.length - 1]
        if (!handTile || !drawTile) return;
        let flyNode = cc.instantiate(drawTile.node);
        flyNode.name = "flyNode";
        flyNode.opacity = 255;
        flyNode.active = true;
        flyNode.parent = AssetsManager.getRoot();
        flyNode.scale = this.node.scale
        let startPos = CCUtil.postionConvert(drawTile.node, AssetsManager.getRoot());
        let endPos = CCUtil.postionConvert(handTile.node, AssetsManager.getRoot());
        let dt = Math.abs(startPos.x - endPos.x) / 4000
        if (dt > 0.2) {
            dt = 0.2
        }
        // console.log("dt==", dt)
        flyNode.setPosition(startPos);
        handTile.setNodeOpacity(0);
        cc.tween(flyNode)
            .by(0.1, {
                y: 100,
            }).to(0, {
                angle: -45
            }).to(dt, {
                x: endPos.x
            }).to(0, {
                angle: 0
            }).by(0.1, {
                y: -100
            }).call(() => {
                handTile.setNodeOpacity(255);
                flyNode.destroy();
            }).start();
    },

    /**胡牌 */
    setHuTile(tileId = null) {
        let hucom = this._lieTileList[this._lieTileList.length - 1];
        let mocom = this._standTileList[this._standTileList.length - 1];
        if (tileId == null) {
            mocom.setNodeOpacity(0);
            hucom.setNodeOpacity(0);
            return;
        }
        mocom.setNodeShow(false);
        hucom.flower = tileId;
        hucom.setNodeShow(true);
        hucom.setNodeOpacity(255);
        return hucom.node
    },

    /**设置听牌标记显示 */
    setTingIcons(tingList = []) {
        this._standTileList.forEach(card => {
            let matched = tingList.find((item) => {
                return item == card.flower;
            })
            card.setTingIcon(!!matched);
        });
    },

    showHuAniFire() {
        this._standTileList.forEach(com => {
            if (com.node.active) {
                com.showFireAni()
            }
        })
    },

    setAllGray(isShow = false) {
        for (let i = 0; i < this._standTileList.length; i++) {
            const com = this._standTileList[i];
            com.setGray(isShow);
        }
    },

    reset() {
        this.setAllTilesDown();
        this.baiLayout.active = false
        for (let i = 0; i < this._standTileList.length; i++) {
            const com = this._standTileList[i];
            com.flower = 0;
            com.reset();
            if (i < 14) {
                com.setNodeShow(false);
            } else {
                com.setNodeShow(true);
                com.setNodeOpacity(0);
            }

            const com1 = this._lieTileList[i];
            com1.flower = 0;
            com1.reset();
            com1.setNodeShow(false);
        }
    },

    /**摆牌完成 */
    onBaiPaiEnd(bpList) {
        if (!bpList || !bpList.length) {
            this.baiLayout.active = false
            return
        }
        bpList.sort()
        this.baiLayout.active = true
        /**刷新摆牌 */
        for (let i = 0; i < this._baiTileList.length; i++) {
            const bcom = this._baiTileList[i];
            bcom.setNodeShow(false)
            let id = bpList[i]
            if (id) {
                bcom.flower = id
                bcom.setNodeShow(true)
                bcom.setBaiPai()
            }
        }
    },
});