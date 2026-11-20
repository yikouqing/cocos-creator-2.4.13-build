const Enums = require('../../../../src/const/Enums');
const CCUtil = require('../../../../src/utils/CCUtil');
const AssetsManager = require('../../../../src/utils/AssetsManager');
const MessageCallback = require('../../../../src/utils/MessageCallback');
const ConfigModel = require('../../../../src/model/ConfigModel');
const YDRModel = require('../YDRModel');

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
                    this._flower = value;
                    this.updateFlowerImage();
                }
            },
        },
        /**记录牌移动开始的位置 */
        _beginPos: null,
        /**拖动牌的时候复制的牌 */
        _moveNode: null,
        /**是否点击 */
        _isTouch: false,
        isTouch: {
            get() {
                return this._isTouch
            },
            set(value) {
                this._isTouch = value
            },
        },
        /**是否灰色 */
        _isGray: false,
        isGray: {
            get() {
                return this._isGray
            },
            set(value) {
                this._isGray = value
                this.setGray(value)
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
        this._imgFlower = cc.find("img_flower", this.node); //花色
        this._imgCover = cc.find("img_cover", this.node); //背面
        this._imgMask = cc.find("img_mask", this.node); //遮罩
        this._imgLight = cc.find("img_light", this.node)
        this._imgHu = cc.find("img_hu", this.node)
        this._initPos = this.node.getPosition();

        if (!this._imgCover) {
            if (this.node.getComponent(cc.Sprite) && this.node.getComponent(cc.Sprite).spriteFrame.name &&
                this.node.getComponent(cc.Sprite).spriteFrame.name.includes("card_back")) {
                this._imgCover = this.node;
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
        this.updateBackImage();
    },

    setTouchListener() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.touchEnd, this);
    },

    /**触摸响应 */
    touchStart() {
        if (!this.isTouch) return;
        this.deleteMoveNode()
        this._beginPos = CCUtil.postionConvert(this.node, AssetsManager.root)
    },

    touchMove(event) {
        if (!this.isTouch) return;
        let root = AssetsManager.getRoot();
        let moveCard = YDRModel.getMoveCard();
        if (!moveCard) return;
        if (cc.isValid(root)) {
            if (!this._moveNode || !cc.isValid(this._moveNode)) {
                this._moveNode = cc.instantiate(moveCard)
                let com = this._moveNode.addComponent("YDRCard")
                com.init()
                com.flower = this.flower
                this._moveNode.name = "moveNode";
                let pos = CCUtil.postionConvert(this.node, root);
                this._moveNode.setPosition(pos);
                this._moveNode.parent = root;
                this._moveNode.scale = 1.2
                let touch = event.touch;
                let item = cc.v2(touch.getLocation().x, touch.getLocation().y);
                let deltaMove = item.sub(touch.getStartLocation());
                this._moveNode.setPosition(
                    this._beginPos.x + deltaMove.x,
                    this._beginPos.y + deltaMove.y
                );
            } else {
                let touch = event.touch;
                let item = cc.v2(touch.getLocation().x, touch.getLocation().y);
                let deltaMove = item.sub(touch.getStartLocation());
                if (this._moveNode && cc.isValid(this._moveNode)) {
                    this._moveNode.setPosition(
                        this._beginPos.x + deltaMove.x,
                        this._beginPos.y + deltaMove.y
                    );
                }
            }
        }
    },

    touchEnd(event) {
        if (!this.isTouch) return;
        this.deleteMoveNode();
        let touch = event.touch;
        let item = cc.v2(touch.getLocation().x, touch.getLocation().y);
        // let deltaMove = item.sub(touch.getStartLocation());
        // let deltaMoveY = Math.abs(deltaMove.y);
        if (item.y >= 400) {
            /**出牌 */
            cc.systemEvent.emit("discard", this)
        }
    },

    /**更新牌点数 */
    updateFlowerImage() {
        this.node.opacity = 255
        if (this._flower == 0) {
            this.setCover(true);
            return
        }
        if (!cc.isValid(this._imgFlower)) {
            this.setCover(true)
            return
        }
        const url = ConfigModel.getZiPaiFlowerUrl(this._urlList.flower, this.flower);
        let spr = this._imgFlower.getComponent(cc.Sprite);
        this._imgFlower.active = false
        AssetsManager.loadSpriteFrame({
            path: url,
            sprite: spr
        }, () => {
            this._imgFlower.active = true
        })
        this.setCover(false)
    },

    /**更新牌背 */
    updateBackImage() {
        if (cc.isValid(this._imgCover)) {
            // let url = ConfigModel.getZiPaiBackUrl(this._urlList.cover);
            // // console.log("切换背面=", url)
            // AssetsManager.loadSpriteFrame({
            //     path: url,
            //     sprite: this._imgCover.getComponent(cc.Sprite)
            // })
        }
    },

    /**设置牌光圈 */
    setSelfLight(isShow = false) {
        if (cc.isValid(this._imgLight)) {
            this._imgLight.active = isShow
        }
    },

    /**设置牌的位置 */
    updateTilePos(pos) {
        this.node.setPosition(pos)
    },

    /**设置胡牌标记 */
    setHuIcon(isShow) {
        if (cc.isValid(this._imgHu)) {
            this._imgHu.active = isShow
        }
    },

    /**设置背面显示 */
    setCover(isShow) {
        if (cc.isValid(this._imgCover)) {
            this._imgCover.active = isShow
        }
    },

    /**设置节点显示 */
    setNodeShow(isShow) {
        this.node.active = isShow;
        if (!isShow) return;
        this.updateBackImage();
    },

    /**设置节点透明度 */
    setNodeOpacity(value) {
        this.node.opacity = value
    },

    /**设置成灰色 */
    setGray(isGray) {
        if (!this._imgLie) return
        const c = isGray ? cc.color(190, 190, 190, 255) : cc.color(255, 255, 255, 255)
        if (c !== this._imgLie.color) {
            this._imgLie.color = c
        }
    },

    /**设置遮罩 */
    setMask(isShow) {
        if (cc.isValid(this._imgMask)) {
            this._imgMask.active = isShow
        }
    },

    deleteMoveNode() {
        if (cc.isValid(this._moveNode)) {
            this._moveNode.destroy()
            this._moveNode = null
        }
    },

    /**重置 */
    reset() {
        this.setMaskShow(false);
        this.setSelfLight(false)
    },

    /**设置摆牌标记 */
    setBaiPaiIcon(isShow) {
        if (cc.isValid(this._imgBai)) {
            this._imgBai.active = isShow
        }
    },

});