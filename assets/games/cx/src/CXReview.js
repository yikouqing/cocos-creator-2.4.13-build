const CCUtil = require('../../../src/utils/CCUtil');
const AssetsManager = require('../../../src/utils/AssetsManager');
const MessageCallback = require('../../../src/utils/MessageCallback');
const ApiCx = require('./ApiCx');
const ApiRoom = require('../../../src/api/ApiRoom');
const Enums = require('../../../src/const/Enums');

cc.Class({
    extends: cc.Component,

    properties: {
        opNode: cc.Node,
        listNode: cc.Node,
        roundIndex: cc.Label,
        itemPrf: cc.Prefab,
        _curRound: 0,
        _totalRounds: 0,
        _reviewList: null
    },

    start() {
        this._reviewList = this.node.nodeParams ? this.node.nodeParams.list || [] : [];
        this.opNode.active = this._reviewList.length != 0;
        this._curRound = 0;
        this._totalRounds = this._reviewList.length;
        if (this._reviewList.length != 0) {
            this.onListSync(this._reviewList[0]);
        } else {
            this.roundIndex.string = '0/0';
            this._reviewList = [];
        }
    },

    onListSync(data) {
        this.roundIndex.string = `${this._curRound + 1}/${this._totalRounds}`;
        this.listNode.removeAllChildren()
        for (let i = 0; i < data.length; i++) {
            let index = i
            data[i].index = index
            let node = cc.instantiate(this.itemPrf)
            node.getComponent('CXReviewItem').bind(data[i])
            this.listNode.addChild(node)
        }
        // AssetsManager.loadAsset({
        //     path: 'res/prefab/CXReviewItem',
        //     aType: cc.Prefab,
        //     bundle: Enums.bundleType.CX
        // }, (item) => {
        //     if (!item || !cc.isValid(this.listNode)) return;
        //     if (!this.listNode.getComponent('ScrollViewVertical')) this.listNode.addComponent('ScrollViewVertical');
        //     let viewController = this.listNode.getComponent('ScrollViewVertical');
        //     viewController.viewInit({
        //         prefab: item,
        //         spacingY: 10,
        //         list: data,
        //         callback: (node, item, index) => {
        //             if (!node.getComponent('CXReviewItem')) return;
        //             item.index = index;
        //             node.getComponent('CXReviewItem').bind(item);
        //         }
        //     });
        // });
    },

    btnClicks(event, param) {

        switch (param) {
            case 'close':
                this.close();
                break;
            case 'next':
                if (this._curRound >= this._totalRounds - 1) {
                    this._curRound = 0;
                } else {
                    this._curRound++;
                }
                this.onListSync(this._reviewList[this._curRound]);
                break;
            case 'ahead':
                if (this._curRound <= 0) {
                    this._curRound = this._totalRounds;
                }
                this._curRound--;
                this.onListSync(this._reviewList[this._curRound]);
                break;
            case 'end':
                this._curRound = this._totalRounds - 1;
                this.onListSync(this._reviewList[this._curRound]);
                break;
            case 'start':
                this._curRound = 0;
                this.onListSync(this._reviewList[this._curRound]);
                break;
        }
    },

    close() {
        if (this.node.getComponent('DialogWidgetCtrl')) {
            this.node.getComponent('DialogWidgetCtrl').out();
        } else {
            this.node.destroy();
        }
    },

});