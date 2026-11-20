const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const Utils = require("../../utils/Utils");
const CCUtil = require("../../utils/CCUtil");

cc.Class({
    extends: cc.Component,

    properties: {
        _bankerRounds_min: 1,
        _bankerRounds_max: 10,
        _pourTime_min: 5,
        _pourTime_max: 15,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            gameType: Enums.bundleType.BRNN,
            yuyin: false,
            baseScore: 1,
            fangzuobi: false,
            maxPlayerCount: 10,
            bankerScore: 1000, //上庄分数
            bankerDownScore: 10, //下庄分数
            bankerRounds: 10, //庄家轮数
            pourTime: 5, //下注时间
            baseRate: 3, //牛牛倍数
            tongHuaShun: false, //同花顺
            zhaDanNiu: false, //炸弹牛
            shunZiNiu: false, //顺子牛
            yiTiaoLong: false, //一条龙
            huLuNiu: false, //葫芦牛
            jinHuaNiu: false, //金花牛
            wuXiaoNiu: false, //五花牛
            tongHuaNiu: false, //同花牛
            canEnter: true,

            pourRate: [1, 5, 10, 20, 50, 100],
        };
    },

    start() {
        let gameRule = !!this.node.nodeParams ? this.node.nodeParams.gameRule : null;
        if (!!gameRule) {
            this.gameRule = Object.assign(this.gameRule, gameRule);
        }
        //this.gameRule = !!this.node.nodeParams && !!this.node.nodeParams.gameRule ? this.node.nodeParams.gameRule : this.gameRule;
        this.init();
    },

    init() {
        let ruleKeys = Object.keys(this.gameRule)
        // console.log("ruleKeys===", ruleKeys)
        CCUtil.nodeRecursive(this.node, (node) => {
            let tog = node.getComponent(cc.Toggle)
            let btn = node.getComponent(cc.Button)
            let edt = node.getComponent(cc.EditBox)
            let txt = node.getComponent(cc.Label)
            if (tog || btn) node.on("click", this.onButtonClick, this)
            if (edt) node.on("editing-did-ended", this.onButtonClick, this)

            if (node.name == "baseScore") {
                edt.string = this.gameRule.baseScore
            } else if (node.name == "bankerScore") {
                edt.string = this.gameRule.bankerScore
            } else if (node.name == "txt_bankerRounds") {
                txt.string = this.gameRule.bankerRounds
                this.txt_bankerRounds = txt
            } else if (node.name == "txt_betTime") {
                txt.string = this.gameRule.pourTime
                this.txt_betTime = txt
            } else if (node.name.startsWith("baseRate")) {
                let br = parseInt(node.name.slice(8));
                tog.isChecked = this.gameRule.baseRate == br
            } else {
                if (ruleKeys.includes(node.name) && cc.isValid(tog)) {
                    // console.log("恢复选项===", node.name)
                    tog.isChecked = this.gameRule[node.name]
                }
            }
        })
    },

    onButtonClick(event, param) {
        let node = event.node || event.target
        // console.log("点击了按钮", node.name, node, event.target)
        let edt = node.getComponent(cc.EditBox)
        switch (node.name) {
            case "baseScore":
                if (cc.isValid(edt)) {
                    this.onCheckRuleEditScore(edt, 1, 100, "baseScore")
                }
                break;
            case "bankerScore":
                if (cc.isValid(edt)) {
                    this.onCheckRuleEditScore(edt, 1000, 99999999, "bankerScore")
                }
                break;
            case "baseRate3":
            case "baseRate5":
            case "baseRate10":
                let br = parseInt(node.name.slice(8));
                this.gameRule.baseRate = br
                break;
            case "btn_bradd":
                this.gameRule.bankerRounds++
                if (this.gameRule.bankerRounds > this._bankerRounds_max) this.gameRule.bankerRounds = this._bankerRounds_min
                this.txt_bankerRounds.string = this.gameRule.bankerRounds
                break;
            case "btn_brsub":
                this.gameRule.bankerRounds--
                if (this.gameRule.bankerRounds < this._bankerRounds_min) this.gameRule.bankerRounds = this._bankerRounds_max
                this.txt_bankerRounds.string = this.gameRule.bankerRounds
                break;
            case "btn_btadd":
                this.gameRule.pourTime++
                if (this.gameRule.pourTime > this._pourTime_max) this.gameRule.pourTime = this._pourTime_min
                this.txt_betTime.string = this.gameRule.pourTime
                break;
            case "btn_btsub":
                this.gameRule.pourTime--
                if (this.gameRule.pourTime < this._pourTime_min) this.gameRule.pourTime = this._pourTime_max
                this.txt_betTime.string = this.gameRule.pourTime
                break;
            default:
                let tog = node.getComponent(cc.Toggle)
                let ruleKeys = Object.keys(this.gameRule)
                if (ruleKeys.includes(node.name) && cc.isValid(tog)) {
                    this.gameRule[node.name] = tog.isChecked
                }
                break;
        }
        // console.log("brnn rule==", this.gameRule)
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