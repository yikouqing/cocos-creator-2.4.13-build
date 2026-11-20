const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const ApiHz = require('./ApiHz');
const Utils = require('../../../src/utils/Utils');

const optTypeUrl = [
    "spine/mj/chi",
    "spine/mj/peng",
    "spine/mj/gang",
    "spine/mj/hu",
    "spine/mj/zimo",
]

const cardTypeUrl = "res/sprite/cardtype/";

cc.Class({
    extends: cc.Component,

    properties: {
        optSpine: sp.Skeleton,
        huType: cc.Sprite,
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
        }
        this.setSpine(aniName, optTypeUrl[type], 1.5)
    },

    /**展示胡牌牌型 */
    showHuType(type, sex = 0) {
        // console.log("展示胡牌类型==", type);
        let audio = `res/audio/nan/ct_${type}`;
        if (sex == 1) {
            audio = audio.replace(/nan/g, "nv");
        }
        AssetsManager.playEffect({
            path: audio,
            bundle: Enums.bundleType.HZ
        });
        this.optSpine.node.active = false
        this.huType.node.active = false
        AssetsManager.loadAsset({
            path: cardTypeUrl + type,
            aType: cc.SpriteFrame,
            bundle: Enums.bundleType.HZ
        }, (sp) => {
            if (!sp) return
            this.huType.spriteFrame = sp
            this.huType.node.active = true
            this.huType.node.scale = 0
            cc.tween(this.huType.node).delay(1.5).to(0.2, {
                scale: 1
            }).delay(2).call(() => {
                this.node.destroy()
            }).start()
        })
    },
});