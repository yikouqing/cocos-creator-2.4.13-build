const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const Utils = require("../../utils/Utils");

cc.Class({
    extends: cc.Component,

    properties: {
        fangfeiPannel: cc.Node,
        hostPayTog: cc.Toggle,
        aaPayTog: cc.Toggle,
        winPayTog: cc.Toggle,
        lianzhuang: cc.Node,
        yinghu: cc.Node,
        node_jushu: cc.Node,
        node_renshu: cc.Node,
        node_wanfa: cc.Node,
        node_jipai: cc.Node,
        node_jipaiwanfa: cc.Node,
        node_lianzhuang: cc.Node,
        node_yinghu: cc.Node,
        node_guize: cc.Node,
        node_gaoji: cc.Node,
        difenEdit: cc.EditBox,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            gameType: Enums.bundleType.GYZJ,
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
            addLaiZi: 1, //0癞子玩法 1经典玩法
            fengDing: 0, //封顶分数 0 不封顶
            jipai: 0, //0满堂鸡 1上下鸡
            manTangji: false, // true满堂鸡 false上下鸡
            gumai: false, //估卖
            gumaifen: 0, //估卖分 0为自由分
            wuguji: false, //乌骨鸡
            benji: false, //本鸡
            jinji: false, //金鸡
            yinji: false, //银鸡
            xingqiji: false, //星期鸡
            chuifengji: false, //吹风鸡

            yuanbao: false, //原报
            yinghu: 0, //硬胡0、5、10
            dilong: false, //地龙
            qingdilong: false, //清地龙
            baojiaokemen: false, //报叫可闷
            lianzhuangbulianju: false, //连庄不连局
            dayizhangkebaoting: false, //打一张可报听

            //连庄
            yikouer: false, //一扣二
            lianzhuang: false, //连庄
            tongsan: false, //通三
            queYiMen: false,
        };

        this.updateCost();
    },

    start() {
        this.fangfeiPannel.active = !(!!this.node.nodeParams && !!this.node.nodeParams.isUnion);
        this.gameRule = !!this.node.nodeParams && !!this.node.nodeParams.gameRule ? this.node.nodeParams.gameRule : this.gameRule;
        this.init();
    },

    showWanFa(isType) {
        // console.log("isType", isType)
        if (isType == 1) { //1经典玩法
            this.gameRule.yinghu = 0;
            this.gameRule.yikouer = false;
            this.gameRule.tongsan = false;
            this.gameRule.lianzhuang = false;
        } else { //0癞子玩法
            this.gameRule.gumai = false;
            this.gameRule.dilong = false;
            this.gameRule.qingdilong = false;
            if (!this.gameRule.yikouer && !this.gameRule.lianzhuang && !this.gameRule.tongsan) {
                this.gameRule.yikouer = true;
            }
            if (this.gameRule.yikouer) {
                this.setToggle(this.node_lianzhuang.getChildByName("tog_0"));
            } else if (this.gameRule.lianzhuang) {
                this.setToggle(this.node_lianzhuang.getChildByName("tog_1"));
            } else if (this.gameRule.tongsan) {
                this.setToggle(this.node_lianzhuang.getChildByName("tog_2"));
            }
        }

        this.gameRule.addLaiZi = isType;
        this.yinghu.active = isType == 0;
        this.lianzhuang.active = isType == 1;
        this.gameRule.maxPlayerCount = this.gameRule.maxPlayerCount || 4;
        this.setToggle(this.node_yinghu.getChildByName("tog_" + this.gameRule.yinghu));
        this.setToggle(this.node_renshu.getChildByName("tog_" + this.gameRule.maxPlayerCount));
        this.node_jipaiwanfa.getChildByName("benji").active = isType == 1;
        this.node_jipaiwanfa.getChildByName("yinji").active = isType == 1;
        this.node_jipaiwanfa.getChildByName("xingqiji").active = isType == 1;
        this.node_jipaiwanfa.getChildByName("chuifengji").active = isType == 1;

        this.gameRule.benji = isType == 1 ? this.gameRule.benji : false;
        this.gameRule.yinji = isType == 1 ? this.gameRule.yinji : false;
        this.gameRule.xingqiji = isType == 1 ? this.gameRule.xingqiji : false;
        this.gameRule.chuifengji = isType == 1 ? this.gameRule.chuifengji : false;
        this.setToggle(this.node_jipaiwanfa.getChildByName("benji"), this.gameRule.benji);
        this.setToggle(this.node_jipaiwanfa.getChildByName("yinji"), this.gameRule.yinji);
        this.setToggle(this.node_jipaiwanfa.getChildByName("wuguji"), this.gameRule.wuguji);
        this.setToggle(this.node_jipaiwanfa.getChildByName("xingqiji"), this.gameRule.xingqiji);
        this.setToggle(this.node_jipaiwanfa.getChildByName("queyimen"), this.gameRule.queYiMen);
        this.setToggle(this.node_jipaiwanfa.getChildByName("chuifengji"), this.gameRule.chuifengji);

        this.node_jipaiwanfa.getChildByName("yuanbao").active = isType == 0;
        this.node_jipaiwanfa.getChildByName("lianzhuang").active = isType == 0;
        this.gameRule.yuanbao = isType == 0 ? this.gameRule.yuanbao : false;
        this.gameRule.lianzhuang = isType == 0 ? this.gameRule.lianzhuang : false;
        this.setToggle(this.node_jipaiwanfa.getChildByName("yuanbao"), this.gameRule.yuanbao);
        this.setToggle(this.node_jipaiwanfa.getChildByName("lianzhuang"), this.gameRule.lianzhuang);

        this.node_guize.parent.active = isType == 1;
        this.setToggle(this.node_guize.getChildByName("gumai"), this.gameRule.gumai);
        this.setToggle(this.node_guize.getChildByName("dilong"), this.gameRule.dilong);
        this.showqingdilong();
    },

    showqingdilong() {
        let qingdilong = this.node_guize.getChildByName("qingdilong");
        qingdilong.getComponent(cc.Toggle).interactable = !!this.gameRule.dilong;
        this.gameRule.qingdilong = this.gameRule.dilong ? this.gameRule.qingdilong : false;
        this.setToggle(this.node_guize.getChildByName("qingdilong"), this.gameRule.qingdilong);
    },

    init() {
        this.gameRule.canEnter = false;
        if (this.gameRule.bureau == 9999) {
            this.gameRule.canEnter = false;
        } else {
            this.setToggle(this.node_jushu.getChildByName("tog_" + this.gameRule.bureau));
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        this.showWanFa(this.gameRule.addLaiZi);
        this.setToggle(this.node_wanfa.getChildByName("tog_" + this.gameRule.addLaiZi));
        this.setToggle(this.node_jipai.getChildByName("tog_" + (this.gameRule.manTangji ? 0 : 1)));

        this.node_gaoji.getChildByName("yuyin").active = false;
        this.setToggle(this.node_gaoji.getChildByName("yuyin"), this.gameRule.yuyin);
        this.setToggle(this.node_gaoji.getChildByName("tongji"), this.gameRule.tongji);
        this.setToggle(this.node_gaoji.getChildByName("fangzuobi"), this.gameRule.fangzuobi);
        this.setToggle(this.node_gaoji.getChildByName("gps"), this.gameRule.showGps);
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
        } else if (param.indexOf('addLaiZi') != -1) {
            this.showWanFa(parseInt(param.slice(8)))
        } else if (param.indexOf('jipai') != -1) {
            let jipai = parseInt(param.slice(5));;
            this.gameRule.jipai = jipai;
            this.gameRule.manTangji = jipai == 0 ? true : false;
        } else if (param.indexOf('yinghu') != -1) {
            this.gameRule.yinghu = parseInt(param.slice(6));;
        } else if (param == "lianzhuang0") {
            this.gameRule.yikouer = true;
            this.gameRule.lianzhuang = false;
            this.gameRule.tongsan = false;
        } else if (param == "lianzhuang1") {
            this.gameRule.yikouer = false;
            this.gameRule.lianzhuang = true;
            this.gameRule.tongsan = false;
        } else if (param == "lianzhuang2") {
            this.gameRule.tongsan = true;
            this.gameRule.yikouer = false;
            this.gameRule.lianzhuang = false;
        } else if (param == "yuanbao") {
            this.gameRule.yuanbao = event.isChecked;
        } else if (param == "lianzhuang") {
            this.gameRule.lianzhuang = event.isChecked;
        } else if (param == "gumai") {
            this.gameRule.gumai = event.isChecked;
        } else if (param == "yinji") {
            this.gameRule.yinji = event.isChecked;
        } else if (param == "benji") {
            this.gameRule.benji = event.isChecked;
        } else if (param == "wuguji") {
            this.gameRule.wuguji = event.isChecked;
        } else if (param == "xingqiji") {
            this.gameRule.xingqiji = event.isChecked;
        } else if (param == "chuifengji") {
            this.gameRule.chuifengji = event.isChecked;
        } else if (param == "dilong") {
            this.gameRule.dilong = event.isChecked;
            this.showqingdilong();
        } else if (param == "qingdilong") {
            this.gameRule.qingdilong = event.isChecked;
        } else if (param == "queyimen") {
            this.gameRule.queYiMen = event.isChecked;
        } else if (param == 'yuyin') {
            this.gameRule.yuyin = event.isChecked;
        } else if (param == "tongji") { //输赢统计显示
            this.gameRule.tongji = event.isChecked
        } else if (param == "fangzuobi") { //防作弊 服务器判断
            this.gameRule.fangzuobi = event.isChecked;
        } else if (param == "gps") {
            this.gameRule.showGps = event.isChecked;
        } else if (param == "difen") {
            this.onCheckRuleEditScore(this.difenEdit, 0.3, 100, "baseScore")
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param.indexOf('tuoguan') != -1) { //托管
            let tuoguan = parseInt(param.slice(7));
            this.gameRule.canTrust = !!tuoguan;
            this.gameRule.trustTm = tuoguan;
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
        return this.gameRule;
    },

    setToggle(curNode, isChecked = true) {
        if (!!curNode && !!curNode.getComponent(cc.Toggle)) {
            curNode.getComponent(cc.Toggle).isChecked = !!isChecked;
        }
    }
});