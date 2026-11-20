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

    /**创建房间时候初始化 */
    create() {
        this._game = this.node.nodeParams;
        let config = ConfigModel.getBundleConfig(this._game.type);
        this.bNameLbl.string = !!config ? config.name : '未知';
        this.cNameLbl.string = !!config ? config.name : '未知';
        this.gameTog.isChecked = this._game.selectedType == this._game.type;
    },

    /**添加玩法的时候初始化 */
    classify() {
        this._game = this.node.nodeParams;
        this.bNameLbl.string = ConfigModel.getGameClass(this._game.type);
        this.cNameLbl.string = ConfigModel.getGameClass(this._game.type);
        this.gameTog.isChecked = this._game.classify == this._game.type;
    },

    onClick() {
        if (!this._game || !this._game.click) return;
        this._game.click(this._game.type);
    }

});