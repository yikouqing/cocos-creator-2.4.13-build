const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const Utils = require("../../utils/Utils");
const CCUtil = require("../../utils/CCUtil");

let TUO_GUAN_TIME = [0, 30, 60, 120]

cc.Class({
    extends: cc.Component,

    properties: {
        maFen: cc.Node,
        fangfeiPannel: cc.Node,
        isMaGenGang: cc.Node,
        xiaLaLayoutItem: cc.Prefab,

        _curXiaLaName: null,

        /**所有的下拉按钮 */
        _allBtns: null,
        /**所的选择按钮 */
        _allTogs: null,
    },

    onLoad() {
        this._allBtns = {}
        this._allTogs = {}
        cc.systemEvent.on("xialakuangSelect", this.onXialaCheck, this)
        cc.systemEvent.on("guanbixialakuang", this.onXialaCheck, this)
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            gameType: Enums.bundleType.GDYBZ,

            yuyin: false,
            baseScore: 1,
            fangzuobi: false,
            canEnter: false, //中途加入
            canTrust: false,
            trustTm: 0, //超时托管时间 0不托管

            bureau: 4, //
            maxPlayerCount: 2, //2、3、4
            minPlayerCount: 2,

            bankerType: 0, //0 赢家坐庄 1表示下家做庄
            laiZiType: 2, //0 无鬼 1 白板 2红中 3翻鬼 4 翻双鬼 5花牌当鬼
            maiMaCount: 6, //0 表示不买马 数字表示买几马
            kaiMaType: 1, //0 表示不开马 1 表示剩余牌开马 2 另一副牌开马
            baoZaMaType: 1, //0 未选择 1 加分 2 加倍
            maScoreType: 2, //0 未选择 1 马跟底 2一马两分 3一马一份
            isMaGenGang: false, //是否马跟杠
            isMingGangKeQiang: true, //明杠可胡
            isGenZhuang: true, //跟庄
            isQiangGangBao: true, //抢杠全包
            isGangBaoBao: true, //杠爆全包
            isLuoDiBao: true, //12张落地承包
            isNoLaiDouble: true, //无鬼加倍
            isJieJieGao: false, //节节高
            isYangMa: false, //是否养马

            qiangGangHuRate: 2, //抢杠胡加倍 0 2
            gangShangHuaRate: 2, //杠上花加倍 0 
            shiSanYaoScore: 8, ////十三幺分数 0 8
            siGuiHuScore: 2, //四鬼胡 0 1 2
            pengPengHuScore: 2, //碰碰胡 0 2
            hunYiSeScore: 2, //混一色 0 2
            qiDuiScore: 4, //七对 0 4
            ziYiSeScore: 8, //字一色 0 8
            qingYiSeScore: 4, //清一色 0 4
            longQiDuiScore: 12, //龙七对
            hunYaoJiuScore: 6, //混幺9 0 6
            qingYaoJiuScore: 6, //清幺九 0 6
        };

        this._xiaLa = {
            maiMaCount: {
                [0]: "禁用",
                [2]: "2马",
                [4]: "4马",
                [6]: "6马",
                [8]: "8马",
                [10]: "10马",
            }
        }

        this._saveRule = Utils.deepCopy(this.gameRule)
    },

    onDestroy() {
        cc.systemEvent.off("xialakuangSelect", this.onXialaCheck, this)
        cc.systemEvent.off("guanbixialakuang", this.onXialaCheck, this)
    },

    start() {
        this.fangfeiPannel.active = !(!!this.node.nodeParams && !!this.node.nodeParams.isUnion);
        let gameRule = !!this.node.nodeParams ? this.node.nodeParams.gameRule : null;
        if (!!gameRule) {
            this.gameRule = Object.assign(this.gameRule, gameRule);
        }
        //this.gameRule = !!this.node.nodeParams && !!this.node.nodeParams.gameRule ? this.node.nodeParams.gameRule : this.gameRule;
        this.init();
    },

    init() {
        let ruleKeys = Object.keys(this.gameRule)
        // console.log("rule===", this.gameRule)
        this.txtList = {} //所有下拉框的显示txt，需要按钮命名为btn_{ruleKey}
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
                edt.string = this.gameRule.baseScore
            } else if (node.name.startsWith("bureau")) { //局数
                let round = parseInt(node.name.slice(6));
                if (this.gameRule.bureau == round) tog.isChecked = true
            } else if (node.name.startsWith("maxPlayerCount")) { //人数
                let renshu = parseInt(node.name.slice(14));
                if (this.gameRule.maxPlayerCount == renshu) tog.isChecked = true
                this.gameRule.minPlayerCount = renshu
            } else if (node.name.startsWith("payType")) { //房费
                let pt = parseInt(node.name.slice(7));
                if (this.gameRule.payType == pt) tog.isChecked = true
            } else if (node.name.startsWith("bankerType")) { //轮庄
                let bt = parseInt(node.name.slice(10));
                if (this.gameRule.playType == bt) tog.isChecked = true
            } else if (node.name.startsWith("laiZiType")) { //鬼牌
                let gui = parseInt(node.name.slice(9));
                if (this.gameRule.laiZiType == gui) tog.isChecked = true
            } else if (node.name == "maiMaCount0") { //不买马
                if (this.gameRule.maiMaCount == 0) tog.isChecked = true
            } else if (node.name == "maiMaCount") { //买马
                if (this.gameRule.maiMaCount != 0) tog.isChecked = true
            } else if (node.name == "baoZaMaType") { //爆炸吗
                if (this.gameRule.baoZaMaType != 0) tog.isChecked = true
            } else if (node.name.startsWith("maScoreType")) { //马分
                let mt = parseInt(node.name.slice(11));
                if (this.gameRule.maScoreType == mt) tog.isChecked = true
            } else if (node.name.startsWith("trustTm")) { //托管
                let tidx = parseInt(node.name.slice(7));
                if (TUO_GUAN_TIME.indexOf(this.gameRule.trustTm) == tidx) tog.isChecked = true
            } else if (node.name == "siGuiHuScore1") {
                tog.isChecked = this.gameRule.siGuiHuScore > 0
            } else if (node.name == "siGuiHuScore2") {
                tog.isChecked = this.gameRule.siGuiHuScore == 2
            } else {
                if (ruleKeys.includes(node.name) && cc.isValid(tog)) {
                    if (typeof (this.gameRule[node.name]) == "boolean") {
                        tog.isChecked = this.gameRule[node.name]
                    } else {
                        tog.isChecked = this.gameRule[node.name] > 0
                    }
                }
            }
        })

        let gui = this.gameRule.laiZiType
        this.setTogByRule("isNoLaiDouble", !(gui == 0 || gui == 5), gui == 0 || gui == 5)
        this.setTogByRule("siGuiHuScore1", !(gui == 0), gui == 0)
        this.setTogByRule("siGuiHuScore2", !(gui == 0), gui == 0)

        /**抢杠 */
        if (this.gameRule.qiangGangHuRate == 0) {
            this.setTogByRule("isQiangGangBao", false, true)
            this.setTogByRule("isMingGangKeQiang", false, true)
        }

        /**买马和爆炸马的下拉按钮 */
        if (this.gameRule.maiMaCount == 0) {
            this.setBtnByRule("maiMaCount", false)
        }

        this.updateMa()
        this.updateTxt()
    },

    /**根据规则名字 设置tog */
    setTogByRule(ruleKey, enable, setCheck) {
        // console.log("设置了规则tog==", ruleKey, enable, setCheck)
        if (ruleKey == "hunYiSeScore") {
            // console.trace()
        }
        let tog = this._allTogs[ruleKey]
        if (tog) {
            tog.interactable = enable
            if (setCheck && !enable) {
                tog.isChecked = false
            }
        }
    },

    setBtnByRule(ruleKey, enable) {
        // console.log("设置了规则btn==", ruleKey, enable)
        let btn = this._allBtns[ruleKey]
        if (btn) {
            btn.enabled = enable //放在tog节点下面的btn会有bug所以用enable
            CCUtil.setGrayShader(btn, !enable)
        }
    },

    /**刷新抢杠 */
    updateQiangGang() {
        if (this.gameRule.qiangGangHuRate == 0) {
            this.setTogByRule("isQiangGangBao", false, true)
            this.setTogByRule("isMingGangKeQiang", false, true)
            this.gameRule.isMingGangKeQiang = false
            this.gameRule.isQiangGangBao = false
        } else {
            this.setTogByRule("isQiangGangBao", true)
            this.setTogByRule("isMingGangKeQiang", true)
        }
    },

    /**刷新马牌选项 */
    updateMa() {
        if (this.gameRule.maiMaCount == 0 || this.gameRule.baoZaMaType != 0) {
            this.maFen.active = false
            this.isMaGenGang.active = false
        } else {
            this.maFen.active = true
            this.isMaGenGang.active = true
        }
    },

    /**刷新下拉框的选中文字 */
    updateTxt() {
        for (const key in this.txtList) {
            if (Object.hasOwnProperty.call(this.txtList, key)) {
                const txt = this.txtList[key];
                txt.string = this._xiaLa[key][this.gameRule[key]]
            }
        }
    },

    onButtonClick(event, param) {
        let node = event.node || event.target
        // console.log("点击了按钮", node.name)
        let edt = node.getComponent(cc.EditBox)
        let tog = node.getComponent(cc.Toggle)

        if (node.name == "baseScore") {
            if (cc.isValid(edt)) {
                this.onCheckRuleEditScore(edt, 1, 100, "baseScore")
            }
        } else if (node.name.includes("bureau")) {
            let round = parseInt(node.name.slice(6));
            this.gameRule.bureau = round
        } else if (node.name.startsWith("maxPlayerCount")) { //人数
            let renshu = parseInt(node.name.slice(14));
            this.gameRule.maxPlayerCount = renshu
            this.gameRule.minPlayerCount = renshu
        } else if (node.name.startsWith("payType")) { //房费
            let fangfei = parseInt(node.name.slice(7));
            this.gameRule.payType = fangfei
        } else if (node.name.startsWith("bankerType")) { //轮庄
            let lunzhuang = parseInt(node.name.slice(10));
            this.gameRule.bankerType = lunzhuang
        } else if (node.name.startsWith("laiZiType")) { //鬼牌
            let gui = parseInt(node.name.slice(9));
            this.gameRule.laiZiType = gui
            //无鬼和花牌做鬼需要去掉无鬼加倍和四鬼胡
            if (gui == 0) {
                this.gameRule.isNoLaiDouble = false
                this.gameRule.siGuiHuScore = 0
            } else if (gui == 5) {
                this.gameRule.isNoLaiDouble = false
            }
            this.setTogByRule("isNoLaiDouble", !(gui == 0 || gui == 5), gui == 0 || gui == 5)
            this.setTogByRule("siGuiHuScore1", !(gui == 0), gui == 0)
            this.setTogByRule("siGuiHuScore2", !(gui == 0), gui == 0)
        } else if (node.name == "maiMaCount0") { //不买马
            this.gameRule.maiMaCount = 0
            this.gameRule.baoZaMaType = 0
            this.updateMa()
            this.setBtnByRule("maiMaCount", false)
        } else if (node.name == "maiMaCount") { //买马
            this.gameRule.baoZaMaType = 0
            if (this.gameRule.maiMaCount == 0) this.gameRule.maiMaCount = this._saveRule.maiMaCount
            this.updateMa()
            this.setBtnByRule("maiMaCount", true)
        } else if (node.name == "baoZaMaType") { //爆炸马
            this.gameRule.maiMaCount = 0
            if (this.gameRule.baoZaMaType == 0) this.gameRule.baoZaMaType = this._saveRule.baoZaMaType
            this.updateMa()
            this.setBtnByRule("maiMaCount", false)
        } else if (node.name.startsWith("maScoreType")) { //马分
            let mt = parseInt(node.name.slice(11));
            this.gameRule.maScoreType = mt
        } else if (node.name.startsWith("trustTm")) { //托管
            let tidx = parseInt(node.name.slice(7));
            if (tog.isChecked) this.gameRule.trustTm = TUO_GUAN_TIME[tidx]
            this.gameRule.canTrust = this.gameRule.trustTm > 0
        } else if (node.name == "siGuiHuScore1") { //是否可以四鬼胡
            this.gameRule.siGuiHuScore = tog.isChecked ? 1 : 0
            if (!tog.isChecked) {
                let tog = this._allTogs["siGuiHuScore2"]
                tog.isChecked = false
            }
        } else if (node.name == "siGuiHuScore2") { //四鬼胡2倍
            this.gameRule.siGuiHuScore = tog.isChecked ? 2 : 1
            if (tog.isChecked) {
                let tog = this._allTogs["siGuiHuScore1"]
                tog.isChecked = true
            }
        } else if (node.name.startsWith("btn_")) { //所有的下拉框
            if (this._curXiaLaName) {
                // console.log("已经有选择的下拉框了")
                return
            }
            let name = node.name.split("_")[1]
            let data = this._xiaLa[name]
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
                    this.gameRule[node.name] = tog.isChecked
                } else {
                    this.gameRule[node.name] = tog.isChecked ? this._saveRule[node.name] : 0
                    this.gameRule.qingYaoJiuScore = this.gameRule.hunYaoJiuScore
                    this.updateQiangGang()
                }
            }
        }
        this.updateTxt()
        // console.log("save gdybz rule==", this.gameRule)
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

    onXialaCheck(index) {
        let name = this._curXiaLaName
        this._curXiaLaName = null
        if (name && index) {
            // console.log("收到了下拉框消息==", name, index, this._xiaLa[name])
            this.gameRule[name] = index
            ConfigModel.setRoomCreateCache(this.gameRule);
            this.updateTxt()
        }
    },

    getRule() {
        return this.gameRule;
    }

});