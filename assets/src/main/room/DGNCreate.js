const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const CCUtil = require('../../utils/CCUtil');
const Utils = require("../../utils/Utils");
const { Def_Dgn } = require('../../const/Defines');

cc.Class({
    extends: cc.Component,

    properties: {
        fangfeiPannel: cc.Node,
        hostPayTog: cc.Toggle,
        aaPayTog: cc.Toggle,
        winPayTog: cc.Toggle,
        rulePannel: cc.Node,
        tonghuashunRate: cc.Label,
        tonghuashunTog: cc.Toggle,
        yitiaolongRate: cc.Label,
        yitiaolongTog: cc.Toggle,
        zhadanRate: cc.Label,
        zhadanTog: cc.Toggle,
        wuxiaoniuRate: cc.Label,
        wuxiaoniuTog: cc.Toggle,
        huluniuRate: cc.Label,
        huluniuTog: cc.Toggle,
        wuhuaniuRate: cc.Label,
        wuhuaniuTog: cc.Toggle,
        tonghuaniuRate: cc.Label,
        tonghuaniuTog: cc.Toggle,
        shunziniuRate: cc.Label,
        shunziniuTog: cc.Toggle,
        jushuTog1: cc.Toggle,
        jushuTog2: cc.Toggle,
        jushuTog3: cc.Toggle,
        renshuTog1: cc.Toggle,
        renshuTog2: cc.Toggle,
        renshuTog3: cc.Toggle,
        shouzhuangTog50: cc.Toggle,
        shouzhuangTog100: cc.Toggle,
        shouzhuangTog200: cc.Toggle,
        shouzhuangTog400: cc.Toggle,
        shouzhuangTog500: cc.Toggle,
        shouzhuangTog1000: cc.Toggle,
        shouzhuangTog2000: cc.Toggle,
        shouzhuangTog4000: cc.Toggle,
        shoujudiTog1: cc.Toggle,
        shoujudiTog2: cc.Toggle,
        shouhoudiTog1: cc.Toggle,
        shouhoudiTog2: cc.Toggle,
        scaleTog1: cc.Toggle,
        scaleTog2: cc.Toggle,
        scaleTog3: cc.Toggle,
        lianzhuangTog1: cc.Toggle,
        lianzhuangTog2: cc.Toggle,
        shengzhuangshuTog1: cc.Toggle,
        shengzhuangshuTog2: cc.Toggle,
        xiazhuangfenEdit: cc.EditBox,
        guanzhanTog: cc.Toggle,
        jinrenTog: cc.Toggle,
        cuopaiTog: cc.Toggle,
        tuoguanTog: cc.Toggle,
        lastLimitTog: cc.Toggle,
    },

    onLoad() {
        this.gameRule = {
            bureau: 10,
            minPlayerCount: 2,
            maxPlayerCount: 6,
            gameType: Enums.bundleType.DGN,
            scaleType: Def_Dgn.scaleType.LITTLE,
            payType: Enums.roomPayType.WOZHIFU,
            canTrust: false,
            trustTm: 9999,
            canEnter: false,
            cuopai: false,
            cardsType: {
                MEINIU: Def_Dgn.cardsType.MEINIU,
                YOUNIU: Def_Dgn.cardsType.YOUNIU,
                NIUNIU: Def_Dgn.cardsType.NIUNIU,
            },
            fangzuobi: false,
            firstBureauRate: 0.1,
            /* 首局下分最小比例 */
            bureauRate: 0.1,
            /* 下分最小比例 */
            beBankerScores: [50, 100, 200, 400, 500, 1000, 2000, 4000],
            shouzhuang: 200,
            /* 首庄大小 */
            lianzhuangType: Def_Dgn.lianzhuangType.SHENGZHUANG,
            /* 连庄类型 */
            lianzhuangCount: 1,
            /* 连庄次数 */
            canWatch: false,
            /* 允许观战 */
            payDiamond: 1,
            yuyin: false,
            baseScore: 1,
            xiazhuangfen: 0,
            /* 自由局 */
            ziyouju: false,
            /**输赢统计 */
            tongji: false,
            showGps: false,
            lastThreeJoin: false
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
            this.jushuTog2.isChecked = true;
        } else if (this.gameRule.bureau == 30) {
            this.jushuTog3.isChecked = true;
        } else {
            this.jushuTog1.isChecked = true;
        }
        /* 人数 */
        if (this.gameRule.maxPlayerCount == 8) {
            this.renshuTog2.isChecked = true;
        } else if (this.gameRule.maxPlayerCount == 10) {
            this.renshuTog3.isChecked = true;
        } else {
            this.renshuTog1.isChecked = true;
        }
        if (this.gameRule.shouzhuang == 100) {
            this.shouzhuangTog100.isChecked = true;
        } else if (this.gameRule.shouzhuang == 200) {
            this.shouzhuangTog200.isChecked = true;
        } else if (this.gameRule.shouzhuang == 400) {
            this.shouzhuangTog400.isChecked = true;
        } else if (this.gameRule.shouzhuang == 500) {
            this.shouzhuangTog500.isChecked = true;
        } else if (this.gameRule.shouzhuang == 1000) {
            this.shouzhuangTog1000.isChecked = true;
        } else if (this.gameRule.shouzhuang == 2000) {
            this.shouzhuangTog2000.isChecked = true;
        } else if (this.gameRule.shouzhuang == 4000) {
            this.shouzhuangTog50.isChecked = true;
        } else {
            this.shouzhuangTog50.isChecked = true;
        }

        /* 首局底注 */
        if (this.gameRule.firstBureauRate == 0.2) {
            this.shoujudiTog2.isChecked = true;
        } else {
            this.shoujudiTog1.isChecked = true;
        }

        /* 非首局底注 */
        if (this.gameRule.bureauRate == 0.05) {
            this.shouhoudiTog1.isChecked = true;
        } else {
            this.shouhoudiTog2.isChecked = true;
        }

        /* 连庄模式 */
        if (this.gameRule.lianzhuangType == Def_Dgn.lianzhuangType.LUNZHUANG) {
            this.lianzhuangTog2.isChecked = true;
        } else {
            this.lianzhuangTog1.isChecked = true;
        }

        /* 连庄次数 */
        if (this.gameRule.lianzhuangCount == 2) {
            this.shengzhuangshuTog2.isChecked = true;
        } else {
            this.shengzhuangshuTog1.isChecked = true;
        }

        /* 翻倍 */
        if (this.gameRule.scaleType == Def_Dgn.scaleType.BIG) {
            this.scaleTog2.isChecked = true;
        } else if (this.gameRule.scaleType == Def_Dgn.scaleType.DIANZI) {
            this.scaleTog3.isChecked = true;
        } else {
            this.scaleTog1.isChecked = true;
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        /* 特殊 */
        this.tonghuashunTog.isChecked = this.gameRule.cardsType.TONGHUASHUN;
        this.yitiaolongTog.isChecked = this.gameRule.cardsType.YITIAOLONG;
        this.zhadanTog.isChecked = this.gameRule.cardsType.ZHADANNIU;
        this.wuxiaoniuTog.isChecked = this.gameRule.cardsType.WUXIAONIU;
        this.huluniuTog.isChecked = this.gameRule.cardsType.HULUNIU;
        this.wuhuaniuTog.isChecked = this.gameRule.cardsType.WUHUANIU;
        this.tonghuaniuTog.isChecked = this.gameRule.cardsType.TONGHUANIU;
        this.shunziniuTog.isChecked = this.gameRule.cardsType.SHUNZINIU;
        /**输赢统计 */
        /**防作弊 */
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
        CCUtil.setGrayShader(this.lastLimitTog.node, !this.lastLimitTog.interactable);
        this.guanzhanTog.isChecked = this.gameRule.canWatch;
        /* 托管 */
        this.tuoguanTog.isChecked = !!this.gameRule.canTrust;
        if (this.gameRule.xiazhuangfen > 0) {
            this.xiazhuangfenEdit.string = "" + this.gameRule.xiazhuangfen;
        }
    },

    updateCost() {
        let bureau = this.gameRule.bureau;
        let diamondCount = 2;
        if (bureau === 10) {
            diamondCount = 2;
        } else if (bureau === 20) {
            diamondCount = 3;
        } else if (bureau === 30) {
            diamondCount = 4;
        }
        this.gameRule.payDiamond = diamondCount;
        // this.diamondCount.string = diamondCount;
    },

    onButtonClick(event, param) {
        if (param.indexOf('bureau') != -1) {
            let bureau = parseInt(param.split('_')[1]);
            this.gameRule.bureau = bureau;
            this.updateCost();
        } else if (['BIG', 'LITTLE', 'DIANZI'].indexOf(param) != -1) {
            this.gameRule.scaleType = Def_Dgn.scaleType[param];
        } else if (param.indexOf('member') != -1) {
            this.gameRule.maxPlayerCount = parseInt(param.slice(6));
            this.updateCost();
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (['SHUNZINIU', 'YINNIU', 'TONGHUANIU', 'WUHUANIU', 'HULUNIU', 'WUXIAONIU', 'ZHADANNIU', 'YITIAOLONG', 'TONGHUASHUN'].indexOf(param) != -1) {
            this.gameRule.cardsType[param] = (event.isChecked) ? Def_Dgn.cardsType[param] : null;
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
        } else if (param == 'cuopai') {
            this.gameRule.cuopai = event.isChecked;
        } else if (param == 'tuoguan') {
            this.gameRule.canTrust = event.isChecked;
        } else if (param == 'yuyin') {
            this.gameRule.yuyin = event.isChecked;
        } else if (param == 'fangzuobi') {
            this.gameRule.fangzuobi = event.isChecked;
        } else if (param == 'tuizhu') {
            this.gameRule.tuizhu = event.isChecked;
        } else if (param == 'lastlimit') {
            this.gameRule.lastThreeJoin = !!event.isChecked;
        } else if (param == 'rulepanel') {
            this.rulePannel.active = !this.rulePannel.active;
            if (this.gameRule.scaleType == Def_Dgn.scaleType.DIANZI) {
                this.tonghuashunRate.string = "同花顺(16倍)";
                this.yitiaolongRate.string = "一条龙(15倍)";
                this.zhadanRate.string = "炸弹牛(14倍)";
                this.wuxiaoniuRate.string = "五小牛(13倍)";
                this.huluniuRate.string = "葫芦牛(12倍)";
                this.wuhuaniuRate.string = "五花牛(11倍)";
                this.tonghuaniuRate.string = "同花牛(11倍)";
                this.shunziniuRate.string = "顺子牛(11倍)";
            } else {
                this.tonghuashunRate.string = "同花顺(10倍)";
                this.yitiaolongRate.string = "一条龙(9倍)";
                this.zhadanRate.string = "炸弹牛(8倍)";
                this.wuxiaoniuRate.string = "五小牛(7倍)";
                this.huluniuRate.string = "葫芦牛(6倍)";
                this.wuhuaniuRate.string = "五花牛(6倍)";
                this.tonghuaniuRate.string = "同花牛(6倍)";
                this.shunziniuRate.string = "顺子牛(4倍)";
            }
        } else if (param == "xiazhuangfen") {
            let num = parseInt(this.xiazhuangfenEdit.string);
            if (isNaN(num) || num < 0) {
                AssetsManager.tipDialog("输入格式不正确！");
                this.xiazhuangfenEdit.string = '';
                return;
            } else {
                this.gameRule.xiazhuangfen = num;
            }
            // console.log('下庄分', num);
        } else if (["shouzhuang_50", "shouzhuang_100", "shouzhuang_200", "shouzhuang_400", "shouzhuang_500", "shouzhuang_1000", "shouzhuang_2000", "shouzhuang_4000"].indexOf(param) != -1) {
            this.gameRule.shouzhuang = parseInt(param.split("_")[1]);
        } else if (["shouju_10", "shouju_20"].indexOf(param) != -1) {
            this.gameRule.firstBureauRate = parseInt(param.split("_")[1]) / 100;
        } else if (["shoujuhou_10", "shoujuhou_5"].indexOf(param) != -1) {
            this.gameRule.bureauRate = parseInt(param.split("_")[1]) / 100;
        } else if (param == "shengzhuang") {
            this.gameRule.lianzhuangType = Def_Dgn.lianzhuangType.SHENGZHUANG;
        } else if (param == "lunzhuang") {
            this.gameRule.lianzhuangType = Def_Dgn.lianzhuangType.LUNZHUANG;
        } else if (param == "lianzhuang_1") {
            this.gameRule.lianzhuangCount = 1;
        } else if (param == "lianzhuang_2") {
            this.gameRule.lianzhuangCount = 2;
        } else if (param == "tongji") { //输赢统计显示
            this.gameRule.tongji = event.isChecked
        } else if (param == "location") { //防作弊 服务器判断
            this.gameRule.showGps = event.isChecked
        }
        // console.log('创建表单-斗公牛', this.gameRule);
        ConfigModel.setRoomCreateCache(this.gameRule);
    },

    getRule() {
        return this.gameRule;
    }

});