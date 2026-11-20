const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ConfigModel = require('../../../src/model/ConfigModel');
const UserModel = require('../../../src/model/UserModel');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const ZGZModel = require("./ZGZModel")

cc.Class({
    extends: cc.Component,

    properties: {
        headSprite: cc.Sprite,
        txt_name: cc.Label,
        txt_score: cc.Label,
        txt_totalScore: cc.Label,
        txt_count: cc.Label,
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
        if (this._inited) {
            return
        }
        this._inited = true;
        this.fangzhuNode.active = false;
        this.nodeCard = cc.find("nodeCard", this.node);
        this.nodeRank = cc.find("nodeRank", this.node);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onHeadClick, this)

        this.leave();
    },

    init(user) {
        if (!user) {
            return
        }
        if (!this._inited) {
            this.initRes()
        }
        this._data = user;
        this.setCardCount();
        this.node.active = true;
        // console.log("初始化用户", this._data)
        this.setUserScore(user.userInfo.score)
        this.txt_name.string = CCUtil.stringClamp(user.userInfo.nickname, 4, '..');
        this.fangzhuNode.active = user.userInfo.uid == ZGZModel.getRoomCreatorByKey("ownerUid")
        AssetsManager.loadSpriteFrame({ path: user.userInfo.avatar, sprite: this.headSprite });
        this.setReady(user.playStatus === ApiRoom.playStatus.READY);//准备图标
        this.setBanker(user.chairID === ZGZModel.getBankerChairID())//庄家图标
        this.setOffline(user.userStatus === ApiRoom.userStatusEnum.OFFLINE)//离线
    },

    showBrightInfo(isShow) {
        if (!this.nodeCard) return;
        this.nodeCard.active = isShow;
        if (isShow) {
            let colorNode = this.nodeCard.getChildByName("colorNode");
            let text_identity = this.nodeCard.getChildByName("text_identity");
            let obj = ZGZModel.getBrightInfo(this._data ? this._data.uid : null);
            text_identity.getComponent(cc.RichText).string = obj.str;
            colorNode && colorNode.children.forEach((sonNode, index) => {
                sonNode.getChildByName("show").active = obj.seList.includes(index);
            })
        }
    },

    showRank(isShow) {
        if (!this.nodeRank) return;
        this.nodeRank.active = isShow;
        if (isShow) {
            let obj = ZGZModel.getUserWinStatus(this._data ? this._data.uid : null);
            this.nodeRank.getComponent(cc.Sprite).spriteFrame = null;
            if (!obj || !obj.status) return;
            AssetsManager.loadSpriteFrame({
                sprite: this.nodeRank.getComponent(cc.Sprite),
                path: `res/rank/rank_${obj.status}`,
                bundle: Enums.bundleType.ZGZ,
            },);
        }
    },


    /**回放时候的初始化 */
    initReview(user) {
        if (!this._inited) {
            this.initRes()
        }
        this._data = user
        this._isReview = true;
        this.setUserScore(user.score);
        this.txt_name.string = CCUtil.stringClamp(user.nickname, 4, '..');
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
        this.showBrightInfo(true);
        this.showRank(true);
        this.node.active = true
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
        data.user = ZGZModel.getUserByChairID(ZGZModel.getMyChairID());
        CCUtil.gameChat(data, label, this.headSprite.node, this.node)
    },

    /**点击响应 */
    onHeadClick(event) {
        if (this._isReview) return;
        // console.log("点击了头像")
        if (CCUtil.clickInterval(event.target, 0.5)) return;
        let user = this._data;
        // console.log("user", user)
        let showHeadDetail = () => {
            try {
                let params = {
                    fromChairID: ZGZModel.getMyChairID(),
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
        if (ZGZModel.getUserTest() && !!user && !!user.userInfo.uid) {
            AssetsManager.createDialog({
                path: "res/prefab/ZGZTestSelect",
                bundle: Enums.bundleType.ZGZ,
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
        if (ZGZModel.scoreState() == 1) return
        if (this.txt_score) this.txt_score.string = Utils.formatNumberWithDecimal(s, 1);
    },

    /**设置总输赢分数 */
    setTotalScore(s) {
        let num = Utils.formatNumberWithDecimal(s, 1);
        if (ZGZModel.scoreState() == 1) {
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
            this.totalScoreNode.active = ZGZModel.scoreState() == 2;
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
            if (ZGZModel.getGameRuleByKey("isShowCardCount")) {
                this.cardCountNode.active = true;
                this.txt_count.string = num + ""
            } else {
                this.cardCountNode.active = false
            }
        }
        if (num == 1) {
            // this.setAlertAnimation(true)
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


    /**用户离开 */
    leave() {
        this._data = null
        this.node.active = false
        this.setReady(false)
        this.setOffline(false)
        this.setTotalScore(0)
        this.setCardCount()
        this.reset();
    },

    reset() {
        this.setBanker(false)
        this.setClock()
        this.setAlertAnimation()
        this.setPassNode(false)
        this.showRank(false);
        this.showBrightInfo(true);
    },
});