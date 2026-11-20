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
        jushuTog8: cc.Toggle,
        jushuTog16: cc.Toggle,
        jushuTog32: cc.Toggle,
        renshuTog2: cc.Toggle,
        renshuTog3: cc.Toggle,
        renshuTog4: cc.Toggle,
        fangPannel: cc.Node,
        fangTog1: cc.Toggle,
        fangTog2: cc.Toggle,
        fangTog3: cc.Toggle,
        difenEdit: cc.EditBox,
        paizhangPannel: cc.Node,
        paizhangTog13: cc.Toggle,
        paizhangTog10: cc.Toggle,
        paizhangTog7: cc.Toggle,
        fengdingTog0: cc.Toggle,
        fengdingTog2: cc.Toggle,
        fengdingTog3: cc.Toggle,
        fengdingTog4: cc.Toggle,
        fengdingTog5: cc.Toggle,
        fengdingTog6: cc.Toggle,
        fengdingTog7: cc.Toggle,
        fengdingTog8: cc.Toggle,
        zimobujiaTog: cc.Toggle,
        zimojiadiTog: cc.Toggle,
        zimojiafanTog: cc.Toggle,
        dghDuorenTog: cc.Toggle,
        dghDanrenTog: cc.Toggle,
        dghDianpaoTog: cc.Toggle,
        huansanzhangTog: cc.Toggle,
        hujiaozhuanyiTog: cc.Toggle,
        caguaTog: cc.Toggle,
        jishiyuTog: cc.Toggle,
        menqingzhongzhangTog: cc.Toggle,
        yaojiujiangduiTog: cc.Toggle,
        tiandihuTog: cc.Toggle,
        lunzhuangTog: cc.Toggle,
        duiduihujiafanTog: cc.Toggle,
        liangfenqihuTog: cc.Toggle,
        jiaxinwuTog: cc.Toggle,
        xianshiliushuiTog: cc.Toggle,
        guozhuangguohuTog: cc.Toggle,
        laiziwanfaTog: cc.Toggle,
        wulaizijiafanTog: cc.Toggle,
        chahuazhuTog: cc.Toggle,
        chahuazhuxianzhiTog: cc.Toggle,
        guopengguoquanTog: cc.Toggle,
        yitiaolongTog: cc.Toggle,
        youhubihuTog: cc.Toggle,
        guoshoujiafanTog: cc.Toggle,
        hujuezhangjiafanTog: cc.Toggle,
        sijiaobusuanTog: cc.Toggle,
        kaertiaoTog: cc.Toggle,
        tupguanTog0: cc.Toggle,
        tupguanTog30: cc.Toggle,
        tupguanTog60: cc.Toggle,
        tupguanTog90: cc.Toggle,
    },

    onLoad() {
        this.gameRule = {
            payType: Enums.roomPayType.WOZHIFU,
            bureau: 8,
            minPlayerCount: 4,
            maxPlayerCount: 4,
            gameType: Enums.bundleType.XZMJ,
            canTrust: false,
            trustTm: 0,
            canEnter: false,
            yuyin: false,
            wanfa: 3,
            baseScore: 0.5,
            fangzuobi: false,
            roomType: 3,
            maxRate: 0, //最大番数 0-不封顶
            ziMoRateType: 0, //自摸加的类型
            cardCount: 13, //牌数
            dianGangHua: 0, //点杠花 0-多人 1-单人 2-点炮
            huanSanZhang: false,
            huJiaoZhuanYi: false,
            caGua: false,
            jiShiYu: false,
            menQingZhongZhang: false,
            yaoJiuJiangDui: false,
            tianDiHu: false,
            lunZhuang: false,
            duiDuiDouble: false,
            erFenQiHu: false,
            jiaXinWu: false,
            showLiuShui: false,
            guoZhuangGuoHu: false,
            addLaiZi: false,
            laiZiDouble: false,
            chaHuaZhu: false,
            chaHuaZhuLimit: false,
            guoPengGuoQuan: false,
            yiTiaoLong: false,
            jueZhangDouble: false,
            siJiaoPei: false,
            guoShouJiaFanHu: false,
            youHuBiHu: false,
            kaErTiao: false,
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
        this.gameRule.canEnter = false;
        if (this.gameRule.bureau == 16) {
            this.jushuTog16.isChecked = true;
        } else if (this.gameRule.bureau == 32) {
            this.jushuTog32.isChecked = true;
        } else if (this.gameRule.bureau == 9999) {
            this.gameRule.canEnter = false;
        } else {
            this.jushuTog8.isChecked = true;
        }
        if (this.gameRule.maxPlayerCount == 3) {
            this.guoshoujiafanTog.interactable = true;
            this.renshuTog3.isChecked = true;
            this.fangTog1.node.active = false;
            this.fangPannel.active = true;
            this.paizhangPannel.active = true;
        } else if (this.gameRule.maxPlayerCount == 4) {
            this.guoshoujiafanTog.interactable = true;
            this.renshuTog4.isChecked = true;
            this.fangTog1.node.active = false;
            this.fangPannel.active = true;
            this.paizhangPannel.active = this.gameRule.roomType == 2;
        } else {
            this.guoshoujiafanTog.interactable = false;
            this.renshuTog2.isChecked = true;
            this.fangTog1.node.active = true;
            this.fangPannel.active = true;
            this.paizhangPannel.active = this.gameRule.roomType == 1;
        }
        CCUtil.setGrayShader(this.guoshoujiafanTog.node, !this.guoshoujiafanTog.interactable);
        /**支付 */
        this.hostPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.WOZHIFU;
        this.aaPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.AAZHIFU;
        this.winPayTog.isChecked = this.gameRule.payType == Enums.roomPayType.YINGJIAZHIFU;
        //房数
        if (this.gameRule.roomType == 2) {
            this.fangTog2.isChecked = true;
        } else if (this.gameRule.roomType == 3) {
            this.fangTog3.isChecked = true;
        } else {
            this.fangTog1.isChecked = true;
        }

        //牌张
        if (this.gameRule.cardCount == 10) {
            this.paizhangTog10.isChecked = true;
        } else if (this.gameRule.cardCount == 7) {
            this.paizhangTog7.isChecked = true;
        } else {
            this.paizhangTog13.isChecked = true;
        }

        this.laiziwanfaTog.interactable = this.gameRule.cardCount != 7;
        CCUtil.setGrayShader(this.laiziwanfaTog.node, !this.laiziwanfaTog.interactable);
        this.huansanzhangTog.interactable = this.gameRule.cardCount != 7;
        CCUtil.setGrayShader(this.huansanzhangTog.node, !this.huansanzhangTog.interactable);
        //自摸
        if (this.gameRule.ziMoRateType == 1) {
            this.zimojiadiTog.isChecked = true;
        } else if (this.gameRule.ziMoRateType == 2) {
            this.zimojiafanTog.isChecked = true;
        } else {
            this.zimobujiaTog.isChecked = true;
        }
        //点杠花
        if (this.gameRule.dianGangHua == 1) {
            this.dghDanrenTog.isChecked = true;
        } else if (this.gameRule.dianGangHua == 2) {
            this.dghDianpaoTog.isChecked = true;
        } else {
            this.dghDuorenTog.isChecked = true;
        }
        //封顶
        if (this.gameRule.maxRate == 2) {
            this.fengdingTog2.isChecked = true;
        } else if (this.gameRule.maxRate == 3) {
            this.fengdingTog3.isChecked = true;
        } else if (this.gameRule.maxRate == 4) {
            this.fengdingTog4.isChecked = true;
        } else if (this.gameRule.maxRate == 5) {
            this.fengdingTog5.isChecked = true;
        } else if (this.gameRule.maxRate == 6) {
            this.fengdingTog6.isChecked = true;
        } else if (this.gameRule.maxRate == 7) {
            this.fengdingTog7.isChecked = true;
        } else if (this.gameRule.maxRate == 8) {
            this.fengdingTog8.isChecked = true;
        } else {
            this.fengdingTog0.isChecked = true;
        }

        /*玩法 */
        this.huansanzhangTog.isChecked = !!this.gameRule.huanSanZhang;
        this.hujiaozhuanyiTog.isChecked = !!this.gameRule.huJiaoZhuanYi;
        this.caguaTog.isChecked = !!this.gameRule.caGua;
        this.jishiyuTog.isChecked = !!this.gameRule.jiShiYu;
        this.menqingzhongzhangTog.isChecked = !!this.gameRule.menQingZhongZhang;
        this.yaojiujiangduiTog.isChecked = !!this.gameRule.yaoJiuJiangDui;
        this.tiandihuTog.isChecked = !!this.gameRule.tianDiHu;
        this.lunzhuangTog.isChecked = !!this.gameRule.lunZhuang;
        this.duiduihujiafanTog.isChecked = !!this.gameRule.duiDuiDouble;
        this.liangfenqihuTog.isChecked = !!this.gameRule.erFenQiHu;
        this.jiaxinwuTog.isChecked = !!this.gameRule.jiaXinWu;
        this.xianshiliushuiTog.isChecked = !!this.gameRule.showLiuShui;
        this.guozhuangguohuTog.isChecked = !!this.gameRule.guoZhuangGuoHu;
        this.laiziwanfaTog.isChecked = !!this.gameRule.addLaiZi;
        this.wulaizijiafanTog.isChecked = !!this.gameRule.laiZiDouble;
        this.chahuazhuTog.isChecked = !!this.gameRule.chaHuaZhu;
        this.chahuazhuxianzhiTog.interactable = !!this.gameRule.chaHuaZhu;
        CCUtil.setGrayShader(this.chahuazhuxianzhiTog.node, !this.chahuazhuxianzhiTog.interactable);
        this.chahuazhuxianzhiTog.isChecked = !!this.gameRule.chaHuaZhuLimit;
        this.guopengguoquanTog.isChecked = !!this.gameRule.guoPengGuoQuan;
        this.yitiaolongTog.isChecked = !!this.gameRule.yiTiaoLong;
        this.youhubihuTog.isChecked = !!this.gameRule.youHuBiHu;
        this.guoshoujiafanTog.isChecked = !!this.gameRule.guoShouJiaFanHu;
        this.hujuezhangjiafanTog.isChecked = !!this.gameRule.jueZhangDouble;
        this.sijiaobusuanTog.isChecked = !!this.gameRule.siJiaoPei;
        this.kaertiaoTog.isChecked = !!this.gameRule.kaErTiao;

        /* 托管 */
        if (this.gameRule.canTrust) {
            if (this.gameRule.trustTm == 30) {
                this.tupguanTog30.isChecked = true;
            } else if (this.gameRule.trustTm == 60) {
                this.tupguanTog60.isChecked = true;
            } else if (this.gameRule.trustTm == 90) {
                this.tupguanTog90.isChecked = true;
            }
        } else {
            this.tupguanTog0.isChecked = true;
        }

        /**输赢统计 */
        /**防作弊 */
    },

    updateCost() {
        let bureau = this.gameRule.bureau;
        this.gameRule.canEnter = false;
        let diamondCount = 1;
        if (bureau === 9999) {
            diamondCount = 1;
            this.gameRule.canEnter = false;
        } else if (bureau == 8) {
            diamondCount = 2;
        } else if (bureau == 16) {
            diamondCount = 3;
        } else if (bureau == 32) {
            diamondCount = 4;
        }
        this.gameRule.payDiamond = diamondCount;
    },

    onButtonClick(event, param) {
        if (param.indexOf('bureau') != -1) {
            this.gameRule.bureau = parseInt(param.split('_')[1]);
            this.updateCost();
        } else if (param.indexOf('roomType') != -1) {
            this.gameRule.roomType = parseInt(param.split('_')[1]);
            if (this.gameRule.roomType == 1) {
                this.kaertiaoTog.isChecked = false;
                this.kaertiaoTog.interactable = false;
                this.gameRule.kaErTiao = false;
                this.hujiaozhuanyiTog.interactable = false;
                this.hujiaozhuanyiTog.isChecked = false;
                this.gameRule.huJiaoZhuanYi = false;
                this.paizhangPannel.active = true;
                this.paizhangTog10.node.active = false;
                if (!this.paizhangTog13.isChecked && !this.paizhangTog7.isChecked) {
                    this.paizhangTog13.isChecked = true;
                    this.gameRule.cardCount = 13;
                }
                this.chahuazhuTog.interactable = false;
                this.chahuazhuTog.isChecked = false;
                this.chahuazhuxianzhiTog.interactable = false;
                this.chahuazhuxianzhiTog.isChecked = false;
            } else if (this.gameRule.roomType == 3) {
                this.kaertiaoTog.isChecked = false;
                this.kaertiaoTog.interactable = false;
                this.gameRule.kaErTiao = false;
                this.paizhangTog10.node.active = true;
                if (this.gameRule.maxPlayerCount == 3) {
                    this.paizhangPannel.active = true;
                } else {
                    this.paizhangPannel.active = false;
                    this.gameRule.cardCount = 13;
                    this.paizhangTog13.isChecked = true;
                }
                if (this.gameRule.maxPlayerCount == 4) {
                    this.hujiaozhuanyiTog.interactable = true;
                    this.chahuazhuTog.interactable = true;
                } else {
                    this.chahuazhuTog.interactable = false;
                    this.chahuazhuTog.isChecked = false;
                    this.chahuazhuxianzhiTog.interactable = false;
                    this.chahuazhuxianzhiTog.isChecked = false;
                    this.hujiaozhuanyiTog.interactable = false;
                    this.hujiaozhuanyiTog.isChecked = false;
                    this.gameRule.huJiaoZhuanYi = false;
                }
            } else if (this.gameRule.roomType == 2) {
                this.hujiaozhuanyiTog.interactable = false;
                this.hujiaozhuanyiTog.isChecked = false;
                this.gameRule.huJiaoZhuanYi = false;
                this.paizhangTog10.node.active = true;
                if (this.gameRule.maxPlayerCount != 2) {
                    this.paizhangPannel.active = true;
                } else {
                    this.paizhangPannel.active = false;
                    this.gameRule.cardCount = 13;
                    this.paizhangTog13.isChecked = true;
                }
                if (this.gameRule.maxPlayerCount == 4) {
                    this.kaertiaoTog.interactable = true;
                } else {
                    this.kaertiaoTog.isChecked = false;
                    this.kaertiaoTog.interactable = false;
                    this.gameRule.kaErTiao = false;
                }
                this.chahuazhuTog.interactable = false;
                this.chahuazhuTog.isChecked = false;
                this.chahuazhuxianzhiTog.interactable = false;
                this.chahuazhuxianzhiTog.isChecked = false;
            }
            CCUtil.setGrayShader(this.kaertiaoTog.node, !this.kaertiaoTog.interactable);
            CCUtil.setGrayShader(this.hujiaozhuanyiTog.node, !this.hujiaozhuanyiTog.interactable);
            CCUtil.setGrayShader(this.chahuazhuTog.node, !this.chahuazhuTog.interactable);
            CCUtil.setGrayShader(this.chahuazhuxianzhiTog.node, !this.chahuazhuxianzhiTog.interactable);
        } else if (param.indexOf('pai') != -1) {
            this.gameRule.cardCount = parseInt(param.split('_')[1]);
            if (this.gameRule.cardCount == 7) {
                this.huansanzhangTog.isChecked = false;
                this.huansanzhangTog.interactable = false;
                this.gameRule.huanSanZhang = false;
                this.laiziwanfaTog.isChecked = false;
                this.laiziwanfaTog.interactable = false;
                this.gameRule.addLaiZi = false;
                this.gameRule.laiZiDouble = false;
            } else {
                this.huansanzhangTog.interactable = true;
                this.laiziwanfaTog.interactable = true;
            }
        } else if (param.indexOf('member') != -1) {
            this.gameRule.maxPlayerCount = parseInt(param.slice(6));
            this.gameRule.minPlayerCount = parseInt(param.slice(6));
            this.updateCost();
            if (this.gameRule.maxPlayerCount == 4) {
                this.guoshoujiafanTog.interactable = true;
                this.gameRule.guoShouJiaFanHu = false;
                this.fangTog1.node.active = false;
                if (this.gameRule.roomType == 1) {
                    this.gameRule.roomType = 3;
                    this.fangTog3.isChecked = true;
                }
                if (this.gameRule.roomType == 2) {
                    this.paizhangPannel.active = true;
                    this.paizhangTog10.node.active = true;
                } else if (this.gameRule.roomType == 3) {
                    this.paizhangPannel.active = false;
                }
                if (this.gameRule.roomType == 2) {
                    this.kaertiaoTog.interactable = true;
                } else {
                    this.kaertiaoTog.isChecked = false;
                    this.kaertiaoTog.interactable = false;
                    this.gameRule.kaErTiao = false;
                }
                if (this.gameRule.roomType == 3) {
                    this.hujiaozhuanyiTog.interactable = true;
                    this.chahuazhuTog.interactable = true;
                    this.gameRule.cardCount = 13;
                } else {
                    this.chahuazhuTog.interactable = false;
                    this.chahuazhuTog.isChecked = false;
                    this.chahuazhuxianzhiTog.interactable = false;
                    this.chahuazhuxianzhiTog.isChecked = false;
                    this.gameRule.chaHuaZhu = false;
                    this.gameRule.chaHuaZhuLimit = false;
                    this.hujiaozhuanyiTog.interactable = false;
                    this.hujiaozhuanyiTog.isChecked = false;
                    this.gameRule.huJiaoZhuanYi = false;
                }
                this.huansanzhangTog.interactable = true;
            } else if (this.gameRule.maxPlayerCount == 3) {
                this.chahuazhuTog.interactable = false;
                this.chahuazhuTog.isChecked = false;
                this.chahuazhuxianzhiTog.interactable = false;
                this.chahuazhuxianzhiTog.isChecked = false;
                this.guoshoujiafanTog.interactable = true;
                this.gameRule.guoShouJiaFanHu = false;
                this.hujiaozhuanyiTog.interactable = false;
                this.hujiaozhuanyiTog.isChecked = false;
                this.gameRule.huJiaoZhuanYi = false;
                this.kaertiaoTog.isChecked = false;
                this.kaertiaoTog.interactable = false;
                this.gameRule.kaErTiao = false;
                this.fangTog1.node.active = false;
                this.huansanzhangTog.interactable = true;
                if (this.gameRule.roomType == 1) {
                    this.gameRule.roomType = 3;
                    this.fangTog3.isChecked = true;
                }
                this.paizhangPannel.active = true;
                this.paizhangTog10.node.active = true;
            } else {
                this.chahuazhuTog.interactable = false;
                this.chahuazhuTog.isChecked = false;
                this.chahuazhuxianzhiTog.interactable = false;
                this.chahuazhuxianzhiTog.isChecked = false;
                this.guoshoujiafanTog.interactable = false;
                this.guoshoujiafanTog.isChecked = false;
                this.hujiaozhuanyiTog.interactable = false;
                this.hujiaozhuanyiTog.isChecked = false;
                this.gameRule.huJiaoZhuanYi = false;
                this.kaertiaoTog.isChecked = false;
                this.kaertiaoTog.interactable = false;
                this.gameRule.kaErTiao = false;
                this.fangTog1.node.active = true;
                this.paizhangTog10.node.active = true;
                if (this.gameRule.roomType == 2 || this.gameRule.roomType == 3) {
                    this.paizhangPannel.active = false;
                } else {
                    this.paizhangPannel.active = true;
                }
            }
            CCUtil.setGrayShader(this.guoshoujiafanTog.node, !this.guoshoujiafanTog.interactable);
            CCUtil.setGrayShader(this.kaertiaoTog.node, !this.kaertiaoTog.interactable);
            CCUtil.setGrayShader(this.hujiaozhuanyiTog.node, !this.hujiaozhuanyiTog.interactable);
            CCUtil.setGrayShader(this.chahuazhuTog.node, !this.chahuazhuTog.interactable);
            CCUtil.setGrayShader(this.chahuazhuxianzhiTog.node, !this.chahuazhuxianzhiTog.interactable);
            CCUtil.setGrayShader(this.huansanzhangTog.node, !this.huansanzhangTog.interactable);
        } else if (param.indexOf('zimo') != -1) {
            this.gameRule.ziMoRateType = parseInt(param.slice(4));
        } else if (param.indexOf('dianganghua') != -1) {
            this.gameRule.dianGangHua = parseInt(param.slice(11));
        } else if (param.indexOf('fengding') != -1) {
            this.gameRule.maxRate = parseInt(param.slice(8));
        } else if (param == 'huansanzhang') {
            this.gameRule.huanSanZhang = event.isChecked;
        } else if (param == 'hujiaozhuanyi') {
            this.gameRule.huJiaoZhuanYi = event.isChecked;
        } else if (param == 'cagua') {
            this.gameRule.caGua = event.isChecked;
        } else if (param == 'jishiyu') {
            this.gameRule.jiShiYu = event.isChecked;
        } else if (param == 'menqingzhongzhang') {
            this.gameRule.menQingZhongZhang = event.isChecked;
        } else if (param == 'yaojiujiangdui') {
            this.gameRule.yaoJiuJiangDui = event.isChecked;
        } else if (param == 'tiandihu') {
            this.gameRule.tianDiHu = event.isChecked;
        } else if (param == 'lunzhuang') {
            this.gameRule.lunZhuang = event.isChecked;
        } else if (param == 'duiduihu') {
            this.gameRule.duiDuiDouble = event.isChecked;
        } else if (param == 'liangfenqihu') {
            this.gameRule.erFenQiHu = event.isChecked;
        } else if (param == 'jiaxinwu') {
            this.gameRule.jiaXinWu = event.isChecked;
        } else if (param == 'xianshiliushui') {
            this.gameRule.showLiuShui = event.isChecked;
        } else if (param == 'guozhuangguohu') {
            this.gameRule.guoZhuangGuoHu = event.isChecked;
            if (this.gameRule.guoZhuangGuoHu) {
                this.guoshoujiafanTog.isChecked = false;
                this.gameRule.guoShouJiaFanHu = false;
            }
        } else if (param == 'laizi') {
            this.gameRule.addLaiZi = event.isChecked;
            this.wulaizijiafanTog.interactable = !!this.gameRule.addLaiZi;
            if (!this.gameRule.addLaiZi) {
                this.wulaizijiafanTog.isChecked = false;
                this.gameRule.laiZiDouble = false;
            }
            CCUtil.setGrayShader(this.wulaizijiafanTog.node, !this.wulaizijiafanTog.interactable);
        } else if (param == 'wulaizijiafan') {
            this.gameRule.laiZiDouble = event.isChecked;
        } else if (param == 'chahuazhu') {
            this.gameRule.chaHuaZhu = event.isChecked;
            this.chahuazhuxianzhiTog.interactable = !!this.gameRule.chaHuaZhu;
            if (!this.gameRule.chaHuaZhu) {
                this.chahuazhuxianzhiTog.isChecked = false;
            }
            CCUtil.setGrayShader(this.chahuazhuxianzhiTog.node, !this.chahuazhuxianzhiTog.interactable);
        } else if (param == 'chahuazhuxianzhi') {
            this.gameRule.chaHuaZhuLimit = event.isChecked;
        } else if (param == 'guopengguoquan') {
            this.gameRule.guoPengGuoQuan = event.isChecked;
        } else if (param == 'yitiaolong') {
            this.gameRule.yiTiaoLong = event.isChecked;
        } else if (param == 'youhubihu') {
            this.gameRule.youHuBiHu = event.isChecked;
        } else if (param == 'guoshoujiafan') {
            this.gameRule.guoShouJiaFanHu = event.isChecked;
            if (this.gameRule.guoShouJiaFanHu) {
                this.guozhuangguohuTog.isChecked = false;
                this.gameRule.guoZhuangGuoHu = false;
            }
        } else if (param == 'juezhangjiafan') {
            this.gameRule.jueZhangDouble = event.isChecked;
        } else if (param == 'sijiaobujiao') {
            this.gameRule.siJiaoPei = event.isChecked;
        } else if (param == 'yuyin') {
            this.gameRule.yuyin = event.isChecked;
        } else if (param == "fangzuobi") {
            this.gameRule.fangzuobi = event.isChecked;
        } else if (param == "difen") {
            this.onCheckRuleEditScore(this.difenEdit, 0.5, 100, "baseScore")
        } else if (param == "kaertiao") {
            this.gameRule.kaErTiao = event.isChecked;
        } else if (['AAZHIFU', 'YINGJIAZHIFU', 'WOZHIFU'].indexOf(param) != -1) {
            this.gameRule.payType = Enums.roomPayType[param];
        } else if (param.indexOf('tuoguan') != -1) { //托管
            let tuoguan = parseInt(param.slice(7));
            // console.log("托管==", tuoguan)
            if (tuoguan == 0) {
                this.gameRule.canTrust = false
            } else {
                this.gameRule.canTrust = true
                this.gameRule.trustTm = tuoguan
            }
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