const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const Utils = require("../../utils/Utils");
const { Def_Hz } = require('../../const/Defines');

cc.Class({
    extends: cc.Component,

    properties: {
        fangfeiPannel: cc.Node,
        hostPayTog: cc.Toggle,
        aaPayTog: cc.Toggle,
        winPayTog: cc.Toggle,
        jushuTog8: cc.Toggle,
        jushuTog16: cc.Toggle,
        renshuTog2: cc.Toggle,
        renshuTog3: cc.Toggle,
        renshuTog4: cc.Toggle,
        hongzhongTog4: cc.Toggle,
        hongzhongTog8: cc.Toggle,
        zhamaTog2: cc.Toggle,
        zhamaTog4: cc.Toggle,
        zhamaTog6: cc.Toggle,
        zhamaTog8: cc.Toggle,
        zhamaTogAll: cc.Toggle,
        tuoguanTog0: cc.Toggle,
        tuoguanTog30: cc.Toggle,
        tuoguanTog60: cc.Toggle,
        tuoguanTog120: cc.Toggle,
        qiduiTog: cc.Toggle,
        chunniunaiTog: cc.Toggle,
        difenEdit: cc.EditBox,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 8,
            minPlayerCount: 4,
            maxPlayerCount: 4,
            gameType: Enums.bundleType.HZ,
            gameFrameType: Def_Hz.gameType.HONGZHONG4,
            ma: 2,
            canTrust: false,
            trustTm: 0,
            /* 托管时间 */
            canEnter: false,
            yuyin: false,
            baseScore: 1,
            qidui: false,
            chunniunai: false,
            ziyouju: false,
            fangzuobi: false,
            /**输赢统计 */
            tongji: false,
            showGps: false,
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
        this.gameRule.canEnter = false;
        if (this.gameRule.bureau == 16) {
            this.jushuTog16.isChecked = true;
        } else {
            this.jushuTog8.isChecked = true;
        }
        /* 人数 */
        if (this.gameRule.maxPlayerCount == 3) {
            this.renshuTog3.isChecked = true;
        } else if (this.gameRule.maxPlayerCount == 4) {
            this.renshuTog4.isChecked = true;
        } else {
            this.renshuTog2.isChecked = true;
        }
        /* 玩法 */
        if (this.gameRule.gameFrameType == Def_Hz.gameType.HONGZHONG8) {
            this.hongzhongTog8.isChecked = true;
        } else {
            this.hongzhongTog4.isChecked = true;
        }
        /* 扎马 */
        if (this.gameRule.ma == 4) {
            this.zhamaTog4.isChecked = true;
        } else if (this.gameRule.ma == 6) {
            this.zhamaTog6.isChecked = true;
        } else if (this.gameRule.ma == 8) {
            this.zhamaTog8.isChecked = true;
        } else if (this.gameRule.ma == 1) {
            this.zhamaTogAll.isChecked = true;
        } else {
            this.zhamaTog2.isChecked = true;
        }
        /* 托管 */
        if (this.gameRule.trustTm == 30) {
            this.tuoguanTog30.isChecked = true;
        } else if (this.gameRule.trustTm == 60) {
            this.tuoguanTog60.isChecked = true;
        } else if (this.gameRule.trustTm == 120) {
            this.tuoguanTog120.isChecked = true;
        } else {
            this.tuoguanTog0.isChecked = true;
        }
        /* 高级 */
        if (this.gameRule.qidui) {
            this.qiduiTog.isChecked = true;
        }
        if (this.gameRule.chunniunai) {
            this.chunniunaiTog.isChecked = true;
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
    },

    updateCost() {
        let bureau = this.gameRule.bureau;
        this.gameRule.canEnter = false;
        let diamondCount = 2;
        if (bureau === 16) {
            diamondCount = 4;
            this.gameRule.canEnter = false;
        } else {
            diamondCount = 2;
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
        } else if (param == 'hongzhong4') {
            this.gameRule.gameFrameType = Def_Hz.gameType.HONGZHONG4;
        } else if (param == 'hongzhong8') {
            this.gameRule.gameFrameType = Def_Hz.gameType.HONGZHONG8;
        } else if (param.indexOf('ma') != -1) {
            this.gameRule.ma = parseInt(param.slice(2));
        } else if (['tuo_30', 'tuo_60', 'tuo_120'].indexOf(param) != -1) {
            this.gameRule.canTrust = true;
            this.gameRule.trustTm = parseInt(param.slice(4));
        } else if (param == 'tuo_0') {
            this.gameRule.canTrust = false;
            this.gameRule.trustTm = 0;
        } else if (param == 'qidui') {
            this.gameRule.qidui = event.isChecked;
        } else if (param == 'chunniunai') {
            this.gameRule.chunniunai = event.isChecked;
        } else if (param == 'difen') {
            this.onCheckRuleEditScore(this.gameRule, this.difenEdit, 1, 100, "baseScore")
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param == 'fangzuobi') {
            this.gameRule.fangzuobi = event.isChecked;
        } else if (param == "tongji") { //输赢统计显示
            this.gameRule.tongji = event.isChecked
        } else if (param == "location") { //防作弊 服务器判断
            this.gameRule.showGps = event.isChecked
        }
        ConfigModel.setRoomCreateCache(this.gameRule);
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

    getRule() {
        return this.gameRule;
    }

});