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

        /**所的选择按钮 */
        _allTogs: null,
    },

    onLoad() {
        this._allTogs = {}
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            gameType: Enums.bundleType.LAMJ,

            yuyin: false,
            baseScore: 1,
            fangzuobi: false,
            canEnter: false, //中途加入
            canTrust: false,
            trustTm: 0, //超时托管时间 0不托管
            bureau: 8, //
            maxPlayerCount: 2, //2、3、4
            minPlayerCount: 2,
            perDiamond: 0,

            bankerType: 0, //0 赢家坐庄 1表示下家做庄
            laiZiType: 3, //0 无鬼 1 白板 2红中 3翻鬼 4 翻双鬼 5花牌当鬼
            zuiZiCount: 1, //嘴子数  1 2 5
            bankerScore: 2, //庄底分 2 5 10 20
            isYiFengLan: true, //是否一风烂
            isZhuiZongBao: true, //是否追踪宝
            isBankerRandomFirst: true, //是否首局坐庄随机
            baoPaiType: 1, //包牌  1后碰者付  2平分承包
            qiePaiType: 0, //切牌  0不切牌 1所有人切牌 2输家切牌
            autoStartTm: 0, //下一局自动开始时间 0不自动开始
        };
    },

    start() {
        this.fangfeiPannel.active = !(!!this.node.nodeParams && !!this.node.nodeParams.isUnion);
        let gameRule = !!this.node.nodeParams ? this.node.nodeParams.gameRule : null;
        if (!!gameRule) {
            this.gameRule = Object.assign(this.gameRule, gameRule);
        }
        //this.gameRule = !!this.node.nodeParams && !!this.node.nodeParams.gameRule ? this.node.nodeParams.gameRule : this.gameRule;
        this.init();
    },

    init() {
        let ruleKeys = Object.keys(this.gameRule)
        // console.log("rule===", this.gameRule)
        this._perFeeSync();
        this.gameRule.baseScore = this.gameRule.zuiZiCount
        CCUtil.nodeRecursive(this.node, (node) => {
            let tog = node.getComponent(cc.Toggle)
            let edt = node.getComponent(cc.EditBox)

            let eventName = ""
            if (tog) {
                eventName = "toggle"
                this._allTogs[node.name] = tog
            } else if (edt) {
                eventName = "editing-did-ended"
            }
            if (eventName != "") {
                node.on(eventName, this.onButtonClick, this)
            }

            if (node.name == "baseScore") {
                edt.string = this.gameRule.baseScore
            } else if (node.name.startsWith("bureau")) { //局数
                let round = parseInt(node.name.slice(6));
                if (this.gameRule.bureau == round) tog.isChecked = true
            } else if (node.name.startsWith("maxPlayerCount")) { //人数
                let renshu = parseInt(node.name.slice(14));
                if (this.gameRule.maxPlayerCount == renshu) tog.isChecked = true
                this.gameRule.minPlayerCount = renshu
            } else if (node.name.startsWith("payType")) { //房费
                let pt = parseInt(node.name.slice(7));
                if (this.gameRule.payType == pt) tog.isChecked = true
            } else if (node.name.startsWith("meijutoggle")) { //房费 钻石
                let pt = parseInt(node.name.slice(11));
                if (this.gameRule.perDiamond == pt) tog.isChecked = true
            } else if (node.name.startsWith("trustTm")) { //托管
                let tidx = parseInt(node.name.slice(7));
                if (TUO_GUAN_TIME.indexOf(this.gameRule.trustTm) == tidx) tog.isChecked = true
            } else if (node.name.startsWith("zuiZiCount")) { //嘴子数
                let count = parseInt(node.name.slice(10));
                if (this.gameRule.zuiZiCount == count) tog.isChecked = true
            } else if (node.name.startsWith("bankerScore")) { //庄底分
                let score = parseInt(node.name.slice(11));
                if (this.gameRule.bankerScore == score) tog.isChecked = true
            } else if (node.name.startsWith("baoPaiType")) { //包牌类型
                let btype = parseInt(node.name.slice(10));
                if (this.gameRule.baoPaiType == btype) tog.isChecked = true
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
    },

    /**根据规则名字 设置tog */
    setTogByRule(ruleKey, enable, setCheck) {
        let tog = this._allTogs[ruleKey]
        if (tog) {
            tog.interactable = enable
            if (setCheck && !enable) {
                tog.isChecked = false
            }
        }
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

    onButtonClick(event, param) {
        let node = event.node || event.target
        // console.log("点击了按钮", node.name)
        let edt = node.getComponent(cc.EditBox)
        let tog = node.getComponent(cc.Toggle)

        if (node.name == "baseScore") {
            if (cc.isValid(edt)) {
                this.onCheckRuleEditScore(edt, 1, 100, "baseScore")
            }
        } else if (node.name.includes("bureau")) {
            let round = parseInt(node.name.slice(6));
            this.gameRule.bureau = round
            this._perFeeSync();
        } else if (node.name.startsWith("maxPlayerCount")) { //人数
            let renshu = parseInt(node.name.slice(14));
            this.gameRule.maxPlayerCount = renshu
            this.gameRule.minPlayerCount = renshu
        } else if (node.name.startsWith("payType")) { //房费
            let fangfei = parseInt(node.name.slice(7));
            this.gameRule.payType = fangfei
            this._perFeeSync();
        } else if (node.name.startsWith("meijutoggle")) { //房费 aa砖石
            let fangfei = parseInt(node.name.slice(11));
            this.gameRule.perDiamond = fangfei
            this._perFeeSync();
        } else if (node.name.startsWith("trustTm")) { //托管
            let tidx = parseInt(node.name.slice(7));
            if (tog.isChecked) this.gameRule.trustTm = TUO_GUAN_TIME[tidx]
            this.gameRule.canTrust = this.gameRule.trustTm > 0
        } else if (node.name.startsWith("zuiZiCount")) { //嘴子数
            let count = parseInt(node.name.slice(10));
            this.gameRule.zuiZiCount = count
            this.gameRule.baseScore = count
        } else if (node.name.startsWith("bankerScore")) { //庄底分
            let score = parseInt(node.name.slice(11));
            this.gameRule.bankerScore = score
        } else if (node.name.startsWith("baoPaiType")) { //包牌类型
            let btype = parseInt(node.name.slice(10));
            this.gameRule.baoPaiType = btype
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
        // console.log("save liuanmj rule==", this.gameRule)
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