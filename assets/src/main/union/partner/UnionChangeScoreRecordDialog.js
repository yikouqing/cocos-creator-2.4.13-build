const AssetsManager = require('../../../utils/AssetsManager');
const UserModel = require('../../../model/UserModel');
const ApiHall = require('../../../api/ApiHall');

cc.Class({
    extends: cc.Component,

    properties: {
        recordItem: cc.Prefab,
        giveContentRoot: cc.Node,
        giveEmptyNode: cc.Node,
        totalAddLabel: cc.Label,
        yesterdayTotalAddLabel: cc.Label,
        todayAddLabel: cc.Label,
        totalJianLabel: cc.Label,
        yesterdayTotalJianLabel: cc.Label,
        todayJianLabel: cc.Label,
        addNode: cc.Node,
        jianNode: cc.Node,
        queryEditBox: cc.EditBox,
        toggleRoot: cc.Node
    },

    // LIFE-CYCLE CALLBACKS:

    start() {
        this.gaiveStartIndex = 0;
        this.gaivePerCount = 10;
        this.gaiveMaxCount = 10;
        this.unionID = this.node.nodeParams.unionID;
        this.inited = false;
        let unionInfo = UserModel.getUnionInfo(this.unionID);
        if (!!unionInfo) {
            if (!unionInfo.partner) {
                let toggle1 = this.toggleRoot.getChildByName("toggle1");
                toggle1.active = false;
                let toggle2 = this.toggleRoot.getChildByName("toggle2");
                toggle2.active = false;
                let toggle3 = this.toggleRoot.getChildByName("toggle3");
                toggle3.getComponent(cc.Toggle).isChecked = true;
                this.listType = "selfAddScore";
            } else {
                this.listType = "addScore";
            }
        }

        this.updateGiveList();
        this.inited = true;
    },

    updateGiveList() {
        if (this.gaiveStartIndex >= this.gaiveMaxCount) return;
        let matchData = {
            "unionID": this.unionID
        };
        if (this.listType === 'addScore') {
            matchData.uid = UserModel.getData('uid');
            matchData.count = {
                $gt: 0
            };
        } else if (this.listType === 'jianScore') {
            matchData.uid = UserModel.getData('uid');
            matchData.count = {
                $lt: 0
            };
        } else if (this.listType === 'selfAddScore') {
            matchData.gainUid = UserModel.getData('uid');
            matchData.count = {
                $gt: 0
            };
        } else if (this.listType === 'selfJianScore') {
            matchData.gainUid = UserModel.getData('uid');
            matchData.count = {
                $lt: 0
            };
        }
        if (this.queryEditBox.string.length > 0) {
            if (this.queryEditBox.string.length !== 6) {
                AssetsManager.tipDialog("请输入正确的玩家ID");
                return;
            }
            if (this.listType === 'addScore' || this.listType === 'jianScore') {
                matchData.gainUid = this.queryEditBox.string;
            } else {
                matchData.uid = this.queryEditBox.string;
            }
        }
        this.lastQueryUid = this.queryEditBox.string;
        let gaiveStartIndex = this.gaiveStartIndex;
        let reqData = {
            unionID: this.unionID,
            matchData: matchData,
            startIndex: gaiveStartIndex,
            count: this.gaiveMaxCount
        };
        ApiHall.getModifyScoreRecordRequest(reqData, (res) => {
            if (gaiveStartIndex != this.gaiveStartIndex) return;
            let recordArr = res.msg.recordArr;
            if (recordArr.length > 0) {
                this.gaiveMaxCount = res.msg.totalCount;
                this.totalAddLabel.string = res.msg.totalScoreCount;
                this.yesterdayTotalAddLabel.string = res.msg.yesterdayTotalCount;
                this.todayAddLabel.string = res.msg.todayTotalCount;
                this.totalJianLabel.string = res.msg.totalScoreCount;
                this.yesterdayTotalJianLabel.string = res.msg.yesterdayTotalCount;
                this.todayJianLabel.string = res.msg.todayTotalCount;
                for (let i = 0; i < recordArr.length; i++) {
                    let record = recordArr[i];
                    let item = cc.instantiate(this.recordItem);
                    item.parent = this.giveContentRoot;
                    let ctrl = item.getComponent("ChangeScoreRecordItem");
                    ctrl.initWidget(record);
                }
                this.gaiveStartIndex += this.gaivePerCount;
            }

            if (this.gaiveMaxCount === 0) {
                this.giveEmptyNode.active = true;
            }
        });
    },

    onGiveScrollEvent(target, eventType) {
        switch (eventType) {
            case cc.ScrollView.EventType.SCROLL_TO_BOTTOM:
                this.updateGiveList();
                break;
        }
    },

    reloadList() {
        this.gaiveStartIndex = 0;
        this.gaivePerCount = 10;
        this.gaiveMaxCount = 10;
        this.giveContentRoot.removeAllChildren();
        this.giveEmptyNode.active = false;
        this.updateGiveList();
    },

    onBtnClick(event, param) {
        if (!this.inited) return;

        switch (param) {
            case 'close': {
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
            }
                break;
            case 'give':
                this.addNode.active = true;
                this.jianNode.active = false;
                this.listType = 'addScore';

                this.reloadList();
                break;
            case 'gain':
                this.jianNode.active = true;
                this.addNode.active = false;
                this.listType = 'jianScore';

                this.reloadList();
                break;
            case 'selfAdd':
                this.addNode.active = true;
                this.jianNode.active = false;
                this.listType = 'selfAddScore';

                this.reloadList();
                break;
            case 'selfJian':
                this.jianNode.active = true;
                this.addNode.active = false;
                this.listType = 'selfJianScore';

                this.reloadList();
                break;
            case 'query':
                if (this.lastQueryUid === this.queryEditBox.string) return;
                if (this.queryEditBox.string.length > 0) {
                    if (this.queryEditBox.string.length !== 6) {
                        AssetsManager.tipDialog("请输入正确的玩家ID");
                        return;
                    }
                }
                this.gaiveStartIndex = 0;
                this.gaivePerCount = 10;
                this.gaiveMaxCount = 10;
                this.giveContentRoot.removeAllChildren();
                this.updateGiveList();
                break;
        }
    }
});