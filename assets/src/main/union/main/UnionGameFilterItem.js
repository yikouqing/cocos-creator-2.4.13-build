const MessageCallback = require('../../../utils/MessageCallback');
const ConfigModel = require('../../../model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        backText: cc.Label,
        barText: cc.Label,
        checkMark: cc.Node,

        _unionInfo: null,
        _roomInfo: null
    },

    initWidget(unionInfo, roomInfo) {
        if (!roomInfo) return;
        this.node.active = true;
        this._roomInfo = roomInfo;
        this._unionInfo = unionInfo;
        this._roomInfo.selectGameRule = unionInfo.selectGameRule;
        this._roomInfo.selectedGameType = unionInfo.selectedGameType;
        if (unionInfo.selectedGameType > 0) {
            this.backText.string = roomInfo.ruleName || roomInfo.gameRule.ruleName || ConfigModel.getGameName(roomInfo.gameType || roomInfo.gameRule.gameType);
            this.barText.string = roomInfo.ruleName || roomInfo.gameRule.ruleName || ConfigModel.getGameName(roomInfo.gameType || roomInfo.gameRule.gameType);
        } else {
            this.backText.string = ConfigModel.getGameName(roomInfo.gameType || roomInfo.gameRule.gameType);
            this.barText.string = ConfigModel.getGameName(roomInfo.gameType || roomInfo.gameRule.gameType);
        }
        if (!!unionInfo.selectGameRule) {
            this.checkMark.active = (unionInfo.selectGameRule._id || unionInfo.selectGameRule.gameRule._id) == (roomInfo._id || roomInfo.gameRule._id);
        } else {
            this.checkMark.active = false;
        }

    },

    clear() {
        this._unionInfo = null;
        this._roomInfo = null;
        this.node.active = false;
        this.backText.string = '';
        this.barText.string = '';
    },


    onClick() {
        if (!this._roomInfo) return;
        MessageCallback.emitMessage('OnGameRuleSelectedByID', this._roomInfo);
    },

});