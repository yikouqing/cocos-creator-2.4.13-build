const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const Utils = require("../../utils/Utils");
const CCUtil = require("../../utils/CCUtil");

cc.Class({
    extends: cc.Component,

    properties: {
        node_jushu: cc.Node,
        node_guize: cc.Node,
        node_fangfei: cc.Node,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            gameType: Enums.bundleType.ENSMJ,
            canTrust: false,
            /* 托管时间 */
            trustTm: 0,
            yuyin: false,
            baseScore: 1,
            fangzuobi: false,
            canEnter: false,//中途加入

            bureau: 8,//6、8、12、16、24
            maxPlayerCount: 2,//2、3、4
            minPlayerCount: 2,

            wanfa: 0,//一痞二赖、1：八痞四赖
            taizhuang: false,//抬庄
            quwan: false,//去万
            gangshangpao: false,//杠上炮
            dapijinhu: false,//打痞禁胡
            dalaijinhu: false,//打赖禁胡
            jinzhiyangpi: false,//禁止养赖
            jianhuxuzimo: false,//见胡需自摸
            guolai: false,//过赖
            yilaidaodi: false,//一赖到底
            xiaoxuejinhu: false,//小血禁胡
            dachupilaisuanfen: false,//打出痞赖算分
        };
    },

    start() {
        this.node_fangfei.active = !(!!this.node.nodeParams && !!this.node.nodeParams.isUnion);
        let gameRule = !!this.node.nodeParams ? this.node.nodeParams.gameRule : null;
        if (!!gameRule) {
            this.gameRule = Object.assign(this.gameRule, gameRule);
        }
        this.init();
    },

    init() {
        let ruleKeys = Object.keys(this.gameRule)
        CCUtil.nodeRecursive(this.node, (node) => {
            node.targetOff(this);
            let txt = node.getComponent(cc.Label)
            let tog = node.getComponent(cc.Toggle)
            let btn = node.getComponent(cc.Button)
            let edt = node.getComponent(cc.EditBox)

            if (tog) { node.on("toggle", this.onButtonClick, this); }
            else if (btn) { node.on("click", this.onButtonClick, this); }
            else if (edt) { node.on("editing-did-ended", this.onButtonClick, this); }
            if (node.name == "baseScore") {
                edt.string = this.gameRule.baseScore
            } else if (node.name.startsWith("tog_renshu")) {
                let num = parseInt(node.name.slice(10));
                tog.isChecked = this.gameRule.minPlayerCount == num
            } else if (node.name.startsWith("tog_fangfei")) {
                let num = parseInt(node.name.slice(11));
                tog.isChecked = this.gameRule.payType == num;
            } else if (node.name.startsWith("tog_tuoguan")) {
                let num = parseInt(node.name.slice(11));
                tog.isChecked = this.gameRule.trustTm == num;
            }
            else {
                if (ruleKeys.includes(node.name) && cc.isValid(tog)) {
                    tog.isChecked = this.gameRule[node.name]
                }
            }
        })
        this.showRenShu(this.gameRule.maxPlayerCount);
    },

    onButtonClick(event, param) {
        let node = event.node || event.target
        switch (node.name) {
            case "baseScore":
                this.onCheckRuleEditScore(node, 1, 100, "baseScore")
                break;
            case "tog_renshu2":
            case "tog_renshu3":
            case "tog_renshu4":
                let renshu = parseInt(node.name.slice(10));
                this.gameRule.maxPlayerCount = renshu;
                this.gameRule.minPlayerCount = renshu;
                this.showRenShu(renshu);
                break;
            case "tog_jushu6":
            case "tog_jushu8":
            case "tog_jushu12":
            case "tog_jushu16":
            case "tog_jushu24":
                let jushu = parseInt(node.name.slice(9));
                this.gameRule.bureau = jushu;
                break;
            case "tog_wanfa0":
            case "tog_wanfa1":
                let wanfa = parseInt(node.name.slice(9));
                this.gameRule.wanfa = wanfa;
                break;
            case "tog_fangfei1":
            case "tog_fangfei2":
            case "tog_fangfei3":
                let num = parseInt(node.name.slice(11));
                this.gameRule.payType = num;
                break;
            case "tog_tuoguan0":
            case "tog_tuoguan30":
            case "tog_tuoguan60":
            case "tog_tuoguan90":
                let time = parseInt(node.name.slice(11));
                this.gameRule.canTrust = !!time;
                this.gameRule.trustTm = time;
                break;
            default:
                let tog = node.getComponent(cc.Toggle)
                let ruleKeys = Object.keys(this.gameRule)
                if (ruleKeys.includes(node.name) && cc.isValid(tog)) {
                    this.gameRule[node.name] = !!event.isChecked;
                }
                break;
        }
        // console.log("ensmj rule==", this.gameRule)
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

    showRenShu(renshu) {
        let isShow = true;//renshu!=4
        let showJuShu = renshu == 3 ? [6, 12, 24] : [8, 16, 24];
        this.node_guize.getChildByName("quwan").active = isShow;
        this.node_guize.getChildByName("taizhuang").active = !isShow;
        this.node_jushu.children.forEach(node => { node.active = false; });
        if (isShow) {
            this.gameRule.quwan = false;
            this.setToggle(this.node_guize.getChildByName("quwan"), false);
        } else {
            this.gameRule.taizhuang = false;
            this.setToggle(this.node_guize.getChildByName("taizhuang"), false);
        }
        if (showJuShu.indexOf(this.gameRule.bureau) == -1) {
            this.gameRule.bureau = showJuShu[0];
        }
        showJuShu.forEach((num) => {
            if (this.node_jushu.getChildByName("tog_jushu" + num)) {
                this.node_jushu.getChildByName("tog_jushu" + num).active = true;
                this.setToggle(this.node_jushu.getChildByName("tog_jushu" + num), this.gameRule.bureau == num);
            }
        })
    },

    setToggle(curNode, isChecked = true) {
        if (!!curNode && !!curNode.getComponent(cc.Toggle)) {
            curNode.getComponent(cc.Toggle).isChecked = !!isChecked;
        }
    },

    getRule() {
        return this.gameRule;
    },

});