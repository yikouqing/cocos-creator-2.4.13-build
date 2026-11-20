const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const GDModel = require('./GDModel');

cc.Class({
    extends: cc.Component,

    properties: {
        card: cc.Sprite,
        mask: cc.Node, //遮罩
        banker: cc.Node, //庄家
        _cardId: -1,
        _last: false,
        _isSelects: false,
        _initPos: cc.v2(),
    },

    bind(cardId, last, pos, uid) {
        this.gray(false);
        this._last = last;
        this._initPos = pos;
        this._cardId = cardId;
        this.showHuaSe(false);
        this.showBanker(false); //uid == GDModel.getBankerUID() && !!last;
        this.setSelects(false);
        if (!this.card) return;
        this.node.active = true;
        this.node.opacity = 255;
        this.node.stopAllActions();
        cc.Tween.stopAllByTarget(this.node);
        AssetsManager.loadSpriteFrame({
            path: `sprite/cards/${cardId}`,
            sprite: this.card
        });
    },

    result(cardId, rest = null) {
        this.gray(false);
        this._last = false;
        this._cardId = cardId;
        this.showHuaSe(false);
        this.showBanker(false);
        if (!this.card) return;
        this.node.active = true;
        this.node.opacity = 255;
        this.node.stopAllActions();
        AssetsManager.loadSpriteFrame({
            path: `sprite/cards/${cardId}`,
            sprite: this.card
        });
        if (!rest) {
            if (this.mask) this.mask.active = false;
        } else {
            if (this.mask) this.mask.active = rest.indexOf(cardId) != -1;
        }
    },


    showBox(initInfo) {
        this.node.zIndex = initInfo ? initInfo.zIndex : 0;
        if (!this.node.getChildByName("box") || !initInfo) return
        let nodeBox = this.node.getChildByName("box");
        nodeBox.getComponent(cc.Sprite).enabled = false;
        nodeBox.height = this.node.height;
        nodeBox.width = this.node.width;
        nodeBox.setPosition(0, 0);
        nodeBox.active = true;
        if (GDModel.getCardRow()) {
            nodeBox.x = this._last ? 0 : -this.node.width / 3;
            nodeBox.width = this._last ? this.node.width : this.node.width * 0.25;
        } else {
            let index = initInfo.index || 0;
            nodeBox.y = index == 0 ? 0 : this.node.height / 2.8;
            nodeBox.height = this.node.height * (index == 0 ? 0.85 : 0.2); //*0.25高比例
            // nodeBox.height = this.node.height * (index == 0 ? 0.85 : 0.4);
        }
    },



    showHuaSe(isShow = false, curCardID = this._cardId) {
        if (!this.node.getChildByName("huase")) return;
        let huase = this.node.getChildByName("huase");
        huase.active = false;
        if (!isShow || !curCardID) {
            return
        }
        let url = null;
        let isType = true; //true：A-K
        if (curCardID > 0 && curCardID < (isType ? 14 : 11)) {
            url = "spr_fangkuai";
        } else if (curCardID > 16 && curCardID < (isType ? 30 : 27)) {
            url = "spr_meihua";
        } else if (curCardID > 32 && curCardID < (isType ? 46 : 43)) {
            url = "spr_hongtao";
        } else if (curCardID > 48 && curCardID < (isType ? 62 : 59)) {
            url = "spr_heitao";
        }
        if (!!url) {
            huase.active = true;
            AssetsManager.loadSpriteFrame({
                bundle: Enums.bundleType.GD,
                path: `res/sprite/huase/${url}`,
                sprite: huase.getComponent(cc.Sprite)
            });
        }
    },

    getBoxNode() {
        return this.node.getChildByName("box");
    },

    getPos() {
        return this._initPos;
    },

    showBanker(isShow) {
        if (this.banker) this.banker.active = isShow;
    },

    gray(isShow) {
        if (!this.card) return;
        if (this.mask) this.mask.active = isShow;
    },

    setButton() {
        if (this.mask) this.mask.active = false;
        if (this.banker) this.banker.active = !!this._last;
    },

    reset() {
        if (!this.card) return;
        this.node.active = false;
        this.card.spriteFrame = null;
        if (this.mask) this.mask.active = false;
        if (this.banker) this.banker.active = false;
    },

    nodeY(isSelects) {
        this.node.y = this._initPos.y + (isSelects ? 30 : 0);
    },

    setSelects(isSelects) {
        this._isSelects = isSelects;
    },

    getSelects() {
        return this._isSelects;
    },

    getCardId() {
        return this._cardId || 0;
    }

});