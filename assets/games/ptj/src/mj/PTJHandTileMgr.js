const AssetsManager = require('../../../../src/utils/AssetsManager');
const Enums = require('../../../../src/const/Enums');
const ApiPtj = require('../ApiPtj');
const PTJModel = require("../PTJModel")

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
            this._idx = idx;
        } else {
            // console.log("已经初始化过了", this._idx)
            return
        }
        if (this._idx == 0) {
            cc.systemEvent.on("tipsCard", this.onTipsCard, this);
            cc.systemEvent.on("selectCard", this.onChooseCard, this);
        }
        this._tileIdList = [];
        this._lieTileList = [];
        this.lieLayout.removeAllChildren();
        this.lieLayout.getComponent(cc.Layout).enabled = false;
        this._cardTypeNode1 = cc.find("cardType1", this.node);
        this._cardTypePos1 = this._cardTypeNode1.getPosition();
        this._cardTypeNode2 = cc.find("cardType2", this.node);
        this._cardTypePos2 = this._cardTypeNode2.getPosition();
        this._cardTypeNode11 = cc.find("cardType11", this.node);
        this._cardTypeNode22 = cc.find("cardType22", this.node);
        this.poslist = [cc.v2(-135, 0), cc.v2(-45, 0), cc.v2(45, 0), cc.v2(135, 0)];
        if (PTJModel.isSmallCard()) {
            if (this._idx == 0 || this._idx == 3) {
                this.poslist = [cc.v2(-135, 0), cc.v2(-45, 0)];
            } else {
                this.poslist = [cc.v2(45, 0), cc.v2(135, 0)];
            }
        }
        this.poslist.forEach((pos) => {
            let node = cc.instantiate(this.liePfb)
            let ctrl = node.addComponent('PTJSingleTile');
            node.parent = this.lieLayout;
            node.setPosition(pos);
            node.name = i + "";
            ctrl.init();
            ctrl.setNodePos(pos);
            ctrl.setNodeAngle(0);
            ctrl.setNodeShow(false);
            ctrl.setNodeSize(80, 160);
            this._lieTileList.push(ctrl);
        })

    },

    /**获取第一张牌 */
    getFirstTile() {
        return this._lieTileList[0].getCoverNode()
    },


    getlieTileList() {
        this._lieTileList.forEach((ctrl, i) => {
            const pos = this.poslist[i];
            ctrl.setNodeShow(false);
            ctrl.setNodePos(pos);
            ctrl.setNodeAngle(0);
            ctrl.flower = 0;
        });
        return this._lieTileList;
    },

    showCard(tileArr = [], isShow = false, isAnim = false) {
        this.node.active = true;
        this._tileIdList = tileArr;
        this.lieLayout.active = true;
        let isTipShow = PTJModel.getUserTest() || !PTJModel.isCuoPai();
        let count = 0,
            showTipsCardType = () => {
                if (this._idx == 0) {
                    count += 1;
                    if (count >= tileArr.length) {
                        if (PTJModel.isSmallCard()) {
                            if (isTipShow) {
                                this.onTipsCard(false);
                            }
                        } else {
                            this.onTipsCard(false);
                        }
                    }
                }
            }
        for (let i = 0; i < this._lieTileList.length; i++) {
            const ctrl = this._lieTileList[i];
            const cardId = tileArr[i] || 0;
            const pos = this.poslist[i];
            ctrl.flower = cardId;
            ctrl.node.scale = 1;
            ctrl.isTouch = false;
            ctrl.setNodePos(pos);
            ctrl.setNodeAngle(0);
            ctrl.setSelect(false);
            ctrl.setNodeShow(true);
            ctrl.setNodeOpacity(255);
            ctrl.node.stopAllActions();
            if (PTJModel.isSmallCard()) { //两张
                if (this._idx == 0) {
                    isAnim = !isTipShow;
                    isShow = isTipShow;
                }
            } else {
                ctrl.showCover(isShow);
                ctrl.isTouch = this._idx == 0 && cardId;
            }

            if (isAnim) {
                cc.tween(ctrl.node)
                    .to(0.1, {
                        scaleX: 0
                    })
                    .call(() => {
                        AssetsManager.playEffect({
                            bundle: Enums.bundleType.PTJ,
                            path: "res/audio/main/showCard",
                        });
                    })
                    .to(0.1, {
                        scaleX: 1
                    })
                    .call(() => {
                        showTipsCardType();
                        ctrl.showCover(!isShow);
                    })
                    .start()
            } else {
                showTipsCardType();
                ctrl.showCover(!isShow);
            }
        }
    },

    onChooseCard(tileCtrl, isTouch = true) {
        let upCount = 0;
        this._lieTileList.forEach((ctrl) => {
            let isSelect = ctrl.getSelect();
            if (isSelect) {
                upCount += 1;
            }
        })
        if (upCount > 2) {
            tileCtrl && tileCtrl.setSelect(false);
            AssetsManager.tipDialog("只能选两张配牌！");
            return
        }
        let obj = {
            oneCards: [],
            twoCards: [],
        };
        this._lieTileList.forEach((ctrl) => {
            let isSelect = ctrl.getSelect();
            if (!!ctrl.flower) {
                if (isSelect) {
                    obj.oneCards.push(ctrl.flower);
                } else {
                    obj.twoCards.push(ctrl.flower);
                }
            }
        })
        PTJModel.setSelectCard(obj);
        if (isTouch) {
            let CurObj = PTJModel.getQueryTips(obj.oneCards, obj.twoCards);
            // console.log("手动===提示====CurObj", CurObj)
            this.showCardTips(CurObj, false);
        }
    },

    onTipsCard(isTip = true) {
        let CurObj = PTJModel.getCurTips();
        // console.log("循环===提示====CurObj", CurObj)
        this.showCardTips(CurObj);
        if (!CurObj && isTip) AssetsManager.tipDialog('暂无提示数据!');
    },

    /**
     * 刷新摊开的牌
     * @param {Array} tileArr 手牌数组
     */
    updateLieTiles(tileArr = [], isAnim = false) {
        // console.log('手牌数据', tileArr, "isAnim", isAnim);
        this.node.active = true;
        this._tileIdList = tileArr;
        this.lieLayout.active = true;
        for (let i = 0; i < this._lieTileList.length; i++) {
            const ctrl = this._lieTileList[i];
            const pos = this.poslist[i];
            const cardId = tileArr[i];
            ctrl.flower = cardId;
            ctrl.isTouch = false;
            ctrl.node.scale = 1;
            ctrl.setNodeAngle(0);
            ctrl.setNodeShow(true);
            ctrl.setNodeOpacity(255);
            ctrl.node.setPosition(pos);
            ctrl.node.stopAllActions();
            ctrl.showCover(this._idx != 0 && !PTJModel.getUserTest());
        }
        if (isAnim) {
            AssetsManager.playEffect({
                bundle: Enums.bundleType.PTJ,
                path: "res/audio/main/showCard",
            });
        }
        if (PTJModel.isSmallCard()) {
            for (let i = 0; i < this._lieTileList.length; i++) {
                const ctrl = this._lieTileList[i];
                if (isAnim) {
                    cc.tween(ctrl.node)
                        .to(0.1, {
                            scaleX: 0
                        })
                        .to(0.1, {
                            scaleX: 1
                        })
                        .call(() => {
                            ctrl.showCover(false);
                        })
                        .start()
                } else {
                    ctrl.showCover(false);
                }

            }
        } else {
            let poslist = [cc.v2(-135, 0), cc.v2(-45, 0), cc.v2(90, 42), cc.v2(90, -42)];
            for (let i = 0; i < this._lieTileList.length; i++) {
                const ctrl = this._lieTileList[i];
                const pos = poslist[i];
                if (!isAnim) {
                    ctrl.setNodePos(pos);
                    ctrl.showCover(false);
                    ctrl.setNodeAngle(i > 1 ? 90 : 0);
                } else {
                    if (i > 1) {
                        cc.tween(ctrl.node)
                            .to(0.1, {
                                scaleX: 0
                            })
                            .to(0.4, {
                                scaleX: 1,
                                angle: 90
                            })
                            .call(() => {
                                ctrl.setNodePos(pos);
                            })
                            .start();
                    }
                    cc.tween(ctrl.node).delay(0.5).call(() => {
                        ctrl.showCover(false);
                    }).start();
                }
            }
        }
    },

    /**展示牌型 */
    showCardType(CurObj = null, isPlay = false) {
        this._cardTypeNode1.active = false;
        this._cardTypeNode2.active = false;
        this.showCardTips(false);
        if (!CurObj) {
            return
        };
        // console.log("显示牌类型数据info", CurObj)
        let cardVal1 = ApiPtj.cardType.ERROR;
        let cardVal2 = ApiPtj.cardType.ERROR;
        if (PTJModel.isSmallCard()) {
            if (this._idx == 0 || this._idx == 3) {
                cardVal1 = PTJModel.showTypeSpr(this._cardTypeNode1, CurObj.oneType, CurObj.onePoint, 1);
            } else {
                cardVal1 = PTJModel.showTypeSpr(this._cardTypeNode2, CurObj.oneType, CurObj.onePoint, 1);
            }
        } else {
            cardVal1 = PTJModel.showTypeSpr(this._cardTypeNode1, CurObj.oneType, CurObj.onePoint, 1);
            cardVal2 = PTJModel.showTypeSpr(this._cardTypeNode2, CurObj.twoType, CurObj.twoPoint, 2);
        }

        if (isPlay) {
            let playCardType = (cardVal, finish) => {
                // console.log("playCardType======cardVal", cardVal)
                if (cardVal == ApiPtj.cardType.ERROR) {
                    return
                };
                AssetsManager.playEffect({
                    path: "res/audio/woman/" + cardVal,
                    bundle: Enums.bundleType.PTJ,
                    finish: finish,
                });
            }
            if (cardVal1 != ApiPtj.cardType.ERROR) {
                playCardType(cardVal1, () => {
                    playCardType(cardVal2);
                })
            } else {
                playCardType(cardVal2);
            }
        }
    },

    showCardTips(CurObj, isSelect = true) {
        if (this._cardTypeNode11) this._cardTypeNode11.active = false;
        if (this._cardTypeNode22) this._cardTypeNode22.active = false;
        if (!CurObj || PTJModel.getMyshowCard()) return;
        let oneCards = CurObj.oneCards || [];
        let twoCards = CurObj.twoCards || [];
        let newOneList = oneCards.slice();
        isSelect && this._lieTileList.forEach((ctrl) => {
            let cardID = ctrl.flower;
            ctrl.setSelect(false);
            let index = newOneList.indexOf(cardID);
            if (index !== -1) {
                ctrl.setSelect(true);
                newOneList.splice(index, 1);
            }
        });

        PTJModel.showTypeSpr(this._cardTypeNode11, CurObj.oneType, CurObj.onePoint, 1);
        if (!PTJModel.isSmallCard()) {
            PTJModel.showTypeSpr(this._cardTypeNode22, CurObj.twoType, CurObj.twoPoint, 2);
        }
        this.onChooseCard(null, false);
    },
    /**设置所有手牌的隐藏和显示 */
    setAllCardShow(isShow) {
        this._lieTileList.forEach(com => {
            com.setNodeShow(isShow)
        });
    },

    reset() {
        this.setAllCardShow(false);
        this.showCardTips(false);
        this.showCardType();
    },
    // update (dt) {},
});