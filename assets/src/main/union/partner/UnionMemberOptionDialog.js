const MessageCallback = require('../../../utils/MessageCallback');
const AssetsManager = require('../../../utils/AssetsManager');
const CCUtil = require('../../../utils/CCUtil');
const UserModel = require('../../../model/UserModel');
const ConfigModel = require('../../../model/ConfigModel');
const ApiHall = require('../../../api/ApiHall');
const Enums = require('../../../const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {
        btnSetPartner: cc.Node,
        btnUnSetPartner: cc.Node,
        btnJinzhiyouxi: cc.Node,
        btnQuxiaojinzhi: cc.Node,
        btnXiugaiduizhang: cc.Node,
        btnShezhiguanli: cc.Node,
        btnQuxiaoguanli: cc.Node,
        btnShanchuguanyuan: cc.Node,
        btnXiuGaiFenShu: cc.Node,
        btnYouXiQuanXian: cc.Node,
        btnPingHengXianZhi: cc.Node,
    },

    onLoad() {
        MessageCallback.addListener("UnionMainMemberSync", this);
    },

    start() {
        this.unionInfo = this.node.nodeParams.unionInfo;
        let userInfo = this.node.nodeParams.userInfo;
        this.userInfo = userInfo;
        this.unionID = this.node.nodeParams.unionID;
        this.unionOwnerID = this.node.nodeParams.unionOwnerID;
        this._optsSync();
    },

    _optsSync() {
        let unionInfo = this.unionInfo;
        let userInfo = this.userInfo;
        let unionItem = UserModel.getUnionInfo(this.unionID);
        let isRobot = userInfo.isRobot;
        let myUid = UserModel.getData('uid');
        let isCurUserSelf = userInfo.uid == myUid; //当前被操作玩家是不是自己
        let isCurUserOwner = userInfo.uid == this.unionOwnerID; //当前被操作玩家是不是盟主
        let isCurUserPartner = !!userInfo && !!userInfo.partner; //当前被操作玩家是不是队长
        let isCurUserManager = !!userInfo && !!userInfo.manager; //当前被操作玩家是不是队长
        let isOptOwner = this.unionOwnerID == UserModel.getData('uid'); //当前操作者是不是盟主
        let isOptPartner = !!unionItem && !!unionItem.partner; //当前操作者是不是合伙人
        let isOptManager = !!unionItem && !!unionItem.manager; //当前操作者是不是管理员
        let isScoreMode = unionInfo.unionType != Enums.UnionType.NORMAL; //支持分数模式
        let isOptSpreader = userInfo.spreaderID == myUid;//我是不是这个人的上级
        let canModifyScore = !!isOptOwner || (!!isOptManager && !isCurUserSelf) || (!!isOptPartner && !isCurUserSelf && !!isOptSpreader);
        this.btnXiuGaiFenShu.active = !!isScoreMode && (!!canModifyScore); //修改分数
        this.btnUnSetPartner.active = !isRobot && !!isCurUserPartner && !isCurUserSelf && !isCurUserOwner && (!!isOptOwner || (!!isOptPartner && !!isOptSpreader)); //取消队长
        this.btnSetPartner.active = !isRobot && !isCurUserPartner && !isCurUserSelf && !isCurUserOwner && !isCurUserManager && (!!isOptOwner || (!!isOptPartner && !!isOptSpreader));; //设为队长
        this.btnJinzhiyouxi.active = !isRobot && !userInfo.prohibitGame && !isCurUserSelf && !isCurUserOwner; //允许游戏
        this.btnQuxiaojinzhi.active = !isRobot && !!userInfo.prohibitGame && !isCurUserSelf && !isCurUserOwner; //禁止游戏
        this.btnShezhiguanli.active = !isRobot && !!isOptOwner && !isCurUserManager && !isCurUserSelf && !isCurUserPartner; //设为管理
        this.btnQuxiaoguanli.active = !isRobot && !!isOptOwner && !!isCurUserManager && !isCurUserSelf; //取消管理
        this.btnShanchuguanyuan.active = !isRobot && !isCurUserSelf && !isCurUserOwner && (!!isOptOwner || !!isOptManager || !!isOptPartner); //删除成员
        this.btnYouXiQuanXian.active = !isRobot && (!!isOptOwner || !!isOptManager || (!!isOptPartner && !isCurUserSelf)); //游戏权限
        this.btnXiugaiduizhang.active = !isRobot && !isCurUserSelf && !!isOptOwner; //升降队长
        this.btnPingHengXianZhi.active = !isRobot && !isCurUserSelf && !isCurUserOwner && (!!ConfigModel.getData("balanceEnable") || cc.sys.isBrowser) && (isOptOwner || isOptManager);
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
                this.onCloseClick();
                break;
            case 'jzyx':
                let reqqxData = {
                    unionID: this.unionID,
                    uid: this.userInfo.uid,
                    forbid: true
                };
                ApiHall.updateForbidGameStatusRequest(reqqxData, () => {
                    AssetsManager.tipDialog("操作成功");
                    this.userInfo.prohibitGame = true;
                    this._optsSync();
                });
                break;
            case 'hfyx':
                let reqqdData = {
                    unionID: this.unionID,
                    uid: this.userInfo.uid,
                    forbid: false
                };
                ApiHall.updateForbidGameStatusRequest(reqqdData, () => {
                    AssetsManager.tipDialog("操作成功");
                    this.userInfo.prohibitGame = false;
                    this._optsSync();
                });
                break;
            case 'sccy':
                if (this.userInfo.score >= 1) {
                    AssetsManager.tipDialog("删除成员请先清空玩家分数~");
                    return;
                }
                AssetsManager.popDialog({
                    content: "确定从本俱乐部删除玩家吗？",
                    ok: () => {
                        let reqData = {
                            unionID: this.unionID,
                            uid: this.userInfo.uid
                        };
                        ApiHall.deleteUserRequest(reqData, () => {
                            AssetsManager.tipDialog("操作成功");
                            MessageCallback.emitMessage('UnionMainMemberSync');
                            this.onCloseClick();
                        });
                    },
                    no: () => { }
                });
                break;
            case 'ckzj':
                AssetsManager.createDialog({
                    path: "res/prefab/main/record/GameRecordDialog",
                    bundle: ConfigModel.getSkin(),
                    userInfo: this.userInfo,
                    uid: this.userInfo.uid,
                    unionID: this.unionID,
                    type: "union",
                    showPartnerGameRecord: false, //不查玩家下级
                    nodeParent: this.node,
                });
                break;
            case 'szgl':
                let reqqData = {
                    isDel: false,
                    unionID: this.unionID,
                    memberUid: this.userInfo.uid
                };
                ApiHall.addManagerRequest(reqqData, () => {
                    this.userInfo.manager = true;
                    this._optsSync();
                    MessageCallback.emitMessage('OnMofifyManagerSync', this.userInfo);
                    AssetsManager.tipDialog("设置管理员成功！");
                });
                break;
            case 'qxgl':
                let reqqsData = {
                    isDel: true,
                    unionID: this.unionID,
                    memberUid: this.userInfo.uid
                };
                ApiHall.addManagerRequest(reqqsData, () => {
                    this.userInfo.manager = false;
                    this._optsSync();
                    MessageCallback.emitMessage('OnMofifyManagerSync', this.userInfo);
                    AssetsManager.tipDialog("取消管理员成功！");
                });
                break;
            case 'xgdz':
                AssetsManager.createDialog({
                    path: "res/prefab/union/partner/UnionModifyPartnerDialog",
                    bundle: ConfigModel.getSkin(),
                    uid: this.userInfo.uid,
                    unionId: this.unionID
                });
                break;
            case 'phxz':
                AssetsManager.createDialog({
                    path: "res/prefab/union/partner/UnionModifyBalanceDialog",
                    userInfo: this.userInfo,
                    unionId: this.unionID,
                    bundle: ConfigModel.getSkin(),
                });
                this.onCloseClick();
                break;
            case 'swdz':
                let reqsData = {
                    unionID: this.unionID,
                    memberUid: this.userInfo.uid
                };
                ApiHall.addPartnerRequest(reqsData, () => {
                    AssetsManager.tipDialog(`玩家 ${this.userInfo.nickname} 已成功设置为对队长！`);
                    this.userInfo.partner = true;
                    this._optsSync();
                    MessageCallback.emitMessage('UnionMainMemberSync');
                    this.onCloseClick();
                });
                break;
            case 'qxdz':
                let reqxData = {
                    memberUid: this.userInfo.uid,
                    unionID: this.unionID,
                    operationUid: UserModel.getData('uid'),
                    isPartner: false
                };
                ApiHall.removeCaptainPartner(reqxData, () => {
                    AssetsManager.tipDialog(`玩家 ${this.userInfo.nickname} 已被取消队长身份！`);
                    this.userInfo.partner = false;
                    this._optsSync();
                    MessageCallback.emitMessage('UnionMainMemberSync');
                    this.onCloseClick();
                });
                break;
            case 'xgfs':
                AssetsManager.createDialog({
                    path: "res/prefab/union/partner/UnionChangeMemberScoreDialog",
                    bundle: ConfigModel.getSkin(),
                    unionID: this.unionID,
                    memberUid: this.userInfo.uid,
                    score: this.userInfo.score,
                    userInfo: this.userInfo,
                    unionOwnerID: this.unionOwnerID,
                    cb: () => {
                        this.onCloseClick();
                    }
                });
                break;
            case 'yxqx':
                if (!this.userInfo) return;
                let reqData = {
                    uid: this.userInfo.uid,
                    unionID: this.unionID
                };
                ApiHall.getUnionUserGameLimitRequest(reqData, (res) => {
                    if (res.code != 0) {
                        AssetsManager.tipDialog('获取游戏限制信息失败！');
                        return;
                    }
                    let limits = !res.msg || !res.msg.list ? [] : res.msg.list;
                    AssetsManager.createDialog({
                        path: "res/prefab/union/partner/UnionGameLimitDialog",
                        bundle: ConfigModel.getSkin(),
                        unionID: this.unionID,
                        uid: this.userInfo.uid,
                        limits: limits
                    });
                    this.onCloseClick();
                });
                break;
        }
    },

    onCloseClick() {
        if (this.node.getComponent('DialogWidgetCtrl')) {
            this.node.getComponent('DialogWidgetCtrl').out();
        } else {
            this.node.destroy();
        }
    },

});