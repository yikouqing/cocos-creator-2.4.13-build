const MJNNModel = require('../MJNNModel');
const ApiRoom = require('../../../../src/api/ApiRoom');
const AssetsManager = require('../../../../src/utils/AssetsManager');
const Enums = require('../../../../src/const/Enums');
const ApiMjnn = require('../ApiMjnn');
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
        _cardTypeNodeScale: null,
    },



    onLoad() {
    },

    /**初始化 */
    init(idx) {
        if (!!this._lieTileList) return;
        this._idx = idx;
        const viewScale = CCUtil.getViewScale();
        if (viewScale.type == Enums.viewScaleType.HOR) {
            this.node.scale = (viewScale.scaleX + 1) / 2;
        }
        if (this.lieLayout) {
            let layout = this.lieLayout.getComponent(cc.Layout);
            layout && this.lieLayout.removeComponent(layout);
        }
        //布局方向 0 3 4 5 居中  1 2 右左  6 7 左右
        let pos = this._getTilePos(5, 5, this.liePfb.data);
        let cardTypePos = pos.slice();
        this._cardTypeNode = cc.find("cardType", this.node);
        this._cardTypeNodeScale = this._cardTypeNode.scale;
        this._cardTypePos = cardTypePos[2]; //牌型节点取中间牌的x
        this._lieTileList = [];
        this._tileIdList = [];
        for (let i = 0; i < 5; i++) {
            let lie = cc.instantiate(this.liePfb);
            let lcom = lie.addComponent('MJNNSingleTile');
            lcom.init();
            lcom.setNodeShow(false);
            this._lieTileList.push(lcom);
            lie.name = i + "";
            lie.parent = this.lieLayout;
            // lie.setPosition(pos[i]);
        }
        this.node.active = false;
    },

    /**
     * 刷新摊开的牌
     * @param {Array} cards 手牌数组
     * 0 非发牌  
     */
    updateLieTiles(uid, cards = [], deal = 0) {
        this._tileIdList = cards;
        this.lieLayout.active = true;
        this.node.active = true;
        let isAnZhuangQiangZhuang = MJNNModel.getGameRuleByKey("isAnZhuangQiangZhuang");
        let myUID = MJNNModel.getMyUID();
        let gameStatus = MJNNModel.getGameStatus();
        let canUseTest = MJNNModel.canUseTest();
        let isShow = MJNNModel.getShowCards(uid);
        let show = MJNNModel.getShowCards(uid);
        let lastCard = show && show.lastCard >= 0 ? show.lastCard : null;
        let lastCardIndex = cards.indexOf(lastCard);
        let showCount = 4;
        if (gameStatus == ApiMjnn.gameStatus.SHOW_CARDS ||
            gameStatus == ApiMjnn.gameStatus.RESULT) {
            showCount = 5;
        } else {
            showCount = !!canUseTest ? 5 : 4;
        }
        let pos = this._getTilePos(showCount, 5, this.liePfb.data);
        let start = pos[0];
        this._lieTileList.forEach((comp, index, comps) => {
            comp.node.stopAllActions();
            comp.node.scale = 1;
            comp.flower = cards[index];
            comp.setNodeShow(index < showCount);
            comp.setNodeOpacity(index < showCount ? 255 : 0);
            if (!deal && index < showCount) {
                if (!!isShow) {
                    if (lastCardIndex == index) {
                        comp.setPosition(cc.v2(pos[index].x, 20));
                    } else {
                        comp.setPosition(pos[index]);
                    }
                    comp.setCover(false);
                } else {
                    if (!!canUseTest) {
                        comp.setCover(false);
                    } else {
                        if (!!isAnZhuangQiangZhuang) {
                            if (gameStatus == ApiMjnn.gameStatus.ROB_BANK || gameStatus == ApiMjnn.gameStatus.SEND_CARDS) {
                                comp.setCover(true);
                            } else {
                                comp.setCover(uid != myUID);
                            }
                        } else {
                            comp.setCover(uid != myUID);
                        }
                    }
                    comp.setPosition(pos[index]);
                }
            }
        })
        if (!deal) return;
        //执行发牌动画
        if (deal == 1) {
            this._lieTileList.forEach((comp, index, comps) => {
                if (index < showCount) {
                    comp.node.stopAllActions();
                    comp.setCover(true);
                    comp.setPosition(start);
                    cc.tween(comp.node)
                        .delay(0.1 * index)
                        .to(0.15, {
                            position: pos[index]
                        })
                        .call(() => {
                            if (index == showCount - 1) {
                                this._lieTileList.forEach((tile, idx, tiles) => {
                                    if (idx < showCount) {
                                        tile.node.stopAllActions();
                                        tile.setPosition(pos[idx]);
                                        tile.setCover(true);
                                        cc.tween(tile.node).to(0.1, {
                                            scaleX: 0
                                        }).call(() => {
                                            if (!!canUseTest) {
                                                tile.setCover(false);
                                            } else {
                                                if (!!isAnZhuangQiangZhuang) {
                                                    if (gameStatus == ApiMjnn.gameStatus.ROB_BANK || gameStatus == ApiMjnn.gameStatus.SEND_CARDS) {
                                                        tile.setCover(true);
                                                    } else {
                                                        tile.setCover(uid != myUID);
                                                    }
                                                } else {
                                                    tile.setCover(uid != myUID);
                                                }
                                            }
                                        }).to(0.1, {
                                            scaleX: 1
                                        }).start();
                                    }
                                });
                            }
                        })
                        .start();
                }
            });
        } else if (deal == 2) {
            //只发最后一张
            this._lieTileList.forEach((comp, index, comps) => {
                comp.node.stopAllActions();
                if (index < showCount - 1) {
                    comp.setPosition(pos[index]);
                    if (!!canUseTest || !!isShow) {
                        comp.setCover(false);
                    } else {
                        comp.setCover(uid != myUID);
                    }
                } else if (index == showCount - 1) {
                    if (!!canUseTest || !!isShow) {
                        comp.setCover(false);
                    } else {
                        comp.setCover(true);
                    }
                    if (!!canUseTest) {
                        comp.setPosition(pos[index]);
                    } else {
                        let endPos = pos[index];
                        let startPos = cc.v2(endPos.x, this.liePfb.data.height);
                        comp.setPosition(startPos);
                        cc.tween(comp.node)
                            .to(0.35, {
                                position: endPos
                            })
                            .start();
                    }
                }
            });
        }
    },

    /**展示牌型 */
    showCardType(user = null, isAni = false) {
        if (!this._cardTypeNode || !this._cardTypeNode.getComponent(cc.Sprite)) return;
        this._cardTypeNode.active = !!user;
        this._cardTypeNode.getComponent(cc.Sprite).spriteFrame = null;
        if (!user) return;
        let url = `res/sprite/cardtype/ct${user.type}`;
        let audio = `res/audio/woman/ct${user.type}`;
        if (user.type == ApiMjnn.cardType.YOUNIU) {
            url += user.point;
            audio += user.point;
        }
        AssetsManager.loadSpriteFrame({
            path: url,
            sprite: this._cardTypeNode.getComponent(cc.Sprite),
            bundle: Enums.bundleType.MJNN,
        });
        let usr = MJNNModel.getUserByUID(user.uid);
        if (usr && usr.userInfo.sex == 0) {
            audio = audio.replace(/woman/g, "man");
        }
        this._cardTypeNode.stopAllActions();
        this._cardTypeNode.active = true;
        if (isAni) {
            this._cardTypeNode.opacity = 0;
            this._cardTypeNode.scale = 0.1;
            cc.tween(this._cardTypeNode)
                .to(0.3, {
                    position: cc.v2(this._cardTypePos.x, this._cardTypePos.y - 30),
                    opacity: 255,
                    scale: this._cardTypeNodeScale,
                }, {
                    easing: 'bounceOut'
                }).start()
            AssetsManager.playEffect({
                path: audio,
                bundle: Enums.bundleType.MJNN
            });
        } else {
            this._cardTypeNode.opacity = 255;
            this._cardTypeNode.scale = this._cardTypeNodeScale;
            this._cardTypeNode.setPosition(this._cardTypePos);
        }
    },

    /**设置所有手牌的隐藏和显示 */
    setCardsShow(isShow) {
        this._lieTileList.forEach(comp => {
            comp.setNodeShow(isShow);
        });
    },

    reset() {
        this.setCardsShow(false);
        this.showCardType();
    },

    leave() {
        this.reset();
        this.node.active = false;
    },

    _getDir() {
        let dir = 0;
        if (this._idx == 1 || this._idx == 2) {
            dir = 1;
        } else if (this._idx == 6 || this._idx == 7) {
            dir = 2;
        }
        return dir;
    },

    //dir 0 -居中 1-右左 2-左右
    _getTilePos(count, lane, size) {
        let dir = this._getDir();
        let offset = {
            x: 0,
            y: 0
        }
        let perWidth = size.width * (1 - offset.x);
        let perHeight = size.height * (1 - offset.y);
        let rows = Math.floor(count / lane);
        let pos = [];
        let startPos = cc.v2(0, 0);
        if (dir == 0) {
            //锚点cc.v2(0.5,0.5) 中心点散开
            let totalWidth = perWidth * (count - 1);
            startPos = cc.v2(-totalWidth / 2, 0);
            for (let index = 0; index < count; index++) {
                pos.push(cc.v2(startPos.x + index * perWidth, 0));
            }
        } else if (dir == 1) {
            //从右到左
            startPos = cc.v2(-0.5 * size.width, 0);
            for (let index = 0; index < count; index++) {
                let rowIndex = Math.floor(index / lane);
                let colIndex = Math.floor(index % lane);
                let laneCount = rowIndex < rows ? lane : count % lane != 0 ? count % lane : lane;
                pos.push(cc.v2(startPos.x - (laneCount - 1 - colIndex) * perWidth, startPos.y - rowIndex * perHeight));
            }
            // console.log('hehe', pos)
        } else if (dir == 2) {
            //从左到右
            startPos = cc.v2(0.5 * size.width, 0);
            for (let index = 0; index < count; index++) {
                let rowIndex = Math.floor(index / lane);
                let colIndex = Math.floor(index % lane);
                pos.push(cc.v2(startPos.x + colIndex * perWidth, startPos.y - rowIndex * perHeight));
            }
        }
        return pos;
    },
});