const AssetsManager = require('../../../../src/utils/AssetsManager');
const Enums = require('../../../../src/const/Enums');
const ApiJgPtj = require('../ApiJgPtj');
const JGPTJModel = require("../JGPTJModel")
const CCUtil = require("../../../../src/utils/CCUtil")
const handState = cc.Enum({
    Init: 0,
    Show: 1,
})
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

    onLoad() {
        if (this._idx == null) {
            this.init(null);
        }
    },

    /**初始化 */
    init(idx) {
        if (this._idx == null) {
            this._idx = idx;
        } else {
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
        this.setHandPos(handState.Init);
        this.poslist.forEach((pos) => {
            let node = cc.instantiate(this.liePfb)
            let ctrl = node.addComponent('JGPTJSingleTile');
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
        this.reset();
    },

    setHandPos(type) {
        if (JGPTJModel.isSmallCard()) {
            if (this._idx == 0 || this._idx == 2 || this._idx == 3) {
                this.poslist = [cc.v2(-135, 0), cc.v2(-45, 0)];
            } else {
                this.poslist = [cc.v2(45, 0), cc.v2(135, 0)];
            }
        } else {
            if (type == handState.Init) {//初始
                if (this._idx == 0 || this._idx == 2 || this._idx == 3) {
                    this.poslist = [cc.v2(-135, 0), cc.v2(-45, 0), cc.v2(-135, 20), cc.v2(-45, 20)];
                } else {
                    this.poslist = [cc.v2(45, 0), cc.v2(135, 0), cc.v2(45, 30), cc.v2(135, 30)];
                }
            } else if (type == handState.Show) {//显示
                this.poslist = [cc.v2(-135, 0), cc.v2(-45, 0), cc.v2(45, 0), cc.v2(135, 0)];
            }
        }
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

    showCard(tileArr = [], isShow = false, isAnim = false, isMaxCuoPai = false) {
        this.node.active = true;
        this._tileIdList = tileArr;
        this.lieLayout.active = true;
        this.setHandPos(isShow ? handState.Show : handState.Init);
        if (isMaxCuoPai && !JGPTJModel.isSmallCard()) { isAnim = false; };
        let isTipShow = JGPTJModel.getUserTest() || JGPTJModel.isSmallCard() && !JGPTJModel.isCuoPai();
        this.setAllCardShow(true);
        let count = 0,
            showTipsCardType = () => {
                if (this._idx == 0) {
                    count += 1;
                    if (count >= tileArr.length) {
                        JGPTJModel.initCardTypeIndex();
                        let CurObj = JGPTJModel.getCurTips();
                        JGPTJModel.setSelectCard(CurObj);
                        if (JGPTJModel.isSmallCard()) {
                            if (isTipShow) {
                                this.onTipsCard(false);
                            }
                        } else {
                            if (isMaxCuoPai) return;
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
            ctrl.isTouch = false;
            ctrl.setNodePos(pos);
            ctrl.setNodeAngle(0);
            ctrl.setSelect(false);
            ctrl.setNodeShow(true);
            ctrl.setNodeOpacity(255);
            ctrl.node.stopAllActions();
            if (JGPTJModel.isSmallCard()) { //两张
                if (this._idx == 0) {
                    ctrl.showCover(true);
                    isAnim = !isTipShow;
                    isShow = isTipShow;
                }
            } else {
                ctrl.showCover(isShow);
                ctrl.isTouch = this._idx == 0 && cardId;
            }
            let funs = () => {
                ctrl.showCover(!isShow);
                ctrl.setNodePos(pos);
                ctrl.node.scale = 1;
                showTipsCardType();
            }
            if (isAnim) {
                cc.tween(ctrl.node)
                    .to(0.1, {
                        scaleX: 0
                    })
                    .to(0.1, {
                        scaleX: 1
                    })
                    .call(funs)
                    .start()
            } else {
                funs();
            }
        }
        this.touchCuoPai(isMaxCuoPai);
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
        let obj = { oneCards: [], twoCards: [], };
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
        JGPTJModel.setSelectCard(obj);
        if (isTouch) {
            let CurObj = JGPTJModel.getQueryTips(obj.oneCards, obj.twoCards);
            this.showCardTips(CurObj, false);
        }
        AssetsManager.playEffect({
            bundle: Enums.bundleType.JGPTJ,
            path: "res/audio/main/selectCard",
        });
    },

    onTipsCard(isTip = true) {
        if (this._isMaxCuoPai) {
            return AssetsManager.tipDialog('请先搓牌!');
        }
        let CurObj = JGPTJModel.getCurTips();
        this.showCardTips(CurObj, true);
        if (!CurObj && isTip) AssetsManager.tipDialog('暂无提示数据!');
    },

    /**
       * 刷新摊开的牌
       * @param {Array} tileArr 手牌数组
       */
    updateLieTilesX(tileArr, type = 0, isAnim = false) {
        this.node.active = true;
        this.touchCuoPai(false);
        this.showCardTips(null);
        this._tileIdList = tileArr;
        this.lieLayout.active = true;
        this.setHandPos(handState.Show);
        this.setAllCardShow(true);
        this.poslist = [cc.v2(-135, 0), cc.v2(-45, 0), cc.v2(135, 55), cc.v2(135, -50)];
        if (JGPTJModel.isSmallCard()) {
            if (this._idx == 0 || this._idx == 2 || this._idx == 3) {
                this.poslist = [cc.v2(-135, 0), cc.v2(-45, 0)];
            } else {
                this.poslist = [cc.v2(45, 0), cc.v2(135, 0)];
            }
        }
        for (let i = 0; i < this._lieTileList.length; i++) {
            const ctrl = this._lieTileList[i];
            const pos = this.poslist[i];
            ctrl.flower = tileArr[i];
            ctrl.setNodePos(pos);
            ctrl.setNodeAngle(0);
            ctrl.isTouch = false;
            ctrl.node.scale = 1;
            if (!isAnim) {
                ctrl.setNodeAngle(i > 1 ? 90 : 0);
                ctrl.showCover(i < type);
            } else {
                ctrl.showCover(true);
                if (i > 1) {
                    cc.tween(ctrl.node)
                        .to(0.4, {
                            scaleX: 1,
                            angle: 90
                        })
                        .call(() => {
                            ctrl.setNodePos(pos);
                        })
                        .start();
                }
            }
        }
    },

    /**展示牌型 */
    showCardTypeX(CurObj = null, type = 0, isPlay = false) {
        this._cardTypeNode1.active = false;
        this._cardTypeNode2.active = false;
        this.showCardTips(null);
        if (!CurObj) return;
        let cardVal1 = ApiJgPtj.cardType.ERROR;
        let cardVal2 = ApiJgPtj.cardType.ERROR;
        if (JGPTJModel.isSmallCard() && this._idx == 1) {
            if (type != 2) cardVal1 = JGPTJModel.showTypeSpr(this._cardTypeNode2, CurObj.oneType, CurObj.onePoint, 1);
        } else {
            if (type != 2) cardVal1 = JGPTJModel.showTypeSpr(this._cardTypeNode1, CurObj.oneType, CurObj.onePoint, 1);
            cardVal2 = JGPTJModel.showTypeSpr(this._cardTypeNode2, CurObj.twoType, CurObj.twoPoint, 2);
        }
        if (isPlay) {
            let playCardType = (cardVal, finish) => {
                if (cardVal == ApiJgPtj.cardType.ERROR) {
                    return
                };
                AssetsManager.playEffect({
                    path: "res/audio/woman/" + cardVal,
                    bundle: Enums.bundleType.JGPTJ,
                    finish: finish,
                });
            }
            if (type == 0) playCardType(cardVal1);
            if (type == 2) playCardType(cardVal2);
        }
    },


    /**
     * 刷新摊开的牌
     * @param {Array} tileArr 手牌数组
     */
    updateLieTiles(tileArr = [], isAnim = false) {
        // console.log('手牌数据', tileArr, "isAnim", isAnim);
        this.node.active = true;
        this.touchCuoPai(false);
        this._tileIdList = tileArr;
        this.lieLayout.active = true;
        this.setHandPos(handState.Show);
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
            ctrl.showCover(this._idx != 0 && !JGPTJModel.getUserTest());
        }

        if (JGPTJModel.isSmallCard()) {
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
            let poslist = [cc.v2(-135, 0), cc.v2(-45, 0), cc.v2(110, 50), cc.v2(110, -50)];
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
        this.showCardTips(null);
        if (!CurObj) return;
        // console.log("显示牌类型数据info", CurObj)
        let cardVal1 = ApiJgPtj.cardType.ERROR;
        let cardVal2 = ApiJgPtj.cardType.ERROR;
        if (JGPTJModel.isSmallCard()) {
            if (this._idx == 0 || this._idx == 2 || this._idx == 3) {
                cardVal1 = JGPTJModel.showTypeSpr(this._cardTypeNode1, CurObj.oneType, CurObj.onePoint, 1);
            } else {
                cardVal1 = JGPTJModel.showTypeSpr(this._cardTypeNode2, CurObj.oneType, CurObj.onePoint, 1);
            }
        } else {
            cardVal1 = JGPTJModel.showTypeSpr(this._cardTypeNode1, CurObj.oneType, CurObj.onePoint, 1);
            cardVal2 = JGPTJModel.showTypeSpr(this._cardTypeNode2, CurObj.twoType, CurObj.twoPoint, 2);
        }

        if (isPlay) {
            let playCardType = (cardVal, finish) => {
                if (cardVal == ApiJgPtj.cardType.ERROR) {
                    return
                };
                AssetsManager.playEffect({
                    path: "res/audio/woman/" + cardVal,
                    bundle: Enums.bundleType.JGPTJ,
                    finish: finish,
                });
            }
            if (cardVal1 != ApiJgPtj.cardType.ERROR) {
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
        if (!CurObj || JGPTJModel.getMyshowCard()) return;
        let oneCards = CurObj.oneCards || [];
        let twoCards = CurObj.twoCards || [];
        let newOneList = oneCards.slice();

        isSelect && this._lieTileList.forEach((ctrl) => {
            let index = newOneList.indexOf(ctrl.flower);
            ctrl.setSelect(false);
            if (index !== -1) {
                ctrl.setSelect(true);
                newOneList.splice(index, 1);
            }
        });

        JGPTJModel.showTypeSpr(this._cardTypeNode11, CurObj.oneType, CurObj.onePoint, 1);
        if (!JGPTJModel.isSmallCard()) {
            JGPTJModel.showTypeSpr(this._cardTypeNode22, CurObj.twoType, CurObj.twoPoint, 2);
        }
        this.onChooseCard(null, false);
    },
    /**设置所有手牌的隐藏和显示 */
    setAllCardShow(isShow) {
        this._lieTileList.forEach((ctrl, index) => {
            ctrl.setNodePos(this.poslist[index]);
            ctrl.setNodeShow(isShow)
        });
    },

    reset() {
        this.setHandPos(handState.Init);
        this.setAllCardShow(false);
        this.showCardTips(false);
        this.touchCuoPai(false);
        this.showCardType();
    },

    onDestroy() {
        cc.systemEvent.off("tipsCard", this.onTipsCard, this);
        cc.systemEvent.off("selectCard", this.onChooseCard, this);
    },

    touchCuoPai(isCuoPai) {
        if (!JGPTJModel.getSelfIsPlaying() || JGPTJModel.isLookOnUID()) return;
        if (this._idx != 0 || JGPTJModel.isSmallCard()) return;
        this._moveList && this._moveList.forEach((node) => {
            node.targetOff(this);
            node.destroy();
        })
        this._moveList = [];
        this._isMaxCuoPai = isCuoPai;
        if (!isCuoPai || !this.lieLayout) return false;
        let val = 2, poslist = [cc.v2(-135, 0), cc.v2(-45, 0), cc.v2(-135, 10), cc.v2(-45, 10),];
        this._lieTileList.forEach((ctrl, index) => {
            let isNewShow = index >= val;
            ctrl.setNodeShow(!isNewShow);
            ctrl.showCover(false);
            ctrl.isTouch = false;
            if (isNewShow) {
                let newNode = cc.instantiate(this.liePfb);
                let newCtrl = newNode.addComponent("JGPTJSingleTile");
                newCtrl.init(this._tileIdList[index]);
                newNode.setPosition(poslist[index]);
                newNode.parent = this.lieLayout;
                newNode.name = "newMoveNode";
                this._moveList.push(newNode);
                newCtrl.setNodeShow(true);
                newCtrl.showCover(false);
                newCtrl.isTouch = false;
                newNode.on(cc.Node.EventType.TOUCH_MOVE, (event) => {
                    if (!this._isMaxCuoPai || JGPTJModel.isLookOnUID()) return;
                    // if (event.getDeltaX() <= 0) return console.log("只能向右");
                    if (event.target.x >= 100) {
                        this.touchCuoPai(false);
                        this.showCard(this._tileIdList, true);
                        return
                    }
                    this._moveList.forEach((node) => {
                        node.x += event.getDeltaX();
                    })
                }, this);
            }
        });
    },
});