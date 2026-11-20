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
        jushuTog1: cc.Toggle,
        jushuTog2: cc.Toggle,
        jushuTog4: cc.Toggle,
        jushuTog8: cc.Toggle,
        jushuTog12: cc.Toggle,
        renshuTog2: cc.Toggle,
        renshuTog3: cc.Toggle,
        difenEdit: cc.EditBox,
        zhadanEdit: cc.EditBox,
        jingdianTog: cc.Toggle,
        zhang15Tog: cc.Toggle,
        xianshiTog: cc.Toggle,
        buxianshiTog: cc.Toggle,
        bichuTog: cc.Toggle,
        kebuchuTog: cc.Toggle,
        tuoguanTog0: cc.Toggle,
        tuoguanTog30: cc.Toggle,
        tuoguanTog60: cc.Toggle,
        tuoguanTog120: cc.Toggle,
        sidaierTog: cc.Toggle,
        sidaisanTog: cc.Toggle,
        sanABombTog: cc.Toggle,
        bukechaiTog: cc.Toggle,
        kechaiTog: cc.Toggle,
        hong10Tog: cc.Toggle,
        shoujuhei3Tog: cc.Toggle,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 8,
            minPlayerCount: 2,
            maxPlayerCount: 2,
            gameType: Enums.bundleType.PDK,
            cardCount: 16,
            /* GPS定位 */
            /* 显示牌数 */
            showCardsCount: true,
            /* 黑桃3必出 */
            heitao3: false,
            /* 必须3带2摆尾 */
            baiwei: false,
            /* 炸弹不可拆 */
            chaizhadan: false,
            /* 红桃10双倍 */
            hongtao10: false,
            /* 必须出牌 */
            bichu: true,
            /* 智能顺子 */
            zhinengshunzi: false,
            /* 能否托管 */
            canTrust: true,
            /* 托管时间 */
            trustTm: 30,
            canWatch: false,
            /* 四代二 */
            fourTakeTwo: false,
            /* 四代三 */
            fourTakeThree: false,
            /* 三A算炸 */
            a3Boom: false,
            /* 基础分 */
            baseScore: 1,
            /**炸弹分 */
            boomScore: 10,
            /* 自由局 */
            ziyouju: false,
            /**输赢统计 */
        };
        this.updateCost();
    },

    start() {
        // console.log('房费状态', !!this.node.nodeParams && !!this.node.nodeParams.isUnion)
        this.fangfeiPannel.active = !(!!this.node.nodeParams && !!this.node.nodeParams.isUnion);
        let gameRule = !!this.node.nodeParams ? this.node.nodeParams.gameRule : this.gameRule;
        if (!!gameRule) {
            this.gameRule = Object.assign(this.gameRule, gameRule);
        }
        this.init();
    },

    init() {
        /* 局数 */
        this.gameRule.canEnter = false;
        if (this.gameRule.bureau == 2) {
            this.jushuTog2.isChecked = true;
        } else if (this.gameRule.bureau == 4) {
            this.jushuTog4.isChecked = true;
        } else if (this.gameRule.bureau == 8) {
            this.jushuTog8.isChecked = true;
        } else if (this.gameRule.bureau == 12) {
            this.jushuTog12.isChecked = true;
        } else {
            this.jushuTog1.isChecked = true;
        }
        if (this.gameRule.bureau == 9999) {
            this.gameRule.canEnter = true;
        }

        /* 人数 */
        if (this.gameRule.maxPlayerCount == 3) {
            this.renshuTog3.isChecked = true;
        } else {
            this.renshuTog2.isChecked = true;
        }
        /* 玩法 */
        if (this.gameRule.cardCount == 15) {
            this.zhang15Tog.isChecked = true;
        } else {
            this.jingdianTog.isChecked = true;
        }
        /* 显示牌数 */
        if (!!this.gameRule.showCardsCount) {
            this.xianshiTog.isChecked = true;
        } else {
            this.buxianshiTog.isChecked = true;
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        /**底分 */
        this.difenEdit.string = this.gameRule.baseScore + ""
        /**炸弹分 */
        this.zhadanEdit.string = (this.gameRule.boomScore || 0) + ""
        /* 高级 托管 */
        if (!!this.gameRule.canTrust) {
            if (this.gameRule.trustTm == 30) {
                this.tuoguanTog30.isChecked = true;
            } else if (this.gameRule.trustTm == 60) {
                this.tuoguanTog60.isChecked = true;
            } else if (this.gameRule.trustTm == 120) {
                this.tuoguanTog120.isChecked = true;
            }
        } else {
            this.tuoguanTog0.isChecked = true;
        }
        this.shoujuhei3Tog.isChecked = this.gameRule.heitao3;
        this.hong10Tog.isChecked = this.gameRule.hongtao10;
        this.sidaierTog.isChecked = this.gameRule.fourTakeTwo;
        this.sidaisanTog.isChecked = this.gameRule.fourTakeThree;
        this.sanABombTog.isChecked = this.gameRule.a3Boom;
        this.bichuTog.isChecked = this.gameRule.bichu
        this.kebuchuTog.isChecked = !this.gameRule.bichu
        /**输赢统计 */
        /**防作弊 */
        /* 拆炸弹 */
        if (this.gameRule.chaizhadan) {
            this.kechaiTog.isChecked = true;
        } else {
            this.bukechaiTog.isChecked = true;
        }
    },

    updateCost() {
        let bureau = this.gameRule.bureau;
        let diamondCount = 1;
        if (bureau === 4) diamondCount = 1
        if (bureau === 8) diamondCount = 2
        if (bureau === 12) diamondCount = 3
        diamondCount = 1;
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
        if (!r.test(editBox.string) || score > max || score < min) {
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
            if (this.gameRule.bureau == 9999) {
                this.gameRule.ziyouju = true;
            }
        } else if (param.indexOf("cardCount") != -1) {
            this.gameRule.cardCount = parseInt(param.slice(9));
        } else if (param == 'xianshipai') {
            this.gameRule.showCardsCount = true;
        } else if (param == 'buxianshipai') {
            this.gameRule.showCardsCount = false;
        } else if (param == 'heitao3') {
            this.gameRule.heitao3 = event.isChecked;
        } else if (param == 'bubaiwei') {
            this.gameRule.baiwei = !!event.isChecked;
        } else if (param.indexOf('member') != -1) {
            this.gameRule.maxPlayerCount = parseInt(param.slice(6));
            this.gameRule.minPlayerCount = parseInt(param.slice(6));
        } else if (param == 'kechai') {
            this.gameRule.chaizhadan = true;
        } else if (param == 'bukechai') {
            this.gameRule.chaizhadan = false;
        } else if (param == 'hongtao10') {
            this.gameRule.hongtao10 = event.isChecked;
        } else if (param == 'bichu') {
            this.gameRule.bichu = true;
        } else if (param == 'bubichu') {
            this.gameRule.bichu = false;
        } else if (param == 'zhineng') {
            this.gameRule.zhinengshunzi = event.isChecked;
        } else if (param == 'butuoguan') {
            this.gameRule.canTrust = false;
            this.gameRule.trustTm = 0;
        } else if (['tuoguan30', 'tuoguan60', 'tuoguan120'].indexOf(param) != -1) {
            this.gameRule.canTrust = true;
            this.gameRule.trustTm = parseInt(param.slice(7));
        } else if (param == '4dai2') {
            this.gameRule.fourTakeTwo = event.isChecked;
        } else if (param == '4dai3') {
            this.gameRule.fourTakeThree = event.isChecked;
        } else if (param == '3Azha') {
            this.gameRule.a3Boom = event.isChecked;
        } else if (param == 'difen') {
            this.onCheckRuleEditScore(this.gameRule, this.difenEdit, 1, 100, "baseScore")
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param === 'ts_rule') {
            AssetsManager.popDialog({
                content: `最后一手牌:\n3张关3张\n3带1关3带1\n3带2关3带2\n`,
                ok: () => { }
            });
        } else if (param === "boomScore") {
            this.onCheckRuleEditScore(this.gameRule, this.zhadanEdit, 10, 100, "boomScore")
        }
        // console.log('跑得快=', this.gameRule);
        ConfigModel.setRoomCreateCache(this.gameRule);
    },

    onCheckDistanceEdit(key, editBox, min, max) {
        let score = parseInt(editBox.string);
        if (isNaN(score) || score > max || score < min) {
            editBox.string = '1';
            this.gameRule[key] = `1`;
            AssetsManager.tipDialog(`输入错误,请输入${min}-${max}的整数`);
            return
        }
        editBox.string = `${score}`;
        this.gameRule[key] = score;
    },

    getRule() {
        return this.gameRule;
    }

});