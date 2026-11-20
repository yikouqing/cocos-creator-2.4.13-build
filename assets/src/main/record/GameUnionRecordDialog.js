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
        dateTogs: [cc.Toggle],
        dateTogLbls: [cc.Label],
        recordView: cc.Node,
        detailView: cc.Node,
        listContent: cc.Node,
        editBox: cc.EditBox,
        txtSelectTimeLbl: cc.Label,
        totalGamesLbl: cc.Label,
        bigWinGamesLbl: cc.Label,
        totalWinsLbl: cc.Label,
        totalWinRatesLbl: cc.Label,
        btnGameList: cc.Node,
        dateSelect: cc.Node,

        _recordDateIndex: 0,
    },

    start() {
        for (let index = 0; index < 7; index++) {
            if (!this.dateTogLbls[index]) continue;
            let date = Utils.getDayTime(index);
            this.dateTogLbls[index].string = date.yyyymmdd;
        }
        this.detailView.active = false;
        this._recordDateIndex = 0;
        this.startIndex = 0;
        this.perCount = 5;
        this.maxCount = 10;
        this.unionID = this.node.nodeParams.unionID;
        this.type = this.node.nodeParams.type;
        this.uid = this.node.nodeParams.uid;
        this.userInfo = this.node.nodeParams.userInfo;
        this.showPartnerGameRecord = this.node.nodeParams.showPartnerGameRecord || !!ConfigModel.getData("showPartnerGameRecord");
        this.selectGameType = 0 //当前选择的游戏类型
        this.nodeParent = this.node.nodeParams.nodeParent;
        MessageCallback.emitMessage("BroadcastVisibleSync", false);
        if (!!this.nodeParent && cc.isValid(this.nodeParent)) {
            this.nodeParent.destroy();
        }
        this.updateList();
    },

    resetInfo() {
        this.startIndex = 0;
        this.perCount = 5;
        this.maxCount = 10;
    },

    gameClick(gameType) {
        this.editBox.string = '';
        this.selectGameType = gameType;
        this.resetInfo();
        this.updateList();
    },

    onScrollEvent(target, eventType) {
        switch (eventType) {
            case cc.ScrollView.EventType.SCROLL_TO_BOTTOM:
                this.updateList();
                break;
        }
    },

    onSelectTime(event, params) {
        this.editBox.string = '';
        if (params == 'dateabove') {
            if (this._recordDateIndex == 6) {
                this._recordDateIndex = 0;
            } else {
                this._recordDateIndex++;
            }
        } else {
            if (this._recordDateIndex == 0) {
                this._recordDateIndex = 6;
            } else {
                this._recordDateIndex--;
            }
        }
        this.resetInfo();
        this.updateList();
    },

    onEditChanged() {
        if (this.editBox.string.length == 0) this._filterType = null;
        if (this.dateSelect) this.dateSelect.active = this.editBox.string.length == 0;
        if (this.btnGameList) this.btnGameList.active = this.editBox.string.length == 0;
    },

    onDateClick(event, params) {
        let index = parseInt(params.slice(3));
        if (isNaN(index)) return;
        if (this._recordDateIndex == index) return;
        this._recordDateIndex = index;
        this.resetInfo();
        this.updateList();
    },

    updateList() {
        if (this.startIndex >= this.maxCount) return;
        if (this.startIndex === 0) this.listContent.removeAllChildren();
        let day = Utils.getDayTime(this._recordDateIndex);
        this.txtSelectTimeLbl.string = day.yyyymmdd;
        let matchData = {};
        if (this.editBox.string.length == 0) {
            matchData.createTime = {
                $gte: day.gte,
                $lte: day.jte,
            }
            this.selectGameType = this.selectGameType || 0;
            if (this.selectGameType !== 0) {
                matchData["gameType"] = this.selectGameType;
            }
            this.showPartnerGameRecord = true
            if (this.type === 'union') {
                matchData.unionID = this.unionID;
                this._filterType = null;
                if (!this.showPartnerGameRecord) {//不查玩家下级
                    matchData["userList.uid"] = this.uid;
                } else {//查玩家下级
                    let unionInfoItem = UserModel.getUnionInfo(this.unionID);
                    let userUnionItem = UserModel.getUserUnion(this.unionID);
                    if (!!this.userInfo) {//查询玩家
                        if ((!!userUnionItem && userUnionItem.ownerUid != this.uid) && !this.userInfo.manager) {
                            //不是盟主和管理员只查指定人的战绩
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
                    } else {
                        //查询指定人
                        if (this.uid != UserModel.getData('uid')) {
                            matchData["userList.uid"] = this.uid;
                        } else {
                            if ((!!userUnionItem && userUnionItem.ownerUid != this.uid)
                                && (!!unionInfoItem && !unionInfoItem.manager)) {
                                //不是盟主和管理员只查指定人的战绩
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
        } else {
            if (this._filterType == 'roomId') {
                let roomID = parseInt(this.editBox.string);
                if (isNaN(roomID)) {
                    AssetsManager.tipDialog('请输入正确的房间ID~');
                    return;
                }
                matchData.roomID = roomID;
            } else {
                this.selectGameType = this.selectGameType || 0;
                if (this.selectGameType !== 0) {
                    matchData["gameType"] = this.selectGameType;
                }
                matchData.createTime = {
                    $gte: day.gte,
                    $lte: day.jte,
                }
                let uid = parseInt(this.editBox.string);
                if (isNaN(uid)) {
                    AssetsManager.tipDialog('请输入正确的玩家ID~');
                    return;
                }
                matchData["userList.uid"] = uid;
            }
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
            this.totalGamesLbl.string = res.msg.totalCount || 0;
            this.bigWinGamesLbl.string = res.msg.totalbigWinDraw || 0;
            this.totalWinsLbl.string = res.msg.totalWin || 0;
            res.msg.totalWinDraw = res.msg.totalWinDraw || 0;
            res.msg.totalCount = res.msg.totalCount || 0;
            this.maxCount = res.msg.totalCount;
            let winRates = res.msg.totalDraw == 0 ? 0 : res.msg.totalWinDraw / res.msg.totalDraw;
            this.totalWinRatesLbl.string = `${Utils.formatNumberWithDecimal(winRates * 100, 2)}%`;
            if (startIndex === 0) this.listContent.removeAllChildren();
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

    _onAllClick() {
        this.editBox.string = '';
        AssetsManager.createDialog({
            path: 'res/prefab/main/room/GameListDialog',
            bundle: ConfigModel.getSkin(),
            showType: 'unionGameRecords',
            cb: this.gameClick.bind(this),
            selected: this.selectGameType
        });
    },

    _onFilterClick(type) {
        let id = parseInt(this.editBox.string);
        if (isNaN(id)) {
            AssetsManager.tipDialog('请输入正确的玩家ID~');
            return;
        }
        this._filterType = type;
        this.resetInfo();
        this.updateList();
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
            case 'all':
                this._onAllClick();
                break;
            case 'room':
                this._onFilterClick('roomId');
                break;
            case 'id':
                this._onFilterClick('uid');
                break;
            case 'record':
                this.recordView.active = true;
                this.detailView.active = !this.recordView.active;
                this.gameClick(this.selectGameType);
                break;
            case 'detail':
                this.recordView.active = false;
                this.detailView.active = !this.recordView.active;
                if (this.dateTogs[this._recordDateIndex]) this.dateTogs[this._recordDateIndex].isChecked = true;
                this.gameClick(this.selectGameType);
                break;
        }
    },

});