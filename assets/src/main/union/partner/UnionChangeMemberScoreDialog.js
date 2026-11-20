const MessageCallback = require('../../../utils/MessageCallback');
const AssetsManager = require('../../../utils/AssetsManager');
const UserModel = require('../../../model/UserModel');
const Utils = require('../../../utils/Utils');
const ApiHall = require('../../../api/ApiHall');

cc.Class({
    extends: cc.Component,

    properties: {
        scoreLabel: cc.Label,
        selfScoreLabel: cc.Label,
        scoreInputLbl: cc.Label,

        _numbers: [],
        _sign: 0, //0-正数 1-负数
        _curScore: 0, //当前分数
        _unionID: 0,
        _unionOwnerID: 0,
        _memberUid: 0,
        _userInfo: null
    },

    onLoad() {
        this._numbers = [];
        this._userInfo = this.node.nodeParams.userInfo;
        this._unionID = this.node.nodeParams.unionID;
        this._unionOwnerID = this.node.nodeParams.unionOwnerID;
        this._curScore = this.node.nodeParams.score;
        this._memberUid = this.node.nodeParams.memberUid;
        this._cb = this.node.nodeParams.cb;
        this.scoreLabel.string = Utils.formatNumberWithSymbol(this._curScore, 2);
        let unionInfo = UserModel.getData('unionInfo');
        let unionInfoItem = unionInfo.find((ele) => {
            return ele.unionID === this._unionID;
        });
        this.selfScoreLabel.string = Utils.formatNumberWithSymbol(unionInfoItem.score, 2);
    },

    start() { },

    onBtnClick(event, parameter) {
        if (parameter === "close") {
            if (this.node.getComponent('DialogWidgetCtrl')) {
                this.node.getComponent('DialogWidgetCtrl').out();
            } else {
                this.node.destroy();
            }
        } else if (parameter === 'confirm') {
            let unionInfoItem = UserModel.getUnionInfo(this._unionID);
            if (this._sign == 1) {
                if (this._unionOwnerID != UserModel.getData('uid') &&
                    unionInfoItem.manager &&
                    this._userInfo.uid == UserModel.getData('uid')) {
                    AssetsManager.tipDialog("管理员不能给自己减分！");
                    return;
                }
            } else {
                if (this._unionOwnerID != UserModel.getData('uid') &&
                    unionInfoItem.manager &&
                    this._userInfo.uid == UserModel.getData('uid')) {
                    AssetsManager.tipDialog("管理员不能给自己加分！");
                    return;
                }
            }

            let scores = parseInt(this._numbers.join(''));
            if (isNaN(scores)) {
                AssetsManager.tipDialog("请输入正确的积分数量！");
                return;
            }
            if (this._sign == 0) {
                if (this._unionOwnerID !== UserModel.getData('uid') &&
                    scores > unionInfoItem.score) {
                    AssetsManager.tipDialog("积分不足");
                    return;
                }
                scores = Math.abs(parseInt(scores));
            } else {
                if (scores > this._curScore) {
                    AssetsManager.tipDialog("积分不足");
                    return;
                }
                scores = parseInt(scores) * -1;
            }
            let reqData = {
                unionID: this._unionID,
                memberUid: this._memberUid,
                count: scores
            };
            ApiHall.modifyScoreRequest(reqData, () => {
                AssetsManager.tipDialog("操作成功");
                this._curScore += scores;
                MessageCallback.emitMessage('OnModifyScoreSync', {
                    uid: this._memberUid,
                    score: this._curScore,
                    changeScore: scores
                });
                this.scoreInputLbl.string = "";
                this.updateScore();
                this._cb && this._cb();
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
            });
        }
    },

    inputClick(event, param) {

        switch (param) {
            case '0':
            case '1':
            case '2':
            case '3':
            case '4':
            case '5':
            case '6':
            case '7':
            case '8':
            case '9':
                this._onNumerClick(param);
                break;
            case 'reset':
                this._onResetClick();
                break;
            case 'reduce':
                this._onReduceClick();
                break;
        }
    },

    _onReduceClick() {
        this._sign = 1;
        let scores = parseInt(this._numbers.join(''));
        scores = isNaN(scores) ? 0 : scores;
        this.scoreInputLbl.string = `${this._sign == 0 ? '+' : '-'}${scores}`;
    },

    _onResetClick() {
        this._sign = 0;
        this._numbers = [];
        this.scoreInputLbl.string = '';
    },

    _onNumerClick(num) {
        num = parseInt(num);
        this._numbers.push(num);
        let scores = parseInt(this._numbers.join(''));
        scores = isNaN(scores) ? 0 : scores;
        this.scoreInputLbl.string = `${this._sign == 0 ? '+' : '-'}${scores}`;
    },

    updateScore() {
        this.scoreLabel.string = Utils.formatNumberWithSymbol(this._curScore);
        let unionInfoItem = UserModel.getUnionInfo(this._unionID);
        this.selfScoreLabel.string = Utils.formatNumberWithSymbol(unionInfoItem.score);
    },

});