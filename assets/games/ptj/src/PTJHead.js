const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ConfigModel = require('../../../src/model/ConfigModel');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const PTJModel = require("./PTJModel")
const ApiPtj = require('./ApiPtj');
const NativeUtil = require('../../../src/utils/NativeUtil');

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
        this._inited = true;
        this.node.on(cc.Node.EventType.TOUCH_END, this.onHeadClick, this)
        this.headSprite = cc.find('head', this.node).getComponent(cc.Sprite);
        this.robSprite = cc.find('robstate', this.node).getComponent(cc.Sprite);
        this.txt_name = cc.find('txt_name', this.node).getComponent(cc.Label);
        this.txt_score = cc.find('txt_score', this.node).getComponent(cc.Label);
        this.txt_betScore = cc.find("scorebg/gold", this.node).getComponent(cc.Label)
        this.bankerNode = cc.find('banker', this.node);
        this.bankerNode1 = cc.find('banker1', this.node);

        this.readyNode = cc.find("ready", this.node)
        this.fangzhuNode = this.node.getChildByName('fangzhu');
        this.offlineNode = cc.find("offline", this.node)
        this.lightNode = cc.find("light", this.node)

        this.show_shu = cc.find("show_shu", this.node)
        this.show_ying = cc.find("show_ying", this.node)

        this.txt_win = cc.find("txt_win", this.node).getComponent(cc.Label)
        this.txt_win.string = ""
        this.txt_lose = cc.find("txt_lose", this.node).getComponent(cc.Label)
        this.txt_lose.string = ""

        this.showScore = cc.find("showScore", this.node);
        /**总输赢 */
        this.totalScore = cc.find("totalScore", this.node)
        if (cc.isValid(this.totalScore)) {
            this.totalScore.active = false
            this.txt_totalScore = cc.find("txt_totalScore", this.totalScore).getComponent(cc.Label)
        }
        this.leave();
    },

    init(user) {
        if (!user) {
            return
        }
        if (!this._inited) {
            this.initRes()
        }
        this._data = user
        this.node.active = true;
        // console.log("初始化用户", this._data)
        this.setUserScore(user.userInfo.score)
        this.txt_name.string = CCUtil.stringClamp(user.userInfo.nickname, 6, '..');
        this.fangzhuNode.active = false //user.userInfo.uid == PTJModel.getRoomCreatorByKey("ownerUid")
        this.setReady(user.playStatus === ApiRoom.playStatus.READY); //准备图标
        this.setOffline(user.userStatus === ApiRoom.userStatusEnum.OFFLINE); //离线
        AssetsManager.loadSpriteFrame({
            path: user.userInfo.avatar,
            sprite: this.headSprite
        });
        this.setBanker(user.uid === PTJModel.getBankerUid() && (PTJModel.getCurBureau() != 0 || (PTJModel.gameStarted && PTJModel.getGameStatus() > ApiPtj.gameStatus.ROB_BANK))) //庄家图标

        // this.showBetScore([5, 8, 10]);
        // this.showResult(2);
    },

    /**回放时候的初始化 */
    initReview(user) {
        if (!this._inited) {
            this.initRes()
        }
        this.leave();
        this._data = user;
        this.node.active = true
        this.setUserScore(user.score);
        this.fangzhuNode.active = false;
        this.setUserScore(user.userScore);
        this.txt_name.string = CCUtil.stringClamp(user.nickname, 6, '..');
        AssetsManager.loadSpriteFrame({
            path: user.avatar,
            sprite: this.headSprite
        },);
    },

    /**用户离开 */
    leave() {
        this.reset()
        this._data = null;
        this.setUserScore()
        this.setBanker(false)
        this.setBanker(false);
        this.setReady(false);
        this.setTotalScore();
        this.setOffline(false);
        this.node.active = false
        this.txt_name.string = "";
        AssetsManager.loadSpriteFrame({
            path: "res/sprite/frame",
            sprite: this.headSprite,
            bundle: Enums.bundleType.PTJ,
        });
    },


    reset() {
        this.showResult();
        this.setRobScale()
        this.setBetScore()
        this.setResScore()
        this.showBetScore();
        this.setLight(false);
    },

    getUserData() {
        return this._data
    },



    /**显示下注分 */
    showBetScore(arr = []) {
        if (this.showScore) {
            this.showScore.getComponent(cc.Sprite).enabled = false;
            PTJModel.showBetScore(this.showScore, arr, cc.size(60, 40));
        }
    },

    /**
     * 显示结果
     * @param {*} type 0不显示1输2赢
     */
    showResult(type = 0) {
        if (this.show_shu) this.show_shu.active = type == 1;
        if (this.show_ying) this.show_ying.active = type == 2;
    },

    /**点击响应 */
    onHeadClick(event) {
        // console.log("点击了头像")
        if (!this._data || CCUtil.clickInterval(event)) {
            return
        }
        let user = this._data;
        let showHeadDetail = () => {
            try {
                let params = {
                    fromChairID: PTJModel.getMyChairID(),
                    toChairID: user.chairID,
                    canSendGift: PTJModel.getMyChairID() < PTJModel.getChairCount(),
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
        if (!!PTJModel.getUserTest() && !!user && !PTJModel.isInWatch()) {
            AssetsManager.createDialog({
                path: "res/prefab/PTJTestSelect",
                bundle: Enums.bundleType.PTJ,
                nextUid: user.userInfo.uid,
                callback: showHeadDetail,
            })
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
        if (PTJModel.scoreState() == 1) return
        if (this.txt_score) this.txt_score.string = Utils.formatNumberWithDecimal(s, 1);
    },

    /**设置总输赢分数 */
    setTotalScore(s) {
        let num = Utils.formatNumberWithDecimal(s, 1);
        if (PTJModel.scoreState() == 1) {
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
            this.totalScore.active = PTJModel.scoreState() == 2;
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

    /**获取金币图标 */
    getGoldIcon() {
        let icon = cc.find('scorebg/icon', this.node);
        return icon
    },

    /**设置抢庄 */
    setRobScale(type = null) {
        if (type == null) {
            this.robSprite.node.active = false
            return
        }
        let url = "res/sprite/rob" + type
        AssetsManager.loadSpriteFrame({
            path: url,
            sprite: this.robSprite,
            bundle: Enums.bundleType.PTJ
        });
        this.robSprite.node.active = true;
    },

    /**设置下注分数 */
    setBetScore(bs = null, isAni = false) {
        if (bs == null) {
            this.txt_betScore.node.parent.active = false
            return
        }
        this.txt_betScore.string = Math.floor(bs)
        this.txt_betScore.node.parent.active = true
        if (isAni) {
            let icon = cc.find('scorebg/icon', this.node);
            let icon_pos = icon.getPosition();
            let scorebg_pos = cc.find('scorebg', this.node).getPosition();
            let end_pos = cc.v2(scorebg_pos.x + icon_pos.x, scorebg_pos.y + icon_pos.y);
            AssetsManager.playEffect({
                path: 'res/audio/main/fly_gold',
                bundle: Enums.bundleType.PTJ
            });
            for (let i = 0; i < 10; ++i) {
                let node = cc.instantiate(icon);
                node.setPosition(0, 0);
                node.parent = this.node;
                cc.tween(node).delay(0.08 * i).to(0.3, {
                    position: end_pos
                }).removeSelf().start()
            }
        }
    },

    /**设置输赢分数 */
    setResScore(s = null) {
        if (s == null) {
            this.txt_win.string = ""
            this.txt_lose.string = ""
            return
        }
        let score = Utils.formatNumberWithDecimal(s, 1);
        this.txt_lose.node.active = score <= 0;
        this.txt_win.node.active = score > 0;
        this.txt_win.string = "+" + score;
        this.txt_lose.string = score;
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

});