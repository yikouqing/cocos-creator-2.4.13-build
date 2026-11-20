const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const CCUtil = require('../../utils/CCUtil');
const Utils = require("../../utils/Utils");
const { Def_Lyc } = require('../../const/Defines');

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
        renshuTog6: cc.Toggle,
        renshuTog8: cc.Toggle,
        renshuTog10: cc.Toggle,
        difenEdit: cc.EditBox,
        zoushuiTog: cc.Toggle,
        mabaoTog: cc.Toggle,
        mabaoEditLay: cc.Node,
        mabaoEdit: cc.EditBox,
        robBankEdit: cc.EditBox,
        bihuaseTog: cc.Toggle,
        bushuyingTog: cc.Toggle,
        zhuangyingTog: cc.Toggle,
        bawangzhuangTog: cc.Toggle,
        suijizhuangTog: cc.Toggle,
        qiangzhuangTog: cc.Toggle,
        pokerCountTog1: cc.Toggle,
        pokerCountTog2: cc.Toggle,
        rateTog5: cc.Toggle,
        rateTog10: cc.Toggle,
        jinruTog: cc.Toggle,
        tuoGuanTog: cc.Toggle,
        guanzhanTog: cc.Toggle,
        basePourTypeTog1: cc.Toggle,
        basePourTypeTog2: cc.Toggle,
        basePourTypeTog3: cc.Toggle,
        playerExplodeCompareTog: cc.Toggle,
        manorMayPileTreasureTog: cc.Toggle,
        lastLimitTog: cc.Toggle,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 8,
            minPlayerCount: 2,
            maxPlayerCount: 6,
            gameType: Enums.bundleType.LYC,
            gameFrameType: Def_Lyc.gameFrameType.BAWANGZHUANG, //游戏模式
            sendCardType: 1,
            scaleType: 1,
            canPourScores: [10, 20, 50, 100],
            canTrust: false,
            trustTm: 9999,
            canEnter: false,
            cuopai: false,
            canWatch: false,
            yuyin: false,
            baseScore: 1,
            maxCanPourGold: 4,
            fangzuobi: false,
            ziyouju: false,
            rateType: Def_Lyc.rateType.ZOUSHUI, //玩法 码宝和走水
            drawType: Def_Lyc.drawType.COLORWIN, //平局规则
            maBaoCount: 0, //码宝次数 1-100
            pokerCount: 1, //几副扑克 1  2
            threeThreeRate: 0, //3张3的倍数  0 5 10
            robBankLimit: 300, //抢庄分
            /**输赢统计 */
            tongji: false,
            showGps: false,
            basePourType: 1, //压分 1,2,3
            playerExplodeCompare: true, //闲家炸开比牌
            manorMayPileTreasure: false, //庄家可以码宝
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
        /* 局数设置 */
        if (this.gameRule.bureau == 12) {
            this.jushuTog12.isChecked = true;
        } else if (this.gameRule.bureau == 16) {
            this.jushuTog16.isChecked = true;
        } else {
            this.jushuTog8.isChecked = true;
        }
        /* 人数 */
        if (this.gameRule.maxPlayerCount == 10) {
            this.renshuTog10.isChecked = true;
        } else if (this.gameRule.maxPlayerCount == 8) {
            this.renshuTog8.isChecked = true;
        } else {
            this.renshuTog6.isChecked = true;
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        /**底分 */
        this.difenEdit.string = this.gameRule.baseScore;
        /**码宝 */
        this.mabaoEdit.string = this.gameRule.maBaoCount;
        /**抢庄分 */
        this.gameRule.robBankLimit = this.gameRule.robBankLimit || 300
        this.robBankEdit.string = this.gameRule.robBankLimit;
        this.tuoGuanTog.isChecked = this.gameRule.canTrust;
        /* 玩法设置 */
        let mabaoType = this.gameRule.rateType == Def_Lyc.rateType.ZOUSHUI ? 1 : 2;
        if (mabaoType == 1) {
            this.zoushuiTog.isChecked = true;
        } else {
            this.mabaoTog.isChecked = true;
        }
        this.mabaoEditLay.active = (this.gameRule.rateType === Def_Lyc.rateType.MABAO || this.gameRule.manorMayPileTreasure)
        /**平局设置 */
        if (this.gameRule.drawType == Def_Lyc.drawType.NONEWIN) {
            this.bushuyingTog.isChecked = true;
        } else if (this.gameRule.drawType == Def_Lyc.drawType.BANKERWIN) {
            this.zhuangyingTog.isChecked = true;
        } else {
            this.bihuaseTog.isChecked = true;
        }

        /**模式设置 */
        if (this.gameRule.gameFrameType == Def_Lyc.gameFrameType.SUIJIZHUANG) {
            this.suijizhuangTog.isChecked = true;
        } else if (this.gameRule.gameFrameType == Def_Lyc.gameFrameType.BAWANGZHUANG) {
            this.bawangzhuangTog.isChecked = true;
        } else {
            this.qiangzhuangTog.isChecked = true;
        }
        /**几副牌 */
        if (this.gameRule.pokerCount == 2) {
            this.pokerCountTog2.isChecked = true;
        } else {
            this.pokerCountTog1.isChecked = true;
        }
        /**333倍数 */
        // if (this.gameRule.threeThreeRate == 5) {
        //     this.rateTog5.isChecked = true;
        // } else {
        //     this.rateTog10.isChecked = true;
        // }
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
        /**输赢统计 */

        /**防作弊 */

        /**压分 */
        let tog = this[`basePourTypeTog${this.gameRule.basePourType}`]
        if (tog) {
            tog.isChecked = true
        }

        // /**闲家炸开比牌 */
        // this.playerExplodeCompareTog.isChecked = this.gameRule.playerExplodeCompare

        if (this.gameRule.gameFrameType !== Def_Lyc.gameFrameType.BAWANGZHUANG) {
            /**庄家马宝 */
            this.manorMayPileTreasureTog.isChecked = this.gameRule.manorMayPileTreasure
            this.manorMayPileTreasureTog.node.active = this.mabaoTog.isChecked
        } else {
            this.manorMayPileTreasureTog.node.active = false
        }
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
        var r = /^\+?[1-9][0-9]*|0$/ //非0的正整数
        if (!r.test(editBox.string) || score > max || score < min) {
            editBox.string = '';
            AssetsManager.tipDialog(`输入错误,请输入${min}-${max}的整数!`);
            return
        }
        gameRule[ruleTypeStr] = score;
    },

    onButtonClick(event, param) {
        if (param.indexOf('bureau') != -1) {
            //局数
            this.gameRule.bureau = parseInt(param.split('_')[1]);
            this.updateCost();
        } else if (param.indexOf('member') != -1) {
            //人数
            this.gameRule.maxPlayerCount = parseInt(param.slice(6));
        } else if (param == 'difen') {
            //底分
            this.onCheckRuleEditScore(this.gameRule, this.difenEdit, 1, 900, "baseScore")
        } else if (param == 'mabao') {
            //码宝次数
            this.onCheckRuleEditScore(this.gameRule, this.mabaoEdit, 0, 100, "maBaoCount")
        } else if (['ZOUSHUI', 'MABAO'].indexOf(param) != -1) {
            //玩法
            this.gameRule.rateType = Def_Lyc.rateType[param];
            this.mabaoEditLay.active = this.gameRule.rateType === Def_Lyc.rateType.MABAO;
            this.manorMayPileTreasureTog.node.active = (this.mabaoTog.isChecked && this.gameRule.gameFrameType != Def_Lyc.gameFrameType.BAWANGZHUANG)
            if (!this.manorMayPileTreasureTog.node.active) {
                this.gameRule.manorMayPileTreasure = false
                this.manorMayPileTreasureTog.isChecked = false
            }
        } else if (['COLORWIN', 'NONEWIN', 'BANKERWIN'].indexOf(param) != -1) {
            /**平局规则 */
            this.gameRule.drawType = Def_Lyc.drawType[param];
        } else if (['BAWANGZHUANG', 'SUIJIZHUANG', 'QIANGZHUANG'].indexOf(param) != -1) {
            this.gameRule.gameFrameType = param == 'BAWANGZHUANG' ? 3 : param == 'SUIJIZHUANG' ? 2 : 1;
            this.manorMayPileTreasureTog.node.active = (this.mabaoTog.isChecked && this.gameRule.gameFrameType != Def_Lyc.gameFrameType.BAWANGZHUANG)
            if (!this.manorMayPileTreasureTog.node.active) {
                this.gameRule.manorMayPileTreasure = false
                this.manorMayPileTreasureTog.isChecked = false
            }
        } else if (['ONEDECK', 'TWODECKS'].indexOf(param) != -1) {
            /**几副牌 */
            this.gameRule.pokerCount = Def_Lyc.pokerCount[param]
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
        } else if (param == "tongji") { //输赢统计显示
            this.gameRule.tongji = event.isChecked
        } else if (param == "location") { //防作弊 服务器判断
            this.gameRule.showGps = event.isChecked
        } else if (param.includes("basePourType")) {
            this.gameRule.basePourType = parseInt(param.slice(12))
        } else if (param == "banklimit") {
            this.onCheckRuleEditScore(this.gameRule, this.robBankEdit, 1, 1000, "robBankLimit")
        } else if (param == "mbcsHelp") {
            AssetsManager.popDialog({
                content: `输入0表示码宝次数无限制`,
                ok: () => { }
            });
        } else if (param == "tuoguan") { //输赢统计显示
            this.gameRule.canTrust = event.isChecked;
        } else {
            let rules = ["playerExplodeCompare", "manorMayPileTreasure"]
            if (rules.includes(param)) {
                // console.log("param=", param, event.isChecked)
                this.gameRule[param] = event.isChecked
                this.mabaoEditLay.active = (this.gameRule.rateType === Def_Lyc.rateType.MABAO || this.gameRule.manorMayPileTreasure)
            }
        }
        // console.log('规则-捞腌菜==', this.gameRule);
        ConfigModel.setRoomCreateCache(this.gameRule);
    },


    getRule() {
        return this.gameRule;
    }

});