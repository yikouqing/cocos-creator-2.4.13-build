const ConfigModel = require('../../../model/ConfigModel');
const AssetsManager = require('../../../utils/AssetsManager');
const CCUtil = require('../../../utils/CCUtil');
const MessageCallback = require('../../../utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        checkBack: cc.Sprite,
        checkMark: cc.Sprite,
        checkedLbl: cc.Label,
        _game: null,
        _comp: null
    },

    start() {
        MessageCallback.addListener('OnGameRuleSelectedByID', this);
    },

    messageCallbackHandler(route, data) {
        switch (route) {
            case 'OnGameRuleSelectedByID':
                this._onGameRuleSelectedByID(data);
                break;
        }
    },

    bind(data) {
        this.node.active = true;
        this._game = data;
        this._comp = data.comp;
        this.checkMark.node.active = this._game.gameType == data.selectedGameType;
        if (this.checkedLbl) this.checkedLbl.string = ConfigModel.getGameName(data.gameType);
        if (this.checkBack) CCUtil.setGrayShader(this.checkBack.node, true);
        AssetsManager.loadSpriteFrame({
            path: `sprite/room/game_${data.gameType}`,
            sprite: this.checkBack
        });
        AssetsManager.loadSpriteFrame({
            path: `sprite/room/game_${data.gameType}`,
            sprite: this.checkMark
        });
    },

    _onGameRuleSelectedByID(data) {
        // console.log('刷新-选中', this._game, data)
        this.sync(data.gameType || data.gameRule.gameType);
    },

    sync(gameType) {
        if (!this._game) return;
        if (!this.node.active) return;
        // console.log('刷新----,gameType')
        this.checkMark.node.active = this._game.gameType == gameType;
    },

    clear() {
        this._game = null;
        this.node.active = false;
        this.checkBack.spriteFrame = null;
        this.checkMark.spriteFrame = null;
    },

    onClick() {
        if (!this._game || !this._comp) return;
        this._comp.onGameClick(this._game.gameType);
    },

    onDestroy() {
        MessageCallback.addListener('OnGameRuleSelectedByID', this);
    },

});