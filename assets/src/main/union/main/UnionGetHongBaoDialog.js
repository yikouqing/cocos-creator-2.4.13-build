const AssetsManager = require('../../../utils/AssetsManager')
const UserModel = require('../../../model/UserModel');
const ApiHall = require('../../../api/ApiHall');
const CacheManager = require('../../../utils/CacheManager')

cc.Class({
    extends: cc.Component,

    properties: {
        hongBaoNode: cc.Node,
        animationNode: cc.Node,
        animationCircleNode: cc.Node,
        hongBaoBg: cc.Node,
        hongBaoShow: cc.Node,
        score1Label: cc.Label,
        score2Label: cc.Label,
        notHongBaoNode: cc.Node,
        lizi1: cc.Node,
        lizi2: cc.Node,
        description: cc.Label
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {},

    start() {
        let action1 = cc.sequence([cc.scaleTo(0.8, 1.1, 0.95), cc.scaleTo(0.8, 0.9, 1.05)]);
        this.hongBaoNode.runAction(cc.repeatForever(action1));
        this.unionID = this.node.nodeParams.unionInfo.unionID;
        this.hongBaoInfo = this.node.nodeParams.unionInfo.hongBaoInfo;
        this.unionInfo = this.node.nodeParams.unionInfo;
        if (!this.hongBaoInfo || !this.hongBaoInfo.status) {
            this.description.string = "暂未开启活动";
        } else {
            this.description.string = "每天" + this.hongBaoInfo.startTime + "点~" + this.hongBaoInfo.endTime + "点分发红包,发完即止！先到先得！"
        }
    },

    onBtnClick(event, parameter) {
        switch (parameter) {
            case "close": {
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
            }
                break;
            case "open":
                let hongBaoInfo = this.hongBaoInfo;
                if (!hongBaoInfo || !hongBaoInfo.status) {
                    AssetsManager.tipDialog("活动暂未开启~");
                    return;
                }
                let time = new Date().getHours();
                if (hongBaoInfo.startTime > time || hongBaoInfo.endTime <= time) {
                    AssetsManager.tipDialog("活动暂未开启~");
                    return;
                }
                let hongBaoUidList = this.unionInfo.hongBaoUidList || [];
                let hongBaoScoreList = this.unionInfo.hongBaoScoreList || [];
                // 已经领取过
                if (hongBaoUidList.indexOf(UserModel.getData('uid')) !== -1) {
                    AssetsManager.tipDialog("今天已领取，明天再来吧~");
                    return;
                }
                // 没有红包，判断今天是否已经抢过红包
                if (hongBaoScoreList.length === 0) { }
                ApiHall.getHongBaoRequest({
                    unionID: this.unionID
                }, (res) => {
                    let key = "GET_HONG_BAO_TIME" + this.unionID
                    let score = res.msg.score;
                    if (score === -1) {
                        AssetsManager.tipDialog("活动暂未开启~");
                        return;
                    }
                    this.startAnimation(score);
                });
                break;
        }
    },

    startAnimation(score) {
        this.animationNode.active = true;
        this.animationNode.opacity = 255;
        this.animationNode.scale = 1;
        this.animationCircleNode.active = true;
        this.animationCircleNode.opacity = 150;
        this.animationCircleNode.scale = 1;
        this.hongBaoBg.active = true;
        this.hongBaoShow.active = false;
        let action1 = cc.scaleTo(0.5, 6);
        action1.easing(cc.easeOut(3));
        this.animationNode.runAction(cc.sequence([action1, cc.fadeOut(0.3)]));
        let action2 = cc.scaleTo(0.6, 4);
        action2.easing(cc.easeOut(3));
        this.animationCircleNode.runAction(cc.sequence([cc.delayTime(0.1), action2, cc.fadeOut(0.2)]));
        this.lizi1.active = true;
        this.scheduleOnce(() => {
            this.hongBaoNode.stopAllActions();
            this.hongBaoNode.runAction(cc.scaleTo(0.3, 1));
            this.hongBaoBg.active = false;
            this.hongBaoShow.active = true;
            this.score2Label.string = score.toString();
            this.score1Label.string = score.toString();
            if (score === 0) {
                this.score1Label.string = "";
                this.notHongBaoNode.active = true;
            } else {
                this.lizi2.active = true;
            }
        }, 0.3);
    }
});