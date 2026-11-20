const Utils = require('../../../utils/Utils');
const AssetsManager = require('../../../utils/AssetsManager');
const CCUtil = require('../../../utils/CCUtil');
const ConfigModel = require('../../../model/ConfigModel');
const Enums = require('../../../const/Enums');
const Events = require('../../../const/Events');
const MessageCallback = require('../../../utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        avatar: cc.Sprite,
        uid: cc.Label,
        nickname: cc.Label,
        btnLay: cc.Node,
        rebateRate: cc.Label,
        ticketRate: cc.Label,
        scoreLbl: cc.Label,
        scoreAndSafeLbl: cc.Label,
        limitScore: cc.Label,
        nowRound: cc.Label,
        lastRound: cc.Label,
        todayRebate: cc.Label,
        lastRebate: cc.Label,
        todayWin: cc.Label,
        lastWin: cc.Label,
        teamScore: cc.Label,
        teamPlayers: cc.Label,
        operationNode: cc.Node,
        btnModifyRebate: cc.Node,
        btnModifyLimit: cc.Node,
        btnTicket: cc.Node,
        btnMor: cc.Node,
        btnXiangQing: cc.Node,
        btnJiLu: cc.Node,
        btnChengYuan: cc.Node,
    },

    start() {
        MessageCallback.addListener("OnModifyScoreSync", this);
        MessageCallback.addListener('OnMofifyRebateSync', this);
        MessageCallback.addListener('OnMofifyTicketRebateSync', this);
        MessageCallback.addListener('OnMofifyLimitScoreSync', this);
        if (this.btnMor) this.btnMor.active = true;
        this.viewSize = CCUtil.getDesignSize();
        this.setRate = cc.winSize.width > this.viewSize.width ? 1.3 : 1;
        if (this.btnLay) this.btnLay.scale = this.setRate;
        // if (this.btnLay) this.btnLay.active = false;
    },

    messageCallbackHandler(route, data) {
        switch (route) {
            case 'OnModifyScoreSync':
                this._onSocreModifySync(data);
                break;
            case 'OnMofifyRebateSync':
                this._onMofifyRebateSync(data);
                break;
            case 'OnMofifyTicketRebateSync':
                this._onMofifyTicketSync(data);
                break;
            case 'OnMofifyLimitScoreSync':
                this._onMofifyLimitScoreSync(data);
                break;
        }
    },

    _onSocreModifySync(data) {
        if (!data || !this.userInfo) return;
        if (data.uid != this.userInfo.uid) return;
        this.userInfo.score = data.score;
        if (this.scoreLbl) this.scoreLbl.string = Utils.formatNumberWithSymbol(this.userInfo.score, 2);
    },

    _onMofifyLimitScoreSync(user) {
        if (!this.userInfo || user.uid != this.userInfo.uid) return;
        this.userInfo.limitScore = user.limitScore;
        if (this.limitScore) this.limitScore.string = user.limitScore;
    },

    _onMofifyRebateSync(user) {
        if (!this.userInfo || user.uid != this.userInfo.uid) return;
        this.userInfo.rebateRate = user.rebateRate;
        if (this.rebateRate) this.rebateRate.string = Utils.formatNumberWithDecimal(user.rebateRate * 100) + "%";
    },

    _onMofifyTicketSync(user) {
        if (!this.userInfo || user.uid != this.userInfo.uid) return;
        this.userInfo.ticketRate = user.ticketRate;
        if (this.ticketRate) this.ticketRate.string = Utils.formatNumberWithDecimal(user.ticketRate * 100) + "%";
    },

    initWidget(unionInfo, userInfo, unionID, unionOwnerID) {
        // console.log("下级玩家", userInfo)
        this.unionID = unionID;
        this.userInfo = userInfo;
        this.unionInfo = unionInfo;
        this.unionOwnerID = unionOwnerID;
        if (this.uid) this.uid.string = userInfo.uid;
        if (this.nickname) this.nickname.string = CCUtil.stringClamp(userInfo.nickname, 5, '..');
        if (this.rebateRate) this.rebateRate.string = unionInfo.unionType != Enums.UnionType.NORMAL ? Utils.formatNumberWithDecimal(userInfo.rebateRate * 100) + "%" : '';
        if (this.ticketRate) this.ticketRate.string = unionInfo.unionType != Enums.UnionType.NORMAL ? Utils.formatNumberWithDecimal(userInfo.ticketRate * 100) + "%" : '';
        if (this.scoreLbl) this.scoreLbl.string = unionInfo.unionType != Enums.UnionType.NORMAL ? Utils.formatNumberWithSymbol(userInfo.score, 2) : '';
        if (this.scoreAndSafeLbl) this.scoreAndSafeLbl.string = unionInfo.unionType != Enums.UnionType.NORMAL ? `${Utils.formatNumberWithSymbol(userInfo.score, 2)}/${Utils.formatNumberWithSymbol(userInfo.safeScore, 2)}` : '0';
        if (this.limitScore) this.limitScore.string = unionInfo.unionType != Enums.UnionType.NORMAL ? userInfo.limitScore : '';
        AssetsManager.loadSpriteFrame({
            path: userInfo.avatar,
            sprite: this.avatar
        });
        if (this.nowRound) this.nowRound.string = userInfo.todayDraw || 0;
        if (this.lastRound) this.lastRound.string = userInfo.yesterdayDrawTotal || 0;
        if (this.todayRebate) this.todayRebate.string = unionInfo.unionType != Enums.UnionType.NORMAL ? Utils.formatNumberWithSymbol(userInfo.todayRebate, 2) : '';
        if (this.lastRebate) this.lastRebate.string = unionInfo.unionType != Enums.UnionType.NORMAL ? Utils.formatNumberWithSymbol(userInfo.yesterdayRebate, 2) : '';
        if (this.todayWin) this.todayWin.string = Utils.formatNumberWithSymbol(userInfo.todayWin, 2);
        if (this.lastWin) this.lastWin.string = Utils.formatNumberWithSymbol(userInfo.yesterdayWin, 2);
        if (this.teamPlayers) this.teamPlayers.string = userInfo.playerCount || 0;
        if (this.teamScore) this.teamScore.string = Utils.formatNumberWithSymbol(userInfo.totalScore, 2);
        if (this.btnModifyLimit) this.btnModifyLimit.active = unionInfo.unionType != Enums.UnionType.NORMAL;
        if (this.btnTicket) this.btnTicket.active = unionInfo.unionType != Enums.UnionType.NORMAL;
        if (this.btnModifyRebate) this.btnModifyRebate.active = unionInfo.unionType != Enums.UnionType.NORMAL;
    },

    onBtnClick(event, parameter) {
        if (parameter === 'partner') {
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/UnionPartnerListDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this.unionID,
                userInfo: this.userInfo,
                unionInfo: this.unionInfo
            })
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
                path: "res/prfab/partner/UnionModifyPartnerRebateDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this.unionID,
                userInfo: this.userInfo
            });
        } else if (parameter === 'tiaozhengbili') {
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/UnionModifyPointDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this.unionID,
                userInfo: this.userInfo,
                unionOwnerID: this.unionOwnerID
            });
        } else if (parameter === 'tiaozhengmenpiao') {
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/UnionModifyTicketDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this.unionID,
                userInfo: this.userInfo,
                unionOwnerID: this.unionOwnerID
            });
        } else if (parameter === 'shezhijingjiexian') {
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/UnionModifyLimitDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this.unionID,
                userInfo: this.userInfo
            });
        } else if (parameter === 'more') {
            if (this.btnLay) {
                // 将节点置为最上层
                this.btnLay.zIndex = 1
                this.btnLay.active = true
            }
            if (this.btnMor) this.btnMor.active = false
            this.pos = this.btnMor.getPosition()

            cc.tween(this.btnLay).to(0.2, {
                position: cc.v3(this.pos)
            }).start()
        } else if (parameter === 'close') {
            if (this.btnMor) this.btnMor.active = true
            if (this.btnLay) this.btnLay.active = false
            if (!this.pos) return false;
            this.showPos = cc.v2(this.pos.x + this.btnLay.width, this.pos.y)
            cc.tween(this.btnLay).to(0.1, {
                position: cc.v3(this.showPos)
            }).start()
        } else if (parameter === 'detail') {
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/UnionMemberViewDialog",
                bundle: ConfigModel.getSkin(),
                unionInfo: this.unionInfo,
                userInfo: this.userInfo,
                unionID: this.unionID,
                unionOwnerID: this.unionOwnerID,
            });
        } else if (parameter === 'jia' || parameter === 'jian') {
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/UnionChangeMemberScoreDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this.unionID,
                memberUid: this.userInfo.uid,
                score: this.userInfo.score,
                userInfo: this.userInfo,
                operationType: parameter,
                unionOwnerID: this.unionOwnerID
            });
        } else if (parameter === 'chengyuan') {
            AssetsManager.clearDialog(['UnionMainMemberListDialog']);
            AssetsManager.unionTeamDialog({
                spreaderID: this.userInfo.uid,
                showPages: ['mymember'],
                backPages: this.node.showPages,
            });
        } else if (parameter === 'jilu') {
            AssetsManager.createDialog({
                path: 'res/prefab/union/partner/UnionPartnerRebateDetailDialog',
                bundle: ConfigModel.getSkin(),
                uid: this.userInfo.uid,
                unionID: this.unionID
            });
        } else if (parameter === 'menpiao') {
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/UnionModifyTicketDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this.unionID,
                userInfo: this.userInfo,
                unionOwnerID: this.unionOwnerID,

            });
        }
    },

    onDestroy() {
        MessageCallback.removeListener("OnModifyScoreSync", this);
        MessageCallback.removeListener('OnMofifyRebateSync', this);
        MessageCallback.removeListener('OnMofifyTicketRebateSync', this);
        MessageCallback.removeListener('OnMofifyLimitScoreSync', this);
    }

});