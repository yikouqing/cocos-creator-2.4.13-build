const ApiHall = require('../../../api/ApiHall');
const UserModel = require('../../../model/UserModel');
const AssetsManager = require('../../../utils/AssetsManager');
const MessageCallback = require('../../../utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        targetScore: cc.EditBox, //目标分数
        floatScore: cc.EditBox, //浮动分数
        text_Score: cc.Label,
        _uid: null,
        _unionId: null,
    },

    start() {
        this._userInfo = this.node.nodeParams.userInfo || null;
        this._uid = this._userInfo && this._userInfo.uid ? this._userInfo.uid : null;
        this._unionId = !!this.node.nodeParams ? this.node.nodeParams.unionId || null : null;
        if (this._userInfo) {
            this.floatScore.string = this._userInfo.floatScore || 0;
            this.targetScore.string = this._userInfo.targetScore || 0;
            this.text_Score.string = this._userInfo.score || 0;
        }
    },

    onBtnClick(event, param) {
        if (param == "btn_baocun") {
            let myUid = UserModel.getData("uid");
            let floatScore = this.floatScore.string;
            let targetScore = this.targetScore.string;
            let reqData = {
                unionID: this._unionId,
                memberUid: this._uid,
                operationUid: myUid,
                floatScore: floatScore,
                targetScore: targetScore,
            };
            ApiHall.setUserWinScoreLimitRequest(reqData, (res) => {
                MessageCallback.emitMessage('UnionMainMemberSync');
                AssetsManager.tipDialog("操作成功！");
                this.node.destroy();
            });
        } else if (param == 'btn_close') {
            if (this.node.getComponent('DialogWidgetCtrl')) {
                this.node.getComponent('DialogWidgetCtrl').out();
            } else {
                this.node.destroy();
            }
        }
    },
});