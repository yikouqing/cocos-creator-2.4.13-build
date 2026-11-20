const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const CCUtil = require('../../utils/CCUtil');
const Utils = require("../../utils/Utils");

const FENG_DING = [16, 32, 64, 0]
let TUO_GUAN_TIME = [0, 30, 60, 120]

cc.Class({
    extends: cc.Component,
    properties: {
        fangfeiPannel: cc.Node,
        quePaiNode: cc.Node,
        queMenNode: cc.Node,

        queWan: cc.Toggle,
        xuanQue: cc.Toggle,
        guoHu: cc.Toggle,
        guoShui: cc.Toggle,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            gameType: Enums.bundleType.PZHMJ,
            baseScore: 1,
            fangzuobi: false,
            canEnter: false, //中途加入
            canTrust: false, //托管
            trustTm: 0, //超时托管时间 0不托管
            bureau: 8, //局数
            maxPlayerCount: 2, //2、3、4
            minPlayerCount: 2,

            fengDing: 16,//封顶分数 0 不封顶
            ziMoType: 2,//0不加  1加底  2加番
            queYiMen: 0,//缺一门 0 不缺  1 万  2 筒 3 条
            queType: 2,//0 不缺 1 必缺  2 选缺

            fangShu: 3, //三房或者2房

            yiTiaoLong: true, //一条龙
            kaXinWu: true, //卡心五
            bianKaDiao: false, //边卡吊
            gangBuSuanGen: false, //杠不算根
            huJiaoZhuanYi: false, //呼叫转移
            chaJiaoTuiShui: false, //查叫退税
            tingHouKeGang: true, //听后可杠
            xianShiLiuShui: true, //显示流水
            guoShuiGuoFanKeHu: false, //过水过蕃可胡
            guoPengGuoQuan: false, //过碰过圈
            guoHuGuoQuan: false, //过胡过圈
            buKeXianPengHouGang: false, //不可先碰后杠
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
        CCUtil.nodeRecursive(this.node, (node) => {
            let tog = node.getComponent(cc.Toggle)
            let edt = node.getComponent(cc.EditBox)
            let eventName = ""
            if (tog) {
                eventName = "toggle"
                tog.transition = cc.Toggle.Transition.SCALE
                tog.duration = 0.1
                tog.zoomScale = 1.05
            } else if (edt) {
                eventName = "editing-did-ended"
            }
            if (eventName != "") {
                node.on(eventName, this.onButtonClick, this)
            }
            if (node.name == "baseScore") { //底分
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
            } else if (node.name.startsWith("trustTm")) { //托管
                let tidx = parseInt(node.name.slice(7));
                if (TUO_GUAN_TIME.indexOf(this.gameRule.trustTm) == tidx) tog.isChecked = true
            } else if (node.name.startsWith("fengDing")) { //封顶
                let idx = parseInt(node.name.slice(8));
                if (FENG_DING[idx] == this.gameRule.fengDing) {
                    tog.isChecked = true
                }
            } else if (node.name.startsWith("ziMoType")) { //自摸加番
                let ztype = parseInt(node.name.slice(8));
                if (this.gameRule.ziMoType == ztype) tog.isChecked = true
            } else if (node.name.startsWith("fangShu")) { //房数
                let f = parseInt(node.name.slice(7));
                if (this.gameRule.fangShu == f) tog.isChecked = true
            } else if (node.name.startsWith("queYiMen")) { //缺一门
                let t = parseInt(node.name.slice(8));
                if (this.gameRule.queYiMen == t) tog.isChecked = true
            } else if (node.name.startsWith("queType")) { //缺type
                let t = parseInt(node.name.slice(7));
                if (this.gameRule.queType == t) tog.isChecked = true
            } else {
                let ruleKeys = Object.keys(this.gameRule)
                if (ruleKeys.includes(node.name) && cc.isValid(tog) && typeof (this.gameRule[node.name]) == "boolean") {
                    tog.isChecked = this.gameRule[node.name]
                }
            }
        })
        this.showQueNode(this.gameRule.fangShu)
    },

    /**根据类型显示缺门和缺牌node 2缺牌 3缺门*/
    showQueNode(type) {
        this.quePaiNode.active = type == 2
        this.queMenNode.active = type == 3
    },

    onButtonClick(event, param) {
        let node = event.node || event.target
        let edt = node.getComponent(cc.EditBox)
        let tog = node.getComponent(cc.Toggle)
        // console.log("点击了按钮", node.name, tog && tog.isChecked)
        if (node.name == "baseScore") { //底分
            if (cc.isValid(edt)) {
                this.onCheckRuleEditScore(edt, 0.5, 100, "baseScore")
            }
        } else if (node.name.includes("bureau")) { //局数
            let round = parseInt(node.name.slice(6));
            this.gameRule.bureau = round
        } else if (node.name.startsWith("maxPlayerCount")) { //人数
            let renshu = parseInt(node.name.slice(14));
            this.gameRule.maxPlayerCount = renshu
            this.gameRule.minPlayerCount = renshu
        } else if (node.name.startsWith("payType")) { //房费
            let fangfei = parseInt(node.name.slice(7));
            this.gameRule.payType = fangfei
        } else if (node.name.startsWith("trustTm")) { //托管
            let tidx = parseInt(node.name.slice(7));
            if (tog.isChecked) this.gameRule.trustTm = TUO_GUAN_TIME[tidx]
            this.gameRule.canTrust = this.gameRule.trustTm > 0
        } else if (node.name.startsWith("fengDing")) { //封顶
            let idx = parseInt(node.name.slice(8));
            this.gameRule.fengDing = FENG_DING[idx]
        } else if (node.name.startsWith("ziMoType")) { //自摸加番
            let ztype = parseInt(node.name.slice(8));
            this.gameRule.ziMoType = ztype
        } else if (node.name.startsWith("fangShu")) { //房数
            let f = parseInt(node.name.slice(7));
            this.gameRule.fangShu = f
            this.showQueNode(f)
            if (f == 2) {
                this.gameRule.queYiMen = 1
                this.gameRule.queType = 0
                this.queWan.isChecked = true
            } else if (f == 3) {
                this.gameRule.queYiMen = 0
                this.gameRule.queType = 2
                this.xuanQue.isChecked = true
            }
        } else if (node.name.startsWith("queYiMen")) { //缺一门
            let t = parseInt(node.name.slice(8));
            this.gameRule.queYiMen = t
        } else if (node.name.startsWith("queType")) { //缺type
            let t = parseInt(node.name.slice(7));
            this.gameRule.queType = t
        } else {
            let ruleKeys = Object.keys(this.gameRule)
            if (ruleKeys.includes(node.name) && cc.isValid(tog) && typeof (this.gameRule[node.name]) == "boolean") {
                this.gameRule[node.name] = tog.isChecked
                if (tog.isChecked) {
                    if (node.name == "guoHuGuoQuan") {
                        this.gameRule.guoShuiGuoFanKeHu = false
                        this.guoShui.isChecked = false
                    }
                    if (node.name == "guoShuiGuoFanKeHu") {
                        this.gameRule.guoHuGuoQuan = false
                        this.guoHu.isChecked = false
                    }
                }
            }
        }
        ConfigModel.setRoomCreateCache(this.gameRule);
        console.log("save pzhmj rule==", this.gameRule)
    },


    onCheckRuleEditScore(editBox, min, max, key) {
        let score = parseFloat(editBox.string)
        var r = /^([1-9][0-9]*|0)(\.[1-9]?)?$/ //一位小数
        if (!r.test(editBox.string) || score > max || score < min) {
            editBox.string = '0.5';
            AssetsManager.tipDialog(`输入错误,请输入${min}-${max}的数字(小数最多一位)！！`);
            return
        }
        this.gameRule[key] = score;
    },
    getRule() {
        return this.gameRule;
    }

});