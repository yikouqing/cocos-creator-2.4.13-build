const Utils = require('../../../utils/Utils');
const AssetsManager = require('../../../utils/AssetsManager');
const ConfigModel = require('../../../model/ConfigModel');
const CCUtil = require('../../../utils/CCUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        dateLbl: cc.Label,
        head: cc.Sprite,
        uidLbl: cc.Label,
        nickLbl: cc.Label,
        gameNameLbl: cc.Label,
        roomIdLbl: cc.Label,
        rebateModeLbl: cc.Label,
        rebateLbl: cc.Label,
    },

    bind(data) {
        // console.log('返利明细', data);
        this.uidLbl.string = data.playerUid;
        this.nickLbl.string = data.playerNickname;
        AssetsManager.loadSpriteFrame({
            path: data.playerAvatar,
            sprite: this.head
        });
        this.gameNameLbl.string = ConfigModel.getGameName(data.gameType);
        this.roomIdLbl.string = data.roomID;
        this.rebateModeLbl.string = data.type == 8 ? '服务费' : data.type == 9 ? '保底抽分' : data.type == 5 ? '门票' : !!data.start ? "固定抽分" : "赢家抽分";
        this.rebateLbl.string = Utils.formatNumberWithSymbol(data.gainCount, 2);
        let date = Utils.getDateFormat(data.createTime);
        this.dateLbl.string = date.yyyymmddhhmm;
    },

});