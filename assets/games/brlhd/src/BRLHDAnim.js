const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const BRLHDModel = require("./BRLHDModel");
const AinmConfig = [];
AinmConfig[BRLHDModel.AinmType.Vs] = { url: "res/spine/vs/vs", name: "vs" }
AinmConfig[BRLHDModel.AinmType.Wait] = { url: "res/spine/wait/waiting", name: "waiting" }
AinmConfig[BRLHDModel.AinmType.KSXZ] = { url: "res/spine/xiazhu/lhd_xz", name: "ksxz", }
AinmConfig[BRLHDModel.AinmType.TZXZ] = { url: "res/spine/xiazhu/lhd_xz", name: "tzxz", }

cc.Class({
    extends: cc.Component,

    properties: {
        node_Spine: sp.Skeleton,
    },

    start() {
        this.reset();
    },

    reset() {
        this.node.active = false;
        this.node.children.forEach((node) => {
            node.active = false;
        })
    },

    showSpine(type, funs) {
        this.reset();
        let obj = AinmConfig[type];
        // console.log(type, "动画===obj", obj)
        obj && AssetsManager.loadAsset({
            bundle: Enums.bundleType.BRLHD,
            aType: sp.SkeletonData,
            path: obj.url,
        }, (sk) => {
            if (!sk) return
            this.node.active = true;
            this.node_Spine.active = true;
            this.node_Spine.skeletonData = sk;
            this.node_Spine.node.active = true;
            this.node_Spine.setSkin('default');
            let animName = !!obj.name ? obj.name : "animation";
            this.node_Spine.setAnimation(0, animName, false);
            this.node_Spine.setCompleteListener(() => {
                funs && funs();
                this.reset();
            });
        })
    },
});
