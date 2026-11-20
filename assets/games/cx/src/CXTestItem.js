const AssetsManager = require('../../../src/utils/AssetsManager');

cc.Class({
    extends: cc.Component,

    properties: {
        card: cc.Sprite,
        checkMark: cc.Node,

        _card: -1,
    },

    start() {
        cc.systemEvent.on('OnTestSelectedSync', this._onTestSelectedSync, this);
    },

    _onTestSelectedSync(selected) {
        this.checkMark.active = selected.indexOf(this._card) != -1;
    },

    bind(selected, card) {
        // console.log('邦定测试', selected, card);
        AssetsManager.loadSpriteFrame({
            path: 'sprite/cards/' + card,
            sprite: this.card
        });
        this._card = card;
        this.checkMark.active = selected.indexOf(card) != -1;
    },

    onClick() {

        cc.systemEvent.emit('OnTestSelected', this._card, this);
    },

    onDestroy() {
        cc.systemEvent.off('OnTestSelectedSync', this._onTestSelectedSync, this);
    },

});