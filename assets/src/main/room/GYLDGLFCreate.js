const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const Utils = require("../../utils/Utils");

cc.Class({
    extends: cc.Component,

    properties: {
        difenEdit: cc.EditBox,
        fangfeiPannel: cc.Node,
        hostPayTog: cc.Toggle,
        aaPayTog: cc.Toggle,
        winPayTog: cc.Toggle,
        node_jushu: cc.Node,
        node_fengding: cc.Node,
        node_zimo: cc.Node,
        node_qianggang: cc.Node,
        node_jipai: cc.Node,
        node_wanfa: cc.Node,
        node_gaoji: cc.Node,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            gameType: Enums.bundleType.GYLDGLF,
            bureau: 4, //局数
            minPlayerCount: 2,
            maxPlayerCount: 2,

            canTrust: false, //托管
            trustTm: 0, //托管时间

            baseScore: 0.3,
            roomType: 3,
            yuyin: false,
            tongji: false, //输赢统计
            fangzuobi: false, //防作弊
            showGps: false, //GPS

            gumai: false, //估卖
            gumaifen: 0, //估卖分 0为自由分
            fengDing: 0, //封顶分数 0 不封顶
            // addLaiZi: 1, //0癞子玩法 1经典玩法

            jipai: 0, //0摇摆鸡/上下鸡   1翻牌鸡/)

            baoji: false, //包鸡 
            benji: false, //本鸡
            // jinji: false, //金鸡
            // yinji: false, //银鸡
            wuguji: false, //乌骨鸡
            xingqiji: false, //星期鸡
            manTangji: false, //满堂鸡 
            chuifengji: false, //吹风鸡

            dilong: false, //地龙
            // qingdilong: false, //清地龙
            baojiaokemen: false, //报叫可闷
            lianzhuangbulianju: false, //连庄不连局
            dayizhangkebaoting: false, //打一张可报听

            //连庄
            yikouer: false, //一扣二
            lianzhuang: false, //连庄
            // tongsan: false, //通三

            queYiMen: true, //两房牌
            repaoPeiFen: false, //热炮赔分
            qingyiseJiaFen: false, //清一色额外+5分
            zimoFanBei: true, //自摸翻倍
            zimoJiaFen: false, //自摸加一分
            qianggangPeiFen: true, //抢杠赔分
            qianggangZiMo: false, //抢杠算自摸
            qianggangShaoJi: false, //抢杠烧鸡
            qianggangShaoDou: false, //抢杠烧豆
            qianggangBaoJia: false, //抢杠包两家
        };
        this.updateCost();
    },

    start() {
        this.fangfeiPannel.active = !(!!this.node.nodeParams && !!this.node.nodeParams.isUnion);
        this.gameRule = !!this.node.nodeParams && !!this.node.nodeParams.gameRule ? this.node.nodeParams.gameRule : this.gameRule;
        this.init();
    },

    init() {
        this.gameRule.canEnter = false;
        if (this.gameRule.bureau == 9999) {
            this.gameRule.canEnter = false;
        } else {
            this.setToggle(this.node_jushu.getChildByName("tog_" + this.gameRule.bureau));
        }
        if (this.gameRule.zimoFanBei) {
            this.setToggle(this.node_zimo.getChildByName("tog_0"));
        } else if (this.gameRule.zimoJiaFen) {
            this.setToggle(this.node_zimo.getChildByName("tog_1"));
        }
        if (this.gameRule.qianggangPeiFen) {
            this.setToggle(this.node_qianggang.getChildByName("tog_0"));
        } else if (this.gameRule.qianggangZiMo) {
            this.setToggle(this.node_qianggang.getChildByName("tog_1"));
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        this.setToggle(this.node_jipai.getChildByName("tog_" + this.gameRule.jipai));
        this.setToggle(this.node_wanfa.getChildByName("mantang"), this.gameRule.manTangji);
        this.setToggle(this.node_wanfa.getChildByName("wuguji"), this.gameRule.wuguji);
        this.setToggle(this.node_wanfa.getChildByName("xingqiji"), this.gameRule.xingqiji);
        this.setToggle(this.node_wanfa.getChildByName("baoji"), this.gameRule.baoji);
        this.setToggle(this.node_wanfa.getChildByName("shaoji"), this.gameRule.qianggangShaoJi);
        this.setToggle(this.node_wanfa.getChildByName("shaodou"), this.gameRule.qianggangShaoDou);
        this.setToggle(this.node_wanfa.getChildByName("repao"), this.gameRule.repaoPeiFen);
        this.setToggle(this.node_wanfa.getChildByName("lianzhuang"), this.gameRule.lianzhuang);

        this.node_gaoji.getChildByName("yuyin").active = false;
        this.setToggle(this.node_gaoji.getChildByName("yuyin"), this.gameRule.yuyin);
        this.setToggle(this.node_gaoji.getChildByName("tongji"), this.gameRule.tongji);
        this.setToggle(this.node_gaoji.getChildByName("fangzuobi"), this.gameRule.fangzuobi);
        this.setToggle(this.node_gaoji.getChildByName("location"), this.gameRule.showGps);
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
        if (param.indexOf('bureau') != -1) {
            this.gameRule.bureau = parseInt(param.split('_')[1]);
            this.updateCost();
        } else if (param.indexOf('zimo') != -1) {
            let zimo = parseInt(param.slice(4));
            this.gameRule.zimoFanBei = zimo == 0;
            this.gameRule.zimoJiaFen = zimo == 1;
        } else if (param.indexOf('qianggang') != -1) {
            let qianggang = parseInt(param.slice(9));
            this.gameRule.qianggangPeiFen = qianggang == 0;
            this.gameRule.qianggangZiMo = qianggang == 1;
        } else if (param.indexOf('jipai') != -1) {
            this.gameRule.jipai = parseInt(param.slice(5));
        }
        if (param.indexOf('fengding') != -1) {
            this.gameRule.fengDing = parseInt(param.slice(8));
        } else if (param == 'manTangji') {
            this.gameRule.manTangji = event.isChecked;
        } else if (param == 'wuguji') {
            this.gameRule.wuguji = event.isChecked;
        } else if (param == 'xingqiji') {
            this.gameRule.xingqiji = event.isChecked;
        } else if (param == 'baoji') {
            this.gameRule.baoji = event.isChecked;
        } else if (param == 'qianggangShaoJi') {
            this.gameRule.qianggangShaoJi = event.isChecked;
        } else if (param == 'qianggangShaoDou') {
            this.gameRule.qianggangShaoDou = event.isChecked;
        } else if (param == 'repaoPeiFen') {
            this.gameRule.repaoPeiFen = event.isChecked;
        } else if (param == 'lianzhuang') {
            this.gameRule.lianzhuang = event.isChecked;
        } else if (param == 'yuyin') {
            this.gameRule.yuyin = event.isChecked;
        } else if (param == "tongji") {
            this.gameRule.tongji = event.isChecked
        } else if (param == "fangzuobi") {
            this.gameRule.fangzuobi = event.isChecked;
        } else if (param == "location") {
            this.gameRule.showGps = event.isChecked
        } else if (param == "difen") {
            this.onCheckRuleEditScore(this.difenEdit, 0.3, 100, "baseScore")
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param.indexOf('tuoguan') != -1) { //托管
            let tuoguan = parseInt(param.slice(7));
            this.gameRule.canTrust = !!tuoguan;
            this.gameRule.trustTm = tuoguan
            // console.log("托管==", tuoguan)
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
        this.gameRule.manTangji = true;
        return this.gameRule;
    },

    setToggle(curNode, isChecked = true) {
        if (!!curNode && !!curNode.getComponent(cc.Toggle)) {
            curNode.getComponent(cc.Toggle).isChecked = !!isChecked;
        }
    }
});