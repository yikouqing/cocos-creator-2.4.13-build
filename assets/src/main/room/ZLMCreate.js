const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const Utils = require("../../utils/Utils");
const ConfigModel = require('../../model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        fangfeiPannel: cc.Node,
        hostPayTog: cc.Toggle,
        aaPayTog: cc.Toggle,
        winPayTog: cc.Toggle,
        jushuTog9: cc.Toggle,
        jushuTog18: cc.Toggle,
        renshuTog2: cc.Toggle,
        renshuTog3: cc.Toggle,
        tuoguanTog0: cc.Toggle,
        tuoguanTog30: cc.Toggle,
        tuoguanTog60: cc.Toggle,
        tuoguanTog90: cc.Toggle,
        difenEditBox: cc.EditBox,
        cardsCountTog: cc.Toggle,
        sanBuDaiTog: cc.Toggle,
        siDaiErTog: cc.Toggle,
        boomOutReduce2RenTog: cc.Toggle,
        boomOutScore2RenTog: cc.Toggle,
        kDingA2RenTog: cc.Toggle,
        duiKDingA2RenTog: cc.Toggle,
        boomOutReduce3RenTog: cc.Toggle,
        boomOutScore3RenTog: cc.Toggle,
        kDingA3RenTog: cc.Toggle,
        duiKDingA3RenTog: cc.Toggle,
        withATog: cc.Toggle,
        kDingADing2Tog: cc.Toggle,
        duiABoomTog: cc.Toggle,
        baoShuangDuiTog: cc.Toggle,
        lianWithATog: cc.Toggle,
        baoDanWinTog: cc.Toggle,
        zhadanTog5: cc.Toggle,
        zhadanTog10: cc.Toggle,
        tianzhaTog10: cc.Toggle,
        tianzhaTog20: cc.Toggle,
        jipaiqiTog: cc.Toggle,
        twoPlayerWanfa: cc.Node,
        threePlayerWanfa: cc.Node,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 9,
            minPlayerCount: 3,
            maxPlayerCount: 3,
            gameType: Enums.bundleType.ZLM,
            fangzuobi: false,
            baseScore: 1,
            boomScore: 5,
            boomAAAScore: 10,
            yiTiaoLong: false,
            firstRoundOut: 0,
            canTrust: false,
            trustTm: 0,
            bichu: false,
            canEnter: false,
            /**输赢统计 */
            tongji: false,
            showGps: false,
            /**显示手牌数量 */
            showCardsCount: true,
            /**三不带 */
            sanBuDai: false,
            /**四带二 */
            siDaiEr: false,
            /**炸弹未出扣分 */
            boomOutReduce: false,
            /**空炸算分 */
            boomOutScore: false,
            /**是否可以带A */
            withA: false,
            /**是否k顶a */
            kDingA: true,
            /**是否k顶a2 */
            kDingADing2: false,
            /**是否对k顶对a */
            duiKDingA: false,
            /**是否对a必出炸弹 */
            duiABoom: false,
            /**报双不出对 */
            baoShuangDui: false,
            /**连子带A */
            lianWithA: false,
            /**报单不输分 */
            baoDanWin: false,
            /**记牌器 */
            isCardRecorder: false,
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
        if (this.gameRule.bureau == 9) {
            this.jushuTog9.isChecked = true;
        } else if (this.gameRule.bureau == 18) {
            this.jushuTog18.isChecked = true;
        }
        /* 人数 */
        if (this.gameRule.maxPlayerCount == 3) {
            this.renshuTog3.isChecked = true;
        } else {
            this.renshuTog2.isChecked = true;
        }

        /* 玩法设置 */
        this.sanBuDaiTog.isChecked = this.gameRule.sanBuDai
        this.siDaiErTog.isChecked = this.gameRule.siDaiEr
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
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        /**定位 */
        /**底分 */
        this.difenEditBox.string = this.gameRule.baseScore

        this.cardsCountTog.isChecked = this.gameRule.showCardsCount

        this.jipaiqiTog.isChecked = this.gameRule.isCardRecorder

        /**玩法显示 */
        if (this.gameRule.maxPlayerCount == 2) {
            this.twoPlayerWanfa.active = true
            this.threePlayerWanfa.active = false
            this[`zhadanTog${this.gameRule.boomScore}`].isChecked = true
            this[`tianzhaTog${this.gameRule.boomAAAScore}`].isChecked = true
            this.kDingA2RenTog.isChecked = this.gameRule.kDingA
            this.duiKDingA2RenTog.isChecked = this.gameRule.duiKDingA
            this.boomOutScore2RenTog.isChecked = this.gameRule.boomOutScore
            this.boomOutReduce2RenTog.isChecked = this.gameRule.boomOutReduce
        } else if (this.gameRule.maxPlayerCount == 3) {
            this.twoPlayerWanfa.active = false
            this.threePlayerWanfa.active = true
            this.kDingA3RenTog.isChecked = this.gameRule.kDingA
            this.duiKDingA3RenTog.isChecked = this.gameRule.duiKDingA
            this.boomOutScore3RenTog.isChecked = this.gameRule.boomOutScore
            this.boomOutReduce3RenTog.isChecked = this.gameRule.boomOutReduce
            this.sanBuDaiTog.isChecked = this.gameRule.sanBuDai
            this.siDaiErTog.isChecked = this.gameRule.siDaiEr
            this.withATog.isChecked = this.gameRule.withA
            this.lianWithATog.isChecked = this.gameRule.lianWithA
            this.kDingADing2Tog.isChecked = this.gameRule.kDingADing2
            this.duiABoomTog.isChecked = this.gameRule.duiABoom
            this.baoDanWinTog.isChecked = this.gameRule.baoDanWin
            this.baoShuangDuiTog.isChecked = this.gameRule.baoShuangDui;
        }
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
            let pcount = this.gameRule.maxPlayerCount
            this.twoPlayerWanfa.active = pcount == 2
            this.threePlayerWanfa.active = pcount == 3
            this.gameRule.kDingA = this[`kDingA${pcount}RenTog`].isChecked
            this.gameRule.duiKDingA = this[`duiKDingA${pcount}RenTog`].isChecked
            this.gameRule.boomOutScore = this[`boomOutScore${pcount}RenTog`].isChecked
            this.gameRule.boomOutReduce = this[`boomOutReduce${pcount}RenTog`].isChecked
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param == 'difen') {
            this.onCheckRuleEditScore(this.gameRule, this.difenEditBox, 1, 100, "baseScore")
        } else if (param.indexOf('tuoguan') != -1) {
            let tuoguan = param.split('_');
            this.gameRule.canTrust = tuoguan[1] != 0;
            this.gameRule.trustTm = parseInt(tuoguan[1]);
        } else if (param == "tongji") { //输赢统计显示
            this.gameRule.tongji = event.isChecked
        } else if (param == "location") { //防作弊 服务器判断
            this.gameRule.showGps = event.isChecked
        } else if (param == 'jipaiqi') { //记牌器
            this.gameRule.isCardRecorder = event.isChecked
        } else if (param == 'cardsCount') { //手牌数量
            this.gameRule.showCardsCount = event.isChecked
        } else if (param.includes("zhadan")) { //炸弹分
            let idx = parseInt(param.slice(6))
            this.gameRule.boomScore = idx
        } else if (param.includes("tianzha")) { //天炸分
            let idx = parseInt(param.slice(7))
            this.gameRule.boomAAAScore = idx
        } else {
            let rules = ["boomOutReduce", "boomOutScore", "withA", "sanBuDai", "siDaiEr", "kDingA", "kDingADing2", "duiKDingA", "duiABoom", "baoShuangDui", "lianWithA", "baoDanWin"]
            if (rules.includes(param)) {
                // console.log("param=", param, event.isChecked)
                this.gameRule[param] = event.isChecked
                if (param == "kDingA") {
                    this.gameRule.kDingADing2 = !this.gameRule.kDingA
                }
                if (param == "kDingADing2") {
                    this.gameRule.kDingA = !this.gameRule.kDingADing2
                }
            }
        }
        // console.log('创建表单-捉老麻', this.gameRule);
        ConfigModel.setRoomCreateCache(this.gameRule);
    },

    getRule() {
        return this.gameRule;
    }

});