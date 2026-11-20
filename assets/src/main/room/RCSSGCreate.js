const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const Utils = require("../../utils/Utils");
const CCUtil = require("../../utils/CCUtil");

cc.Class({
    extends: cc.Component,

    properties: {
        node_fangfei: cc.Node,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            gameType: Enums.bundleType.RCSSGMJ,
            canTrust: false,
            /* 托管时间 */
            trustTm: 0,
            yuyin: false,
            baseScore: 1,
            fangzuobi: false,
            canEnter: false, //中途加入

            bureau: 8, //8、12、16
            maxPlayerCount: 2, //2、3、4
            minPlayerCount: 2,

            huanpai: 1, //换牌 0不换牌 1 换三张  2 换1-5张
            ziMoRateType: 1, //自摸  1 自摸加底 2 自摸×2
            houSiBiHu: false, //后四张必胡
        };
    },

    start() {
        this.node_fangfei.active = !(!!this.node.nodeParams && !!this.node.nodeParams.isUnion);
        let gameRule = !!this.node.nodeParams ? this.node.nodeParams.gameRule : null;
        if (!!gameRule) {
            this.gameRule = Object.assign(this.gameRule, gameRule);
        }
        let fen = {
            /**分数字段 */
            dianGang: 2, //点杠
            jiaoGui: 4, //脚归
            diHu: 10, //地胡
            shouGui: 6, //手归
            baoJiao: 5, //报叫
            chaJiao: 6, //查叫
            fanChaJiao: 6, //反查叫
            haiDi: 6, //海底
        }
        this.gameRule = Object.assign(this.gameRule, fen);
        this.init();
    },

    init() {
        let ruleKeys = Object.keys(this.gameRule)
        CCUtil.nodeRecursive(this.node, (node) => {
            node.targetOff(this);
            let name = node.name;
            let tog = node.getComponent(cc.Toggle)
            let btn = node.getComponent(cc.Button)
            let edt = node.getComponent(cc.EditBox)

            let eventName = ""
            if (tog) {
                eventName = "toggle"
            } else if (btn) {
                eventName = "click"
            } else if (edt) {
                eventName = "editing-did-ended"
            }
            if (eventName != "") {
                node.on(eventName, this.onButtonClick, this);
            }

            if (name == "baseScore") {
                edt.string = this.gameRule.baseScore
            } else if (name.startsWith("tog_jushu")) {
                let jushu = parseInt(name.slice(9));
                tog.isChecked = this.gameRule.bureau == jushu;
            } else if (name.startsWith("tog_renshu")) {
                let num = parseInt(name.slice(10));
                tog.isChecked = this.gameRule.minPlayerCount == num
            } else if (name.startsWith("tog_fangfei")) {
                let num = parseInt(name.slice(11));
                tog.isChecked = this.gameRule.payType == num;
            } else if (name.startsWith("tog_tuoguan")) {
                let num = parseInt(name.slice(11));
                tog.isChecked = this.gameRule.trustTm == num;
            } else if (name.startsWith("tog_huanpai")) {
                let num = parseInt(name.slice(11));
                tog.isChecked = this.gameRule.huanpai == num;
            } else if (name.startsWith("tog_ziMoRateType")) {
                let num = parseInt(name.slice(16));
                tog.isChecked = this.gameRule.ziMoRateType == num;
            } else {
                let namekey = name.slice(4);
                if (ruleKeys.includes(namekey) && cc.isValid(tog)) {
                    tog.isChecked = this.gameRule[namekey];
                }
            }
        })
    },

    onButtonClick(event, param) {
        let node = event.node || event.target;
        let name = node.name;
        if (name.startsWith("baseScore")) {
            this.onCheckRuleEditScore(node, 1, 100, "baseScore")
        } else if (name.startsWith("tog_renshu")) {
            let renshu = parseInt(name.slice(10));
            this.gameRule.maxPlayerCount = renshu;
            this.gameRule.minPlayerCount = renshu;
        } else if (name.startsWith("tog_fangfei")) {
            let num = parseInt(name.slice(11));
            this.gameRule.payType = num;
        } else if (name.startsWith("tog_tuoguan")) {
            let time = parseInt(name.slice(11));
            this.gameRule.canTrust = !!time;
            this.gameRule.trustTm = time;
        } else if (name.startsWith("tog_jushu")) {
            let jushu = parseInt(name.slice(9));
            this.gameRule.bureau = jushu;
        } else if (name.startsWith("tog_huanpai")) {
            let num = parseInt(name.slice(11));
            this.gameRule.huanpai = num;
        } else if (name.startsWith("tog_ziMoRateType")) {
            let num = parseInt(name.slice(16));
            this.gameRule.ziMoRateType = num;
        } else {
            let namekey = name.slice(4);
            let tog = node.getComponent(cc.Toggle)
            let ruleKeys = Object.keys(this.gameRule)
            if (ruleKeys.includes(namekey) && cc.isValid(tog)) {
                this.gameRule[namekey] = !!event.isChecked;
            }
        }
        console.log(this.gameRule.gameType, "rule==", this.gameRule)
        ConfigModel.setRoomCreateCache(this.gameRule);
    },

    onCheckRuleEditScore(node, min, max, key) {
        if (!node || !node.getComponent(cc.EditBox)) return;
        let editBox = node.getComponent(cc.EditBox);
        let score = parseFloat(editBox.string)
        var r = /^\+?[1-9][0-9]*$/ //非0的正整数
        if (parseInt(min) < parseFloat(min)) { //判断是否为小数
            r = /^([1-9][0-9]*|0)(\.[1-9]?)?$/ //一位小数
        }
        if (!r.test(editBox.string) || score > max || score < min) {
            AssetsManager.tipDialog(`输入错误,请输入${min}-${max}的数`);
            editBox.string = this.gameRule[key] || "";
            return
        }
        this.gameRule[key] = score;
    },

    getRule() {
        return this.gameRule;
    },

});