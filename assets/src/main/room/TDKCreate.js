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
        jushuTog10: cc.Toggle,
        jushuTog20: cc.Toggle,
        renshuTog2: cc.Toggle,
        renshuTog3: cc.Toggle,
        renshuTog4: cc.Toggle,
        renshuTog5: cc.Toggle,
        quanYaTog30: cc.Toggle,
        quanYaTog60: cc.Toggle,
        quanYaEdit: cc.EditBox,
        difenEdit: cc.EditBox,
        guDingTog: cc.Toggle,
        quanKengTog9: cc.Toggle,
        quanKengTog5: cc.Toggle,
        quanKengTog2: cc.Toggle,
        daiWangTog: cc.Toggle,
        longHuTog: cc.Toggle,
        lanGuoTog: cc.Toggle,
        liangPaiTog: cc.Toggle,
        daiErTog: cc.Toggle,
        moTiTog: cc.Toggle,
        jinrenTog: cc.Toggle,
        guanzhanTog: cc.Toggle,
        lastLimitTog: cc.Toggle,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 8,
            minPlayerCount: 5,
            maxPlayerCount: 5,
            gameType: Enums.bundleType.TDK,
            canTrust: false,
            trustTm: 15,
            canEnter: false,
            canWatch: false,
            yuyin: false,
            baseScore: 1, //底分
            fangzuobi: false,
            showGps: false,
            sceneType: Enums.deviceOrientation.H, //h-横屏 v-竖屏
            tongji: false,
            cardBegin: 9, //全坑起点
            withJoker: false, //带王
            withTwo: false, //带2
            baoZi: false, //豹子
            allInRate: 30, //全押倍数
            fixBaseScore: false, //固定注
            endKick: false, //末踢
            endShowCards: false, //结束亮牌
            lanGuoDouble: false, //烂锅翻倍
            lastThreeJoin: false
        };
        this.updateCost();
    },

    start() {
        this.fangfeiPannel.active = !(!!this.node.nodeParams && !!this.node.nodeParams.isUnion); //自由场
        this.gameRule = !!this.node.nodeParams && !!this.node.nodeParams.gameRule ? this.node.nodeParams.gameRule : this.gameRule;
        this.init();
    },

    init() {
        /* 局数设置 */
        if (this.gameRule.bureau == 20) {
            this.jushuTog20.isChecked = true;
        } else {
            this.jushuTog10.isChecked = true;
        }
        if (this.gameRule.maxPlayerCount == 2) {
            this.renshuTog2.isChecked = true;
        } else if (this.gameRule.maxPlayerCount == 3) {
            this.renshuTog3.isChecked = true;
        } else if (this.gameRule.maxPlayerCount == 4) {
            this.renshuTog4.isChecked = true;
        } else {
            this.renshuTog5.isChecked = true;
        }
        if (this.gameRule.allInRate == 30) {
            this.quanYaTog30.isChecked = true;
            this.quanYaEdit.string = '';
        } else if (this.gameRule.allInRate == 60) {
            this.quanYaTog60.isChecked = true;
            this.quanYaEdit.string = '';
        } else if (this.gameRule.allInRate > 60) {
            this.quanYaTog30.isChecked = false;
            this.quanYaTog60.isChecked = false;
            this.quanYaEdit.string = `${this.gameRule.allInRate}`;
        }
        if (this.gameRule.cardBegin == 2) {
            this.quanKengTog2.isChecked = true;
        } else if (this.gameRule.cardBegin == 5) {
            this.quanKengTog5.isChecked = true;
        } else {
            this.quanKengTog9.isChecked = true;
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        this.difenEdit.string = this.gameRule.baseScore;
        this.guDingTog.isChecked = this.gameRule.fixBaseScore;
        this.daiWangTog.isChecked = this.gameRule.withJoker;
        this.daiErTog.isChecked = this.gameRule.withTwo;
        this.longHuTog.isChecked = this.gameRule.baoZi;
        this.moTiTog.isChecked = this.gameRule.endKick;
        this.liangPaiTog.isChecked = this.gameRule.endShowCards;
        this.lanGuoTog.isChecked = this.gameRule.lanGuoDouble;
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
    },

    updateCost() {
        let bureau = this.gameRule.bureau;
        let diamondCount = bureau == 10 ? 2 : bureau == 16 ? 3 : 4;
        this.gameRule.payDiamond = diamondCount;
    },

    onButtonClick(event, param) {
        if (param.indexOf('bureau') != -1) {
            this.gameRule.bureau = parseInt(param.split('_')[1]);
            this.updateCost();
        } else if (param.indexOf('member') != -1) {
            this.gameRule.maxPlayerCount = parseInt(param.slice(6));
            this.gameRule.minPlayerCount = parseInt(param.slice(6));
        } else if (param == 'yuyin') {
            this.gameRule.yuyin = event.isChecked;
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param == 'fangzuobi') {
            this.gameRule.fangzuobi = event.isChecked;
        } else if (param == "location") { //防作弊 服务器判断
            this.gameRule.showGps = event.isChecked;
        } else if (param == "guding") {
            this.gameRule.fixBaseScore = event.isChecked;
        } else if (param == 'difen') {
            this.onCheckRuleEditScore(this.difenEdit, 1, 0, "baseScore")
        } else if (param == "tongji") { //输赢统计显示
            this.gameRule.tongji = event.isChecked;
        } else if (param.indexOf('quanya') != -1) {
            let quanYaRate = parseInt(param.slice(6));
            if (quanYaRate == 0) {
                let quanYaEdit = this.quanYaEdit.string;
                if (quanYaEdit.length == 0 || parseInt(quanYaEdit) <= 60) {
                    AssetsManager.tipDialog('请输入大于60的整数！');
                    return;
                }
                this.quanYaTog30.isChecked = false;
                this.quanYaTog60.isChecked = false;
                this.gameRule.allInRate = parseInt(quanYaEdit);
            } else {
                if (!event.isChecked) {
                    this.gameRule.allInRate = 0;
                } else {
                    this.gameRule.allInRate = quanYaRate;
                }
                this.quanYaEdit.string = '';
            }
        } else if (param.indexOf('keng') != -1) {
            this.gameRule.cardBegin = parseInt(param.slice(4));
        } else if (param == "daiwang") {
            this.gameRule.withJoker = event.isChecked;
        } else if (param == "longhu") {
            this.gameRule.baoZi = event.isChecked;
        } else if (param == "languo") {
            this.gameRule.lanGuoDouble = event.isChecked;
        } else if (param == "liangpai") {
            this.gameRule.endShowCards = event.isChecked;
        } else if (param == "daier") {
            this.gameRule.withTwo = event.isChecked;
        } else if (param == "moti") {
            this.gameRule.endKick = event.isChecked;
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
        }
        // console.log('this.gameRule', this.gameRule);
        ConfigModel.setRoomCreateCache(this.gameRule);
    },

    onCheckRuleEditScore(editBox, min, max, key) {
        let score = parseInt(editBox.string)
        var r = /^\+?[1-9][0-9]*$/ //非0的正整数
        if (!r.test(editBox.string) || (score > max && max != 0)) {
            editBox.string = '';
            AssetsManager.tipDialog(`输入错误,请输入大于${min}的整数!`);
            return
        }
        this.gameRule[key] = score;
    },

    getRule() {
        return this.gameRule;
    }

});