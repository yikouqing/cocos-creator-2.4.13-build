const ApiHall = require('../../../api/ApiHall');
const UserModel = require('../../../model/UserModel');
const AssetsManager = require('../../../utils/AssetsManager');

cc.Class({
    extends: cc.Component,

    properties: {
        listContent: cc.Node,
        listItem: cc.Prefab,

        _maxCount: 0,
        _perCount: 0,
        _startIndex: 0,
        _unionID: null
    },

    start() {
        this._startIndex = 0;
        this._perCount = 10;
        this._maxCount = 10;
        this._unionID = !!this.node.nodeParams ? this.node.nodeParams.unionID : null;
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
        if (!this._unionID) return;
        if (this._startIndex >= this._maxCount) return;
        let startIndex = this._startIndex;
        let reqData = {
            type: 0,
            startIndex: startIndex,
            count: this._perCount,
            unionID: this._unionID
        };
        ApiHall.safeBoxOperationRecordRequest(reqData, (res) => {
            if (startIndex != this._startIndex) return;
            let recordArr = res.msg.recordArr;
            this._maxCount = res.msg.totalCount;
            if (recordArr.length > 0) {
                for (let index = 0; index < recordArr.length; index++) {
                    let record = recordArr[index];
                    if (!record) continue;
                    let item = cc.instantiate(this.listItem);
                    item.parent = this.listContent;
                    item.getComponent("UnionRebateDrawRecordItem") && item.getComponent("UnionRebateDrawRecordItem").bind(record);
                }
                this._startIndex += recordArr.length;
            }
        });
    },


    btnClick(event, param) {

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
    },

});