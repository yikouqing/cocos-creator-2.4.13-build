const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const Enums = require('../../const/Enums');

const minPourScore = [30, 50, 100, 200, 300];
const maxPourScore = [100, 200, 300, 500, 1000];
cc.Class({
    extends: cc.Component,

    properties: {
        node_jushu: cc.Node,
        node_fangfei: cc.Node,
        hostPayTog: cc.Toggle,
        aaPayTog: cc.Toggle,
        winPayTog: cc.Toggle,
        tuoGuanTog: cc.Toggle,
        node_wanfa1: cc.Node,
        node_zhuang: cc.Node,
        node_wanfa2: cc.Node,
        node_fenshu1: cc.Node,
        node_fenshu2: cc.Node,
        node_moshi: cc.Node,
        tog_lastlimit: cc.Toggle,
        node_gaoji: cc.Node,
        node_guodi: cc.Node,
        difenEdit: cc.EditBox,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            gameType: Enums.bundleType.JGPTJ,
            bureau: 12, //局数
            minPlayerCount: 2,
            maxPlayerCount: 4,
            canTrust: false, //托管
            trustTm: 9999, //托管时间
            baseScore: 0.3,
            yuyin: false,
            canEnter: false,//中途加入
            canWatch: false,//中途加入
            tongji: false, //输赢统计
            fangzuobi: false, //防作弊
            showGps: false, //GPS

            cuopai: false,
            //拼天九玩法设置
            bankerPourScores: 0, //下分模式 每次选分 固定分数
            // canPourScores: [1, 2, 5, 8, 10], //可下注分数 根据玩法模式配置获取
            bankerMode: 1, //玩法模式 霸王庄 自由抢庄 轮庄 
            gameMode: 0, //游戏模式 两道杠 三道杠
            cardMode: 0, //卡牌模式 大牌九 小牌九
            isZhaDan: false, //炸弹
            isDiJiuNiangNiang: false, //地九娘娘
            isGuiZi: false, //鬼子
            isTianJiuWang: false, //天九王

            lastThreeJoin: false,


            wuBeiQieGuo: false, //五倍强制切锅
            minPourScore: minPourScore[0], //下注最小分
            maxPourScore: maxPourScore[0], //下注最大分(锅底)
            touBaBiMan: false, //头把必满
        };
        this.updateCost();
    },

    start() {
        this.node_fangfei.parent.active = !(!!this.node.nodeParams && !!this.node.nodeParams.isUnion);
        if (!!this.node.nodeParams && !!this.node.nodeParams.gameRule) {
            this.gameRule = this.node.nodeParams.gameRule;
        }
        this.init();
    },

    init() {
        this.difenEdit.string = this.gameRule.baseScore;
        this.node_fenshu2.parent.active = this.gameRule.bankerPourScores == 0;
        this.tuoGuanTog.isChecked = this.gameRule.canTrust;
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        this.setToggle(this.node_jushu.getChildByName("tog_" + this.gameRule.bureau));
        this.setToggle(this.node_fangfei.getChildByName("tog_" + this.gameRule.payType));
        this.setToggle(this.node_wanfa1.getChildByName("tog_" + this.gameRule.gameMode));
        this.setToggle(this.node_zhuang.getChildByName("tog_" + this.gameRule.bankerMode));
        this.setToggle(this.node_moshi.getChildByName("tog_" + this.gameRule.cardMode));
        this.setToggle(this.node_guodi.getChildByName("tog_guodi" + this.gameRule.maxPourScore));
        this.setToggle(this.node_fenshu1.getChildByName("tog_" + this.gameRule.bankerPourScores));
        this.setToggle(this.node_fenshu2.getChildByName("tog_" + this.gameRule.minPourScore));

        this.setToggle(this.node_wanfa2.getChildByName("tog_guizi"), this.gameRule.isGuiZi);
        this.setToggle(this.node_wanfa2.getChildByName("tog_zhadan"), this.gameRule.isZhaDan);
        this.setToggle(this.node_wanfa2.getChildByName("tog_djnn"), this.gameRule.isDiJiuNiangNiang);
        this.setToggle(this.node_wanfa2.getChildByName("tog_tianjiuwang"), this.gameRule.isTianJiuWang);
        this.setToggle(this.node_wanfa2.getChildByName("tog_toubabiman"), this.gameRule.touBaBiMan);
        this.setToggle(this.node_wanfa2.getChildByName("tog_wubeiqieguo"), this.gameRule.wuBeiQieGuo);

        this.setToggle(this.node_gaoji.getChildByName("tog_guanzhan"), this.gameRule.canWatch);
        this.setToggle(this.node_gaoji.getChildByName("tog_zhongtu"), this.gameRule.canEnter);
        this.setToggle(this.node_gaoji.getChildByName("tog_cuopai"), this.gameRule.cuopai);
        this.node_gaoji.getChildByName("tog_cuopai").active = true// this.gameRule.cardMode == 1;
        this.tog_lastlimit.isChecked = this.gameRule.canEnter && this.gameRule.lastThreeJoin;
        this.tog_lastlimit.interactable = this.gameRule.canEnter;
    },


    updateCost() {
        let bureau = this.gameRule.bureau;
        this.gameRule.canEnter = false;
        let diamondCount = 1;
        if (bureau === 9999) {
            diamondCount = 1;
            this.gameRule.canEnter = false;
        } else if (bureau == 4) {
            diamondCount = 2;
        } else if (bureau == 8) {
            diamondCount = 3;
        } else if (bureau == 16) {
            diamondCount = 4;
        }
        this.gameRule.payDiamond = diamondCount;
    },

    onButtonClick(event, param) {
        if (param.indexOf('jushu_') != -1) {
            this.gameRule.bureau = parseInt(param.split('_')[1]);
            // this.updateCost();
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param.indexOf('wanfa1_') != -1) {
            this.gameRule.gameMode = parseInt(param.split('_')[1]);
        } else if (param.indexOf('zhuang_') != -1) {
            this.gameRule.bankerMode = parseInt(param.split('_')[1]);
        } else if (param.indexOf('fenshu1_') != -1) {
            // this.gameRule.bankerPourScores = parseInt(param.split('_')[1]);
        } else if (param.indexOf('guding_') != -1) {
            let minPourScore = parseInt(param.slice(7));
            this.scorejudge(true, minPourScore);
        } else if (param.indexOf('tog_guodi') != -1) {
            let maxPourScore = parseInt(param.slice(9));
            this.scorejudge(false, maxPourScore);
        } else if (param == 'tuoguan') {
            this.gameRule.canTrust = event.isChecked;
        } else if (param.indexOf('cardMode_') != -1) {
            this.gameRule.cardMode = parseInt(param.split('_')[1]);
            // if (this.gameRule.cardMode != 1) {
            //     this.gameRule.cuopai = false;
            //     this.setToggle(this.node_gaoji.getChildByName("tog_cuopai"), false);
            // };
            // this.node_gaoji.getChildByName("tog_cuopai").active = this.gameRule.cardMode == 1;
        }
        else if (param == "tog_guanzhan") {
            this.gameRule.canWatch = event.isChecked;
        }
        else if (param == "tog_zhongtu") {
            this.gameRule.canEnter = event.isChecked;
        }

        else if (param == "tog_zhadan") {
            this.gameRule.isZhaDan = event.isChecked;
        } else if (param == "tog_guizi") {
            this.gameRule.isGuiZi = event.isChecked;
        } else if (param == "tog_tianjiuwang") {
            this.gameRule.isTianJiuWang = event.isChecked;
        } else if (param == "tog_djnn") {
            this.gameRule.isDiJiuNiangNiang = event.isChecked;
        } else if (param == "tog_toubabiman") {
            this.gameRule.touBaBiMan = event.isChecked;
        } else if (param == "tog_wubeiqieguo") {
            this.gameRule.wuBeiQieGuo = event.isChecked;
        }
        else if (param == "basescore") {
            this.onCheckRuleEditScore(this.difenEdit, 0.3, 100, "baseScore")
        } else if (param == 'zhongtu') {
            this.gameRule.canEnter = event.isChecked;
            this.tog_lastlimit.interactable = this.gameRule.canEnter;
            if (!this.gameRule.canEnter) {
                this.tog_lastlimit.isChecked = false;
                this.gameRule.lastThreeJoin = false;
            }
        } else if (param == 'lastlimit') {
            this.gameRule.lastThreeJoin = !!event.isChecked;
        } else if (param == "cuopai") {
            this.gameRule.cuopai = !!event.isChecked;
        }
        // console.log('创建规则_GAME_RULE', this.gameRule);
        ConfigModel.setRoomCreateCache(this.gameRule);
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

    scorejudge(type, curScore) {
        let setVal = (rootNode, sonName, funs, array, score) => {
            let CurVal = type ? array[0] : array[array.length - 1];
            if (type) {
                var array1 = [];
                array.forEach(val => { array1.unshift(val); });
                CurVal = array1.find(item => item <= score);
            } else {
                CurVal = array.find(item => item >= score);
            }
            rootNode.children.forEach((node, index) => {
                let val = array[index];
                let CurNode = rootNode.getChildByName(sonName + val);
                CurNode && this.setToggle(CurNode, CurVal == val);
            })
            funs && funs(CurVal);
        }
        if (type) {//下注
            if (curScore > this.gameRule.maxPourScore) {
                AssetsManager.tipDialog(`下注分不能大于锅底分`);
                setVal(this.node_fenshu2, "tog_", (val) => {
                    this.gameRule.minPourScore = val;
                }, minPourScore, this.gameRule.maxPourScore);
            } else {
                this.gameRule.minPourScore = curScore;

            }
        } else {//锅底
            if (curScore < this.gameRule.minPourScore) {
                AssetsManager.tipDialog(`锅底分不能小于下注分`);
                setVal(this.node_guodi, "tog_guodi", (val) => {
                    this.gameRule.maxPourScore = val;
                }, maxPourScore, this.gameRule.minPourScore);
            } else {
                this.gameRule.maxPourScore = curScore;
            }
        }
    },

    getRule() {
        this.gameRule.canTrust = false;
        return this.gameRule;
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