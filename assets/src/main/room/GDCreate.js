const Enums = require('../../const/Enums');
const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');
const CCUtil = require('../../utils/CCUtil');
const Utils = require("../../utils/Utils");

cc.Class({
    extends: cc.Component,

    properties: {
        fangfeiPannel: cc.Node,
        hostPayTog: cc.Toggle,
        aaPayTog: cc.Toggle,
        winPayTog: cc.Toggle,
        // 局数
        guoTog6: cc.Toggle,
        guoTog10: cc.Toggle,
        guoTog14: cc.Toggle,
        jushuTog1: cc.Toggle,
        jushuTog4: cc.Toggle,
        jushuTog8: cc.Toggle,
        jushuTog12: cc.Toggle,
        // 人数
        renshuTog2: cc.Toggle,
        renshuTog4: cc.Toggle,
        // 底分
        difenEdit: cc.EditBox,
        // 牌数
        paizhangPannel: cc.Node,
        paizhangTog27: cc.Toggle,
        paizhangTog10: cc.Toggle,
        paizhangTog7: cc.Toggle,
        // 倍数
        beishuTog1: cc.Toggle,
        beishuTog3: cc.Toggle,
        beishuTog5: cc.Toggle,
        // 分档
        fendangTog0: cc.Toggle,
        fendangTog1: cc.Toggle,
        // 玩法
        jingdianTog: cc.Toggle,
        tuantuanzhuanTog: cc.Toggle,
        guandan2Tog: cc.Toggle,

        liuzhafanbeiTog: cc.Toggle,
        shuangxiafen4Tog: cc.Toggle,
        zhida2Tog: cc.Toggle,
        jinGangTog: cc.Toggle,
        tog_jipaiqi: cc.Toggle,

        tupguanTog0: cc.Toggle,
        tupguanTog30: cc.Toggle,
        tupguanTog60: cc.Toggle,
        tupguanTog120: cc.Toggle,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 1, //局数
            guo: 0, //过
            maxPlayerCount: 2,
            minPlayerCount: 2,
            gameType: Enums.bundleType.GD,
            canTrust: false,
            trustTm: 0,
            canEnter: false,
            yuyin: false,
            gameFrameType: 2, //玩法（0 经典、1 团团转、2 2人掼蛋）
            baseScore: 1,
            fangzuobi: false,
            rate: 1, //倍数
            fenDangType: [10, 20, 30], //分档
            fenDangIndex: 1,
            showCards: 27,
            isShuangXiaFour: false,
            isLiuZhaDouble: true,
            isOnlyTwo: false,
            isUnReadyKick: false,
            jinGang: false,
            /**输赢统计 */
            tongji: false,
            showGps: false,
            distanceLimit: 100,
            isCardRecorder: false, //记牌器
        };
        this.updateCost();
    },

    start() {
        // console.log('房费状态', !!this.node.nodeParams && !!this.node.nodeParams.isUnion)
        this.fangfeiPannel.active = !(!!this.node.nodeParams && !!this.node.nodeParams.isUnion);
        this.gameRule = !!this.node.nodeParams && !!this.node.nodeParams.gameRule ? this.node.nodeParams.gameRule : this.gameRule;
        this.init();

    },

    modeSync() {
        // this.gameRule.gameFrameType = 2;
        // 局数
        if (this.gameRule.gameFrameType != 0) {
            this.gameRule.guo = 0;
            this.guoTog6.isChecked = false;
            this.guoTog6.interactable = false;
            this.guoTog10.isChecked = false;
            this.guoTog10.interactable = false;
            this.guoTog14.isChecked = false;
            this.guoTog14.interactable = false;
            if (this.gameRule.bureau == 4) {
                this.jushuTog4.isChecked = true;
            } else if (this.gameRule.bureau == 8) {
                this.jushuTog8.isChecked = true;
            } else if (this.gameRule.bureau == 12) {
                this.jushuTog12.isChecked = true;
            } else {
                this.gameRule.bureau = 1;
                this.jushuTog1.isChecked = true;
            }
        } else {
            this.guoTog6.interactable = true;
            this.guoTog10.interactable = true;
            this.guoTog14.interactable = true;
            if (this.gameRule.bureau == 4) {
                this.jushuTog4.isChecked = true;
            } else if (this.gameRule.bureau == 8) {
                this.jushuTog8.isChecked = true;
            } else if (this.gameRule.bureau == 12) {
                this.jushuTog12.isChecked = true;
            } else if (this.gameRule.guo == 14) {
                this.gameRule.bureau = 999;
                this.guoTog14.isChecked = true;
            } else if (this.gameRule.guo == 10) {
                this.gameRule.bureau = 999;
                this.guoTog10.isChecked = true;
            } else if (this.gameRule.guo == 6) {
                this.gameRule.bureau = 999;
                this.guoTog6.isChecked = true;
            } else {
                this.gameRule.bureau = 1;
                this.jushuTog1.isChecked = true;
            }
        }
        if (this.gameRule.gameFrameType == 2) {
            // 2人掼蛋 2人打  局数不能选择过局 不能选择双下4分打法
            this.guandan2Tog.isChecked = true;
            this.zhida2Tog.interactable = true;
            this.shuangxiafen4Tog.isChecked = false;
            this.shuangxiafen4Tog.interactable = false;
            this.gameRule.isShuangXiaFour = false;
        } else if (this.gameRule.gameFrameType == 1) {
            this.tuantuanzhuanTog.isChecked = true;
            this.zhida2Tog.interactable = true;
            this.zhida2Tog.isChecked = false;
            this.shuangxiafen4Tog.interactable = true;
        } else {
            this.jingdianTog.isChecked = true;
            this.shuangxiafen4Tog.interactable = true;
            this.zhida2Tog.interactable = true;
            this.zhida2Tog.isChecked = false;
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        CCUtil.setGrayShader(this.shuangxiafen4Tog.node, !this.shuangxiafen4Tog.interactable);
        CCUtil.setGrayShader(this.zhida2Tog.node, !this.zhida2Tog.interactable);
        CCUtil.setGrayShader(this.guoTog6.node, !this.guoTog6.interactable);
        CCUtil.setGrayShader(this.guoTog14.node, !this.guoTog14.interactable);
    },

    init() {
        this.gameRule.canEnter = false;
        // 局数
        this.modeSync();
        //牌张
        if (this.gameRule.showCards == 10) {
            this.paizhangTog10.isChecked = true;
        } else if (this.gameRule.showCards == 7) {
            this.paizhangTog7.isChecked = true;
        } else {
            this.paizhangTog27.isChecked = true;
        }
        // 倍数
        if (this.gameRule.rate == 5) {
            this.beishuTog5.isChecked = true;
        } else if (this.gameRule.rate == 3) {
            this.beishuTog3.isChecked = true;
        } else {
            this.beishuTog1.isChecked = true;
        }

        // 分档
        if (this.gameRule.fenDangIndex == 1) {
            this.gameRule.fenDangType = [20, 40, 60];
            this.fendangTog1.isChecked = true;
        } else {
            this.gameRule.fenDangType = [10, 20, 30];
            this.fendangTog0.isChecked = true;
        }

        /*玩法 */
        this.liuzhafanbeiTog.isChecked = !!this.gameRule.isLiuZhaDouble;
        this.shuangxiafen4Tog.isChecked = !!this.gameRule.isShuangXiaFour;
        this.zhida2Tog.isChecked = !!this.gameRule.isOnlyTwo;
        this.jinGangTog.isChecked = !!this.gameRule.jinGang;

        this.tog_jipaiqi.isChecked = !!this.gameRule.isCardRecorder;

        /* 托管 */
        if (this.gameRule.canTrust) {
            if (this.gameRule.trustTm == 30) {
                this.tupguanTog30.isChecked = true;
            } else if (this.gameRule.trustTm == 60) {
                this.tupguanTog60.isChecked = true;
            } else if (this.gameRule.trustTm == 120) {
                this.tupguanTog120.isChecked = true;
            }
        } else {
            this.tupguanTog0.isChecked = true;
        }
        /**输赢统计 */
        /**防作弊 */
    },

    updateCost() {
        this.gameRule.canEnter = false;
        let diamondCount = 1;
        if (this.gameRule.gameFrameType != 0) {
            let bureau = this.gameRule.bureau;
            if (bureau == 4) {
                diamondCount = 1;
            } else if (bureau == 8) {
                diamondCount = 2;
            } else if (bureau == 12) {
                diamondCount = 3;
            } else {
                diamondCount = 2;
            }
        } else {
            let guo = this.gameRule.guo;
            if (guo == 10) {
                diamondCount = 20;
            } else if (guo == 14) {
                diamondCount = 30;
            } else {
                diamondCount = 10;
            }
        }
        diamondCount = 1;
        this.gameRule.payDiamond = diamondCount;
    },

    onButtonClick(event, param) {
        if (param.indexOf('bureau') != -1) {
            this.gameRule.bureau = parseInt(param.split('_')[1]);
            this.gameRule.guo = 0;
            this.updateCost();
        } else if (param.indexOf('guo') != -1) {
            this.gameRule.guo = parseInt(param.split('_')[1]);
            this.gameRule.bureau = 999;
            this.updateCost();
        } else if (param.indexOf('pai') != -1) {
            this.gameRule.showCards = parseInt(param.split('_')[1]);
        } else if (param.indexOf('member') != -1) {
            this.gameRule.maxPlayerCount = parseInt(param.slice(6));
            this.gameRule.minPlayerCount = parseInt(param.slice(6));
            this.updateCost();
        } else if (param.indexOf('beishu') != -1) {
            this.gameRule.rate = parseInt(param.slice(6));
        } else if (param.indexOf('wanfa') != -1) {
            this.gameRule.gameFrameType = parseInt(param.slice(5));
            if (this.gameRule.gameFrameType != 0) {
                this.gameRule.guo = 0; //非经典模式不能选过
                if (this.gameRule.bureau == 999) {
                    this.gameRule.bureau = 1;
                }
            }
            this.modeSync();
            if (this.gameRule.gameFrameType == 2) {
                // 2人掼蛋 2人打  局数不能选择过局 不能选择双下4分打法
                this.gameRule.maxPlayerCount = 2;
                this.gameRule.minPlayerCount = 2;
                // 玩法
                this.zhida2Tog.interactable = true;
                this.shuangxiafen4Tog.isChecked = false;
                this.shuangxiafen4Tog.interactable = false;
            } else if (this.gameRule.gameFrameType == 1) {
                this.gameRule.maxPlayerCount = 4;
                this.gameRule.minPlayerCount = 4;
                // 玩法
                this.zhida2Tog.interactable = true;
                this.zhida2Tog.isChecked = false;
                this.shuangxiafen4Tog.interactable = true;
            } else {
                this.gameRule.maxPlayerCount = 4;
                this.gameRule.minPlayerCount = 4;
                this.shuangxiafen4Tog.interactable = true
                this.zhida2Tog.interactable = true
                this.zhida2Tog.isChecked = false
            }
            CCUtil.setGrayShader(this.zhida2Tog.node, !this.zhida2Tog.interactable);
            CCUtil.setGrayShader(this.shuangxiafen4Tog.node, !this.shuangxiafen4Tog.interactable);
        } else if (param.indexOf('fendang') != -1) {
            this.gameRule.fenDangIndex = parseInt(param.slice(7));
        } else if (param.indexOf('teshu') != -1) {
            this.gameRule.teshuType = parseInt(param.slice(5));
        } else if (param == 'liuzhafanbei') {
            this.gameRule.isLiuZhaDouble = event.isChecked;
        } else if (param == 'shuangxiafen4') {
            this.gameRule.isShuangXiaFour = event.isChecked;
        } else if (param == 'isOnlyTwo') {
            this.gameRule.isOnlyTwo = event.isChecked;
        } else if (param == 'jinGang') {
            this.gameRule.jinGang = event.isChecked;
        } else if (param == 'isCardRecorder') {
            this.gameRule.isCardRecorder = event.isChecked;
        } else if (param == 'weizhunbei') {
            this.gameRule.isUnReadyKick = event.isChecked;
        } else if (param == 'yuyin') {
            this.gameRule.yuyin = event.isChecked;
        } else if (param == "fangzuobi") {
            this.gameRule.fangzuobi = event.isChecked;
        } else if (param == "difen") {
            this.onCheckRuleEditScore(this.difenEdit, 1, 100, "baseScore")
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param.indexOf('tuoguan') != -1) { //托管
            let tuoguan = parseInt(param.slice(7));
            // console.log("托管==", tuoguan)
            if (tuoguan == 0) {
                this.gameRule.trustTm = 0;
                this.gameRule.canTrust = false
            } else {
                this.gameRule.canTrust = true
                this.gameRule.trustTm = tuoguan
            }
        } else if (param == "tongji") { //输赢统计显示
            this.gameRule.tongji = event.isChecked
        } else if (param == "location") { //防作弊 服务器判断
            this.gameRule.showGps = event.isChecked
        } else if (param === 'distance') { }
        // console.log('创建规则_GAME_RULE', this.gameRule);
        ConfigModel.setRoomCreateCache(this.gameRule);
    },

    onCheckDistanceEdit(key, editBox, min, max) {
        let score = parseInt(editBox.string);
        if (isNaN(score) || score > max || score < min) {
            editBox.string = '1';
            this.gameRule[key] = `1`;
            AssetsManager.tipDialog(`输入错误,请输入${min}-${max}的整数`);
            return
        }
        editBox.string = `${score}`;
        this.gameRule[key] = score;
    },

    onCheckRuleEditScore(editBox, min, max, key) {
        let score = parseFloat(editBox.string)
        var r = /^([1-9][0-9]*|0)(\.[1-9]?)?$/ //一位小数
        if (!r.test(editBox.string) || score > max || score < min) {
            editBox.string = '0.5';
            AssetsManager.tipDialog(`输入错误,请输入${min}-${max}的数字(小数最多一位)！！`);
            return
        }
        this.gameRule[key] = score;
    },

    getRule() {
        return this.gameRule;
    }

});