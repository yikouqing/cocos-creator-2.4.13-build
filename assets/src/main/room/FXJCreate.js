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
        jushuTog4: cc.Toggle,
        jushuTog8: cc.Toggle,
        jushuTog16: cc.Toggle,
        renshuTog2: cc.Toggle,
        renshuTog3: cc.Toggle,
        renshuTog4: cc.Toggle,
        difenEdit: cc.EditBox,
        fengdingTog0: cc.Toggle,
        fengdingTog2: cc.Toggle,
        fengdingTog3: cc.Toggle,
        fengdingTog4: cc.Toggle,
        yangzhuTog0: cc.Toggle,
        yangzhuTog1: cc.Toggle,
        yangzhuTog2: cc.Toggle,
        yangzhuTogAll: cc.Toggle,
        feixiaojiTog: cc.Toggle,
        feibaibanTog: cc.Toggle,
        feishuangguiTog: cc.Toggle,
        yingmajiangTog: cc.Toggle,
        chipaiTog: cc.Toggle,
        kebuchiTog: cc.Toggle,
        shisanyaoTog2: cc.Toggle,
        shisanyaoTog4: cc.Toggle,
        queyimenTog: cc.Toggle,
        dianjiTog: cc.Toggle,
        shuanggangTog: cc.Toggle,
        sangangTog: cc.Toggle,
        tupguanTog0: cc.Toggle,
        tupguanTog30: cc.Toggle,
        tupguanTog60: cc.Toggle,
        tupguanTog90: cc.Toggle,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 8,
            minPlayerCount: 4,
            maxPlayerCount: 4,
            gameType: Enums.bundleType.FXJ,
            gameFrameType: 4,
            canTrust: false,
            /* 托管时间 */
            trustTm: 0,
            canEnter: false,
            yuyin: false,
            baseScore: 1,
            qidui: true,
            /* 自由局 */
            ziyouju: false,
            /**封顶倍数 0为不封顶(默认) */
            maxRate: 2,
            /**养猪 0不养 1一猪 2两猪 3 自由养 */
            pigScoreType: 0,
            /**1飞小鸡2飞白板3飞双鬼4硬麻将 */
            playType: 1,
            /**默认不可以吃牌 */
            isChi: true,
            /**默认不缺一门 */
            isLackCard: false,
            /**默认不点鸡 */
            isDianJi: false,
            /**默认不要双杠上花 */
            shuangGangShangHua: false,
            /**默认不要三杠上花 */
            sanGangShangHua: false,
            /**默认4  2：点炮2分 4：点炮4分 */
            shiSanYaoDianPao: 4,
            fangzuobi: false,
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
        /**底分 */
        this.difenEdit.string = this.gameRule.baseScore
        /**封顶 */
        if (this.gameRule.maxRate == 2) {
            this.fengdingTog2.isChecked = true;
        } else if (this.gameRule.maxRate == 3) {
            this.fengdingTog3.isChecked = true;
        } else if (this.gameRule.maxRate == 4) {
            this.fengdingTog4.isChecked = true;
        } else {
            this.fengdingTog0.isChecked = true;
        }
        /**养猪 */
        if (this.gameRule.pigScoreType == 1) {
            this.yangzhuTog1.isChecked = true;
        } else if (this.gameRule.pigScoreType == 2) {
            this.yangzhuTog2.isChecked = true;
        } else if (this.gameRule.pigScoreType == 3) {
            this.yangzhuTogAll.isChecked = true;
        } else {
            this.yangzhuTog0.isChecked = true;
        }
        /**玩法 */
        if (this.gameRule.playType == 1) {
            this.feixiaojiTog.isChecked = true;
        } else if (this.gameRule.playType == 2) {
            this.feibaibanTog.isChecked = true;
        } else if (this.gameRule.playType == 3) {
            this.feishuangguiTog.isChecked = true;
        } else if (this.gameRule.playType == 4) {
            this.yingmajiangTog.isChecked = true;
        }
        /**吃牌 */
        if (!this.gameRule.isChi) {
            this.kebuchiTog.isChecked = true;
        } else {
            this.chipaiTog.isChecked = true;
        }
        /**十三幺点炮分数 */
        if (this.gameRule.shiSanYaoDianPao == 2) {
            this.shisanyaoTog2.isChecked = true;
        } else if (this.gameRule.shiSanYaoDianPao == 4) {
            this.shisanyaoTog4.isChecked = true;
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        /**缺一门 */
        this.queyimenTog.isChecked = !!this.gameRule.isLackCard;
        /**点鸡 */
        this.dianjiTog.isChecked = !!this.gameRule.isDianJi && this.gameRule.playType != 4;
        this.dianjiTog.interactable = this.gameRule.playType != 4;
        CCUtil.setGrayShader(this.dianjiTog.node, !this.dianjiTog.interactable);
        /**双杠上花 */
        this.shuanggangTog.isChecked = !!this.gameRule.shuangGangShangHua;
        /**三杠上花 */
        this.sangangTog.isChecked = !!this.gameRule.sanGangShangHua;

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

        /**输赢统计 */
        /**防作弊 */
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
        } else if (param == 'difen') {
            this.onCheckRuleEditScore(this.gameRule, this.difenEdit, 1, 200, "baseScore")
        } else if (param.indexOf('fengding') != -1) {
            this.gameRule.maxRate = parseInt(param.slice(8));
        } else if (param == 'fangzuobi') {
            this.gameRule.fangzuobi = event.isChecked;
        } else if (param.indexOf('pig') != -1) {
            this.gameRule.pigScoreType = parseInt(param.slice(3));
            /**如果选择养猪不能选择点鸡 */
            if (param !== "pig0") {
                this.dianjiTog.isChecked = false;
                this.gameRule.isDianJi = false;
            } else {
                this.dianjiTog.interactable = true;
            }
            CCUtil.setGrayShader(this.dianjiTog.node, !this.dianjiTog.interactable);
        } else if (param.indexOf("playType") != -1) {
            this.gameRule.playType = parseInt(param.slice(8));
            /**如果选择硬麻将不能选择点鸡 */
            if (param === "playType4") {
                this.dianjiTog.isChecked = false;
                this.dianjiTog.interactable = false;
                this.gameRule.isDianJi = false;
            } else {
                this.dianjiTog.interactable = true;
            }
            CCUtil.setGrayShader(this.dianjiTog.node, !this.dianjiTog.interactable);
        } else if (param == 'chi') {
            this.gameRule.isChi = true;
        } else if (param == 'buchi') {
            this.gameRule.isChi = false;
        } else if (param == '1314') {
            this.gameRule.shiSanYaoDianPao = event.isChecked ? 4 : 0
        } else if (param == '1312') {
            this.gameRule.shiSanYaoDianPao = event.isChecked ? 2 : 0
        } else if (param == 'lackCard') { //缺一门
            this.gameRule.isLackCard = event.isChecked
        } else if (param == 'dianJi') { //点鸡
            this.gameRule.isDianJi = event.isChecked
            /**如果选点鸡不能养猪 */
            if (event.isChecked) {
                this.yangzhuTog0.isChecked = true;
                this.gameRule.pigScoreType = 0;
            }
        } else if (param == '2gsh') { //双杠上花
            this.gameRule.shuangGangShangHua = event.isChecked
        } else if (param == '3gsh') { //三杠上花
            this.gameRule.sanGangShangHua = event.isChecked
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
        }
        // console.log(this.gameRule);
        ConfigModel.setRoomCreateCache(this.gameRule);
    },

    getRule() {
        return this.gameRule;
    }

});