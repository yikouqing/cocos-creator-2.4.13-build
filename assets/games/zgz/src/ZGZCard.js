const AssetsManager = require('../../../src/utils/AssetsManager');
const MessageCallback = require('../../../src/utils/MessageCallback');
const ConfigModel = require('../../../src/model/ConfigModel');

cc.Class({
    extends: cc.Component,

    properties: {
        //牌的点数
        _flower: null,
        flower: {
            get() {
                return this._flower
            },
            set(value) {
                if (this._flower !== value) {
                    this._flower = value
                    this.updateFlowerImage()
                }
            },
        },
        _isInit: false,
    },

    onLoad() {
        this.init()
        MessageCallback.addListener('UpdateGameCardBg', this);
    },

    onDestroy() {
        MessageCallback.removeListener('UpdateGameCardBg', this);
    },

    messageCallbackHandler(route) {
        if (route === 'UpdateGameCardBg') { //更新牌背
            this.updateBackImage()
        }
    },

    init() {
        if (this._isInit) {
            return
        }
        this._isInit = true
        this._imgFlower = cc.find("img_flower", this.node) //花色
        this._imgCover = cc.find("img_cover", this.node) //背面
        this._imgMust = cc.find("img_must", this.node) //必出
        this._initPos = this.node.getPosition()

        /**兼容处理 */
        if (!this._imgCover) {
            if (this.node.getComponent(cc.Sprite)) {
                this._imgCover = this.node
            }
        }

        this.updateBackImage()
    },

    /**设置必出标记 */
    setMust(isShow) {
        if (cc.isValid(this._imgMust)) {
            this._imgMust.active = isShow
        }
    },

    /**更新牌点数 */
    updateFlowerImage() {
        this.node.opacity = 255
        if (this._flower == 1000) {
            this.setCover(true)
            return
        }
        if (!cc.isValid(this._imgFlower)) {
            this.setCover(true)
            return
        }
        const url = `sprite/cards/${this._flower}`
        // console.log("更新花色", url)
        let spr = this._imgFlower.getComponent(cc.Sprite);
        AssetsManager.loadSpriteFrame({
            path: url,
            sprite: spr,
        }, () => {
            this._imgFlower.active = true
        })
        this.setCover(false)
    },

    /**更新牌背 */
    updateBackImage() {
        if (cc.isValid(this._imgCover)) {
            const url = ConfigModel.getCardUrl();
            // console.log("切换背面=", url)
            AssetsManager.loadSpriteFrame({
                path: url,
                sprite: this._imgCover.getComponent(cc.Sprite),
            })
        }
    },

    /**设置牌的位置 */
    updateNodePos(pos) {
        this.node.setPosition(pos)
    },


    /**设置背面显示 */
    setCover(isShow) {
        if (cc.isValid(this._imgCover)) {
            this._imgCover.active = isShow
        }
    },
    /**设置节点显示 */
    setNodeShow(isShow) {
        this.node.active = isShow
        if (isShow) {
            this.updateBackImage()
        }
    },
    /**设置节点透明度 */
    setNodeOpacity(value) {
        this.node.opacity = value
    },

    /**设置成灰色 */
    setGray(isGray) {
        if (!this._imgFlower) return
        const c = isGray ? cc.color(190, 190, 190, 255) : cc.color(255, 255, 255, 255)
        if (c !== this._imgFlower.color) {
            this._imgFlower.color = c
            return true
        }
        return false
    },

    /**重置 */
    reset() {

    },
});