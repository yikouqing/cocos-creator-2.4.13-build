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
        renshuTog3: cc.Toggle,
        renshuTog4: cc.Toggle,
        paishuTog0: cc.Toggle,
        paishuTog1: cc.Toggle,
        waTog0: cc.Toggle,
        waTog1: cc.Toggle,
        waTog2: cc.Toggle,
        tWaTog0: cc.Toggle,
        tWaTog1: cc.Toggle,
        zhandanTog: cc.Toggle,
        rateTog: cc.Toggle,
        jipaiTog: cc.Toggle,
        difenEdit: cc.EditBox,
        tuoguanTog0: cc.Toggle,
        tuoguanTog10: cc.Toggle,
        tuoguanTog20: cc.Toggle,
        tuoguanTog30: cc.Toggle,
        tuoguanTog60: cc.Toggle,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 6, //局数 
            minPlayerCount: 3, //最低人数
            maxPlayerCount: 4, //最大人数
            gameType: Enums.bundleType.WK, //挖坑
            fangzuobi: false, //防作弊
            maxScore: 100000, //封顶
            canTrust: false, //托管
            yuyin: false, //语音
            baseScore: 1, //底分 1-100
            ziyouju: false, //自由局
            showGps: false, //GPS定位
            cardCount: 54, //牌张数
            waType: 0, //0-普通 1-无3挖 2-黑挖
            sanWaType: 0, //0-三个3二挖 1-三个3直挖
            isBomb: false, //带炸弹
            isCardRecorder: false, //记牌器
            isDoubleRate: false, //带加倍
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
        if (this.gameRule.maxPlayerCount == 4) {
            this.renshuTog4.isChecked = true;
            this.paishuTog1.interactable = false;
            this.gameRule.cardCount = 54;
        } else {
            this.paishuTog1.interactable = true;
            this.renshuTog3.isChecked = true;
        }
        CCUtil.setGrayShader(this.paishuTog1.node, !this.paishuTog1.interactable);

        /* 高级 */
        if (!!this.gameRule.canTrust) {
            if (this.gameRule.trustTm == 20) {
                this.tuoguanTog20.isChecked = true;
            } else if (this.gameRule.trustTm == 30) {
                this.tuoguanTog30.isChecked = true;
            } else if (this.gameRule.trustTm == 60) {
                this.tuoguanTog60.isChecked = true;
            } else {
                this.tuoguanTog10.isChecked = true;
            }
        } else {
            this.tuoguanTog0.isChecked = true;
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        //牌数
        if (this.gameRule.cardCount == 46) {
            this.paishuTog1.isChecked = true;
        } else {
            this.paishuTog0.isChecked = true;
        }

        //挖类型
        if (this.gameRule.waType == 1) {
            this.waTog1.isChecked = true;
        } else if (this.gameRule.waType == 2) {
            this.waTog2.isChecked = true;
        } else {
            this.waTog0.isChecked = true;
        }
        //三个三挖类型
        if (this.gameRule.sanWaType == 1) {
            this.tWaTog1.isChecked = true;
        } else {
            this.tWaTog0.isChecked = true;
        }
        this.zhandanTog.isChecked = !!this.gameRule.isBomb;
        this.rateTog.isChecked = !!this.gameRule.isDoubleRate;
        this.jipaiTog.isChecked = !!this.gameRule.isCardRecorder;
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
            if (this.gameRule.maxPlayerCount == 4) {
                this.gameRule.cardCount = 54;
                this.paishuTog0.isChecked = true;
                this.paishuTog1.interactable = false;
            } else {
                this.paishuTog1.interactable = true;
            }
            CCUtil.setGrayShader(this.paishuTog1.node, !this.paishuTog1.interactable);
            this.updateCost();
        } else if (param.indexOf('card') != -1) {
            this.gameRule.cardCount = parseInt(param.slice(4));
        } else if (param.indexOf('wa') != -1) {
            this.gameRule.waType = parseInt(param.slice(2));
        } else if (param.indexOf('sanwa') != -1) {
            this.gameRule.sanWaType = parseInt(param.slice(5));
        } else if (param == 'butuo') {
            this.gameRule.canTrust = false;
            this.gameRule.trustTm = 0;
        } else if (['tuoguan10', 'tuoguan20', 'tuoguan30', "tuoguan60"].indexOf(param) != -1) {
            this.gameRule.canTrust = true;
            this.gameRule.trustTm = parseInt(param.slice(7));
        } else if (param == 'daizhadan') {
            this.gameRule.isBomb = event.isChecked;
        } else if (param == 'daijibei') {
            this.gameRule.isDoubleRate = event.isChecked;
        } else if (param == 'jipaiqi') {
            this.gameRule.isCardRecorder = event.isChecked;
        } else if (param == 'yuyin') {
            this.gameRule.yuyin = event.isChecked;
        } else if (param == 'fangzuobi') {
            this.gameRule.fangzuobi = event.isChecked;
        } else if (param == 'difen') {
            this.onCheckRuleEditScore(this.gameRule, this.difenEdit, 1, 100, "baseScore")
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
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