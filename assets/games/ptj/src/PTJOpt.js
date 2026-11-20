const Enums = require('../../../src/const/Enums');
const PTJModel = require("./PTJModel")
const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiPtj = require('./ApiPtj');
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

        _tick: -1,
        _checkTime: 0,
    },

    gameInit(data) {

    },

    reset() {
        this.setClock();
        this.setBetNode();
        this.setOptCardNode(false);
        this.setRobBankerNode(false);
    },

    /**按钮响应 */
    btnClickCallFunc(event, param) {
        if (CCUtil.clickInterval(event, 0.5)) {
            return
        }
        switch (param) {
            case "btn_qiang":
                this.setRobBankerNode(false);
                ApiRoom.gameMessageNotify(ApiPtj.gameRobBankerNotify(1))
                break;
            case "btn_buqiang":
                this.setRobBankerNode(false);
                ApiRoom.gameMessageNotify(ApiPtj.gameRobBankerNotify(0))
                break;
            case "bet_1":
            case "bet_2":
            case "bet_5":
            case "bet_8":
            case "bet_10":
                let index = this.CurRoadNum;
                let score = parseInt(param.split('_')[1]);
                ApiRoom.gameMessageNotify(ApiPtj.gameUserPourScoreNotify(index, score))
                break;
            case "btn_tip":
                cc.systemEvent.emit("tipsCard", this);
                break;
            case "btn_show":
                if (PTJModel.isSmallCard()) {
                    let sendObj = {
                        oneCards: PTJModel.getMyHandCard()
                    };
                    ApiRoom.gameMessageNotify(ApiPtj.showCardsNotify(sendObj));
                    return
                }
                let sendObj = PTJModel.getSelectCard();
                // console.log("亮牌发送===sendObj", sendObj)
                if (!sendObj || sendObj.oneCards.length != 2 || sendObj.twoCards.length != 2) {
                    AssetsManager.tipDialog("亮牌数据错误请重新操作!");
                    return
                }
                ApiRoom.gameMessageNotify(ApiPtj.showCardsNotify(sendObj));
                break;
            case "btn_cuopai":
                AssetsManager.createDialog({
                    path: 'res/prefab/PTJCuoPai',
                    bundle: Enums.bundleType.PTJ,
                });
                break;
        }
    },

    /**设置操作按钮 */
    setOptCardNode(isShow) {
        if (!PTJModel.getSelfIsPlaying()) {
            this.optCard.active = false
            return
        }
        this.optCard.active = isShow;
        this.optCard.getChildByName("btn_tip").active = !PTJModel.isSmallCard();
        this.optCard.getChildByName("btn_cuo").active = PTJModel.isSmallCard() && PTJModel.isCuoPai();
    },

    /**设置抢庄按钮 */
    setRobBankerNode(isShow) {
        if (!PTJModel.getSelfIsPlaying()) {
            this.robBanker.active = false
            return
        }
        let bankerMode = PTJModel.getGameRuleByKey("bankerMode");
        this.robBanker.active = isShow && bankerMode == 1;
    },

    /**设置下注按钮 */
    setBetNode(data = null) {
        this.bet.active = false;
        if (data && PTJModel.getSelfIsPlaying()) {
            this.bet.active = true;
            this.CurRoadNum = data.index;
            let CurRoad = this.bet.getChildByName("CurRoad");
            AssetsManager.loadSpriteFrame({
                bundle: Enums.bundleType.PTJ,
                sprite: CurRoad.getComponent(cc.Sprite),
                path: `res/sprite/betScore/spr_road_${this.CurRoadNum}`,
            });
        }
    },

    /**显示闹钟 */
    setClock(t = null) {
        if (t == null) {
            this.clock.active = false
            return
        }
        this.clock.active = true
        let status = PTJModel.getGameStatus();
        let str = ["准备中..", "抢庄中..", "发牌中..", "下注中..", "配牌中..", "亮牌中..", ""]
        let curStr = str[status];

        this._tick = t <= 0 ? 0 : Math.floor(t)
        this.txt_time.string = this._tick + ""
        this.txt_status.string = curStr;
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
                    let status = PTJModel.getGameStatus()
                    if (status == ApiPtj.gameStatus.POUR_SCORE && this.bet.active) {
                        AssetsManager.playEffect({
                            path: "res/audio/main/betCountDown",
                            bundle: Enums.bundleType.PTJ
                        });
                    } else if (status == ApiPtj.gameStatus.SHOW_CARD && this.optCard.active ||
                        status == ApiPtj.gameStatus.ROB_BANK && this.robBanker.active) {
                        AssetsManager.playEffect({
                            path: "res/audio/main/remind",
                            bundle: Enums.bundleType.PTJ
                        });
                    }
                }
            }
        }
    },
});