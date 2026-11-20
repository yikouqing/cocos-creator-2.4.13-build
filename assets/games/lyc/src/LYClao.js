const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const Utils = require('../../../src/utils/Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        cardPos: cc.Node,
        _cb: null,
        optSpine: sp.Skeleton
    }, 
    start() {
        this.optSpine.setCompleteListener(() => {
            if (this._cb) {
                this._cb(this.cardPos)
            }
            this.node.destroy()
        });
    },

    showAnimation(cardId) {
        let aniName = 'card0'
        if (cardId == 2) {
            aniName = "card1"
        } else if (cardId == 3) {
            aniName = "card2"
        } else if (cardId == 3) {
            aniName = "card3"
        }
        // 设置并播放动画
        this.optSpine.setAnimation(1, aniName, false)


    },


    /**展示操作动画 */
    show(cb = null) {
        this._cb = cb
    },

});