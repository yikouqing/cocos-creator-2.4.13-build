const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const Utils = require('../../../src/utils/Utils');

let spineInfos = [
    {},
    {
        url: "res/spine/zhadan/zhadan",
        aniName: "zhadan",
        premultipliedAlpha: true
    },
    {
        url: "res/spine/wangzha/WZZD",
        aniName: "animation2",
        premultipliedAlpha: true
    },
]

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
            bundle: Enums.bundleType.ZGZ
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