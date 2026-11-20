const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
let spineInfos = [{
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
}, {
    url: "res/spine/wangzha/WZZD",
    aniName: "animation2",
    premultipliedAlpha: false
},{
    url: "res/spine/sidaierdui/sidaierdui",
    aniName: "sidaierdui",
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
            endFunc && endFunc();
            this.node.destroy();
        }
        if (!spInfo) {
            enddestroy()
            return
        }
        // console.log("展示了动画==", type, spInfo)
        AssetsManager.loadAsset({
            path: spInfo.url,
            aType: sp.SkeletonData,
            bundle: Enums.bundleType.DDZ
        }, (sk) => {
            if (!sk) return
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