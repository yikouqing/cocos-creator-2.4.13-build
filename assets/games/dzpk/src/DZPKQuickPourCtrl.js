const AssetsManager = require('../../../src/utils/AssetsManager');
const DZPKModel = require('./DZPKModel');
const UserModel = require('../../../src/model/UserModel');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiDzpk = require('./ApiDzpk');

const quickPourScores = [1 / 3, 1 / 2, 1];

cc.Class({
    extends: cc.Component,

    properties: {
        btnQuickPour: [cc.Node],
        quickPourScore: [cc.Label],

    },

    sync() {
        let totalScore = DZPKModel.getUserTotalScoreByUID(UserModel.getData('uid'));
        let needPourScore = DZPKModel.getNeedPourScoreByUID(UserModel.getData('uid'));
        let baseTotalScore = DZPKModel.getTotalBaseScore();
        this.node.active = true;
        for (let index = 0; index < this.btnQuickPour.length; index++) {
            let ratePourScore = quickPourScores[index] * baseTotalScore;
            this.btnQuickPour[index].opacity = ratePourScore <= totalScore && ratePourScore >= needPourScore ? 255 : 160; //＜我的分数
            // this.quickPourScore[index].string = `${quickPourScores[index]}底`;
        }
    },

    clear() {
        this.node.active = false;
        for (let index = 0; index < this.quickPourScore.length; index++) {
            this.quickPourScore[index].string = '';
        }
    },

    onClick(event, param) {
        let totalScore = DZPKModel.getUserTotalScoreByUID(UserModel.getData('uid'));
        let needPourScore = DZPKModel.getNeedPourScoreByUID(UserModel.getData('uid'));
        let baseTotalScore = DZPKModel.getTotalBaseScore();
        if (isNaN(parseInt(param))) return;
        let index = parseInt(param);
        let ratePourScore = quickPourScores[index] * baseTotalScore;
        if (ratePourScore > totalScore || ratePourScore < needPourScore) return;

        ApiRoom.gameMessageNotify(ApiDzpk.getOperateNotify(ApiDzpk.operateType.DA, ratePourScore));
    }

});