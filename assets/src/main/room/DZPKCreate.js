const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const CCUtil = require('../../utils/CCUtil');
const Utils = require("../../utils/Utils");
const { Def_Dzpk } = require('../../const/Defines');

cc.Class({
    extends: cc.Component,

    properties: {
        fangfeiPannel: cc.Node,
        hostPayTog: cc.Toggle,
        aaPayTog: cc.Toggle,
        winPayTog: cc.Toggle,
        jushuTog8: cc.Toggle,
        jushuTog12: cc.Toggle,
        jushuTog16: cc.Toggle,
        renshuEdit: cc.EditBox,
        difenEdit: cc.EditBox,
        blindTog0: cc.Toggle,
        blindTog1: cc.Toggle,
        blindTog2: cc.Toggle,
        blindTog3: cc.Toggle,
        blindTog4: cc.Toggle,
        blindTog5: cc.Toggle,
        opTickTog10: cc.Toggle,
        opTickTog15: cc.Toggle,
        opTickTog20: cc.Toggle,
        opTickTog25: cc.Toggle,
        bringRateEdit: cc.EditBox,
        tipsPercentEdit: cc.EditBox,
        tipsRateEdit: cc.EditBox,
        safeTog: cc.Toggle,
        straddleTog: cc.Toggle,
        autoMaiTog: cc.Toggle,
        delayShowCardsTog: cc.Toggle,
        jinruTog: cc.Toggle,
        guanzhanTog: cc.Toggle,
        lastLimitTog: cc.Toggle,
        peiFenLay: cc.Node,
        peiEdit: cc.EditBox,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 8,
            minPlayerCount: 2,
            maxPlayerCount: 2,
            gameType: Enums.bundleType.DZPK,
            canTrust: false,
            trustTm: 15,
            canEnter: true,
            showCards: false,
            canWatch: true,
            yuyin: false,
            fangzuobi: false,
            tongji: false,
            showGps: false,
            lastThreeJoin: false,
            baseScore: 1, //底分 德州叫ANTE 前注 必下分
            pourTick: 10, //下注思考时间
            isAutoMaiPai: false, //自动埋牌
            isForceStraddle: false, //强制Straddle
            isSafe: false, //保险
            isDelayShowCards: false, //延迟看牌
            blindScore: 1, //小盲注分 
            bringRate: 1, //带入记分牌倍数1-10倍
            tipsPercent: 0, //Tips警戒值0-5%
            tipsRate: 1, //Tips上限 最大10倍大盲
            bringScore: 200, //最低带入分数
            createAndWatch: true,
            peiScore: 1000, //配分
        };
        this.updateCost();
    },

    start() {
        this.peiFenLay.active = !this.node.nodeParams.isUnion || (!!this.node.nodeParams.unionInfo && this.node.nodeParams.unionInfo.unionType == Enums.UnionType.NORMAL);
        this.fangfeiPannel.active = !(!!this.node.nodeParams && !!this.node.nodeParams.isUnion);
        this.gameRule = !!this.node.nodeParams && !!this.node.nodeParams.gameRule ? this.node.nodeParams.gameRule : this.gameRule;
        this.init();
    },

    init() {
        if (this.gameRule.bureau == 12) {
            this.jushuTog12.isChecked = true;
        } else if (this.gameRule.bureau == 16) {
            this.jushuTog16.isChecked = true;
        } else {
            this.jushuTog8.isChecked = true;
        }
        let blindIndex = this.gameRule.blindIndex || 0;
        if (blindIndex == 1) {
            this.blindTog1.isChecked = true;
        } else if (blindIndex == 2) {
            this.blindTog2.isChecked = true;
        } else if (blindIndex == 3) {
            this.blindTog3.isChecked = true;
        } else if (blindIndex == 4) {
            this.blindTog4.isChecked = true;
        } else if (blindIndex == 5) {
            this.blindTog5.isChecked = true;
        } else {
            this.blindTog0.isChecked = true;
        }
        if (this.gameRule.pourTick == 15) {
            this.opTickTog15.isChecked = true;
        } else if (this.gameRule.pourTick == 20) {
            this.opTickTog20.isChecked = true;
        } else if (this.gameRule.pourTick == 25) {
            this.opTickTog25.isChecked = true;
        } else {
            this.opTickTog10.isChecked = true;
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        this.gameRule.peiScore = this.gameRule.peiScore || 1000;
        if (this.gameRule.bringScore > this.gameRule.peiScore) this.gameRule.peiScore = this.gameRule.bringScore;
        this.peiEdit.string = `${this.gameRule.peiScore}`;
        this.safeTog.isChecked = this.gameRule.isSafe;
        this.straddleTog.isChecked = this.gameRule.isForceStraddle;
        this.autoMaiTog.isChecked = this.gameRule.isAutoMaiPai;
        this.delayShowCardsTog.isChecked = this.gameRule.isDelayShowCards;
        this.bringRateEdit.string = this.gameRule.bringRate;
        this.tipsPercentEdit.string = this.gameRule.tipsPercent;
        this.tipsRateEdit.string = this.gameRule.tipsRate;
        this.renshuEdit.string = `${this.gameRule.maxPlayerCount || 2}`;
        this.difenEdit.string = this.gameRule.baseScore;
        this.jinruTog.isChecked = this.gameRule.canEnter;
        if (!!this.gameRule.canEnter) {
            this.lastLimitTog.interactable = true;
            this.lastLimitTog.isChecked = !!this.gameRule.lastThreeJoin;
        } else {
            this.lastLimitTog.interactable = false;
            this.lastLimitTog.isChecked = false;
        }
        CCUtil.setGrayShader(this.lastLimitTog.node, !this.lastLimitTog.interactable);
        this.guanzhanTog.isChecked = this.gameRule.canWatch;
    },

    updateCost() {
        let bureau = this.gameRule.bureau;
        let diamondCount = bureau == 8 ? 2 : bureau == 12 ? 3 : 4;
        this.gameRule.payDiamond = diamondCount;
        // this.diamondCount.string = diamondCount;
    },

    /**
     * 检查底分输入, 只能匹配非0的正整数
     * @param {cc.Object} gameRule 玩法
     * @param {cc.EditBox} editBox 输入框
     * @returns 
     */
    onCheckRuleEditScore(gameRule, editBox, min, max, ruleTypeStr) {
        let score = parseInt(editBox.string)
        var r = /^\+?[1-9][0-9]*$/ //非0的正整数
        if (!r.test(editBox.string) || score > max) {
            editBox.string = '';
            AssetsManager.tipDialog(`输入错误,请输入${min}-${max}的整数!`);
            return
        }
        gameRule[ruleTypeStr] = score;
    },

    onButtonClick(event, param) {
        if (param.indexOf('bureau') != -1) {
            this.gameRule.bureau = parseInt(param.split('_')[1]);
            this.updateCost();
        } else if (param == 'member') {
            let playerCount = this.renshuEdit.string;
            if (playerCount.length == 0 ||
                isNaN(parseInt(playerCount)) ||
                parseInt(playerCount) < 2 ||
                parseInt(playerCount) > 9) {
                AssetsManager.tipDialog('请输入有效的人数(2-9人)');
                this.renshuEdit.string = '';
                return;
            }
            this.gameRule.maxPlayerCount = parseInt(playerCount);
        } else if (param == 'difen') {
            this.onCheckRuleEditScore(this.gameRule, this.difenEdit, 1, 10, "baseScore")
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param == 'fangzuobi') {
            this.gameRule.fangzuobi = event.isChecked;
        } else if (param == 'jinren') {
            this.gameRule.canEnter = event.isChecked;
            if (!!this.gameRule.canEnter) {
                this.lastLimitTog.interactable = true;
            } else {
                this.gameRule.lastThreeJoin = false;
                this.lastLimitTog.isChecked = false;
                this.lastLimitTog.interactable = false;
            }
            CCUtil.setGrayShader(this.lastLimitTog.node, !this.lastLimitTog.interactable);
        } else if (param == 'lastlimit') {
            this.gameRule.lastThreeJoin = !!event.isChecked;
        } else if (param == 'guanzhan') {
            this.gameRule.canWatch = event.isChecked;
        } else if (param == "tongji") {
            this.gameRule.tongji = event.isChecked
        } else if (param == "location") { //防作弊 服务器判断
            this.gameRule.showGps = event.isChecked
        } else if (param.indexOf('blind') != -1) {
            let blindIndex = parseInt(param.slice(5));
            let blindLevelConfig = Def_Dzpk.blindLevelConfig;
            let blindLevel = blindLevelConfig[blindIndex];
            let blindScores = blindLevel.split('/');
            this.gameRule.blindIndex = blindIndex;
            this.gameRule.blindScore = blindScores[0];
            this.gameRule.bringScore = blindScores[2];
            if (this.gameRule.bringScore > this.gameRule.peiScore) this.gameRule.peiScore = this.gameRule.bringScore;
            this.peiEdit.string = `${this.gameRule.peiScore}`;
        } else if (param.indexOf('pourtick') != -1) {
            this.gameRule.pourTick = parseInt(param.slice(8));
        } else if (param == "bringrate") {
            let bringRate = this.bringRateEdit.string;
            if (bringRate.length == 0 ||
                isNaN(parseInt(bringRate)) ||
                parseInt(bringRate) < 1 ||
                parseInt(bringRate) > 10) {
                AssetsManager.tipDialog('请输入带入记分牌倍数(1-10倍)');
                this.bringRateEdit.string = '';
                return;
            }
            this.gameRule.bringRate = parseInt(bringRate);
        } else if (param == "tipspercent") {
            let tipsPercent = this.tipsPercentEdit.string;
            if (tipsPercent.length == 0 ||
                isNaN(parseInt(tipsPercent)) ||
                parseInt(tipsPercent) < 0 ||
                parseInt(tipsPercent) > 5) {
                AssetsManager.tipDialog('请输入Tips倍率(0-5%)');
                this.tipsPercentEdit.string = '';
                return;
            }
            this.gameRule.tipsPercent = parseInt(tipsPercent);
        } else if (param == "tipsrate") {
            let tipsRate = this.tipsRateEdit.string;
            if (tipsRate.length == 0 ||
                isNaN(parseInt(tipsRate)) ||
                parseInt(tipsRate) < 1 ||
                parseInt(tipsRate) > 10) {
                AssetsManager.tipDialog('请输入Tips大盲倍数(1-10)');
                this.tipsRateEdit.string = '';
                return;
            }
            this.gameRule.tipsRate = parseInt(tipsRate);
        } else if (param == 'safe') {
            this.gameRule.isSafe = event.isChecked;
        } else if (param == 'straddle') {
            this.gameRule.isForceStraddle = event.isChecked;
        } else if (param == 'maipai') {
            this.gameRule.isAutoMaiPai = event.isChecked;
        } else if (param == 'yanchi') {
            this.gameRule.isDelayShowCards = event.isChecked;
        } else if (param == "peiscore") {
            let peiScore = parseFloat(this.peiEdit.string);
            if (isNaN(peiScore)) peiScore = 1000;
            peiScore = Utils.formatNumberWithDecimal(peiScore, 1);
            this.gameRule.peiScore = `${peiScore}`;
            if (this.gameRule.bringScore > this.gameRule.peiScore) this.gameRule.peiScore = this.gameRule.bringScore;
            this.peiEdit.string = `${this.gameRule.peiScore}`;
        }
        ConfigModel.setRoomCreateCache(this.gameRule);
    },

    getRule() {
        return this.gameRule;
    }

});