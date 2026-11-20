const Utils = require('../../../utils/Utils');
const AssetsManager = require('../../../utils/AssetsManager');
const CCUtil = require('../../../utils/CCUtil');
const UserModel = require('../../../model/UserModel');
const ConfigModel = require('../../../model/ConfigModel');
const ApiHall = require('../../../api/ApiHall');

cc.Class({
    extends: cc.Component,

    properties: {
        headSprite: cc.Sprite,
        nickLbl: cc.Label,
        uidLbl: cc.Label,
        btnOp: cc.Node,
        checkMark: cc.Node,
        fixEdit: cc.EditBox,
        btnModify: cc.Node,

        _user: null
    },

    start() {
        if (!this.node.nodeParams) return;
        this._user = this.node.nodeParams;
        this.uidLbl.string = this._user.uid;
        this.nickLbl.string = CCUtil.stringClamp(this._user.nickname, 5, '..');
        this.fixEdit.string = Utils.formatNumberWithSymbol(this._user.fixScoreRate, 0);
        this.btnModify.active = false;
        AssetsManager.loadSpriteFrame({
            path: this._user.avatar,
            sprite: this.headSprite
        });
        this._user.fixScoreRate = this._user.fixScoreRate || 0;
        if (isNaN(this._user.fixScoreRate) || this._user.fixScoreRate < 0 || this._user.fixScoreRate > 100) this._user.fixScoreRate = 0;
        this.btnOp.active = this._user.unionOwnerID == UserModel.getData('uid') || !!this._user.manager || !!this._user.partner;
        this.fixEdit.enabled = this._user.unionOwnerID == UserModel.getData('uid') || !!this._user.manager || !!this._user.partner;
        if (this.btnOp.active) {
            this.checkMark.active = !!this._user.showFixScore;
        }
    },

    onEditEnd() {
        if (!this._user) {
            this.btnModify.active = false;
            return;
        }
        let fixScoreRate = this.fiexEditCheck();
        this.btnModify.active = fixScoreRate != this._user.fixScoreRate;
    },

    fiexEditCheck() {
        let fixScoreRate = parseInt(this.fixEdit.string);
        let maxFixScoreRate = Math.min(this._user.maxFixScoreRate, 1);
        if (isNaN(fixScoreRate)) fixScoreRate = 0;
        if (fixScoreRate < 0) fixScoreRate = 0;
        if (fixScoreRate > 100) fixScoreRate = 100;
        let canAboveSpreaderFixRate = ConfigModel.getData('canAboveSpreaderFixRate');
        if (!canAboveSpreaderFixRate) {
            if (fixScoreRate > maxFixScoreRate * 100) fixScoreRate = maxFixScoreRate * 100;
        }
        this.fixEdit.string = `${Utils.formatNumberWithDecimal(fixScoreRate, 0)}`;
        return fixScoreRate;
    },

    onClick(event, param) {
        if (!this._user) return;
        if (param == 'check') {
            let reqData = {
                unionID: this._user.unionID,
                memberUid: this._user.uid,
                isShow: this.checkMark.active ? 0 : 1
            };
            ApiHall.updateShowFixScoreRequest(reqData, (res) => {
                this.checkMark.active = res.isShow == 1;
            });
        } else if (param == 'modify') {
            let fixScoreRate = this.fiexEditCheck();
            let reqData = {
                unionID: this._user.unionID,
                memberUid: this._user.uid,
                fixScoreRate: fixScoreRate / 100
            };
            ApiHall.updateUserFixScoreRequest(reqData, (res) => {
                AssetsManager.tipDialog('修改成功！');
                this._user.fixScoreRate = fixScoreRate / 100;
                this.fixEdit.string = `${fixScoreRate}`;
                this.btnModify.active = false;
            });
        }

    },

});