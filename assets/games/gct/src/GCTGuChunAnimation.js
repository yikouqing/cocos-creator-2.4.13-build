const AssetsManager = require('../../../src/utils/AssetsManager');
const Enums = require('../../../src/const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {
        img_ani: cc.Node,
    },

    /**
     * 显示鼓春字体动画
     * @param isGu 是否鼓春
     */
    showGuchun(isGu) {
        let gname = isGu ? "guchun" : "bugu"
        this.showAni("res/sprite/guchun/" + gname);
    },

    /**
     * 显示拉回来字体动画
     * @param isLa 
     */
    showLa(isLa) {
        let lname = isLa ? "lahuilai" : "bula"
        this.showAni("res/sprite/guchun/" + lname);
    },

    showAni(url) {
        this.img_ani.active = false;
        AssetsManager.loadSpriteFrame({
            path: url,
            bundle: Enums.bundleType.GCT,
            sprite: this.img_ani.getComponent(cc.Sprite)
        });
        this.img_ani.opacity = 0;
        this.img_ani.scale = 0;
        this.img_ani.x = -200;
        this.img_ani.active = true;
        cc.tween(this.img_ani).to(0.2, {
            x: 0,
            opacity: 255,
            scale: 1
        }).delay(1).call(() => {
            this.node.destroy();
        }).start()
    },

});