const Enums = require('../../../src/const/Enums');
const QZSSSModel = require('./QZSSSModel');
const ApiQzsss = require('./ApiQzsss');
const AssetsManager = require('../../../src/utils/AssetsManager')
const CCUtil = require("../../../src/utils/CCUtil")
const ApiRoom = require('../../../src/api/ApiRoom');

cc.Class({
    extends: cc.Component,

    properties: {
        typeSprite: cc.Sprite,
    },

    onLoad() {
        let type = QZSSSModel.getTeShuType()
        let url = 'res/sprite/cardType/' + type;
        AssetsManager.loadSpriteFrame({
            path: url,
            sprite: this.typeSprite,
            bundle: Enums.bundleType.QZSSS
        });
    },

    /**按钮响应 */
    btnClickCallFunc(event, param) {
        // console.log("按钮响应==", event)
        CCUtil.clickInterval(event.target, 0.5)
        switch (event.target.name) {
            case "btn_qd":
                ApiRoom.gameMessageNotify(ApiQzsss.showCardsNotify(QZSSSModel.getMyHandCard(), 1))
                this.node.destroy()
                break;
            case "btn_qx":
                this.node.destroy()
                break;
        }
    },
});