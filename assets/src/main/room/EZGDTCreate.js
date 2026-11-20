const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const Utils = require("../../utils/Utils");
const CCUtil = require("../../utils/CCUtil");
const POUR_LIST = [[1, 2, 4, 5], [1, 3, 5, 8], [2, 4, 6, 10]]

cc.Class({
    extends: cc.Component,

    properties: {
        fangfeiPannel: cc.Node,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 10,
            maxPlayerCount: 10,
            minPlayerCount: 2,
            gameType: Enums.bundleType.EZGDT,
            canTrust: false,
            trustTm: 0,
            yuyin: false,
            baseScore: 1,
            canWatch: true,
            canEnter: true,
            lastThreeJoin: false,

            isSamePing: 2, //1为庄家赢 2为平局 3为庄家输
            wangType: 1, // 1 王当任意  2 大王2点 小王1点
            canPourScores: [1, 2, 4, 5], //下注按钮
            canPourScoresIdx: 0,//下标
            showCardTime: 5, //亮牌时间 秒
            pourTick: 5,//下注时间 秒
            bankerType: 2,//1轮庄 2抢庄 3霸王庄
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
            } else if (node.name == "showCardTime") {
                edt.string = this.gameRule.showCardTime
            } else if (node.name == "pourTick") {
                edt.string = this.gameRule.pourTick
            } else if (node.name.startsWith("bureau")) { //局数
                let round = parseInt(node.name.slice(6));
                if (this.gameRule.bureau == round) tog.isChecked = true
            } else if (node.name.startsWith("maxPlayerCount")) { //人数
                let renshu = parseInt(node.name.slice(14));
                if (this.gameRule.maxPlayerCount == renshu) tog.isChecked = true
            } else if (node.name.startsWith("payType")) { //房费
                let pt = parseInt(node.name.slice(7));
                if (this.gameRule.payType == pt) tog.isChecked = true
            } else if (node.name.startsWith("wangType")) { //王牌点数
                let type = parseInt(node.name.slice(8));
                if (this.gameRule.wangType == type) tog.isChecked = true
            } else if (node.name.startsWith("isSamePing")) { //同点数输赢
                let type = parseInt(node.name.slice(10));
                if (this.gameRule.isSamePing == type) tog.isChecked = true
            } else if (node.name.startsWith("canPourScoresIdx")) { //下注按钮
                let idx = parseInt(node.name.slice(16));
                if (this.gameRule.canPourScoresIdx == idx) tog.isChecked = true
                let pourScores = POUR_LIST[idx]
                if (pourScores) {
                    cc.find("count", node).getComponent(cc.Label).string = pourScores.join("/")
                }
            } else if (node.name.startsWith("bankerType")) { //模式
                let type = parseInt(node.name.slice(10));
                if (this.gameRule.bankerType == type) tog.isChecked = true
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
        } else if (node.name == "showCardTime") {
            if (cc.isValid(edt)) {
                this.onCheckRuleEditScore(edt, 5, 30, "showCardTime")
            }
        } else if (node.name == "pourTick") {
            if (cc.isValid(edt)) {
                this.onCheckRuleEditScore(edt, 5, 30, "pourTick")
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
        } else if (node.name.startsWith("wangType")) { //王牌点数
            let type = parseInt(node.name.slice(8));
            this.gameRule.wangType = type
        } else if (node.name.startsWith("isSamePing")) { //同点数输赢
            let type = parseInt(node.name.slice(10));
            this.gameRule.isSamePing = type
        } else if (node.name.startsWith("canPourScoresIdx")) { //下注按钮
            let idx = parseInt(node.name.slice(16));
            this.gameRule.canPourScoresIdx = idx
            this.gameRule.canPourScores = POUR_LIST[idx]
        } else if (node.name.startsWith("bankerType")) { //模式
            let type = parseInt(node.name.slice(10));
            this.gameRule.bankerType = type
        } else {
            let ruleKeys = Object.keys(this.gameRule)
            if (ruleKeys.includes(node.name) && cc.isValid(tog)) {
                if (typeof (this.gameRule[node.name]) == "boolean") {
                    this.gameRule[node.name] = tog.isChecked
                }
            }
        }
        console.log("save ezgdt rule==", this.gameRule)
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