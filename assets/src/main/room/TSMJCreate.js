const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const Utils = require("../../utils/Utils");

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
        queyimenTog: cc.Toggle,
        zhaniaoTog0: cc.Toggle,
        zhaniaoTog2: cc.Toggle,
        zhaniaoTog4: cc.Toggle,
        zhaniaoTog6: cc.Toggle,
        zhaniaoTog8: cc.Toggle,
        zhaniaoTog10: cc.Toggle,
        difenEdit: cc.EditBox,
        tupguanTog0: cc.Toggle,
        tupguanTog30: cc.Toggle,
        tupguanTog60: cc.Toggle,
        tupguanTog90: cc.Toggle,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 8,
            maxPlayerCount: 4,
            minPlayerCount: 4,
            gameType: Enums.bundleType.TSMJ,
            trustTm: 0,
            canEnter: false,
            yuyin: false,
            wanfa: 3,
            baseScore: 1,
            fangzuobi: false,
            queYiMen: false,
            zhaNiao: 0,
            cardCount: 13, //牌数
            unReadyKick: 0, //10秒未准备踢出用户
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
        this.gameRule.canEnter = false;
        if (this.gameRule.bureau == 8) {
            this.jushuTog8.isChecked = true;
        } else if (this.gameRule.bureau == 16) {
            this.jushuTog16.isChecked = true;
        } else if (this.gameRule.bureau == 9999) {
            this.gameRule.canEnter = false;
        }
        // 人数
        if (this.gameRule.maxPlayerCount == 4) {
            this.renshuTog4.isChecked = true;
        } else if (this.gameRule.maxPlayerCount == 3) {
            this.renshuTog3.isChecked = true;
        } else {
            this.renshuTog2.isChecked = true;
        }

        /*玩法 */
        this.queyimenTog.isChecked = !!this.gameRule.queYiMen

        /**扎鸟 */
        let zn = this.gameRule.zhaNiao
        if (zn == 2) {
            this.zhaniaoTog2.isChecked = true
        } else if (zn == 4) {
            this.zhaniaoTog4.isChecked = true
        } else if (zn == 6) {
            this.zhaniaoTog6.isChecked = true
        } else if (zn == 8) {
            this.zhaniaoTog8.isChecked = true
        } else if (zn == 10) {
            this.zhaniaoTog10.isChecked = true
        } else {
            this.zhaniaoTog0.isChecked = true
        }

        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        /* 托管 */

        if (this.gameRule.trustTm == 30) {
            this.tupguanTog30.isChecked = true;
        } else if (this.gameRule.trustTm == 60) {
            this.tupguanTog60.isChecked = true;
        } else if (this.gameRule.trustTm == 90) {
            this.tupguanTog90.isChecked = true;
        } else {
            this.tupguanTog0.isChecked = true;
        }
    },

    updateCost() {
        let bureau = this.gameRule.bureau;
        this.gameRule.canEnter = false;
        let diamondCount = 1;
        if (bureau === 9999) {
            diamondCount = 1;
            this.gameRule.canEnter = false;
        } else if (bureau == 8) {
            diamondCount = 2;
        } else if (bureau == 16) {
            diamondCount = 4;
        }
        this.gameRule.payDiamond = diamondCount;
    },

    onButtonClick(event, param) {
        if (param.indexOf('bureau') != -1) {
            this.gameRule.bureau = parseInt(param.split('_')[1]);
            this.updateCost();
        } else if (param.indexOf('member') != -1) {
            this.gameRule.maxPlayerCount = parseInt(param.slice(6))
            this.gameRule.minPlayerCount = parseInt(param.slice(6))
            this.updateCost();
        } else if (param == 'yuyin') {
            this.gameRule.yuyin = event.isChecked;
        } else if (param.indexOf('zhaNiao') != -1) {
            this.gameRule.zhaNiao = parseInt(param.slice(7));
        } else if (param.indexOf('queYiMen') != -1) {
            this.gameRule.queYiMen = event.isChecked
        } else if (param == "difen") {
            this.onCheckRuleEditScore(this.gameRule, this.difenEdit, 1, 100, "baseScore")
        } else if (param == "weizhunbei") {
            this.gameRule.unReadyKick = event.isChecked ? 10 : 0
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param.indexOf('tuoguan') != -1) { //托管
            let tuoguan = parseInt(param.slice(7));
            this.gameRule.trustTm = tuoguan
        } else if (param == "tongji") { //输赢统计显示
            this.gameRule.tongji = event.isChecked
        } else if (param == "location") { //防作弊 服务器判断
            this.gameRule.showGps = event.isChecked
        }
        // console.log('创建规则_GAME_RULE', this.gameRule);
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