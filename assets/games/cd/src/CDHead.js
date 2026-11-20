const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ConfigModel = require('../../../src/model/ConfigModel');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const CDModel = require("./CDModel")
const ApiCd = require('./ApiCd');
const NativeUtil = require('../../../src/utils/NativeUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        headSprite: cc.Sprite,
        robSprite: cc.Sprite,
        robScaleSprite: cc.Sprite,
        txt_name: cc.Label,
        txt_score: cc.Label,
        txt_totalScore: cc.Label,
        bankerNode: cc.Node,
        readyNode: cc.Node,
        fangzhuNode: cc.Node,
        offlineNode: cc.Node,
        totalScoreNode: cc.Node,
        lightNode: cc.Node,
        txt_talk: cc.Node,
        txt_win: cc.Label,
        txt_lose: cc.Label,
        /**用户数据 */
        _data: null,
        /**初始化完成 */
        _inited: false,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.initRes()
    },

    /**初始化资源 */
    initRes() {
        if (this._inited) {
            return
        }
        this._inited = true

        this.node.on(cc.Node.EventType.TOUCH_END, this.onHeadClick, this)

        // this.bankerNode1 = cc.find('banker1', this.node);

        this.setReady(false)
        this.setLight(false)
        this.setOffline(false)
        this.setBanker(false)
        this.setTotalScore(0)
        this.txt_talk.parent.active = false
        this.txt_win.string = ""
        this.txt_lose.string = ""
    },

    init(user) {
        if (!user) {
            return
        }
        if (!this._inited) {
            this.initRes()
        }
        this._data = user
        this.setUserScore(user.userInfo.score)
        this.txt_name.string = CCUtil.stringClamp(user.userInfo.nickname, 4, '..');
        this.fangzhuNode.active = false //user.userInfo.uid == CDModel.getRoomCreatorByKey("ownerUid")
        AssetsManager.loadSpriteFrame({
            path: user.userInfo.avatar,
            sprite: this.headSprite
        });

        let st = CDModel.getGameStatus()
        /**准备图标 */
        this.setReady(user.playStatus === ApiRoom.playStatus.READY && st == ApiCd.gameStatus.NONE)
        /**庄家图标 */
        this.setBanker(user.uid === CDModel.getBankerUid() && (CDModel.gameStarted && st > ApiCd.gameStatus.ROB_BANK))
        /**离线 */
        this.setOffline(user.userStatus === ApiRoom.userStatusEnum.OFFLINE)
        this.node.active = true
    },

    /**回放时候的初始化 */
    initReview(user) {
        if (!this._inited) {
            this.initRes()
        }
        this._data = user
        this.txt_score.string = Math.floor(user.score)
        this.txt_name.string = CCUtil.stringClamp(user.nickname, 6, '..');
        this.fangzhuNode.active = false
        AssetsManager.loadSpriteFrame({
            path: user.avatar,
            sprite: this.headSprite
        }, () => {
            this.node.active = true
        });

        this.node.active = true
        this.txt_win.string = ""
        this.txt_lose.string = ""
    },

    /**用户离开 */
    leave() {
        this._data = null
        this.reset()
        this.setBanker(false)
        AssetsManager.loadSpriteFrame({
            path: "sprite/common/morentouxiang",
            sprite: this.headSprite,
        });
        this.node.active = false
    },

    getUserData() {
        return this._data
    },

    /*
     * 游戏聊天
     */
    gameChat(data) {
        data.user = this._data
        CCUtil.gameChat(data, this.txt_talk, this.headSprite.node, this.node)
    },

    /**点击响应 */
    onHeadClick(event) {
        if (!this._data) return;
        if (CCUtil.clickInterval(event.target, 0.5, false)) return
        let user = this._data;
        let showHeadDetail = () => {
            try {
                let params = {
                    canSendGift: CDModel.getMyChairID() < CDModel.getChairCount(),
                    fromChairID: CDModel.getMyChairID(),
                    toChairID: user.chairID,
                    avatar: user.userInfo.avatar,
                    id: user.userInfo.uid,
                    ip: user.userInfo.lastLoginIP,
                    location: user.userInfo.location,
                    gold: user.userInfo.score,
                    name: user.userInfo.nickname,
                };
                AssetsManager.headDialog(params);
            } catch (e) { }
        }
        if (!!CDModel.getUserTest() && !CDModel.isInWatch() && !!user && !!user.uid) {
            AssetsManager.createDialog({
                path: "res/prefab/CDSelectTest",
                bundle: Enums.bundleType.CD,
                callback: showHeadDetail,
                user: user,
            })
            return
        } else {
            showHeadDetail();
        }
    },

    /**用户信息改变 */
    userInfoChange(data) {
        if (!this._data) {
            return
        }
        if (this._data.userInfo.uid == data.changeInfo.uid) {
            for (let key in data.changeInfo) {
                this._data.userInfo[key] = data.changeInfo[key];
            }
            // this.setUserScore(this._data.userInfo.score)
        }
    },

    /**动画后展示分数 */
    setUserScoreAfterAni(totalScore) {
        if (!this._data) {
            return
        }
        this.setUserScore(this._data.userInfo.score)
        this.txt_win.string = ""
        this.txt_lose.string = ""
        if (totalScore) {
            let winScore = totalScore[this._data.uid]
            let aniNode = null
            if (winScore > 0) {
                this.txt_win.string = "+" + winScore
                aniNode = this.txt_win.node
            } else {
                this.txt_lose.string = "" + winScore
                aniNode = this.txt_lose.node
            }
            aniNode.stopAllActions()
            aniNode.y = -100
            aniNode.scale = 0
            cc.tween(aniNode).to(0.2, {
                y: 0,
                scale: 1
            }, {
                easing: "backOut"
            }).start()
        }
    },

    /**设置分数 */
    setUserScore(s) {
        if (CDModel.scoreState() == 1) return
        if (this.txt_score) this.txt_score.string = Utils.formatNumberWithDecimal(s, 1);
    },

    /**设置总输赢分数 */
    setTotalScore(s = 0) {
        let num = Utils.formatNumberWithDecimal(s, 1);
        if (CDModel.scoreState() == 1) {
            if (cc.isValid(this.totalScoreNode)) {
                this.totalScoreNode.active = false
            };
            if (this.txt_score) {
                this.txt_score.string = num;
                this.txt_score.node.color = num > 0 ? cc.Color.GREEN : cc.Color.YELLOW;
            };
            return
        }
        if (cc.isValid(this.totalScoreNode)) {
            this.totalScoreNode.active = CDModel.getGameRuleByKey("tongji")
            this.txt_totalScore.string = num;
            this.txt_totalScore.node.color = num > 0 ? cc.Color.GREEN : cc.Color.YELLOW;
        }
    },

    /**设置离线 */
    setOffline(isShow) {
        if (cc.isValid(this.offlineNode))
            this.offlineNode.active = isShow
    },

    /**设置准备 */
    setReady(isShow) {
        if (cc.isValid(this.readyNode))
            this.readyNode.active = isShow
    },

    /**设置庄家 */
    setBanker(isShow) {
        if (cc.isValid(this.bankerNode))
            this.bankerNode.active = isShow
        // if (cc.isValid(this.bankerNode1))
        //     this.bankerNode1.active = isShow
    },

    /**设置光 */
    setLight(isShow) {
        if (cc.isValid(this.lightNode)) {
            this.lightNode.active = isShow
        }
    },

    /**获取庄家图标 */
    getBanker() {
        return this.bankerNode
    },

    /**获取光图标 */
    getLight() {
        return this.lightNode
    },

    /**设置抢庄 */
    setRobScale(type = null, isQiang = true) {
        this.robSprite.node.active = false
        this.robScaleSprite.node.active = false
        if (type == null) {
            return
        }
        let sp = this.robSprite
        let url = "res/sprite/robType/qiang" + type
        if (!isQiang) {
            url = "res/sprite/robType/scale" + type
            sp = this.robScaleSprite
        }
        AssetsManager.loadSpriteFrame({
            path: url,
            sprite: sp,
            bundle: Enums.bundleType.CD
        });
        sp.node.active = true;
    },

    reset() {
        this.setRobScale()
        this.setLight(false)
        this.setBanker()
        this.txt_win.string = ""
        this.txt_lose.string = ""
    },
});