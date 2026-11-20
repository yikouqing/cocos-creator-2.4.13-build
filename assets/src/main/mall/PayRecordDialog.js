const AssetsManager = require('../../utils/AssetsManager');
const ApiHall = require('../../api/ApiHall');
const ConfigModel = require('../../model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        content: cc.Node,
        recordPrefab: cc.Prefab,

        _perCount: 0,
        _startIndex: 0,
        _maxCount: 0
    },

    start() {
        AssetsManager.loadAsset({
            path: 'res/prefab/main/mall/PayRecordItem',
            bundle: ConfigModel.getSkin(),
            aType: cc.Prefab
        });
        this._startIndex = 0;
        this._perCount = 10;
        this._maxCount = 10;
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
        this.content.removeAllChildren();
        if (this._startIndex >= this._maxCount) return;
        let startIndex = this._startIndex;
        let reqData = {
            startIndex: startIndex,
            count: this._perCount,
        };
        ApiHall.getRechargeRecordRequest(reqData, (res) => {
            // console.log('订单记录', res);
            let recordArr = res.msg.recordArr;
            this._maxCount = res.msg.totalCount;
            if (startIndex != this._startIndex) return;
            if (recordArr.length > 0) {
                this._startIndex += recordArr.length;
                if (!this.recordPrefab || !cc.isValid(this.content)) return;
                for (let index = 0; index < recordArr.length; index++) {
                    let iItem = recordArr[index];
                    let node = cc.instantiate(this.recordPrefab);
                    node.parent = this.content;
                    iItem.rIndex = index;
                    node.getComponent('PayRecordItem') && node.getComponent('PayRecordItem').bind(iItem);
                }
            }
        });
    },

    buttonClicks(event, params) {
        switch (params) {
            case 'close':
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
                break;
        }
    },

});