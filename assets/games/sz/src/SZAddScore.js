cc.Class({
    extends: cc.Component,

    properties: {
        score: cc.Label,
        _score: 0,
        _comp: null
    },

    bind(comp, score) {
        this._comp = comp;
        this._score = score;
        this.score.string = `+${score}`;
    },

    onClick() {
        if (!this._comp) return;
        this._comp.addScore(this._score);
    }

});