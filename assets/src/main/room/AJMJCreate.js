const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const Utils = require("../../utils/Utils");
const CCUtil = require("../../utils/CCUtil");
const { Fee_AJMJ } = require('../../const/Defines');
cc.Class({
    extends: cc.Component,

    properties: {
        fangfeiPannel: cc.Node,
        bukechi: cc.Toggle,
        perFeeLay: cc.Node,
        perFeeDiamond: cc.Label,
        /**所的选择按钮 */
        _allTogs: null,
    },

    onLoad() {

        this._allTogs = {}

        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            gameType: Enums.bundleType.AJMJ,
            yuyin: false,
            baseScore: 1,
            fangzuobi: false,
            canEnter: false, //中途加入
            canTrust: false, //托管
            trustTm: 0, //超时托管时间 0不托管
            bureau: 8, //局数
            maxPlayerCount: 2, //2、3、4
            minPlayerCount: 2,
            huaCount: 11,//花数
            TDHSiCaiScore: 10,//天地胡
            queYiMen: false, //缺一门
            caiShenZhuaTou: false, //有财神
            sanCaiShenZhuaTou: false, //三财神
            siCaiShenBaoDi: false,//四财神 
            meiGangFen: false, //每杠算分
            qingYiSe: false, //清一色
            buKeChi: false, //不可吃
            perDiamond: 0
        };
        this._saveRule = Utils.deepCopy(this.gameRule)
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
        if (this.gameRule.maxPlayerCount == 4) {
            this.bukechi.interactable = true;
        } else {
            this.bukechi.interactable = false;
            this.gameRule.buKeChi = true;
        }

        this._perFeeSync();
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
            if (node.name == "baseScore") {//底分
                edt.string = this.gameRule.baseScore
            } else if (node.name.startsWith("bureau")) { //局数
                let round = parseInt(node.name.slice(6));
                if (this.gameRule.bureau == round) tog.isChecked = true
            } else if (node.name.startsWith("maxPlayerCount")) { //人数
                let renshu = parseInt(node.name.slice(14));
                if (this.gameRule.maxPlayerCount == renshu) tog.isChecked = true
            } else if (node.name.startsWith("payType")) { //房费
                let pt = parseInt(node.name.slice(7));
                if (this.gameRule.payType == pt) tog.isChecked = true
            } else if (node.name.startsWith("meijutoggle")) { //房费 钻石
                let pt = parseInt(node.name.slice(11));
                if (this.gameRule.perDiamond == pt) tog.isChecked = true
            } else if (node.name.startsWith("hua")) { //花数
                let hua = parseInt(node.name.slice(3));
                if (this.gameRule.huaCount == hua) tog.isChecked = true
            } else if (node.name.startsWith("tiandihu")) { //特殊 天地胡
                let tiandihu = parseInt(node.name.slice(8));
                if (this.gameRule.TDHSiCaiScore == tiandihu) tog.isChecked = true
            } else if (node.name == "queyimen") { //缺一门 
                if (this.gameRule.queYiMen == true) tog.isChecked = true
            } else if (node.name == "youCaishen") { //有财神
                if (this.gameRule.caiShenZhuaTou == true) tog.isChecked = true
            } else if (node.name == "sanCaishen") { //三财神
                if (this.gameRule.sanCaiShenZhuaTou == true) tog.isChecked = true
            } else if (node.name == "siCaishen") { //四财神
                if (this.gameRule.siCaiShenBaoDi == true) tog.isChecked = true
            } else if (node.name.startsWith("meiGang")) { //每杠算分
                if (this.gameRule.meiGangFen == true) tog.isChecked = true
            } else if (node.name.startsWith("qingYiSe")) { //清一色 
                if (this.gameRule.qingYiSe == true) tog.isChecked = true
            } else if (node.name.startsWith("buKeChi")) { // 不可吃
                if (this.gameRule.buKeChi == true) tog.isChecked = true
            } else if (node.name.startsWith("trustTm")) { //托管
                let trustTm = parseInt(node.name.slice(7));
                if (this.gameRule.trustTm == trustTm) tog.isChecked = true

            }
        })
    },


    onButtonClick(event, param) {
        let node = event.node || event.target
        let edt = node.getComponent(cc.EditBox)
        let tog = node.getComponent(cc.Toggle)
        // console.log("点击了按钮", node.name, tog && tog.isChecked)
        if (node.name == "baseScore") { //底分
            if (cc.isValid(edt)) {
                this.onCheckRuleEditScore(edt, 1, 100, "baseScore")
            }
        } else if (node.name.includes("bureau")) { //局数
            let round = parseInt(node.name.slice(6));
            this.gameRule.bureau = round
            this._perFeeSync();
        } else if (node.name.startsWith("maxPlayerCount")) { //人数
            let renshu = parseInt(node.name.slice(14));
            this.gameRule.maxPlayerCount = renshu
            this.gameRule.minPlayerCount = renshu
            if (renshu == 4) {
                this.bukechi.interactable = true;
            } else {
                this.bukechi.interactable = false;
                this.gameRule.buKeChi = true;
            }
        } else if (node.name.startsWith("payType")) { //房费
            let fangfei = parseInt(node.name.slice(7));
            // this.gameRule.payType = fangfei
            this.gameRule.payType = fangfei
            this._perFeeSync();
        } else if (node.name.startsWith("meijutoggle")) { //房费 aa砖石
            let fangfei = parseInt(node.name.slice(11));
            this.gameRule.perDiamond = fangfei
            this._perFeeSync();
        }
        else if (node.name.startsWith("hua")) { //花数
            let hua = parseInt(node.name.slice(3));
            this.gameRule.huaCount = hua
        } else if (node.name.startsWith("tiandihu")) { //天地胡  10  30 
            let type = parseInt(node.name.slice(8));
            this.gameRule.TDHSiCaiScore = type
        } else if (node.name == "queyimen") {//缺一门
            this.gameRule.queYiMen = tog.isChecked;
        } else if (node.name == "youCaishen") { //有财神
            this.gameRule.caiShenZhuaTou = tog.isChecked;
        } else if (node.name == "sanCaishen") { //三财神
            this.gameRule.sanCaiShenZhuaTou = tog.isChecked;
        } else if (node.name == "siCaishen") { //四财神
            // console.log(tog.isChecked, '四财神-----------');
            this.gameRule.siCaiShenBaoDi = tog.isChecked;
        } else if (node.name.startsWith("meiGang")) { //每杠算分
            this.gameRule.meiGangFen = tog.isChecked;
        } else if (node.name.startsWith("qingYiSe")) { //清一色 
            this.gameRule.qingYiSe = tog.isChecked;
        } else if (node.name.startsWith("buKeChi")) { // 不可吃
            this.gameRule.buKeChi = tog.isChecked;
        }
        else if (node.name.startsWith("trustTm")) { //托管
            let tidx = parseInt(node.name.slice(7));
            this.gameRule.trustTm = tidx;
            this.gameRule.canTrust = !!tidx;
        }
        // console.log("save gdybz rule==", this.gameRule)
        ConfigModel.setRoomCreateCache(this.gameRule);
    },




    _perFeeSync() {
        return
        this.perFeeLay.active = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        if (this.gameRule.payType == Enums.roomPayType.AAZHIFU) {
            this.gameRule.perDiamond = this.gameRule.perDiamond || 1;
            this.perFeeDiamond.string = "" + (this.gameRule.perDiamond * this.gameRule.bureau)
        } else {
            this.gameRule.perDiamond = 0;
            let fee = Fee_AJMJ.Host;
            let bureau = this.gameRule.bureau;
            this.perFeeDiamond.string = fee[bureau];
        }
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