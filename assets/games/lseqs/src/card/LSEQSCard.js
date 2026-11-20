const Enums = require('../../../../src/const/Enums');
const CCUtil = require('../../../../src/utils/CCUtil');
const AssetsManager = require('../../../../src/utils/AssetsManager');
const MessageCallback = require('../../../../src/utils/MessageCallback');
const ConfigModel = require('../../../../src/model/ConfigModel');
const LSEQSModel = require('../LSEQSModel');

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
                this._flower = value;
                this.updateFlowerImage();
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
        _layIdx: 0,
        layIdx: {
            get() {
                return this._layIdx
            },
            set(value) {
                this._layIdx = value
            },
        },
        _cardIdx: 0,
        cardIdx: {
            get() {
                return this._cardIdx
            },
            set(value) {
                this._cardIdx = value
            },
        }
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
        this._imgPoint1 = cc.find("img_point1", this.node); //花色
        this._imgPoint2 = cc.find("img_point2", this.node); //花色
        this._imgCover = cc.find("img_cover", this.node); //背面
        this._imgMask = cc.find("img_mask", this.node); //遮罩
        this._imgLight = cc.find("img_light", this.node)
        this._imgHu = cc.find("img_hu", this.node)

        this._imgQuan = cc.find("img_quan", this.node);
        this._imgJiao = cc.find("img_jiao", this.node);
        this._imgYu = cc.find("img_yu", this.node);
        this._txt_huCount = cc.find("img_countBg/txt_huCount", this.node);

        this._initPos = this.node.getPosition();

        if (!this._imgCover) {
            if (this.node.getComponent(cc.Sprite) && this.node.getComponent(cc.Sprite).spriteFrame.name &&
                this.node.getComponent(cc.Sprite).spriteFrame.name.includes("card_back")) {
                this._imgCover = this.node;
            }
        }

        this.updateBackImage();
    },

    setTouchListener() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.touchEnd, this);
    },

    removeTouchListener() {
        this.node.off(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.touchEnd, this);
    },

    /**触摸响应 */
    touchStart() {
        if (!this.isTouch) return;
        this.deleteMoveNode()
        this._beginPos = CCUtil.postionConvert(this.node, AssetsManager.getRoot())
    },

    touchMove(event) {
        if (!this.isTouch) return;
        let root = AssetsManager.getRoot();
        // let moveCard = LSEQSModel.getMoveCard();
        // if (!moveCard) return;
        if (cc.isValid(root)) {
            if (!this._moveNode || !cc.isValid(this._moveNode)) {
                this._moveNode = cc.instantiate(this.node)
                this._moveNode.removeComponent("LSEQSCard")
                let com = this._moveNode.addComponent("LSEQSCard")
                com.init()
                com.flower = this.flower
                com.setNodeOpacity(180)
                com.setHuCount(0, false)
                this._moveNode.name = "moveNode";
                let pos = CCUtil.postionConvert(this.node, root);
                this._moveNode.setPosition(pos);
                this._moveNode.parent = root;
                this._moveNode.scale = this.node.parent.parent.scale;
                let touch = event.touch;
                let item = cc.v2(touch.getLocation().x, touch.getLocation().y);
                let deltaMove = item.sub(touch.getStartLocation());
                this._moveNode.setPosition(
                    this._beginPos.x + deltaMove.x,
                    this._beginPos.y + deltaMove.y
                );
                let jiaoList = LSEQSModel.getJiaoList();
                if (jiaoList.includes(this._flower)) {
                    /**显示听牌提示 */
                    cc.systemEvent.emit(LSEQSModel.MSG_SHOW_TING_TIPS, this._flower)
                }
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
        if (cc.isValid(this._moveNode)) {
            let touch = event.touch;
            let item = cc.v2(touch.getLocation().x, touch.getLocation().y);

            if (item.y >= 550 && LSEQSModel.getIsMyTurn()) {
                /**出牌 */
                cc.systemEvent.emit("discard", this)
            } else {
                cc.systemEvent.emit("moveEnd", this._moveNode.getPosition(), this)
            }
        }
        this.deleteMoveNode();
    },

    /**更新牌点数 */
    updateFlowerImage() {
        this.node.opacity = 255
        if (this._flower == 0) {
            this.setCover(true);
            return
        }
        if (!cc.isValid(this._imgPoint1)) {
            this.setCover(true)
            return
        }
        const url = "res/sprite/card/point/" + this._flower

        let showPoint = (node) => {
            if (!cc.isValid(node)) {
                return
            }
            let spr = node.getComponent(cc.Sprite);
            node.active = false
            AssetsManager.loadSpriteFrame({
                path: url,
                sprite: spr,
                bundle: LSEQSModel.getGameType()
            }, () => {
                node.active = true
            })
        }
        showPoint(this._imgPoint1)
        showPoint(this._imgPoint2)

        this.setCover(false)
        this.setQuan(LSEQSModel.getIsQuanPai(this._flower))
    },

    /**更新牌背 */
    updateBackImage() {
        if (cc.isValid(this._imgCover)) {
            // let url = ""
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
            cc.systemEvent.emit(LSEQSModel.MSG_HIDE_TING_TIPS)
        }
    },

    /**重置 */
    reset() {
        this.setSelfLight(false)
        this.setJiao(false)
        this.setYu(false)
        this.setQuan(false)
        this.setHuCount(0, false)
    },

    setQuan(isShow) {
        if (cc.isValid(this._imgQuan)) {
            this._imgQuan.active = isShow;
        }
    },

    setJiao(isShow) {
        if (cc.isValid(this._imgJiao)) {
            this._imgJiao.active = isShow;
        }
    },

    getJiaoIsShow() {
        if (!cc.isValid(this._imgJiao)) return false;
        return this._imgJiao.active
    },

    setYu(isShow) {
        if (cc.isValid(this._imgYu)) {
            this._imgYu.active = isShow;
        }
    },

    setHuCount(count, isShow) {
        if (cc.isValid(this._txt_huCount)) {
            this._txt_huCount.parent.active = isShow;
            this._txt_huCount.getComponent(cc.Label).string = count + "胡";
        }
    },
});