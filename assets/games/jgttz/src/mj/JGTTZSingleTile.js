const Enums = require('../../../../src/const/Enums');
const CCUtil = require('../../../../src/utils/CCUtil');
const AssetsManager = require('../../../../src/utils/AssetsManager');
const MessageCallback = require('../../../../src/utils/MessageCallback');
const JGTTZModel = require("../JGTTZModel")
const ConfigModel = require('../../../../src/model/ConfigModel');

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
        _isNoTouch: false,
        isNoTouch: {
            get() {
                return this._isNoTouch
            },
            set(value) {
                this._isNoTouch = value
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
        this._imgLie = cc.find("img_lie", this.node) //正面
        this._imgCover = cc.find("img_cover", this.node) //背面
        this._mask = cc.find("mask", this.node)
        this._initPos = this.node.getPosition()
        if (!this._imgCover) {
            if (this.node.getComponent(cc.Sprite) && this.node.getComponent(cc.Sprite).spriteFrame.name &&
                this.node.getComponent(cc.Sprite).spriteFrame.name.includes("cover")) {
                this._imgCover = this.node
            }
        }

        this._urlList = {
            /**花色 */
            flower: "",
            /**正面 */
            lie: "",
            /**背面 */
            cover: "",
        }

        if (this._imgCover)
            this._urlList.cover = this._imgCover.getComponent(cc.Sprite).spriteFrame.name.replace(/[0-9]/g, '')
        if (this._imgLie)
            this._urlList.lie = this._imgLie.getComponent(cc.Sprite).spriteFrame.name.replace(/[0-9]/g, '')
        if (this._imgFlower)
            this._urlList.flower = this._imgFlower.getComponent(cc.Sprite).spriteFrame.name.replace(/[0-9]/g, '')



        this.updateBackImage()
    },

    /**更新牌点数 */
    updateFlowerImage() {

        this.node.opacity = 255
        if (this.flower == 60) {
            this.setCover(true)
            return
        }
        if (!cc.isValid(this._imgFlower)) {
            this.setCover(true)
            return
        }
        const url = JGTTZModel.getMahJongFlowerUrl(this._urlList.flower, this.flower);

        let spr = this._imgFlower.getComponent(cc.Sprite);
        AssetsManager.loadSpriteFrame({
            path: url,
            sprite: spr,
            bundle: Enums.bundleType.JGTTZ,
        }, () => {
            this._imgFlower.active = true
        })
        this.setCover(false)
    },

    /**更新牌背 */
    updateBackImage() {
        if (cc.isValid(this._imgLie)) {
            let url = JGTTZModel.getMahJongBackUrl(this._urlList.lie);
            AssetsManager.loadSpriteFrame({
                path: url,
                sprite: this._imgLie.getComponent(cc.Sprite),
                bundle: Enums.bundleType.JGTTZ,
            })
        }

        if (cc.isValid(this._imgCover)) {
            let url = JGTTZModel.getMahJongBackUrl(this._urlList.cover);
            AssetsManager.loadSpriteFrame({
                path: url,
                sprite: this._imgCover.getComponent(cc.Sprite),
                bundle: Enums.bundleType.JGTTZ,
            })
        }
    },

    /**设置牌的位置 */
    updateTilePos(pos) {
        this.node.setPosition(pos)
    },

    /**设置背面显示 */
    setCover(isShow) {
        if (cc.isValid(this._imgCover)) {
            this._imgCover.active = isShow
            if (isShow) {
                this._imgLie.active = false
            } else {
                this._imgLie.active = true
            }
        }
    },

    /**获取背面的图片节点 */
    getCoverNode() {
        if (cc.isValid(this._imgCover)) {
            return this._imgCover
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
    /**设置遮罩 */
    setMaskShow(isShow) {
        if (cc.isValid(this._mask)) {
            this._mask.active = isShow
        }
    },
    /**设置成灰色 */
    setGray(isGray) {
        if (!this._imgLie) return
        const c = isGray ? cc.color(190, 190, 190, 255) : cc.color(255, 255, 255, 255)
        if (c !== this._imgLie.color) {
            this._imgLie.color = c
        }
    },

    /**重置 */
    reset() {

    },
});