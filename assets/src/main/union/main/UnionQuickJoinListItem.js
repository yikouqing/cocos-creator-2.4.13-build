const ABManager = require('../../../utils/ABManager');
const AssetsManager = require('../../../utils/AssetsManager')
const ApiHall = require('../../../api/ApiHall');
const UserModel = require('../../../model/UserModel');
const ConfigModel = require('../../../model/ConfigModel');
const SubManager = require('../../../utils/SubManager');
const Utils = require('../../../utils/Utils');
const Enums = require('../../../const/Enums');
const CCUtil = require('../../../utils/CCUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        gameNameLbl: cc.Label,
        gameInfoLbl: cc.Label,

        _unionID: null,
        _roomInfo: null,
        _unionInfo: null,
    },

    bind(unionInfo, roomInfo) {
        this._unionInfo = unionInfo;
        this._unionID = this._unionInfo.unionID;
        this._roomInfo = roomInfo;
        let share = ConfigModel.getRoomRuleShare(roomInfo.gameRule);
        let baseScore = share.baseScore;
        let maxBureau = this._roomInfo.gameRule.bureau;
        let curBureau = this._roomInfo.curBureau || 0;
        let ruleName = this._roomInfo.ruleName || this._roomInfo.gameRule.ruleName || ConfigModel.getGameName(this._roomInfo.gameRule.gameType);
        let maxPlayerCount = this._roomInfo.gameRule.maxPlayerCount;
        this.gameNameLbl.string = `${ruleName}(${maxPlayerCount}人)`;
        this.gameInfoLbl.string = `(${curBureau})${maxBureau ? maxBureau : ""}${share.roundTitle} ${share.baseTitle}:${baseScore}`;
    },

    onClick(event, param) {
        switch (param) {
            case 'join':
                this._onJoin(event);
                break;
            case 'detail':
                this._onDetail();
                break;
            default:
                break;
        }
    },

    _onJoin(event) {
        if (!!CCUtil.clickInterval(event.target, 1.5)) return;
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

    _onDetail() {
        AssetsManager.createDialog({
            path: "res/prefab/union/main/UnionTableNewDetailDialog",
            bundle: ConfigModel.getSkin(),
            roomInfo: this._roomInfo,
            unionInfo: this._unionInfo,
            searchPlayer: false
        });
    },

});