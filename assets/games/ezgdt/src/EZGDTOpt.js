const Enums = require('../../../src/const/Enums');
const EZGDTModel = require("./EZGDTModel")
const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiEzgdt = require('./ApiEzgdt');
const CCUtil = require("../../../src/utils/CCUtil")

cc.Class({
    extends: cc.Component,

    properties: {
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
        _canPourScores: null
    },

    gameInit() {
        let canPourScores = EZGDTModel.getGameRuleByKey("canPourScores")
        this._canPourScores = canPourScores
        let betBtns = cc.find("betShow", this.bet).children
        for (let i = 0; i < betBtns.length; i++) {
            const btnNode = betBtns[i];
            let betNum = canPourScores[i]
            if (betNum) {
                btnNode.getChildByName("txt").getComponent(cc.Label).string = `${betNum}分`
            }
        }

        let robBtns = this.robBanker.children
        let bankerType = EZGDTModel.getGameRuleByKey("bankerType")
        robBtns.forEach(node => {
            if (bankerType != ApiEzgdt.gameType.QIANGZHUANG) {
                node.active = (node.name == "btn_qiang" || node.name == "btn_buqiang")
            } else {
                node.active = (node.name != "btn_qiang")
            }
        });
    },

    reset() {
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
            case "btn_qiang1":
            case "btn_qiang2":
            case "btn_qiang3":
            case "btn_qiang4":
                let qidx = parseInt(event.target.name.slice(9))
                ApiRoom.gameMessageNotify(ApiEzgdt.gameRobBankerNotify(qidx))
                break;
            case "btn_buqiang":
                ApiRoom.gameMessageNotify(ApiEzgdt.gameRobBankerNotify(0))
                break;
            case "btn_qiang":
                ApiRoom.gameMessageNotify(ApiEzgdt.gameRobBankerNotify(1))
                break;
            case "btn_bet0":
            case "btn_bet1":
            case "btn_bet2":
            case "btn_bet3":
                let idx = parseInt(event.target.name.slice(7))
                let betScore = this._canPourScores[idx]
                ApiRoom.gameMessageNotify(ApiEzgdt.gameUserPourScoreNotify(betScore));
                break;
            case "btn_cuo":
                let data = {}
                data.path = 'res/prefab/EZGDTCuoPai';
                data.bundle = Enums.bundleType.EZGDT;
                AssetsManager.createDialog(data);
                break;
            case "btn_show":
                ApiRoom.gameMessageNotify(ApiEzgdt.showCardsNotify())
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

    /**设置操作按钮 */
    setOptCardNode(isShow) {
        if (!EZGDTModel.getSelfIsPlaying()) {
            this.optCard.active = false
            return
        }
        this.optCard.active = isShow
    },

    /**设置抢庄按钮 */
    setRobBankerNode(isShow) {
        if (!EZGDTModel.getSelfIsPlaying()) {
            this.robBanker.active = false
            return
        }
        this.robBanker.active = isShow
    },

    /**设置下注按钮 */
    setBetNode(data = null) {
        if (!data || !EZGDTModel.getSelfIsPlaying()) {
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
                if (this._tick == 2) {
                    let status = EZGDTModel.getGameStatus()
                    if (status == ApiEzgdt.gameStatus.POUR_SCORE && this.bet.active ||
                        status == ApiEzgdt.gameStatus.ROB_BANK && this.robBanker.active) {
                        AssetsManager.playEffect({
                            path: "res/audio/main/remind",
                            bundle: Enums.bundleType.EZGDT
                        });
                    }
                }
            }
        }
    },
});