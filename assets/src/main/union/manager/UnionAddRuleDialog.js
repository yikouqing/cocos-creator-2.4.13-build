const AssetsManager = require('../../../utils/AssetsManager')
const Enums = require('../../../const/Enums');
const Utils = require('../../../utils/Utils');
const SubManager = require('../../../utils/SubManager');
const ConfigModel = require('../../../model/ConfigModel');
const UserModel = require('../../../model/UserModel');

cc.Class({
    extends: cc.Component,

    properties: {
        btnGuDingSet: require('UnionAddBaseRebateController'),
        ruleNameLabel: cc.Label,
        baseScoreLabel: cc.Label,
        scoreLowLimit: cc.EditBox,
        scoreDismissLimit: cc.EditBox,
        bigWinCount1: cc.Toggle,
        bigWinCountAll: cc.Toggle,
        danPumpToggle: cc.Toggle,
        douPumpToggle: cc.Toggle,
        guDingToggle: cc.Toggle,
        baiFenBiToggle: cc.Toggle,
        gameRebateAllToggle: cc.Toggle,
        gameRebateRoundToggle: cc.Toggle,
        percentLay: cc.Node,
        percentMinScore: cc.EditBox,
        percentScore: cc.EditBox,
        changeName: cc.EditBox,
        changeNameNode: cc.Node,
        changeBaseScore: cc.EditBox,
        changeBaseScoreNode: cc.Node,
        btnModify: cc.Node,
        btnSubmit: cc.Node,
        tableContainer: cc.Node,
        fixGuDingTog: cc.Toggle,
        fixBaiFenBiTog: cc.Toggle,
        fixScoreLimitGuDingEdit: cc.EditBox,
        fixScoreLimitBaiFenEdit: cc.EditBox,
        ticketEditBox: cc.EditBox,
        robotEdit: cc.EditBox, //机器人数
        btnAddRule: cc.Node,
        settingToggle: cc.Toggle,
        managerToggle: cc.Toggle,
        tableToggle: cc.Toggle,
        gamePage: cc.Node,
        managerPage: cc.Node,
        tablePage: cc.Node,

        _ladderScore: [],
        _baseScale: 1,
        _tableStyleType: 1,
        _unionInfo: null,
        _callback: null
    },

    start() {
        this.tablePage.active = true;
        this.managerPage.active = true;
        this.gamePage.active = true;
        this.btnAddRule.active = this.node.nodeParams.from == 'detail';
        this.btnGuDingSet.init(this);
        this._callback = this.node.nodeParams && this.node.nodeParams.cb ? this.node.nodeParams.cb : null;
        this._unionInfo = this.node.nodeParams && this.node.nodeParams.unionInfo ? this.node.nodeParams.unionInfo : null;
        this.gameRule = this.node.nodeParams && this.node.nodeParams.gameRule ? this.node.nodeParams.gameRule : null;
        this._baseScale = 1;
        this._tableStyleType = 1;
        this._gameRuleSync(true);
    },

    _gameRuleSync(sync) {
        if (!!this.gameRule) {
            this.btnModify.active = true;
            this.btnSubmit.active = false;
            this.gameRule = typeof (this.node.nodeParams.gameRule) == 'string' ? JSON.parse(this.node.nodeParams.gameRule) : this.node.nodeParams.gameRule;
            this.gameType = this.gameRule.gameType;
            if (!!sync) {
                this.ruleNameLabel.string = this.node.nodeParams.gameRule.ruleName || ConfigModel.getGameName(this.gameType);
                this._tableStyleType = this.gameRule.tableStyleType || 1;
                this._tableStyleType = this._tableStyleType > 8 || this._tableStyleType <= 0 ? 1 : this._tableStyleType;
                this.tableContainer.children[this._tableStyleType - 1].getComponent(cc.Toggle).isChecked = true;
                this._baseScale = this.gameRule.baseScale || 1;
                this.baseScoreLabel.string = "1:" + this._baseScale;
                this.scoreLowLimit.string = (this.gameRule.scoreLowLimit || 1000).toString();
                this.scoreDismissLimit.string = (this.gameRule.scoreDismissLimit || 100).toString();
                this.gameRule.ticketScore = Utils.formatNumberWithDecimal(parseFloat(this.gameRule.ticketScore >= 0 ? this.gameRule.ticketScore : 0), 1);
                this.ticketEditBox.string = this.gameRule.ticketScore;
                // 机器人数
                this.robotEdit.string = this.gameRule.robotCount || 0;
                if (this.gameRule.fixScoreType == 2) {
                    this.fixBaiFenBiTog.isChecked = true;
                    this.fixScoreLimitBaiFenEdit.node.active = true;
                    this.fixScoreLimitGuDingEdit.node.active = false;
                    this.fixScoreLimitBaiFenEdit.string = (this.gameRule.fixScore || 0).toString();
                } else {
                    this.fixGuDingTog.isChecked = true;
                    this.fixScoreLimitGuDingEdit.node.active = true;
                    this.fixScoreLimitBaiFenEdit.node.active = false;
                    this.fixScoreLimitGuDingEdit.string = (this.gameRule.fixScore || 0).toString();
                }
                let roomPayRule = this.gameRule.roomPayRule || {};
                if (!!roomPayRule.percentScore) this.percentScore.string = roomPayRule.percentScore.toString();
                if (!!roomPayRule.percentMinWinScore) this.percentMinScore.string = roomPayRule.percentMinWinScore.toString();
                if (!!roomPayRule.bigWinCount) {
                    if (roomPayRule.bigWinCount === -1) {
                        this.bigWinCountAll.isChecked = true;
                    } else if (roomPayRule.bigWinCount === 1) {
                        this.bigWinCount1.isChecked = true;
                    }
                }
                if (!!roomPayRule.pumpWaterPattern) {
                    this.douPumpToggle.isChecked = true;
                } else {
                    this.danPumpToggle.isChecked = true;
                }
                if (this.gameRule.gamingRebateType == 0) {
                    this.gameRebateAllToggle.isChecked = true;
                } else if (this.gameRule.gamingRebateType == 1) {
                    this.gameRebateRoundToggle.isChecked = true;
                }
                if (!!roomPayRule.ladderScore && roomPayRule.ladderScore.length > 0) {
                    this._ladderScore = roomPayRule.ladderScore;
                    this.guDingToggle.isChecked = true;

                    this.percentScore.enabled = false;
                    this.percentMinScore.enabled = false;
                    this.btnGuDingSet.sync(roomPayRule.ladderScore);
                } else {
                    this.percentScore.enabled = true;

                    this.percentMinScore.enabled = true;
                    this.baiFenBiToggle.isChecked = true;
                    this.btnGuDingSet.reset();
                }
                if (roomPayRule.isAvg !== false) { }
            }
        } else {
            this.btnModify.active = false;
            this.btnSubmit.active = true;
        }
        this.tablePage.active = !!this.tableToggle.isChecked;
        this.managerPage.active = !!this.managerToggle.isChecked;
        this.gamePage.active = !!this.settingToggle.isChecked;
    },

    _getTableStyleType() {
        let tableStyleType = 1;
        for (let index = 0; index < this.tableContainer.children.length; index++) {
            if (!this.tableContainer.children[index].getComponent(cc.Toggle)) continue;
            if (this.tableContainer.children[index].getComponent(cc.Toggle).isChecked) {
                tableStyleType = index + 1;
                break;
            }
        }
        return tableStyleType;
    },

    onBtnClk(event, param) {

        switch (param) {
            case 'skin':
                let canUnionOwnerModifySkin = parseInt(ConfigModel.getData('canUnionOwnerModifySkin'));
                canUnionOwnerModifySkin = isNaN(canUnionOwnerModifySkin) ? 0 : canUnionOwnerModifySkin;
                if (canUnionOwnerModifySkin == 2) {
                    AssetsManager.tipDialog('当前模式不支持自定义单个桌子颜色，请联系客服！');
                    return;
                }
                break;
            case 'close': {
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
            }
                break;
            case 'addRule':
                AssetsManager.createDialog({
                    path: "res/prefab/main/room/CreateRoomDialog",
                    bundle: ConfigModel.getSkin(),
                    isUnion: true,
                    gameRule: this.gameRule,
                    unionInfo: this._unionInfo,
                    cb: (node, gameRule) => {
                        if (gameRule.gameType != this.gameType) {
                            //游戏类型被篡改
                            this.ruleNameLabel.string = ConfigModel.getGameName(gameRule.gameType);
                        }
                        if (!!node && cc.isValid(node)) node.destroy();
                        this.gameType = gameRule.gameType;
                        this.gameRule = gameRule;
                    }
                });
                break;
            case 'changeName':
                this.changeName.string = this.ruleNameLabel.string;
                this.changeNameNode.active = true;
                break;
            case 'changeNameConfirm':
                this.changeNameNode.active = false;
                if (this.changeName.string.length > 0) {
                    this.ruleNameLabel.string = this.changeName.string;
                }
                break;
            case 'closeChangeName':
                this.changeNameNode.active = false;
                break;
            case 'changeBaseScore':
                this.changeBaseScore.string = this._baseScale.toString();
                this.changeBaseScoreNode.active = true;
                break;
            case 'changeBaseScoreConfirm':
                let baseScale = parseInt(this.changeBaseScore.string);
                if (isNaN(baseScale) || baseScale <= 0) {
                    AssetsManager.tipDialog("请输入正确的分数比例！");
                    return;
                }
                this._baseScale = baseScale;
                this.changeBaseScoreNode.active = false;
                this.baseScoreLabel.string = "1:" + this._baseScale;
                break;
            case 'closeBaseScoreNode':
                this.changeBaseScoreNode.active = false;
                break;
            case 'finished':
                if (!this.gameRule) {
                    AssetsManager.tipDialog("请添加游戏规则");
                    return;
                }
                if (!this.ruleNameLabel.string) {
                    AssetsManager.tipDialog("请输入规则名字");
                    return;
                }
                if (this._baseScale < 1) {
                    AssetsManager.tipDialog("请输入正确的分数比例");
                    return;
                }
                this.gameRule.baseScale = this._baseScale;
                let ticketScore = parseFloat(this.ticketEditBox.string);
                if (isNaN(ticketScore) || ticketScore < 0) {
                    ticketScore = 0;
                    AssetsManager.tipDialog('请输入有效的门票参数！');
                }
                this.gameRule.ticketScore = Utils.formatNumberWithDecimal(ticketScore, 1);
                this.ticketEditBox.string = `${this.gameRule.ticketScore}`;
                let robotCount = parseInt(this.robotEdit.string); //机器人数
                if (isNaN(robotCount) || robotCount > this.gameRule.maxPlayerCount) {
                    AssetsManager.tipDialog('机器人数不能大于最大人数');
                    this.robotEdit.string = 0;
                    return;
                }
                this.gameRule.robotCount = robotCount;
                let scoreLowLimit = parseFloat(this.scoreLowLimit.string);
                if (isNaN(scoreLowLimit) || scoreLowLimit <= 0) scoreLowLimit = 1000;
                scoreLowLimit = Utils.formatNumberWithDecimal(scoreLowLimit, 1);
                this.scoreLowLimit.string = `${scoreLowLimit}`;
                let scoreDismissLimit = parseFloat(this.scoreDismissLimit.string);
                if (isNaN(scoreDismissLimit) || scoreDismissLimit <= 0) scoreDismissLimit = 100;
                scoreDismissLimit = Utils.formatNumberWithDecimal(scoreDismissLimit, 1);
                this.scoreDismissLimit.string = `${scoreDismissLimit}`;
                if (scoreLowLimit <= scoreDismissLimit) scoreLowLimit = scoreDismissLimit * 10;//强制转换
                this.gameRule.gamingRebateType = this.gameRebateRoundToggle.isChecked ? 1 : 0;
                this.gameRule.scoreLowLimit = scoreLowLimit;
                this.gameRule.scoreDismissLimit = scoreDismissLimit;
                let fixScore = 0;
                if (this.fixBaiFenBiTog.isChecked) {
                    fixScore = parseFloat(this.fixScoreLimitBaiFenEdit.string);
                    if (isNaN(fixScore) || fixScore < 0) fixScore = 0;
                    if (fixScore > 100) fixScore = 100;
                    fixScore = Utils.formatNumberWithDecimal(fixScore, 1);
                    this.fixScoreLimitBaiFenEdit.string = `${fixScore}`;
                } else {
                    fixScore = parseFloat(this.fixScoreLimitGuDingEdit.string);
                    if (isNaN(fixScore) || fixScore < 0) fixScore = 0;
                    fixScore = Utils.formatNumberWithDecimal(fixScore, 1);
                    this.fixScoreLimitGuDingEdit.string = `${fixScore}`;
                }
                this.gameRule.fixScore = fixScore;
                this.gameRule.tableStyleType = this._getTableStyleType();
                let roomPayRule = {};
                roomPayRule.bigWinCount = 1;
                if (this.bigWinCount1.isChecked) {
                    roomPayRule.bigWinCount = 1;
                } else if (this.bigWinCountAll.isChecked) {
                    roomPayRule.bigWinCount = -1;
                }
                roomPayRule.rebateType = "all";
                roomPayRule.pumpWaterPattern = this.danPumpToggle.isChecked ? false : true;
                roomPayRule.isAvg = false;
                roomPayRule.percentMinWinScore = this.percentMinScore.string.length === 0 ? 0 : parseInt(this.percentMinScore.string);
                roomPayRule.percentScore = this.percentScore.string.length === 0 ? null : (Math.floor(parseFloat(this.percentScore.string) * 100) / 100);
                roomPayRule.ladderScore = this._ladderScore;
                this.gameRule.roomPayRule = roomPayRule;
                this.gameRule.fixScoreType = this.fixBaiFenBiTog.isChecked ? 2 : 1;
                this._callback && this._callback(this.gameType, this.ruleNameLabel.string, this.gameRule);
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
                break;
            case 'gudingzhi':
                this.btnGuDingSet.node.active = true;
                // this.percentLay.active = false;
                this.percentScore.enabled = false;
                this.percentMinScore.enabled = false;
                break;
            case 'baifenbi':
                this.btnGuDingSet.node.active = false;
                // this.percentLay.active = true;
                this.percentScore.enabled = true;
                this.percentMinScore.enabled = true;
                if (!!this.gameRule && !!this.gameRule.roomPayRule) {
                    this.gameRule.roomPayRule.ladderScore = null;
                    this._ladderScore = null;
                }
                break;
            case 'ticket':
                this.ticketEditBox.enabled = !!event.isChecked;
                if (!event.isChecked) {
                    this.ticketEditBox.string = '0';
                }
                break;
            case 'fixguding':
                this.fixScoreLimitGuDingEdit.node.active = !!event.isChecked;
                this.fixScoreLimitBaiFenEdit.node.active = !this.fixScoreLimitGuDingEdit.node.active;
                if (!event.isChecked) {
                    this.fixScoreLimitGuDingEdit.string = '0';
                }
                break;
            case 'fxibaifen':
                this.fixScoreLimitBaiFenEdit.node.active = !!event.isChecked;
                this.fixScoreLimitGuDingEdit.node.active = !this.fixScoreLimitBaiFenEdit.node.active;
                if (!event.isChecked) {
                    this.fixScoreLimitBaiFenEdit.string = '0';
                }
                break;
            case 'gameSetting':
                this._gameRuleSync();
                break;
            case 'gameManager':
                this._gameRuleSync();
                break;
            case 'tableColor':
                this._gameRuleSync();
                break;
        }
    },

    onFixScoreEidtEnd() {
        if (this.fixScoreLimitEdit.string.length == 0) {
            this.fixScoreLimitEdit.string = '0';
        } else {
            let fixScore = this.fixScoreLimitEdit.string;
            if (isNaN(parseFloat(fixScore))) {
                this.fixScoreLimitEdit.string = '0';
            } else {
                this.fixScoreLimitEdit.string = Utils.formatNumberWithDecimal(parseFloat(fixScore), 1);
            }
        }
    },

    onTicketEidtEnd() {
        let ticketScore = parseFloat(this.ticketEditBox.string);
        if (isNaN(ticketScore) || ticketScore < 0) {
            ticketScore = 0;
        }
        this.ticketEditBox.string = Utils.formatNumberWithDecimal(ticketScore, 1);
    },

    setLadderScore(data) {
        this._ladderScore = data;
    },



});