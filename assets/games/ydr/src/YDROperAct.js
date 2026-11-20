const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');
const ApiRoom = require('../../../src/api/ApiRoom');
const MessageCallback = require('../../../src/utils/MessageCallback');
const ApiYdr = require('./ApiYdr');
const Utils = require('../../../src/utils/Utils');
const CCUtil = require('../../../src/utils/CCUtil');

let ANI_NAME_LIST = {
    HU: "Hu", //胡
    TUHUO: "TuHuo", //吐火
    SHA: "Sha", //杀
    PENG: "Peng", //碰
    CHI: "Chi", //吃
}

cc.Class({
    extends: cc.Component,

    properties: {
        optSpine: sp.Skeleton,
    },

    onLoad() { },

    onDestroy() { },

    /**展示操作动画 */
    showOpt(type) {
        let optList = ApiYdr.operateType
        let nameKey = Object.keys(optList).find(key => optList[key] === type)
        let aniName = ANI_NAME_LIST[nameKey]
        if (aniName) {
            let checkList = [ApiYdr.operateType.CHI, ApiYdr.operateType.PENG, ApiYdr.operateType.HU]
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
});