const AssetsManager = require('../../../utils/AssetsManager')
const UserModel = require('../../../model/UserModel');
const ApiHall = require('../../../api/ApiHall');

cc.Class({
    extends: cc.Component,

    properties: {
        recordItem: cc.Prefab,
        listContent: cc.Node,
        emptyNode: cc.Node
    },

    onLoad() {
        this.startIndex = 0;
        this.perCount = 10;
        this.maxCount = 10;
        this.unionID = this.node.nodeParams.unionID;
        this.updateList();
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
        let matchData = {
            unionID: this.unionID,
            uid: UserModel.getData('uid'),
        };
        let startIndex = this.startIndex;
        let reqData = {
            matchData: matchData,
            startIndex: startIndex,
            count: this.perCount,
        };
        ApiHall.getUnionRebateRecordRequest(reqData, (res) => {
            if (startIndex != this.startIndex) return;
            let recordArr = res.msg.recordArr;
            this.maxCount = res.msg.totalCount;
            this.emptyNode.active = res.msg.totalCount === 0;
            if (recordArr.length > 0) {
                for (let i = 0; i < recordArr.length; i++) {
                    let record = recordArr[i];
                    let item = cc.instantiate(this.recordItem);
                    item.parent = this.listContent;
                    let ctrl = item.getComponent("UnionRebateRecordItemCtrl");
                    ctrl.initWidget(record);
                }
                this.startIndex += recordArr.length;
            }
        });
    },

    onBtnClick(event, param) {

        switch (param) {
            case 'close': {
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
            }
                break;
        }
    }
});