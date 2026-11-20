const AssetsManager = require('../../../utils/AssetsManager');
const CCUtil = require('../../../utils/CCUtil');
const UserModel = require('../../../model/UserModel');
const Utils = require('../../../utils/Utils');
const ConfigModel = require('../../../model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        gameTypeLbl: cc.Label,
        gameRuleLbl: cc.Label,
        checkMark: cc.Node,
        _game: null
    },

    initWidget(data, limits) {
        data.gameRule = data.gameRule || {};
        this._game = data;
        this.gameTypeLbl.string = data.ruleName || data.gameRule.ruleName;
        let ruleId = data._id || data.gameRule._id;
        this.checkMark.active = !limits.includes(ruleId);
        let share = ConfigModel.getRoomRuleShare(data.gameRule);
        this.gameRuleLbl.string = share.content;
        if (limits.includes(ruleId)) {
            this._game.ruleClick(this._game);
        }
    },

    onClick() {

        if (!this._game) return;
        this.checkMark.active = !this.checkMark.active;
        this._game.ruleClick(this._game);
    },

});