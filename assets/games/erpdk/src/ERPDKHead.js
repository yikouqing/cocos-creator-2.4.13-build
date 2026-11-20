const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ConfigModel = require('../../../src/model/ConfigModel');
const UserModel = require('../../../src/model/UserModel');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const ERPDKModel = require("./ERPDKModel")

cc.Class({
    extends: cc.Component,

    properties: {
        headSprite: cc.Sprite,
        txt_name: cc.Label,
        txt_score: cc.Label,
        txt_totalScore: cc.Label,
        txt_count: cc.Label,
        txt_win: cc.Label,
        txt_lose: cc.Label,
        bankerNode: cc.Node,
        readyNode: cc.Node,
        passNode: cc.Node,
        fangzhuNode: cc.Node,
        offlineNode: cc.Node,
        alertAnimation: cc.Node,
        cardCountNode: cc.Node,
        totalScoreNode: cc.Node,
        clock: cc.Node,
        /**用户数据 */
        _data: null,
        /**初始化完成 */
        _inited: false,
        /**剩余牌数量 */
        _cardCount: 0,
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad() {
        this.initRes()
    },

    /**初始化资源 */
    initRes() {
        if (this._inited) return
        this._inited = true
        this.node.on(cc.Node.EventType.TOUCH_END, this.onHeadClick, this)
        this.setReady(false)
        this.setPassNode(false)
        this.setOffline(false)
        this.setTotalScore(0)
        this.setBoomScore();
        this.setCardCount()
        this.setAlertAnimation()
        this.leave();
        this.fangzhuNode.active = false
    },

    init(user) {
        if (!user) return
        if (!this._inited) this.initRes()
        this._data = user
        // console.log("初始化用户", this._data)
        this.setUserScore(user.userInfo.score)
        this.txt_name.string = CCUtil.stringClamp(user.userInfo.nickname, 6, '..');
        this.fangzhuNode.active = user.userInfo.uid == ERPDKModel.getRoomCreatorByKey("ownerUid")
        AssetsManager.loadSpriteFrame({
            path: user.userInfo.avatar,
            sprite: this.headSprite
        }, () => {
            this.node.active = true
        });

        /**准备图标 */
        this.setReady(user.playStatus === ApiRoom.playStatus.READY)
        /**庄家图标 */
        this.setBanker(user.chairID === ERPDKModel.getBankerChairID())
        /**离线 */
        this.setOffline(user.userStatus === ApiRoom.userStatusEnum.OFFLINE)
        this.setCardCount()
        this.node.active = true
    },

    /**回放时候的初始化 */
    initReview(user) {
        if (!this._inited) this.initRes()
        this._data = user
        this.setUserScore(user.score);
        this.txt_name.string = CCUtil.stringClamp(user.nickname, 6, '..');
        this.fangzhuNode.active = false
        AssetsManager.loadSpriteFrame({
            path: user.avatar,
            sprite: this.headSprite
        }, () => {
            this.node.active = true
        });

        this.setBanker(false)
        this.setReady(false)
        this.setOffline(false)
        this.setPassNode(false)
        this.setUserScore(user.userScore)
        this.setTotalScore()
        this.setBoomScore();
        this.node.active = true
    },

    /**用户离开 */
    leave() {
        this._data = null
        this.node.active = false
    },

    getUserData() {
        return this._data
    },

    /*
     * 游戏聊天
     */
    gameChat(data) {
        let node = cc.find('text', this.node);
        let label = cc.find('txt_talk', node);
        data.user = ERPDKModel.getUserByChairID(ERPDKModel.getMyChairID());
        CCUtil.gameChat(data, label, this.headSprite.node, this.node)
    },

    /**点击响应 */
    onHeadClick(event) {
        // console.log("点击了头像")
        if (CCUtil.clickInterval(event.target, 0.5)) return;
        let user = this._data;
        // console.log("user", user)
        let showHeadDetail = () => {
            try {
                let params = {
                    fromChairID: ERPDKModel.getMyChairID(),
                    toChairID: user.chairID,
                    canSendGift: true,
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
        if (ERPDKModel.getUserTest() && !!user && !!user.userInfo.uid) {
            AssetsManager.createDialog({
                path: "res/prefab/ERPDKTestSelect",
                bundle: Enums.bundleType.ERPDK,
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
            // console.log("用户信息变化==", data.changeInfo)
            for (let key in data.changeInfo) {
                this._data.userInfo[key] = data.changeInfo[key];
            }
            this.setUserScore(this._data.userInfo.score)
        }
    },


    /**设置分数 */
    setUserScore(s) {
        if (ERPDKModel.scoreState() == 1) return
        if (this.txt_score) this.txt_score.string = Utils.formatNumberWithDecimal(s, 1);
    },

    setBoomScore(s) {
        s = parseFloat(s);
        this.txt_lose.node.stopAllActions();
        this.txt_win.node.stopAllActions();
        this.txt_win.node.opacity = 0;
        this.txt_lose.node.opacity = 0;
        this.txt_lose.string = "";
        this.txt_win.string = "";
        if (isNaN(s)) return;
        return;
        if (s >= 0) {
            this.txt_win.string = s + "";
            this.txt_lose.string = "";
            cc.tween(this.txt_win.node)
                .to(0.15, { opacity: 255 })
                .delay(1)
                .call(() => {
                    this.txt_win.string = "";
                })
                .start();
        } else {
            this.txt_lose.string = s + "";
            this.txt_win.string = "";
            cc.tween(this.txt_lose.node)
                .to(0.15, { opacity: 255 })
                .delay(1)
                .call(() => {
                    this.txt_lose.string = "";
                })
                .start();
        }
    },

    /**设置总输赢分数 */
    setTotalScore(s) {
        let num = Utils.formatNumberWithDecimal(s, 1);
        if (ERPDKModel.scoreState() == 1) {
            if (this.totalScoreNode) {
                this.totalScoreNode.active = false;
            };
            if (this.txt_score) {
                this.txt_score.string = num;
                this.txt_score.node.color = num > 0 ? cc.Color.GREEN : cc.Color.RED;
            };
            return
        }
        if (cc.isValid(this.totalScoreNode)) {
            this.txt_totalScore.string = num;
            this.totalScoreNode.active = ERPDKModel.scoreState() == 2;
            this.txt_totalScore.node.color = num > 0 ? cc.Color.GREEN : cc.Color.RED;
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
    },

    /**设置牌数量 */
    setCardCount(num = -1) {
        this._cardCount = num
        if (cc.isValid(this.cardCountNode)) {
            if (num == -1) {
                this._cardCount = 0
                this.cardCountNode.active = false
                return
            }

            if (ERPDKModel.getGameRuleByKey("showCardsCount")) {
                this.cardCountNode.active = true
                this.txt_count.string = num + ""
                // console.log("显示了牌数量==", this.cardCountNode.active, this.txt_count.string)
            } else {
                this.cardCountNode.active = false
            }
        }
        if (num == 1) {
            this.setAlertAnimation(true)
        }
    },

    /**获取牌数量 */
    getCardCount() {
        return this._cardCount
    },

    /**设置不要 */
    setPassNode(isShow) {
        if (cc.isValid(this.passNode)) {
            this.passNode.active = isShow
        }
    },

    /**显示闹钟 */
    setClock(clockNode = null) {
        if (cc.isValid(this.clock)) {
            if (!clockNode) {
                this.clock.removeAllChildren()
            } else {
                this.clock.active = true
                this.clock.addChild(clockNode)
            }
        }
    },

    /**设置报警动画 */
    setAlertAnimation(isShow = false) {
        if (cc.isValid(this.alertAnimation)) {
            this.alertAnimation.active = isShow
        }
    },

    reset() {
        this.setBanker(false)
        this.setClock()
        this.setAlertAnimation()
        this.setPassNode(false)
        this.setBoomScore();
    },
});