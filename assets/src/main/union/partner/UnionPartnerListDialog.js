const AssetsManager = require('../../../utils/AssetsManager');
const UserModel = require('../../../model/UserModel');
const ApiHall = require('../../../api/ApiHall');
const MessageCallback = require('../../../utils/MessageCallback');
const Utils = require('../../../utils/Utils');
const Enums = require('../../../const/Enums');
const ConfigModel = require('../../../model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        btnBackPartner: cc.Node,
        titleFixScore: cc.Node,
        titleRebateScore: cc.Node,
        recordListRoot: cc.Node,
        recordListItem: cc.Prefab,
        queryUid: cc.EditBox,
        myRebateLabel: cc.Label,
        pageLabel: cc.Label,

        _spreaderList: [],
    },

    messageCallbackHandler(route, data) {
        switch (route) {
            case 'UnionMainMemberSync':
                this.curIndex = 0;
                this.maxIndex = 0;
                this.perCount = 4;
                this.updateList();
                break;
        }
    },

    start() {
        MessageCallback.addListener('UnionMainMemberSync', this);
        let nodeParams = this.node.nodeParams || {};
        this.unionID = nodeParams.unionID;
        this.unionInfo = UserModel.getUnionInfo(this.unionID);
        this.titleFixScore.active = this.unionInfo.unionType != Enums.UnionType.NORMAL;
        this.titleRebateScore.active = this.unionInfo.unionType != Enums.UnionType.NORMAL;
        // this.myRebateLabel.string = this.unionInfo.unionType != Enums.UnionType.NORMAL ? `我的点位:${Utils.formatNumberWithSymbol(this.unionInfo.rebateRate * 100)}%` : '';
        this.loadPartner(nodeParams.userInfo);
    },

    loadPartner(userInfo) {
        this.recordListRoot.removeAllChildren();
        this.curIndex = 0;
        this.maxIndex = 0;
        this.perCount = 5;
        if (!userInfo) return;
        this._spreaderList.push(userInfo);
        if (this.btnBackPartner) this.btnBackPartner.active = this._spreaderList.length > 1;
        this.userInfo = userInfo;
        this.updateList();
    },

    onBtnClick(event, parameter) {
        if (parameter === 'close') {
            if (this.node.getComponent('DialogWidgetCtrl')) {
                this.node.getComponent('DialogWidgetCtrl').out();
            } else {
                this.node.destroy();
            }
        } else if (parameter === 'lowMember') {
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/UnionLowMemberListDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this.unionID,
                userInfo: this.userInfo,
                unionInfo: this.unionInfo
            });
        } else if (parameter === 'addPartner') {
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/AddPartnerDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this.unionID
            });
        } else if (parameter === 'query') {
            if (this.lastQueryUid === this.queryUid.string) return;
            if (this.queryUid.string.length > 0) {
                if (this.queryUid.string.length !== 6) {
                    AssetsManager.tipDialog("请输入正确的玩家ID");
                    return;
                }
            }
            this.curIndex = 0;
            this.maxIndex = 0;
            this.perCount = 5;
            this.recordListRoot.removeAllChildren();
            this.updateList();
        } else if (parameter === 'left') {
            if (this.curIndex === 0) return;
            this.curIndex--;
            this.updateList();
        } else if (parameter === 'right') {
            if (this.curIndex >= this.maxIndex) return;
            this.curIndex++;
            this.updateList();
        } else if (parameter === 'back') {
            if (this._spreaderList.length < 2) return;
            this._spreaderList.pop();
            this.loadPartner(this._spreaderList.pop());
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
        if (this.queryUid.string.length > 0) {
            if (this.queryUid.string.length !== 6) {
                AssetsManager.tipDialog("请输入正确的玩家ID");
                return;
            }
        }
        let searchUid = this.queryUid.string || null;
        this.lastQueryUid = this.queryUid.string;
        let reqData = {
            unionID: this.unionID,
            startIndex: this.curIndex * this.perCount,
            count: this.perCount,
            partnerPage: false,
            isMyMember: false,
            uid: this.userInfo.uid,
            searchUid: searchUid,
            type: 3,
        };
        ApiHall.getMemberListRequest(reqData, (res) => {
            let recordArr = res.msg.recordArr;
            this.maxIndex = Math.floor(res.msg.totalCount / this.perCount);
            if (res.msg.totalCount % this.perCount != 0) this.maxIndex++;
            if (this.maxIndex == 0) {
                this.pageLabel.string = `0/0`;
            } else {
                this.pageLabel.string = `${(this.curIndex + 1)}/${this.maxIndex}`;
            }
            this.recordListRoot.removeAllChildren();
            for (let i = 0; i < recordArr.length; i++) {
                let record = recordArr[i];
                let item = cc.instantiate(this.recordListItem);
                item.parent = this.recordListRoot;
                let ctrl = item.getComponent("LowPartnerItem");
                ctrl.initWidget(this, this.unionInfo, record, this.unionID);
            }
        });
    },

    onDestroy() {
        MessageCallback.removeListener('UnionMainMemberSync', this);
    },
});