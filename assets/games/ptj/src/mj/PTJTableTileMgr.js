const ApiPtj = require('../ApiPtj');
const PTJModel = require("../PTJModel");

cc.Class({
    extends: cc.Component,

    properties: {
        node_Show: cc.Node,
        node_Item: cc.Prefab,
        _allCardList: null, //手牌脚本列表
    },
    onLoad() {
        this.shwoNode(false)
    },

    shwoNode(isShow) {
        this.node.active = isShow;
    },

    shwoAllCard(isAnim = false) {
        let allNum = 32;
        let showArr = [];
        this.shwoNode(true);
        this._allCardList = [];
        this.node_Show.scale = 1;
        this.node_Show.stopAllActions();
        this.node_Show.removeAllChildren();
        let lastCards = PTJModel.getlastCards();
        let curNum = allNum - lastCards.length;
        let gameStatus = PTJModel.getGameStatus();
        if (lastCards.length >= allNum) {
            PTJModel.setlastCards([]);
            curNum = allNum;
            lastCards = [];
        }

        if (gameStatus == ApiPtj.gameStatus.SEND_CARDS ||
            gameStatus == ApiPtj.gameStatus.SHOW_CARD) {
            curNum -= PTJModel.isSmallCard() ? 8 : 16;
            this.node_Show.scale = isAnim ? 1 : 1.2;
        }

        showArr = new Array(curNum);
        lastCards.forEach(id => {
            showArr.push(id);
        });
        if (PTJModel.getCurBureau() == 0) showArr = [];
        this.node_Show.getComponent(cc.Layout).enabled = true;
        isAnim && cc.tween(this.node_Show).to(0.5, {
            scale: 1.2,
        }).start();

        for (let index = 0; index < showArr.length; index++) {
            let node = cc.instantiate(this.node_Item);
            let ctrl = node.addComponent('PTJSingleTile');
            let cardID = showArr[index] || 0;
            ctrl.init();
            ctrl.flower = cardID;
            ctrl.setNodeShow(true);
            ctrl.showCover(!cardID);
            ctrl.setNodeSize(40, 80);
            node.parent = this.node_Show;
            this._allCardList.push(ctrl);
        }
    },


    getAllCardList() {
        return this._allCardList;
    }

    // update (dt) {},
});