const Utils = require('../../utils/Utils');
const AssetsManager = require('../../utils/AssetsManager')
const CCUtil = require('../../utils/CCUtil');
const SubManager = require('../../utils/SubManager');
const UserModel = require('../../../src/model/UserModel');
const ApiHall = require('../../api/ApiHall');
const Enums = require('../../const/Enums');
const ConfigModel = require('../../model/ConfigModel');
const ABManager = require('../../utils/ABManager')
const Configs = require('../../const/Configs');

cc.Class({
    extends: cc.Component,

    properties: {
        gameTimeLabel: cc.Label,
        gameName: cc.Label,
        roomID: cc.Label,
        winScore: cc.Label,
        videoIdLbl: cc.Label,
        listContent: cc.Node,
        userScoreItem: cc.Prefab,
        btnRecord: cc.Node, //牌面回放
        btnVideo: cc.Node, //视频回放
        btnShare: cc.Node, //分享战绩
        _reviewInfo: null, //普通回放
        _videoReviewInfo: null, //麻将回放
        _mjTypes: null, //麻将游戏包含的类型
        _videoTypes: null, //包含视频回放的游戏类型
        _index: null, //包含视频回放的游戏类型
    },

    start() {

    },

    initWidget(gameRecord, type) {
        // console.log('回放数据', gameRecord)
        this._index = gameRecord.index ? gameRecord.index : 0;
        this.gameName.string = ConfigModel.getGameName(gameRecord.gameType);
        let date = Utils.getDateFormat(gameRecord.createTime);
        this.gameTimeLabel.string = date.yyyymmddhhmmss;
        this.videoIdLbl.string = `回放码:${gameRecord.index}`;
        this.roomID.string = "房号:" + gameRecord.roomID;
        let bigWinUidArr = [];
        if (gameRecord.userList.length > 1) {
            let bigWinScore = 0;
            for (let i = 0; i < gameRecord.userList.length; ++i) {
                if (gameRecord.userList[i].score > bigWinScore) {
                    bigWinScore = gameRecord.userList[i].score;
                }
            }
            let myWinScore = null;
            for (let i = 0; i < gameRecord.userList.length; ++i) {
                const user = gameRecord.userList[i]
                if (user.score === bigWinScore) {
                    bigWinUidArr.push(user.uid);
                }
                if (UserModel.getData("uid") === user.uid) myWinScore = user.score;
            }
            if (myWinScore) {
                this.winScore.string = Utils.formatNumberWithSymbol(myWinScore, 1);
            }
        } else {
            this.winScore.string = Utils.formatNumberWithSymbol(gameRecord.userList[0].score, 1);
        }


        this.gameRecord = gameRecord;
        this.bigWinUidArr = bigWinUidArr;
        this.type = type;

        /**用户信息 */
        for (let i = 0; i < this.gameRecord.userList.length; ++i) {
            let node = cc.instantiate(this.userScoreItem);
            let ctrl = node.getComponent("UserScoreItemCtrl");
            ctrl.initWidget(this.gameRecord.userList[i], bigWinUidArr);
            node.parent = this.listContent;
        }

        if (this.listContent.parent.parent.getComponent(cc.ScrollView)) {
            this.listContent.parent.parent.getComponent(cc.ScrollView).enabled = this.listContent.childrenCount > 4;
        }
        this._mjTypes = ConfigModel.getCustomGameTypes(1);
        this._videoTypes = ConfigModel.getCustomGameTypes(2);
        this.btnVideo.active = this._videoTypes.includes(this.gameRecord.gameType);
        this.jianrong = [Enums.bundleType.GCT, Enums.bundleType.MNPDK] //兼容新旧数据不同的问题
        //获取数据
        if (!this.btnVideo.active || this.jianrong.includes(this.gameRecord.gameType)) {
            this._reviewInfo = JSON.parse(this.gameRecord.detail)
            // console.log(this._reviewInfo)
        } else {
            /**视频回放的数据单独获取 */
            let reqData = {
                videoRecordID: this.gameRecord.videoRecordID
            };
            ApiHall.getVideoRecordRequest(reqData, (res) => {
                // console.log("读取的回放数据==", res)
                this._videoReviewInfo = JSON.parse(res.msg.gameVideoRecordData.detail);
            });
        }
    },

    onBtnClick(event, param) {

        switch (param) {
            case 'review':
                this.showReview("review")
                break;
            case 'video':
                this.showReview("video")
                break;
            case 'share':
                this.shareVideo()
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
        // console.log('测试-回放', this.gameRecord.gameType, config);
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
        if (this._videoTypes.includes(config.type) && !this.jianrong.includes(this.gameRecord.gameType)) {
            if (!this._videoReviewInfo) {
                AssetsManager.tipDialog('数据正在加载中，请稍后再试！');
                return
            }
            /**视频回放参数 */
            data.reviewRecord = this._videoReviewInfo;
        }
        data.path = type === "review" ? config.review.view.path : config.review.video.path;
        data.bundle = type === "review" ? config.review.view.bundle : config.review.video.bundle;
        data.roomID = this.gameRecord.roomID || '';
        data.gameRule = this.gameRecord.gameRule || {};
        ABManager.loadBundle(config.bundle, () => {
            AssetsManager.createDialog(data)
        });
    },


    // 分享回访码
    shareVideo() {
        let url = ConfigModel.downloadUrl || "http://web.hyqp.top/download";
        let title = Configs.appName;
        let imgPath = ConfigModel.downloadUrl || "http://web.hyqp.top/icon.png";
        let description = `您的好友分享了战绩回访码${this._index},快去查看战绩回放吧！`;
        NativeUtil.wxShareUrl(0, url, imgPath, title, description);
    },
});