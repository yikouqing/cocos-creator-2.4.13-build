const MessageCallback = require('../../utils/MessageCallback');
const Events = require('../../const/Events');
const SubManager = require('../../utils/SubManager');
const Utils = require('../../utils/Utils');
const ConfigModel = require('../../model/ConfigModel');
const ABManager = require('../../utils/ABManager');

cc.Class({
    extends: cc.Component,

    properties: {
        loadProgress: cc.ProgressBar,
        loadProgressLbl: cc.Label,
        actionTypeLbl: cc.Label,
        bundleNameLbl: cc.Label,
        btnLoad: cc.Node,
        titleDownload: cc.Node,
        titleUpdate: cc.Node,

        _bundleId: -1,
        _cb: null,
        _roomInfo: null,
        _isDissMiss: false
    },

    onLoad() {
        this._isDissMiss = false;
        MessageCallback.removeListener('UpdateUnionInfo', this);
        this.loadProgressLbl.string = '0%';
        this._bundleId = !!this.node.nodeParams ? this.node.nodeParams.type : -1;
        this._cb = !!this.node.nodeParams ? this.node.nodeParams.cb : null;
        this._roomInfo = !!this.node.nodeParams ? this.node.nodeParams.roomInfo : null;
        cc.systemEvent.on(Events.clientEvents.onBundleDownloadProgress, this._onDownloadProgress, this); //下载中
        cc.systemEvent.on(Events.clientEvents.onBundleDownloadFinished, this._onUnpackageSuccess, this); //下载成功
    },

    start() {
        this.actionTypeLbl.string = !!this.node.nodeParams && this.node.nodeParams.action == 2 ? '更新' : '下载';
        this.titleUpdate.active = !!this.node.nodeParams && this.node.nodeParams.action == 2;
        this.titleDownload.active = !this.titleUpdate.active;
        let bundle = ConfigModel.getBundleConfig(this._bundleId);
        this.loadProgress.progress = 1;
        this.loadProgressLbl.string = '0%';
        let autoDownloadBundle = ConfigModel.getData('autoDownloadBundle');
        this.btnLoad.active = !!bundle && !autoDownloadBundle;
        this.bundleNameLbl.string = !!bundle ? `${!!this.node.nodeParams && this.node.nodeParams.action == 2 ? `${bundle.name} 发现新版本` : `下载 ${bundle.name}`}` : '未知';
        if (!!autoDownloadBundle) this.onLoadClick();
    },

    messageCallbackHandler(route, data) {
        switch (route) {
            case 'UpdateUnionInfo':
                if (!this._roomInfo.roomID) return;
                let roomList = data.msg.roomList;
                let roomInfo = roomList.find((item) => {
                    return item.roomID === this._roomInfo.roomID;
                })
                this._isDissMiss = !roomInfo;
                break;
        }
    },

    _onDownloadProgress(data) {
        let bundle = ConfigModel.getBundleConfig(data.bundle);
        if (!bundle) return;
        let deps = ConfigModel.getBundleDeps(data.bundle);
        if (bundle.type != this._bundleId && !deps.includes(this._bundleId)) return;
        this.btnLoad.active = false;
        this.loadProgress.progress = data.finish / data.total;
        this.loadProgressLbl.string = `${Utils.formatNumberWithDecimal((data.finish / data.total) * 100, 0)}%`;
    },

    _onUnpackageSuccess(data) {
        let bundle = ConfigModel.getBundleConfig(data.bundle);
        if (!bundle) return;
        let deps = ConfigModel.getBundleDeps(data.bundle);
        if (bundle.type != this._bundleId && !deps.includes(this._bundleId)) return;
        this.btnLoad.active = false;
        this.loadProgressLbl.string = '100%';
        if (!this._isDissMiss) {
            this._cb && this._cb();
        }
        this.node.destroy();
    },

    onLoadClick() {
        let bundle = ConfigModel.getBundleConfig(this._bundleId);
        if (!bundle) return;
        ABManager.addBundle(bundle.bundle);
    },

    onCloseClick() {
        if (this.node.getComponent('DialogWidgetCtrl')) {
            this.node.getComponent('DialogWidgetCtrl').out();
        } else {
            this.node.destroy();
        }
    },

    _onGameRoomDismissed(roomInfo) {
        // console.log('试一下-解散', roomInfo);
        if (!this._roomInfo) return;
        if (this._roomInfo.roomID != roomInfo.roomID) return;
        this._cb = null;
    },

    onDestroy() {
        MessageCallback.removeListener('UpdateUnionInfo', this);
        cc.systemEvent.off(Events.clientEvents.onBundleDownloadProgress, this._onDownloadProgress, this); //下载中
        cc.systemEvent.off(Events.clientEvents.onBundleDownloadFinished, this._onUnpackageSuccess, this); //下载成功
    }

});