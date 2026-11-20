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
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            gameType: Enums.bundleType.YJBPX,
            baseScore: 1,
            fangzuobi: false,
            canEnter: false, //中途加入
            canTrust: false, //托管
            trustTm: 0, //超时托管时间 0不托管
            bureau: 4, //局数
            maxPlayerCount: 2, //2、3、4
            minPlayerCount: 2,

            huMode: 1, //胡牌方式 1 血战模式 2 推倒胡模式
            isBiHu: false, //是否必胡
            isGuoShouHu: false, //是否过手胡
            isDianGangHua: false, //是否点杠花
            isGangShangPao: false, //是否杠上炮
            isDianGangDouble: false, //是否点杠分双倍
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
            } else if (node.name.startsWith("huMode")) { //胡牌模式
                let f = parseInt(node.name.slice(6));
                if (this.gameRule.huMode == f) tog.isChecked = true
            } else {
                let ruleKeys = Object.keys(this.gameRule)
                if (ruleKeys.includes(node.name) && cc.isValid(tog) && typeof (this.gameRule[node.name]) == "boolean") {
                    tog.isChecked = this.gameRule[node.name]
                }
            }
        })
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
        } else if (node.name.startsWith("huMode")) { //胡牌模式
            let f = parseInt(node.name.slice(6));
            this.gameRule.huMode = f
        } else {
            let ruleKeys = Object.keys(this.gameRule)
            if (ruleKeys.includes(node.name) && cc.isValid(tog) && typeof (this.gameRule[node.name]) == "boolean") {
                this.gameRule[node.name] = tog.isChecked
            }
        }
        ConfigModel.setRoomCreateCache(this.gameRule);
        console.log("save yjbpx rule==", this.gameRule)
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