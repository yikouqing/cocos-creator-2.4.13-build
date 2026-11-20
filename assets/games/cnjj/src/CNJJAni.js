const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {
        kaishi: sp.Skeleton,
        kaishibipai: sp.Skeleton,
        quanleida: sp.Skeleton,
    },

    start() { },

    /**展示动画 1开始游戏  2全垒打 3开始比牌  */
    showSpineAni(type, cb = null) {
        // console.log("展示动画===", type)
        let aniName = "animation"
        let aniNode = this.kaishi
        if (type == 1) {
            AssetsManager.playEffect({
                path: "res/audio/startGame",
                bundle: Enums.bundleType.CNJJ
            });
        } else if (type == 2) {
            aniName = "quanleida"
            aniNode = this.quanleida
            AssetsManager.playEffect({
                path: "res/audio/qld",
                bundle: Enums.bundleType.CNJJ
            });
            this.scheduleOnce(() => {
                AssetsManager.playEffect({
                    path: "res/audio/suiboli",
                    bundle: Enums.bundleType.CNJJ
                });
            }, 2)
        } else if (type == 3) {
            aniName = "animation"
            aniNode = this.kaishibipai
            AssetsManager.playEffect({
                path: "res/audio/start_compare",
                bundle: Enums.bundleType.CNJJ
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