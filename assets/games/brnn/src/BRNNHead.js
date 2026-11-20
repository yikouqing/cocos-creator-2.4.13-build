const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ConfigModel = require('../../../src/model/ConfigModel');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const BRNNModel = require("./BRNNModel")
const ApiBrnn = require('./ApiBrnn');
const NativeUtil = require('../../../src/utils/NativeUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        headSprite: cc.Sprite,
        txt_name: cc.Label,
        txt_score: cc.Label,

        txt_win: cc.Label,
        txt_lose: cc.Label,
        /**用户数据 */
        _data: null,
        /**初始化完成 */
        _inited: false,
        _scoreInitY: 0
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
        this._scoreInitY = this.txt_lose.node.y
        this.reset()
    },

    init(user) {
        if (!user) {
            return
        }
        this._data = user
        this.setUserScore(user.userInfo.score)
        this.txt_name.string = CCUtil.stringClamp(user.userInfo.nickname, 6, '..');
        if (cc.isValid(this.headSprite)) {
            AssetsManager.loadSpriteFrame({
                path: user.userInfo.avatar,
                sprite: this.headSprite
            });
        }
        this.node.active = true
        if (user.uid == BRNNModel.myUid) {
            this.node.on(cc.Node.EventType.TOUCH_END, this.onHeadClick, this)
        }
    },

    /**用户离开 */
    leave() {
        this._data = null
        this.txt_name.string = ""
        this.txt_score.string = ""
        this.reset()
        if (cc.isValid(this.headSprite)) {
            AssetsManager.loadSpriteFrame({
                path: "sprite/common/morentouxiang",
                sprite: this.headSprite,
            });
        }
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
            // let params = {
            //     canSendGift: BRNNModel.getMyChairID() < BRNNModel.getChairCount(),
            //     fromChairID: BRNNModel.getMyChairID(),
            //     toChairID: user.chairID,
            //     avatar: user.userInfo.avatar,
            //     id: user.userInfo.uid,
            //     ip: user.userInfo.lastLoginIP,
            //     location: user.userInfo.location,
            //     gold: user.userInfo.score,
            //     name: user.userInfo.nickname,
            // };
            // AssetsManager.headDialog(params);
        }
        if (BRNNModel.getUserTest() && !!user && !!user.uid) {
            AssetsManager.createDialog({
                path: "res/prefab/BRNNTestSelect",
                bundle: Enums.bundleType.BRNN,
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
        if (!this._data || this._data.isBanker) {
            return
        }
        if (this._data.userInfo.uid == data.changeInfo.uid) {
            for (let key in data.changeInfo) {
                this._data.userInfo[key] = data.changeInfo[key];
            }
        }
        this.setUserScore(this._data.userInfo.score)
    },

    /**动画后展示分数 */
    setUserScoreAfterAni(totalScore) {
        if (!this._data || !totalScore[this._data.uid]) {
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
            if (this._data.userInfo.uid == BRNNModel.getBankerUid()) {
                aniNode.y = this._scoreInitY + 100
            } else {
                aniNode.y = this._scoreInitY - 100
            }

            aniNode.scale = 0
            cc.tween(aniNode).to(0.2, {
                y: this._scoreInitY,
                scale: 1
            }, {
                easing: "backOut"
            }).start()
        }
    },

    /**设置分数 */
    setUserScore(s) {
        // if (BRNNModel.scoreState() == 1) return
        if (this.txt_score) this.txt_score.string = Utils.formatNumberWithDecimal(s, 0);
    },

    /**设置离线 */
    setOffline(isShow) {
        if (cc.isValid(this.offlineNode))
            this.offlineNode.active = isShow
    },

    reset() {
        this.txt_win.string = ""
        this.txt_lose.string = ""
    },
});