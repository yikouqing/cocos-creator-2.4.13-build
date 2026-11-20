const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const CCUtil = require('../../utils/CCUtil');
const Utils = require("../../utils/Utils");
const MA_PAI = [39, 51, 48]
const LI_PAI_TIME = [0, 60, 90, 120]

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
        renshuTog5: cc.Toggle,
        renshuTog6: cc.Toggle,
        renshuTog7: cc.Toggle,
        renshuTog8: cc.Toggle,
        difenEdit: cc.EditBox,
        wanfaTog1: cc.Toggle,
        wanfaTog2: cc.Toggle,
        wanfaTog3: cc.Toggle,
        lianFaTypeTog1: cc.Toggle,
        lianFaTypeTog2: cc.Toggle,
        lianFaTypeTog3: cc.Toggle,
        lianFaTypeTog4: cc.Toggle,
        tesupaiTog: cc.Toggle,
        hasChongSanTog: cc.Toggle,
        tongHuaBiDuiTog: cc.Toggle,
        shouDongBaiPaiTog: cc.Toggle,
        bujiaseTog: cc.Toggle,
        jiaseTog: cc.Toggle,
        jiasePannel: cc.Node,
        colorsTogs: cc.Node,
        maPaiTypeTog0: cc.Toggle,
        maPaiTypeTog1: cc.Toggle,
        mapaiTog0: cc.Toggle,
        mapaiTog1: cc.Toggle,
        mapaiTog2: cc.Toggle,
        maRateNode: cc.Node,
        maRateTypeTog1: cc.Toggle,
        maRateTypeTog2: cc.Toggle,
        jokerTypeTog0: cc.Toggle,
        jokerTypeTog1: cc.Toggle,
        jokerTypeTog2: cc.Toggle,
        jokerCountTog0: cc.Toggle,
        jokerCountTog2: cc.Toggle,
        jokerCountTog4: cc.Toggle,
        jokerCountTog6: cc.Toggle,
        jokerCountTog8: cc.Toggle,
        jokerCountNode: cc.Node,
        jokerCountTxt: cc.Label,
        jifenTog1: cc.Toggle,
        jifenTog2: cc.Toggle,
        liPaiTimeTog0: cc.Toggle,
        liPaiTimeTog1: cc.Toggle,
        liPaiTimeTog2: cc.Toggle,
        liPaiTimeTog3: cc.Toggle,
        biPaiTypeTog1: cc.Toggle,
        biPaiTypeTog2: cc.Toggle,
        biPaiTypeTog3: cc.Toggle,
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
            gameType: Enums.bundleType.FJSSS,
            wanfa: 2, //1:抢庄 2：通比 3: 看牌下注
            maPaiType: 0, //0 无马牌 1: 随机马牌 2：固定马牌
            maRateType: 1, //1 单马 2：多马
            mapai: MA_PAI[0], //固定马牌
            jokerType: 0, // //0 无鬼 1硬鬼 2 软鬼
            jokerCount: 0, //0表示没有鬼牌，这个版本不需要jokerType
            jifen: 1, //打枪的分数 1:加倍 2：加一分
            liPaiTime: 0, //摆牌时间
            biPaiType: 2, //比牌动画 1详细 2简单 3跳过动画
            colors: {
                0: false,
                1: false,
                2: false,
                3: false
            },
            tesupai: true,
            tongHuaBiDui: false, //同花比对
            shouDongBaiPai: false, //只能手动摆牌
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
            lastThreeJoin: false,
            gameDelayTime: 15,
            kickUserTime: 30,
            /**发牌模式 1 1连发  2 3连发 3 5连发  4 13连发 */
            lianFaType: 1,
            /**是否开启冲三模式 */
            hasChongSan: false,
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

        let setTog = (name, isChecked = true) => {
            let tog = this[name]
            if (tog) tog.isChecked = isChecked
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        /* 人数 */
        setTog("renshuTog" + this.gameRule.maxPlayerCount)
        /* 玩法 */
        setTog("wanfaTog" + this.gameRule.wanfa)
        setTog("tesupaiTog", !this.gameRule.tesupai)
        setTog("tongHuaBiDuiTog", this.gameRule.tongHuaBiDui)
        setTog("shouDongBaiPaiTog", this.gameRule.shouDongBaiPai)
        /**冲三 */
        setTog("hasChongSanTog", this.gameRule.hasChongSan)
        /**鬼牌数量 */
        setTog("jokerCountTog" + this.gameRule.jokerCount)
        /**连发数量  */
        setTog("lianFaTypeTog" + this.gameRule.lianFaType)

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

        /*马牌 */
        if (this.gameRule.maPaiType == 2) {
            for (let i = 0; i < MA_PAI.length; i++) {
                const id = MA_PAI[i];
                if (id == this.gameRule.mapai) {
                    setTog("mapaiTog" + i)
                    break;
                }
            }
        } else {
            setTog("maPaiTypeTog" + this.gameRule.maPaiType)
        }
        /**显示单马或者多马 */
        // this.maRateNode.active = this.gameRule.maPaiType > 0
        // setTog("maRateTypeTog" + this.maRateType)

        /*王牌 */
        // setTog("jokerTypeTog" + this.gameRule.jokerType)
        // this.jokerCountNode.active = this.gameRule.jokerType > 0
        // this.jokerCountTxt.string = this.gameRule.jokerCount

        /* 计分*/
        setTog("jifenTog" + this.gameRule.jifen)
        /*摆牌时间*/
        let time = LI_PAI_TIME.indexOf(this.gameRule.liPaiTime)
        setTog("liPaiTimeTog" + time)
        /**动画 */
        let biPaiType = this.gameRule.biPaiType
        setTog("biPaiTypeTog" + biPaiType)

        /*特殊牌*/
        // if (this.gameRule.tesupai) {
        //     this.teshuTog1.isChecked = true;
        //     // this.teshuLay.active = true;
        // } else {
        //     this.teshuTog0.isChecked = true;
        //     // this.teshuLay.active = false;
        // }
        // /*特殊牌型 */
        // for (let key in this.gameRule.tesupaitype) {
        //     if (!this.paixingPannel.getChildByName(key) || !this.paixingPannel.getChildByName(key).getComponent(cc.Toggle)) continue;
        //     this.paixingPannel.getChildByName(key).getComponent(cc.Toggle).isChecked = this.gameRule.tesupaitype[key];
        // }
        /* 高级 */
        this.tuoguanTog.isChecked = false //this.gameRule.canTrust;
        this.gameRule.canTrust = false
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
    },

    onButtonClick(event, param) {
        if (param.indexOf('bureau') != -1) {
            this.gameRule.bureau = parseInt(param.split('_')[1]);
            this.updateCost();
        } else if (param.indexOf('member') != -1) {
            let renshu = parseInt(param.slice(6));
            this.gameRule.maxPlayerCount = renshu
            this.updateColors();
        } else if (param.indexOf('wanfa') != -1) { //玩法
            this.gameRule.wanfa = parseInt(param.slice(5));
        } else if (["tesupai", "tongHuaBiDui", "shouDongBaiPai"].includes(param)) { //可选玩法
            this.gameRule[param] = event.isChecked
            if (param == "tesupai") {
                this.gameRule[param] = !event.isChecked
            }
        } else if (param.indexOf('mapai') != -1) { //固定马牌
            this.gameRule.mapai = MA_PAI[parseInt(param.slice(5))];
            this.gameRule.maPaiType = 2
            // this.maRateNode.active = true
        } else if (param.indexOf('maPaiType') != -1) { //无马牌或者随机马牌
            this.gameRule.maPaiType = parseInt(param.slice(9))
            // this.maRateNode.active = this.gameRule.maPaiType > 0
        } else if (param.indexOf('maRateType') != -1) {
            // this.gameRule.maRateType = parseInt(param.slice(10))
        } else if (param.indexOf('jokerType') != -1) {
            // this.gameRule.jokerType = parseInt(param.slice(9));
            // this.jokerCountNode.active = this.gameRule.jokerType > 0
            // if (this.gameRule.jokerType == 0) {
            //     this.gameRule.jokerCount = 0
            // } else {
            //     if (this.gameRule.jokerCount == 0) {
            //         this.gameRule.jokerCount = 2
            //         this.jokerCountTxt.string = "2"
            //     }
            // }
        } else if (param == "jcadd") {
            // this.gameRule.jokerCount++
            // if (this.gameRule.jokerCount > 13) {
            //     this.gameRule.jokerCount = 13
            // }
            // this.jokerCountTxt.string = this.gameRule.jokerCount
        } else if (param == "jcsub") {
            // this.gameRule.jokerCount--
            // if (this.gameRule.jokerCount < 2) {
            //     this.gameRule.jokerCount = 2
            // }
            // this.jokerCountTxt.string = this.gameRule.jokerCount
        } else if (param.indexOf('jokerCount') != -1) {
            this.gameRule.jokerCount = parseInt(param.slice(10));
        } else if (param.indexOf('lianFaType') != -1) {
            this.gameRule.lianFaType = parseInt(param.slice(10));
        } else if (param.indexOf('jifen') != -1) {
            this.gameRule.jifen = parseInt(param.slice(5));
        } else if (param.indexOf('liPaiTime') != -1) {
            this.gameRule.liPaiTime = LI_PAI_TIME[parseInt(param.slice(9))];
        } else if (param.indexOf('biPaiType') != -1) {
            this.gameRule.biPaiType = parseInt(param.slice(9))
        } else if (param == 'rulepaixing') {
            this.paixingPannel.active = !this.paixingPannel.active;
        } else if (param.indexOf('jiase') != -1) {
            this.updateColors();
        } else if (param.indexOf('yanse') != -1) {
            let type = parseInt(param.slice(5));
            this.gameRule.colors[type] = event.isChecked;
            this.updateColors()
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
            // for (let index = 0; index < this.paixingPannel.childrenCount; index++) {
            //     this.paixingPannel.children[index].getComponent(cc.Toggle).isChecked = event.isChecked;;
            // }
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
        } else if (param == "hasChongSan") { //是否有头道冲三
            this.gameRule.hasChongSan = event.isChecked
        } else {
            if (this.gameRule.tesupaitype.hasOwnProperty(param)) {
                this.gameRule.tesupaitype[param] = event.isChecked;
            }
        }
        // console.log("十三水=", this.gameRule)
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
        if (this.gameRule.maxPlayerCount >= 5) {
            let length = 0;
            if (this.gameRule.maxPlayerCount == 5) length = 1;
            if (this.gameRule.maxPlayerCount == 6) length = 2;
            if (this.gameRule.maxPlayerCount == 7) length = 3;
            if (this.gameRule.maxPlayerCount == 8) length = 4;
            if (colorsCount < length || this.bujiaseTog.isChecked) {
                AssetsManager.tipDialog(this.gameRule.maxPlayerCount + "人至少加" + length + "色");
                this.jiaseTog.isChecked = true;
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
        } else {
            if (this.bujiaseTog.isChecked) {
                this.jiasePannel.active = false;
                for (let index = 0; index < 4; index++) {
                    this.gameRule.colors[index] = false
                    this.colorsTogs.children[index].getComponent(cc.Toggle).isChecked = false
                }
            } else if (this.jiaseTog.isChecked) {
                this.jiasePannel.active = true
            }
        }
    },

    getRule() {
        return this.gameRule;
    },

});