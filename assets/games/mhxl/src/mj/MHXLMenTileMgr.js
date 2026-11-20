const ApiMhxl = require('../ApiMhxl');

cc.Class({
    extends: cc.Component,

    properties: {
        huaList: cc.Node,
        huaPfb: cc.Prefab,
        _idx: -1,
        _huaTiles: [],
    },


    onLoad() {
        this.reset();
    },
    init(idx) {
        this._idx = idx;
        this._huaTiles = [];
    },

    menCardsSync(huaCards, operateType) {
        let huaCard = cc.instantiate(this.huaPfb);
        if (!huaCard.getComponent('MHXLSingleTile')) {
            huaCard.addComponent('MHXLSingleTile');
        }
        let huaTile = huaCard.getComponent('MHXLSingleTile');
        huaCard.parent = this.huaList;
        huaTile.init();
        huaTile.flower = huaCards;
        this._huaTiles.push(huaTile);
        huaTile.setCover(operateType == ApiMhxl.operateType.HU_ZHI);
    },


    reset() {
        this._huaTiles = [];
        this.huaList.destroyAllChildren();
        // for (let i = 0; i < this._huaTiles.length; i++) {
        //     const com = this._huaTiles[i];
        //     com.flower = 0;
        //     com.reset();
        //     com.setNodeShow(false);
        // }
    },

});