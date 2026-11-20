const AssetsManager = require('../../../utils/AssetsManager');
const CCUtil = require('../../../utils/CCUtil');
const UserModel = require('../../../model/UserModel');
const Utils = require('../../../utils/Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        headSprite: cc.Sprite,
        nickNameLbl: cc.Label,
        uidLbl: cc.Label,
        opToggle: cc.Toggle,

        _user: null
    },

    start() {},

    initWidget(user) {
        this._user = user;
        this.uidLbl.string = `ID:${user.uid}`;
        this.nickNameLbl.string = CCUtil.stringClamp(user.nickname, 6);
        AssetsManager.loadSpriteFrame({
            path: user.avatar,
            sprite: this.headSprite
        });
    },

    opClick() {

        if (!this._user) return;
        if (!this._user.onUserCheck) return;
        this._user.onUserCheck(this._user);
    },

});