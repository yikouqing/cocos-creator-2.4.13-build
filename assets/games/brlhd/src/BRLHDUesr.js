const AssetsManager = require('../../../src/utils/AssetsManager');
const CCUtil = require("../../../src/utils/CCUtil");
const BRLHDModel = require("./BRLHDModel");
cc.Class({
    extends: cc.Component,

    properties: {
        _isInit: false,
        _showType: -1,
    },


    onLoad() {
        this.initRes()
    },

    /**初始化资源 */
    initRes() {
        if (this._isInit) return;
        this.node.on(cc.Node.EventType.TOUCH_END, this.onHeadClick, this);
        this.spr_Head = this.node.getChildByName("spr_Head").getComponent(cc.Sprite);
        this.text_lose = this.node.getChildByName("text_lose").getComponent(cc.Label);
        this.text_win = this.node.getChildByName("text_win").getComponent(cc.Label);
        this.node_gift = this.node.getChildByName("node_gift");
        this._isInit = true;
    },

    init(user, type) {
        if (!user) return;
        this._uesrData = user;
        this._showType = type;
        // this.txt_name.string = CCUtil.stringClamp(user.userInfo.nickname,6);
        AssetsManager.loadSpriteFrame({
            path: user.userInfo.avatar,
            sprite: this.spr_Head
        });
    },

    getUserData() {
        return this._uesrData;
    },

    getUserType() {
        return this._showType;
    },


    /**点击响应 */
    onHeadClick(event) { },
    reset() {

    },




    // update (dt) {},
});
