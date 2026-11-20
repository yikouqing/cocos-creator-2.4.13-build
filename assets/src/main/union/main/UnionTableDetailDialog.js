const MessageCallback = require('../../../utils/MessageCallback');
const AssetsManager = require('../../../utils/AssetsManager')
const Enums = require('../../../const/Enums');
const UserModel = require('../../../model/UserModel');
const ApiHall = require('../../../api/ApiHall');
const ConfigModel = require('../../../model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        userInfoRoot: cc.Node,
        userItemWidgetPrefab: cc.Prefab,
        title: cc.Label,
        ruleInfo: cc.Label,
        enterBtn: cc.Node,
        dismissBtn: cc.Node,
        deleteBtn: cc.Node,
        modifyBtn: cc.Node,

        _unionInfo: null,
    },

    onLoad() {
        this._unionInfo = this.node.nodeParams && this.node.nodeParams.unionInfo ? this.node.nodeParams.unionInfo : null;
        this.unionID = this.node.nodeParams.unionInfo.unionID;
        this.unionOwnerID = this.node.nodeParams.unionInfo.ownerUid;
        this.updateRoomInfo(this.node.nodeParams.roomInfo);
        MessageCallback.addListener('UpdateUnionInfo', this);
    },

    start() { },

    onDestroy() {
        MessageCallback.removeListener('UpdateUnionInfo', this);
    },

    messageCallbackHandler(route, data) {
        switch (route) {
            case 'UpdateUnionInfo':
                if (!this.roomInfo.roomID) return;
                let roomList = data.msg.roomList;
                let roomInfo = roomList.find((item) => {
                    return item.roomID === this.roomInfo.roomID;
                });
                if (!roomInfo) {
                    AssetsManager.tipDialog("当前房间已解散");
                    this.node.destroy();
                } else {
                    this.updateRoomInfo(roomInfo);
                }
                break;
        }
    },

    updateRoomInfo(roomInfo) {
        this.roomInfo = roomInfo;
        let gameType = roomInfo.gameRule.gameType;
        this.title.string = roomInfo.ruleName || roomInfo.gameRule.ruleName || ConfigModel.getGameName(gameType);
        roomInfo.gameRule.curBureau = !roomInfo.curBureau ? 0 : roomInfo.curBureau;
        this.ruleInfo.string = '';
        this.userInfoRoot.removeAllChildren();
        if (!!roomInfo.roomUserInfoArr) {
            for (let i = 0; i < roomInfo.roomUserInfoArr; ++i) {
                let node = cc.instantiate(this.userItemWidgetPrefab);
                let ctrl = node.getComponent("TableUserItemWidgetCtrl");
                ctrl.initWidget(roomInfo.roomUserInfoArr[i]);
                node.parent = this.userInfoRoot;
            }
        }
        let unionInfo = UserModel.getData('unionInfo');
        let unionItem = unionInfo.find((e) => {
            return e.unionID === this.unionID;
        });
        this.enterBtn.active = false;
        this.deleteBtn.active = (this.unionOwnerID === UserModel.getData('uid') || (!!unionItem && !!unionItem.manager)) && !this.roomInfo.roomID;
        this.modifyBtn.active = (this.unionOwnerID === UserModel.getData('uid') || (!!unionItem && !!unionItem.manager)) && !this.roomInfo.roomID;
        this.dismissBtn.active = (this.unionOwnerID === UserModel.getData('uid') || (!!unionItem && !!unionItem.manager)) && !!this.roomInfo.roomID;
    },

    onBtnClick(event, parameter) {
        if (parameter === 'close') {
            if (this.node.getComponent('DialogWidgetCtrl')) {
                this.node.getComponent('DialogWidgetCtrl').out();
            } else {
                this.node.destroy();
            }
        } else if (parameter === 'dismiss') {
            if (!this.roomInfo.roomID) return;
            AssetsManager.popDialog({
                content: "是否确定要强制解散当前房间",
                ok: () => {
                    let reqData = {
                        unionID: this.unionID,
                        roomID: this.roomInfo.roomID
                    };
                    ApiHall.dismissRoomRequest(reqData, (res) => {
                        AssetsManager.tipDialog("解散成功");
                        MessageCallback.emitMessage("UnionInfoSync");
                        if (!cc.isValid(this.node)) return
                        if (this.node.getComponent('DialogWidgetCtrl')) {
                            this.node.getComponent('DialogWidgetCtrl').out();
                        } else {
                            this.node.destroy();
                        }
                    });
                },
                no: () => { }
            });
        } else if (parameter === 'enter') { } else if (parameter === 'modify') {
            if (!!this.roomInfo.roomID) {
                AssetsManager.tipDialog("游戏进行中不可修改玩法！");
                return;
            }
            AssetsManager.createDialog({
                path: "res/prefab/union/manager/UnionAddRuleDialog",
                bundle: ConfigModel.getSkin(),
                gameRule: this.roomInfo,
                from: 'detail',
                unionInfo: this._unionInfo,
                cb: (gameType, ruleName, gameRule) => {
                    let reqData = {
                        unionID: this.unionID,
                        ruleID: this.roomInfo._id,
                        gameType: gameType,
                        ruleName: ruleName,
                        roomRule: gameRule
                    };
                    ApiHall.updateRoomRuleListRequest(reqData, (res) => {
                        AssetsManager.tipDialog("修改成功");
                        MessageCallback.emitMessage("UnionInfoSync");
                        this.node.destroy();
                    });
                }
            });
        } else if (parameter === 'delete') {
            if (!!this.roomInfo.roomID) {
                AssetsManager.tipDialog("游戏进行中不可删除玩法！");
                return;
            }
            AssetsManager.popDialog({
                content: "确定要删除当前玩法吗？",
                ok: () => {
                    let ruleId = this.roomInfo._id || this.roomInfo.gameRule._id;
                    let reqData = {
                        unionID: this.unionID,
                        roomRuleID: ruleId
                    };
                    ApiHall.removeRoomRuleListRequest(reqData, (res) => {
                        AssetsManager.tipDialog("删除成功");
                        MessageCallback.emitMessage("UnionInfoSync");
                        this.node.destroy();
                    });
                },
                no: () => { }
            });
        }
    },
});