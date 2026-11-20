const MessageCallback = require('../../../utils/MessageCallback');
const AssetsManager = require('../../../utils/AssetsManager');
const UserModel = require('../../../model/UserModel');
const Utils = require('../../../utils/Utils');
const ApiHall = require('../../../api/ApiHall');

cc.Class({
    extends: cc.Component,

    properties: {
        titleJiaBar: cc.Node,
        titleJianBar: cc.Node,
        avatar: cc.Sprite,
        nickLbl: cc.Label,
        uidLbl: cc.Label,
        scoreLbl: cc.Label,
        selfScoreLbl: cc.Label,
        scoreInputLbl: cc.Label,

        _numbers: [],
        _curScore: 0, //当前分数
        _unionID: 0,
        _unionOwnerID: 0,
        _memberUid: 0,
        _userInfo: null,
        _opType: null
    },

    start() {
        this._numbers = [];
        this._userInfo = this.node.nodeParams.userInfo;
        this._opType = this.node.nodeParams.operationType;
        this._unionID = this.node.nodeParams.unionID;
        this._unionOwnerID = this.node.nodeParams.unionOwnerID;
        this._curScore = this.node.nodeParams.score;
        this._memberUid = this.node.nodeParams.memberUid;
        this.titleJiaBar.active = this._opType != 'jian';
        this.titleJianBar.active = !this.titleJiaBar.active;
        this.scoreLbl.string = `玩家分数:${Utils.formatNumberWithSymbol(this._curScore, 2)}`;
        AssetsManager.loadSpriteFrame({
            path: this._userInfo.avatar,
            sprite: this.avatar
        });
        this.nickLbl.string = "昵称:" + this._userInfo.nickname;
        this.uidLbl.string = "ID:" + this._userInfo.uid;
        let unionInfo = UserModel.getData('unionInfo');
        let unionInfoItem = unionInfo.find((ele) => {
            return ele.unionID === this._unionID;
        });
        this.selfScoreLbl.string = `我的分数:${Utils.formatNumberWithSymbol(unionInfoItem.score, 2)}`;
    },

    onBtnClick(event, parameter) {
        if (parameter === "close") {
            if (this.node.getComponent('DialogWidgetCtrl')) {
                this.node.getComponent('DialogWidgetCtrl').out();
            } else {
                this.node.destroy();
            }
        } else if (parameter === 'confirm') {
            let unionInfoItem = UserModel.getUnionInfo(this._unionID);
            if (this._opType == 'jian') {
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

            let scores = this._numbers.join('');
            if (scores.length == 0) {
                AssetsManager.tipDialog("请输入正确的积分数量！");
                return;
            }
            scores = parseFloat(scores);
            if (this._opType != 'jian') {
                if (this._unionOwnerID !== UserModel.getData('uid') &&
                    scores > unionInfoItem.score) {
                    AssetsManager.tipDialog("积分不足");
                    return;
                }
            } else {
                if (scores > this._curScore) {
                    AssetsManager.tipDialog("积分不足");
                    return;
                }
                scores *= -1;
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
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
            });
        } else if (parameter === 'clear') {
            this._onResetClick();
        } else if (parameter.indexOf('inputnum') != -1) {
            this._onNumerClick(parameter.slice(8));
        } else if (parameter === 'dian') {
            this._onNumerClick('.');
        }
    },

    _onResetClick() {
        this._numbers = [];
        this.scoreInputLbl.string = '';
    },

    _onNumerClick(input) {
        if (input == '.') {
            if (!!this._numbers.includes('.')) return;
            if (this._numbers.length == 0) {
                this._numbers.push('0');
            }
        }
        this._numbers.push(input);
        this.scoreInputLbl.string = this._numbers.join('');
    },

    updateScore() {
        this.scoreLbl.string = Utils.formatNumberWithSymbol(this._curScore);
        let unionInfoItem = UserModel.getUnionInfo(this._unionID);
        this.selfScoreLbl.string = Utils.formatNumberWithSymbol(unionInfoItem.score);
    },

});