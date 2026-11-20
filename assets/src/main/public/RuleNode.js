const AssetsManager = require('../../utils/AssetsManager');
const SubManager = require('../../utils/SubManager');
const Enums = require('../../const/Enums');
const Utils = require('../../utils/Utils');
const ConfigModel = require('../../model/ConfigModel');

cc.Class({
	extends: cc.Component,
	properties: {
		title: cc.Label,
		maxPlayer: cc.Label,
		baseTitle: cc.Label,
		baseScore: cc.Label,
		joinScore: cc.Label,
		dissScore: cc.Label,
		tableDesc: cc.RichText,
		ruleTileRichColor: cc.Color,
		ruleContentRichColor: cc.Color,
		_gameRule: null,
	},

	start() {
		this._gameRule = !!this.node.nodeParams ? this.node.nodeParams.gameRule : null;
		this.addRule(this._gameRule);
	},

	addRule(gameRule) {
		if (!gameRule) return;
		let format = {
			isRichText: true,
			titleColor: this.ruleTileRichColor,
			contentColor: this.ruleContentRichColor,
			spacer: "\n"
		}
		let share = ConfigModel.getRoomRuleShare(gameRule, format);
		this.title.string = ConfigModel.getGameName(gameRule.gameType);
		this.maxPlayer.string = `${(gameRule.maxPlayerCount || 0)}人`;
		if (this.baseTitle) this.baseTitle.string = `${share.baseTitle}：`
		this.baseScore.string = `${share.baseScore}`;
		this.dissScore.string = !!gameRule.scoreDismissLimit ? Utils.formatNumberWithSymbol(gameRule.scoreDismissLimit || 0, 1) + '分' : '无';
		this.joinScore.string = !!gameRule.scoreLowLimit ? Utils.formatNumberWithSymbol(gameRule.scoreLowLimit || 0, 1) + '分' : '无';
		this.tableDesc.string = share.content;
	},

	onCloseClick() {
		if (this.node.getComponent('DialogWidgetCtrl')) {
			this.node.getComponent('DialogWidgetCtrl').out();
		} else {
			this.node.destroy();
		}
	},

	onRuleClick() {
		if (!this._gameRule) return;
		AssetsManager.ruleDialog({
			type: this._gameRule.gameType > 0 ? this._gameRule.gameType : -1
		})
	}
});