const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const Utils = require("../../utils/Utils");

let LI_PAI_TIME = [0, 30, 45, 60]

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
        renshuTog3: cc.Toggle,
        renshuTog4: cc.Toggle,
        renshuTog5: cc.Toggle,
        renshuTog6: cc.Toggle,
        difenEdit: cc.EditBox,
        // 高级
        yuyinTog: cc.Toggle,
        fangzuobiTog: cc.Toggle,
        tongjiTog: cc.Toggle,
        locationTog: cc.Toggle,
        weiZhunBeiTog: cc.Toggle,
        jinrenTog: cc.Toggle,
        guanzhanTog: cc.Toggle,
        lastLimitTog: cc.Toggle,
        distanceLimitEdit: cc.EditBox,

        jokerCountTog0: cc.Toggle,
        jokerCountTog2: cc.Toggle,
        jokerCountTog4: cc.Toggle,
        liPaiTimeTog0: cc.Toggle,
        liPaiTimeTog1: cc.Toggle,
        liPaiTimeTog2: cc.Toggle,
        liPaiTimeTog3: cc.Toggle,
        biPaiTypeTog1: cc.Toggle,
        biPaiTypeTog2: cc.Toggle,
        biPaiTypeTog3: cc.Toggle,

        allowCancelTog: cc.Toggle, //是否允许弃牌
        laiZiTypeTog: cc.Toggle, //0 当红黑 1: 当任意
        pick9Tog: cc.Toggle, // 是否10选9

        sanQingTog: cc.Toggle,
        quanHongTog: cc.Toggle,
        quanHeiTog: cc.Toggle,
        shuangShunQingTog: cc.Toggle,
        sanShunQingTog: cc.Toggle,
        shuangSanTiaoTog: cc.Toggle,
        quanSanTiaoTog: cc.Toggle,
        siGeTouTog: cc.Toggle,
        lianShunTog: cc.Toggle,
        qingLianShunTog: cc.Toggle,
        sanGuiTog: cc.Toggle,
        tongGuanTog: cc.Toggle,
        siZhangTog: cc.Toggle, // 是否四张
        shuangSiZhangTog: cc.Toggle, // 是否双四张
        touShunQingTog: cc.Toggle, // 是否头顺清
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 10,
            maxPlayerCount: 3,
            minPlayerCount: 2,
            gameType: Enums.bundleType.BJJ,
            canTrust: false,
            trustTm: 0,
            yuyin: false,
            wanfa: 2, //1:抢庄 2：通比 3: 看牌下注
            baseScore: 1,
            fangzuobi: false,

            allowCancel: false, //是否允许弃牌
            laiZiType: 1, //0 当红黑 1: 当任意
            pick9: false, // 是否10选9

            sanQing: true,
            quanHong: true,
            quanHei: true,
            shuangShunQing: true,
            sanShunQing: true,
            shuangSanTiao: true,
            quanSanTiao: true,
            // siGeTou: true,
            lianShun: true,
            qingLianShun: true,
            sanGui: true,
            tongGuan: true,
            siZhang: true, // 是否四张
            shuangSiZhang: true, // 是否双四张
            touShunQing: true, // 是否头顺清
            unReadyKick: 0,
            /**输赢统计 */
            tongji: false,
            location: false,
            /* 允许观战 */
            canWatch: false,
            /* 中途进人 */
            canEnter: false,
            jokerCount: 0, //鬼的数量
            liPaiTime: 0, //摆牌时间
            biPaiType: 1, //比牌动画 1详细 2简单 3跳过动画
        };
        this.updateCost();
    },

    start() {
        this.fangfeiPannel.active = !(!!this.node.nodeParams && !!this.node.nodeParams.isUnion);
        this.gameRule = !!this.node.nodeParams && !!this.node.nodeParams.gameRule ? this.node.nodeParams.gameRule : this.gameRule;
        this.init();
    },

    init() {
        if (this.gameRule.bureau == 20) {
            this.jushuTog20.isChecked = true;
        } else if (this.gameRule.bureau == 30) {
            this.jushuTog30.isChecked = true;
        } else {
            this.jushuTog10.isChecked = true;
        }
        // 人数
        if (this.gameRule.maxPlayerCount == 6) {
            this.renshuTog6.isChecked = true;
        } else if (this.gameRule.maxPlayerCount == 5) {
            this.renshuTog5.isChecked = true;
        } else if (this.gameRule.maxPlayerCount == 4) {
            this.renshuTog4.isChecked = true;
        } else {
            this.renshuTog3.isChecked = true;
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        /*玩法 */
        this.yuyinTog.isChecked = !!this.gameRule.yuyin;
        this.fangzuobiTog.isChecked = !!this.gameRule.fangzuobi;
        this.weiZhunBeiTog.isChecked = this.gameRule.unReadyKick > 0;
        // this.distanceLimitEdit.node.active = !!this.gameRule.fangzuobi;
        // this.distanceLimitEdit.string = this.gameRule.distanceLimit || 0;

        this.guanzhanTog.isChecked = !!this.gameRule.canWatch;
        this.jinrenTog.isChecked = !!this.gameRule.canEnter;
        if (!!this.gameRule.canEnter) {
            this.lastLimitTog.interactable = true;
            this.lastLimitTog.isChecked = !!this.gameRule.lastThreeJoin;
        } else {
            this.lastLimitTog.interactable = false;
            this.lastLimitTog.isChecked = false;
        }

        /**输赢统计 */
        this.tongjiTog.isChecked = this.gameRule.tongji

        /**防作弊 */
        this.locationTog.isChecked = this.gameRule.location

        let setTog = (name, isChecked = true) => {
            let tog = this[name]
            if (tog) tog.isChecked = isChecked
        }
        /*摆牌时间*/
        let idx = LI_PAI_TIME.indexOf(this.gameRule.liPaiTime)
        setTog("liPaiTimeTog" + idx)
        /**动画 */
        let biPaiType = this.gameRule.biPaiType
        setTog("biPaiTypeTog" + biPaiType)
        /**鬼牌数量 */
        setTog("jokerCountTog" + this.gameRule.jokerCount)
        /**十选九 */
        setTog("pick9Tog", this.gameRule.pick9)
        /**弃牌 */
        setTog("allowCancelTog", this.gameRule.allowCancel)
        /**王当红黑 */
        setTog("laiZiTypeTog", this.gameRule.laiZiType == 0)
        /**喜分 */
        setTog("sanQingTog", this.gameRule.sanQing)
        setTog("quanHongTog", this.gameRule.quanHong)
        setTog("quanHeiTog", this.gameRule.quanHei)
        setTog("shuangShunQingTog", this.gameRule.shuangShunQing)
        setTog("sanShunQingTog", this.gameRule.sanShunQing)
        setTog("shuangSanTiaoTog", this.gameRule.shuangSanTiao)
        setTog("quanSanTiaoTog", this.gameRule.quanSanTiao)
        // setTog("siGeTouTog", this.gameRule.siGeTou)
        setTog("lianShunTog", this.gameRule.lianShun)
        setTog("qingLianShunTog", this.gameRule.qingLianShun)
        setTog("sanGuiTog", this.gameRule.sanGui)
        setTog("tongGuanTog", this.gameRule.tongGuan)
        setTog("siZhangTog", this.gameRule.siZhang)
        setTog("shuangSiZhangTog", this.gameRule.shuangSiZhang)
        setTog("touShunQingTog", this.gameRule.touShunQing)
    },

    updateCost() {
        let bureau = this.gameRule.bureau;
        let diamondCount = 4;
        if (bureau == 10) {
            diamondCount = 4;
        } else if (bureau == 20) {
            diamondCount = 8;
        } else if (bureau == 30) {
            diamondCount = 12;
        }
        this.gameRule.payDiamond = diamondCount;
    },

    onButtonClick(event, param) {
        if (param.indexOf('bureau') != -1) {
            this.gameRule.bureau = parseInt(param.split('_')[1]);
            this.updateCost();
        } else if (param.indexOf('member') != -1) {
            this.gameRule.maxPlayerCount = parseInt(param.slice(6));
            // this.gameRule.minPlayerCount = this.gameRule.maxPlayerCount;
            if (this.gameRule.maxPlayerCount == 6) {
                if (this.gameRule.jokerCount < 2) {
                    this.gameRule.jokerCount = 2
                    this.jokerCountTog2.isChecked = true
                    AssetsManager.tipDialog("6人至少带2王")
                }
                this.gameRule.pick9 = false
                this.pick9Tog.isChecked = false
            }
        } else if (param == 'yuyin') {
            this.gameRule.yuyin = event.isChecked;
        } else if (param == "fangzuobi") {
            this.gameRule.fangzuobi = event.isChecked;
            // this.distanceLimitEdit.node.active = !!this.gameRule.fangzuobi;
        } else if (param == "difen") {
            this.onCheckRuleEditScore(this.difenEdit, 1, 100, "baseScore")
        } else if (param.indexOf('jokerCount') != -1) {
            let jc = parseInt(param.slice(10));
            if (this.gameRule.maxPlayerCount == 6 && jc == 0) {
                this.gameRule.jokerCount = 2
                this.jokerCountTog2.isChecked = true
                AssetsManager.tipDialog("6人至少带2王")
                return
            }
            this.gameRule.jokerCount = jc
        } else if (param == "unReadyKick") {
            this.gameRule.unReadyKick = event.isChecked ? 10 : 0
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
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
        } else if (param == "location") {
            this.gameRule.location = event.isChecked
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
        } else if (param.indexOf('liPaiTime') != -1) {
            this.gameRule.liPaiTime = LI_PAI_TIME[parseInt(param.slice(9))];
        } else if (param.indexOf('biPaiType') != -1) {
            this.gameRule.biPaiType = parseInt(param.slice(9))
        } else if (param === 'distance') {
            //this.gameRule.distanceLimit = this.distanceLimitEdit.string.length == 0 ? 0 : parseInt(this.distanceLimitEdit.string);
        } else if (param === "laiZiType") {
            this.gameRule.laiZiType = event.isChecked ? 0 : 1
        } else {
            if (this.gameRule.hasOwnProperty(param)) {
                this.gameRule[param] = event.isChecked;
            }
            if (param === "pick9" && this.gameRule.pick9) { //十选九最多5人玩
                if (this.gameRule.maxPlayerCount == 6) {
                    AssetsManager.tipDialog("5人及以下才可选择此选项")
                    this.pick9Tog.isChecked = false
                    this.gameRule.pick9 = false
                }
            }
        }
        // console.log('比鸡规则==', this.gameRule);
        ConfigModel.setRoomCreateCache(this.gameRule);
    },

    onCheckRuleEditScore(editBox, min, max, key) {
        let score = parseFloat(editBox.string)
        var r = /^\+?[1-9][0-9]*$/ //非0的正整数
        if (!r.test(editBox.string) || score > max || score < min) {
            editBox.string = '';
            AssetsManager.tipDialog(`输入错误,请输入${min}-${max}的整数`);
            return
        }
        this.gameRule[key] = score;
    },

    getRule() {
        return this.gameRule;
    }

});