const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const CCUtil = require('../../utils/CCUtil');
const Utils = require("../../utils/Utils");

cc.Class({
    extends: cc.Component,

    properties: {
        fangfeiPannel: cc.Node,
        hostPayTog: cc.Toggle,
        aaPayTog: cc.Toggle,
        winPayTog: cc.Toggle,
        jushuTog6: cc.Toggle,
        jushuTog10: cc.Toggle,
        jushuTog15: cc.Toggle,
        jushuTog20: cc.Toggle,
        renshuTog6: cc.Toggle,
        renshuTog8: cc.Toggle,
        renshuTog10: cc.Toggle,
        lunshuTog10: cc.Toggle,
        lunshuTog20: cc.Toggle,
        lunshuTog30: cc.Toggle,
        lunshuTog40: cc.Toggle,
        compareRoundTog0: cc.Toggle,
        menTog0: cc.Toggle,
        btn_add: cc.Button,
        btn_sub: cc.Button,
        btn_biadd: cc.Button,
        btn_bisub: cc.Button,
        txt_men: cc.Label,
        txt_bi: cc.Label,
        difenEdit: cc.EditBox,
        cuopaiTog: cc.Toggle,
        jinrenTog: cc.Toggle,
        guanzhanTog: cc.Toggle,
        tuoGuanTog: cc.Toggle,
        A23Tog: cc.Toggle,
        shunZiBigTog: cc.Toggle,
        tongTog0: cc.Toggle,
        tongTog1: cc.Toggle,
        fengdingTog10: cc.Toggle,
        fengdingTog20: cc.Toggle,
        baozi235Tog: cc.Toggle,
        bpDoubleTog: cc.Toggle,
        pourTickTog10: cc.Toggle,
        pourTickTog20: cc.Toggle,
        lastLimitTog: cc.Toggle,
        baoZiXiQianTog: cc.Toggle,
        baoZiXiQianEdit: cc.EditBox,
        shunJinXiQianTog: cc.Toggle,
        shunJinXiQianEdit: cc.EditBox,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 6,
            minPlayerCount: 2,
            maxPlayerCount: 6,
            gameType: Enums.bundleType.SZ,
            gameFrameType: 0,
            roundType: 10,
            fangzuobi: false,
            addScores: [1],
            maxScore: 10,
            canTrust: false,
            trustTm: 9999,
            canEnter: false,
            cuopai: false,
            canWatch: false,
            yuyin: false,
            baseScore: 1,
            compareRound: 0, //比牌轮数
            shunZiBig: false, //顺子大于同花
            /* 自由局 */
            ziyouju: false,
            isA23Big: false,
            isLooKLose: false,
            is235Big: false,
            isCompareDouble: false,
            pourTick: 10,
            /**输赢统计 */
            tongji: false,
            showGps: false,
            lastThreeJoin: false,
            shunJinAward: 0,
            baoZiAward: 0
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
        if (this.gameRule.bureau == 10) {
            this.jushuTog10.isChecked = true;
        } else if (this.gameRule.bureau == 15) {
            this.jushuTog15.isChecked = true;
        } else if (this.gameRule.bureau == 20) {
            this.jushuTog20.isChecked = true;
        } else {
            this.jushuTog6.isChecked = true;
        }
        /* 人数 */
        if (this.gameRule.maxPlayerCount == 8) {
            this.renshuTog8.isChecked = true;
        } else if (this.gameRule.maxPlayerCount == 10) {
            this.renshuTog10.isChecked = true;
        } else {
            this.renshuTog6.isChecked = true;
        }
        /* 轮数 */
        if (this.gameRule.roundType == 20) {
            this.lunshuTog20.isChecked = true;
        } else if (this.gameRule.roundType == 30) {
            this.lunshuTog30.isChecked = true;
        } else if (this.gameRule.roundType == 40) {
            this.lunshuTog40.isChecked = true;
        } else {
            this.lunshuTog10.isChecked = true;
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        /**比牌 */
        this.compareRoundTog0.isChecked = this.gameRule.compareRound > 0
        this.btn_biadd.interactable = this.compareRoundTog0.isChecked;
        this.btn_bisub.interactable = this.compareRoundTog0.isChecked;
        CCUtil.setGrayShader(this.btn_biadd.node, !this.btn_biadd.interactable);
        CCUtil.setGrayShader(this.btn_bisub.node, !this.btn_bisub.interactable);
        this.txt_bi.string = this.gameRule.compareRound || 0;

        /* 玩法 */
        this.menTog0.isChecked = this.gameRule.gameFrameType > 0
        this.btn_add.interactable = this.menTog0.isChecked;
        CCUtil.setGrayShader(this.btn_add.node, !this.btn_add.interactable);
        this.btn_sub.interactable = this.menTog0.isChecked;
        CCUtil.setGrayShader(this.btn_sub.node, !this.btn_sub.interactable);
        this.txt_men.string = this.gameRule.gameFrameType

        this.A23Tog.isChecked = this.gameRule.isA23Big;
        this.shunZiBigTog.isChecked = this.gameRule.shunZiBig;
        this.baozi235Tog.isChecked = this.gameRule.is235Big;
        this.bpDoubleTog.isChecked = this.gameRule.isCompareDouble;
        /**同牌 */
        if (this.gameRule.isLooKLose) {
            this.tongTog1.isChecked = true
        } else {
            this.tongTog0.isChecked = true
        }
        if (this.gameRule.maxScore == 20) {
            this.fengdingTog20.isChecked = true;
        } else {
            this.fengdingTog10.isChecked = true;
        }
        if (this.gameRule.pourTick == 20) {
            this.pourTickTog20.isChecked = true;
        } else {
            this.pourTickTog10.isChecked = true;
        }
        /* 高级 */
        this.cuopaiTog.isChecked = this.gameRule.cuopai;
        this.tuoGuanTog.isChecked = !!this.gameRule.canTrust;
        if (this.gameRule.shunJinAward > 0) {
            this.shunJinXiQianTog.isChecked = true;
            this.shunJinXiQianEdit.node.active = true;
            this.shunJinXiQianEdit.string = this.gameRule.shunJinAward;
        } else {
            this.shunJinXiQianEdit.node.active = false;
            this.shunJinXiQianTog.isChecked = false;
            this.shunJinXiQianEdit.string = '';
        }
        if (this.gameRule.baoZiAward > 0) {
            this.baoZiXiQianTog.isChecked = true;
            this.baoZiXiQianEdit.node.active = true;
            this.baoZiXiQianEdit.string = this.gameRule.baoZiAward;
        } else {
            this.baoZiXiQianEdit.node.active = false;
            this.baoZiXiQianTog.isChecked = false;
            this.baoZiXiQianEdit.string = '';
        }
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
        let bureau = this.gameRule.bureau;
        let diamondCount = 2;
        if (bureau === 6) {
            diamondCount = 2;
        } else if (bureau === 10) {
            diamondCount = 3;
        } else if (bureau === 15) {
            diamondCount = 4;
        } else if (bureau === 20) {
            diamondCount = 5;
        }
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
        } else if (param.indexOf('member') != -1) {
            this.gameRule.maxPlayerCount = parseInt(param.slice(6));
            this.updateCost();
        } else if (param.indexOf('bettick') != -1) {
            this.gameRule.pourTick = parseInt(param.slice(7));
        } else if (param.indexOf('fengding') != -1) {
            this.gameRule.maxScore = parseInt(param.slice(8));
        } else if (param.indexOf('ROUND') != -1) {
            this.gameRule.roundType = parseInt(param.slice(5));
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
        } else if (param == "ismen") {
            this.btn_add.interactable = event.isChecked;
            this.btn_sub.interactable = event.isChecked;
            CCUtil.setGrayShader(this.btn_add.node, !this.btn_add.interactable);
            CCUtil.setGrayShader(this.btn_sub.node, !this.btn_sub.interactable);
            this.gameRule.gameFrameType = event.isChecked ? parseInt(this.txt_men.string) : 0
            if (event.isChecked && this.gameRule.gameFrameType == 0) {
                this.gameRule.gameFrameType = 1
                this.txt_men.string = "1"
            }
        } else if (param == "menadd") {
            this.gameRule.gameFrameType++
            if (this.gameRule.gameFrameType > 10) {
                this.gameRule.gameFrameType = 1
            }
            this.txt_men.string = this.gameRule.gameFrameType + ""
        } else if (param == "mensub") {
            this.gameRule.gameFrameType--
            if (this.gameRule.gameFrameType < 1) {
                this.gameRule.gameFrameType = 10
            }
            this.txt_men.string = this.gameRule.gameFrameType + ""
        } else if (param == 'yuyin') {
            this.gameRule.yuyin = event.isChecked;
        } else if (param == 'fangzuobi') {
            this.gameRule.fangzuobi = event.isChecked;
        } else if (param == 'difen') {
            this.onCheckRuleEditScore(this.gameRule, this.difenEdit, 1, 100, "baseScore")
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param == "A23") {
            this.gameRule.isA23Big = event.isChecked
        } else if (param == "235") {
            this.gameRule.is235Big = event.isChecked
        } else if (param == "bipaidouble") {
            this.gameRule.isCompareDouble = event.isChecked
        } else if (param.indexOf('TONG') != -1) {
            this.gameRule.isLooKLose = this.tongTog1.isChecked
        } else if (param == "tongji") { //输赢统计显示
            this.gameRule.tongji = event.isChecked
        } else if (param == "location") { //防作弊 服务器判断
            this.gameRule.showGps = event.isChecked
        } else if (param == "shunZiBig") {
            this.gameRule.shunZiBig = event.isChecked
        } else if (param == "isbipai") { //比牌轮数
            this.btn_biadd.interactable = event.isChecked;
            this.btn_bisub.interactable = event.isChecked;
            CCUtil.setGrayShader(this.btn_biadd.node, !this.btn_biadd.interactable);
            CCUtil.setGrayShader(this.btn_bisub.node, !this.btn_bisub.interactable);
            this.gameRule.compareRound = event.isChecked ? parseInt(this.txt_bi.string) : 0
            if (event.isChecked && this.gameRule.compareRound == 0) {
                this.gameRule.compareRound = 1
                this.txt_bi.string = "1"
            }
        } else if (param == "biadd") {
            this.gameRule.compareRound++
            if (this.gameRule.compareRound > 10) {
                this.gameRule.compareRound = 1
            }
            this.txt_bi.string = this.gameRule.compareRound + ""
        } else if (param == "bisub") {
            this.gameRule.compareRound--
            if (this.gameRule.compareRound < 1) {
                this.gameRule.compareRound = 10
            }
            this.txt_bi.string = this.gameRule.compareRound + ""
        } else if (param == "isbaozixiqian") {
            if (event.isChecked) {
                this.baoZiXiQianEdit.node.active = true;
                this.gameRule.baoZiAward = 1;
                this.baoZiXiQianEdit.string = '1';
            } else {
                this.baoZiXiQianEdit.node.active = false;
                this.gameRule.baoZiAward = 0;
                this.baoZiXiQianEdit.string = '';
            }
        } else if (param == 'baozixiqian') {
            let baoZiAward = this.baoZiXiQianEdit.string;
            if (baoZiAward.length == 0 ||
                isNaN(parseInt(baoZiAward)) ||
                parseInt(baoZiAward) <= 0 ||
                parseInt(baoZiAward) != parseFloat(baoZiAward)) {
                this.baoZiXiQianEdit.string = '1';
                this.gameRule.baoZiAward = 1;
                AssetsManager.tipDialog('请输入大于0的正整数！');
                return;
            }
            this.gameRule.baoZiAward = parseInt(baoZiAward);
        } else if (param == "isshujinxiqian") {
            if (event.isChecked) {
                this.shunJinXiQianEdit.node.active = true;
                this.gameRule.shunJinAward = 1;
                this.shunJinXiQianEdit.string = '1';
            } else {
                this.shunJinXiQianEdit.node.active = false;
                this.gameRule.shunJinAward = 0;
                this.shunJinXiQianEdit.string = '';
            }
        } else if (param == 'shunjinxiqian') {
            let shunJinAward = this.shunJinXiQianEdit.string;
            if (shunJinAward.length == 0 ||
                isNaN(parseInt(shunJinAward)) ||
                parseInt(shunJinAward) <= 0 ||
                parseInt(shunJinAward) != parseFloat(shunJinAward)) {
                this.gameRule.shunJinAward = 1;
                this.shunJinXiQianEdit.string = '1';
                AssetsManager.tipDialog('请输入大于0的正整数！');
                return;
            }
            this.gameRule.shunJinAward = parseInt(shunJinAward);
        }
        ConfigModel.setRoomCreateCache(this.gameRule);
    },

    getRule() {
        return this.gameRule;
    }

});