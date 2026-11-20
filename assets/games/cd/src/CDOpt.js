const Enums = require('../../../src/const/Enums');
const CDModel = require("./CDModel")
const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiCd = require('./ApiCd');
const CCUtil = require("../../../src/utils/CCUtil")

cc.Class({
    extends: cc.Component,

    properties: {
        clock: cc.Node,
        bet: cc.Node,
        robBanker: cc.Node,
        img_state: cc.Sprite,
        txt_time: cc.Label,
        txt_status: cc.Label,
        _tick: -1,
        _checkTime: 0,
    },

    gameInit(data) {

    },

    reset() {
        this.setBetNode()
        this.setRobBankerNode(false)
        this.setClock()
    },

    /**按钮响应 */
    btnClickCallFunc(event, param) {
        if (CCUtil.clickInterval(event.target, 0.5)) {
            return
        }

        switch (event.target.name) {
            case "btn_qiang0":
            case "btn_qiang1":
            case "btn_qiang2":
            case "btn_qiang3":
            case "btn_qiang4":
            case "btn_qiang5":
                let scale = parseInt(event.target.name.slice(9))
                ApiRoom.gameMessageNotify(ApiCd.gameRobBankerNotify(scale))
                break;
            case "btn_bet1":
            case "btn_bet2":
            case "btn_bet3":
            case "btn_bet4":
            case "btn_bet5":
                let score = parseInt(event.target.name.slice(7))
                ApiRoom.gameMessageNotify(ApiCd.gameUserPourScoreNotify(score))
                break;
        }
    },



    /**设置抢庄按钮 */
    setRobBankerNode(isShow) {
        if (!CDModel.getSelfIsPlaying()) {
            this.robBanker.active = false
            return
        }
        this.robBanker.active = isShow
    },

    /**设置下注按钮 */
    setBetNode(data = null) {
        if (!data || !CDModel.getSelfIsPlaying()) {
            this.bet.active = false
            return
        }
        let scoreList = data.scoreList
        if (!scoreList) {
            scoreList = [1, 2, 3, 4, 5]
        }
        for (let i = 0; i < 5; i++) {
            const s = scoreList[i];
            let btn_bet = cc.find(`btn_bet${i + 1}`, this.bet)
            if (btn_bet) {
                if (!s) {
                    btn_bet.active = false
                } else {
                    btn_bet.active = true
                    btn_bet.getChildByName("txt_bei").getComponent(cc.Label).string = `${s} 倍`
                }
            }
        }
        this.bet.active = true
    },

    /**显示闹钟 */
    setClock(t = null, s = "") {
        if (t == null || t == 0) {
            this.clock.active = false
            return
        }
        this.clock.active = true
        this._tick = t <= 0 ? 0 : Math.floor(t)
        this.txt_time.string = this._tick + ""
        // this.txt_status.string = s
        if (s != "") {
            AssetsManager.loadSpriteFrame({
                path: "res/sprite/state/" + s,
                bundle: Enums.bundleType.CD,
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
                if (this._tick == 3) {
                    AssetsManager.playEffect({
                        path: "res/audio/main/remind",
                        bundle: Enums.bundleType.CD
                    });
                }
            }
        }
    },
});