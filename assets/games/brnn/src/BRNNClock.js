const Enums = require('../../../src/const/Enums');
const BRNNModel = require("./BRNNModel")
const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiBrnn = require('./ApiBrnn');
const CCUtil = require("../../../src/utils/CCUtil")

cc.Class({
    extends: cc.Component,

    properties: {
        img_state: cc.Sprite,
        txt_time: cc.Label,
        _tick: -1,
        _checkTime: 0,
    },

    /**显示闹钟 */
    setClock(tick = null, state) {
        if (tick == null) {
            this.img_state.node.active = false
            return
        }
        this.img_state.node.active = true
        this._tick = tick <= 0 ? 0 : Math.floor(tick)
        this.txt_time.string = this._tick + ""
        this._checkTime = 0
        if (state) {
            AssetsManager.loadSpriteFrame({
                path: "res/sprite/state/" + state,
                bundle: Enums.bundleType.BRNN,
                sprite: this.img_state
            })
        }
    },

    update(dt) {
        if (this._tick >= 0) {
            this._checkTime += dt
            if (this._checkTime >= 1) {
                this._checkTime = 0
                if (this._tick - 1 >= 0) {
                    this._tick--
                }
                this.txt_time.string = this._tick + ""
                if (this._tick <= 3 && BRNNModel.getGameStatus() == ApiBrnn.gameStatus.POUR_SCORE) {
                    AssetsManager.playEffect({
                        path: "res/audio/sound-countdown",
                        bundle: Enums.bundleType.BRNN
                    });
                }
            }
        }
    },
});