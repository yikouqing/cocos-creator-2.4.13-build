const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const Enums = require('../../const/Enums');

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
        difenEdit: cc.EditBox,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            gameType: Enums.bundleType.PTJ,
            bureau: 12, //局数
            minPlayerCount: 2,
            maxPlayerCount: 4,
            canTrust: false, //托管
            trustTm: 9999, //托管时间
            baseScore: 0.3,
            yuyin: false,
            tongji: false, //输赢统计
            fangzuobi: false, //防作弊
            showGps: false, //GPS
            //拼天九玩法设置
            bankerPourScores: 0, //下分模式 每次选分 固定分数
            canPourScores: [1, 2, 5, 8, 10], //可下注分数 根据玩法模式配置获取
            bankerMode: 1, //玩法模式 霸王庄 自由抢庄 轮庄 
            gameMode: 0, //游戏模式 两道杠 三道杠
            cardMode: 0, //卡牌模式 大牌九 小牌九
            isZhaDan: false, //炸弹
            isDiJiuNiangNiang: false, //地九娘娘
            isGuiZi: false, //鬼子
            isTianJiuWang: false, //天九王
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
        this.difenEdit.string = this.gameRule.baseScore;
        this.node_fenshu2.parent.active = this.gameRule.bankerPourScores == 1;
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
        this.setToggle(this.node_fenshu1.getChildByName("tog_" + this.gameRule.bankerPourScores));
        this.setToggle(this.node_fenshu2.getChildByName("tog_" + this.gameRule.canPourScores[0]));
        this.setToggle(this.node_wanfa2.getChildByName("tog_guizi"), this.gameRule.isGuiZi);
        this.setToggle(this.node_wanfa2.getChildByName("tog_zhadan"), this.gameRule.isZhaDan);
        this.setToggle(this.node_wanfa2.getChildByName("tog_djnn"), this.gameRule.isDiJiuNiangNiang);
        this.setToggle(this.node_wanfa2.getChildByName("tog_tianjiuwang"), this.gameRule.isTianJiuWang);
        this.setToggle(this.node_gaoji.getChildByName("tog_zhongtu"), this.gameRule.canEnter);
        this.setToggle(this.node_gaoji.getChildByName("tog_cuopai"), this.gameRule.cuopai);
        this.node_gaoji.getChildByName("tog_cuopai").active = this.gameRule.cardMode == 1;
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
            this.gameRule.bankerPourScores = parseInt(param.split('_')[1]);
            this.node_fenshu2.parent.active = this.gameRule.bankerPourScores == 1;
            if (this.gameRule.bankerPourScores == 0) {
                this.gameRule.canPourScores = [1, 2, 5, 8, 10];
            }
        } else if (param.indexOf('guding_') != -1) {
            this.gameRule.canPourScores = [parseInt(param.split('_')[1])];
        } else if (param == 'tuoguan') {
            this.gameRule.canTrust = event.isChecked;
        } else if (param.indexOf('cardMode_') != -1) {
            this.gameRule.cardMode = parseInt(param.split('_')[1]);
            if (this.gameRule.cardMode != 1) {
                this.gameRule.cuopai = false;
                this.setToggle(this.node_gaoji.getChildByName("tog_cuopai"), false);
            };
            this.node_gaoji.getChildByName("tog_cuopai").active = this.gameRule.cardMode == 1;
        } else if (param == "tog_zhadan") {
            this.gameRule.isZhaDan = event.isChecked;
        } else if (param == "tog_guizi") {
            this.gameRule.isGuiZi = event.isChecked;
        } else if (param == "tog_tianjiuwang") {
            this.gameRule.isTianJiuWang = event.isChecked;
        } else if (param == "tog_djnn") {
            this.gameRule.isDiJiuNiangNiang = event.isChecked;
        } else if (param == "basescore") {
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