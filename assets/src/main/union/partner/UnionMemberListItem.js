const AssetsManager = require('../../../utils/AssetsManager');
const CCUtil = require('../../../utils/CCUtil');
const UserModel = require('../../../model/UserModel');
const ConfigModel = require('../../../model/ConfigModel');
const Utils = require('../../../utils/Utils');
const Enums = require('../../../const/Enums');
const MessageCallback = require('../../../utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        avatar: cc.Sprite,
        myAvatarBg: cc.Node,
        onLineSprite: cc.Sprite,
        nickname: cc.Label,
        uid: cc.Label,
        role: cc.Sprite,
        todayrounds: cc.Label,
        yestodayrounds: cc.Label,
        todaydraw: cc.Label,
        yestodaydraw: cc.Label,
        scoreLbl: cc.Label,
        states: cc.Label,
        forbidStatus: cc.Node,
        spreaderId: cc.Label,
        spreaderAvatar: cc.Sprite,
        spreaderAvatarBg: cc.Node,
        spreaderNick: cc.Label,
        roleLabel: cc.Label,
        srole: cc.Sprite,
        btnOp: cc.Node,
        meIcon: cc.Node,
        onLineText: cc.Color,
        onOfficeText: cc.Color,
    },

    start() {
        MessageCallback.addListener("OnMofifyManagerSync", this);
        MessageCallback.addListener("OnModifyScoreSync", this);
    },

    messageCallbackHandler(route, data) {
        switch (route) {
            case 'OnModifyScoreSync':
                this._onSocreModifySync(data);
                break;
            case 'OnMofifyManagerSync':
                this._onMofifyManagerSync(data);
                break;
        }
    },

    _onSocreModifySync(data) {
        if (!data || !this.userInfo) return;
        if (data.uid != this.userInfo.uid) return;
        this.userInfo.score = data.score;
        if (this.scoreLbl) this.scoreLbl.string = Utils.formatNumberWithSymbol(this.userInfo.score, 2);
    },

    initWidget(unionInfo, userInfo, unionID, unionOwnerID) {
        this.unionInfo = unionInfo
        this.userInfo = userInfo;
        if (this.meIcon) this.meIcon.active = UserModel.getData('uid') == userInfo.uid;
        AssetsManager.loadSpriteFrame({
            path: userInfo.avatar,
            sprite: this.avatar
        });
        if (this.myAvatarBg) {
            this.myAvatarBg.active = !!userInfo.avatar
        }
        if (this.spreaderAvatarBg) {
            this.spreaderAvatarBg.active = !!userInfo.spreaderInfo
        }

        if (!!userInfo.spreaderInfo) {
            if (this.spreaderId) this.spreaderId.string = userInfo.spreaderInfo.uid;
            if (this.spreaderNick) this.spreaderNick.string = CCUtil.stringClamp(userInfo.spreaderInfo.nickname, 6);
            AssetsManager.loadSpriteFrame({
                path: userInfo.spreaderInfo.avatar,
                sprite: this.spreaderAvatar
            });
            AssetsManager.loadSpriteFrame({
                path: `res/sprite/role/role_${userInfo.spreaderInfo.uid == unionOwnerID ? 'mz' : 'dz'}`,
                bundle: ConfigModel.getSkin(),
                sprite: this.srole
            });

        } else {
            if (this.spreaderId) this.spreaderId.string = '';
            if (this.spreaderNick) this.spreaderNick.string = '';
            if (this.spreaderAvatar) this.spreaderAvatar.spriteFrame = null;
            if (this.srole) this.srole.spriteFrame = null;
        }
        if (this.nickname) this.nickname.string = CCUtil.stringClamp(userInfo.nickname, 7, '..');
        if (this.uid) this.uid.string = userInfo.uid;
        let role = '';
        if (userInfo.uid == unionOwnerID) {
            if (this.roleLabel) this.roleLabel.string = '馆主'
            role = 'mz';
        } else if (userInfo.partner) {
            if (this.roleLabel) this.roleLabel.string = '队长'
            role = 'dz';
        } else if (userInfo.manager) {
            if (this.roleLabel) this.roleLabel.string = '管理'
            role = 'gl';
        } else if (!userInfo.isRobot) {
            if (this.roleLabel) this.roleLabel.string = '成员'
            role = 'cy';
        } else {
            role = 'jqr';
            if (this.roleLabel) this.roleLabel.string = '机器人'
        }
        AssetsManager.loadSpriteFrame({
            path: `res/sprite/role/role_${role}`,
            bundle: ConfigModel.getSkin(),
            sprite: this.role
        });
        // 状态
        let states = this.userInfo.frontendId ? '在线' : '离线';
        if (this.states) this.states.node.color = this.userInfo.frontendId || this.userInfo.roomID ? this.onLineText : this.onOfficeText;
        if (this.states) this.states.string = this.userInfo.roomID ? '游戏中' : states;
        if (this.scoreLbl) this.scoreLbl.string = unionInfo.unionType != Enums.UnionType.NORMAL ? Utils.formatNumberWithSymbol(userInfo.score, 1) : '';
        this.unionOwnerID = unionOwnerID;
        this.unionID = unionID;
        if (this.forbidStatus) this.forbidStatus.active = (this.unionOwnerID === UserModel.getData('uid') && !!userInfo.prohibitGame);
        if (this.todayrounds) this.todayrounds.string = Utils.formatNumberWithSymbol(userInfo.todayWin, 1);
        if (this.yestodayrounds) this.yestodayrounds.string = Utils.formatNumberWithSymbol(userInfo.yesterdayWin, 1);
        if (this.todaydraw) this.todaydraw.string = unionInfo.unionType != Enums.UnionType.NORMAL ? Utils.formatNumberWithSymbol(userInfo.todayProvideRebate, 1) : '';
        if (this.yestodaydraw) this.yestodaydraw.string = unionInfo.unionType != Enums.UnionType.NORMAL ? Utils.formatNumberWithSymbol(userInfo.yesterdayProvideRebate, 1) : '';
        if (this.onLineSprite) {
            let path = this.userInfo.frontendId ? 'zx' : 'lx';
            AssetsManager.loadSpriteFrame({
                path: `res/sprite/role/${path}`,
                bundle: ConfigModel.getSkin(),
                sprite: this.onLineSprite
            });
        }
    },

    _onMofifyManagerSync(user) {
        if (!this.userInfo || user.uid != this.userInfo.uid) return;
        this.userInfo.manager = user.manager;
        this.initWidget(this.unionInfo, this.userInfo, this.unionID, this.unionOwnerID);
    },

    updateScore(score) {
        this.userInfo.score = score;
    },

    onBtnClick(event, params) {
        switch (params) {
            case 'option':
                AssetsManager.createDialog({
                    path: "res/prefab/union/partner/UnionMemberOptionDialog",
                    bundle: ConfigModel.getSkin(),
                    unionInfo: this.unionInfo,
                    userInfo: this.userInfo,
                    unionID: this.unionID,
                    unionOwnerID: this.unionOwnerID,
                    clickNode: this.btnOp,
                    targetNode: event.target,
                });
                break;
            case 'record':
                AssetsManager.createDialog({
                    path: "res/prefab/main/record/GameRecordDialog",
                    bundle: ConfigModel.getSkin(),
                    userInfo: this.userInfo,
                    uid: this.userInfo.uid,
                    unionID: this.unionID,
                    type: "union",
                    showPartnerGameRecord: false, //不查玩家下级
                });
                break;
            case 'detail':
                AssetsManager.createDialog({
                    path: "res/prefab/union/partner/UnionMemberViewDialog",
                    bundle: ConfigModel.getSkin(),
                    unionInfo: this.unionInfo,
                    userInfo: this.userInfo,
                    unionID: this.unionID,
                    unionOwnerID: this.unionOwnerID,
                    clickNode: this.btnOp,
                    targetNode: event.target,
                });
                break;
            default:
                break;
        }
    },

    onDestroy() {
        MessageCallback.removeListener("OnMofifyManagerSync", this);
        MessageCallback.removeListener("OnModifyScoreSync", this);
    },
});