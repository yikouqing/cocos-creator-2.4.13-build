cc.Class({
    extends: cc.Component,

    properties: {
        huaPfb: cc.Prefab,
        huaList: cc.Node,
        _idx: -1,
        _huaTiles: null,
    },

    init(idx) {
        this._idx = idx;
    },

    huaCardsSync(huaCards) {
        huaCards = huaCards || [];
        this.node.active = !!huaCards && huaCards.length > 0;
        huaCards.sort((a, b) => {
            return a - b;
        });
        this._huaTiles = this._huaTiles || [];
        let flowers = this.repeatFilter(huaCards.slice());
        let counts = Math.max(flowers.length, this._huaTiles.length);
        for (let index = 0; index < counts; index++) {
            if (!flowers[index]) {
                if (!!this._huaTiles[index]) {
                    this._huaTiles[index].setNodeShow(false);
                }
            } else {
                let huaCount = this.getCardCount(flowers[index], huaCards);
                if (!this._huaTiles[index]) {
                    let huaCard = cc.instantiate(this.huaPfb);
                    huaCard.parent = this.huaList;
                    if (!huaCard.getComponent('MASMJSingleTile')) huaCard.addComponent('MASMJSingleTile');
                    let huaTile = huaCard.getComponent('MASMJSingleTile');
                    this._huaTiles.push(huaTile);
                    huaTile.init();
                    huaTile.flower = flowers[index];
                    huaTile.setHuaCount(0);
                } else {
                    this._huaTiles[index].flower = flowers[index];
                    this._huaTiles[index].setNodeShow(true);
                    this._huaTiles[index].setHuaCount(0);
                }
            }
        }
    },

    repeatFilter(huaCards) {
        //去重再排序
        let flowers = Array.from(new Set(huaCards));
        flowers.sort((a, b) => {
            return a - b;
        });
        return flowers;
    },

    getCardCount(card, cards) {
        let count = 0;
        for (const item of cards) {
            if (card != item) continue;
            count++;
        }
        return count;
    },

    reset() {
        this._huaTiles = this._huaTiles || [];
        for (let i = 0; i < this._huaTiles.length; i++) {
            const com = this._huaTiles[i];
            com.flower = 0;
            com.reset();
            com.setNodeShow(false);
        }
    },

});