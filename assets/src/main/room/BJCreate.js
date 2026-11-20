const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const CCUtil = require('../../utils/CCUtil');
const Utils = require("../../utils/Utils");

let LI_PAI_TIME = [0, 30, 45, 60]

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
        renshuTog3: cc.Toggle,
        renshuTog4: cc.Toggle,
        renshuTog5: cc.Toggle,
        renshuTog6: cc.Toggle,
        difenEdit: cc.EditBox,
        // 玩法
        tupguanTog0: cc.Toggle,
        tupguanTog30: cc.Toggle,
        tupguanTog60: cc.Toggle,
        tupguanTog120: cc.Toggle,
        jokerTypeTog: cc.Toggle,
        liPaiTimeTog0: cc.Toggle,
        liPaiTimeTog1: cc.Toggle,
        liPaiTimeTog2: cc.Toggle,
        liPaiTimeTog3: cc.Toggle,
        biPaiTypeTog1: cc.Toggle,
        biPaiTypeTog2: cc.Toggle,
        biPaiTypeTog3: cc.Toggle,
        jinrenTog: cc.Toggle,
        guanzhanTog: cc.Toggle,
        lastLimitTog: cc.Toggle,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 10,
            maxPlayerCount: 3,
            minPlayerCount: 2,
            gameType: Enums.bundleType.BJ,
            canTrust: false,
            trustTm: 0,
            yuyin: false,
            wanfa: 2, //1:抢庄 2：通比 3: 看牌下注
            baseScore: 1,
            cardCount: 9, //牌数
            unReadyKick: 0,
            /**输赢统计 */
            tongji: false,
            showGps: false,
            /* 允许观战 */
            canWatch: false,
            /* 中途进人 */
            canEnter: false,
            jokerType: 0, //0无鬼  1有鬼
            liPaiTime: 0, //摆牌时间
            biPaiType: 1, //比牌动画 1详细 2简单 3跳过动画
        };
        this.updateCost();
    },

    start() {
        this.fangfeiPannel.active = !(!!this.node.nodeParams && !!this.node.nodeParams.isUnion);
        this.gameRule = !!this.node.nodeParams && !!this.node.nodeParams.gameRule ? this.node.nodeParams.gameRule : this.gameRule;
        this.init();
    },

    init() {
        if (this.gameRule.bureau == 20) {
            this.jushuTog20.isChecked = true;
        } else if (this.gameRule.bureau == 30) {
            this.jushuTog30.isChecked = true;
        } else {
            this.jushuTog10.isChecked = true;
        }
        // 人数
        if (this.gameRule.maxPlayerCount == 6) {
            this.renshuTog6.isChecked = true;
        } else if (this.gameRule.maxPlayerCount == 5) {
            this.renshuTog5.isChecked = true;
        } else if (this.gameRule.maxPlayerCount == 4) {
            this.renshuTog4.isChecked = true;
        } else {
            this.renshuTog3.isChecked = true;
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        /*玩法 */
        this.jokerTypeTog.isChecked = !!this.gameRule.jokerType
        /* 托管 */
        if (this.gameRule.canTrust) {
            if (this.gameRule.trustTm == 30) {
                this.tupguanTog30.isChecked = true;
            } else if (this.gameRule.trustTm == 60) {
                this.tupguanTog60.isChecked = true;
            } else if (this.gameRule.trustTm == 120) {
                this.tupguanTog120.isChecked = true;
            }
        } else {
            this.tupguanTog0.isChecked = true;
        }

        this.guanzhanTog.isChecked = !!this.gameRule.canWatch;
        this.jinrenTog.isChecked = !!this.gameRule.canEnter;
        if (!!this.gameRule.canEnter) {
            this.lastLimitTog.interactable = true;
            this.lastLimitTog.isChecked = !!this.gameRule.lastThreeJoin;
        } else {
            this.lastLimitTog.interactable = false;
            this.lastLimitTog.isChecked = false;
        }
        CCUtil.setGrayShader(this.lastLimitTog.node, !this.lastLimitTog.interactable);
        let setTog = (name, isChecked = true) => {
            let tog = this[name]
            if (tog) tog.isChecked = isChecked
        }
        /*摆牌时间*/
        let idx = LI_PAI_TIME.indexOf(this.gameRule.liPaiTime)
        setTog("liPaiTimeTog" + idx)
        /**动画 */
        let biPaiType = this.gameRule.biPaiType
        setTog("biPaiTypeTog" + biPaiType)
    },

    updateCost() {
        let bureau = this.gameRule.bureau;
        let diamondCount = 4;
        if (bureau == 10) {
            diamondCount = 4;
        } else if (bureau == 20) {
            diamondCount = 8;
        } else if (bureau == 30) {
            diamondCount = 12;
        }
        this.gameRule.payDiamond = diamondCount;
    },

    onButtonClick(event, param) {
        if (param.indexOf('bureau') != -1) {
            this.gameRule.bureau = parseInt(param.split('_')[1]);
            this.updateCost();
        } else if (param.indexOf('member') != -1) {
            this.gameRule.maxPlayerCount = parseInt(param.slice(6));
            // this.gameRule.minPlayerCount = this.gameRule.maxPlayerCount;
            if (this.gameRule.maxPlayerCount == 6) {
                this.gameRule.jokerType = 1
                this.jokerTypeTog.isChecked = true
            }
        } else if (param == 'yuyin') {
            this.gameRule.yuyin = event.isChecked;
        } else if (param == "fangzuobi") {
            this.gameRule.fangzuobi = event.isChecked;
        } else if (param == "difen") {
            this.onCheckRuleEditScore(this.difenEdit, 1, 100, "baseScore")
        } else if (param == "jokerType") {
            if (this.gameRule.maxPlayerCount == 6) {
                this.gameRule.jokerType = 1
                this.jokerTypeTog.isChecked = true
                AssetsManager.tipDialog("6人必须带王")
                return
            }
            this.gameRule.jokerType = event.isChecked ? 1 : 0;
        } else if (param == "unReadyKick") {
            this.gameRule.unReadyKick = event.isChecked ? 10 : 0
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param.indexOf('tuoguan') != -1) { //托管
            let tuoguan = parseInt(param.slice(7));
            // console.log("托管==", tuoguan)
            if (tuoguan == 0) {
                this.gameRule.canTrust = false
            } else {
                this.gameRule.canTrust = true
                this.gameRule.trustTm = tuoguan
            }
        } else if (param == "tongji") { //输赢统计显示
            this.gameRule.tongji = event.isChecked
        } else if (param == "location") { //防作弊 服务器判断
            this.gameRule.showGps = event.isChecked
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
        } else if (param.indexOf('liPaiTime') != -1) {
            this.gameRule.liPaiTime = LI_PAI_TIME[parseInt(param.slice(9))];
        } else if (param.indexOf('biPaiType') != -1) {
            this.gameRule.biPaiType = parseInt(param.slice(9))
        }
        // console.log('比鸡规则==', this.gameRule);
        ConfigModel.setRoomCreateCache(this.gameRule);
    },

    onCheckRuleEditScore(editBox, min, max, key) {
        let score = parseFloat(editBox.string)
        var r = /^\+?[1-9][0-9]*$/ //非0的正整数
        if (!r.test(editBox.string) || score > max || score < min) {
            editBox.string = '';
            AssetsManager.tipDialog(`输入错误,请输入${min}-${max}的整数`);
            return
        }
        this.gameRule[key] = score;
    },

    getRule() {
        return this.gameRule;
    }

});