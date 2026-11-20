const ConfigModel = require('../../model/ConfigModel');
const AssetsManager = require('../../utils/AssetsManager');

cc.Class({
    extends: cc.Component,

    properties: {
        bNameLbl: cc.Label,
        cNameLbl: cc.Label,
        gameTog: cc.Toggle,

        _game: null
    },

    onLoad() {
        this._game = this.node.nodeParams;
    },

    start() {
        this.init();
    },

    init() {
        let config = ConfigModel.getBundleConfig(this._game.type);
        this.bNameLbl.string = !!config ? config.name : '全部游戏';
        this.cNameLbl.string = !!config ? config.name : '全部游戏';
        this.gameTog.isChecked = this._game.selectedType == this._game.type;
    },

    onClick() {
        if (!this._game || !this._game.comp) return;
        this._game.comp.gameClick(this._game.type);
    }

});