const RCSSGLogic = require('../RCSSGLogic');
const RCSSGModel = require('../RCSSGModel');
const AssetsManager = require('../../../../src/utils/AssetsManager');
const Enums = require('../../../../src/const/Enums');
const ApiRcssg = require('../ApiRcssg');
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
        /**牌抬起来的坐标 */
        _tileUpY: 40,
    },


    onLoad() {
        this.standLayout.destroyAllChildren();
        this.lieLayout.destroyAllChildren();
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
        for (let i = 0; i < 15; i++) {
            let stand = cc.instantiate(this.standPfb);
            let lie = cc.instantiate(this.liePfb);
            let scom = stand.addComponent('RCSSGSingleTile');
            let lcom = lie.addComponent('RCSSGSingleTile');
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
        if (RCSSGModel.getCurOptUID() != RCSSGModel.getMyUID()) return;
        let gameStatus = RCSSGModel.getGameStatus();
        if (gameStatus == ApiRcssg.gameStatus.PLAYING) {
            if (RCSSGModel.getRestCardsCount() <= 4) { //最后4张必须操作不能过
                let lastOpt = RCSSGModel.getLastOperate()
                if (lastOpt && lastOpt.operateArray.some(o => o != ApiRcssg.operateType.QI && o != ApiRcssg.operateType.GET)) {
                    console.log("有其他操作不能出牌")
                    return
                }
            }
            //如果已经报听，不能进行出牌操作
            if (RCSSGModel.getIsBaoDone(RCSSGModel.getMyUID())) {
                console.log("报听后不能自己出牌")
                return
            }
            /**发送出牌消息 */
            ApiRoom.gameMessageNotify(ApiRcssg.gameOperateNotify(tileCom.flower, ApiRcssg.operateType.QI));
            /**如果这张牌是摸的牌 直接隐藏*/
            if (parseInt(tileCom.node.name) === this._standTileList.length - 1) {
                this.setDrawTile();
            }
        }
    },

    /**选中牌 */
    onChooseCard(tileCom) {
        let gameStatus = RCSSGModel.getGameStatus();
        if (!gameStatus) return;
        if (tileCom.node.y == this._tileUpY) {
            if (gameStatus == ApiRcssg.gameStatus.HUANSANZHANG) { //换三张可以选3张牌
                tileCom.updateTilePos(cc.v2(tileCom.node.x, 0))
                tileCom.huanIdx = 0
            } else {
                this.onDiscard(tileCom);
            }
        } else {
            if (gameStatus == ApiRcssg.gameStatus.HUANSANZHANG) {
                //换三张只可以选3张牌 注意不能把摸的那张牌算进去
                let maxHuanCount = RCSSGModel.getMaxHuanPaiCount()
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
                if (upCount >= maxHuanCount || (isDiff && upCount > 0)) {
                    let downCount = upCount - (maxHuanCount - 1) //颜色一样留两张
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
                    com.updateTilePos(cc.v2(com.node.x, 0));
                }
                cc.systemEvent.emit("tileUp", tileCom);
            }
            tileCom.updateTilePos(cc.v2(tileCom.node.x, this._tileUpY));
        }
    },

    /**花色检测 true颜色一样 */
    checkColor(huanPaiList) {
        let color = -1
        for (let i = 0; i < huanPaiList.length; i++) {
            const card = huanPaiList[i];
            if (color == -1) {
                color = RCSSGLogic.getCardType(card)
            } else {
                if (color !== RCSSGLogic.getCardType(card)) {
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
        let maxHuanCount = RCSSGModel.getMaxHuanPaiCount()
        let huanPaiType = RCSSGModel.getGameRuleByKey("huanpai")
        if (huanPaiType == 1) { //换三张
            if (huanPaiList.length !== 3) {
                /**数量不够 */
                AssetsManager.tipDialog("请选择三张牌！")
                return
            }
        } else if (huanPaiType == 2) { //换1到5张
            if (RCSSGModel.getBankerUid() == RCSSGModel.getMyUID()) {
                if (huanPaiList.length == 0 || huanPaiList.length > maxHuanCount) {
                    AssetsManager.tipDialog(`请选择1-${maxHuanCount}张牌！`)
                    return
                }
            } else if (huanPaiList.length !== maxHuanCount) {
                /**数量不够 */
                AssetsManager.tipDialog(`请选择${maxHuanCount}张牌！`)
                return
            }
        }
        if (!this.checkColor(huanPaiList)) {
            /**花色不同 */
            AssetsManager.tipDialog("请选择花色一样的牌！")
            return
        }
        /**发送换牌消息 */
        ApiRoom.gameMessageNotify(ApiRcssg.gameHuanPaiNotify(huanPaiList));
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
        for (let i = 0; i < this._standTileList.length - 1; i++) {
            const card = tileArr[i];
            const com = this._standTileList[i];
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
        let isBaoTing = RCSSGModel.getIsTianTing(RCSSGModel.getMyUID())
        if (isBaoTing) {
            this.setTouch(false)
            //如果已经报听了，直接把手牌变灰色，并且全部不能操作
            for (let i = 0; i < this._standTileList.length - 1; i++) {
                const com = this._standTileList[i];
                if (com.flower != 0) {
                    com.setGray(true);
                }
            }
        } else {
            this.setTouch(true);
        }
    },

    /**设置换三张推荐牌 */
    setHuanPai(suggestList) {
        this.setAllTilesDown();
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
            let cards = RCSSGModel.getHandCards(data.uid);
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
        if (RCSSGModel.getGameStatus() == ApiRcssg.gameStatus.PLAYING) {
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
                    this.setDrawTile(lastTile.flower, false);
                    lastTile.setNodeShow(false)
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

    reset() {
        this.setAllTilesDown();
        for (let i = 0; i < this._standTileList.length; i++) {
            const com = this._standTileList[i];
            com.flower = 0;
            com.huanIdx = 0
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