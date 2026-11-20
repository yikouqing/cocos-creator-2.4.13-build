const AssetsManager = require('../../../../src/utils/AssetsManager');
const Enums = require('../../../../src/const/Enums');
const ApiJgttz = require('../ApiJgttz');
const ApiRoom = require('../../../../src/api/ApiRoom');
const CCUtil = require('../../../../src/utils/CCUtil');

cc.Class({
    extends: cc.Component,

    properties: {
        liePfb: cc.Prefab, //平摊的牌
        lieLayout: cc.Node,

        /**本地位置号 */
        _idx: null,
        /**手牌脚本列表 */
        _lieTileList: null,
        /**手牌id列表 */
        _tileIdList: null,
        _cardTypeNode: null,
    },


    onDestroy() { },

    /**初始化 */
    init(idx) {
        if (this._idx == null) {
            this._idx = idx
        } else {
            // console.log("已经初始化过了", this._idx)
            return
        }

        this._cardTypeNode = cc.find("cardType", this.node)
        this._cardTypePos = cc.find("cardType", this.node).getPosition()

        this._lieTileList = []
        this._tileIdList = []
        let poslist = [cc.v2(-50, 0), cc.v2(50, 0)]
        if (this._idx == 1 || this._idx == 2) {
            poslist = [cc.v2(50, 0), cc.v2(-50, 0)]
        }
        for (let i = 0; i < 2; i++) {
            let lie = cc.instantiate(this.liePfb)
            let lcom = lie.addComponent('JGTTZSingleTile')
            lcom.init()
            lcom.setNodeShow(false)
            this._lieTileList.push(lcom)
            lie.name = i + ""
            lie.parent = this.lieLayout
            lie.setPosition(poslist[i])
        }
    },

    /**获取第一张牌 */
    getFirstTile() {
        return this._lieTileList[0].getCoverNode()
    },

    /**
     * 刷新摊开的牌
     * @param {Array} tileArr 手牌数组
     */
    updateLieTiles(tileArr = [], isAni = false) {
        // console.log('手牌数据',tileArr);
        this._tileIdList = tileArr
        this.lieLayout.active = true
        this.node.active = true

        if (this._idx == 1 || this._idx == 2) {
            if (tileArr.includes(0)) {
                tileArr.sort((a, b) => a - b)
            } else
                tileArr.sort((a, b) => b - a)
        } else {
            if (tileArr.includes(0)) {
                tileArr.sort((a, b) => b - a)
            } else
                tileArr.sort((a, b) => a - b)
        }


        for (let i = 0; i < this._lieTileList.length; i++) {
            const com = this._lieTileList[i];
            const t = tileArr[i];
            com.flower = t
            com.setNodeShow(true)
            com.setNodeOpacity(255)
            com.node.scale = 1
            com.node.stopAllActions()
        }
        if (isAni) {
            for (let i = 0; i < this._lieTileList.length; i++) {
                const com = this._lieTileList[i];
                com.setCover(true)
                cc.tween(com.node).to(0.1, {
                    scaleX: 0
                }).call(() => {
                    com.setCover(false)
                    AssetsManager.playEffect({
                        path: "res/audio/main/showCard",
                        bundle: Enums.bundleType.JGTTZ
                    });
                }).to(0.1, {
                    scaleX: 1
                }).start()
            }
        }
    },

    /**展示牌型 */
    showCardType(info = null, isAni = false) {
        if (!info) {
            this._cardTypeNode.active = false
            return
        }
        let url = "res/sprite/cardType/" + info.type
        let audioUrl = "res/audio/woman/" + info.type
        if (info.type == ApiJgttz.cardType.DIAN || info.type == ApiJgttz.cardType.DUI_ZI) {
            url += "_" + info.point
            audioUrl += "_" + info.point
        }
        // console.log("展示了牌型==", isAni, url)
        AssetsManager.loadSpriteFrame({
            path: url,
            sprite: this._cardTypeNode.getComponent(cc.Sprite),
            bundle: Enums.bundleType.JGTTZ,
        })
        this._cardTypeNode.stopAllActions()
        this._cardTypeNode.active = true
        if (isAni) {
            let offSetX = -200
            if (this._idx == 1 || this._idx == 2) {
                offSetX = 200
            }
            this._cardTypeNode.x += offSetX
            this._cardTypeNode.opacity = 0
            this._cardTypeNode.scale = 0.2
            cc.tween(this._cardTypeNode).to(0.3, {
                position: this._cardTypePos,
                opacity: 255,
                scale: 0.7,
            }).start()
            /**没有男声 */

            AssetsManager.playEffect({
                path: audioUrl,
                bundle: Enums.bundleType.JGTTZ
            });
            // console.log("播放聲音==", audioUrl)
        } else {
            this._cardTypeNode.opacity = 255
            this._cardTypeNode.scale = 0.7
            this._cardTypeNode.setPosition(this._cardTypePos)
        }
    },

    /**设置所有手牌的隐藏和显示 */
    setAllCardShow(isShow) {
        // console.log("设置了所有牌显示==", this._idx, isShow)
        this._lieTileList.forEach(com => {
            com.setNodeShow(isShow)
        });
    },

    reset() {
        this.setAllCardShow(false)
        this.showCardType()
    },



    // update (dt) {},
});