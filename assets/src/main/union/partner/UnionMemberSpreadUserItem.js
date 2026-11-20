
const MessageCallback = require('../../../utils/MessageCallback');
const AssetsManager = require('../../../utils/AssetsManager');
const UserModel = require('../../../model/UserModel');
const CCUtil = require('../../../utils/CCUtil');
const ApiHall = require('../../../api/ApiHall');
const ConfigModel = require('../../../model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        arrow: cc.Node,
        avatar: cc.Sprite,
        nickLbl: cc.Label,
        uidLbl: cc.Label,

        _user: null
    },

    bind(user) {
        this._user = user;
        AssetsManager.loadSpriteFrame({
            path: user.avatar,
            sprite: this.avatar
        });
        this.nickLbl.string = CCUtil.stringClamp(user.nickname, 6, '..');
        this.uidLbl.string = "ID:" + user.uid;
        this.arrow.active = !user.isLast;
    },
});
