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
        roomInfoLbl: cc.Label,
        rebateModeLbl: cc.Label,
        rebateLbl: cc.Label,
    },

    initWidget(data) {
        this.uidLbl.string = data.playerUid;
        this.nickLbl.string = data.playerNickname;
        AssetsManager.loadSpriteFrame({
            path: data.playerAvatar,
            sprite: this.head
        });
        this.roomInfoLbl.string = `${ConfigModel.getGameName(data.gameType)}(${data.roomID})`;
        this.rebateModeLbl.string = data.type == 8 ? '服务费' : data.type == 9 ? '保底抽分' : data.type == 5 ? '门票' : !!data.start ? "固定抽分" : "赢家抽分";
        this.rebateLbl.string = Utils.formatNumberWithSymbol(data.gainCount, 2);
        let date = Utils.getDateFormat(data.createTime);
        // this.dateLbl.string = date.yyyymmddhhmm;
        this.dateLbl.string = `${date.yyyymmdd}\n${date.hhmm}`;
    },

});