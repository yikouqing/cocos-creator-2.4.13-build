const TSMJModel = require("./TSMJModel");
const ApiTsmj = require('./ApiTsmj');
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
    },

    /**初始化资源 */
    initRes() {
        if (this._inited) return;
        this.node.on(cc.Node.EventType.TOUCH_END, this.onHeadClick, this)
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

        /**定缺类型图片 */
        this.dingqueNode = cc.find("dingque", this.node)
        this.dingqueNode.active = false

        this.dingqueAniNode = cc.find("dingqueAni", this.node)
        if (cc.isValid(this.dingqueAniNode)) {
            this.dingqueAniNode.active = false
            this.dingqueAniStartPos = this.dingqueAniNode.getPosition()
        }

        /**定缺和换牌的状态图片 */
        this.stateNode = this.node.getChildByName("state")
        this.stateNode.active = false
        this._inited = true
    },

    init(user) {
        if (!user) return;
        if (!this._inited) {
            this.initRes()
        }
        this._data = user
        // console.log("初始化用户", this._data)
        this.setUserScore(user.userInfo.score)
        this.txt_name.string = CCUtil.stringClamp(user.userInfo.nickname, 6, '..');
        // this.fangzhuNode.active = user.userInfo.uid == TSMJModel.getRoomCreatorByKey("ownerUid")
        AssetsManager.loadSpriteFrame({
            path: user.userInfo.avatar,
            sprite: this.headSprite
        }, () => {
            this.node.active = true
        });

        /**准备图标 */
        this.setReady(user.playStatus === ApiRoom.userStatusEnum.READY && TSMJModel.getGameStatus() == ApiTsmj.gameStatus.NONE)
        /**庄家图标 */
        this.setBanker(user.uid === TSMJModel.getBankerUid())
        /**离线 */
        this.setOffline(user.userStatus === ApiRoom.userStatusEnum.OFFLINE)
        this.node.active = true
    },

    /**回放时候的初始化 */
    initReview(user) {
        if (!this._inited) {
            this.initRes()
        }
        let unionType = TSMJModel.getRoomCreatorByKey('unionType');
        if (unionType != Enums.UnionType.NORMAL) {
            this.txt_score.string = Utils.formatNumberWithDecimal(user.score, 2);
        } else {
            this.txt_score.string = '';
        }
        this.txt_name.string = CCUtil.stringClamp(user.nickname, 6, '..');
        // this.fangzhuNode.active = false
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
        let headDetail = () => {
            try {
                let params = {
                    fromChairID: TSMJModel.getMyChairID(),
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
        if (!!tmp) {
            let uid = UserModel.getData('uid')
            AssetsManager.createDialog({
                uid: uid,
                type: 0,
                user: user,
                bundle: Enums.bundleType.TSMJ,
                path: "res/prefab/TSMJTestSelect",
                call: headDetail
            })

        } else {
            headDetail()
        }




    },



    /**设置分数 */
    setUserScore(s) {
        if (TSMJModel.scoreState() == 1) return
        if (this.txt_score) this.txt_score.string = Utils.formatNumberWithDecimal(s, 1);
    },

    /**设置总输赢分数 */
    setTotalScore(s) {
        let num = Utils.formatNumberWithDecimal(s, 1);
        if (TSMJModel.scoreState() == 1) {
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
            this.totalScore.active = TSMJModel.scoreState() == 2;
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

    /**设置定缺 */
    setDingque(queId = null, isAni = false) {
        this.dingqueNode.active = false
        queId = -1; // 不定缺强制不显示
        if (queId == null || queId == -1) {
            if (cc.isValid(this.dingqueAniNode)) this.dingqueAniNode.active = false
            return
        }
        AssetsManager.loadSpriteFrame({
            path: "res/sprite/state/" + queId,
            bundle: Enums.bundleType.TSMJ,
            sprite: this.dingqueNode.getComponent(cc.Sprite)
        }, () => {
            if (isAni && cc.isValid(this.dingqueAniNode)) {
                this.dingqueAniNode.stopAllActions()
                AssetsManager.loadSpriteFrame({
                    path: "res/sprite/state/mj_dingque-info_effect_" + queId,
                    bundle: Enums.bundleType.TSMJ,
                    sprite: this.dingqueAniNode.getComponent(cc.Sprite)
                })
                this.dingqueAniNode.active = true
                this.dingqueAniNode.setPosition(this.dingqueAniStartPos)
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
            bundle: Enums.bundleType.TSMJ,
            sprite: this.stateNode.getChildByName("img_state").getComponent(cc.Sprite)
        }, () => {
            this.stateNode.active = true
        })
    },

    // update (dt) {},
});