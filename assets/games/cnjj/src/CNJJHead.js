const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ConfigModel = require('../../../src/model/ConfigModel');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const CNJJModel = require("./CNJJModel")
const ApiCnjj = require('./ApiCnjj');
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
        txt_men: cc.Label,
        txt_betScore: cc.Label,
        txt_maiScore: cc.Label,
        menNode: cc.Node,
        betNode: cc.Node,
        goldNode: cc.Node,
        /**用户数据 */
        _data: null,
        /**初始化完成 */
        _inited: false,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.node.on(cc.Node.EventType.TOUCH_END, this.onHeadClick, this)
        this.setReady(false)
        this.setLight(false)
        this.setOffline(false)
        this.setBanker(false)
        this.setTotalScore(0)
        this.setBetScore()
        this.setMen()
        this.setMaiScore()
        this.txt_talk.parent.active = false
        this.txt_win.string = ""
        this.txt_lose.string = ""
    },

    init(user) {
        if (!user) {
            return
        }
        this._data = user
        this.setUserScore(user.userInfo.score)
        this.txt_name.string = CCUtil.stringClamp(user.userInfo.nickname, 4, '..');
        this.fangzhuNode.active = false //user.userInfo.uid == CNJJModel.getRoomCreatorByKey("ownerUid")
        AssetsManager.loadSpriteFrame({
            path: user.userInfo.avatar,
            sprite: this.headSprite
        });

        let st = CNJJModel.getGameStatus()
        /**准备图标 */
        this.setReady(user.playStatus === ApiRoom.playStatus.READY && st == ApiCnjj.gameStatus.NONE)
        /**庄家图标 */
        this.setBanker(user.uid === CNJJModel.getBankerUid() && CNJJModel.gameStarted)
        /**离线 */
        this.setOffline(user.userStatus === ApiRoom.userStatusEnum.OFFLINE)
        this.node.active = true
    },

    /**用户离开 */
    leave() {
        this._data = null
        this.reset()
        this.setBanker(false)
        this.setReady(false)
        this.txt_totalScore.string = "0"
        AssetsManager.loadSpriteFrame({
            path: "sprite/common/morentouxiang",
            sprite: this.headSprite,
        });
        this.node.active = false
    },

    getUserData() {
        return this._data
    },

    /**获取金币图标 */
    getGoldIcon() {
        return this.goldNode
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
                    canSendGift: CNJJModel.getMyChairID() < CNJJModel.getChairCount(),
                    fromChairID: CNJJModel.getMyChairID(),
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
        if (CNJJModel.getUserTest() && !!user && !!user.uid && !CNJJModel.isInWatch()) {
            AssetsManager.createDialog({
                path: "res/prefab/CNJJSelectTest",
                bundle: Enums.bundleType.CNJJ,
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
            this.setUserScore(this._data.userInfo.score)
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
        if (totalScore || totalScore == 0) {
            let winScore = totalScore
            let aniNode = null
            if (winScore > 0) {
                this.txt_win.string = "+" + Utils.formatNumberWithDecimal(winScore, 1)
                aniNode = this.txt_win.node
            } else {
                this.txt_lose.string = "" + Utils.formatNumberWithDecimal(winScore, 1)
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
        if (CNJJModel.scoreState() == 1) return
        if (this.txt_score) this.txt_score.string = Utils.formatNumberWithDecimal(s, 1);
    },

    /**设置总输赢分数 */
    setTotalScore(s = 0) {
        let num = Utils.formatNumberWithDecimal(s, 1);
        if (CNJJModel.scoreState() == 1) {
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
            this.totalScoreNode.active = CNJJModel.getGameRuleByKey("tongji")
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
        if (cc.isValid(this.bankerNode)) {
            this.bankerNode.active = isShow
        }
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
            bundle: Enums.bundleType.CNJJ
        });
        sp.node.active = true;
    },

    setBetScore(score, isAni = false) {
        if (score) {
            this.betNode.active = true
            this.txt_betScore.string = Utils.formatNumberWithDecimal(score)
            if (isAni) {
                let start_pos = this.headSprite.node.getPosition()
                let end_pos = CCUtil.postionConvert(this.goldNode, this.node)
                AssetsManager.playEffect({
                    path: 'res/audio/fly_gold',
                    bundle: Enums.bundleType.CNJJ
                });
                for (let i = 0; i < 10; ++i) {
                    let node = cc.instantiate(this.goldNode);
                    node.setPosition(start_pos);
                    node.parent = this.node;
                    cc.tween(node).delay(0.08 * i).to(0.3, {
                        position: end_pos
                    }).removeSelf().start()
                }
            }
        } else {
            this.betNode.active = false
        }
    },

    setMaiScore(score) {
        this.txt_maiScore.node.parent.active = false
        if (score) {
            this.txt_maiScore.node.parent.active = true
            this.txt_maiScore.string = Utils.formatNumberWithDecimal(score)
        }
    },

    setMen(m) {
        if (m) {
            this.txt_men.string = m + "门"
            this.menNode.active = true
        } else {
            this.menNode.active = false
        }
    },

    reset() {
        this.setLight(false)
        this.setMen()
        this.setBetScore()
        this.setMaiScore()
        this.txt_win.string = ""
        this.txt_lose.string = ""
    },
});