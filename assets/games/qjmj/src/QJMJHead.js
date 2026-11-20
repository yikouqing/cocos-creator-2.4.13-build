const QJMJModel = require("./QJMJModel");
const ApiQjmj = require('./ApiQjmj');
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
        this._inited = true;
        this.node.on(cc.Node.EventType.TOUCH_END, this.onHeadClick, this);
        this.bg = this.node.getChildByName('bg');
        this.bankerNode = this.node.getChildByName('banker');
        this.offlineNode = this.node.getChildByName("offline");
        this.totalScore = this.node.getChildByName("totalScore") //总输赢
        this.light = this.node.getChildByName('light');
        this.readyNode = this.node.getChildByName('ready');
        this.fangzhuNode = this.node.getChildByName('fangzhu');
        this.show_chuang = this.node.getChildByName("show_chuang");
        this.dingqueNode = this.node.getChildByName("dingque") //定缺类型图片
        this.stateNode = this.node.getChildByName("state"); //定缺和换牌的状态图片
        this.headSprite = this.node.getChildByName('head').getComponent(cc.Sprite);
        this.txt_name = this.node.getChildByName('txt_name').getComponent(cc.Label);
        this.txt_score = this.node.getChildByName('txt_score').getComponent(cc.Label);
        this.dingqueAniNode = this.node.getChildByName("dingqueAni");
        if (cc.isValid(this.dingqueAniNode)) {
            this.dingqueAniNode.active = false;
            this.dingqueAniStartPos = this.dingqueAniNode.getPosition();
        }
        if (cc.isValid(this.totalScore)) {
            this.txt_totalScore = this.totalScore.getChildByName("txt_totalScore").getComponent(cc.Label);
            this.totalScore.active = false;
        }
        this.leave();
    },
    /**用户离开 */
    leave() {
        this.reset();
        this._data = null;
        this.node.active = false;
        // if (this.light) this.light.active = false;
        if (this.txt_name) this.txt_name.string = "";
        this.setUserScore();
        if (this.stateNode) this.stateNode.active = false;
        // if (this.dingqueNode) this.dingqueNode.active = false;
        if (this.offlineNode) this.offlineNode.active = false;
    },


    reset() {
        this.setDingque();
        this.setLight(false);
        this.setBanker(false);
        this.showChuang(false);
        this.setReady(false);
        this.setOffline(false);
    },

    getUserData() {
        return this._data;
    },

    init(user) {
        if (!user) return;
        this.initRes();
        this._data = user;
        this.node.active = true;
        // console.log("初始化用户", this._data);
        this.setUserScore(user.userInfo.score);
        this.setBanker(user.uid === QJMJModel.getBankerUid()); //庄家图标
        this.setOffline(user.userStatus === ApiRoom.userStatusEnum.OFFLINE); //离线
        this.txt_name.string = CCUtil.stringClamp(user.userInfo.nickname, 6, '..');
        AssetsManager.loadSpriteFrame({
            path: user.userInfo.avatar,
            sprite: this.headSprite
        },);

        // this.fangzhuNode.active = user.userInfo.uid == QJMJModel.getRoomCreatorByKey("ownerUid")
        this.setReady(user.playStatus === ApiRoom.userStatusEnum.READY && QJMJModel.getGameStatus() == ApiQjmj.gameStatus.NONE); //准备图标
    },

    /**回放时候的初始化 */
    initReview(user) {
        this.initRes();
        this._data = user;
        let myUid = user.uid;
        this.node.active = true;
        this.setUserScore(user.userScore);
        this.setTotalScore(user.winScores);
        this.setBanker(myUid === user.bankerUid); //庄家图标
        this.txt_name.string = CCUtil.stringClamp(user.nickname, 6, '..');
        AssetsManager.loadSpriteFrame({
            path: user.avatar,
            sprite: this.headSprite
        },);
    },

    /**用户信息改变 */
    userInfoChange(data) {
        if (!this._data) return;
        if (this._data.userInfo.uid == data.changeInfo.uid) {
            for (let key in data.changeInfo) {
                this._data.userInfo[key] = data.changeInfo[key];
            }
            this.setUserScore(this._data.userInfo.score);
        }
    },

    /**设置离线 */
    setOffline(isShow) {
        this.offlineNode.active = isShow;
    },

    /**设置操作光 */
    setLight(isShow) {
        this.light.active = isShow;
    },

    /**设置准备 */
    setReady(isShow) {
        this.readyNode.active = isShow;
    },

    /**设置庄家 */
    setBanker(isShow) {
        this.bankerNode.active = isShow;
    },

    /**一张可听 */
    showChuang(isShow) {
        if (!this.show_chuang) return;
        this.show_chuang.active = isShow;
    },

    /**设置分数 */
    setUserScore(s) {
        if (QJMJModel.scoreState() == 1) return
        if (this.txt_score) this.txt_score.string = ""// Utils.formatNumberWithDecimal(s, 1);
        if (this.txt_name) this.txt_name.node.y = -70;
    },

    /**设置总输赢分数 */
    setTotalScore(s) {
        let num = Utils.formatNumberWithDecimal(s, 1);
        if (QJMJModel.scoreState() == 1) {
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
            this.totalScore.active = QJMJModel.scoreState() == 2;
            this.txt_totalScore.node.color = num > 0 ? cc.Color.GREEN : cc.Color.RED;
        }
    },

    /**设置定缺 */
    setDingque(queId = null, isAni = false) {
        this.dingqueNode.active = false;
        queId = -1; // 不定缺强制不显示
        if (queId == null || queId == -1) {
            if (cc.isValid(this.dingqueAniNode)) this.dingqueAniNode.active = false;
            return
        }
        AssetsManager.loadSpriteFrame({
            path: "res/sprite/state/" + queId,
            bundle: Enums.bundleType.QJMJ,
            sprite: this.dingqueNode.getComponent(cc.Sprite)
        }, () => {
            if (isAni && cc.isValid(this.dingqueAniNode)) {
                this.dingqueAniNode.stopAllActions();
                AssetsManager.loadSpriteFrame({
                    path: "res/sprite/state/mj_dingque-info_effect_" + queId,
                    bundle: Enums.bundleType.QJMJ,
                    sprite: this.dingqueAniNode.getComponent(cc.Sprite)
                })
                this.dingqueAniNode.active = true;
                this.dingqueAniNode.setPosition(this.dingqueAniStartPos);
                this.dingqueAniNode.scale = 1;
                this.dingqueAniNode.opacity = 255;
                let endPos = this.dingqueNode.getPosition();
                cc.tween(this.dingqueAniNode).delay(0.5).to(0.5, {
                    position: endPos,
                    scale: 0,
                    opacity: 0
                }).call(() => {
                    this.dingqueNode.active = true;
                }).start()
            } else {
                this.dingqueNode.active = true;
                if (cc.isValid(this.dingqueAniNode)) this.dingqueAniNode.active = false;
            }
        })
        this.setState();
    },

    /**显示定缺和换牌状态 1换牌 2定缺 null不显示*/
    setState(type = null) {
        // console.log("----设置状态", type)
        if (type == null) {
            this.stateNode.active = false;
            return
        }
        let imgName = "huanpaizhong";
        if (type === 2) {
            imgName = "dingquezhong";
        }
        AssetsManager.loadSpriteFrame({
            path: "res/sprite/state/" + imgName,
            bundle: Enums.bundleType.QJMJ,
            sprite: this.stateNode.getChildByName("img_state").getComponent(cc.Sprite)
        }, () => {
            this.stateNode.active = true
        })
    },
    /*
     * 游戏聊天
     */
    gameChat(data) {
        data.user = this._data;
        let node = cc.find('text', this.node);
        let label = cc.find('txt_talk', node);
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
                    fromChairID: QJMJModel.getMyChairID(),
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
        if (QJMJModel.getUserTest() && !!user && !!user.userInfo.uid) {
            let uid = UserModel.getData('uid')
            AssetsManager.createDialog({
                uid: uid,
                user: user,
                callback: showHeadDetail,
                bundle: Enums.bundleType.QJMJ,
                path: "res/prefab/QJMJTestSelect",
                call: showHeadDetail
            })
        } else {
            showHeadDetail();
        }
    },
    // update (dt) {},
});