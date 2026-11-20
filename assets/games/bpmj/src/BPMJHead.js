const BPMJModel = require("./BPMJModel");
const ApiBpmj = require('./ApiBpmj');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ConfigModel = require('../../../src/model/ConfigModel');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const NativeUtil = require('../../../src/utils/NativeUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        headSprite: cc.Sprite,
        txt_name: cc.Label,
        txt_score: cc.Label,
        txt_totalScore: cc.Label,
        txt_talk: cc.Label,
        bankerNode: cc.Node,
        readyNode: cc.Node,
        fangzhuNode: cc.Node,
        offlineNode: cc.Node,
        totalScoreNode: cc.Node,
        lightNode: cc.Node,
        talkNode: cc.Node,
        speaker: cc.Node,
        /**用户数据 */
        _data: null,
        /**初始化完成 */
        _isInit: false,
    },

    onLoad() {
        this.initRes();
    },

    /**初始化资源 */
    initRes() {
        if (this._isInit) {
            return
        }
        this.leave();
        this._isInit = true;
        this.node.on(cc.Node.EventType.TOUCH_END, this.onHeadClick, this);
    },

    init(user) {
        if (!user) return;
        this.initRes();
        this._data = user;
        this.node.active = true;
        this.node.parent.active = true;
        // console.log("初始化用户", user);
        this.setBanker(user.uid === BPMJModel.getBankerUid())//庄家图标
        this.setOffline(user.userStatus === ApiRoom.userStatusEnum.OFFLINE);//离线
        if (!BPMJModel.isNormaGame()) { this.setUserScore(user.userInfo.score); };
        this.txt_name.string = CCUtil.stringClamp(user.userInfo.nickname, 6, '..');
        // this.setfangzhu(user.userInfo.uid == BPMJModel.getRoomCreatorByKey("ownerUid"));
        AssetsManager.loadSpriteFrame({ path: user.userInfo.avatar, sprite: this.headSprite },);
        this.setReady(user.playStatus === ApiRoom.userStatusEnum.READY && BPMJModel.getGameStatus() == ApiBpmj.gameStatus.NONE);//准备图标
    },

    /**回放时候的初始化 */
    initReview(user) {
        this.initRes();
        this.node.active = true;
        this.node.parent.active = true;
        this.setBanker(user.isBanker);
        this.txt_name.string = CCUtil.stringClamp(user.nickname, 6, '..');
        this.txt_score.string = Utils.formatNumberWithDecimal(user.score, 2);
        AssetsManager.loadSpriteFrame({ path: user.avatar, sprite: this.headSprite });
        if (this.totalScoreNode) {
            this.totalScoreNode.active = false;
        };
    },

    /**用户离开 */
    leave() {
        this._data = null;
        this.setReady(false);
        this.setLight(false);
        this.setBanker(false);
        this.setOffline(false);
        this.setfangzhu(false);
        this.node.active = false;
        this.talkNode.active = false;
        if (!!this.speaker) this.speaker.destroyAllChildren();
    },

    getUserData() {
        return this._data;
    },

    /**用户信息改变 */
    userInfoChange(data) {
        if (!this._data) return;
        if (this._data.userInfo.uid == data.changeInfo.uid) {
            for (let key in data.changeInfo) {
                this._data.userInfo[key] = data.changeInfo[key];
            }
            if (!BPMJModel.isNormaGame()) {
                this.setUserScore(this._data.userInfo.score)
            }
        }
    },

    /**设置分数 */
    setUserScore(s) {
        if (BPMJModel.scoreState() == 1) return
        this.txt_score.string = Utils.formatNumberWithDecimal(s, 2) + ""
    },

    /**设置总输赢分数 */
    setTotalScore(s) {
        let num = Utils.formatNumberWithDecimal(s, 2);
        if (BPMJModel.scoreState() == 1) {
            if (this.totalScoreNode) {
                this.totalScoreNode.active = false;
            };
            if (this.txt_score) {
                this.txt_score.string = num;
                this.txt_score.node.color = num > 0 ? cc.Color.GREEN : cc.Color.RED;
            };
            return
        }
        if (cc.isValid(this.txt_totalScore)) {
            this.txt_totalScore.string = num;
            this.totalScoreNode.active = BPMJModel.scoreState() == 2;
            this.txt_totalScore.node.color = num > 0 ? cc.Color.GREEN : cc.Color.RED;
        }
    },
    setfangzhu(isShow) {
        this.fangzhuNode.active = isShow;
    },
    /**设置离线 */
    setOffline(isShow) {
        this.offlineNode.active = isShow;
    },

    /**设置操作光 */
    setLight(isShow) {
        this.lightNode.active = isShow;
    },

    /**设置准备 */
    setReady(isShow) {
        this.readyNode.active = isShow;
    },

    /**设置庄家 */
    setBanker(isShow) {
        this.bankerNode.active = isShow;
    },



    /**点击响应 */
    onHeadClick(event) {
        // console.log("点击了头像")
        if (event.target.lastClick && Date.now() - event.target.lastClick < 500) {
            /* 防止重复点击 */
            return;
        }
        event.target.lastClick = Date.now();
        let user = this._data;
        let showHeadDetail = () => {
            try {
                let params = {
                    fromChairID: BPMJModel.getMyChairID(),
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
        if (BPMJModel.getUserTest() && !!user && !!user.userInfo.uid) {
            let uid = BPMJModel.getMyUID()
            AssetsManager.createDialog({
                uid: uid,
                type: 0,
                user: user,
                call: showHeadDetail,
                bundle: Enums.bundleType.BPMJ,
                path: "res/prefab/BPMJTestSelect",
            })
        } else {
            showHeadDetail();
        }
    },

    /*
     * 游戏聊天
     */
    gameChat(data) {
        // console.log("游戏聊天====data", data)
        data.user = this._data;
        let node = cc.find('text', this.node);
        let label = cc.find('txt_talk', node);
        CCUtil.gameChat(data, label, this.headSprite.node, this.node)
    },
});