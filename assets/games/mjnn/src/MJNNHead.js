const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ConfigModel = require('../../../src/model/ConfigModel');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const MJNNModel = require("./MJNNModel")
const ApiMjnn = require('./ApiMjnn');
const NativeUtil = require('../../../src/utils/NativeUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        /**用户数据 */
        _user: null,
        /**初始化完成 */
        _inited: false,
        /**剩余牌数量 */
        _cardCount: 0,
    },

    /**初始化资源 */
    init() {
        if (this._inited) return;
        this._inited = true;
        this.node.on(cc.Node.EventType.TOUCH_END, this.onHeadClick, this)
        this.headSprite = cc.find('head', this.node).getComponent(cc.Sprite);
        this.robSprite = cc.find('robstate', this.node).getComponent(cc.Sprite);
        this.txt_name = cc.find('txt_name', this.node).getComponent(cc.Label);
        this.txt_score = cc.find('txt_score', this.node).getComponent(cc.Label);
        this.txt_betScore = cc.find("scorebg/gold", this.node).getComponent(cc.Label)
        this.bankerNode = cc.find('banker', this.node);
        this.headFrame = cc.find('headframe', this.node);
        this.readyNode = cc.find("ready", this.node)
        this.fangzhuNode = this.node.getChildByName('fangzhu');
        this.offlineNode = cc.find("offline", this.node)
        this.lightNode = cc.find("light", this.node)
        this.txt_win = cc.find("txt_win", this.node).getComponent(cc.Label)
        this.txt_win.string = ""
        this.txt_lose = cc.find("txt_lose", this.node).getComponent(cc.Label)
        this.txt_lose.string = ""
        /**总输赢 */
        this.totalScore = cc.find("totalScore", this.node);
        if (cc.isValid(this.totalScore)) {
            this.totalScore.active = false;
            this.txt_totalScore = cc.find("txt_totalScore", this.totalScore).getComponent(cc.Label);
        }
        this.setReady(false);
        this.setLight(false);
        this.setOffline(false);
        this.setBanker(false);
        this.setBet();
        this.setTotalScore(0);
        this.node.active = false;
    },

    sit(user) {
        if (!user) return;
        if (!this._inited) {
            this.init();
        }
        this.node.active = true;
        this._user = user;
        this.setUserScore(user.userInfo.score)
        this.txt_name.string = CCUtil.stringClamp(user.userInfo.nickname, 5, '..');
        this.fangzhuNode.active = false //user.userInfo.uid == MJNNModel.getRoomCreatorByKey("ownerUid")
        AssetsManager.loadSpriteFrame({
            path: user.userInfo.avatar,
            sprite: this.headSprite
        });
        /**准备图标 */
        this.setReady(user.playStatus === ApiRoom.playStatus.READY);
        /**庄家图标 */
        this.setBanker(user.uid === MJNNModel.getBankerUID() && MJNNModel.getGameStatus() > ApiMjnn.gameStatus.ROB_BANK);
        /**离线 */
        this.setOffline(user.userStatus === ApiRoom.userStatusEnum.OFFLINE);
    },

    /**回放时候的初始化 */
    initReview(user) {
        if (!this._inited) {
            this.init()
        }
        this._user = user;
        this.node.active = true;
        this.txt_score.string = Math.floor(user.score)
        this.txt_name.string = CCUtil.stringClamp(user.nickname, 5, '..');
        this.fangzhuNode.active = false
        AssetsManager.loadSpriteFrame({
            path: user.avatar,
            sprite: this.headSprite
        });
        this.setBanker(false)
        this.setReady(false)
        this.setOffline(false)
        this.setPassNode(false)
        this.setUserScore(user.userScore)
        this.setTotalScore()
    },

    getUserData() {
        return this._user
    },

    /*
     * 游戏聊天
     */
    gameChat(data) {
        let node = cc.find('text', this.node);
        let label = cc.find('txt_talk', node);
        data.user = this._user;
        CCUtil.gameChat(data, label, this.headSprite.node, this.node)
    },

    /**点击响应 */
    onHeadClick(event) {
        // console.log("点击了头像")
        if (!this._user) return;
        if (CCUtil.clickInterval(event.target, 0.5)) return;
        let user = this._user;
        let showHeadDetail = () => {
            try {
                let params = {
                    fromChairID: MJNNModel.getMyChairID(),
                    toChairID: user.chairID,
                    canSendGift: MJNNModel.getMyChairID() < MJNNModel.getChairCount(),
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
        if (!!user && !!MJNNModel.getUserTest() && !MJNNModel.isInWatch()) {
            AssetsManager.createDialog({
                callback: showHeadDetail,
                nextUid: user.userInfo.uid,
                bundle: Enums.bundleType.MJNN,
                path: "res/prefab/MJNNTestSelect",
            })
        } else {
            showHeadDetail();
        }
    },

    /**用户信息改变 */
    userInfoChange(data) {
        if (!this._user) return;
        if (this._user.userInfo.uid == data.changeInfo.uid) {
            for (let key in data.changeInfo) {
                this._user.userInfo[key] = data.changeInfo[key];
            }
            this.setUserScore(this._user.userInfo.score);
        }
    },


    /**设置分数 */
    setUserScore(s) {
        if (MJNNModel.scoreState() == 1) return
        if (this.txt_score) this.txt_score.string = Utils.formatNumberWithDecimal(s, 1);
    },

    /**设置总输赢分数 */
    setTotalScore(s) {
        let num = Utils.formatNumberWithDecimal(s, 1);
        if (MJNNModel.scoreState() == 1) {
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
            this.totalScore.active = MJNNModel.scoreState() == 2;
            this.txt_totalScore.node.color = num > 0 ? cc.Color.GREEN : cc.Color.RED;
        }
    },



    /**设置离线 */
    setOffline(isShow) {
        if (cc.isValid(this.offlineNode)) this.offlineNode.active = isShow;
    },

    /**设置准备 */
    setReady(isShow) {
        if (cc.isValid(this.readyNode)) this.readyNode.active = isShow;
    },

    /**设置庄家 */
    setBanker(isShow) {
        if (cc.isValid(this.bankerNode)) this.bankerNode.active = isShow;
        if (cc.isValid(this.headFrame)) this.headFrame.active = isShow;
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
    setRob(user = null) {
        if (!!user) {
            let url = `res/sprite/op/qiang${user.isRob}`;
            let robScale = MJNNModel.getGameRuleByKey("robBankLimit");
            robScale = robScale || 1;
            //如果要显示抢的倍数解开下面注释
            if (robScale > 1 && user.isRob > 0) {
                url = `res/sprite/op/qiang1${user.isRob}`;
            }
            let gameStatus = MJNNModel.getGameStatus();
            if (gameStatus == ApiMjnn.gameStatus.ROB_BANK) {
                AssetsManager.loadSpriteFrame({
                    path: url,
                    sprite: this.robSprite,
                    bundle: Enums.bundleType.MJNN
                });
                this.robSprite.node.active = true;
            } else {
                this.robSprite.spriteFrame = null;
                this.robSprite.node.active = false;
            }
        } else {
            this.robSprite.node.active = false;
        }
    },

    /**设置下注分数 */
    setBet(score = null, isAni = false) {
        let gameStatus = MJNNModel.getGameStatus();
        let isBet = score > 0 && (gameStatus == ApiMjnn.gameStatus.POUR_SCORE || gameStatus == ApiMjnn.gameStatus.SHOW_CARDS);
        this.txt_betScore.node.parent.active = isBet;
        if (!isBet) return;
        this.txt_betScore.string = Math.floor(score);
        this.txt_betScore.node.parent.active = true;
        if (isAni) {
            let icon = cc.find('scorebg/icon', this.node);
            let icon_pos = icon.getPosition();
            let scorebg_pos = cc.find('scorebg', this.node).getPosition();
            let end_pos = cc.v2(scorebg_pos.x + icon_pos.x, scorebg_pos.y + icon_pos.y);
            AssetsManager.playEffect({
                path: 'res/audio/main/fly_gold',
                bundle: Enums.bundleType.MJNN
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
    setWin(s = null) {
        if (s == null) {
            this.txt_win.string = ""
            this.txt_lose.string = ""
            return
        }
        let score = Math.floor(s)
        if (score >= 0) {
            this.txt_win.node.active = true
            this.txt_win.string = "+" + score
            this.txt_lose.string = ""
        } else {
            this.txt_win.string = ""
            this.txt_lose.string = "" + score
            this.txt_lose.node.active = true
        }
    },

    reset() {
        this.setRob();
        this.setLight(false);
        this.setBet();
        this.setWin();
        this.setBanker(false);
    },

    leave() {
        this._user = null;
        this.reset();
        this.setBanker(false);
        this.txt_name.string = "";
        this.txt_score.string = "";
        this.headSprite.spriteFrame = null;
        this.node.active = false;
    },

});