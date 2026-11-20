const Enums = require('../../../src/const/Enums');
const BRNNModel = require("./BRNNModel")
const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiRoom = require('../../../src/api/ApiRoom');
const ApiBrnn = require('./ApiBrnn');
const CCUtil = require("../../../src/utils/CCUtil")
const MessageCallback = require('../../../src/utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        item: cc.Node,
        content: cc.Node,
        winItem: cc.Node,
        loseItem: cc.Node,
        winCount: cc.Node,
        loseCount: cc.Node,
        txt_totalCount: cc.Label,
        scollView: cc.ScrollView,
    },

    onLoad() {
        this.item.active = false
        this.winItem.active = false
        this.loseItem.active = false
        MessageCallback.addListener('RoomMessagePush', this);
    },

    onDestroy() {
        MessageCallback.removeListener('RoomMessagePush', this);
    },

    /**消息监听 */
    messageCallbackHandler(route, msg) {
        if (route === 'RoomMessagePush') {
            if (msg.type === ApiRoom.GAME_WIN_LOSE_PUSH) {
                // console.log("走势图", msg.data)
                this.txt_totalCount.string = "本日局数" + msg.data.bureau
                let plusInfo = msg.data.plusInfo
                this.content.removeAllChildren()
                /**最近20条数据 */
                plusInfo.poolHistoryList.reverse() //最新的放最前面
                for (let i = 0; i < plusInfo.poolHistoryList.length; i++) {
                    const list = plusInfo.poolHistoryList[i];
                    let itemNode = cc.instantiate(this.item)
                    itemNode.x = 0
                    itemNode.active = true
                    itemNode.parent = this.content
                    if (i == 0) {
                        cc.find("new", itemNode).active = true
                    }
                    for (let j = 0; j < list.length; j++) {
                        const res = list[j];
                        let resItem = null
                        if (res == -1) {
                            resItem = cc.instantiate(this.winItem)
                        } else {
                            resItem = cc.instantiate(this.loseItem)
                        }
                        resItem.active = true
                        resItem.setPosition(0, 0)
                        resItem.parent = cc.find(j + "", itemNode)
                    }
                }
                this.scheduleOnce(() => {
                    this.scollView.scrollToTop(0.1)
                }, 0.1)

                /**输赢统计 */
                for (let i = 0; i < plusInfo.poolHistoryTotal.length; i++) {
                    const info = plusInfo.poolHistoryTotal[i];
                    let win = cc.find("txt_" + i, this.winCount).getComponent(cc.Label)
                    let lose = cc.find("txt_" + i, this.loseCount).getComponent(cc.Label)
                    win.string = info.win
                    lose.string = info.lose
                }
            }
        }
    },
});