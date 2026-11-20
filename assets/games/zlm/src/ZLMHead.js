const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ConfigModel = require('../../../src/model/ConfigModel');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const ZLMModel = require("./ZLMModel")
const NativeUtil = require('../../../src/utils/NativeUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        /**用户数据 */
        _data: null,
        /**初始化完成 */
        _inited: false,
        /**剩余牌数量 */
        _cardCount: 0,
    },

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
        this.headSprite = cc.find('head', this.node).getComponent(cc.Sprite);
        this.txt_name = cc.find('txt_name', this.node).getComponent(cc.Label);
        this.txt_score = cc.find('txt_score', this.node).getComponent(cc.Label);
        this.bankerNode = cc.find('banker', this.node);

        this.readyNode = cc.find("ready", this.node)
        this.passNode = cc.find("pass", this.node)
        this.fangzhuNode = this.node.getChildByName('fangzhu');
        this.offlineNode = cc.find("offline", this.node)

        /**总输赢 */
        this.totalScore = cc.find("totalScore", this.node)
        if (cc.isValid(this.totalScore)) {
            this.txt_totalScore = cc.find("txt_totalScore", this.totalScore).getComponent(cc.Label)
        }

        /**牌数量 */
        this.cardCountNode = cc.find("cardCount", this.node)
        if (cc.isValid(this.cardCountNode)) {
            this.cardCountNode.active = false
            this.txt_count = cc.find("count", this.cardCountNode).getComponent(cc.Label)
        }

        /**显示闹钟的节点 */
        this.clock = cc.find("clock", this.node)
        /**报警动画 */
        this.alertAnimation = cc.find("AlertAnimation", this.node)

        this.setReady(false)
        this.setPassNode(false)
        this.setOffline(false)
        this.setTotalScore()
        this.setCardCount()
        this.setAlertAnimation()
        this.leave();
    },

    init(user) {
        if (!user) {
            return
        }
        if (!this._inited) {
            this.initRes()
        }
        this._data = user
        // console.log("初始化用户", this._data)
        this.setUserScore(user.userInfo.score)
        this.txt_name.string = CCUtil.stringClamp(user.userInfo.nickname, 6, '..');
        this.fangzhuNode.active = user.userInfo.uid == ZLMModel.getRoomCreatorByKey("ownerUid")
        AssetsManager.loadSpriteFrame({
            path: user.userInfo.avatar,
            sprite: this.headSprite
        }, () => {
            this.node.active = true
        });

        /**准备图标 */
        this.setReady(user.playStatus === ApiRoom.playStatus.READY)
        /**庄家图标 */
        this.setBanker(user.chairID === ZLMModel.getBankerChairID())
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
        let unionType = ZLMModel.getRoomCreatorByKey('unionType');
        if (unionType != Enums.UnionType.NORMAL) {
            this.txt_score.string = Utils.formatNumberWithDecimal(user.score, 2);
        } else {
            this.txt_score.string = '';
        }
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
        data.user = this._data
        CCUtil.gameChat(data, label, this.headSprite.node, this.node)
    },

    /**点击响应 */
    onHeadClick(event) {
        // console.log("点击了头像")
        if (CCUtil.clickInterval(event.target, 0.5)) return;
        let user = this._data;
        let showHeadDetail = () => {
            try {
                let params = {
                    fromChairID: ZLMModel.getMyChairID(),
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
        if (!!user && ZLMModel.getUserTest()) {
            AssetsManager.createDialog({
                user: user,
                callback: showHeadDetail,
                optUid: user.userInfo.uid,
                bundle: Enums.bundleType.ZLM,
                path: "res/prefab/ZLMTestSelect",
            })
        } else {
            showHeadDetail()
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
        if (ZLMModel.scoreState() == 1) return;
        if (this.txt_score) this.txt_score.string = Utils.formatNumberWithDecimal(s, 2);
    },

    /**设置总输赢分数 */
    setTotalScore(s) {
        let num = Utils.formatNumberWithDecimal(s, 1);
        if (ZLMModel.scoreState() == 1) {
            if (this.txt_score) {
                this.txt_score.string = num
                this.txt_score.node.color = num > 0 ? cc.Color.GREEN : cc.Color.RED;
            };
            if (this.totalScore) this.totalScore.active = false;
            return
        }
        if (cc.isValid(this.totalScore)) {
            this.txt_totalScore.string = num + "";
            this.totalScore.active = ZLMModel.scoreState() == 2;
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

            if (ZLMModel.getGameRuleByKey("showCardsCount")) {
                this.cardCountNode.active = true
                this.txt_count.string = num + ""
                // console.log("显示了牌数量==", this.cardCountNode.active, this.txt_count.string)
                if (num <= 2) {
                    this.setAlertAnimation(true)
                }
            } else {
                this.cardCountNode.active = false
            }
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
    },
});