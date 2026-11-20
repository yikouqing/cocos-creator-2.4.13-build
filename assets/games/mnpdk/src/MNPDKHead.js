const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ConfigModel = require('../../../src/model/ConfigModel');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const NativeUtil = require('../../../src/utils/NativeUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        /**用户数据 */
        _data: null,
        /**初始化完成 */
        _inited: false,
        /**主界面脚本 */
        _mainDialog: null,
        /**剩余牌数量 */
        _cardCount: 0,
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
        this.headSprite = cc.find('head', this.node).getComponent(cc.Sprite);

        this.txt_name = cc.find('txt_name', this.node).getComponent(cc.Label);
        this.txt_score = cc.find('txt_score', this.node).getComponent(cc.Label);
        this.bankerNode = cc.find('banker', this.node);
        cc.find("showTipNode", this.node).active = true;
        this.light = this.node.getChildByName('light');
        this.readyNode = cc.find("ready", this.node)
        this.readyNode.active = false
        this.passNode = cc.find("showTipNode/pass", this.node)
        this.passNode.active = false
        this.fangzhuNode = this.node.getChildByName('fangzhu');
        this.offlineNode = cc.find("offline", this.node)
        this.offlineNode.active = false
        this.light.active = false


        /**总输赢 */
        this.totalScore = cc.find("totalScore", this.node)
        if (cc.isValid(this.totalScore)) {
            this.txt_totalScore = cc.find("txt_totalScore", this.totalScore).getComponent(cc.Label)
            this.totalScore.active = false
        }

        /**申和抢 */
        this.shenbaoNode = cc.find("gu", this.node)
        this.qiangshenbaoNode = cc.find("la", this.node)
        this.shenbaoNode.active = false
        this.qiangshenbaoNode.active = false

        /**牌数量 */
        this.cardCountNode = cc.find("cardCount", this.node)
        if (cc.isValid(this.cardCountNode)) {
            this.cardCountNode.active = false
            this.txt_count = cc.find("count", this.cardCountNode).getComponent(cc.Label)
        }

        /**显示出牌的节点 */
        this.showOutCard = cc.find("showOutCard", this.node)
        /**显示闹钟的节点 */
        this.clock = cc.find("clock", this.node)
        /**报警动画 */
        this.alertAnimation = cc.find("AlertAnimation", this.node)
        this.headSprite.node.on(cc.Node.EventType.TOUCH_END, this.onHeadClick, this)
    },

    init(user, md) {
        if (!user) {
            return
        }
        if (!this._inited) {
            this.initRes()
        }
        this._mainDialog = md
        this._data = user
        // console.log("初始化用户", this._data)
        this.setUserScore(user.userInfo.score)
        this.txt_name.string = CCUtil.stringClamp(user.userInfo.nickname, 6, '..');
        this.fangzhuNode.active = user.userInfo.uid == this._mainDialog.roomCreatorInfo["ownerUid"]
        AssetsManager.loadSpriteFrame({
            path: user.userInfo.avatar,
            sprite: this.headSprite
        }, () => {
            this.node.active = true
        });

        /**准备图标 */
        this.setReady(user.userStatus === ApiRoom.userStatusEnum.READY && !this._mainDialog.gameStarted)
        /**庄家图标 */
        this.setBanker(user.chairID === this._mainDialog._bankerChairID)
        /**离线 */
        this.setOffline(user.userStatus === ApiRoom.userStatusEnum.OFFLINE)
        this.node.active = true
    },

    /**回放时候的初始化 */
    initReview(user) {
        if (!this._inited) {
            this.initRes()
        }
        this.setUserScore(user.score)
        this.txt_name.string = CCUtil.stringClamp(user.nickname, 6, '..');
        this.fangzhuNode.active = false
        AssetsManager.loadSpriteFrame({
            path: user.avatar,
            sprite: this.headSprite
        }, () => {
            this.node.active = true
        });

        this.setBanker(user.isBanker)
        this.setReady(false)
        this.setOffline(false)
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
        if (CCUtil.clickInterval(event)) {
            return;
        }
        if (this._mainDialog.myChairID == -1) {
            return
        }

        let user = this._data;
        let showHeadDetail = () => {
            try {
                let params = {
                    fromChairID: this._mainDialog.myChairID,
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
        if (this._mainDialog.getUserTest() && !!user) {
            AssetsManager.createDialog({
                user: user,
                callback: showHeadDetail,
                optChairID: user.chairID,
                bundle: Enums.bundleType.MNPDK,
                path: "res/prefab/MNPDKTestSelect",
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
        }
    },

    /**设置分数 */
    setUserScore(s) {
        if (this._mainDialog && this._mainDialog.scoreState() == 1) return
        if (this.txt_score) this.txt_score.string = Utils.formatNumberWithDecimal(s, 1);
    },

    /**设置总输赢分数 */
    setTotalScore(s) {
        if (!this._mainDialog) return
        if (!this._data) return
        let num = Utils.formatNumberWithDecimal(s, 1);
        if (this._mainDialog.scoreState() == 1) {
            if (this.totalScore) {
                this.totalScore.active = false;
            };
            if (this.txt_score) {
                this.txt_score.string = num;
                this.txt_score.node.color = num > 0 ? cc.Color.GREEN : cc.Color.RED;
            };
            return
        }
        if (cc.isValid(this.totalScore)) {
            this.txt_totalScore.string = num;
            this.totalScore.active = this._mainDialog.scoreState() == 2;
            this.txt_totalScore.node.color = num > 0 ? cc.Color.GREEN : cc.Color.RED;
        }
    },






    /**设置离线 */
    setOffline(isShow) {
        if (cc.isValid(this.offlineNode))
            this.offlineNode.active = isShow
    },

    /**设置操作光 */
    setLight(isShow) {
        if (cc.isValid(this.light))
            this.light.active = isShow
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

    /**设置申报图标 */
    setShenBao(isShow) {
        if (cc.isValid(this.shenbaoNode)) {
            this.shenbaoNode.active = isShow
        }
    },

    /**设置抢申报图标 */
    setQiangShenBao(isShow) {
        if (cc.isValid(this.qiangshenbaoNode)) {
            this.qiangshenbaoNode.active = isShow
        }
    },



    /**设置牌数量 */
    setCardCount(num = -1) {
        if (cc.isValid(this.cardCountNode)) {
            if (num == -1) {
                this._cardCount = 0
                this.cardCountNode.active = false
                return
            }
            this._cardCount = num
            if (this._mainDialog && this._mainDialog.gameRule && this._mainDialog.gameRule.showCardsCount) {
                this.cardCountNode.active = true
                this.txt_count.string = num + ""
                // console.log("显示了牌数量==", this.cardCountNode.active, this.txt_count.string)
            } else {
                this.cardCountNode.active = false
            }
        } else {
            this._cardCount = num
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

    /**显示出的牌 */
    setOutCard(cardNode = null) {
        if (!cardNode) {
            this.showOutCard.removeAllChildren()
        } else {
            this.showOutCard.addChild(cardNode)
        }
    },

    /**显示闹钟 */
    setClock(clockNode = null) {
        if (!cc.isValid(clockNode)) {
            this.clock.removeAllChildren()
        } else {
            this.clock.addChild(clockNode)
        }
    },

    /**设置报警动画 */
    setAlertAnimation(isShow = false) {
        if (cc.isValid(this.alertAnimation)) {
            this.alertAnimation.active = isShow
        }
    },

    reset() {
        this.setShenBao(false)
        this.setQiangShenBao(false)
        this.setBanker(false)
        this.setReady(false)
        this.setLight(false)
        this.setPassNode(false)
        this.setAlertAnimation(false)
        this.setCardCount()
        this.setClock()
    },
});