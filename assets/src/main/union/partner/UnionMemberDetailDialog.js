const MessageCallback = require('../../../utils/MessageCallback');
const AssetsManager = require('../../../utils/AssetsManager');
const CCUtil = require('../../../utils/CCUtil');
const UserModel = require('../../../model/UserModel');
const ConfigModel = require('../../../model/ConfigModel');
const ApiHall = require('../../../api/ApiHall');

cc.Class({
    extends: cc.Component,

    properties: {
        avatar: cc.Sprite,
        nicknameText: cc.Label,
        idText: cc.Label,
        status: cc.Label,
        forbidBtn: cc.Node,
        cancelForbidBtn: cc.Node,
        btnDelete: cc.Node,
        btnAddManager: cc.Node,
        btnDelManager: cc.Node,
        btnPartnerModify: cc.Node
    },

    start() {
        let userInfo = this.node.nodeParams.userInfo;
        this.callback = this.node.nodeParams.cb;
        this.unionID = this.node.nodeParams.unionID;
        this.unionOwnerID = this.node.nodeParams.unionOwnerID;
        this.nicknameText.string = CCUtil.stringClamp(userInfo.nickname, 7, '..');;
        this.idText.string = userInfo.uid;
        this.btnPartnerModify.active = userInfo.uid != this.unionOwnerID && this.unionOwnerID == UserModel.getData('uid'); //盟主才有权限且不能改自己
        AssetsManager.loadSpriteFrame({
            path: userInfo.avatar,
            sprite: this.avatar
        });
        this.status.string = userInfo.prohibitGame ? "禁止游戏" : "正常";
        this.forbidBtn.active = !userInfo.prohibitGame;
        this.cancelForbidBtn.active = userInfo.prohibitGame;
        this.btnAddManager.active = this.unionOwnerID == UserModel.getData('uid') && !userInfo.manager;
        this.btnDelManager.active = this.unionOwnerID == UserModel.getData('uid') && userInfo.manager;
        this.userInfo = userInfo;
        this.btnDelete.active = this.userInfo.uid != UserModel.getData('uid') && this.unionOwnerID == UserModel.getData('uid');
        MessageCallback.addListener("UnionMainMemberSync", this);
    },

    onDestroy() {
        MessageCallback.removeListener("UnionMainMemberSync", this);
    },

    messageCallbackHandler(route, data) {
        switch (route) {
            case 'UnionMainMemberSync':
                if (!data || isNaN(data.score)) return;
                this.userInfo.score = data.score;
                break;
        }
    },

    onBtnClk(event, param) {

        switch (param) {
            case 'close':
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
                break;
            case 'forbid':
                let reqfData = {
                    unionID: this.unionID,
                    uid: this.userInfo.uid,
                    forbid: true
                };
                ApiHall.updateForbidGameStatusRequest(reqfData, () => {
                    AssetsManager.tipDialog("操作成功");
                    this.status.string = "禁止游戏";
                    this.forbidBtn.active = false;
                    this.cancelForbidBtn.active = true;
                    this.callback && this.callback(true);
                });
                break;
            case 'cancelForbid':
                let reqxData = {
                    unionID: this.unionID,
                    uid: this.userInfo.uid,
                    forbid: false
                };
                ApiHall.updateForbidGameStatusRequest(reqxData, () => {
                    AssetsManager.tipDialog("操作成功");
                    this.status.string = "正常";
                    this.forbidBtn.active = true;
                    this.cancelForbidBtn.active = false;
                    this.callback && this.callback(false);
                });
                break;
            case 'addScore':
                AssetsManager.createDialog({
                    path: "res/prefab/union/partner/UnionChangeMemberScoreDialog",
                    bundle: ConfigModel.getSkin(),
                    unionID: this.unionID,
                    memberUid: this.userInfo.uid,
                    score: this.userInfo.score,
                    operationType: 'add',
                    userInfo: this.userInfo,
                    unionOwnerID: this.unionOwnerID
                });
                break;
            case 'jianScore':
                AssetsManager.createDialog({
                    path: "res/prefab/union/partner/UnionChangeMemberScoreDialog",
                    bundle: ConfigModel.getSkin(),
                    unionID: this.unionID,
                    memberUid: this.userInfo.uid,
                    score: this.userInfo.score,
                    userInfo: this.userInfo,
                    operationType: 'jian',
                    unionOwnerID: this.unionOwnerID
                });
                break;
            case 'delete':
                AssetsManager.popDialog({
                    content: "确定从本俱乐部删除玩家吗",
                    ok: () => {
                        let reqData = {
                            unionID: this.unionID,
                            uid: this.userInfo.uid
                        };
                        ApiHall.deleteUserRequest(reqData, () => {
                            AssetsManager.tipDialog("操作成功");
                            MessageCallback.emitMessage('UnionMainMemberSync');
                            if (this.node.getComponent('DialogWidgetCtrl')) {
                                this.node.getComponent('DialogWidgetCtrl').out();
                            } else {
                                this.node.destroy();
                            }
                        });
                    },
                    no: () => { }
                });
                break;
            case 'record':
                // UserModel.getData('uid')
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
            case 'addManager':
                let reqData = {
                    isDel: false,
                    unionID: this.unionID,
                    memberUid: this.userInfo.uid
                };
                ApiHall.addManagerRequest(reqData, () => {
                    this.userInfo.manager = true;
                    this.btnAddManager.active = this.unionOwnerID == UserModel.getData('uid') && !this.userInfo.manager;
                    this.btnDelManager.active = this.unionOwnerID == UserModel.getData('uid') && this.userInfo.manager;
                    MessageCallback.emitMessage('OnMofifyManagerSync', this.userInfo);
                    AssetsManager.tipDialog("设置管理员成功！");
                });
                break;
            case 'delManager':
                let reqsData = {
                    isDel: true,
                    unionID: this.unionID,
                    memberUid: this.userInfo.uid
                };
                ApiHall.addManagerRequest(reqsData, () => {
                    this.userInfo.manager = false;
                    this.btnAddManager.active = this.unionOwnerID == UserModel.getData('uid') && !this.userInfo.manager;
                    this.btnDelManager.active = this.unionOwnerID == UserModel.getData('uid') && this.userInfo.manager;
                    MessageCallback.emitMessage('OnMofifyManagerSync', this.userInfo);
                    AssetsManager.tipDialog("取消管理员成功！");
                });
                break;
            case 'xghhr':
                AssetsManager.createDialog({
                    path: "res/prefab/union/partner/UnionModifyPartnerDialog",
                    bundle: ConfigModel.getSkin(),
                    uid: this.userInfo.uid,
                    unionId: this.unionID,
                });
                break;
                break;
        }
    },

});