const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const Utils = require("../../utils/Utils");
const CCUtil = require("../../utils/CCUtil");

cc.Class({
    extends: cc.Component,

    properties: {
        node_jushu: cc.Node,
        node_fangfei: cc.Node,
        node_wuxian: cc.Node,
        tog_wuxian0: cc.Toggle,
        jifen: cc.Node,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            gameType: Enums.bundleType.QJMJ,
            canTrust: false,
            /* 托管时间 */
            trustTm: 0,
            yuyin: false,
            baseScore: 1,
            fangzuobi: false,
            canEnter: false,//中途加入

            bureau: 8,//8、12、16
            maxPlayerCount: 2,//2、3、4
            minPlayerCount: 2,

            yaoji: false,//幺鸡
            ertong: false,//二同
            sanwan: false,//三万
            chuangguan: 0,//闯关 0不闯关 1闯关
            wuxianchuangguan: 0,//无限闯关 0不开启 1开启
            fanji: 0,//翻鸡 0无鸡 1上下鸡 2本鸡 3全鸡
            fanjifen: 1,//翻鸡分数  1 2 3
            hupaitishi: false,//胡牌提示
            zuihousizhangbihu: false,//最后四张必胡
            huanpai: 0,//换牌 0不换牌 1任意换三张
            chadajiao: false,//查大叫 
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
        this.node_wuxian.active = !!this.gameRule.chuangguan;
        this.jifen.active = !!this.gameRule.fanji;
        let ruleKeys = Object.keys(this.gameRule)
        CCUtil.nodeRecursive(this.node, (node) => {
            node.targetOff(this);
            let name = node.name;
            let txt = node.getComponent(cc.Label)
            let tog = node.getComponent(cc.Toggle)
            let btn = node.getComponent(cc.Button)
            let edt = node.getComponent(cc.EditBox)

            if (tog) { node.on("toggle", this.onButtonClick, this); }
            else if (btn) { node.on("click", this.onButtonClick, this); }
            else if (edt) { node.on("editing-did-ended", this.onButtonClick, this); }

            if (name == "baseScore") {
                edt.string = this.gameRule.baseScore
            } else if (name.startsWith("tog_jushu")) {
                let num = parseInt(name.slice(9));
                tog.isChecked = this.gameRule.bureau == num
            } else if (name.startsWith("tog_renshu")) {
                let num = parseInt(name.slice(10));
                tog.isChecked = this.gameRule.minPlayerCount == num
            } else if (name.startsWith("tog_fangfei")) {
                let num = parseInt(name.slice(11));
                tog.isChecked = this.gameRule.payType == num;
            } else if (name.startsWith("tog_tuoguan")) {
                let num = parseInt(name.slice(11));
                tog.isChecked = this.gameRule.trustTm == num;
            } else if (name.startsWith("tog_chuangguan")) {
                let num = parseInt(name.slice(14));
                tog.isChecked = this.gameRule.chuangguan == num;
            } else if (name.startsWith("tog_wuxianchuangguan")) {
                let num = parseInt(name.slice(20));
                tog.isChecked = this.gameRule.wuxianchuangguan == num;
            } else if (name.startsWith("tog_fanji")) {
                let num = parseInt(name.slice(9));
                tog.isChecked = this.gameRule.fanji == num;
            } else if (name.startsWith("tog_huanpai")) {
                let num = parseInt(name.slice(11));
                tog.isChecked = this.gameRule.huanpai == num;
            } else if (name.startsWith("tog_jifen")) {
                let num = parseInt(name.slice(9));
                tog.isChecked = this.gameRule.fanjifen == num;
            }



            else {
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
        }

        else if (name.startsWith("tog_chuangguan")) {
            let num = parseInt(name.slice(14));
            this.gameRule.chuangguan = num;
            this.node_wuxian.active = !!num;
            if (!num) {
                this.tog_wuxian0.isChecked = true;
                this.gameRule.wuxianchuangguan = 0;
            }
        } else if (name.startsWith("tog_wuxianchuangguan")) {
            let num = parseInt(name.slice(20));
            this.gameRule.wuxianchuangguan = num;
        } else if (name.startsWith("tog_fanji")) {
            let num = parseInt(name.slice(9));
            this.gameRule.fanji = num;
            this.jifen.active = !!num;
        } else if (name.startsWith("tog_huanpai")) {
            let num = parseInt(name.slice(11));
            this.gameRule.huanpai = num;
        } else if (name.startsWith("tog_jifen")) {
            let num = parseInt(name.slice(9));
            this.gameRule.fanjifen = num;
        }

        else {
            let namekey = name.slice(4);
            let tog = node.getComponent(cc.Toggle)
            let ruleKeys = Object.keys(this.gameRule)
            if (ruleKeys.includes(namekey) && cc.isValid(tog)) {
                this.gameRule[namekey] = !!event.isChecked;
            }
        }
        // console.log(this.gameRule.gameType, "rule==", this.gameRule)
        ConfigModel.setRoomCreateCache(this.gameRule);
    },

    onCheckRuleEditScore(node, min, max, key) {
        if (!node || !node.getComponent(cc.EditBox)) return;
        let editBox = node.getComponent(cc.EditBox);
        let score = parseFloat(editBox.string)
        var r = /^\+?[1-9][0-9]*$/ //非0的正整数
        if (parseInt(min) < parseFloat(min)) {//判断是否为小数
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