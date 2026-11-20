const CCUtil = require('../../../src/utils/CCUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad() {

    },

    initWidget(cardDataArr, index) {

        for (let i = 0; i < cardDataArr.length; ++i) {
            let node = AssetsManager.createSpriteNode({
                path: 'sprite/cards/' + cardDataArr[i],
                width: 220,
                height: 260
            });
            node.parent = this.node;
        }
        if (index === 1) {
            this.node.anchorX = 0.5;
        } else if (index === 2 || index === 3 || index === 4) {
            this.node.anchorX = 1;
        } else if (index === 5) {
            this.node.anchorX = 0;
        }
        // 播放动画
        this.node.scale = 0.5 * 0.9;
        let action = cc.scaleTo(0.15, 0.6);
        action.easing(cc.easeBackOut());
        this.node.runAction(action)
    },

    getCenterPos() {
        if (this.node.anchorX === 1) {
            return cc.v2(-30 * this.node.childrenCount, 0);
        } else if (this.node.anchorX === 0) {
            return cc.v2(30 * this.node.childrenCount, 0);
        } else {
            return cc.v2(0, 0);
        }
    }
});