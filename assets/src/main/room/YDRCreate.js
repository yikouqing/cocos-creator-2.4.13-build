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
        jushuTog16: cc.Toggle,
        renshuTog2: cc.Toggle,
        renshuTog3: cc.Toggle,
        renshuTog4: cc.Toggle,
        difenEdit: cc.EditBox,
        yuyinTog: cc.Toggle,
        fangzuobiTog: cc.Toggle,
        tupguanTog0: cc.Toggle,
        tupguanTog30: cc.Toggle,
        tupguanTog60: cc.Toggle,
        tupguanTog90: cc.Toggle,
        tongjiTog: cc.Toggle,
        locationTog: cc.Toggle,
        weizhunbeiTog: cc.Toggle,
        qiPaiTypeTog1: cc.Toggle,
        qiPaiTypeTog2: cc.Toggle,
        caiShenCountTog0: cc.Toggle,
        caiShenCountTog1: cc.Toggle,
        caiShenCountTog2: cc.Toggle,
        caiShenCountTog3: cc.Toggle,
        rateTypeTog1: cc.Toggle,
        rateTypeTog2: cc.Toggle,
        baoZiPeiTypeTog0: cc.Toggle,
        baoZiPeiTypeTog1: cc.Toggle,
        gameMaxRateTog0: cc.Toggle,
        gameMaxRateTog3: cc.Toggle,
        gameMaxRateTog4: cc.Toggle,
        gameMaxRateTog5: cc.Toggle,
        lianFanQiTog: cc.Toggle,
        xinBaPiTog: cc.Toggle,
        xin16HeiTog: cc.Toggle,
        lianFanTiaoTog: cc.Toggle,
        biPengTog: cc.Toggle,

    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 8,
            maxPlayerCount: 3,
            minPlayerCount: 3,
            gameType: Enums.bundleType.YDR,
            trustTm: 0,
            canEnter: false,
            yuyin: false,
            wanfa: 3,
            baseScore: 1,
            fangzuobi: false,
            unReadyKick: 0, //10秒未准备踢出用户
            /**输赢统计 */
            tongji: false,
            location: false,
            gameMaxRate: 3, //最大番薯
            baoZiPeiType: 1, //0: 包子不赔 1 包子全赔
            qiPaiType: 1, //1 先起再偷  2 先偷再起
            caiShenCount: 0, //
            rateType: 1, //1提坎蕃2蕃乘蕃 
            lianFanQi: true, //不选则有蕃必起
            xinBaPi: false,
            xin16Hei: false,
            lianFanTiao: false,
            biPeng: false, //不选没有蕃被档不能跳
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
            this.gameRule.canEnter = true;
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
        this.yuyinTog.isChecked = !!this.gameRule.yuyin;
        this.fangzuobiTog.isChecked = !!this.gameRule.fangzuobi;
        this.tongjiTog.isChecked = !!this.gameRule.tongji
        this.locationTog.isChecked = !!this.gameRule.location
        this.weizhunbeiTog.isChecked = this.gameRule.unReadyKick > 0

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
        this.tongjiTog.isChecked = this.gameRule.tongji
        /**防作弊 */
        this.locationTog.isChecked = this.gameRule.location

        let setTog = (name, isChecked = true) => {
            let tog = this[name]
            if (tog) tog.isChecked = isChecked
        }
        /**起牌 */
        setTog("qiPaiTypeTog" + this.gameRule.qiPaiType)
        /**财神 */
        setTog("caiShenCountTog" + this.gameRule.caiShenCount)
        /**算番 */
        setTog("rateTypeTog" + this.gameRule.rateType)
        /**包子 */
        setTog("baoZiPeiTypeTog" + this.gameRule.baoZiPeiType)
        /**封顶 */
        setTog("gameMaxRateTog" + this.gameRule.gameMaxRate)
        /**玩法 */
        setTog("lianFanQiTog", this.gameRule.lianFanQi)
        setTog("xinBaPiTog", this.gameRule.xinBaPi)
        setTog("xin16HeiTog", this.gameRule.xin16Hei)
        setTog("lianFanTiaoTog", this.gameRule.lianFanTiao)
        setTog("biPengTog", this.gameRule.biPeng)
    },

    updateCost() {
        let bureau = this.gameRule.bureau;
        this.gameRule.canEnter = false;
        let diamondCount = 1;
        if (bureau === 9999) {
            diamondCount = 1;
            this.gameRule.canEnter = true;
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
        } else if (param == 'yuyin') {
            this.gameRule.yuyin = event.isChecked;
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
            this.gameRule.location = event.isChecked
        } else if (param.indexOf('gameMaxRate') != -1) {
            this.gameRule.gameMaxRate = parseInt(param.slice(11))
        } else if (param.indexOf('baoZiPeiType') != -1) {
            this.gameRule.baoZiPeiType = parseInt(param.slice(12))
        } else if (param.indexOf('qiPaiType') != -1) {
            this.gameRule.qiPaiType = parseInt(param.slice(9))
        } else if (param.indexOf('caiShenCount') != -1) {
            this.gameRule.caiShenCount = parseInt(param.slice(12))
        } else if (param.indexOf('rateType') != -1) {
            this.gameRule.rateType = parseInt(param.slice(8))
        } else if (param == "lianFanQi") {
            this.gameRule.lianFanQi = event.isChecked
        } else if (param == "xinBaPi") {
            this.gameRule.xinBaPi = event.isChecked
        } else if (param == "xin16Hei") {
            this.gameRule.xin16Hei = event.isChecked
        } else if (param == "lianFanTiao") {
            this.gameRule.lianFanTiao = event.isChecked
        } else if (param == "biPeng") {
            this.gameRule.biPeng = event.isChecked
        }
        // console.log('YDR_GAME_RULE', this.gameRule);
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