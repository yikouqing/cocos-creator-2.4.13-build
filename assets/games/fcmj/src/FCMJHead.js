const FCMJModel = require("./FCMJModel");
const ApiFcmj = require('./ApiFcmj');
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
        headSprite: cc.Sprite,
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
        genBaoNode: cc.Node,
        yaoBaoNode: cc.Node,
        baoIcon: cc.Node,
        baoPaiNode: cc.Node,
        /**用户数据 */
        _data: null,
        /**初始化完成 */
        _inited: false,
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
        this.fangzhuNode.active = false
        this.leave()
    },

    init(user) {
        if (!user) return;
        if (!this._inited) {
            this.initRes()
        }
        this._data = user
        // console.log("初始化用户", this._data)
        this.setUserScore(user.userInfo.score)
        this.txt_name.string = CCUtil.stringClamp(user.userInfo.nickname, 4, '..');
        // this.fangzhuNode.active = user.userInfo.uid == FCMJModel.getRoomCreatorByKey("ownerUid")
        AssetsManager.loadSpriteFrame({
            path: user.userInfo.avatar,
            sprite: this.headSprite
        }, () => {
            this.node.active = true
        });

        /**准备图标 */
        this.setReady(user.playStatus === ApiRoom.userStatusEnum.READY && FCMJModel.getGameStatus() == ApiFcmj.gameStatus.NONE)
        /**庄家图标 */
        this.setBanker(user.uid === FCMJModel.getBankerUid())
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
        this.txt_name.string = CCUtil.stringClamp(user.nickname, 4, '..');
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
        this.setReady(false)
        this.setLight(false)
        this.setOffline(false)
        this.setBanker(false)
        this.setTotalScore(0)
        this.setGenBao()
        this.setYaoBao()
        this.setBaoIcon(false)
        this.txt_talk.parent.active = false
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
        console.log("点击了头像")
        if (CCUtil.clickInterval(event.target, 0.5)) return;
        let user = this._data;
        let tmp = UserModel.getData("isTest")
        let headDetil = () => {
            try {
                let params = {
                    fromChairID: FCMJModel.getMyChairID(),
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
                type: 0,
                user: user,
                bundle: Enums.bundleType.FCMJ,
                path: "res/prefab/FCMJTestSelect",
                call: headDetil
            })

        } else {
            headDetil()
        }

    },

    /**用户信息改变 */
    userInfoChange(data) {
        if (!this._data) return;
        if (this._data.userInfo.uid == data.changeInfo.uid) {
            for (let key in data.changeInfo) {
                this._data.userInfo[key] = data.changeInfo[key];
            }
            this.setUserScore(this._data.userInfo.score)
        }
    },

    /**设置分数 */
    setUserScore(s) {
        if (FCMJModel.scoreState() == 1) return
        if (this.txt_score) this.txt_score.string = Utils.formatNumberWithDecimal(s, 1);
    },

    /**设置总输赢分数 */
    setTotalScore(s) {
        let num = Utils.formatNumberWithDecimal(s, 1);
        if (FCMJModel.scoreState() == 1) {
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
            this.totalScoreNode.active = FCMJModel.scoreState() == 2;
            this.txt_totalScore.node.color = num > 0 ? cc.Color.GREEN : cc.Color.RED;
        }
    },

    /**设置离线 */
    setOffline(isShow) {
        this.offlineNode.active = isShow
    },

    /**设置操作光 */
    setLight(isShow) {
        this.lightNode.active = isShow
    },

    /**设置准备 */
    setReady(isShow) {
        this.readyNode.active = isShow
    },

    /**设置庄家 */
    setBanker(isShow) {
        this.bankerNode.active = isShow
    },

    setBaoIcon(isShow) {
        if (cc.isValid(this.baoIcon)) {
            this.baoIcon.active = isShow
        }
    },

    setGenBao(isAni = false) {
        if (cc.isValid(this.genBaoNode)) {
            if (isAni) {
                this.genBaoNode.stopAllActions()
                this.genBaoNode.active = true
                this.genBaoNode.scale = 1.5
                cc.tween(this.genBaoNode).to(0.2, {
                    scale: 1
                }, {
                    easing: "backOut"
                }).delay(1).call(() => {
                    this.genBaoNode.active = false
                    this.setBaoIcon(true)
                }).start()
                let user = this.getUserData();
                let sex = user && user.userInfo && user.userInfo.sex == 0 ? 'nan' : 'nv';
                AssetsManager.playEffect({
                    path: `res/audio/${sex}/genbao`,
                    bundle: Enums.bundleType.FCMJ
                });
            } else {
                this.genBaoNode.active = false
            }
        }
    },

    setYaoBao(isAni = false) {
        if (cc.isValid(this.yaoBaoNode)) {
            if (isAni) {
                this.yaoBaoNode.stopAllActions()
                this.yaoBaoNode.active = true
                this.yaoBaoNode.scale = 1.5
                cc.tween(this.yaoBaoNode).to(0.2, {
                    scale: 1
                }, {
                    easing: "backOut"
                }).delay(1).call(() => {
                    this.yaoBaoNode.active = false
                    this.setBaoIcon(true)
                }).start()
                let user = this.getUserData();
                let sex = user && user.userInfo && user.userInfo.sex == 0 ? 'nan' : 'nv';
                AssetsManager.playEffect({
                    path: `res/audio/${sex}/yaobao`,
                    bundle: Enums.bundleType.FCMJ
                });
            } else {
                this.yaoBaoNode.active = false
            }
        }
    },

    getBaoPaiNode() {
        return this.baoPaiNode
    }
});