const Enums = require('../../../src/const/Enums');
const MJNNModel = require("./MJNNModel")
const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiMjnn = require('./ApiMjnn');
const CCUtil = require("../../../src/utils/CCUtil")

cc.Class({
    extends: cc.Component,

    properties: {
        betItem: cc.Prefab,
        optCard: cc.Node,
        clock: cc.Node,
        betLay: cc.Node,
        betScores: cc.Node,
        betRate: cc.Node,
        betDisRate: cc.Node,
        robBanker: cc.Node,
        robItems: [cc.Node],
        robBtn: cc.Node,
        txt_time: cc.Label,
        txt_status: cc.Label,
        _tick: -1,
        _checkTime: 0,
    },

    gameInit(data) {

    },

    reset() {
        this.setShowNode();
        this.setBetNode();
        this.setRobNode();
        this.setClock();
    },

    /**按钮响应 */
    btnClickCallFunc(event, param) {
        CCUtil.clickInterval(event.target, 0.5);
        if (param == "cuo") {
            let data = {}
            data.path = 'res/prefab/MJNNCuoPai';
            data.bundle = Enums.bundleType.MJNN;
            AssetsManager.createDialog(data);
        } else if (param == "show") {
            ApiRoom.gameMessageNotify(ApiMjnn.showCardsNotify());
        } else if (param.indexOf('qiang') != -1) {
            let scale = parseInt(param.slice(5));
            ApiRoom.gameMessageNotify(ApiMjnn.gameRobBankerNotify(scale));
        } else if (param.indexOf('rate') != -1) {
            let scale = parseInt(param.slice(4));
            this._rate(scale);
        }
    },

    /**设置操作按钮 */
    setShowNode() {
        let gameStatus = MJNNModel.getGameStatus();
        let uid = MJNNModel.getMyUID();
        let show = MJNNModel.getShowCards(uid);
        let isShow = !!MJNNModel.isPlaying() && gameStatus == ApiMjnn.gameStatus.SHOW_CARDS && !show;
        this.optCard.active = isShow;
    },

    /**设置抢庄按钮 */
    setRobNode() {
        let gameStatus = MJNNModel.getGameStatus();
        let uid = MJNNModel.getMyUID();
        let rob = MJNNModel.getUserRob(uid);
        let bankerUid = MJNNModel.getBankerUID();
        let isShowRob = MJNNModel.isPlaying() && gameStatus == ApiMjnn.gameStatus.ROB_BANK && !rob && !bankerUid;
        this.robItems.forEach((item) => {
            item.active = false;
        });
        this.robBtn.active = false;
        this.robBanker.active = isShowRob;
        if (!isShowRob) return;
        let robScale = MJNNModel.getGameRuleByKey("robBankLimit");
        robScale = robScale || 1;
        this.robBtn.active = robScale == 1;
        if (robScale == 1) return;
        this.robItems.forEach((item, index, items) => {
            item.active = index < robScale;
        });
    },

    /**设置下注按钮 */
    setBetNode() {
        if (!this.betLay) return;
        this.betScores.destroyAllChildren();
        let uid = MJNNModel.getMyUID();
        let gameStatus = MJNNModel.getGameStatus();
        let betScore = MJNNModel.getBetScore(uid);
        let canPour = gameStatus == ApiMjnn.gameStatus.POUR_SCORE && MJNNModel.isPlaying() && !MJNNModel.isBanker(uid) && !(betScore > 0);
        this.betLay.active = canPour;
        if (!canPour) return;
        this._rate(0);
    },

    _setBetScores(isDouble) {
        let uid = MJNNModel.getMyUID();
        let canPourScores = MJNNModel.getCanPourScores();
        let myScore = MJNNModel.getUserScore(uid);
        let isPourLimit = MJNNModel.getGameRuleByKey("isPourLimit");
        this.betScores.destroyAllChildren();
        let isPourDouble = MJNNModel.getGameRuleByKey("isPourDouble");
        let rob = MJNNModel.getUserRob(uid);
        let unionType = MJNNModel.getRoomCreatorByKey('unionType');
        let isUnionCreate = MJNNModel.isUnionCreate();
        let scoreEnable = !isUnionCreate || (!!isUnionCreate && unionType == Enums.UnionType.NORMAL);
        canPourScores.forEach((score, index, scores) => {
            if (!!isDouble && !!isPourDouble) score *= 2;
            if (!!isUnionCreate && unionType != Enums.UnionType.NORMAL) scoreEnable = myScore >= score;
            if (!!scoreEnable) {
                let scoreItem = cc.instantiate(this.betItem);
                this.betScores.addChild(scoreItem);
                let enable = true;
                if (index == 0 && !!isPourLimit && rob && rob.isRob == 4) {
                    enable = false;
                }
                scoreItem.getComponent('MJNNPourItem') && scoreItem.getComponent('MJNNPourItem').bind(enable, this._pour.bind(this), score);
            }
        });
    },

    _rate(val) {
        let isRate = val == 1;
        let isPourDouble = MJNNModel.getGameRuleByKey("isPourDouble");
        if (this.betRate) this.betRate.active = !!isPourDouble && !isRate;
        if (this.betDisRate) this.betDisRate.active = !!isPourDouble && !!this.betRate && !this.betRate.active;
        this._setBetScores(isRate);
    },

    _pour(score) {
        ApiRoom.gameMessageNotify(ApiMjnn.gameUserPourScoreNotify(score))
    },

    /**显示闹钟 */
    setClock(t = null, s = "") {
        this.clock.active = !!t;
        if (!t) return;
        this._tick = t <= 0 ? 0 : Math.floor(t);
        this.txt_time.string = this._tick + "";
        this.txt_status.string = s;
    },

    update(dt) {
        if (this._tick >= 0) {
            this._checkTime += dt;
            if (this._checkTime >= 1) {
                this._checkTime = 0;
                if (this._tick - 1 >= 0) {
                    this._tick--;
                }
                this.txt_time.string = this._tick + "";
                if (this._tick == 3) {
                    let status = MJNNModel.getGameStatus();
                    if (status == ApiMjnn.gameStatus.POUR_SCORE &&
                        this.betLay.active) {
                        // AssetsManager.playEffect({
                        //     path: "res/audio/main/betCountDown",
                        //     bundle: Enums.bundleType.MJNN
                        // });
                    }
                }
            }
        }
    },
});