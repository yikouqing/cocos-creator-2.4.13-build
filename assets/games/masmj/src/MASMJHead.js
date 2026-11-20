const MASMJModel = require("./MASMJModel");
const ApiMasmj = require('./ApiMasmj');
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

        dingqueNode: cc.Node,
        dingqueAniNode: cc.Node,
        stateNode: cc.Node,
        txt_sdScore: cc.Label,
        txt_tyScore: cc.Label,

        /**用户数据 */
        _data: null,
        /**初始化完成 */
        _inited: false,
        _aniEndPos: null,
        _aniEndScale: null,
    },

    onLoad() {
        this.initRes()
        this.node.active = false
    },

    /**初始化资源 */
    initRes() {
        if (this._inited) {
            return
        }
        this._inited = true
        this.node.on(cc.Node.EventType.TOUCH_END, this.onHeadClick, this)
        this.fangzhuNode.active = false
        this.setReady(false)
        this.setLight(false)
        this.setOffline(false)
        this.setBanker(false)
        this.setTotalScore(0)
        this.setState()
        this.setDingque()
        this.setSDScore()
        this.setTYScore()
        this.txt_talk.parent.active = false
    },

    init(user) {
        if (!user) return;
        if (!this._inited) {
            this.initRes()
        }
        this._data = user
        // console.log("初始化用户", this._data)
        // this.setUserScore(user.userInfo.score)
        this.txt_name.string = CCUtil.stringClamp(user.userInfo.nickname, 6, '..');
        // this.fangzhuNode.active = user.userInfo.uid == MASMJModel.getRoomCreatorByKey("ownerUid")
        AssetsManager.loadSpriteFrame({
            path: user.userInfo.avatar,
            sprite: this.headSprite
        }, () => {
            this.node.active = true
        });

        /**准备图标 */
        this.setReady(user.playStatus === ApiRoom.userStatusEnum.READY && MASMJModel.getGameStatus() == ApiMasmj.gameStatus.NONE)
        /**庄家图标 */
        this.setBanker(user.uid === MASMJModel.getBankerUid())
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
        this.totalScoreNode.active = false
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
        data.user = this._data
        CCUtil.gameChat(data, this.txt_talk, this.headSprite.node, this.node)
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
                    fromChairID: MASMJModel.getMyChairID(),
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
                bundle: Enums.bundleType.MASMJ,
                path: "res/prefab/MASMJTestSelect",
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
            if (MASMJModel.getGameRuleByKey("bureauDao") == 0) {
                this.setUserScore(this._data.userInfo.score)
            }
        }
    },

    /**设置分数 */
    setUserScore(s) {
        //if (MASMJModel.scoreState() == 1) return
        if (this.txt_score) this.txt_score.string = Utils.formatNumberWithDecimal(s, 1);
    },

    /**设置总输赢分数 */
    setTotalScore(s) {
        let num = Utils.formatNumberWithDecimal(s, 1);
        if (MASMJModel.scoreState() == 1) {
            if (this.totalScoreNode) {
                this.totalScoreNode.active = false;
            };
            if (this.txt_score) {
                // this.txt_score.string = num;
                // this.txt_score.node.color = num > 0 ? cc.Color.GREEN : cc.Color.YELLOW;
            };
            return
        }
        if (cc.isValid(this.totalScoreNode)) {
            this.txt_totalScore.string = num;
            this.totalScoreNode.active = MASMJModel.scoreState() == 2;
            this.txt_totalScore.node.color = num > 0 ? cc.Color.GREEN : cc.Color.YELLOW;
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

    /**一风烂和报听的展示动画 */
    showAni(aniNode, startNode) {
        aniNode.stopAllActions()
        if (this._aniEndScale) aniNode.scale = this._aniEndScale
        if (this._aniEndPos) aniNode.setPosition(this._aniEndPos)
        if (!aniNode.active || !startNode || !this._aniEndPos || !this._aniEndScale) {
            return
        }
        let startPos = CCUtil.postionConvert(startNode, this.node)
        aniNode.setPosition(startPos)
        aniNode.scale = 3
        cc.tween(aniNode).to(0.2, {
            scale: 1
        }, {
            easing: "quadIn"
        }).delay(0.1).to(0.2, {
            position: this._aniEndPos,
            scale: this._aniEndScale
        }).start()
    },

    /**设置定缺 */
    setDingque(queId = null, startNode) {
        this.dingqueNode.active = false
        if (queId == null || queId == -1) {
            if (cc.isValid(this.dingqueAniNode)) this.dingqueAniNode.active = false
            return
        }
        AssetsManager.loadSpriteFrame({
            path: "res/sprite/state/" + queId,
            bundle: Enums.bundleType.MASMJ,
            sprite: this.dingqueNode.getComponent(cc.Sprite)
        }, () => {
            if (cc.isValid(startNode) && cc.isValid(this.dingqueAniNode)) {
                this.dingqueAniNode.stopAllActions()
                AssetsManager.loadSpriteFrame({
                    path: "res/sprite/state/mj_dingque-info_effect_" + queId,
                    bundle: Enums.bundleType.MASMJ,
                    sprite: this.dingqueAniNode.getComponent(cc.Sprite)
                })
                this.dingqueAniNode.active = true
                let startPos = CCUtil.postionConvert(startNode, this.dingqueNode)
                this.dingqueAniNode.setPosition(startPos)
                this.dingqueAniNode.scale = 1
                this.dingqueAniNode.opacity = 255
                let endPos = this.dingqueNode.getPosition()
                cc.tween(this.dingqueAniNode).delay(0.5).to(0.5, {
                    position: endPos,
                    scale: 0,
                    opacity: 0
                }).call(() => {
                    this.dingqueNode.active = true
                }).start()
            } else {
                this.dingqueNode.active = true
                if (cc.isValid(this.dingqueAniNode)) this.dingqueAniNode.active = false
            }
        })
        this.setState()
    },

    /**显示定缺和换牌状态 1换牌 2定缺 null不显示*/
    setState(type = null) {
        // console.log("----设置状态", type)
        if (type == null) {
            this.stateNode.active = false
            return
        }
        let imgName = "huanpaizhong"
        if (type === 2) {
            imgName = "dingquezhong"
        }
        AssetsManager.loadSpriteFrame({
            path: "res/sprite/state/" + imgName,
            bundle: Enums.bundleType.MASMJ,
            sprite: this.stateNode.getChildByName("img_state").getComponent(cc.Sprite)
        }, () => {
            this.stateNode.active = true
        })
    },

    setSDScore(str = null) {
        if (str == null) {
            this.txt_sdScore.node.parent.active = false
            return
        }
        this.txt_sdScore.node.parent.active = true
        this.txt_sdScore.string = "上倒:" + str
    },

    setTYScore(s = null) {
        if (s == null) {
            this.txt_tyScore.node.parent.active = false
            return
        }
        this.txt_tyScore.node.parent.active = true
        this.txt_tyScore.string = "体外:" + Utils.formatNumberWithDecimal(s, 1);
    },

    reset() {
        this.setBanker(false)
        this.setLight(false)
        this.setState()
        this.setDingque()
    },
});