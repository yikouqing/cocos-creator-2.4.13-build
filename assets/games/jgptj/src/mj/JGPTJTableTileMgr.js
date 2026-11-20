const ApiJgPtj = require('../ApiJgPtj');
const JGPTJModel = require("../JGPTJModel");

cc.Class({
    extends: cc.Component,

    properties: {
        node_Show: cc.Node,
        node_Item: cc.Prefab,
        node_noShow: [cc.Node],
        isHeap: false,
        _allCardList: null, //手牌脚本列表
    },

    shwoNode(isShow) {
        this.node.active = isShow;
    },


    onLoad() {
        this.initNoShow();
    },

    initNoShow() {
        let addCount = 0;
        this._allNoList = [];
        if (!this.isHeap) return;
        let addNode = () => {
            if (addCount >= this.node_noShow.length) {
                return
            }
            let CurNode = this.node_noShow[addCount];
            if (CurNode) {
                CurNode.active = false;
                CurNode.children.forEach((node, i) => {
                    let sonNode = CurNode.getChildByName(i + "");
                    let ctrl = sonNode.addComponent('JGPTJSingleTile');
                    ctrl.init();
                    ctrl.flower = 0;
                    ctrl.showCover(true);
                    ctrl.setNodeShow(true);
                    if (sonNode) this._allNoList.push(ctrl);
                    if ((i + 1) == CurNode.childrenCount) {
                        addCount += 1;
                        addNode();
                    }
                })
            }
        }
        addNode();
    },

    setNoShow(curNum) {
        // curNum = 32
        if (!this.isHeap) return;
        this.node_noShow[0].active = curNum > 0;
        this.node_noShow[1].active = curNum > 16;
        this._allNoList.forEach((ctrl, index) => {
            ctrl.node.active = true;
            if (JGPTJModel.isSmallCard()) {
                ctrl.node.active = index < curNum;
            }
            if (index < curNum) {
                this._allCardList.push(ctrl);
            };
        })
    },

    shwoAllCard(isAnim = false) {
        let allNum = 32;
        let showArr = [];
        this.shwoNode(true);
        this._allCardList = [];
        this.node.stopAllActions();
        this.node.setScale(0.8, 0.6);
        this.node_Show.removeAllChildren();
        let gameStatus = JGPTJModel.getGameStatus();
        let lastCards = JGPTJModel.getlastCards();
        let curNum = allNum - lastCards.length;
        if (lastCards.length >= allNum) {
            JGPTJModel.setlastCards([]);
            curNum = allNum;
            lastCards = [];
        }
        if (gameStatus == ApiJgPtj.gameStatus.SHOW_CARD ||
            gameStatus == ApiJgPtj.gameStatus.SEND_CARDS) {
            curNum -= JGPTJModel.isSmallCard() ? 8 : 16;
            if (isAnim) {
                this.node.setScale(0.4, 0.3);
            } else {
                this.node.setScale(0.8, 0.6);
            }
        }
        if (this.isHeap) {
            this.setNoShow(curNum);
        } else {
            for (let index = 0; index < curNum; index++) {
                showArr.push(0);
            }
        }
        lastCards.forEach(id => { showArr.push(id); });
        if (JGPTJModel.getCurBureau() == 0) showArr = [];
        this.node_Show.getComponent(cc.Layout).enabled = true;
        isAnim && cc.tween(this.node).to(0.5, {
            scaleX: 0.8, scaleY: 0.6,
        }).start();
        for (let index = 0; index < showArr.length; index++) {
            let node = cc.instantiate(this.node_Item);
            let ctrl = node.addComponent('JGPTJSingleTile');
            let cardID = showArr[index] || 0;
            ctrl.init();
            ctrl.flower = cardID;
            ctrl.setNodeShow(true);
            ctrl.showCover(!cardID);
            ctrl.setNodeSize(40, 80);
            node.parent = this.node_Show;
            this._allCardList.push(ctrl);
        }
        if (!this.node_Show.childrenCount) { this.node_Show.height = 0; };
        this.node_Show.getComponent(cc.Layout).updateLayout();
        this.node.getComponent(cc.Layout).updateLayout();
        // console.log("isAnim", isAnim, "桌牌状态", gameStatus, "已开牌数", lastCards.length, "剩余数", curNum, "生成数量", this._allCardList.length, "Scale", this.node_Show.scaleX, this.node_Show.scaleY,)
    },


    getAllCardList() {
        return this._allCardList;
    }

    // update (dt) {},
});