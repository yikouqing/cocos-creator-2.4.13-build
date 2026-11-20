const ABManager = require('../../../utils/ABManager');
const UserModel = require('../../../model/UserModel');
const SubManager = require('../../../utils/SubManager');
const AssetsManager = require('../../../utils/AssetsManager');
const ApiHall = require('../../../api/ApiHall');
const MessageCallback = require('../../../utils/MessageCallback');
const Enums = require('../../../const/Enums');
const ConfigModel = require('../../../model/ConfigModel');
const CCUtil = require('../../../utils/CCUtil');
const CacheManager = require('../../../utils/CacheManager');

cc.Class({
    extends: cc.Component,

    properties: {
        tableInfoLay: cc.Node,
        tableIndexLay: cc.Node,
        tableIndex: cc.Label,
        tableName: cc.Label,
        tableInfo: cc.Label,
        players: cc.Node,
        tableSprite: cc.Sprite,
        btnDetail: cc.Node,

        _roomList: [],
        _unionInfo: null,
        _roomInfo: null,
        _tableStyleType: 1,
        _nickNames: [],
    },

    start() {
        MessageCallback.addListener('OnUnionSkinSync', this);
        this.btnDetail.active = !ConfigModel.getData("unionTableDetail");
    },

    messageCallbackHandler(route, msg) {
        switch (route) {
            case 'OnUnionSkinSync':
                this._onTableStyleSync(msg);
                break;
            default:
                break;
        }
    },

    getUnionTableSkin() {
        let unionInfo = this._unionInfo;
        let roomInfo = this._roomInfo;
        let skin = {
            color: 1,
            style: 0
        }
        let canUnionOwnerModifySkin = parseInt(ConfigModel.getData('canUnionOwnerModifySkin'));
        canUnionOwnerModifySkin = isNaN(canUnionOwnerModifySkin) ? 0 : canUnionOwnerModifySkin;
        if (!unionInfo) return skin;
        if (canUnionOwnerModifySkin == 1 || canUnionOwnerModifySkin == 0) {
            skin.color = !roomInfo.gameRule ? 1 : roomInfo.gameRule.tableStyleType;
            skin.style = unionInfo.tableStyle || 0;
        } else if (canUnionOwnerModifySkin == 2) {
            skin.color = CacheManager.getItem('unionTableColor');
            skin.style = CacheManager.getItem('unionTableStyle');
        }
        return skin;
    },

    bind(index, unionInfo, roomInfo) {
        if (!roomInfo) return;
        let skinId = ConfigModel.getSkin(Enums.bundleType.UNION);
        let skin = ConfigModel.getUnionTableSkin(skinId);
        this.index = index || 0;
        this.node.active = true;
        this._roomInfo = roomInfo;
        this._unionInfo = unionInfo;
        this.tableInfoLay.active = true;
        this.tableIndex.string = `${index}`;
        this._roomInfo.roomUserInfoArr = !this._roomInfo.roomUserInfoArr ? [] : this._roomInfo.roomUserInfoArr;
        let maxPlayerCount = this._roomInfo.gameRule.maxPlayerCount || 10;
        maxPlayerCount = maxPlayerCount > 10 ? 10 : maxPlayerCount;
        let tableSkin = this.getUnionTableSkin();
        let color = tableSkin.color;
        let style = tableSkin.style;
        color = parseInt(color) > 0 ? parseInt(color) : 1;
        color = color > 8 || color <= 0 ? 1 : color;
        if (color > skin.colorCount) color = skin.colorCount;
        let tempPlayer = maxPlayerCount > 10 || maxPlayerCount <= 0 ? 1 : maxPlayerCount;
        let tableInfoPos = skin.tableInfoPos || [];
        let tableIndexInfoPos = skin.tableIndexInfoPos || [];
        this.tableIndexLay.setPosition(tableIndexInfoPos[tempPlayer - 1]);
        let gameType = roomInfo.gameType || roomInfo.gameRule.gameType;
        let tableRes = '';
        let isRectTable = ConfigModel.isRectTable(roomInfo.gameRule);
        let bundle = ConfigModel.getBundleConfig(gameType);
        let isBaiRen = !!bundle && bundle.classify == Enums.bundleClass.BAIREN;
        //关于桌子样式需要核对一下isRectTable 和 isMultipleTable
        let tableInfoNodePos = !!isBaiRen ? skin.mulTableInfoPos : tableInfoPos[tempPlayer - 1];
        this.tableInfoLay.setPosition(tableInfoNodePos);
        if (!!isBaiRen) {
            maxPlayerCount = this._roomInfo.roomUserInfoArr.length || 0;
            tableRes = `br-${color}`;
        } else {
            if (!!isRectTable && maxPlayerCount < 5) {
                if (style == 0) {
                    tableRes = `mj-${color}-${maxPlayerCount}`;
                } else {
                    tableRes = `${color}-${maxPlayerCount}`;
                }
            } else {
                if (skin.isMultipleTable) {
                    tableRes = `${color}-5`;
                } else {
                    tableRes = `${color}-${maxPlayerCount}`;
                }
            }
        }
        let users = this.userFilter(this._roomInfo.roomUserInfoArr, maxPlayerCount);
        let tablePlayers = users.gaming;
        let bureau = this._roomInfo.gameRule.bureau;
        let share = ConfigModel.getRoomRuleShare(this._roomInfo.gameRule);
        this.tableName.string = `${this._roomInfo.ruleName || this._roomInfo.gameRule.ruleName || ConfigModel.getGameName(this._roomInfo.gameType || this._roomInfo.gameRule.gameType)}`;
        if (!!isBaiRen) {
            let playerCount = this._roomInfo.roomUserInfoArr.length > 0 ? `${this._roomInfo.roomUserInfoArr.length}人` : '';
            this.tableInfo.string = `${share.baseTitle}:${share.baseScore} ${playerCount}`;
        } else {
            this.tableInfo.string = `${maxPlayerCount}人/${bureau}${share.roundTitle} ${share.baseTitle}:${share.baseScore}`;
        }
        AssetsManager.loadSpriteFrame({
            path: "res/sprite/tables/" + tableRes,
            bundle: ConfigModel.getSkin(Enums.bundleType.UNION),
            sprite: this.tableSprite
        });
        for (const player of this.players.children) {
            player.active = false;
            let avatar = player.getChildByName('avatar');
            if (!avatar) continue;
            avatar.destroyAllChildren();
            let nick = player.getChildByName('nick');
            if (!nick || !nick.getComponent(cc.Label)) continue;
            nick.getComponent(cc.Label).string = '';
        }
        if (!!isBaiRen) return;
        let tablePlayerPos = style == 1 ? skin.tablePlayerPos : skin.rectTablePlayerPos;
        let playerPos = isBaiRen ? skin.tableBaiRenPlayerPos : tablePlayerPos[maxPlayerCount - 1];
        if (!this.players || !playerPos || tablePlayers.length > maxPlayerCount) return;
        for (let i = 0; i < tablePlayers.length; i++) {
            let player = this.players.children[i];
            if (!player) continue;
            player.active = true;
            player.setPosition(playerPos[i]);
            let avatar = player.getChildByName('avatar');
            if (!avatar) continue;
            avatar.destroyAllChildren();
            let parentSize = player.getContentSize();
            let pNode = AssetsManager.createSpriteNode({
                path: tablePlayers[i].avatar,
                width: parentSize.width,
                height: parentSize.height,
            });
            avatar.addChild(pNode);
            let nick = player.getChildByName('nick');
            if (!nick || !nick.getComponent(cc.Label)) continue;
            nick.getComponent(cc.Label).string = tablePlayers[i].nickname + i;
        }
    },

    userFilter(users, maxPlayerCount) {
        let filter = {
            gaming: [],
            look: []
        }
        for (const user of users) {
            if (user.chairID < maxPlayerCount) {
                filter.gaming.push(user);
            } else {
                filter.look.push(user);
            }
        }
        return filter;
    },

    clear() {
        this.node.active = false;
        this.tableInfoLay.active = false;
        this.tableInfo.string = '';
        this.tableName.string = '';
        for (const player of this.players.children) {
            if (!player) continue;
            player.active = false;
            let avatar = player.getChildByName('avatar');
            if (!avatar) continue;
            avatar.destroyAllChildren();
            let nick = player.getChildByName('nick');
            if (!nick || !nick.getComponent(cc.Label)) continue;
            nick.getComponent(cc.Label).string = '';
        }
    },

    onBtnClick(event, param) {
        switch (param) {
            case 'enteryx':
                if (!!CCUtil.clickInterval(event.target, 1.5)) return;
                let unionTableDetail = ConfigModel.getData("unionTableDetail");
                if (!!unionTableDetail) {
                    this._onDetailClick();
                } else {
                    this._onEnterClick();
                }
                break;
            case 'info':
                this._onDetailClick();
                break;
        }
    },

    _onDetailClick() {
        AssetsManager.createDialog({
            path: "res/prefab/union/main/UnionTableNewDetailDialog",
            bundle: ConfigModel.getSkin(),
            roomInfo: this._roomInfo,
            unionInfo: this._unionInfo
        });
    },

    _onEnterClick() {
        let isDownload = SubManager.checkLoad(this._roomInfo.gameRule.gameType);
        let needUpdate = ABManager.checkUpdate(this._roomInfo.gameRule.gameType);
        let join = {
            union: this._unionInfo,
            room: this._roomInfo
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

    _onTableStyleSync(data) {
        if (data.syncType != 2) return;
        this._unionInfo.tableStyle = data.value;
        this.bind(this.index, this._unionInfo, this._roomInfo);
    },

    onDestroy() {
        MessageCallback.removeListener('OnUnionSkinSync', this);
    }

});