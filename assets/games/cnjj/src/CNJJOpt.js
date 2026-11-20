const Enums = require('../../../src/const/Enums');
const CNJJModel = require("./CNJJModel")
const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiCnjj = require('./ApiCnjj');
const CCUtil = require("../../../src/utils/CCUtil")
const Utils = require('../../../src/utils/Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        clock: cc.Node,
        bet: cc.Node,
        betBar: cc.Node,
        robBanker: cc.Node,
        img_state: cc.Sprite,
        txt_time: cc.Label,
        txt_status: cc.Label,
        btn_showCard: cc.Node,
        btn_cuoPai: cc.Node,
        btn_onlyBet: cc.Node,
        betInfoNode: cc.Node,
        txt_bankerBet: cc.Label,
        txt_playerBet: cc.Label,

        txt_min: cc.Label,
        txt_max: cc.Label,
        txt_bet: cc.Label,
        progress_bet: cc.ProgressBar,
        slider_bet: cc.Slider,

        btn_25: cc.Node,
        btn_50: cc.Node,
        btn_100: cc.Node,

        _tick: -1,
        _checkTime: 0,
        _bankerPourList: [],
        _bet25Score: 0,
        _bet50Score: 0,
        _bet100Score: 0,
    },

    onLoad() {
        this.btn_showCard.active = false
        this.btn_cuoPai.active = false
        this.setBetNode()
        this.setRobBankerNode(false)
        this.setClock()
        this.setBetInfo()
        this.betBar.active = false
        this.betInfoNode.active = false
        this.btn_onlyBet.active = false
    },

    reset() {
        this.setBetNode()
        this.setRobBankerNode(false)
        this.setClock()
        this.setBetBarNode()
        this.setHandleCardBtn()
        this.setBetOnlyNode()
    },

    /**按钮响应 */
    btnClickCallFunc(event, param) {
        if (CCUtil.clickInterval(event.target, 0.5)) {
            return
        }
        switch (event.target.name) {
            case "btn_bet0":
            case "btn_bet1":
                let idx = parseInt(event.target.name.slice(7))
                if (this._bankerPourList.length == 2) {
                    ApiRoom.gameMessageNotify(ApiCnjj.gameBankerOperateNotify(this._bankerPourList[idx]))
                }
                break;
            case "btn_bet":
                let score = parseInt(this.txt_bet.string)
                ApiRoom.gameMessageNotify(ApiCnjj.gameUserOperateNotify(score))
                break;
            case "btn_showCard":
                ApiRoom.gameMessageNotify(ApiCnjj.showCardsNotify())
                this.setHandleCardBtn()
                break;
            case "btn_cuoPai":
                AssetsManager.createDialog({
                    bundle: Enums.bundleType.CNJJ,
                    path: "res/prefab/CNJJCuoPai",
                })
                this.setHandleCardBtn()
                break;
            case "btn_onlyBet":
                let onlyScore = this.btn_onlyBet.getChildByName("txt_bei").getComponent(cc.Label)
                ApiRoom.gameMessageNotify(ApiCnjj.gameUserOperateNotify(parseInt(onlyScore.string)))
                break;
            case "btn_25":
                ApiRoom.gameMessageNotify(ApiCnjj.gameUserOperateNotify(this._bet25Score))
                break;
            case "btn_50":
                ApiRoom.gameMessageNotify(ApiCnjj.gameUserOperateNotify(this._bet50Score))
                break;
            case "btn_100":
                ApiRoom.gameMessageNotify(ApiCnjj.gameUserOperateNotify(this._bet100Score))
                break;
        }
    },

    onSlider(event) {
        // console.log("滑动响应==", event)
        this.progress_bet.progress = this.slider_bet.progress;
        let min = parseInt(this.txt_min.string)
        let max = parseInt(this.txt_max.string)
        if (min == max) {
            this.txt_bet.string = "" + min;
            return
        }
        var score = Math.floor((max - min) * this.slider_bet.progress + min);
        let rate = 100
        if (score % rate != 0) {
            score = Math.floor(score / rate) * rate
        }
        if (score < min) {
            score = min
        }
        this.txt_bet.string = "" + score;
    },


    /**设置抢庄按钮 */
    setRobBankerNode(isShow) {
        if (!CNJJModel.getSelfIsPlaying()) {
            this.robBanker.active = false
            return
        }
        this.robBanker.active = isShow
    },

    /**设置庄家下注按钮 */
    setBetNode(data = null) {
        if (!data || !CNJJModel.getSelfIsPlaying()) {
            this.bet.active = false
            return
        }

        this._bankerPourList = [data.minScore, data.maxScore]
        for (let i = 0; i < 2; i++) {
            let btn_bet = cc.find(`btn_bet${i}`, this.bet)
            let s = this._bankerPourList[i]
            if (btn_bet && s != 0) {
                btn_bet.active = true
                if (s) {
                    btn_bet.getChildByName("txt_bei").getComponent(cc.Label).string = s + ""
                }
            } else {
                btn_bet.active = false
            }
        }
        this.bet.active = true
    },

    /**设置闲家下注按钮 */
    setBetBarNode(isShow = false) {
        if (!isShow || !CNJJModel.getSelfIsPlaying()) {
            this.betBar.active = false
            return
        }
        this.betBar.active = true
        let min = CNJJModel.getGameRuleByKey("minPourScore")
        let max = Math.floor(CNJJModel.getMyScore())
        this.txt_min.string = min + ""
        this.txt_max.string = max + ""
        this.txt_bet.string = min + ""
        this.progress_bet.progress = this.slider_bet.progress = 0;

        /**设置百分之25和50的按钮数字 */
        let guodi = CNJJModel.getGuoDi()
        this._bet25Score = Math.floor(guodi / 4)
        this._bet50Score = Math.floor(guodi / 2)
        this._bet100Score = Math.floor(guodi)
        this.btn_25.active = this._bet25Score <= max
        this.btn_50.active = this._bet50Score <= max
        this.btn_100.active = this._bet100Score <= max
        this.btn_25.getChildByName("txt").getComponent(cc.Label).string = this._bet25Score + ""
        this.btn_50.getChildByName("txt").getComponent(cc.Label).string = this._bet50Score + ""
        this.btn_100.getChildByName("txt").getComponent(cc.Label).string = this._bet100Score + ""
    },

    /**设置固定下注按钮 */
    setBetOnlyNode(score) {
        // console.log("设置了固定下注==", score)
        if (!score) {
            this.btn_onlyBet.active = false
            return
        }
        this.btn_onlyBet.getChildByName("txt_bei").getComponent(cc.Label).string = score + ""
        this.btn_onlyBet.active = true
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
        this.txt_status.string = s
    },

    /**设置下注信息 */
    setBetInfo(type, score) {
        this.betInfoNode.active = true
        let s = Utils.formatNumberWithDecimal(score, 1)
        if (type == 1) {
            this.txt_bankerBet.string = s + ""
        } else if (type == 2) {
            this.txt_playerBet.string = s + ""
        } else {
            this.txt_bankerBet.string = "0"
            this.txt_playerBet.string = "0"
        }
    },

    /**显示亮牌和搓牌 */
    setHandleCardBtn(isShow = false) {
        if (!CNJJModel.getSelfIsPlaying()) {
            isShow = false
        }
        this.btn_showCard.active = isShow
        this.btn_cuoPai.active = isShow
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
                        bundle: Enums.bundleType.CNJJ
                    });
                }
            }
        }
    },
});