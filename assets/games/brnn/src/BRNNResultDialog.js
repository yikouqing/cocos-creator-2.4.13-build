const Enums = require('../../../src/const/Enums');
const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiBrnn = require('./ApiBrnn');
const CCUtil = require("../../../src/utils/CCUtil")
const Utils = require("../../../src/utils/Utils")
const UserModel = require('../../../src/model/UserModel');

cc.Class({
    extends: cc.Component,

    properties: {
        txt_bName: cc.Label,
        txt_bWin: cc.Label,
        txt_bLose: cc.Label,
        title: sp.Skeleton,
        cardTypes: cc.Node,
        item: cc.Node,
        weixiazhu: cc.Node,
        weitouzhong: cc.Node,
        content: cc.Node,
        bgWin: cc.Node,
        bgLose: cc.Node,
    },

    onLoad() {
        this.weitouzhong.active = false
        this.weixiazhu.active = false
        this.item.active = false
        this.show()
        /**出场动画 */
        let bg = cc.find("bg", this.node)
        bg.y = 1500
        cc.tween(bg).to(0.2, {
            y: 0
        }, {
            easing: "backOut"
        }).start()
    },

    show() {
        let result = this.node.nodeParams.data.result
        let bankerUid = this.node.nodeParams.data.bankerUid
        if (!bankerUid) {
            AssetsManager.tipDialog("没有找到bankerUid")
            return;
        }
        if (!result) {
            AssetsManager.tipDialog("没有找到result")
            return
        }
        if (!result.playerCards) {
            AssetsManager.tipDialog("没有找到playerCards")
            return
        }
        if (!result.bankerCards) {
            AssetsManager.tipDialog("没有找到bankerCards")
            return
        }
        if (!result.winScore) {
            AssetsManager.tipDialog("没有找到winScore")
            return
        }
        if (!result.rankList) {
            AssetsManager.tipDialog("没有找到rankList")
            return
        }
        let playerCards = Utils.deepCopy(result.playerCards)
        let myUid = UserModel.getData("uid")
        playerCards.push(result.bankerCards)
        /**庄家信息 */
        let bInfo = bankerUid[0]
        if (bInfo) {
            this.txt_bName.string = CCUtil.stringClamp(bInfo.nickname, 7, "..")
            let bScore = result.winScore[bInfo.uid]
            let txtScore = this.txt_bLose
            if (bScore >= 0) {
                txtScore = this.txt_bWin
                bScore = "+" + bScore
            }
            txtScore.string = bScore + ""
        } else {
            bInfo = {}
            this.txt_bName.string = "本局没有庄家"
        }
        /**输赢 */
        let winTotal = result.pourWinTotal[myUid]
        if (myUid == bInfo.uid) {
            winTotal = result.winScore[myUid] || 0
        } else {
            if (winTotal == 0) {
                /**我输了 */
                this.weitouzhong.active = true
            } else if (!winTotal && winTotal != 0) {
                /**我没下注 */
                this.weixiazhu.active = true
                this.title.node.active = false //没下注不显示标题
            }
        }
        /**显示标题 */
        if (this.title.node.active) {
            let aniName = "animation2"
            let audio = "res/audio/sound-result-lose"
            if (winTotal > 0) {
                aniName = "res/audio/sound-result-win"
            }
            AssetsManager.playEffect({
                path: audio,
                bundle: Enums.bundleType.BRNN
            });
            this.title.setAnimation(0, aniName, true)
        } else {
            AssetsManager.playEffect({
                path: "res/audio/sound-result-nobet",
                bundle: Enums.bundleType.BRNN
            });
        }
        /**背景 */
        this.bgLose.active = winTotal <= 0 || !winTotal
        this.bgWin.active = winTotal > 0

        /**显示牌型 */
        for (let i = 0; i < playerCards.length; i++) {
            const cardInfo = playerCards[i];
            if (!cardInfo) {
                continue;
            }
            let type = 0
            if (cardInfo.type == ApiBrnn.cardType.YOUNIU) {
                type = cardInfo.point
            } else if (cardInfo.type >= ApiBrnn.cardType.NIUNIU) {
                type = cardInfo.type + 100
            }
            let typeNode = cc.find("" + i, this.cardTypes)
            if (!typeNode || !cc.isValid(typeNode)) {
                continue;
            }
            let url = "res/sprite/cardType/t_" + type
            AssetsManager.loadSpriteFrame({
                path: url,
                sprite: typeNode.getComponent(cc.Sprite),
                bundle: Enums.bundleType.BRNN
            })
        }

        /**输赢列表 */
        let rankList = result.rankList
        for (let i = 0; i < rankList.length; i++) {
            const info = rankList[i];
            if (!info) {
                continue
            }
            let item = cc.instantiate(this.item)
            item.active = true
            item.parent = this.content
            /**庄家标记 */
            cc.find("banker", item).active = info.uid == bInfo.uid
            /**名字和分数 */
            let txt_name = cc.find("txt_name", item).getComponent(cc.Label)
            txt_name.string = CCUtil.stringClamp(info.nickname, 8, "..")
            let txt_score = cc.find("txt_score", item).getComponent(cc.Label)
            txt_score.string = Utils.formatNumberWithDecimal(info.score)
            /**排名 */
            let r = cc.find("r" + (i + 1), item)
            if (r) {
                r.active = true
            } else {
                let txt_rank = cc.find("txt_rank", item).getComponent(cc.Label)
                txt_rank.string = (i + 1) + ""
            }
        }
    }
});