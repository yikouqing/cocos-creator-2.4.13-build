const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const ApiRcssg = require('./ApiRcssg');
const Utils = require('../../../src/utils/Utils');
const huTypeUrl = "res/sprite/huType/";
const huIndexUrl = "res/sprite/rank/";
var optTypeUrl = [
    "spine/mj/chi",
    "spine/mj/peng",
    "spine/mj/gang",
    "spine/mj/hu",
    "spine/mj/zimo",
    "spine/mj/ef_wind37_1", //普通刮风
    "spine/mj/ef_wind37_1", //补杠刮风
    "spine/mj/ef_rain37_1", //下雨
    "spine/mj/buhua", //8补花
    "spine/mj/yiyou", //一游 9
    "spine/mj/eryou", //二游 10
    "spine/mj/sanyou", //三游 11
    "spine/mj/youjin", //游金 12
    "spine/mj/sanjindao", //三金倒 13
]

cc.Class({
    extends: cc.Component,

    properties: {
        optSpine: sp.Skeleton,
        huType: cc.Sprite,
        txt_win: cc.Label,
        txt_lose: cc.Label,
        _uid: null
    },

    setSpine(aniName, url, timeScale, isLoop = false) {
        let track = Utils.getRandomNum(0, 10)
        AssetsManager.loadAsset({
            path: url,
            aType: sp.SkeletonData,
        }, (sk) => {
            if (!sk) {
                console.error("load spine err,url=", url)
                this.node.destroy()
                return
            }
            this.optSpine.skeletonData = sk
            this.optSpine.node.active = true
            this.optSpine.setSkin('default');
            this.optSpine.timeScale = timeScale
            this.optSpine.setAnimation(track, aniName, isLoop)
        })

        this.optSpine.setCompleteListener(() => {
            this.node.destroy()
        });
    },

    showTingLight() {
        let aniName = "ting"
        let timeScale = 1.3
        let url = "spine/mj/ting_card_light/ting"
        this.setSpine(aniName, url, timeScale)
    },

    showHuLight() {
        let aniName = "animation"
        let url = "spine/mj/hu_effect/hupai"
        let timeScale = 0.8
        this.setSpine(aniName, url, timeScale)
    },

    /**展示操作动画 */
    showOpt(type) {
        this.node.scale = 1.3
        this.optSpine.node.active = false
        this.huType.node.active = false
        let track = Utils.getRandomNum(0, 10)
        let aniName = "animation"
        if (type == 0) {
            aniName = "chi"
        } else if (type == 1) {
            aniName = "peng"
        } else if (type == 2) {
            aniName = "gang"
        } else if (type == 3) {
            aniName = "hu"
        } else if (type == 4) {
            aniName = "zimo"
        } else if (type >= 5 && type <= 7) {
            this.optSpine.premultipliedAlpha = true
            if (type === 5) aniName = "wind_1"
            if (type === 6) aniName = "wind_0"
        } 

        AssetsManager.loadAsset({
            path: optTypeUrl[type],
            aType: sp.SkeletonData,
        }, (sk) => {
            if (!sk) return
            this.optSpine.skeletonData = sk
            this.optSpine.node.active = true
            this.optSpine.setSkin('default');
            this.optSpine.timeScale = 1.2
            this.optSpine.setAnimation(track, aniName, false)
        })

        this.optSpine.setCompleteListener(() => {
            // console.log("展示了操作动画==", type, aniName, optTypeUrl[type])
            this.node.destroy()
        });
    },

    /**展示胡牌牌型 */
    showHuType(type, isAni) {
        // console.log("展示胡牌类型==", type);
        AssetsManager.loadAsset({
            path: huTypeUrl + type,
            aType: cc.SpriteFrame,
            bundle: Enums.bundleType.RCSSGMJ
        }, (sp) => {
            if (!sp) return
            this.huType.spriteFrame = sp
            this.huType.node.active = true
            if (isAni) {
                this.huType.node.scale = 0
                cc.tween(this.huType.node).delay(2).to(0.2, {
                    scale: 1
                }).start()
            }
        })
    },

    /**展示胡牌的序列 */
    showHuIndex(type, idx, uid, isAni) {
        // console.log("展示胡牌的序列", idx, type);
        this._uid = uid;
        let endScale = 1;
        let index = parseInt(this.node.parent.name.slice(7))
        let name = "hu"
        if (type === ApiRcssg.operateType.HU_ZHI) {
            name = "zimo"
            if (index == 1) {
                this.node.x -= 30
            } else if (index == 3) {
                this.node.x += 30
            }
            endScale = 1
        }
        let url = huIndexUrl + idx + name;
        AssetsManager.loadAsset({
            path: url,
            aType: cc.SpriteFrame,
            bundle: Enums.bundleType.RCSSGMJ
        }, (sp) => {
            if (!sp) return;
            this.huType.spriteFrame = sp;
            this.huType.node.active = true;
            if (isAni) {
                this.huType.node.scale = 0;
                cc.tween(this.huType.node)
                    .delay(1)
                    .to(0.2, {
                        scale: endScale
                    }).start()
            } else {
                this.huType.node.scale = endScale
            }
        })
    },

    /**展示操作时候的得分 */
    showOptScoreAni(score) {
        this.txt_win.string = "";
        this.txt_lose.string = "";
        let s = Utils.formatNumberWithDecimal(score);
        let txt = s > 0 ? this.txt_win : this.txt_lose;
        let str = s > 0 ? "+" + s : "" + s;
        let idx = parseInt(this.node.parent.name.slice(7));
        let endPos = cc.v2(0, txt.node.y + 100);
        if (idx == 1) {
            endPos = cc.v2(txt.node.x - 100, 0);
        } else if (idx == 2) {
            endPos = cc.v2(0, txt.node.y - 100);
        } else if (idx == 3) {
            endPos = cc.v2(txt.node.x + 100, 0);
        }
        txt.string = str
        txt.node.scale = 0;
        txt.node.active = true;
        cc.tween(txt.node)
            .to(0.2, {
                scale: 1,
                position: endPos,
            })
            .delay(2)
            .call(() => {
                this.node.destroy()
            })
            .start()
    },
});