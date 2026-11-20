const AssetsManager = require('../../../utils/AssetsManager');
const Enums = require('../../../const/Enums');
cc.Class({
    extends: cc.Component,

    properties: {
        listView: cc.Node,
        listItem: cc.Prefab,

        _rooms: null,
        _unionInfo: null,
    },

    start() {
        this._rooms = !!this.node.nodeParams ? this.node.nodeParams.roomList : null;
        this._unionInfo = !!this.node.nodeParams ? this.node.nodeParams.unionInfo : null;
        this._cb = !!this.node.nodeParams ? this.node.nodeParams.cb : null;
        if (!this._rooms) {
            this.node.destroy();
            return;
        }
        this._roomsInit(this._rooms);
    },

    _roomsInit(rooms) {
        if (!rooms) return;
        // console.log("加载房间列表", rooms)
        this.listView.destroyAllChildren();
        rooms = this._repeatFilter(rooms);
        let callbacks = (node, room, index) => {
            node.getComponent('UnionQuickJoinListItem') &&
                node.getComponent('UnionQuickJoinListItem').bind(this._unionInfo, room);
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

    _repeatFilter(data) {
        let rooms = [];
        let id = '';
        for (const room of data) {
            let roomRuleId = room._id || room.gameRule._id;
            if (roomRuleId == id) continue;
            rooms.push(room);
            id = roomRuleId;
        }
        return rooms;
    },

    onClick() {
        if (this.node.getComponent('DialogWidgetCtrl')) {
            this.node.getComponent('DialogWidgetCtrl').out();
        } else {
            this.node.destroy();
        }
    },

});