const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const Utils = require('../../../src/utils/Utils');

const spineInfos = [{
    url: "res/spine/shunzi/shunzi",
    aniName: "shunzi",
    premultipliedAlpha: true
}, {
    url: "res/spine/liandui/liandui",
    aniName: "liandui",
    premultipliedAlpha: true
}, {
    url: "res/spine/sanzhang/sanzhang",
    aniName: "sanzhang",
    premultipliedAlpha: true
}, {
    url: "res/spine/sandaiyi/sandaiyi",
    aniName: "sandaiyi",
    premultipliedAlpha: true
}, {
    url: "res/spine/sandaier/sandaier",
    aniName: "sandaier",
    premultipliedAlpha: true
}, {
    url: "res/spine/feiji/feiji",
    aniName: "feiji",
    premultipliedAlpha: false
}, {
    url: "res/spine/feijidaichibang/feijidaichibang",
    aniName: "feiji",
    premultipliedAlpha: false
}, {
    url: "res/spine/sidaiyi/sidaiyi",
    aniName: "sidaiyi",
    premultipliedAlpha: true
}, {
    url: "res/spine/sidaier/sidaier",
    aniName: "sidaier",
    premultipliedAlpha: true
}, {
    url: "res/spine/sidaisan/sidaisan",
    aniName: "sidaisan",
    premultipliedAlpha: true
}, {
    url: "res/spine/zhadan/zhadan",
    aniName: "zhadan",
    premultipliedAlpha: true
}, {
    url: "res/spine/chuntian/spring_1",
    aniName: "spring",
    premultipliedAlpha: false
},]

cc.Class({
    extends: cc.Component,

    properties: {
        optSpine: sp.Skeleton,
    },

    /**展示操作动画 */
    showOptAni(type, timeScale = 1) {
        this.optSpine.node.active = false
        let spInfo = spineInfos[type]
        if (!spInfo) {
            return
        }
        // console.log("展示了动画==", type, spInfo)
        AssetsManager.loadAsset({
            path: spInfo.url,
            aType: sp.SkeletonData,
            bundle: Enums.bundleType.ZLM
        }, (sk) => {
            if (!sk) return
            this.optSpine.skeletonData = sk
            this.optSpine.node.active = true
            this.optSpine.premultipliedAlpha = spInfo.premultipliedAlpha
            this.optSpine.setAnimation(0, spInfo.aniName, false)
            this.optSpine.timeScale = timeScale
        })

        this.optSpine.setCompleteListener(() => {
            this.node.destroy()
        });
    },

});