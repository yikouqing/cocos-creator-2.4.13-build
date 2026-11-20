const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const Utils = require("../../utils/Utils");
const CCUtil = require("../../utils/CCUtil");

let TUO_GUAN_TIME = [0, 30, 60, 120]
let AUTO_START_TIME = [0, 30, 45, 60]

cc.Class({
    extends: cc.Component,

    properties: {
        fangfeiPannel: cc.Node,
        perFeeLay: cc.Node,
        perFeeDiamond: cc.Label,
        tog_fanshu3: cc.Node,
        tog_fanshu4: cc.Node,
        tog_fanshu5: cc.Toggle,
        tog_hongzhong0: cc.Toggle,
        tog_tingyong0: cc.Toggle,
        tog_tingyong4: cc.Node,
        tingyingGZ: cc.Node,
        is2FanHu: cc.Toggle,
        is3FanHu: cc.Toggle,
        isNoTY3Fan: cc.Toggle,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            gameType: Enums.bundleType.YBMJ,

            yuyin: false,
            baseScore: 1,
            fangzuobi: false,
            canEnter: false, //中途加入
            canTrust: false,
            trustTm: 0, //超时托管时间 0不托管
            bureau: 8, //如果选了倒数 局数等于倒数
            maxPlayerCount: 2, //2、3、4
            minPlayerCount: 2,
            perDiamond: 0,

            bankerType: 0, //0 赢家坐庄 1表示下家做庄
            laiZiType: 0, //0 无鬼 1 白板 2红中 3翻鬼 4 翻双鬼 5花牌当鬼
            isBankerRandomFirst: true, //是否首局坐庄随机
            qiePaiType: 0, //切牌  0不切牌 1所有人切牌 2输家切牌
            autoStartTm: 0, //下一局自动开始时间 0不自动开始


            isDianPao: false, // 是否能点炮
            piaoType: 0, // 0 不飘 1 随飘 2 定飘
            tingYong: 0, //2人和3人可以选择4听用,4人没有4听用  0 4,8,11
            hongZhong: 0, //红中  0 4 8 12
            is2FanHu: false, //是否2番起胡 只有11听用才显示
            is3FanHu: false, //是否3番起胡 只有11听用才显示
            isNoTY3Fan: false, //无听用加3番 只有11听用才显示
            isFei2FanHu: false,//飞牌两番起胡
            isQueYiMen: false, //缺一门
            isTianHuManGuan: false, //天胡满贯
            maxRate: 5, //番数上限 5 6  增项3 4 选择无听用的时候才显示

        };
    },

    start() {
        this.fangfeiPannel.active = !(!!this.node.nodeParams && !!this.node.nodeParams.isUnion);
        let gameRule = !!this.node.nodeParams ? this.node.nodeParams.gameRule : null;
        if (!!gameRule) {
            this.gameRule = Object.assign(this.gameRule, gameRule);
        }
        this.init();
    },

    init() {
        let ruleKeys = Object.keys(this.gameRule)
        // console.log("rule===", this.gameRule)
        this._perFeeSync();
        this.updateDataShow();
        CCUtil.nodeRecursive(this.node, (node) => {
            let tog = node.getComponent(cc.Toggle)
            let edt = node.getComponent(cc.EditBox)

            let eventName = ""
            if (tog) {
                eventName = "toggle"
            } else if (edt) {
                eventName = "editing-did-ended"
            }
            if (eventName != "") {
                node.on(eventName, this.onButtonClick, this)
            }

            if (node.name == "baseScore") {
                edt.string = this.gameRule.baseScore + ""
            } else if (node.name.startsWith("payType")) { //房费
                let pt = parseInt(node.name.slice(7));
                if (this.gameRule.payType == pt) tog.isChecked = true
            } else if (node.name.startsWith("meijutoggle")) { //房费 钻石
                let pt = parseInt(node.name.slice(11));
                if (this.gameRule.perDiamond == pt) tog.isChecked = true
            } else if (node.name.startsWith("tog_jushu")) { //局数
                let jushu = parseInt(node.name.slice(9));
                tog.isChecked = this.gameRule.bureau == jushu
            } else if (node.name.startsWith("tog_renshu")) { //人数
                let renshu = parseInt(node.name.slice(10));
                tog.isChecked = this.gameRule.maxPlayerCount == renshu
            } else if (node.name.startsWith("tog_fanshu")) { //番数上限
                let maxRate = parseInt(node.name.slice(10));
                tog.isChecked = this.gameRule.maxRate == maxRate
            } else if (node.name.startsWith("tog_wanfa")) {
                let wanfa = parseInt(node.name.slice(9));
                tog.isChecked = this.gameRule.isDianPao == !!wanfa;
            } else if (node.name.startsWith("tog_xuanpiao")) {
                let piaoType = parseInt(node.name.slice(12));
                tog.isChecked = this.gameRule.piaoType == piaoType
            } else if (node.name.startsWith("tog_tingyong")) {
                let tingYong = parseInt(node.name.slice(12));
                tog.isChecked = this.gameRule.tingYong == tingYong
            } else if (node.name.startsWith("tog_hongzhong")) {
                let hongZhong = parseInt(node.name.slice(13));
                tog.isChecked = this.gameRule.hongZhong == hongZhong
            } else if (node.name.startsWith("trustTm")) { //托管
                let tidx = parseInt(node.name.slice(7));
                if (TUO_GUAN_TIME.indexOf(this.gameRule.trustTm) == tidx) tog.isChecked = true
            } else if (node.name.startsWith("qiePaiType")) { //切牌类型
                let qtype = parseInt(node.name.slice(10));
                if (this.gameRule.qiePaiType == qtype) tog.isChecked = true
            } else if (node.name.startsWith("autoStartTm")) { //自动开局
                let tidx = parseInt(node.name.slice(11));
                if (AUTO_START_TIME.indexOf(this.gameRule.autoStartTm) == tidx) tog.isChecked = true
            } else {
                if (ruleKeys.includes(node.name) && cc.isValid(tog)) {
                    if (typeof (this.gameRule[node.name]) == "boolean") {
                        tog.isChecked = this.gameRule[node.name]
                    } else {
                        tog.isChecked = this.gameRule[node.name] > 0
                    }
                }
            }
        })
        this.onSwitch(false);
        this.onSwitch(true);
    },


    updateDataShow() {
        this.tog_fanshu3.active = this.gameRule.tingYong == 0;
        this.tog_fanshu4.active = this.gameRule.tingYong == 0;
        this.tingyingGZ.active = true;// this.gameRule.tingYong == 11;
        this.tog_tingyong4.active = this.gameRule.maxPlayerCount != 4;
        // if (this.gameRule.tingYong != 11) {
        //     this.gameRule.is2FanHu = false;
        //     this.gameRule.is3FanHu = false;
        //     this.gameRule.isNoTY3Fan = false;
        //     this.is2FanHu.isChecked = false;
        //     this.is3FanHu.isChecked = false;
        //     this.isNoTY3Fan.isChecked = false;
        // }
        if (this.gameRule.tingYong != 0 && ![5, 6].includes(this.gameRule.maxRate)) {
            this.tog_fanshu5.isChecked = true;
            this.gameRule.maxRate = 5;
        }
    },

    onSwitch(isHongZong) {
        if (isHongZong) {
            if (this.gameRule.hongZhong != 0) {
                this.gameRule.tingYong = 0;
                this.tog_tingyong0.isChecked = true;
            }
        } else {
            if (this.gameRule.tingYong != 0) {
                this.gameRule.hongZhong = 0
                this.tog_hongzhong0.isChecked = true;
            }
        }
    },

    onButtonClick(event, param) {
        let node = event.node || event.target
        // console.log("点击了按钮", node.name)
        let edt = node.getComponent(cc.EditBox)
        let tog = node.getComponent(cc.Toggle)

        if (node.name == "baseScore") {
            if (cc.isValid(edt)) {
                this.onCheckRuleEditScore(edt, 1, 100, "baseScore")
            }
        } else if (node.name.startsWith("payType")) { //房费
            let fangfei = parseInt(node.name.slice(7));
            this.gameRule.payType = fangfei
            this._perFeeSync();
        } else if (node.name.startsWith("meijutoggle")) { //房费 aa砖石
            let fangfei = parseInt(node.name.slice(11));
            this.gameRule.perDiamond = fangfei
            this._perFeeSync();
        } else if (node.name.startsWith("tog_jushu")) { //局数
            this.gameRule.bureau = parseInt(node.name.slice(9));
        } else if (node.name.startsWith("tog_renshu")) { //人数
            this.gameRule.maxPlayerCount = parseInt(node.name.slice(10));
            this.gameRule.minPlayerCount = this.gameRule.maxPlayerCount;
        } else if (node.name.startsWith("tog_fanshu")) { //番数上限
            this.gameRule.maxRate = parseInt(node.name.slice(10));
        } else if (node.name.startsWith("tog_wanfa")) {
            this.gameRule.isDianPao = !!parseInt(node.name.slice(9));;
        } else if (node.name.startsWith("tog_tingyong")) {
            this.gameRule.tingYong = parseInt(node.name.slice(12));
            this.onSwitch(false);
        } else if (node.name.startsWith("tog_hongzhong")) {
            this.gameRule.hongZhong = parseInt(node.name.slice(13));
            this.onSwitch(true);
        } else if (node.name.startsWith("tog_xuanpiao")) {
            let piaoType = parseInt(node.name.slice(12));
            this.gameRule.piaoType = piaoType
        } else if (node.name.startsWith("is2FanHu")) { //2番
            this.gameRule.is2FanHu = tog.isChecked;
            if (this.gameRule.is2FanHu) {
                this.gameRule.is3FanHu = false
                this.is3FanHu.isChecked = false;
            }
        } else if (node.name.startsWith("is3FanHu")) { //3番
            this.gameRule.is3FanHu = tog.isChecked;
            if (this.gameRule.is3FanHu) {
                this.gameRule.is2FanHu = false
                this.is2FanHu.isChecked = false;
            }
        } else if (node.name.startsWith("trustTm")) { //托管
            let tidx = parseInt(node.name.slice(7));
            if (tog.isChecked) this.gameRule.trustTm = TUO_GUAN_TIME[tidx]
            this.gameRule.canTrust = this.gameRule.trustTm > 0
        } else if (node.name.startsWith("qiePaiType")) { //切牌类型
            let qtype = parseInt(node.name.slice(10));
            this.gameRule.qiePaiType = qtype
        } else if (node.name.startsWith("autoStartTm")) { //自动开局
            let tidx = parseInt(node.name.slice(11));
            this.gameRule.autoStartTm = AUTO_START_TIME[tidx]
        } else {
            let ruleKeys = Object.keys(this.gameRule)
            if (ruleKeys.includes(node.name) && cc.isValid(tog)) {
                if (typeof (this.gameRule[node.name]) == "boolean") {
                    this.gameRule[node.name] = tog.isChecked
                }
            }
        }
        console.log("save ybmj rule==", this.gameRule)
        ConfigModel.setRoomCreateCache(this.gameRule);
        this.updateDataShow();
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

    _perFeeSync() {
        return
        this.perFeeLay.active = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        if (this.gameRule.payType == Enums.roomPayType.AAZHIFU) {
            this.gameRule.perDiamond = this.gameRule.perDiamond || 1;
            this.perFeeDiamond.string = "" + (this.gameRule.perDiamond * this.gameRule.bureau)
        } else {
            this.gameRule.perDiamond = 0;
            let fee = Fee_LAMJ.Host;
            let bureau = this.gameRule.bureau;
            this.perFeeDiamond.string = fee[bureau];
        }
    },
    getRule() {
        return this.gameRule;
    },


});