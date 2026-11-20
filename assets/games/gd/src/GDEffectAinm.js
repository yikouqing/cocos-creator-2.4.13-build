const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
let spineInfos = [
    {
        url: "res/spine/shunzi/shunzi",
        aniName: "shunzi",
        premultipliedAlpha: true
    },
    {
        url: "res/spine/liandui/liandui",
        aniName: "liandui",
        premultipliedAlpha: true
    },
    {
        url: "res/spine/sanzhang/sanzhang",
        aniName: "sanzhang",
        premultipliedAlpha: true
    },
    {
        url: "res/spine/sandaier/sandaier",
        aniName: "sandaier",
        premultipliedAlpha: true
    },
    {
        url: "res/spine/gangban/gangban",
        aniName: "animation",
        premultipliedAlpha: false
    },
    {
        url: "res/spine/tonghuashun/tonghuashun",
        aniName: "tonghuashun",
        premultipliedAlpha: false
    },
    {
        url: "res/spine/zhadan/zhadan",
        aniName: "zhadan",
        premultipliedAlpha: true
    },
    {
        url: "res/spine/wangzha/WZZD",
        aniName: "animation2",
        premultipliedAlpha: false
    }
]

cc.Class({
    extends: cc.Component,

    properties: {
        optSpine: sp.Skeleton,
    },

    /**展示操作动画 */
    showOptAni(type, endFunc, timeScale = 1) {
        this.optSpine.node.active = false;
        let spInfo = spineInfos[type];
        let enddestroy = () => {
            if (endFunc) {
                endFunc(this.node);
            } else {
                this.node.destroy();
            }
        }
        if (!spInfo) {
            enddestroy()
            return
        }
        // console.log("展示了动画==", type, spInfo)
        AssetsManager.loadAsset({
            path: spInfo.url,
            aType: sp.SkeletonData,
            bundle: Enums.bundleType.GD
        }, (sk) => {
            if (!sk) return
            this.node.active = true;
            this.optSpine.skeletonData = sk
            this.optSpine.node.active = true
            this.optSpine.premultipliedAlpha = spInfo.premultipliedAlpha
            this.optSpine.setAnimation(0, spInfo.aniName, false)
            this.optSpine.timeScale = timeScale

        })

        this.optSpine.setCompleteListener(enddestroy);
        this.scheduleOnce(enddestroy, 5);
    },

});