const ApiRoom = require('../../../src/api/ApiRoom');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ConfigModel = require('../../../src/model/ConfigModel');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const TDKModel = require("./TDKModel")
const ApiTdk = require('./ApiTdk');
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
        if (this._inited) return;
        this._inited = true;
        this.node.on(cc.Node.EventType.TOUCH_END, this.onHeadClick, this)
        this.headSprite = cc.find('head', this.node).getComponent(cc.Sprite);
        this.robSprite = cc.find('robstate', this.node).getComponent(cc.Sprite);
        this.txt_name = cc.find('txt_name', this.node).getComponent(cc.Label);
        this.txt_score = cc.find('txt_score', this.node).getComponent(cc.Label);
        this.txt_betScore = cc.find("scorebg/gold", this.node).getComponent(cc.Label)
        this.bankerNode = cc.find('banker', this.node);
        this.bankerNode1 = cc.find('banker1', this.node);
        this.clockNode = cc.find("clock", this.node)

        this.readyNode = cc.find("ready", this.node)
        this.fangzhuNode = this.node.getChildByName('fangzhu');
        this.offlineNode = cc.find("offline", this.node)
        this.lightNode = cc.find("light", this.node)

        this.txt_win = cc.find("txt_win", this.node).getComponent(cc.Label)
        this.txt_win.string = ""
        this.txt_lose = cc.find("txt_lose", this.node).getComponent(cc.Label)
        this.txt_lose.string = ""
        this.initWinPos = this.txt_win.node.getPosition()
        this.initLosePos = this.txt_lose.node.getPosition()

        this.txt_state = cc.find("statebg/txt_state", this.node).getComponent(cc.Label)

        /**总输赢 */
        this.totalScore = cc.find("totalScore", this.node)
        if (cc.isValid(this.totalScore)) {
            this.totalScore.active = false
            this.txt_totalScore = cc.find("txt_totalScore", this.totalScore).getComponent(cc.Label)
        }

        this.setReady(false)
        this.setLight(false)
        this.setOffline(false)
        this.setBanker(false)
        this.setBetScore()
        this.setTotalScore(0)
        this.setStateTxt()
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
        this.fangzhuNode.active = false //user.userInfo.uid == TDKModel.getRoomCreatorByKey("ownerUid")
        AssetsManager.loadSpriteFrame({
            path: user.userInfo.avatar,
            sprite: this.headSprite
        }, () => {
            this.node.active = true
        });

        /**准备图标 */
        this.setReady(user.playStatus === ApiRoom.playStatus.READY)
        /**庄家图标 */
        this.setBanker(user.uid === TDKModel.getBankerUid() && (TDKModel.getCurBureau() != 0 || (TDKModel.gameStarted && TDKModel.getGameStatus() > ApiTdk.gameStatus.ROB_BANK)))
        /**离线 */
        this.setOffline(user.userStatus === ApiRoom.userStatusEnum.OFFLINE)
        this.node.active = true
    },

    /**回放时候的初始化 */
    initReview(user) {
        if (!this._inited) {
            this.initRes()
        }
        this._data = user
        let unionType = TDKModel.getRoomCreatorByKey('unionType');
        if (unionType != Enums.UnionType.NORMAL) {
            this.txt_score.string = Utils.formatNumberWithDecimal(user.score, 1);
        } else {
            this.txt_score.string = '';
        }
        this.txt_name.string = CCUtil.stringClamp(user.nickname, 5, '..');
        this.fangzhuNode.active = false
        AssetsManager.loadSpriteFrame({
            path: user.avatar,
            sprite: this.headSprite
        }, () => {
            this.node.active = true
        });

        this.setBanker(false)
        this.setReady(false)
        this.setOffline(false)
        this.setPassNode(false)
        this.setUserScore(user.userScore)
        this.setTotalScore()
        this.node.active = true
    },

    /**用户离开 */
    leave() {
        this._data = null
        this.reset()
        this.setBanker(false)
        this.txt_name.string = ""
        this.txt_score.string = ""
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
        // console.log("user", user)
        let showHeadDetail = () => {
            try {
                let params = {
                    fromChairID: TDKModel.getMyChairID(),
                    toChairID: user.chairID,
                    canSendGift: TDKModel.getMyChairID() < TDKModel.getChairCount(),
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
        if (!!user && !!TDKModel.getUserTest() && !TDKModel.isInWatch()) {
            AssetsManager.createDialog({
                user: user,
                optUid: user.userInfo.uid,
                callback: showHeadDetail,
                bundle: Enums.bundleType.TDK,
                path: "res/prefab/TDKTestSelect",
            })
        } else {
            showHeadDetail()
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
        if (TDKModel.scoreState() == 1) return
        if (this.txt_score) this.txt_score.string = Utils.formatNumberWithDecimal(s, 1);
    },

    /**设置总输赢分数 */
    setTotalScore(s) {
        let num = Utils.formatNumberWithDecimal(s, 1);
        if (TDKModel.scoreState() == 1) {
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
            this.totalScore.active = TDKModel.scoreState() == 2;
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
            bundle: Enums.bundleType.TDK
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
                bundle: Enums.bundleType.TDK
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
        let score = Math.floor(s)
        let aniNode = null
        let initPos = null
        if (score >= 0) {
            this.txt_win.node.active = true
            this.txt_win.string = "+" + score
            this.txt_lose.string = ""
            aniNode = this.txt_win.node
            initPos = this.initWinPos
        } else {
            aniNode = this.txt_lose.node
            initPos = this.initLosePos
            this.txt_win.string = ""
            this.txt_lose.string = "" + score
            this.txt_lose.node.active = true
        }
        if (aniNode && initPos) {
            aniNode.stopAllActions()
            aniNode.setPosition(initPos)
            let endY = initPos.y + 100
            cc.tween(aniNode).to(0.2, {
                y: endY
            }).start()
        }
    },

    reset() {
        this.setRobScale()
        this.setLight(false)
        this.setBetScore()
        this.setResScore()
        this.setStateTxt()
    },

    getClockNode() {
        return this.clockNode
    },

    /**设置状态文字
     * CANCEL: 1, //扣牌
         ALLIN: 2, //全压
         GEN: 3, //跟
         XIAZHU: 4, //下分
         QIJIAO: 5, //起脚
         BUTI: 6, //不踢
         FANTI: 7, //反踢
         KAIPAI: 8, //开牌
     */
    setStateTxt(type = null) {
        let node = this.txt_state.node.parent
        node.stopAllActions()
        if (!type) {
            this.txt_state.string = ""
            node.active = false
            node.scale = 1
            return
        }
        let strlist = ["", "扣牌", "全押", "跟注", "加注", "起脚", "不踢", "反踢", "开牌"]
        this.txt_state.string = strlist[type]
        node.active = true
        node.scale = 0
        cc.tween(node).show().to(0.15, {
            scale: 1
        }).delay(2).hide().start()
    },
});