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
        _uid: null,
        _unionID: null
    },

    start() {
        this._startIndex = 0;
        this._perCount = 10;
        this._maxCount = 10;
        this._uid = !!this.node.nodeParams ? this.node.nodeParams.uid : null;
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
        let todayTimeStart = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
        let todayTimeEnd = new Date(new Date().setHours(23, 59, 59, 999)).getTime();
        let matchData = {
            unionID: this._unionID,
            uid: this._uid,
            createTime: {
                $gte: todayTimeStart,
                $lte: todayTimeEnd
            }
        };
        let startIndex = this._startIndex;
        let reqData = {
            matchData: matchData,
            startIndex: startIndex,
            count: this._perCount,
        };
        ApiHall.getUnionRebateRecordRequest(reqData, (res) => {
            if (startIndex != this._startIndex) return;
            let recordArr = res.msg.recordArr;
            this._maxCount = res.msg.totalCount;
            if (recordArr.length > 0) {
                for (let i = 0; i < recordArr.length; i++) {
                    let record = recordArr[i];
                    let item = cc.instantiate(this.listItem);
                    item.parent = this.listContent;
                    let ctrl = item.getComponent("UnionPartnerRebateDetailItem");
                    ctrl && ctrl.bind(record);
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