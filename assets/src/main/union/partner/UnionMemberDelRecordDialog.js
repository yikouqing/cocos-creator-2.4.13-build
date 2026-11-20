const Utils = require('../../../utils/Utils');
const MessageCallback = require('../../../utils/MessageCallback');
const AssetsManager = require('../../../utils/AssetsManager');
const CCUtil = require('../../../utils/CCUtil');
const UserModel = require('../../../model/UserModel');
const ApiHall = require('../../../api/ApiHall');

cc.Class({
    extends: cc.Component,

    properties: {
        content: cc.Node,
        delItem: cc.Prefab,
        startIndex: 0,
        maxCount: 0,
        perCount: 10,
        _unionID: null
    },

    start() {
        this._unionID = !!this.node.nodeParams ? this.node.nodeParams.unionID || null : null;
        this.perCount = 10;
        this.startIndex = 0;
        this.maxCount = 10;
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
        let startIndex = this.startIndex;
        let reqData = {
            unionID: this._unionID,
            startIndex: startIndex,
            count: this.perCount,
        };
        ApiHall.getMemberDelRequest(reqData, (res) => {
            if (!cc.isValid(this.content)) return;
            if (startIndex != this.startIndex) return;
            let recordArr = res.msg.recordArr;
            this.maxCount = res.msg.totalCount;
            if (recordArr.length > 0) {
                for (let i = 0; i < recordArr.length; i++) {
                    let record = recordArr[i];
                    if (!record) continue;
                    // console.log("测试", res)
                    let delNode = cc.instantiate(this.delItem);
                    this.content.addChild(delNode);
                    delNode.getComponent('UnionMemberDelItem') && delNode.getComponent('UnionMemberDelItem').initWidget(record);
                }
                this.startIndex += recordArr.length;
            }
        });
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
        }
    }

    // update (dt) {},
});