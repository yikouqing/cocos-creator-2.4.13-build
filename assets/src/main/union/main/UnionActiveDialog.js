const AssetsManager = require('../../../utils/AssetsManager')
const CCUtil = require('../../../utils/CCUtil');
const Configs = require('../../../const/Configs');
const ConfigModel = require('../../../model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        content: cc.Node
    },

    // use this for initialization
    onLoad() {
        let imgArr = JSON.parse(ConfigModel.getData("unionActiveImgArr") || "[]");
        // console.log(imgArr)
        for (let i = 0; i < imgArr.length; ++i) {
            let spriteNode = AssetsManager.createSpriteNode({
                path: ConfigModel.getUrl('ftps') + "/" + imgArr[i]
            });
            //let spriteNode = CCUtil.createSpriteNode("111");
            spriteNode.width = 500;
            spriteNode.height = 700;
            spriteNode.getComponent(cc.Sprite).sizeMode = cc.Sprite.SizeMode.CUSTOM;
            spriteNode.parent = this.content;
        }
    },

    onBtnClk(event, param) {

        switch (param) {
            case 'close':
                if (this.node.getComponent('DialogWidgetCtrl')) {
                    this.node.getComponent('DialogWidgetCtrl').out();
                } else {
                    this.node.destroy();
                }
                break;
        }
    }

    // called every frame, uncomment this function to activate update callback
    // update (dt) {

    // },
});