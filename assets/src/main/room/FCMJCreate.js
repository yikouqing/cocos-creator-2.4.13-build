const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const Utils = require("../../utils/Utils");
const CCUtil = require("../../utils/CCUtil");

const FENG_DING = [32, 64, 160, 320, 0]
const GANG_FEN = [
    [1, 2],
    [2, 4],
    [5, 10],
    [10, 20],
    [20, 40]
]
const DI_FEN = [1, 2, 5, 10, 10]

cc.Class({
    extends: cc.Component,

    properties: {
        fangfeiPannel: cc.Node,
        /**所的选择按钮 */
        _allTogs: null,
    },

    onLoad() {

        this._allTogs = {}

        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            gameType: Enums.bundleType.FCMJ,
            yuyin: false,
            baseScore: 1,
            fangzuobi: false,
            canEnter: false, //中途加入
            canTrust: false, //托管
            trustTm: 0, //超时托管时间 0不托管
            bureau: 8, //局数
            maxPlayerCount: 2, //2、3、4
            minPlayerCount: 2,
            fengDing: 32, //封顶
            baoCount: 0, //宝牌数量
            qingYiSe: false, //清一色
            qiDui: false, //七对
            gangType: 0, //0攒杠  1起手杠
            gangScore: [2, 4], //杠分
            meiTingPaoPei: false //未听牌点炮包赔
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
        if (!FENG_DING.includes(this.gameRule.fengDing)) {
            this.gameRule.fengDing = FENG_DING[0]
            this.gameRule.baseScore = DI_FEN[0]
        }

        CCUtil.nodeRecursive(this.node, (node) => {
            let tog = node.getComponent(cc.Toggle)
            let edt = node.getComponent(cc.EditBox)
            let eventName = ""
            if (tog) {
                eventName = "toggle"
                this._allTogs[node.name] = tog
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
                let trustTm = parseInt(node.name.slice(7));
                if (this.gameRule.trustTm == trustTm) tog.isChecked = true
            } else if (node.name.startsWith("fengDing")) { //封顶
                let idx = parseInt(node.name.slice(8));
                if (FENG_DING[idx] == this.gameRule.fengDing) {
                    tog.isChecked = true
                }
            } else if (node.name.startsWith("gangScore")) { //杠分
                let idx = parseInt(node.name.slice(9));
                let fen = GANG_FEN[idx]
                if (fen.every(((element, index) => element == this.gameRule.gangScore[index]))) {
                    tog.isChecked = true
                }
            } else if (node.name.startsWith("baoCount")) { //宝牌数量
                let bao = parseInt(node.name.slice(8));
                if (this.gameRule.baoCount == bao) tog.isChecked = true
            } else if (node.name.startsWith("gangType")) { //杠类型
                let t = parseInt(node.name.slice(8));
                if (this.gameRule.gangType == t) tog.isChecked = true
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
                this.onCheckRuleEditScore(edt, 1, 100, "baseScore")
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
            this.gameRule.trustTm = tidx;
            this.gameRule.canTrust = !!tidx;
        } else if (node.name.startsWith("fengDing")) { //封顶
            let idx = parseInt(node.name.slice(8));
            this.gameRule.fengDing = FENG_DING[idx]
            // this.gameRule.gangScore = GANG_FEN[idx]
            this.gameRule.baseScore = DI_FEN[idx]
        } else if (node.name.startsWith("gangScore")) { //杠分
            let idx = parseInt(node.name.slice(9));
            this.gameRule.gangScore = GANG_FEN[idx]
        } else if (node.name.startsWith("baoCount")) { //宝牌数量
            let bao = parseInt(node.name.slice(8));
            this.gameRule.baoCount = bao
        } else if (node.name.startsWith("gangType")) { //杠类型
            let t = parseInt(node.name.slice(8));
            this.gameRule.gangType = t
        } else {
            let ruleKeys = Object.keys(this.gameRule)
            if (ruleKeys.includes(node.name) && cc.isValid(tog) && typeof (this.gameRule[node.name]) == "boolean") {
                this.gameRule[node.name] = tog.isChecked
            }
        }
        ConfigModel.setRoomCreateCache(this.gameRule);
        console.log("save fcmj rule==", this.gameRule)
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