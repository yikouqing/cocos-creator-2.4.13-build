const AssetsManager = require('../../utils/AssetsManager')
const UserModel = require('../../model/UserModel');
const ApiHall = require('../../api/ApiHall');
const ConfigModel = require("../../model/ConfigModel")
const Utils = require('../../utils/Utils');
const MessageCallback = require('../../utils/MessageCallback');

cc.Class({
    extends: cc.Component,

    properties: {
        recordItem: cc.Prefab,
        listContent: cc.Node,
        btnContent: cc.Node,
        selectTime: cc.Node,
        searchEdbox: cc.EditBox,
        txt_selectTime: cc.Label,
        bg_time: cc.Node,
        txt_jintian: cc.Label,
        txt_zuotian: cc.Label,
        txt_qiantian: cc.Label,
        txt_duiju: cc.Label,
        txt_dayingjia: cc.Label,
        txt_zhanji: cc.Label,
        _recordDateIndex: 0,
    },

    start() {
        this._recordDateIndex = 0;
        this.startIndex = 0;
        this.perCount = 5;
        this.maxCount = 10;
        this.unionID = this.node.nodeParams.unionID;
        this.type = this.node.nodeParams.type;
        this.uid = this.node.nodeParams.uid;
        this.userInfo = this.node.nodeParams.userInfo;
        this.showPartnerGameRecord = this.node.nodeParams.showPartnerGameRecord || !!ConfigModel.getData("showPartnerGameRecord");
        this.bg_time.active = false
        this.selectGameType = 0 //当前选择的游戏类型
        this.nodeParent = this.node.nodeParams.nodeParent;
        MessageCallback.emitMessage("BroadcastVisibleSync", false);
        if (!!this.nodeParent && cc.isValid(this.nodeParent)) {
            this.nodeParent.destroy();
        }
        this.initGameBtn()
        this.updateList()
    },

    /**初始化左边的游戏按钮 */
    initGameBtn() {
        let tlist = ConfigModel.getBundles();
        this.btnContent.removeAllChildren();
        let add = (gameType, item) => {
            let node = cc.instantiate(item);
            node.attr({
                nodeParams: {
                    selectedType: this.selectGameType,
                    type: gameType,
                    comp: this
                }
            }); //设置初始化参数
            this.btnContent.addChild(node);
        }
        AssetsManager.loadAsset({
            path: 'res/prefab/main/record/GameRecordTypeTog',
            bundle: ConfigModel.getSkin(),
            aType: cc.Prefab
        }, (item) => {
            if (!item || !cc.isValid(this.node)) return;
            add(0, item)
            tlist.forEach(type => {
                add(type, item);
            });
        });
    },

    /**重置分页选项 */
    resetInfo() {
        this.startIndex = 0
        this.perCount = 5;
        this.maxCount = 10;
    },

    onScrollEvent(target, eventType) {
        switch (eventType) {
            case cc.ScrollView.EventType.SCROLL_TO_BOTTOM:
                this.updateList();
                break;
        }
    },

    /**
     * 游戏按钮响应
     */
    gameClick(gameType) {
        this.selectGameType = gameType;
        this.searchEdbox.string = '';
        this.resetInfo()
        this.updateList()
    },

    onSelectTime(event, params) {
        this.searchEdbox.string = '';
        if (params == 'dateabove') {
            if (this._recordDateIndex == 2) {
                this._recordDateIndex = 0;
            } else {
                this._recordDateIndex++;
            }
        } else {
            if (this._recordDateIndex == 0) {
                this._recordDateIndex = 2;
            } else {
                this._recordDateIndex--;
            }
        }
        this.resetInfo();
        this.updateList();
    },

    updateList() {
        this.selectTime.active = true;
        if (this.startIndex >= this.maxCount) return;
        if (this.startIndex === 0) this.listContent.removeAllChildren();
        let day = Utils.getDayTime(this._recordDateIndex);
        this.txt_selectTime.string = day.yyyymmdd;
        let matchData = {};
        if (this.selectGameType !== 0) {
            matchData["gameType"] = this.selectGameType
        }
        matchData.createTime = {
            $gte: day.gte,
            $lte: day.jte,
        }
        if (this.type === 'union') {
            matchData.unionID = this.unionID;
            if (!this.showPartnerGameRecord) {
                //不查玩家下级
                matchData["userList.uid"] = this.uid;
            } else {//查玩家下级
                let unionInfoItem = UserModel.getUnionInfo(this.unionID);
                let userUnionItem = UserModel.getUserUnion(this.unionID);
                if (!!this.userInfo) {//查询玩家
                    if ((!!userUnionItem && userUnionItem.ownerUid != this.uid) && (!this.userInfo.manager)) {
                        if (!!this.userInfo.partner) {
                            matchData.$or = [{
                                "userList.uid": this.uid,
                            }, {
                                "userList.spreaderID": this.uid,
                            }]
                        } else {
                            matchData["userList.uid"] = this.uid;
                        }
                    }
                } else {//查询本人
                    if (this.uid != UserModel.getData('uid')) {
                        matchData["userList.uid"] = this.uid;
                    } else {
                        if ((!!userUnionItem && userUnionItem.ownerUid != this.uid)
                            && (!!unionInfoItem && !unionInfoItem.manager)) {//不是盟主或者管理
                            if (!!unionInfoItem && !!unionInfoItem.partner) {
                                matchData.$or = [{
                                    "userList.uid": this.uid,
                                }, {
                                    "userList.spreaderID": this.uid,
                                }]
                            } else {
                                matchData["userList.uid"] = this.uid;
                            }
                        }
                    }
                }
            }
        } else {
            matchData["userList.uid"] = this.uid;
        }
        let startIndex = this.startIndex;
        let reqData = {
            matchData: matchData,
            startIndex: startIndex,
            count: this.perCount,
            uid: this.uid
        };
        ApiHall.getGameRecordRequest(reqData, (res) => {
            if (startIndex != this.startIndex) return;
            let recordArr = res.msg.recordArr;
            this.maxCount = res.msg.totalCount;
            if (startIndex === 0) this.listContent.removeAllChildren();
            this.txt_duiju.string = `总局数:${res.msg.totalDraw}`;
            this.txt_dayingjia.string = `大赢家:${res.msg.totalbigWinDraw}`;
            this.txt_zhanji.string = `总输赢:${Utils.formatNumberWithSymbol(res.msg.totalWin, 2)}`;
            if (recordArr.length > 0) {
                for (let i = 0; i < recordArr.length; i++) {
                    let record = recordArr[i];
                    let item = cc.instantiate(this.recordItem);
                    item.parent = this.listContent;
                    let ctrl = item.getComponent("GameRecordItemWidgetCtrl");
                    ctrl.initWidget(record, this.type);
                }
                this.startIndex += recordArr.length;
            }
        });
    },

    onSearch() {
        // 回访码
        let code = parseInt(this.searchEdbox.string);
        if (isNaN(code)) {
            AssetsManager.tipDialog('无效回访码，请重新输入')
            return;
        }
        let reqData = {
            replayCode: code
        };
        ApiHall.getGameReplayRequest(reqData, (res) => {
            if (!res.msg) {
                AssetsManager.tipDialog('无效回访码，请重新输入')
                return;
            }
            this.selectTime.active = false;
            this.txt_duiju.string = '';
            this.txt_dayingjia.string = '';
            this.txt_zhanji.string = '';
            let record = res.msg;
            this.listContent.removeAllChildren();
            let item = cc.instantiate(this.recordItem);
            item.parent = this.listContent;
            let ctrl = item.getComponent("GameRecordItemWidgetCtrl");
            ctrl.initWidget(record, this.type);
            // 显示对应的游戏tog
            this.selectGameType = res.msg.gameType;
            this.initGameBtn();
        });

    },

    onBtnClick(event, param) {
        switch (param) {
            case 'close':
                MessageCallback.emitMessage("BroadcastVisibleSync", true);
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
                break;

        }
    },

});