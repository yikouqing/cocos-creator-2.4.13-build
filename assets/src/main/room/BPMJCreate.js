var Enums = require('../../const/Enums');
var AssetsManager = require('../../utils/AssetsManager');
var ConfigModel = require('../../model/ConfigModel');
cc.Class({
    extends: cc.Component,

    properties: {
        fangfeiPannel: cc.Node,
        node_jushu: cc.Node,
        node_renshu: cc.Node,
        node_wanfa: cc.Node,
        node_fengding: cc.Node,
        node_gaoji: cc.Node,
        node_tuoguan: cc.Node,
        node_fangfei: cc.Node,
        difenEdit: cc.EditBox,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            gameType: Enums.bundleType.BPMJ,
            maxPlayerCount: 4,
            minPlayerCount: 4,
            bureau: 8,
            baseScore: 1,
            canTrust: false,
            trustTm: 0, //托管时间
            fangzuobi: false,
            tongji: false,
            location: false,
            maxScore: 24, //封顶分数
            qiHuType: 0, //默认一片起胡0:1片起胡 1：两片起胡
        };

        this.fangfeiPannel.active = !(!!this.node.nodeParams && !!this.node.nodeParams.isUnion);
        this.gameRule = !!this.node.nodeParams && !!this.node.nodeParams.gameRule ? this.node.nodeParams.gameRule : this.gameRule;
        this.init();
    },

    init() {

        this.difenEdit.string = this.gameRule.baseScore;
        this.setToggle(this.node_jushu.getChildByName("tog_" + this.gameRule.bureau), true);
        this.setToggle(this.node_wanfa.getChildByName("tog_" + this.gameRule.qiHuType), true);
        this.setToggle(this.node_fengding.getChildByName("tog_" + this.gameRule.maxScore), true);
        this.setToggle(this.node_renshu.getChildByName("tog_" + this.gameRule.maxPlayerCount), true);

        this.setToggle(this.node_gaoji.getChildByName("tog_tongji"), this.gameRule.tongji);
        this.setToggle(this.node_gaoji.getChildByName("tog_location"), this.gameRule.location);
        this.setToggle(this.node_gaoji.getChildByName("tog_fangzuobi"), this.gameRule.fangzuobi);
        this.setToggle(this.node_tuoguan.getChildByName("tog_" + this.gameRule.trustTm), true);
        this.setToggle(this.node_fangfei.getChildByName("toggle" + this.gameRule.payType), true);
        this.updateCost();
    },

    updateCost() {
        let bureau = this.gameRule.bureau;
        let diamondCount = bureau == 4 ? 2 : bureau == 8 ? 4 : 6;
        this.gameRule.payDiamond = diamondCount;
        // this.diamondCount.string = diamondCount;
    },

    onButtonClick(event, param) {
        if (param.indexOf('bureau') != -1) {
            this.gameRule.bureau = parseInt(param.split('_')[1]);
            this.updateCost();
        } else if (param.indexOf('member') != -1) {
            this.gameRule.maxPlayerCount = parseInt(param.slice(6));
            this.gameRule.minPlayerCount = parseInt(param.slice(6));
        } else if (param.indexOf('wanfa_') != -1) {
            let wanfa = parseInt(param.slice(6));
            this.gameRule.qiHuType = wanfa;
        } else if (param.indexOf('fengding_') != -1) {
            let fengding = parseInt(param.split('_')[1]);
            this.gameRule.maxScore = fengding;
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param == 'fangzuobi') {
            this.gameRule.fangzuobi = event.isChecked;
        } else if (param == "tongji") { //输赢统计显示
            this.gameRule.tongji = event.isChecked
        } else if (param == "location") { //防作弊 服务器判断
            this.gameRule.location = event.isChecked
        } else if (param.indexOf('tuoguan') != -1) { //托管
            let tuoguan = parseInt(param.slice(7));
            this.gameRule.canTrust = tuoguan > 0;
            this.gameRule.trustTm = tuoguan;
        } else if (param == "difen") {
            this.onCheckRuleEditScore(this.difenEdit, 0.1, 100, "baseScore")
        }
        // console.log("this.gameRule", this.gameRule)
        ConfigModel.setRoomCreateCache(this.gameRule);
    },

    getRule() {
        if (!this.gameRule.maxScore) {
            this.gameRule.maxScore = 24;
        }
        return this.gameRule;
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
    setToggle(curNode, isChecked = true) {
        if (!!curNode && !!curNode.getComponent(cc.Toggle)) {
            curNode.getComponent(cc.Toggle).isChecked = !!isChecked;
        }
    },

    setLabel(curNode, str) {
        if (!!curNode && !!curNode.getComponent(cc.Label)) {
            curNode.getComponent(cc.Label).string = str;
        }
    }

});