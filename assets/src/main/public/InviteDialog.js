const AssetsManager = require('../../utils/AssetsManager');
const ApiHall = require('../../api/ApiHall');
const SubManager = require('../../utils/SubManager');
const ABManager = require('../../utils/ABManager');
const Enums = require('../../const/Enums');
const Utils = require('../../utils/Utils');
const ConfigModel = require('../../model/ConfigModel');
const UserModel = require('../../model/UserModel');

cc.Class({
    extends: cc.Component,
    properties: {
        head: cc.Sprite,
        userName: cc.Label,
        useruId: cc.Label,
        roomType: cc.Label,
    },


    onLoad() {
        this.msg = this.node.nodeParams.msg;
    },

    onDestroy() { },

    start() {
        this.userList()
    },

    // 用户信息
    userList() {
        let nickname = this.msg.inviter.nickname;
        let useruid = this.msg.inviter.uid;
        this.userName.string = '玩家昵称：' + nickname
        this.useruId.string = '玩家ID：' + useruid
        // console.log(nickname, useruid, '加载用户的信息');
        let share = ConfigModel.getRoomRuleShare(this.msg.gameRule);
        this.roomType.string = `${this.msg.gameRule.ruleName}(${share.baseTitle}:${share.baseScore}的房间`;
        // console.log(this.msg.inviter.avatar, '用户被邀请的头像');
        AssetsManager.loadSpriteFrame({
            path: this.msg.inviter.avatar,
            sprite: this.head
        });
    },

    // 拒绝按钮
    onCloseClick() {
        this.node.destroy();
    },

    onButtonClick() {
        if (UserModel.isInRoom()) {
            SubManager.enterBundle(Enums.bundleType.GAME);
            return;
        }
        let msg = this.msg || {};
        let gameRule = msg.gameRule || {};
        let isDownload = SubManager.checkLoad(gameRule.gameType);
        let needUpdate = ABManager.checkUpdate(gameRule.gameType);
        if (!isDownload || !!needUpdate) {
            //调用下载页面
            AssetsManager.subLoadDialog({
                type: gameRule.gameType,
                action: !isDownload ? 1 : 2, //1-加载 2-更新
                roomInfo: gameRule,
                cb: () => {
                    ApiHall.joinRoomRequest({
                        roomID: msg.nextroomID,
                        gameType: gameRule.gameType
                    });
                }
            })
            return;
        }
        ApiHall.joinRoomRequest({
            roomID: msg.nextroomID,
            gameType: gameRule.gameType
        });
        this.node.destroy();
    },

    update(dt) { },
});