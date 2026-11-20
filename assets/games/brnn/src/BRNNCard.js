const AssetsManager = require('../../../src/utils/AssetsManager');
const MessageCallback = require('../../../src/utils/MessageCallback');
const Enums = require('../../../src/const/Enums');
const ConfigModel = require('../../../src/model/ConfigModel');

const BIGJOKER = 79; //大王
const SMALLJOKER = 78; //小王
const COLORLIST = ["r_", "b_", "r_", "b_", "joker_", "joker_"]

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
        this._imgPoint = cc.find("img_point", this.node) //点数
        this._imgColor = cc.find("img_color", this.node) //花色
        this._imgColor1 = cc.find("img_color1", this.node) //大花色
        this._imgJoker = cc.find("img_joker", this.node) //王花色
        this._imgCover = cc.find("img_cover", this.node) //背面
        this._imgMark = cc.find("img_mark", this.node) //背面

        /**兼容处理 */
        if (!this._imgCover) {
            if (this.node.getComponent(cc.Sprite)) {
                this._imgCover = this.node
            }
        }

        this.updateBackImage()
        this.setGray()
    },

    //获取卡牌点数
    getCardPoint() {
        return this.flower % 16;
    },

    //获取卡牌花色
    getCardColor() {
        return parseInt(this.flower / 16);
    },

    /**更新牌点数 */
    updateFlowerImage() {
        this.setNodeOpacity(255)
        if (this._flower == 0) {
            this.setCover(true)
            return
        }
        let color = this.getCardColor()
        let point = this.getCardPoint()
        let pointUrl = `sprite/puke/${COLORLIST[color]}${point}`
        let iswang = this.flower == BIGJOKER || this.flower == SMALLJOKER
        this._imgColor1.active = !iswang
        this._imgColor.active = !iswang
        this._imgJoker.active = iswang

        let colorUrl = `sprite/puke/color_${color}`
        if (iswang) {
            colorUrl = `sprite/puke/color_${point}`
            AssetsManager.loadSpriteFrame({
                path: colorUrl,
                sprite: this._imgJoker.getComponent(cc.Sprite),
            })
        } else {
            AssetsManager.loadSpriteFrame({
                path: colorUrl,
                sprite: this._imgColor.getComponent(cc.Sprite),
            })
            AssetsManager.loadSpriteFrame({
                path: colorUrl,
                sprite: this._imgColor1.getComponent(cc.Sprite),
            })
        }

        AssetsManager.loadSpriteFrame({
            path: pointUrl,
            sprite: this._imgPoint.getComponent(cc.Sprite),
        })

        this.setCover(false)
    },

    /**更新牌背 */
    updateBackImage() {
        if (cc.isValid(this._imgCover)) {
            const url = ConfigModel.getCardUrl();
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
    setGray(isGray = false) {
        if (cc.isValid(this._imgMark)) {
            this._imgMark.active = isGray
        }
    },

    /**重置 */
    reset() {

    },
});