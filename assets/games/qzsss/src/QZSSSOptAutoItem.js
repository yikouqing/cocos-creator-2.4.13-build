const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {
        sortId: cc.Label,
        cardPfb: cc.Prefab,
        layout1: cc.Node,
        layout2: cc.Node,
        layout3: cc.Node,
        _callFunc: null
    },

    onLoad() {
        cc.systemEvent.on("optCardAllCancel", this.onAllCancel, this)
    },

    onDestroy() {
        cc.systemEvent.off("optCardAllCancel", this.onAllCancel, this)
    },

    onAllCancel() {
        this.node.getComponent(cc.Toggle).isChecked = false
    },

    init(idx, arr, cb) {
        this.sortId.string = idx;
        this.cb = cb;
        let weidao = arr[0].ids;
        let zhongdao = arr[1].ids;
        let toudao = arr[2].ids;

        this.showCard(toudao, this.layout1)
        this.showCard(zhongdao, this.layout2)
        this.showCard(weidao, this.layout3)
        this._callFunc = cb
        this.cardArr = [toudao, zhongdao, weidao];
    },


    showCard(cardArr, layout) {
        cardArr.forEach(cid => {
            let node = cc.instantiate(this.cardPfb)
            node.parent = layout
            let com = node.addComponent('QZSSSCard')
            com.init()
            com.flower = cid
            com.setNodeShow(true)
        });
    },

    onClick(event) {
        if (event.isChecked) {
            this._callFunc && this._callFunc(this.cardArr);
        }
    },
});