const MessageCallback = require('../../../utils/MessageCallback');
const AssetsManager = require('../../../utils/AssetsManager')
const CCUtil = require('../../../utils/CCUtil');
const Configs = require('../../../const/Configs');
const UserModel = require('../../../model/UserModel');
const ApiHall = require('../../../api/ApiHall');
const SubManager = require('../../../utils/SubManager');
const Utils = require('../../../utils/Utils');
const ConfigModel = require('../../../model/ConfigModel');
const ApiRoom = require('../../../api/ApiRoom');
const Enums = require('../../../const/Enums');
const ABManager = require('../../../utils/ABManager');
const NativeUtil = require("../../../utils/NativeUtil");
const CacheManager = require("../../../utils/CacheManager");

cc.Class({
    extends: cc.Component,

    properties: {
        tableClassBtnCtrl: require('UnionTableClassBtnCtrl'),
        tableItemWidgetPrefab: cc.Prefab,
        gameFilterItem: cc.Prefab,
        mainBottomNode: cc.Node,
        mainTopRightNode: cc.Node,
        moreButonNode: cc.Node,
        memberNumber: cc.RichText,//人数
        memberColor: cc.Color,
        allMemberColor: cc.Color,
        tableList: cc.Node,
        gameFilterList: cc.Node,
        unionName: cc.Label,
        unionId: cc.Label,
        score: cc.Label,
        playingCount: cc.Label,
        partnerNode: cc.Node,
        broadcastTarget: cc.Node,
        unionBgSprite: cc.Sprite,
        closedTip: cc.Node,
        unionActiveNode: cc.Node,
        singleRankNode: cc.Node,
        tableOrder: cc.Node,
        tableOrderCheck: cc.Node,
        hongBaoNode: cc.Node,
        btnTeam: cc.Node,
        btnRank: cc.Node,
        btnRecord: cc.Node,
        btnManager: cc.Node,
        btnHongbao: cc.Node,
        btnCard: cc.Node,
        btnSkin: cc.Node,
        btnAddRule: cc.Node,
        btnTransfer: cc.Node,
        btnApplyss: cc.Node,
        btnAllGamessss: cc.Node,
        btnJiFenChi: cc.Node,
        btnJieSan: cc.Node,
        btnShuJu: cc.Node,
        btnRules: cc.Node,
        btnUserScoreDetail: cc.Node,
        inviteBtn: cc.Toggle,
        inviteLabel: cc.Label,
        btnQuickJoin: cc.Node,
        btnRoomReturn: cc.Node,
        fullTableCountLbl: cc.Label,
        freeTableCountLbl: cc.Label,
        btnUnionSwitch: cc.Node,
        filterList: cc.Node,
        btnShowFilter: cc.Node,
        btnHideFilter: cc.Node,
        unionCopyBtn: cc.Node,
        unionInfo: cc.Node,
        uidEdit: cc.EditBox,
        scoreNode: cc.Node,
        btnSafeBox: cc.Node,
        applyJoinRedBar: cc.Node,
        menuLayList: cc.Node,

        _tableAddItem: null, //空桌添加玩法
        _unionInfo: null, //联盟信息
        _roomList: [], //房间列表
        _roomRuleList: [], //房间数量
        _roomListItem: [], //牌桌节点
        _gameFilterItem: [], //类型筛选
        _selectGameType: -1, //游戏类型选择
        _selectGameRule: null,
        _curShowCount: 10, //默认加载8个
        _totalShowCount: 0,
        _userGameLimit: [],
        _tableFilterListPos: null,
        _hasNewApply: false,//是否有新的申请列表未处理

    },

    onLoad() { },

    start() {
        AssetsManager.init(this.node);
        this._sceneInit();
        this._updateUnionState();
        this._unionBgInit();
        this._handlerInit();
        this._unionInit();
        this._activeSync();
        // this._roomCheck();
    },

    _sceneInit() {
        this._tableFilterListPos = {
            show: cc.v2(),
            hide: cc.v2()
        }
        if (this.btnUnionSwitch) this.btnUnionSwitch.active = cc.sys.isBrowser || ConfigModel.getData('canUnionSwitch');
        this.onSettingClick = 0;
        this.filterList.getComponent(cc.Widget) && this.filterList.getComponent(cc.Widget).updateAlignment();
        this._tableFilterListPos.show = this.filterList.getPosition();
        let viewSize = CCUtil.getViewSize();
        let hidePosY = (viewSize.height + this.filterList.height) / 2;
        this._tableFilterListPos.hide = cc.v2(this._tableFilterListPos.show.x, -hidePosY);
        this.filterList.setPosition(this._tableFilterListPos.show);
        this._curShowCount = 10;
        this._roomList = [];
        this._roomRuleList = [];
        this.btnAddRule.active = false;
        this.unionID = UserModel.getOpUnionId();
        let union = UserModel.getData('curUnionData')
        this._unionInfo = union && union.unionInfo ? union.unionInfo : null;
        this._selectGameType = UserModel.getGameSelected();
        UserModel.setOpUnionId(this.unionID);
        this.tableClassBtnCtrl.initWidget(this);
    },

    _roomMessage(msg) {
        if (!msg.data) return;
        if (msg.type === ApiRoom.USER_LEAVE_ROOM_PUSH) {
            if (!msg.data.roomUserInfo) return;
            let user = msg.data.roomUserInfo;
            if (user.uid != UserModel.getData('uid')) return;
            this.unscheduleAllCallbacks();
            this._unionInfoSync();
        }
    },

    _activeSync() {
        let unionItem = UserModel.getUserUnion(this.unionID)
        this.inviteBtn.node.active = !!ConfigModel.getData('unionInvite') && unionItem && unionItem.isInvite;
    },

    _roomReturnSync() {
        this.btnQuickJoin.active = !UserModel.isInRoom();
        this.btnRoomReturn.active = !this.btnQuickJoin.active;
    },

    _unionBgInit() {
        let unionBg = 0;
        let gameInvite = CacheManager.getItem("gameInvite");
        this.inviteLabel.string = parseInt(gameInvite) == 1 ? '接受' : '拒绝'
        this.inviteBtn.isChecked = parseInt(gameInvite) == 1;
        let canUnionOwnerModifySkin = parseInt(ConfigModel.getData('canUnionOwnerModifySkin'));
        canUnionOwnerModifySkin = isNaN(canUnionOwnerModifySkin) ? 0 : canUnionOwnerModifySkin;
        if (canUnionOwnerModifySkin == 1 || canUnionOwnerModifySkin == 0) {
            let userUnionItem = UserModel.getUserUnion(this.unionID);
            unionBg = !!userUnionItem && userUnionItem.unionBg >= 0 ? userUnionItem.unionBg : 0;
        } else {
            unionBg = CacheManager.getItem("unionBg");
            unionBg = parseInt(unionBg) >= 0 ? parseInt(unionBg) : 0;
        }
        let unionBacgroundName = 'unionBg';
        if (unionBg > 0) {
            unionBacgroundName = `unionBg${unionBg}`;
        }
        let img = `res/sprite/unionbg/${unionBacgroundName}`;
        AssetsManager.loadSpriteFrame({
            bundle: ConfigModel.getSkin(Enums.bundleType.UNION),
            path: img,
            sprite: this.unionBgSprite
        });
    },

    _updateBackground() {
        let unionBg = 0;
        let canUnionOwnerModifySkin = parseInt(ConfigModel.getData('canUnionOwnerModifySkin'))
        if (canUnionOwnerModifySkin == 1 || canUnionOwnerModifySkin == 0) {
            unionBg = this._unionInfo && this._unionInfo.unionBg >= 0 ? this._unionInfo.unionBg : 0;
        } else {
            unionBg = CacheManager.getItem("unionBg");
            unionBg = parseInt(unionBg) >= 0 ? parseInt(unionBg) : 0;
        }
        let unionBacgroundName = 'unionBg';
        if (unionBg > 0) {
            unionBacgroundName = `unionBg${unionBg}`;
        }
        let img = `res/sprite/unionbg/${unionBacgroundName}`;
        AssetsManager.loadSpriteFrame({
            bundle: ConfigModel.getSkin(Enums.bundleType.UNION),
            path: img,
            sprite: this.unionBgSprite
        });
    },

    _updateUnionState() {
        if (this.btnHongbao) this.btnHongbao.active = false;
        this.applyJoinRedBar.active = false;
        let userUnionItem = UserModel.getUserUnion(this.unionID);
        let unionInfoItem = UserModel.getUnionInfo(this.unionID);
        let isManager = !!unionInfoItem && !!unionInfoItem.manager;
        let isPartner = !!unionInfoItem && !!unionInfoItem.partner;
        let isMatch = !!this._unionInfo && this._unionInfo.unionType != Enums.UnionType.NORMAL;
        let isOwner = !!userUnionItem && userUnionItem.ownerUid == UserModel.getData('uid');
        let showRank = !!this._unionInfo && !!this._unionInfo.showRank;
        let rankConfig = cc.sys.isBrowser || ConfigModel.getData('unionRankEnable');
        if (this.btnSkin) this.btnSkin.active = !!isOwner;
        if (this.scoreNode) this.scoreNode.active = !!isMatch;
        if (this.btnSafeBox) this.btnSafeBox.active = !!isMatch;
        if (this.tableOrder) this.tableOrder.active = !!isOwner;
        if (this.btnAddRule) this.btnAddRule.active = !!isOwner || !!isManager;
        if (this.btnManager) this.btnManager.active = !!isOwner || !!isManager; //按钮管理
        if (this.btnApplyss) this.btnApplyss.active = (!!isOwner || isManager);
        if (this.btnAllGamessss) this.btnAllGamessss.active = (!!isOwner || !!isManager); //全部游戏按钮
        if (this.partnerNode) this.partnerNode.active = !isPartner && !!isMatch;
        if (this.btnRank) this.btnRank.active = (!!isOwner || !!isManager) && !!isMatch && !!showRank && rankConfig;
        if (this.btnRecord) this.btnRecord.active = !!isOwner || !!isManager || !!isPartner; //按钮团队
        if (this.btnTeam) this.btnTeam.active = !!isOwner || !!isManager || !!isPartner; //按钮团队
        if (this.btnCard) this.btnCard.active = !!isOwner || !!isManager || !!isPartner;
        if (this.btnTransfer) this.btnTransfer.active = !!ConfigModel.getData('unionScoreTransfer') && !!isMatch;
        if (this.btnJiFenChi) this.btnJiFenChi.active = !!isOwner || !!isPartner;
        if (this.btnJieSan) this.btnJieSan.active = !!isOwner || !!isManager;
        if (this.btnShuJu) this.btnShuJu.active = !!isOwner || !!isManager;
        if (this.btnRules) this.btnRules.active = !!isOwner || !!isManager;
        if (!!isOwner || !!isManager) {
            ApiHall.askJoinUnionListRequest({ unionID: this.unionID }, (res) => {
                if (!cc.isValid(this.applyJoinRedBar)) return;
                let show = (res.code == 0) && !!res.list.length;
                this.applyJoinRedBar.active = show;
                this._hasNewApply = !!show;
                MessageCallback.emitMessage('OnApplyJoinStatusSync', show);
            });
        }
    },

    _handlerInit() {
        MessageCallback.addListener('RoomMessagePush', this);
        MessageCallback.addListener('UnionListSync', this);
        MessageCallback.addListener('SelfEntryRoomPush', this);
        MessageCallback.addListener('UpdateUserInfoPush', this);
        MessageCallback.addListener('ReconnectSuccess', this);
        MessageCallback.addListener('ServerDisconnection', this);
        MessageCallback.addListener('JoinRoomFailed', this);
        MessageCallback.addListener('CreateRoomFail', this);
        MessageCallback.addListener('UpdateHallBgm', this);
        MessageCallback.addListener('UnionInfoSync', this);
        MessageCallback.addListener('OnUnionServiceFeeUpdate', this);
        MessageCallback.addListener('OnUnionDismissSync', this);
        MessageCallback.addListener('OnUnionPumpUpdate', this);
        MessageCallback.addListener('OnGameRuleSelectedByID', this);
        MessageCallback.addListener('OnUnionSkinSync', this);
    },

    _handlerRelease() {
        MessageCallback.removeListener('OnUnionDismissSync', this);
        MessageCallback.removeListener('OnUnionPumpUpdate', this);
        MessageCallback.removeListener('OnGameRuleSelectedByID', this);
        MessageCallback.removeListener('OnUnionSkinSync', this);
        MessageCallback.removeListener('OnUnionServiceFeeUpdate', this);
        MessageCallback.removeListener('RoomMessagePush', this);
        MessageCallback.removeListener('UnionListSync', this);
        MessageCallback.removeListener('SelfEntryRoomPush', this);
        MessageCallback.removeListener('UpdateUserInfoPush', this);
        MessageCallback.removeListener('ReconnectSuccess', this);
        MessageCallback.removeListener('ServerDisconnection', this);
        MessageCallback.removeListener('JoinRoomFailed', this);
        MessageCallback.removeListener('CreateRoomFail', this);
        MessageCallback.removeListener('UpdateHallBgm', this);
        MessageCallback.removeListener('UnionInfoSync', this);
        AssetsManager.release();
    },

    _onGameRuleSelectedByID(room) {
        if (this._selectGameType > 0) {
            if (!!this._selectGameRule) {
                let ruleId = room._id || room.gameRule._id;
                let selectedRuleId = this._selectGameRule._id || this._selectGameRule.gameRule._id;
                if (ruleId == selectedRuleId) return;
                this._selectGameRule = room;
                this._curShowCount = 10;
            } else {
                this._selectGameRule = room;
            }
            this._selectGameType = room.gameType || room.gameRule.gameType;
        } else {
            this._selectGameType = room.gameType || room.gameRule.gameType;
            this._selectGameRule = null;
            this._curShowCount = 10;
        }
        this._updateTableList(this._selectGameType);
    },

    _onUnionServiceFeeUpdate(data) {
        this._unionInfo = this._unionInfo || {};
        this._unionInfo.serverScore = data;
    },

    _onUnionPumpUpdate(pumpWaterPattern) {
        this._unionInfo = this._unionInfo || {};
        this._unionInfo.pumpWaterPattern = pumpWaterPattern;
    },

    _roomCheck() {
        //玩家在房间
        let roomID = UserModel.getData('roomID');
        let gameType = UserModel.getData('gameType');
        if (UserModel.isInRoom() && parseInt(gameType) > 0) {
            this._onRelease(Enums.bundleType.GAME);
        }
    },

    onDestroy() {
        ConfigModel.setData('lastScene', 'union');
        this._handlerRelease();
    },

    messageCallbackHandler(route, data) {
        switch (route) {
            case 'RoomMessagePush':
                this._roomMessage(data);
                break;
            case 'UnionListSync':
                this._activeSync();
                break;
            case 'SelfEntryRoomPush':
                this._onRelease(Enums.bundleType.GAME);
                break;
            case 'UpdateUserInfoPush':
                this._updatePlayerInfo();
                break;
            case 'ReconnectSuccess':
                this._unionInfoSync();
                this._roomCheck();
                break;
            case 'ServerDisconnection':
                this.unscheduleAllCallbacks();
                break;
            case 'UnionInfoSync':
                this._unionInfoSync();
                break;
            case 'JoinRoomFailed':
            case 'CreateRoomFail':
                AssetsManager.clearDialog(['HoldDialog']);
                break;
            case 'OnUnionServiceFeeUpdate':
                this._onUnionServiceFeeUpdate(data);
                break;
            case 'OnUnionDismissSync':
                this._onUnionDismissSync(data);
                break;
            case 'OnUnionPumpUpdate':
                this._onUnionPumpUpdate(data);
                break;
            case 'OnGameRuleSelectedByID':
                this._onGameRuleSelectedByID(data);
                break;
            case 'OnUnionSkinSync':
                this._onUnionSkinSync(data);
                break;
        }
    },

    _onUnionSkinSync(data) {
        if (data.syncType != 0) return;
        let unionBg = 0;
        let canUnionOwnerModifySkin = parseInt(ConfigModel.getData('canUnionOwnerModifySkin'))
        if (canUnionOwnerModifySkin == 1 || canUnionOwnerModifySkin == 0) {
            unionBg = data.value;
        } else {
            unionBg = CacheManager.getItem("unionBg");
            unionBg = parseInt(unionBg) >= 0 ? parseInt(unionBg) : 0;
        }
        let unionBgName = 'unionBg';
        if (unionBg > 0) {
            unionBgName = `unionBg${unionBg}`;
        }
        let img = `res/sprite/unionbg/${unionBgName}`;
        AssetsManager.loadSpriteFrame({
            bundle: ConfigModel.getSkin(Enums.bundleType.UNION),
            path: img,
            sprite: this.unionBgSprite
        });
    },

    onBtnClick(event, parameter) {
        if (UserModel.isInRoom() && parameter != 'allgames') {
            AssetsManager.popDialog({
                content: `您正在游戏中，是否立即返回房间？`,
                ok: this._roomCheck.bind(this),
                no: () => { }
            });
            return;
        }
        if (parameter === 'back') {
            this._onRelease(Enums.bundleType.HALL);
        } else if (parameter === 'unionManager') {
            if (!this._isInUnion()) return;
            if (!this._unionInfo) return;
            if (!!UserModel.isInRoom()) {
                AssetsManager.tipDialog('您正在游戏中，不能使用管理功能！');
                return;
            }
            let unionInfoItem = UserModel.getUnionInfo(this.unionID);
            if (this._unionInfo.ownerUid == UserModel.getData('uid') ||
                unionInfoItem.manager) {
                AssetsManager.createDialog({
                    path: "res/prefab/union/manager/UnionNewManagerDialog",
                    bundle: ConfigModel.getSkin(),
                    unionInfo: this._unionInfo,
                    hasNewApply: this._hasNewApply,
                    updateUnion: this._unionInfoSync.bind(this)
                });
                return;
            }
            AssetsManager.tipDialog("盟主或管理员才可以操作!");
        } else if (parameter === 'switchUnion') {
            if (!this._unionInfo) return;
            ApiHall.getUserUnionListRequest((res) => {
                AssetsManager.createDialog({
                    path: "res/prefab/union/list/UnionListDialog",
                    bundle: ConfigModel.getSkin(),
                    recordArr: res.msg.recordArr,
                    cb: (unionID) => {
                        if (unionID !== this.unionID) {
                            //不是同一个
                            this._selectGameType = -1;
                            this._selectGameRule = null;
                            this.unionID = unionID;
                            this._unionInfoSync();
                        }
                    }
                });
            });
        } else if (parameter === 'memberList'
            || parameter === 'newMembers'
            || parameter === 'shuju') {
            if (!this._isInUnion()) return;
            if (!this._unionInfo) return;
            if (!!UserModel.isInRoom()) {
                AssetsManager.tipDialog('您正在游戏中，无法使用团队功能！');
                return;
            }
            let showPages = null;
            if (parameter == 'newMembers') {
                showPages = ['allmembers', 'tuanduitongji', 'mymember', 'partner', 'geli', 'apply', 'myrebate', 'gaifen'];
            } else if (parameter == 'shuju') {
                showPages = ['jingying', 'jifen', 'jifenrizhi'];
            }
            AssetsManager.unionTeamDialog({
                showPages: showPages
            });
        } else if (parameter === 'safeBox') {
            if (!this._isInUnion()) return;
            if (!this._unionInfo) return;
            if (!!UserModel.isInRoom()) {
                AssetsManager.tipDialog('您正在游戏中，不能使用保险柜功能！');
                return;
            }
            AssetsManager.createDialog({
                path: "res/prefab/union/main/UnionBankDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this.unionID
            });
        } else if (parameter === 'memberManager') {
            if (!this._isInUnion()) return;
            if (!this._unionInfo) return;
            let unionInfoItem = UserModel.getUnionInfo(this.unionID);
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/UnionLowMemberListDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this.unionID,
                unionOwnerID: this._unionInfo.ownerUid,
                unionInfo: this._unionInfo,
                userInfo: {
                    uid: UserModel.getData('uid'),
                    avatar: UserModel.getData('avatar'),
                    nickname: UserModel.getData('nickname'),
                    score: unionInfoItem.score,
                    yesterdayDraw: unionInfoItem.yesterdayDraw,
                    yesterdayProvideRebate: unionInfoItem.yesterdayProvideRebate,
                    yesterdayBigWinDraw: unionInfoItem.yesterdayBigWinDraw,
                    totalDraw: unionInfoItem.totalDraw
                }
            });
        } else if (parameter === 'partnerManager') {
            if (!this._isInUnion()) return;
            if (!this._unionInfo) return;
            let unionInfoItem = UserModel.getUnionInfo(this.unionID);
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/UnionPartnerListDialog",
                bundle: ConfigModel.getSkin(),
                unionInfo: this._unionInfo,
                unionID: this.unionID,
                userInfo: {
                    uid: UserModel.getData('uid'),
                    avatar: UserModel.getData('avatar'),
                    nickname: UserModel.getData('nickname'),
                    score: unionInfoItem.score,
                    yesterdayDraw: unionInfoItem.yesterdayDraw,
                    yesterdayProvideRebate: unionInfoItem.yesterdayProvideRebate,
                    yesterdayBigWinDraw: unionInfoItem.yesterdayBigWinDraw,
                    totalDraw: unionInfoItem.totalDraw
                }
            });
        } else if (parameter === 'scoreManager') {
            if (!this._isInUnion()) return;
            if (!this._unionInfo) return;
            let unionInfoItem = UserModel.getUnionInfo(this.unionID);
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/UnionMemberScoreListDialog",
                bundle: ConfigModel.getSkin(),
                isSeting: false,
                unionID: this.unionID,
                unionOwnerID: this._unionInfo.ownerUid,
                userInfo: {
                    uid: UserModel.getData('uid'),
                    avatar: UserModel.getData('avatar'),
                    nickname: UserModel.getData('nickname'),
                    score: unionInfoItem.score,
                    yesterdayDraw: unionInfoItem.yesterdayDraw,
                    yesterdayProvideRebate: unionInfoItem.yesterdayProvideRebate,
                    yesterdayBigWinDraw: unionInfoItem.yesterdayBigWinDraw,
                    totalDraw: unionInfoItem.totalDraw
                }
            });
        } else if (parameter === 'settings') {
            if (!this._unionInfo) return;
            AssetsManager.setDialog({
                type: "union",
            });
        } else if (parameter === 'invite') {
            if (!this._isInUnion()) return;
            if (!this._unionInfo) return;
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/AddMemberDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this._unionInfo.unionID
            });
        } else if (parameter === 'giveScore') {
            if (!this._isInUnion()) return;
            if (!this._unionInfo) return;
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/GiveScoreDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this._unionInfo.unionID,
                unionOwnerID: this._unionInfo.ownerUid
            });
        } else if (parameter === 'gameRecord') {
            if (!this._isInUnion()) return;
            if (!this._unionInfo) return;
            AssetsManager.createDialog({
                path: "res/prefab/main/record/GameUnionRecordDialog",
                bundle: ConfigModel.getSkin(),
                uid: UserModel.getData('uid'),
                unionID: this._unionInfo.unionID,
                type: "union"
            });
        } else if (parameter === 'rank') {
            if (!this._isInUnion()) return;
            if (!this._unionInfo) return;
            AssetsManager.createDialog({
                path: "res/prefab/union/manager/UnionRankDialog",
                bundle: ConfigModel.getSkin(),
                unionInfo: this._unionInfo
            });
        } else if (parameter === 'unionActive') {
            if (!this._isInUnion()) return;
            if (!this._unionInfo) return;
            AssetsManager.createDialog({
                path: "res/prefab/union/main/UnionActiveDialog",
                bundle: ConfigModel.getSkin(),
                unionInfo: this._unionInfo
            });
        } else if (parameter === 'singleRank') {
            if (!this._isInUnion()) return;
            if (!this._unionInfo) return;
            AssetsManager.createDialog({
                path: "res/prefab/union/main/UnionSingleDrawRankDialog",
                bundle: ConfigModel.getSkin(),
                unionInfo: this._unionInfo
            });
        } else if (parameter === 'quickJoin') {
            if (!this._isInUnion()) return;
            if (!this._unionInfo) return;
            let unionInfoItem = UserModel.getUnionInfo(this.unionID);
            let userScore = unionInfoItem.score

            if (userScore < 0) {
                AssetsManager.tipDialog('积分不足，无法加入房间');
                return;
            }
            if (!this._unionInfo.opening) {
                AssetsManager.tipDialog('联盟已打烊，暂不可进入房间！');
                return;
            }
            let leachList = [
                Enums.bundleType.BRNN, //百人牛牛
                Enums.bundleType.BRLHD, //百人龙虎斗
            ];
            let quickFilter = this._getQuickJoinRoom(leachList);
            let userRooms = quickFilter.userRooms;
            let emptyRooms = quickFilter.emptyRooms;
            let rooms = userRooms.concat(emptyRooms);
            if (cc.sys.isBrowser || !!ConfigModel.getData('showQuickJoinList')) {
                AssetsManager.createDialog({
                    path: "res/prefab/union/main/UnionQuickJoinDialog",
                    bundle: ConfigModel.getSkin(),
                    roomList: rooms,
                    unionInfo: this._unionInfo
                });
            } else if (!!quickFilter.room) {
                this._onEnterClick(event, quickFilter.room)
            }
        } else if (parameter === 'hongbao') {
            if (!this._isInUnion()) return;
            if (!this._unionInfo) return;
            AssetsManager.createDialog({
                path: "res/prefab/union/manager/UnionHongBaoDialog",
                bundle: ConfigModel.getSkin(),
                unionInfo: this._unionInfo
            });
        } else if (parameter === 'btnMore') {
            if (!this._isInUnion()) return;
            this.moreButonNode.active = !this.moreButonNode.active;
        } else if (parameter === 'tableOrder') {
            if (!this._isInUnion()) return;
            if (!this._unionInfo) return;
            let tableSort = !!this._unionInfo && this._unionInfo.tableSort == 1 ? 0 : 1;
            let reqData = {
                unionID: this._unionInfo.unionID,
                tableSort: tableSort,
            };
            ApiHall.updateUnionTableSortRequest(reqData, (res) => {
                this._unionInfo.tableSort = res.msg.tableSort;
                this.tableOrderCheck.active = res.msg.tableSort == 1;
                this._updateTableList(this._selectGameType);
            });
        } else if (parameter === 'addRule') {
            if (!this._isInUnion()) return;
            if (!this._unionInfo) return;
            let unionInfoItem = UserModel.getUnionInfo(this.unionID);
            if (this._unionInfo.ownerUid == UserModel.getData('uid') ||
                (!!unionInfoItem && !!unionInfoItem.manager)) {
                AssetsManager.createDialog({
                    path: "res/prefab/main/room/CreateRoomDialog",
                    bundle: ConfigModel.getSkin(),
                    isUnion: true,
                    from: 'union',
                    unionInfo: this._unionInfo,
                    unionID: this.unionID,
                    cb: (node, gameRule) => {
                        node.destroy();
                        gameRule.ruleName = !gameRule.ruleName ? ConfigModel.getGameName(gameRule.gameType) : gameRule.ruleName;
                        this.addCallback(gameRule.gameType, gameRule.ruleName, gameRule);
                        // AssetsManager.createDialog({
                        //     path: "res/prefab/union/manager/UnionAddRuleDialog",
                        //     bundle: ConfigModel.getSkin(),
                        //     gameRule: gameRule,
                        //     unionInfo: this._unionInfo,
                        //     cb: this.addCallback.bind(this),
                        //     node: node
                        // });
                    }
                });
                return;
            }
            AssetsManager.tipDialog('盟主和管理员才能添加玩法！');
        } else if (parameter === 'vcard') {
            if (!this._isInUnion()) return;
            AssetsManager.createDialog({
                path: "res/prefab/union/main/UnionMingPianDialog",
                bundle: ConfigModel.getSkin(),
                unionInfo: this._unionInfo
            })
        } else if (parameter === 'skin') {
            if (!this._isInUnion()) return;
            AssetsManager.createDialog({
                path: "res/prefab/union/main/UnionSettingDialog",
                bundle: ConfigModel.getSkin(),
                unionInfo: this._unionInfo
            })
        } else if (parameter === 'allgames') {
            if (!this._isInUnion()) return;
            if (!this._unionInfo) return;
            this.tableClassBtnCtrl && this.tableClassBtnCtrl.syncGameCheck(-1);
            this.onGameTypeClick(-1); //对象传递
        } else if (parameter === 'scorerecord') {
            if (!this._isInUnion()) return;
            if (!this._unionInfo) return;
            AssetsManager.createDialog({
                path: 'res/prefab/union/partner/UnionUserScoreDetailDialog',
                bundle: ConfigModel.getSkin(),
                unionID: this._unionInfo.unionID
            })
        } else if (parameter === 'zhuanzhang') {
            if (!this._isInUnion()) return;
            if (!!UserModel.isInRoom()) {
                AssetsManager.tipDialog('您正在游戏中，不能使用赠送积分功能！');
                return;
            }
            let unionInfoItem = UserModel.getUnionInfo(this.unionID);
            AssetsManager.createDialog({
                path: "res/prefab/union/manager/UnionPresentDialog",
                bundle: ConfigModel.getSkin(),
                unionInfo: this._unionInfo,
                myScore: unionInfoItem.score
            });
        } else if (parameter == 'inviteBtn') {
            if (!this._isInUnion()) return;
            if (this.inviteBtn.isChecked) {
                CacheManager.setItem('gameInvite', '1')
                this.inviteLabel.string = '接受'
            } else {
                CacheManager.setItem('gameInvite', '0')
                this.inviteLabel.string = '拒绝'
            }
        } else if (parameter === 'roomReturn') {
            if (!this._isInUnion()) return;
            if (!UserModel.isInRoom()) return;
            this._roomCheck();
        } else if (parameter === 'unionList') {
            this._showUnionList();
        } else if (parameter === 'showFilter') {
            this.filterList.active = true
            this.filterList.stopAllActions();
            this.filterList.setPosition(this._tableFilterListPos.hide);
            if (this.btnHideFilter) this.btnHideFilter.active = true;
            if (this.btnShowFilter) this.btnShowFilter.active = false;
            cc.tween(this.filterList)
                .to(0.3, {
                    position: cc.v3(this._tableFilterListPos.show)
                })
                .start();
        } else if (parameter === 'hideFilter') {
            this.filterList.active = false
            this.filterList.stopAllActions();
            this.filterList.setPosition(this._tableFilterListPos.show);
            if (this.btnHideFilter) this.btnHideFilter.active = false;
            if (this.btnShowFilter) this.btnShowFilter.active = true;
            cc.tween(this.filterList)
                .to(0.3, {
                    position: cc.v3(this._tableFilterListPos.hide)
                })
                .start();
        } else if (parameter === 'copy') {
            if (!this._isInUnion()) return;
            NativeUtil.copyText(this.unionName.string)
        } else if (parameter === 'idsearch') {
            if (!this._isInUnion()) return;
            let searchPlayer = true
            this._onUserSearch(searchPlayer);
        } else if (parameter === 'newallgames') {
            if (!this._isInUnion()) return;
            if (!this._unionInfo) return;
            this.tableClassBtnCtrl && this.tableClassBtnCtrl.syncGameCheck(-1);
            this.onGameTypeClick(-1); //对象传递
            let rooms = this._getTableListFilter();
            AssetsManager.createDialog({
                path: "res/prefab/union/main/UnionFilterGameDialog",
                bundle: ConfigModel.getSkin(),
                unionInfo: this._unionInfo,
                rooms: rooms.slice(),
                addCallback: this.addCallback.bind(this)
            });
        } else if (parameter === 'ruls') {
            AssetsManager.ruleDialog({
                type: -1,
            })
        } else if (parameter === 'apply') {
            AssetsManager.unionTeamDialog({
                showPages: ['apply']
            });
        } else if (parameter === 'rightMain') {
            this._onMenuListShow();
        } else if (parameter === 'jiesan') {
            this._onDisRoom();
        } else if (parameter === 'jifenchi') {
            this._onRebateDraw();
        } else if (parameter === 'rules') {
            this._onRulesShow();
        }
    },

    // 熊猫菜单展示
    _onMenuListShow() {
        if (this.onSettingClick == 0) {
            this.onSettingClick = 1;
            this.menuLayList.stopAllActions();
            this.menuLayList.active = true;
            this.menuLayList.opcity = 0;
            this.menuLayList.scale = 0;
            cc.tween(this.menuLayList).to(0.1, {
                opacity: 255,
            }).by(0.2, { scale: 1 })
                .start();

        } else {
            this.onSettingClick = 0;
            this.menuLayList.stopAllActions();
            cc.tween(this.menuLayList).to(0.1, {
                opacity: 0,
                scale: 0
            }).call(() => {
                this.menuLayList.active = false;
            })
                .start();

        }

    },

    _onRulesShow() {
        if (!this._unionInfo) return;
        AssetsManager.createDialog({
            path: "res/prefab/union/main/UnionRuleChooseListDialog",
            bundle: ConfigModel.getSkin(),
            unionInfo: this._unionInfo,
            cb: (res) => {

            },
        });
    },

    _onDisRoom() {
        AssetsManager.createDialog({
            path: "res/prefab/union/main/InputDialog",
            bundle: ConfigModel.getSkin(),
            cb: (roomID) => {
                let reqData = {
                    unionID: this._unionInfo.unionID,
                    roomID: roomID
                };
                ApiHall.dismissRoomRequest(reqData, (res) => {
                    AssetsManager.tipDialog("解散成功");
                    MessageCallback.emitMessage("UnionInfoSync");
                });
            },
            maxLength: 6
        });
    },

    _onRebateDraw() {
        ApiHall.getUnionMyRebateRequest({
            unionID: this.unionID,
            type: 1,
            startIndex: 0,
            count: 5
        }, (res) => {
            AssetsManager.createDialog({
                path: "res/prefab/union/main/UnionRebateScoreDrawDialog",
                bundle: ConfigModel.getSkin(),
                rebateInfo: res.msg,
                unionID: this.unionID,
            })
        });
    },

    _onUserSearch(searchPlayer) {
        if (this.uidEdit.string.length == 0) {
            AssetsManager.tipDialog('查询请输入玩家ID~');
            return;
        }
        let uid = parseInt(this.uidEdit.string);
        if (isNaN(uid) || uid <= 0) {
            AssetsManager.tipDialog('请输入正确的玩家ID~');
            return;
        }
        let table = this._tableUserFilter(uid);
        if (!table) {
            AssetsManager.tipDialog('没有找到符合条件的玩家~');
            return;
        }
        AssetsManager.createDialog({
            path: "res/prefab/union/main/UnionTableNewDetailDialog",
            bundle: ConfigModel.getSkin(),
            roomInfo: table,
            unionInfo: this._unionInfo,
            searchPlayer: searchPlayer
        });
    },

    addCallback(gameType, ruleName, gameRule) {
        let reqData = {
            unionID: this.unionID,
            gameType: gameType,
            ruleName: ruleName,
            roomRule: gameRule
        };
        ApiHall.addRoomRuleListRequest(reqData, (res) => {
            MessageCallback.emitMessage("UnionInfoSync");
        });
    },

    _unionInfoSync() {
        let isInUnion = UserModel.isInUnion(this.unionID);
        this.unionInfo.active = !!isInUnion;
        this.mainBottomNode.active = !!isInUnion;
        this.mainTopRightNode.active = !!isInUnion;
        this._roomReturnSync();
        this.unscheduleAllCallbacks();
        if (!isInUnion) {
            this._clearUnion();
            AssetsManager.popDialog({
                content: `您已被踢出联盟，返回大厅？`,
                ok: () => {
                    this._onRelease(Enums.bundleType.HALL);
                },
                no: this._showUnionList.bind(this)
            });
            return;
        }
        ApiHall.getUnionInfoRequest({ unionID: this.unionID }, (res) => {
            if (!cc.isValid(this.node)) return;
            if (!!this._releaseLock) return;
            if (!res.msg.unionInfo) {
                this.unscheduleAllCallbacks();
                AssetsManager.popDialog({
                    content: `获取联盟信息失败,请返回大厅！`,
                    ok: () => {
                        this._onRelease(Enums.bundleType.HALL);
                    }
                });
                return;
            }
            UserModel.setData('curUnionData', res.msg);
            this._plusInfo = res.msg.plusInfo
            this._unionInfo = res.msg.unionInfo;
            let onLineCount = `${Utils.setRichTextColor(this.memberColor.toHEX('#rrggbb'), `${this._plusInfo.onLineCount}`, false)}`
            let userCount = `${Utils.setRichTextColor(this.allMemberColor.toHEX('#rrggbb'), `${this._plusInfo.userCount}`, false)}`;
            if (this.memberNumber) this.memberNumber.string = onLineCount + '/' + userCount + '人';
            this._userGameLimit = res.msg.gameLimit || [];
            this.tableOrderCheck.active = this._unionInfo && this._unionInfo.tableSort == 1;
            this._roomRuleList = UserModel.roomsFormat(this._unionInfo.roomRuleList); //记录房间规则列表
            UserModel.setData('unionRuleList', this._roomRuleList);
            this._roomList = UserModel.roomsFormat(res.msg.roomList);
            this.tableClassBtnCtrl.updateBtn(this._selectGameType, this._unionInfo);
            MessageCallback.emitMessage("UpdateUnionInfo", res);
            this._updatePlayerInfo();
            this._updateUnionInfo();
            this._updateTableList(this._selectGameType);
            this._activeSync();
            this.unscheduleAllCallbacks();
            this.scheduleOnce(this._unionInfoSync, ConfigModel.getUnionSync());
        });
    },

    _unionInit() {
        let unionData = UserModel.getData('curUnionData');
        if (!UserModel.hasUnion() || !unionData ||
            !UserModel.isInUnion(this.unionID)) {
            this.unionInfo.active = false;
            this.mainBottomNode.active = false;
            this.mainTopRightNode.active = false;
            this._showUnionList();
            return;
        }
        UserModel.locationSync();
        this._userGameLimit = unionData.gameLimit || [];
        this._unionInfo = unionData.unionInfo || {};
        this.tableOrderCheck.active = this._unionInfo.tableSort == 1;
        this._roomRuleList = UserModel.roomsFormat(this._unionInfo.roomRuleList); //记录房间规则列表
        UserModel.setData('unionRuleList', this._roomRuleList);
        this._roomList = UserModel.roomsFormat(unionData.roomList);
        this.tableClassBtnCtrl.updateBtn(this._selectGameType, this._unionInfo);
        this._updatePlayerInfo();
        this._updateUnionInfo();
        this._updateTableList(this._selectGameType);
        this._unionInfoSync(true);
    },

    _gameRuleFilter() {
        let allRoomList = this._roomList.slice();
        let allRuleList = this._roomRuleList.slice();
        let rooms = allRoomList.concat(allRuleList);
        let gameTypeFilter = [],
            ruleFilter = [];
        rooms.sort((a, b) => {
            let aType = a.gameType || a.gameRule.gameType;
            let bType = b.gameType || b.gameRule.gameType;
            return aType - bType;
        });
        if (this._selectGameType > 0) {
            for (const room of rooms) {
                let ruleGameType = room.gameType || room.gameRule.gameType;
                if (ruleGameType == this._selectGameType) {
                    gameTypeFilter.push(room);
                }
            }
            rooms = gameTypeFilter;
            for (const room of rooms) {
                let ruleId = room._id || room.gameRule._id;
                if (this._userGameLimit.includes(ruleId)) continue;
                let find = ruleFilter.find((item) => {
                    let itemRuleId = item._id || item.gameRule._id;
                    return itemRuleId === ruleId;
                });
                if (!!find) continue;
                ruleFilter.push(room);
            }
            ruleFilter.sort((a, b) => {
                return !!a.gameRule && !!b.gameRule && a.gameRule.baseScore - b.gameRule.baseScore;
            });
        } else {
            for (const room of rooms) {
                let ruleId = room._id || room.gameRule._id;
                if (this._userGameLimit.includes(ruleId)) continue;
                let ruleGameType = room.gameType || room.gameRule.gameType;
                let find = gameTypeFilter.find((item) => {
                    let itemGameType = item.gameType || item.gameRule.gameType;
                    return itemGameType === ruleGameType;
                });
                if (!!find) continue;
                gameTypeFilter.push(room);
            }
            ruleFilter = gameTypeFilter;
        }
        return ruleFilter;
    },

    _getQuickJoinRoom(leachList) {
        let rooms = this._getTableListFilter();
        let quickFilter = {};
        quickFilter.room = null;
        quickFilter.userRooms = [];
        quickFilter.emptyRooms = [];
        let unionInfoItem = UserModel.getUnionInfo(this.unionID);
        let userScore = unionInfoItem.score || 0;
        let userRooms = [];
        let emptyRooms = [];
        for (const room of rooms) {
            let gameType = room.gameType || room.gameRule.gameType;
            if (leachList && leachList.includes(gameType)) continue;
            let roomFilter = this._userRoomFilter(room.roomUserInfoArr, room.gameRule.maxPlayerCount);
            room.free = roomFilter.free;
            if (roomFilter.full) continue;
            if (!!room.roomID && room.curBureau > 0) { //已开房间人未满
                let curBureau = room.curBureau;
                let bureau = room.gameRule.bureau;
                let leftBureau = bureau - curBureau;
                if (this._unionInfo.unionType != Enums.UnionType.NORMAL) {
                    if (userScore >= room.gameRule.scoreLowLimit) { //积分足够
                        if (!!room.gameRule.canEnter) {
                            let lastThreeJoinLimit = true;
                            if (!!room.gameRule.lastThreeJoin) {
                                lastThreeJoinLimit = leftBureau > 3;
                            }
                            if (!!lastThreeJoinLimit) {
                                userRooms.push(room);
                            }
                        }
                    }
                } else {
                    userRooms.push(room);
                }
            } else { //预制房间
                if (this._unionInfo.unionType != Enums.UnionType.NORMAL) {
                    if (userScore >= room.gameRule.scoreLowLimit) {
                        emptyRooms.push(room);
                    }
                } else {
                    emptyRooms.push(room);
                }
            }
        }
        //按座位空闲人数排序
        userRooms.sort((a, b) => {
            return a.free - b.free;
        })
        emptyRooms.sort((a, b) => {
            return a.free - b.free;
        })
        quickFilter.userRooms = userRooms;
        quickFilter.emptyRooms = emptyRooms;
        let matchRooms = userRooms.concat(emptyRooms)
        quickFilter.room = matchRooms[0]
        return quickFilter;
    },

    _userRoomFilter(users, maxPlayerCount) {
        let filter = {
            gaming: [],
            look: [],
            free: 0,
            full: false
        }
        users = users || [];
        let gamingCount = 0;
        for (const user of users) {
            if (user.chairID < maxPlayerCount) {
                filter.gaming.push(user);
                gamingCount++;
            } else {
                filter.look.push(user);
            }
        }
        if (users.length == 0) {
            filter.free = maxPlayerCount;
            filter.full = false;
        } else {
            filter.free = maxPlayerCount - gamingCount;
            filter.full = gamingCount >= maxPlayerCount;
        }
        return filter;
    },

    _updateNotice() {
        // console.log("更新公告", this._unionInfo.notice)
        if (!this._unionInfo || !cc.isValid(this.broadcastTarget)) return;
        this._unionInfo.notice = this._unionInfo.notice || '';
        AssetsManager.createDialog({
            path: 'res/prefab/main/public/BroadcastWidget',
            broadcastMode: 'union',
            loopBroadcastContent: this._unionInfo.notice,
            broadcastPos: CCUtil.postionConvert(this.broadcastTarget, this.node),
            bundle: ConfigModel.getSkin()
        });
        MessageCallback.emitMessage("BroadcastSyncPush", this._unionInfo.notice);
    },

    _updatePlayerInfo() {
        let unionInfo = UserModel.getUnionInfo(this.unionID);
        let score = unionInfo ? unionInfo.score : 0;
        this.score.string = Utils.formatNumberWithSymbol(score, 1);
    },

    _updateUnionInfo() {
        this.unionName.string = CCUtil.stringClamp(this._unionInfo.unionName || "", 8, '..');
        this.unionId.string = `ID: ${this._unionInfo.unionID}`;
        this.closedTip.active = !this._unionInfo.opening;
        this._updateUnionState();
        this._updateBackground();
        this._updateNotice();
        this.unionActiveNode.active = !!this._unionInfo.showUnionActive;
        this.singleRankNode.active = !!this._unionInfo.showSingleRank;
        let hongBaoInfo = this._unionInfo.hongBaoInfo;
        let canGet = true;
        if (!hongBaoInfo || !hongBaoInfo.status) canGet = false;
        let time = new Date().getHours();
        if (hongBaoInfo.startTime > time || hongBaoInfo.endTime <= time) canGet = false;;
        let hongBaoUidList = this._unionInfo.hongBaoUidList || [];
        let hongBaoScoreList = this._unionInfo.hongBaoScoreList || [];
        if (hongBaoUidList.indexOf(UserModel.getData('uid')) !== -1) canGet = false;
        if (hongBaoScoreList.length === 0) canGet = false;
        if (this.hongBaoNode) this.hongBaoNode.active = false;
        if (!canGet) return;
        if (this.hongBaoNode.active) {
            let node = this.hongBaoNode.getChildByName("hongbao_icon");
            node.stopAllActions();
            node.runAction(cc.repeatForever(cc.sequence([cc.scaleTo(1, 1.2), cc.scaleTo(1, 1)])));
        }

        // 没有红包，判断今天是否已经抢过红包
        if (hongBaoScoreList.length === 0) {

        }
        // 创建领取红包界面
        AssetsManager.createDialog({
            path: "res/prefab/union/main/UnionGetHongBaoDialog",
            bundle: ConfigModel.getSkin(),
            unionInfo: this._unionInfo
        });
    },

    _onUnionDismissSync() {
        ApiHall.getUserUnionListRequest((res) => {
            UserModel.setData('userUnions', res.msg.recordArr);
            if (!UserModel.isInUnion(this.unionID)) {
                AssetsManager.popDialog({
                    content: `该联盟已被解散！返回大厅？`,
                    ok: () => {
                        this._onRelease(Enums.bundleType.HALL);
                    },
                    no: this._showUnionList.bind(this)
                });
            }
        });
    },

    _showUnionList() {
        ApiHall.getUserUnionListRequest((res) => {
            UserModel.setData('userUnions', res.msg.recordArr);
            AssetsManager.createDialog({
                path: "res/prefab/union/list/UnionSwitchDialog",
                bundle: ConfigModel.getSkin(),
                recordArr: res,
                nodeTarget: this.btnUnionSwitch
            });
        });
    },

    onGameTypeClick(gameType) {
        if (!!this._selectGameRule) {
            let selected = this._selectGameRule.gameType || this._selectGameRule.gameRule.gameType;
            if (gameType != selected) {
                this._selectGameRule = null;
                this._curShowCount = 10;
            }
        }
        this._selectGameType = gameType;
        this._updateTableList(gameType);
    },

    onScrollToEnd(target, event) {
        if (event == cc.ScrollView.EventType.SCROLL_TO_RIGHT) {
            if (this._curShowCount >= this._totalShowCount) return;
            if (this._curShowCount + 10 >= this._totalShowCount) {
                this._curShowCount = this._totalShowCount;
            } else {
                this._curShowCount += 10;
            }
            this._updateTableList(this._selectGameType);
        }
    },

    _clearUnion() {
        this.tableList.destroyAllChildren();
        this.gameFilterList.destroyAllChildren();
        this._roomListItem = [];
        this._gameFilterItem = [];
    },

    _updateTableList(gameType) {
        //当联盟打烊或者这个联盟被解散 规则列表不存在 或为空时不加载
        if (!UserModel.isInUnion(this.unionID)) {
            this.unscheduleAllCallbacks();
            this._clearUnion();
            AssetsManager.popDialog({
                content: `您已被踢出联盟，返回大厅？`,
                ok: () => {
                    this._onRelease(Enums.bundleType.HALL);
                },
                no: this._showUnionList.bind(this)
            });
            return;
        }
        if (!this._unionInfo.opening) {
            this._clearUnion();
            return;
        }
        this._selectGameRule = this._checkRuleId(this._selectGameRule);
        this._selectGameType = this._checkGameType(gameType);
        this._unionInfo.selectedGameType = this._selectGameType;
        this._unionInfo.selectGameRule = this._selectGameRule;
        UserModel.setGameSelected(this._selectGameType);
        let gameFilterList = this._gameRuleFilter();
        let roomList = this._getTableListFilter();
        this._totalShowCount = roomList.length;
        let showRoomItem = (index, table, comp) => {
            let nodeCtrl = table.getComponent('TableItemWidgetCtrl');
            if (!!table && !!nodeCtrl) {
                nodeCtrl.bind(index + 1, this._unionInfo, comp);
                table.active = !!comp;
            }
        }
        if (this._roomListItem.length >= this._curShowCount) {
            this._roomListItem.forEach((table, index) => {
                showRoomItem(index, table, roomList[index]);
            })
        } else {
            for (let index = 0; index < this._curShowCount; index++) {
                let table = this._roomListItem[index];
                let comp = roomList[index];
                if (!table) {
                    table = cc.instantiate(this.tableItemWidgetPrefab);
                    table.parent = this.tableList;
                    this._roomListItem.push(table);
                }
                showRoomItem(index, table, comp);
            }
        }
        let showFilterItem = (table, comp) => {
            let nodeCtrl = table.getComponent('UnionGameFilterItem');
            if (!!table && !!nodeCtrl) {
                nodeCtrl.initWidget(this._unionInfo, comp);
                table.active = !!comp;
            }
        }
        if (this._gameFilterItem.length >= gameFilterList.length) {
            this._gameFilterItem.forEach((table, index) => {
                showFilterItem(table, gameFilterList[index]);
            })
        } else {
            gameFilterList.forEach((comp, index) => {
                let table = this._gameFilterItem[index];
                if (!table) {
                    table = cc.instantiate(this.gameFilterItem);
                    table.parent = this.gameFilterList;
                    this._gameFilterItem.push(table);
                }
                showFilterItem(table, comp);
            })
        }
    },

    _updateAddTable() {
        if (!!this._tableAddItem) return;
        if (cc.isValid(this._tableAddItem)) return;
        let node = cc.instantiate(this.tableAddItemWidgetPrefab);
        node.parent = this.tableList;
    },

    _roomListFilter(rooms) {
        let table = {
            full: [],
            free: [],
            empty: []
        }
        rooms.forEach(ele => {
            if (this._isFullTable(ele)) {
                table.full.push(ele);
            } else {
                table.free.push(ele);
            }
        });
        return table;
    },

    _isFullTable(room) {
        let full = false;
        if (!room || !room.roomID || !room.roomUserInfoArr) return full;
        let players = room.roomUserInfoArr;
        let gameRule = room.gameRule || {};
        let playerCount = 0;
        players.forEach(player => {
            if (player.chairID < gameRule.maxPlayerCount) {
                playerCount++;
            }
        })
        full = playerCount >= gameRule.maxPlayerCount;
        return full;
    },

    _tableUserFilter(uid) {
        this._roomList = this._roomList || [];
        let room = this._roomList.find((item) => {
            let players = item.roomUserInfoArr || [];
            let player = players.find((user) => {
                return user.uid == uid;
            });
            return player && player.uid == uid;
        });
        return room;
    },

    _isActiveTable(room) {
        let active = false;
        if (!room || !room.roomID || !room.roomUserInfoArr) return active;
        let players = room.roomUserInfoArr;
        let gameRule = room.gameRule || {};
        let playerCount = 0;
        players.forEach(player => {
            if (player.chairID < gameRule.maxPlayerCount) {
                playerCount++;
            }
        })
        active = playerCount < gameRule.maxPlayerCount && playerCount > 0;
        return active;
    },

    _getTableListFilter() {
        let rooms = [];
        let allRoomList = this._roomList.slice();
        let allRuleList = this._roomRuleList.slice();
        let unionInfoItem = UserModel.getUnionInfo(this.unionID);
        let userUnionItem = UserModel.getUserUnion(this.unionID);
        if (!unionInfoItem || !userUnionItem) return rooms;
        let uid = UserModel.getData('uid');
        let limit = parseInt(this._unionInfo.fullTableLimit);
        let isFullLimit = !unionInfoItem.manager && uid != userUnionItem.ownerUid && limit > 0;
        if (!isFullLimit) {
            rooms = allRoomList.concat(allRuleList);
        } else {
            let tmpAllRooms = allRoomList.slice();
            let roomFilter = this._roomListFilter(tmpAllRooms);
            let tmpFullTables = roomFilter.full;
            let tmpFreeTables = roomFilter.free;
            if (tmpFullTables.length > limit) {
                let limits = tmpFullTables.slice(0, limit);
                rooms = limits.concat(tmpFreeTables);
                rooms = rooms.concat(allRuleList);
            } else {
                rooms = allRoomList.concat(allRuleList);
            }
        }
        let roomList = [];
        rooms.sort((a, b) => {
            let aType = a.gameType || a.gameRule.gameType;
            let bType = b.gameType || b.gameRule.gameType;
            return aType - bType;
        });
        //如果该玩法被禁止则取消指定
        if (!!this._selectGameRule) {
            let selectRuleId = this._selectGameRule._id || this._selectGameRule.gameRule._id;
            if (this._userGameLimit.includes(selectRuleId)) {
                this._selectGameRule = null;
                this._selectGameType = 0;
            }
        }
        if (!!this._selectGameRule) {
            let selectGameRuleId = this._selectGameRule._id || this._selectGameRule.gameRule._id;
            for (const room of rooms) {
                let roomRuleId = room._id || room.gameRule._id;
                if (selectGameRuleId != roomRuleId) continue;
                roomList.push(room);
            }
        } else if (this._selectGameType > 0) {
            for (const room of rooms) {
                let roomGameType = room.gameType || room.gameRule.gameType;
                if (roomGameType === this._selectGameType) {
                    roomList.push(room);
                }
            }
        } else {
            roomList = rooms;
        }
        let emptyTables = [],
            activeTables = [],
            fullTables = [];
        let forbidEmptyTable = !!this._unionInfo && !!this._unionInfo.emptyTable;
        for (const room of roomList) {
            let roomRuleId = room._id || room.gameRule._id;
            if (this._userGameLimit.includes(roomRuleId)) continue;
            if (!!room.roomID) {
                if (!!this._isFullTable(room)) {
                    fullTables.push(room);
                } else if (!!this._isActiveTable(room)) {
                    activeTables.push(room);
                } else {
                    emptyTables.push(room);
                }
            } else {
                if (!!forbidEmptyTable && !!this._checkHasActivityTable(room, roomList)) continue;//禁止空桌
                let bundle = ConfigModel.getBundleConfig(room.gameRule.gameType);
                if (!!bundle && bundle.classify == Enums.bundleClass.BAIREN && !!this._checkHasActivityTable(room, roomList)) continue;//已开房的百人场不显示空桌子
                emptyTables.push(room);
            }
        }
        this.fullTableCountLbl.string = `满桌:${fullTables.length}桌`;
        this.freeTableCountLbl.string = `空闲:${emptyTables.length}桌`;
        emptyTables.sort((a, b) => {
            let aPlayerCount = a.gameRule.maxPlayerCount;
            let bPlayerCount = b.gameRule.maxPlayerCount;
            return aPlayerCount - bPlayerCount;
        });
        activeTables.sort((a, b) => {
            let aPlayerCount = a.gameRule.maxPlayerCount;
            let bPlayerCount = b.gameRule.maxPlayerCount;
            return aPlayerCount - bPlayerCount;
        });
        let tableHideCount = !!this._unionInfo && !isNaN(this._unionInfo.tableHideCount) ? this._unionInfo.tableHideCount : 0;//隐藏已开桌 1-全部隐藏 0-全部不隐藏 其他隐藏比例
        let hasPlayerTables = activeTables.concat(fullTables);//有人的桌子
        let hasPlayerTableCount = hasPlayerTables.length;
        let showActiveTableCount = tableHideCount == 1 ? 0 : tableHideCount == 0 ? hasPlayerTableCount : Math.ceil(hasPlayerTableCount / tableHideCount);
        let activeTableCount = activeTables.length;
        if (showActiveTableCount == 0) {
            //全部隐藏
            fullTables = [];
            activeTables = [];
        } else {
            if (activeTableCount <= showActiveTableCount) {
                //优先显示未坐满的 
                showActiveTableCount -= activeTableCount;
                if (showActiveTableCount <= 0) showActiveTableCount = 0;
                fullTables = fullTables.splice(0, showActiveTableCount);
            } else {
                fullTables = [];//全部隐藏满桌
                activeTables = activeTables.splice(0, showActiveTableCount);
            }
        }
        if (!!this._unionInfo && this._unionInfo.tableSort == 1) {
            return activeTables.concat(emptyTables, fullTables);
        } else {
            return activeTables.concat(fullTables, emptyTables);
        }
    },

    _checkHasActivityTable(room, rooms) {
        let roomRuleId = room._id || room.gameRule._id;
        let active = false;
        for (const item of rooms) {
            let itemRuleId = item._id || item.gameRule._id;
            if (roomRuleId == itemRuleId) {
            }
            if (!!item.roomID &&
                roomRuleId == itemRuleId) {
                active = true;
                break;
            }
        }
        return active;
    },

    _checkRuleId(rule) {
        if (!rule) return null;
        let gameType = rule.gameType || rule.gameRule.gameType;
        if (this._selectGameType != gameType) return null;
        let checked = null;
        let allRoomList = this._roomList.slice();
        let allRuleList = this._roomRuleList.slice();
        let rooms = allRoomList.concat(allRuleList);
        let ruleId = rule._id || rule.gameRule._id;
        for (const room of rooms) {
            let roomRuleId = room._id || room.gameRule._id;
            if (roomRuleId == ruleId) {
                checked = rule;
                break;
            }
        }
        return checked;
    },

    _isInUnion() {
        let isInUnion = UserModel.isInUnion(this.unionID);
        if (!isInUnion) {
            AssetsManager.popDialog({
                content: `操作失败！无法获取联盟信息或联盟已被解散，请联系盟主或客服！`,
                ok: () => { },
            });
        }
        return isInUnion;
    },

    _checkGameType(gameType) {
        if (gameType == -1) return gameType;
        let checked = -1;
        let allRoomList = this._roomList.slice();
        let allRuleList = this._roomRuleList.slice();
        let rooms = allRoomList.concat(allRuleList);
        for (const room of rooms) {
            let roomGameType = room.gameType || room.gameRule.gameType;
            if (roomGameType == gameType) {
                checked = gameType;
                break;
            }
        }
        return checked;
    },
    _onEnterClick(event, room) {
        if (!!CCUtil.clickInterval(event.target, 1.5)) return;
        if (!room) return AssetsManager.tipDialog('未匹配到相应房间!');
        let isDownload = SubManager.checkLoad(room.gameRule.gameType);
        let needUpdate = ABManager.checkUpdate(room.gameRule.gameType);
        let join = {
            union: this._unionInfo,
            room: room
        }
        if (!isDownload || !!needUpdate) {
            AssetsManager.subLoadDialog({
                type: room.gameRule.gameType,
                action: !isDownload ? 1 : 2, //1-加载 2-更新
                roomInfo: room,
                cb: () => {
                    UserModel.joinUnionRoom(join);
                }
            })
            return;
        }
        UserModel.joinUnionRoom(join);
    },

    _onRelease(bundle) {
        if (!!this._releaseLock) return;
        this._releaseLock = true;
        this.unscheduleAllCallbacks();
        SubManager.enterBundle(bundle);
    }

});