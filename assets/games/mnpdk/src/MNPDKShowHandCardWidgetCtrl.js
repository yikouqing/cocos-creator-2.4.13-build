const CCUtil = require('../../../src/utils/CCUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {},

    onLoad() {},

    initWidget(cardDataArr, index) {
        for (let i = 0; i < cardDataArr.length; ++i) {
            let node = AssetsManager.createSpriteNode({
                path: 'sprite/cards/' + cardDataArr[i],
                width: 46,
                height: 62
            });
            node.parent = this.node;
        }
        if (index === 1) {
            this.node.anchorX = 1;
        } else if (index === 2) {
            this.node.anchorX = 0;
        }
    }
});