const AssetsManager = require('../../../utils/AssetsManager');
const UserModel = require('../../../model/UserModel');
const MessageCallback = require('../../../utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        listView: cc.Node,
        listItem: cc.Prefab,

        _unionInfo: null,
    },

    start() {
        MessageCallback.addListener('UpdateUnionInfo', this);
        this._unionInfo = !!this.node.nodeParams ? this.node.nodeParams.unionInfo : null;
        this._cb = !!this.node.nodeParams ? this.node.nodeParams.cb : null;
        if (!this._unionInfo) {
            this.node.destroy();
            return;
        }
        this._updateRules();
    },

    messageCallbackHandler(route, data) {
        switch (route) {
            case 'UpdateUnionInfo':
                this._unionInfo = data.msg.unionInfo;
                this._updateRules();
                break;
        }
    },

    _updateRules() {
        if (!this._unionInfo) return;
        let rooms = UserModel.roomsFormat(this._unionInfo.roomRuleList); //记录房间规则列表
        if (!rooms) return;
        this.listView.destroyAllChildren();
        let callbacks = (node, item, index) => {
            node.getComponent('UnionRuleChooseListItem') &&
                node.getComponent('UnionRuleChooseListItem').bind(item, this._unionInfo);
        }
        if (!this.listView.getComponent('ScrollViewVertical')) {
            this.listView.addComponent('ScrollViewVertical');
        }
        this.listView.getComponent('ScrollViewVertical').viewInit({
            prefab: this.listItem,
            spacingY: 0,
            list: rooms,
            callback: callbacks
        });
    },

    onClick() {
        if (this.node.getComponent('DialogWidgetCtrl')) {
            this.node.getComponent('DialogWidgetCtrl').out();
        } else {
            this.node.destroy();
        }
    },

    onDestroy() {
        MessageCallback.removeListener('UpdateUnionInfo', this);
    }

});