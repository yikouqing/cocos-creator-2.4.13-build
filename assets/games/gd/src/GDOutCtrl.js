const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {
        clock: cc.Node,
        btnBuChu: cc.Node,
        btnTiShi: cc.Node,
        btnChuPai: cc.Node,
        btnBuChu1: cc.Node,
        _btnBuChuPos: null,
        _btnTiShiPos: null,
        _btnChuPaiPos: null,
        _inited: false,
    },

    sync(matched) {
        this.node.active = true;
        if (!this._inited) {
            this._inited = true;
            this._btnBuChuPos = this.btnBuChu.getPosition();
            this._btnTiShiPos = this.btnTiShi.getPosition();
            this._btnChuPaiPos = this.btnChuPai.getPosition();
        }

        this.btnBuChu.active = true;
        this.btnBuChu1.active = false;
        this.clock.destroyAllChildren();

        // this.btnTiShi.active = true;
        // this.btnChuPai.active = true;

        // this.btnBuChu.setPosition(this._btnTiShiPos);
        // this.btnTiShi.setPosition(this._btnBuChuPos);
        // this.btnChuPai.setPosition(this._btnChuPaiPos);


        this.btnTiShi.active = !!matched && matched.length > 0;
        this.btnChuPai.active = !!matched && matched.length > 0;
        if (!!matched && matched.length > 0) {
            //有牌可出
            this.btnBuChu.setPosition(this._btnTiShiPos);
            this.btnTiShi.setPosition(this._btnBuChuPos);
            this.btnChuPai.setPosition(this._btnChuPaiPos);
        } else {
            this.btnBuChu.setPosition(this._btnBuChuPos);
            this.btnBuChu.active = true;
            // this.btnBuChu1.active = true;
        }
        AssetsManager.loadAsset({
            path: 'res/prefab/GDClock',
            bundle: Enums.bundleType.GD,
            aType: cc.Prefab
        }, (item) => {
            this.clock.destroyAllChildren();
            if (!item || !cc.isValid(this.clock) || !this.node.active) return;
            const clock = cc.instantiate(item);
            this.clock.addChild(clock);
        })
    },

    clear() {
        this.clock.destroyAllChildren();
        this.node.active = false;
        if (!!this._inited) {
            this.btnBuChu.setPosition(this._btnBuChuPos);
            this.btnTiShi.setPosition(this._btnTiShiPos);
            this.btnChuPai.setPosition(this._btnChuPaiPos);
        }
    },

});