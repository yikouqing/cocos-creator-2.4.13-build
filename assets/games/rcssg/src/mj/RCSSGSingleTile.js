const Enums = require('../../../../src/const/Enums');
const CCUtil = require('../../../../src/utils/CCUtil');
const AssetsManager = require('../../../../src/utils/AssetsManager');
const MessageCallback = require('../../../../src/utils/MessageCallback');
const RCSSGModel = require('../RCSSGModel');
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
        /**换三张序列 */
        _huanIdx: 0,
        huanIdx: {
            get() {
                return this._huanIdx
            },
            set(value) {
                this._huanIdx = value
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
        this._imgLie = cc.find("img_lie", this.node); //正面
        this._imgHu = cc.find("img_hu", this.node); //胡牌指示器
        this._imgLack = cc.find("img_lack", this.node); //缺牌标记
        this._imgBai = cc.find("img_bai", this.node); //摆牌标记
        this._imgGhost = cc.find("img_ghost", this.node); //鬼牌标记
        this._imgGhostMark = cc.find("img_ghost_mark", this.node); //鬼牌标记
        this._imgCover = cc.find("img_cover", this.node); //背面
        this._imgTing = cc.find("img_ting", this.node); //听牌标记
        this._mask = cc.find("mask", this.node);
        this._initPos = this.node.getPosition();

        if (!this._imgCover) {
            if (this.node.getComponent(cc.Sprite) && this.node.getComponent(cc.Sprite).spriteFrame.name &&
                this.node.getComponent(cc.Sprite).spriteFrame.name.includes("cover")) {
                this._imgCover = this.node;
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
        this.setGhostIcon(false);
        this.setLackIcon(false);
        this.setHuIcon(false);
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
        if (!this._moveNode || !cc.isValid(root)) {
            this._moveNode = cc.instantiate(this.node)
            this._moveNode.name = "moveNode";
            let pos = CCUtil.postionConvert(this.node, root);
            this._moveNode.setPosition(pos);
            this._moveNode.parent = root;
            this._moveNode.scale = CCUtil.getHandCardScale(13)
        }
        let touch = event.touch;
        let item = cc.v2(touch.getLocation().x, touch.getLocation().y);
        let deltaMove = item.sub(touch.getStartLocation());
        if (this._moveNode && cc.isValid(this._moveNode)) {
            this._moveNode.setPosition(
                this._beginPos.x + deltaMove.x,
                this._beginPos.y + deltaMove.y
            );
        }
    },

    touchEnd(event) {
        if (!this.isTouch) return;
        this.deleteMoveNode();
        let touch = event.touch;
        let item = cc.v2(touch.getLocation().x, touch.getLocation().y);
        let deltaMove = item.sub(touch.getStartLocation());
        let deltaMoveY = Math.abs(deltaMove.y);
        if (RCSSGModel.canDiscard(deltaMoveY >= 120)) {
            /**出牌 */
            cc.systemEvent.emit("discard", this)
        } else {
            /**发送选中牌 */
            cc.systemEvent.emit("chooseCard", this)
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
        const url = ConfigModel.getMahJongFlowerUrl(this._urlList.flower, this.flower);
        let spr = this._imgFlower.getComponent(cc.Sprite);
        AssetsManager.loadSpriteFrame({
            path: url,
            sprite: spr,
        }, () => {
            this._imgFlower.active = true
        })
        this.setCover(false)
        /**设置鬼牌标记 */
        let g = RCSSGModel.getGhostCard();
        this.setGhostIcon(g == this._flower)
    },

    /**更新牌背 */
    updateBackImage() {
        if (cc.isValid(this._imgLie)) {
            let url = ConfigModel.getMahJongBackUrl(this._urlList.lie);
            // console.log("切换正面=", url)
            AssetsManager.loadSpriteFrame({
                path: url,
                sprite: this._imgLie.getComponent(cc.Sprite),
            })
        }

        if (cc.isValid(this._imgCover)) {
            let url = ConfigModel.getMahJongBackUrl(this._urlList.cover);
            // console.log("切换背面=", url)
            AssetsManager.loadSpriteFrame({
                path: url,
                sprite: this._imgCover.getComponent(cc.Sprite),
            })
        }
    },

    /**设置牌的位置 */
    updateTilePos(pos) {
        this.node.setPosition(pos)
    },

    /**设置鬼牌标记 */
    setGhostIcon(isShow) {
        if (cc.isValid(this._imgGhost)) {
            this._imgGhost.active = isShow;
        }
        if (cc.isValid(this._imgGhostMark)) {
            this._imgGhostMark.active = isShow;
            this._imgGhostMark.active = false;
        }
    },

    /**设置缺牌标记 */
    setLackIcon(isShow) {
        if (cc.isValid(this._imgLack)) {
            this._imgLack.active = isShow
        }
    },

    /**设置胡牌标记 */
    setHuIcon(isShow) {
        if (cc.isValid(this._imgHu)) {
            this._imgHu.active = isShow
        }
    },

    /**设置听牌标记 */
    setTingIcon(isShow) {
        if (cc.isValid(this._imgTing)) {
            this._imgTing.active = isShow
        }
    },

    /**设置背面显示 */
    setCover(isShow) {
        if (cc.isValid(this._imgCover)) {
            this._imgCover.active = isShow
            if (isShow) {
                this._imgLie.active = false
                this.setGhostIcon(false)
                this.setLackIcon(false)
                this.setHuIcon(false)
            } else {
                this._imgLie.active = true
            }
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

    deleteMoveNode() {
        if (cc.isValid(this._moveNode)) {
            this._moveNode.destroy()
            this._moveNode = null
        }
    },

    /**重置 */
    reset() {
        this.setMaskShow(false);
        this.setGray(false);
        this.setHuIcon(false);
        this.setLackIcon(false);
        this.setGhostIcon(false);
        this.setTingIcon(false);
        this.setBaiPaiIcon(false)
    },

    /**
     * 摸牌和发牌动画
     * @param {number} dt 延迟时间
     */
    runTileAnimate(dt = 0) {
        cc.tween(this.node).stop();
        this.node.y = 100;
        this.node.active = true;
        this.node.opacity = 0;
        cc.tween(this.node)
            .delay(dt)
            .to(0.1, {
                y: 0,
                opacity: 255
            }).start()
    },

    /**设置摆牌标记 */
    setBaiPaiIcon(isShow) {
        isShow = false;
        if (cc.isValid(this._imgBai)) {
            this._imgBai.active = isShow
        }
    },

});