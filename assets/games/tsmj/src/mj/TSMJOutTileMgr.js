cc.Class({
    extends: cc.Component,

    properties: {
        outPfb: cc.Prefab,
        /**容器列表 */
        _layoutList: null,
        /**每张牌的脚本列表 */
        _outTileMgrList: null,
        /**本地位置号 */
        _idx: null,
        /**每一排的牌数量 */
        _rowTiesNum: null,
        /**出牌的id列表 */
        _outPutList: null,
    },

    init(idx) {
        if (this._idx == null) {
            this._idx = idx;
        } else {
            // console.log("已经初始化过了")
            return;
        }
        this._layoutList = [];
        this._outTileMgrList = [];
        this._outPutList = [];
        for (let i = 0; i < 6; i++) {
            let lay = cc.find(`${i + 1}`, this.node);
            this._layoutList.push(lay);
        }
        if (idx == 0 || idx == 2) {
            this._rowTiesNum = [{
                min: 0,
                max: 8
            }, {
                min: 8,
                max: 18
            }, {
                min: 18,
                max: 30
            }, {
                min: 30,
                max: 38
            }, {
                min: 38,
                max: 48
            }, {
                min: 48,
                max: 60
            }]
        } else {
            this._rowTiesNum = [{
                min: 0,
                max: 5
            }, {
                min: 5,
                max: 12
            }, {
                min: 12,
                max: 21
            }, {
                min: 21,
                max: 26
            }, {
                min: 26,
                max: 33
            }, {
                min: 33,
                max: 42
            }]
        }
        /**先初始化一排 */
        this.generateNewRowTiles();
    },

    /**生成新的一排 */
    generateNewRowTiles() {
        for (let i = 0; i < 6; i++) {
            let lay = this._layoutList[i];
            if (lay.children.length == 0) {
                let num = this._rowTiesNum[i];
                if (this._idx == 1) { //一号位置要反着来
                    for (let m = num.max - 1; m >= num.min; m--) {
                        let tile = cc.instantiate(this.outPfb);
                        let scom = tile.addComponent('TSMJSingleTile');
                        scom.init();
                        scom.setNodeOpacity(0);
                        this._outTileMgrList[m] = scom;
                        tile.parent = lay;
                    }
                } else {
                    for (let n = num.min; n < num.max; n++) {
                        let tile = cc.instantiate(this.outPfb);
                        let scom = tile.addComponent('TSMJSingleTile');
                        scom.init();
                        scom.setNodeOpacity(0);
                        this._outTileMgrList[n] = scom;
                        tile.parent = lay;
                    }
                }
                break;
            }
        }
    },

    /**展示出的牌 */
    showOutTiles(tiles) {
        this.node.active = true;
        this._outPutList = tiles;
        let lastTile = null;
        for (let i = 0; i < tiles.length; i++) {
            const tnum = tiles[i];
            let tileCom = this._outTileMgrList[i];
            if (!tileCom) {
                this.generateNewRowTiles();
            }
            tileCom = this._outTileMgrList[i];
            tileCom.flower = tnum.card;
            tileCom.setNodeOpacity(255);
            if (i === tiles.length - 1) {
                lastTile = tileCom;
            }
        }
        return lastTile;
    },

    /**操作之后更新牌，把吃碰杠的牌隐藏掉 */
    afterOptUpdateTiles(tile) {
        // console.log(tile, this._outPutList)
        if (this._outPutList && this._outPutList.length > 0 && this._outPutList[this._outPutList.length - 1].card === tile) {
            this._outTileMgrList[this._outPutList.length - 1].setNodeOpacity(0);
            this._outPutList.pop();
        }
    },

    /**设置牌变灰 */
    setTileGary(tileId = -1) {
        this._outTileMgrList.forEach(t => {
            if (t.node.active && t.node.opacity == 255) {
                t.setGray(t.flower === tileId)
            }
        });
    },

    reset() {
        this._outTileMgrList.forEach(t => {
            t.setNodeOpacity(0)
        })
    },
});