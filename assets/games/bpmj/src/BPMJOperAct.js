const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const ApiBpmj = require('./ApiBpmj');
const Utils = require('../../../src/utils/Utils');

let optTypeUrl = [
    "res/spine/optAni/chi",
    "res/spine/optAni/peng",
    "res/spine/optAni/gang",
    "res/spine/optAni/hu",
    "res/spine/optAni/zimo",
]

let cardTypeUrl = "res/sprite/cardtype/";
let huIndexUrl = "res/sprite/rank/"

cc.Class({
    extends: cc.Component,

    properties: {
        optSpine: sp.Skeleton,
        huType: cc.Sprite,
        txt_win: cc.Label,
        txt_lose: cc.Label,
        _uid: null
    },

    onLoad() {
        MessageCallback.addListener('RoomMessagePush', this);
        MessageCallback.addListener('reviewClear', this);
    },

    onDestroy() {
        MessageCallback.removeListener('RoomMessagePush', this);
        MessageCallback.removeListener('reviewClear', this);
    },

    messageCallbackHandler(route, msg) {
        if (route === 'RoomMessagePush') {
            if (msg.type === ApiRoom.USER_READY_PUSH) {
                if (msg.data.uid === this._uid) {
                    this.node.destroy()
                }
            }
        } else if (route === "reviewClear") {
            // this.node.destroy()
        }
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
        let aniName = "animation"
        if (type >= 5 && type <= 7) {
            this.optSpine.premultipliedAlpha = true
            if (type === 5) aniName = "wind_1"
            if (type === 6) aniName = "wind_0"
        } else if (type == ApiBpmj.operateType.BU_HUA) {
            type = 8;
        } else if (type == ApiBpmj.operateType.YOU_JIN) {
            type = 12;
        } else if (type == ApiBpmj.operateType.SAN_JIN) {
            type = 13;
        }
        AssetsManager.loadAsset({
            path: optTypeUrl[type],
            aType: sp.SkeletonData,
            bundle: Enums.bundleType.BPMJ
        }, (sk) => {
            if (!sk) return
            this.optSpine.skeletonData = sk
            this.optSpine.node.active = true
            this.optSpine.setSkin('default');
            this.optSpine.setAnimation(0, aniName, false)
        })

        this.optSpine.setCompleteListener(() => {
            this.node.destroy()
        });
    },

    /**展示胡牌牌型 */
    showHuType(type, chairID, isAni) {
        // console.log("展示胡牌类型==", type, chairID)
        // this._chairId = chairID
        // this.optSpine.node.active = false
        // this.huType.node.active = false

        /**7张牌的时候 所有7对变成4对 */
        // let list = [4, 5, 7, 8, 11]
        // if (list.includes(type) && BPMJModel.getGameRule().cardCount === 7) {
        //     type += 100
        // }

        // AssetsManager.loadAsset({
        //     path: cardTypeUrl + type,
        //     aType: cc.SpriteFrame,
        //     bundle: Enums.bundleType.BPMJ
        // }, (sp) => {
        //     if (!sp) return
        //     this.huType.spriteFrame = sp
        //     this.huType.node.active = true
        //     if (isAni) {
        //         this.huType.node.scale = 0
        //         cc.tween(this.huType.node).delay(2).to(0.2, {
        //             scale: 1
        //         }).start()
        //     }
        // })
    },

    /**展示胡牌的序列 */
    showHuIndex(type, idx, uid, isAni) {
        return;
        // console.log("展示胡牌的序列", idx, type);
        this._uid = uid;
        this.optSpine.node.active = false;
        this.huType.node.active = false;
        let endScale = 0.6;
        let index = parseInt(this.node.parent.name.slice(7))
        let name = "hu"
        if (type === ApiBpmj.operateType.HU_ZHI) {
            name = "zimo"
            if (index == 1) {
                this.node.x -= 30
            } else if (index == 3) {
                this.node.x += 30
            }
            endScale = 0.5
        }

        let url = huIndexUrl + idx + name

        AssetsManager.loadAsset({
            path: url,
            aType: cc.SpriteFrame,
            bundle: Enums.bundleType.BPMJ
        }, (sp) => {
            if (!sp) return
            this.huType.spriteFrame = sp
            this.huType.node.active = true
            if (isAni) {
                this.huType.node.scale = 0
                cc.tween(this.huType.node).delay(2).to(0.2, {
                    scale: endScale
                }).start()
            } else {
                this.huType.node.scale = endScale
            }
        })
    },

    /**展示操作时候的得分 */
    showOptScoreAni(score) {
        this.txt_lose.string = ""
        this.txt_win.string = ""

        let s = Utils.formatNumberWithDecimal(score)
        let str = "" + s
        let txt = this.txt_lose
        if (s > 0) {
            str = "+" + s
            txt = this.txt_win
        }

        //operAct0
        let idx = parseInt(this.node.parent.name.slice(7))

        let endPos = cc.v2(0, txt.node.y + 100)
        if (idx == 1) {
            endPos = cc.v2(txt.node.x - 100, 0)
        } else if (idx == 2) {
            endPos = cc.v2(0, txt.node.y - 100)
        } else if (idx == 3) {
            endPos = cc.v2(txt.node.x + 100, 0)
        }

        txt.string = str
        txt.node.scale = 0
        cc.tween(txt.node).to(0.2, {
            scale: 1,
            position: endPos,
        }).delay(2).call(() => {
            this.node.destroy()
        }).start()
    },
});