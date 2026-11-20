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
        jushuTog8: cc.Toggle,
        jushuTog16: cc.Toggle,
        renshuTog2: cc.Toggle,
        renshuTog3: cc.Toggle,
        renshuTog4: cc.Toggle,
        fengDingTog0: cc.Toggle,
        fengDingTog4: cc.Toggle,
        fengDingTog8: cc.Toggle,
        fengDingTog16: cc.Toggle,
        fengDingTog32: cc.Toggle,
        queYiMenTog0: cc.Toggle,
        queYiMenTog1: cc.Toggle,
        ziMoTypeTog0: cc.Toggle, //0不加  1加底  2加番
        ziMoTypeTog1: cc.Toggle, //0不加  1加底  2加番
        ziMoTypeTog2: cc.Toggle, //0不加  1加底  2加番
        menQingZhongZhangTog: cc.Toggle, //门清中张
        lianGangTog: cc.Toggle, //杠上杠
        xiaoFeiYangTog: cc.Toggle, //小肥阳
        dianPaoKePingHuTog: cc.Toggle, //点炮可平胡
        queMenJiaFanTog: cc.Toggle, //缺门加番
        haiDiTog: cc.Toggle, //海底
        huanSanZhangTog: cc.Toggle, //换三张
        moPaiBaiPaiTog: cc.Toggle, //摸牌前摆牌
        difenEdit: cc.EditBox,
        tupguanTog0: cc.Toggle,
        tupguanTog30: cc.Toggle,
        tupguanTog60: cc.Toggle,
        tupguanTog90: cc.Toggle,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 8,
            maxPlayerCount: 4,
            minPlayerCount: 4,
            gameType: Enums.bundleType.HLMJ,
            trustTm: 0,
            canEnter: false,
            yuyin: false,
            wanfa: 3,
            baseScore: 1,
            fangzuobi: false,
            queYiMen: false,
            cardCount: 13, //牌数
            unReadyKick: 0, //10秒未准备踢出用户
            /**输赢统计 */
            tongji: false,
            showGps: false,

            fengDing: 0, //封顶分数 0 不封顶
            ziMoType: 0, //0不加  1加底  2加番
            menQingZhongZhang: false, //门清中张
            lianGang: false, //杠上杠
            xiaoFeiYang: false, //小肥阳
            dianPaoKePingHu: false, //点炮可平胡
            queMenJiaFan: false, //缺门加番
            haiDi: false, //海底
            huanSanZhang: false, //换三张
            moPaiBaiPai: false, //摸牌前摆牌
        };
        this.updateCost();
    },

    start() {
        this.fangfeiPannel.active = !(!!this.node.nodeParams && !!this.node.nodeParams.isUnion);
        this.gameRule = !!this.node.nodeParams && !!this.node.nodeParams.gameRule ? this.node.nodeParams.gameRule : this.gameRule;
        this.init();
    },

    init() {
        this.gameRule.canEnter = false;
        if (this.gameRule.bureau == 8) {
            this.jushuTog8.isChecked = true;
        } else if (this.gameRule.bureau == 16) {
            this.jushuTog16.isChecked = true;
        } else if (this.gameRule.bureau == 9999) {
            this.gameRule.canEnter = false;
        }
        // 人数
        if (this.gameRule.maxPlayerCount == 4) {
            this.renshuTog4.isChecked = true;
        } else if (this.gameRule.maxPlayerCount == 3) {
            this.renshuTog3.isChecked = true;
        } else {
            this.renshuTog2.isChecked = true;
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        /*玩法 */
        this.menQingZhongZhangTog.isChecked = !!this.gameRule.menQingZhongZhang
        this.lianGangTog.isChecked = !!this.gameRule.lianGang
        this.xiaoFeiYangTog.isChecked = !!this.gameRule.xiaoFeiYang
        this.dianPaoKePingHuTog.isChecked = !!this.gameRule.dianPaoKePingHu
        this.queMenJiaFanTog.isChecked = !!this.gameRule.queMenJiaFan
        this.haiDiTog.isChecked = !!this.gameRule.haiDi
        this.huanSanZhangTog.isChecked = !!this.gameRule.huanSanZhang
        this.moPaiBaiPaiTog.isChecked = !!this.gameRule.moPaiBaiPai

        /**2人没有xiaofeiyang */
        if (this.gameRule.maxPlayerCount == 2) {
            this.xiaoFeiYangTog.interactable = false
        }
        CCUtil.setGrayShader(this.xiaoFeiYangTog.node, !this.xiaoFeiYangTog.interactable);
        /**两房没有缺门加番 */
        if (this.gameRule.queYiMen) {
            this.queMenJiaFanTog.interactable = false
        }
        CCUtil.setGrayShader(this.queMenJiaFanTog.node, !this.queMenJiaFanTog.interactable);
        /**房数 */
        if (this.gameRule.queYiMen) {
            this.queYiMenTog1.isChecked = true
        } else {
            this.queYiMenTog0.isChecked = true
        }
        /**封顶 */
        if (this.gameRule.fengDing == 32) {
            this.fengDingTog32.isChecked = true
        } else if (this.gameRule.fengDing == 16) {
            this.fengDingTog16.isChecked = true
        } else if (this.gameRule.fengDing == 8) {
            this.fengDingTog8.isChecked = true
        } else if (this.gameRule.fengDing == 4) {
            this.fengDingTog4.isChecked = true
        } else this.fengDingTog0.isChecked = true

        /**自摸类型 */
        if (this.gameRule.ziMoType == 1) {
            this.ziMoTypeTog1.isChecked = true
        } else if (this.gameRule.ziMoType == 2) {
            this.ziMoTypeTog2.isChecked = true
        } else this.ziMoTypeTog0.isChecked = true

        /**底分 */
        this.difenEdit.string = this.gameRule.baseScore

        /* 托管 */
        if (this.gameRule.trustTm == 30) {
            this.tupguanTog30.isChecked = true;
        } else if (this.gameRule.trustTm == 60) {
            this.tupguanTog60.isChecked = true;
        } else if (this.gameRule.trustTm == 90) {
            this.tupguanTog90.isChecked = true;
        } else {
            this.tupguanTog0.isChecked = true;
        }
        /**输赢统计 */
        /**防作弊 */
    },

    updateCost() {
        let bureau = this.gameRule.bureau;
        this.gameRule.canEnter = false;
        let diamondCount = 1;
        if (bureau === 9999) {
            diamondCount = 1;
            this.gameRule.canEnter = false;
        } else if (bureau == 8) {
            diamondCount = 2;
        } else if (bureau == 16) {
            diamondCount = 4;
        }
        this.gameRule.payDiamond = diamondCount;
    },

    onButtonClick(event, param) {
        if (param.indexOf('bureau') != -1) {
            this.gameRule.bureau = parseInt(param.split('_')[1]);
            this.updateCost();
        } else if (param.indexOf('member') != -1) {
            this.gameRule.maxPlayerCount = parseInt(param.slice(6))
            this.gameRule.minPlayerCount = parseInt(param.slice(6))
            if (this.gameRule.maxPlayerCount == 2) {
                this.xiaoFeiYangTog.isChecked = false
                this.xiaoFeiYangTog.interactable = false
                this.gameRule.xiaoFeiYang = false
            } else {
                this.xiaoFeiYangTog.interactable = true
            }
            CCUtil.setGrayShader(this.xiaoFeiYangTog.node, !this.xiaoFeiYangTog.interactable);
        } else if (param == 'yuyin') {
            this.gameRule.yuyin = event.isChecked;
        } else if (param.indexOf('queYiMen') != -1) {
            let idx = parseInt(param.slice(8))
            if (idx == 1) {
                this.gameRule.queYiMen = true
                this.gameRule.queMenJiaFan = false
                this.queMenJiaFanTog.interactable = false
                this.queMenJiaFanTog.isChecked = false
            } else {
                this.gameRule.queYiMen = false
                this.queMenJiaFanTog.interactable = true
            }
            CCUtil.setGrayShader(this.queMenJiaFanTog.node, !this.queMenJiaFanTog.interactable);
        } else if (param == "difen") {
            this.onCheckRuleEditScore(this.gameRule, this.difenEdit, 1, 100, "baseScore")
        } else if (param == "weizhunbei") {
            this.gameRule.unReadyKick = event.isChecked ? 10 : 0
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param.indexOf('tuoguan') != -1) { //托管
            let tuoguan = parseInt(param.slice(7));
            this.gameRule.trustTm = tuoguan
        } else if (param == "tongji") { //输赢统计显示
            this.gameRule.tongji = event.isChecked
        } else if (param == "location") { //防作弊 服务器判断
            this.gameRule.showGps = event.isChecked
        } else if (param.includes("fengDing")) {
            this.gameRule.fengDing = parseInt(param.slice(8))
        } else if (param.includes("ziMoType")) {
            this.gameRule.ziMoType = parseInt(param.slice(8))
        } else if (param == "menQingZhongZhang") {
            this.gameRule.menQingZhongZhang = event.isChecked
        } else if (param == "lianGang") {
            this.gameRule.lianGang = event.isChecked
        } else if (param == "xiaoFeiYang") {
            this.gameRule.xiaoFeiYang = event.isChecked
        } else if (param == "dianPaoKePingHu") {
            this.gameRule.dianPaoKePingHu = event.isChecked
        } else if (param == "queMenJiaFan") {
            this.gameRule.queMenJiaFan = event.isChecked
        } else if (param == "haiDi") {
            this.gameRule.haiDi = event.isChecked
        } else if (param == "huanSanZhang") {
            this.gameRule.huanSanZhang = event.isChecked
        } else if (param == "moPaiBaiPai") {
            this.gameRule.moPaiBaiPai = event.isChecked
        }
        // console.log('xcmj_GAME_RULE', this.gameRule);
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

    getRule() {
        return this.gameRule;
    }

});