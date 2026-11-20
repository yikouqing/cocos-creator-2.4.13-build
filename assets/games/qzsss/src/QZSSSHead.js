const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ConfigModel = require('../../../src/model/ConfigModel');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const QZSSSModel = require("./QZSSSModel")
const ApiQzsss = require('./ApiQzsss');
const MessageCallback = require('../../../src/utils/MessageCallback');
const UserModel = require('../../../src/model/UserModel');

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
        this.headSprite = cc.find('head', this.node).getComponent(cc.Sprite);
        this.robSprite = cc.find('robstate', this.node).getComponent(cc.Sprite);
        this.txt_name = cc.find('txt_name', this.node).getComponent(cc.Label);
        this.txt_score = cc.find('txt_score', this.node).getComponent(cc.Label);
        this.bankerNode = cc.find('banker', this.node);
        this.bankerNode1 = cc.find('banker1', this.node);

        this.readyNode = cc.find("ready", this.node)
        this.fangzhuNode = this.node.getChildByName('fangzhu');
        this.offlineNode = cc.find("offline", this.node)
        this.lightNode = cc.find("light", this.node)

        this.robScale = cc.find("robScale", this.node).getComponent(cc.Sprite)


        /**总输赢 */
        this.totalScore = cc.find("totalScore", this.node)
        if (cc.isValid(this.totalScore)) {
            this.totalScore.active = false
            this.txt_totalScore = cc.find("txt_totalScore", this.totalScore).getComponent(cc.Label)
        }

        this.setReady(false)
        this.setLight(false)
        this.setOffline(false)
        this.setBanker(false)
        this.setTotalScore(0)
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
        this.txt_name.string = CCUtil.stringClamp(user.userInfo.nickname, 4, '..');
        this.fangzhuNode.active = false //user.userInfo.uid == QZSSSModel.getRoomCreatorByKey("ownerUid")
        AssetsManager.loadSpriteFrame({
            path: user.userInfo.avatar,
            sprite: this.headSprite
        }, () => {
            this.node.active = true
        });

        let st = QZSSSModel.getGameStatus()
        /**准备图标 */
        this.setReady(user.playStatus === ApiRoom.playStatus.READY && st == ApiQzsss.gameStatus.NONE)
        /**庄家图标 */
        this.setBanker(user.uid === QZSSSModel.getBankerUid() && (QZSSSModel.gameStarted && st > ApiQzsss.gameStatus.ROB_BANK))
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
        this.setUserScore(user.score)
        this.txt_name.string = CCUtil.stringClamp(user.nickname, 6, '..');
        this.fangzhuNode.active = false
        AssetsManager.loadSpriteFrame({
            path: user.avatar,
            sprite: this.headSprite
        }, () => {
            this.node.active = true
        });

        this.node.active = true
    },

    /**用户离开 */
    leave() {
        this._data = null
        this.reset()
        this.setBanker(false)
        this.txt_name.string = ""
        this.setUserScore();
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
        let node = cc.find('text', this.node);
        let label = cc.find('txt_talk', node);
        data.user = this._data
        CCUtil.gameChat(data, label, this.headSprite.node, this.node)
    },

    /**点击响应 */
    onHeadClick(event) {
        // console.log("点击了头像")
        if (!this._data) {
            return
        }
        if (CCUtil.clickInterval(event.target, 0.5)) return;
        let user = this._data;
        let showHeadDetail = () => {
            try {
                let params = {
                    canSendGift: QZSSSModel.getMyChairID() < QZSSSModel.getChairCount(),
                    fromChairID: QZSSSModel.getMyChairID(),
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
        if (!!QZSSSModel.getUserTest() && !!user && !!user.userInfo.uid && !QZSSSModel.isInWatch()) {
            AssetsManager.createDialog({
                path: "res/prefab/QZSSSSelectTest",
                bundle: Enums.bundleType.QZSSS,
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
            if (QZSSSModel.getGameRuleByKey("biPaiType") == 3) {
                this.setUserScore(this._data.userInfo.score)
            }
        }
    },

    setUserScoreAfterAni() {
        if (!this._data) {
            return
        }
        this.setUserScore(this._data.userInfo.score)
    },


    /**设置分数 */
    setUserScore(s) {
        if (QZSSSModel.scoreState() == 1) return
        if (this.txt_score) this.txt_score.string = Utils.formatNumberWithDecimal(s, 1);
    },

    /**设置总输赢分数 */
    setTotalScore(s) {
        let num = Utils.formatNumberWithDecimal(s, 1);
        if (QZSSSModel.scoreState() == 1) {
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
            this.totalScore.active = QZSSSModel.scoreState() == 2;
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
        if (cc.isValid(this.bankerNode1))
            this.bankerNode1.active = isShow
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
        this.robScale.node.active = false
        if (type == null) {
            return
        }
        let sp = this.robSprite
        let url = "res/sprite/robType/qiang" + type
        if (!isQiang) {
            url = "res/sprite/robType/scale" + type
            sp = this.robScale
        }
        AssetsManager.loadSpriteFrame({
            path: url,
            sprite: sp,
            bundle: Enums.bundleType.QZSSS
        });
        sp.node.active = true;
    },

    reset() {
        this.setRobScale()
        this.setLight(false)
        this.setBanker()
    },
});