const MessageCallback = require('../../utils/MessageCallback');
const AssetsManager = require('../../utils/AssetsManager');
const CCUtil = require('../../utils/CCUtil');
const NativeUtil = require('../../utils/NativeUtil');
const UserModel = require('../../model/UserModel');
const ApiHall = require('../../api/ApiHall');
const SubManager = require('../../utils/SubManager');
const ConfigModel = require('../../model/ConfigModel');
const Utils = require('../../utils/Utils');
const Enums = require('../../const/Enums');
const CacheManager = require('../../utils/CacheManager');

cc.Class({
    extends: cc.Component,

    properties: {
        inviteBtn: cc.Node,
        redNode: cc.Node,
        noteNode: cc.Node,
        broadcastTarget: cc.Node,
        gaoLable: cc.Label,
    },

    onLoad() { },

    start() {
        AssetsManager.init(this.node);
        //界面数据更新，填充
        MessageCallback.addListener('SelfEntryRoomPush', this);
        MessageCallback.addListener('UpdateUserInfoPush', this);
        MessageCallback.addListener('ReconnectSuccess', this);
        MessageCallback.addListener('UpdateHallBgm', this);
        MessageCallback.addListener("BroadcastPush", this);

        this.broadcastContents = [];
        // 初始化广播组件
        if (cc.isValid(this.broadcastTarget)) {
            AssetsManager.createDialog({
                path: 'res/prefab/main/public/BroadcastWidget',
                broadcastMode: 'hall',
                loopBroadcastContent: null,
                broadcastPos: CCUtil.postionConvert(this.broadcastTarget, this.node),
                bundle: ConfigModel.getSkin()
            });
        }
        this.hallInit();
        this.broadcastSync();
        this.updatePlayerInfo();
        this.roomCheck();
    },

    onDestroy() {
        MessageCallback.removeListener('SelfEntryRoomPush', this);
        MessageCallback.removeListener('UpdateUserInfoPush', this);
        MessageCallback.removeListener('ReconnectSuccess', this);
        MessageCallback.removeListener('UpdateHallBg', this);
        MessageCallback.removeListener('UpdateHallBgm', this);
        MessageCallback.removeListener("BroadcastPush", this);

        AssetsManager.release();
        ConfigModel.setData('lastScene', 'hall');
    },

    messageCallbackHandler(route, data) {
        switch (route) {
            case 'SelfEntryRoomPush':
                SubManager.enterBundle(Enums.bundleType.GAME);
                break;
            case 'UpdateUserInfoPush':
                this.updatePlayerInfo();
                return;
            case 'ReconnectSuccess':
                this.updatePlayerInfo();
                this.roomCheck();
                break;
            case 'BroadcastPush':
                if (data.type === Enums.broadcastType.BIG_WIN) {
                    for (let i = 0; i < data.broadcastContentArr.length; ++i) {
                        this.broadcastContents.push({
                            type: data.type,
                            content: data.broadcastContentArr[i]
                        });
                        if (this.broadcastContents.length > 10) {
                            this.broadcastContents.shift();
                        }
                    }
                } else {
                    this.broadcastContents.push(msg);
                    if (this.broadcastContents.length > 10) {
                        this.broadcastContents.shift();
                    }
                }
                this.broadcastSync()
                break;
        }
    },


    // 公告
    broadcastSync() {
        if (!this.gaoLable) return
        if (this.broadcastContents.length == 0) {
            let content = ConfigModel.getData('loopBroadcastContent');
            if (!!content) {
                this.broadcastContents.push({
                    type: Enums.broadcastType.LOOP,
                    content: content
                });
            }
        }
        let broadcastContent = this.broadcastContents.shift();
        if (broadcastContent.type === Enums.broadcastType.LOOP || broadcastContent.type === Enums.broadcastType.SYSTEM) {
            this.gaoLable.string = broadcastContent.content;
        } else if (broadcastContent.type === Enums.broadcastType.BIG_WIN) {
            let game = ConfigModel.getBundleConfig(broadcastContent.content.kind);
            let gameName = !!game ? game.name : '未知';
            let nickname = Utils.convertNickname(broadcastContent.content.nickname);
            let goldCount = Utils.formatNumberWithDecimal(broadcastContent.content.gold, 1);
            this.gaoLable.string = '玩家:' + nickname + '在' + gameName + '一把赢得' + goldCount + '积分！';
        }

    },

    updatePlayerInfo() {
        //大厅
        let inviteMsg = UserModel.getData('inviteMsg') || [];
        if (this.inviteBtn) this.inviteBtn.active = inviteMsg.length > 0;
        this.redNode.active = UserModel.unreadEmailCount() > 0;
    },

    hallInit() {
        let authShowTimeString = CacheManager.getItem('authShowTime');
        if (this.noteNode) this.noteNode.active = cc.sys.isBrowser || ConfigModel.getData('feedbackEnable');
        let authShowTime = !authShowTimeString || authShowTimeString.length == 0 || isNaN(parseInt(authShowTimeString)) ? 0 : parseInt(authShowTimeString);
        let nowTime = Date.now();
        let realName = UserModel.getData('realName');
        let isShowAuth = (nowTime - authShowTime) >= Utils.getDayMinimumSeconds(); //一天只显示一次
        if ((!realName || realName.length == 0) && isShowAuth) {
            // AssetsManager.createDialog({
            //     path: "res/prefab/main/user/AuthDialog"
            // });
        }
        //同步定位
        UserModel.locationSync();
    },

    roomCheck() {
        //玩家在房间
        let roomID = UserModel.getData('roomID');
        let gameType = UserModel.getData('gameType');
        if (!!roomID && roomID > 0 && parseInt(gameType) > 0) {
            SubManager.enterBundle(Enums.bundleType.GAME);
        }
    },

    onCreateRoomBtnClick(event, param) {
        if (param) {
            let gameType = null;
            gameType = Enums.bundleType[param.toUpperCase()];
            let gameClass = ConfigModel.getBundleConfig(gameType).classify ? ConfigModel.getBundleConfig(gameType).classify : null;
            AssetsManager.createDialog({
                path: 'res/prefab/main/room/CreateRoomDialog',
                bundle: ConfigModel.getSkin(),
                gameClass: gameClass,
                gameType: gameType
            });
        }

    },

    onBtnClk(event, param) {
        switch (param) {
            case 'head':
                AssetsManager.createDialog({
                    path: 'res/prefab/main/user/UserInfoDialog',
                    bundle: ConfigModel.getSkin()
                });
                break;
            case 'shop':
            case 'addGold':
            case 'mall':
                if (!!ConfigModel.getData("mallEnable") || cc.sys.isBrowser) {
                    AssetsManager.createDialog({
                        path: 'res/prefab/main/mall/MallDialog',
                        bundle: ConfigModel.getSkin(),
                    });
                } else {
                    AssetsManager.tipDialog("优惠多多，敬请期待~");
                }
                break;
            case 'createRoom':
            case 'hzmj':
            case 'ptj':
            case 'xzmj':
                if (!ConfigModel.hallMode()) {
                    AssetsManager.tipDialog("暂不支持此模式，敬请期待~");
                    return;
                }
                let gameType = null;
                let gameClass = null;
                if (param == 'hzmj') {
                    gameType = Enums.bundleType.HZMJ;
                    gameClass = Enums.bundleClass.MAJIANG;
                } else if (param == 'xzmj') {
                    gameType = Enums.bundleType.XZMJ;
                    gameClass = Enums.bundleClass.MAJIANG;
                } else if (param == 'ptj') {
                    gameType = Enums.bundleType.PTJ;
                    gameClass = Enums.bundleClass.ZIPAI;
                }
                AssetsManager.createDialog({
                    path: 'res/prefab/main/room/CreateRoomDialog',
                    bundle: ConfigModel.getSkin(),
                    gameClass: gameClass,
                    gameType: gameType
                });
                break;
            case 'joinRoom':
                if (!ConfigModel.hallMode()) {
                    AssetsManager.tipDialog("暂不支持此模式，敬请期待~");
                    return;
                }
                AssetsManager.createDialog({
                    path: 'res/prefab/main/room/JoinRoomDialog',
                    bundle: ConfigModel.getSkin(),
                });
                break;
            case 'friends':
            case 'union':
                ApiHall.getUserUnionListRequest((res) => {
                    UserModel.setData('userUnions', res.msg.recordArr);
                    AssetsManager.createDialog({
                        path: "res/prefab/union/list/UnionListDialog",
                        recordArr: res.msg.recordArr,
                        bundle: ConfigModel.getSkin()
                    });
                });
                break;
            case 'settings':
                AssetsManager.setDialog({
                    type: "hall",
                });
                break;
            case 'realname':
                AssetsManager.createDialog({
                    path: "res/prefab/main/user/AuthDialog",
                    bundle: ConfigModel.getSkin()
                });
                break;
            case 'email':
                AssetsManager.createDialog({
                    path: 'res/prefab/main/mail/MailDialog',
                    bundle: ConfigModel.getSkin(),
                });
                break;
            case 'share':
                AssetsManager.createDialog({
                    path: 'res/prefab/main/share/ShareDialog',
                    bundle: ConfigModel.getSkin()
                });
                break;
            case 'notice':
                AssetsManager.createDialog({
                    path: 'res/prefab/main/active/NoticeDialog',
                    bundle: ConfigModel.getSkin(),
                });
                break;
            case 'service':
            case 'kefu':
                AssetsManager.serviceDialog({});
                break;
            case 'note':
                AssetsManager.createDialog({
                    path: 'res/prefab/main/public/NoteDialog',
                    bundle: ConfigModel.getSkin()
                });
                break;
            case 'inviteMsg':
                let msg = UserModel.inviteMsg[0];
                if (!msg) return;
                let reqData = {
                    uid: msg.uid,
                    unionID: msg.unionID,
                    agree: true
                };
                AssetsManager.popDialog({
                    content: msg.nickname + "邀请你加入" + msg.unionName + "亲友圈",
                    ok: () => {
                        reqData.agree = true;
                        ApiHall.operationInviteJoinUnionRequest(reqData);
                    },
                    no: () => {
                        reqData.agree = false;
                        ApiHall.operationInviteJoinUnionRequest(reqData);
                    }
                });
                break;
            case 'record':
                AssetsManager.createDialog({
                    path: "res/prefab/main/record/GameRecordDialog",
                    bundle: ConfigModel.getSkin(),
                    uid: UserModel.getData('uid')
                });
                break;
            case 'rule':
                AssetsManager.ruleDialog({
                    type: -1
                })
                break;
            case 'gold':
                AssetsManager.createDialog({
                    path: 'res/prefab/main/public/GoldPresentDialog',
                    bundle: ConfigModel.getSkin(),
                    uid: UserModel.getData('uid')
                });
                break;
        }
    }
});