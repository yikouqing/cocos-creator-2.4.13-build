const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const CCUtil = require('../../utils/CCUtil');
const Utils = require("../../utils/Utils");
const { Def_Sg } = require('../../const/Defines');

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
        renshuTog10: cc.Toggle,
        pingbeiTog: cc.Toggle,
        fanbeiTog: cc.Toggle,
        m2a1Tog: cc.Toggle,
        m1a2Tog: cc.Toggle,
        quananTog: cc.Toggle,
        qzsgTog: cc.Toggle,
        dcxTog: cc.Toggle,
        bwzTog: cc.Toggle,
        qzsgTog: cc.Toggle,
        lzsgTog: cc.Toggle,
        sgzzTog: cc.Toggle,
        pdzzTog: cc.Toggle,
        scoreTog1: cc.Toggle,
        scoreTog2: cc.Toggle,
        scoreTog3: cc.Toggle,
        scoreTog4: cc.Toggle,
        scoreTog5: cc.Toggle,
        scoreTog6: cc.Toggle,
        maxPourScoreEdit: cc.EditBox,
        cuopaiTog: cc.Toggle,
        tuoguanTog: cc.Toggle,
        jinrenTog: cc.Toggle,
        guanzhanTog: cc.Toggle,
        lastLimitTog: cc.Toggle,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 10,
            minPlayerCount: 2,
            maxPlayerCount: 6,
            gameType: Enums.bundleType.SG,
            gameFrameType: Def_Sg.gameType.QIANGZHUANG,
            sendCardType: Def_Sg.sendCardType.QUANAN,
            scaleType: Def_Sg.scaleType.LITTLE,
            canPourScores: [10, 20, 50, 100],
            canPourScoresIndex: 1,
            canTrust: false,
            trustTm: 9999,
            canEnter: false,
            cuopai: false,
            canWatch: false,
            yuyin: false,
            baseScore: 1,
            maxCanPourGold: 100,
            ziyouju: false,
            fangzuobi: false,
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
        } else if (this.gameRule.maxPlayerCount == 10) {
            this.renshuTog10.isChecked = true;
        } else {
            this.renshuTog6.isChecked = true;
        }
        /* 玩法 */
        if (this.gameRule.sendCardType == Def_Sg.sendCardType.MING2AN1) {
            this.m2a1Tog.isChecked = true;
        } else if (this.gameRule.sendCardType == Def_Sg.sendCardType.MING1AN2) {
            this.m1a2Tog.isChecked = true;
        } else {
            this.quananTog.isChecked = true;
        }
        /* 模式 */
        if (this.gameRule.gameFrameType == Def_Sg.gameType.DACHIXIAOZHUANG) {
            this.dcxTog.isChecked = true;
            this.gameRule.scaleType = Def_Sg.scaleType.LITTLE;
        } else if (this.gameRule.gameFrameType == Def_Sg.gameType.BAWANGZHUANG) {
            this.bwzTog.isChecked = true;
        } else if (this.gameRule.gameFrameType == Def_Sg.gameType.LUNZHUANG) {
            this.lzsgTog.isChecked = true;
        } else if (this.gameRule.gameFrameType == Def_Sg.gameType.SANGONGZHUANG) {
            this.sgzzTog.isChecked = true;
        } else if (this.gameRule.gameFrameType == Def_Sg.gameType.PAIDAZHUANG) {
            this.pdzzTog.isChecked = true;
        } else {
            this.qzsgTog.isChecked = true;
        }
        /* 翻倍 */
        if (this.gameRule.scaleType == Def_Sg.scaleType.BIG) {
            this.fanbeiTog.isChecked = true;
        } else {
            this.pingbeiTog.isChecked = true;
        }
        /* 下注分 */
        if (this.gameRule.canPourScoresIndex == 2) {
            this.scoreTog2.isChecked = true;
        } else if (this.gameRule.canPourScoresIndex == 3) {
            this.scoreTog3.isChecked = true;
        } else if (this.gameRule.canPourScoresIndex == 4) {
            this.scoreTog4.isChecked = true;
        } else if (this.gameRule.canPourScoresIndex == 5) {
            this.scoreTog5.isChecked = true;
        } else if (this.gameRule.canPourScoresIndex == 6) {
            this.scoreTog6.isChecked = true;
        } else {
            this.scoreTog1.isChecked = true;
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        this.maxPourScoreEdit.string = "" + this.gameRule.maxCanPourGold;
        /* 高级 */
        this.cuopaiTog.isChecked = this.gameRule.cuopai;
        this.tuoguanTog.isChecked = this.gameRule.canTrust;
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
        /**输赢统计 */
        /**防作弊 */
    },

    updateCost() {
        let gameRule = this.gameRule;
        let bureau = gameRule.bureau;
        let diamondCount;
        if (bureau === 10) {
            diamondCount = 2;
        } else if (bureau === 20) {
            diamondCount = 3;
        } else {
            diamondCount = 4;
        }
        this.gameRule.payDiamond = diamondCount;
        // this.diamondCount.string = diamondCount;
    },

    onButtonClick(event, param) {
        if (param.indexOf('bureau') != -1) {
            this.gameRule.bureau = parseInt(param.split('_')[1]);
            this.updateCost();
        } else if (param.indexOf('member') != -1) {
            this.gameRule.maxPlayerCount = parseInt(param.slice(6));
            this.updateCost();
        } else if (['BIG', 'LITTLE'].indexOf(param) != -1) {
            if (this.gameRule.gameFrameType == Def_Sg.gameType.DACHIXIAOZHUANG) {
                this.pingbeiTog.isChecked = true;
                this.gameRule.scaleType = Def_Sg.scaleType.LITTLE;
            } else {
                this.gameRule.scaleType = Def_Sg.scaleType[param];
            }
        } else if (Def_Sg.gameTypeMode.indexOf(param) != -1) {
            if (Def_Sg.gameType[param] == Def_Sg.gameType.DACHIXIAOZHUANG) {
                this.pingbeiTog.isChecked = true;
                this.gameRule.scaleType = Def_Sg.scaleType.LITTLE;
            }
            this.gameRule.gameFrameType = Def_Sg.gameType[param];
        } else if (['QUANAN', 'MING1AN2', 'MING2AN1'].indexOf(param) != -1) {
            this.gameRule.sendCardType = Def_Sg.sendCardType[param];
        } else if (param.indexOf('/') != -1) {
            let array = param.split('/');
            for (let i = 0; i < array.length; ++i) {
                array[i] = parseInt(array[i]);
            }
            if (array[0] == 10) {
                this.gameRule.canPourScoresIndex = 1;
            } else if (array[0] == 20) {
                this.gameRule.canPourScoresIndex = 2;
            } else if (array[0] == 50) {
                this.gameRule.canPourScoresIndex = 3;
            } else if (array[0] == 100) {
                this.gameRule.canPourScoresIndex = 4;
            } else if (array[0] == 500) {
                this.gameRule.canPourScoresIndex = 5;
            } else if (array[0] == 3000) {
                this.gameRule.canPourScoresIndex = 6;
            }
            this.gameRule.canPourScores = array;
            this.gameRule.maxCanPourGold = array[3];
            this.maxPourScoreEdit.string = "" + array[3];
        } else if (param == 'cuopai') {
            this.gameRule.cuopai = event.isChecked;
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
        } else if (param == 'tuoguan') {
            this.gameRule.canTrust = event.isChecked;
        } else if (param == 'yuyin') {
            this.gameRule.yuyin = event.isChecked;
        } else if (param == 'editbox') {
            let num = parseInt(this.maxPourScoreEdit.string);
            if (isNaN(num) || num <= 0) {
                AssetsManager.tipDialog("输入格式不正确！");
                this.maxPourScoreEdit.string = "" + this.gameRule.canPourScores[3];
            } else if (num < this.gameRule.canPourScores[3]) {
                AssetsManager.tipDialog("上限必须不小于" + this.gameRule.canPourScores[3] + "!");
                this.maxPourScoreEdit.string = "" + this.gameRule.canPourScores[3];
            } else {
                this.gameRule.maxCanPourGold = num;
            }
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param == 'fangzuobi') {
            this.gameRule.fangzuobi = event.isChecked;
        } else if (param == "tongji") { //输赢统计显示
            this.gameRule.tongji = event.isChecked
        } else if (param == "location") { //防作弊 服务器判断
            this.gameRule.showGps = event.isChecked
        }
        // console.log('this.gameRule', this.gameRule);
        ConfigModel.setRoomCreateCache(this.gameRule);
    },

    getRule() {
        return this.gameRule;
    }

});