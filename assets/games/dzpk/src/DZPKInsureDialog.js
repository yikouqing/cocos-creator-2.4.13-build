const Utils = require('../../../src/utils/Utils');
const AssetsManager = require('../../../src/utils/AssetsManager');
const DZPKModel = require('./DZPKModel');
const UserModel = require('../../../src/model/UserModel');
const ApiDzpk = require('./ApiDzpk');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        holds: [require('DZPKCard')],
        nickLbl: cc.Label,
        mainPoolLbl: cc.Label,
        tickLbl: cc.Label,
        tickProgress: cc.ProgressBar,
        pubs: [require('DZPKCard')],
        outs: cc.Node,
        buyInsureScoreLbl: cc.Label,
        buyInusreRateLbl: cc.Label,
        gainInsureScoreLbl: cc.Label,
        insureSlider: cc.Slider,
        insureProgress: cc.ProgressBar,
        cardItem: cc.Prefab,

        _insure: null,
        _buyInsure: 0,
        _totalTick: 0,
        _endTick: 0,
        _tick: 0,
    },

    start() {
        MessageCallback.addListener('RoomMessagePush', this);
        MessageCallback.addListener('GameMessagePush', this);
        this._insure = this.node.nodeParams;
        this._insure = this._insure || {};
        // console.log('保险初始化----', this._insure)
        this._tickInit();
        this._userSync();
        this._insureSync();
    },

    messageCallbackHandler(route, msg) {
        if (route === 'RoomMessagePush') {
            if (msg.type === ApiRoom.GET_ROOM_SCENE_INFO_PUSH) {
                this._gameInit()
            }
        } else if (route === 'GameMessagePush') {
            if (msg.type === ApiDzpk.GAME_BUREAU_PUSH) { } else if (msg.type === ApiDzpk.GAME_STATUS_PUSH) {
                this._onGameStatusSync(msg.data);
            } else if (msg.type === ApiDzpk.GAME_USER_OPERATE_PUSH) {
                this._onUserAction(msg.data);
            }
        }
    },

    _gameInit() {
        this.node.destroy();
    },

    _onGameStatusSync(data) {
        this.node.destroy();
    },

    _onUserAction(data) {
        let uid = DZPKModel.getMyUid();
        if (data.uid == uid) {
            this.node.destroy();
        }
    },

    _userSync() {
        this.mainPoolLbl.string = `主池:${Utils.formatNumberWithDecimal(this._insure.baseTotalScore || 0, 1)}`
        this.nickLbl.string = `ID:${this._insure.indexID}`;
        let indexHandCards = this._insure.indexHandCards || [];
        for (let index = 0; index < this.holds.length; index++) {
            let card = this.holds[index];
            card.cardSync(indexHandCards[index]);
        }
        let publicCards = this._insure.publicCards || [];
        for (let index = 0; index < this.pubs.length; index++) {
            let card = this.pubs[index];
            if (!publicCards[index]) {
                card.cardBack(false);
            } else {
                card.cardSync(publicCards[index]);
            }
        }
        this.outs.destroyAllChildren();
        let outs = this._insure.OUTSArr || [];
        outs.forEach(id => {
            let cardItem = cc.instantiate(this.cardItem);
            let card = cardItem.getComponent('DZPKCard');
            if (!card) return;
            card.cardSync(id);
            this.outs.addChild(cardItem);
        });
    },

    _tickInit() {
        let tick = this._insure.totalTick || 10;
        this._tick = tick;
        this._totalTick = tick;
        this._endTick = tick * 1000 + Date.now();
        this.unscheduleAllCallbacks();
        this.schedule(() => {
            if (this._tick <= 0) {
                this._totalTick = 0;
                this.unscheduleAllCallbacks();
                this._onClose();
            }
            this._tick--;
        }, 1);
    },

    _tickSync() {
        if (this._totalTick == 0) return;
        let leftTick = this._endTick - Date.now();
        if (leftTick <= 0) {
            this._totalTick = 0;
            this.tickLbl.string = '0s';
            this.tickProgress.progress = 0;
            return;
        }
        this.tickLbl.string = Math.floor(leftTick / 1000);
        this.tickProgress.progress = leftTick / this._totalTick;
    },

    update(dt) {
        this._tickSync();
    },

    btnClicks(event, params) {

        switch (params) {
            case 'close':
                this._onClose();
                break;
            case 'slider':
                this._onSlider();
                break;
            case 'buy':
                this._onBuy();
                break;
        }
    },

    _onBuy() {
        ApiRoom.gameMessageNotify(ApiDzpk.getOperateNotify(ApiDzpk.operateType.INSURE, this._buyInsure));
    },

    _onClose() {
        ApiRoom.gameMessageNotify(ApiDzpk.getOperateNotify(ApiDzpk.operateType.INSURE, 0));
        if (this.node.getComponent('DialogWidgetCtrl')) {
            this.node.getComponent('DialogWidgetCtrl').out();
        } else {
            this.node.destroy();
        }
    },

    _onSlider() {
        this._insureSync();
    },

    _insureSync() {
        let rate = this.insureSlider.progress;
        let insureRate = this._insure.OUTS_multiplying_power || 0;
        this.buyInusreRateLbl.string = insureRate;
        let baoDiScore = this._insure.breakEven || 0;
        let fullScore = this._insure.tankFul || 0;
        let insureScore = baoDiScore + Utils.formatNumberWithDecimal((fullScore - baoDiScore) * rate, 1);
        this.insureProgress.progress = rate;
        this.buyInsureScoreLbl.string = Utils.formatNumberWithDecimal(insureScore, 1);
        this._buyInsure = insureScore;
        this.gainInsureScoreLbl.string = Utils.formatNumberWithDecimal(insureRate * insureScore, 1);
    },

    // update (dt) {},

    onDestroy() {
        MessageCallback.removeListener('RoomMessagePush', this);
        MessageCallback.removeListener('GameMessagePush', this);
    },
});