const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const CCUtil = require('../../utils/CCUtil');
const Utils = require("../../utils/Utils");
const {
    Def_Sgbjh
} = require('../../const/Defines');

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
        m2a1Tog: cc.Toggle,
        m1a2Tog: cc.Toggle,
        quananTog: cc.Toggle,
        haveJokerTog0: cc.Toggle,
        haveJokerTog2: cc.Toggle,
        haveJokerTog3: cc.Toggle,
        haveJokerTog4: cc.Toggle,
        haveJokerTog5: cc.Toggle,
        haveJokerTog6: cc.Toggle,
        haveJokerTog7: cc.Toggle,
        rateTog1: cc.Toggle,
        rateTog2: cc.Toggle,
        rateTog3: cc.Toggle,
        difenEdit: cc.EditBox,
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
            gameType: Enums.bundleType.CJSJY,
            gameFrameType: Def_Sgbjh.gameType.QIANGZHUANG,
            sendCardType: -1,
            scaleType: Def_Sgbjh.scaleType.BIG,
            canPourScores: [1, 2, 4, 5],
            canTrust: false,
            trustTm: 15,
            canEnter: false,
            cuopai: false,
            canWatch: false,
            yuyin: false,
            baseScore: 1,
            maxCanPourGold: 4,
            fangzuobi: false,
            haveJoker: 0,
            /* 自由局 */
            ziyouju: false,
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
        this.gameRule.sendCardType = -1
        // if (this.gameRule.sendCardType == Def_Sgbjh.sendCardType.MING2AN1) {
        //     this.m2a1Tog.isChecked = true;
        // } else if (this.gameRule.sendCardType == Def_Sgbjh.sendCardType.MING1AN2) {
        //     this.m1a2Tog.isChecked = true;
        // } else {
        //     this.quananTog.isChecked = true;
        // }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        /**王癞子 */
        let haveJokerTog = this["haveJokerTog" + this.gameRule.haveJoker]
        if (haveJokerTog) {
            haveJokerTog.isChecked = true
        }
        /**底分 */
        this.difenEdit.string = this.gameRule.baseScore
        /* 下注倍数 */
        let list = ["", "1/2/4/5", "1/3/5/8", "2/4/6/10"]
        let str = this.gameRule.canPourScores.join("/")
        if (list.indexOf(str) == 2) {
            this.rateTog2.isChecked = true;
        } else if (list.indexOf(str) == 3) {
            this.rateTog3.isChecked = true;
        } else {
            this.rateTog1.isChecked = true;
        }
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

    onButtonClick(event, param) {
        if (param.indexOf('bureau') != -1) {
            this.gameRule.bureau = parseInt(param.split('_')[1]);
            this.updateCost();
        } else if (param.indexOf('member') != -1) {
            this.gameRule.maxPlayerCount = parseInt(param.slice(6));
            this.updateCost();
        } else if (['QUANAN', 'MING1AN2', 'MING2AN1'].indexOf(param) != -1) {
            this.gameRule.sendCardType = Def_Sgbjh.sendCardType[param];
        } else if (param.indexOf('/') != -1) {
            let array = param.split('/');
            for (let i = 0; i < array.length; ++i) {
                array[i] = parseInt(array[i]);
            }
            this.gameRule.canPourScores = array;
            this.gameRule.maxCanPourGold = array[array.length - 1];
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
        } else if (param == 'difen') {
            this.onCheckRuleEditScore(this.gameRule, this.difenEdit, 1, 100, "baseScore")
        } else if (param.indexOf('haveJoker') != -1) {
            this.gameRule.haveJoker = parseInt(param.slice(9));
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

    updateCost() {
        let bureau = this.gameRule.bureau;
        let diamondCount = bureau == 10 ? 2 : bureau == 20 ? 3 : 4;
        this.gameRule.payDiamond = diamondCount;
        // this.diamondCount.string = diamondCount;
    },

    getRule() {
        return this.gameRule;
    }

});