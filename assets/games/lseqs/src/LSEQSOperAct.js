const AssetsManager = require('../../../src/utils/AssetsManager');
const ApiLseqs = require('./ApiLseqs');
const Utils = require('../../../src/utils/Utils');
const CCUtil = require('../../../src/utils/CCUtil');
const LSEQSModel = require('./LSEQSModel');

let ANI_NAME_LIST = {
    HU: "Hu", //胡
    CHI: "Chi", //吃
    KAI: "kai",
    DUI: "dui",
    BAYU: "bayu",
}

cc.Class({
    extends: cc.Component,

    properties: {
        optSpine: sp.Skeleton,
        kuaiSprite: cc.Sprite,
    },

    onLoad() { },

    onDestroy() { },

    /**展示操作动画 */
    showOpt(type) {
        this.node.scale = 1.5
        let optList = ApiLseqs.operateType
        let nameKey = Object.keys(optList).find(key => optList[key] === type)
        let aniName = ANI_NAME_LIST[nameKey]
        if (aniName) {
            let checkList = [ApiLseqs.operateType.CHI, ApiLseqs.operateType.DUI, ApiLseqs.operateType.HU]
            if (checkList.includes(type)) {
                aniName += `_${Utils.getRandomNum(1, 2)}`
            }
            // console.log("展示了操作动画==", type, nameKey, aniName)
            this.optSpine.setAnimation(0, aniName, false)
            this.optSpine.setCompleteListener(() => {
                this.node.destroy()
            });
        }
    },

    /**展示几块 */
    showBaKuai(num) {
        this.optSpine.node.active = false
        this.kuaiSprite.node.active = false

        AssetsManager.loadAsset({
            path: "res/sprite/kuai/" + num,
            aType: cc.SpriteFrame,
            bundle: LSEQSModel.getGameType()
        }, (sp) => {
            if (!sp) return
            this.kuaiSprite.spriteFrame = sp
            this.kuaiSprite.node.active = true

            this.kuaiSprite.node.scale = 0
            cc.tween(this.kuaiSprite.node).delay(1).to(0.2, {
                scale: 0.8
            }).delay(2).call(() => {
                this.node.destroy()
            }).start()
        })
    },
});