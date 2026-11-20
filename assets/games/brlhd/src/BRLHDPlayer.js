
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiBrlhd = require('./ApiBrlhd');
const ApiRoom = require('../../../src/api/ApiRoom');
const CCUtil = require("../../../src/utils/CCUtil")
const Utils = require("../../../src/utils/Utils")
const BRLHDModel = require("./BRLHDModel")
cc.Class({
    extends: cc.Component,

    properties: {
        List_Content: cc.Node,
        List_Item: cc.Node,
        node_page: cc.Node,
        _startIndex: 0,
        _totalIndex: 0,
        _sendCount: 4,
        _retryCount: 0,
    },


    onLoad() {
        MessageCallback.addListener('GameMessagePush', this);
        this.List_Item.active = false;
        this.node_page.active = false;
        this._sendCount = 4;
        this.sendNotify();
    },

    onDestroy() {
        MessageCallback.removeListener('GameMessagePush', this);
    },

    /**消息监听 */
    messageCallbackHandler(route, msg) {
        if (route === 'GameMessagePush') {
            if (msg.type === ApiBrlhd.GAME_USER_RANK_PUSH) {
                this.showList(msg.data);
            }
        }
    },

    sendNotify() {
        let num = this._startIndex * this._sendCount;
        ApiRoom.gameMessageNotify(ApiBrlhd.gameUesrRankNotify(BRLHDModel.getMyUid(), num, this._sendCount))
    },

    showList(data) {
        if (!data) return;
        let list = data.list || [];
        this.List_Content.removeAllChildren();
        list.forEach((CurUser, index) => {
            let CurNode = cc.instantiate(this.List_Item);
            let text_id = CurNode.getChildByName("text_id");
            let spr_head = CurNode.getChildByName("spr_head");
            let text_sheng = CurNode.getChildByName("text_sheng");
            let text_index = CurNode.getChildByName("text_index");
            let text_jinbi = CurNode.getChildByName("text_jinbi");
            let text_xiazhu = CurNode.getChildByName("text_xiazhu");
            text_index.getComponent(cc.Label).string = index + 1;
            text_id.getComponent(cc.Label).string = "ID:" + CurUser.uid;
            text_sheng.getComponent(cc.Label).string = CurUser.winScore;
            text_xiazhu.getComponent(cc.Label).string = CurUser.pourScore;
            text_jinbi.getComponent(cc.Label).string = (CurUser.score > 0 ? CurUser.score : 0);
            AssetsManager.loadSpriteFrame({
                sprite: spr_head.getComponent(cc.Sprite),
                path: CurUser.avatar,
            });
            CurNode.parent = this.List_Content;
            CurNode.setPosition(0, 0);
            CurNode.active = true;
        })
        let totalCount = data.totalCount || 0;
        let text_page = this.node_page.getChildByName("text_page");
        if (!list.length) { AssetsManager.tipDialog("暂无当前数据!"); };
        this._totalIndex = Math.floor(totalCount / this._sendCount) + (totalCount % this._sendCount === 0 ? 0 : 1);
        text_page.getComponent(cc.Label).string = !!this._totalIndex ? (this._startIndex + 1) + "/" + this._totalIndex : '0/0';
        this.node_page.active = !!this._totalIndex;
    },
    onClickEvent(event, clickType) {
        if (CCUtil.clickInterval(event.target, 1)) {
            return;
        }
        if (clickType == "btn_close") {
            this.node.destroy();
        } else if (clickType == "btn_upper") {
            if (this._startIndex > 0) {
                this._startIndex -= 1;
            } else {
                AssetsManager.tipDialog("已是第一页");
                return
            }
            this.sendNotify();
        } else if (clickType == "btn_lower") {
            if (this._startIndex < this._totalIndex - 1) {
                this._startIndex += 1;
            } else {
                AssetsManager.tipDialog("已是最后一页");
                return
            }
            this.sendNotify();
        }
    }
    // update (dt) {},
});
