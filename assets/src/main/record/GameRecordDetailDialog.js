const ConfigModel = require('../../model/ConfigModel');
const AssetsManager = require('../../utils/AssetsManager')
const Enums = require('../../const/Enums');
const ApiHall = require('../../api/ApiHall');
const SubManager = require('../../utils/SubManager');
const UserModel = require('../../model/UserModel');
const ABManager = require('../../utils/ABManager')
const Utils = require('../../utils/Utils');

cc.Class({
    extends: cc.Component,

    properties: {
        roomID: cc.Label,
        timeLabel: cc.Label,
        gameName: cc.Label,
        listContent: cc.Node,
        recordItem: cc.Prefab,
        btnRecord: cc.Node, //牌面回放
        btnVideo: cc.Node, //视频回放
        _reviewInfo: null, //普通回放
        _mjReviewInfo: null, //麻将回放
        _mjTypes: null, //麻将游戏包含的类型
        _audioTypes: null, //包含视频回放的游戏类型
    },

    start() {
        let gameRecord = this.node.nodeParams.gameRecord;
        let bigWinUidArr = this.node.nodeParams.bigWinUidArr;
        // console.log(bigWinUidArr, 'recode1 数据')
        for (let i = 0; i < 10; ++i) {
            let node = cc.instantiate(this.recordItem);
            let ctrl = node.getComponent("UserScoreItemCtrl");
            ctrl.initWidget(gameRecord.userList[i], bigWinUidArr);
            node.parent = this.listContent;
        }

        this.gameName.string = ConfigModel.getGameName(gameRecord.gameType);
        let date = Utils.getDateFormat(gameRecord.createTime);
        this.timeLabel.string = `时间:${date.yyyymmddhhmmss}`;
        this.roomID.string = "房号:" + gameRecord.roomID;
        this.gameRecord = gameRecord;
        this._mjTypes = [Enums.bundleType.FXJ, Enums.bundleType.HZMJ, Enums.bundleType.XZMJ, Enums.bundleType.QZMJ]
        this._audioTypes = [Enums.bundleType.FXJ, Enums.bundleType.HZMJ, Enums.bundleType.XZMJ, Enums.bundleType.GCT, Enums.bundleType.QZMJ]
        this.btnVideo.active = this._audioTypes.includes(this.gameRecord.gameType)
        //获取数据
        if (!this._mjTypes.includes(this.gameRecord.gameType)) {
            this._reviewInfo = JSON.parse(this.gameRecord.detail)
            // console.log(this._reviewInfo, 'recode 数据')
        } else {
            /**麻将的数据单独获取 */
            let reqData = {
                videoRecordID: this.gameRecord.videoRecordID
            };
            ApiHall.getVideoRecordRequest(reqData, (res) => {
                this._mjReviewInfo = JSON.parse(res.msg.gameVideoRecordData.detail);
            });
        }
    },

    onBtnClick(event, param) {

        switch (param) {
            case 'close':
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
                break;
            case 'review':
                this.showReview("review")
                break;
            case 'video':
                this.showReview("video")
                break;
        }
    },
    /**
     * 展示回放
     * @param {*} type 类型 
     */
    showReview(type) {
        let config = ConfigModel.getBundleConfig(this.gameRecord.gameType);
        if (!config) {
            AssetsManager.tipDialog('游戏类型错误--' + this.gameRecord.gameType);
            return;
        }
        let isDownload = SubManager.checkLoad(this.gameRecord.gameType);
        let needUpdate = ABManager.checkUpdate(this.gameRecord.gameType);
        if (!isDownload || !!needUpdate) {
            //还没有下载过游戏
            //调用下载页面
            AssetsManager.subLoadDialog({
                type: this.gameRecord.gameType,
                action: !isDownload ? 1 : 2, //1-加载 2-更新
                cb: () => {
                    AssetsManager.tipDialog('游戏资源下载完成')
                }
            });
            return;
        }
        let data = {
            path: config.review,
            list: this._reviewInfo,
            reviewRecord: null,
            path: ''
        }
        if (this._mjTypes.includes(config.type)) {
            if (!this._mjReviewInfo) {
                AssetsManager.tipDialog('数据正在加载中，请稍后再试！');
                return
            }
            /**麻将参数不一样 */
            data.reviewRecord = this._mjReviewInfo;
        }
        data.path = type === "review" ? config.review.view.path : config.review.video.path;
        data.bundle = type === "review" ? config.review.view.bundle : config.review.video.bundle;
        ABManager.loadBundle(config.bundle, () => {
            AssetsManager.createDialog(data)
        });
    },

});