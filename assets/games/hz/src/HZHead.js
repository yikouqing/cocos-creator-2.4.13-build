const HZModel = require("./HZModel");
const ApiHz = require('./ApiHz');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ConfigModel = require('../../../src/model/ConfigModel');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const NativeUtil = require('../../../src/utils/NativeUtil');
const UserModel = require('../../../src/model/UserModel');

cc.Class({
    extends: cc.Component,

    properties: {
        /**用户数据 */
        _data: null,
        /**初始化完成 */
        _inited: false,
    },

    onLoad() {
        this.initRes()
        this.node.on(cc.Node.EventType.TOUCH_END, this.onHeadClick, this)
    },

    /**初始化资源 */
    initRes() {
        if (this._inited) {
            return
        }
        this.bg = cc.find('bg', this.node);
        this.headSprite = cc.find('head', this.node).getComponent(cc.Sprite);
        this.txt_name = cc.find('txt_name', this.node).getComponent(cc.Label);
        this.txt_score = cc.find('txt_score', this.node).getComponent(cc.Label);
        this.bankerNode = cc.find('banker', this.node);
        // this.winScoreNode = this.node.getChildByName('winscore').getComponent(cc.Label);
        // this.loseScoreNode = this.node.getChildByName('losescore').getComponent(cc.Label);
        // this.winScoreNode.string = ""
        // this.loseScoreNode.string = ""
        this.light = this.node.getChildByName('light');
        this.readyNode = this.node.getChildByName('ready');
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
        this._inited = true;
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
        this.fangzhuNode.active = user.userInfo.uid == HZModel.getRoomCreatorByKey("ownerUid")
        AssetsManager.loadSpriteFrame({
            path: user.userInfo.avatar,
            sprite: this.headSprite
        }, () => {
            this.node.active = true
        });

        /**准备图标 */
        this.setReady(user.userStatus === ApiRoom.userStatusEnum.READY && HZModel.getGameStatus() == ApiHz.gameStatus.NONE)
        /**庄家图标 */
        this.setBanker(user.chairID === HZModel.getBankerChairID())
        /**离线 */
        this.setOffline(user.userStatus === ApiRoom.userStatusEnum.OFFLINE)
        this.node.active = true
    },

    /**回放时候的初始化 */
    initReview(user) {
        if (!this._inited) {
            this.initRes()
        }
        this.setUserScore(user.score);
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
        if (CCUtil.clickInterval(event.target, 0.5)) return;
        let user = this._data;
        let tmp = UserModel.getData("isTest")
        let headDetil = () => {
            try {
                let params = {
                    fromChairID: HZModel.getMyChairID(),
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
        // 如果用户有调试权限展开调试页面 
        if (!!tmp) {
            let uid = UserModel.getData('uid')
            AssetsManager.createDialog({
                uid: uid,
                type: 1,
                user: user,
                bundle: Enums.bundleType.HZ,
                path: "res/prefab/HZTestSelect",
                call: headDetil,
            })

        } else {
            headDetil()
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
                if (key == "score" && HZModel.isUnionCreate()) {
                    let s = this._data.userInfo[key]
                    s = s >= 0 ? s : 0
                    this.setUserScore(s)
                }
            }
        }
    },



    /**设置分数 */
    setUserScore(s) {
        if (HZModel.scoreState() == 1) return
        if (this.txt_score) this.txt_score.string = Utils.formatNumberWithDecimal(s, 1);
    },

    /**设置总输赢分数 */
    setTotalScore(s) {
        let num = Utils.formatNumberWithDecimal(s, 1);
        if (HZModel.scoreState() == 1) {
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
            this.totalScore.active = HZModel.scoreState() == 2;
            this.txt_totalScore.node.color = num > 0 ? cc.Color.GREEN : cc.Color.RED;
        }
    },

    /**设置离线 */
    setOffline(isShow) {
        this.offlineNode.active = isShow
    },

    /**设置操作光 */
    setLight(isShow) {
        this.light.active = isShow
    },

    /**设置准备 */
    setReady(isShow) {
        this.readyNode.active = isShow
    },

    /**设置庄家 */
    setBanker(isShow) {
        this.bankerNode.active = isShow
    },
});