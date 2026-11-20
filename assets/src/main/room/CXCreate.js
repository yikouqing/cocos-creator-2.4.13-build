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
        renshuTog4: cc.Toggle,
        renshuTog6: cc.Toggle,
        renshuTog8: cc.Toggle,
        scoreTog2: cc.Toggle,
        scoreTog5: cc.Toggle,
        scoreTog10: cc.Toggle,
        scoreTog20: cc.Toggle,
        scoreTog50: cc.Toggle,
        scoreTog100: cc.Toggle,
        bringTog100: cc.Toggle,
        bringTog200: cc.Toggle,
        bringTog300: cc.Toggle,
        bringTog400: cc.Toggle,
        bringTog500: cc.Toggle,
        bringTog1000: cc.Toggle,
        mangoRateTog0: cc.Toggle,
        mangoRateTog1: cc.Toggle,
        mangoRateTog2: cc.Toggle,
        mangoRateTog3: cc.Toggle,
        mangoRateTog4: cc.Toggle,
        mangoRateTog5: cc.Toggle,
        djwTog: cc.Toggle,
        qmzmTog: cc.Toggle,
        bfkxTog: cc.Toggle,
        ckdpTog: cc.Toggle,
        jinrenTog: cc.Toggle,
        guanzhanTog: cc.Toggle,
        sceneTog1: cc.Toggle,
        sceneTog2: cc.Toggle,
        lastLimitTog: cc.Toggle,
        peiFenLay: cc.Node,
        peiEdit: cc.EditBox,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 10,
            minPlayerCount: 2,
            maxPlayerCount: 8,
            gameType: Enums.bundleType.CX,
            scaleType: 1,
            canTrust: false,
            trustTm: 15,
            canEnter: false,
            canWatch: true,
            yuyin: false,
            baseScore: 1, //皮数|底分
            fangzuobi: false,
            bringScore: 100, //带入分
            isDiJiuWang: false, //地九王
            isQuanMangZouMang: false, //圈芒|揍芒
            isBiFaKeXiu: false, //必发招|可休
            isChaKanDiPai: false, //查看底牌
            mangoRate: 1, //芒果倍数
            tongji: false,
            showGps: false,
            sceneType: Enums.deviceOrientation.H, //h-横屏 v-竖屏
            lastThreeJoin: false,
            createAndWatch: true,
            peiScore: 1000
        };
        this.updateCost();
    },

    start() {
        this.peiFenLay.active = !this.node.nodeParams.isUnion || (!!this.node.nodeParams.unionInfo && this.node.nodeParams.unionInfo.unionType == Enums.UnionType.NORMAL);
        this.fangfeiPannel.active = !(!!this.node.nodeParams && !!this.node.nodeParams.isUnion); //自由场
        this.gameRule = !!this.node.nodeParams && !!this.node.nodeParams.gameRule ? this.node.nodeParams.gameRule : this.gameRule;
        this.init();
    },

    init() {
        /* 局数设置 */
        if (this.gameRule.bureau == 20) {
            this.jushuTog20.isChecked = true;
        } else {
            this.jushuTog10.isChecked = false;
        }
        /* 人数 */
        if (this.gameRule.maxPlayerCount === 4) {
            this.renshuTog4.isChecked = true;
        } else if (this.gameRule.maxPlayerCount === 6) {
            this.renshuTog6.isChecked = true;
        } else if (this.gameRule.maxPlayerCount === 8) {
            this.renshuTog8.isChecked = true;
        } else {
            this.renshuTog2.isChecked = true;
        }
        //底分
        if (this.gameRule.baseScore == 5) {
            this.scoreTog5.isChecked = true;
        } else if (this.gameRule.baseScore == 10) {
            this.scoreTog10.isChecked = true;
        } else if (this.gameRule.baseScore == 20) {
            this.scoreTog20.isChecked = true;
        } else if (this.gameRule.baseScore == 50) {
            this.scoreTog50.isChecked = true;
        } else if (this.gameRule.baseScore == 100) {
            this.scoreTog100.isChecked = true;
        } else {
            this.scoreTog2.isChecked = true;
        }
        //芒果倍数
        if (this.gameRule.mangoRate == 1) {
            this.mangoRateTog1.isChecked = true;
        } else if (this.gameRule.mangoRate == 2) {
            this.mangoRateTog2.isChecked = true;
        } else if (this.gameRule.mangoRate == 3) {
            this.mangoRateTog3.isChecked = true;
        } else if (this.gameRule.mangoRate == 4) {
            this.mangoRateTog4.isChecked = true;
        } else if (this.gameRule.mangoRate == 5) {
            this.mangoRateTog5.isChecked = true;
        } else {
            this.mangoRateTog0.isChecked = true;
        }
        //带入
        if (this.gameRule.bringScore == 200) {
            this.bringTog200.isChecked = true;
        } else if (this.gameRule.bringScore == 300) {
            this.bringTog300.isChecked = true;
        } else if (this.gameRule.bringScore == 400) {
            this.bringTog400.isChecked = true;
        } else if (this.gameRule.bringScore == 500) {
            this.bringTog500.isChecked = true;
        } else if (this.gameRule.bringScore == 1000) {
            this.bringTog1000.isChecked = true;
        } else {
            this.bringTog100.isChecked = true;
        }
        //屏幕方向
        if (this.gameRule.sceneType == Enums.deviceOrientation.V) {
            this.sceneTog2.isChecked = true;
        } else {
            this.sceneTog1.isChecked = true;
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        this.gameRule.peiScore = this.gameRule.peiScore || 1000;
        if (this.gameRule.bringScore > this.gameRule.peiScore) this.gameRule.peiScore = this.gameRule.bringScore;
        this.peiEdit.string = `${this.gameRule.peiScore}`;
        //玩法
        this.djwTog.isChecked = !!this.gameRule.isDiJiuWang;
        this.qmzmTog.isChecked = !!this.gameRule.isQuanMangZouMang;
        this.bfkxTog.isChecked = !!this.gameRule.isBiFaKeXiu;
        this.ckdpTog.isChecked = !!this.gameRule.isChaKanDiPai;
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
        /**输赢统计 */
        /**防作弊 */
    },

    updateCost() {
        let bureau = this.gameRule.bureau;
        let diamondCount = bureau == 10 ? 2 : 3;
        this.gameRule.payDiamond = diamondCount;
    },

    onButtonClick(event, param) {
        if (param.indexOf('bureau') != -1) {
            this.gameRule.bureau = parseInt(param.split('_')[1]);
            this.updateCost();
        } else if (param.indexOf('member') != -1) {
            this.gameRule.maxPlayerCount = parseInt(param.slice(6));
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
        } else if (param == 'guanzhan') {
            this.gameRule.canWatch = event.isChecked;
        } else if (param == 'yuyin') {
            this.gameRule.yuyin = event.isChecked;
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param == 'fangzuobi') {
            this.gameRule.fangzuobi = event.isChecked;
        } else if (param.indexOf('pishu') != -1) {
            this.gameRule.baseScore = parseInt(param.slice(5));
        } else if (param.indexOf('dairu') != -1) {
            this.gameRule.bringScore = parseInt(param.slice(5));
            if (this.gameRule.bringScore > this.gameRule.peiScore) this.gameRule.peiScore = this.gameRule.bringScore;
            this.peiEdit.string = `${this.gameRule.peiScore}`;
        } else if (param.indexOf('mangguo') != -1) {
            this.gameRule.mangoRate = parseInt(param.slice(7));
        } else if (param.indexOf('scene') != -1) {
            this.gameRule.sceneType = parseInt(param.slice(5)) == 2 ? Enums.deviceOrientation.V : Enums.deviceOrientation.H;
        } else if (param == 'ckdp') {
            this.gameRule.isChaKanDiPai = event.isChecked;
        } else if (param == 'dijiuwang') {
            this.gameRule.isDiJiuWang = event.isChecked;
        } else if (param == 'lastlimit') {
            this.gameRule.lastThreeJoin = !!event.isChecked;
        } else if (param == 'qmzm') {
            this.gameRule.isQuanMangZouMang = event.isChecked;
        } else if (param == 'bfkx') {
            this.gameRule.isBiFaKeXiu = event.isChecked;
        } else if (param == 'djwrule') {
            AssetsManager.popDialog({
                content: `勾选后2和9组合的牌型按照地九王牌型计算，否则算1点。`,
                ok: () => { }
            });
        } else if (param == 'qmrule') {
            AssetsManager.popDialog({
                content: `圈芒:拿出一定分值座位「芒果」，由获胜玩家获得。\n揍芒:在第一轮过招中，某玩家发招凶猛，其他玩家无法接招，全成皮。这种情况，需要打揍芒。由除这盘吃皮的玩家之外的所有玩家，拿出一定的分值，放到桌面中间，作为下一盘的皮。这叫『丢芒果』。芒果由下一盘吃皮的玩家吃掉。`,
                ok: () => { }
            });
        } else if (param == 'bfkxrule') {
            AssetsManager.popDialog({
                content: `在任何一轮过招中，牌局休过河，则所有玩家都需要丢芒果，作为下一盘的皮。`,
                ok: () => { }
            });
        } else if (param == "tongji") { //输赢统计显示
            this.gameRule.tongji = event.isChecked
        } else if (param == "location") { //防作弊 服务器判断
            this.gameRule.showGps = event.isChecked
        } else if (param == "peiscore") {
            let peiScore = parseFloat(this.peiEdit.string);
            if (isNaN(peiScore)) peiScore = 1000;
            peiScore = Utils.formatNumberWithDecimal(peiScore, 1);
            this.gameRule.peiScore = `${peiScore}`;
            if (this.gameRule.bringScore > this.gameRule.peiScore) this.gameRule.peiScore = this.gameRule.bringScore;
            this.peiEdit.string = `${this.gameRule.peiScore}`;
        }
        // console.log('this.gameRule', this.gameRule);
        ConfigModel.setRoomCreateCache(this.gameRule);
    },


    getRule() {
        return this.gameRule;
    }

});