const AudioUtil = require('../../../src/utils/AudioUtil');
const CXModel = require('./CXModel');
const UserModel = require('../../../src/model/UserModel');
const MessageCallback = require('../../../src/utils/MessageCallback');
const ApiCx = require('./ApiCx');
const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const ApiHall = require('../../../src/api/ApiHall');
const CacheManager = require('../../../src/utils/CacheManager');

cc.Class({
    extends: cc.Component,

    properties: {
        btnLeave: cc.Node,
        btnDismiss: cc.Node,
        bringSlider: cc.Slider,
        bringProgress: cc.ProgressBar,
        minBringScore: cc.Label,
        totalScore: cc.Label,
        bringScoreSet: cc.Label,
        btnDaiRu: cc.Node,
        btnBuChong: cc.Node,
        musicSlider: cc.Slider,
        musicProgress: cc.ProgressBar,

        _totalScore: 0,
        _bringScore: 0,
        _bringSetScore: 0,
        _randScore: 0,
        _user: null
    },


    onLoad() {
        MessageCallback.addListener('GameMessagePush', this);
        MessageCallback.addListener('RoomMessagePush', this);
    },

    start() {
        let user = CXModel.getUserByUID(UserModel.getData('uid'));
        this._bringScore = CXModel.getGameRuleByKey('bringScore');
        this._user = user;
        this._totalScore = CXModel.getUserScoreByUID(UserModel.getData('uid'));
        if (!CXModel.isMatchMode()) this._totalScore = CXModel.getPeiScore();
        this._totalScore = parseInt(this._totalScore);
        this.totalScore.string = this._totalScore;
        this._bringScore = this._bringScore || 0;
        this._bringScore = parseInt(this._bringScore);
        this.minBringScore.string = this._bringScore;
        this.bringScoreSet.string = this._bringScore;
        this.bringProgress.progress = 0;
        this.bringSlider.progress = 0;
        this._bringSetScore = this._bringScore;
        this._randScore = this._totalScore - this._bringScore;
        this._randScore = this._randScore > 0 ? this._randScore : 0;
        this.btnBuChong.active = CXModel.checkInSeat();
        this.btnDaiRu.active = !this.btnBuChong.active;
        this.btnDismiss.active = CXModel.checkInSeat() && !CXModel.getGameRuleByKey('canNotDissmiss') && CXModel.getCurBureau() > 0;
        this.btnLeave.active = true;
        let musicVolume = CacheManager.getItem('music');
        this.musicSlider.progress = musicVolume || 1;
        this.musicProgress.progress = musicVolume || 1;
    },

    scoreSliderEvent() {
        this.bringProgress.progress = this.bringSlider.progress;
        this._bringSetScore = this._bringScore + this.bringSlider.progress * this._randScore;
        this._bringSetScore = parseInt(this._bringSetScore);
        this.bringScoreSet.string = this._bringSetScore;
    },

    musicSliderEvent() {
        this.musicProgress.progress = this.musicSlider.progress;
        AudioUtil.setMusicVolume(this.musicProgress.progress);
    },

    btnClicks(event, param) {
        switch (param) {
            case 'buchong':
            case 'dairu':
                this.onBuyClick();
                break;
            case 'close':
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
                break;
            case 'leave':
                ApiRoom.roomMessageNotify(ApiRoom.userLeaveRoomNotify());
                break;
            case 'dismiss':
                let params = {
                    content: '是否要发起解散申请？',
                    ok: () => {
                        ApiRoom.roomMessageNotify(ApiRoom.getAskForDismissNotifyData({
                            isAsker: true
                        }));
                        this.node.destroy();
                    },
                    no: () => { }
                }
                AssetsManager.popDialog(params);
                break;
            default:
                break;
        }
    },

    messageCallbackHandler(route, msg) {
        if (route === 'RoomMessagePush') {
            if (msg.type === ApiRoom.USER_CHANGE_SEAT_PUSH) {
                if (msg.data.code == 0) {
                    if (msg.data.uid == UserModel.getData('uid')) {
                        this.node.destroy();
                    }
                }
            }
        } else if (route === 'GameMessagePush') {
            if (msg.type === ApiCx.GAME_USER_BUY_SCORE_PUSH) {
                if (msg.data.code != 0) {
                    AssetsManager.tipDialog('带入失败！');
                    return;
                }
                if (CXModel.checkInSeat()) {
                    AssetsManager.tipDialog('补充积分成功！');
                    this.node.destroy();
                    return;
                }
                let chairID = CXModel.getCanSitDownChairID();
                if (chairID == -1) {
                    AssetsManager.tipDialog('座位已满，请稍候！');
                    return;
                }
                // AssetsManager.tipDialog('带入积分成功！');
                ApiRoom.roomMessageNotify(ApiRoom.getUserChangeSeatNotify(this._user.chairID, chairID));
                this.node.destroy();
            }
        }
    },

    onBuyClick() {
        ApiRoom.gameMessageNotify(ApiCx.getBuyScoreNotify(UserModel.getData('uid'), this._bringSetScore))
    },

    onDestroy() {
        MessageCallback.removeListener('RoomMessagePush', this);
        MessageCallback.removeListener('GameMessagePush', this);
    },

});