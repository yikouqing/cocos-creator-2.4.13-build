const MessageCallback = require('../../../utils/MessageCallback');
const AssetsManager = require('../../../utils/AssetsManager');
const UserModel = require('../../../model/UserModel');
const Utils = require('../../../utils/Utils');
const ApiHall = require('../../../api/ApiHall');
const ConfigModel = require('../../../model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        recordListRoot: cc.Node,
        recordListItem: cc.Prefab,
        setingListItem: cc.Prefab,
        queryEditBox: cc.EditBox,
        memberTotalScore: cc.Label,

        pageLabel: cc.Label
    },

    start() {
        this.curIndex = 0;
        this.maxIndex = 0;
        this.perCount = 5;
        this.unionID = this.node.nodeParams.unionID;
        this.userInfo = this.node.nodeParams.userInfo;
        this.unionOwnerID = this.node.nodeParams.unionOwnerID;
        this.isSeting = this.node.nodeParams.isSeting;
        this.ctrlArr = [];
        MessageCallback.addListener("UnionMainMemberSync", this);
        this.updateList();
    },

    onDestroy() {
        MessageCallback.removeListener("UnionMainMemberSync", this);
    },

    messageCallbackHandler(route, data) {
        switch (route) {
            case 'UnionMainMemberSync':
                if (!data) return;
                this.updateItem(data.uid, data.score, data.changeScore);
                break;
        }
    },

    onBtnClick(event, parameter) {
        if (parameter === 'close') {
            if (this.node.getComponent('DialogWidgetCtrl')) {
                this.node.getComponent('DialogWidgetCtrl').out();
            } else {
                this.node.destroy();
            }
        } else if (parameter === 'query') {
            if (this.lastQueryUid === this.queryEditBox.string) return;
            if (this.queryEditBox.string.length > 0) {
                if (this.queryEditBox.string.length !== 6) {
                    AssetsManager.tipDialog("请输入正确的玩家ID");
                    return;
                }
            }
            this.curIndex = 0;
            this.maxIndex = 0;
            this.perCount = 5;
            this.ctrlArr = [];
            this.recordListRoot.removeAllChildren();
            this.updateList();
        } else if (parameter === 'modifyRecord') {
            AssetsManager.createDialog({
                path: "res/prefab/union/partner/UnionChangeScoreRecordDialog",
                bundle: ConfigModel.getSkin(),
                unionID: this.unionID
            });
        } else if (parameter === 'left') {
            if (this.curIndex === 0) return;
            this.curIndex--;
            this.updateList();
        } else if (parameter === 'right') {
            if (this.curIndex >= this.maxIndex) return;
            this.curIndex++;
            this.updateList();
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
        let matchData = {
            unionInfo: {
                $elemMatch: {
                    unionID: this.unionID,
                    spreaderID: UserModel.getData('uid')
                }
            }
        };
        if (this.queryEditBox.string.length > 0) {
            if (this.queryEditBox.string.length !== 6) {
                AssetsManager.tipDialog("请输入正确的玩家ID");
                return;
            }
            matchData.uid = this.queryEditBox.string;
        }
        this.lastQueryUid = this.queryEditBox.string;
        let reqData = {
            unionID: this.unionID,
            matchData: matchData,
            startIndex: this.curIndex * this.perCount,
            count: this.perCount
        };
        ApiHall.getMemberScoreListRequest(reqData, (res) => {
            let recordArr = res.msg.recordArr;
            this.maxIndex = Math.floor((res.msg.totalCount + 1) / this.perCount);
            if ((res.msg.totalCount + 1) % this.perCount === 0) {
                this.maxIndex--;
            }
            this.pageLabel.string = (this.curIndex + 1) + "/" + (this.maxIndex + 1);
            this.recordListRoot.removeAllChildren();
            this.memberTotalScore.string = res.msg.totalScore;
            for (let i = 0; i < recordArr.length; i++) {
                let record = recordArr[i];
                let item, ctrl;
                if (this.isSeting && this.userInfo.uid == this.unionOwnerID) {
                    item = cc.instantiate(this.setingListItem);
                    ctrl = item.getComponent("MemberSetingItem");
                } else {
                    item = cc.instantiate(this.recordListItem);
                    ctrl = item.getComponent("MemberScoreItem");
                }
                item.parent = this.recordListRoot;
                ctrl.initWidget(record, this.unionID, this.unionOwnerID);
                this.ctrlArr.push(ctrl);
            }
        });
    },

    updateItem(uid, score, changeScore) {
        for (let i = 0; i < this.ctrlArr.length; ++i) {
            let ctrl = this.ctrlArr[i];
            if (ctrl.userInfo.uid === uid) {
                ctrl.updateScore(score);
                break;
            }
        }
        this.memberTotalScore.string = Utils.formatNumberWithSymbol(parseFloat(this.memberTotalScore.string) + changeScore);
    }
});