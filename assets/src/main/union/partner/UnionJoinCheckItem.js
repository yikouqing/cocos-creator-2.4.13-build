const Utils = require('../../../utils/Utils');
const CCUtil = require('../../../utils/CCUtil');
const AssetsManager = require('../../../utils/AssetsManager');
const ApiHall = require('../../../api/ApiHall');

cc.Class({
    extends: cc.Component,

    properties: {
        avatar: cc.Sprite,
        uidLabel: cc.Label,
        nickname: cc.Label,
        speaderID: cc.Label,
        inviteID: cc.Label,
        btnOk: cc.Node,
        BtnNo: cc.Node,
        _group: null,
    },

    start() {

    },

    initWidget(userInfo) {
        this.approveType = null
        this.userInfo = userInfo;
        this.uidLabel.string = userInfo.uid;
        this.nickname.string = userInfo.nickname
        this.speaderID.string = userInfo.spreaderID
        this.inviteID.string = userInfo.inviteID
        // 申请理由
        // this.applyLog.string = userInfo.speaderID
        // 邀请人id
        this.spreaderID = userInfo.spreaderID
        AssetsManager.loadSpriteFrame({
            path: userInfo.avatar,
            sprite: this.avatar
        });
    },

    onBtnClick(event, params) {
        switch (params) {
            case 'agree':
                this.approveType = true;
                this._onJoin(this.approveType);
                break;
            case 'reject':
                this.approveType = false;
                this._onJoin(this.approveType);
                break;
            default:
                break;
        }
    },

    _onJoin(approveType) {
        let reqData = {
            uid: this.userInfo.uid,
            inviteID: this.userInfo.inviteID,
            approveType: approveType,
        };
        ApiHall.joinUnionApprove(reqData, (res) => {
            this.userInfo.onSync();
            AssetsManager.tipDialog(approveType ? '已同意' : '已拒绝');
        });
    },

});