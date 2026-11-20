const YDRModel = require("./YDRModel");
const ApiYdr = require('./ApiYdr');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require('../../../src/utils/CCUtil');
const ConfigModel = require('../../../src/model/ConfigModel');
const Enums = require('../../../src/const/Enums');
const Utils = require('../../../src/utils/Utils');
const UserModel = require('../../../src/model/UserModel');

cc.Class({
    extends: cc.Component,

    properties: {
        txt_name: cc.Label,
        txt_score: cc.Label,
        txt_totalScore: cc.Label,
        txt_tuo: cc.Label,
        txt_talk: cc.Label,
        txt_caishen: cc.Label,
        sprite_head: cc.Sprite,
        totalScore: cc.Node,
        img_banker: cc.Node,
        img_ready: cc.Node,
        img_offLine: cc.Node,

        img_time_bar: cc.Node,
        img_xiake: cc.Node,
        img_baozi: cc.Node,
        img_tou: cc.Node,
        img_buTou: cc.Node,
        img_qi: cc.Node,

        /**用户数据 */
        _data: null,
        /**初始化完成 */
        _inited: false,

        _endTime: 0, //总时长
        _totalTime: 10, //总操作时间
        _aniTouInitX: 0,
    },

    initRes() {
        if (this._inited) {
            return
        }
        this.node.on(cc.Node.EventType.TOUCH_END, this.onHeadClick, this)
        this.node.active = false
        this._inited = true
        this.txt_name.string = ""
        this.txt_score.string = ""
        this.txt_tuo.string = ""
        this.totalScore.active = false
        this.txt_talk.node.parent.active = false
        this.img_banker.active = false
        this.img_ready.active = false
        this.img_offLine.active = false
        this.img_time_bar.active = false
        this.img_xiake.active = false
        this.img_baozi.active = false
        this.img_baozi.parent.active = false
        this.img_tou.active = false
        this.img_buTou.active = false
        this._aniTouInitX = this.img_tou.x
        this.img_qi.active = false
    },

    /**重置 局间使用 */
    reset() {
        this.setBanker(false)
        this.setQi(false)
        this.setBaoZi(false)
        this.setXiaKe(false)
        this.showTimerLight(false)
        this.setTuoShu(0)
    },

    /**初始化用户数据 */
    init(user) {
        if (!user) return;
        if (!this._inited) {
            this.initRes()
        }
        this._data = user
        // console.log("初始化用户", this._data)
        this.setUserScore(user.userInfo.score)
        this.txt_name.string = CCUtil.stringClamp(user.userInfo.nickname, 6, '..');
        AssetsManager.loadSpriteFrame({
            path: user.userInfo.avatar,
            sprite: this.sprite_head
        });

        /**准备图标 */
        this.setReady(user.playStatus === ApiRoom.userStatusEnum.READY && YDRModel.getGameStatus() == ApiYdr.gameStatus.NONE)
        /**庄家图标 */
        this.setBanker(user.uid === YDRModel.getBankerUid())
        /**离线 */
        this.setOffline(user.userStatus === ApiRoom.userStatusEnum.OFFLINE)
        this.node.active = true
    },

    /**回放时候的初始化 */
    initReview(user) {
        if (!this._inited) {
            this.initRes()
        }
        this.txt_score.string = Utils.formatNumberWithDecimal(user.score)
        this.txt_name.string = CCUtil.stringClamp(user.nickname, 6, '..');
        // this.fangzhuNode.active = false
        AssetsManager.loadSpriteFrame({
            path: user.avatar,
            sprite: this.sprite_head
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
        data.user = this._data
        CCUtil.gameChat(data, this.txt_talk.node, this.sprite_head.node, this.node)
    },

    /**点击响应 */
    onHeadClick(event) {
        // console.log("点击了头像", this._data)
        if (CCUtil.clickInterval(event.target, 0.5)) return;
        let user = this._data;
        let tmp = UserModel.getData("isTest")
        let headDetil = () => {
            try {
                let params = {
                    fromChairID: YDRModel.getMyChairID(),
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
                bundle: Enums.bundleType.YDR,
                path: "res/prefab/YDRSelectTest",
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
        this.txt_score.string = Utils.formatNumberWithDecimal(s) + ""
    },

    /**设置总输赢分数 */
    setTotalScore(s) {
        if (cc.isValid(this.totalScore)) {
            this.totalScore.active = (typeof (s) == 'number')
            this.txt_totalScore.string = Utils.formatNumberWithDecimal(s) + ""
        }
    },

    /**设置离线 */
    setOffline(isShow) {
        if (cc.isValid(this.img_offLine)) {
            this.img_offLine.active = isShow
        }
    },

    /**设置操作光 */
    setLight(isShow) {
        if (cc.isValid(this.img_time_bar)) {
            this.img_time_bar.active = isShow
        }
    },

    /**设置准备 */
    setReady(isShow) {
        if (cc.isValid(this.img_ready)) {
            this.img_ready.active = isShow
        }
    },

    /**设置庄家 */
    setBanker(isShow) {
        if (cc.isValid(this.img_banker)) {
            this.img_banker.active = isShow
        }
    },

    /**设置包子 */
    setBaoZi(isShow) {
        if (cc.isValid(this.img_baozi)) {
            this.img_baozi.active = isShow
            this.img_baozi.parent.active = isShow
        }
    },

    /**设置下课 */
    setXiaKe(isShow) {
        if (cc.isValid(this.img_xiake)) {
            this.img_xiake.active = isShow
            this.img_xiake.parent.active = isShow
        }
    },

    /**设置起 */
    setQi(isShow) {
        if (cc.isValid(this.img_qi)) {
            this.img_qi.active = isShow
        }
    },

    /**设置托书 */
    setTuoShu(num = 0) {
        if (cc.isValid(this.txt_tuo)) {
            this.txt_tuo.string = `陀数:${num}`
        }
    },

    /**
     * 展示偷和不偷
     * @param {number} type 1偷 2不偷
     */
    showTouAni(type) {
        let node = null
        this.img_tou.active = false
        this.img_buTou.active = false
        if (type == 1 && cc.isValid(this.img_tou)) {
            node = this.img_tou
        } else if (type == 2 && cc.isValid(this.img_buTou)) {
            node = this.img_buTou
        }
        if (node) {
            node.stopAllActions()
            node.active = true
            node.scale = 0
            node.opacity = 0
            let enx = this._idx == 1 ? 200 : -200
            node.x = this._aniTouInitX + enx
            cc.tween(node).to(0.3, {
                x: this._aniTouInitX,
                scale: 1,
                opacity: 255,
            }).delay(1).call(() => {
                node.active = false
            }).start()
        }
    },

    /**展示时间转圈 */
    showTimerLight(isShow, cur, total) {
        this.img_time_bar.active = isShow;
        this.img_time_bar.opacity = 255
        if (isShow) {
            if (cur == 0) {
                this.blinkTimerLight()
                return
            }
            this._blink = false
            this.img_time_bar.stopAllActions()
            this._totalTime = total
            this.img_time_bar.getComponent(cc.ProgressBar).progress = 1;
            this.img_time_bar.color = cc.color("#00FF0F");
            this._endTime = (cur || 0) * 1000 + Date.now();
            if (!this._totalTime || isNaN(this._totalTime)) {
                this._totalTime = 10;
            }
            this._totalTime *= 1000;
        }
    },

    /**如果时间为0 变成圈圈闪烁 */
    blinkTimerLight() {
        this._blink = true
        this.img_time_bar.active = true
        this.img_time_bar.getComponent(cc.ProgressBar).progress = 1;
        this.img_time_bar.color = cc.color("#FF0000");
        this.img_time_bar.stopAllActions()
        cc.tween(this.img_time_bar).to(1, {
            opacity: 0
        }).to(1, {
            opacity: 255
        }).union().repeatForever().start()
    },

    /**设置财神数量 */
    setCaishen(count) {
        if (count) {
            this.txt_caishen.node.parent.active = true
            this.txt_caishen.string = count + ""
        } else {
            this.txt_caishen.node.parent.active = false
        }
    },

    update(dt) {
        if (!!this.img_time_bar && this.img_time_bar.active && !this._blink) {
            let leftTick = this._endTime - Date.now();
            if (leftTick <= 0) {
                this.blinkTimerLight();
            } else {
                this.img_time_bar.stopAllActions()
                this.img_time_bar.opacity = 255
                let pcom = this.img_time_bar.getComponent(cc.ProgressBar);
                if (!pcom) return;
                pcom.progress = leftTick / this._totalTime;
                if (leftTick <= 5000) {
                    this.img_time_bar.color = cc.color("#FF0000");
                }
            }
        }
    },
});