const AssetsManager = require('../../../utils/AssetsManager');
const UserModel = require('../../../model/UserModel');
const ConfigModel = require('../../../model/ConfigModel');
const Enums = require('../../../const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {
        gameIndex: cc.Label,
        gameName: cc.Label,
        roomInfoLbl: cc.Label,
    },

    onLoad() {

    },

    start() {

    },

    bind(unionInfo, roomInfo, index) {
        this._unionInfo = unionInfo;
        this._roomInfo = roomInfo;
        let gameType = roomInfo.gameType;
        let gameRule = roomInfo.gameRule;
        let bundle = ConfigModel.getBundleConfig(gameType);
        this.gameIndex.string = index;
        if (!!bundle && bundle.classify != Enums.bundleClass.BAIREN) {
            this.roomInfoLbl.string = `${gameRule.baseScore}分/${gameRule.bureau}局`;
        } else {
            this.roomInfoLbl.string = `${gameRule.baseScore}分`;
        }
        this.gameName.string = roomInfo.ruleName;
    },


    onDetailClick() {
        AssetsManager.createDialog({
            path: "res/prefab/union/main/UnionTableNewDetailDialog",
            bundle: ConfigModel.getSkin(),
            roomInfo: this._roomInfo,
            unionInfo: this._unionInfo
        });
    },



});