const SubManager = require('../../../utils/SubManager');
const AssetsManager = require('../../../utils/AssetsManager')
const UserModel = require('../../../model/UserModel');
const ApiHall = require('../../../api/ApiHall');
const ABManager = require('../../../utils/ABManager');
const ConfigModel = require('../../../model/ConfigModel');
const NativeUtil = require('../../../utils/NativeUtil');
const CCUtil = require('../../../utils/CCUtil');
const Enums = require('../../../const/Enums');
const MessageCallback = require('../../../utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        gameSprite: cc.Sprite,//游戏头像
        ruleNameLbl: cc.Label,//房间名称
        baseTitleLbl: cc.Label,//底分标题
        baseScoreLbl: cc.Label,//底分
        ruleDescLbl: cc.Label,//规则描述

        _roomInfo: null,
        _unionInfo: null,
        _unionID: null,
    },

    bind(roomInfo, unionInfo) {
        this._unionID = unionInfo.unionID;
        this._roomInfo = roomInfo;
        this._unionInfo = unionInfo;
        let gameRule = roomInfo.gameRule;
        let share = ConfigModel.getRoomRuleShare(roomInfo.gameRule);
        this.baseTitleLbl.string = share.baseTitle;
        this.baseScoreLbl.string = share.baseScore;
        this.ruleDescLbl.string = CCUtil.stringClamp(share.content, 50, '...');
        this.ruleNameLbl.string = ` ${ConfigModel.getGameName(gameRule.gameType)}`;
        if (this.gameSprite) {
            AssetsManager.loadSpriteFrame({
                path: `sprite/room/game_${gameRule.gameType}`,
                sprite: this.gameSprite
            });
        }

    },

    onBtnClick(event, params) {
        if (params === 'shanchu') {
            AssetsManager.popDialog({
                content: "确定要删除当前玩法吗？",
                ok: () => {
                    let reqData = {
                        unionID: this._unionID,
                        roomRuleID: this._roomInfo._id
                    };
                    ApiHall.removeRoomRuleListRequest(reqData, (res) => {
                        AssetsManager.tipDialog("删除成功");
                        MessageCallback.emitMessage("UnionInfoSync");
                    });
                },
                no: () => { }
            });
        } else if (params === 'xiugai') {
            if (this._unionInfo.unionType != Enums.UnionType.NORMAL) {
                AssetsManager.createDialog({
                    path: "res/prefab/union/manager/UnionAddRuleDialog",
                    bundle: ConfigModel.getSkin(),
                    gameRule: this._roomInfo.gameRule,
                    unionInfo: this._unionInfo,
                    from: 'detail',
                    cb: (gameType, ruleName, gameRule) => {
                        let reqData = {
                            unionID: this._unionID,
                            ruleID: this._roomInfo._id,
                            gameType: gameType,
                            ruleName: ruleName,
                            roomRule: gameRule
                        };
                        ApiHall.updateRoomRuleListRequest(reqData, (res) => {
                            AssetsManager.tipDialog("修改成功");
                            MessageCallback.emitMessage("UnionInfoSync");
                        });
                    }
                });
            } else {
                AssetsManager.createDialog({
                    bundle: ConfigModel.getSkin(),
                    path: "res/prefab/main/room/CreateRoomDialog",
                    isUnion: true,
                    gameRule: this._roomInfo.gameRule,
                    unionInfo: this._unionInfo,
                    cb: (node, gameRule) => {
                        let gameType = this._roomInfo.gameType || this._roomInfo.gameRule.gameType;
                        let ruleName = this._roomInfo.ruleName || this._roomInfo.gameRule.ruleName || ConfigModel.getGameName(this._roomInfo.gameType || this._roomInfo.gameRule.gameType);
                        let reqData = {
                            unionID: this._unionID,
                            ruleID: this._roomInfo._id,
                            gameType: gameType,
                            ruleName: ruleName,
                            roomRule: gameRule
                        };
                        ApiHall.updateRoomRuleListRequest(reqData, (res) => {
                            if (!!node && cc.isValid(node)) node.destroy();
                            AssetsManager.tipDialog("修改成功");
                            MessageCallback.emitMessage("UnionInfoSync");
                        });
                    }
                });
            }
        }
    },

});