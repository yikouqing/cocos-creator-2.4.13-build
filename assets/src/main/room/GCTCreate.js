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
        jushuTog1: cc.Toggle,
        jushuTog8: cc.Toggle,
        jushuTog16: cc.Toggle,
        renshuTog2: cc.Toggle,
        renshuTog3: cc.Toggle,
        renshuTog4: cc.Toggle,
        renshuTog5: cc.Toggle,
        shoujuTog1: cc.Toggle,
        shoujuTog2: cc.Toggle,
        ziranchunTog: cc.Toggle,
        yitiaolongTog: cc.Toggle,
        shuaiweiTog: cc.Toggle,
        tuoguanTog0: cc.Toggle,
        tuoguanTog30: cc.Toggle,
        tuoguanTog60: cc.Toggle,
        tuoguanTog90: cc.Toggle,
        difenEditBox: cc.EditBox,
        zhadanfenEditBox: cc.EditBox,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 1,
            minPlayerCount: 2,
            maxPlayerCount: 2,
            gameType: Enums.bundleType.GCT,
            fangzuobi: false,
            baiwei: true,
            baseScore: 0.1,
            ziRanChun: false,
            boomScore: 10,
            yiTiaoLong: false,
            shuaiWei: false,
            firstRoundOut: 0,
            canTrust: false,
            trustTm: 0,
            bichu: true,
            canEnter: false,
            /**输赢统计 */
            tongji: false,
            showGps: false,
        };
        this.updateCost();
    },

    start() {
        this.fangfeiPannel.active = !(!!this.node.nodeParams && !!this.node.nodeParams.isUnion);
        this.gameRule = !!this.node.nodeParams && !!this.node.nodeParams.gameRule ? this.node.nodeParams.gameRule : this.gameRule;
        this.init();
    },

    init() {
        /* 局数设置 */
        if (this.gameRule.bureau == 8) {
            this.jushuTog8.isChecked = true;
        } else if (this.gameRule.bureau == 16) {
            this.jushuTog16.isChecked = true;
        } else {
            this.jushuTog1.isChecked = true;
        }
        /* 人数 */
        if (this.gameRule.maxPlayerCount == 3) {
            this.renshuTog3.isChecked = true;
        } else if (this.gameRule.maxPlayerCount == 4) {
            this.renshuTog4.isChecked = true;
        } else if (this.gameRule.maxPlayerCount == 5) {
            this.renshuTog5.isChecked = true;
        } else {
            this.renshuTog2.isChecked = true;
        }
        /* 首局设置 */
        if (this.gameRule.firstRoundOut == 1) {
            this.shoujuTog2.isChecked = true;
        } else {
            this.shoujuTog1.isChecked = true;
        }
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        /* 玩法设置 */
        this.ziranchunTog.isChecked = this.gameRule.ziRanChun;
        this.yitiaolongTog.isChecked = this.gameRule.yiTiaoLong;
        this.shuaiweiTog.isChecked = this.gameRule.shuaiWei;
        /**输赢统计 */
        /**防作弊 */
        if (this.gameRule.canTrust != false) {
            if (this.gameRule.trustTm == 30) {
                this.tuoguanTog30.isChecked = true;
            } else if (this.gameRule.trustTm == 60) {
                this.tuoguanTog60.isChecked = true;
            } else if (this.gameRule.trustTm == 90) {
                this.tuoguanTog90.isChecked = true;
            }
        } else {
            this.tuoguanTog0.isChecked = true;
        }
    },

    updateCost() {
        let bureau = this.gameRule.bureau;
        let diamondCount = bureau == 1 ? 1 : bureau == 8 ? 2 : 3;
        this.gameRule.payDiamond = diamondCount;
        // this.diamondCount.string = diamondCount;
    },

    onButtonClick(event, param) {
        if (param.indexOf('jushu') != -1) {
            this.gameRule.bureau = parseInt(param.split('_')[1]);
            this.updateCost();
        } else if (param == 'qiangzhidingwei') {
            this.gameRule.fangzuobi = event.isChecked;
        } else if (param.indexOf('member') != -1) {
            this.gameRule.maxPlayerCount = parseInt(param.split('_')[1]);
            this.gameRule.minPlayerCount = parseInt(param.split('_')[1]);
            this.updateCost();
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param == 'difen') {
            if (this.difenEditBox.string == '') {
                this.difenEditBox.string = '';
                AssetsManager.tipDialog("请输入底分~");
                return
            }
            if (parseFloat(this.difenEditBox.string) < 0.1 ||
                parseFloat(this.difenEditBox.string) > 100) {
                this.difenEditBox.string = '';
                AssetsManager.tipDialog("底分输入错误，请输入0.1-100的数字！");
                return;
            }
            if (parseFloat(this.difenEditBox.string * 10) > parseInt(this.difenEditBox.string * 10)) {
                AssetsManager.tipDialog("底分输入错误，小数位数不能超过1！");
                this.difenEditBox.string = '';
                return;
            }
            this.gameRule.baseScore = this.difenEditBox.string;
        } else if (param == 'zhadanfen') {
            if (isNaN(parseInt(this.zhadanfenEditBox.string)) || this.zhadanfenEditBox.string == '') {
                this.zhadanfenEditBox.string = '';
                AssetsManager.tipDialog("请输入炸弹分~");
                return;
            }
            if (parseInt(this.zhadanfenEditBox.string) < 10 ||
                parseInt(this.zhadanfenEditBox.string) > 200) {
                this.zhadanfenEditBox.string = '';
                AssetsManager.tipDialog("炸弹分输入错误，请输入10-200的数字！");
                return;
            }
            this.gameRule.boomScore = `${parseInt(this.zhadanfenEditBox.string)}`;
        } else if (param == 'ziranchun') {
            this.gameRule.ziRanChun = event.isChecked;
        } else if (param == 'yitiaolong') {
            this.gameRule.yiTiaoLong = event.isChecked;
        } else if (param == 'shuaiwei') {
            this.gameRule.shuaiWei = event.isChecked;
        } else if (param == 'suiji') {
            this.gameRule.firstRoundOut = 0;
        } else if (param == 'shouwei') {
            this.gameRule.firstRoundOut = 1;
        } else if (param.indexOf('tuoguan') != -1) {
            let tuoguan = param.split('_');
            this.gameRule.canTrust = tuoguan[1] != 0;
            this.gameRule.trustTm = parseInt(tuoguan[1]);
        } else if (param == "tongji") { //输赢统计显示
            this.gameRule.tongji = event.isChecked
        } else if (param == "location") { //防作弊 服务器判断
            this.gameRule.showGps = event.isChecked
        }
        // console.log('创建表单-关春天', this.gameRule);
        ConfigModel.setRoomCreateCache(this.gameRule);
    },

    getRule() {
        return this.gameRule;
    }

});