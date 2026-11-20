const AssetsManager = require('../../../src/utils/AssetsManager');
const CXModel = require('./CXModel');
const UserModel = require('../../../src/model/UserModel');
const ApiCx = require('./ApiCx');
const ApiRoom = require('../../../src/api/ApiRoom');

cc.Class({
    extends: cc.Component,

    properties: {
        btnGen: cc.Node,
        genScore: cc.Label,
        btnDa: cc.Node,
        btnDaNo: cc.Node,
        btnFold: cc.Node,
        btnQiao: cc.Node,
        btnXiu: cc.Node,

        _comp: null,
    },

    init(comp) {
        this._comp = comp;
        this.clear();
    },

    sync() {
        let totalScore = CXModel.getUserTotalScoreByUID(UserModel.getData('uid'));
        let needPourScore = CXModel.getNeedPourScoreByUID(UserModel.getData('uid'));
        this.node.active = true;
        this.btnGen.active = needPourScore > 0;
        this.btnDa.active = totalScore > needPourScore;
        this.btnQiao.active = needPourScore >= totalScore;
        this.btnXiu.active = needPourScore == 0;
        this.btnFold.active = true;
        if (needPourScore > 0) {
            if (needPourScore > totalScore) {
                this.genScore.string = String(100)
            } else {
                this.genScore.string = String(needPourScore)
            }
        } else {
            this.genScore.string = '';
        }
    },

    opClick(event, param) {
        // 
        if (isNaN(parseInt(param))) return;
        let opType = parseInt(param);
        if (opType == ApiCx.operateType.DA) {
            if (!this._comp) return;
            this._comp.onDaClick();
            return;
        }
        let uid = UserModel.getData('uid');
        let needPourScore = CXModel.getNeedPourScoreByUID(uid);
        let totalScore = CXModel.getUserTotalScoreByUID(UserModel.getData('uid'));
        let pourScore = needPourScore > totalScore ? totalScore : needPourScore;
        let myScore = CXModel.getUserTotalScoreByUID(uid);
        if (opType == ApiCx.operateType.GEN) {
            if (pourScore >= myScore) {
                ApiRoom.gameMessageNotify(ApiCx.getOperateNotify(ApiCx.operateType.QIAO, pourScore));
            } else {
                ApiRoom.gameMessageNotify(ApiCx.getOperateNotify(ApiCx.operateType.GEN, pourScore));
            }
        } else {
            ApiRoom.gameMessageNotify(ApiCx.getOperateNotify(opType, pourScore));
        }

    },

    clear() {
        this.node.active = false;
        this.btnDa.active = false;
        this.btnDaNo.active = false;
        this.btnFold.active = false;
        this.btnGen.active = false;
        this.btnQiao.active = false;
        this.btnXiu.active = false;
        this.genScore.string = '';
    }

});