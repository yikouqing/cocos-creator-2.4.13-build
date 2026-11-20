const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const Utils = require("../../utils/Utils");
const CCUtil = require("../../utils/CCUtil");

let DFZ = ["500-1000", "2000-4000", "3000-6000"]
let MPS = [200, 600, 800]

cc.Class({
    extends: cc.Component,

    properties: {
        fangfeiPannel: cc.Node,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 10,
            maxPlayerCount: 4,
            minPlayerCount: 2,
            gameType: Enums.bundleType.CNJJ,
            canTrust: false,
            trustTm: 0,
            yuyin: false,
            baseScore: 1,
            fangzuobi: false,

            unReadyKick: 0,
            tongji: false,
            location: false,
            canWatch: true,
            canEnter: true,
            minGuoSocre: 500,
            maxGuoScore: 1000,
            minPourScore: 200,
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
            } else if (node.name.startsWith("dfz")) { //底分庄
                let idx = parseInt(node.name.slice(3));
                let str = this.gameRule.minGuoSocre + "-" + this.gameRule.maxGuoScore
                if (DFZ[idx] === str) {
                    tog.isChecked = true
                    this.gameRule.minPourScore = MPS[idx]
                }
            } else {
                if (ruleKeys.includes(node.name) && cc.isValid(tog)) {
                    if (typeof (this.gameRule[node.name]) == "boolean") {
                        tog.isChecked = this.gameRule[node.name]
                    }
                }
            }
        })
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
        } else if (node.name.startsWith("maxPlayerCount")) { //人数
            let renshu = parseInt(node.name.slice(14));
            this.gameRule.maxPlayerCount = renshu
            // this.gameRule.minPlayerCount = renshu
        } else if (node.name.startsWith("payType")) { //房费
            let fangfei = parseInt(node.name.slice(7));
            this.gameRule.payType = fangfei
        } else if (node.name.startsWith("dfz")) { //底分庄
            let idx = parseInt(node.name.slice(3));
            let str = DFZ[idx]
            let list = str.split("-")
            this.gameRule.minGuoSocre = parseInt(list[0])
            this.gameRule.maxGuoScore = parseInt(list[1])
            this.gameRule.minPourScore = MPS[idx]
        } else {
            let ruleKeys = Object.keys(this.gameRule)
            if (ruleKeys.includes(node.name) && cc.isValid(tog)) {
                if (typeof (this.gameRule[node.name]) == "boolean") {
                    this.gameRule[node.name] = tog.isChecked
                }
            }
        }
        // console.log("save cnjj rule==", this.gameRule)
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