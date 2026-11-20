const Utils = require('../../../utils/Utils');
const AssetsManager = require('../../../utils/AssetsManager');
const CCUtil = require('../../../utils/CCUtil');
const Enums = require('../../../const/Enums');
const MessageCallback = require('../../../utils/MessageCallback');
const ConfigModel = require('../../../model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        uid: cc.Label,
        nickname: cc.Label,
        avatar: cc.Sprite,
        rebateRate: cc.Label,
        ticketRate: cc.Label,
        nowRound: cc.Label,
        lastRound: cc.Label,
        nowWin: cc.Label,
        lastWin: cc.Label,
        nowFee: cc.Label,
        lastFee: cc.Label,
        operationNode: cc.Node
    },

    start() {
        MessageCallback.addListener('OnMofifyRebateSync', this);
        MessageCallback.addListener('OnMofifyTicketRebateSync', this);
    },

    messageCallbackHandler(route, data) {
        switch (route) {
            case 'OnMofifyRebateSync':
                this._onMofifyRebateSync(data);
                break;
            case 'OnMofifyTicketRebateSync':
                this._onMofifyTicketSync(data);
                break;
        }
    },

    _onMofifyRebateSync(user) {
        if (!this.userInfo || user.uid != this.userInfo.uid) return;
        this.userInfo.rebateRate = user.rebateRate;
        if (this.rebateRate) this.rebateRate.string = user.rebateRate * 100 + "%";
    },

    _onMofifyTicketSync(user) {
        if (!this.userInfo || user.uid != this.userInfo.uid) return;
        this.userInfo.ticketRate = user.ticketRate;
        if (this.ticketRate) this.ticketRate.string = user.ticketRate * 100 + "%";
    },

    initWidget(comp, unionInfo, userInfo, unionID) {
        this.comp = comp;
        this.unionID = unionID;
        this.userInfo = userInfo;
        this.unionInfo = unionInfo;
        this.uid.string = userInfo.uid;
        AssetsManager.loadSpriteFrame({
            path: userInfo.avatar,
            sprite: this.avatar
        });
        this.nickname.string = CCUtil.stringClamp(userInfo.nickname, 7, '..');
        if (this.rebateRate) this.rebateRate.string = unionInfo.unionType != Enums.UnionType.NORMAL ? userInfo.rebateRate * 100 + "%" : '';
        if (this.ticketRate) this.ticketRate.string = unionInfo.unionType != Enums.UnionType.NORMAL ? userInfo.ticketRate * 100 + "%" : '';
        this.nowRound.string = userInfo.todayDraw;
        this.lastRound.string = userInfo.yesterdayDrawTotal;
        this.nowWin.string = Utils.formatNumberWithSymbol(userInfo.todayWin, 2);
        this.lastWin.string = Utils.formatNumberWithSymbol(userInfo.yesterdayWin, 2);
        this.nowFee.string = unionInfo.unionType != Enums.UnionType.NORMAL ? Utils.formatNumberWithSymbol(userInfo.todayRebate, 2) : '';
        this.lastFee.string = unionInfo.unionType != Enums.UnionType.NORMAL ? Utils.formatNumberWithSymbol(userInfo.yesterdayRebate, 2) : '';
        // this.operationNode.active = userInfo.spreaderID === UserModel.getData('uid');
    },

    onBtnClick(event, parameter) {
        if (parameter === 'partner') {
            this.comp && this.comp.loadPartner && this.comp.loadPartner(this.userInfo);
        } else if (parameter === 'member') {
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/UnionLowMemberListDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this.unionID,
                userInfo: this.userInfo,
                unionInfo: this.unionInfo,
            })
        } else if (parameter === 'modifyRebate') {
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/UnionModifyPartnerRebateDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this.unionID,
                userInfo: this.userInfo
            });
        }
    },

    onDestroy() {
        MessageCallback.removeListener('OnMofifyRebateSync', this);
        MessageCallback.removeListener('OnMofifyTicketRebateSync', this);
    }

});