const AssetsManager = require('../../utils/AssetsManager');

cc.Class({
    extends: cc.Component,

    properties: {
        listView: cc.Node,
        listItem: cc.Prefab,

        _users: null,
    },

    start() {
        this._users = !!this.node.nodeParams ? this.node.nodeParams.users : null;
        if (!this._users) {
            this.node.destroy();
            return;
        }
        this._updateOnlines(this._users);
    },

    _updateOnlines(users) {
        if (!users) return;
        this.listView.destroyAllChildren();
        for (let index = 0; index < users.length; index++) {
            let node = cc.instantiate(this.listItem);
            this.listView.addChild(node);
            node.getComponent('GameLookOnListItem') && node.getComponent('GameLookOnListItem').bind(users[index]);
        }
    },

    onClick() {

        if (this.node.getComponent('DialogWidgetCtrl')) {
            this.node.getComponent('DialogWidgetCtrl').out();
        } else {
            this.node.destroy();
        }
    },

});