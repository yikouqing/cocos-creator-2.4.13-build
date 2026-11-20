const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
let gumaiVal = [0, 1, 2, 3, 4, 5];
const Utils = require("../../utils/Utils");

cc.Class({
    extends: cc.Component,

    properties: {
        fangfeiPannel: cc.Node,
        hostPayTog: cc.Toggle,
        aaPayTog: cc.Toggle,
        winPayTog: cc.Toggle,
        node_jushu: cc.Node,
        node_renshu: cc.Node,
        node_fengding: cc.Node,
        node_isgumai: cc.Node,
        node_gumai: cc.Node,
        node_lianzhuang: cc.Node,
        node_jipai: cc.Node,
        node_wanfa: cc.Node,
        node_gaoji: cc.Node,
        // node_tuoguan: cc.Node,
        difenEdit: cc.EditBox,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            gameType: Enums.bundleType.MHXL,
            bureau: 4, //局数
            minPlayerCount: 4,
            maxPlayerCount: 4,

            canTrust: false, //托管
            trustTm: 0, //托管时间

            canEnter: false,
            wanfa: 3,
            baseScore: 0.3,
            roomType: 3,
            yuyin: false,
            tongji: false, //输赢统计
            fangzuobi: false, //防作弊
            showGps: false, //GPS

            // addLaiZi: 1, //0癞子玩法 1经典玩法
            fengDing: 0, //封顶分数 0 不封顶
            jipai: 0, //0摇摆鸡 1翻牌鸡)

            manTangji: true, //0满堂鸡 

            gumai: true, //估卖
            gumaifen: 0, //估卖分 0为自由分

            wuguji: false, //乌骨鸡
            benji: false, //本鸡
            // jinji: false, //金鸡
            // yinji: false, //银鸡
            xingqiji: false, //星期鸡
            chuifengji: false, //吹风鸡
            yuanbao: true, //原报
            dilong: false, //地龙
            // qingdilong: false, //清地龙
            baojiaokemen: false, //报叫可闷
            lianzhuangbulianju: false, //连庄不连局
            dayizhangkebaoting: false, //打一张可报听

            //连庄
            yikouer: false, //一扣二
            lianzhuang: false, //连庄
            // tongsan: false, //通三
            queYiMen: false,

            qianggangShaoJi: true, //抢杠烧鸡
            qianggangShaoDou: true, //抢杠烧豆
            yuanbao: true, //原报
        };
        this.updateCost();
    },

    start() {
        this.fangfeiPannel.active = !(!!this.node.nodeParams && !!this.node.nodeParams.isUnion);
        this.gameRule = !!this.node.nodeParams && !!this.node.nodeParams.gameRule ? this.node.nodeParams.gameRule : this.gameRule;
        this.init();
    },

    showGuMai(gumai) {
        this.gameRule.gumai = gumai;
        this.node_gumai.children.forEach(curNode => {
            curNode.getComponent(cc.Toggle).interactable = gumai;
        });
        if (gumai == false) {
            this.gameRule.gumaifen = 0;
            this.setToggle(this.node_gumai.getChildByName("gumai"));
        } else {
            let index = gumaiVal.indexOf(this.gameRule.gumaifen);
            this.setToggle(this.node_gumai.getChildByName("tog_" + index));
        }
    },

    init() {
        this.gameRule.canEnter = false;
        if (this.gameRule.bureau == 9999) {
            this.gameRule.canEnter = false;
        } else {
            this.setToggle(this.node_jushu.getChildByName("tog_" + this.gameRule.bureau));
        }

        if (!this.gameRule.yikouer && !this.gameRule.yikouer) {
            this.gameRule.yikouer = true
        }

        if (this.gameRule.yikouer) {
            this.setToggle(this.node_lianzhuang.getChildByName("tog_0"));
        } else if (this.gameRule.lianzhuang) {
            this.setToggle(this.node_lianzhuang.getChildByName("tog_1"));
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        this.showGuMai(this.gameRule.gumai);
        this.setToggle(this.node_jipai.getChildByName("tog_" + this.gameRule.jipai));
        this.setToggle(this.node_fengding.getChildByName("tog_" + this.gameRule.fengDing));
        this.setToggle(this.node_renshu.getChildByName("tog_" + this.gameRule.maxPlayerCount));
        this.setToggle(this.node_isgumai.getChildByName(`tog_${this.gameRule.gumai ? 0 : 1}`));

        this.node_gaoji.getChildByName("yuyin").active = false;
        this.setToggle(this.node_gaoji.getChildByName("yuyin"), this.gameRule.yuyin);
        this.setToggle(this.node_gaoji.getChildByName("tongji"), this.gameRule.tongji);
        this.setToggle(this.node_gaoji.getChildByName("fangzuobi"), this.gameRule.fangzuobi);
        this.setToggle(this.node_gaoji.getChildByName("gps"), this.gameRule.showGps);

        this.setToggle(this.node_wanfa.getChildByName("dilong"), this.gameRule.dilong);
        this.setToggle(this.node_wanfa.getChildByName("benji"), this.gameRule.benji);
        this.setToggle(this.node_wanfa.getChildByName("wuguji"), this.gameRule.wuguji);
        this.setToggle(this.node_wanfa.getChildByName("xingqiji"), this.gameRule.xingqiji);
        this.setToggle(this.node_wanfa.getChildByName("chuifengji"), this.gameRule.chuifengji);
        this.setToggle(this.node_wanfa.getChildByName("baojiaokemen"), this.gameRule.baojiaokemen);
        this.setToggle(this.node_wanfa.getChildByName("dayizhangkebaoting"), this.gameRule.dayizhangkebaoting);
        this.setToggle(this.node_wanfa.getChildByName("lianzhuangbulianju"), this.gameRule.lianzhuangbulianju);

        this.setToggle(this.node_wanfa.getChildByName("queyimen"), this.gameRule.queYiMen);
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
        } else if (param.indexOf('member') != -1) {
            this.gameRule.maxPlayerCount = parseInt(param.slice(6));
            this.gameRule.minPlayerCount = parseInt(param.slice(6));
            this.updateCost();
        }
        if (param.indexOf('fengding') != -1) {
            this.gameRule.fengDing = parseInt(param.slice(8));
        } else if (param == "isgumai0") {
            this.showGuMai(true)
        } else if (param == "isgumai1") {
            this.showGuMai(false)
        } else if (param.indexOf('gumai') != -1) {
            let index = parseInt(param.slice(5));
            this.gameRule.gumaifen = gumaiVal[index];
        } else if (param == "lianzhuang0") {
            this.gameRule.yikouer = true;
            this.gameRule.lianzhuang = false;
        } else if (param == "lianzhuang1") {
            this.gameRule.yikouer = false;
            this.gameRule.lianzhuang = true;
        } else if (param.indexOf('jipai') != -1) {
            this.gameRule.jipai = parseInt(param.slice(5));;
            // console.log(" this.gameRule.jipai", this.gameRule.jipai)
        } else if (param == "benji") {
            this.gameRule.benji = event.isChecked;
        } else if (param == "wuguji") {
            this.gameRule.wuguji = event.isChecked;
        } else if (param == "xingqiji") {
            this.gameRule.xingqiji = event.isChecked;
        } else if (param == "chuifengji") {
            this.gameRule.chuifengji = event.isChecked;
        } else if (param == "baojiaokemen") {
            this.gameRule.baojiaokemen = event.isChecked;
        } else if (param == "dayizhangkebaoting") {
            this.gameRule.dayizhangkebaoting = event.isChecked;
        } else if (param == "dilong") {
            this.gameRule.dilong = event.isChecked;
        } else if (param == "queyimen") {
            this.gameRule.queYiMen = event.isChecked;
        } else if (param == "lianzhuangbulianju") {
            this.gameRule.lianzhuangbulianju = event.isChecked;
        } else if (param == 'yuyin') {
            this.gameRule.yuyin = event.isChecked;
        } else if (param == "fangzuobi") {
            this.gameRule.fangzuobi = event.isChecked;
        } else if (param == "difen") {
            this.onCheckRuleEditScore(this.difenEdit, 0.3, 100, "baseScore")
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param.indexOf('tuoguan') != -1) { //托管
            let tuoguan = parseInt(param.slice(7));
            this.gameRule.canTrust = !!tuoguan;
            this.gameRule.trustTm = tuoguan
            // console.log("托管==", tuoguan)
        } else if (param == "tongji") { //输赢统计显示
            this.gameRule.tongji = event.isChecked
        } else if (param == "location") { //防作弊 服务器判断
            this.gameRule.showGps = event.isChecked
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
    },

    setLabel(curNode, str) {
        if (!!curNode && !!curNode.getComponent(cc.Label)) {
            curNode.getComponent(cc.Label).string = str;
        }
    }
});