const SubManager = require('../../utils/SubManager');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const CCUtil = require('../../utils/CCUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        gameName: cc.Label,
        gameTog: cc.Toggle,
        gameIcon: cc.Sprite,

        _game: null,
        _showType: null,
        _curSelected: null
    },

    start() {
        cc.systemEvent.on('OnGameCheck', this._onCheck, this);
        this.init();
    },

    init() {
        this._game = this.node.nodeParams.game;
        this._showType = this.node.nodeParams.showType;
        this._curSelected = this.node.nodeParams.selected;
        if (!this._game) return;
        this.gameName.string = this._game.game;
        AssetsManager.loadSpriteFrame({
            path: `sprite/room/game_${this._game.type}`,
            sprite: this.gameIcon
        });
        if (this._showType != 'unionGameRecords') {
            this.gameTog.isChecked = SubManager.checkBundle(this._game.type);
            CCUtil.setGrayShader(this.node, !this.gameTog.isChecked);
        } else {
            this.gameTog.isChecked = this._game.type == this._curSelected;
            CCUtil.setGrayShader(this.node, !this.gameTog.isChecked);
        }
    },

    _onCheck(type) {
        if (!this._game) return;
        if (this._showType != 'unionGameRecords') return;
        if (this._curSelected == type) return;
        this._curSelected = type;
        this.gameTog.isChecked = this._game.type == this._curSelected;
        CCUtil.setGrayShader(this.node, !this.gameTog.isChecked);
    },

    onClick() {
        if (!ConfigModel.canCreate(this._game.type)) {
            AssetsManager.tipDialog('游戏开发中，暂不支持添加该游戏，敬请期待！');
            this.gameTog.isChecked = false;
            return;
        }
        if (this.gameTog.isChecked) {
            if (this._showType != 'unionGameRecords') {
                SubManager.addBundle(this._game.type);
            } else {
                cc.systemEvent.emit('OnGameCheck', this._game.type, this);
            }
        } else {
            if (this._showType != 'unionGameRecords') {
                let gameList = SubManager.getBundles();
                if (gameList.length <= 1) {
                    this.gameTog.isChecked = true;
                    AssetsManager.tipDialog('无法删除，请确保有至少一种玩法被添加！');
                    return;
                }
                SubManager.delBundle(this._game.type);
            } else {
                cc.systemEvent.emit('OnGameCheck', null, this);
            }
        }
        CCUtil.setGrayShader(this.node, !this.gameTog.isChecked);
    },

    onDestroy() {
        cc.systemEvent.off('OnGameCheck', this._onCheck, this);
    },

});