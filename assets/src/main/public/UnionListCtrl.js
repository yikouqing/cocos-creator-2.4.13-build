const UserModel = require('../../model/UserModel');
const MessageCallback = require('../../utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad() {
        MessageCallback.addListener('UnionListSync', this);
    },
    onDestroy() {
        MessageCallback.removeListener('UnionListSync', this);
    },

    start() {
        this.activeSync()

    },

    activeSync() {
        this.unionID = UserModel.getOpUnionId()
        let unionItem = UserModel.getUserUnion(this.unionID)
        this.node.active = unionItem && unionItem.isInvite
    },

    messageCallbackHandler(route, data) {
        switch (route) {
            case 'UnionListSync':
                this.activeSync()
                break;
        }
    }

    // update (dt) {},
});