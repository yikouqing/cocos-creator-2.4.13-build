const Enums = require('../../../src/const/Enums');
const TTZModel = require("./TTZModel")
const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiTtz = require('./ApiTtz');
const CCUtil = require("../../../src/utils/CCUtil")

cc.Class({
    extends: cc.Component,

    properties: {
        qieguo: cc.Node,
        optCard: cc.Node,
        clock: cc.Node,
        bet: cc.Node,
        robBanker: cc.Node,

        txt_time: cc.Label,
        txt_status: cc.Label,


        txt_min: cc.Label,
        txt_max: cc.Label,
        txt_bet: cc.Label,
        progress_bet: cc.ProgressBar,
        slider_bet: cc.Slider,
        _tick: -1,
        _checkTime: 0,
    },

    gameInit(data) {

    },

    reset() {
        this.setQieguoNode(false)
        this.setOptCardNode(false)
        this.setBetNode()
        this.setRobBankerNode(false)
        this.setClock()
    },

    /**按钮响应 */
    btnClickCallFunc(event, param) {
        // console.log("按钮响应==", event)
        CCUtil.clickInterval(event.target, 0.5)

        switch (event.target.name) {
            case "btn_qiang":
                ApiRoom.gameMessageNotify(ApiTtz.gameRobBankerNotify(1))
                break;
            case "btn_buqiang":
                ApiRoom.gameMessageNotify(ApiTtz.gameRobBankerNotify(0))
                break;
            // case "btn_bet":
            //     let betScore = parseInt(this.txt_bet.string)
            //     ApiRoom.gameMessageNotify(ApiTtz.gameUserPourScoreNotify(betScore))
            //     break;

            case "btn_Score2":
            case "btn_Score5":
            case "btn_Score8":
            case "btn_Score10":
                let betScore = parseInt(event.target.name.slice(9))
                // console.log("betScore", betScore)
                ApiRoom.gameMessageNotify(ApiTtz.gameUserPourScoreNotify(betScore));
                break;
            case "btn_cuo":
                let data = {}
                data.path = 'res/prefab/TTZCuoPai';
                data.bundle = Enums.bundleType.TTZ;
                AssetsManager.createDialog(data);
                break;
            case "btn_show":
                ApiRoom.gameMessageNotify(ApiTtz.showCardsNotify())
                break;
            case "btn_qie":
                ApiRoom.gameMessageNotify(ApiTtz.gameQieGuoOperateNotify(true))
                this.setQieguoNode(false)
                break;
            case "btn_buqie":
                this.setQieguoNode(false)
                ApiRoom.gameMessageNotify(ApiTtz.gameQieGuoOperateNotify(false))
                break;
        }
    },

    onSlider(event) {
        // console.log("滑动响应==", event)
        this.progress_bet.progress = this.slider_bet.progress;
        let min = parseInt(this.txt_min.string)
        let max = parseInt(this.txt_max.string)
        var score = Math.floor((max - min) * this.slider_bet.progress + min);
        if (score % 10 != 0) {
            score = Math.floor(score / 10) * 10
        }
        this.txt_bet.string = "" + score;
    },

    /**设置切锅按钮 */
    setQieguoNode(isShow) {
        if (!TTZModel.getSelfIsPlaying()) {
            this.qieguo.active = false
            return
        }
        this.qieguo.active = isShow
    },

    /**设置操作按钮 */
    setOptCardNode(isShow) {
        if (!TTZModel.getSelfIsPlaying()) {
            this.optCard.active = false
            return
        }
        this.optCard.active = isShow
    },

    /**设置抢庄按钮 */
    setRobBankerNode(isShow) {
        if (!TTZModel.getSelfIsPlaying()) {
            this.robBanker.active = false
            return
        }
        this.robBanker.active = isShow
    },

    /**设置下注按钮 */
    setBetNode(data = null) {
        if (!data || !TTZModel.getSelfIsPlaying()) {
            this.bet.active = false
            this.progress_bet.progress = 0
            this.slider_bet.progress = 0
        } else {
            // bankerUid"388708"
            // maxPourScore100
            // minPourScore10
            // tick15
            this.txt_max.string = data.maxPourScore
            this.txt_min.string = data.minPourScore
            this.txt_bet.string = data.minPourScore
            this.progress_bet.progress = 0
            this.slider_bet.progress = 0
            this.bet.active = true
        }
    },

    /**显示闹钟 */
    setClock(t = null, s = "") {
        if (t == null) {
            this.clock.active = false
            return
        }
        this.clock.active = true
        this._tick = t <= 0 ? 0 : Math.floor(t)
        this.txt_time.string = this._tick + ""
        this.txt_status.string = s
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
                    let status = TTZModel.getGameStatus()
                    if (status == ApiTtz.gameStatus.POUR_SCORE && this.bet.active) {
                        AssetsManager.playEffect({
                            path: "res/audio/main/betCountDown",
                            bundle: Enums.bundleType.TTZ
                        });
                    } else if (status == ApiTtz.gameStatus.SHOW_CARD && this.optCard.active ||
                        status == ApiTtz.gameStatus.ROB_BANK && this.robBanker.active ||
                        status == ApiTtz.gameStatus.QIE_GUO && this.qieguo.active) {
                        AssetsManager.playEffect({
                            path: "res/audio/main/remind",
                            bundle: Enums.bundleType.TTZ
                        });
                    }
                }
            }
        }
    },
});