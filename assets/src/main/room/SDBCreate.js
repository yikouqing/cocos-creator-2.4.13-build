const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const CCUtil = require('../../utils/CCUtil');
const Utils = require("../../utils/Utils");
const { Def_Sdb } = require('../../const/Defines');

cc.Class({
    extends: cc.Component,

    properties: {
        fangfeiPannel: cc.Node,
        hostPayTog: cc.Toggle,
        aaPayTog: cc.Toggle,
        winPayTog: cc.Toggle,
        jushuTog10: cc.Toggle,
        jushuTog20: cc.Toggle,
        renshuTog6: cc.Toggle,
        renshuTog8: cc.Toggle,
        renshuTog10: cc.Toggle,
        difenEdit: cc.EditBox,
        bawangzhuangTog: cc.Toggle,
        suijizhuangTog: cc.Toggle,
        qiangzhuangTog: cc.Toggle,
        tianwangTog: cc.Toggle,
        renwuxiaoTog: cc.Toggle,
        wuxiaoTog: cc.Toggle,
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
            gameType: Enums.bundleType.SDB,
            gameFrameType: Def_Sdb.gameFrameType.BAWANGZHUANG, //游戏模式
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
            rateType: Def_Sdb.rateType.TWO, //玩法 2倍和3倍
            huaWuXiaoRate: false,
            tianWangRate: false,
            wuXiaoRate: false,
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
        /* 局数设置 */
        if (this.gameRule.bureau == 20) {
            this.jushuTog20.isChecked = true;
        } else {
            this.jushuTog20.isChecked = false;
        }
        /* 人数 */
        if (this.gameRule.maxPlayerCount === 8) {
            this.renshuTog8.isChecked = true;
        } else if (this.gameRule.maxPlayerCount === 10) {
            this.renshuTog10.isChecked = true;
        } else {
            this.renshuTog6.isChecked = true;
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        /**底分 */
        this.difenEdit.string = this.gameRule.baseScore;
        /* 玩法设置 */
        this.tianwangTog.isChecked = this.gameRule.tianWangRate;
        this.renwuxiaoTog.isChecked = this.gameRule.huaWuXiaoRate;
        this.wuxiaoTog.isChecked = this.gameRule.wuXiaoRate;
        this.tuoGuanTog.isChecked = this.gameRule.canTrust;
        /**模式设置 */
        if (this.gameRule.gameFrameType == Def_Sdb.gameFrameType.SUIJIZHUANG) {
            this.suijizhuangTog.isChecked = true;
        } else if (this.gameRule.gameFrameType == Def_Sdb.gameFrameType.BAWANGZHUANG) {
            this.bawangzhuangTog.isChecked = true;
        } else {
            this.qiangzhuangTog.isChecked = true;
        }
        /**高级 */
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
        let diamondCount = bureau == 10 ? 2 : 3;
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
            //局数
            this.gameRule.bureau = parseInt(param.split('_')[1]);
            this.updateCost();
        } else if (param.indexOf('member') != -1) {
            //人数
            this.gameRule.maxPlayerCount = parseInt(param.slice(6));
        } else if (param == 'difen') {
            //底分
            this.onCheckRuleEditScore(this.gameRule, this.difenEdit, 1, 200, "baseScore")
        } else if (['TWO', 'THREE'].indexOf(param) != -1) {
            //玩法
            this.gameRule.rateType = Def_Sdb.rateType[param];
        } else if (['BAWANGZHUANG', 'SUIJIZHUANG', 'QIANGZHUANG'].indexOf(param) != -1) {
            /**模式 */
            this.gameRule.gameFrameType = Def_Sdb.gameFrameType[param];
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
        } else if (param == 'yuyin') {
            this.gameRule.yuyin = event.isChecked;
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param == 'fangzuobi') {
            this.gameRule.fangzuobi = event.isChecked;
        } else if (param == 'tuoguan') {
            this.gameRule.canTrust = event.isChecked;
        } else if (param == 'tianwang') {
            this.gameRule.tianWangRate = event.isChecked;
        } else if (param == 'renwuxiao') {
            this.gameRule.huaWuXiaoRate = event.isChecked;
        } else if (param == 'wuxiao') {
            this.gameRule.wuXiaoRate = event.isChecked;
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