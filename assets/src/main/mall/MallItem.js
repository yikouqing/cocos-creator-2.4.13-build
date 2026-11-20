const AssetsManager = require('../../utils/AssetsManager');
const ConfigModel = require('../../model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        costLbl: cc.Label,
        gainLbl: cc.Label,
        addLbl: cc.Label,
        iconSprite: cc.Sprite,
        _item: null
    },

    bind(data) {
        this._item = data;
        data.rIndex += 1;
        this.costLbl.string = `$${data.count}`;
        let addMsg = '';
        if (data.addGold > 0) {
            addMsg = `(赠送${data.addGold}钻石)`;
            this.addLbl.string = addMsg;
        }
        this.gainLbl.string = `${data.gold}钻石`;
        let icon = data.rIndex > 8 ? 8 : data.rIndex;
        AssetsManager.loadSpriteFrame({
            path: `sprite/mall/${icon}`,
            sprite: this.iconSprite
        })
    },

    onClick() {
        if (!this._item) return;
        AssetsManager.createDialog({
            order: this._item,
            path: 'res/prefab/main/mall/PayDialog',
            bundle: ConfigModel.getSkin(),
        });
    },

});