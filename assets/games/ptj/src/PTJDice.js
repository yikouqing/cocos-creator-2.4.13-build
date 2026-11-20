const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');

cc.Class({
    extends: cc.Component,

    properties: {
        saizidi: sp.Skeleton,
        saizishang: sp.Skeleton,
        dice1: cc.Sprite,
        dice2: cc.Sprite,
    },


    init(d1, d2, call) {
        AssetsManager.loadSpriteFrame({
            path: "res/sprite/dice/mj_dice-sezi_value" + d1,
            sprite: this.dice1,
            bundle: Enums.bundleType.PTJ,
        })

        AssetsManager.loadSpriteFrame({
            path: "res/sprite/dice/mj_dice-sezi_value" + d2,
            sprite: this.dice2,
            bundle: Enums.bundleType.PTJ,
        })
        this.dice1.node.active = false
        this.dice2.node.active = false

        AssetsManager.playEffect({
            path: 'res/audio/main/yaoshaizi',
            bundle: Enums.bundleType.PTJ
        });
        this.saizidi.setAnimation(0, "sezidi", false)
        this.saizishang.setAnimation(0, "sezishang", false)
        this.scheduleOnce(() => {
            this.dice1.node.active = true
            this.dice2.node.active = true
        }, 2.1);
        this.scheduleOnce(() => {
            call && call();
            this.node.destroy()
        }, 3.5);
    },

    // update (dt) {},
});