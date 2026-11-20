var AssetsManager = require('../../utils/AssetsManager');
var ConfigModel = require('../../model/ConfigModel');
var Enums = require('../../const/Enums');
cc.Class({
    extends: cc.Component,

    properties: {
        payCreatorTog: cc.Toggle,
        payAATog: cc.Toggle,
        payWinTog: cc.Toggle,
        node_jushu: cc.Node,
        node_fangfei: cc.Node,
        node_zhuang: cc.Node,
        node_fenshu1: cc.Node,
        node_fenshu2: cc.Node,
        node_tuoguan: cc.Node,
        tog_lastlimit: cc.Toggle,
        node_gaoji: cc.Node,
        node_xiazhu: cc.Node,
        difenEdit: cc.EditBox,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            gameType: Enums.bundleType.TTZ,
            bureau: 12, //局数
            minPlayerCount: 2,
            maxPlayerCount: 5,

            canTrust: false, //托管
            trustTm: 0, //托管时间
            baseScore: 0.3,

            yuyin: false,
            tongji: false, //输赢统计
            fangzuobi: false, //防作弊
            showGps: false, //GPS

            //拼天九玩法设置
            bankerPourScores: 0, //下分模式 每次选分 固定分数
            PourScore: [2, 5, 8, 10], //可下注分数 根据玩法模式配置获取
            bankerType: 1, //1轮庄 2抢庄 3霸王
            pourTick: 10, //下注时间

            canEnter: false,
            lastThreeJoin: false,
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
        /**支付 */
        this.payCreatorTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU
        this.payAATog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU
        this.payWinTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU

        this.gameRule.trustTm = 100000;
        this.difenEdit.string = this.gameRule.baseScore;
        this.node_fenshu2.parent.active = this.gameRule.bankerPourScores == 1;
        this.setToggle(this.node_jushu.getChildByName("tog_" + this.gameRule.bureau));
        this.setToggle(this.node_tuoguan.getChildByName("tog_" + (this.gameRule.canTrust ? 1 : 0)));
        this.setToggle(this.node_fangfei.getChildByName("tog_" + this.gameRule.payType));
        this.setToggle(this.node_zhuang.getChildByName("tog_" + this.gameRule.bankerType));
        this.setToggle(this.node_xiazhu.getChildByName("tog_" + this.gameRule.pourTick));
        this.setToggle(this.node_fenshu1.getChildByName("tog_" + this.gameRule.bankerPourScores));
        this.setToggle(this.node_fenshu2.getChildByName("tog_" + this.gameRule.PourScore[0]));
        this.setToggle(this.node_gaoji.getChildByName("tog_zhongtu"), this.gameRule.canEnter);
        this.setToggle(this.node_gaoji.getChildByName("tog_cuopai"), this.gameRule.cuopai);
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
            this.gameRule.bankerType = parseInt(param.split('_')[1]);
        } else if (param.indexOf('fenshu1_') != -1) {
            this.gameRule.bankerPourScores = parseInt(param.split('_')[1]);
            this.node_fenshu2.parent.active = this.gameRule.bankerPourScores == 1;
            if (this.gameRule.bankerPourScores == 0) {
                this.gameRule.PourScore = [2, 5, 8, 10];
            } else {
                this.gameRule.PourScore = [2];
                this.setToggle(this.node_fenshu2.getChildByName("tog_" + this.gameRule.PourScore[0]));
            }
        } else if (param.indexOf('guding_') != -1) {
            this.gameRule.PourScore = [parseInt(param.split('_')[1])];
        } else if (param.indexOf('xiazhu_') != -1) {
            this.gameRule.pourTick = parseInt(param.split('_')[1]);
        } else if (param.indexOf('tuoguan_') != -1) {
            this.gameRule.trustTm = parseInt(param.split('_')[1]);
            this.gameRule.canTrust = !!this.gameRule.trustTm;
        } else if (param == "basescore") {
            this.onCheckRuleEditScore(this.difenEdit, 0.1, 100, "baseScore")
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
        this.gameRule.trustTm = 100000;
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

    getRule() {
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