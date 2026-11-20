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
        wanFaPannel2: cc.Node,
        wanFaPannel3: cc.Node,
        jiaBeiPannel: cc.Node,
        rangPaiPannel: cc.Node,
        jushuTog8: cc.Toggle,
        jushuTog16: cc.Toggle,
        jushuTog24: cc.Toggle,
        renshuTog2: cc.Toggle,
        renshuTog3: cc.Toggle,
        fengdingTog0: cc.Toggle,
        fengdingTog24: cc.Toggle,
        fengdingTog48: cc.Toggle,
        fengdingTog96: cc.Toggle,
        fengdingTog192: cc.Toggle,
        wangErBiJiaoTog: cc.Toggle,
        quDiaoSanSiWuTog: cc.Toggle,
        wuSiDaiErTog: cc.Toggle,
        buXiPaiTog: cc.Toggle,
        lianZhaTog: cc.Toggle,
        xianShiPaiShuTog: cc.Toggle,
        buDaiJiaBeiTog: cc.Toggle,
        diPaiFanBeiTog: cc.Toggle,
        nongMinYouXianJiaBeiTog: cc.Toggle,
        rangTog0: cc.Toggle,
        rangTog2: cc.Toggle,
        rangTog3: cc.Toggle,
        rangTog4: cc.Toggle,
        rateTog0: cc.Toggle,
        rateTog1: cc.Toggle,
        rateTog2: cc.Toggle,
        buJiaoBuJiaBeiTog: cc.Toggle,
        buJiaoManBuJiaBeiTog: cc.Toggle,
        jiPaiTog: cc.Toggle,
        difenEdit: cc.EditBox,
        laiziTog: cc.Toggle,
        dianshuEdit: cc.EditBox,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 8,
            minPlayerCount: 3,
            maxPlayerCount: 3,
            gameType: Enums.bundleType.DDZ,
            scaleType: 1,
            canTrust: false,
            trustTm: 15,
            canEnter: false,
            canWatch: false,
            yuyin: false,
            baseScore: 1, //底分
            fangzuobi: false,
            showGps: false,
            sceneType: Enums.deviceOrientation.H, //h-横屏 v-竖屏
            maxRate: 24, //封顶
            isWangErBiJiao: false, //俩王四个2必叫
            isSanSiWuFilter: false, //去掉三四五
            isSiDaiEr: true, //四带二
            isWashCard: false, //不洗牌
            isLianZha: false, //连炸
            isShowCardCount: false, //显示剩余牌数
            isBuDaiJiaBei: false, //不带加倍
            isDiPaiFanBei: false, //底牌翻倍
            isNongMinRateFirst: false, //农民优先加倍
            rangPaiCount: 0, //让牌张数
            rateType: 0, //0-不能加倍 1-自由加倍 2-农民优先
            isBuJiaoBuJiaBei: false, //不叫不能加倍
            isBuJiaoManBuJiaBei: false, //不叫满不能加倍
            isCardRecorder: false, //记牌器
            tongji: false,
            isLai: false,
            laiZiList: [],
        };
        this.updateCost();
    },

    start() {
        this.fangfeiPannel.active = !(!!this.node.nodeParams && !!this.node.nodeParams.isUnion); //自由场
        this.gameRule = !!this.node.nodeParams && !!this.node.nodeParams.gameRule ? this.node.nodeParams.gameRule : this.gameRule;
        this.init();
    },

    init() {
        /* 局数设置 */
        if (this.gameRule.bureau == 16) {
            this.jushuTog16.isChecked = true;
        } else if (this.gameRule.bureau == 24) {
            this.jushuTog24.isChecked = true;
        } else {
            this.jushuTog8.isChecked = true;
        }
        /* 人数 */
        if (this.gameRule.maxPlayerCount === 3) {
            this.renshuTog3.isChecked = true;
            this.wanFaPannel3.active = true;
            this.wanFaPannel2.active = false;
            this.rangPaiPannel.active = false;
            this.jiaBeiPannel.active = true;
            this.wangErBiJiaoTog.isChecked = !!this.gameRule.isWangErBiJiao;
            this.quDiaoSanSiWuTog.isChecked = !!this.gameRule.isSanSiWuFilter;
            this.wuSiDaiErTog.isChecked = !this.gameRule.isSiDaiEr;
            this.buXiPaiTog.isChecked = !this.gameRule.isWashCard;
            this.lianZhaTog.isChecked = !!this.gameRule.isLianZha;
            this.xianShiPaiShuTog.isChecked = !!this.gameRule.isShowCardCount;
            this.buDaiJiaBeiTog.isChecked = false;
            this.diPaiFanBeiTog.isChecked = false;
            this.nongMinYouXianJiaBeiTog.isChecked = false;
            if (!this.gameRule.isWashCard) {
                this.lianZhaTog.interactable = true;
            } else {
                this.lianZhaTog.isChecked = false;
                this.lianZhaTog.interactable = false;
                this.gameRule.isLianZha = false;
            }
            CCUtil.setGrayShader(this.lianZhaTog.node, !this.lianZhaTog.interactable);
            if (this.gameRule.rateType == 1) {
                this.rateTog1.isChecked = true;
                this.buJiaoBuJiaBeiTog.isChecked = false;
                this.buJiaoBuJiaBeiTog.interactable = false;
                this.buJiaoManBuJiaBeiTog.isChecked = false;
                this.buJiaoManBuJiaBeiTog.interactable = false;
            } else if (this.gameRule.rateType == 2) {
                this.rateTog2.isChecked = true;
                this.buJiaoBuJiaBeiTog.isChecked = !!this.gameRule.isBuJiaoBuJiaBei;
                this.buJiaoBuJiaBeiTog.interactable = true;
                this.buJiaoManBuJiaBeiTog.isChecked = !!this.gameRule.isBuJiaoManBuJiaBei;
                this.buJiaoManBuJiaBeiTog.interactable = true;
            } else {
                this.rateTog0.isChecked = true;
                this.buJiaoBuJiaBeiTog.isChecked = false;
                this.buJiaoBuJiaBeiTog.interactable = false;
                this.buJiaoManBuJiaBeiTog.isChecked = false;
                this.buJiaoManBuJiaBeiTog.interactable = false;
            }
            CCUtil.setGrayShader(this.buJiaoManBuJiaBeiTog.node, !this.buJiaoManBuJiaBeiTog.interactable);
        } else {
            this.gameRule.isWashCard = true;
            this.renshuTog2.isChecked = true;
            this.wanFaPannel3.active = false;
            this.wanFaPannel2.active = true;
            this.rangPaiPannel.active = true;
            this.jiaBeiPannel.active = false;
            this.wangErBiJiaoTog.isChecked = false;
            this.quDiaoSanSiWuTog.isChecked = false;
            this.wuSiDaiErTog.isChecked = false;
            this.buXiPaiTog.isChecked = false;
            this.lianZhaTog.isChecked = false;
            this.xianShiPaiShuTog.isChecked = false;
            this.buDaiJiaBeiTog.isChecked = !!this.gameRule.isBuDaiJiaBei;
            if (!!this.gameRule.isBuDaiJiaBei) {
                this.nongMinYouXianJiaBeiTog.isChecked = false;
                this.gameRule.isNongMinRateFirst = false;
                this.nongMinYouXianJiaBeiTog.interactable = false;
            } else {
                this.nongMinYouXianJiaBeiTog.interactable = true;
                this.nongMinYouXianJiaBeiTog.isChecked = !!this.gameRule.isNongMinRateFirst;
            }
            CCUtil.setGrayShader(this.nongMinYouXianJiaBeiTog.node, !this.nongMinYouXianJiaBeiTog.interactable);
            this.diPaiFanBeiTog.isChecked = !!this.gameRule.isDiPaiFanBei;
            if (this.gameRule.rangPaiCount == 2) {
                this.rangTog2.isChecked = true;
            } else if (this.gameRule.rangPaiCount == 3) {
                this.rangTog3.isChecked = true;
            } else if (this.gameRule.rangPaiCount == 4) {
                this.rangTog4.isChecked = true;
            } else {
                this.rangTog0.isChecked = true;
            }
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        this.difenEdit.string = this.gameRule.baseScore;
        /**高级 */
        this.jiPaiTog.isChecked = !!this.gameRule.isCardRecorder;
        this.laiziTog.isChecked = !!this.gameRule.isLai;
        this.dianshuEdit.string = !!this.gameRule.isLai ? this.gameRule.laiZiList[0] || "" : "";
    },

    updateCost() {
        let bureau = this.gameRule.bureau;
        let diamondCount = bureau == 8 ? 2 : bureau == 16 ? 3 : 4;
        this.gameRule.payDiamond = diamondCount;
    },

    onButtonClick(event, param) {
        if (param.indexOf('bureau') != -1) {
            this.gameRule.bureau = parseInt(param.split('_')[1]);
            this.updateCost();
        } else if (param.indexOf('member') != -1) {
            this.gameRule.maxPlayerCount = parseInt(param.slice(6));
            if (this.gameRule.maxPlayerCount == 2) {
                this.wanFaPannel3.active = false;
                this.wanFaPannel2.active = true;
                this.rangPaiPannel.active = true;
                this.jiaBeiPannel.active = false;
                this.gameRule.isWashCard = true;
            } else {
                this.wanFaPannel3.active = true;
                this.wanFaPannel2.active = false;
                this.rangPaiPannel.active = false;
                this.jiaBeiPannel.active = true;
            }
        } else if (param == 'yuyin') {
            this.gameRule.yuyin = event.isChecked;
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param == 'fangzuobi') {
            this.gameRule.fangzuobi = event.isChecked;
        } else if (param == "location") { //防作弊 服务器判断
            this.gameRule.showGps = event.isChecked;
        } else if (param.indexOf('fengding') != -1) {
            this.gameRule.maxRate = parseInt(param.slice(8));
        } else if (param == "wang2bj") {
            this.gameRule.isWangErBiJiao = event.isChecked;
        } else if (param == "qd345") {
            this.gameRule.isSanSiWuFilter = event.isChecked;
        } else if (param == "bn4d2") {
            this.gameRule.isSiDaiEr = !event.isChecked;
        } else if (param == "buxipai") {
            this.gameRule.isWashCard = !event.isChecked;
            if (!this.gameRule.isWashCard) {
                this.lianZhaTog.interactable = true;
            } else {
                this.lianZhaTog.isChecked = false;
                this.lianZhaTog.interactable = false;
                this.gameRule.isLianZha = false;
            }
            CCUtil.setGrayShader(this.lianZhaTog.node, !this.lianZhaTog.interactable);
        } else if (param == 'difen') {
            this.onCheckRuleEditScore(this.gameRule, this.difenEdit, 1, 100, "baseScore")
        } else if (param == "lianzha") {
            this.gameRule.isLianZha = event.isChecked;
        } else if (param == "sy3zxsps") {
            this.gameRule.isShowCardCount = event.isChecked;
        } else if (param == "bujiabei") {
            this.gameRule.isBuDaiJiaBei = event.isChecked;
            if (!!this.gameRule.isBuDaiJiaBei) {
                this.nongMinYouXianJiaBeiTog.isChecked = false;
                this.gameRule.isNongMinRateFirst = false;
                this.nongMinYouXianJiaBeiTog.interactable = false;
            } else {
                this.nongMinYouXianJiaBeiTog.interactable = true;
            }
            CCUtil.setGrayShader(this.nongMinYouXianJiaBeiTog.node, !this.nongMinYouXianJiaBeiTog.interactable);
        } else if (param == "dipaijifanbei ") {
            this.gameRule.isDiPaiFanBei = event.isChecked;
        } else if (param == "nmyxjb") {
            this.gameRule.isNongMinRateFirst = event.isChecked;
        } else if (param.indexOf('rang') != -1) {
            this.gameRule.rangPaiCount = parseInt(param.slice(4));
        } else if (param == "tongji") { //输赢统计显示
            this.gameRule.tongji = event.isChecked
        } else if (param.indexOf('rate') != -1) {
            this.gameRule.rateType = parseInt(param.slice(4));
            if (this.gameRule.rateType == 0 || this.gameRule.rateType == 1) {
                this.buJiaoBuJiaBeiTog.interactable = false;
                this.buJiaoBuJiaBeiTog.isChecked = false;
                this.gameRule.isBuJiaoBuJiaBei = false;
                this.buJiaoManBuJiaBeiTog.interactable = false;
                this.buJiaoManBuJiaBeiTog.isChecked = false;
                this.gameRule.isBuJiaoManBuJiaBei = false;
            } else {
                this.buJiaoBuJiaBeiTog.interactable = true;
                this.buJiaoManBuJiaBeiTog.interactable = true;
            }
            CCUtil.setGrayShader(this.buJiaoBuJiaBeiTog.node, !this.buJiaoBuJiaBeiTog.interactable);
            CCUtil.setGrayShader(this.buJiaoManBuJiaBeiTog.node, !this.buJiaoManBuJiaBeiTog.interactable);
        } else if (param == "bjbjb") {
            this.gameRule.isBuJiaoBuJiaBei = event.isChecked;
        } else if (param == "bjmbjb") {
            this.gameRule.isBuJiaoManBuJiaBei = event.isChecked;
        } else if (param == "jipaiqi") {
            this.gameRule.isCardRecorder = event.isChecked;
        } else if (param == "laizi") {
            this.dianshuEdit.string = "";
            this.gameRule.laiZiList = [];
            this.gameRule.isLai = event.isChecked;
        } else if (param == "laizidianshu") {
            let num = parseInt(this.dianshuEdit.string);
            if (!num || num < 1 || num > 13) {
                AssetsManager.tipDialog(`输入错误,请输入${1}-${13}的点数!`);
                this.dianshuEdit.string = this.gameRule.laiZiList[0] || "";
                return;
            }
            this.gameRule.laiZiList = [num];
        }
        // console.log('this.gameRule', this.gameRule);
        ConfigModel.setRoomCreateCache(this.gameRule);
    },

    onCheckRuleEditScore(gameRule, editBox, min, max, key) {
        let score = parseInt(editBox.string)
        var r = /^\+?[1-9][0-9]*$/ //非0的正整数
        if (!r.test(editBox.string) || score > max) {
            editBox.string = '';
            AssetsManager.tipDialog(`输入错误,请输入${min}-${max}的整数!`);
            return
        }
        gameRule[key] = score;
    },

    getRule() {
        return this.gameRule;
    }

});