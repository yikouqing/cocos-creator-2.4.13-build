const AssetsManager = require('../../../src/utils/AssetsManager');
const CXModel = require('./CXModel');
const UserModel = require('../../../src/model/UserModel');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiCx = require('./ApiCx');

cc.Class({
    extends: cc.Component,

    properties: {
        btnQuickPour: [cc.Node],
        quickPourScore: [cc.Label],

    },

    sync() {
        let totalScore = CXModel.getUserTotalScoreByUID(UserModel.getData('uid'));
        let needPour = CXModel.getNeedPourScoreByUID(UserModel.getData('uid'));
        let baseScore = CXModel.getGameRuleByKey('baseScore');
        needPour = needPour == 0 ? baseScore : (needPour + baseScore);
        this.node.active = true;
        for (let index = 0; index < this.quickPourScore.length; index++) {
            let ratePourScore = (index + 1) * needPour;
            this.btnQuickPour[index].opacity = ratePourScore < totalScore ? 255 : 160; //＜我的分数
            this.quickPourScore[index].string = ratePourScore;
        }
    },

    clear() {
        this.node.active = false;
        for (let index = 0; index < this.quickPourScore.length; index++) {
            this.quickPourScore[index].string = '';
        }
    },

    onClick(event, param) {
        let totalScore = CXModel.getUserTotalScoreByUID(UserModel.getData('uid'));
        let needPour = CXModel.getNeedPourScoreByUID(UserModel.getData('uid'));
        let baseScore = CXModel.getGameRuleByKey('baseScore');
        needPour = needPour == 0 ? baseScore : (needPour + baseScore);
        if (isNaN(parseInt(param))) return;
        let index = parseInt(param);
        let score = needPour * (index + 1);
        if (score > totalScore) return;

        ApiRoom.gameMessageNotify(ApiCx.getOperateNotify(ApiCx.operateType.DA, score));
    }

});