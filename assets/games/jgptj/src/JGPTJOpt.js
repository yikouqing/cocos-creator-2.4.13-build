const Enums = require('../../../src/const/Enums');
const JGPTJModel = require("./JGPTJModel")
const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiJgPtj = require('./ApiJgPtj');
const CCUtil = require("../../../src/utils/CCUtil")
const Utils = require('../../../src/utils/Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        optCard: cc.Node,
        clock: cc.Node,
        bet: cc.Node,
        node_qieguo: cc.Node,
        node_guo: cc.Node,
        robBanker: cc.Node,

        txt_time: cc.Label,
        txt_status: cc.Label,

        _tick: -1,
        _checkTime: 0,
    },

    gameInit(data) {

    },

    onLoad() {
        this.showGuo(null);
        this.reset();
    },

    reset() {
        this.setClock();
        this.setBetNode();
        this.showQieGuoBtn(false);
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
                ApiRoom.gameMessageNotify(ApiJgPtj.gameRobBankerNotify(1));
                break;
            case "btn_buqiang":
                this.setRobBankerNode(false);
                ApiRoom.gameMessageNotify(ApiJgPtj.gameRobBankerNotify(0));
                break;
            case "btn_buqie":
                this.showQieGuoBtn(false);
                ApiRoom.gameMessageNotify(ApiJgPtj.gameQieGuoOperateNotify(false))
                break;
            case "btn_qieguo":
                this.showQieGuoBtn(false);
                ApiRoom.gameMessageNotify(ApiJgPtj.gameQieGuoOperateNotify(true))
                break;
            case "btn_xiazhu":
                this.sendXiaZhu();
                this.setBetNode(false);
                break;
            case "btn_tip":
                cc.systemEvent.emit("tipsCard", this);
                break;
            case "btn_show":
                if (JGPTJModel.isSmallCard()) {
                    let sendObj = {
                        oneCards: JGPTJModel.getMyHandCard()
                    };
                    ApiRoom.gameMessageNotify(ApiJgPtj.showCardsNotify(sendObj));
                    return
                }
                let sendObj = JGPTJModel.getSelectCard();
                // console.log("亮牌发送===sendObj", sendObj)
                if (!sendObj || sendObj.oneCards.length != 2 || sendObj.twoCards.length != 2) {
                    AssetsManager.tipDialog("亮牌数据错误请重新操作!");
                    return
                }
                ApiRoom.gameMessageNotify(ApiJgPtj.showCardsNotify(sendObj));
                break;
            case "btn_cuopai":
                AssetsManager.createDialog({
                    path: 'res/prefab/JGPTJCuoPai',
                    bundle: Enums.bundleType.JGPTJ,
                });
                break;

        }
    },

    sendXiaZhu() {
        ApiRoom.gameMessageNotify(ApiJgPtj.gameUserPourScoreNotify(this._scoreIndex, this._scoreValue))
    },

    showGuo(data, isAnim) {
        isAnim = false;
        this.node_guo.active = !!data;
        if (!this.node_guo.active) return;
        let text_val = this.node_guo.getChildByName("text_val");
        text_val.getComponent(cc.Label).string = Utils.formatNumberWithDecimal(data.score, 2);
        isAnim && cc.tween(text_val).show().repeat(2, cc.tween().delay(0.3).hide().delay(0.3).show()).start();
    },
    /**设置操作按钮 */
    setOptCardNode(isShow) {
        if (!JGPTJModel.getSelfIsPlaying()) {
            this.optCard.active = false
            return
        }
        this.optCard.active = isShow;
        this.optCard.getChildByName("btn_tip").active = !JGPTJModel.isSmallCard();
        this.optCard.getChildByName("btn_cuo").active = JGPTJModel.isSmallCard() && JGPTJModel.isCuoPai();
    },

    /**设置抢庄按钮 */
    setRobBankerNode(isShow) {
        if (!JGPTJModel.getSelfIsPlaying()) {
            this.robBanker.active = false
            return
        }
        let bankerMode = JGPTJModel.getGameRuleByKey("bankerMode");
        this.robBanker.active = isShow;// && bankerMode == 1;
    },

    /**设置下注按钮 */
    setBetNode(data = null) {
        this.bet.active = false;
        if (data && JGPTJModel.getSelfIsPlaying()) {
            let myUid = JGPTJModel.getMyUid();
            let obj = JGPTJModel.getPourScoreObj();
            let yixiaScore = JGPTJModel.getUserBetScore(myUid);
            // console.log("yixiaScore", yixiaScore)
            let maxScore = obj.maxPourScore || 0;
            let minScore = obj.minPourScore || 0;
            if (yixiaScore >= maxScore) return;
            this._scoreIndex = data.index || 1;
            let spr_Index = null, path_Index = null;
            let list = obj.touBaBiManPourScores || [];
            let ShowNode1 = this.bet.getChildByName("ShowNode1");
            let ShowNode2 = this.bet.getChildByName("ShowNode2");
            ShowNode2.active = list && !!list.length;
            ShowNode2.active = false;
            ShowNode1.active = !ShowNode2.active;
            this.bet.active = true;

            if (ShowNode2.active) {
                spr_Index = ShowNode2.getChildByName("spr_Index");
                this._scoreValue = list[this._scoreIndex - 1] || 0;
                let btn_xiazhu = ShowNode2.getChildByName("btn_xiazhu");
                let text_val = btn_xiazhu.getChildByName("text_val");
                text_val.getComponent(cc.Label).string = this._scoreValue;
                path_Index = `res/sprite/betScore/spr_guo${this._scoreIndex}`;
            } else {
                let myChairID = JGPTJModel.getMyChairID();
                spr_Index = ShowNode1.getChildByName("spr_Index");
                let user = JGPTJModel.getUserByChairID(myChairID);
                let text_min = ShowNode1.getChildByName("text_min");
                let text_max = ShowNode1.getChildByName("text_max");
                let text_val = ShowNode1.getChildByName("text_val");
                let btn_guo1 = ShowNode1.getChildByName("btn_guo1");
                let btn_guo2 = ShowNode1.getChildByName("btn_guo2");
                let btn_guo3 = ShowNode1.getChildByName("btn_guo3");
                let gameMode = JGPTJModel.getGameRuleByKey("gameMode");
                let bet_slider = ShowNode1.getChildByName("bet_slider");
                let bet_progress = ShowNode1.getChildByName("bet_progress");
                path_Index = `res/sprite/betScore/spr_road_${this._scoreIndex}`;
                let AllIndex = gameMode == 1 ? 3 : 2, isBiMan = list && !!list.length;//头道必满
                if (isBiMan) {
                    if (this._scoreIndex == AllIndex) {//最后一道
                        maxScore -= yixiaScore;
                    }
                } else {
                    maxScore -= yixiaScore;
                }
                if (isBiMan == false && yixiaScore >= minScore) {
                    minScore = 0;
                }
                if (maxScore < minScore) maxScore = minScore;
                if (JGPTJModel.isUnionMatch() && user && user.userInfo && user.userInfo.score) {
                    let yuScore = user.userInfo.score - yixiaScore;
                    if (maxScore > yuScore) maxScore = yuScore;
                }
                //滑动下注部分
                let showProgress = (progress) => {
                    bet_slider.getComponent(cc.Slider).progress = progress;
                    bet_progress.getComponent(cc.ProgressBar).progress = progress;
                    text_min.getComponent(cc.Label).string = Utils.formatNumberWithDecimal(minScore, 2);
                    text_max.getComponent(cc.Label).string = Utils.formatNumberWithDecimal(maxScore, 2);
                    this._scoreValue = Utils.formatNumberWithDecimal(parseInt((maxScore - minScore) * progress) + minScore, 2);
                    if (this._scoreValue % 10 != 0) this._scoreValue = Math.floor(this._scoreValue / 10) * 10;
                    text_val.getComponent(cc.Label).string = this._scoreValue;
                }
                bet_slider.on('slide', (event) => {
                    showProgress(event.progress);
                }, this);
                showProgress(0);
                //锅头下注部分
                let btnShow = this._scoreIndex == 3 ? [1] : this._scoreIndex == 1 && gameMode == 1 ? [1, 2, 3] : [1, 2];
                let onEvent = (btnNode, num) => {
                    if (!btnNode) return;
                    btnNode.off("click");
                    let curScore = parseInt(maxScore / num);
                    btnNode.active = btnShow.includes(num) && curScore >= minScore;
                    btnNode.active && btnNode.on("click", () => {
                        let arrScore = [];
                        let yuScore = maxScore;
                        for (let i = 0; i < num; i++) {
                            let obj = { score: curScore, index: this._scoreIndex + i };
                            yuScore -= curScore;
                            arrScore.push(obj);
                        }
                        arrScore[arrScore.length - 1].score += yuScore;
                        arrScore.forEach((obj) => {
                            this._scoreIndex = obj.index;
                            this._scoreValue = obj.score;
                            this.sendXiaZhu();
                        })
                    })
                }
                onEvent(btn_guo1, 1);
                onEvent(btn_guo2, 2);
                onEvent(btn_guo3, 3);
            }

            path_Index = `res/sprite/betScore/spr_road_${this._scoreIndex}`;
            if (spr_Index && path_Index) {
                AssetsManager.loadSpriteFrame({
                    path: path_Index,
                    bundle: Enums.bundleType.JGPTJ,
                    sprite: spr_Index.getComponent(cc.Sprite),
                });
            }
        }
    },

    onBetSlider(event) {
        event.progress
    },

    showQieGuoBtn(isShow) {
        this.node_qieguo.active = isShow;
    },

    /**显示闹钟 */
    setClock(t = null) {
        if (t == null) {
            this.clock.active = false
            return
        }
        this.clock.active = true
        let status = JGPTJModel.getGameStatus();
        let str = ["准备中..", "抢庄中..", "发牌中..", "下注中..", "配牌中..", "亮牌中..", "切锅中.."]
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
                    let status = JGPTJModel.getGameStatus()
                    if (status == ApiJgPtj.gameStatus.POUR_SCORE && this.bet.active) {
                        AssetsManager.playEffect({
                            path: "res/audio/main/betCountDown",
                            bundle: Enums.bundleType.JGPTJ
                        });
                    } else if (status == ApiJgPtj.gameStatus.SHOW_CARD && this.optCard.active ||
                        status == ApiJgPtj.gameStatus.ROB_BANK && this.robBanker.active) {
                        AssetsManager.playEffect({
                            path: "res/audio/main/remind",
                            bundle: Enums.bundleType.JGPTJ
                        });
                    }
                }
            }
        }
    },
});