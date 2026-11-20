const LSEQSModel = require('./LSEQSModel');
const ApiLseqs = require('./ApiLseqs');
const ApiRoom = require('../../../src/api/ApiRoom');
const cardCom = require("./card/LSEQSCard");
const CCUtil = require('../../../src/utils/CCUtil');
const Utils = require('../../../src/utils/Utils');
const LSEQSLogic = require('./LSEQSLogic');



cc.Class({
    extends: cc.Component,

    properties: {
        choseItem: cc.Prefab,
        choseGroup: cc.Node,
        cardContent1: cc.Node,
        light: cc.Node,
        _layer: 1, //摆牌层级，最多2层
        _idx: 0, //当前摆牌索引
        _baiList: null
    },

    init(idx, baiList, layer) {
        this._baiList = baiList || []
        this._idx = idx
        this._layer = layer || 1
        for (let j = 0; j < baiList.length; j++) {
            const cardList = baiList[j];
            let group = cc.instantiate(this.choseGroup)
            group.getComponent(cc.Layout).spacingY = LSEQSModel.LAY_COUNT[cardList.length]
            group.parent = this.cardContent1
            for (let i = 0; i < cardList.length; i++) {
                const cardId = cardList[i];
                let card = cc.instantiate(this.choseItem)
                let com = card.addComponent(cardCom)
                com.init()
                com.flower = cardId
                card.parent = group
            }
            group.name = j + ""
            group.on("click", this.onItemClick, this)
        }
    },

    onItemClick(btn) {
        let j = 0
        if (btn && btn.node) {
            j = parseInt(btn.node.name);
            /**设置选中光位置 */
            let lpos = CCUtil.postionConvert(btn.node, this.node)
            this.light.setPosition(lpos)
            this.light.scale = btn.node.scale
            this.light.active = true
            this.light.height = btn.node.height + 40
            this.light.width = btn.node.width + 40
        }
        if (this._layer == 1) {
            cc.systemEvent.emit(LSEQSModel.MSG_BAI_ITEM_CLICK, this._idx, j)
        } else if (this._layer == 2) {
            cc.systemEvent.emit(LSEQSModel.MSG_BAI_ITEM_CLICK1, this._baiList[j])
        }
    },


    getCardContent() {
        return this.cardContent1
    }

});