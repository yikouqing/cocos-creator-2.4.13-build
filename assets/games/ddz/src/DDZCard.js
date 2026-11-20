const MessageCallback = require('../../../src/utils/MessageCallback');
const AssetsManager = require('../../../src/utils/AssetsManager');
const ConfigModel = require('../../../src/model/ConfigModel');
const DDZModel = require('./DDZModel');
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
                    this._flower = value;
                    this.init();
                    this.updateFlowerImage()
                }
            },
        },
        _isInit: false,
    },

    onLoad() {
        this.init();
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
        this._bg = cc.find("bg", this.node)
        this._imgPoint = cc.find("img_point", this.node) //点数
        this._imgColor = cc.find("img_color", this.node) //花色
        this._imgColor1 = cc.find("img_color1", this.node) //大花色
        this._imgJoker = cc.find("img_joker", this.node) //王花色
        this._imgCover = cc.find("img_cover", this.node) //背面
        this._imgMark = cc.find("img_mark", this.node) //背面
        this._imglord = cc.find("img_lord", this.node) //庄家
        this._imglaizi = cc.find("img_laizi", this.node) //赖子
        this._ainmFire = cc.find("ainm_Fire", this.node) //火


        /**兼容处理 */
        if (!this._imgCover && this.node.getComponent(cc.Sprite) && this.node.children.length == 0) {
            this._imgCover = this.node
        }

        this.updateBackImage()
        this.setFire(false);
        this.setGray()
        this._isInit = true
    },


    setFire(isShow) {
        if (cc.isValid(this._ainmFire)) {
            this._ainmFire.active = isShow;
        }
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
            this._imgColor.scale = color == 0 ? 1.1 : 1;
            AssetsManager.loadSpriteFrame({
                path: colorUrl,
                sprite: this._imgColor1.getComponent(cc.Sprite),
            })
        }

        AssetsManager.loadSpriteFrame({
            path: pointUrl,
            sprite: this._imgPoint.getComponent(cc.Sprite),
        })
        this.setLaiZi(false)
        this.setCover(false)
        if (DDZModel.isLaiZiCard(this.flower)) {
            this.updateFlowerLai(this.flower)
        }
    },


    /**更新赖子牌点数 */
    updateFlowerLai(flower) {
        this.init();
        this.flower = flower;
        this.setNodeOpacity(255)
        if (this._flower == 0) {
            this.setCover(true)
            return
        }
        let point = this.getCardPoint();
        let colorUrl = `sprite/puke/lz_tips`
        let pointUrl = `sprite/puke/lz_${point}`;
        let iswang = this.flower == BIGJOKER || this.flower == SMALLJOKER;
        this._imgColor1.active = !iswang;
        this._imgColor.active = !iswang;
        this._imgJoker.active = iswang;
        AssetsManager.loadSpriteFrame({
            path: colorUrl,
            sprite: this._imgColor.getComponent(cc.Sprite),
        })
        AssetsManager.loadSpriteFrame({
            path: colorUrl,
            sprite: this._imgColor1.getComponent(cc.Sprite),
        })
        AssetsManager.loadSpriteFrame({
            path: pointUrl,
            sprite: this._imgPoint.getComponent(cc.Sprite),
        })
        this.setCover(false);
        this.setLaiZi(false);
    },

    /**设置牌的位置 */
    updateNodePos(pos) {
        this.node.setPosition(pos)
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
    /**设置必出标记 */
    setLaiZi(isShow) {
        if (cc.isValid(this._imglaizi)) {
            this._imglaizi.active = isShow;
        }
    },
    /**设置必出标记 */
    setBanker(isShow) {
        if (cc.isValid(this._imglord)) {
            this._imglord.active = isShow;
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
        if (!this._bg) return
        let c = isGray ? cc.color(190, 190, 190, 255) : cc.color(255, 255, 255, 255)
        if (c !== this._bg.color) {
            this._bg.color = c
            return true
        }
        return false
    },
    setMark(isShow) {
        if (cc.isValid(this._imgMark)) {
            this._imgMark.active = isShow
        }
    },

    /**重置 */
    reset() {

    },

    getCardId() {
        return this._flower || 0;
    },

    result(cardId, rest = null) {
        this._last = false;
        this._cardId = cardId;
        if (!this.card) return;
        if (this.banker) this.banker.active = false;
        this.node.active = true;
        AssetsManager.loadSpriteFrame({
            path: `sprite/cards/${cardId}`,
            sprite: this.card
        });
        if (!rest) {
            if (this.mask) this.mask.active = false;
        } else {
            if (this.mask) this.mask.active = rest.indexOf(cardId) != -1;
        }
    },

    gray(checked) {
        if (this._imgMark) this._imgMark.active = checked;
    },
});
