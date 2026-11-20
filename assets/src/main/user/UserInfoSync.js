const MessageCallback = require('../../utils/MessageCallback');
const AssetsManager = require('../../utils/AssetsManager');
const CCUtil = require('../../utils/CCUtil');
const UserModel = require('../../model/UserModel');

cc.Class({
    extends: cc.Component,

    properties: {
        avatarSprite: cc.Sprite,
        nickNameLbl: cc.Label,
        uidLbl: cc.Label,
        goldLbl: cc.Label,
    },

    start() {
        MessageCallback.addListener('UpdateUserInfoPush', this);
        this._updateUserInfo()
    },

    messageCallbackHandler(route, msg) {
        switch (route) {
            case 'UpdateUserInfoPush':
                this._updateUserInfo();
                break;
        }
    },

    _updateUserInfo() {
        if (this.nickNameLbl) this.nickNameLbl.string = CCUtil.stringClamp(UserModel.getData('nickname'), 4, '..');
        if (this.uidLbl) this.uidLbl.string = UserModel.getData('uid');
        if (this.goldLbl) this.goldLbl.string = UserModel.getData('gold');
        AssetsManager.loadSpriteFrame({
            path: UserModel.getData('avatar'),
            sprite: this.avatarSprite
        });
    },

    onDestroy() {
        MessageCallback.removeListener('UpdateUserInfoPush', this);
    },

});
