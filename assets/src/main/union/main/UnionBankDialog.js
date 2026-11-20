const Utils = require('../../../utils/Utils');
const MessageCallback = require('../../../utils/MessageCallback');
const AssetsManager = require('../../../utils/AssetsManager')
const UserModel = require('../../../model/UserModel');
const ApiHall = require('../../../api/ApiHall');

cc.Class({
    extends: cc.Component,

    properties: {
        scoreLabel: cc.Label,
        safeScoreLabel: cc.Label,
        todayUseLabel: cc.Label,
        yesterdayUseLabel: cc.Label,
        recordListRoot: cc.Node,
        recordListItem: cc.Node,
        pageList: cc.Node,
        scoreEditBox: cc.EditBox,
        _optType: 0, //0存  1 取
    },

    start() {
        this.startIndex = 0;
        this.perCount = 10;
        this.maxCount = 10;
        this.unionID = this.node.nodeParams.unionID;
        if (this.pageList) {
            this.pageList.active = false
        }
        this.updateScore(null);
        this.updateList();
        MessageCallback.addListener('UpdateUserInfoPush', this);
        MessageCallback.addListener('UpdateOperationSafeBoxList', this);
    },

    onDestroy() {
        MessageCallback.removeListener('UpdateUserInfoPush', this);
        MessageCallback.removeListener('UpdateOperationSafeBoxList', this);
    },

    messageCallbackHandler(route, msg) {
        switch (route) {
            case 'UpdateUserInfoPush':
                this.updateScore(msg);
                break;
            case 'UpdateOperationSafeBoxList':
                this.startIndex = 0;
                this.perCount = 10;
                this.maxCount = 10;
                this.recordListRoot.removeAllChildren();
                this.updateList();
                break;
        }
    },

    onBtnClk(event, param) {
        switch (param) {
            case 'close': {
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
            }
                break;
            case 'save':
                if (event.isChecked) {
                    // console.log("存放")
                    this._optType = 0
                    this.scoreEditBox.string = ""
                    this.scoreEditBox.placeholder = "请输入存放数额"
                }
                break;
            case 'take':
                if (event.isChecked) {
                    // console.log("取出")
                    this._optType = 1
                    this.scoreEditBox.string = ""
                    this.scoreEditBox.placeholder = "请输入提取数额"
                }
                break;
            case 'record':
                AssetsManager.createDialog({
                    path: "res/prefab/union/main/UnionRebateRecordDialog",
                    bundle: ConfigModel.getSkin(),
                    unionID: this.unionID
                });
                break;
            case 'modifyRecord':
                AssetsManager.createDialog({
                    path: "res/prefab/union/partner/UnionChangeScoreRecordDialog",
                    bundle: ConfigModel.getSkin(),
                    unionID: this.unionID
                });
                break;
            case 'enter':
                var r = /^\+?[1-9][0-9]*$/ //非0的正整数
                if (!r.test(this.scoreEditBox.string)) {
                    this.scoreEditBox.string = '';
                    AssetsManager.tipDialog(`请输入正确的积分`);
                    return
                }
                let score = parseInt(this.scoreEditBox.string)
                let unionInfoItem = UserModel.getUnionInfo(this.unionID);
                /**取的时候不能大于保险箱数字 */
                if (this._optType === 1) {
                    if (score > unionInfoItem.saveScore) {
                        AssetsManager.tipDialog(`请输入正确的积分`);
                        return
                    }
                    score *= -1
                }
                /**存的时候不能大于身上的积分 */
                if (this._optType === 0 && score > unionInfoItem.score) {
                    AssetsManager.tipDialog(`请输入正确的积分`);
                    return
                }
                let reqData = {
                    count: score,
                    unionID: this.unionID
                };
                ApiHall.saveBoxOperationRequest(reqData, () => {
                    MessageCallback.emitMessage("UpdateOperationSafeBoxList");
                    this.scoreEditBox.string = "";
                });
                break;
            case 'det':
                this.pageList.active = true;
                break;
            case 'colsePage':
                this.pageList.active = false;
                break;
        }
    },

    onScrollEvent(target, eventType) {
        switch (eventType) {
            case cc.ScrollView.EventType.SCROLL_TO_BOTTOM:
                this.updateList();
                break;
        }
    },

    updateScore(data) {
        let unionInfoItem = null;
        if (!data || !data.unionInfo) {
            unionInfoItem = UserModel.getUnionInfo(this.unionID);
        } else {
            let unionInfo = data.unionInfo;
            unionInfoItem = unionInfo.find((ele) => {
                return ele.unionID === this.unionID;
            });
        }
        if (!unionInfoItem) return;
        this.scoreLabel.string = Utils.formatNumberWithSymbol(unionInfoItem.score, 2);
        this.safeScoreLabel.string = Utils.formatNumberWithSymbol(unionInfoItem.saveScore, 2);
        this.todayUseLabel.string = Utils.formatNumberWithSymbol(unionInfoItem.todayRebate, 2);
        this.yesterdayUseLabel.string = Utils.formatNumberWithSymbol(unionInfoItem.yesterdayRebate, 2);
    },

    updateList() {
        if (this.startIndex >= this.maxCount) return;
        let startIndex = this.startIndex;
        let reqData = {
            type: 1,
            startIndex: startIndex,
            count: this.perCount,
            unionID: this.unionID
        };
        ApiHall.safeBoxOperationRecordRequest(reqData, (res) => {
            if (startIndex != this.startIndex) return;
            let recordArr = res.msg.recordArr;
            this.maxCount = res.msg.totalCount;
            if (recordArr.length > 0) {
                for (let i = 0; i < recordArr.length; i++) {
                    let record = recordArr[i];
                    let item = cc.instantiate(this.recordListItem);
                    let date = Utils.getDateFormat(record.createTime);
                    item.x = 0;
                    item.parent = this.recordListRoot;
                    item.getChildByName('index').getComponent(cc.Label).string = record.index.toString();
                    item.getChildByName('time').getComponent(cc.Label).string = date.yyyymmddhhmm;
                    item.getChildByName('type').getComponent(cc.Label).string = record.count > 0 ? "存入" : "提取";
                    item.getChildByName('score').getComponent(cc.Label).string = Math.abs(record.count);
                }
                this.startIndex += recordArr.length;
            }
        });
    },
});