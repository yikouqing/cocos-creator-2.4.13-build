const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const Utils = require("../../utils/Utils");
const CCUtil = require("../../utils/CCUtil");

cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            gameType: Enums.bundleType.BRLHD,
            yuyin: false,
            heRate: 8,//和的倍数 默认8倍
            baseScore: 2,
            fangzuobi: false,
            maxPlayerCount: 10,
            bankerScore: 1000, //上庄分数
            bankerDownScore: 10, //下庄分数
            bankerRounds: 10, //庄家轮数
            pourTime: 5, //下注时间
            pourRate: [1, 5, 10, 20, 50, 100],
            canEnter: true
        };
    },

    start() {
        let gameRule = !!this.node.nodeParams ? this.node.nodeParams.gameRule : null;
        if (!!gameRule) {
            this.gameRule = Object.assign(this.gameRule, gameRule);
        }
        this.init();
    },

    init() {
        CCUtil.nodeRecursive(this.node, (node) => {
            let edt = node.getComponent(cc.EditBox)
            if (edt) node.on("editing-did-ended", this.onButtonClick, this)
            if (node.name == "baseScore") {
                edt.string = this.gameRule.baseScore
            } else if (node.name == "bankerScore") {
                edt.string = this.gameRule.bankerScore
            } else if (node.name == "roundsBox") {
                edt.string = this.gameRule.bankerRounds
            } else if (node.name == "betTimeBox") {
                edt.string = this.gameRule.pourTime
            } else if (node.name == "heRateBox") {
                edt.string = this.gameRule.heRate
            }
        })
    },

    onButtonClick(event, param) {
        let node = event.node || event.target;
        switch (node.name) {
            case "baseScore":
                this.onCheckRuleEditScore(node, 1, 1000, "baseScore")
                break;
            case "bankerScore":
                this.onCheckRuleEditScore(node, 1000, 99999999, "bankerScore")
                break;
            case "roundsBox":
                this.onCheckRuleEditScore(node, 5, 10, "bankerRounds")
                break;
            case "betTimeBox":
                this.onCheckRuleEditScore(node, 5, 15, "pourTime")
                break;
            case "heRateBox":
                this.onCheckRuleEditScore(node, 1, 100, "heRate")
                break;
        }
        // console.log("brnn rule==", this.gameRule)
        ConfigModel.setRoomCreateCache(this.gameRule);
    },

    onCheckRuleEditScore(node, min, max, key) {
        if (!node || !node.getComponent(cc.EditBox)) return;
        let editBox = node.getComponent(cc.EditBox);
        let score = parseFloat(editBox.string)
        var r = /^\+?[1-9][0-9]*$/ //非0的正整数
        if (!r.test(editBox.string) || score > max || score < min) {
            AssetsManager.tipDialog(`输入错误,请输入${min}-${max}的数`);
            editBox.string = this.gameRule[key] || "";
            return
        }
        this.gameRule[key] = score;
    },

    getRule() {
        return this.gameRule;
    }

});