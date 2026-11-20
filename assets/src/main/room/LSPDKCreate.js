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
        perFeeLay: cc.Node,
        perFeeDiamond: cc.Label,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 10,
            minPlayerCount: 2,
            maxPlayerCount: 2,
            gameType: Enums.bundleType.LSPDK,
            baiwei: false,
            canTrust: true,
            trustTm: 30,
            canWatch: false,
            baseScore: 1,
            showCardsCount: true,
            // sanzhangsuanzha: true,
            cardCount: 10, //经典玩法10张
            hongtao10: false, //红桃10双倍
            ziMeiDui: true, //姊妹对 
            mingTangFen: 10, //明堂分 10/20
            quanHei: false, //全黑 
            quanHong: false, //全红 
            quanDa: false, //全大 
            quanXiao: false, //全小 
            quanDan: false, //全单 
            quanShuang: false, //全双
            boomScore: 5, //炸弹分默认5
            bichu: true, //必出
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
        this._perFeeSync();
        let ruleKeys = Object.keys(this.gameRule)
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
            } else if (node.name.startsWith("trustTm")) { //托管
                let trustTm = parseInt(node.name.slice(7));
                if (this.gameRule.trustTm == trustTm) tog.isChecked = true
            } else if (node.name.startsWith("zhaniao")) { //扎鸟
                let zhaniao = parseInt(node.name.slice(7));
                if (!!this.gameRule.hongtao10 && zhaniao == 1) tog.isChecked = true;
            } else if (node.name.startsWith("zhimeidui")) { //姊妹对
                let zhimeidui = parseInt(node.name.slice(9));
                if (this.gameRule.ziMeiDui && zhimeidui == 1) tog.isChecked = true;
            } else if (node.name.startsWith("zhadanfen")) { //炸弹分
                let zhadanfen = parseInt(node.name.slice(9));
                if (this.gameRule.boomScore == zhadanfen) tog.isChecked = true;
            } else if (node.name.startsWith("mingtangfen")) { //明堂分
                let mingtangfen = parseInt(node.name.slice(11));
                if (this.gameRule.mingTangFen == mingtangfen) tog.isChecked = true;
            } else {
                if (ruleKeys.includes(node.name) && cc.isValid(tog) && typeof (this.gameRule[node.name]) == "boolean") {
                    tog.isChecked = !!this.gameRule[node.name]
                }
            }
        })
    },


    onButtonClick(event, param) {
        let node = event.node || event.target
        let edt = node.getComponent(cc.EditBox)
        let tog = node.getComponent(cc.Toggle)
        if (node.name == "baseScore") { //底分
            if (cc.isValid(edt)) {
                this.onCheckRuleEditScore(edt, 0.1, 100, "baseScore")
            }
        } else if (node.name.includes("bureau")) { //局数
            let round = parseInt(node.name.slice(6));
            this.gameRule.bureau = round
            this._perFeeSync();
        } else if (node.name.startsWith("maxPlayerCount")) { //人数
            let renshu = parseInt(node.name.slice(14));
            this.gameRule.maxPlayerCount = renshu
            this.gameRule.minPlayerCount = renshu

        } else if (node.name.startsWith("payType")) { //房费
            let fangfei = parseInt(node.name.slice(7));
            // this.gameRule.payType = fangfei
            this.gameRule.payType = fangfei
            this._perFeeSync();
        } else if (node.name.startsWith("meijutoggle")) { //房费 aa砖石
            let fangfei = parseInt(node.name.slice(11));
            this.gameRule.perDiamond = fangfei
            this._perFeeSync();
        } else if (node.name.startsWith("trustTm")) { //托管
            let tidx = parseInt(node.name.slice(7));
            this.gameRule.trustTm = tidx;
            this.gameRule.canTrust = !!tidx;
        } else if (node.name.startsWith("zhaniao")) { //扎鸟
            let zhaniao = parseInt(node.name.slice(7));
            this.gameRule.hongtao10 = zhaniao == 1;
        } else if (node.name.startsWith("zhimeidui")) { //姊妹对
            let zhimeidui = parseInt(node.name.slice(9));
            this.gameRule.ziMeiDui = zhimeidui == 1
        } else if (node.name.startsWith("zhadanfen")) { //炸弹分
            let zhadanfen = parseInt(node.name.slice(9));
            this.gameRule.boomScore = zhadanfen;
        } else if (node.name.startsWith("mingtangfen")) { //明堂分
            let mingtangfen = parseInt(node.name.slice(11));
            this.gameRule.mingTangFen = mingtangfen
        } else {
            let ruleKeys = Object.keys(this.gameRule)
            if (ruleKeys.includes(node.name) && cc.isValid(tog)) {
                if (typeof (this.gameRule[node.name]) == "boolean") {
                    this.gameRule[node.name] = tog.isChecked;
                }
            }
        }
        // console.log("save LSPDK rule==", this.gameRule)
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
        var r = /^([1-9][0-9]*|0)(\.[1-9]?)?$/ //一位小数
        if (!r.test(editBox.string) || score > max || score < min) {
            editBox.string = min;
            this.gameRule[key] = min;
            AssetsManager.tipDialog(`输入错误,请输入${min}-${max}的数字(小数最多一位)！！`);
            return
        }
        this.gameRule[key] = score;
    },


    getRule() {
        return this.gameRule;
    }

});