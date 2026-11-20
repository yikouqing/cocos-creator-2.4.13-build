const Enums = require('../../../../src/const/Enums');
const AssetsManager = require('../../../../src/utils/AssetsManager');
const MessageCallback = require('../../../../src/utils/MessageCallback');
const PTJModel = require("../PTJModel")


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
        /**记录牌移动开始的位置 */
        _beginPos: null,
        /**拖动牌的时候复制的牌 */
        _moveNode: null,
        /**是否禁止点击 */
        _isTouch: false,
        _Select: false,
        isTouch: {
            get() {
                return this._isTouch
            },
            set(value) {
                this._isTouch = value
                if (value) {
                    this.addEvent();
                } else {
                    this.removeEvent();
                }
            },
        },
    },

    onLoad() {
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
        this._imgFlower = cc.find("img_flower", this.node) //花色
        this._imgCover = cc.find("img_cover", this.node) //背面
        this._initPos = this.node.getPosition();
        if (!this._imgCover) {
            if (this.node.getComponent(cc.Sprite) && this.node.getComponent(cc.Sprite).spriteFrame.name &&
                this.node.getComponent(cc.Sprite).spriteFrame.name.includes("cover")) {
                this._imgCover = this.node
            }
        }

        this._urlList = {
            /**花色 */
            flower: "",
            /**背面 */
            cover: "",
        }

        if (this._imgCover)
            this._urlList.cover = this._imgCover.getComponent(cc.Sprite).spriteFrame.name.replace(/[0-9]/g, '')

        if (this._imgFlower)
            this._urlList.flower = this._imgFlower.getComponent(cc.Sprite).spriteFrame.name.replace(/[0-9]/g, '')
        this.updateBackImage()
        this.setNodeSize();
    },

    addEvent() {
        this.node.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
    },
    removeEvent() {
        this.node.off(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
    },

    touchEnd(event) {
        if (!this.isTouch) return;
        this.setSelect(!this._Select);
        cc.systemEvent.emit("selectCard", this);
    },
    /**更新牌点数 */
    updateFlowerImage() {
        this.node.opacity = 255;
        if (!this._imgFlower) return;
        let spr = this._imgFlower.getComponent(cc.Sprite);
        AssetsManager.loadSpriteFrame({
            path: `res/sprite/cardPj/${this.flower}`,
            bundle: Enums.bundleType.PTJ,
            sprite: spr,
        },);
    },

    /**更新牌背 */
    updateBackImage() {
        if (!this._imgCover) return;
        let spr = this._imgCover.getComponent(cc.Sprite);
        AssetsManager.loadSpriteFrame({
            path: `res/sprite/cardPj/${0}`,
            bundle: Enums.bundleType.PTJ,
            sprite: spr,
        },);
    },

    showCover(isShow) {
        this._imgCover.active = isShow;
        // console.log("isShow", isShow, this._imgCover.active)
    },

    /**设置牌的位置 */
    setNodePos(pos) {
        this.node.setPosition(pos)
    },

    setNodeAngle(angle) {
        this.node.setRotation(angle);
    },

    /**获取背面的图片节点 */
    getCoverNode() {
        if (cc.isValid(this._imgCover)) {
            return this._imgCover
        }
    },
    /**设置节点显示 */
    setNodeShow(isShow) {
        this.node.active = isShow;
        if (isShow) {
            this.updateFlowerImage()
        }
    },

    setNodeSize(width = 80, height = 160) {
        this.node.setContentSize(width, height);
    },
    /**设置节点透明度 */
    setNodeOpacity(value) {
        this.node.opacity = value
    },

    setSelect(isSelect) {
        this._Select = isSelect;
        this.node.y = isSelect ? 30 : 0;
    },

    getSelect() {
        return this._Select;
    },



    /**重置 */
    reset() {

    },
});