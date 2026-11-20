const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {
        sortId: cc.Label,
        toudaoArr: [cc.Node],
        zhongdaoArr: [cc.Node],
        weidaoArr: [cc.Node],
        selecteBg: cc.Node,
        _isSelected: false
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {

    },

    start() {

    },
    onClick() {
        this.cb && this.cb(this.cardArr);
        this.setSelecteBg(true);
    },

    setSelecteBg(type) {
        this.selecteBg.active = type;
    },

    setCardArr(id, arr, cb) {
        this.sortId.string = id;
        this.cb = cb;
        let weidao = arr[0].ids;
        let zhongdao = arr[1].ids;
        let toudao = arr[2].ids;
        for (let x = 0; x < 5; x++) {
            this.setCardSpirte(this.weidaoArr[x], weidao[x]);
            this.setCardSpirte(this.zhongdaoArr[x], zhongdao[x]);
        }
        for (let x = 0; x < toudao.length; x++) {
            this.setCardSpirte(this.toudaoArr[x], toudao[x]);
        }
        this.cardArr = [weidao, zhongdao, toudao];
    },

    setCardSpirte(node, cardId) {
        AssetsManager.loadSpriteFrame({
            path: 'res/sprite/cards/' + cardId,
            sprite: node.getComponent(cc.Sprite),
            bundle: Enums.bundleType.SSS
        });
    },

});