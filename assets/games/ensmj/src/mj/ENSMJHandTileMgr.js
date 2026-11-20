const ENSMJLogic = require('../ENSMJLogic');
const ENSMJModel = require('../ENSMJModel');
const AssetsManager = require('../../../../src/utils/AssetsManager');
const Enums = require('../../../../src/const/Enums');
const ApiEnsmj = require('../ApiEnsmj');
const ApiRoom = require('../../../../src/api/ApiRoom');
const CCUtil = require('../../../../src/utils/CCUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        standPfb: cc.Prefab, //立起来的牌
        liePfb: cc.Prefab, //平摊的牌
        standLayout: cc.Node,
        lieLayout: cc.Node,
        laiLayout: cc.Node,
        /**本地位置号 */
        _idx: null,
        /**手牌脚本列表 */
        _standTileList: null,
        _lieTileList: null,
        /**换牌列表 */
        _huanPaiList: null,
        /**牌抬起来的坐标 */
        _tileUpY: 40,
    },


    onLoad() {
        this.standLayout.destroyAllChildren();
        this.lieLayout.destroyAllChildren();
        this.laiLayout.destroyAllChildren();
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
        for (let i = 0; i < 15; i++) {
            let stand = cc.instantiate(this.standPfb);
            let lie = cc.instantiate(this.liePfb);
            let scom = stand.addComponent('ENSMJSingleTile');
            let lcom = lie.addComponent('ENSMJSingleTile');
            scom.init();
            lcom.init();
            if (this._idx === 0) { //给自己添加点击响应
                scom.setTouchListener();
            }
            lcom.setNodeShow(false);
            this._standTileList.push(scom);
            this._lieTileList.push(lcom);
            stand.name = i.toString();
            lie.name = i.toString();
            if (i < 14) {
                stand.parent = this.standLayout;
                lie.parent = this.lieLayout;
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
        if (ENSMJModel.getCurOptUID() != ENSMJModel.getMyUID()) return;
        let gameStatus = ENSMJModel.getGameStatus();
        if (gameStatus == ApiEnsmj.gameStatus.PLAYING) {
            /**如果手牌里面有痞并且选择了禁止养痞，不能出其他牌 */
            let piList = ENSMJModel.getPiList()
            if (!piList.includes(tileCom.flower) && ENSMJModel.getGameRuleByKey("jinzhiyangpi") && ENSMJModel.getSelfHasPi()) {
                AssetsManager.tipDialog("禁止养痞")
                return
            }
            /**发送出牌消息 */
            ApiRoom.gameMessageNotify(ApiEnsmj.gameOperateNotify(tileCom.flower, ApiEnsmj.operateType.QI));
            /**如果这张牌是摸的牌 直接隐藏*/
            if (parseInt(tileCom.node.name) === this._standTileList.length - 1) {
                this.setDrawTile();
            }
        }
    },

    /**选中牌 */
    onChooseCard(tileCom) {
        let gameStatus = ENSMJModel.getGameStatus();
        if (!gameStatus) return;
        if (tileCom.node.y == this._tileUpY) {
            if (gameStatus == ApiEnsmj.gameStatus.HUANSANZHANG) { //换三张可以选3张牌
                tileCom.updateTilePos(cc.v2(tileCom.node.x, 0));
                let idx = this._huanPaiList.indexOf(tileCom.flower);
                if (idx != -1) {
                    this._huanPaiList.splice(idx, 1);
                }
            } else {
                this.onDiscard(tileCom);
            }
        } else {
            if (gameStatus == ApiEnsmj.gameStatus.HUANSANZHANG) {
                //换三张只可以选3张牌 注意不能把摸的那张牌算进去
                let upCount = 0;
                for (let i = 0; i < this._standTileList.length - 1; i++) {
                    const ctrl = this._standTileList[i];
                    if (ctrl.node.y == this._tileUpY) {
                        upCount++;
                    }
                }
                if (upCount >= 3) {
                    AssetsManager.tipDialog("只能选三张牌！");
                    return
                }
                this._huanPaiList.push(tileCom.flower);
            } else if (this._tianting) {
                this.sendTianTing(tileCom.flower);
            } else {
                for (let i = 0; i < this._standTileList.length; i++) {
                    const ctrl = this._standTileList[i];
                    ctrl.updateTilePos(cc.v2(ctrl.node.x, 0));
                }
                cc.systemEvent.emit("tileUp", tileCom);
            }
            tileCom.updateTilePos(cc.v2(tileCom.node.x, this._tileUpY));
        }
    },


    sendTianTing(cardID) {
        if (!cardID) return;
        this._tianting = false;
        ApiRoom.gameMessageNotify(ApiEnsmj.gameOperateNotify(cardID, ApiEnsmj.operateType.TIANTING));
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
                color = ENSMJLogic.getCardType(card)
            } else {
                if (color !== ENSMJLogic.getCardType(card)) {
                    /**花色不同 */
                    AssetsManager.tipDialog("请选择花色一样的牌！")
                    return
                }
            }
        }
        /**发送换牌消息 */
        ApiRoom.gameMessageNotify(ApiEnsmj.gameHuanPaiNotify(this._huanPaiList));
    },

    /**确定摆牌 */
    onBaiPai() {
        let blist = []
        this._standTileList.forEach(ctrl => {
            if (ctrl.node.active && ctrl.node.y != 0) {
                blist.push(ctrl.flower)
            }
        });
        /**检测是否可以提交 */
        let handCards = ENSMJModel.getHandCards(ENSMJModel.getMyUID())
        let baiHuList = ENSMJLogic.getBaiPaiHuCards(handCards, blist)
        if (!baiHuList || baiHuList.length == 0) {
            AssetsManager.tipDialog("请选择正确的摆牌！")
            return
        }
        /**发送换牌消息 */
        ApiRoom.gameMessageNotify(ApiEnsmj.gameShaiPaiNotify(blist));
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
        let drawIndex = tileArr.indexOf(drawTile);
        let allHuCards = ENSMJModel.getSelfAllHuCards()
        for (let i = 0; i < this._standTileList.length - 1; i++) {
            const card = tileArr[i];
            const ctrl = this._standTileList[i];
            if (card || card === 0) {
                ctrl.flower = card;
                ctrl.setNodeOpacity(255);
                if (drawIndex != -1 &&
                    drawIndex == i &&
                    i != tileArr.length - 1) {
                    this.showDraw(ctrl);
                }
                ctrl.setNodeShow(true);
                ctrl.updateTilePos(cc.v2(ctrl.node.x, 0));
                /**检测是不是别人摆牌后不能出的牌 */
                if (allHuCards.includes(card) && this._idx == 0) {
                    //     ctrl.setGray(true)
                    //     ctrl.isTouch = false
                }
            } else {
                ctrl.setNodeShow(false);
            }
        }

        if (this._idx == 0 && isAni) {
            let dt = 0;
            for (let i = 0; i < this._standTileList.length - 1; i++) {
                const ctrl = this._standTileList[i];
                if (i != 0 && i % 4 == 0) {
                    dt += 0.2;
                }
                if (ctrl.node.active) {
                    ctrl.runTileAnimate(dt);
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
            const ctrl = this._lieTileList[i];
            const card = tileArr[i];
            if (card != null) {
                ctrl.flower = card;
                ctrl.setNodeShow(true);
                ctrl.setNodeOpacity(255);
            } else {
                ctrl.setNodeShow(false);
            }
        }
    },

    /**设置轮到自己操作 */
    setIsMyTurn() {
        const type = ENSMJModel.getDingQueType(ENSMJModel.getMyUID());
        if (type != -1 && ENSMJModel.getHasDingQueCard()) {
            for (let i = 0; i < this._standTileList.length; i++) {
                const ctrl = this._standTileList[i];
                if (ctrl.flower != 0) {
                    let hua = ENSMJLogic.getCardType(ctrl.flower);
                    ctrl.setGray(hua != type);
                    ctrl.isTouch = hua == type;
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
            let ctrl = this._standTileList.find(c => {
                return (c.flower == card && c.node.y == 0);
            })
            if (ctrl) {
                ctrl.updateTilePos(cc.v2(ctrl.node.x, this._tileUpY));
            }
        }
        this.setTouch(true);
    },

    /**个人换牌完成 */
    onHuanPaiChoose(data) {
        let list = data.cardList;
        for (let i = 0; i < list.length; i++) {
            let card = list[i];
            let ctrl = null;
            if (this._idx == 0) {
                ctrl = this._standTileList.find(c => {
                    return (c.node.y == this._tileUpY && c.flower == card);
                })
                if (ctrl) {
                    ctrl.updateTilePos(cc.v2(ctrl.node.x, 0));
                }
            } else {
                ctrl = this._standTileList[i];
            }
            if (ctrl) {
                ctrl.setNodeShow(false);
            }
        }
    },

    /**换牌完成 */
    onHuanPaiEnd(data, isTest = false) {
        /**等换牌动画播放完成后刷新 */
        this.scheduleOnce(() => {
            let cards = ENSMJModel.getHandCards(data.uid);
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

    /**设置触摸true为触摸*/
    setTouch(isTouch) {
        if (!ENSMJModel.isTurn(ENSMJModel.getMyUID())) {
            return
        }
        if (this._idx == 0 && ENSMJModel.isTurn(ENSMJModel.getMyUID())) {
            // console.log("设置触摸true为触摸====isTouch", isTouch)
        }
        for (let i = 0; i < this._standTileList.length; i++) {
            const ctrl = this._standTileList[i];
            ctrl.isTouch = isTouch;
        }
    },

    /**碰牌后设置牌分离 */
    setPengChu() {
        if (ENSMJModel.getGameStatus() == ApiEnsmj.gameStatus.PLAYING) {
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
            const ctrl = this._standTileList[i];
            ctrl.updateTilePos(cc.v2(ctrl.node.x, 0));
            if (isChangeColor) {
                ctrl.setGray(isGray)
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
        let allHuCards = ENSMJModel.getSelfAllHuCards();
        allHuCards = [];
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

    },

    reset() {
        this.setAllTilesDown();
        this.laiLayout.active = false;
        this.laiLayout.removeAllChildren();
        for (let i = 0; i < this._standTileList.length; i++) {
            const ctrl = this._standTileList[i];
            ctrl.flower = 0;
            ctrl.reset();
            if (i < 14) {
                ctrl.setNodeShow(false);
            } else {
                ctrl.setNodeShow(true);
                ctrl.setNodeOpacity(0);
            }
            const lcom = this._lieTileList[i];
            if (lcom) {
                lcom.flower = 0;
                lcom.reset();
                lcom.setNodeShow(false);
            }
        }
    },


    showPiLai(cardList) {
        if (!cardList) return;
        this.laiLayout.active = true;
        this.laiLayout.removeAllChildren();
        cardList.forEach((cardID) => {
            let CardNode = cc.instantiate(this.liePfb);
            let CardCtrl = CardNode.addComponent('ENSMJSingleTile');
            CardNode.parent = this.laiLayout;
            CardNode.active = true;
            CardCtrl.init();
            CardCtrl.flower = cardID;
        })
    },

});