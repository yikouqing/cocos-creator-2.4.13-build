const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {
        winSpine: sp.Skeleton,
        betTipSpine: sp.Skeleton,
    },

    /**展示动画 1 poolwin 2开始下注  3停止下注*/
    showSpineAni(type, cb = null) {
        // console.log("展示动画===", type)
        let aniName = "win1"
        let aniNode = this.winSpine
        if (type == 1) {
            // AssetsManager.playEffect({
            //     path: "res/audio/startGame",
            //     bundle: Enums.bundleType.BJJ
            // });
        } else if (type == 2) {
            aniName = "Animation1"
            aniNode = this.betTipSpine
            AssetsManager.playEffect({
                path: "res/audio/sound-start-wager",
                bundle: Enums.bundleType.BRNN
            });
        } else if (type == 3) {
            aniName = "Animation2"
            aniNode = this.betTipSpine
            AssetsManager.playEffect({
                path: "res/audio/sound-end-wager",
                bundle: Enums.bundleType.BRNN
            });
        }

        aniNode.node.active = true
        aniNode.setAnimation(0, aniName, false)
        aniNode.setCompleteListener((trackEntry, loopCount) => {
            if (trackEntry.animation.name == 'win1') {
                this.winSpine.premultipliedAlpha = false;
                this.winSpine.setSkin('default');
                this.winSpine.setAnimation(0, 'win2', true);
            } else {
                cb && cb()
                this.node.destroy()
            }
        });
    },
});