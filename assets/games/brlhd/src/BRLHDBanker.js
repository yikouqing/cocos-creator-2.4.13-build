const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiBrlhd = require('./ApiBrlhd');
const CCUtil = require("../../../src/utils/CCUtil")
const Utils = require("../../../src/utils/Utils")
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');
const BRLHDModel = require("./BRLHDModel");

cc.Class({
    extends: cc.Component,

    properties: {
        node_CurUesr: cc.Node,
        node_UpBanker: cc.Node,
        up_ProgressBar: cc.ProgressBar,
        up_Slider: cc.Slider,
        trend_List: cc.ScrollView,
        trend_Show: cc.Node,
        trend_Item: cc.Node,
        trend_Res: [cc.SpriteFrame],


        text_yaoqiu: cc.Label,
        text_shenqi: cc.Label,

    },
    onLoad() {
        this.reset();
        this.showUpBanker(false);
    },
    reset() {
        this.showInfo();
        this.showTrend();
        this.showCurUesr();
    },

    showInfo() {
        let bankerScore = BRLHDModel.getGameRuleByKey("bankerScore") || 0;
        let myBanker = BRLHDModel.getMyBankerList() || BRLHDModel.getMyBankerUid();
        this.text_yaoqiu.string = `上庄需要:${Utils.formatNumberWithSymbol(bankerScore)}`;
        this.text_shenqi.string = `申请人数:${BRLHDModel.getbankerList().length}`;
        this.node.getChildByName("btn_shangzhuang").active = !myBanker;
        this.node.getChildByName("btn_xiazhuang").active = myBanker;
    },

    showTrend() {
        this.trend_Item.active = false;
        this.trend_Show.removeAllChildren();
        let list = BRLHDModel.getPoolHistoryList();
        list.forEach((sonList, index) => {
            let resIndex = sonList.indexOf(1);
            let trend_Item = cc.instantiate(this.trend_Item);
            trend_Item.getChildByName("node_new").active = index == list.length - 1;
            trend_Item.getComponent(cc.Sprite).spriteFrame = this.trend_Res[resIndex];
            trend_Item.parent = this.trend_Show;
            trend_Item.setPosition(0, 0);
            trend_Item.active = true;
        })
        if (list.length > 16) this.trend_List.scrollToTopRight(0.2);
    },

    onClickEvent(event, clickType) {
        if (CCUtil.clickInterval(event.target, 1)) {
            return;
        }
        if (clickType == "btn_xiazhuang") {
            ApiRoom.gameMessageNotify(ApiBrlhd.gameUserApplyBankerNotify(BRLHDModel.getMyUid(), 0, 0));
        } else if (clickType == "btn_shangzhuang") {
            this.showUpBanker(true);
        } else if (clickType == "up_Slider") {
            this.showUpBanker(true, event.progress);
        } else if (clickType == "btn_UpBanker") {
            this.showUpBanker(false);
            ApiRoom.gameMessageNotify(ApiBrlhd.gameUserApplyBankerNotify(BRLHDModel.getMyUid(), 1, this._bankerScore));
        } else if (clickType == "btn_noUpBanker") {
            this.showUpBanker(false);
        } else if (clickType == "btn_zoushi") {
            AssetsManager.createDialog({
                path: 'res/prefab/BRLHDTrend',
                bundle: Enums.bundleType.BRLHD,
            });
        }
    },

    showCurUesr(isAinm = true, addScore = 0) {
        let CurUser = BRLHDModel.getCurBankerInfo();
        this.node_CurUesr.active = !!CurUser;
        if (!CurUser) return;
        let node_head = this.node_CurUesr.getChildByName("node_head");
        let text_gold = this.node_CurUesr.getChildByName("text_gold");
        let node_lianzhuang = this.node_CurUesr.getChildByName("node_lianzhuang");
        let text_lianzhuang = this.node_CurUesr.getChildByName("text_lianzhuang");
        text_gold.getComponent(cc.Label).string = Utils.formatNumberWithSymbol((CurUser.score + addScore));
        text_lianzhuang.getComponent(cc.Label).string = `连庄:${CurUser.curCount}/${CurUser.totalCount}`;
        let text_num = node_lianzhuang.getChildByName("text_num");
        text_num.getComponent(cc.Label).string = CurUser.curCount;
        let text_id = this.node_CurUesr.getChildByName("text_id");
        text_id.getComponent(cc.Label).string = `ID:${CurUser.uid}`;
        AssetsManager.loadSpriteFrame({
            sprite: node_head.getComponent(cc.Sprite),
            path: CurUser.avatar,
        });
        node_lianzhuang.stopAllActions();
        node_lianzhuang.active = isAinm;
        node_lianzhuang.setScale(0);
        if (!isAinm) return false;
        cc.tween(node_lianzhuang)
            .to(0.2, { scale: 1 })
            .delay(0.5)
            .to(0.2, { scale: 0 })
            .start()
    },

    showUpBanker(isShow, progress = 0) {
        this.node_UpBanker.active = isShow;
        if (!isShow) return false;
        this.up_Slider.progress = progress;
        this.up_ProgressBar.progress = progress;
        let myScore = BRLHDModel.getMyScore();
        let ShowNode = this.node_UpBanker.getChildByName("ShowNode");
        let bankerScore = BRLHDModel.getGameRuleByKey("bankerScore") || 0;
        this._bankerScore = parseInt((myScore - bankerScore) * progress) + bankerScore;
        ShowNode.getChildByName("text_num").getComponent(cc.Label).string = this._bankerScore + "/" + myScore;
    },

    CurUesrNode() {
        return this.node_CurUesr;
    }
});
