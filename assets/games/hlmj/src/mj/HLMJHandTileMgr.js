const HLMJLogic = require('../HLMJLogic');
const HLMJModel = require('../HLMJModel');
const AssetsManager = require('../../../../src/utils/AssetsManager');
const Enums = require('../../../../src/const/Enums');
const ApiHlmj = require('../ApiHlmj');
const ApiRoom = require('../../../../src/api/ApiRoom');
const CCUtil = require('../../../../src/utils/CCUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        standPfb: cc.Prefab, //立起来的牌
        liePfb: cc.Prefab, //平摊的牌
        standLayout: cc.Node,
        lieLayout: cc.Node,
        baiLayout: cc.Node,
        com_ting: require("HLMJTingTips"),
        /**本地位置号 */
        _idx: null,
        /**手牌脚本列表 */
        _standTileList: null,
        _lieTileList: null,
        _baiTileList: null,
        /**是否正在摆牌中 */
        _isBaiPaing: false,
        /**牌抬起来的坐标 */
        _tileUpY: 40,
    },


    onDestroy() {
        cc.systemEvent.off("discard", this.onDiscard, this)
        cc.systemEvent.off("chooseCard", this.onChooseCard, this)
        cc.systemEvent.off("enterHuanPai", this.onHuanSanZhang, this)
        cc.systemEvent.off("qdbaipai", this.onBaiPai, this);
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
            cc.systemEvent.on("qdbaipai", this.onBaiPai, this);
            this.node.scale = CCUtil.getHandCardScale(13)
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

            let scom = stand.addComponent('HLMJSingleTile');
            let lcom = lie.addComponent('HLMJSingleTile');
            let bcom = bai.addComponent('HLMJSingleTile');
            scom.init();
            lcom.init();
            bcom.init();
            if (this._idx === 0) { //给自己添加点击响应
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
            } else { //摸的那张牌
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
        if (HLMJModel.getCurOptUID() != HLMJModel.getMyUID()) return;
        let gameStatus = HLMJModel.getGameStatus();
        if (gameStatus == ApiHlmj.gameStatus.PLAYING) {
            /**发送出牌消息 */
            /**如果手中有定缺的牌 只能打定缺牌 */
            if (HLMJModel.getHasDingQueCard(HLMJModel.getMyChairID()) &&
                HLMJLogic.getCardType(tileCom.flower) !== HLMJModel.getDingQueType(HLMJModel.getMyUID())) {
                AssetsManager.tipDialog("请先打定缺的牌！");
                return;
            }
            /**如果已经摆牌了，不能打出牌，系统自动打 */
            let isb = HLMJModel.getBaiPaiInfo(HLMJModel.getMyUID())
            if (isb.length > 0) {
                return;
            }
            // console.log('测试---打牌', tileCom.flower);
            ApiRoom.gameMessageNotify(ApiHlmj.gameOperateNotify(tileCom.flower, ApiHlmj.operateType.QI));
            /**如果这张牌是摸的牌 直接隐藏*/
            if (parseInt(tileCom.node.name) === this._standTileList.length - 1) {
                this.setDrawTile();
            }
        }
    },

    /**选中牌 */
    onChooseCard(tileCom) {
        let g = HLMJModel.getGameStatus();
        if (!g) return;
        if (tileCom.node.y == this._tileUpY) {
            if (g == ApiHlmj.gameStatus.HUANSANZHANG) { //换三张可以选3张牌
                tileCom.updateTilePos(cc.v2(tileCom.node.x, 0));
            } else if (this._isBaiPaing) { //摆牌状态选牌
                tileCom.updateTilePos(cc.v2(tileCom.node.x, 0));
                this.updateTingTip()
            } else {
                this.onDiscard(tileCom);
            }
        } else {
            if (g == ApiHlmj.gameStatus.HUANSANZHANG) {
                //换三张只可以选3张牌 注意不能把摸的那张牌算进去
                let upCount = 0;
                for (let i = 0; i < this._standTileList.length - 1; i++) {
                    const com = this._standTileList[i];
                    if (com.node.y == this._tileUpY) {
                        upCount++;
                    }
                }
                if (upCount >= 3) {
                    AssetsManager.tipDialog("只能选三张牌！");
                    return
                }
            } else if (this._isBaiPaing) { //摆牌状态选牌

            } else {
                for (let i = 0; i < this._standTileList.length; i++) {
                    const com = this._standTileList[i];
                    com.updateTilePos(cc.v2(com.node.x, 0));
                }
                cc.systemEvent.emit("tileUp", tileCom);
            }
            tileCom.updateTilePos(cc.v2(tileCom.node.x, this._tileUpY));
            if (this._isBaiPaing) { //摆牌状态选牌
                this.updateTingTip()
            }
        }
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
        let color = -1;
        for (let i = 0; i < huanPaiList.length; i++) {
            const card = huanPaiList[i];
            if (color == -1) {
                color = HLMJLogic.getCardType(card)
            } else {
                if (color !== HLMJLogic.getCardType(card)) {
                    /**花色不同 */
                    AssetsManager.tipDialog("请选择花色一样的牌！")
                    return
                }
            }
        }
        /**发送换牌消息 */
        ApiRoom.gameMessageNotify(ApiHlmj.gameHuanPaiNotify(huanPaiList));
    },

    /**确定摆牌 */
    onBaiPai() {
        let blist = []
        this._standTileList.forEach(com => {
            if (com.node.active && com.node.y != 0) {
                blist.push(com.flower)
            }
        });
        /**检测是否可以提交 */
        let handCards = HLMJModel.getHandCards(HLMJModel.getMyUID())
        let baiHuList = HLMJLogic.getBaiPaiHuCards(handCards, blist)
        // console.log("获取了摆牌后可以胡的牌==", baiHuList)
        if (!baiHuList || baiHuList.length == 0) {
            AssetsManager.tipDialog("请选择正确的摆牌！")
            return
        }
        /**发送换牌消息 */
        // console.log("发送了摆牌==", blist)
        ApiRoom.gameMessageNotify(ApiHlmj.gameShaiPaiNotify(blist));
    },

    /**
     * 刷新立起来的牌
     * @param {Array} tileArr 手牌列表
     * @param {number} drawTile 摸的牌
     * @param {boolean} isAni 是否播放发牌动画
     */
    updateStandTiles(tileArr, drawTile = null, isAni = false) {
        // console.trace("刷新了手牌==", tileArr)
        this.node.active = true;
        this.standLayout.active = true;
        this.lieLayout.active = false;
        let drawIndex = tileArr.indexOf(drawTile);
        let allHuCards = HLMJModel.getSelfAllHuCards()
        let isAnyShow = false
        for (let i = 0; i < this._standTileList.length - 1; i++) {
            const com = this._standTileList[i];
            if (i < this._standTileList.length - 1) {
                const card = tileArr[i];
                if (card || card === 0) {
                    com.flower = card;
                    com.setNodeOpacity(255);
                    if (drawIndex != -1 &&
                        drawIndex == i &&
                        i != tileArr.length - 1) {
                        this.showDraw(com);
                    }
                    com.setNodeShow(true);
                    com.updateTilePos(cc.v2(com.node.x, 0));
                    com.setGray(false)
                    /**检测是不是别人摆牌后不能出的牌 */
                    if (allHuCards.includes(card) && this._idx == 0) {
                        com.setGray(true)
                        com.isTouch = false
                    }
                } else {
                    com.setNodeShow(false);
                }
            }
            if (com.node.active && com.node.opacity > 0) {
                isAnyShow = true
            }
        }
        console.log("是否有牌==", isAnyShow)
        if (!isAnyShow) {
            this.standLayout.active = false
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
        const type = HLMJModel.getDingQueType(HLMJModel.getMyUID());
        if (type != -1 && HLMJModel.getHasDingQueCard()) {
            for (let i = 0; i < this._standTileList.length; i++) {
                const com = this._standTileList[i];
                if (com.flower != 0) {
                    let hua = HLMJLogic.getCardType(com.flower);
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
        for (let i = 0; i < suggestList.length; i++) {
            const card = suggestList[i];
            let com = this._standTileList.find(c => {
                return (c.flower == card && c.node.y == 0);
            })
            if (com) {
                com.updateTilePos(cc.v2(com.node.x, this._tileUpY));
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
                    return (c.node.y == this._tileUpY && c.flower == card);
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
    onHuanPaiEnd(data, isTest = false) {
        /**等换牌动画播放完成后刷新 */
        this.scheduleOnce(() => {
            let cards = HLMJModel.getHandCards(data.uid);
            if (this._idx == 0) {
                this.updateStandTiles(cards, null, false);
                let cardList = data.cardList.slice();
                this.setHuanPai(cardList);
            } else {
                if (!isTest) {
                    this.updateStandTiles(cards, null, false);
                } else
                    this.updateLieTiles(cards);
            }
        }, 1.5)
    },

    /**设置摆牌推荐 */
    setBaiPai(baiList = null) {
        if (!baiList || baiList.length == 0) {
            this._isBaiPaing = false
            this.setAllTilesDown();
            this.setTouch(HLMJModel.isTurn(HLMJModel.getMyUID()))
            return
        }
        this.setAllTilesDown(false, false);
        let arr = baiList.slice()
        this._standTileList.forEach(com => {
            let idx = arr.indexOf(com.flower)
            if (idx != -1) {
                com.updateTilePos(cc.v2(com.node.x, this._tileUpY));
                com.isTouch = true
                com.setGray(false);
                arr.splice(idx, 1)
            } else {
                com.isTouch = false
                com.setGray(true);
            }
        });
        this._isBaiPaing = true
        this.updateTingTip()
    },

    /**摆牌完成 */
    onBaiPaiEnd(bpList) {
        this.baiLayout.active = true
        /**刷新摆牌 */
        for (let i = 0; i < this._baiTileList.length; i++) {
            const bcom = this._baiTileList[i];
            bcom.setNodeShow(false)
            let id = bpList[i]
            if (id) {
                bcom.setNodeShow(true)
                bcom.flower = id
                bcom.setBaiPaiIcon(true)
            }
        }
    },

    /**设置触摸true为触摸*/
    setTouch(isTouch) {
        if (this._isBaiPaing && !HLMJModel.isTurn(HLMJModel.getMyUID())) {
            return
        }
        let allHuCards = HLMJModel.getSelfAllHuCards()
        for (let i = 0; i < this._standTileList.length; i++) {
            const com = this._standTileList[i];
            com.isTouch = isTouch;
            /**检测摆牌后不能出的牌 */
            let isNoTouch = allHuCards.includes(com.flower)
            if (isNoTouch && this._idx == 0) {
                com.isTouch = false
                if (com.node.y != 0) {
                    com.updateTilePos(cc.v2(com.node.x, 0));
                }
            }
            if (!com.isTouch) {
                com.setMaskShow(false);
                if (isNoTouch && this._idx == 0) {
                    com.setGray(true);
                } else
                    com.setGray(false);
            }
        }
    },

    /**碰牌后设置牌分离 */
    setPengChu() {
        if (HLMJModel.getGameStatus() == ApiHlmj.gameStatus.PLAYING) {
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
    setAllTilesDown(isGray = false, isChangeColor = true) {
        for (let i = 0; i < this._standTileList.length; i++) {
            const com = this._standTileList[i];
            com.updateTilePos(cc.v2(com.node.x, 0));
            if (isChangeColor) {
                com.setGray(isGray)
            }
        }
    },

    /**摸牌 */
    setDrawTile(tileId = null, isAni = false) {
        let drawTileCom = this._standTileList[this._standTileList.length - 1];
        if (tileId == null) {
            drawTileCom.setNodeOpacity(0);
            return;
        }
        drawTileCom.flower = tileId;
        drawTileCom.setNodeShow(true);
        if (this._idx == 0 && isAni) {
            drawTileCom.runTileAnimate();
        } else {
            drawTileCom.setNodeOpacity(255);
        }

        let allHuCards = HLMJModel.getSelfAllHuCards()
        if (allHuCards.includes(tileId) && this._idx == 0) {
            drawTileCom.isTouch = false
            drawTileCom.setGray(true)
        } else {
            drawTileCom.isTouch = true
            drawTileCom.setGray(false)
        }
        return drawTileCom
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
        flyNode.setPosition(startPos);
        handTile.setNodeOpacity(0);
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

    /**设置听牌列表 */
    updateTingTip() {
        if (this._idx != 0 || !this.com_ting || !this.com_ting.node.active) {
            return
        }
        let selectBp = []
        this._standTileList.forEach(com => {
            if (com.node.active && com.node.y != 0) {
                selectBp.push(com.flower)
            }
        });
        let handCards = HLMJModel.getHandCards(HLMJModel.getMyUID());
        let canWinList = HLMJLogic.getTingList(handCards, 0);
        let huList = HLMJLogic.getBaiPaiHuCards(handCards, selectBp)
        for (let i = 0; i < canWinList.length; i++) {
            const info = canWinList[i];
            /**删掉不能听的牌 */
            if (!huList.includes(info.cardID)) {
                canWinList.splice(i, 1)
                i--
            }
        }
        if (canWinList.length <= 0) {
            this.com_ting.node.active = false
        }
        this.com_ting.node.active = true
        // console.log("设置了听牌==", canWinList, huList, selectBp)
        this.com_ting.showWinCards(canWinList)
    },

    reset() {
        this.setAllTilesDown();
        this.baiLayout.active = false
        this._isBaiPaing = false
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
            const lcom = this._lieTileList[i];
            if (lcom) {
                lcom.flower = 0;
                lcom.reset();
                lcom.setNodeShow(false);
            }
        }
    },

});