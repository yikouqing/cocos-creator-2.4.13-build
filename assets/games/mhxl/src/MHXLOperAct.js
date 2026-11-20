const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const ApiMhxl = require('./ApiMhxl');
const Utils = require('../../../src/utils/Utils');
const cardTypeUrl = "res/sprite/cardtype/";
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
optTypeUrl[ApiMhxl.operateType.MENPAI] = "spine/mj/men";
optTypeUrl[ApiMhxl.operateType.DAITIANTING] = "res/spine/optAni/ting";
let jipaiUrl = [];
jipaiUrl[ApiMhxl.gameJIpai.ZHEREWUGUJI] = {
    url: "res/spine/jipai/zerengwuguji",
    name: "zerengwuguji"
};
jipaiUrl[ApiMhxl.gameJIpai.CHONGFONGJI] = {
    url: "res/spine/jipai/chongfengji",
    name: "chongfengji"
};
jipaiUrl[ApiMhxl.gameJIpai.WUGUJI] = {
    url: "res/spine/jipai/chognfengwuguji",
    name: "animation"
};
jipaiUrl[ApiMhxl.gameJIpai.ZHEREJI] = {
    url: "res/spine/jipai/zerengji",
    name: "chongfengji"
};
jipaiUrl[ApiMhxl.gameJIpai.LAIZIJI] = {
    url: "res/spine/jipai/laiziji",
    name: "laiziji"
};

cc.Class({
    extends: cc.Component,

    properties: {
        optSpine: sp.Skeleton,
        nodeJiPai: sp.Skeleton,
        nodeJiaoZui: cc.Node,
        nodeGuMai: cc.Node,
        huType: cc.Sprite,
        txt_win: cc.Label,
        txt_lose: cc.Label,
        _uid: null
    },

    onLoad() {
        MessageCallback.addListener('RoomMessagePush', this);
        MessageCallback.addListener('reviewClear', this);
        this.initShow(false);
    },

    initShow(isShow = false) {
        this.node.active = isShow;
        this.nodeGuMai.active = false;
        this.huType.node.active = false;
        this.optSpine.node.active = false;
        this.txt_win.node.active = false;
        this.txt_lose.node.active = false;
        this.nodeJiaoZui.active = false;
        this.nodeJiPai.node.active = false;
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
        this.initShow(true);
        let aniName = "ting"
        let timeScale = 1.3
        let url = "spine/mj/ting_card_light/ting"
        this.setSpine(aniName, url, timeScale)
    },

    showHuLight() {
        this.initShow(true);
        let aniName = "animation"
        let url = "spine/mj/hu_effect/hupai"
        let timeScale = 0.8
        this.setSpine(aniName, url, timeScale)
    },

    /**展示操作动画 */
    showOpt(type) {
        this.initShow(true);
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
        } else if (type == ApiMhxl.operateType.MENPAI) {
            aniName = "men"
        }

        AssetsManager.loadAsset({
            path: optTypeUrl[type],
            aType: sp.SkeletonData,
        }, (sk) => {
            if (!sk) return
            this.optSpine.skeletonData = sk
            this.optSpine.node.active = true
            this.optSpine.setSkin('default');
            this.optSpine.timeScale = 2
            this.optSpine.setAnimation(track, aniName, false)
        })

        this.optSpine.setCompleteListener(() => {
            // console.log("展示了操作动画==", type, aniName, optTypeUrl[type])
            this.node.destroy()
        });
    },

    /**展示胡牌牌型 */
    showHuType(type, isAni) {
        this.initShow(true);
        // console.log("展示胡牌类型==", type);
        AssetsManager.loadAsset({
            path: huTypeUrl + type,
            aType: cc.SpriteFrame,
            bundle: Enums.bundleType.MHXL
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

    showGuMai(num) {
        this.initShow(true);
        this.nodeGuMai.scale = 1.2;
        this.nodeGuMai.active = true;
        let text_val = this.nodeGuMai.getChildByName("text_val");
        text_val.getComponent(cc.Label).string = !!num ? num + "分" : "不估";
        cc.tween(this.nodeGuMai)
            .to(0.3, {
                scale: 1
            })
            .delay(3)
            .call(() => {
                // this.node.destroy();
            })
            .start();
    },

    showJiPai(type, funs) {
        this.initShow(true);
        let obj = jipaiUrl[type];
        AssetsManager.loadAsset({
            path: obj.url,
            aType: sp.SkeletonData,
            bundle: Enums.bundleType.MHXL
        }, (sk) => {
            if (!sk) return
            this.nodeJiPai.skeletonData = sk;
            this.nodeJiPai.node.active = true;
            this.nodeJiPai.setSkin('default');
            let aniName = !!obj.name ? obj.name : "animation";
            this.nodeJiPai.setAnimation(0, aniName, false);
        })
        this.nodeJiPai.setCompleteListener(() => {
            funs && funs();
            this.node.destroy();
        });
    },

    showJiaoZui(isShow) {
        this.initShow(true);
        this.nodeJiaoZui.active = true;
        this.nodeJiaoZui.getChildByName("spr_ok").active = isShow;
        this.nodeJiaoZui.getChildByName("spr_no").active = !isShow;
    },

    /**展示胡牌的序列 */
    showHuIndex(type, idx, uid, isAni) {
        // console.log("展示胡牌的序列", idx, type);
        this._uid = uid;
        this.initShow(true);
        let endScale = 0.6;
        let index = parseInt(this.node.parent.name.slice(7))
        let name = "hu"
        if (type === ApiMhxl.operateType.HU_ZHI) {
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
            bundle: Enums.bundleType.MHXL
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
        this.scheduleOnce(() => {
            this.node.destroy();
        }, 2);
    },

    /**展示操作时候的得分 */
    showOptScoreAni(score) {
        this.initShow(true);
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