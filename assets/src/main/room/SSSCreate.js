const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const CCUtil = require('../../utils/CCUtil');
const Utils = require("../../utils/Utils");
const { Def_Tw } = require('../../const/Defines');

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
        difenEdit: cc.EditBox,
        jingdianTog: cc.Toggle,
        qiangzhuangTog: cc.Toggle,
        bujiaseTog: cc.Toggle,
        jiaseTog: cc.Toggle,
        jiasePannel: cc.Node,
        colorsTogs: cc.Node,
        wuMapaiTog: cc.Toggle,
        mapaiHongATog: cc.Toggle,
        mapaiHong5Tog: cc.Toggle,
        mapaiHong10Tog: cc.Toggle,
        daiwangTog0: cc.Toggle,
        daiwangTog1: cc.Toggle,
        daiwangTog2: cc.Toggle,
        daiwangTog3: cc.Toggle,
        daiwangTog4: cc.Toggle,
        daqiangTog1: cc.Toggle,
        daqiangTog2: cc.Toggle,
        baipaiTog90: cc.Toggle,
        baipaiTog180: cc.Toggle,
        baipaiTog300: cc.Toggle,
        teshuTog0: cc.Toggle,
        teshuTog1: cc.Toggle,
        paixingPannel: cc.Node,
        jinrenTog: cc.Toggle,
        guanzhanTog: cc.Toggle,
        tuoguanTog: cc.Toggle,
        teshuLay: cc.Node,
        lastLimitTog: cc.Toggle,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 10,
            minPlayerCount: 2,
            maxPlayerCount: 4,
            gameType: Enums.bundleType.SSS,
            wanfa: Def_Tw.wanfa.NONE,
            mapai: Def_Tw.mapaiType.NONE,
            /* 0 1 2 3*/
            wangpai: Def_Tw.wangpaiType.NONE,
            /* 0 1 2 3 4 */
            jifen: Def_Tw.jifen.NONE,
            /* 0  1 */
            time: 0,
            /* 比牌时间 0 1 2 */
            youSanChuan: true,
            colors: {
                0: false,
                1: false,
                2: false,
                3: false
            },
            tesupai: false,
            /* 特殊牌 */
            tesupaitype: {
                qinglong: true, //青龙
                yitiaolong: true, //一条龙
                shierhuangzu: true, //十二皇族
                santonghuashun: true, //三同花顺
                sanfentianxia: true, //三分天下
                sitaosantiao: true, //四套三条
                wuduisantiao: true, //五对三条
                liuduiban: true, //六对半
                santonghua: true, //三同花
                sanshunzi: true, //三顺子
                quanda: true, //全大
                quanxiao: true, //全小
                couyise: true, //凑一色
                quanheiyidianhong: true, //全黑一点红
                quanhongyidianhei: true, //全红一点黑
            },
            canWatch: false,
            /* 允许观战 */
            canEnter: false,
            /* 中途进人 */
            yuyin: false,
            baseScore: 1,
            canTrust: false,
            /* 托管*/
            ziyouju: false,
            fangzuobi: false,
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
        /* 加色 */
        let count = this.getColorsCount();
        if (count > 0) {
            this.jiaseTog.isChecked = true;
            this.jiasePannel.active = true;
            for (let index = 0; index < 4; index++) {
                if (!this.colorsTogs.children[index] || !this.colorsTogs.children[index].getComponent(cc.Toggle)) continue;
                this.colorsTogs.children[index].getComponent(cc.Toggle).isChecked = this.gameRule.colors[index];
            }
        } else {
            this.bujiaseTog.isChecked = true;
            this.jiasePannel.active = false;
        }
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
        /* 玩法 */

        if (this.gameRule.wanfa == 0) {
            this.jingdianTog.isChecked = true;
        } else if (this.gameRule.wanfa == 1) {
            this.qiangzhuangTog.isChecked = true;
        }
        /*马牌 */
        if (this.gameRule.mapai == 1) {
            this.mapaiHongATog.isChecked = true;
        } else if (this.gameRule.mapai == 2) {
            this.mapaiHong5Tog.isChecked = true;
        } else if (this.gameRule.mapai == 3) {
            this.mapaiHong10Tog.isChecked = true;
        } else {
            this.wuMapaiTog.isChecked = true;
        }
        /*王牌 */
        if (this.gameRule.wangpai == 2) {
            this.daiwangTog1.isChecked = true;
        } else if (this.gameRule.wangpai == 4) {
            this.daiwangTog2.isChecked = true;
        } else if (this.gameRule.wangpai == 6) {
            this.daiwangTog3.isChecked = true;
        } else if (this.gameRule.wangpai == 8) {
            this.daiwangTog4.isChecked = true;
        } else {
            this.daiwangTog0.isChecked = true;
        }
        /* 计分*/
        if (this.gameRule.jifen == 1) {
            this.daqiangTog1.isChecked = true;
        } else {
            this.daqiangTog2.isChecked = true;
        }
        /*摆牌时间*/
        if (this.gameRule.time == 1) {
            this.baipaiTog180.isChecked = true;
        } else if (this.gameRule.time == 2) {
            this.baipaiTog300.isChecked = true;
        } else {
            this.baipaiTog90.isChecked = true;
        }
        /*特殊牌*/
        if (this.gameRule.tesupai) {
            this.teshuTog1.isChecked = true;
            this.teshuLay.active = true;
        } else {
            this.teshuTog0.isChecked = true;
            this.teshuLay.active = false;
        }
        /*特殊牌型 */
        for (let key in this.gameRule.tesupaitype) {
            if (!this.paixingPannel.getChildByName(key) || !this.paixingPannel.getChildByName(key).getComponent(cc.Toggle)) continue;
            this.paixingPannel.getChildByName(key).getComponent(cc.Toggle).isChecked = this.gameRule.tesupaitype[key];
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        /* 高级 */
        this.tuoguanTog.isChecked = this.gameRule.canTrust;
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

    onButtonClick(event, param) {
        if (param.indexOf('bureau') != -1) {
            this.gameRule.bureau = parseInt(param.split('_')[1]);
            this.updateCost();
        } else if (param.indexOf('member') != -1) {
            this.gameRule.maxPlayerCount = parseInt(param.slice(6));
            this.updateCost();
            this.updateColors();
        } else if (param.indexOf('mapai') != -1) {
            this.gameRule.mapai = parseInt(param.slice(5));
        } else if (param.indexOf('wangpai') != -1) {
            this.gameRule.wangpai = parseInt(param.slice(7));
        } else if (param.indexOf('jifen') != -1) {
            this.gameRule.jifen = parseInt(param.slice(5));
        } else if (param.indexOf('time') != -1) {
            this.gameRule.time = parseInt(param.slice(4));
        } else if (param.indexOf('tesupai') != -1) {
            this.gameRule.tesupai = parseInt(param.slice(7)) != 0;
            this.teshuLay.active = !!this.gameRule.tesupai;
            if (!this.gameRule.tesupai) {
                this.paixingPannel.active = false;
            }
        } else if (param == 'rulepaixing') {
            this.paixingPannel.active = !this.paixingPannel.active;
        } else if (param.indexOf('jiase') != -1) {
            let type = parseInt(param.slice(5));
            this.updateColors();
            // if (type == 0) {
            //     this.setColors(null, false, true);
            // } else {
            //     for (let index = 0; index < 4; index++) {
            //         this.setColors(index, this.colorsTogs.children[index].getComponent(cc.Toggle).isChecked, false);
            //     }
            //     this.jiasePannel.active = type == 1;
            // }
        } else if (param.indexOf('yanse') != -1) {
            let type = parseInt(param.slice(5));
            this.gameRule.colors[type] = event.isChecked;
            this.updateColors()
        } else if (param.indexOf('wanfa') != -1) {
            let type = parseInt(param.slice(5));
            this.gameRule.wanfa = type;
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
        } else if (param == 'lastlimit') {
            this.gameRule.lastThreeJoin = !!event.isChecked;
        } else if (param == 'guanzhan') {
            this.gameRule.canWatch = event.isChecked;
        } else if (param == 'yuyin') {
            this.gameRule.yuyin = event.isChecked;
        } else if (param == 'tuoguan') {
            this.gameRule.canTrust = event.isChecked;
        } else if (param == 'quanxuan') {
            for (let index = 0; index < this.paixingPannel.childrenCount; index++) {
                this.paixingPannel.children[index].getComponent(cc.Toggle).isChecked = event.isChecked;;
            }
        } else if (param == 'difen') {
            this.onCheckRuleEditScore(this.gameRule, this.difenEdit, 1, 100, "baseScore")
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param == 'fangzuobi') {
            this.gameRule.fangzuobi = event.isChecked;
        } else if (param == "tongji") { //输赢统计显示
            this.gameRule.tongji = event.isChecked
        } else if (param == "location") { //防作弊 服务器判断
            this.gameRule.showGps = event.isChecked
        } else {
            if (this.gameRule.tesupaitype.hasOwnProperty(param)) {
                this.gameRule.tesupaitype[param] = event.isChecked;
            }
        }
        // console.log("十三水=", this.gameRule);
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

    updateCost() {
        let bureau = this.gameRule.bureau;
        let diamondCount = 2;
        if (bureau === 10) {
            diamondCount = 1;
        } else if (bureau === 20) {
            diamondCount = 3;
        } else if (bureau === 30) {
            diamondCount = 4;
        }
        this.gameRule.payDiamond = diamondCount;
        // this.diamondCount.string = diamondCount;
    },

    setColors(index, type, all = false) {
        if (all) {
            for (let key in this.gameRule.colors) {
                this.gameRule.colors[key] = type;
            }
        } else {
            this.gameRule.colors[index] = type;
            // console.log("设置颜色==", this.gameRule.colors, index, type)
        }
    },

    getColorsCount() {
        let count = 0;
        for (let key in this.gameRule.colors) {
            if (this.gameRule.colors[key]) {
                count++;
            }
        }
        return count;
    },

    updateColors() {
        var colorsCount = this.getColorsCount();
        if (this.gameRule.maxPlayerCount == 4) {
            this.bujiaseTog.isChecked = true
            this.jiasePannel.active = false
            this.setColors(null, false, true)
            return false
        }
        if (this.gameRule.maxPlayerCount >= 6) {
            let length = 0;
            if (this.gameRule.maxPlayerCount == 6) length = 2;
            if (this.gameRule.maxPlayerCount == 8) length = 4;
            if (colorsCount < length || this.bujiaseTog.isChecked) {
                AssetsManager.tipDialog(this.gameRule.maxPlayerCount + "人必须加" + length + "色");
                this.jiaseTog.isChecked = true;
                colorsCount = this.getColorsCount();
                this.jiasePannel.active = true;
                for (let index = 0; index < 4 && colorsCount < length; index++) {
                    if (!this.gameRule.colors[index]) {
                        colorsCount++;
                        this.gameRule.colors[index] = true
                    }
                }
            }
            for (let index = 0; index < 4; index++) {
                this.colorsTogs.children[index].getComponent(cc.Toggle).isChecked = this.gameRule.colors[index]
            }
        } else if (this.bujiaseTog.isChecked) {
            this.jiasePannel.active = false;
        }
    },

    getRule() {
        return this.gameRule;
    },

});