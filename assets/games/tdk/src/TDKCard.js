const ConfigModel = require('../../../src/model/ConfigModel');
const AssetsManager = require('../../../src/utils/AssetsManager');
const MessageCallback = require('../../../src/utils/MessageCallback');

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
        this._imgMa = cc.find("img_ma", this.node)
        this._initPos = this.node.getPosition()
        this._isMapai = false

        /**兼容处理 */
        if (!this._imgCover) {
            if (this.node.getComponent(cc.Sprite)) {
                this._imgCover = this.node
            }
        }

        this.updateBackImage()
    },

    /**设置马牌标记 */
    setMaIcon(isShow) {
        // if (cc.isValid(this._imgMa)) {
        //     this._imgMa.active = isShow
        // }
        if (!this._imgFlower) return
        const c = isShow ? cc.color(240, 255, 0, 255) : cc.color(255, 255, 255, 255)
        if (c !== this._imgFlower.color) {
            this._imgFlower.color = c
        }
    },

    /**更新牌点数 */
    updateFlowerImage() {
        this.setNodeOpacity(255)
        if (this._flower == 0) {
            this.setCover(true)
            return
        }
        if (!cc.isValid(this._imgFlower)) {
            this.setCover(true)
            return
        }

        const url = `sprite/cards/${this._flower}`
        // console.log("更新花色", url, this.flower)
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
    /**设置牌的角度 */
    updateNodeAngle(a) {
        this.node.angle = a
    },

    /**设置背面显示 */
    setCover(isShow) {
        if (cc.isValid(this._imgCover)) {
            this._imgCover.active = isShow
        }
        if (cc.isValid(this._imgFlower)) {
            this._imgFlower.active = !isShow
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
    /**设置节点缩放 */
    setNodeScale(value) {
        this.node.scale = value
    },

    /**设置成灰色 */
    setGray(isGray) {
        let materialName = isGray ? '2d-gray-sprite' : '2d-sprite';
        let material = cc.Material.getBuiltinMaterial(materialName);
        if (this._imgFlower) {
            let sprite = this._imgFlower.getComponent(cc.Sprite)
            sprite.setMaterial(0, material);
        }
        if (this._imgCover) {
            let sprite = this._imgCover.getComponent(cc.Sprite)
            sprite.setMaterial(0, material);
        }
    },

    /**重置 */
    reset() {
        this.setGray(false)
    },
});