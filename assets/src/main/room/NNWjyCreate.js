const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const CCUtil = require('../../utils/CCUtil');
const Utils = require("../../utils/Utils");
const { Def_Nnwjy } = require('../../const/Defines');

cc.Class({
    extends: cc.Component,

    properties: {
        fangfeiPannel: cc.Node,
        hostPayTog: cc.Toggle,
        aaPayTog: cc.Toggle,
        winPayTog: cc.Toggle,
        jushuTog10: cc.Toggle,
        jushuTog20: cc.Toggle,
        jushuTog30: cc.Toggle,
        renshuTog6: cc.Toggle,
        renshuTog8: cc.Toggle,
        nnszTog: cc.Toggle,
        mpqzTog: cc.Toggle,
        fzzzTog: cc.Toggle,
        tbnnTog: cc.Toggle,
        zyqzTog: cc.Toggle,
        llzzTog: cc.Toggle,
        m3a2Tog: cc.Toggle,
        m4a1Tog: cc.Toggle,
        quananTog: cc.Toggle,
        suijilaiziTog: cc.Toggle,
        wanglaiziTog: cc.Toggle,
        kuaishu: cc.Toggle,
        zhengchang: cc.Toggle,
        baseEdit: cc.EditBox,
        robBankEdit: cc.EditBox,
        scaleTypeTog1: cc.Toggle,
        scaleTypeTog2: cc.Toggle,
        scaleTypeTog3: cc.Toggle,
        tuizhuPannel: cc.Node,
        tuiScaleTog0: cc.Toggle,
        tuiScaleTog5: cc.Toggle,
        tuiScaleTog10: cc.Toggle,
        tuiScaleTog20: cc.Toggle,
        tuiScaleTog40: cc.Toggle,
        pourScoreTog1: cc.Toggle,
        pourScoreTog2: cc.Toggle,
        pourScoreTog3: cc.Toggle,
        pourScoreTog4: cc.Toggle,
        pourScoreTog5: cc.Toggle,
        pourScoreTog6: cc.Toggle,
        teshuPannel: cc.Node,
        tonghuashunTog: cc.Toggle,
        tonghuashunLabel: cc.Label,
        yitiaolongTog: cc.Toggle,
        yitiaolongLabel: cc.Label,
        zhadanniuTog: cc.Toggle,
        zhadanniuLabel: cc.Label,
        wuxiaoniuTog: cc.Toggle,
        wuxiaoniuLabel: cc.Label,
        huluniuTog: cc.Toggle,
        huluniuLabel: cc.Label,
        wuhuaniuTog: cc.Toggle,
        wuhuaniuLabel: cc.Label,
        tonghuaniuTog: cc.Toggle,
        tonghuaniuLabel: cc.Label,
        shunziniuTog: cc.Toggle,
        shunziniuLabel: cc.Label,
        cuopaiTog: cc.Toggle,
        jinrenTog: cc.Toggle,
        guanzhanTog: cc.Toggle,
        tuoGuanTog: cc.Toggle,
        lastLimitTog: cc.Toggle,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 10,
            minPlayerCount: 2,
            maxPlayerCount: 6,
            gameType: Enums.bundleType.WJYNN,
            gameFrameType: Def_Nnwjy.gameType.NIUNIU,
            sendCardType: Def_Nnwjy.sendCardType.QUANAN,
            scaleType: Def_Nnwjy.scaleType.LITTLE,
            tuiScale: [5, 25],
            canPourScores: [0.1, 0.2, 0.3, 0.4],
            canPourScoresIndex: 1,
            canTrust: false,
            trustTm: 9999,
            canEnter: false,
            cuopai: false,
            fangzuobi: false,
            cardsType: {
                MEINIU: Def_Nnwjy.cardsType.MEINIU,
                YOUNIU: Def_Nnwjy.cardsType.YOUNIU,
                NIUNIU: Def_Nnwjy.cardsType.NIUNIU,
            },
            canWatch: false,
            payDiamond: 1,
            yuyin: false,
            baseScore: 0.1,
            tuizhu: false,
            robBankLimit: 0,
            ziyouju: false,
            ruffianType: 1,
            // 极速模式
            jiaSuMoShi: false,
            /**输赢统计 */
            tongji: false,
            showGps: false,
            lastThreeJoin: false
        };
        this.updateCost();
    },

    start() {
        this.fangfeiPannel.active = !(!!this.node.nodeParams && !!this.node.nodeParams.isUnion);
        this.gameRule = !!this.node.nodeParams && !!this.node.nodeParams.gameRule ? this.node.nodeParams.gameRule : this.gameRule;
        this.init();
    },

    init() {
        /* 局数 */
        if (this.gameRule.bureau == 20) {
            this.jushuTog20.isChecked = true;
        } else if (this.gameRule.bureau == 30) {
            this.jushuTog30.isChecked = true;
        } else {
            this.jushuTog10.isChecked = true;
        }
        /* 人数 */
        if (this.gameRule.maxPlayerCount == 8) {
            this.renshuTog8.isChecked = true;
        } else {
            this.renshuTog6.isChecked = true;
        }
        /* 推注 */
        /* 下注分 */
        if (this.gameRule.canPourScoresIndex == 1) {
            this.pourScoreTog1.isChecked = true;
        } else if (this.gameRule.canPourScoresIndex == 2) {
            this.pourScoreTog2.isChecked = true;
        } else if (this.gameRule.canPourScoresIndex == 3) {
            this.pourScoreTog3.isChecked = true;
        } else if (this.gameRule.canPourScoresIndex == 4) {
            this.pourScoreTog4.isChecked = true;
        } else if (this.gameRule.canPourScoresIndex == 5) {
            this.pourScoreTog5.isChecked = true;
        } else if (this.gameRule.canPourScoresIndex == 6) {
            this.pourScoreTog6.isChecked = true;
        }
        /* 模式 */
        if (this.gameRule.gameFrameType == Def_Nnwjy.gameType.MINGPAIQZ) {
            this.mpqzTog.isChecked = true;
        } else if (this.gameRule.gameFrameType == Def_Nnwjy.gameType.FANGZHU) {
            this.fzzzTog.isChecked = true;
        } else if (this.gameRule.gameFrameType == Def_Nnwjy.gameType.TONGBI) {
            this.tbnnTog.isChecked = true;
        } else if (this.gameRule.gameFrameType == Def_Nnwjy.gameType.ZHIYOUQZ) {
            this.zyqzTog.isChecked = true;
        } else if (this.gameRule.gameFrameType == Def_Nnwjy.gameType.LUNZHUANG) {
            this.llzzTog.isChecked = true;
        } else {
            this.nnszTog.isChecked = true;
        }
        /* 玩法 */
        if (this.gameRule.sendCardType == Def_Nnwjy.sendCardType.MING3AN2) {
            this.m3a2Tog.isChecked = true;
        } else if (this.gameRule.sendCardType == Def_Nnwjy.sendCardType.MING4AN1) {
            this.m4a1Tog.isChecked = true;
        } else {
            this.quananTog.isChecked = true;
        }
        if (this.gameRule.ruffianType == 3) {
            this.suijilaiziTog.isChecked = true;
        } else if (this.gameRule.ruffianType == 2) {
            this.wanglaiziTog.isChecked = true;
        }
        // 极速模式
        if (this.gameRule.jiaSuMoShi == true) {
            this.kuaishu.isChecked = true;
        } else if (this.gameRule.jiaSuMoShi == false) {
            this.zhengchang.isChecked = true;
        }
        /* 翻倍 */
        if (this.gameRule.scaleType == Def_Nnwjy.scaleType.BIG) {
            this.scaleTypeTog2.isChecked = true;
        } else if (this.gameRule.scaleType == Def_Nnwjy.scaleType.DIANZI) {
            this.scaleTypeTog3.isChecked = true;
        } else {
            this.scaleTypeTog1.isChecked = true;
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        this.baseEdit.string = `${this.gameRule.baseScore || 0.1}`;
        this.tonghuashunTog.isChecked = this.gameRule.cardsType.TONGHUASHUN;
        this.yitiaolongTog.isChecked = this.gameRule.cardsType.YITIAOLONG;
        this.zhadanniuTog.isChecked = this.gameRule.cardsType.ZHADANNIU;
        this.wuxiaoniuTog.isChecked = this.gameRule.cardsType.WUXIAONIU;
        this.wuhuaniuTog.isChecked = this.gameRule.cardsType.HULUNIU;
        this.wuhuaniuTog.isChecked = this.gameRule.cardsType.WUHUANIU;
        this.tonghuaniuTog.isChecked = this.gameRule.cardsType.TONGHUANIU;
        this.shunziniuTog.isChecked = this.gameRule.cardsType.SHUNZINIU;

        /* 高级 */
        this.cuopaiTog.isChecked = this.gameRule.cuopai;
        this.jinrenTog.isChecked = this.gameRule.canEnter;
        if (!!this.gameRule.canEnter) {
            this.lastLimitTog.interactable = true;
            this.lastLimitTog.isChecked = !!this.gameRule.lastThreeJoin;
        } else {
            this.lastLimitTog.interactable = false;
            this.lastLimitTog.isChecked = false;
        }
        CCUtil.setGrayShader(this.lastLimitTog.node, !this.lastLimitTog.interactable);
        this.guanzhanTog.isChecked = this.gameRule.canWatch;
        /* 托管 */
        this.tuoGuanTog.isChecked = !!this.gameRule.canTrust;
        if (this.gameRule.robBankLimit > 0) {
            this.robBankEdit.string = "" + this.gameRule.robBankLimit;
        }
    },

    updateTuiScale() {
        if (!this.gameRule.tuizhu) {
            this.tuiScaleTog0.isChecked = true;
        } else {
            if (this.gameRule.tuiScale.indexOf(5) != -1) {
                this.tuiScaleTog5.isChecked = true;
            } else if (this.gameRule.tuiScale.indexOf(10) != -1) {
                this.tuiScaleTog10.isChecked = true;
            } else if (this.gameRule.tuiScale.indexOf(20) != -1) {
                this.tuiScaleTog20.isChecked = true;
            } else if (this.gameRule.tuiScale.indexOf(40) != -1) {
                this.tuiScaleTog40.isChecked = true;
            } else {
                this.tuiScaleTog0.isChecked = true;
            }
        }
    },

    updateCost() {
        let bureau = this.gameRule.bureau;
        let diamondCount = 2
        if (bureau === 20) diamondCount = 3
        if (bureau === 30) diamondCount = 6
        this.gameRule.payDiamond = diamondCount;
        // this.diamondCount.string = diamondCount;
    },

    onButtonClick(event, param) {
        if (param.indexOf('bureau') != -1) {
            let bureau = parseInt(param.split('_')[1]);
            this.gameRule.bureau = bureau;
            this.updateCost();
        } else if (['BIG', 'LITTLE', 'DIANZI'].indexOf(param) != -1) {
            this.gameRule.scaleType = Def_Nnwjy.scaleType[param];
        } else if (['NIUNIU', 'ZHIYOUQZ', 'LUNZHUANG', 'TONGBI', 'FANGZHU', 'MINGPAIQZ'].indexOf(param) != -1) {
            this.gameRule.gameFrameType = Def_Nnwjy.gameType[param];
        } else if (param.indexOf('member') != -1) {
            this.gameRule.maxPlayerCount = parseInt(param.slice(6));
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param == 'ming3an2') {
            this.gameRule.sendCardType = Def_Nnwjy.sendCardType.MING3AN2;
        } else if (param == 'ming4an1') {
            this.gameRule.sendCardType = Def_Nnwjy.sendCardType.MING4AN1;
        } else if (param == 'quanan') {
            this.gameRule.sendCardType = Def_Nnwjy.sendCardType.QUANAN;
        } else if (['SHUNZINIU', 'YINNIU', 'TONGHUANIU', 'WUHUANIU', 'HULUNIU', 'WUXIAONIU', 'ZHADANNIU', 'YITIAOLONG', 'TONGHUASHUN'].indexOf(param) != -1) {
            this.gameRule.cardsType[param] = (event.isChecked) ? Def_Nnwjy.cardsType[param] : null;
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
        } else if (param == 'cuopai') {
            this.gameRule.cuopai = event.isChecked;
        } else if (param == 'tuoguan') {
            this.gameRule.canTrust = event.isChecked;
        } else if (param == 'yuyin') {
            this.gameRule.yuyin = event.isChecked;
        } else if (param == 'fen1') {
            this.gameRule.canPourScores = [0.1, 0.2, 0.3, 0.4];
            this.gameRule.canPourScoresIndex = 1;
        } else if (param == 'fen2') {
            this.gameRule.canPourScores = [0.2, 0.4, 0.6, 0.8];
            this.gameRule.canPourScoresIndex = 2;
        } else if (param == 'fen3') {
            this.gameRule.canPourScores = [0.5, 1, 1.5, 2];
            this.gameRule.canPourScoresIndex = 3;
        } else if (param == 'fen4') {
            this.gameRule.canPourScores = [1, 2, 3, 4];
            this.gameRule.canPourScoresIndex = 4;
        } else if (param == 'fen5') {
            this.gameRule.canPourScores = [1.5, 3, 4.5, 6];
            this.gameRule.canPourScoresIndex = 5;
        } else if (param == 'fen6') {
            this.gameRule.canPourScores = [2, 4, 6, 8];
            this.gameRule.canPourScoresIndex = 6;
        } else if (param.indexOf('tui_') != -1) {
            this.tuizhuPannel.active = false;
            let tuiScale = param.split('_');
            this.gameRule.tuizhu = parseInt(tuiScale[1]) != 0;
            this.gameRule.tuiScale = [parseInt(tuiScale[1]), parseInt(tuiScale[1]) * 5];
        } else if (param == 'rulepanel') {
            this.teshuPannel.active = !this.teshuPannel.active;
            if (this.gameRule.scaleType == Def_Nnwjy.scaleType.DIANZI) {
                this.tonghuashunLabel.string = "同花顺(16倍)";
                this.yitiaolongLabel.string = "一条龙(15倍)";
                this.zhadanniuLabel.string = "炸弹牛(14倍)";
                this.wuxiaoniuLabel.string = "五小牛(13倍)";
                this.huluniuLabel.string = "葫芦牛(12倍)";
                this.wuhuaniuLabel.string = "五花牛(11倍)";
                this.tonghuaniuLabel.string = "同花牛(11倍)";
                this.shunziniuLabel.string = "顺子牛(11倍)";
            } else {
                this.tonghuashunLabel.string = "同花顺(10倍)";
                this.yitiaolongLabel.string = "一条龙(9倍)";
                this.zhadanniuLabel.string = "炸弹牛(8倍)";
                this.wuxiaoniuLabel.string = "五小牛(7倍)";
                this.huluniuLabel.string = "葫芦牛(6倍)";
                this.wuhuaniuLabel.string = "五花牛(6倍)";
                this.tonghuaniuLabel.string = "同花牛(6倍)";
                this.shunziniuLabel.string = "顺子牛(4倍)";
            }
        } else if (param == 'tuizhupannel') {
            this.tuizhuPannel.active = !this.tuizhuPannel.active;
            if (this.tuizhuPannel.active) {
                this.updateTuiScale();
            }
        } else if (param == "banklimit") {
            let robBankLimit = parseInt(this.robBankEdit.string);
            if (isNaN(robBankLimit) || robBankLimit < 0) {
                AssetsManager.tipDialog("输入格式不正确！");
                robBankLimit = 0;
            }
            robBankLimit = Utils.formatNumberWithDecimal(robBankLimit, 1);
            this.robBankEdit.string = robBankLimit;
            this.gameRule.robBankLimit = robBankLimit;
        } else if (param == "baseedit") {
            let baseScore = parseFloat(this.baseEdit.string);
            if (isNaN(baseScore) || baseScore < 0.1) {
                baseScore = 0.1;
                AssetsManager.tipDialog("输入格式不正确！");
            }
            baseScore = Utils.formatNumberWithDecimal(baseScore, 1);
            this.baseEdit.string = `${baseScore}`;
            this.gameRule.baseScore = baseScore;
        } else if (param == "suijilaizi") {
            this.gameRule.ruffianType = event.isChecked ? 3 : 1
        } else if (param == "wanglaizi") {
            this.gameRule.ruffianType = event.isChecked ? 2 : 1
        } else if (param == 'fangzuobi') {
            this.gameRule.fangzuobi = event.isChecked;
        } else if (param == "tongji") { //输赢统计显示
            this.gameRule.tongji = event.isChecked
        } else if (param == "location") { //防作弊 服务器判断
            this.gameRule.showGps = event.isChecked
        } else if (param == "zhengchang") {
            this.gameRule.jiaSuMoShi = false
        } else if (param == "kuaishu") {
            this.gameRule.jiaSuMoShi = true
        }
        // console.log('this.gameRule', this.gameRule);
        ConfigModel.setRoomCreateCache(this.gameRule);
    },

    getRule() {
        return this.gameRule;
    }

});