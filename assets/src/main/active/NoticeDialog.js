const AssetsManager = require('../../utils/AssetsManager');
const ApiHall = require('../../api/ApiHall');

cc.Class({
    extends: cc.Component,

    properties: {
        noticeScrollView: cc.ScrollView,
        contSprite: cc.Sprite,

        _curType: 'gfsm'
    },

    start() {
        this._contSync();
    },

    _contSync() {
        if (this.noticeScrollView) this.noticeScrollView.scrollToTop();
        if (!cc.isValid(this.contSprite)) return;
        this.contSprite.node.curType = this._curType;
        AssetsManager.loadAsset({
            path: `sprite/notice/${this._curType}`,
            aType: cc.SpriteFrame,
        }, (as) => {
            if (!as || !cc.isValid(this.contSprite) || this.contSprite.node.curType != this._curType) return;
            this.contSprite.spriteFrame = as;
        })
    },

    onBtnClick(event, param) {
        switch (param) {
            case 'close':
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
                break;
            case 'gfsm':
            case 'jzdb':
            case 'fcm':
            case 'jkyx':
                if (this._curType == param) return;
                this._curType = param;
                this._contSync();
                break;
        }
    },

});