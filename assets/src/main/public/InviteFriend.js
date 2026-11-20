const MessageCallback = require('../../utils/MessageCallback');
const AssetsManager = require('../../utils/AssetsManager');
const ApiHall = require('../../api/ApiHall');
const UserModel = require('../../model/UserModel');
const ApiRoom = require('../../api/ApiRoom');
const CCUtil = require('../../utils/CCUtil');
cc.Class({
    extends: cc.Component,
    properties: {
        item: cc.Node,
        listNode: cc.Node,
        allInvite: cc.Node,
        _unionInfo: null, //联盟信息

    },
    onLoad() {
        this.startIndex = 0;
        this.perCount = 5;
        this.maxCount = 10;
        this.recordArr = []
        this.gameRule = this.node.nodeParams.gameRule;
        MessageCallback.addListener('RoomMessagePush', this)
    },

    onDestroy() {
        MessageCallback.removeListener('RoomMessagePush', this)
    },

    start() {
        // this.uid = UserModel.getData('uid')
        this.unionID = UserModel.getOpUnionId()
        this.updateList()
    },

    // 更新列表
    updateList() {
        // 分页
        if (this.startIndex >= this.maxCount) return;
        // 成员列表
        let matchData = {
            unionInfo: {
                $elemMatch: {
                    unionID: this.unionID,
                }
            },
            frontendId: {
                $ne: ''
            }
        };
        let reqData = {
            unionID: this.unionID,
            matchData: matchData,
            startIndex: this.startIndex,
            count: this.perCount,
        };
        ApiHall.getAllOnLineList(reqData, (res) => {
            // console.log('测试-邀请', res)
            if (!cc.isValid(this.node)) return;
            let arr = res.msg.recordArr
            this.recordArr = this.recordArr.concat(res.msg.recordArr)
            this.maxCount = res.msg.recordCount;
            for (let i = 0; i < arr.length; i++) {
                let info = arr[i]
                let item = cc.instantiate(this.item);
                // 给节点添加属性
                item.attr(info)
                let nick = cc.find('name', item).getComponent(cc.Label)
                let navite = cc.find('yaoqing', item)
                let zaixian = cc.find('zaixian', item)
                let headSprite = cc.find('head', item).getComponent(cc.Sprite);
                let youxizhong = cc.find('youxizhong', item)
                if (info.roomID != '') {
                    youxizhong.active = true
                } else {
                    zaixian.active = true
                    navite.active = true
                }
                item.active = true
                nick.string = info.nickname
                item.parent = this.listNode
                AssetsManager.loadSpriteFrame({
                    path: info.avatar,
                    sprite: headSprite
                });
            }
            if (arr.length > 0) {
                this.startIndex += arr.length;
            }
        })

    },

    /**单人邀请按钮响应 */
    onInviteButton(event) {
        event.target.intervalTime = event.target.intervalTime || 0;
        let nowTime = Date.now() - event.target.intervalTime;
        let lastTime = (10 * 1000 - nowTime) / 1000;
        let tips = `${Math.floor(lastTime)}秒后可以再次邀请`;
        if (CCUtil.clickInterval(event.target, 10, tips)) return;
        let uid = event.target.parent.uid
        let roomID = UserModel.getData('roomID')
        ApiRoom.roomMessageNotify(ApiRoom.gameInvitationNotify(this.unionID, [uid], roomID, this.gameRule));
    },

    /**一键邀请按钮响应 */
    allOnInviteList(event) {
        event.target.intervalTime = event.target.intervalTime || 0
        let nowTime = Date.now() - event.target.intervalTime;
        let lastTime = (10 * 1000 - nowTime) / 1000;
        let tips = `${Math.floor(lastTime)}秒后可以再次邀请`;
        if (CCUtil.clickInterval(event.target, 10, tips)) return;
        if (!this.recordArr || !Array.isArray(this.recordArr)) {
            return
        }
        let uids = []
        for (let index = 0; index < this.recordArr.length; index++) {
            if (this.recordArr[index].roomID == '') {
                uids.push(this.recordArr[index].uid)
            }
        }
        let roomID = UserModel.getData('roomID')
        if (uids.length > 0) {
            ApiRoom.roomMessageNotify(ApiRoom.gameInvitationNotify(this.unionID, uids, roomID, this.gameRule));
        }
    },

    /**关闭按钮响应 */
    onCloseClick() {
        if (this.node.getComponent('DialogWidgetCtrl')) {
            this.node.getComponent('DialogWidgetCtrl').out();
        } else {
            this.node.destroy();
        }
    },

    /**滑动响应 */
    onScrollEvent(target, eventType) {
        switch (eventType) {
            case cc.ScrollView.EventType.SCROLL_TO_BOTTOM:
                this.updateList();
                break;
        }
    },

    /**消息监听 */
    messageCallbackHandler(route, msg) {
        if (route === 'RoomMessagePush') {
            if (msg.type === ApiRoom.GAME_INVITATION_RESUIL_PUSH) {
                let message = msg.data.msg
                AssetsManager.tipDialog(message)
            }
        }
    }

});