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
        jushuTog4: cc.Toggle,
        jushuTog8: cc.Toggle,
        jushuTog16: cc.Toggle,
        renshuTog2: cc.Toggle,
        renshuTog3: cc.Toggle,
        renshuTog4: cc.Toggle,
        baseScoreTog5: cc.Toggle,
        baseScoreTog10: cc.Toggle,
        youJinRateTog3: cc.Toggle,
        youJinRateTog4: cc.Toggle,
        danJiaPeiTog: cc.Toggle,
        sanJiaPeiTog: cc.Toggle,
        mingYouTog: cc.Toggle,
        anYouTog: cc.Toggle,
        tianHuTog: cc.Toggle,
        daPaiGenDaTog: cc.Toggle,
        shuangJinBuPingHuTog: cc.Toggle,
        danJinBuPingHuTog: cc.Toggle,
        baiBanTiJinTog: cc.Toggle,
        lianZhuangRateTog: cc.Toggle,
        youAwardPannel: cc.Node,
        youAwardOneEdit: cc.EditBox,
        youAwardTwoEdit: cc.EditBox,
        youAwardThreeEdit: cc.EditBox,
        tupguanTog0: cc.Toggle,
        tupguanTog30: cc.Toggle,
        tupguanTog60: cc.Toggle,
        tupguanTog90: cc.Toggle,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 4,
            minPlayerCount: 4,
            maxPlayerCount: 4,
            gameType: Enums.bundleType.QZMJ,
            canTrust: false,
            trustTm: 0,
            canEnter: false,
            yuyin: false,
            baseScore: 5,
            bankerBaseScore: 10,
            ziyouju: false,
            fangzuobi: false,
            tongji: false,
            showGps: false,
            youJinRate: 3, //游金倍数
            youType: 0, //0-明游 1-暗游
            isCanTianHu: false, //天胡
            isDaPaiGenDa: false, //大牌跟打
            shuangLaiBuPingHu: false, //双金不平胡
            danLaiBuPingHu: false, //单金不平胡
            isBaiBanTiJin: false, //白板替金
            youJinAward: [0, 0, 0], //有游金奖励分
            liangZhuang5Rate: false,
            huPaiPeiType: 0
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
        if (this.gameRule.bureau == 8) {
            this.jushuTog8.isChecked = true;
        } else if (this.gameRule.bureau == 16) {
            this.jushuTog16.isChecked = true;
        } else {
            this.jushuTog4.isChecked = true;
        }
        /* 人数 */
        if (this.gameRule.maxPlayerCount == 3) {
            this.renshuTog3.isChecked = true;
        } else if (this.gameRule.maxPlayerCount == 4) {
            this.renshuTog4.isChecked = true;
        } else {
            this.renshuTog2.isChecked = true;
        }
        if (this.gameRule.youJinRate == 4) {
            this.youJinRateTog4.isChecked = true;
        } else {
            this.youJinRateTog3.isChecked = true;
        }

        if (this.gameRule.youType == 1) {
            this.anYouTog.isChecked = true;
        } else {
            this.mingYouTog.isChecked = true;
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        this.tianHuTog.isChecked = !!this.gameRule.isCanTianHu;
        this.daPaiGenDaTog.isChecked = !!this.gameRule.isDaPaiGenDa;
        this.shuangJinBuPingHuTog.isChecked = !!this.gameRule.shuangLaiBuPingHu;
        this.danJinBuPingHuTog.isChecked = !!this.gameRule.danLaiBuPingHu;
        this.gameRule.youJinAward = this.gameRule.youJinAward || [0, 0, 0];
        let youJinAwardScoreCount = 0;
        for (let index = 0; index < this.gameRule.youJinAward.length; index++) {
            if (this.gameRule.youJinAward[index] != 0) continue;
            youJinAwardScoreCount++;
        }
        this.lianZhuangRateTog.isChecked = !!this.gameRule.liangZhuang5Rate;
        this.youAwardOneEdit.string = this.gameRule.youJinAward[0];
        this.youAwardTwoEdit.string = this.gameRule.youJinAward[1];
        this.youAwardThreeEdit.string = this.gameRule.youJinAward[2];
        if (this.gameRule.huPaiPeiType == 1) {
            this.sanJiaPeiTog.isChecked = true;
        } else {
            this.danJiaPeiTog.isChecked = true;
        }
        /**底分 */
        if (this.gameRule.baseScore == 10) {
            this.baseScoreTog10.isChecked = true;
        } else {
            this.baseScoreTog5.isChecked = true;
        }
        /* 托管 */
        if (this.gameRule.canTrust) {
            if (this.gameRule.trustTm == 30) {
                this.tupguanTog30.isChecked = true;
            } else if (this.gameRule.trustTm == 60) {
                this.tupguanTog60.isChecked = true;
            } else if (this.gameRule.trustTm == 90) {
                this.tupguanTog90.isChecked = true;
            }
        } else {
            this.tupguanTog0.isChecked = true;
        }
    },

    updateCost() {
        let bureau = this.gameRule.bureau;
        let diamondCount = bureau == 4 ? 2 : bureau == 8 ? 4 : 6;
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
            this.gameRule.minPlayerCount = parseInt(param.slice(6));
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param == 'fangzuobi') {
            this.gameRule.fangzuobi = event.isChecked;
        } else if (param.indexOf('tuoguan') != -1) { //托管
            let tuoguan = parseInt(param.slice(7));
            if (tuoguan == 0) {
                this.gameRule.canTrust = false
            } else {
                this.gameRule.canTrust = true
                this.gameRule.trustTm = tuoguan
            }
        } else if (param.indexOf('youjin') != -1) { //托管
            this.gameRule.youJinRate = parseInt(param.slice(6));
        } else if (param == "tongji") { //输赢统计显示
            this.gameRule.tongji = event.isChecked
        } else if (param == "location") { //防作弊 服务器判断
            this.gameRule.showGps = event.isChecked
        } else if (param == 'mingyou') {
            this.gameRule.youType = 0;
        } else if (param == 'anyou') {
            this.gameRule.youType = 1;
        } else if (param == 'tianhu') {
            this.gameRule.isCanTianHu = event.isChecked;
        } else if (param == 'dapaigenda') {
            this.gameRule.isDaPaiGenDa = event.isChecked;
        } else if (param == 'shuangjin') {
            this.gameRule.shuangLaiBuPingHu = event.isChecked;
        } else if (param == 'danjin') {
            this.gameRule.danLaiBuPingHu = event.isChecked;
        } else if (param == 'baibantijin') {
            this.gameRule.isBaiBanTiJin = event.isChecked;
        } else if (param.indexOf('youfen') != -1) {
            let youJinIndex = parseInt(param.slice(6));
            let youJinAwardEdit = null;
            youJinIndex = youJinIndex > 3 || youJinIndex < 1 ? 1 : youJinIndex;
            if (youJinIndex == 1) {
                youJinAwardEdit = this.youAwardOneEdit.string;
            } else if (youJinIndex == 2) {
                youJinAwardEdit = this.youAwardTwoEdit.string;
            } else if (youJinIndex == 3) {
                youJinAwardEdit = this.youAwardThreeEdit.string;
            }
            if (!youJinAwardEdit || youJinAwardEdit.length == 0 || isNaN(parseInt(youJinAwardEdit))) {
                this.gameRule.youJinAward[youJinIndex - 1] = 0;
            } else {
                this.gameRule.youJinAward[youJinIndex - 1] = parseInt(youJinAwardEdit);
            }
        } else if (param == 'lianzhuang') {
            this.gameRule.liangZhuang5Rate = event.isChecked;
        } else if (param.indexOf('basescore') != -1) {
            let baseScore = parseInt(param.slice(9));
            this.gameRule.baseScore = baseScore;
            this.gameRule.bankerBaseScore = baseScore == 5 ? 10 : 15;
        } else if (param.indexOf('jiesuan') != -1) {
            let huPaiPeiType = parseInt(param.slice(7));
            this.gameRule.huPaiPeiType = huPaiPeiType;
        }
        ConfigModel.setRoomCreateCache(this.gameRule);
    },

    getRule() {
        return this.gameRule;
    }

});