const AssetsManager = require('../../../utils/AssetsManager');
const ApiHall = require('../../../api/ApiHall');
const Utils = require('../../../utils/Utils');
const Enums = require('../../../const/Enums');
const ConfigModel = require('../../../model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        titleScore: cc.Node,
        recordListRoot: cc.Node,
        recordListItem: cc.Prefab,
        yesterdayTotalDraw: cc.Label,
        memberCount: cc.Label,
        yesterdayTotalUse: cc.Label,
        totalDraw: cc.Label
    },

    start() {
        this.startIndex = 0;
        this.perCount = 10;
        this.maxCount = 10;
        this.unionID = this.node.nodeParams.unionID;
        this.unionOwnerID = this.node.nodeParams.unionOwnerID;
        this.userInfo = this.node.nodeParams.userInfo;
        this.unionInfo = this.node.nodeParams.unionInfo;
        this.titleScore.active = this.unionInfo.unionType != Enums.UnionType.NORMAL;
        this.updateList();
    },

    onBtnClick(event, parameter) {
        if (parameter === 'close') {
            if (this.node.getComponent('DialogWidgetCtrl')) {
                this.node.getComponent('DialogWidgetCtrl').out();
            } else {
                this.node.destroy();
            }
        } else if (parameter === 'addMember') {
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/AddMemberDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this.unionID
            });
        }
    },

    onScrollEvent(target, eventType) {
        switch (eventType) {
            case cc.ScrollView.EventType.SCROLL_TO_BOTTOM:
                this.updateList();
                break;
        }
    },

    updateList() {
        if (this.startIndex >= this.maxCount) return;
        let startIndex = this.startIndex;
        let reqData = {
            unionID: this.unionID,
            startIndex: startIndex,
            count: this.perCount,
            partnerPage: false,
            isMyMember: false,
            uid: this.userInfo.uid,
            type: 2,
        };
        ApiHall.getMemberListRequest(reqData, (res) => {
            if (!cc.isValid(this.node)) return;
            if (startIndex != this.startIndex) return;
            let recordArr = res.msg.recordArr;
            this.maxCount = res.msg.totalCount;
            this.yesterdayTotalDraw.string = Utils.formatNumberWithSymbol(res.msg.yesterdayTotalDraw, 1) || 0;
            this.yesterdayTotalUse.string = res.msg.yesterdayTotalProvideRebate || 0;
            this.memberCount.string = res.msg.totalCount || 0;
            this.totalDraw.string = res.msg.totalDraw || 0;
            if (recordArr.length > 0) {
                for (let i = 0; i < recordArr.length; i++) {
                    let record = recordArr[i];
                    let item = cc.instantiate(this.recordListItem);
                    item.parent = this.recordListRoot;
                    let ctrl = item.getComponent("LowMemberItem");
                    ctrl.initWidget(this.unionInfo, record, this.unionID);
                }
                this.startIndex += this.perCount;
            }
        });
    }
});