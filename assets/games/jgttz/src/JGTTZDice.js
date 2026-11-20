const ApiJgttz = require('./ApiJgttz');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const MessageCallback = require('../../../src/utils/MessageCallback');
const NativeUtil = require('../../../src/utils/NativeUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const SubManager = require('../../../src/utils/SubManager');
const UserModel = require('../../../src/model/UserModel');
const Utils = require('../../../src/utils/Utils');
const ApiHall = require('../../../src/api/ApiHall');
const AudioUtil = require('../../../src/utils/AudioUtil');
const ConfigModel = require('../../../src/model/ConfigModel');
const Codes = require('../../../src/const/Codes');
const JGTTZModel = require("./JGTTZModel")
const CCUtil = require("../../../src/utils/CCUtil")

cc.Class({
    extends: cc.Component,

    properties: {
        saizidi: sp.Skeleton,
        saizishang: sp.Skeleton,
        dice1: cc.Sprite,
        dice2: cc.Sprite,
    },


    init(d1, d2) {
        AssetsManager.loadSpriteFrame({
            path: "res/sprite/dice/mj_dice-sezi_value" + d1,
            sprite: this.dice1,
            bundle: Enums.bundleType.JGTTZ,
        })

        AssetsManager.loadSpriteFrame({
            path: "res/sprite/dice/mj_dice-sezi_value" + d2,
            sprite: this.dice2,
            bundle: Enums.bundleType.JGTTZ,
        })
        this.dice1.node.active = false
        this.dice2.node.active = false

        AssetsManager.playEffect({
            path: 'res/audio/main/yaoshaizi',
            bundle: Enums.bundleType.JGTTZ
        });
        this.saizidi.setAnimation(0, "sezidi", false)
        this.saizishang.setAnimation(0, "sezishang", false)


        this.scheduleOnce(() => {
            this.dice1.node.active = true
            this.dice2.node.active = true
        }, 2.1);

        this.scheduleOnce(() => {
            this.node.destroy()
        }, 4.1);
    },

    // update (dt) {},
});