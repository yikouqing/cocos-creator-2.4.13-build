const AssetsManager = require('../../../utils/AssetsManager')
const ApiHall = require('../../../api/ApiHall');

cc.Class({
    extends: cc.Component,

    properties: {
        listContent: cc.Node,
        emptyNode: cc.Node,
        recordItem: cc.Prefab,
    },

    start() {
        this.unionID = this.node.nodeParams.unionInfo.unionID;
        this.startIndex = 0;
        this.perCount = 10;
        this.maxCount = 10;
        this.rankType = "score";
        this.updateList();
    },

    updateList() {
        if (this.gaiveStartIndex >= this.gaiveMaxCount) return;
        let matchData = {
            "unionInfo.unionID": this.unionID,
        };
        let sortData = {};
        if (this.rankType === 'score') {
            sortData["unionInfo.score"] = -1;
        } else if (this.rankType === 'draw') {
            sortData["unionInfo.totalDraw"] = -1;
        } else if (this.rankType === 'yesterdayWin') {
            sortData["unionInfo.yesterdayWin"] = -1;
        } else if (this.rankType === 'todayWin') {
            sortData["unionInfo.todayWin"] = -1;
        }
        let startIndex = this.startIndex;
        let rankType = this.rankType;
        let reqData = {
            unionID: this.unionID,
            matchData: matchData,
            startIndex: startIndex,
            count: this.perCount,
            sortData: sortData
        };
        ApiHall.getRankRequest(reqData, (res) => {
            if (startIndex != this.startIndex) return;
            if (rankType != this.rankType) return;
            let recordArr = res.msg.recordArr;
            this.maxCount = res.msg.totalCount;
            this.emptyNode.active = this.maxCount === 0;
            if (recordArr.length > 0) {
                for (let i = 0; i < recordArr.length; i++) {
                    let record = recordArr[i];
                    let item = cc.instantiate(this.recordItem);
                    item.parent = this.listContent;
                    let ctrl = item.getComponent("RankItemCtrl");
                    let rank = this.startIndex + i + 1;
                    ctrl.initWidget(rank, rankType, record);
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
            case 'close':
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
                break;
            case 'score':
                this.rankType = 'score';
                this.reloadList();
                break;
            case 'draw':
                this.rankType = "draw";
                this.reloadList();
                break;
            case 'yesterdayWin':
                this.rankType = "yesterdayWin";
                this.reloadList();
                break;
            case 'todayWin':
                this.rankType = "todayWin";
                this.reloadList();
                break;
        }
    }
});