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
        jushuTog12: cc.Toggle,
        jushuTog16: cc.Toggle,
        renshuTog2: cc.Toggle,
        renshuTog3: cc.Toggle,
        shenbaoTog1: cc.Toggle,
        shenbaoTog2: cc.Toggle,
        shenbaoTog3: cc.Toggle,
        sandaiTog0: cc.Toggle,
        sandaiTog1: cc.Toggle,
        sandaiTog2: cc.Toggle,

        sidaiTog2: cc.Toggle,
        sige5Tog: cc.Toggle,
        xifenTog: cc.Toggle,
        zhadanfenNode: cc.Node,
        zhadanTog0: cc.Toggle,
        zhadanTog1: cc.Toggle,
        zhadanTog2: cc.Toggle,
        zhadanTog3: cc.Toggle,
        zhadanTog4: cc.Toggle,
        chupaiTog1: cc.Toggle,
        chupaiTog2: cc.Toggle,
        tuoguanTog0: cc.Toggle,
        tuoguanTog30: cc.Toggle,
        tuoguanTog60: cc.Toggle,
        tuoguanTog90: cc.Toggle,
        difenEditBox: cc.EditBox,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 8,
            minPlayerCount: 2,
            maxPlayerCount: 2,
            gameType: Enums.bundleType.MNPDK,
            fangzuobi: false,
            baseScore: 1,
            boomScore: 1,
            yiTiaoLong: false,
            firstRoundOut: 1,
            canTrust: false,
            trustTm: 0,
            bichu: true,
            canEnter: false,
            /**输赢统计 */
            tongji: false,
            showGps: false,
            /**三不带 */
            SaBuDai: false,
            /**三带一 */
            SaBuDaiOne: false,
            /**三带二 */
            SaBuDaiTwo: false,
            /**四带二 */
            siDaiTwo: false,
            /**5555必赢 */
            FiveFiveFiveFive: false,
            /**开启申报 */
            kaiqishenbao: true,
            /**首局不可申报 */
            shoujubushenbao: false,
            shenbaofanbei: false, //申报翻倍
            showCardsCount: true
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
            this.jushuTog12.isChecked = true;
        }
        /* 人数 */
        if (this.gameRule.maxPlayerCount == 3) {
            this.renshuTog3.isChecked = true;
        } else {
            this.renshuTog2.isChecked = true;
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        /* 玩法设置 */
        this.sandaiTog0.isChecked = this.gameRule.SaBuDai;
        this.sandaiTog1.isChecked = this.gameRule.SaBuDaiOne;
        this.sandaiTog2.isChecked = this.gameRule.SaBuDaiTwo;
        this.sidaiTog2.isChecked = this.gameRule.siDaiTwo
        this.sige5Tog.isChecked = this.gameRule.FiveFiveFiveFive;
        /**输赢统计 */
        /**防作弊 */
        if (this.gameRule.canTrust != false) {
            if (this.gameRule.trustTm == 30) {
                this.tuoguanTog30.isChecked = true;
            } else if (this.gameRule.trustTm == 60) {
                this.tuoguanTog60.isChecked = true;
            } else if (this.gameRule.trustTm == 90) {
                this.tuoguanTog90.isChecked = true;
            }
        } else {
            this.tuoguanTog0.isChecked = true;
        }

        /**定位 */

        /**底分 */
        this.difenEditBox.string = this.gameRule.baseScore
        /**炸弹 */
        let boomScore = this.gameRule.boomScore
        if (boomScore == 0) {
            this.zhadanTog0.isChecked = true
            this.zhadanfenNode.active = false
        } else {
            this.xifenTog.isChecked = true
            this.zhadanfenNode.active = true
            this["zhadanTog" + boomScore].isChecked = true
        }

        /**申报 */
        this.shenbaoTog1.isChecked = this.gameRule.kaiqishenbao
        if (this.gameRule.kaiqishenbao) {
            this.shenbaoTog2.node.active = true
            this.shenbaoTog3.node.active = true;
            this.shenbaoTog2.isChecked = this.gameRule.shoujubushenbao;
            this.shenbaoTog3.isChecked = this.gameRule.shenbaofanbei;
        } else {
            this.shenbaoTog2.node.active = false;
            this.shenbaoTog3.node.active = false;
            this.gameRule.shoujubushenbao = false;
            this.gameRule.shenbaofanbei = false;
        }

        /**首局出牌 没有随机出牌*/
        if (this.gameRule.firstRoundOut == 0) {
            this.gameRule.firstRoundOut = 1
        }
        this[`chupaiTog${this.gameRule.firstRoundOut}`].isChecked = true
    },

    updateCost() {
        let bureau = this.gameRule.bureau;
        let diamondCount = bureau == 8 ? 2 : bureau == 12 ? 3 : 4;
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
        if (param.indexOf('jushu') != -1) {
            this.gameRule.bureau = parseInt(param.split('_')[1]);
            this.updateCost();
        } else if (param == 'qiangzhidingwei') {
            this.gameRule.fangzuobi = event.isChecked;
        } else if (param.indexOf('member') != -1) {
            this.gameRule.maxPlayerCount = parseInt(param.split('_')[1]);
            this.gameRule.minPlayerCount = parseInt(param.split('_')[1]);
            this.updateCost();
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param == 'difen') {
            this.onCheckRuleEditScore(this.gameRule, this.difenEditBox, 1, 100, "baseScore")
        } else if (param == 'xifen') {
            this.zhadanfenNode.active = true
            for (let i = 1; i <= 4; i++) {
                if (this["zhadanTog" + i].isChecked) {
                    this.gameRule.boomScore = i
                    break
                }
            }
        } else if (param.includes("zhadan")) {
            let idx = parseInt(param.slice(6))
            this.gameRule.boomScore = idx
            if (idx == 0) {
                this.zhadanfenNode.active = false
            }
        } else if (param == 'shenbao1') {
            this.gameRule.kaiqishenbao = event.isChecked;
            this.shenbaoTog2.node.active = event.isChecked;
            this.shenbaoTog3.node.active = event.isChecked;
            if (!event.isChecked) {
                this.gameRule.shoujubushenbao = false
                this.gameRule.shenbaofanbei = false;
            } else {
                this.gameRule.shoujubushenbao = this.shenbaoTog2.isChecked;
                this.gameRule.shenbaofanbei = this.shenbaoTog3.isChecked;
            }
        } else if (param == 'shenbao2') {
            this.gameRule.shoujubushenbao = event.isChecked;
        } else if (param == 'shenbao3') {
            this.gameRule.shenbaofanbei = event.isChecked;
        } else if (param == '5555') {
            this.gameRule.FiveFiveFiveFive = event.isChecked;
        } else if (param == "sandai0") {
            this.gameRule.SaBuDai = event.isChecked
        } else if (param == "sandai1") {
            this.gameRule.SaBuDaiOne = event.isChecked
        } else if (param == "sandai2") {
            this.gameRule.SaBuDaiTwo = event.isChecked
        } else if (param == "sidai2") {
            this.gameRule.siDaiTwo = event.isChecked
        } else if (param.indexOf('tuoguan') != -1) {
            let tuoguan = param.split('_');
            this.gameRule.canTrust = tuoguan[1] != 0;
            this.gameRule.trustTm = parseInt(tuoguan[1]);
        } else if (param == "tongji") { //输赢统计显示
            this.gameRule.tongji = event.isChecked
        } else if (param == "location") { //防作弊 服务器判断
            this.gameRule.showGps = event.isChecked
        } else if (param.includes("chupai")) {
            this.gameRule.firstRoundOut = parseInt(param.slice(6))
        }
        // console.log('创建表单-冕宁跑得快', this.gameRule);
        ConfigModel.setRoomCreateCache(this.gameRule);
    },

    getRule() {
        return this.gameRule;
    }

});