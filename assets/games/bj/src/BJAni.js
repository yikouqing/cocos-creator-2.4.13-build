const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {
        kaishi: sp.Skeleton,
        kaishibipai: sp.Skeleton,
    },

    start() { },

    /**展示动画 1开始游戏  3开始比牌 */
    showSpineAni(type, cb = null) {
        let aniName = "animation"
        let aniNode = this.kaishi
        if (type == 1) {
            AssetsManager.playEffect({
                path: "res/audio/startGame",
                bundle: Enums.bundleType.BJ
            });
        } else if (type == 3) {
            aniName = "animation"
            aniNode = this.kaishibipai
            AssetsManager.playEffect({
                path: "res/audio/start_compare",
                bundle: Enums.bundleType.BJ
            });
        }

        aniNode.node.active = true
        aniNode.setAnimation(0, aniName, false)
        aniNode.setCompleteListener(() => {
            cb && cb()
            this.node.destroy()
        });
    },
});