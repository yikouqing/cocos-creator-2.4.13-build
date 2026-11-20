const MessageCallback = require('../../../utils/MessageCallback');
const AssetsManager = require('../../../utils/AssetsManager')
const Enums = require('../../../const/Enums');
const UserModel = require('../../../model/UserModel');
const ApiHall = require('../../../api/ApiHall');
const SubManager = require('../../../utils/SubManager');
const Utils = require('../../../utils/Utils');
const ABManager = require('../../../utils/ABManager');
const ConfigModel = require('../../../model/ConfigModel');
const NativeUtil = require('../../../utils/NativeUtil');
const CCUtil = require('../../../utils/CCUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        userInfoRoot: cc.Node,
        userItemWidgetPrefab: cc.Prefab,
        title: cc.Label,
        maxPlayer: cc.Label,
        baseTitle: cc.Label,
        baseScore: cc.Label,
        joinScore: cc.Label,
        dissScore: cc.Label,
        roomIdTitle: cc.Node,
        roomIdLbl: cc.Label,
        tableDesc: cc.RichText,
        enterBtn: cc.Node,
        joinBtn: cc.Node,
        watchBtn: cc.Node,
        dismissBtn: cc.Node,
        deleteBtn: cc.Node,
        modifyBtn: cc.Node,
        ruleTileRichColor: cc.Color,
        ruleContentRichColor: cc.Color,

        _users: [],
        _unionID: 0,
        _unionOwnerID: 0,
        _roomInfo: null,
        _unionInfo: null,
    },

    onLoad() {
        this._users = [];
        this._unionID = this.node.nodeParams.unionInfo.unionID;
        this._unionOwnerID = this.node.nodeParams.unionInfo.ownerUid;
        this._roomInfo = this.node.nodeParams.roomInfo;
        this._unionInfo = this.node.nodeParams.unionInfo;
        this.searchPlayer = this.node.nodeParams.searchPlayer
        MessageCallback.addListener('UpdateUnionInfo', this);
    },

    start() {
        this.updateRoomInfo(this._roomInfo);
    },

    onDestroy() {
        MessageCallback.removeListener('UpdateUnionInfo', this);
    },

    messageCallbackHandler(route, data) {
        switch (route) {
            case 'UpdateUnionInfo':
                if (!this._roomInfo.roomID) return;
                let roomList = data.msg.roomList;
                let roomInfo = roomList.find((item) => {
                    return item.roomID === this._roomInfo.roomID;
                })
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
        // console.log("房间信息", roomInfo);
        this._roomInfo = roomInfo;
        this.roomIdTitle.active = this._roomInfo.roomID > 0;
        this.roomIdLbl.string = !!this._roomInfo.roomID ? this._roomInfo.roomID : '';
        this._roomInfo._id = this._roomInfo._id || this._roomInfo.gameRule._id;
        let gameType = roomInfo.gameRule.gameType;
        this.title.string = ConfigModel.getGameName(gameType);
        let format = {
            isRichText: true,
            titleColor: this.ruleTileRichColor,
            contentColor: this.ruleContentRichColor,
            spacer: "\n"
        }
        let share = ConfigModel.getRoomRuleShare(roomInfo.gameRule, format);
        roomInfo.gameRule.curBureau = !roomInfo.curBureau ? 0 : roomInfo.curBureau;
        this.maxPlayer.string = `${(roomInfo.gameRule.maxPlayerCount || 0)}人`;
        if (this.baseTitle) this.baseTitle.string = `${share.baseTitle}:`;
        this.baseScore.string = `${share.baseScore}`;
        this.dissScore.string = !!roomInfo.gameRule.scoreDismissLimit ? Utils.formatNumberWithSymbol(roomInfo.gameRule.scoreDismissLimit || 0, 1) + '分' : '无';
        this.joinScore.string = !!roomInfo.gameRule.scoreLowLimit ? Utils.formatNumberWithSymbol(roomInfo.gameRule.scoreLowLimit || 0, 1) + '分' : '无';
        this.tableDesc.string = share.content;
        let roomUserInfoArr = roomInfo.roomUserInfoArr || []
        let roomUsers = this._userTakeSeatFilter(roomInfo.gameRule.maxPlayerCount, roomUserInfoArr);
        let loadUserCount = this._users.length;
        let loadUsers = this._users;
        if (roomUsers.length > loadUserCount) {
            for (let i = 0; i < roomUsers.length; ++i) {
                let user = roomUsers[i];
                if (!user) continue;
                if (i >= loadUserCount) {
                    let node = cc.instantiate(this.userItemWidgetPrefab);
                    let ctrl = node.getComponent("TableUserItem");
                    if (!ctrl) continue;
                    node.parent = this.userInfoRoot;
                    ctrl.bind(user);
                    this._users.push(ctrl);
                } else {
                    let ctrl = loadUsers[i];
                    if (!ctrl) continue;
                    ctrl.bind(user);
                }
            }
        } else {
            for (let i = 0; i < loadUsers.length; i++) {
                let ctrl = loadUsers[i];
                let user = roomUsers[i];
                if (!ctrl) continue;
                if (!user) {
                    ctrl.hide();
                } else {
                    ctrl.bind(user);
                }
            }
        }

        let unionInfo = UserModel.getData('unionInfo');
        let unionItem = unionInfo.find((e) => {
            return e.unionID === this._unionID;
        });
        this.enterBtn.active = (roomInfo.gameRule.gameType == Enums.bundleType.CX || roomInfo.gameRule.gameType == Enums.bundleType.DZPK) && !UserModel.isInRoom() && !this.searchPlayer;
        this.joinBtn.active = !this.enterBtn.active && !UserModel.isInRoom() && !this.searchPlayer;
        this.watchBtn.active = !!roomInfo.gameRule.canWatch && !this.enterBtn.active && !UserModel.isInRoom() && !this.searchPlayer;
        this.deleteBtn.active = (this._unionOwnerID === UserModel.getData('uid') || (!!unionItem && !!unionItem.manager)) && !this._roomInfo.roomID && !UserModel.isInRoom();
        this.modifyBtn.active = (this._unionOwnerID === UserModel.getData('uid') || (!!unionItem && !!unionItem.manager)) && !this._roomInfo.roomID && !UserModel.isInRoom();
        this.dismissBtn.active = (this._unionOwnerID === UserModel.getData('uid') || (!!unionItem && !!unionItem.manager)) && !!this._roomInfo.roomID && !UserModel.isInRoom();
    },

    _userTakeSeatFilter(total, users) {
        let seats = [];
        users.forEach(user => {
            if (!!user && user.chairID < total) {
                seats.push(user);
            }
        });
        return seats;
    },

    onBtnClick(event, parameter) {
        if (parameter === 'close') {
            if (this.node.getComponent('DialogWidgetCtrl')) {
                this.node.getComponent('DialogWidgetCtrl').out();
            } else {
                this.node.destroy();
            }
        } else if (parameter === 'dismiss') {
            if (!this._roomInfo.roomID) return;
            AssetsManager.popDialog({
                content: "是否确定要强制解散当前房间",
                ok: () => {
                    let reqData = {
                        unionID: this._unionID,
                        roomID: this._roomInfo.roomID
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
        } else if (parameter === 'modify') {
            if (!!this._roomInfo.roomID) {
                AssetsManager.tipDialog("游戏进行中不可修改玩法！");
                return;
            }
            if (this._unionInfo.unionType != Enums.UnionType.NORMAL) {
                AssetsManager.createDialog({
                    path: "res/prefab/union/manager/UnionAddRuleDialog",
                    bundle: ConfigModel.getSkin(),
                    gameRule: this._roomInfo.gameRule,
                    unionInfo: this._unionInfo,
                    from: 'detail',
                    cb: (gameType, ruleName, gameRule) => {
                        let reqData = {
                            unionID: this._unionID,
                            ruleID: this._roomInfo._id,
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
            } else {
                AssetsManager.createDialog({
                    bundle: ConfigModel.getSkin(),
                    path: "res/prefab/main/room/CreateRoomDialog",
                    isUnion: true,
                    gameRule: this._roomInfo.gameRule,
                    unionInfo: this._unionInfo,
                    cb: (node, gameRule) => {
                        let gameType = this._roomInfo.gameType || this._roomInfo.gameRule.gameType;
                        let ruleName = this._roomInfo.ruleName || this._roomInfo.gameRule.ruleName || ConfigModel.getGameName(this._roomInfo.gameType || this._roomInfo.gameRule.gameType);
                        let reqData = {
                            unionID: this._unionID,
                            ruleID: this._roomInfo._id,
                            gameType: gameType,
                            ruleName: ruleName,
                            roomRule: gameRule
                        };
                        ApiHall.updateRoomRuleListRequest(reqData, (res) => {
                            if (!!node && cc.isValid(node)) node.destroy();
                            AssetsManager.tipDialog("修改成功");
                            MessageCallback.emitMessage("UnionInfoSync");
                            this.node.destroy();
                        });
                    }
                });
            }
        } else if (parameter === 'delete') {
            if (!!this._roomInfo.roomID) {
                AssetsManager.tipDialog("游戏进行中不可删除玩法！");
                return;
            }
            AssetsManager.popDialog({
                content: "确定要删除当前玩法吗？",
                ok: () => {
                    let reqData = {
                        unionID: this._unionID,
                        roomRuleID: this._roomInfo._id
                    };
                    ApiHall.removeRoomRuleListRequest(reqData, (res) => {
                        AssetsManager.tipDialog("删除成功");
                        MessageCallback.emitMessage("UnionInfoSync");
                        this.node.destroy();
                    });
                },
                no: () => { }
            });
        } else if (parameter === 'rule') {
            if (!this._roomInfo) return;
            AssetsManager.ruleDialog({
                type: this._roomInfo.gameRule.gameType > 0 ? this._roomInfo.gameRule.gameType : -1
            })
        } else if (parameter === 'enter') {
            if (!this._roomInfo) return;
            //扯旋用
            if (!!CCUtil.clickInterval(event.target, 1.5)) return;
            this._onEnterClick(Enums.gameEnterType.WATCH);
        } else if (parameter === 'join') {
            if (!this._roomInfo) return;
            if (!!CCUtil.clickInterval(event.target, 1.5)) return;
            this._onEnterClick(Enums.gameEnterType.JOIN);
        } else if (parameter === 'look') {
            if (!this._roomInfo) return;
            if (!!CCUtil.clickInterval(event.target, 1.5)) return;
            this._onEnterClick(Enums.gameEnterType.WATCH);
        }
    },

    _onEnterClick(type) {
        let isDownload = SubManager.checkLoad(this._roomInfo.gameRule.gameType);
        let needUpdate = ABManager.checkUpdate(this._roomInfo.gameRule.gameType);
        let join = {
            union: this._unionInfo,
            room: this._roomInfo,
            type: type
        }
        if (!isDownload || !!needUpdate) {
            //调用下载页面
            AssetsManager.subLoadDialog({
                type: this._roomInfo.gameRule.gameType,
                action: !isDownload ? 1 : 2, //1-加载 2-更新
                roomInfo: this._roomInfo,
                cb: () => {
                    UserModel.joinUnionRoom(join);
                }
            })
            return;
        }
        UserModel.joinUnionRoom(join);
    },

});