const ConfigModel = require('../../../model/ConfigModel');
const MessageCallback = require('../../../utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        checkMark: cc.Node,
        backLbl: cc.Label,
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

    _onGameRuleSelectedByID(data) {
        this.sync(data.gameType || data.gameRule.gameType);
    },

    init(comp) {
        this._comp = comp;
    },

    bind(data) {
        this._game = data;
        this.backLbl.string = ConfigModel.getGameName(data.gameType);
        this.checkedLbl.string = ConfigModel.getGameName(data.gameType);
    },

    sync(gameType) {
        if (!this._game) return;
        this.checkMark.active = this._game.gameType == gameType;
    },

    onClick() {
        if (!this._game || !this._comp) return;
        this._comp.onGameClick(this._game.gameType);
    },

    onDestroy() {
        MessageCallback.removeListener('OnGameRuleSelectedByID', this);
    },

});