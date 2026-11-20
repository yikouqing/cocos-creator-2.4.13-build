const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const Utils = require('../../utils/Utils');
const { Def_Mjnn } = require('../../const/Defines');

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
        renshuTog4: cc.Toggle,
        renshuTog6: cc.Toggle,
        renshuTog8: cc.Toggle,
        jingDianTog: cc.Toggle,
        jingDianWangLaiTog: cc.Toggle,
        fengKuangWangLaiTog: cc.Toggle,
        baseScoreEdit: cc.EditBox,
        pourScoreTogs: [cc.Toggle],
        pourScoreLbls: [cc.Label],
        minPlayerTogs: [cc.Toggle],
        robLimitTogs: [cc.Toggle],
        tuizhuPannel: cc.Node,
        tuiScaleTog0: cc.Toggle,
        tuiScaleTog5: cc.Toggle,
        tuiScaleTog10: cc.Toggle,
        tuiScaleTog15: cc.Toggle,
        tuiScaleTog20: cc.Toggle,
        cuopaiTog: cc.Toggle,
        jinrenTog: cc.Toggle,
        guanzhanTog: cc.Toggle,
        yuyinTog: cc.Toggle,
        tuoGuanTog: cc.Toggle,
        fangzuobiTog: cc.Toggle,
        tongjiTog: cc.Toggle,
        locationTog: cc.Toggle,
        lastLimitTog: cc.Toggle,
        pourLimitTog: cc.Toggle,
        anZhuangTog: cc.Toggle,
        pourDoubleTog: cc.Toggle,
        jiSuModeTog: cc.Toggle,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 10,
            minPlayerCount: 2,
            maxPlayerCount: 4,
            gameType: Enums.bundleType.MJNN,
            gameFrameType: Def_Mjnn.gameFrameType.ZHIYOUQZ,
            canPourScores: [], //可下注分数
            canPourScoresIndex: 0, //客户端用
            canTrust: false, //托管
            trustTm: 9999, //托管时间
            canEnter: false, //中途进入
            cuopai: false, //搓牌
            fangzuobi: false, //防作弊
            canWatch: false, //观战
            payDiamond: 1, //钻石
            yuyin: false, //语音
            baseScore: 0.1, //底分
            tuizhu: false, //推注
            tuiScale: 0, //推注倍数
            robBankLimit: 1, //抢庄倍数限制 
            ziyouju: false, //自由局
            gameMode: 0, //游戏模式 经典模式 经典王赖模式 疯狂王赖模式 新增
            jiaSuMoShi: false, //正常模式 极速模式 
            tongji: false, //输赢统计
            location: false, //定位
            lastThreeJoin: false, //最后三局禁入
            isAnZhuangQiangZhuang: false, //暗庄抢庄 新增
            isPourDouble: false, //下注加倍 新增
            isPourLimit: false //下注限制 新增
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
        if (this.gameRule.maxPlayerCount == 6) {
            this.renshuTog6.isChecked = true;
        } else if (this.gameRule.maxPlayerCount == 8) {
            this.renshuTog8.isChecked = true;
        } else {
            this.renshuTog4.isChecked = true;
        }
        this.baseScoreEdit.string = this.gameRule.baseScore;
        //游戏模式
        if (this.gameRule.gameMode == 1) {
            this.jingDianWangLaiTog.isChecked = true;
        } else if (this.gameRule.gameMode == 2) {
            this.fengKuangWangLaiTog.isChecked = true;
        } else {
            this.gameRule.gameMode = 0;
            this.jingDianTog.isChecked = true;
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        // 极速模式
        this.jiSuModeTog.isChecked = !!this.gameRule.jiaSuMoShi;
        //默认两人开
        if (this.gameRule.minPlayerCount != 3 && this.gameRule.minPlayerCount != 4) this.gameRule.minPlayerCount = 2;
        if (this.minPlayerTogs[this.gameRule.minPlayerCount]) this.minPlayerTogs[this.gameRule.minPlayerCount].isChecked = true;
        this.gameRule.canPourScoresIndex = this.gameRule.canPourScoresIndex || 0;
        if (!!this.pourScoreTogs[this.gameRule.canPourScoresIndex]) this.pourScoreTogs[this.gameRule.canPourScoresIndex].isChecked = true;
        this.updatePourScores();
        this.gameRule.robBankLimit = this.gameRule.robBankLimit || 1;
        if (!!this.robLimitTogs[this.gameRule.robBankLimit - 1]) this.robLimitTogs[this.gameRule.robBankLimit - 1].isChecked = true;
        /* 翻倍 */
        this.pourDoubleTog.isChecked = this.gameRule.isPourDouble;
        this.anZhuangTog.isChecked = this.gameRule.isAnZhuangQiangZhuang;
        this.pourLimitTog.isChecked = this.gameRule.isPourLimit;
        /* 高级 */
        this.cuopaiTog.isChecked = this.gameRule.cuopai;
        this.jinrenTog.isChecked = this.gameRule.canEnter;
        if (!!this.gameRule.canEnter) {
            this.lastLimitTog.interactable = true;
            this.lastLimitTog.isChecked = !!this.gameRule.lastThreeJoin;
        } else {
            this.lastLimitTog.interactable = false;
            this.lastLimitTog.isChecked = false;
        }
        this.guanzhanTog.isChecked = this.gameRule.canWatch;
        this.yuyinTog.isChecked = this.gameRule.yuyin;
        /* 托管 */
        this.tuoGuanTog.isChecked = !!this.gameRule.canTrust;
        this.fangzuobiTog.isChecked = this.gameRule.fangzuobi;
        /**输赢统计 */
        this.tongjiTog.isChecked = this.gameRule.tongji
        /**防作弊 */
        this.locationTog.isChecked = this.gameRule.location
    },

    updateTuiScale() {
        if (!this.tuizhuPannel.active) return;
        this.gameRule.tuiScale = this.gameRule.tuizhu && this.gameRule.tuiScale > 0 ? this.gameRule.tuiScale : 0;
        if (this.gameRule.tuiScale == 5) {
            this.tuiScaleTog5.isChecked = true;
        } else if (this.gameRule.tuiScale == 10) {
            this.tuiScaleTog10.isChecked = true;
        } else if (this.gameRule.tuiScale == 15) {
            this.tuiScaleTog15.isChecked = true;
        } else if (this.gameRule.tuiScale == 20) {
            this.tuiScaleTog20.isChecked = true;
        } else {
            this.gameRule.tuizhu = false;
            this.tuiScaleTog0.isChecked = true;
        }
    },

    updateCost() {
        let bureau = this.gameRule.bureau;
        let diamondCount = 2
        if (bureau === 20) diamondCount = 3
        if (bureau === 30) diamondCount = 6
        this.gameRule.payDiamond = diamondCount;
    },

    onButtonClick(event, param) {
        if (param.indexOf('bureau') != -1) {
            let bureau = parseInt(param.split('_')[1]);
            this.gameRule.bureau = bureau;
            this.updateCost();
        } else if (param.indexOf('dangzhuang') != -1) {
            this.gameRule.gameFrameType = parseInt(param.slice(6));
        } else if (param.indexOf('member') != -1) {
            this.gameRule.maxPlayerCount = parseInt(param.slice(6));
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param == 'jinren') {
            this.gameRule.canEnter = event.isChecked;
            if (!!this.gameRule.canEnter) {
                this.lastLimitTog.interactable = true;
            } else {
                this.gameRule.lastThreeJoin = false;
                this.lastLimitTog.isChecked = false;
                this.lastLimitTog.interactable = false;
            }
        } else if (param == 'lastlimit') {
            this.gameRule.lastThreeJoin = !!event.isChecked;
        } else if (param == 'guanzhan') {
            this.gameRule.canWatch = event.isChecked;
        } else if (param == 'cuopai') {
            this.gameRule.cuopai = event.isChecked;
        } else if (param == 'tuoguan') {
            this.gameRule.canTrust = event.isChecked;
        } else if (param == 'yuyin') {
            this.gameRule.yuyin = event.isChecked;
        } else if (param.indexOf('tuiscale') != -1) {
            let tuiScale = parseInt(param.slice(8));
            this.gameRule.tuizhu = tuiScale > 0;
            this.gameRule.tuiScale = tuiScale;
            this.tuizhuPannel.active = false;
        } else if (param == 'tuizhupannel') {
            this.tuizhuPannel.active = !this.tuizhuPannel.active;
            this.updateTuiScale();
        } else if (param == 'fangzuobi') {
            this.gameRule.fangzuobi = event.isChecked;
        } else if (param == "tongji") { //输赢统计显示
            this.gameRule.tongji = event.isChecked;
        } else if (param == "location") { //防作弊 服务器判断
            this.gameRule.location = event.isChecked;
        } else if (param.indexOf('gamemode') != -1) {
            let gameMode = parseInt(param.slice(8));
            this.gameRule.gameMode = gameMode;
        } else if (param.indexOf('fen') != -1) {
            this.gameRule.canPourScoresIndex = parseInt(param.slice(3));
            this.updatePourScores();
        } else if (param.indexOf('start') != -1) {
            this.gameRule.minPlayerCount = parseInt(param.slice(5));
        } else if (param.indexOf('roblimit') != -1) {
            this.gameRule.robBankLimit = parseInt(param.slice(8));
        } else if (param == 'pourlimit') {
            this.gameRule.isPourLimit = event.isChecked;
        } else if (param == 'anzhuang') {
            this.gameRule.isAnZhuangQiangZhuang = event.isChecked;
        } else if (param == 'xiazhujiabei') {
            this.gameRule.isPourDouble = event.isChecked;
        } else if (param == 'kuaisu') {
            this.gameRule.jiaSuMoShi = event.isChecked;
        } else if (param == 'basescore') {
            this.onScoreEditCheck(this.baseScoreEdit, Enums.editInput.FLOAT, 0.1, 100, 'baseScore');
        }
        ConfigModel.setRoomCreateCache(this.gameRule);
    },

    onScoreEditCheck(editBox, type, min, max, key) {
        let score = null;
        if (type == Enums.editInput.INT) {
            score = parseInt(editBox.string)
        } else if (type == Enums.editInput.FLOAT) {
            score = parseFloat(editBox.string)
        }
        if (isNaN(score) || score > max || score < min) {
            editBox.string = min.toString();
            score = min;
            AssetsManager.tipDialog(`输入错误,请输入${min}-${max}的数!`);
        }
        this.gameRule[key] = Utils.formatNumberWithDecimal(score, 1);
    },

    updatePourScores() {
        let pourScoresConfig = Def_Mjnn.pourScores;
        if (!pourScoresConfig) return;
        pourScoresConfig.forEach((val, index, arr) => {
            this.pourScoreLbls[index].string = val;
        });
        let canPourScoresIndex = this.gameRule.canPourScoresIndex || 0;
        let pourConfig = pourScoresConfig[canPourScoresIndex];
        if (!pourConfig) return;
        let pourArray = pourConfig.split('/');
        let canPourScores = [];
        pourArray.forEach((val) => {
            canPourScores.push(parseFloat(val));
        });
        this.gameRule.canPourScores = canPourScores;
    },

    getRule() {
        return this.gameRule;
    }

});