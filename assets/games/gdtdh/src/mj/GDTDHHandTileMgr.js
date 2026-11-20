const GDTDHLogic = require('../GDTDHLogic');
const GDTDHModel = require('../GDTDHModel');
const AssetsManager = require('../../../../src/utils/AssetsManager');
const Enums = require('../../../../src/const/Enums');
const ApiGdtdh = require('../ApiGdtdh');
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
        /**本地位置号 */
        _idx: null,
        /**手牌脚本列表 */
        _standTileList: null,
        _lieTileList: null,
        /**手牌id列表 */
        _tileIdList: null,
        /**换牌列表 */
        _huanPaiList: null,
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
            this.node.scale = CCUtil.getHandCardScale(13)
            this.scheduleOnce(() => {
                this.node.getComponent(cc.Widget).updateAlignment();
            }, 0.1)
        }
        this._standTileList = [];
        this._lieTileList = [];
        this._tileIdList = [];
        for (let i = 0; i < 15; i++) {
            let stand = cc.instantiate(this.standPfb);
            let lie = cc.instantiate(this.liePfb);
            let scom = stand.addComponent('GDTDHSingleTile');
            let lcom = lie.addComponent('GDTDHSingleTile');
            scom.init();
            if (this._idx === 0) {
                scom.setTouchListener();
            }
            lcom.init();
            lcom.setNodeShow(false);
            this._standTileList.push(scom);
            this._lieTileList.push(lcom);
            stand.name = i.toString();
            lie.name = i.toString();
            if (i < 14) {
                stand.parent = this.standLayout;
                lie.parent = this.lieLayout;
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
    },

    /**出牌 */
    onDiscard(tileCom) {
        if (GDTDHModel.getCurOptUID() != GDTDHModel.getMyUID()) return;
        let gameStatus = GDTDHModel.getGameStatus();
        if (gameStatus == ApiGdtdh.gameStatus.PLAYING) {
            /**发送出牌消息 */
            let flower = tileCom.flower;
            let ghostCard = GDTDHModel.getGhostCard()
            if (ghostCard.includes(flower)) {
                AssetsManager.tipDialog("鬼牌不能打出")
                return
            }
            ApiRoom.gameMessageNotify(ApiGdtdh.gameOperateNotify(flower, ApiGdtdh.operateType.QI));
            /**如果这张牌是摸的牌 直接隐藏*/
            if (parseInt(tileCom.node.name) === this._standTileList.length - 1) {
                this.setDrawTile();
            }
        }
    },

    /**选中牌 */
    onChooseCard(tileCom) {
        let g = GDTDHModel.getGameStatus();
        if (!g) return;
        if (tileCom.node.y == 40) {
            if (g == ApiGdtdh.gameStatus.HUANSANZHANG) { //换三张可以选3张牌
                tileCom.updateTilePos(cc.v2(tileCom.node.x, 0));
                let idx = this._huanPaiList.indexOf(tileCom.flower);
                if (idx != -1) {
                    this._huanPaiList.splice(idx, 1);
                }
            } else {
                this.onDiscard(tileCom);
            }
        } else {
            if (g == ApiGdtdh.gameStatus.HUANSANZHANG) {
                //换三张只可以选3张牌 注意不能把摸的那张牌算进去
                let upCount = 0;
                for (let i = 0; i < this._standTileList.length - 1; i++) {
                    const com = this._standTileList[i];
                    if (com.node.y == 40) {
                        upCount++;
                    }
                }
                if (upCount >= 3) {
                    AssetsManager.tipDialog("只能选三张牌！");
                    return
                }
                this._huanPaiList.push(tileCom.flower);
            } else {
                for (let i = 0; i < this._standTileList.length; i++) {
                    const com = this._standTileList[i];
                    com.updateTilePos(cc.v2(com.node.x, 0));
                }
                cc.systemEvent.emit("tileUp", tileCom);
            }
            tileCom.updateTilePos(cc.v2(tileCom.node.x, 40));
        }
    },

    /**发送换三张 */
    onHuanSanZhang() {
        if (this._huanPaiList.length !== 3) {
            /**数量不够 */
            AssetsManager.tipDialog("请选择三张牌！");
            return
        }
        let color = -1;
        for (let i = 0; i < this._huanPaiList.length; i++) {
            const card = this._huanPaiList[i];
            if (color == -1) {
                color = GDTDHLogic.getCardColor(card)
            } else {
                if (color !== GDTDHLogic.getCardColor(card)) {
                    /**花色不同 */
                    AssetsManager.tipDialog("请选择花色一样的牌！")
                    return
                }
            }
        }
        /**发送换牌消息 */
        ApiRoom.gameMessageNotify(ApiGdtdh.gameHuanPaiNotify(this._huanPaiList));
    },

    /**
     * 刷新立起来的牌
     * @param {Array} tileArr 手牌列表
     * @param {number} drawTile 摸的牌
     * @param {boolean} isAni 是否播放发牌动画
     */
    updateStandTiles(tileArr, drawTile = null, isAni = false) {
        this._tileIdList = tileArr;
        this.node.active = true;
        this.standLayout.active = true;
        this.lieLayout.active = false;
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
            for (let i = 0; i < this._standTileList.length - 1; i++) {
                const com = this._standTileList[i];
                if (i != 0 && i % 4 == 0) {
                    dt += 0.2;
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
     * @param {number} drawTile 胡的牌或者摸的牌
     */
    updateLieTiles(tileArr, drawTile = null) {
        this._tileIdList = tileArr
        this.standLayout.active = false
        this.lieLayout.active = true
        this.node.active = true
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
        const type = GDTDHModel.getDingQueType(GDTDHModel.getMyUID());
        if (type != -1 && GDTDHModel.getHasDingQueCard()) {
            for (let i = 0; i < this._standTileList.length; i++) {
                const com = this._standTileList[i];
                if (com.flower != 0) {
                    let hua = GDTDHLogic.getCardColor(com.flower);
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
        this.setAllTilesDown();
        this._huanPaiList = suggestList;
        for (let i = 0; i < suggestList.length; i++) {
            const card = suggestList[i];
            let com = this._standTileList.find(c => {
                return (c.flower == card && c.node.y == 0);
            })
            if (com) {
                com.updateTilePos(cc.v2(com.node.x, 40));
            }
        }
        this.setTouch(true);
    },

    /**个人换牌完成 */
    onHuanPaiChoose(data) {
        let list = data.cardList;
        for (let i = 0; i < list.length; i++) {
            let card = list[i];
            let com = null;
            if (this._idx == 0) {
                com = this._standTileList.find(c => {
                    return (c.node.y == 40 && c.flower == card);
                })
                if (com) {
                    com.updateTilePos(cc.v2(com.node.x, 0));
                }
            } else {
                com = this._standTileList[i];
            }
            if (com) {
                com.setNodeShow(false);
            }
        }
    },

    /**换牌完成 */
    onHuanPaiEnd(data) {
        /**等换牌动画播放完成后刷新 */
        this.scheduleOnce(() => {
            let cards = GDTDHModel.getHandCards(data.uid);
            this.updateStandTiles(cards, null, false);
            if (this._idx == 0) {
                let cardList = data.cardList.slice();
                this.setHuanPai(cardList);
            }
        }, 1.5)
    },

    /**设置触摸true为触摸*/
    setTouch(isTouch) {
        for (let i = 0; i < this._standTileList.length; i++) {
            const com = this._standTileList[i];
            com.isTouch = isTouch;
            if (!isTouch) {
                com.setMaskShow(false);
                com.setGray(false);
                com.updateTilePos(cc.v2(com.node.x, 0));
            }
        }
    },

    /**碰牌后设置牌分离 */
    setPengChu() {
        if (GDTDHModel.getGameStatus() == ApiGdtdh.gameStatus.PLAYING) {
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
        flyNode.scale = this.node.scale;
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
            .by(0.05, {
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

    reset() {
        this.setAllTilesDown();
        for (let i = 0; i < this._standTileList.length; i++) {
            const com = this._standTileList[i];
            com.flower = 0;
            com.reset();
            const com1 = this._lieTileList[i];
            com1.flower = 0;
            com1.reset();
            com1.setNodeShow(false);
            if (i < 16) {
                com.setNodeShow(false);
            } else {
                com.setNodeShow(true);
                com.setNodeOpacity(0);
            }
        }
    },

});