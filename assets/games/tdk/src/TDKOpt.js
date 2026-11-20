const Enums = require('../../../src/const/Enums');
const TDKModel = require("./TDKModel")
const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiTdk = require('./ApiTdk');
const CCUtil = require("../../../src/utils/CCUtil")
const Utils = require("../../../src/utils/Utils")

cc.Class({
    extends: cc.Component,

    properties: {
        optCard: cc.Node,
        clock: cc.Node,
        bet: cc.Node,
        robBanker: cc.Node,
        chips: cc.Node,

        txt_time: cc.Label,
        txt_status: cc.Label,
        txt_min: cc.Label,
        txt_max: cc.Label,
        txt_bet: cc.Label,
        txt_gen: cc.Label,
        txt_betInfo: cc.Label,
        progress_bet: cc.ProgressBar,
        slider_bet: cc.Slider,

        btn_allin: cc.Node,
        btn_qijiao: cc.Node,
        btn_buti: cc.Node,
        btn_jiazhu: cc.Node,
        btn_fanti: cc.Node,
        btn_gen: cc.Node,
        btn_show: cc.Node,
        btn_koupai: cc.Node,

        _tick: -1,
        _checkTime: 0,
        _min: 1,
        _max: 1,
        _optType: -1
    },

    gameInit() {
        let fixBaseScore = TDKModel.getGameRuleByKey("fixBaseScore")
        let baseScore = TDKModel.getGameRuleByKey("baseScore")
        let allInRate = TDKModel.getGameRuleByKey("allInRate")
        this._max = baseScore
        if (fixBaseScore) { //固定注
            this._min = this._max
        }
        this._btnList = [null, null, this.btn_allin, this.btn_gen, this.btn_jiazhu, this.btn_qijiao, this.btn_buti, this.btn_fanti, this.btn_show]
        for (let i = 0; i < this._btnList.length; i++) {
            const btn = this._btnList[i];
            if (btn) {
                btn.attr({
                    optType: i
                })
            }
        }
        this.txt_betInfo.string = `底分:${baseScore}    全押:${baseScore * allInRate}`
    },

    reset() {
        this.setOptCardNode(false)
        this.setBetNode()
        this.setRobBankerNode(false)
        this.setClock()
    },

    /**按钮响应 */
    btnClickCallFunc(event, param) {
        if (CCUtil.clickInterval(event.target, 0.5)) return

        if (event.target.optType) {
            this._optType = event.target.optType
        }
        let betScore = 0
        switch (event.target.name) {
            case "btn_bet":
                betScore = parseInt(this.txt_bet.string)
                ApiRoom.gameMessageNotify(ApiTdk.gameUserOperateNotify(this._optType, betScore))
                break;
            case "btn_closebet":
                this.setBetNode()
                break;
            case "btn_show":
                ApiRoom.gameMessageNotify(ApiTdk.showCardsNotify())
                break;
            case "btn_jiazhu":
            case "btn_qijiao":
            case "btn_fanti":
                this.setBetNode(true)
                break;
            case "btn_buti":
                ApiRoom.gameMessageNotify(ApiTdk.gameUserOperateNotify(this._optType, 0))
                break;
            case "btn_gen":
                betScore = parseInt(this.txt_gen.string)
                ApiRoom.gameMessageNotify(ApiTdk.gameUserOperateNotify(this._optType, betScore))
                break;
            case "btn_koupai":
                ApiRoom.gameMessageNotify(ApiTdk.gameUserOperateNotify(ApiTdk.operateType.CANCEL, 0))
                break;
            case "btn_allin":
                ApiRoom.gameMessageNotify(ApiTdk.gameUserOperateNotify(ApiTdk.operateType.ALLIN, 0))
                break;
        }
    },

    onSlider(event) {
        // console.log("滑动响应==", event)
        this.progress_bet.progress = this.slider_bet.progress;
        let min = this._min
        let max = this._max
        if (TDKModel.getIsLanGuo() && TDKModel.getGameRuleByKey("lanGuoDouble")) {
            max *= 2
        }
        var score = Math.floor((max - min) * this.slider_bet.progress + min);
        // if (score % 10 != 0) {
        //     score = Math.floor(score / 10) * 10
        // }
        this.txt_bet.string = "" + score;
    },

    /**设置操作按钮 */
    setOptCardNode(isShow, data = {}) {
        if (!TDKModel.getSelfIsPlaying()) {
            this.optCard.active = false
            return
        }
        let showList = data.operateList || []
        this.optCard.active = isShow
        if (isShow && showList.length > 0) {
            /**根据动作列表显示按钮 */
            let btnList = this._btnList
            for (let i = 0; i < btnList.length; i++) {
                const btn = btnList[i];
                if (btn) {
                    btn.active = showList.includes(i)
                    if (btn.active && i == ApiTdk.operateType.GEN) {
                        this.txt_gen.string = "" + data.score
                    }
                }
            }
        }
        this.btn_koupai.active = !this.btn_show.active
    },

    /**设置抢庄按钮 */
    setRobBankerNode(isShow) {
        if (!TDKModel.getSelfIsPlaying()) {
            this.robBanker.active = false
            return
        }
        this.robBanker.active = isShow
    },

    /**设置下注按钮 */
    setBetNode(isShow = false) {
        if (!isShow || !TDKModel.getSelfIsPlaying()) {
            this.bet.active = false
            this.progress_bet.progress = 1
            this.slider_bet.progress = 1
        } else {
            let max = this._max
            if (TDKModel.getIsLanGuo() && TDKModel.getGameRuleByKey("lanGuoDouble")) {
                max *= 2
            }
            this.txt_bet.string = max + ""
            this.progress_bet.progress = 1
            this.slider_bet.progress = 1
            this.bet.active = true
        }
    },

    /**显示闹钟 */
    setClock(t = null, pos = null, s = "") {
        if (t == null) {
            this.clock.active = false
            return
        }
        this.clock.active = true
        this._tick = t <= 0 ? 0 : Math.floor(t)
        this.txt_time.string = this._tick + ""
        this.txt_status.string = s
        if (pos) {
            this.clock.setPosition(pos)
        }
    },

    clearChips() {
        this.chips.removeAllChildren()
    },

    /**飞筹码 */
    flyChips(value = 0, startNode = null, endNode = null, isAni = false) {
        if (startNode) {
            let endPos = CCUtil.getRandomPos(this.chips.width, this.chips.height)
            let startPos = CCUtil.postionConvert(startNode, this.chips)
            let chip = new cc.Node("chip" + value)
            chip.parent = this.chips
            chip.setScale(0.6)
            chip.angle = Utils.getRandomNum(-30, 30)

            if (Math.abs(endPos.y) > (this.chips.height / 2) - (chip.height / 2) * chip.scale) {
                if (endPos.y > 0) endPos.y -= (chip.height / 2) * chip.scale
                else endPos.y += (chip.height / 2) * chip.scale
            }

            let sp = chip.addComponent(cc.Sprite)
            AssetsManager.loadSpriteFrame({
                path: "res/sprite/chip/jinbi",
                sprite: sp,
                bundle: Enums.bundleType.TDK
            })
            if (isAni) {
                // console.log("飞筹码==", value, startPos, endPos)
                chip.setPosition(startPos)
                cc.tween(chip).to(0.2, {
                    position: endPos
                }).start()
                AssetsManager.playEffect({
                    path: 'res/audio/main/fly_gold',
                    bundle: Enums.bundleType.TDK
                });
            } else {
                chip.setPosition(endPos)
            }
        } else if (endNode) {
            let endPos = CCUtil.postionConvert(endNode, this.chips)
            if (isAni) {
                this.chips.children.forEach(node => {
                    cc.tween(node).to(0.3, {
                        position: endPos
                    }, {
                        easing: "cubicIn"
                    }).removeSelf().start()
                });
                AssetsManager.playEffect({
                    path: 'res/audio/main/fly_gold',
                    bundle: Enums.bundleType.TDK
                });
            } else {
                this.chips.removeAllChildren()
            }
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
            }
        }
    },
});