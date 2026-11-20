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
        jushuTog12: cc.Toggle,
        maxPourScoreTog100: cc.Toggle,
        maxPourScoreTog200: cc.Toggle,
        maxPourScoreTog300: cc.Toggle,
        maxPourScoreTog500: cc.Toggle,
        minPourScoreTog10: cc.Toggle,
        minPourScoreTog20: cc.Toggle,
        minPourScoreTog30: cc.Toggle,
        minPourScoreTog50: cc.Toggle,
        minPourScoreTog100: cc.Toggle,
        pourTickTog10: cc.Toggle,
        pourTickTog20: cc.Toggle,
        bankerTypeTog1: cc.Toggle,
        bankerTypeTog2: cc.Toggle,
        difenEdit: cc.EditBox,
        cuopaiTog: cc.Toggle,
        jinrenTog: cc.Toggle,
        lastLimitTog: cc.Toggle,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 20, //局数 
            minPlayerCount: 2, //最低人数
            maxPlayerCount: 5, //最大人数
            gameType: Enums.bundleType.JGTTZ,
            fangzuobi: false, //防作弊
            canTrust: false, //托管
            yuyin: false, //语音
            baseScore: 1, //底分 1-100
            ziyouju: false, //自由局
            showGps: false, //GPS定位
            pourTick: 10, //下注时间
            minPourScore: 10, //下注最小分
            maxPourScore: 100, //下注最大分
            bankerType: 1, //1轮庄 2抢庄
            cuopai: false, //搓牌
            wuBeiQieGuo: true,
            erBaGang: true,
            baseHighRate: true,
            canWatch: true,
            canEnter: false,
            lastThreeJoin: false,
            tongji: false
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
        if (this.gameRule.bureau == 30) {
            this.jushuTog12.isChecked = true;
        } else {
            this.jushuTog6.isChecked = true;
        }

        this.jinrenTog.isChecked = this.gameRule.canEnter;
        if (!!this.gameRule.canEnter) {
            this.lastLimitTog.interactable = true;
            this.lastLimitTog.isChecked = !!this.gameRule.lastThreeJoin;
        } else {
            this.lastLimitTog.interactable = false;
            this.lastLimitTog.isChecked = false;
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        CCUtil.setGrayShader(this.lastLimitTog.node, !this.lastLimitTog.interactable);
        /* 高级 */
        this.cuopaiTog.isChecked = this.gameRule.cuopai;

        /**锅底 */
        this[`maxPourScoreTog${this.gameRule.maxPourScore}`].isChecked = true

        /**下注 */
        this[`minPourScoreTog${this.gameRule.minPourScore}`].isChecked = true

        /**下注时间 */
        this[`pourTickTog${this.gameRule.pourTick}`].isChecked = true

        /**庄家模式 */
        this[`bankerTypeTog${this.gameRule.bankerType}`].isChecked = true

    },

    updateCost() {
        let bureau = this.gameRule.bureau;
        let diamondCount = 2;
        if (bureau === 6) {
            diamondCount = 1;
        }
        this.gameRule.payDiamond = diamondCount;
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
        } else if (param == 'fangzuobi') {
            this.gameRule.fangzuobi = event.isChecked;
        } else if (param == 'difen') {
            this.onCheckRuleEditScore(this.gameRule, this.difenEdit, 1, 100, "baseScore")
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param == "location") { //防作弊 服务器判断
            this.gameRule.showGps = event.isChecked
        } else if (param == "cuopai") { //防作弊 服务器判断
            this.gameRule.cuopai = event.isChecked
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
        } else if (param == "tongji") { //输赢统计显示
            this.gameRule.tongji = event.isChecked
        } else {
            let nameList = ["maxPourScore", "minPourScore", "pourTick", "bankerType"]
            for (let i = 0; i < nameList.length; i++) {
                const n = nameList[i];
                if (param.includes(n)) {
                    this.gameRule[n] = parseInt(param.slice(n.length))
                    break;
                }
            }
        }
        // console.log('加锅推筒子==', this.gameRule);
        ConfigModel.setRoomCreateCache(this.gameRule);
    },

    getRule() {
        return this.gameRule;
    }

});