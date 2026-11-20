const AssetsManager = require('../../../utils/AssetsManager')
const ApiHall = require('../../../api/ApiHall');

cc.Class({
    extends: cc.Component,

    properties: {
        listContent: cc.Node,
        emptyNode: cc.Node,
        recordItem: cc.Prefab,
    },

    onLoad() {
        this.unionInfo = this.node.nodeParams.unionInfo;
        this.startIndex = 0;
        this.perCount = 10;
        this.maxCount = 10;
        this.rankType = "day";
        this.updateList();
    },

    updateList() {
        if (this.gaiveStartIndex >= this.gaiveMaxCount) return;
        let matchData = {
            "unionInfo.unionID": this.unionInfo.unionID
        };
        let sortData = {};
        if (this.rankType === 'week') {
            sortData["unionInfo.weekDraw"] = -1;
        } else if (this.rankType === 'day') {
            sortData["unionInfo.todayDraw"] = -1;
        } else if (this.rankType === 'total') {
            sortData["unionInfo.totalDraw"] = -1;
        }
        let startIndex = this.startIndex;
        let reqData = {
            unionID: this.unionInfo.unionID,
            matchData: matchData,
            startIndex: startIndex,
            count: this.perCount,
            sortData: sortData
        };
        ApiHall.getRankRequest(reqData, (res) => {
            if (startIndex != this.startIndex) return;
            let recordArr = res.msg.recordArr;
            this.maxCount = res.msg.totalCount;
            if (this.maxCount > 200) this.maxCount = 200;
            this.emptyNode.active = this.maxCount === 0;
            if (recordArr.length > 0) {
                for (let i = 0; i < recordArr.length; i++) {
                    let record = recordArr[i];
                    let item = cc.instantiate(this.recordItem);
                    item.parent = this.listContent;
                    let ctrl = item.getComponent("AllRankItemCtrl");
                    ctrl.initWidget(record, this.startIndex + i);
                }
                this.startIndex += recordArr.length;
            }
        });
    },

    onScrollEvent(target, eventType) {
        switch (eventType) {
            case cc.ScrollView.EventType.SCROLL_TO_BOTTOM:
                this.updateList();
                break;
        }
    },

    reloadList() {
        this.startIndex = 0;
        this.perCount = 10;
        this.maxCount = 10;
        this.listContent.removeAllChildren();
        this.emptyNode.active = false;
        this.updateList();
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
            case 'day':
                this.rankType = 'day';
                this.reloadList();
                break;
            case 'week':
                this.rankType = "week";
                this.reloadList();
                break;
            case 'total':
                this.rankType = "total";
                this.reloadList();
                break;
        }
    }
});