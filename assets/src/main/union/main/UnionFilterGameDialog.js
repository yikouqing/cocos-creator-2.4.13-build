const AssetsManager = require('../../../utils/AssetsManager');
const Enums = require('../../../const/Enums');
const ConfigModel = require('../../../model/ConfigModel');
const UserModel = require('../../../model/UserModel');

cc.Class({
    extends: cc.Component,

    properties: {
        gameList: cc.Node,
        gameItem: cc.Prefab, //游戏列表
        classPokerTog: cc.Toggle,
        classMahjongTog: cc.Toggle,
        classZiPaiTog: cc.Toggle,
        _curClassify: -1
    },

    onLoad() {
        this._curClassify = Enums.bundleClass.PUKE;
        this.unionInfo = this.node.nodeParams.unionInfo;
        this.unionID = this.unionInfo.unionID;
        this.rooms = this.node.nodeParams.rooms || [];
        this.addCallback = this.node.nodeParams.addCallback;
    },

    start() {
        this._loadGames();
    },

    _loadGames() {
        this.gameList.removeAllChildren();
        let rooms = this.rooms.slice();
        let curRooms = rooms.filter((room, index, list) => {
            let bundle = ConfigModel.getBundleConfig(room.gameRule.gameType);
            return (!!bundle && bundle.classify == this._curClassify);
        });
        if (!curRooms) return;
        curRooms.forEach((room, index, list) => {
            let item = cc.instantiate(this.gameItem)
            let ctrl = item.getComponent('UnionFilterGameItem')
            ctrl.bind(this.unionInfo, room, index)
            item.parent = this.gameList;
        });
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

    onButtonClick(event, parameter) {
        if (parameter === 'addRule') {
            if (!this._isInUnion()) return;
            if (!this.unionInfo) return;
            let unionInfoItem = UserModel.getUnionInfo(this.unionID);
            if (this.unionInfo.ownerUid == UserModel.getData('uid') ||
                (!!unionInfoItem && !!unionInfoItem.manager)) {
                AssetsManager.createDialog({
                    path: "res/prefab/main/room/CreateRoomDialog",
                    bundle: ConfigModel.getSkin(),
                    isUnion: true,
                    from: 'union',
                    unionInfo: this.unionInfo,
                    unionID: this.unionID,
                    cb: (node, gameRule) => {
                        node.destroy();
                        gameRule.ruleName = !gameRule.ruleName ? ConfigModel.getGameName(gameRule.gameType) : gameRule.ruleName;
                        this.addCallback && this.addCallback(gameRule.gameType, gameRule.ruleName, gameRule);
                    }
                });



                return;
            }
            AssetsManager.tipDialog('盟主和管理员才能添加玩法！');

        } else if (parameter.indexOf('selectgame') != -1) {
            let classify = parseInt(parameter.slice(10));
            if (this._curClassify == classify) return;
            this._curClassify = classify;
            this._loadGames();
        } else if (parameter === 'close') {
            if (this.node.getComponent('DialogWidgetCtrl')) {
                this.node.getComponent('DialogWidgetCtrl').out();
            } else {
                this.node.destroy();
            }
        }

    },

});