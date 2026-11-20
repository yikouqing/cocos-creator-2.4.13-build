const AssetsManager = require('../../utils/AssetsManager');

cc.Class({
    extends: cc.Component,

    properties: {
        bTxt: cc.Label,
        cTxt: cc.Label,
        toggle: cc.Toggle,

        _game: null,
        _check: -1,
        _comp: null,
    },

    start() {
        this._game = !!this.node.nodeParams ? this.node.nodeParams.game : null;
        this._check = !!this.node.nodeParams ? this.node.nodeParams.check : null;
        this._comp = !!this.node.nodeParams ? this.node.nodeParams.comp : null;
        if (!this._game) return;
        this.toggle.isChecked = this._game.type == this._check;
        this.bTxt.string = this._game.name;
        this.cTxt.string = this._game.name;
        if (this._game.type == this._check.type) {
            // console.log('测试', this._game, this._check)
            this._comp && this._comp.loadRule(this._game);
        }
    },

    onClick() {
        if (!this._game || !this._comp || !this._comp.loadRule) return;

        this._comp && this._comp.loadRule(this._game);
    },

});