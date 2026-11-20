const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ApiRoom = require('../../../src/api/ApiRoom');
const BRLHDModel = require("./BRLHDModel");
const ApiBrlhd = require('./ApiBrlhd');
var AreaList = [
    { type: 2, index: 0 },//虎
    { type: 3, index: 1 },//和
    { type: 1, index: 2 },//龙
];
cc.Class({
    extends: cc.Component,

    properties: {
        list_Area: [cc.Node],
    },

    start() {
        this._selectedType = -1;
        this._selectedRecord = -1;
        let RateList = BRLHDModel.getRateList();
        this.list_Area.forEach((CurNode, areaIndex) => {
            let rateObj = RateList[areaIndex];
            let showChip = CurNode.getChildByName("showChip");
            let showRate = CurNode.getChildByName("showRate");
            CurNode.getChildByName("showResult").active = false;
            showChip.off("click");
            showChip.on("click", () => { this.showSelected(areaIndex); });
            if (rateObj) showRate.getComponent(cc.Label).string = `${rateObj.tou} : ${rateObj.pei}`;
        });
        this.showSelected(this._selectedType, false);
        MessageCallback.addListener('GameMessagePush', this);
        ApiRoom.gameMessageNotify(ApiBrlhd.gameGetTestCardsNotify());
        // 你发552 获取设置的类型 回你652   type没有就表示没有设置   1龙2虎3和
    },

    /**
     * 显示选择结果
     * @param {*} CurVal 当前数据
     * @param {*} CurType false>CurVal为下标 、true>CurVal为类型
     */
    showSelected(CurVal, CurType) {
        let CurObj = null;
        for (let index = 0; index < AreaList.length; index++) {
            let obj = AreaList[index];
            if (CurType) {
                if (obj && obj.type == CurVal) {
                    CurObj = obj;
                    break;
                }
            } else {
                if (obj && obj.index == CurVal) {
                    CurObj = obj;
                    break;
                }
            }
        }
        let CurIndex = CurObj ? CurObj.index : -1;
        this._selectedType = CurObj ? CurObj.type : -1;
        this.list_Area.forEach((CurNode, AreaIndex) => {
            CurNode.getChildByName("showResult").active = AreaIndex == CurIndex;
        })
    },

    onDestroy() {
        MessageCallback.removeListener('GameMessagePush', this);
    },

    messageCallbackHandler(route, msg) {
        if (!this.node) return false;
        if (route === 'GameMessagePush') {
            switch (msg.type) {
                case ApiBrlhd.GAME_GET_TEST_CARDS_PUSH:
                    // console.log("调试====652=====", msg.data)
                    this._selectedRecord = msg.data.type || -1;
                    this.showSelected(this._selectedRecord, true);
                    break;
                case ApiBrlhd.GAME_SET_TEST_CARDS_PUSH:
                    // console.log("调试====651=====", msg.data)
                    if (!!msg.data && !!msg.data.isSuccess) {
                        AssetsManager.tipDialog('操作成功！');
                    } else {
                        AssetsManager.tipDialog('操作失败，请重试!');
                    }
                    this.node.destroy();
                    break;
            }
        }
    },
    /**按钮响应 */
    onBtnClick(event, clickType) {
        if (CCUtil.clickInterval(event.target)) {
            return;
        }
        if (clickType == "btn_qd") {
            if (this._selectedType == -1) {
                AssetsManager.tipDialog('请先选择开奖池！');
                return;
            }
            if (this._selectedType == this._selectedRecord) {
                AssetsManager.tipDialog('已选择当前开奖池,请重新选择！');
                return;
            }
            // 你发551  设置开那个 date里面传type   1龙2虎3和   回你651
            ApiRoom.gameMessageNotify(ApiBrlhd.gameSetTestCardsNotify(this._selectedType));
        } else if (clickType == "btn_qx") {
            this.node.destroy();
        }
    },
});
