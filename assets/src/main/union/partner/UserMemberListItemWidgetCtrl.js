const AssetsManager = require('../../../utils/AssetsManager');
const CCUtil = require('../../../utils/CCUtil');
const UserModel = require('../../../model/UserModel');
const ConfigModel = require('../../../model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        avatar: cc.Sprite,
        nickname: cc.Label,
        status: cc.Label,
        playingColor: cc.Color,
        offlineColor: cc.Color,
        onlineColor: cc.Color,
        forbidStatus: cc.Node
    },

    start() { },

    initWidget(userInfo, unionID, unionOwnerID) {
        AssetsManager.loadSpriteFrame({
            path: userInfo.avatar,
            sprite: this.avatar
        });
        this.nickname.string = CCUtil.stringClamp(userInfo.nickname, 7, '..');;
        if (userInfo.uid === UserModel.getData('uid')) {
            this.status.string = '自己';
        } else if (userInfo.roomID) {
            this.status.string = '游戏中';
            this.status.node.color = this.playingColor;
        } else if (userInfo.frontendId) {
            this.status.string = '在线';
            this.status.node.color = this.onlineColor;
        } else {
            this.status.string = '离线';
            this.status.node.color = this.offlineColor;
        }
        this.unionOwnerID = unionOwnerID;
        this.unionID = unionID;
        this.userInfo = userInfo;
        this.forbidStatus.active = (this.unionOwnerID === UserModel.getData('uid') && !!userInfo.prohibitGame);
    },

    updateScore(score) {
        this.userInfo.score = score;
    },

    onBtnClick() {
        if (this.unionOwnerID == UserModel.getData('uid')) {
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/UnionMemberDetailDialog",
                bundle: ConfigModel.getSkin(),
                userInfo: this.userInfo,
                unionID: this.unionID,
                unionOwnerID: this.unionOwnerID,
                cb: (forbid) => {
                    this.userInfo.prohibitGame = forbid;
                    this.forbidStatus.active = (this.unionOwnerID === UserModel.getData('uid') && !!this.userInfo.prohibitGame);
                }
            });
        } else {
            if (this.userInfo.uid === UserModel.getData('uid')) return;
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/UnionMemberDetailDialog",
                bundle: ConfigModel.getSkin(),
                userInfo: this.userInfo,
                unionID: this.unionID,
                unionOwnerID: this.unionOwnerID,
                cb: (forbid) => {
                    this.userInfo.prohibitGame = forbid;
                    this.forbidStatus.active = (this.unionOwnerID === UserModel.getData('uid') && !!this.userInfo.prohibitGame);
                }
            });
        }
    }
});