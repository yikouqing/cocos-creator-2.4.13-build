
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiBrlhd = require('./ApiBrlhd');
const BRLHDModel = require("./BRLHDModel")
cc.Class({
    extends: cc.Component,

    properties: {
        List_Content: cc.Node,
        Title_Record: cc.Node,
        Item_Record: cc.Node,
        _startIndex: 0,
        _totalIndex: 0,
        _sendCount: 4,
    },


    onLoad() {
        MessageCallback.addListener('RoomMessagePush', this);
        this.showList();
    },

    onDestroy() {
        MessageCallback.removeListener('RoomMessagePush', this);
    },

    /**消息监听 */
    messageCallbackHandler(route, msg) {
        if (route === 'RoomMessagePush') {
            if (msg.type == ApiBrlhd.GAME_WIN_LOSE_PUSH) {
                BRLHDModel.setPoolHistory(msg.data.plusInfo);
                this.showList();
            }
        }
    },

    showList() {
        this.Item_Record.active = false;
        this.List_Content.removeAllChildren();
        let list = BRLHDModel.getPoolHistoryList() || [], len = list.length - 1;
        if (!list.length) { AssetsManager.tipDialog(`暂无当前数据!`); }
        for (let i = len; i >= 0; i--) {
            let sonList = list[i];
            let Item_Record = cc.instantiate(this.Item_Record);
            let show_Area = Item_Record.getChildByName("show_Area");
            Item_Record.getChildByName("show_new").active = i == len;
            sonList.forEach((val, areaIndex) => {
                let curNode = show_Area.getChildByName(`node_area${areaIndex}`);
                if (curNode) curNode.getComponent(cc.Button).interactable = val == 1;
            })
            Item_Record.parent = this.List_Content;
            Item_Record.setPosition(0, 0);
            Item_Record.active = true;
        }

        let totalObj = BRLHDModel.getPoolHistoryTotal() || {};
        let objLong = totalObj[BRLHDModel.AreaType.Long];
        let long_win = this.Title_Record.getChildByName("long_win");
        long_win.getComponent(cc.Label).string = `${objLong.win}`;

        let objHu = totalObj[BRLHDModel.AreaType.Hu];
        let hu_win = this.Title_Record.getChildByName("hu_win");
        hu_win.getComponent(cc.Label).string = `${objHu.win}`;

        let objHe = totalObj[BRLHDModel.AreaType.He];
        let he_win = this.Title_Record.getChildByName("he_win");
        he_win.getComponent(cc.Label).string = `${objHe.win}`;

    },


    onClickEvent(event, clickType) {
        if (clickType == "btn_close") {
            this.node.destroy();
        }
    }

    // update (dt) {},
});
