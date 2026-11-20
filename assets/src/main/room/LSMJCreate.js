const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const Utils = require("../../utils/Utils");
const CCUtil = require("../../utils/CCUtil");

let TUO_GUAN_TIME = [0, 30, 60, 120]

cc.Class({
    extends: cc.Component,

    properties: {
        fangfeiPannel: cc.Node,
        perFeeLay: cc.Node,
        perFeeDiamond: cc.Label,
        tog_fangshu3: cc.Toggle,
        tog_fangshu2: cc.Toggle,
        txt_fengding: cc.Label,
        txt_qihu: cc.Label,
        tog_laizi4: cc.Toggle,
        tog_laizi12: cc.Toggle,
        huanZhangHuaSeLay: cc.Node,
        xiaLaLayoutItem: cc.Prefab,

        _curXiaLaName: null,
    },

    onLoad() {
        this._allBtns = {}
        this._allTogs = {}
        cc.systemEvent.on("xialakuangSelect", this.onXialaCheck, this)
        cc.systemEvent.on("guanbixialakuang", this.onXialaCheck, this)
        this.xiaLa = {
            sanJiFaCaiRate: {
                [5]: "5番"
            },
            siJiFaCaiRate: {
                [6]: "6番"
            },
            tianDiHuRate: {
                [3]: "3番",
                [4]: "4番",
                [5]: "5番"
            }
        };
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            gameType: Enums.bundleType.LSMJ,
            yuyin: false,
            baseScore: 0.1,
            fangzuobi: false,
            canEnter: false, //中途加入
            canTrust: false,
            trustTm: 0, //超时托管时间 0不托管
            bureau: 8, //如果选了倒数 局数等于倒数
            maxPlayerCount: 2, //2、3、4
            minPlayerCount: 2,
            perDiamond: 0,
            isQueYiMen: true,
            maxRate: 3, //封顶番数
            roomType: 3,//房数  只有两人才有两房选项
            laiZiCount: 4,//癞子张数
            qiHuRate: 0,//起胡番数 
            huanZhangCount: 0,//换张数 0 3 4
            huanZhangHuaSeType: 0,//0-同花色换 1-任意换 2-任意混换
            dianGangHuaType: 0,//0-点杠花点炮 点杠花自摸
            //规则
            yaoJiuJiangDui: false,//幺九将对
            daDuiZiLiangFan: false,//大对子两番
            gangTiSuanGangHua: false,//杠提算杠花
            haiDi: false,//海底
            jinGouDiao: false,//金钩钓
            tianDiHu: false,//天地胡
            tianDiHuRate: 3,//地胡番数
            menQing: false,//门清
            zhongZhang: false,//中张
            siJiFaCai: false,//四鸡发财
            siJiFaCaiRate: 6,
            sanJiFaCai: false,//三鸡发财
            sanJiFaCaiRate: 5,
            pengHouKeHuan: false,//碰后可换
            gangHouKeHuan: false,//杠后可换
            huPaiShiShiJieSuan: false,//胡牌实时结算
            gangFenShiShiJieSuan: false,//杠分实时结算
            qiangTiBaoPei: false,//抢提包赔
            guoZhangBuKePengGang: false,//过张不可碰杠
            guoShouShengFanHu: false,//过手升番胡
            zhuangJiaMaiMa: false,//庄家买马
            kongFeiDui: false,//空飞对
            isDianPao: true
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
        this.gameRule.laiZiCount = 4;//强制显示四鸡
        this.gameRule.sanJiFaCaiRate = 5;//强制处理
        this.gameRule.siJiFaCaiRate = 6;//强制处理
        let ruleKeys = Object.keys(this.gameRule)
        // console.log("rule===", this.gameRule)
        this.txtList = {};
        this._perFeeSync();
        this.updateDataShow();
        CCUtil.nodeRecursive(this.node, (node) => {
            let tog = node.getComponent(cc.Toggle)
            let btn = node.getComponent(cc.Button)
            let edt = node.getComponent(cc.EditBox)
            let txt = node.getComponent(cc.Label)
            if (node.name == "txt" && cc.isValid(txt)) {
                let n = node.parent.name.split("_")[1]
                this.txtList[n] = txt
            }
            let eventName = ""
            if (tog) {
                eventName = "toggle"
                this._allTogs[node.name] = tog
            } else if (btn) {
                if (node.name.startsWith("btn_")) {
                    let n = node.name.split("_")[1]
                    this._allBtns[n] = btn
                }
                eventName = "click"
            } else if (edt) {
                eventName = "editing-did-ended"
            }
            if (eventName != "") {
                node.on(eventName, this.onButtonClick, this)
            }
            if (node.name == "baseScore") {
                edt.string = this.gameRule.baseScore + ""
            } else if (node.name.startsWith("payType")) { //房费
                let pt = parseInt(node.name.slice(7));
                if (this.gameRule.payType == pt) tog.isChecked = true
            } else if (node.name.startsWith("meijutoggle")) { //房费 钻石
                let pt = parseInt(node.name.slice(11));
                if (this.gameRule.perDiamond == pt) tog.isChecked = true
            } else if (node.name.startsWith("tog_jushu")) { //局数
                let jushu = parseInt(node.name.slice(9));
                tog.isChecked = this.gameRule.bureau == jushu
            } else if (node.name.startsWith("tog_renshu")) { //人数
                let renshu = parseInt(node.name.slice(10));
                tog.isChecked = this.gameRule.maxPlayerCount == renshu;
            } else if (node.name.startsWith("tog_laizi")) { //癞子数
                let laiZiCount = parseInt(node.name.slice(9));
                tog.isChecked = this.gameRule.laiZiCount == laiZiCount;
            } else if (node.name.startsWith("tog_huanzhang")) { //换牌张数
                let huanZhangCount = parseInt(node.name.slice(13));
                tog.isChecked = this.gameRule.huanZhangCount == huanZhangCount;
            } else if (node.name.startsWith("tog_huanse")) { //换牌张数
                let huanZhangHuaSeType = parseInt(node.name.slice(10));
                tog.isChecked = this.gameRule.huanZhangHuaSeType == huanZhangHuaSeType;
            } else if (node.name.startsWith("tog_diangang")) { //点杠
                let dianGangHuaType = parseInt(node.name.slice(12));
                tog.isChecked = this.gameRule.dianGangHuaType == dianGangHuaType;
            } else if (node.name.startsWith("tog_fangshu")) { //房数
                let roomType = parseInt(node.name.slice(11));
                tog.isChecked = this.gameRule.roomType == roomType;
            } else if (node.name.startsWith("tog_fengding")) { //封顶
                let maxRate = parseInt(node.name.slice(12));
                let showMaxRate = this.gameRule.maxRate >= 5 ? 5 : this.gameRule.maxRate;
                tog.isChecked = showMaxRate == maxRate;
            } else if (node.name.startsWith("tog_qihu")) { //起胡番数
                let qiHuRate = parseInt(node.name.slice(8));
                let showQiHuRate = this.gameRule.qiHuRate >= 2 ? 2 : this.gameRule.qiHuRate;
                tog.isChecked = showQiHuRate == qiHuRate;
            } else if (node.name.startsWith("trustTm")) { //托管
                let tidx = parseInt(node.name.slice(7));
                if (TUO_GUAN_TIME.indexOf(this.gameRule.trustTm) == tidx) tog.isChecked = true
            } else {
                if (ruleKeys.includes(node.name) && cc.isValid(tog)) {
                    if (typeof (this.gameRule[node.name]) == "boolean") {
                        tog.isChecked = this.gameRule[node.name];
                    } else {
                        tog.isChecked = this.gameRule[node.name] > 0;
                    }
                }
            }
        });
        this.nodeSync();
        this.updateTxt();
    },

    setBtnByRule(ruleKey, enable) {
        let btn = this._allBtns[ruleKey]
        if (btn) {
            btn.enabled = enable //放在tog节点下面的btn会有bug所以用enable
            CCUtil.setGrayShader(btn, !enable)
        }
    },

    setTogByRule(ruleKey, enable, setCheck) {
        let tog = this._allTogs[ruleKey]
        if (tog) {
            tog.interactable = enable
            if (setCheck && !enable) {
                tog.isChecked = false
            }
        }
    },

    updateTxt() {
        for (const key in this.txtList) {
            if (Object.hasOwnProperty.call(this.txtList, key)) {
                const txt = this.txtList[key];
                txt.string = this.xiaLa[key][this.gameRule[key]]
            }
        }
    },

    updateDataShow() {
        this.huanZhangHuaSeLay.active = this.gameRule.huanZhangCount > 0;
        this.tog_fangshu2.node.active = this.gameRule.maxPlayerCount == 2;
        if (this.gameRule.maxPlayerCount != 2 && this.gameRule.roomType == 2) {
            this.gameRule.roomType = 3;
            this.tog_fangshu3.isChecked = true;
        }
        this.tog_laizi12.node.active = this.gameRule.roomType != 2;
        if (this.gameRule.roomType == 2 && this.gameRule.laiZiCount == 12) {
            this.gameRule.laiZiCount = 4;
            this.tog_laizi4.isChecked = true;
        }
        this.gameRule.isQueYiMen = this.gameRule.roomType != 2;
        let showMaxRate = this.gameRule.maxRate <= 5 ? 5 : this.gameRule.maxRate;
        this.txt_fengding.string = `${showMaxRate}`;
        let showQiHuRate = this.gameRule.qiHuRate <= 2 ? 2 : this.gameRule.qiHuRate;
        if (showQiHuRate > showMaxRate) showQiHuRate = 0;
        this.txt_qihu.string = `${showQiHuRate}`;
    },

    nodeSync() {
        this.setBtnByRule("sanJiFaCaiRate", this.gameRule.sanJiFaCai);
        this.setBtnByRule("siJiFaCaiRate", this.gameRule.siJiFaCai);
        this.setBtnByRule("tianDiHuRate", this.gameRule.tianDiHu);
        this.setBtnByRule("fengDingZengJia", this.gameRule.maxRate >= 5);
        this.setBtnByRule("fengDingJianShao", this.gameRule.maxRate >= 5);
        this.setBtnByRule("qiHuZengJia", this.gameRule.qiHuRate >= 2);
        this.setBtnByRule("qiHuJianShao", this.gameRule.qiHuRate >= 2);
        this.setTogByRule("qiangTiBaoPei", this.gameRule.pengHouKeHuan || this.gameRule.gangHouKeHuan, true);
    },

    onXialaCheck(index) {
        let name = this._curXiaLaName;
        this._curXiaLaName = null;
        if (name && index) {
            this.gameRule[name] = index;
            if (name == 'siJiFaCaiRate') {
                if (this.gameRule.sanJiFaCaiRate >= this.gameRule.siJiFaCaiRate) this.gameRule.sanJiFaCaiRate = this.gameRule.siJiFaCaiRate - 1
            } else if (name == 'sanJiFaCaiRate') {
                if (this.gameRule.sanJiFaCaiRate >= this.gameRule.siJiFaCaiRate) this.gameRule.siJiFaCaiRate = this.gameRule.sanJiFaCaiRate + 1
            }
            this.updateTxt();
            ConfigModel.setRoomCreateCache(this.gameRule);
        }
    },

    onButtonClick(event, param) {
        let node = event.node || event.target
        // console.log("点击了按钮", node.name)
        let edt = node.getComponent(cc.EditBox)
        let tog = node.getComponent(cc.Toggle)
        if (node.name == "baseScore") {
            if (cc.isValid(edt)) this.onCheckRuleEditScore(edt, 0.1, 100, "baseScore")
        } else if (node.name.startsWith("payType")) { //房费
            let fangfei = parseInt(node.name.slice(7));
            this.gameRule.payType = fangfei
            this._perFeeSync();
        } else if (node.name.startsWith("meijutoggle")) { //房费 aa砖石
            let fangfei = parseInt(node.name.slice(11));
            this.gameRule.perDiamond = fangfei
            this._perFeeSync();
        } else if (node.name.startsWith("tog_jushu")) { //局数
            this.gameRule.bureau = parseInt(node.name.slice(9));
        } else if (node.name.startsWith("tog_renshu")) { //人数
            this.gameRule.maxPlayerCount = parseInt(node.name.slice(10));
            this.gameRule.minPlayerCount = this.gameRule.maxPlayerCount;
        } else if (node.name.startsWith("tog_laizi")) { //癞子数
            this.gameRule.laiZiCount = parseInt(node.name.slice(9));
        } else if (node.name.startsWith("tog_huanzhang")) { //换牌张数
            this.gameRule.huanZhangCount = parseInt(node.name.slice(13));
        } else if (node.name.startsWith("tog_huanse")) { //换牌花色
            this.gameRule.huanZhangHuaSeType = parseInt(node.name.slice(10));
        } else if (node.name.startsWith("tog_diangang")) { //点杠
            this.gameRule.dianGangHuaType = parseInt(node.name.slice(12));
        } else if (node.name.startsWith("tog_fengding")) { //封顶
            let togRate = parseInt(node.name.slice(12));
            if (togRate == 5) {
                let checkRate = parseInt(this.txt_fengding.string);
                this.gameRule.maxRate = checkRate;
            } else {
                this.gameRule.maxRate = togRate;
            }
        } else if (node.name.startsWith("btn_fengDingJianShao")) { //番数减
            let showMaxRate = parseInt(this.txt_fengding.string);
            if (showMaxRate <= 5) return;
            showMaxRate--;
            this.gameRule.maxRate = showMaxRate;
        } else if (node.name.startsWith("btn_fengDingZengJia")) { //番数加
            let showMaxRate = parseInt(this.txt_fengding.string);
            if (showMaxRate >= 6) return;
            showMaxRate++;
            this.gameRule.maxRate = showMaxRate;
        } else if (node.name.startsWith("tog_qihu")) { //起胡番数
            let togQiHuRate = parseInt(node.name.slice(8));
            if (togQiHuRate == 2) {
                let checkQiHuRate = parseInt(this.txt_qihu.string);
                this.gameRule.qiHuRate = checkQiHuRate;
            } else {
                this.gameRule.qiHuRate = togQiHuRate;
            }
        } else if (node.name.startsWith("btn_qiHuJianShao")) { //番数减
            let showQiHuRate = parseInt(this.txt_qihu.string);
            if (showQiHuRate <= 2) return;
            showQiHuRate--;
            this.gameRule.qiHuRate = showQiHuRate;
        } else if (node.name.startsWith("btn_qiHuZengJia")) { //番数加
            let showQiHuRate = parseInt(this.txt_qihu.string);
            if (showQiHuRate >= 4) return;
            showQiHuRate++;
            this.gameRule.qiHuRate = showQiHuRate;
        } else if (node.name.startsWith("tog_fangshu")) { //房数
            this.gameRule.roomType = parseInt(node.name.slice(11));
        } else if (node.name.startsWith("trustTm")) { //托管
            let tidx = parseInt(node.name.slice(7));
            if (tog.isChecked) this.gameRule.trustTm = TUO_GUAN_TIME[tidx]
            this.gameRule.canTrust = this.gameRule.trustTm > 0
        } else if (node.name.startsWith("btn_")) { //所有的下拉框
            if (this._curXiaLaName) return;
            let name = node.name.split("_")[1]
            let data = this.xiaLa[name]
            if (data) {
                this._curXiaLaName = name
                let xiaLaNode = cc.instantiate(this.xiaLaLayoutItem)
                let com = xiaLaNode.getComponent("XiaLaLayoutItem")
                com.init(data, this.node, node, this.gameRule[name])
            } else {
                // console.error("没有下拉框数据==", node.name, data)
            }
        } else {
            let ruleKeys = Object.keys(this.gameRule)
            if (ruleKeys.includes(node.name) && cc.isValid(tog)) {
                if (typeof (this.gameRule[node.name]) == "boolean") {
                    this.gameRule[node.name] = tog.isChecked;
                }
            }
        }
        // console.log("save ybmj rule==", this.gameRule)
        this.updateDataShow();
        this.nodeSync();
        this.updateTxt();
        ConfigModel.setRoomCreateCache(this.gameRule);
    },

    onCheckRuleEditScore(editBox, min, max, key) {
        let score = parseFloat(editBox.string)
        if (isNaN(score)) score = min;
        score = Utils.formatNumberWithDecimal(score, 1);
        if (score < min) score = min;
        if (score > max) score = max;
        this.gameRule[key] = score;
    },

    _perFeeSync() {
        return
        this.perFeeLay.active = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        if (this.gameRule.payType == Enums.roomPayType.AAZHIFU) {
            this.gameRule.perDiamond = this.gameRule.perDiamond || 1;
            this.perFeeDiamond.string = "" + (this.gameRule.perDiamond * this.gameRule.bureau)
        } else {
            this.gameRule.perDiamond = 0;
            let fee = Fee_LAMJ.Host;
            let bureau = this.gameRule.bureau;
            this.perFeeDiamond.string = fee[bureau];
        }
    },
    getRule() {
        return this.gameRule;
    },

    onDestroy() {
        cc.systemEvent.off("xialakuangSelect", this.onXialaCheck, this)
        cc.systemEvent.off("guanbixialakuang", this.onXialaCheck, this)
    }

});