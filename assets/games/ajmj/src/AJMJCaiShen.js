const CCUtil = require('../../../src/utils/CCUtil');
const AJMJModel = require('./AJMJModel');
cc.Class({
    extends: cc.Component,

    properties: {
        tileItem: cc.Prefab,
        showStart: cc.Node,
        showAinm: sp.Skeleton,
        showEnd: cc.Node,
        _caiShen: []
    },

    onLoad() {
        this.reset();
    },

    showCaiShen(isAnim) {
        this.reset();
        let fanCardID = AJMJModel.getFanCard();
        if (!fanCardID || !this.tileItem) return;
        if (this.showEnd.getComponent(cc.Widget)) {
            this.showEnd.getComponent(cc.Widget).updateAlignment();
        }
        let posEnd = CCUtil.postionConvert(this.showEnd, this.node);
        let showEndSpr = (isShow) => {
            this.showEnd.getComponent(cc.Sprite).enabled = isShow
        }
        let tNode = cc.instantiate(this.tileItem)
        let com = tNode.addComponent("AJMJSingleTile");
        showEndSpr(false);

        com.init();
        com.flower = fanCardID;
        com.setHuaCount(1);
        tNode.setPosition(0, 0);
        this._caiShen.push(com);
        this.showEnd.active = true;
        tNode.scale = isAnim ? 2 : 0.8;

        if (!isAnim) {
            showEndSpr(true);
            tNode.parent = this.showEnd;
        } else {
            this.showStart.active = true;
            tNode.parent = this.showStart;
            this.showAinm.node.active = true;
            this.showAinm.setAnimation(0, "animation", false);
            cc.tween(tNode)
                .delay(1)
                .call(() => {
                    this.showAinm.node.active = false;
                })
                .to(0.2, { scale: 0.8 })
                .to(0.5, { position: posEnd })
                .call(() => {
                    this.showStart.active = false;
                    tNode.parent = this.showEnd;
                    tNode.setPosition(0, 0);
                    showEndSpr(true);
                })
                .start();
        }
    },

    reset() {
        this._caiShen.forEach(com => {
            if (com && com.node) {
                com.node.destroy();
            }
        });
        this._caiShen = [];
        this.showEnd.active = false;
        this.showStart.active = false;
        this.showEnd.removeAllChildren();
    },
});