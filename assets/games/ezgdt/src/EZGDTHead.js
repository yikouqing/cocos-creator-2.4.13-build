const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ConfigModel = require('../../../src/model/ConfigModel');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const EZGDTModel = require("./EZGDTModel")
const ApiEzgdt = require('./ApiEzgdt');
const NativeUtil = require('../../../src/utils/NativeUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        headSprite: cc.Sprite,
        txt_name: cc.Label,
        txt_score: cc.Label,
        robSprite: cc.Sprite,
        txt_betScore: cc.Label,
        bankerNode: cc.Node,
        readyNode: cc.Node,
        fangzhuNode: cc.Node,
        lightNode: cc.Node,
        totalScoreNode: cc.Node,
        txt_totalScore: cc.Label,
        txt_win: cc.Label,
        txt_lose: cc.Label,
        goldNode: cc.Node,
        betNode: cc.Node,
        offlineNode: cc.Node,
        txt_talk: cc.Node,

        _data: null,
    },

    onLoad() {
        this.txt_talk.parent.active = false
        this.setReady(false)
        this.setLight(false)
        this.setOffline(false)
        this.setBanker(false)
        this.setBetScore()
        this.setTotalScore(0)
        this.node.active = false
        this._winy = this.txt_win.node.y
        this._losey = this.txt_lose.node.y
    },

    init(user) {
        if (!user) {
            return
        }
        this._data = user
        this.node.on(cc.Node.EventType.TOUCH_END, this.onHeadClick, this)
        // console.log("初始化用户", this._data)
        this.setUserScore(user.userInfo.score)
        this.setTotalScore(0)
        this.txt_name.string = CCUtil.stringClamp(user.userInfo.nickname, 3, '..');
        this.fangzhuNode.active = false
        AssetsManager.loadSpriteFrame({
            path: user.userInfo.avatar,
            sprite: this.headSprite
        });

        this.setReady(user.userStatus == ApiRoom.userStatusEnum.READY && EZGDTModel.getGameStatus() == ApiEzgdt.gameStatus.NONE)
        this.setBanker(user.uid === EZGDTModel.getBankerUid() && EZGDTModel.getCurBureau() != 0)
        this.setOffline(user.userStatus === ApiRoom.userStatusEnum.OFFLINE)
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
        if (!this._data) {
            return
        }
        if (CCUtil.clickInterval(event.target, 0.5)) return;
        let user = this._data;
        let showHeadDetail = () => {
            try {
                let params = {
                    fromChairID: EZGDTModel.getMyChairID(),
                    toChairID: user.chairID,
                    canSendGift: EZGDTModel.getMyChairID() < EZGDTModel.getChairCount(),
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
        if (!!EZGDTModel.getUserTest() && !!user) {
            AssetsManager.createDialog({
                path: "res/prefab/EZGDTTestSelect",
                bundle: Enums.bundleType.EZGDT,
                user,
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
        if (EZGDTModel.scoreState() == 1) return
        if (this.txt_score) this.txt_score.string = Utils.formatNumberWithDecimal(s, 1);
    },

    /**设置总输赢分数 */
    setTotalScore(s) {
        let num = Utils.formatNumberWithDecimal(s, 1);
        if (EZGDTModel.scoreState() == 1) {
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
            this.totalScoreNode.active = EZGDTModel.scoreState() == 2;
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
            bundle: Enums.bundleType.EZGDT
        });
        this.robSprite.node.active = true;
    },

    /**设置庄家倍数 */
    setMaxScale(scale) {
        let url = "res/sprite/maxScale/" + scale
        AssetsManager.loadSpriteFrame({
            path: url,
            sprite: this.robSprite,
            bundle: Enums.bundleType.EZGDT
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
                bundle: Enums.bundleType.EZGDT
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
    setResScore(s = null, isAni = false) {
        this.txt_win.string = ""
        this.txt_lose.string = ""
        if (s == null) {
            return
        }
        let aniNode = null
        let score = Math.floor(s)
        if (score >= 0) {
            aniNode = this.txt_win.node
            this.txt_win.string = "+" + score
        } else {
            aniNode = this.txt_lose.node
            this.txt_lose.string = "" + score
        }

        if (cc.isValid(aniNode)) {
            aniNode.active = true
            aniNode.stopAllActions()
            aniNode.scale = 1
            if (isAni) {
                aniNode.scale = 0
                cc.tween(aniNode).to(0.3, { scale: 1 }).start()
            }
        }
    },

    reset() {
        this.setLight(false)
        this.setBetScore()
        this.setResScore()
        if (EZGDTModel.getGameRuleByKey("bankerType") != ApiEzgdt.gameType.BAWANGZHUANG) {
            this.setRobScale()
            this.setBanker(false)
        }
    },
});