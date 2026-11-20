const AssetsManager = require('../../../utils/AssetsManager')
const Enums = require('../../../const/Enums');
const Utils = require('../../../utils/Utils');
const SubManager = require('../../../utils/SubManager');
const ConfigModel = require('../../../model/ConfigModel');
const UserModel = require('../../../model/UserModel');

cc.Class({
    extends: cc.Component,

    properties: {
        jieTiChouCtrl: require('UnionAddBaseRebateController'),
        ruleNameEdit: cc.EditBox,
        lowJoinScoreEdit: cc.EditBox,
        lowDisScoreEdit: cc.EditBox,
        bigBigWin: cc.Toggle,
        bigAllWin: cc.Toggle,
        guDingToggle: cc.Toggle,
        baiFenBiToggle: cc.Toggle,
        jieTiToggle: cc.Toggle,
        quanJuChouToggle: cc.Toggle,
        meiJuChouToggle: cc.Toggle,
        danPumpToggle: cc.Toggle,
        douPumpToggle: cc.Toggle,
        baiFenBiLay: cc.Node,
        baiFenBiMinEdit: cc.EditBox,
        baiFenBiValueEdit: cc.EditBox,
        guDingChouLay: cc.Node,
        guDingChouMinEdit: cc.EditBox,
        guDingChouValueEdit: cc.EditBox,
        baoDiGuDingToggle: cc.Toggle,
        baoDiBaiFenToggle: cc.Toggle,
        guDingEdit: cc.EditBox,
        baiFenEdit: cc.EditBox,
        ticketEditBox: cc.EditBox,
        robotEditBox: cc.EditBox,
        btnAddRule: cc.Node,
        btnModify: cc.Node,
        btnSubmit: cc.Node,
        tableColors: cc.Node,

        _ladderScore: [],
        _tableStyleType: 1,
        _unionInfo: null,
        _callback: null
    },

    start() {
        this.btnAddRule.active = this.node.nodeParams.from == 'detail';
        this.jieTiChouCtrl.init(this);
        this._callback = this.node.nodeParams && this.node.nodeParams.cb ? this.node.nodeParams.cb : null;
        this._unionInfo = this.node.nodeParams && this.node.nodeParams.unionInfo ? this.node.nodeParams.unionInfo : null;
        this.gameRule = this.node.nodeParams && this.node.nodeParams.gameRule ? this.node.nodeParams.gameRule : null;
        this._tableStyleType = 1;
        this._gameRuleSync();
    },

    _gameRuleSync() {
        if (!!this.gameRule) {
            this.btnModify.active = true;
            this.btnSubmit.active = false;
            this.gameRule = typeof (this.node.nodeParams.gameRule) == 'string' ? JSON.parse(this.node.nodeParams.gameRule) : this.node.nodeParams.gameRule;
            this.gameType = this.gameRule.gameType;
            this.ruleNameEdit.string = this.node.nodeParams.gameRule.ruleName || ConfigModel.getGameName(this.gameType);
            this._tableStyleType = this.gameRule.tableStyleType || 1;
            this._tableStyleType = this._tableStyleType > 8 || this._tableStyleType <= 0 ? 1 : this._tableStyleType;
            this.tableColors.children[this._tableStyleType - 1].getComponent(cc.Toggle).isChecked = true;
            this.lowJoinScoreEdit.string = (this.gameRule.scoreLowLimit || 1000).toString();
            this.lowDisScoreEdit.string = (this.gameRule.scoreDismissLimit || 100).toString();
            this.gameRule.ticketScore = Utils.formatNumberWithDecimal(parseFloat(this.gameRule.ticketScore >= 0 ? this.gameRule.ticketScore : 0), 1);
            this.ticketEditBox.string = this.gameRule.ticketScore || 0;
            this.robotEditBox.string = this.gameRule.robotCount || 0;
            let roomPayRule = this.gameRule.roomPayRule || {};
            if (this.gameRule.fixScoreType == 2) {
                this.baoDiBaiFenToggle.isChecked = true;
                this.baiFenEdit.node.active = true;
                this.guDingEdit.node.active = false;
                this.baiFenEdit.string = (this.gameRule.fixScore || 0).toString();
            } else {
                this.baoDiGuDingToggle.isChecked = true;
                this.guDingEdit.node.active = true;
                this.baiFenEdit.node.active = false;
                this.guDingEdit.string = (this.gameRule.fixScore || 0).toString();
            }
            if (!!roomPayRule.bigWinCount) {
                if (roomPayRule.bigWinCount === -1) {
                    this.bigAllWin.isChecked = true;
                } else if (roomPayRule.bigWinCount === 1) {
                    this.bigBigWin.isChecked = true;
                }
            }
            if (!!roomPayRule.pumpWaterPattern) {
                this.douPumpToggle.isChecked = true;
            } else {
                this.danPumpToggle.isChecked = true;
            }
            if (this.gameRule.gamingRebateType == 0) {
                this.quanJuChouToggle.isChecked = true;
            } else if (this.gameRule.gamingRebateType == 1) {
                this.meiJuChouToggle.isChecked = true;
            }
            if (!!roomPayRule.ladderScore && roomPayRule.ladderScore.length > 0) {
                this._ladderScore = roomPayRule.ladderScore;
                if (roomPayRule.ladderScore.length >= 1 && !!roomPayRule.jietiScoreArray) {
                    this.jieTiToggle.isChecked = true;
                    //阶梯设置
                    this.jieTiChouCtrl.sync(roomPayRule.ladderScore);
                } else {
                    this.guDingToggle.isChecked = true;
                    this.guDingChouLay.active = true;
                    //固定设置
                    let ladderScore = roomPayRule.ladderScore[0] || {};
                    this.guDingChouMinEdit.string = ladderScore.minScore || 0;
                    this.guDingChouValueEdit.string = ladderScore.rebateScore || 0;
                }
            } else {
                this.baiFenBiToggle.isChecked = true;
                this.baiFenBiLay.active = true;
                this.baiFenBiValueEdit.string = `${roomPayRule.percentScore >= 0 ? roomPayRule.percentScore : 0}`;
                this.baiFenBiMinEdit.string = `${roomPayRule.percentMinWinScore >= 0 ? roomPayRule.percentMinWinScore : 0}`;
                this.jieTiChouCtrl.reset();
            }
            if (roomPayRule.isAvg !== false) { }
        } else {
            this.btnModify.active = false;
            this.btnSubmit.active = true;
        }
    },
    _getTableStyleType() {
        let tableStyleType = 1;
        for (let index = 0; index < this.tableColors.children.length; index++) {
            if (!this.tableColors.children[index].getComponent(cc.Toggle)) continue;
            if (this.tableColors.children[index].getComponent(cc.Toggle).isChecked) {
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
                            this.ruleNameEdit.string = ConfigModel.getGameName(gameRule.gameType);
                        }
                        if (!!node && cc.isValid(node)) node.destroy();
                        this.gameType = gameRule.gameType;
                        this.gameRule = gameRule;
                    }
                });
                break;
            case 'finished':
                if (!this.gameRule) {
                    AssetsManager.tipDialog("请添加游戏规则");
                    return;
                }
                let ruleName = this.ruleNameEdit.string;
                if (ruleName.length == 0) {
                    AssetsManager.tipDialog("请输入规则名字");
                    return;
                }
                let ticketScore = parseFloat(this.ticketEditBox.string);
                if (isNaN(ticketScore) || ticketScore < 0) {
                    ticketScore = 0;
                    AssetsManager.tipDialog('请输入有效的隐藏分！');
                }
                this.gameRule.ticketScore = Utils.formatNumberWithDecimal(ticketScore, 1);
                this.ticketEditBox.string = `${this.gameRule.ticketScore}`;
                let scoreLowLimit = parseFloat(this.lowJoinScoreEdit.string);
                if (isNaN(scoreLowLimit) || scoreLowLimit <= 0) scoreLowLimit = 1000;
                scoreLowLimit = Utils.formatNumberWithDecimal(scoreLowLimit, 1);
                this.lowJoinScoreEdit.string = `${scoreLowLimit}`;
                let scoreDismissLimit = parseFloat(this.lowDisScoreEdit.string);
                if (isNaN(scoreDismissLimit) || scoreDismissLimit <= 0) scoreDismissLimit = 100;
                scoreDismissLimit = Utils.formatNumberWithDecimal(scoreDismissLimit, 1);
                this.lowDisScoreEdit.string = `${scoreDismissLimit}`;
                if (scoreLowLimit <= scoreDismissLimit) scoreLowLimit = scoreDismissLimit * 10;//强制转换
                let robotCount = parseInt(this.robotEditBox.string); //机器人数
                if (isNaN(robotCount) || robotCount > this.gameRule.maxPlayerCount) {
                    AssetsManager.tipDialog('请输入有效的机器人数~');
                    this.robotEditBox.string = 0;
                    return;
                }
                this.gameRule.robotCount = robotCount;
                this.gameRule.gamingRebateType = this.meiJuChouToggle.isChecked ? 1 : 0;
                this.gameRule.scoreLowLimit = scoreLowLimit;
                this.gameRule.scoreDismissLimit = scoreDismissLimit;
                let fixScore = 0;
                if (this.baoDiBaiFenToggle.isChecked) {
                    fixScore = parseFloat(this.baiFenEdit.string);
                    if (isNaN(fixScore) || fixScore < 0) fixScore = 0;
                    if (fixScore > 100) fixScore = 100;
                    fixScore = Utils.formatNumberWithDecimal(fixScore, 1);
                    this.baiFenEdit.string = `${fixScore}`;
                } else {
                    fixScore = parseFloat(this.guDingEdit.string);
                    if (isNaN(fixScore) || fixScore < 0) fixScore = 0;
                    fixScore = Utils.formatNumberWithDecimal(fixScore, 1);
                    this.guDingEdit.string = `${fixScore}`;
                }
                this.gameRule.fixScore = fixScore;
                this.gameRule.tableStyleType = this._getTableStyleType();
                let roomPayRule = {};
                roomPayRule.bigWinCount = 1;
                if (this.bigBigWin.isChecked) {
                    roomPayRule.bigWinCount = 1;
                } else if (this.bigAllWin.isChecked) {
                    roomPayRule.bigWinCount = -1;
                }
                this.gameRule.fixScoreType = this.baoDiBaiFenToggle.isChecked ? 2 : 1;
                roomPayRule.rebateType = "all";
                roomPayRule.pumpWaterPattern = this.danPumpToggle.isChecked ? false : true;
                roomPayRule.isAvg = false;
                if (this.guDingChouLay.active) {
                    let minScore = parseFloat(this.guDingChouMinEdit.string);
                    minScore = isNaN(minScore) || minScore < 0 ? 0 : minScore;
                    minScore = Utils.formatNumberWithDecimal(minScore, 1);
                    this.guDingChouMinEdit.string = `${minScore}`;
                    let rebateScore = parseFloat(this.guDingChouValueEdit.string);
                    rebateScore = isNaN(rebateScore) || rebateScore < 0 ? 0 : rebateScore;
                    rebateScore = Utils.formatNumberWithDecimal(rebateScore, 1);
                    this.guDingChouValueEdit.string = `${rebateScore}`;
                    // 固定值满赠
                    let guDing = { minScore: minScore, maxScore: 10000000, rebateScore: rebateScore }
                    let ladderScore = [];
                    ladderScore.push(guDing);
                    this._ladderScore = ladderScore;
                    roomPayRule.percentMinWinScore = 0;
                    roomPayRule.percentScore = 0;
                    roomPayRule.ladderScore = this._ladderScore;
                } else if (this.baiFenBiLay.active) {
                    let percentMinWinScore = parseInt(this.baiFenBiMinEdit.string);
                    percentMinWinScore = isNaN(percentMinWinScore) || percentMinWinScore < 0 ? 0 : percentMinWinScore;
                    let percentScore = parseInt(this.baiFenBiValueEdit.string);
                    percentScore = isNaN(percentScore) || percentScore < 0 ? 0 : percentScore;
                    roomPayRule.percentMinWinScore = percentMinWinScore;
                    roomPayRule.percentScore = percentScore;
                    roomPayRule.ladderScore = this._ladderScore;
                } else {
                    roomPayRule.percentMinWinScore = 0;
                    roomPayRule.percentScore = 0;
                    roomPayRule.ladderScore = this._ladderScore;
                    roomPayRule.jietiScoreArray = true;
                }
                this.gameRule.roomPayRule = roomPayRule;
                this._callback && this._callback(this.gameType, ruleName, this.gameRule);
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
                break;
            case 'gudingzhi':
                this.guDingChouLay.active = true;
                this.baiFenBiLay.active = false;
                break;
            case 'jietizhi':
                this.jieTiChouCtrl.node.active = true;
                this.guDingChouLay.active = false;
                this.baiFenBiLay.active = false;
                break;
            case 'baifenbi':
                this.baiFenBiLay.active = true;
                this.guDingChouLay.active = false;
                if (!!this.gameRule && !!this.gameRule.roomPayRule) {
                    this.gameRule.roomPayRule.ladderScore = null;
                    this._ladderScore = null;
                }
                break;
            case 'fixguding':
                this.guDingEdit.node.active = !!event.isChecked;
                this.baiFenEdit.node.active = !this.guDingEdit.node.active;
                if (!event.isChecked) {
                    this.guDingEdit.string = '0';
                }
                break;
            case 'fxibaifen':
                this.baiFenEdit.node.active = !!event.isChecked;
                this.guDingEdit.node.active = !this.baiFenEdit.node.active;
                if (!event.isChecked) {
                    this.baiFenEdit.string = '0';
                }
                break;
        }
    },

    onFixScoreEidtEnd() {
        if (this.baoDiChouShuiEdit.string.length == 0) {
            this.baoDiChouShuiEdit.string = '0';
        } else {
            let fixScore = this.baoDiChouShuiEdit.string;
            if (isNaN(parseFloat(fixScore))) {
                this.baoDiChouShuiEdit.string = '0';
            } else {
                this.baoDiChouShuiEdit.string = Utils.formatNumberWithDecimal(parseFloat(fixScore), 1);
            }
        }
    },

    onTicketEidtEnd() {
        let ticketScore = parseFloat(this.ticketEditBox.string);
        if (isNaN(ticketScore) || ticketScore < 0) ticketScore = 0;
        this.ticketEditBox.string = Utils.formatNumberWithDecimal(ticketScore, 1);
    },

    setLadderScore(data) {
        this._ladderScore = data;
    },



});