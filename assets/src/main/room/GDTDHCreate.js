const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const CacheManager = require("../../utils/CacheManager");
const CCUtil = require("../../utils/CCUtil");

let storageName = {
    TUI_DAO_HU: "gdtdh_tuidaohu",
    ZUO_PAI_TUI_DAO_HU: "gdtdh_zuopaituidaohu",
}

let TUO_GUAN_TIME = [0, 30, 60, 120]

cc.Class({
    extends: cc.Component,

    properties: {
        kaiMa: cc.Node,
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
            gameType: Enums.bundleType.GDTDH,

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
            playType: 1, //1 推倒胡 2：做牌推倒胡
            laiZiType: 2, //0 无鬼 1 白板 2红中 3翻鬼 4 翻双鬼
            maiMaCount: 10, //0 表示不买马 数字表示买几马
            kaiMaType: 2, //0 表示不开马 1 表示剩余牌开马 2 另一副牌开马
            baoZaMaType: 0, //0 未选择 1 加分 2 加倍
            maScoreType: 1, //0 未选择 1 马跟底 2一马两分 3一马一份
            isMaGenGang: false, //是否马跟杠
            isWithoutZi: false, //true不带风 false带风
            isCanChiHu: false, //是否可吃胡
            isJiHuCanChi: false, //鸡胡不可吃胡
            isMingGangKeQiang: false, //明杠可胡
            isGenZhuang: true, //跟庄
            isHuangZhuangGang: true, //荒庄荒杠
            isQiangGangBao: true, //抢杠全包
            isGangBaoBao: true, //杠爆全包
            isLuoDiBao: true, //12张落地承包
            isNoLaiDouble: true, //无鬼加倍
            isJieJieGao: true, //节节高
            /**共用规则 */
            qiangGangHuRate: 2, //抢杠胡加倍 0 无 数字表示倍数1234
            gangShangHuaRate: 2, //杠上花加倍 0 无 数字表示倍数1234
            shiSanYaoScore: 12, ////十三幺分数 0 无 数字表示分数12-24 步进2
            /**推倒胡规则 */
            siGuiHuRate: 1, //四鬼胡加倍 0 无 数字表示倍数1234
            qiDuiRate: 2, //七对加倍 0 无 数字表示倍数1234
            qingYiSeRate: 2, //清一色加倍 0 无 数字表示倍数1234

            /**做牌推倒胡 */
            jiHuScore: 1, //鸡胡 0 无 数字表示分数12
            pingHuScore: 2, //平胡 0 无 数字表示分数23
            siGuiHuScore: 2, //四鬼胡 0 无 数字表示分数2345
            pengPengHuScore: 4, //碰碰胡 0 无 数字表示分数23456
            hunYiSeScore: 4, //混一色 0 无 数字表示分数23456
            qiDuiScore: 8, //七对 0 无 数字表示分数2-12 步进2
            qingYiSeScore: 8, //清一色 0 无 数字表示分数2-12 步进2
            hunPengScore: 8, //混碰 0 无 数字表示分数2-12 步进2
            longQiDuiScore: 12, //龙七对 0 无 数字表示分数4-16 步进2
            xiaoSanYuanScore: 12, //小三元 0 无 数字表示分数4-16 步进2
            xiaoSiXiScore: 12, //小四喜 0 无 数字表示分数4-16 步进2
            qingPengScore: 12, //清碰 0 无 数字表示分数4-16 步进2
            hunYaoJiuScore: 12, //混幺9 0 无 数字表示分数4-16 步进2
            daSanYuanScore: 16, //大三元 0 无 数字表示分数8,12-20 步进2
            daSiXiScore: 16, //大四喜 0 无 数字表示分数8,12-20 步进2
            ziYiSeScore: 16, //字一色 0 无 数字表示分数8,12-20 步进2
            qingYaoJiuScore: 16, //清幺九 0 无 数字表示分数8,12-20 步进2
            qingQiDuiScore: 16, //清七对 0 无 数字表示分数8,12-20 步进2
            tianHuScore: 20, //天胡 0 无 数字表示分数12-24 步进2
            diHuScore: 20, //地胡 0 无 数字表示分数12-24 步进2
            shuangLongQiDuiScore: 24, //双龙七对 0 无 数字表示分数18-28 步进2
            sanLongQiDuiScore: 36, //三龙七对 0 无 数字表示分数28-40 步进4
            shiBaLuoHanScore: 36, //十八罗汉 0 无 数字表示分数28-40 步进4
        };

        /**获取记录的推倒胡和做牌推倒胡的属性 */
        this._saveTuiDaoHu = CacheManager.getItem(storageName.TUI_DAO_HU)
        if (!this._saveTuiDaoHu || this._saveTuiDaoHu == "") {
            this._saveTuiDaoHu = {
                maiMaCount: 10, //0 表示不买马 数字表示买几马
                baoZaMaType: 0, //0 未选择 1 加分 2 加倍
                qiangGangHuRate: 2, //抢杠胡加倍 0 无 数字表示倍数1234
                gangShangHuaRate: 2, //杠上花加倍 0 无 数字表示倍数1234
                shiSanYaoScore: 12, ////十三幺分数 0 无 数字表示分数12-24 步进2
                siGuiHuRate: 1, //四鬼胡加倍 0 无 数字表示倍数1234
                qiDuiRate: 2, //七对加倍 0 无 数字表示倍数1234
                qingYiSeRate: 2, //清一色加倍 0 无 数字表示倍数1234
            }
        } else {
            this._saveTuiDaoHu = JSON.parse(this._saveTuiDaoHu)
        }
        this._saveZuoPaiTuiDaoHu = CacheManager.getItem(storageName.ZUO_PAI_TUI_DAO_HU)
        if (!this._saveZuoPaiTuiDaoHu || this._saveZuoPaiTuiDaoHu == "") {
            this._saveZuoPaiTuiDaoHu = {
                maiMaCount: 10, //0 表示不买马 数字表示买几马
                baoZaMaType: 0, //0 未选择 1 加分 2 加倍
                qiangGangHuRate: 2, //抢杠胡加倍 0 无 数字表示倍数1234
                gangShangHuaRate: 2, //杠上花加倍 0 无 数字表示倍数1234
                shiSanYaoScore: 20, ////十三幺分数 0 无 数字表示分数12-24 步进2
                jiHuScore: 1, //鸡胡 0 无 数字表示分数12
                pingHuScore: 2, //平胡 0 无 数字表示分数23
                siGuiHuScore: 2, //四鬼胡 0 无 数字表示分数2345
                pengPengHuScore: 4, //碰碰胡 0 无 数字表示分数23456
                hunYiSeScore: 4, //混一色 0 无 数字表示分数23456
                qiDuiScore: 8, //七对 0 无 数字表示分数2-12 步进2
                qingYiSeScore: 8, //清一色 0 无 数字表示分数2-12 步进2
                hunPengScore: 8, //混碰 0 无 数字表示分数2-12 步进2
                longQiDuiScore: 12, //龙七对 0 无 数字表示分数4-16 步进2
                xiaoSanYuanScore: 12, //小三元 0 无 数字表示分数4-16 步进2
                xiaoSiXiScore: 12, //小四喜 0 无 数字表示分数4-16 步进2
                qingPengScore: 12, //清碰 0 无 数字表示分数4-16 步进2
                hunYaoJiuScore: 12, //混幺9 0 无 数字表示分数4-16 步进2
                daSanYuanScore: 16, //大三元 0 无 数字表示分数8,12-20 步进2
                daSiXiScore: 16, //大四喜 0 无 数字表示分数8,12-20 步进2
                ziYiSeScore: 16, //字一色 0 无 数字表示分数8,12-20 步进2
                qingYaoJiuScore: 16, //清幺九 0 无 数字表示分数8,12-20 步进2
                qingQiDuiScore: 16, //清七对 0 无 数字表示分数8,12-20 步进2
                tianHuScore: 20, //天胡 0 无 数字表示分数12-24 步进2
                diHuScore: 20, //地胡 0 无 数字表示分数12-24 步进2
                shuangLongQiDuiScore: 24, //双龙七对 0 无 数字表示分数18-28 步进2
                sanLongQiDuiScore: 36, //三龙七对 0 无 数字表示分数28-40 步进4
                shiBaLuoHanScore: 36, //十八罗汉 0 无 数字表示分数28-40 步进4
            }
        } else {
            this._saveZuoPaiTuiDaoHu = JSON.parse(this._saveZuoPaiTuiDaoHu)
        }

        this._tuiDaoHuNames = Object.keys(this._saveTuiDaoHu)
        this._zuoPaiTuiDaoHuNames = Object.keys(this._saveZuoPaiTuiDaoHu)
        this._buDaiFengNames = ["hunYiSeScore", "hunPengScore", "xiaoSanYuanScore",
            "xiaoSiXiScore", "hunYaoJiuScore", "daSanYuanScore", "daSiXiScore", "shiSanYaoScore", "ziYiSeScore"
        ]

        let rate1_1 = {
            [0]: "禁用",
            [1]: "1倍",
            [2]: "2倍",
            [3]: "3倍",
            [4]: "4倍",
        }
        let score2_1 = {
            [0]: "禁用",
            [2]: "2分",
            [3]: "3分",
            [4]: "4分",
            [5]: "5分",
            [6]: "6分",
        }
        let score2_2 = {
            [0]: "禁用",
            [2]: "2分",
            [4]: "4分",
            [6]: "6分",
            [8]: "8分",
            [10]: "10分",
            [12]: "12分",
        }
        let score4_2 = {
            [0]: "禁用",
            [4]: "4分",
            [6]: "6分",
            [8]: "8分",
            [10]: "10分",
            [12]: "12分",
            [14]: "14分",
            [16]: "16分",
        }
        let score8_2 = {
            [0]: "禁用",
            [8]: "8分",
            [12]: "12分",
            [14]: "14分",
            [16]: "16分",
            [18]: "18分",
            [20]: "20分",
        }
        let score12_2 = {
            [0]: "禁用",
            [12]: "12分",
            [14]: "14分",
            [16]: "16分",
            [18]: "18分",
            [20]: "20分",
            [22]: "22分",
            [24]: "24分",
        }
        let score28_4 = {
            [0]: "禁用",
            [28]: "28分",
            [32]: "32分",
            [36]: "36分",
            [40]: "40分",
        }
        //如果新增有下拉属性的规则，这个里面也必须加配置
        this.xiaLa = {
            maiMaCount: {
                [0]: "禁用",
                [2]: "2马",
                [4]: "4马",
                [6]: "6马",
                [8]: "8马",
                [10]: "10马",
            }, //0 表示不买马 数字表示买几马246810
            baoZaMaType: {
                [0]: "禁用",
                [1]: "加分",
                [2]: "加倍",
            }, //0 未选择 1 加分 2 加倍
            /**共用规则 */
            qiangGangHuRate: rate1_1, //抢杠胡加倍 0 无 数字表示倍数1234
            gangShangHuaRate: rate1_1, //杠上花加倍 0 无 数字表示倍数1234
            shiSanYaoScore: score12_2, ////十三幺分数 0 无 数字表示分数12-24 步进2
            /**推倒胡规则 */
            siGuiHuRate: rate1_1, //四鬼胡加倍 0 无 数字表示倍数1234
            qiDuiRate: rate1_1, //七对加倍 0 无 数字表示倍数1234
            qingYiSeRate: rate1_1, //清一色加倍 0 无 数字表示倍数1234

            /**做牌推倒胡 */
            jiHuScore: {
                [0]: "禁用",
                [1]: "1分",
                [2]: "2分",
            }, //鸡胡 0 无 数字表示分数12
            pingHuScore: {
                [0]: "禁用",
                [2]: "2分",
                [3]: "3分",
            }, //平胡 0 无 数字表示分数23
            siGuiHuScore: {
                [0]: "禁用",
                [2]: "2分",
                [3]: "3分",
                [4]: "4分",
                [5]: "5分",
            }, //四鬼胡 0 无 数字表示分数2345
            pengPengHuScore: score2_1, //碰碰胡 0 无 数字表示分数23456
            hunYiSeScore: score2_1, //混一色 0 无 数字表示分数23456
            qiDuiScore: score2_2, //七对 0 无 数字表示分数2-12 步进2
            qingYiSeScore: score2_2, //清一色 0 无 数字表示分数2-12 步进2
            hunPengScore: score2_2, //混碰 0 无 数字表示分数2-12 步进2
            longQiDuiScore: score4_2, //龙七对 0 无 数字表示分数4-16 步进2
            xiaoSanYuanScore: score4_2, //小三元 0 无 数字表示分数4-16 步进2
            xiaoSiXiScore: score4_2, //小四喜 0 无 数字表示分数4-16 步进2
            qingPengScore: score4_2, //清碰 0 无 数字表示分数4-16 步进2
            hunYaoJiuScore: score4_2, //混幺9 0 无 数字表示分数4-16 步进2
            daSanYuanScore: score8_2, //大三元 0 无 数字表示分数8,12-20 步进2
            daSiXiScore: score8_2, //大四喜 0 无 数字表示分数8,12-20 步进2
            ziYiSeScore: score8_2, //字一色 0 无 数字表示分数8,12-20 步进2
            qingYaoJiuScore: score8_2, //清幺九 0 无 数字表示分数8,12-20 步进2
            qingQiDuiScore: score8_2, //清七对 0 无 数字表示分数8,12-20 步进2
            tianHuScore: score12_2, //天胡 0 无 数字表示分数12-24 步进2
            diHuScore: score12_2, //地胡 0 无 数字表示分数12-24 步进2
            shuangLongQiDuiScore: {
                [0]: "禁用",
                [18]: "18分",
                [20]: "20分",
                [22]: "22分",
                [24]: "24分",
                [26]: "26分",
                [28]: "28分",
            }, //双龙七对 0 无 数字表示分数18-28 步进2
            sanLongQiDuiScore: score28_4, //三龙七对 0 无 数字表示分数28-40 步进4
            shiBaLuoHanScore: score28_4, //十八罗汉 0 无 数字表示分数28-40 步进4
        };
    },

    onDestroy() {
        cc.systemEvent.off("xialakuangSelect", this.onXialaCheck, this)
        cc.systemEvent.off("guanbixialakuang", this.onXialaCheck, this)
    },

    start() {
        this.fangfeiPannel.active = !(!!this.node.nodeParams && !!this.node.nodeParams.isUnion);
        let gameRule = !!this.node.nodeParams ? this.node.nodeParams.gameRule : null;
        // console.log("合并之前的==", Utils.deepCopy(this.gameRule), gameRule)
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
        let allCount = 0
        CCUtil.nodeRecursive(this.node, (node) => {
            allCount++
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
                // console.log("添加了事件==", node.name, eventName)
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
            } else if (node.name.startsWith("playType")) { //胡牌
                let pt = parseInt(node.name.slice(8));
                if (this.gameRule.playType == pt) tog.isChecked = true
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
            } else if (node.name == "shiSanYaoScore" || node.name == "qiangGangHuRate" || node.name == "gangShangHuaRate") {
                tog.isChecked = this.gameRule[node.name] > 0
            } else {
                if (ruleKeys.includes(node.name) && cc.isValid(tog) && typeof (this.gameRule[node.name]) == "boolean") {
                    tog.isChecked = this.gameRule[node.name]
                    if (node.name == "isJiHuCanChi") {
                        tog.interactable = this.gameRule.isCanChiHu
                    }
                }
            }
        })
        /**恢复不带风 */
        if (this.gameRule.isWithoutZi) {
            this._buDaiFengNames.forEach(name => {
                this.setTogByRule(name, false, true)
                this.setBtnByRule(name, false)
                this.gameRule[name] = 0
            })
        }
        // console.log("总共节点数===", allCount)
        if (this.gameRule.playType == 1) {
            /**恢复选项 */
            this.updatePaiXinTogAndBtn(this.gameRule)
        } else if (this.gameRule.playType == 2) {
            this.updatePaiXinTogAndBtn(this.gameRule)
            /**恢复龙七对 */
            this.setTogByRule("longQiDuiScore", this.gameRule.qiDuiScore != 0, true)
            this.setTogByRule("qingQiDuiScore", this.gameRule.qiDuiScore != 0, true)
            this.setTogByRule("shuangLongQiDuiScore", this.gameRule.qiDuiScore != 0 && this.gameRule.longQiDuiScore != 0, true)
            this.setTogByRule("sanLongQiDuiScore", this.gameRule.qiDuiScore != 0 && this.gameRule.longQiDuiScore != 0 && this.gameRule.shuangLongQiDuiScore != 0, true)
        }

        /**抢杠 */
        if (this.gameRule.qiangGangHuRate == 0) {
            this.setTogByRule("isQiangGangBao", false, true)
            this.setTogByRule("isMingGangKeQiang", false, true)
        }

        /**买马和爆炸马的下拉按钮 */
        if (this.gameRule.maiMaCount == 0) {
            this.setBtnByRule("maiMaCount", false)
        }
        if (this.gameRule.baoZaMaType == 0) {
            this.setBtnByRule("baoZaMaType", false)
        }

        this.updateTuiDaoHu()
        this.updateMa()
        this.updateTxt()
    },

    /**设置牌型专用 */
    updatePaiXinTogAndBtn(saveRule) {
        let nameList = this._tuiDaoHuNames,
            checkNames = this._zuoPaiTuiDaoHuNames
        if (this.gameRule.playType == 2) {
            nameList = this._zuoPaiTuiDaoHuNames
            checkNames = this._tuiDaoHuNames
        }
        nameList.forEach(ruleKey => {
            if (ruleKey != "maiMaCount" && ruleKey != "baoZaMaType") {
                let tog = this._allTogs[ruleKey]
                let ruleValue = saveRule[ruleKey]
                if (this.gameRule.isWithoutZi) { //如果是不带风的牌型，使用本体rule
                    ruleValue = this.gameRule[ruleKey]
                } else {
                    this.gameRule[ruleKey] = ruleValue
                }
                if (tog) {
                    tog.isChecked = ruleValue > 0
                }
                this.setBtnByRule(ruleKey, ruleValue > 0)
            }
        })
        /**把另外一种胡牌模式的牌型分数全部设置为0 */
        let publicKey = ["maiMaCount", "baoZaMaType", "qiangGangHuRate", "gangShangHuaRate", "shiSanYaoScore"]
        checkNames.forEach(ruleKey => {
            if (!publicKey.includes(ruleKey)) this.gameRule[ruleKey] = 0
        })
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
            this.kaiMa.active = false
            this.isMaGenGang.active = false
        } else {
            this.maFen.active = true
            this.kaiMa.active = true
            this.isMaGenGang.active = true
        }
    },

    /**刷新下拉框的选中文字 */
    updateTxt() {
        for (const key in this.txtList) {
            if (Object.hasOwnProperty.call(this.txtList, key)) {
                const txt = this.txtList[key];
                txt.string = this.xiaLa[key][this.gameRule[key]]
            }
        }
    },

    /**推倒胡牌型切换 1 推倒胡 2：做牌推倒胡 只做隐藏和显示*/
    updateTuiDaoHu() {
        let setTogShow = (nameList, isShow) => {
            nameList.forEach(key => {
                const tog = this._allTogs[key];
                if (tog) tog.node.active = isShow
            });
        }

        setTogShow(this._tuiDaoHuNames, false)
        setTogShow(this._zuoPaiTuiDaoHuNames, false)

        if (this.gameRule.playType == 1) {
            setTogShow(this._tuiDaoHuNames, true)
        } else if (this.gameRule.playType == 2)
            setTogShow(this._zuoPaiTuiDaoHuNames, true)
    },

    /**刷新不带风的牌型 */
    updateBuDaiFeng() {
        this._buDaiFengNames.forEach(ruleKey => {
            if (this.gameRule.isWithoutZi) {
                this.setTogByRule(ruleKey, false, true)
                this.setBtnByRule(ruleKey, false)
                this.gameRule[ruleKey] = 0
            } else {
                this.setTogByRule(ruleKey, true)
            }
        })
    },

    /**刷新龙七对 */
    updateLongQiDui() {
        if (this.gameRule.playType == 2) {
            if (this.gameRule.qiDuiScore == 0) {
                this.gameRule.longQiDuiScore = 0
                this.gameRule.qingQiDuiScore = 0
                this.gameRule.shuangLongQiDuiScore = 0
                this.gameRule.sanLongQiDuiScore = 0
            } else {
                if (this.gameRule.longQiDuiScore == 0) {
                    this.gameRule.shuangLongQiDuiScore = 0
                    this.gameRule.sanLongQiDuiScore = 0
                } else {
                    if (this.gameRule.shuangLongQiDuiScore == 0) {
                        this.gameRule.sanLongQiDuiScore = 0
                    }
                }
            }
            this.setTogByRule("longQiDuiScore", this.gameRule.qiDuiScore != 0, true)
            this.setTogByRule("qingQiDuiScore", this.gameRule.qiDuiScore != 0, true)
            this.setTogByRule("shuangLongQiDuiScore", this.gameRule.qiDuiScore != 0 && this.gameRule.longQiDuiScore != 0, true)
            this.setTogByRule("sanLongQiDuiScore", this.gameRule.qiDuiScore != 0 && this.gameRule.longQiDuiScore != 0 && this.gameRule.shuangLongQiDuiScore != 0, true)
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
        } else if (node.name.startsWith("playType")) { //胡牌
            let hupai = parseInt(node.name.slice(8));
            if (this.gameRule.playType != hupai) {
                this.gameRule.playType = hupai
                this.updateTuiDaoHu()
                /**刷新选中 禁用状态 */
                if (this.gameRule.playType == 1) {
                    this.updatePaiXinTogAndBtn(this._saveTuiDaoHu)
                } else if (this.gameRule.playType == 2) {
                    this.updatePaiXinTogAndBtn(this._saveZuoPaiTuiDaoHu)
                }
                /**抢杠 */
                if (this.gameRule.qiangGangHuRate == 0) {
                    this.setTogByRule("isQiangGangBao", false, true)
                    this.setTogByRule("isMingGangKeQiang", false, true)
                } else {
                    this.setTogByRule("isQiangGangBao", true)
                    this.setTogByRule("isMingGangKeQiang", true)
                }
            }
        } else if (node.name.startsWith("bankerType")) { //轮庄
            let lunzhuang = parseInt(node.name.slice(10));
            this.gameRule.bankerType = lunzhuang
        } else if (node.name.startsWith("laiZiType")) { //鬼牌
            let gui = parseInt(node.name.slice(9));
            this.gameRule.laiZiType = gui
            //无鬼需要去掉无鬼加倍和四鬼胡
            if (gui == 0) {
                this.gameRule.isNoLaiDouble = false
                this.gameRule.siGuiHuRate = 0
                this.gameRule.siGuiHuScore = 0
            }
            this.setTogByRule("isNoLaiDouble", !(gui == 0), gui == 0)
            this.setTogByRule("siGuiHuRate", !(gui == 0), gui == 0)
            this.setTogByRule("siGuiHuScore", !(gui == 0), gui == 0)
            this.setBtnByRule("siGuiHuRate", this.gameRule.siGuiHuRate > 0)
            this.setBtnByRule("siGuiHuScore", this.gameRule.siGuiHuScore > 0)
        } else if (node.name == "maiMaCount0") { //不买马
            this.gameRule.maiMaCount = 0
            this.gameRule.baoZaMaType = 0
            this.updateMa()
            this.setBtnByRule("maiMaCount", false)
            this.setBtnByRule("baoZaMaType", false)
        } else if (node.name == "maiMaCount") { //买马
            this.gameRule.baoZaMaType = 0
            if (this.gameRule.maiMaCount == 0) this.gameRule.maiMaCount = 6
            this.updateMa()
            this.setBtnByRule("maiMaCount", true)
            this.setBtnByRule("baoZaMaType", false)
        } else if (node.name == "baoZaMaType") { //爆炸马
            this.gameRule.maiMaCount = 0
            if (this.gameRule.baoZaMaType == 0) this.gameRule.baoZaMaType = 1
            this.updateMa()
            this.setBtnByRule("maiMaCount", false)
            this.setBtnByRule("baoZaMaType", true)
        } else if (node.name.startsWith("maScoreType")) { //马分
            let mt = parseInt(node.name.slice(11));
            this.gameRule.maScoreType = mt
        } else if (node.name.startsWith("trustTm")) { //托管
            let tidx = parseInt(node.name.slice(7));
            if (tog.isChecked) this.gameRule.trustTm = TUO_GUAN_TIME[tidx]
            this.gameRule.canTrust = this.gameRule.trustTm > 0
        } else if (node.name.startsWith("btn_")) { //所有的下拉框
            if (this._curXiaLaName) {
                // console.log("已经有选择的下拉框了")
                return
            }
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
            if (ruleKeys.includes(node.name) && cc.isValid(tog) && typeof (this.gameRule[node.name]) == "boolean") {
                this.gameRule[node.name] = tog.isChecked
                if (node.name == "isWithoutZi") {
                    this.updateBuDaiFeng()
                } else if (node.name == "isCanChiHu") {
                    if (!this.gameRule.isCanChiHu) {
                        this.gameRule.isJiHuCanChi = false
                        this.setTogByRule("isJiHuCanChi", false, true)
                    } else {
                        this.setTogByRule("isJiHuCanChi", true)
                    }
                }
            } else {
                if (cc.isValid(tog)) {
                    /**未选中的时候需要禁用下拉按钮 */
                    let checkRule = (rule) => {
                        if (!tog.isChecked) {
                            this.gameRule[node.name] = 0
                        } else {
                            this.gameRule[node.name] = rule[node.name]
                        }
                        this.setBtnByRule(node.name, tog.isChecked)
                    }
                    if (this.gameRule.playType == 1) {
                        let tRuleKeys = Object.keys(this._saveTuiDaoHu)
                        if (tRuleKeys.includes(node.name)) {
                            checkRule(this._saveTuiDaoHu)
                        }
                    } else if (this.gameRule.playType == 2) {
                        let zRuleKeys = Object.keys(this._saveZuoPaiTuiDaoHu)
                        if (zRuleKeys.includes(node.name)) {
                            checkRule(this._saveZuoPaiTuiDaoHu)
                            this.updateLongQiDui()
                        }
                    }
                    this.updateQiangGang()
                }
            }
        }
        this.updateTxt()
        // console.log("save gdtdh rule==", this.gameRule)
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
            // console.log("收到了下拉框消息==", name, index, this.xiaLa[name])
            this.gameRule[name] = index
            ConfigModel.setRoomCreateCache(this.gameRule);
            this.updateTxt()
            if (name != "maiMaCount" && name != "baoZaMaType") {
                if (this.gameRule.playType == 1) {
                    this._saveTuiDaoHu[name] = this.gameRule[name]
                    CacheManager.setItem(storageName.TUI_DAO_HU, JSON.stringify(this._saveTuiDaoHu))
                } else if (this.gameRule.playType == 2) {
                    this._saveZuoPaiTuiDaoHu[name] = this.gameRule[name]
                    CacheManager.setItem(storageName.ZUO_PAI_TUI_DAO_HU, JSON.stringify(this._saveZuoPaiTuiDaoHu))
                }
            }
        }
    },

    getRule() {
        return this.gameRule;
    }

});